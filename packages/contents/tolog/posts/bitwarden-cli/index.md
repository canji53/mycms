---
title: "BitwardenのCLIをインストールしてコマンド操作"
description: "数多くあるパスワード管理ツールの中でも特にオススメしているのが Bitwardenです。エンジニア的な視点からCLI やセルフホスティングのサポートが何気においしいかなと思われます。npmやbrewで簡単にCLIをインストールでき、各種コマンドで簡単に保管庫からアイテムを引き出せます。そこで今回はこのBitwardenのCLIコマンドを個人利用の観点から簡単に共有させてください。"
category: "bitwarden"
tags: ["bitwarden", "cli", "npm"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/bitwarden-cli/thumbnail.png"
updatedAt: "2020-08-18"
createdAt: "2020-06-21"
---

## **はじめに**

数多くあるパスワード管理ツールの中でも特にオススメしているのが [Bitwarden（ビットウォーデン）](https://bitwarden.com/)です。

管理ツールの中でも後発ながらふつふつと人気を集めつつあり、ググればいかに便利かすぐに見つかります。

かく言う私も以前 [Bitwarden の紹介記事](https://www.tolog.info/bitwarden/bitwarden-introduction/)を書いていますが、個人的に便利な点を列挙すると、

1. マスターパスワードで煩雑なパスワード管理を一元化
2. 二段階認証を標準でサポート（もはや当たり前）
3. ブラウザ拡張機能でパスワードを自動補完できる
4. ランダムなパスワード生成でパスワードの複雑さを担保
5. **オープンソースなため開発が活発でコマンドラインインターフェース（CLI）やセルフホスティングも充実**

詳細は過去の記事や公式ページ、他の方の紹介記事に任せますが、エンジニア的な視点から 5. の CLI やセルフホスティングが嬉しいかなと思っています。

エンジニアの方は、ターミナルやプロンプト上でのコマンド操作に慣れている方も多いかと思いますが、**なんと Bitwarden は CLI での操作をサポートしています。** なので、GUI ベースのパスワード管理だけでなく、プログラミングや CI/CD にてシークレットキーなどを CLI で呼び出して挿入するなど、選択肢が大幅に広がるかと思います。（実運用や詳細な検証はしていないので検討する際は自己責任でお願いします）

個人的には、セルフホスティングと組み合わせて AWS や GCP の Secrets Manager に近い運用ができるのではないかと考えていたりしています。まぁ、それを用意するぐらいなら、Secrets Manager を使う方がコストが低く、サーバのことを考えなくて良いので遥かに効率的だとは思いますが（汗）

それでも、個人的な運用においては CLI によって前述のようなプログラマブルな選択肢が増えて、開発環境とかでは結構面白いかなと思っています。

そこで、**今回は Bitwarden を CLI で使う際のインストール方法やコマンド一覧を共有**できればと思います。

## **記事から得られる知見**

- Bitwarden CLI のインストール
- 主要なコマンド login、unlock、sync、list、get、create、edit、delete、restore の操作
- その他便利なコマンド import、export、generate、encode の操作

後述の内容は[公式ドキュメント](https://bitwarden.com/help/article/cli/)に沿ったもので、**個人で利用しそうなコマンドに絞って紹介しています。**

## **検証環境/対象読者**

### **検証環境**

- MacBook Pro (13-inch, 2017, Two Thunderbolt 3 ports)
- macOS Catalina バージョン 10.15.4
- 今回は npm でインストール/検証

```bash
$ nodebrew -v
nodebrew 1.0.1

$ npm -v
6.13.7
```

### **対象読者**

- Mac ユーザ
- Bitwarden を使ったことがある方

## **CLI をインストール**

下記はパッケージマネージャーでのインストール方法になります。

- npm の場合

```bash
$ npm install -g @bitwarden/cli
```

- Chocolatey

```bash
$ choco install bitwarden-cli
```

- Homebrew

```bash
$ brew install bitwarden-cli
```

- Snap

```bash
$ sudo snap install bw
```

## **初期フローの注意点**

CLI では保管庫を操作するのに下記の２つの流れが考えられます。**結論を言うと公式では２番目のフローを勧めています。**

- **login (セッションキー発行) > セッションを環境変数に追加 > 保管庫を操作**

```bash
# login
$ bw login [email] [password]
To unlock your vault, set your session key to the `BW_SESSION` environment variable. ex: $ export BW_SESSION="session_key" > $env:BW_SESSION="session_key"

# セッションキーを環境変数に追加
$ export BW_SESSION="session_key"

# 保管庫を操作（アイテム一覧を表示）
$ bw list items
```

- **login (セッションキー発行) > 保管庫の unlock (セッションキー発行) > セッションを環境変数に追加 > 保管庫を操作**

```bash
# login（session_keyが発行されますが無視します）
$ bw login [email] [password]
To unlock your vault, set your session key to the `BW_SESSION` environment variable. ex: $ export BW_SESSION="session_key_A" > $env:BW_SESSION="session_key_A"

# 保管庫をunlock
$ bw unlock [password]
To unlock your vault, set your session key to the `BW_SESSION` environment variable. ex: $ export BW_SESSION="session_key_B" > $env:BW_SESSION="session_key_B"

# セッションキーを環境変数に追加
$ export BW_SESSION="session_key_B"

# 保管庫を操作（アイテム一覧を表示）
$ bw list items
```

**セッションキーは保管庫を操作するのに必要となるキーで、環境変数に追加する必要があります。** もしくは、コマンド操作時にセッションキーを引数に渡して上げます。

```bash
$ bw list items --session [session_key]
```

### **login と unlock の違い**

ここで注意したいのが、`login` と `unlock` は別であるということです。

セッションキーを発行している点では同じなのですが、`login` はメールアドレスとマスターパスワードをもって外部の Bitwarden サーバに認証を行っており、対して `unlock` はマスターパスワードのみでローカル認証を行っています。

注目したいのは `unlock` **はインターネット接続が必要ではなく、ローカルで処理を完結している点**です。

そのため、公式では、一度 `login` を済ませて、以後は `lock` / `unlock` で保管庫を開け閉めすることを推奨しており、提供されている Bitwarden のクライアントアプリも同様のフローを行っているようです。

## **保管庫の管理コマンド一覧**

### **SYNC**

`sync` は Bitwarden サーバから暗号化された保管庫をローカルにダウンロードするコマンドになります。他のクライアント（ブラウザ拡張機能など）で保管庫を操作した場合、同期を取らないとローカル側にアイテム等が反映されません。そこで `sync` で同期を取ります。

```bash
$ bw sync
```

### **LIST**

`list` は指定オブジェクトの配列を保管庫から取り出すコマンドになります。

```bash
$ bw list (items|folders|collections|organizations|org-collections|org-members) [options]
```

また、[options] には、検索の `--search` オプションとフィルターの `--folderid` `--collectionid` `--organizationid` オプションが設定できます。両オプションを組み合わせた場合は、論理積（AND）となり、検索とフィルターどちらにも合致する結果が返されます。

```bash
$ bw list items --search github --folderid 9742101e-68b8-4a07-b5b1-9578b5f88e6f
```

また、フィルターに対して `null` や `notnull` のような null を許容するのかしないのかも指定でき、複数フィルターを組み合わせた場合は、論理和（OR）のような振る舞いになります。

```bash
$ bw list items --folderid null --organizationid notnull
```

### **GET**

`get` は単一のオブジェクトを保管庫から取り出すコマンドになります。

```bash
$ bw get (item|username|password|uri|totp|exposed|attachment|folder|collection|organization|org-collection|template|fingerprint) <id> [options]
```

\<id> にて各オブジェクトに割り振られる GUID を指定して取得するか、検索語句を指定して取得するかで分かれます。検索語句はヒットしないとエラーを返すので、ある程度明確である必要があります。

```bash
# コマンド例
$ bw get item 99ee88d2-6046-4ea7-92c2-acac464b1412
$ bw get password https://google.com
$ bw get totp google
$ bw get exposed yahoo.com
```

### **CREATE**

`create` は新しいオブジェクトを保管庫に作成するコマンドになります。

```bash
$ bw create (item|attachment|folder|org-collection) [encodedJson] [options]
```

[encodeJson] は JSON 文字列 を Base64 でエンコードした文字列なので、単純にオブジェクト生成用の JSON を渡してもうまくいきません。そのため、**JSON を Base64 に変換するステップを事前に踏む必要があります。**

#### **作成するオブジェクトの JSON テンプレートを確認**

```bash
# フォルダを作成する場合のテンプレート
$ bw get template folder
{"name":"Folder name"}
```

#### **テンプレートを編集**

```bash
# フォルダテンプレートを編集
- {"name":"Folder name"}
+ {"name":"sample"}
```

#### **JSON 文字列を Base64 でエンコード**

前ステップで編集したテンプレートを `echo` 後、|（パイプ）で `bw encode` に渡して Base64 にエンコードしています。`bw encode` は文字列を Base64 に変換するユーティリティコマンドになります。

```bash
$ echo '{"name":"sample"}' | bw encode
eyJuYW1lIjoic2FtcGxlIn0K
```

#### **いざオブジェクトを作成**

```bash
# コマンド結果のオブジェクトidは一部隠しています
$ bw create folder eyJuYW1lIjoic2FtcGxlIn0K
{"object":"folder","id":"***-3b44-***-94e8-abe******ea","name":"sample"}
```

#### **面倒なので jq でワンライナーする場合は**

慣れてくると４つのステップが面倒になるので、 | で処理を渡してワンライナーでオブジェクトを生成することもできます。

```bash
$ bw get template folder | jq '.name = "sample"' | bw encode | bw create folder
```

ただし、テンプレートを取得して指定要素を入れ替えるのに [jq](https://stedolan.github.io/jq/) を使う必要があります。普段から curl などのコマンド操作に慣れている方は既知かと思われますが、[jq は JSON を入力として受け取り様々な処理をした後にパーサーされた JSON を返すコマンド](https://qiita.com/bunty/items/a769ebabbdd324ff0d6f)になります。慣れれば死ぬほど便利なはずですが、よく忘れます（汗）

### **EDIT**

`edit` は保管庫内のオブジェクトを編集するコマンドになります。`create` と似ていますが、`edit` はオブジェクト ID を明示的に与えている点が違います。

```bash
$ bw edit (item|item-collections|folder|org-collection) <id> [encodedJson] [options]
```

```bash
# コマンド例
$ bw edit folder dadc91e0-dcda-4bc2-8cd6-52100027c782 eyJuYW1lIjoiV2hhdCBGb2xkZXIifQ==
$ bw get folder dadc91e0-dcda-4bc2-8cd6-52100027c782 | jq '.name = "Updated Folder"' | \
    bw encode | bw edit folder dadc91e0-dcda-4bc2-8cd6-52100027c782
$ echo '["86544cd3-7e07-42bb-ba3c-e7f59852acaa","ae8c6c9e-26de-442c-b63b-3e28ef61d72d"]' | \
    bw encode | bw edit item-collections db71c8d6-3e69-4593-a6de-505e94966290
```

### **DELETE**

`delete` は保管庫からオブジェクトを消すコマンドになります。同コマンドはデフォルトでは「ソフトな削除」つまりゴミ箱に一旦移動させます。永久的に削除したい場合は `-p, --permanent` オプションを追加します。

```bash
$ bw delete (item|attachment|folder|org-collection) <id> [options]
```

```bash
# コマンド例
$ bw delete folder dadc91e0-dcda-4bc2-8cd6-52100027c782
$ bw delete item 7063feab-4b10-472e-b64c-785e2b870b92 --permanent
```

### **RESTORE**

`restore` はゴミ箱からオブジェクトを復元するコマンドになります。

```bash
$ bw restore (item) <id> [options]
```

```bash
$ bw restore item 7063feab-4b10-472e-b64c-785e2b870b92
```

## **その他便利なコマンド一覧**

### **IMPORT**

`import` は Bitwarden もしくはその他エクスポートがサポートされているパスワード管理ツールからデータをインポートするコマンドになります。

```bash
$ bw import [<format> <input>] [--formats]
```

### **EXPORT**

`export` は暗号化された保管庫を CSV や JSON に変換してローカルに保存するコマンドになります。

```bash
$ bw export [password] [--output <filePath>] [--format <format>] [--organizationid <orgId>]
```

### **GENERATE**

`generate` はランダムなパスワードやパスフレーズを生成するコマンドになります。ぶっちゃけ、似たような機能は、どこにでもあるのですが、取り回しの良さから個人的に一番気に入っている機能です（汗）

```bash
$ bw generate [--lowercase --uppercase --number --special --length --passphrase --separator --words]
```

オプションを省力することも可能で（`--lowercase, -l`）、下記は実際のコマンド結果になります。

```bash
$ bw generate
d2LqBWKUacdov4

$ bw generate -u -l --length 18
AkwhxLnBMxpNuzmuvH

$ bw generate -ulns --length 25
PwWCbd*4my5Cx47HAxAw&amp;py^L

$ bw generate -p --words 5 --separator _
decimeter_gag_around_purposely_halt
```

### **ENCODE**

既に上述で示していますが `encode` は文字列を Base64 に変換するコマンドになります

```bash
$ <jsonString> | bw encode
```

## **おわりに**

正直に申し上げるとコマンド操作は慣れないと結構てこずります（汗）

ある程度自動化することを前提とするなら、オブジェクトの生成や編集はスクリプト化しておいて引数を与えるだけにするとかが考えらるかもしれないです。

もしくは、プログラマブルな目的で、パスワード管理ツールと言うよりは、シークレットマネージャー的な運用で隠匿したい環境変数を仕込むツールとして使うのもありかなと思います。あくまでも個人的な感想です（汗）

やはり、GUI ベースでクライアントアプリを使う方が普段利用は圧倒的に効率的です。単純に私が CLI を使いこなせていないだけなのですがね（汗）

## **参考文献**

- [[ Bitwarden ] Bitwarden home](https://bitwarden.com/)
- [[ toLog ] パスワードって１つで良いよね… by Bitwarden](https://www.tolog.info/bitwarden/bitwarden-introduction/)
- [[ Bitwarden 公式ドキュメント ] The Bitwarden command-line tool (CLI)](https://bitwarden.com/help/article/cli/)
- [[ jq ] jq home](https://stedolan.github.io/jq/)
- [[ Qiita ] jq コマンドで json から必要なデータのみを取得する](https://qiita.com/bunty/items/a769ebabbdd324ff0d6f)
