---
title: "SAMでJestを使っていると遭遇するNetworkErrorを解決"
description: "SAMでSendGridをコールするAPIを作っているとJestのテスト時にNetworkErrorに遭遇しました。結論、Jestのテスト環境の設定をデフォルトの'jsdom'から'node'に変えることで解決。原因はハッキリと言えないのですが、node環境下でサーバサイドを組んでいるのなら環境を'node'にしてテストするのが当たり前っぽいです"
category: "aws"
tags: ["sam", "jest", "seendgrid"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/jest-sam-network-error/thumbnail.png"
updatedAt: "2020-09-08"
createdAt: "2020-09-08"
---

先日、お問い合わせフォームを実装していて、デプロイ先が AWS になるので、お金を掛けたくないこともあって 443 ポート経由でメールを送信できる SendGrid で簡単な API を作っていました。

フォームを受け取って、バリデーションを行った後に、SendGrid の API に内容を渡すことでメールを送信する簡単な API です。

SAM でローカル開発、テストに Jest を使っていたのですが、SendGrid の API を叩くテストをしてみると、、、

```js
// sendgridで送信
await sendgrid
  .send({
    to: to,
    from: email,
    subject: subject,
    text: body,
  })
  .catch((error) => {
    throw error;
  });
```

```bash
Error: Network Error
  at createError (../node_modules/axios/lib/core/createError.js:16:15)
  at XMLHttpRequest.handleError (../node_modules/axios/lib/adapters/xhr.js:83:14)
  at XMLHttpRequest.<anonymous> (../node_modules/jsdom/lib/jsdom/living/helpers/create-event-accessor.js:32:32)
  at innerInvokeEventListeners (../node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:318:25)
  at invokeEventListeners (../node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:274:3)
  at XMLHttpRequestImpl._dispatch (../node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:221:9)
  at fireAnEvent (../node_modules/jsdom/lib/jsdom/living/helpers/events.js:18:36)
  at requestErrorSteps (../node_modules/jsdom/lib/jsdom/living/xhr/xhr-utils.js:128:3)
  at Object.dispatchError (../node_modules/jsdom/lib/jsdom/living/xhr/xhr-utils.js:59:3)
  at EventEmitter.<anonymous> (../node_modules/jsdom/lib/jsdom/living/xhr/XMLHttpRequest-impl.js:654:18)
  at EventEmitter.emit (events.js:333:22)
  at Request.<anonymous> (../node_modules/jsdom/lib/jsdom/living/xhr/xhr-utils.js:390:47)
  at Request.emit (events.js:321:20)
  at Request.onRequestError (../node_modules/request/request.js:877:8)
  at ClientRequest.emit (events.js:321:20)
  at TLSSocket.socketOnData (_http_client.js:483:9)
  at TLSSocket.emit (events.js:321:20)
  at addChunk (_stream_readable.js:294:12)
  at readableAddChunk (_stream_readable.js:275:11)
  at TLSSocket.Readable.push (_stream_readable.js:209:10)
  at TLSWrap.onStreamRead (internal/stream_base_commons.js:186:23) {
```

何ですのコレ？:confused:

分かることは **axios**、**jsdom** 周りでエラーが頻発していることです。

なんで **jsdom** が Jest で動いているの？

## Jest はフロントとバックでテスト環境が異なる

調べてみると、どうやら [Jest はテスト環境が 2 つあるようです。](https://jestjs.io/docs/en/configuration#testenvironment-string)

- jsdom：ブラウザ環境（フロントエンド）
- node：言わずもがな node 環境（バックエンド）

そして、**今回のような node 環境下でのテストでは、環境設定を node に変更する必要があったようです。**

## 結論

下記のように、`package.json` で `testEnvironment` パラメータを node に指定してあげます。

```json
"jest": {
    "testEnvironment": "node"
}
```

## おわりに

最初は SendGrid 周りが悪さをしているのかと、ドキュメントをあさっていたのですが、エラーを見てみると jsdom が悪さしていることに気づいて結論に至りました。

ですが、やっぱり、エラーを読めていない証拠だなと反省する一幕でした。

おそらく、これは sendgrid の内部で axios を使っているために起こるエラーだと思われるのですが、結果的に jsdom に着目して解法に至ったので結果オーライです。

## 参考文献

- [Configuring Jest - testEnvironment [string]](https://jestjs.io/docs/en/configuration#testenvironment-string)
