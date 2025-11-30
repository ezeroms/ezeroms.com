/**
 * ランダム画像表示機能
 * 
 * トップページで、static/images/top ディレクトリ内の画像をランダムに表示します。
 * キャッシュを回避するために、タイムスタンプをクエリパラメータとして追加します。
 */

(function() {
    'use strict';

    /**
     * ランダム画像を表示
     */
    function initRandomImage() {
        const imageContainer = document.getElementById('image-container');
        const randomImageElement = document.getElementById('randomImage');
        
        // 必要な要素が存在しない場合は処理を中断
        if (!imageContainer || !randomImageElement) {
            return;
        }

        // data-images属性から画像データを取得
        const imagesData = imageContainer.getAttribute('data-images');
        
        if (!imagesData) {
            console.warn('[RandomImage] No images data found');
            return;
        }

        try {
            // JSONデータをパース
            const images = JSON.parse(imagesData);
            
            // 画像が存在する場合、ランダムに1つ選択
            if (images.length > 0) {
                const randomIndex = Math.floor(Math.random() * images.length);
                const randomImage = images[randomIndex].Name;
                
                // キャッシュを回避するためにタイムスタンプを追加
                const timestamp = new Date().getTime();
                const imagePath = '/images/top/' + randomImage + '?v=' + timestamp;
                
                // 画像のsrc属性を設定
                randomImageElement.src = imagePath;
            } else {
                console.warn('[RandomImage] No images available');
            }
        } catch (e) {
            console.error('[RandomImage] Error parsing images data:', e);
        }
    }

    /**
     * 初期化処理
     * DOMContentLoadedイベントを待ってから初期化を実行
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initRandomImage);
        } else {
            // 既にDOMが読み込まれている場合は即座に実行
            initRandomImage();
        }
    }

    // 初期化を実行
    init();
})();


