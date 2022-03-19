---
title: "Gatsbyに招かれて、ありがとうWordPress"
description: "当ブログをWordPressからGatsby.jsに移行しました。理由は、AWS×WordPressの開発・運用・保守に疲れてしまったことと比較的モダンな静的サイトジェネレーター、Gatsby.jsに触れたかったためです。結論として、ブログも爆速になって懐事情も優しくなり、心理的安全性を確保できたので良かったかなと考えています。"
category: "gatsby"
tags: ["react", "ssg", "wordpress"]
updatedAt: "2020-10-31"
createdAt: "2020-08-19"
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/invited-by-gatsby/thumbnail.png"
---

当ブログを Wordpress から Gatsby.js に移行しました。

何番煎じなんだという感じですが、WordPress / AWS の開発・保守・運用に疲れてしまい、そして静的サイトジェネレーター（ SSG ）への興味で、今回 Gatsby.js / Netlify にブログ構成を刷新しました。

Gatsby.js の素晴らしさは言わずと知れた話なので、グーグル先生にお任せしますが、今回はどうして WordPress を辞めて Gatsby.js に移行したかに焦点を絞って述べられたらと思います。

**ほとんど反省に近いです。**

## 結論（反省点）

- 闇雲なインフラコードがスピード感を失った開発・保守の温床になり疲れる
- レガシーをモダンへの嗜好が結果的にスパゲティーを作り疲れる :spaghetti:
- ブログテーマと WordPress が肌感で相性が悪そうに思えた
- Gatsby.js が個人利用であれば簡単・爆速
- 実質タダのホスティングサービス Netlify のおかけで心理的安全性を確保

## 理由

### 過度なインフラコードへの傾倒

以前は AWS をベースに CodePipline、ECS で WordPress を展開していたのですが、これ全てを CloudFormation つまりインフラコードで構築していました。

端的に、インフラコードは工数が増えると思います :sweat:

ブログ開設当時は、AWS を触り初めて半年で、そろそろ画面ぽちぽちを辞めたいと思い CloudFormation を触り始めていたのですが、インフラ構成がコードで表現できることにハマってしまい、比較的トレンドから外れつつある WordPress を触るなら、せめてインフラを楽しもうと CloudFormation で構築し始めました。

私の中でインフラコードのメリットは、インフラの冪等性/再利用性とバージョン管理がまず思い浮かぶのですが、いずれもチーム開発・保守が前提として上げられるのかなと思っています。デメリットとしては、個人的経験に依りますが、**とにかくインフラリソースのビルド/デプロイ/テストに時間がかかり、スピード感が失われてしまうことです。**

おそらく、コンソール操作だけなら半日程度で終わったいた内容が、謎エラーとの格闘、モチベーションの発散と相まって、ずるずると伸びて２ヶ月近くも掛かっていました :innocent:

ですので、個人開発のしょうもないエンジニアブログをわざわざインフラコードで構築するのは時間コスパに圧倒的に見合っていませんでした。

**ところが、Netlify では、連携した Github に push するだけでデプロイが完了、**SSG との親和性を最大限に高めているとは言え、掛かった時間は Netlify を理解する１〜２時間程度、感謝です。

### WordPress をモダンに開発・保守したかったあの頃

世間的には、WordPress を揶揄する潮流が少なからずあります :droplet:

少なくともモダンな WEB エンジニアリングを嗜好するなら WordPress はファーストチョイスでないことは公然の事実かと思いますが、かと言ってそこまでエンジニアエンジニアしたくない人にとってネット上に知見が蓄積されている WordPress はさくっと個人メディアを展開できる絶好のツールかとも思います。

私としては、全世界のサイトの約３割が WordPress で構築されていると聞くと、無視することはできませんでした。

そんなこんなで WordPress を触り始めたのですが、仕事でインフラのリプレイスを経験してから、**いつしかレガシーな技術をモダンな技術でラッピングもしくは互換できるのではないかと考え始めたのです。**

WordPress に npm、Composer、Bedrock（ボイラーテンプレート）、Blade（Laravel のテンプレートエンジン）、オレオレ MVC フレームワークなどなど、モダン嗜好という大義名分のもと、どんどん開発・保守・運用を重ねました。

結果、ちょっとコードを見ない期間があると、何を書いているのかサッパリになりました :full_moon_with_face:

コードを書く時間より、理解する時間の方が多いのは、周知の事実ですが、個人のブログにかけられる時間は一日最大でも２時間程度かもしれないです。その内、コードを眺めているのが８０%だとすると、、、恐ろしいですね。

無能は承知ですが、流石に見合っていない。

ということで、簡単に開発・保守・運用できて比較的モダンな技術はないかと考えて Gatsby.js に行き着きました。

### エンジニアブログと WordPress の相性

エンジニアのブログになると、ほとんど備忘録か初心者向けのコンテンツが多いかと思いますが、それが WordPress で構築されたブログメディアだと、そのコンテンツへの信頼性・期待値が損なわれるのではないか？

WordPress が悪いというより、どうもエンジニアユーザーが多い場合、扱うコンテンツとそれを見せるシステムの背景が、マズそうに見えるという定性的な評価です。

怒られそうなので、このぐらいにします :sweat:

### Gatsby.js が驚くほど扱いやすい

Javascript / Node.js を触る人なら、おそらくスッと書けるのではないかと思います。

React.js 単体での開発経験はないのですが、React.js ベースの Gatsby.js はドキュメントが整っており、困ったら大体ドキュメントに書いています（ただし英語）

プラグインも豊富で、小規模なブログやメディアであれば、WordPress でできることは、おそらく「npm install」でほとんど実現できると思います。

GraphQL というクエリ言語でデータを持ってくるのですが、これが若干とっつきにくかったです。しかし、GUI ベースのガイドツールが用意されており、（ http://localhost/\_\_\_graphql でローカルアクセス可能）どのようにクエリを書けば目的のデータを取得できるかを簡単に把握できます。

**あと爆速（blazing fast）です** :fire:

当ブログは、Lighthouse で オール１００ではないですが、こんなに速いのは初めてでした :hushed:

### 静的ホスティング Netlify の料金破壊

今まで AWS で運用していて無料枠を含めて月２００円〜５００円掛かっていたのですが、これが Netlify のおかげで実質タダになりました。

AWS の無料枠が終われば、おそらく月１０００円かかると考えていたので、渡りに船でした。

ブログのテーマ上、収益など全く考えておらず、安いに越したことはなかったので、この移行は必然だったかと思います。

## 終わりに

結果的に、ほとんど私の開発・保守・運用の仕方、そもそもの目的と手段が剥離していたのが問題でした。

また、決して WordPress が悪いと言いたいわけではなく、エンジニアリングに重きを置くなら Gatsby.js を初め SSG を試すのはどうですかという考えです。

そして、コンテンツファーストではあれば、非エンジニアでもコンテンツ自体の運用が比較的楽なので、今なお WordPress はファーストチョイスだと思われます。もしくは、それらのブログやメディアを運営するなら、WordPress をまず検討すべきだとも考えています。

最後に、この移行のおかげで、めちゃくちゃ楽になったような気がします :laughing: