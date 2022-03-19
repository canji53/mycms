---
title: "aws-lambda-mock-contextで発生するtimeoutの回避"
description: "Jestとaws-lambda-mock-contextでテストする際に、timeoutを調整する場合は、template.yml側ではなく、mock-contextでオプションを指定して調整すること。"
category: "aws"
tags: ["aws-lambda-mock-context", "jest", "timeout"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/lambda-mock-context-timeout/thumbnail.png"
updatedAt: "2020-10-16"
createdAt: "2020-10-16"
---

SAM で テストする際に Jest と aws-lambda-mock-context をよく使っているのですが、処理が重くなると簡単に timeout 3 秒を超えてエラーになります。

aws-lambda-mock-context では、テスト実行時に mock 用の context を流して擬似的に lambda を実行するため、template.yml のオプションが反映されません。

そして、最初私は template.yml の timeout のオプションがなぜか反映されず困っていました。

ですが、前述のように、そもそも SAM (つまり、template.yml) を通して実行されていないのだから timeout のオプションも反映されません。Jest と aws-lambda-mock-context で完結した実行なのだから、両者でオプションを設定する必要があります。

アホですね :full_moon_with_face:

## tl; dr

```js
"use strict";
const context = require("aws-lambda-mock-context");
const app = require("../app");
const event = require("./event");

describe("タイムアウトのテスト", () => {
  test("テスト", async () => {
    // ここで context に timeout オプションを設定
    let ctx = context({
      timeout: 10,
    });

    const response = await app.lambdaHandler(event, ctx, function () {});
    expect(response.statusCode).toBe(200);
  });
});
```

## その他オプション一覧

以下は、[aws-lambda-mock-context の公式](https://www.npmjs.com/package/aws-lambda-mock-context#contextoptions)より、

#### region

- Type: string
- Default: us-west-1

#### account

- Type: string
- Default: 123456789012

#### functionName

- Type: string
- Default: aws-lambda-mock-context

#### functionVersion

- Type: string
- Default: $LATEST

#### memoryLimitInMB

- Type: string
- Default: 128

#### alias

- Type: string

#### timeout

- Type: number
- Default: 3

## おわりに

ドキュメントを読めってことですね :hammer:

## 参考文献

- [[npm 公式] aws-lambda-mock-context](https://www.npmjs.com/package/aws-lambda-mock-context)
