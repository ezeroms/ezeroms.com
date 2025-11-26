/**
 * ドロワー共通機能
 */

(function() {
    'use strict';

    /**
     * ドロワーを開く
     * @param {HTMLElement} drawer - ドロワー要素
     * @param {HTMLElement} overlay - オーバーレイ要素
     */
    function openDrawer(drawer, overlay) {
        if (!drawer || !overlay) return;
        
        drawer.classList.add('is-open');
        overlay.classList.add('is-active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * ドロワーを閉じる
     * @param {HTMLElement} drawer - ドロワー要素
     * @param {HTMLElement} overlay - オーバーレイ要素
     */
    function closeDrawer(drawer, overlay) {
        if (!drawer || !overlay) {
            console.warn('[Drawer] closeDrawer called with invalid elements:', { drawer, overlay });
            return;
        }
        
        console.log('[Drawer] Closing drawer, before:', {
            drawerClasses: drawer.className,
            overlayClasses: overlay.className
        });
        
        drawer.classList.remove('is-open');
        overlay.classList.remove('is-active');
        document.body.style.overflow = '';
        
        console.log('[Drawer] Closing drawer, after:', {
            drawerClasses: drawer.className,
            overlayClasses: overlay.className
        });
    }

    /**
     * ドロワーを初期化
     * @param {string} triggerSelector - トリガーボタンのセレクタ
     * @param {string} drawerId - ドロワーのID
     * @param {string} overlayId - オーバーレイのID
     */
    function initDrawer(triggerSelector, drawerId, overlayId) {
        const trigger = document.querySelector(triggerSelector);
        const drawer = document.getElementById(drawerId);
        const overlay = document.getElementById(overlayId);
        
        if (!trigger || !drawer || !overlay) return;

        // トリガーボタンのクリックイベント
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openDrawer(drawer, overlay);
        });

        // 閉じるボタンのクリックイベント
        const closeBtn = drawer.querySelector('.drawer__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeDrawer(drawer, overlay);
            });
        }

        // オーバーレイのクリックイベント
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeDrawer(drawer, overlay);
        });

        // ESCキーで閉じる
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
                closeDrawer(drawer, overlay);
            }
        });

        // ドロワー内のリンクをクリックしたら閉じる（オプション）
        const links = drawer.querySelectorAll('a');
        links.forEach(function(link) {
            link.addEventListener('click', function() {
                // 外部リンクの場合は閉じない
                if (link.hasAttribute('target')) {
                    return;
                }
                // 少し遅延させてから閉じる（遷移を確認できるように）
                setTimeout(function() {
                    closeDrawer(drawer, overlay);
                }, 100);
            });
        });
    }

    // グローバルに公開
    window.Drawer = {
        init: initDrawer,
        open: openDrawer,
        close: closeDrawer
    };

    // DOMContentLoaded時に自動初期化（data属性で指定されたドロワー）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            const drawers = document.querySelectorAll('[data-drawer-trigger]');
            drawers.forEach(function(trigger) {
                const drawerId = trigger.getAttribute('data-drawer-trigger');
                const overlayId = trigger.getAttribute('data-drawer-overlay') || 'drawer-overlay';
                initDrawer('[data-drawer-trigger="' + drawerId + '"]', drawerId, overlayId);
            });
        });
    } else {
        const drawers = document.querySelectorAll('[data-drawer-trigger]');
        drawers.forEach(function(trigger) {
            const drawerId = trigger.getAttribute('data-drawer-trigger');
            const overlayId = trigger.getAttribute('data-drawer-overlay') || 'drawer-overlay';
            initDrawer('[data-drawer-trigger="' + drawerId + '"]', drawerId, overlayId);
        });
    }
})();

