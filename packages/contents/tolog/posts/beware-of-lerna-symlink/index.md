---
title: "lernaのpackageはsymbolic linkであることに注意したい"
description: "lernaのpackageはsymbolic linkであることに注意したい"
category: "lerna"
tags: ["lerna", "symbolic-link"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/beware-of-lerna-symlink/thumbnail.png"
updatedAt: "2021-05-31"
createdAt: "2021-05-31"
---

## はじめに

先日、個人で開発している Lerna でモノレポ構成の子パッケージをデプロイしようとすると以下のように怒られました。

```bash
Error: Cannot find module '@hoge/graphql-schema'
```

エラー内容から、`@hoge/graphql-schema`はありませんと言われたのです。

## TL; DR

`Lerna`のモノレポ構成を採用していた場合、別パッケージの参照にはシンボリックリンクが貼られているため、パッケージ単体でデプロイした場合、シンボリックリンク故に実体のディレクトリ・ファイルが参照できなくなり、module がないよと怒られてしまいます。

なので、実体のファイルやディレクトリを用意してあげる必要があります。

## 内容

個人開発では、`GraphQL`でスキーマファースト、`Lerna`でモノレポ構成にしているため、`graphql-schema`というパッケージに GraphQL のスキーマを記述しています。そして、バックエンドを記述するパッケージ`graphql`ではその`graphql-schema`を npm モジュールとして参照するようにしています。

```bash
$ tree packages -L 1
packages
├── graphql # バックエンドが記述されているパッケージ
└── graphql-schema # Graphqlスキーマを記述しているパッケージ

2 directories, 0 files
```

そして、バックエンド API が固められた`graphql`パッケージを Lambda Container にデプロイしようとすると、上述のエラーが発生したのです。

最初は Lambda もしくはコンテナ内のファイル権限の問題かなと思いました。

ところが、module（package）がないよと言われているので、デプロイ image に`graphql-schema`ディレクトリがまさか素直にないのかと思い`ls`してみると、`Symbolic Link`ではないですか！

```bash
$ ls -la
total 0
drwxr-xr-x    3 smiler  staff    96  5 31 02:05 .
drwxr-xr-x  273 smiler  staff  8736  5 31 02:05 ..
lrwxr-xr-x    1 smiler  staff    23  5 31 02:05 graphql-schema -> ../../../graphql-schema
```

Lerna の README を眺めていると`Bootstrap`時に`Pacakges`配下はそれぞれ`Symlink`されると明示的に書かれていました。

> 2. Symlink together all Lerna packages that are dependencies of each other.
>    [Lerna README bootstrap#usage](https://github.com/lerna/lerna/tree/main/commands/bootstrap#usage) より

よって、`graphql-schema`を npm パッケージとしてインストールしていても Symbolic Link として参照されるため、`graphql`パッケージのみをデプロイすると、実体として`graphql-schema`がいないため`Cannot find module`と怒られていました。

では、どう解消したかと言うと、全くナンセンスかと思いますが、デプロイ時に`graphql-schema`を明示的に node_modules 配下にコピーしてあげることで、実体として存在させ参照できるようにしました。

## おわりに

bootstrap 時に実体としてファイル・ディレクトリをそもそも置けないのか？

バンドルすれば良いとも聞くのですが、どうするのだろうか...
