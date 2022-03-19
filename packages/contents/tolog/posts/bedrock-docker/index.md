---
title: "docker-compose、Composer、Bedrockでモダン開発"
description: "Bedrock はモダンな WordPress の開発環境を提供することを目的とし、Composer で簡単にインストールができます。依存関係が composer.json の１つのテキストファイルに集約されるので、Git 等でのバージョン管理もはかどります。また、docker-compose を併用すれば、ある程度モダンな開発環境も整えることができます。"
category: "wordpress"
tags: ["bedrock", "composer", "docker-compose"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/bedrock-docker/thumbnail.png"
updatedAt: "2020-10-29"
createdAt: "2020-06-10"
---

## **はじめに**

PHP のパッケージ管理と言えば Composer が上がりますが、WordPress でしか PHP を触ったことがなかった私は、今まで Composer を使う機会がほとんどありませんでした。現代の PHP 開発において Composer を使わないなんてあり得ないと思われますが、かく言う私も Composer を触り始めて何で使ってこなかったんだと後悔している状況です。

さて置き、Composer で WordPress を管理できるの？

**答えは可能です（知っていたら申し訳ないです）。**

[roots](https://roots.io/about/) がオープンソースプロジェクトのもと [Bedrock](https://roots.io/bedrock/) なる WordPress のボイラーテンプレートを開発しています。

**Bedrock はモダンな WordPress の開発環境を提供することを目的とし**、Composer で簡単にインストールすることができます。また、実はプラグインも Composer で管理できます。そのため、依存関係が composer.json の１つのテキストファイルに集約されるので、Git 等でのバージョン管理がはかどります。また、**docker-compose を併用すればインフラレベルでスクラップ＆ビルドして、ある程度モダンな開発環境も整えることができます。**

と言うよりは、こちらに開発/本番環境を移行するべきかと最近は考えています。私は当ブログを絶賛インフラを含めてリファクタリング/リプレイス作業中です。

そこで**今回は Bedrock の開発環境を docker-compose で構築する内容を共有したい**と思います。

> 現在、当ブログは WordPress ではなく Gatsby.js で構築されています :bow:

## TL; DR

リポジトリも用意しているので、さくっと見たい方はこちらを参照ください。
[https://github.com/canji53/bedoc](https://github.com/canji53/bedoc)

## **環境**

- MacBook Pro (13-inch, 2017, Two Thunderbolt 3 ports)
- macOS Catalina バージョン 10.15.4
- docker desktop community Version 2.3.0.3 (45519)

```bash
# グローバルでcomposerをインストール済
$ composer --version
Composer version 1.10.6 2020-05-06 10:28:10
```

## **手順**

以下の手順はあくまでも私が個人的に開発環境を整える一例になりますので、本番運用を含めたインフラ構築ではないことに留意いただければと思います。

また、以後の手順は PHP 界隈でとても有益な情報を提供してくださる**ゆうきゃん**さんの[最強の Laravel 開発環境を Docker を使って構築する【新編集版】](https://qiita.com/ucan-lab/items/5fc1281cd8076c8ac9f4#%E4%BD%BF%E3%81%84%E6%96%B9)」と[PHP7.4 ぼくのかんがえたさいきょうの php.ini](https://qiita.com/ucan-lab/items/0d74378e1b9ba81699a9)」の情報を多分に取り込んだ内容になっております。私の場合は Laravel ではなく、**WordPress の Bedrock に置き換えて個人的にカスタマイズしている**感じになります。

正直に申し上げると、上記の２つの参考文献は非常に有益な知見に富んでおり、上記文献で事足り、、、お暇があれば是非ともご一読願います。しっかりと要点が整理されており、技術記事としてちゃんと権威性があります（汗）

### **0. 完成後のディレクトリ構造**

全体像を掴むためにも予め完成後のディレクトリ構造を示しておきます。

```bash
# 一部不要なファイルやディレクトリは非表示にしています
$ tree ./ -aL 3

./
├── .env
├── docker
│   ├── bedrock
│   │   └── develop.env
│   ├── mysql
│   │   └── data
│   ├── nginx
│   │   └── conf.d
│   └── php
│       ├── Dockerfile
│       ├── conf.d
│       └── php-fpm.d
├── docker-compose.yml
├── mytheme -> src/web/app/themes/mytheme
└── src
    ├── .env
    ├── .gitignore
    ├── README.md
    ├── composer.json
    ├── composer.lock
    ├── config
    │   ├── application.php
    │   └── environments
    ├── phpcs.xml
    ├── vendor
    └── web
        ├── app
        ├── index.php
        ├── wp
        └── wp-config.php
```

### **1. Bedrcok の生成**

まず、`./src` と命名して Composer で Bedrock プロジェクトを生成します。

```bash
$ composer create-project roots/bedrock src

# 一部不要なファイルやディレクトリは非表示にしています
$ tree ./src -aL 3

./src
├── .env
├── .gitignore
├── README.md
├── composer.json
├── composer.lock
├── config
│   ├── application.php
│   └── environments
│       ├── development.php
│       └── staging.php
├── phpcs.xml
├── vendor
├── web
│   ├── app
│   │   ├── mu-plugins
│   │   ├── plugins
│   │   ├── themes
│   │   └── uploads
│   ├── index.php
│   ├── wp
│   └── wp-config.php
└── wp-cli.yml
```

少しだけディレクトリ構造を解説しますと、

- `./src/.env` は WordPress で使用する環境変数を簡単に追加するファイルです。
- `./src/config` には 開発/検証/本番 で使用する WordPress のシステム設定が記述されたファイルが格納されており、各ファイルは wp-config.php に相当しています。また、処理内容は `./src/.env` の環境変数を define 展開するようなものです。
- `./src/web/app` は実装したコードを配置するディレクトリで、wp-content に相当しています。
- `./src/web/wp` は WordPress のシステムコードが集約されており、開発者は基本的に触らずに隠匿しておきます。また、`./src/web/wp-config.php` も Bedrock では触る必要はありません。

### **2. ./docker-compose.yml と ./.env**

ひとまず、`./docker-compose.yml`

```yaml
version: "3"

services:
  mysql:
    image: mysql:5.7
    volumes:
      - ./docker/mysql/data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      TZ: "Asia/Tokyo"
    ports:
      - 3306:3306
    restart: always

  php:
    build:
      context: "."
      dockerfile: ./docker/php/Dockerfile
      args:
        - ENVIRONMENT=${ENVIRONMENT}
    volumes:
      - ./docker/php/conf.d/${ENVIRONMENT}.php.ini:/usr/local/etc/php/conf.d/php.ini
      - ./docker/php/php-fpm.d/zzz-www.conf:/usr/local/etc/php-fpm.d/zzz-www.conf
      - ./src:/var/www/html
      - ./docker/bedrock/${ENVIRONMENT}.env:/var/www/html/.env
      - php-fpm-socket:/var/run/php-fpm
    depends_on:
      - mysql
    restart: always

  nginx:
    image: nginx:stable-alpine
    volumes:
      - ./docker/nginx/conf.d/${ENVIRONMENT}.conf:/etc/nginx/conf.d/default.conf
      - ./src:/var/www/html
      - ./docker/bedrock/${ENVIRONMENT}.env:/var/www/html/.env
      - php-fpm-socket:/var/run/php-fpm
    ports:
      - 80:80
    depends_on:
      - php
    restart: always

volumes:
  php-fpm-socket:
```

docker-compose 側の `./env`

```env
# environment
ENVIRONMENT=develop

# mysql
DB_ROOT_PASSWORD=rootsample
DB_USER=wordpress
DB_PASSWORD=sample
DB_NAME=sample-dev
DB_HOST=mysql
```

#### **マウントしたい環境依存ファイルを可変に**

```yaml
volumes:
  - ./docker/php/conf.d/${ENVIRONMENT}.php.ini:/usr/local/etc/php/conf.d/php.ini
```

トリッキーなことをしているのは、docker 側の `.env` の環境変数 `ENVIRONMENT` で volumes する対象環境（ develop / staging / production ）のファイルを選定している点です。**これで、本番投入も楽になるかと考えていますが、まだ検証も済ませてないので、ファイルを直指定することをオススメします。**

プログラム的に記述すると、下記になるかと思います。

if (ENVIRONMENT == develop) { ${ENVIRONMENT}.php.ini = develop.php.ini; }

#### **args で Dockerfile に環境変数を渡して build 処理を可変に**

`docker-compose.yml`

```yaml
php:
  build:
    context: "."
    dockerfile: ./docker/php/Dockerfile
    args:
      - ENVIRONMENT=${ENVIRONMENT}
```

`Dockerfile`

```dockerfile
ARG ENVIRONMENT

RUN set -ex; \
    #    #
    # 略 #
    #    #
    # if develop-environment, install xdebug.
    if [ "${ENVIRONMENT}" = "develop" ]; then \
        echo "pecl install xdebug"; \
        echo "docker-php-ext-enable xdebug"; \
    fi; \
```

また、php コンテナでは args で `ENVIRONMENT` を引数として渡して、環境ごとに build 処理を変えています。ここでは、xdebug を導入するために処理を分岐させています。ただし、**シンプルな記述を求められる docker にてこの処理は褒められた方法ではありませんので、適宜変えることをオススメします。**

※ xdebug はデバッグ内容が筒抜けになってしまうため本番環境では絶対に投入しないようお願いします。

#### **UNIX ドメインソケットをマウントして socket 通信**

`docker-compose.yml`

```yaml
php:
  volumes:
    - php-fpm-socket:/var/run/php-fpm

nginx:
  volumes:
    - php-fpm-socket:/var/run/php-fpm
```

`nginx.conf`

```conf
location ~ \.php$ {
  include fastcgi_params;
  try_files $uri =404;
  fastcgi_split_path_info ^(.+\.php)(/.+)$;
  fastcgi_pass unix:/var/run/php-fpm/php-fpm.sock;
  fastcgi_index index.php;
  fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
  fastcgi_param PATH_INFO $fastcgi_path_info;
}
```

socket 通信は TCP 通信に比べてスループット（単位時間あたりの処理能力）が向上するらしく、今回はこちらを採用しています。後述する php-fpm の conf にて UNIX ドメインソケットを `/var/run/php-fpm` に格納するため、こちらを nginx 側にもマウントしておきます。nginx の conf で fastcgi_pass に `/var/run/php-fpm/php-fpm.sock` を指定するとソケット通信が可能になります。

### 3. **各コンテナ（./docker）の詳細設定**

```bash
# 一部不要なファイルやディレクトリは非表示にしています
$ tree ./docker -L 3

./docker
├── bedrock
│   └── develop.env
├── mysql
│   └── data
├── nginx
│   └── conf.d
│       └── develop.conf
└── php
    ├── Dockerfile
    ├── conf.d
    │   └── develop.php.ini
    └── php-fpm.d
        └── zzz-www.conf
```

基本的に環境依存のファイルが格納されていますが、環境名をプリフィックスに持つことで、個人的に管理しやすくしています。

#### **./docker/bedrock**

`./docker/bedrock/develop.env`

```env
DB_NAME='sample-dev'
DB_USER='wordpress'
DB_PASSWORD='sample'

# Optionally, you can use a data source name (DSN)
# When using a DSN, you can remove the DB_NAME, DB_USER, DB_PASSWORD, and DB_HOST variables
# DATABASE_URL='mysql://database_user:database_password@database_host:database_port/database_name'

# Optional variables
DB_HOST='mysql'
DB_PREFIX='wp_'

WP_ENV='development'
WP_HOME='http://localhost'
WP_SITEURL="${WP_HOME}/wp"
WP_DEBUG_LOG=/path/to/debug.log

# 以下略
```

同ファイルは Bedrock の `./src/.env` からコピーしたものになります。src 直下で 各環境ごとの .env ファイルを管理しても良いのですが、マウント時の処理が複雑化するので src から切り離して ./docker/bedrock/ 下においています。

#### **./docker/mysql/data**

mysql のデータディレクトリをマウントすることで DB を永続化しています。

#### **./docker/nginx**

`./docker/nginx/develop.conf`

```conf
server {
  listen 80;
  listen [::]:80;
  server_name localhost;

  root /var/www/html/web;
  index index.php;

  access_log /var/log/nginx/access.log;
  error_log  /var/log/nginx/error.log;

  gzip on;
  gzip_disable "MSIE [1-6]\\.(?!.*SV1)";
  gzip_vary on;
  gzip_types text/plain text/css text/javascript image/svg+xml image/x-icon application/javascript application/x-javascript;

  location / {
    try_files $uri $uri/ /index.php$is_args$args;
  }

  location ~ \.php$ {
    include fastcgi_params;
    try_files $uri =404;
    fastcgi_split_path_info ^(.+\.php)(/.+)$;
    fastcgi_pass unix:/var/run/php-fpm/php-fpm.sock;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_param PATH_INFO $fastcgi_path_info;
  }
}
```

ポイントとしては速度面を考慮して TCP ソケットではなく、UNIX ドメインソケットを使用している点です。[どうも TCP に比べて UNIX ドメインは遥かにスループットが優れてるらしいです。](https://qiita.com/kuni-nakaji/items/d11219e4ad7c74ece748)

また、[ gzip を使ってコンテンツの圧縮配信](https://qiita.com/RyoMa_0923/items/55078f6fb57e9d70a37f)も対応させています。

#### **./docker/php**

`./docker/php/Dockerfile`

```dockerfile
FROM php:7.3-fpm-alpine

ARG ENVIRONMENT

# Initial setup
RUN set -ex; \
    # 1) Install initial modules
    apk update; \
    apk add --no-cache \
        bash \
        sed \
        ghostscript; \
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
    # if develop-environment, install xdebug.
    if [ "${ENVIRONMENT}" = "develop" ]; then \
        echo "pecl install xdebug"; \
        echo "docker-php-ext-enable xdebug"; \
    fi; \
    runDeps="$( \
        scanelf --needed --nobanner --format '%n#p' --recursive /usr/local/lib/php/extensions \
        | tr ',' '\n' \
        | sort -u \
        | awk 'system("[ -e /usr/local/lib/" $1 " ]") == 0 { next } { print "so:" $1 }' \
        )"; \
    apk add --virtual .wordpress-phpexts-rundeps $runDeps; \
    apk del .build-deps;
```

[WordPress の 公式 Docker イメージ](https://github.com/docker-library/wordpress/blob/8215003254de4bf0a8ddd717c3c393e778b872ce/php7.3/fpm/Dockerfile)を参考に、イメージをデトックスするために RUN で単一実行できるようにしています。また、前述しましたが、**docker-compose 側から args で引数を受け取り、develop 環境時に xdebug をインストールする**ようにしています。ただし、こちらの条件分岐は、なるべくシンプルな記述が求められる Docker においてはアンチパターンかなと思います。

`./docker/php/conf.d/develop.conf`

```conf
zend.exception_ignore_args = Off
expose_php = On
max_execution_time = 30
max_input_vars = 1000
upload_max_filesize = 128M
post_max_size = 128M
memory_limit = 128M

; error logging
error_reporting = E_ALL
display_errors = On
display_startup_errors = On
log_errors = On
error_log = /var/log/php/php-error.log
ignore_repeated_errors = On
ignore_repeated_source = On
html_errors = On

default_charset = UTF-8

[mysqlnd]
mysqlnd.collect_memory_statistics = On

[Assertion]
zend.assertions = 1

[mbstring]
mbstring.language = Japanese

[xdebug]
xdebug.remote_enable = 1
xdebug.remote_autostart = 1
xdebug.remote_host = host.docker.internal
xdebug.remote_port = 9001
xdebug.remote_log = /tmp/xdebug.log

[opcache]
opcache.enable = 1
opcache.memory_consumption = 64
opcache.interned_strings_buffer = 8
opcache.max_accelerated_files = 4000
opcache.validate_timestamps = 1
opcache.revalidate_freq = 60
opcache.huge_code_pages = 0
opcache.fast_shutdown = 1
```

`./docker/php/php-fpm.d/zzz-www.conf`

```conf
[www]
listen = /var/run/php-fpm/php-fpm.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0666
```

こちらの develop.conf と zzz-www\.conf はゆうきゃんさんの「[PHP7.4 ぼくのかんがえたさいきょうの php.ini](https://qiita.com/ucan-lab/items/0d74378e1b9ba81699a9)」を参考に作成しており、詳しい内容は前述のリンクに飛んで詳細に確認していただければと思います。

### **4. （オプション）自テーマをシンボリックリンク**

```bash
$ ln -s ./src/web/app/themes/mytheme ./mytheme
```

自テーマを開発するディレクトリは src の下層の themes までネストしており、さらに mytheme も開発が進むにつれネストするのは必定なので、見通しをよくするためにも私は作業ディレクトリのルートにシンボリックリンクを貼っています。また、mytheme と味気ない名前を付けていますが、必要に応じてリネームしてください。

### **5. docker-compose を起動**

```bash
$ docker-compose up -d
```

ブラウザで http://localhost にアクセスして WordPress のインストール画面が出てきたら開発環境の構築は完了です。

### **6. Composer で プラグインをインストール**

```bash
$ composer require wpackagist-plugin/safe-redirect-manager
$ composer require wpackagist-plugin/simple-page-ordering
$ composer require wpackagist-plugin/woocommerce
```

プラグインのインストールは require で一発です。ただし、WordPress のプラグインやテーマを Composer リポジトリとして提供する [WordPress Packagist](https://wpackagist.org/) で検索できないプラグインはインストールすることができません。Composer を導入しても肝心のプラグインがインストールできないとなると中途半端な環境移行になり、却ってコストがかさむ可能性もあります。そのため、予め WordPress Packagist にプラグインが存在しているかチェックしてもらえればと思います。

## **おわりに**

ここまで比較的モダンな WordPress 環境を整えるのに奮闘しましたが、まだまだ問題点はあります。それは DB に WordPress のシステム設定が保持されている点です。これによって環境ごとに構成がバラつき、環境差異によるデプロイ困難が起きるなど、問題はまだまだ山積しております。

それを解決する手段として、[wp-cfm](https://ja.wordpress.org/plugins/wp-cfm/) と呼ばれるプラグインがあります。Composer でもインストール可能です。同プラグインは、DB に保持する設定を json 形式で diff / pull / push できる優れものです。これを使うことで限りなく環境ごとの DB の差異をコマンド形式で埋めることが可能になります（ただし 100%ではありません）。

まだ、検証が済んでいないので導入にまで至っていませんが、運用までもっていけたら、また記事を書きたいなと考えております。

## **参考文献**

- [[公式] roots/about](https://roots.io/about/)
- [[公式] roots/bedrock</a>](https://roots.io/bedrock/)
- [[Qiita] 最強の Laravel 開発環境を Docker を使って構築する【新編集版】](https://qiita.com/ucan-lab/items/5fc1281cd8076c8ac9f4)
- [[Qiita] PHP7.4 ぼくのかんがえたさいきょうの php.ini](https://qiita.com/ucan-lab/items/0d74378e1b9ba81699a9)
- [[Qiita] 調べなきゃ寝れない！と調べたら余計に寝れなくなったソケットの話](https://qiita.com/kuni-nakaji/items/d11219e4ad7c74ece748)
- [[Qiita] Nginx でコンテンツに対して gzip 圧縮をかける](https://qiita.com/RyoMa_0923/items/55078f6fb57e9d70a37f)
- [[Github] docker-library/wordpress](https://github.com/docker-library/wordpress/blob/8215003254de4bf0a8ddd717c3c393e778b872ce/php7.3/fpm/Dockerfile)
- [WordPress Packagist](https://wpackagist.org/)
- [[WordPress] WP-CFM プラグイン](https://ja.wordpress.org/plugins/wp-cfm/)
