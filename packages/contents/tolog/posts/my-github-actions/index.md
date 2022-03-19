---
title: "ActionsをJobで並列化したい"
description: "当ブログのリプレイスに伴い、ActionsでちゃんとCIをまわしたいと考えたのですが、どうせなら効率良くしたいということで、Jobで並列化して高速化？したものを備忘録しておきます。"
category: "github-actions"
tags: ["cicd", "slack"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/my-github-actions/thumbnail.png"
updatedAt: "2021-10-10"
createdAt: "2021-10-10"
---

### はじめに

個人ブログのリプレイスに伴い、ちゃんと CI を用意して開発したいと考え Github Actions を書いたのですが、どうせなら効率良くしたいと思い、その時の備忘録を残しておきます。
大したことはしていません、下記観点を考慮して並列化した程度です :sweat_drops:

#### 何をしたいのか？

1. なるべく並列化して CI を速くまわしたい
   - **how: [Job](https://docs.github.com/ja/actions/learn-github-actions/workflow-syntax-for-github-actions#jobs) 単位で処理を実行する**
     - Step は直列実行ですが Job は並列実行なので、処理を Job 単位で上手く切り分けることで、並列に処理を完了させることができます
2. テスト結果を Slack に通知できるようにしたい
   - **how: Slack 通知用の [action-slack](https://github.com/8398a7/action-slack) ワークフローがあるのでこれを使います**

### 前提条件

- Ubuntu 20.04
- Node.js 14.15.0

### サンプル

```yml
name: CI

on:
  pull_request:
    paths-ignore:
      - *.md # markdownは避けたい

jobs:
  lint:
    runs-on: ubuntu-20.04
    strategy:
      matrix:
        node-version: [14.15.0]
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: ${{ matrix.node-version }}
          cache: "yarn"
      - run: yarn
      - run: yarn bootstrap
      - run: yarn lint

  test:
    runs-on: ubuntu-20.04
    strategy:
      matrix:
        node-version: [14.15.0]
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: ${{ matrix.node-version }}
          cache: yarn
      - run: yarn
      - run: yarn bootstrap

      - name: test
        working-directory: packages/backend # テストがある階層に移動
        run: yarn test

      # テストの成否をSlackに通知 by https://github.com/8398a7/action-slack
      - name: notification
        uses: 8398a7/action-slack@v3
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        if: always()
        with:
          status: custom
          custom_payload: |
            {
              attachments: [{
                fields: 'job',
                author_name: 'Test for CMS',
                mention: 'here',
                if_mention: 'failure',
                color: '${{ job.status }}' === 'success' ? 'good' : 'danger',
                text: '${{ job.status }}' === 'success' ? 'Test success' : 'Test failed',
              }]
            }
```

### おわりに

今まで Github Actions では、直列実行の Step でやりくりしていたのですが、Job で並列化することで高速化を試みました。比較はしていませんが、速くなったような...気がしています。
この程度の Step 数ではそこまでメリットはなさそうですが、処理が増えると並列化が効いてくるのかなと信じています。
