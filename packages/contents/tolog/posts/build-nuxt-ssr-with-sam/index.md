---
title: "SAMとGitHubActionsでNuxtをSSR構成で構築したい"
description: "Serverless Framework (sls) で API Gateway + Lambda で SSR を構築する文献は多いのですが、SAM や CloudFormation に慣れている身としてはどうも sls は取っつきづらくインフラコードが SAM で完結すると嬉しい。ということで SAM で SSR するコードを考えてみた。"
category: "aws"
tags: ["sam", "github-actions", "ssr", "nuxt"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/build-nuxt-ssr-with-sam/thumbnail.png"
updatedAt: "2020-10-19"
createdAt: "2020-10-19"
---

## はじめに

先日、個人開発で「[ローカりんぐ](https://www.localing.ml)」という全国のローカルメディアの良質なコンテンツを収集して、一覧化するサイトを作りました。

その際、やってみたいという理由で SSR を選択。
コストも抑えたかったので関数単位で課金が発生する API Gateway + Lambda で Nuxt.js を SSR することにしました。

Nuxt.js を Lambda で SSR する文献は多くあるのですが、そのほとんどが Serverless Framework (sls) を用いたものです。
ところが、SAM や CloudFormation に戯れてきた身としてはどうも sls は取っつきづらく、インフラコードが SAM、CloudFormation、sls に分散するのは避けたいものがあります。
と言いつつも、Node.js で書かれている sls は、同じく js で書かれている Nuxt.js と相性が良く、コードも簡潔に書けるので慣れるとグッと効率が上がりそうだなとも思っています :+1:

**そんなこんなで、今回は SAM で Nuxt.js を SSR するコードを書いてみたので残しておきたいと思います。**

※ 個人的な感想ですがピーキーな構成なので、通常は Fargate 等で SSR した方が無難だなと思っています :sweat:

## TL; DR

[nuxt-ssr-with-sam](https://github.com/canji53/nuxt-ssr-with-sam)で GitHub に開発環境一式を置いています。

## 開発環境

```bash
$ sw_vers
ProductName:    Mac OS X
ProductVersion: 10.15.7
BuildVersion:   19H2

$ node --version
v12.16.0

$ docker --version
Docker version 19.03.13, build 4484c46d9d

$ aws --version
aws-cli/1.18.39 Python/3.7.4 Darwin/19.6.0 botocore/1.17.63

$ sam --version
SAM CLI, version 1.4.0
```

## 前提条件

- Route 53 や ACM は、インフラコード化していないので、予めドメインや証明書周りはご自身でリソースを設定する必要あり。簡単に検証をするだけなら、無料ドメインの [freenom](https://www.freenom.com/ja/index.html) 等がおすすめです。
- **証明書の識別子**は、template.yml のパラメータに設定する必要があるため、メモしておく。
- **あくまでも個人開発で利用しているインフラ構成なので、一切の動作保証も、損害も受け入れられないので、自己責任でお願いします** :bow:

## 構成とフロー

- SSR x Serverless x AWS
- API Gateway + Lambda 環境で Express のミドルウェアとして Nuxt.js をレンダリング
- S3 に静的なアセット（画像や.js など）を押し込めて高速化を図る、ただし直アクセスは禁止したいため Origin Access Identity (OAI) を構成
- SAM でインフラコードを閉じ込めて、GitHub Actions で CICD を構成することで、インフラとアプリケーションのコードを一元管理化
- Route 53 や ACM はコード管理するのは怖いため、コンソール画面で設定することにしています

![構成図](https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/build-nuxt-ssr-with-sam/diagram.png)

## コード (主要なファイルのみ)

```bash
# ディレクトリ構成
$ tree . -L 1
.
├── README.md
├── node_modules
├── nuxt-app
├── nuxt.config.js
├── package-lock.json
├── package.json
├── render
└── template.yml

3 directories, 5 files
```

### template.yml

- node_modules を閉じ込めるために Lambda Layer を利用
- CloudFront の Behoviors は、古い書き方になっています。何故か新しい書き方ではデプロイできず :confused:

```yaml
AWSTemplateFormatVersion: 2010-09-09
Transform: AWS::Serverless-2016-10-31

Description: >
  Server Side Rendering and Build static Hosting.

Parameters:
  ServiceName:
    Type: String
    Default: hogehoge
  Environment:
    Type: String
    Default: prod
  SubDomain:
    Type: String
    Default: www
  NakedDomain:
    Type: String
    Default: hogehoge.com
  CFSSLCertificateId:
    Type: String
    NoEcho: true

Globals:
  Function:
    Runtime: nodejs12.x
    Environment:
      Variables:
        ENVIRONMENT: !Ref Environment

Resources:
  ServerlessApi:
    Type: AWS::Serverless::Api
    Properties:
      Name: !Sub ${ServiceName}-${Environment}-ssr
      StageName: !Ref Environment
      OpenApiVersion: 3.0.2
      BinaryMediaTypes:
        - "*/*"

  RenderLambdaLayer:
    Type: AWS::Serverless::LayerVersion
    Properties:
      LayerName: !Sub ${ServiceName}-${Environment}-render
      ContentUri: .layer/render
      CompatibleRuntimes:
        - nodejs12.x
      RetentionPolicy: Delete

  NuxtLambdaLayer:
    Type: AWS::Serverless::LayerVersion
    Properties:
      LayerName: !Sub ${ServiceName}-${Environment}-nuxt
      ContentUri: .layer/nuxt
      CompatibleRuntimes:
        - nodejs12.x
      RetentionPolicy: Delete

  RenderFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub ${ServiceName}-${Environment}-ssr-nuxt
      CodeUri: render/
      Handler: app.lambdaHandler
      Layers:
        - !Ref RenderLambdaLayer
        - !Ref NuxtLambdaLayer
      Timeout: 30
      MemorySize: 256
      Events:
        RenderEvent:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /
            Method: GET
        RenderProxyEvent:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /{proxy+}
            Method: GET

  StaticAssetsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub ${ServiceName}-${Environment}-static-assets
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
        BlockPublicPolicy: false
        IgnorePublicAcls: false
        RestrictPublicBuckets: true

  StaticAssetsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref StaticAssetsBucket
      PolicyDocument:
        Statement:
          - Effect: Allow
            Action:
              - s3:GetObject
              - s3:ListBucket
            Resource:
              - !Sub arn:aws:s3:::${StaticAssetsBucket}/*
              - !Sub arn:aws:s3:::${StaticAssetsBucket}
            Principal:
              CanonicalUser: !GetAtt CloudFrontOriginAccessIdentity.S3CanonicalUserId

  CloudFrontOriginAccessIdentity:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub access-identity-${StaticAssetsBucket}

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        # Generail - Distribution Settings
        PriceClass: PriceClass_All
        Aliases:
          - !Sub ${SubDomain}.${NakedDomain}
        ViewerCertificate:
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2019
          AcmCertificateArn: !Sub arn:aws:acm:us-east-1:${AWS::AccountId}:certificate/${CFSSLCertificateId}
        HttpVersion: http2
        Enabled: true
        # Origins and Origin Groups
        Origins:
          # API Origin
          - DomainName: !Sub ${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com
            OriginPath: !Sub /${Environment}
            Id: !Sub Custom-${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}
            CustomOriginConfig:
              HTTPPort: 80
              HTTPSPort: 443
              OriginProtocolPolicy: https-only
          # S3 Origin
          - DomainName: !GetAtt StaticAssetsBucket.DomainName
            Id: !Sub S3origin-${StaticAssetsBucket}
            S3OriginConfig:
              OriginAccessIdentity: !Sub origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}
        # Behaviors
        # API Gateway Behavior
        DefaultCacheBehavior:
          TargetOriginId: !Sub Custom-${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
          CachedMethods:
            - GET
            - HEAD
          DefaultTTL: 0
          MaxTTL: 0
          MinTTL: 0
          Compress: true
          ForwardedValues:
            Cookies:
              Forward: none
            QueryString: true
        # Static S3 Behavior
        CacheBehaviors:
          - PathPattern: "*.png"
            TargetOriginId: !Sub S3origin-${StaticAssetsBucket}
            ViewerProtocolPolicy: redirect-to-https
            AllowedMethods:
              - GET
              - HEAD
            CachedMethods:
              - GET
              - HEAD
            DefaultTTL: 0
            MaxTTL: 0
            MinTTL: 0
            Compress: true
            ForwardedValues:
              Cookies:
                Forward: none
              QueryString: false
          - PathPattern: "_nuxt/*"
            TargetOriginId: !Sub S3origin-${StaticAssetsBucket}
            ViewerProtocolPolicy: redirect-to-https
            AllowedMethods:
              - GET
              - HEAD
            CachedMethods:
              - GET
              - HEAD
            DefaultTTL: 0
            MaxTTL: 0
            MinTTL: 0
            Compress: true
            ForwardedValues:
              Cookies:
                Forward: none
              QueryString: true
```

### render/app.js

- API Gateway + Lambda 上で Node.js の Express を動かせるようにする aws-serverless-express という OSS があり、この serverless-express 上で Nuxt.js を ミドルウェアとして動かすことで SSR を実現します
- [こちらの Keisuke69 様の方の記事](https://www.keisuke69.net/entry/2020/09/18/175941)を大いに参考にしていますので、詳しくはご一読願います

```js
"use strict";

const path = require("path");
const { loadNuxt } = require("nuxt");

const express = require("express");
const app = express();

const awsServerlessExpress = require("aws-serverless-express");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");

app.use(awsServerlessExpressMiddleware.eventContext());
app.use(
  "/_nuxt",
  express.static(path.join(__dirname, ".nuxt", "dist", "client"))
);

async function start() {
  const nuxt = await loadNuxt("start");
  app.use(nuxt.render);
  return app;
}

let server;
exports.lambdaHandler = (event, context) => {
  start().then((app) => {
    if (server === undefined) {
      server = awsServerlessExpress.createServer(app);
    }
    awsServerlessExpress.proxy(server, event, context);
  });
};
```

### nuxt.config.js

- コードを見やすくするためにも `srcDir`でソース一式を別ディレクトリにしています

```js
export default {
  srcDir: "nuxt-app",
  head: {
    title: "nuxt-app",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: "" },
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
  },
  css: [],
  plugins: [],
  components: true,
  buildModules: ["@nuxtjs/eslint-module"],
  modules: ["@nuxtjs/axios"],
  axios: {},
  build: {},
};
```

### .github/workflows/main.yml

- GitHub Secrets で環境変数は隠匿化
  - `AWS_ACCESS_KEY_ID` : AWS のアクセスキー ID
  - `AWS_SECRET_ACCESS_KEY` : AWS のシークレットアクセスキー
  - `CFN_TEMPLATES_BUCKET` : SAM 等のテンプレートを保存するバケット名（s3://は不要）
  - `CFSSL_CERTIFICATE_ID` : ACM で発行した証明書の識別子
  - `PROD_CLOUDFRONT_ID` : CloudFront のリソース ID
- プルリクのみで発火
- 高速化を目的に一つの job にまとめています、お好みで分割して最適化してください
- 初めての Action では、CloudFront のリソース ID が分からないので、最後の step で失敗します。CloudFront が作成され次第、Secrets に追加してください

```yaml
name: Deployment for SSR Nuxt

on:
  pull_request:
    branches:
      - master
    types: [closed]

env:
  ENVIRONMENT: ${{ (github.base_ref == 'master' && 'prod') || 'stg' }}
  SUB_DOMAIN: ${{ (github.base_ref == 'master' && 'www') || 'stg' }}

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1

      - name: Set up Python
        uses: actions/setup-python@v1
        with:
          python-version: 3.7

      - name: Install SAM
        run: |
          python -m pip install --upgrade pip
          pip install aws-sam-cli

      - name: Set up Node.js
        uses: actions/setup-node@v2-beta
        with:
          node-version: 12

      - name: Linter and Formetter JS and Vue
        run: |
          npm install
          npm run lint
          npm run lintfix

      - name: Build Nuxt App
        run: |
          npm run build

      - name: Install npm packages for render lambda layer
        run: |
          rsync render/package.json .layer/render/nodejs
          cd .layer/render/nodejs
          npm install --production

      - name: Install npm packages for nuxt lambda layer
        run: |
          rsync package.json .layer/nuxt/nodejs
          cd .layer/nuxt/nodejs
          npm install --production

      - name: Copy to lambda for requirement files
        run: |
          rsync -Rr .nuxt/dist/server render/
          rsync -Rr nuxt-app render/
          rsync nuxt.config.js render/

      - name: Build by SAM
        run: |
          sam build

      - name: Packaging by SAM
        run: |
          sam package \
            --template-file template.yml \
            --s3-bucket ${{ secrets.CFN_TEMPLATES_BUCKET }} \
            --output-template-file deploy.yml

      - name: Deploy by SAM
        run: |
          sam deploy \
            --template-file deploy.yml \
            --stack-name nuxt-ssr \
            --capabilities CAPABILITY_NAMED_IAM \
            --parameter-overrides \
                Environment=$ENVIRONMENT \
                SubDomain=$SUB_DOMAIN \
                CFSSLCertificateId=${{ secrets.CFSSL_CERTIFICATE_ID }}

      - name: Deploy static assets to S3
        run: |
          aws s3 sync nuxt-app/static s3://localing-clinet-$ENVIRONMENT-static-assets --delete
          aws s3 sync .nuxt/dist/client s3://localing-clinet-$ENVIRONMENT-static-assets/_nuxt --delete

      - name: Delete production cloudfront cache
        if: github.base_ref == 'master'
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.PROD_CLOUDFRONT_ID }} --paths '/*'
```

## おわりに

こういうピーキーな構成って何故かロマンというか妙な面白味を感じてしまいます。
あくまでも私個人がピーキーだと勝手に感じているだけです。
もちろん、ちゃんとチューニングして運用される方もたくさんいます。
単純に私がまだ未熟なだけですね。

私の構築したサイトでは、Lambda のコールドスタートを考慮できていないので、SSR の初期表示の速さは全く感じられません :sweat:
ウォームアップにしたいのですが、コストが大きく掛かる可能性があり、導入できていません。
個人開発の辛みですかね。

## 参考文献

- [AWS Lambda と Nuxt.js で Server Side Rendering する（2020 年版）](https://www.keisuke69.net/entry/2020/09/18/175941)
- [Nuxt.js(SSR)を Lambda で配信する【個人開発】](https://qiita.com/kobayashi-m42/items/fbacb46f7603e5a014d7)
- [nuxt-serverless を使いサーバーレスで安定した環境を作る Tips](https://blog.potproject.net/2019/10/03/nuxt-serverless-tips)
- [安い？それとも高い？Provisioned Concurrency を有効化した Lambda のコストに関する考察 #reinvent](https://dev.classmethod.jp/articles/simulate-provisioned-concurrency-cost/)
