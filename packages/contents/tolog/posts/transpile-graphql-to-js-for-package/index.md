---
title: "graphql-codegenで変換したtsをさらにトランスパイルする"
description: "queryやmutationなどのdocumentsもschema側で記述すると`.ts`に変換する必要があり、さらにスキーマ自体をパッケージ管理していると`.js`にトランスパイル必要があります。それはそう。なので、codegenした後に、tscでコンパイルすることで対応しました。"
category: "graphql"
tags: ["graphql-codegen", "typescript", "monorepo"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/transpile-graphql-to-js-for-package/thumbnail.png"
updatedAt: "2021-09-25"
createdAt: "2021-09-25"
---

## はじめに

個人開発にて GraphQL を採用しているのですが、schema を [GraphQL Code Generator](https://www.graphql-code-generator.com/) （以下 codegen と呼称）で管理しています。
typescript を前提にしています。

今までは `type` のみを変換している程度でしたが、front 側（React.js を想定）で `query` や `mutation`を `gql` タグで書くのを嫌って、それらも codegen で管理・変換したいという欲求が出てきました。

- `query`、`mutation` なども codegen 側の管理責務であると捉えている
  - その方が見通しが良い
  - gql タグで書かれた`qeury`などをどのファイルやディレクトリで管理するか迷うのが面倒
- フロント側で query 構文をミスった場合、debug に時間がかかる可能性がある

以下のような gql タグをわざわざフロント側で書きたくない！

```typescript
// hoge.tsx
const fetchPosts = gql`
  query fetchPost($slug: String!) {
    post(slug: $slug) {
      slug
      title
      description
      category
      tags
      thumbnailUrl
      body
      createdAt
      updatedAt
    }
  }
`;
```

そこで、schema 上での `query`、`mutation` などの記述を TypeScript に変換してくれる [`typescript-graphql-request`](https://www.graphql-code-generator.com/docs/plugins/typescript-graphql-request) という plugin が codegen では用意されています。
ちなみに codegen では`query`、`mutation`などを [GraphQL documents](https://www.graphql-code-generator.com/docs/getting-started/documents-field) と呼んでいるようです。

```graphql
# src/hoge.graphql
query fetchPost($slug: String!) {
  post(slug: $slug) {
    slug
    title
    description
    category
    tags
    thumbnailUrl
    body
    createdAt
    updatedAt
  }
}
```

↓ 変換後

```typescript
// dist/hoge.ts

const fetchPosts = gql`
  query fetchPost($slug: String!) {
    post(slug: $slug) {
      slug
      title
      description
      category
      tags
      thumbnailUrl
      body
      createdAt
      updatedAt
    }
  }
`;
```

やっと本題に入っていくのですが、
上述のように schema 上の documents を `typescript-graphql-request` で `.ts` に変換することで、フロントでわざわざ gql タグを書く必要がなくなるのですが、**モノレポ構成で schema を単体の npm パッケージとして管理しているとこれだけでは不十分でした。**
モノレポ構成が問題というよりは、schema 自体を単体のパッケージで管理しているのが問題で、**別パッケージから const を呼び出そうとした際に `.ts` では import できないので JavaScript にトランスパイルしてあげる必要があったのです。**

なので、codegen で `.graphql` から `.ts` に変換して、[tsc](https://www.typescriptlang.org/docs/handbook/compiler-options.html) で `.ts` から `.js` に変換するようにしました。

## 設定例

```bash
# ディレクトリ構成

└── schema
    ├── codegen.yml
    ├── dist # 変換後のファイルが置かれる場所
    │   ├── index.d.ts # `index.ts`をtscで変換
    │   ├── index.js # `index.ts`をtscで変換
    │   └── index.ts # codegenで変換された`.ts`
    ├── package.json
    ├── src # schemaファイルが置かれる場所
    │   ├── main.gql
    │   └── hoge.gql
    └─── tsconfig.json # トランスパイルする関係で必要
```

```yaml
# codegen.yml
schema: src/**/*.gql

generates:
  dist/index.ts: # tsに変換している
    documents: src/**/*.gql # GraphQL documentsが記述されているファイルを指定する
    plugins:
      - typescript
      - typescript-operations
      - typescript-graphql-request
```

```json
// tsconfig.json
// schemaの型も読むために、`declaration`をtrueにしておくぐらいです
{
  "include": ["dist/index.ts"],
  "exclude": ["node_modules"],
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "declaration": true /* Generates corresponding '.d.ts' file. */,
    "outDir": "./dist",
    "strict": true,
    "baseUrl": "./",
    "paths": {
      "*": ["node_modules/@types/*"]
    }
  }
}
```

```json
// package.json
// scriptsのみを抜粋
// npm-run-allで`buld:*`を上から順に実行しています
// graphql-codegenした後にtscしているだけです
{
  "scripts": {
    "build": "npm-run-all build:*",
    "build:clean": "rimraf dist",
    "build:generate": "graphql-codegen --config codegen.yml",
    "build:transpile": "tsc"
  }
}
```

## おわりに

これって codegen 側で `.js`までトランスパイルを一気にできないのですかね...？
