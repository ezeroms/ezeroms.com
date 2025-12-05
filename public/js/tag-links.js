// カード全体のクリック処理
// <li>要素にdata-href属性を持たせ、カード全体をクリック可能にする
// カード内の<a>タグ（タグリンクなど）がクリックされた場合は、通常通り動作する

document.addEventListener('click', function(e) {
    const card = e.target.closest('li[data-href]');
    if (!card) return;
    
    // 内部リンク（<a>タグ）がクリックされた場合は、カードのクリック処理を実行しない
    if (e.target.closest('a')) return;
    
    window.location.href = card.dataset.href;
});

