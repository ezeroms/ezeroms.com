/**
 * ヘッダースクロール制御
 * 
 * ページをスクロールした際に、ヘッダーを自動的に表示/非表示にします。
 * 下にスクロールした場合はヘッダーを非表示にし、上にスクロールした場合は表示します。
 * また、スクロールが止まった場合も一定時間後にヘッダーを再表示します。
 */

(function() {
    'use strict';

    /**
     * ヘッダーのスクロール制御を初期化
     */
    function initHeaderScroll() {
        const header = document.querySelector('.layout-header');
        
        // ヘッダーが存在しない場合は処理を中断
        if (!header) {
            console.log('[HeaderScroll] Header not found');
            return;
        }

        // 空のheaderは処理しない（コンテンツがない場合は制御不要）
        if (header.children.length === 0) {
            return;
        }

        // スクロール位置の管理用変数
        let lastScrollTop = 0;
        let scrollTimeout = null;
        let isScrollingDown = false;
        let ticking = false;

        /**
         * 現在のスクロール位置を取得
         * @returns {number} スクロール位置（ピクセル）
         */
        function getScrollTop() {
            return window.pageYOffset || document.documentElement.scrollTop || 0;
        }

        /**
         * スクロールイベントのハンドラー
         * スクロール方向に応じてヘッダーの表示/非表示を制御
         */
        function handleScroll() {
            const scrollTop = getScrollTop();
            
            // スクロール位置が変わっていない場合は処理をスキップ（パフォーマンス向上）
            if (Math.abs(scrollTop - lastScrollTop) < 1) {
                return;
            }

            // スクロール方向を判定
            const scrollingDown = scrollTop > lastScrollTop;
            const scrollingUp = scrollTop < lastScrollTop;

            // 既存のタイムアウトをクリア
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
                scrollTimeout = null;
            }

            // ページトップ付近（100px以内）では常にヘッダーを表示
            if (scrollTop <= 100) {
                header.classList.remove('hidden');
                isScrollingDown = false;
                lastScrollTop = scrollTop;
                return;
            }

            // 上にスクロールしたら即座にヘッダーを表示
            if (scrollingUp) {
                header.classList.remove('hidden');
                isScrollingDown = false;
            }
            // 下にスクロールしたらヘッダーを非表示
            else if (scrollingDown) {
                header.classList.add('hidden');
                isScrollingDown = true;
            }

            // 現在のスクロール位置を記録
            lastScrollTop = scrollTop;

            // 下にスクロールしていた場合、スクロールが止まったら3秒後にヘッダーを再表示
            if (isScrollingDown) {
                scrollTimeout = setTimeout(function() {
                    header.classList.remove('hidden');
                    isScrollingDown = false;
                    scrollTimeout = null;
                }, 3000);
            }
        }

        // 初期スクロール位置を設定
        lastScrollTop = getScrollTop();

        // スクロールイベントを監視（requestAnimationFrameでthrottle処理）
        // passive: true でパフォーマンスを向上
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // 初期状態を設定
        handleScroll();
    }

    /**
     * 初期化処理
     * DOMContentLoadedイベントを待ってから初期化を実行
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initHeaderScroll);
        } else {
            // 既にDOMが読み込まれている場合は即座に実行
            initHeaderScroll();
        }
    }

    // 初期化を実行
    init();
})();



