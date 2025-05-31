---
title: MattermostのWebSocket接続エラーを解決した
date: 2025-05-29T18:15:59.225Z
slug: mattermost-websocket-error
month:
  - 2025-05
subject:
  - internet-and-technology
---
MattermostにBoards（旧・Focalboard）のプラグインを入れる作業をする過程で発生したエラーに関する備忘録。

* [Mattermost Boards plugin guide](https://developers.mattermost.com/contribute/more-info/focalboard/mattermost-boards-setup-guide/)
* [Focalboard](https://www.focalboard.com/)

###### ﻿

プラグインをインストールしてBoardsのUIが表示されたまではよかったのだが、その画面上部に次のようなエラーが表示された。

![](/images/diary/mattermost-websocket-error/tuv46xwmkyhxblz1cscp.png)

> WebSocket connection closed, connection interrupted.\
> If this persists, check your server or web proxy configuration.

チャンネル（プロジェクト）やタスクをクリックしても何も起きない。タスクの新規作成はできるが編集はできないなど、部分的にできることできないことがあり、明らかに壊れている様子でもある。いろいろと検証した結果、これは「Boardsのインターフェースは立ち上がっているが、WebSocket通信が失敗していて機能していない状態」だろうということが分かった。以下に対処方法を記録しておく。

## 原因その1：NGINXの設定ミス

まず、リバースプロキシとして動作しているNginxの設定がどのようになっているかを確認する。

※ Mattermostはデフォルトではポート8065番で動作しているが、それを https://chat.chooning.app のような独自ドメインで扱うには、外部からのリクエストをNginxで受け取り、Mattermost本体に転送する必要がある（＝リバースプロキシ）。

###### 　﻿

その設定が有効になっているかを確認するため、有効なサイト設定ファイルの一覧を表示。

```
ls -l /etc/nginx/sites-enabled/
```

`/etc/nginx/sites-enabled/`  は、Nginxが読み込むサイト設定ファイルへのシンボリックリンクが置かれている場所。 `/etc/nginx/sites-available/` にある設定ファイルのうち、実際に有効にしたいものをシンボリックリンクとして `/etc/nginx/sites-enabled/` に格納することで、設定が反映されるようになる。

* `/etc/nginx/sites-available/` ： すべてのNginx用の設定ファイルの本体を置いておく場所。まだ有効にはなっていない。
* `/etc/nginx/sites-enabled/` ：実際にNginxが読み込んで使う設定ファイルのシンボリックリンクを置く場所。ここにあるファイルだけが、Nginx起動時に読み込まれて反映される。

###### 　﻿

実行結果。`mattermost` という名前の設定ファイルが `/etc/nginx/sites-available/mattermost`  からリンクされていることから、Mattermost用のNginx設定が有効になっていることが確認できる。

```
default -> /etc/nginx/sites-available/default
mattermost -> /etc/nginx/sites-available/mattermost
```

###### 　﻿

本体の設定ファイルの中身を確認。

```
cat /etc/nginx/sites-available/mattermost
```

```
server {
    server_name chat.chooning.app;

    location / {
        proxy_pass http://localhost:8065;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/chat.chooning.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.chooning.app/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

設定ファイルの中に、HTTPからWebSocketへプロトコルをアップグレードする際に必要なヘッダー項目が抜けていることが分かる。これがないとWebSocket接続が確立できない。

###### 　﻿

修正

```
server {
    server_name chat.chooning.app;

    location / {
        proxy_pass http://localhost:8065;
        proxy_http_version 1.1;                           # これを追加
        proxy_set_header Upgrade $http_upgrade;           # これを追加
        proxy_set_header Connection "upgrade";            # これを追加
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/chat.chooning.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.chooning.app/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

###### 　﻿

Nginxを再読み込み

```
# 文法チェック
sudo nginx -t

# 成功したらNginxを再起動
sudo systemctl reload nginx
```

## 原因その2：config.jsonの設定ミス

Nginxの設定を修正したことで「WebSocket connection closed, connection interrupted.」のエラーは解消されたものの、BoardsのUIが動かない現象は解決しなかった。

###### 　﻿

Dockerコンテナ内に入って、config.json（Mattermost本体の設定ファイル）の内容を確認する。

```
sudo docker exec -it mattermost_app_1 /bin/bash
cat /mattermost/config/config.json | grep -A 10 ServiceSettings
```

###### 　﻿

その結果、SiteURLとWebsocketURLが空であることが判明。この2つの値はMattermostが自身のURLやWebSocket接続先を認識するために必要なもので、ここが空だと接続が正しく行えない。

```
"SiteURL": "",
"WebsocketURL": "",
```

###### 　﻿

修正

```
sed -i 's|"SiteURL": ""|"SiteURL": "https://chat.chooning.app"|' /mattermost/config/config.json
sed -i 's|"WebsocketURL": ""|"WebsocketURL": "wss://chat.chooning.app"|' /mattermost/config/config.json
```

###### 　﻿

コンテナから出て、コンテナ再起動

```
exit
sudo docker restart mattermost_app_1
```

###### 　﻿

上記2つの修正を行ったことで、Boardが正常に使えるようになった＼(^o^)／

## 副作用的に他のエラー（「The server is not reachable.」）も解決した

実はずっとネイティブアプリに「The server is not reachable.」というエラーが表示されていたのだが、WebSocket接続エラーを解決したことで偶然これも解決した。

![](/images/diary/mattermost-websocket-error/5r1nil9wlarcbjgvu2dth6.png)

この通知、初期セットアップ時からずっと表示されていたのだが、Mattermost自体は普通に使えており、[フォーラムにも同様の報告が上がっていた](https://forum.mattermost.com/t/intermittent-the-server-is-not-reachable-for-some-users-on-mobile/16884/6)ので、まあネイティブアプリのバグかなと思って放置していた。しかし実際にはWebSocket接続が失敗していたために表示されていたっぽい／(^o^)＼

アプリがある程度は動いていたのは、WebSocketを使わない基本的なAPI通信が問題なく通っていたからではないかと思う。（通知やBoardsなどのリアルタイムUIは動かないが、通常の投稿やチャンネル閲覧などはHTTP通信だけで動作していた、ということなんじゃないかと思う。たぶん……）

###### 　﻿

何はともあれ、これでBoardsが使えるようになった。Slack的なコミュニケーションとNotion的なやつが同一アプリ内で使えるの快適すぐる！！！！！

![](/images/diary/mattermost-websocket-error/bpgrweqlqm2x7pwvqlxy.png)

###### 　﻿

Boardのセットアップに関する記事はこの土日に書く。この一週間ですっかりMattermostの虜や〜〜〜