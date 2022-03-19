---
title: "GitHubActionsで前stepの変数を後stepで利用したい"
description: "Github Actionsで「前stepの変数を後stepで利用する」ために、envもしくはset-outputを使った方法を備忘録として残しておきます。"
category: "github-actions"
tags: ["github-actions", "env", "set-output", "act"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/share-variables-in-github-actions/thumbnail.png"
updatedAt: "2021-09-12"
createdAt: "2021-08-29"
---

### はじめに

先日、Github Actions を触る機会があり、**前ステップの`run`内の変数を後ステップで利用したいという場面に出くわしました。**

Github Actions では、各 step 内でスコープが閉じられているため、何らかの方法で step 間で変数を共用できるようにします。

そこで、今回は step 間で変数を共用する方法を備忘録します。

### 1. env に環境変数として格納する

公式 Docs：[Setting an environment variable](https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions#setting-an-environment-variable)

```shell
# envに格納する
run: echo "key=value" >> $GITHUB_ENV

# envから取り出す
run: echo ${{ env.key }}
```

他の手法に比べて分かりやすく、多用しています。ただし、環境変数を設定した step 内では、その変数を取り出すことができません。

```yaml
# 実例
- name: Store in env
  run: |
    echo "STAGE=production" >> $GITHUB_ENV
    echo ${{ env.STAGE }} # printされません

- if: ${{ env.STAGE == 'production' }}
  run: |
    echo ${{ env.STAGE }} # `production`がprint
```

以前は set-env が用いられましたが、[脆弱性](https://github.blog/changelog/2020-10-01-github-actions-deprecating-set-env-and-add-path-commands/)が報告され現在は使用できません。

### 2. set-output で step の出力パラメータとして扱う

公式 Docs：[出力パラメータの設定](https://docs.github.com/ja/actions/reference/workflow-commands-for-github-actions#setting-an-output-parameter)

```shell
# stepの出力パラメータとする、idが必須
id: ${id}
run: echo '::set-output name=${key}::${value}'

# 指定idのstepの出力パラメータを取り出す
run: echo ${{ steps.${id}.outputs.${key}}}
```

1 の env から取り出すのに比べて値を取り出すのが面倒だと思います。

```yaml
# 実例
- name: Set output
　id: configure # idをつける必要があります
　run: |
    echo '::set-output name=stage::production'

- if: steps.configure.outputs.stage == 'production'
  run: |
    echo ${{ steps.configure.outputs.stage }} # `production`がprint
```

### 余談

GitHub Actions の難しさに（面倒臭い）デバックのし辛さがあると思います。構文不正が Actions で実際に動かして初めて分かるからです。

そこで、私は GitHub Actions 自体の lint をしてくれる[actionlint](https://github.com/rhysd/actionlint)、ローカルで Actions を実行できる[act](https://github.com/nektos/act)を併用して、デバックしていました。**しかし、act は Gtihub Actions を完全に再現しているわけではないので、Actions で動くはずの構文が act で動かない場合もあります。（[制作者も注意しています](https://github.com/nektos/act#default-runners-are-intentionally-incomplete)）**

私はハマりした。ローカルの act で `env` の構文が動かないので、`set-output` を利用したが、よくよく調べると Actions 上だと期待通り`env`が動くではないですか、と言う顛末です。

なので、サンドボックス用のリポジトリで検証することが近道だと最近は考えています。

### おわりに

1 の方法は、環境変数をグローバル変数のように扱っていて、env は定性的な値を扱うものとして認識している私には多少違和感があります。なので、2 の方がしっくりくるのですが、値を取り出すのにあそこまで長くなるのは面倒なので、1 で落ち着いています。
