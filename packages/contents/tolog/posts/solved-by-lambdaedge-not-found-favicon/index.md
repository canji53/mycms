---
title: "Nuxt/S3/CloudFront(OAI)でfaviconが見つからない問題をLambda@Edge(Node.js)で解決"
description: "先日、Nuxt/CloudFront(OAI)/S3でJamstackした際に、'/XXX/favicon.ico is not found'と出るので、Lambda@Edgeでリクエストを操作して、/XXX/favicon.ico -> /favicon.icoになるように対応しました。他にも細かいリダイレクト設定を施したので、対応コードを残しておきます。"
category: "aws"
tags: ["lambda-edge", "node", "favicon.ico"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/solved-by-lambdaedge-not-found-favicon/thumbnail.png"
updatedAt: "2020-09-26"
createdAt: "2020-09-26"
---

先日、Nuxt.js / S3 / CloudFront で Jamstack なサイトを作っていると、`/XXX/favicon.ico is not found`が発生。

うん？

favicon.ico はルートにしか置いてないよ... :full_moon_with_face:

ということで、Lambda@Edge でリクエストを操作して、`/XXX/favicon.ico -> /favicon.ico` にリダイレクトされるように対応しました。

### コード

ちなみに、下記のコードは Classmethod さんの[コチラの記事](https://dev.classmethod.jp/articles/directory-indexes-in-s3-origin-backed-cloudfront/)を大いに参考にしています :beers:

```javascript
exports.lambdaHandler = async (event, context, callback) => {
  // CloudFrontのイベントからリクエストを抽出
  let request = event.Records[0].cf.request;

  const oldUri = request.uri; // リクエストから変換前のURI
  const newUri = redirectUri(oldUri); // 変換条件からURIを変更

  // リクエストに変換後のURLを注入
  request.uri = newUri;

  return callback(null, request);
};

const redirectUri = (uri) => {
  // favicon.ico はルートディレクトリにして返す
  if (uri.indexOf("favicon.ico") !== -1) {
    return "/favicon.ico";
  }

  // pathの末端が拡張子付きである場合は、そのまま返す
  if (uri.split("/").pop().search(/\./) !== -1) {
    return uri;
  }

  // 末尾に'/'がない場合は、'/index.html'を追加
  if (uri.search(/\/$/) === -1) {
    return uri + "/index.html"; // 末尾に'/'を追加
  }

  // 末尾が'/'の場合、つまり、'/xxx/' -> '/xxx/index.html' に変換
  if (uri.search(/\/$/) !== -1) {
    return uri + "index.html"; // 末尾に'index.html'を追加
  }

  return uri;
};
```

favicon.ico 対応意外にも、`/XXX -> /XXX/index.html` など幾つか細かい対応をしています。

### 参考文献

- [Classmethod: できた！S3 オリジンへの直接アクセス制限と、インデックスドキュメント機能を共存させる方法](https://dev.classmethod.jp/articles/directory-indexes-in-s3-origin-backed-cloudfront/)
