---
title: "自宅プロパイダの動的グローバルIPをSlackに監視通知するBotを作った"
description: "お使いのプロパイダによっては固定IPが動的に変化するのですが、これでは都合が悪く、例えばSSH時にいちいちIPを調べたりと何かと面倒でした。そこで、グローバルIPをcURLで取得、SlackにpostするBotを作成しました。"
category: "saas"
tags: ["slack", "bot", "curl", "shell"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/bot-monitor-ip/thumbnail.png"
updatedAt: "2020-08-17"
createdAt: "2020-05-18"
---

自宅プロバイダがソフトバンク光なのですが、[同プロパイダでは固定 IP が用意されておらず](https://www.softbank.jp/support/faq/view/19328)、グローバル IP が一定間隔で変化します。ですが、これでは多方面で都合が悪く、例えば SSH の際にいちいち IP を調べたりと何かと面倒でした。

そこで、この**グローバル IP を cURL で取得、Slack に通知する Bot** を作成して対応しました。

## **Slack App**

Bot を作成する具体的な手順は[コチラの方の記事](https://qiita.com/yuukiw00w/items/94e4495fc593cfbda45c)をご参考頂ければと思います。

### **chat:write by Bot Token Scope**

今回は [Incoming Webhooks](https://api.slack.com/messaging/webhooks) ではなく、Bot Token Scopes 内の [chat:write](https://api.slack.com/scopes/chat:write) で 通知を許可しました。と言うのも [Slack の仕様変更に伴い Webhook URL を各チャンネルごとに発行する必要が出てきた](https://qiita.com/kshibata101/items/0e13c420080a993c5d16)ためです。面倒なので Token のスコープ内で通知の Permission を有効化して、各チャンネルに通知できるようにしています。

[slack api](https://api.slack.com/) > Your Apps > 作成した App > OAuth &amp; Permissions > Scopes

![image_bot_scopes](https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/bot-monitor-ip/image_bot_scopes.png)

ただし、作成した App を通知したいチャンネル側で連携してあげないと `not_in_channel` のエラーになります。この原因が分からず手こずりました（汗）

Slack ホーム画面 > App > 作成した App > 詳細 > その他 > チャンネルにこのアプリを連携させる

![image_add_app_to_channel](https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/bot-monitor-ip/image_add_app_to_channel.png)

## **スクリプト**

久々の Shell は辛すぎます。

### **簡単な処理の流れ**

- crontab で一定期間ごとにスクリプトを起動
- IP の遍歴リストを格納している CSV を読み込み
- cURL で 現在のグローバル IP を取得
- IP リストの最後列（直近の IP）と 前ステップで取得した IP を比較
- IP が更新されていれば、Slack に cURL で POST
- 新 IP を IP リストの最後列に追加保存

### **Shell スクリプト**

```bash
#!/bin/bash

FILENAME="ip_list.csv"
# Bot User OAuth Access Token
TOKEN="***-***-***-***"
# 例) CHANNEL="general" (#を含める場合はurlencodeが必須)
CHANNEL="***"

DATA=`date`

# CSVからIPリストを取得
ip_list=()
cat $FILENAME | while read line || [ -n "$line" ]; do
  ip=`echo ${line} | cut -d , -f 1`
  ip_list+=($ip)
done

# 現在のグローバルIPをcURLでGET、IPを比較
current_ip=`curl -s ifconfig.io`
if [ $current_ip = $ip_list[-1] ]; then
  echo "$DATA  No chane in global IP."
  exit
fi

# SlackにcURLで新IPをPOST
message="<!channel>%20$current_ip"
post_url="https://slack.com/api/chat.postMessage?token=${TOKEN}&channel=${CHANNEL}&text=${message}&pretty=1"
result=`curl -s $post_url`
if [ `echo $result | jq ".ok"` = "false" ]; then
  echo "$DATA  `echo $result | jq ".error"`"
  exit
fi

# 新IPをCSVの最後列に書き込み
current_date=`date '+%Y/%m/%d(%w)'`
echo -n "\n$current_ip,$current_date" >> $FILENAME
echo "$DATA  ADD new global IP to list."
```

### **IP のリストを格納する CSV**

```csv
ip,date
***.***.***.***,2020/05/19(1)
```

## **crontab に スクリプト登録**

作成した Shell を crontab に登録して自動化はおおむね完了。

```bash
# exampleはお使いのpathに変更
00 11 * * * /example/monitor.sh >> /example/info.log 2>&1
```

## **おわりに**

久々に Shell を書きましたが、癖があるなと感じて辛かったです。ですが、Linux 環境であればどこでも展開できますし、共通言語としてはアルファベットレベルで基礎だなと予め実感しています。

また、実は今回作成したスクリプトは常用の MacBook に cron 登録しています。なので、Mac を閉じている間は cron が動かないので本当の意味での自動化には達していません。Raspberry Pi に載せてサーバ化したいのですが、コストが見合っていないと判断して止まっています。

まぁ、昨今のステイホームも合わさってスマートホーム化を久々にやりたいなと思っていますが、クラウドに比べてオンプレは何かと時間が掛かったりするので少し構えてしまいます。

## **参考文献**

- [[ SoftBank サポート ] パソコンの IP アドレスを固定したいのですが？](https://www.softbank.jp/support/faq/view/19328)
- [[ Qiita ] Slack App の作り方について](https://qiita.com/yuukiw00w/items/94e4495fc593cfbda45c)
- [[ slack api ] Sending messages using Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [[ slack api ] chat:write scope](https://api.slack.com/scopes/chat:write)
- [[ Qiita ] slack の Incoming webhook が新しくなっていたのでまとめてみた](https://qiita.com/kshibata101/items/0e13c420080a993c5d16)
