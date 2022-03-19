---
title: "WordPressを使いやすくするためDockerfileをカスタマイズ"
description: "個人的な印象になるのですが、WordPress は開発・検証・本番などの各環境ごとに設定が微妙に異なっていくケースが多く見受けられます。そこで、ミドルウェアとアプリケーションをコード管理下における Docker に白羽の矢が立ちます。ミドルウェアの構築や WordPress のシステム設定をコード化することで、各環境でコンテナをビルドするだけでほぼ同一の環境が作れます。"
category: "wordpress"
tags: ["dockerfile", "wordpress"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/wordpress-dockerfile/thumbnail.png"
updatedAt: "2020-08-17"
createdAt: "2020-03-03"
---



### はじめに

個人的な印象になるのですが、WordPress はローカル・開発・検証・本番などの各環境ごとに設定が微妙に異なっていくケースが多く見受けられます。

というのも、WordPress では管理画面からシステム全体に影響を及ぼす設定を比較的簡単に変えられてしまうためです。裏を返せばこのおかげで初心者の方にも扱いやすいのかもしれません。

**ですが、環境ごとに差異があると、仕様変更や機能追加時に思わぬ挙動をする可能性があるのも事実です。**

**そこで、ミドルウェアとアプリケーションをコード管理下における Docker に白羽の矢が立ちます。**

ミドルウェアの構築や WordPress のシステム設定をコード化することで、各環境でコンテナをビルドするだけでほぼ同一の環境が作れます。ほぼなのは、接続先のデータベースにも設定情報が格納されているためです、、、。また、コード自体がインフラ設定のドキュメントにもなり一石二鳥です。

### やりたいこと

しかし、しかしなのです、Docker の公式で用意されている WordPress イメージは、ちょこちょこ使いづらいように思えます。そのため、**今回は下記の観点で独自でカスタマイズした Dockerfile を作成して、 WordPress 環境を構築してみました。**

- **日本語版 WordPress をインストールするように変更**
- **```/wp-content/plugins``` を Dockerfile で管理できるように変更**
- **重要な設定が保存される ```wp-config.php``` を Dockerfile から追加**
- **```/wp-content``` のパーミッションを変更してメディアファイルが保存できるように変更**

### 検証環境

- macOS Catalina バージョン 10.15.3
- docker desktop community Version 2.2.0.3

### 何はともあれ Dockerfile

だらだら説明するより今回作成した Dockerfile を見てもらえればです。[Docker公式の wordpress:php7.3-fpm-alpine イメージ](https://github.com/docker-library/wordpress/blob/0df5de06a4f43f2790dfc3be92554a7e229115d9/php7.3/fpm-alpine/Dockerfile)をベースに作成しています。

```dockerfile
FROM php:7.3-fpm-alpine

# Environment values
ARG WP_PATH
ARG WP_VERSION
ARG WP_LOCALE

# Initial setup
RUN set -ex; \
# 1) Install initial modules
    apk update; \
    apk add --no-cache \
            wget \
            unzip \
        bash \
        sed \
        ghostscript \
      mysql; \
# 2) Install php extension
  apk add --no-cache --virtual .build-deps \
    $PHPIZE_DEPS \
    freetype-dev \
    imagemagick-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libzip-dev; \
  docker-php-ext-configure gd --with-freetype-dir=/usr --with-jpeg-dir=/usr --with-png-dir=/usr; \
  docker-php-ext-install -j "$(nproc)" \
    bcmath \
    exif \
    gd \
    mysqli \
    opcache \
    zip; \
  pecl install imagick-3.4.4; \
  docker-php-ext-enable imagick; \
  runDeps="$( \
    scanelf --needed --nobanner --format '%n#p' --recursive /usr/local/lib/php/extensions \
      | tr ',' '\n' \
      | sort -u \
      | awk 'system("[ -e /usr/local/lib/" $1 " ]") == 0 { next } { print "so:" $1 }' \
  )"; \
  apk add --virtual .wordpress-phpexts-rundeps $runDeps; \
  apk del .build-deps; \
# 3) Create custom php.ini
# recommended opacache ini
  { \
    echo "opcache.memory_consumption=128"; \
    echo "opcache.interned_strings_buffer=8"; \
    echo "opcache.max_accelerated_files=4000"; \
    echo "opcache.revalidate_freq=2"; \
    echo "opcache.fast_shutdown=1"; \
  } > /usr/local/etc/php/conf.d/opcache-recommended.ini; \
# recommend log ini
  { \
    echo "error_reporting = E_ERROR | E_WARNING | E_PARSE | E_CORE_ERROR | E_CORE_WARNING | E_COMPILE_ERROR | E_COMPILE_WARNING | E_RECOVERABLE_ERROR"; \
    echo "display_errors = Off"; \
    echo "display_startup_errors = Off"; \
    echo "log_errors = On"; \
    echo "error_log = /dev/stderr"; \
    echo "log_errors_max_len = 1024"; \
    echo "ignore_repeated_errors = On"; \
    echo "ignore_repeated_source = Off"; \
    echo "html_errors = Off"; \
  } > /usr/local/etc/php/conf.d/error-logging.ini;

# Install Wordpress and plugins
RUN set -ex; \
# download wordpress
    wget "https://${WP_LOCALE}.wordpress.org/wordpress-${WP_VERSION}-${WP_LOCALE}.tar.gz"; \
    tar -xvzf "wordpress-${WP_VERSION}-${WP_LOCALE}.tar.gz" -C ${WP_PATH} --strip=1; \
    rm "wordpress-${WP_VERSION}-${WP_LOCALE}.tar.gz"; \
# download plugins
    wget https://downloads.wordpress.org/plugin/wp-multibyte-patch.2.8.3.zip; \
    unzip *.zip -d ${WP_PATH}/wp-content/plugins/; \
    rm *.zip;

# Copied wordpress config
ADD wp-config.php ${WP_PATH}/wp-config.php

# Change authority
RUN set -ex; \
  chmod -R 0707 \
  ${WP_PATH}/wp-content;
```

### ポイント

#### **日本語版の WordPress をインストールするように変更**

公式 Docker のイメージは英語版がデフォルトなので、今回は指定したロケール（国・地域）の WordPress をインストールできるようにしています。docker-compose.yml から Dockerfile に環境変数を受け取ってロケールを指定します。例えば、 ```WP_VERSION``` に  ```5.3.2``` 、 ```WP_LOCALE``` に ```ja``` を指定すると wodpress-5.3.2-ja がインストールされるようになります。

#### **Dockerfile**

```dockerfile
FROM php:7.3-fpm-alpine

# Environment values
ARG WP_PATH
ARG WP_VERSION
ARG WP_LOCALE

~~ 略 ~~

# Install WordPress and plugins
RUN set -ex; \
# download WordPress
    wget "https://${WP_LOCALE}.wordpress.org/wordpress-${WP_VERSION}-${WP_LOCALE}.tar.gz"; \
    tar -xvzf "wordpress-${WP_VERSION}-${WP_LOCALE}.tar.gz" -C ${WP_PATH} --strip=1; \
    rm "wordpress-${WP_VERSION}-${WP_LOCALE}.tar.gz";

~~ 略 ~~
```

#### **docker-compose.yml**

```yaml
~~ 略 ~~

  wordpress:
    build:
      context: "."
      args:
        WP_PATH: /var/www/html
        WP_VERSION: 5.3.2
        WP_LOCALE: ja

~~ 略 ~~
```

#### **プラグインを Dockerfile で管理できるように変更**

```/wp-content/plugins``` に ```wget``` で指定したプラグインのバージョンをダウンロードしてzip解凍しています。これによりコード上でプラグインを管理することができます。

```dockerfile
~~ 略 ~~

RUN set -ex; \
# download WordPress
    wget "https://${WP_LOCALE}.wordpress.org/wordpress-${WP_VERSION}-${WP_LOCALE}.tar.gz"; \
    tar -xvzf "wordpress-${WP_VERSION}-${WP_LOCALE}.tar.gz" -C ${WP_PATH} --strip=1; \
    rm "wordpress-${WP_VERSION}-${WP_LOCALE}.tar.gz"; \
# download plugins
    wget https://downloads.wordpress.org/plugin/wp-multibyte-patch.2.8.3.zip; \
    unzip *.zip -d ${WP_PATH}/wp-content/plugins/; \
    rm *.zip;

~~ 略 ~~
```

#### **重要な設定が保存される wp-config.php を Dockerfile から追加**

個人的にはここが一番苦労しました（汗）。

というのも公式で用意されているイメージはコンテナの build 時に Entrypoint のシェルスクリプトが wp-config.php を生成するようになっているため、 Dockerfile 側で Add や Copy したり、docker-compose.yml で volumes でマウントしたりしても、build 時に wp-config.php 自体が上書きされてしまうため、こちらで設定したい項目が消えてしまいます。

これに気付き、理解するのに本当に時間がかかりました、、、

それもあって、公式の Dockerfile を利用するのは諦めて、独自路線に舵を切りました。今となっては Dockerfile 内部の動きを多少なりにも理解できるようになったため良い経験になったと思っていますが、当時は絶望していました（笑）

そのため、今回は Entrypoint で wp-config.php を生成するのではなく、単純に ローカルで編集した wp-config.php を Dockerfile 側で追加するようにしています。

```yaml
# Copied WordPress config
ADD wp-config.php ${WP_PATH}/wp-config.php
```

#### **/wp-content のパーミッションを変更してメディアファイルを保存できるように変更**

良く見かける奴で画像や動画をアップロードできなくなる問題です。管理画面からファイルをアップロードする場合、一般ユーザーとしてサーバーにアクセスするのですが、この一般ユーザーに書き込み権限が与えられてないために起きるエラーのように見えます。

そのため Dockerfile側で```/wp-content``` のパーミッションを ```0707``` にして、管理画面からファイルをアップロードできるようにしています。

```yaml
# Change authority
RUN set -ex; \
  chmod -R 0707 \
  ${WP_PATH}/wp-content;
```

### おわりに

今回は WordPress を扱い易くするため独自にカスタマイズした Dockerfile を作成しました。ミドルウェアからアプリケーションまで コード管理下（Docker）に置くのは、設定のサーバ環境依存や属人化を防げたりと、開発や運面でも非常にメリットが大きいかなと思います。

また、個人的には、コアな設定を Docker に閉じ込めることで、コンテナデプロイが簡単になるのが何より美味しいかなと思っています（汗）

### 参考文献

- [公式 WordPress の Github の Dockerfile](https://github.com/docker-library/wordpress/blob/0df5de06a4f43f2790dfc3be92554a7e229115d9/php7.3/fpm-alpine/Dockerfile)
- [公式 WordPress の dockerhub](https://hub.docker.com/_/wordpress/)
