---
title: Mattermostをセルフホスティングする
date: 2025-05-22T04:42:16.822Z
slug: mattermost
month:
  - 2025-05
subject:
  - internet-and-technology
---
![](/images/diary/mattermost/47.png)

## Mattermostとは

Mattermostは、Slackに似たUIを持つ、オープンソースのコラボレーションツールだ。

自分たちでサーバーを用意して運用する「セルフホスティング」に対応しており、ユーザー数や機能に応じて課金されることなく自由に使うことができる。すごい。これでSlack重税ともおさらばや！！

<https://mattermost.com/>

###### 　﻿

![Slack重税 2025年5月現在](/images/diary/mattermost/44.png)

## Mattermost（セルフホスティング）でできること

* 基本的なチャンネルベースのチャット（Slackと同様のUI）
* ダイレクトメッセージ
* チャンネルの公開設定（オープンチャンネル or プライベートチャンネル）
* スレッド形式での返信
* メンション @here, @channel, @username など
* 画像・PDFなどの添付＆プレビュー
* iOS / Androidアプリあり（Mattermost公式）
* 投稿内でのMarkdown記法対応
* Bot / Webhook: Incoming / Outgoing webhookあり
* Plugin / Integration: Trello、GitLab、Jiraなどの連携プラグインあり

## Mattermost（セルフホスティング）でできないこと

* 音声通話: Slackのハドルのようなものは標準では非搭載（プラグインが必要）
* 画面共有: 上記のプラグインを使っても画面共有はできない
* SAML / LDAP: Enterprise Editionならできるっぽい
* 監査ログ / EMM連携: Enterprise Editionならできるっぽい

###### 　﻿

Slackの利用料を払うのが難しい規模のプロジェクトでは、Discordが使われることが多いと思う。

ただ、個人的にはDiscordのスレッド返信がどうにも使いづらく、結果としてテキストでのやり取りが整然と進められないのがずっと気になっていた。Mattermostではその点がしっかり解消されており、チャンネル内での会話の整理がしやすそうという印象。一方で、Discordのような「ゆるくつながる」音声通話のスタイルを大事にしたい場合には、Mattermostは少し堅すぎるというか、そういう用途にはあまり向いていない。

「本当はSlackのようなスタイルのコミュニケーションをしたいのだけど、仕方なくDiscordを使っている」というようなプロジェクトには、Mattermostはちょうどよい選択肢になると思う。

###### 　﻿

早速環境を用意してみたので、以下作業メモ。

## 1. サーバーを用意する

さくらのVPSで 4Gプランを契約（記事執筆時で月額3,960円。年払いだともう少し安くなる）。

OSはUbuntu 22.04を選択。IPアドレスが払い出される。

<https://vps.sakura.ad.jp/>

![](/images/diary/mattermost/45.png)

###### ﻿

契約後、コントロールパネルにアクセスしてサーバーを起動

<https://secure.sakura.ad.jp/vps/servers>

## ﻿2. SSHでログインしてセットアップ開始

```
ssh root@<VPSのIPアドレス>
```

最初に自動生成されたパスワードを使ってログイン

## 3. 初期設定＆Dockerの導入

```
# パッケージ情報を更新
sudo apt update && sudo apt upgrade -y

# Dockerとdocker-composeをインストール
sudo apt install -y docker.io docker-compose

# Dockerを自動起動するように設定
sudo systemctl enable docker
```

## 4﻿. Mattermost用ディレクトリの作成

```
sudo mkdir -p /opt/mattermost
cd /opt/mattermost
```

## 5. docker-compose.yml の作成

```
sudo nano docker-compose.yml
```

```
version: "3"

services:
  db:
    image: postgres:13
    restart: always
    environment:
      POSTGRES_USER: mmuser
      POSTGRES_PASSWORD: mmuser_password
      POSTGRES_DB: mattermost
    volumes:
      - ./volumes/db:/var/lib/postgresql/data

  app:
    image: mattermost/mattermost-team-edition
    restart: always
    ports:
      - "8065:8065"
    environment:
      MM_SQLSETTINGS_DRIVERNAME: postgres
      MM_SQLSETTINGS_DATASOURCE: postgres://mmuser:mmuser_password@db:5432/mattermost?sslmode=disable
      MM_SERVICESETTINGS_SITEURL: http://<VPSのIPアドレス>:8065
    volumes:
      - ./volumes/app/mattermost:/mattermost/data
    depends_on:
      - db
```

nanoの保存コマンド: Ctrl + O → Enter → Ctrl + X

## 6. コンテナの起動

```
sudo docker-compose up -d
```

## 7. サーバーのパケットフィルターを設定

ポート 8065 でアクセスしたいので、パケットフィルターを設定する。ついでにこのあと必要なポートも登録しておく。

![](/images/diary/mattermost/48.png)

## 8. 動作確認

ブラウザからVPSのIPアドレスを直叩きしてアクセス！

<http://160.16.197.152:8065>

![](/images/diary/mattermost/49.png)

## 9. サブドメインの割り当て

ドメイン管理サービスでDNS設定

```
host: chat
type: A
data: 160.16.197.152
```

Google Domains亡きあと、惰性でSquarespaceを使い続けているけれど、ずっとCloudflare Registrarに移行したいと思っている。（こういう地味な作業に腰が上がらなくなるの、確実に加齢の兆候だと思う。）

## 10. Nginxでリバースプロキシを設定

Mattermostのポート8065番を、標準の80番/443番（HTTPS）に乗せかえる必要がある。

Let’s Encryptは、ポート80（HTTP）を使って認証するため、Mattermost が直接 8065番で動いてると認証できない。そこで、Nginxで80番を受付けてMattermostに中継（proxy）する形を取る。

```
sudo apt install nginx
sudo nano /etc/nginx/sites-available/mattermost
```

```
server {
    listen 80;
    server_name chat.chooning.app;

    location / {
        proxy_pass http://localhost:8065;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

###### ﻿

有効化

```
# sites-available に置いた設定ファイルを sites-enabled にシンボリックリンクで追加
sudo ln -s /etc/nginx/sites-available/mattermost /etc/nginx/sites-enabled/

# 設定ファイルの文法チェック
sudo nginx -t

# Nginxの再読み込み（設定反映）
sudo systemctl reload nginx
```

###### ﻿

SSL化（HTTPS対応）

```
# certbot（証明書取得ツール）と nginx連携用のプラグインをインストール
sudo apt install certbot python3-certbot-nginx

# chat.chooning.app ドメインに対してSSL証明書を取得し、
# Nginxの設定に自動で組み込む（ポート443対応も自動設定される）
sudo certbot --nginx -d chat.chooning.app
```

メールアドレス入力、利用規約に同意、リダイレクト（HTTP→HTTPS）を Yes に。

## 11. 動作確認

割り当てたドメインにブラウザでアクセスして確認

<http://chat.chooning.app>