---
title: "[初心者向け] 小さなサーバーをAWSのCloudFormationで構築してみる"
description: "近頃、インフラ設定の再利用性と属人性の最小化を目的にインフラのコード化を強く意識し始めたのですが、今回はAWSの Infarastructure as Code（IaC）サービスの１つである CloudFormation を使って、なるべく簡単にAWSの小さなサーバ環境を構築してみます。"
category: "aws"
tags: ["awscli", "cloudformation"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/easy-aws-on-cloudformation/thumbnail.png"
updatedAt: "2020-10-29"
createdAt: "2020-03-08"
---

## はじめに

AWS を触り初めて数ヶ月近くになるのですが、近頃、**インフラ設定の再利用性と属人性の最小化を目的にインフラのコード化**を強く意識するようになりました。 Docker を利用し初めたことも合間って個人のプロジェクトはほとんどコード管理するようにしています。（個人レベルで意味あるのかはさておきますが、、、）

まぁ、実際の業務では、さっぱり活かされていません、、、（泣）

と言うこともあって**今回は AWS の [Infarastructure as Code（IaC）](https://ja.wikipedia.org/wiki/Infrastructure_as_Code) サービスの１つである [CloudFormation](https://aws.amazon.com/jp/cloudformation/) を使って、なるべく簡単に AWS の小さなサーバ環境を構築してみたい**と思います。

## CloudFormation とは

> AWS CloudFormation では、プログラミング言語またはシンプルなテキストファイルを使用して、あらゆるリージョンとアカウントでアプリケーションに必要とされるすべてのリソースを、自動化された安全な方法でモデル化し、プロビジョニングできます。
> [公式より](https://aws.amazon.com/jp/cloudformation/)

上文ではイメージし辛いかなと思いますが、要するに AWS のコンソールでぽちぽちインフラ構築していたものを、**YAML や JSON にインフラ構成を記述して CloudFormation にアップすることでインフラを自動構築するようなものです。**

インフラがコードなので、バージョン管理できたり、似たようなインフラ構成を簡単にコピーできたり、それ自体が設計図にもなり得ます。

## やりたいコト

- **CloudFormation で 無料枠の t2.micro の EC2 1 台を構築**
- AWS のコンソールをなるべく触れずに、AWS CLI とインフラコードをもってサーバ構築を完了
- 構築した EC2 に SSH 接続

## 対象環境とユーザー

- macOS Catalina バージョン 10.15.3
- AWS 初心者の方（コンソール上で EC2 を立てたことがあるなどなど）
- AWS CLI をローカル環境にインストール済み \*1

\*1：過去に [AWS CLI を仮想環境にインストールする記事](https://www.tolog.info/awscli-on-pipenv/)を書いています。必要に応じて参照いただければです。

## 手順

### **下準備**

#### **AWS CLI をインストール**

前述でも触れましたが、以下の手順では AWS CLI を使って作業を行いますので、インストールをお願いします。私は Python の Pipenv で AWS CLI v1 を Mac にインストールしています。また、2020/02 から [AWS CLI v2 もローンチされ、そちらをインストール](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/install-cliv2.html)しても大丈夫かと思います。

#### **テンプレートをクローン**

僭越ながら今回は [GitHub にテンプレートを用意](https://github.com/canji53/easy_aws_infrastructure_by_cloudformation)しているのでそちらのクローンをお願いします。長いプロジェクト名なので必要に応じてリネームしてください。

```bash
$ git clone git@github.com:canji53/easy_aws_infrastructure_by_cloudformation.git
```

`templates/` 内に 5 つのテンプレートを用意しています。それぞれ、サービスごとにインフラ設定を `ネスト` （入れ子）していて、`main.yml` がそれらの処理を統括する親のテンプレートになります。今回は余計な情報を盛り込みたくなかったのでなるべく最小構成にしています。

```bash
$ cd easy_aws_infrastructure_by_cloudformation

# treeコマンドでディレクトリ構造をチラ見
$ tree templates
templates
├── ec2.yml
├── main.yml
├── sg.yml
└── vpc.yml

0 directories, 4 files
```

### **SSH キーを生成**

構築後の EC2 に SSH 接続するために[ AWS CLI であらかじめキーペアを生成します。](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-services-ec2-keypairs.html)今回は `hogehoge-key` と適当な名前にしていますので、必要に応じてリネームしてください。

```bash
# キーペア生成
# "--output text > ***"でキーをテキストに保存
$ aws ec2 create-key-pair --key-name hogehoge-key --query 'KeyMaterial' --output text > ~/.ssh/hogehoge-key.pem

# キーの存在確認
$ aws ec2 describe-key-pairs --key-name hogehoge-key
{
    "KeyPairs": [
        {
            "KeyPairId": "key-***",
            "KeyFingerprint": "**:**:**:...",
            "KeyName": "hogehoge-key",
            "Tags": []
        }
    ]
}

# 権限変更（しておかないと接続時に弾かれます）
$ chmod 0700 ~/.ssh/hogehoge-key.pem
```

### **テンプレート保存用の S3 バケットを作成**

CloudFormation では、設定を書いた YAML を `テンプレート` と呼び、このテンプレートをローカル環境からアップするのか、それとも S3 の URL から参照するのかを選べます。`ネスト` **されたテンプレートは URL 参照が必須となるため、** 今回は S3 にテンプレートをアップロードするようにします。

また、下記コマンドで `hogehoge-bucket` と言う名前の [S3 バケットを作成](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-services-s3-commands.html)するようにしていますが、**バケット名は適当な名前に変更してください。S3 のバケット名は全 AWS 内で唯一の名前を振る必要があります。** 被ってる場合はエラーが返ってきます。

```bash
# バケット作成
$ aws s3 mb s3://hogehoge-bucket

# バケット確認
$ aws s3 ls | grep "hogehoge-bucket"
20**-**-** 00:00:00 hogehoge-bucket
```

### **テンプレートのパラメータを調整**

クローンしたテンプレートはそのままでは利用できないので、`main.yml` の `Parameters` を調整します。

- `TemplateBucket &gt; Default` を先ほど作成したバケット名に変更
- `ClientCidr &gt; Default` をお使いの端末のグローバル IP に変更
- `KeyName &gt; Default` を先ほど作成したキーペア名に変更

```bash
$ sudo vim templates/main.yml

AWSTemplateFormatVersion: 2010-09-09


Parameters:
  TemplateBucket:
    Type: String
    Default: "hogehoge-bucket"
  ClientCidr:
    Type: String
    Default: "?.?.?.?/?"
  KeyName:
    Type: String
    Default: "hogehoge-key"

~~ 以下略 ~~
```

今回はセキュリティグループで `ClientCidr` で指定したグローバル IP のみから SSH 接続できるようにしています。`0.0.0.0/0` にしても良いですが、そうなった場合 **EC2 のグローバル IP（AWS ではパブリック IP）が知られた場合に不正アクセスされてしまうため、絶対にお使いの端末のグローバル IP を指定してください。**

```bash
# curlでグローバルIPを取得する場合
$ curl ifconfig.io
```

### **テンプレートの構文チェック**

**テンプレートを作成・編集した後は[ AWS CLI を使った構文チェック](https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/using-cfn-validate-template.html)をすることを絶対にオススメします。**
CloudFormation ではテンプレート１枚でまとめられたインフラリソースを `スタック` と呼びます。そして、構文エラーがあると CloudFormation 側でスタック作成する前にエラーが吐かれます。なので、あらかじめ構文チェックをしておくことで手戻りを減らせます。

構文にエラーがなければ、そのテンプレートでスタックされるリソース一覧が返ってきます。エラーがある場合は、行数指定でどこがおかしいか表示されます。

```bash
$ aws cloudformation validate-template --template-url https://s3.amazonaws.com/hogehoge-bucket/main.yml
{
    "Parameters": [
        {
            "ParameterKey": "ClientCidr",
            "DefaultValue": "?.?.?.?/?",
            "NoEcho": false
        },
        {
            "ParameterKey": "KeyName",
            "DefaultValue": "hogehoge-key",
            "NoEcho": false
        },
        {
            "ParameterKey": "TemplateBucket",
            "DefaultValue": "hogehoge-bucket",
            "NoEcho": false
        }
    ],
    "Capabilities": [
        "CAPABILITY_NAMED_IAM",
        "CAPABILITY_AUTO_EXPAND"
    ],
    "CapabilitiesReason": "The following resource(s) require capabilities: [AWS::CloudFormation::Stack]"
}
```

### **テンプレートを S3 バケットに保存**

先ほど作成したバケットに編集したテンプレートを S3 にコピーしていきます。

```bash
# テンプレートをS3にコピー
$ aws s3 cp --recursive templates s3://hogehoge-bucket
upload: templates/vpc.yml to s3://hogehoge-bucket/vpc.yml
upload: templates/ec2.yml to s3://hogehoge-bucket/ec2.yml
upload: templates/main.yml to s3://hogehoge-bucket/main.yml
upload: templates/sg.yml to s3://hogehoge-bucket/sg.yml
```

バケット内のファイルの中身を確認したい場合は下記コマンドになります。

```bash
$ aws s3 cp s3://hogehoge-bucket/main.yml -

AWSTemplateFormatVersion: 2010-09-09


Parameters:
  TemplateBucket:
    Type: String
    Default: "hogehoge-bucket"
  ClientCidr:
    Type: String
    Default: "?.?.?.?/?"
  KeyName:
    Type: String
    Default: "hogehoge-key"

~~ 以下略 ~~
```

### **いざ CloudFormation でスタックを作成（インフラ自動構築）**

AWS CLI を使えば[スタック作成](https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/using-cfn-cli-creating-stack.html)もコマンドで完結できます。

```bash
$ aws cloudformation create-stack --stack-name hogehoge-stack --template-url https://s3.amazonaws.com/hogehoge-bucket/main.yml
{
    "StackId": "arn:aws:cloudformation:ap-northeast-1:******:stack/hogehoge-stack/*******************"
}
```

スタック作成の過程を調べる場合は、

```bash
$ aws cloudformation describe-stacks --stack-name hogehoge-stack --query "Stacks[0].StackStatus"

# 完成している場合
"CREATE_COMPLETE"
```

構築されたスタックのリソースを確認する場合は、

```bash
$ aws cloudformation list-stack-resources --stack-name hogehoge-stack

{
    "StackResourceSummaries": [
        {
            "LogicalResourceId": "EC2",
            "PhysicalResourceId": "arn:aws:cloudformation:ap-northeast-1:***:stack/hogehoge-stack-EC2-***/***",
            "ResourceType": "AWS::CloudFormation::Stack",
            "LastUpdatedTimestamp": "2020-**-**:**:**.***",
            "ResourceStatus": "CREATE_COMPLETE",
            "DriftInformation": {
                "StackResourceDriftStatus": "NOT_CHECKED"
            }
        },
 ~~ 長いので略 ~~
```

### **EC2 に SSH 接続してみる**

まず、構築した EC2 の グローバル IP を調べます。下記コマンドは[こちらのサイト様](http://kitakitabauer.hatenablog.com/entry/2017/09/18/173817)を参考にしています。是非チェックして見てください。インスタンスの一覧が出ると思いますが、今回はタグを何も設定したいないため、その中からおそらく `Name` が `null` のものが今回構築した EC2 になるかと思います。

```bash
$ aws ec2 describe-instances --query 'Reservations[].Instances[].{InstanceId:InstanceId,Name:Tags[?Key==`Name`]|[0].Value,PrivateIp:PrivateIpAddress,PublicIp:PublicIpAddress}'

[
    {
        "InstanceId": "i-****",
        "Name": null,
        "PrivateIp": "**.**.**.**",
        "PublicIp": "**.**.**.**"
    }
~~ 以下略 ~~
```

ではでは、先ほどの `PublicIp` を控えて EC2 に SSH で入ります。

```bash
$ ssh ec2-user@**.**.**.** -i ~/.ssh/hogehoge-key.pem -p 22
```

あとは適当にサーバで遊んで見てください（汗）。

### **作成したスタックを消したい場合は？**

```bash
$ aws cloudformation delete-stack --stack-name hogehoge-stack

# スタックが消えているか確認
# エラーが出ればスタックが消えています
$ aws cloudformation describe-stacks --stack-name hogehoge-stack --query "Stacks[0].StackStatus"

An error occurred (ValidationError) when calling the DescribeStacks operation: Stack with id hogehoge-stack does not exist
```

## おわりに

今回はなるべく小さなサーバを CloudFormation で構築してみました。テンプレートの詳細な構文に関しては触れていませんが、と言うより触れだすと止まりません（汗）。そのため、なんとなくスタック構築の流れと薄い構文を把握してもらえればと思います。

また、実は AWS CLI の構文チェックを行ってもスタックを **構築している途中でエラーが出る時があります。** これが厄介です。スタックが途中まで作成されてロールバックするため、その間に作成されたリソースが消えるのです。 **そうなると、無駄な課金が発生します、、、**

ですので、AWS CLI のみで構文チェックするのではなく、詳細にドキュメントを追いかけながら構成チェックをすることをオススメしますが、これに慣れるまでが大変なんです（泣）

## 参考文献

- [[ Wikipedia ] Infrastructure as Code](https://ja.wikipedia.org/wiki/Infrastructure_as_Code)
- [[ AWS ] CloudFormation](https://aws.amazon.com/jp/cloudformation/)
- [[ AWS ] AWS CLI バージョン 2 のインストール](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/install-cliv2.html)
- [[ AWS ] AWS リソースおよびプロパティタイプのリファレンス](https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html)
- [[ AWS ] Amazon EC2 キーペアの作成、表示、削除](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-services-ec2-keypairs.html)
- [[ AWS ] AWS CLI での高レベル (s3) コマンドの使用](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-services-s3-commands.html)
- [[ AWS ] テンプレートの検証](https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/using-cfn-validate-template.html)
- [[ AWS ] スタックの作成](https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/using-cfn-cli-creating-stack.html)
- [Developers.IO produced by Classmethod](https://dev.classmethod.jp/)
- [AWS EC2 インスタンスの IP アドレスを即座に確認する](http://kitakitabauer.hatenablog.com/entry/2017/09/18/173817)
