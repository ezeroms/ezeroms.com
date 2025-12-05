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
    function initRandomImage(containerId, imageId, skeletonId) {
        const imageContainer = document.getElementById(containerId);
        const randomImageElement = document.getElementById(imageId);
        const skeletonElement = skeletonId ? document.getElementById(skeletonId) : null;
        
        // 必要な要素が存在しない場合は処理を中断
        if (!imageContainer || !randomImageElement) {
            return;
        }

        // data-images属性から画像データを取得
        const imagesData = imageContainer.getAttribute('data-images');
        
        if (!imagesData) {
            console.warn('[RandomImage] No images data found');
            // 画像がない場合はプレースホルダーを非表示
            if (skeletonElement) {
                skeletonElement.classList.add('hidden');
            }
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
                
                // 画像読み込み完了時の処理
                randomImageElement.addEventListener('load', function() {
                    // 画像が読み込まれたら、loadedクラスを追加して表示
                    randomImageElement.classList.add('loaded');
                    // プレースホルダーを非表示
                    if (skeletonElement) {
                        skeletonElement.classList.add('hidden');
                    }
                });
                
                // 画像読み込みエラー時の処理
                randomImageElement.addEventListener('error', function() {
                    // エラー時もプレースホルダーを非表示
                    if (skeletonElement) {
                        skeletonElement.classList.add('hidden');
                    }
                });
                
                // 画像のsrc属性を設定（これで読み込みが開始される）
                randomImageElement.src = imagePath;
            } else {
                console.warn('[RandomImage] No images available');
                // 画像がない場合はプレースホルダーを非表示
                if (skeletonElement) {
                    skeletonElement.classList.add('hidden');
                }
            }
        } catch (e) {
            console.error('[RandomImage] Error parsing images data:', e);
            // エラー時もプレースホルダーを非表示
            if (skeletonElement) {
                skeletonElement.classList.add('hidden');
            }
        }
    }
    
    /**
     * すべてのランダム画像を初期化
     */
    function initAllRandomImages() {
        // PC版
        initRandomImage('image-container', 'randomImage', 'topPhotoSkeleton');
        // モバイル版
        initRandomImage('image-container-mobile', 'randomImageMobile', 'topPhotoSkeletonMobile');
    }

    /**
     * 初期化処理
     * DOMContentLoadedイベントを待ってから初期化を実行
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAllRandomImages);
        } else {
            // 既にDOMが読み込まれている場合は即座に実行
            initAllRandomImages();
        }
    }

    // 初期化を実行
    init();
})();



