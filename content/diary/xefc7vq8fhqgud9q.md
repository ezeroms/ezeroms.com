---
slug: "xefc7vq8fhqgud9q"
date: 2025-12-08T05:42:00.000Z
diary_month:
  - 2025-12
diary_tag:
  - "UI"
  - "デザイン"
---

[CSS Masonryについて（sakupi01 blog）](https://blog.sakupi01.com/dev/articles/the-state-of-css-masonry)

*   CSS Masonryは、Pinterest型の段組みレイアウトを、JavaScriptによる配置計算ではなく、CSSのレイアウトモデルとしてネイティブに扱おうとする仕様提案で、DOM順やアクセシビリティを保ったまま、高さの異なる要素を列方向に詰めて配置することを意図している。
    
*   記事では、CSS Gridは行を揃える二次元レイアウトであるがゆえにカードUIでは余白が生じやすく、Multi-columnは視覚順と読み順が乖離し、JS Masonryは再計算コストやDOM操作による保守性の問題を抱えてきた、という整理がされている。
    
*   その上でCSS Masonryは、「自然な視覚配置」と「構造的な正しさ」を両立できる可能性を持つ一方、配置の予測可能性や制御性が下がるというトレードオフも含んでおり、意味的な行・列を持たないカード一覧などに用途を限定して考えるべきものとして位置づけられている。
