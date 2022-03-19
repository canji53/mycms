---
title: "Lambda(Python)でSeleniumが動かないのでバージョンを調整して解決した件"
description: "LambdaでスクレイピングしたくてSeleniumやChromeDriverでゴニョゴニョしたのですが、案の定エラーでした。結果的にPython、Selenium、ChromeDriver、serverless-chromeの各バージョンを揃える必要がありました。"
category: "aws"
tags: ["lambda", "lambda-layer", "selenium"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/selenium-in-lambda/thumbnail.png"
updatedAt: "2020-10-23"
createdAt: "2020-04-14"
---

## **はじめに**

Lambda（Python）でスクレイピングしたくて Selenium とか ChromeDriver でゴニョゴニョしようとしたのですが、案の定エラーに詰まって動きませんでした。

Lambda 上で headless-chrome を使うために導入した `serverless-chrome` と Python とのバージョン齟齬、Selenium と ChromeDriver のバージョン齟齬など、今回は **Python、Selenium、ChromeDriver、serverless-chrome の各バージョンを揃える必要がありました。**

[serverless-chrome の Issue に上記の解決法](https://github.com/adieuadieu/serverless-chrome/issues/133)が載っているで、今回はこの Issue を参考に AWS SAM や Lambda Layer を使って簡単なスクレイピングをしてみました。

## **Serverless Chrome？**

> Serverless Chrome には、AWS Lambda でヘッドレス Chrome の実行を開始するために必要なものがすべて含まれています（Azure 機能と GCP 機能は間もなく）。
>
> このプロジェクトの目的は、サーバーレス関数の呼び出し中にヘッドレス Chrome を使用するための足場を提供することです。サーバーレス Chrome は、Chrome バイナリの構築とバンドルを処理し、サーバーレス機能の実行時に Chrome が実行されていることを確認します。
>
> さらに、このプロジェクトは、一般的なパターンのいくつかのサンプルサービスも提供します（例：ページのスクリーンショットを撮る、PDF に印刷する、一部を削るなど）。
>
> [adieuadieu/serverless-chrome の README の翻訳より](https://github.com/adieuadieu/serverless-chrome#serverless-chrome)

## **バージョン調整（2020/04/14 時点）**

Issue を参考に動作確認を行ったバージョン関係です。

**注意することは Python 3.8 では動作しないことでした。**

- Selenium = 3.14.0
- [Chrome Driver](https://chromedriver.storage.googleapis.com/index.html?path=2.43/) = 2.43
- [Serverless Chrome](https://github.com/adieuadieu/serverless-chrome/releases) = 1.0.0-55
- **Python = 3.6**

## **サンプル**

### **とりまディレクトリ構造**

あくまでもサンプルです。

`sam init` してゴニョゴニョした後に完成するディレクトリ構造です。

不要なものは消しています。

```bash
$ tree .
.
├── layer
│   └── bin
│       ├── chromedriver
│       └── headless-chromium
├── sample
│   ├── __init__.py
│   ├── app.py
│   └── requirements.txt
└── template.yaml
```

### **chromedriver 等の実行ファイルをダウンロード**

```bash
# LambdaLayer用のディレクトリ作成
$ mkdir -p layer/bin

# ダウンロード Chrome Driver 2.43
$ wget https://chromedriver.storage.googleapis.com/2.43/chromedriver_linux64.zip -P layer/bin
$ unzip layer/bin/chromedriver_linux64.zip

# ダウンロード Serverless Chrome v1.0.0-55
$ wget https://github.com/adieuadieu/serverless-chrome/releases/download/v1.0.0-55/stable-headless-chromium-amazonlinux-2017-03.zip -P layer/bin
$ unzip layer/bin/stable-headless-chromium-amazonlinux-2017-03.zip
```

### **サンプル template.yaml**

注意したいのは Python のランタイムが `3.6` であることです。

layer は、コンテナ上で `/opt/` 直下に配置されます。

`layer/bin/***` であれば `/opt/bin/***` に置かれます。

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Timeout: 30

Resources:
  ServerlessFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: sample-selenium-function
      CodeUri: sample/
      Handler: app.lambda_handler
      Runtime: python3.6
      Layers:
        - !Ref ServerlessLayer

  ServerlessLayer:
    Type: AWS::Serverless::LayerVersion
    Properties:
      LayerName: sample-selenium-layer
      ContentUri: layer/
```

### **requirements.txt に Selenium ライブラリを追加**

Lambda Layer をせっかく使っているので `layer/python/` 等に固めるが良いのかなとも思っていますが、今回は requirements.txt で単純にライブラリ管理しています。

```bash
cat << EOF >> sample/requirements.txt
selenium
EOF
```

### **サンプル app.py（Lambda）**

[Yahoo ニュース](https://news.yahoo.co.jp/)を対象に class から要素を print する簡単なサンプルになります。
詳しい操作方法は[こちらの API ドキュメント](https://selenium-python.readthedocs.io/api.html#module-selenium.webdriver.remote.webelement)を参考にしてもらえればです。

```python
import json
from selenium import webdriver

CHROME_DRIVER_PATH = "/opt/bin/chromedriver"
HEADLESS_CHROMIUM_PATH = "/opt/bin/headless-chromium"

TARGET_URL = "https://news.yahoo.co.jp/"

def lambda_handler(event, context):

    options = webdriver.ChromeOptions()
    options.binary_location = HEADLESS_CHROMIUM_PATH
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--single-process')

    chrome_driver = webdriver.Chrome(
        executable_path = CHROME_DRIVER_PATH,
        chrome_options = options)

    chrome_driver.get(TARGET_URL)

    print(chrome_driver.find_element_by_class_name('topics_title').text)

    chrome_driver.close()
    chrome_driver.quit()

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "success",
        }),
    }
```

### **出力結果**

```bash
$ sam build
$ sam local invoke
>> トピックス
```

## **おわりに**

全体的にバージョン低めなので慎重に運用する必要がありそうだなと思っていますが、比較的簡単にスクレイピングできてしまう Lambda はやっぱりすごいですね。

ひよっこですが、簡単なサービスをどんどん Lambda で組んでみたいです。

## **参考文献**

- [Chrome not reachable with Selenium Python&nbsp;#133](https://github.com/adieuadieu/serverless-chrome/issues/133)
- [serverless-chrome README](https://github.com/adieuadieu/serverless-chrome#serverless-chrome)
- [Chrome Index of /2.43/](https://chromedriver.storage.googleapis.com/index.html?path=2.43/)
- [Selenium WebDriver API 7.21. Remote WebDriver WebElement](https://selenium-python.readthedocs.io/api.html#module-selenium.webdriver.remote.webelement)
