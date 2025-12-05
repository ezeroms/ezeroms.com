---
title: "Hugo v0.125以降で _index.md を使ったセクションページが表示されなくなった件"
date: "2025-05-24T05:34:34.333Z"
slug: hugo-section-page-not-rendering
column_category:
  - internet-and-technology
column_tag:
  - Hugo
  - 技術
column_month:
  - 2025-05
---
Hugoでは、`content/about/_index.md`  のようなファイルを配置することで、「about」というセクションのトップページを作ることができる。WordPressでいえばカスタム投稿タイプのアーカイブページ（一覧ページ）に近い仕組みだ。セクション全体の紹介や記事一覧に使われるページで、Hugoの用語では「セクションページ（Section Page）」または「ブランチページ（Branch Page）」と呼ばれている。

例えば、僕のサイトでは、

* `ezeroms.com/about/about/`
* `ezeroms.com/about/work/` 
* `ezeroms.com/about/diary/` 
* `ezeroms.com/about/shoulders-of-giants/` 

といったURLで表示されるページがそれにあたる。

で。今日このサイトを更新していたら、それらのセクションページが突如表示されなくなった。この記事では、その原因と解決方法を記録しておく。

## 問題の背景

Hugoでは、contentディレクトリ以下にあるMarkdownファイルが、layouts以下にあるテンプレートによってHTMLに変換（＝レンダリング）される。

具体的には、以下のような構成だ。

```
content/
  about/
    _index.md
  diary
    _index.md
  shoulders-of-giants
    _index.md
  work
    _index.md
  
layouts/
  about/
    index.html
  diary
    index.html
  shoulders-of-giants
    index.html
  work
    index.html
```

###### 　﻿

content/about/_index.md

```
---
title: "About"
layout: "index"
---

ここにコンテンツを書く
```

###### 　﻿

layouts/about/index.html

```
<section>
  <article>
   {{ .Content }}
  </article>
</section>
```

このように、Markdown側では `layout: "index"`  を指定し、Hugoはそのレイアウトに従ってHTMLを生成してくれる。つまり、コンテンツは.mdファイルに書き、構造や見た目は.htmlテンプレートに記述することで、Markdownさえ書ければWebサイトが更新できるようになる。

この仕組みによって、例えばDecapCMSのようなヘッドレスCMSを使えば、mdファイルの編集だけでサイトの更新が可能になる。出力されるのはあくまで静的な html ファイルだが、裏側では動的にCMSを運用しているような体験が得られるのだ。

###### 　﻿

しかし今回localでbuildしたところ、buildは正常に完了したものの、該当するセクションページのHTMLが生成されない（「意図したファイルが public/ 以下に出てこない」）という問題が発生した。

## 原因：Hugoのアップデートでテンプレート解決が厳密化

今回の原因は、Hugoの仕様変更（v0.125以降）によりテンプレートの解決ルールがより厳密になったことだった。最近Macを新しくした際にHugoも最新バージョン（v0.134.1）でインストールし直したため、この問題が表面化したのだろう。

以前のHugoでは、`_index.md`  に対して `layout: "index"`  を指定していても、なんとなく `layouts/about/index.html`  が使われていたのだが、最新のHugoではそのような曖昧な解決が効かなくなり、テンプレートは適切な名称でなければならなくなった。というか、そもそも僕は `index.html`  が適切な型名でないことを今回調べて初めて知った( ＾ω＾) 

[index.md file rendering correctly then overwritten by default single.html | Hugo Forums](https://discourse.gohugo.io/t/index-md-file-rendering-correctly-then-overwritten-by-default-single-html/52059)

## 解決策：テンプレートファイル名とレイアウト指定の変更

以下のように修正したらセクションページが表示されるようになったよ＼(^o^)／

###### 　﻿

テンプレートファイルのファイル名を変更

```
# 修正前
layouts/
  about/
    index.html
  diary/
    index.html
  shoulders-of-giants/
    index.html
  work/
    index.html

# 修正後
layouts/
  about/
    list.html
  diary/
    list.html
  shoulders-of-giants/
    list.html
  work/
    list.html
```

###### 　﻿

Markdownファイル内のレイアウト指定を変更

```
# 修正前
layout: "index"

# 修正後
layout: "list"
```