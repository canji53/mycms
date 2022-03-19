---
title: "SlackApp/APIの整理とメモ"
description: "何となく触っていたSlackApp/APIに関して、いまいち理解できいなかった部分をドキュメントを眺めて再整理、私的ポイントをメモしました。"
category: "saas"
tags: ["slack", "slackapp", "slackapi", "bolt"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/releraning-slack-app-and-api/thumbnail.png"
updatedAt: "2021-08-01"
createdAt: "2021-08-01"
---

### はじめに

ここ最近、実務で Slack チャンネルへの通知要件があり Slack App/API を触っていたのですが、よくよく考えると何となく雰囲気で使っていたと反省する一面が多く、今一度 SlackApp/API 周りの理解を深めようと思い、当記事ではいまいち分かってなかった部分を再整理して自身の理解をメモしています。

### 言及していないこと

以下は公式ドキュメントや他解説記事がいっぱいあるため言及しません。

- Slack App の作り方
- Slack App/API の細かいスコープ設定

### メモ一覧

自身の疑問点を順に潰したため、繋がりなく項目を羅列しています :pray:

- 通知方法のベストは？
- 3 つの Slack API の違いは？
- 3 つのトークンの違いは？
- Slack App のセキュリティ対策
- Bolt フレームワークとは？既存の Node SDK との違いは？

### 通知方法のベストは？

Slack 通知周りの初見殺しは結構罪深いと思っています。

#### Slack App ディレクトリにある Incoming Webhooks で通知

[Slack App ディレクトリ](https://canji.slack.com/apps)にある公式から提供された[Incoming Webhooks](https://canji.slack.com/apps/A0F7XDUAZ--incoming-webhook-?tab=more_info)があります。
ただし、**同 App は既に非推奨、将来的には削除される可能性もある**ため、今後はまず使わないはずです。ところが、昔からある手法のため、まだ現役で動いているものもあるかと思いますが、はやめに移行することを勧めます。

#### 自身の Slack App で Incoming Webhooks を有効化して通知

上述の Incoming Webhooks は公式から提供される App を自身のワークスペースに連携する方法ですが、自身の App を作成してその App 上で Incoming Webhooks を設定することもできます。また、同方法は公式が推奨しています。

管理画面で Incoming Webhooks を各チャンネルごとに連携設定することで、そのチャンネルに対して通知ができるようになります。具体的には、各チャンネルごとに Webhooks URL が払い出されて、その URL を各 Saas もしくはアプリケーションに設定して通知を実現します。
さらに詳しい内容は、[公式ドキュメント](https://api.slack.com/messaging/webhooks)を参照ください。

#### 自身の Slack App で通知スコープを設定、対象のチャンネルに App ユーザーを連携して通知する

Slack App を作成して通知用の`chat:write`スコープを設定、対象のワークスペースに連携します。そして、個人的にはここが肝だと思っているのですが、通知したいチャンネルごと App を連携追加します。これで、そのチャンネルに App(Bot)から通知が送れるようになります。

`channels:read`スコープを設定すれば、App がパプブリックチャンネルにアクセスできるようになるため、上記の個別に App をチャンネルに追加する設定はいらなくなるのですが、不必要なチャンネルにまで Bot が通知できる状態は気分が良くないため、チャンネルごとに連携できるようにしています。
さらに詳しくは、[公式ドキュメント](https://api.slack.com/messaging/sending)を参照ください。

#### どの通知方法が良いの？

あくまでも私的見解ですが、3 番目の Slack App で通知スコープを設定、各チャンネルごとに App を連携してあげる方法が良いと考えています。Incoming Webhooks の場合、飛ばしたいチャンネルごとに Webhooks URL が増えるて管理コストが高くなると考えていますが、上述の方法であれば、払い出されたトークンだけを管理すれば良いだけなので楽だと考えています。

ただし、他 Saas と連携する場合は、Incoming Webhook を払い出して設定するだけで済む場合もあり（アプリケーションを書かなくて済む）、結局、目的に応じて柔軟に通知方法を選択できるかが鍵になるとも考えています :sweat_drops:

### 3 つの Slack API の違いは？

長らく SlackAPI を触っていて Web API、Events API、RTM API の違い、責務がよくわかっていませんでした。ひとまず、チャンネルに通知をしたいだけなら Web API を使えばいいのだろう程度の理解でした。
公式の解説は[コチラ](https://api.slack.com/lang/ja-jp/which-api)を参照ください。

#### Web API

> Web API は、Slack 上でリッチなインタラクティブ・メッセージを送信する主な手段です。

要するにメッセージを送信するための API です。

#### Events API

> Events API は、イベント情報のサブスクリプションを使用して JSON ペイロードをサーバーに送信します。

何のこと？ということで、使用例を覗くと、「ユーザーがメッセージの投稿、チャンネルの作成や変更、ファイルの追加や変更を行った場合にイベントを受信する」とあり、つまりユーザーの何らかの動作によって、ここではイベントが発生したとして JSON リクエストを受け取れるようにするための API のようです。

#### RTM API

> RTM (リアルタイムメッセージング) API は WebSocket を使用し、イベントを受信して Slack に簡単なメッセージを送信できます。

WebSocket を使うことでリアルタイムな通信を実現、Slack イベントを受信することができ、さらにメッセージ送信を行うこともできるようです。イベント受信ができるのは Events API と被っていますし、メッセージ送信は Web API の責務と被っているように見えます。

どうも、公式だと、RTM では WebSocket 通信のせいで大量に不要な情報まで送信してしまうことがあり、Events API を使うことを勧めています。

#### 3 つの API よりどう使うの？

RTM では大量の情報を連続的に提供してしまい、普段のユーザアプリに組み込むのにはオーバースペック気味だったため、必要十分なリクエストだけを送るための Events API が新しく作られたようです。詳しくは[Slack 公式記事](<(https://medium.com/slack-developer-blog/subscribe-to-the-events-api-d7120470983f)>)を参照ください。

よって、メッセージ送信をしたいのであれば Web API を、ユーザーイベントを受信して何らかの次のアクションを起こしたいのであれば Events API を、RTM API は手に余るので似たようなことをしたいのなら、Web/Events API を組み合わせるのが良さそうです。

### 3 つのトークンの違いは？

Slack App では OAuth をもとに認可を行っており、App に対してどのように振る舞わせたいかで幾つかのトークンが払い出されています。詳しい解説は[コチラ](https://api.slack.com/authentication/token-types)も合わせて参照ください。

#### Bot Tokens

まさに Bot 向けのためのトークンで、後述のユーザートークンとの違いは、その App をワークスペースにインストールしたユーザーの ID と紐付けがされないため、たとえそのユーザーが`deactivated`されても Bot App として生き残り続けられることです。

#### User Tokens

ワークスペースに App をインストールしたユーザーの ID と結びつくため、そのユーザーが実行したかのように振る舞うためのトークンです。

#### App-level tokens

使用した機会はないですが、所属する Organization 全てのワークスペース、そしてそれに属する全てのユーザーに影響するトークンのようです。

#### 結局どれ使うの？

基本的には、Bot Tokens を使って永続的にワークスペースで稼働するのを担保して、どうしても自身のユーザーとして振る舞わせたい時だけ User Tokens を使えば良いのかなと考えます。

### Slack App のセキュリティ対策

誰でも App を簡単に作れるためセキュリティ周りは大丈夫なのかなと思いますが、そこにも対策が打たれているようです。

#### Slack App のスコープ設定

これは基本中の基本ですが、App が呼び出せる Web API や Events API のスコープを現在は必要に応じて設定することができます。以前はさまざまな権限と機能を扱えた[ボットトークン（スコープ）](https://api.slack.com/authentication/token-types#legacy_bot)が提供されていましたが、その強強スコープを付与されたアプリをユーザーがリスクと捉えて使わなかったため、スコープを絞れるようにしたようです。設定できる[スコープ一覧](https://api.slack.com/scopes)。

#### トークンに IP アドレス制限を設ける

CIDR 表記で IP 制限をかけることで、特定の IP からのみ Web API リクエストを受け付けられるようです。最大で 10 個の IP 範囲まで制限できるようです。詳しくは[公式ドキュメント](https://api.slack.com/authentication/best-practices#ip_whitelisting)を参照してください。

#### リクエスト署名

リクエストが本当に意図したサーバから送信されたものかを確かめるのに、リクエスト署名検証がよく用いられますが、Slack でもサポートされています。詳しくは[公式ドキュメント](https://api.slack.com/lang/ja-jp/securing-your-slack-app)を参照ください。

### Bolt フレームワークとは？既存の Node SDK との違いは？

少し複雑な App を作ろうとすると、もちろんアプリケーションを書く場面が発生するのですが、その時に既存の SDK に対して、Bolt がいることに違和感を感じるかもしれません。私は感じました :sweat_smile:

#### 既存の Node SDK

SDK の役目そのままに、前述の 3 つの API を中心に、Python・[JsvaScript](https://github.com/slackapi/node-slack-sdk)でプログラマブルに API を叩けるようにしたものです。実装の側面によると、モノレポ構成なため、叩きたい API に応じてどの package をインストールするかが決まります。Web API なら`@slack/web`、Events API なら`@slack/events-api`です。

#### Bolt

Bolt は上述の API/SDK を更に使いやすくするためのフレームワークのようです。

ユーザーイベントを拾ってそれに応じたインタラクティブなアクションを起こす App を作るのに、既存の SDK では`@slack/web`と`@slack/events-api`をそれぞれインストール、更にドキュメントを詳細に追いかけて組み合わせる必要がありました。
ところが、[Bolt](https://github.com/SlackAPI/bolt-js)ではそれぞれの API/SDK をうまくラップして、ややこしい設定やドキュメントを詳細に読まずとも簡単に App が組めるようです。

ただし、Events API は、イベントリクエストを受け取るために、常時サーバーとして稼働させておく必要があります。Slack へ一方的にアクションを起こす push 型のイベントでは、Events API は必要ではなく、Web API で事足りたりします。
そして、Bolt はイベントを受け取るために常時 http サーバーを立てる前提なため、簡単な通知だけしたい時は`@slack/web`で十分で、注意が必要だなと考えています。

### おわりに

うーん、ややこしい :sweat_smile:

また、余談ですが、この手の Saas 周りはユーザの App を作成・公開できるようにプラットフォーム化するのが多くて、App で実現できる幅と費用対効果が大きくなるにつれて、ゆくゆくは salesforce エンジニアのように slackapp エンジニア的なのが現実味を帯びるのかなと思ったり思わなかったりでした。 :sweat_drops:
