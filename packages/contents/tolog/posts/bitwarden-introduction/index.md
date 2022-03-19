---
title: "パスワードって１つで良いよね with Bitwarden"
description: "とり頭の私にとってパスワード管理は悩みの種ですが、Bitwardenを使うことで幾分か頭痛が和らぎます。風邪薬みたいなキャッチになりましたが、効率面においては何よりの療法になります。Bitwarden は多くあるパスワード管理ツールの１つですが、無料にも関わらず（有料プランあり）、その他の有料ツールと変わらないほど高機能で、セキュリティ面も担保できると至れる尽せりのツールになります。"
category: "bitwarden"
tags: ["bitwarden", "master-password"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/bitwarden-introduction/thumbnail.png"
updatedAt: "2020-08-17"
createdAt: "2020-03-03"
---

### はじめに

アプリやサービスに登録するたびにパスワードが必要になりますが、ハッキリ言って私は記憶しきれません、同時に記憶できるパスワードは４つ程度だと思います :cry:

[こちらの記事](https://dime.jp/genre/461515/)では人が短期記憶できる数列は約７個とも言われています。

鳥頭の私にとってパスワード管理は悩みの種でしたが、[Bitwarden](https://bitwarden.com/) というツールを使い始めてからそれを意識することが極端に減りました。

何故かというと、**同ツールを使うと基本的に記憶するパスワードが 1 つだけになったからです。**

Bitwarden は多くあるパスワード管理ツールの１つですが、**無料にも関わらず（有料プランあり）、その他の有料ツールと変わらないほど高機能で、**セキュリティ面も担保できると至れる尽せりのツールだと感じています。

今回は Bitwarden を下の観点でお伝えできればと思います。

- マスターパスワードで煩雑なパスワード管理を排除
- Bitwarden を二段階認証で堅牢化
- ブラウザ拡張機能でパスワードを自動補完
- パスワードを自分で考えた時点で危険かも

### **マスターパスワードで煩雑なパスワード管理を排除**

Bitwarden では、**マスターパスワード**と呼ばれるものを管理することになります。

ユーザーはこのマスターパスワードさえ覚えておけば良いのです。

どう言うこと？

まず、下のイメージをご覧ください。

![bitwarden_overview](https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/bitwarden-introduction/bitwarden_overview.png)

Bitwarden とは言わば、あらゆるパスワードが保管されている保管庫みたいなものです。

ユーザーは、図の（１）のようにマスターパスワードを使って Bitwarden を開錠して、（２）のように保管庫から目的のパスワードを取得します。

**この仕組みによって、ユーザーは実質的にマスターパスワードのみを記憶しておけば、他のパスワードを管理する必要がなくなります。**

### **Bitwarden を二段階認証で堅牢化**

ですが、マスターパスワード運用をしていると、万一マスターパスワード自体が漏洩したら全てのパスワードにアクセスされる危険性があります。

それを防ぐのに **Bitwarden では標準で二段階認証をサポート**しています。
**個人的に、二段階認証は絶対に有効化することを強くオススメします。**
むしろ当たり前のものと考えて良いのかと思います。

私は二段階認証アプリとして [Google Authenticator](https://apps.apple.com/jp/app/google-authenticator/id388497605) を iPhone にインストールして普段使いしています。Bitwarden を開けようとする度に、iPhone の Google Authenticator の二段階認証コードが発行され、Bitwarden にコードを入力して保管庫を開けるような流れです。

### **ブラウザ拡張機能でパスワードを自動補完**

Bitwarden を使うなら、**同時に利用したいのがブラウザの拡張機能を使ったパスワードの自動補完です。**
コチラ非常に便利で、この機能を使わないなら Bitwarden の魅力が半減するとも言えます。
Chrome を標準ブラウザにされている方は、[ウェブストア](https://chrome.google.com/webstore/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb?utm_source=chrome-ntp-icon)から Bitwarden 拡張機能を追加できます。

この拡張機能は、**各種 URL を自動認識して必要となるパスワードをサジェストしてくれます。**

![bitwarden_autocomplete](https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/bitwarden-introduction/bitwarden_autocomplete_1280x720.gif)

### **パスワードを自分で考えた時点で危険かも**

地味に便利なのがランダムなパスワード生成機能だと思っています。

マスターパスワードだけ記憶すれば良いと言っても、新しいアプリやサービスには、どうしても新しいパスワードが必要になります。

しかし、自身でパスワードを考えると、どうしても覚え易いフレーズを含めてしまうかもしれません。
かつて私は似たようなフレーズを多用していました :sweat:
気づくと似たようなフレーズが各パスワードに含まれ、最悪の場合、芋づる式に漏洩するかもしれません。

**回避するには、自身でパスワードを考えなければ良いのです。**

そこで登場するのがランダムパスワード生成機能です。
**マスターパスワードさえ記憶しておけば、bitwarden とブラウザ拡張機能が URL に応じて目的のパスワードを自動補完してくれるので、言うならばパスワードの中身は知る必要もないのです。**

**それなら、パスワードはランダムなものを使った方がかえって安全です。**

![bitwarden_generate_random_password](https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/bitwarden-introduction/bitwarden_generate_random_password_1280x720.gif)

**Bitwarden のパスワード生成では、英字の小文字・大文字、数字、記号を含むのか、パスワードの長さを５〜１２８まで調節することができます。**

ランダム数列生成ツールは幾らでもあるのですが、Bitwarden 内で完結する上に、**生成されたランダム数列が履歴として残るので、間違ってパスワードを保存し忘れた際に非常に便利**です。ただし、裏を返せば履歴が残ることによる漏洩のリスクもあるので、設定で履歴機能をオフにしたり、こまめに消すことをオススメします。

### **まとめ**

- Bitwarden を使うことで覚えるパスワードが実質１つだけになる
- ブラウザの拡張機能と連携して、自動補完することで作業効率が格段に向上
- ランダムなパスワード生成機能で自身も分からないパスワードでセキュリティを最大限に担保

**他にもお伝えできていない機能がたくさんありますが、Bitwarden を使わない理由はないことが伝わったかと思います。**

Bitwarden を活用して安全で快適なパスワードライフを楽しんで貰えればと思います！

### **参考文献**

- [人間が同時に記憶できるパスワードの数は？](https://dime.jp/genre/461515/)
- [bitwarden.com](https://bitwarden.com/)
- [Google Authenticator](https://apps.apple.com/jp/app/google-authenticator/id388497605)
