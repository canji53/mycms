---
title: "Lambda@EdgeをSAMでデプロイする際はバケットのリージョンにも注意したい"
description: "Lambda@EdgeをSAMでデプロイする際はバケットのリージョンにも注意したい"
category: "aws"
tags: ["lambda-edge", "sam", "s3"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/beaware-region-lambdaedge-by-sam/thumbnail.png"
updatedAt: "2020-09-12"
createdAt: "2020-09-12"
---

Lambda@Edge がサポートされているリージョンは **us-east-1** なので、SAM 等で開発した際は、必ず **us-east-1** にデプロイする必要があります。

ここで注意したいのは、**SAM はデプロイする際にテンプレートが S3 に保存されて**、そのテンプレートを CloudFormation が参照してから Stack が立ち上がることです。

そして、先日、私が Lambda@Edge を SAM でデプロイした際のエラーが、

<br>

```zsh
$ sam deploy -g

Configuring SAM deploy
======================

        Looking for samconfig.toml :  Found
        Reading default arguments  :  Success

        Setting default arguments for 'sam deploy'
        =========================================
        Stack Name []: XXX
        AWS Region []: us-east-1


~略~


XXX  Error occurred while GetObject. S3 Error Code:

PermanentRedirect. S3 Error Message: The bucket is in this

region: ap-northeast-1. Please use this region to retry the

request (Service: AWSLambdaInternal; Status Code: 400;

Error Code: InvalidParameterValueException; Request ID:

xxxx2640-xxxx-46aa-xxxx-01fc09cexxxx; Proxy: null)

ROLLBACK_IN_PROGRESS                                          AWS::CloudFormation::Stack                                    sample-lambda                                The following resource(s) failed to create:

[XXX]. . Rollback requested by user.
DELETE_COMPLETE                                               AWS::Lambda::Function                                         XXX                                 -
DELETE_IN_PROGRESS                                            AWS::IAM::Role                                                XXXRole                             -
ROLLBACK_COMPLETE                                             AWS::CloudFormation::Stack                                    sample-lambda                       -
DELETE_COMPLETE                                               AWS::IAM::Role                                                XXXRole                             -
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Error: Failed to create/update the stack: sample-lambda, Waiter StackCreateComplete failed: Waiter encountered a terminal failure state
```

<br>

本当に初歩的なミスですが、

**us-east-1 へのデプロイなので、us-east-1 内で S3 のテンプレートを取得しようとしているのですが、そのテンプレート ap-northeast-1 にあるよ**と怒られているエラーです。

本当に初歩ですね :sweat:

そのため、必ず us-east-1 で S3 を作成して、そこにテンプレートを保存してから、`sam deploy` する必要があります。

```zsh
$ aws s3 mb --region us-east-1 s3://***
$ aws s3 cp --recursive ./ s3://***
```

### おわりに

ここらへんて、SAM 側が柔軟にリージョン対応してくれると思っていたのですが、何か私のコマンドの使い方や順序が間違っているようにも思えますが、取り敢えず似たようなエラーに遭遇した方の一助になればと思い残しておきます。
