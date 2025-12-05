/**
 * ドロワー共通機能
 * 
 * モーダル形式のドロワー（引き出し）メニューを制御します。
 * タグリストやメニューを表示する際に使用されます。
 * 
 * 機能：
 * - ドロワーの開閉制御
 * - オーバーレイの表示制御
 * - ESCキーでの閉じる操作
 * - ドロワー内リンククリック時の自動閉じる処理
 */

(function() {
    'use strict';

    /**
     * ドロワーを開く
     * 
     * ドロワーとオーバーレイに適切なクラスを追加し、bodyのスクロールを無効化します。
     * 
     * @param {HTMLElement} drawer - ドロワー要素
     * @param {HTMLElement} overlay - オーバーレイ要素
     */
    function openDrawer(drawer, overlay) {
        if (!drawer || !overlay) {
            console.warn('[Drawer] openDrawer called with invalid elements');
            return;
        }
        
        // ドロワーとオーバーレイを表示
        drawer.classList.add('is-open');
        overlay.classList.add('is-active');
        
        // bodyのスクロールを無効化（ドロワー表示中は背景がスクロールしないように）
        document.body.style.overflow = 'hidden';
    }

    /**
     * ドロワーを閉じる
     * 
     * ドロワーとオーバーレイからクラスを削除し、bodyのスクロールを有効化します。
     * 
     * @param {HTMLElement} drawer - ドロワー要素
     * @param {HTMLElement} overlay - オーバーレイ要素
     */
    function closeDrawer(drawer, overlay) {
        if (!drawer || !overlay) {
            console.warn('[Drawer] closeDrawer called with invalid elements:', { drawer, overlay });
            return;
        }
        
        // ドロワーとオーバーレイを非表示
        drawer.classList.remove('is-open');
        overlay.classList.remove('is-active');
        
        // bodyのスクロールを有効化
        document.body.style.overflow = '';
    }

    /**
     * ドロワーを初期化
     * 
     * トリガーボタン、閉じるボタン、オーバーレイ、ESCキーなどのイベントリスナーを設定します。
     * 
     * @param {string} triggerSelector - トリガーボタンのセレクタ
     * @param {string} drawerId - ドロワーのID
     * @param {string} overlayId - オーバーレイのID
     */
    function initDrawer(triggerSelector, drawerId, overlayId) {
        const trigger = document.querySelector(triggerSelector);
        const drawer = document.getElementById(drawerId);
        const overlay = document.getElementById(overlayId);
        
        // 必要な要素が存在しない場合は処理を中断
        if (!trigger || !drawer || !overlay) {
            console.warn('[Drawer] Required elements not found:', { triggerSelector, drawerId, overlayId });
            return;
        }

        // トリガーボタンのクリックイベント：ドロワーを開く
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openDrawer(drawer, overlay);
        });

        // 閉じるボタンのクリックイベント：ドロワーを閉じる
        const closeBtn = drawer.querySelector('.drawer__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeDrawer(drawer, overlay);
            });
        }

        // オーバーレイのクリックイベント：ドロワーを閉じる（背景クリックで閉じる）
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeDrawer(drawer, overlay);
        });

        // ESCキーで閉じる：キーボード操作での閉じる処理
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
                closeDrawer(drawer, overlay);
            }
        });

        // ドロワー内のリンクをクリックしたら閉じる
        // 内部リンクの場合は遷移を確認できるように少し遅延させてから閉じる
        const links = drawer.querySelectorAll('a');
        links.forEach(function(link) {
            link.addEventListener('click', function() {
                // 外部リンク（target="_blank"）の場合は閉じない
                if (link.hasAttribute('target')) {
                    return;
                }
                // 内部リンクの場合は、遷移を確認できるように100ms遅延させてから閉じる
                setTimeout(function() {
                    closeDrawer(drawer, overlay);
                }, 100);
            });
        });
    }

    // グローバルに公開（他のスクリプトからも使用可能にする）
    window.Drawer = {
        init: initDrawer,
        open: openDrawer,
        close: closeDrawer
    };

    /**
     * 自動初期化処理
     * data-drawer-trigger属性を持つ要素を自動的に検出して初期化
     */
    function autoInit() {
        const drawers = document.querySelectorAll('[data-drawer-trigger]');
        drawers.forEach(function(trigger) {
            const drawerId = trigger.getAttribute('data-drawer-trigger');
            const overlayId = trigger.getAttribute('data-drawer-overlay') || 'drawer-overlay';
            initDrawer('[data-drawer-trigger="' + drawerId + '"]', drawerId, overlayId);
        });
    }

    // DOMContentLoaded時に自動初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        // 既にDOMが読み込まれている場合は即座に実行
        autoInit();
    }
})();

