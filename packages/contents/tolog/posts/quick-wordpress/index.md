---
title: "さくっとWordpressのローカル開発環境をDockerComposeで構築（DNMP）"
description: "当ブログは Wordpress で構築しているのですが、開発時は Docker Compose でさくっと開発環境を構築しました。さくっとは嘘ですが、nginx、alpine、phpmyadminなどを含めてなるべく使い易い開発環境を整えました。"
category: "wordpress"
tags: ["docker", "docker-compose", "wordpress"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/quick-wordpress/thumbnail.png"
updatedAt: "2020-10-29"
createdAt: "2020-03-03"
---

## はじめに

今更 WordPress かと思われますが、**[世の中の 35.8% の Web サイトが WordPress で作成されている](https://w3techs.com/technologies/details/cm-wordpress)** と聞くと無視することはできません。例に漏れず当ブログも WordPress で構築されているのですが、開発時には **Docker Compose を用いてさくっとローカル開発環境を構築しました。**

さくっと？嘘です（笑）

ドッカーのドの字も知らなかった私は調子をこいて MAMP ではなく、Docker と Docker Compose を選択したのです。メチャクチャ苦労しました。**と言うのも当初は [Docker 公式ガイドの WordPress の docker-comppose.yml](http://docs.docker.jp/compose/wordpress.html) を利用していたのですが、これが使いづらく、どうしても内部の処理まで踏み込む必要があったためです。**

そこで、今回は個人的にですが、ある程度開発しやすいだろう docker-compose.yml を共有したいと思います。**こちらを使えば、おそらく、たぶん、さくっとローカル開発環境を作れると思います（汗）**

> 現在、当ブログは WordPress ではなく Gatsby.js で構築されています :bow:

## やりたいこと

下記の観点で docker-compose.yml を作成しています。

- **Nginx を Web サーバに採用**
- **ミドルウェア単位でコンテナ化**
- **Alpine ディストリビューションで軽量化を目論む**
- **phpMyAdmin も添えて開発し易く**

**D**ocker、**N**ginx、**M**ysql、**P**HP で構築しているので頭文字を取って **DNMP（ディエヌエムピー）** と勝手に読んでいます（笑）

[Github にも置いているので参考にしてもらえればと思います。](https://github.com/canji53/quick_wordpress_by_DNMP)

## 検証環境

- macOS Catalina バージョン 10.15.3
- docker desktop community Version 2.2.0.3

## docker-compose.yml in DNMP...

だらだら説明するより、 今回作成した docker-compose.yml と Nginx の default.conf を見てもらえたらと思います。

### docker-compose.yml

```yaml
version: "3"

services:
  db:
    image: mysql:5.7
    volumes:
      - ./mysql/db:/var/lib/mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: wordpress
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress

  phpmyadmin:
    image: phpmyadmin/phpmyadmin:fpm-alpine
    volumes:
      - shared_phpmyadmin:/var/www/html
      - ./phpmyadmin/sessions:/sessions
    depends_on:
      - db
    restart: always
    environment:
      PMA_HOST: db:3306

  wordpress:
    image: wordpress:php7.3-fpm-alpine
    volumes:
      - shared_wordpress:/var/www/html
      - ./mytheme:/var/www/html/wp-content/themes/mytheme
    depends_on:
      - db
    restart: always
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_PASSWORD: wordpress

  nginx:
    image: nginx:stable-alpine
    volumes:
      - shared_wordpress:/var/www/html
      - shared_phpmyadmin:/var/www/html/phpmyadmin
      - ./mytheme:/var/www/html/wp-content/themes/mytheme
      - ./default.conf:/etc/nginx/conf.d/default.conf
    ports:
      - 8000:80
    depends_on:
      - phpmyadmin
      - wordpress
    restart: always

volumes:
  shared_wordpress:
    driver: local
  shared_phpmyadmin:
    driver: local
```

### default.conf

```conf
server {

  listen 80;
  listen [::]:80;
  server_name localhost;

  root /var/www/html;
  index index.php index.html index.htm;

  access_log /var/log/nginx/access.log;
  error_log  /var/log/nginx/error.log;

  location / {
    try_files $uri $uri/ /index.php$is_args$args;
  }

  # wordpress
  location ~ \.php$ {
    include fastcgi_params;
    try_files $uri =404;
    fastcgi_split_path_info ^(.+\.php)(/.+)$;
    fastcgi_pass wordpress:9000;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_param PATH_INFO $fastcgi_path_info;
  }

  # phpmyadmin
  location ^~ /phpmyadmin {

    alias /var/www/html/phpmyadmin;
    try_files $uri $uri/ @phpmyadmin;

    location ~ ^/phpmyadmin/(.+\.php)$ {
      include fastcgi_params;
      fastcgi_split_path_info ^\/phpmyadmin\/(.+\.php)(.*)$;
      fastcgi_pass phpmyadmin:9000;
      fastcgi_param SCRIPT_FILENAME $fastcgi_script_name;
    }
  }
}
```

## volumes で何をどこにマウントしたいのか？

今回結構詰まったのが docker-compose.yml におけるマウントの扱い方でした。と言うのも何をマウントしたいのかを明確に理解しないと思ったように動かなかったためです。docker-compose.yml の volumes でマウントする際に、**ローカルとコンテナ間をマウント**したいのか、それとも**コンテナ間でマウントしたいのか**、を明確に区別して理解することが結構重要だと思われます。

### **ローカルとコンテナの間のマウント**

ローカルからコンテナへのマウントは、基本ローカルでゴリゴリと編集するソースや設定ファイル、もしくはローカルで永続化したいデータかと思います。**コンテナは起動終了するとそれまで編集していたデータが消えてしまいます。そのため、自身で編集したファイルを終了する前にローカルに保存するか、もしくはコンテナからマウントするかでローカルに永続化させます。**

```yaml
## ローカルの設定ファイルをコンテナのnginxにマウントする場合
volumes:
  - ./sample.conf:/etc/ngin/conf.d/sample.conf

## mysqlのデータをローカルにマウントして永続化する場合
volumes:
  - ./.data/db:/var/lib/mysql
```

### **コンテナとコンテナの間のマウント**

対して、**コンテナ間のファイルやディレクトリを同期したい場合は、ローカルはあくまでも中継地点になる**かと思います。下記はローカルを経由して WordPress コンテナ内の `/wordpress` ディレクトリを nginx コンテナの公開ディレクトリにマウントする例です。

```yaml
wordpress:
  volumes: shared_source:/var/www/html/wordpress

nginx:
  volumes: shared_source:/var/www/html

volumes:
  shared_source:
    driver: local
```

### **コンテナ間でマウントされた場所の子ディレクトリにローカルから何かをマウントした場合、その何かはコンテナ間で共有化できない**

表題が長いですが、言いたいことはそれです（汗）
結構詰まったのですが、文章で説明するとピンと来ないかもしれないので、下記の例を見てもらえればと思います。

#### **ダメな例　 ×**

```yaml
wordpress:
    volumes:
      - shared_wordpress:/var/www/html
      - ./mytheme:/var/www/html/wp-content/themes/mytheme

  nginx:
    volumes:
      - shared_wordpress:/var/www/html
```

#### **良い例　 ◯**

```yaml
wordpress:
    volumes:
      - shared_wordpress:/var/www/html
      - ./mytheme:/var/www/html/wp-content/themes/mytheme

  nginx:
    volumes:
      - shared_wordpress:/var/www/html
      - ./mytheme:/var/www/html/wp-content/themes/mytheme
```

２つの例では、`./mytheme` を wordpress コンテナの `/var/www/html/themes/mytheme` にどちらもマウントしているのですが、ダメな例では、同ディレクトリを nginx 側にはマウントしていません。一見、ダメな例では親ディレクトリの `/var/www/html` をコンテナ間でマウントしているので、自ずとその子ディレクトリの `/var/www/html/themes/mytheme` も共有されると考えていたのですが、nginx コンテナ側の該当ディレクトリには何も存在しませんでした。

**そのため、コンテナ間でマウントしている場所に、ローカルから何かをマウントする場合は、各コンテナの同一のディレクトリにマウントする必要があります。**

## おわりに

今回作成した **Docker Compose を使うことで、ローカル開発環境であればコマンド１つで簡単に環境を構築することが出来るようになると思います。**
インフラを何回もスクラップ＆ビルドする Docker と Docker Compose を使うことで、WordPress のサーバー環境依存をある程度低減することもできます。

ですが、**それでも本番でコンテナ運用するにはまだまだ課題点だらけ**です。
コアファイルの wp-config.php を如何にコンテナ起動時に制御するのか、wp-content のパーミッション変更をどのように自動化するのか、などなど、やることは山のようにあります、、、

長くなるので今回はここまでにして、またどこかでその話をできればと思います（汗）

## 参考文献

- [W3Techs - Usage statistics and market share of WordPress -](https://w3techs.com/technologies/details/cm-wordpress)
- [クイックスタート・ガイド：Docker Compose と Wordpress](http://docs.docker.jp/compose/wordpress.html)
