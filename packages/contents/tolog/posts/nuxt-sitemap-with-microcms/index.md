---
title: "NuxtでMicroCMSの記事をサイトマップに含める"
description: "先日、Nuxt と MicroCMS で JamStack な個人ブログを作成したのですが、その際に MicroCMS のコンテンツをどうサイトマップに反映するか悩んだので、個人的解法を残しておきます。"
category: "nuxt"
tags: ["microcms", "site-map", "jamstack"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/nuxt-sitemap-with-microcms/thumbnail.png"
updatedAt: "2020-10-24"
createdAt: "2020-10-22"
---

## はじめに

先日、Nuxt と MicroCMS で JamStack な個人ブログを作成したのですが、その際に MicroCMS のコンテンツをどうサイトマップに反映するか悩んだので、個人的解法を残しておきます。

## TL; DR

```bash
npm install --save @nuxtjs/sitemap
```

- `nuxt.config.js`

```js
const baseUrl = "https://hogehoge.com";
const microcmsEndpoint = "https://hogehoge.microcms.io/api/v1"; // お使いのmicocmsのエンドポイントを指定

export default {
  // ~~略~~
  modules: ["@nuxtjs/sitemap"],
  sitemap: {
    path: "/sitemap.xml",
    hostname: baseUrl,
    exclude: ["/403", "/about"], // 除外したいパスを適宜指定
    routes(callback) {
      const limitation = 100;
      // /content といパス名で記事やコンテンツリストを管理をしていた場合
      axios
        .get(`${microcmsEndpoint}/content?limit=${limitation}`, {
          headers: { "X-API-KEY": process.env.MICROCMS_API_KEY },
        })
        .then((res) => {
          const routes = res.data.contents.map((content) => {
            return `/${content.id}`;
          });
          callback(null, routes);
        })
        .catch(callback);
    },
  },
};
```

## 参考文献

- [[npm] @nuxtjs/sitemap](https://www.npmjs.com/package/@nuxtjs/sitemap)
