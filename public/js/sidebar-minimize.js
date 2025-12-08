/**
 * サイドバー最小化機能
 * 
 * サイドバーの表示/非表示を切り替える機能を提供します。
 * ユーザーがサイドバーを最小化して、コンテンツエリアを広く使えるようにします。
 */

(function() {
    'use strict';

    /**
     * サイドバーの最小化機能を初期化
     */
    function initSidebarMinimize() {
        const sidebar = document.querySelector('.layout-sidebar');
        const minimizeBtn = document.getElementById('sidebar-minimize-btn');
        
        // 必要な要素が存在しない場合は処理を中断
        if (!sidebar || !minimizeBtn) {
            return;
        }
        
        // 初期状態を更新
        updateButtonState();
        
        // 最小化/最大化ボタンのクリックイベント
        minimizeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // サイドバーの最小化状態を切り替え
            sidebar.classList.toggle('is-minimized');
            updateButtonState();
        });
        
        /**
         * ボタンの状態を更新
         * 最小化状態に応じて、ボタンのaria-labelとアイコンの向きを変更
         */
        function updateButtonState() {
            const isMinimized = sidebar.classList.contains('is-minimized');
            const svg = minimizeBtn.querySelector('svg');
            
            if (isMinimized) {
                // 最小化状態：最大化ボタンとして表示
                minimizeBtn.setAttribute('aria-label', 'サイドバーを最大化');
                minimizeBtn.setAttribute('data-tooltip', 'メニューを表示する');
                if (svg) {
                    svg.style.transform = 'rotate(180deg)';
                }
            } else {
                // 最大化状態：最小化ボタンとして表示
                minimizeBtn.setAttribute('aria-label', 'サイドバーを最小化');
                minimizeBtn.setAttribute('data-tooltip', 'メニューを非表示にする');
                if (svg) {
                    svg.style.transform = 'rotate(0deg)';
                }
            }
        }
    }
    
    /**
     * 初期化処理
     * DOMContentLoadedイベントを待ってから初期化を実行
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initSidebarMinimize);
        } else {
            // 既にDOMが読み込まれている場合は即座に実行
            initSidebarMinimize();
        }
    }

    // 初期化を実行
    init();
})();




