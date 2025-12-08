/**
 * 外部リンク処理モジュール
 * 
 * 記事内の外部リンクに自動的に target="_blank" と rel="noopener noreferrer" を追加します。
 * セキュリティとユーザビリティの向上を目的としています。
 */

(function() {
    'use strict';

    /**
     * 外部リンクを処理する
     * 内部リンクと外部リンクを判別し、外部リンクにのみ target="_blank" を設定します
     */
    function handleExternalLinks() {
        // サイトのベースURLを取得
        const baseURL = window.SITE_BASE_URL || '';
        const baseHost = baseURL ? new URL(baseURL).hostname : window.location.hostname;
        
        // 記事内のすべてのリンクを取得
        const articleLinks = document.querySelectorAll('.article-item a[href]');
        
        articleLinks.forEach(function(link) {
            const href = link.getAttribute('href');
            
            // hrefが空、または既にtarget属性が設定されている場合はスキップ
            if (!href || link.hasAttribute('target')) {
                return;
            }
            
            // 内部リンクの判定
            // アンカーリンク、相対パス、同じホストのリンクは内部リンクとして扱う
            const isInternalLink = 
                href.startsWith('#') || 
                href.startsWith('/') || 
                href.startsWith('./') ||
                href.startsWith('../') ||
                (href.startsWith('http') && new URL(href, window.location.href).hostname === baseHost);
            
            if (isInternalLink) {
                // 内部リンクはそのまま（target属性を追加しない）
                return;
            }
            
            // 外部リンクの場合、新しいタブで開くように設定
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    /**
     * 初期化処理
     * DOMContentLoadedイベントを待ってから外部リンク処理を実行
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', handleExternalLinks);
        } else {
            // 既にDOMが読み込まれている場合は即座に実行
            handleExternalLinks();
        }
    }

    // 初期化を実行
    init();
})();




