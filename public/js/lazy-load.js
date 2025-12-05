/**
 * 遅延読み込み用のスクリプト
 * - YouTube埋め込みの遅延読み込み（Intersection Observer）
 * - 画像の遅延読み込み（ネイティブloading="lazy"のフォールバック）
 */

(function() {
    'use strict';

    // ページ遷移後の短い遅延（100ms）を設けてから監視開始
    function initLazyLoading() {
        // YouTube埋め込みの遅延読み込み
        initYouTubeLazyLoad();
        
        // 画像の遅延読み込み（フォールバック）
        initImageLazyLoad();
    }

    /**
     * YouTube埋め込みの遅延読み込み
     */
    function initYouTubeLazyLoad() {
        const youtubePlaceholders = document.querySelectorAll('.youtube-placeholder');
        
        if (youtubePlaceholders.length === 0) {
            return;
        }

        // Intersection Observerの設定
        // rootMargin: '100px' - ビューポートの100px手前で読み込み開始
        const youtubeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const placeholder = entry.target;
                    const iframe = placeholder.querySelector('iframe[data-src]');
                    const loadingElement = placeholder.querySelector('.youtube-placeholder__loading');
                    
                    if (iframe) {
                        // iframeのsrcを設定して読み込み開始
                        iframe.src = iframe.dataset.src;
                        iframe.removeAttribute('data-src');
                        
                        // 読み込み完了後にプレースホルダーを非表示
                        iframe.addEventListener('load', function() {
                            if (loadingElement) {
                                loadingElement.style.display = 'none';
                            }
                            iframe.style.display = 'block';
                        });
                        
                        // エラーハンドリング
                        iframe.addEventListener('error', function() {
                            if (loadingElement) {
                                loadingElement.innerHTML = '<p class="youtube-placeholder__text">読み込みに失敗しました</p>';
                            }
                        });
                    }
                    
                    // 監視を停止
                    youtubeObserver.unobserve(placeholder);
                }
            });
        }, { 
            rootMargin: '100px' // 100px手前で読み込み開始
        });

        // 各プレースホルダーを監視
        youtubePlaceholders.forEach(placeholder => {
            youtubeObserver.observe(placeholder);
        });
    }

    /**
     * 画像の遅延読み込み（フォールバック）
     * loading="lazy"がサポートされていないブラウザ用
     */
    function initImageLazyLoad() {
        // loading="lazy"がサポートされている場合は不要
        if ('loading' in HTMLImageElement.prototype) {
            return;
        }

        const images = document.querySelectorAll('img[data-src]');
        
        if (images.length === 0) {
            return;
        }

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        }, { 
            rootMargin: '50px' // 50px手前で読み込み開始
        });

        images.forEach(img => {
            imageObserver.observe(img);
        });
    }

    // DOMContentLoadedまたはページ遷移時に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initLazyLoading, 100);
        });
    } else {
        // 既に読み込み完了している場合（SPA的な遷移など）
        setTimeout(initLazyLoading, 100);
    }

    // ページ遷移イベント（TurboやSPA的な遷移に対応）
    document.addEventListener('turbo:load', function() {
        setTimeout(initLazyLoading, 100);
    });
})();

