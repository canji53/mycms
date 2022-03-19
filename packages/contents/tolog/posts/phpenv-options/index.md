---
title: "macのphpenvで7.3.17のインストールをオプション周りで何とかした件"
description: "phpenvでPHP7.3.17のインストールした際に起きたエラーをdefault_configure_optionsと言うファイルに依存パッケージのパスを追加して解決しました。ただし、libeditに関してはコマンド上でPHP_BUILD_CONFIGURE_OPTSと言うオプションを使ってパスを指定して上げる必要があります。"
category: "php"
tags: ["phpenv"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/phpenv-options/thumbnail.png"
updatedAt: "2020-08-17"
createdAt: "2020-04-19"
---

## **はじめに**

Python や Node.js はバージョン管理を行っているのですが PHP ではしたことないなと思い、軽い気持ちで mac に [phpenv](https://github.com/phpenv/phpenv) / [phpbuild](https://github.com/php-build/php-build) を使ってみようと手を出したのですが、これが結構苦労しました、、、

主にエラーの原因は２点上げられました。

- 依存関係のあるパッケージの未インストール
- **PHP インストール時のコンパイルオプション指定の不十分**

１つ目は ソースからコンパイル・ビルドすると良く起こる問題で yum や apt で依存関係を解決する経験は何度もあったので、mac 環境であれば `homebrew` を使って必要なパッケージを入れてあげます。

問題は ２つ目です。

phpenv も内部的にはソースを落としてコンパイル・ビルドをしています。

ソースを落として `./configure` されたことがある方はピンと来るかもしれませんが、依存関係のあるパッケージのパスをオプションで指定しないとコンパイラ側が認識できない場合があります。

実際に、下記のようなエラーに遭遇するのではないかと思います。

```bash
$ phpenv install 3.7.17

~~略~~

-----------------
|  BUILD ERROR  |
-----------------

Here are the last 10 lines from the log:

-----------------------------------------
configure: error: Cannot find zlib
-----------------------------------------

The full Log is available at '/tmp/php-build.7.3.17.20200417135632.log'.
[Warn]: Aborting build.
```

`zlib` は入れてるのに何故かエラーになってしまう。

**エラーそのままに phpenv 側が zlib を発見できていないので、オプションを追加してパス指定して上げる必要があります。**

また、このようなエラーは他の依存関係でも同様に起こりえます。

## **環境**

- macOS Catalina 10.15.4
- zsh 5.7.1
- php 7.3.17 をインストール

## **手順**

### **依存関係のインストール**

```bash
# あくまでも私の環境で必要とされたパッケージです

$ brew update
$ brew install \
    krb5 \
    openssl \
    re2c \
    bison@2.7 \
    libxml2 \
    zlib \
    BZip2 \
    libiconv \
    libedit \
    tidy-html5 \
    libzip;
```

### **default_configure_options にオプション追加**

phpenv ではインストール時のコマンドオプションが `default_configure_options` と言うファイルで管理されています。

なるべく不要なオプションをコマンドに載せたくない身としては、同ファイルで依存パッケージのパスを指定しています。

#### 初期状態

```bash
$ cat ~/.phpenv/plugins/php-build/share/php-build/default_configure_options
--enable-sockets
--enable-exif
--with-zlib
--with-zlib-dir=/usr
--with-bz2
--enable-intl
--with-kerberos
--with-openssl
--enable-soap
--enable-xmlreader
--with-xsl
--enable-ftp
--enable-cgi
--with-curl=/usr
--with-tidy
--with-xmlrpc
--enable-sysvsem
--enable-sysvshm
--enable-shmop
--with-mysqli=mysqlnd
--with-pdo-mysql=mysqlnd
--with-pdo-sqlite
--enable-pcntl
--with-readline
--enable-mbstring
--disable-debug
--enable-fpm
--enable-bcmath
--enable-phpdbg
```

#### 変更後

```bash
cat ~/.phpenv/plugins/php-build/share/php-build/default_configure_options
--enable-sockets
--enable-exif
--with-zlib
--with-zlib-dir=/usr/local/opt/zlib
--with-bz2=/usr/local/opt/bzip2
--enable-intl
--with-kerberos
--with-openssl
--enable-soap
--enable-xmlreader
--with-xsl
--enable-ftp
--enable-cgi
--with-curl=/usr
--with-tidy=/usr/local/opt/tidy-html5
--with-xmlrpc
--enable-sysvsem
--enable-sysvshm
--enable-shmop
--with-mysqli=mysqlnd
--with-pdo-mysql=mysqlnd
--with-pdo-sqlite
--enable-pcntl
--with-readline
--enable-mbstring
--disable-debug
--enable-fpm
--enable-bcmath
--enable-phpdbg
--with-iconv=/usr/local/opt/libiconv
--with-libedit=/usr/local/opt/libedit
--with-libzip=/usr/local/opt/libzip
```

### **libedit だけは PHP_BUILD_CONFIGURE_OPTS でオプション追加**

**libedit は default_configure_options でパスを追加してもエラーになってしまいます。**

```bash
-----------------
|  BUILD ERROR  |
-----------------

Here are the last 10 lines from the log:

-----------------------------------------
configure: error: Please reinstall libedit - I cannot find readline.h
-----------------------------------------

The full Log is available at '/tmp/php-build.7.3.17.20200418144551.log'.
[Warn]: Aborting build.
```

どうも[こちらの方の記事](https://qiita.com/dounokouno/items/686dc189584e43d6825e)を参考にすると php-build 側で default_configure_options より build 時のソース側の処理で `--without-libedit` が上書きされてパス指定が消されるようです。

build 処理を直接変更しても良さそうですが何が起きるか分からないので、今回は `PHP_BUILD_CONFIGURE_OPTS` でコマンド上でパス指定を追加してあげます。

```bash
$ PHP_BUILD_CONFIGURE_OPTS="--with-libedit=$(brew --prefix libedit)" phpenv install 7.3.17
```

## **おわりに**

pyenv に比べて若干です、若干ですが、めんどくさいです。

有志の方が無料で作っているツールを使っといて何言ってんだなのですが、、、

また、phpenv は ruby の rbenv をベースに作られているようで、rbenv とのバージョン干渉が起きるらしく、実際に私の方でもおかしな挙動を示すときがあります。

そこらへんの問題は気にしたくない方は、[phpbrew](https://github.com/phpbrew/phpbrew/blob/master/README.ja.md) を選択するのが無難かもしれないです。

問題なくバージョン管理自体はできているのですが、ちょっとした後悔です。

## **参考文献**

- [[ Github ] phpenv/phpenv](https://github.com/phpenv/phpenv)
- [[ Github ] php-build/php-build](https://github.com/php-build/php-build)
- [[ Qiita ] macOS 10.14 + phpenv + php-build で configure: error: Please reinstall libedit - I cannot find readline.h](https://qiita.com/dounokouno/items/686dc189584e43d6825e)
- [[ Github ] phpbrew/README.ja.md](https://github.com/phpbrew/phpbrew/blob/master/README.ja.md)
