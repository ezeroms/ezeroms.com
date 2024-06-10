---
title: Hugo + Netlify + DecapCMS を使ったサイト構築
date: 2024-06-09T13:44:46.264Z
slug: building-a-website-with-hugo-netlify-decap-cms
month:
  - 2024-06
subject:
  - internet-and-technology
---
35歳の誕生日を機に、個人サイト（ブログ）をリニューアルすることにした。

以前より、Hugo + Netlify を使って個人サイトを配信していたのだが、この仕組みには「記事の更新作業に手間がかかる」という問題があった。つまり、静的サイトジェネレーター兼コンテンツ管理として Hugo があり、Netlify がホスティングを担っているのだが、実際に記事を更新する際は、次のような手順となる。

* Github リポジトリを pull する（僕は複数台のマシンを使っているので、ローカルを最新状態に同期する必要がある。）
* mdファイルを追加し、そこにブログ記事を書く
* Github に push する
* Netlify が更新を検知し、build → deploy を実行する（＝サイトが更新される）

この手順から、Github に対する操作を省きたい。つまり、一般的なブログサービスのように（あるいは Wordpress サイトのように）「ブラウザで管理画面を開き、記事を更新する」という手続きにしたい。

そこで Decap CMS（旧・Netlify CMS）を使ってみることにした。ヘッドレスCMSの代表格で、特に　という点が大きい。

また、併せてサイトのデザインも一新することにした。以前は Hugo に不慣れなこともあり、無料配布されていた Hugo テーマを流用して改造しながら使っていたのだが、その運用を4〜5年ほどしたことで、Hugo の仕組みにもだいぶ詳しくなった。そこで、フルスクラッチで Hugo テーマを作ることにした。

## 各ツールの役割の確認

* Hugo : 静的サイトジェネレーター。Markdown ファイルを HTML に変換して静的なウェブサイトを生成してくれる。平成元年生まれのインターネット小僧として、静的サイトへのロマンは捨てがたい。Golangで書かれているため動作が高速で、Goテンプレートエンジンによる柔軟なテンプレートシステムが魅力的。
* Netlify : 静的サイトのホスティングサービス。Git リポジトリと連携して自動デプロイを行う。
* Decap CMS : オープンソースのヘッドレスCMS。GUIベースの管理画面を提供し、静的サイトジェネレーターと連携してコンテンツを管理する。実装後に重要な落とし穴が発覚する。

## 1. サイトの基本形を作成

まずはまっさらな状態から Hugo プロジェクトを作っていく。

### 1. Hugo プロジェクトを作成

```sh
hugo new site ezeroms.com
cd ezeroms.com
```

### 2. カスタムテーマの準備

Hugo プロジェクトで推奨されている形は、root ディレクトリの下に \`/site\` とかで区切って、テーマ等を置くディレクトリを一段下で管理する方法だ。これは、root ディレクトリでサイト設計やデプロイに関するメタ情報を管理し、具体的なサイト自身の設定や見た目と分離することで、複数テーマも管理やスケーラビリティを確保しようとするものだ。

しかし、今回のサイトの場合はテーマを切り替えることはない（自分でアップデートし続ける）し、プロジェクトの規模も小さいので、構造のシンプルさを優先して全て root ディレクトリ直下で管理する方法にした。

```sh
ezeroms.com
├── archetypes
│   └── index.html
├── content
│   ├── about
│   │   └── _index.md
│   ├── diary
│   │   └── _index.md
│   ├── shoulders-of-giants
│   │   └── _index.md
│   └── work
│       └── _index.md
├── layouts
│   ├── _default
│   │   ├── baseof.html
│   │   └── rss.xml
│   ├── about
│   │   └── index.html
│   ├── diary
│   │   ├── index.html
│   │   └── single.html
│   ├── month
│   │   └── list.html
│   ├── partials
│   │   ├── header.html
│   │   ├── footer.html
│   │   ├── global-nav.html
│   │   └── ...
│   ├── shoulders-of-giants
│   │   └── index.html
│   ├── subject
│   │   └── list.html
│   ├── topic
│   │   └── list.html
│   │── work
│   │   ├── index.html
│   │   └── single.html
│   └── index.html
├── public
├── static
│   ├── admin
│   │   ├── config.yml
│   │   └── index.html
│   ├── css
│   └── images
├── config.toml
└── netlify.toml
```

* public : hugo server  で build されたファイルが格納される場所。キャッシュが邪魔しているのか？と思ったときは全削除したりする。
* content/*/_index.md : 一見不要そうだが、ここに index の md ファイルがないとディレクトリを正しく認識してくれない。
* static/admin : Decap CMS の管理画面用のファイル群。

## 2. 本番環境と自動デプロイの設定

### 1. GitHub リポジトリの作成

``` ``sh
git init
git add .
git commit -m "Initial commit"
git remote add origin <GITHUB_REPO_URL>
git push -u origin main```﻿

### 2. Netlify アカウントの作成

### 3. Githubリポジトリの連携

Netlify の管理画面で「New site from Git」を選択し、GitHubリポジトリを連携。

### 4. ビルド設定

```sh
Build Command: hugo
Publish Directory: public
```

これで、Github の main ブランチが更新されると、Netlify側で自動デプロイが走るようになる。

### 5. ドメイン設定

Netlify の管理画面で `ezeroms.com` を割り当てる。

## 3. 詳細なサイト構築（テーマファイルの編集）

layouts 以下のテーマファイルと static/css をひらすら編集し、理想的なデザインを作り上げていく。自分一人のプロジェクトということもあり、あらかじめ全てのページを Figma で作ることはせず、主だったページのレイアウト構成だけ Figma 上で検証して、スタイリングについては実装しながら検討していった。褒められた方法ではないが、こういうところがソロ・プロジェクトの爽快なところだ。

### コツ : テーマファイルへのマーキング

hugo server  で localhost を確認しながら作っていくのだが、描画されているページに適切なテーマファイルが当たっているのかどうか分からなくなる。（「このページにこのテーマファイルが当たってほしいのに当たらん〜〜〜〜」的なことが続く） 途中で全部のテーマファイルにマーキングして、config.toml とファイル名やディレクトリを弄りながら検証していった。

```html
<!-- debug-info -->
<p class="debug-info">File : /layouts/subject/list.html</p>
```

最終的にこんなかんじで出来上がる。

写真

本当はもっとURLスキームに拘りたかったのだが、どうやってもできず（Decap CMS管理の範囲外を作ることになり）断念した。いい方法を知っている人がいたら教えてほしい。

```sh
# 理想的なURLスキーム
ezeroms.com/diary/
ezeroms.com/diary/subject/news/
ezeroms.com/diary/month/2024-06/

# 実際のURLスキーム
ezeroms.com/diary/
ezeroms.com/subject/news/
ezeroms.com/month/2024-06/
```

## 4. CMSを導入してブラウザから更新できるようにする

package.json を作成し、Decap CMSをインストール。

```sh
npm init -y
npm install netlify-cms-app
```

static/admin ディレクトリの config.yml 、index.html を編集してセットアップし、ezeroms.com/admin にアクセスすれば管理画面が使えるようになる。めっちゃ簡単だ。

管理画面の自由度がとても高く config.yml で設定すると一覧の表示項目も柔軟に変更することができる。

```yaml
backend:
  name: git-gateway
  branch: main

media_folder: "/static/images/uploads"
public_folder: "/images/uploads"

collections:
  - name: "about"
    label: "About"
    folder: "content/about"
    create: true
    slug: "{{fields.slug}}"
    fields:
      - { label: "Body", name: "body", widget: "markdown" }
    summary: "{{body}}"

  - name: "diary"
    label: "Diary"
    folder: "content/diary"
    create: true
    slug: "{{fields.slug}}"
    media_folder: "/static/images/diary/{{fields.slug}}"
    public_folder: "/images/diary/{{fields.slug}}"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Date", name: "date", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false }
      - { label: "Slug", name: "slug", widget: "string" }
      - { label: "Month", name: "month", widget: "list" }
      - { label: "Subject", name: "subject", widget: "select", multiple: true, options: ["news", "music", "manga-and-anime", "movies-and-dramas", "comedy", "gaming", "sports", "books-and-magazines", "languages-and-foreign-cultures", "design-and-creative", "internet-and-technology", "natural-science", "humanities-and-social-sciences"] }
      - { label: "Body", name: "body", widget: "markdown" }
    summary: "{{date | date('YYYY-MM-DD')}} | {{body | truncate(280, '...')}}"
    sort:
      field: "date"
      direction: "desc"

  - name: "work"
    label: "Work"
    folder: "content/work"
    create: true
    slug: "{{fields.slug}}"
    media_folder: "/static/images/work/{{fields.slug}}"
    public_folder: "/images/work/{{fields.slug}}"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Date", name: "date", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false }
      - { label: "Slug", name: "slug", widget: "string" }
      - { label: "Image", name: "image", widget: "image" }
      - { label: "Body", name: "body", widget: "markdown" }
    summary: "{{date | date('YYYY-MM-DD')}} | {{title}}"
    sort:
      field: "date"
      direction: "desc"

  - name: "shoulders-of-giants"
    label: "The shoulders of Giants"
    folder: "content/shoulders-of-giants"
    create: true
    slug: "{{fields.slug}}"
    fields:
      - { label: "Topic", name: "topic", widget: "list"}
      - { label: "Body", name: "body", widget: "markdown" }
    summary: "{{body | truncate(280, '...')}}　　Topic {{topic}}"
    sort:
      field: "body"
      direction: "asc"
```

## Decap CMS の落とし穴と、実際のこのサイトの運用について

さて、これで理想的な個人ブログの運用体制が構築できた…と思っていたのだが、Decap CMS には大きな落とし穴があった。記事のテキストフィールドが、日本語入力に対応できていないのだ。漢字変換をしようとしたときにキャレットの位置がズレてしまい、正常に入力作業をすることができない。

[Updating Slate editor to support Korean](https://github.com/decaporg/decap-cms/issues/1347)

どうやら Slate のバージョンが古いのが原因らしいく、プルリクは出ているようだがスルーされているっぽい。

（写真）
Issueが立っていたのでむなしくコメントを残しておいた。

なので、実際このサイトの運用は次のようになっている。
- UpNote でコンテンツ管理（UpNote はモバイル用のネイティブアプリが用意されている。）
- 更新するときは UpNote から DecapCMS にコピペ

以前に比べれば格段に更新しやすくはなったものの、できればブラウザで完結するようにしたい。
もちろん、ヘッドレスCMSには他にも有力な候補があるのだが、Netlify との相性と、無料で使えるという条件で探すと選択肢はそれほど多くはない。また、できればスマホから更新ができるように、モバイル用のインターフェースが提供されているものがあるとなお嬉しい。次の休みにもう少し調べてみようと思う。