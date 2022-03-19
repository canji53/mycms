---
title: "namaeで比較的唯一無二なプロダクト名をあなたに"
description: "プロダクト名やサービス名にはどうしても名前被りが考えられますが、その被りを一発で検索提示してくれるのがnamaeというサービです。比較的エンジニア寄りですが、こういう痒いところに手が届くサービスは本当に助かります。"
category: "web-tools"
tags: ["namae"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/namae-introduction/thumbnail.png"
updatedAt: "2020-08-22"
createdAt: "2020-08-22"
---

最近、個人開発をしているのですが、意外に頭を悩ませるのが**プロダクト名**かなと思っています。

「これだっ！」と思った名前が、ふとドメイン登録サービスをのぞくとすでに使われている :full_moon_with_face:

このような経験は、ドメイン名だけでなく、オープンソースなプロダクト名、はたまた Twitter や Slack などの SNS のアカウント名にまで及ぶかと思います。

私は以前、Google の検索件数の大小で名前自体の希少性を調べたり、トップ数十ページのサイトドメインで名前被りがないかなどを見ていました。しかし、これでは当然漏れがあって、Github や SNS の Google 検索の外にあるアプリ上での名前被りまでは調べきれていませんでした。

**やはり、あらゆる場面で比較的唯一無二な名前を探すのは想像以上にカロリーのかかる作業かと**:pizza:

そこで、便利なのが [namae](https://namae.dev/) というサービスです。

## namae とは？

**ずばり、シンプルにあらゆるプラットフォーム上で唯一無二な名前かを調べてくれるサービスです。**

検索すると、どのプラットフォーム上で名前が押さえられているかがが分かります。

また、面白いのが**ユニーク度合い**や**他の名前をサジェストしてくれる**点です。

試しに当ブログの ToLog を検索してみると（2020/08/22 現在）、ユニーク度合いは 82.9 UNIQ でした。

![namae_tolog_screenshot](https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/namae-introduction/namae_tolog_screenshot.png)

他にもユニーク度を測ってみると

- google: 27.8 UNIQ
- Twitter: 16.7 UNIQ
- Facebook: 33.3 UNIQ

有名どころはユニーク度が低い、つまり多くのプラットフォーム上ですでに名前が押さえられていることが分かります。

## 検索対象のプラットフォーム

比較的 エンジニア を対象としたサービスなので、WEB 周りのプラットフォームが多い印象です。

ですが、法人が網羅されている点は非常に面白いです。

試しに NTT と打つと関連会社がずらっと並んで、こんなにあるんだと感心します。

- ドメイン
- GitHub Organization
- Twitter
- npm / npm Organization
- Homebrew / Homebrew Cask
- Gitlab
- PyPI
- Rust (crates.io)
- RubyGems
- Linux (Launchpad & APT)
- OCaml
- Vercel
- Heroku
- Netlify
- js.org
- Slack
- Instagram
- Spectrum
- AWS S3
- Github リポジトリ
- App Store
- 法人

## おわりに

こういう命名作業は意外に時間を使うので、これをサクッと調べてくれるサービスは本当に助かります。

手の痒いところに届くというか、「あぁなるほど言われてみれば便利だなこのサービス」の個人的な代表格が namae かなと思っています。

ただし、注意したのは全てのプラットフォームをカバーしているわけではないので、必ずしも唯一無二になるわけではないという点です。

ですが、唯一無二は神様しか分からないので、その点においては非常に有益なサービスであることは間違いないと思います。

## 参考文献

- [namae](https://namae.dev/)
- [Give Your App Slick Name with namae.dev](https://dev.to/uetchy/give-your-app-slick-name-with-namae-dev-5c4h)
