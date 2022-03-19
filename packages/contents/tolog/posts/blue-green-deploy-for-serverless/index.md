---
title: "API GatewayとLambdaのBlueGreenデプロイをGitHub Actionsでやってみる"
description: "今回は仕事でもプライベートでもお世話になっている API Gateway + Lambda + GitHub Actions での私的ブルーグリーンデプロイを考えてみました。"
category: "aws"
tags: ["api-gateway", "lambda", "github-actions"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/blue-green-deploy-for-serverless/thumbnail.png"
updatedAt: "2021-09-12"
createdAt: "2021-09-12"
---

### はじめに

現状のプロダクトでは Production 環境にデプロイされた後にさらに動作確認をしています。Staging 環境の QA で追加・既存機能のアプリケーションの動作を確認していますが、それは Staging 環境での担保であって、インフラリソースが異なる Production 環境では担保されていないと考えています。そのため、デプロイ後の Production でも動作を確認している格好です。

では何が問題なのか？
私は問題の一つに、Production と Staging でのインフラリソースの差異が上げられると考えています。

- Production に必要なインフラリソースがそもそも無い
- アプリケーションに必要な環境変数が足りない・間違っている
- etc...

上記の問題はインフラリソースを漏れなく管理できているかが焦点になっていますが、人間なのでどうしてもプロビジョニングをし忘れたり、設定をミスしたりします。
これを 0 にするのは、コストが高いと考えています。

ではどうするのか？
Production に近いインフラで動作を確認して、ユーザーに影響が出る前にコケさせたい :sweat_drops:

私的には、**ブルーグリーンデプロイ戦略**が良さそうだなと考えています。
実際に稼働している環境をグリーン、その複製をブルーとして、ブルー環境でテストして良好であればグリーンに切り替えるような方法です。

- Production（Green）と同じインフラ構成でテストできる
- Blue、Green をスイッチするだけで本番適用が可能でダウンタイムが少ない
- etc..

前置き長くなりましたが、
今回は仕事でもプライベートでもお世話になっている **API Gateway + Lambda + GitHub Actions での私的ブルーグリーンデプロイ** を考えてみました。
実際に運用しているわけではなく、これならイケそうだな、の一例に過ぎません :pray:

※ 今回 DB はスコープ外にしています。DB 複製の有無に応じて、デプロイ戦略だけではなく、アプリケーション（主にマイグレーションまわり）の設計・実装にまで話が及ぶためです。

[サンプルリポジトリ](https://github.com/canji53/blue-green-deploy-for-serverless)を用意しています。
合わせて確認いただければです。

### API Gateway と Lambda におけるブルーグリーンの切り替え

以下では、CLI コマンドと CDK を駆使した API Gatway と Lambda におけるブルーグリーンの設定について簡単に説明しています。
コンソールでの設定はこちらの[記事](https://dev.classmethod.jp/articles/version-management-with-api-gateway-and-lambda/)が大変参考になるかと思います。

#### Lambda のバージョン

Lambda には、[バージョン](https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/configuration-versions.html)という仕組みがあります。
新しく Lambda のソースもしくは Image を更新した際に、バージョンを発行することで、その時点の Lambda をスナップすることができます。
`latest`というバージョンは、その時点の Lambda の最新状態を常に指しているバージョンになります。
そして、`latest`に対してバージョンを発行することで、その時点の最新状態をナンバリング（1, 2, 3...）という形でスナップできます。

#### Lambda のエイリアス

Lambda には、[エイリアス](https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/configuration-aliases.html)という仕組みがあります。

> Lambda のエイリアスは関数の特定のバージョンに対するポインタのようなものです。

公式が説明するように特定のバージョンに対するアクセスポイントを作成でき、ARN を介することで他サービスから Lambda にアクセスできるようになります。

#### バージョンとエイリアスからブルーグリーンを切り替え

バージョン発行で Lambda のデプロイスナップを取りつつ、各バージョンに対してエイリアスを設定することで、`blue` のエイリアスは最新の Lambda が適用されている、`green`のエイリアスは現在 production で稼働している（動作保証済み） Lambda が適用されているという構成ができます。

以下にブルーグリーンの流れを簡単に示します。

① デプロイ前

| エイリアス | バージョン | アプリケーションの新旧 |
| ---------- | ---------- | ---------------------- |
| blue       | latest     | 新                     |
| green      | 1          | 新                     |

② `blue`にのみ最新アプリケーションをデプロイ

`latest`バージョンを`blue`にエイリアスしておけば、Lambda をデプロイすることで自動的に`blue`に最新のアプリケーションがあたります。

```bash
# Lambdaの更新コマンド
# https://awscli.amazonaws.com/v2/documentation/api/latest/reference/lambda/update-function-code.html
aws lambda update-function-code \
    --function-name ${function-name} \
    --image-uri $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
```

| エイリアス | バージョン | アプリケーションの新旧     |
| ---------- | ---------- | -------------------------- |
| blue       | latest     | 新                         |
| green      | 1          | 旧（ユーザー向けに稼働中） |

③ `blue`で動作保証が取れたのでバージョンを発行、更新バージョンを`green`にエイリアス

```bash
# AWS CLI　のバージョン発行コマンド
# https://awscli.amazonaws.com/v2/documentation/api/latest/reference/lambda/publish-version.html
aws lambda publish-version --function-name ${function-name}
# -> version 2 が発行される

# AWS CLI のエイリアス更新コマンド
# https://awscli.amazonaws.com/v2/documentation/api/latest/reference/lambda/update-alias.html
aws lambda update-alias \
    --function-name ${function-name} \
    --function-version 2 \
    --name green
```

| エイリアス | バージョン | アプリケーションの新旧 |
| ---------- | ---------- | ---------------------- |
| blue       | latest     | 新                     |
| green      | 2          | 新                     |

#### API Gateway のステージとステージ変数

API Gateway には、[ステージ](https://docs.aws.amazon.com/ja_jp/apigateway/latest/developerguide/set-up-stages.html)という仕組みがあります。

> ステージは、デプロイに対する名前付きのリファレンスで、API のスナップショットです。

`blue`、`green` のステージを用意して、それぞれのエンドポイントに役割を持たせます。
しかし、両ステージに Lambda を紐づけても`latest`バージョンが呼び出されてブルーグリーンの切り替えができないため、ステージごとに呼び出す Lambda のエイリアスを変える必要があります。
`blue` ステージは Lambda の `blue` エイリアスを、`green` ステージは `green` エイリアスを呼び出すようにします。

そこで、必要なのがステージごとに変数を用意できる[ステージ変数](https://docs.aws.amazon.com/ja_jp/apigateway/latest/developerguide/amazon-api-gateway-using-stage-variables.html)という機能です。
ステージ変数でエイリアス名を指定することで、対象の Lambda のエイリアスを呼び出すことができるようになります。
詳しくは[公式](https://docs.aws.amazon.com/ja_jp/apigateway/latest/developerguide/amazon-api-gateway-using-stage-variables.html#call-api-lambda-backend-with-stage-variable)も参照してください。

以下は CDK でエイリアス Lambda を呼び出す API Gateway のスタック例になります。
Lambda の ARN に `:${stageVariables.alias}` を追加することで、エイリアス付きで呼び出されるようになります。
`apigateway.LambdaIntegration` では、ステージ変数を組み込めなかったため、こちらの [Issue](https://github.com/aws/aws-cdk/issues/6143#issuecomment-796408877) を参考に `apigateway.AwsIntegration` で統合しています。

```typescript
const lambdaAlias = lambda.Function.fromFunctionArn(
  this,
  "sample-lambda-alias",
  `${lambdaFunction.functionArn}:\${stageVariables.alias}` // ここがポイント
);

const defaultIntegration = new apigateway.AwsIntegration({
  proxy: true,
  service: "lambda",
  path: `2015-03-31/functions/${lambdaAlias.functionArn}/invocations`,
});

this.restApi = new apigateway.RestApi(this, id, {
  restApiName,
  endpointTypes: [apigateway.EndpointType.REGIONAL],
  defaultIntegration,
});
```

[API Gateway Stage](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-apigateway.Stage.html) のスタック例は以下になります。
`stageName`をそのまま alias に指定しています。

```typescript
new apigateway.Stage(this, id, {
  deployment,
  stageName,
  variables: {
    alias: stageName,
  },
});
```

また、API Gateway からエイリアス Lambda を呼び出すには、**Lambda 側のリソースベースポリシー**で API Gateway の指定のステージに対して `invoke` する権限を与える必要があります。

```typescript
new lambda.CfnPermission(this, "invoke-root-function", {
  action: "lambda:InvokeFunction",
  functionName: `${functionName}:${stageName}`,
  principal: "apigateway.amazonaws.com",
  sourceArn: `arn:aws:execute-api:${region}:${account}:${restApiId}/${stageName}/*/`,
});
```

各ステージ変数で、`alias` をキーとして `blue`・`green` の値を設定して、上述のスタックをプロビジョニングすることで、`blue` ステージは `blue` エイリアスを、`green` ステージは `green` エイリアスを呼び出せるようになります。

### デプロイフロー

ブルーグリーンデプロイの全体の流れはこちらの[ワークフロー](https://github.com/canji53/blue-green-deploy-for-serverless/blob/master/.github/workflows/blue-green-deploy.yml)になります。
以下ではポイントを抑えて説明します。

#### 1. ソースを Container Image ビルド、Lambda にデプロイ

```yaml
- name: Login to Amazon ECR
  id: login-ecr
  uses: aws-actions/amazon-ecr-login@v1

- name: Build and push image to Amazon ECR, Deploy the new image to Lambda
  run: |
    ECR_REGISTRY=${{ steps.login-ecr.outputs.registry }}
    ECR_REPOSITORY=bgd
    IMAGE_TAG=${{ github.sha }}

    # ビルドしたImageをECRにプッシュ
    docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
    docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

    # ImageをLambdaにデプロイ
    # ここでlatestバージョンに最新のアプリケーションがあたり、latestのエイリアスであるGreenも最新になります
    aws lambda update-function-code \
      --function-name bgd \
      --image-uri $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

    # Lambdaの更新が完了するまで待機
    # Lambdaが更新状態であると、後続StepのLambda向けのコマンドが失敗してしまうため、明示的に完了するまで待機しています
    aws lambda wait function-updated --function-name bgd
```

#### 2. API Gateway に "blue" ステージを作成

API Gateway の `blue` ステージはエンドポイントがそのまま露出してしまうため、今回はデプロイの度に作成、不要になったら削除をするようにしています。

```yaml
- name: Deploy(=Create) the "blue" stage to API Gateway
  run: |
    # CDKをもとに "blue" ステージを作成
    yarn cdk deploy bgd-apigateway-blue-stage \
      --require-approval never \
      --exclusively

    # CLIから対象のAPI GatewayのAPI IDを取得
    REST_API_ID=$(aws apigateway get-rest-apis | jq -r '.items[] | select(.name == "bgd") | .id')
    echo "REST_API_ID=${REST_API_ID}" >> $GITHUB_ENV

    # "blue"ステージのデプロイメントを更新（デプロイメントを更新しないとAPI Gateway自体の更新が反映されないため）
    aws apigateway create-deployment \
      --rest-api-id $REST_API_ID \
      --stage-name blue \
      --description "For blue stage deployment by CICD"
```

#### 3. "blue" ステージに対してテスト

ここは適当に書いています。
効果的なテストをまだ想定できていないですが、`blue` エンドポイントに対して網羅的なテストを用意することが考えられます。

```yaml
- name: Test
  run: |
    echo success
```

#### 4. Lambda の新しいバージョンを発行、新バージョンを "green" にエイリアス

発行した新バージョンを "green" にエイリアスすることで、実際のユーザーに向けて新アプリケーションが提供されます。

```yaml
- name: Publish new version of Lambda, Update "green" alias to new version
  run: |
    # Lambdaの新しいバージョンを発行
    aws lambda publish-version --function-name bgd >> response.json

    # 発行されたバージョンのナンバリングを取得
    JSON=`cat response.json`
    LAMBDA_NEW_VERSION=$(echo $JSON | jq -r '.Version')

    # 発行バージョンを"green"にエイリアス
    aws lambda update-alias \
      --function-name bgd \
      --function-version $LAMBDA_NEW_VERSION \
      --name green

    # "green"ステージのデプロイメントを更新（デプロイメントを更新しないとAPI Gatewayの更新が反映されないため）
    aws apigateway create-deployment \
      --rest-api-id ${REST_API_ID} \
      --stage-name green \
      --description "For green stage deployment by CICD"
```

#### 5. (option) "blue" ステージを削除

旧バージョンへのスイッチングは、Lambda のバージョン及び API Gateway のデプロイメントで可能なため、今回はエンドポイントとして露出する "blue" ステージは削除します。

```yaml
- name: Destroy the "blue" stage to API Gateway
  run: |
    yarn cdk destroy bgd-apigateway-blue-stage --force
```

### おわりに

ここまでダラダラと書きましたが、やっていて感じたこととして Lambda と API Gateway の設定について詳しくなる必要があり、ナレッジ共有のコストが比較的高いなと感じています。
また、DB 周りのブルーグリーン問題は、アプリケーションの全体設計にも影響するため、考えることが爆発しそうだなとも感じています。
それなら、ビジネス側ともユーザ規約でも合意を取った上で、メンテナンスモードを用意して、安全なデプロイを計画した方がトータルコストは低いのかもしれないと考えています :sweat_drops:
