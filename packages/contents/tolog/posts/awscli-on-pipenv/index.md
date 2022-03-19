---
title: "AWSCLIv1をPipenvで管理したい"
description: "私は下記の観点のもと AWS CLI を Python のバージョン・パッケージ管理と仮想環境を使ってプロジェクト単位でインストールしています。身も蓋もないですが、ローカル環境をあまり汚したくない。Python のパッケージ管理で AWS CLI 自体のバージョン管理が行える。パッケージ + Git 管理下で、新たな端末または他者にも AWS CLI の環境構築が展開しやすくなる。CICDツール や AWS の CodeDeploy を導入している際にどの道必要となる場合がある。"
category: "aws"
tags: ["awscli", "pipenv"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/awscli-on-pipenv/thumbnail.png"
updatedAt: "2020-08-17"
createdAt: "2020-04-19"
---

### はじめに

私は下記の観点のもと **AWS CLI を Python のバージョン・パッケージ管理と仮想環境を使ってプロジェクト単位でインストールしています。**

- 身も蓋もないですが、ローカル環境をあまり汚したくない
- Python のパッケージ管理で AWS CLI 自体のバージョン管理が行える
- **パッケージ + Git 管理下で、新たな端末または他者にも AWS CLI の環境構築が展開しやすくなる**
- CICD ツール や AWS の CodeDeploy を導入している際にどの道必要となる場合がある

基本的にはパッケージ管理による恩恵が大きいですが、AWS CLI もパッケージ管理下に置くことで、AWS との連携も含めた柔軟な環境構築が可能になります。

**Python のバージョン・パッケージ管理・仮想環境構築のとして [pyenv](https://github.com/pyenv/pyenv) + [Pipenv](https://pipenv-ja.readthedocs.io/ja/translate-ja/) を選択しています。**

ここら辺の[ベストプラクティス](https://qiita.com/sk217/items/43c994640f4843a18dbe)は正直自分には分かりません（汗）、職場の状況やチームの規模に応じて柔軟に対応できるかが重要かなと思います。

### 注意点

AWS CLI を仮想環境に[インストールする手順は公式でも用意](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/install-virtualenv.html)されていますが、そちらは `virtualenv` を使用しており、本記事は `pyenv + Pipenv` を対象としております。

**また、2020 年 1 月 10 日から AWS CLI の Python インストールのバージョン要件が 2 系は 2.7 以上、3 系は 3.4 以上になりました。**

上記のような変更も時たまあるため、なるべく柔軟に対応するためにもバージョン管理はしておいた方が良いかなと思っています。

現在、AWS CLI v2 が 2020 年 2 月 10 日からリリースされており、そちらが最新のメジャーバージョンになっていますが、**本記事では AWS CLI v1 を対象としております。** はっきりと追えているわけではないですが、AWS CLI v2 では Python 依存がなくなったので、プロジェクト単位で管理するなら Docker が前提になるのかなと思っています。

### やりたいこと

- AWS CLI v1 を pyenv + Pipenv のパッケージ管理下において、比較的簡単に環境構築してみる
- ローカルから AWS CLI v1 のコマンドを打って接続を確認する

### 対象環境とユーザー

- macOS Catalina バージョン 10.15.3
- デフォルトシェルが zsh
- **homebrew が既にインストール済み**

### AWS CLI のインストール

#### **pyenv のインストール**

まず、homebrew 経由で pyenv をインストール

```bash
$ brew update
$ brew install pyenv
```

pyenv の path を `~/.bash_profile` に追加

```bash
$ echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bash_profile
$ echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bash_profile
$ echo 'eval "$(pyenv init -)"' >> ~/.bash_profile
$ source ~/.bash_profile # 必ずして下さい、設定が反映されません
```

pyenv のインストール確認

```bash
$ pyenv version
3.*.* (set by /Users/hoge/.pyenv/version) # バージョンが表示されればOK
```

#### **python をインストール**

pyenv で 3.4 以上の python をインストール（AWS CLI が 3.4 以降をサポート）

```bash
$ pyenv install -list # インストール可能なpythonのバージョンリスト表示
$ pyenv install 3.7.4
```

python 3.7.4 が global（≒ 標準）で動くように設定

```bash
$ pyenv global 3.7.4
$ python --version
Python 3.7.4
```

#### **Pipenv のインストール**

pip でインストール、、、（homebrew でもインストールできますが試してません）

```bash
$ pip install pipenv
$ pipenv version
pipenv, version 2018.11.26
```

当該ディレクトリを pipenv 管理下に変更

```bash
$ mkdir hoge
$ cd hoge
$ pipenv --python 3.7.4
$ pipenv shell

(hoge) $ # とカレントディレクトリ名が（）に囲まれてshellの先頭に現れます
```

#### **やっと AWS CLI v1 をインストール**

pipenv 内では `pipenv install` でインストールします、`--dev` をオプションにつけることで開発と本番を切り分けられます。

```bash
(hoge)$ pipenv install --dev awscli
(hoge)$ pip list

Package         Version
--------------- -------
awscli          1.18.11
botocore        1.15.11
colorama        0.4.3
docutils        0.15.2
jmespath        0.9.5
pip             20.0.2
pyasn1          0.4.8
python-dateutil 2.8.1
PyYAML          5.2
rsa             3.4.2
s3transfer      0.3.3
setuptools      45.1.0
six             1.14.0
urllib3         1.25.8
wheel           0.34.2
```

インストールされたパッケージは Pipfile で管理され、requirements.txt と同様に閲覧することができます。

```bash
(hoge)$ cat Pipfile

[[source]]
name = "pypi"
url = "https://pypi.org/simple"
verify_ssl = true

[dev-packages]
awscli = "*"

[packages]

[requires]
python_version = "3.7"
```

インストール確認

```bash
(hoge)$ aws --version

aws-cli/1.18.11 Python/3.7.4 Darwin/19.3.0 botocore/1.15.11
```

### AWS CLI のセットアップ

#### **IAM ユーザーのプロファイルを設定**

[IAM ユーザーのアクセスキーを作成](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-chap-configure.html#cli-quick-configuration)して、`credentials-hogeuser.csv` をダウンロードします。通常 hogeuser は IAM ユーザー名が入ります。ダウンロードした CSV から `Access key ID` と `Secret access key` を控えます。

AWS CLI にユーザープロファイルを設定

```bash
$ aws configure --profile hogeuser

AWS Access Key ID [None]: *** # Access key ID が入ります
AWS Secret Access Key [None]: *** # Secret access key が入ります
Default region name [None]: ap-northeast-1 # IAMユーザーを作成したリージョン名が入ります
Default output format [None]: json
```

AWS ではプロファイルを「設定の集合」と言う意味で扱うらいしいです、意味を理解するのに手間取る（汗）。`--profile` でユーザー名を指定することで、プロファイルに名前を付けています、今回は単純に `hogeuser` としています。

#### **適当なコマンドで接続確認**

S3 のバケットを作成して、一覧を取得してみる

```bash
$ aws --profile hogeuser s3 ls

2019-10-21 19:51:58 ***
2019-10-21 19:51:57 ***
```

既に AWS 上でバケットを作成している場合、それらの一覧が取得されるはずです。

エラーが出る場合は、IAM の S3 へのアクセス権限が許可されていない場合が考えられます。

### おわりに

AWS CLI と言うより Pipenv の話になってしまいましたが、個人的には環境設定をなるべくテキスト・コード化したいと考えて、このような仕組みにしています。

まぁ、これが個人開発以外で適切に機能した試しはないような気がしますが、、、

### 参考文献

- [[ Github ] pyenv/pyenv](https://github.com/pyenv/pyenv)
- [Pipenv: 人間のための Python 開発ワークフロー](https://pipenv-ja.readthedocs.io/ja/translate-ja/)
- [[ Qiita ] 2020 年の Python パッケージ管理ベストプラクティス](https://qiita.com/sk217/items/43c994640f4843a18dbe)
- [[ AWS ] 仮想環境に AWS CLI バージョン 1 をインストールする](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/install-virtualenv.html)
- [[ AWS ] AWS CLI の設定](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-chap-configure.html#cli-quick-configuration)
