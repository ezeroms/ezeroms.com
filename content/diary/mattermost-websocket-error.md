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

######  ﻿

プラグインをインストールしてBoardsのUIが表示されたまではよかったのだが、画面上部に次のようなエラーが表示された。

![](/images/diary/mattermost-websocket-error/tuv46xwmkyhxblz1cscp.png)

> WebSocket connection closed, connection interrupted.\
> If this persists, check your server or web proxy configuration.

UIは表示されているのにチャンネルやタスクをクリックしても反応がない。ぶっ壊れてんのかと思ったが、いろいろと検証した結果、これは「Boardsのインターフェースは立ち上がっているもののWebSocket通信が失敗していて機能していない状態」であることが判った。

## 原因その1：NGINXの設定ミス

まずはリバースプロキシとして使っているNGINXの設定を確認。

```
ls -l /etc/nginx/sites-enabled/
```

###### 　﻿

すると以下のように表示され、Mattermostの設定ファイルが読み込まれていることが確認できた。

```
default -> /etc/nginx/sites-available/default
mattermost -> /etc/nginx/sites-available/mattermost
```

　﻿ ﻿

設定内容を確認。

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

設定ファイルの中に、WebSocket通信に必要なヘッダー設定が抜けていることが判る。以下を3行を追加。（HTTPからWebSocketへプロトコルをアップグレードする際に必要な設定。これがないとWebSocket接続が確立できない。

###### 　﻿

### 修正

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

追記後、Nginxを再読み込み。

```
# 文法チェック
sudo nginx -t

# 成功したらNginxを再起動
sudo systemctl reload nginx
```



## 原因その2：config.jsonの設定ミス

Nginxの設定を修正したことで「WebSocket connection closed, connection interrupted.」のエラーは解消されたものの、BoardsのUIが動かない現象は残っていた。

config.json（Mattermost本体の設定ファイル）の内容を確認。

```
# Dockerコンテナ内で実行
sudo docker exec -it mattermost_app_1 /bin/bash
cat /mattermost/config/config.json | grep -A 10 ServiceSettings
```

###### 　﻿

その結果、SiteURLとWebsocketURLが空であることが判明。

```
"SiteURL": "",
"WebsocketURL": "",
```

この2つの値はMattermostが自身のURLやWebSocket接続先を正しく認識するために必要なもので、ここが空のままだとネイティブアプリなどからの接続が正しく行えない。



### 修正

```
# Dockerコンテナ内で実行
sed -i 's|"SiteURL": ""|"SiteURL": "https://chat.chooning.app"|' /mattermost/config/config.json
sed -i 's|"WebsocketURL": ""|"WebsocketURL": "wss://chat.chooning.app"|' /mattermost/config/config.json
```

###### 　﻿

コンテナから出て、コンテナ再起動

```
exit
sudo docker restart mattermost_app_1
```

## 副作用的に他のエラーも解決した

ずっとネイティブアプリに以下のエラーが表示されていたのだが、WebSocket接続エラーを解決したことで偶然これも解決した。

![The server is not reachable.](/images/diary/mattermost-websocket-error/5r1nil9wlarcbjgvu2dth6.png)

この通知、初期セットアップ時からずっと表示されていたのだが、Mattermost自体は普通に使えており、フォーラムにも同様の報告が上がっていたので、まあネイティブアプリのバグかなと思って放置していた。しかし実際にはWebSocket接続が失敗していたために表示されていたっぽい／(^o^)＼

アプリがある程度は動いていたのは、WebSocketを使わない基本的なAPI通信が問題なく通っていたからではないかと思う。（通知やBoardsなどのリアルタイムUIは動かないが、通常の投稿やチャンネル閲覧などはHTTP通信だけで動作していた、ということなんじゃないかと思う。たぶん……）

###### 　﻿

何はともあれ、これでBoardsが使えるようになった。Slack的なコミュニケーションとNotion的なやつが同一アプリ内で使えるの便利すぐる！！！！！

![](/images/diary/mattermost-websocket-error/bpgrweqlqm2x7pwvqlxy.png)

###### 　﻿

Boardのセットアップに関する記事はこの土日に書く。この一週間ですっかりMattermostの虜になってしまった……！