---
title: "CodePipelineの状態をCodeStar Notificationsで通知"
description: "CodePipeline で CI/CD を組んでいると各ステージの進捗状況や結果を CloudWatch と SNS を使って Slack 等に通知されている方もいるかと思いますが、これを CodeStar Notifications と言うサービスの通知機能を使えば簡単に代替することができます。今回は CodeStar Notifications + SNS + Lambda を使って CodePipeline の状態通知を Slack に送信する仕組みを作ってみます。"
category: "aws"
tags: ["code-pipeline", "code-star", "lambda"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/pipeline-state-codestar-notification/thumbnail.png"
updatedAt: "2020-08-17"
createdAt: "2020-03-26"
---

## はじめに

CodePipeline で CI/CD を組んでいると各ステージの進捗状況や結果を CloudWatch と SNS を使って Slack 等に通知されている方もいるかと思いますが、これを `CodeStar Notifications` と言うサービスの通知機能を使えば簡単に代替することができます。

CloudWatch は イベント 100 万件あたり 1.00USD 掛かりますが、**Notifications は無料になります。**

まぁ、個人利用で 100 万イベントなんて私にはあり得ないので、イベントだろうが Notifications だろうが関係ありませんが。

**今回は CodeStar Notifications + SNS + Lambda を使って CodePipeline の状態通知を Slack に送信する仕組みを作ってみます。**

## イメージ

今までは CloudWatch Events だったところが CodeStar Notifications に変わっています。

![image_codepipeline_state_notification_mini](https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/pipeline-state-codestar-notification/image_codepipeline_state_notification_mini.png)

## 手順

### **Notifications と SNS を CloudFormation で作成**

#### **CodeStar Notifications**

Code 兄弟（Commit、Build、Deploy、 Pipeline）のイベント通知ルールを作成する CloudFormation 例が下記になります。各 Code 兄弟の通知イベントは EventTypeIds から指定できます。各イベントの一覧は[こちらの公式から](https://docs.aws.amazon.com/codestar-notifications/latest/userguide/concepts.html#events-ref-pipeline)確認できます。今回は CodePipeline の各ステージの実行イベントを通知しています。

- `Resource` で対象となる Code 兄弟の ARN を指定
- `EventTypeIds` で通知したいイベントを指定
- `Targets` で Publish する SNS の ARN を指定

```yaml
NotificationRule:
  Type: AWS::CodeStarNotifications::NotificationRule
  Properties:
    Name: sample-codepipeline-notification-rule
    Resource: !Sub arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:SamplePipelineName
    DetailType: FULL
    EventTypeIds:
      - codepipeline-pipeline-stage-execution-started
      - codepipeline-pipeline-stage-execution-succeeded
      - codepipeline-pipeline-stage-execution-resumed
      - codepipeline-pipeline-stage-execution-canceled
      - codepipeline-pipeline-stage-execution-failed
    Targets:
      - TargetType: SNS
        TargetAddress: !Ref SNSTopic
```

また、地味にハマるのが `TargetType` の書き方でした。公式の YAML の例が下記になるのですが、`SNS,` と " , " 区切りで SNS のトピックを指定していますが、" , " があると問答無用で CloudFormation のデプロイが止まりました。CloudFormation あるあるでエラー内容がよく分からないためハマりましたが、", " を消すことでエラーが除かれました。

```yaml
Targets:
  - TargetType: SNS,
    TargetAddress: 'Fn::Sub': 'arn:aws:sns:us-east-2:123456789012:MyNotificationTopic'
```

#### **SNS Topic Policy**

[CodeStar Notifications が SNS トピックを発行できる](https://docs.aws.amazon.com/codestar-notifications/latest/userguide/set-up-sns.html)ように `codestar-notifications.amazonaws.com` を `Principal` に追加して上げます。

```yaml
SNSTopicPolicy:
  Type: AWS::SNS::TopicPolicy
  Properties:
    Topics:
      - !Ref SNSTopic
    PolicyDocument:
    Id: !Ref SNSTopic
    Version: 2008-10-17
    Statement:
      - Sid: "__default_statement_ID"
        Effect: Allow
        Principal:
          AWS: "*"
        Action:
          - SNS:GetTopicAttributes
          - SNS:SetTopicAttributes
          - SNS:AddPermission
          - SNS:RemovePermission
          - SNS:DeleteTopic
          - SNS:Subscribe
          - SNS:ListSubscriptionsByTopic
          - SNS:Publish
          - SNS:Receive
        Resource: !Ref SNSTopic
        Condition:
          StringEquals:
            AWS:SourceOwner: !Ref AWS::AccountId
      - Sid: "AWSCodeStarNotifications_publish"
        Effect: Allow
        Principal:
          Service:
            - codestar-notifications.amazonaws.com
        Action: SNS:Publish
        Resource: !Ref SNSTopic
```

#### **CloudFormation 全体**

あくまでサンプル程度です。Lambda や CodePipeline の ARN を指定する必要があるので注意下さい。

```yaml
AWSTemplateFormatVersion: 2010-09-09

Parameters:
  SamplePipelineName:
    Type: String
    Default: "SamplePipeline"
  LambdaArn:
    Type: String

Resources:
  NotificationRule:
    Type: AWS::CodeStarNotifications::NotificationRule
    Properties:
      Name: sample-codepipeline-notification-rule
      Resource: !Sub arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:${SamplePipelineName}
      DetailType: FULL
      EventTypeIds:
        - codepipeline-pipeline-stage-execution-started
        - codepipeline-pipeline-stage-execution-succeeded
        - codepipeline-pipeline-stage-execution-resumed
        - codepipeline-pipeline-stage-execution-canceled
        - codepipeline-pipeline-stage-execution-failed
      Targets:
        - TargetType: SNS
          TargetAddress: !Ref SNSTopic

  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: sample-sns-topic
      Subscription:
        - Endpoint: !Ref LambdaArn
          Protocol: lambda

  SNSTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref SNSTopic
      PolicyDocument:
        Id: !Ref SNSTopic
        Version: 2008-10-17
        Statement:
          - Sid: "__default_statement_ID"
            Effect: Allow
            Principal:
              AWS: "*"
            Action:
              - SNS:GetTopicAttributes
              - SNS:SetTopicAttributes
              - SNS:AddPermission
              - SNS:RemovePermission
              - SNS:DeleteTopic
              - SNS:Subscribe
              - SNS:ListSubscriptionsByTopic
              - SNS:Publish
              - SNS:Receive
            Resource: !Ref SNSTopic
            Condition:
              StringEquals:
                AWS:SourceOwner: !Ref AWS::AccountId
          - Sid: "AWSCodeStarNotifications_publish"
            Effect: Allow
            Principal:
              Service:
                - codestar-notifications.amazonaws.com
            Action: SNS:Publish
            Resource: !Ref SNSTopic
```

### **Slack 通知用の Lambda**

Slack API の Incoming Webhooks を使って Python で通知する Lambda になります。通知内容を分かりやすくするためステージの状態に応じて色や emoji を変更しています。

```yaml
import json
import urllib.request

WEBHOOK_URL = "https://hooks.slack.com/services/***/***/******"


def lambda_handler(event, context):

    try:

        message = trim_event_message(event)

        state_color = get_stage_state_color(message["detail"]["state"])
        state_emoji = get_stage_state_emoji(message["detail"]["state"])

        tldr_message = f'@channel\n *{message["detail"]["stage"]}* stage is *{message["detail"]["state"]}*.  {state_emoji}'

        blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": tldr_message
                },
            },
        ]

        attachments = [
            {
                "color": state_color,
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": message["detailType"]
                        },
                    },
                    {
                        "type": "section",
                        "fields": [
                            {
                                "type": "mrkdwn",
                                "text": message["time"]
                            },
                            {
                                "type": "mrkdwn",
                                "text": message["region"]
                            },
                        ],
                    },
                ],
            }
        ]

        send_data = {
            "text": tldr_message,
            "blocks": blocks,
            "attachments": attachments
        }

        send_text = "payload=" + json.dumps(send_data)

        request = urllib.request.Request(
            WEBHOOK_URL,
            data=send_text.encode('utf-8'),
            method="POST"
        )

        with urllib.request.urlopen(request) as response:
            response_body = response.read().decode('utf-8')

    except Exception as e:

         print(e)
         raise e


    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "success",
        }),
    }


def trim_event_message(event):

    # eventにNoneが含まれる可能性あり、
    # そのため一旦全てをstringに変換
    # そして、dictに再変換
    event_dict = json.loads(json.dumps(event))

    sns_message = event_dict["Records"][0]["Sns"]["Message"]

    return json.loads(sns_message)


def get_stage_state_color(state):

    if state == "CANCELED":
        # yellow
        return "#DAA038"

    if state == "FAILED":
        # red
        return "#CF0100"

    if state == "STARTED":
        # blue
        return "#439FE0"

    if state == "SUCCEEDED":
        # green
        return "#34A64F"

    if state == "RESUMED":
        # grey
        return ""

def get_stage_state_emoji(state):

    if state == "CANCELED":
        return ":double_vertical_bar:"

    if state == "FAILED":
        return ":ng:"

    if state == "STARTED":
        return ":arrow_forward:"

    if state == "SUCCEEDED":
        return ":ok:"

    if state == "RESUMED":
        return ":repeat_one:"
```

### **通知結果**

もろもろをデプロイすると下記のような結果が Slack に返ってくると思います。工夫する点は多々あると思いますが、個人利用であればこれで十分かなと思います。

![image_pipeline_state_notified_slack](https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/pipeline-state-codestar-notification/image_pipeline_state_notified_slack.jpg)

## おわりに

あると便利なこれらの通知を作りまくってると意外に費用が掛かったりするので、今回は無料の Notifications を使ってみました。

前々から思ってましたが Slack って便利ですね。

API も用意されていて、AWS Chat と連携すれば本当に簡単にですが Slack 上で管理画面が作れるのではと思ったり思わなかったり、ちょとした夢が膨らんでいます。

## 参考文献

- [[ AWS 公式 ] Events for Notification Rules on Pipelines](https://docs.aws.amazon.com/codestar-notifications/latest/userguide/concepts.html#events-ref-pipeline)
- [[ AWS 公式 ] Configure Amazon SNS Topics for Notifications](https://docs.aws.amazon.com/codestar-notifications/latest/userguide/set-up-sns.html)
