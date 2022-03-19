---
title: "AWS SAM CLIでSlack通知のLambdaを簡単に開発・デプロイ"
description: "Lambda から Slack への通知は昔からこすられてるネタですが、わざわざ AWS SAM CLI を使って検証している方は少ないように思います。そこで今回は Slack 通知の Lambda を AWS SAM CLI で簡単に作成してみようと思います。"
category: "aws"
tags: ["awscli", "sam", "slack"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/slacknotify-with-sam/thumbnail.png"
updatedAt: "2020-08-17"
createdAt: "2020-03-24"
---

## はじめに

Lambda から Slack への通知は昔からこすられてるネタですが、わざわざ `AWS SAM CLI` を使って検証している方は少ないように思います。そこで今回は Slack 通知の Lambda を AWS SAM CLI で簡単に作成してみようと思います。

## 対象環境とユーザー

- macOS Catalina
- Slack ユーザー
- Python ユーザー
- **Docker がインストールされている（AWS SAM CLI を使うために必須）**

## 手順

### **AWS CLI のインストール**

私は Python の Pipenv で AWS CLI を管理しています。[過去に記事](https://www.tolog.info/awscli-on-pipenv/)を書いているので必要に応じて参照してもらえればです。

### **AWS SAM CLI をインストール**

pipenv を前提にしていますがご了承ください。Pip でも基本的に変わらないので読み替えてください。

```bash
$ pipenv install aws-sam-cli
$ sam --version
SAM CLI, version 0.45.0  # 2020/03時点
```

### **SAM のプロジェクトを作成**

今回は Hello World の基本的なプロジェクト構成で初期化します。また、Lambda は Python で作成します。下記のハイライトの部分に注意して入力してもらえればです。

```bash
$ sam init

Which template source would you like to use?
        1 - AWS Quick Start Templates
        2 - Custom Template Location
Choice: 1

Which runtime would you like to use?
        1 - nodejs12.x
        2 - python3.8
        3 - ruby2.7
        4 - go1.x
        5 - java11
        6 - dotnetcore2.1
        7 - nodejs10.x
        8 - python3.7
        9 - python3.6
        10 - python2.7
        11 - ruby2.5
        12 - java8
        13 - dotnetcore2.0
        14 - dotnetcore1.0
Runtime: 2

Project name [sam-app]: sample

Cloning app templates from https://github.com/awslabs/aws-sam-cli-app-templates.git

AWS quick start application templates:
        1 - Hello World Example
        2 - EventBridge Hello World
        3 - EventBridge App from scratch (100+ Event Schemas)
Template selection: 1

-----------------------
Generating application:
-----------------------
Name: sample
Runtime: python3.8
Dependency Manager: pip
Application Template: hello-world
Output Directory: .

Next steps can be found in the README file at ./sample/README.md
```

### **Slack API で Incomming Webhooks を作成**

私がだらだら説明するより[公式の手順](https://slack.com/intl/ja-jp/help/articles/115005265063-Slack-%E3%81%A7%E3%81%AE-Incoming-Webhook-%E3%81%AE%E5%88%A9%E7%94%A8)を見てもらえればです。ただし、注意していただきたいのは `OAuth &amp; Permissions` で `chat:message` API を作成するのではなく、今回は `Incomming Webhooks` で Slack に通知することを対象としています。ここら辺は[こちらの記事](https://qiita.com/kshibata101/items/0e13c420080a993c5d16)が大変参考になるので、是非ご一読ください。

### **AWS SAM で作成された template.yaml を編集**

初期状態の template.yaml をそのままデプロイしてしまうと API Gateway などの不要なリソースが作成されてしまうので下記のように編集してもらえればです。コメントや api を作成する event を削除して、`CodeUri` を `Sample/` に変更しています。

```yaml
AWSTemplateFormatVersion: "2010-09-09"

Transform: AWS::Serverless-2016-10-31

Description: >
  sample

  SAM Template for SlackNotification
Globals:
  Function:
    Timeout: 3

Resources:
  SampleFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: Sample/
      Handler: app.lambda_handler
      Runtime: python3.8

Outputs:
  SampleFunctionId:
    Description: "Sample Lambda Function Logical Id"
    Value: !Ref SampleFunction
```

また、 template.yaml に添うようにプロジェクト内の `hello_world/` ディレクトリを `Sample/` に変更してください。

```bash
$ cd sample
$ mv hello_world Sample
```

### **Slack 通知用の Lambda を作成**

今回は requests ライブラリは使わず標準ライブラリの urllib を使っています。`WEBHOOK_URL` は先ほど作成した Incomming Webhooks を設定してください。

```python
import json
import urllib.request


WEBHOOK_URL = "https://hooks.slack.com/services/***/***/******"

def lambda_handler(event, context):

    try:

        send_data = {
            "text": "test",
        }

        send_text = "payload=" + json.dumps(send_data)

        request = urllib.request.Request(
            WEBHOOK_URL,
            data=send_text.encode('utf-8'),
            method="POST"
        )

        with urllib.request.urlopen(request) as response:
            response_body = response.read().decode('utf-8')

    except requests.RequestException as e:

        print(e)
        raise e
```

### **SAM を Build して試しに通知テスト**

ソースや template.yaml を編集した場合は、`sam build` を必ずするようにして下さい。基本的なことですが、編集が反映されず何故か動かないみたいな初歩的なことを防げます（泣）。`sam local invoke` でローカル環境から Slack に通知するテストが行えます。（内部的には AWS 環境をコンテナ起動して、コンテナ上で用意したリソースを展開しているようです）

```bash
$ sam build

# ローカル環境でテストしたい場合
$ sam local invoke
```

### **SAM をデプロイして本番環境で通知テスト**

ローカルで Slack に通知できた場合は、SAM を AWS にデプロイします。初期のデプロイ時は `-g` を引数として与えます。下記でハイライトした部分を必要に応じた項目を入力して下さい、基本的には `Stack Name` を適当なものに変更すればそのままで良いと思います。

```bash
$ sam deploy -g

Configuring SAM deploy
======================

        Looking for samconfig.toml :  Not found

        Setting default arguments for 'sam deploy'
        =========================================
        Stack Name [sam-app]: sample
        AWS Region [us-east-1]: ap-northeast-1
        #Shows you resources changes to be deployed and require a 'Y' to initiate deploy
        Confirm changes before deploy [y/N]: N
        #SAM needs permission to be able to create roles to connect to the resources in your template
        Allow SAM CLI IAM role creation [Y/n]: Y
        Save arguments to samconfig.toml [Y/n]: Y

        Looking for resources needed for deployment: Found!

                Managed S3 bucket: aws-sam-cli-managed-default-samclisourcebucket-e5okhc6znmgs
                A different default S3 bucket can be set in samconfig.toml

~~以下略~~
```

デプロイ後に、コンソールから Lambda の管理画面に移動してテスト通知して見てください。

## 参考文献

- [AWSCLIv1 を Pipenv で管理したい](https://www.tolog.info/awscli-on-pipenv/)
- [[ Slack 公式 ] Slack での Incoming Webhook の利用](https://slack.com/intl/ja-jp/help/articles/115005265063-Slack-%E3%81%A7%E3%81%AE-Incoming-Webhook-%E3%81%AE%E5%88%A9%E7%94%A8)
- [[ Qiita ] slack の Incoming webhook が新しくなっていたのでまとめてみた](https://qiita.com/kshibata101/items/0e13c420080a993c5d16)
- [[ Qiita ] AWS Lambda で作る Slack bot (Incoming Webhook)](https://qiita.com/yokoc1322/items/553ad147b82277b2beca)
- [[ Qiita ] AWS SAM CLI 再入門 2019.12](https://qiita.com/hayao_k/items/7827c3778a23c514e196)
