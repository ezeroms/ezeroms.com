// scripts/contentful-to-markdown.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('contentful');

// ★ 公式: Rich Text → HTML
const { documentToHtmlString } = require('@contentful/rich-text-html-renderer');
const { BLOCKS } = require('@contentful/rich-text-types');

// ★ HTML → Markdown
const TurndownService = require('turndown');
const turndown = new TurndownService();

// YouTube URLからビデオIDを抽出（完全なIDを取得）
function extractYouTubeVideoId(url) {
  if (!url) return null;
  
  // https://www.youtube.com/watch?v=VIDEO_ID&feature=share のような場合
  // URLパラメータ（&、#、?、スペース、タブ、改行）までをビデオIDとして取得
  // パターン1: watch?v=VIDEO_ID 形式
  // より寛容な正規表現: v=の後の文字列を取得（&、#、?、スペース、タブ、改行、URL終端まで）
  let match = url.match(/[?&]v=([a-zA-Z0-9_-]{11,})/); // まず11文字以上のIDを試す
  if (match) {
    // URLパラメータで終わる可能性があるので、&、#、?、スペースなどまで
    let videoId = match[1];
    // 次の&、#、?、スペース、タブ、改行までを取得
    const endIndex = videoId.search(/[&#\s\t\n\r]/);
    if (endIndex > 0) {
      videoId = videoId.substring(0, endIndex);
    }
    return videoId;
  }
  
  // 短いIDも試す（8文字以上）
  match = url.match(/[?&]v=([a-zA-Z0-9_-]{8,})/);
  if (match) {
    let videoId = match[1];
    const endIndex = videoId.search(/[&#\s\t\n\r]/);
    if (endIndex > 0) {
      videoId = videoId.substring(0, endIndex);
    }
    return videoId;
  }
  
  // パターン2: youtu.be/VIDEO_ID 形式
  match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (match) {
    let videoId = match[1];
    const endIndex = videoId.search(/[?&#\s\t\n\r]/);
    if (endIndex > 0) {
      videoId = videoId.substring(0, endIndex);
    }
    return videoId;
  }
  
  // パターン3: /embed/VIDEO_ID 形式
  match = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
  if (match) {
    let videoId = match[1];
    const endIndex = videoId.search(/[?&#\s\t\n\r]/);
    if (endIndex > 0) {
      videoId = videoId.substring(0, endIndex);
    }
    return videoId;
  }
  
  return null;
}

// Contentful クライアント
// Content Preview APIを使用して未公開のエントリも取得可能にする
const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
  accessToken: process.env.CONTENTFUL_PREVIEW_TOKEN || process.env.CONTENTFUL_ACCESS_TOKEN,
  host: process.env.CONTENTFUL_PREVIEW_TOKEN ? 'preview.contentful.com' : 'cdn.contentful.com',
});

// 日付からYYYY-MM形式の月を取得
function getMonthFromDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// YouTube URLをyoutube:VIDEO_ID形式に変換
function convertYouTubeUrlsToMarkdown(markdown) {
  if (!markdown) return markdown;
  
  // まず、既存のMarkdownリンク形式のYouTube URLを変換
  // パターン1: [text](https://www.youtube.com/watch?v=VIDEO_ID)
  markdown = markdown.replace(
    /\[([^\]]*)\]\(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(?:[^\)]*)\)/g,
    '[$1](youtube:$2)'
  );
  
  // パターン2: [text](https://youtu.be/VIDEO_ID)
  markdown = markdown.replace(
    /\[([^\]]*)\]\(https?:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)(?:[^\)]*)\)/g,
    '[$1](youtube:$2)'
  );
  
  // パターン3: [text](https://www.youtube.com/embed/VIDEO_ID)
  markdown = markdown.replace(
    /\[([^\]]*)\]\(https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)(?:[^\)]*)\)/g,
    '[$1](youtube:$2)'
  );
  
  // リンクテキストが空の場合: [](https://...)
  markdown = markdown.replace(
    /\[\]\(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)(?:[^\)]*)\)/g,
    '[](youtube:$1)'
  );
  
  // プレーンテキストのYouTube URLを検出して変換
  // パターン1: 行全体がYouTube URLの場合（前後に空白または行の開始/終了）
  markdown = markdown.replace(
    /(^|\s)https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(?:\S*)?(\s|$)/gm,
    '$1[](youtube:$2)$3'
  );
  
  // パターン2: 行全体がyoutu.be URLの場合
  markdown = markdown.replace(
    /(^|\s)https?:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)(?:\S*)?(\s|$)/gm,
    '$1[](youtube:$2)$3'
  );
  
  // パターン3: 段落内のYouTube URL（前後に空白がある）
  markdown = markdown.replace(
    /(\s)https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(?:\S*)?(\s)/g,
    '$1[](youtube:$2)$3'
  );
  
  // パターン4: 段落内のyoutu.be URL
  markdown = markdown.replace(
    /(\s)https?:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)(?:\S*)?(\s)/g,
    '$1[](youtube:$2)$3'
  );
  
  return markdown;
}

// すべてのエントリを取得する（ページネーション対応）
async function getAllEntries(options) {
  const limit = 100; // Contentful APIの最大値
  const allItems = [];
  let skip = 0;
  let total = null;

  while (true) {
    const response = await client.getEntries({
      ...options,
      limit: limit,
      skip: skip,
    });

    // 最初のリクエストで総件数を取得
    if (total === null) {
      total = response.total;
      console.log(`Total entries: ${total}`);
    }

    allItems.push(...response.items);
    
    // すべてのエントリを取得したかチェック
    if (allItems.length >= total || response.items.length < limit) {
      break;
    }
    
    skip += limit;
  }

  return allItems;
}

async function processColumn() {
  const outDir = path.join(__dirname, '..', 'content', 'column');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Fetching column entries from Contentful...');

  // 後方互換性のため、新しいIDを優先、なければ古いIDを試す
  let entries;
  try {
    entries = await getAllEntries({
      content_type: '21x9qoYgM1TRew9Oagxt8s', // 現在のColumnコンテンツタイプ（システムID）
      order: '-fields.date',
      include: 10, // 埋め込まれたアセット（画像）を含める
    });
  } catch (error) {
    // エラーメッセージまたはエラー詳細にContent type関連のエラーが含まれる場合
    const isContentTypeError = error.message && (
      error.message.includes('Content type') || 
      error.message.includes('unknownContentType') ||
      error.message.includes('DOESNOTEXIST')
    ) || (error.response && error.response.data && error.response.data.details && 
          error.response.data.details.errors && 
          error.response.data.details.errors.some(e => e.name === 'unknownContentType'));
    
    if (isContentTypeError) {
      console.log('   Content type "21x9qoYgM1TRew9Oagxt8s" not found, trying "column"...');
      try {
        entries = await getAllEntries({
          content_type: 'column', // 旧ID（後方互換性）
          order: '-fields.date',
          include: 0,
        });
      } catch (error2) {
        console.log('   Content type "column" not found, trying old ID "diary"...');
        entries = await getAllEntries({
          content_type: 'diary', // 旧ID（後方互換性）
          order: '-fields.date',
          include: 0,
        });
      }
    } else {
      throw error;
    }
  }

  console.log(`Found ${entries.length} column entries.`);

  // Contentfulから取得したslugのセットを作成（削除対象の判定用）
  const contentfulSlugs = new Set();
  
  // まず全てのslugを収集
  for (const entry of entries) {
    const f = entry.fields || {};
    let slug = '';
    if (f.slug) {
      if (typeof f.slug === 'string') {
        slug = f.slug;
      } else if (f.slug['ja-JP']) {
        slug = f.slug['ja-JP'];
      } else if (f.slug['en-US']) {
        slug = f.slug['en-US'];
      } else {
        slug = Object.values(f.slug)[0] || entry.sys.id;
      }
    } else {
      slug = entry.sys.id;
    }
    contentfulSlugs.add(slug);
  }
  
  // エントリを処理してファイルを生成
  for (const entry of entries) {
    const f = entry.fields || {};

    const title = f.title || 'Untitled';
    // Contentfulのslugフィールドを直接使用（ロケール対応、フォールバック: エントリID）
    let slug = '';
    if (f.slug) {
      if (typeof f.slug === 'string') {
        slug = f.slug;
      } else if (f.slug['ja-JP']) {
        slug = f.slug['ja-JP'];
      } else if (f.slug['en-US']) {
        slug = f.slug['en-US'];
      } else {
        slug = Object.values(f.slug)[0] || entry.sys.id;
      }
    } else {
      slug = entry.sys.id;
    }
    
    // 日付をISO 8601形式（UTC）に変換
    let date = f.date || new Date().toISOString();
    if (date && typeof date === 'string') {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        date = dateObj.toISOString();
      }
    }
    
    // column_month は Symbol 型（単一文字列）
    const columnMonth = f.column_month || '';
    // column_category は Array 型（Symbol の配列）
    const categories = Array.isArray(f.column_category) ? f.column_category : [];
    // column_tag は Array 型（Symbol の配列）
    const tags = Array.isArray(f.column_tag) ? f.column_tag : [];

    let body = '';

    // ★ Rich Text → HTML → Markdown
    if (f.body && typeof f.body === 'object' && f.body.nodeType) {
      // 画像を処理するカスタムレンダラー
      const options = {
        renderNode: {
          [BLOCKS.EMBEDDED_ASSET]: (node) => {
            const asset = node.data.target;
            if (asset && asset.fields && asset.fields.file) {
              const file = asset.fields.file;
              let url = file.url;
              if (url.startsWith('//')) {
                url = 'https:' + url;
              }
              const title = asset.fields.title || '';
              const description = asset.fields.description || '';
              const alt = title || description || '';
              return `<img src="${url}" alt="${alt.replace(/"/g, '&quot;')}" />`;
            }
            return '';
          },
        },
      };
      let html = documentToHtmlString(f.body, options);
      
      // HTML内のYouTubeリンクを検出して、hrefをyoutube:VIDEO_ID形式に変換
      // より寛容な正規表現で、href属性の値を完全に取得
      html = html.replace(
        /<a\s+([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*?)>(.*?)<\/a>/gi,
        (match, before, url, after, text) => {
          const videoId = extractYouTubeVideoId(url);
          if (videoId) {
            // YouTube URLの場合は、hrefをyoutube:VIDEO_ID形式に変換
            return `<a href="youtube:${videoId}" class="youtube-link" data-youtube-id="${videoId}">${text}</a>`;
          }
          return match; // YouTube URLでない場合はそのまま
        }
      );
      
        // HTML内のプレーンテキストのYouTube URLも検出して<a>タグに変換
        // <p>https://youtu.be/zDdiWV_740M</p> のような形式
        html = html.replace(
          /(https?:\/\/[^\s<>"']*youtu[^\s<>"']*)/gi,
          (match) => {
            const videoId = extractYouTubeVideoId(match);
            if (videoId) {
              // <a>タグに変換（Turndownが認識できるように）
              return `<a href="youtube:${videoId}"></a>`;
            }
            return match;
          }
        );
        
        body = turndown.turndown(html);
        
        // Turndownで変換されたMarkdownリンクをYouTube形式に変換
        // エスケープされた形式も含めて処理
        body = body.replace(
          /\\?\[\s*\\?\]\s*\(\s*youtube:\s*([a-zA-Z0-9_-]+)\s*\)/g,
          '[](youtube:$1)'
        );
        body = body.replace(
          /\[([^\]]*)\]\(youtube:([a-zA-Z0-9_-]+)\)/g,
          '[$1](youtube:$2)'
        );
        
        // YouTube URLをyoutube:VIDEO_ID形式に変換（念のため再度処理）
        body = convertYouTubeUrlsToMarkdown(body);
    } else if (typeof f.body === 'string') {
      body = f.body;
      // YouTube URLをyoutube:VIDEO_ID形式に変換
      body = convertYouTubeUrlsToMarkdown(body);
    }

    const safeTitle = String(title).replace(/"/g, '\\"');
    const yamlArray = (arr) => (arr.length ? '\n' + arr.map(v => `  - "${String(v).replace(/"/g, '\\"')}"`).join('\n') : '');

    const frontMatter = `---
title: "${safeTitle}"
date: ${date}
slug: "${slug}"
${columnMonth ? `column_month:\n  - "${String(columnMonth).replace(/"/g, '\\"')}"\n` : ''}${categories.length > 0 ? `column_category:${yamlArray(categories)}\n` : ''}${tags.length > 0 ? `column_tag:${yamlArray(tags)}\n` : ''}---
`;

    const content = frontMatter + '\n' + body + '\n';

    const filePath = path.join(outDir, `${slug}.md`);
    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`Wrote ${filePath}`);
  }
  
  // Contentfulに存在しないファイルを削除
  console.log('\nChecking for files to delete...');
  const existingFiles = fs.readdirSync(outDir);
  let deletedCount = 0;
  for (const file of existingFiles) {
    if (file === '_index.md') continue; // _index.mdは削除しない
    if (!file.endsWith('.md')) continue;
    
    const fileSlug = file.replace(/\.md$/, '');
    if (!contentfulSlugs.has(fileSlug)) {
      const filePath = path.join(outDir, file);
      fs.unlinkSync(filePath);
      console.log(`Deleted ${filePath} (not found in Contentful)`);
      deletedCount++;
    }
  }
  if (deletedCount > 0) {
    console.log(`Deleted ${deletedCount} file(s) that were not found in Contentful.`);
  }
}

async function processDiary() {
  const outDir = path.join(__dirname, '..', 'content', 'diary');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Fetching diary entries from Contentful...');

  try {
    // 後方互換性のため、新しいIDを優先、なければ古いIDを試す
    let entries;
    try {
      // まず現在のDiaryコンテンツタイプIDを試す
      entries = await getAllEntries({
        content_type: '2Kymz8f5lsk5BSap6oSM9L', // 現在のDiaryコンテンツタイプ（システムID: 2Kymz8f5lsk5BSap6oSM9L）
        order: '-fields.date',
        include: 0,
      });
    } catch (error) {
      // 'diary_new'が見つからない場合は、'tweet'を試す（移行前のDiaryコンテンツ）
      const isContentTypeError = error.message && (
        error.message.includes('Content type') || 
        error.message.includes('unknownContentType') ||
        error.message.includes('DOESNOTEXIST')
      ) || (error.response && error.response.data && error.response.data.details && 
            error.response.data.details.errors && 
            error.response.data.details.errors.some(e => e.name === 'unknownContentType'));
      
      if (isContentTypeError) {
        console.log('   Content type "2Kymz8f5lsk5BSap6oSM9L" not found, trying "tweet"...');
        try {
          entries = await getAllEntries({
            content_type: 'tweet', // 移行前のDiaryコンテンツタイプ（後方互換性）
            order: '-fields.date',
            include: 0,
          });
        } catch (error2) {
          // 'tweet'も見つからない場合は、'diary'を試す
          const isContentTypeError2 = error2.message && (
            error2.message.includes('Content type') || 
            error2.message.includes('unknownContentType') ||
            error2.message.includes('DOESNOTEXIST')
          ) || (error2.response && error2.response.data && error2.response.data.details && 
                error2.response.data.details.errors && 
                error2.response.data.details.errors.some(e => e.name === 'unknownContentType'));
          
          if (isContentTypeError2) {
            console.log('   Content type "tweet" not found, trying "diary"...');
            entries = await getAllEntries({
              content_type: 'diary', // 旧ID（後方互換性）
              order: '-fields.date',
              include: 0,
            });
          } else {
            throw error2;
          }
        }
      } else {
        throw error;
      }
    }

    console.log(`Found ${entries.length} diary entries.`);

    // Contentfulから取得したslugのセットを作成（削除対象の判定用）
    const contentfulSlugs = new Set();
    
    // まず全てのslugを収集
    for (const entry of entries) {
      const f = entry.fields || {};
      const slug = f.slug || entry.sys.id;
      contentfulSlugs.add(slug);
    }
    
    // エントリを処理してファイルを生成
    for (const entry of entries) {
      const f = entry.fields || {};

      // 日付をISO 8601形式（UTC）に変換
      let date = f.date || new Date().toISOString();
      if (date && typeof date === 'string') {
        // Dateオブジェクトに変換してからISO形式に変換（タイムゾーン情報を正しく処理）
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          date = dateObj.toISOString();
        }
      }
      
      // Contentfulのslugフィールドを直接使用（フォールバック: エントリID）
      const slug = f.slug || entry.sys.id;
      // diary_month は Symbol 型（単一文字列）だが、Hugo側では配列として扱う
      // フィールド名の互換性: diary_month を優先、tweet_month は後方互換性のため
      let diaryMonth = '';
      if (f.diary_month) {
        diaryMonth = Array.isArray(f.diary_month) ? f.diary_month[0] : f.diary_month;
      } else if (f.tweet_month) {
        diaryMonth = Array.isArray(f.tweet_month) ? f.tweet_month[0] : f.tweet_month;
      } else {
        diaryMonth = getMonthFromDate(date);
      }
      // フィールド名の互換性: diary_tag を優先、tweet_tag は後方互換性のため
      const tags = Array.isArray(f.diary_tag) ? f.diary_tag : (Array.isArray(f.tweet_tag) ? f.tweet_tag : []);
      // voice_type は Array 型（"loud", "louder", "secret", "shaky" のいずれか）
      const voice = Array.isArray(f.voice_type) ? f.voice_type : [];
      const voiceType = voice.length ? voice[0] : '';
      // フィールド名の互換性: diary_place を優先、tweet_place は後方互換性のため
      const place = typeof f.diary_place === 'string' ? f.diary_place : (typeof f.tweet_place === 'string' ? f.tweet_place : '');

      // ★ Rich Text → HTML → Markdown（bodyはRichText）
      let body = '';
      if (f.body && typeof f.body === 'object' && f.body.nodeType) {
        // 画像を処理するカスタムレンダラー
        const options = {
          renderNode: {
            [BLOCKS.EMBEDDED_ASSET]: (node) => {
              const asset = node.data.target;
              if (asset && asset.fields && asset.fields.file) {
                const file = asset.fields.file;
                let url = file.url;
                if (url.startsWith('//')) {
                  url = 'https:' + url;
                }
                const title = asset.fields.title || '';
                const description = asset.fields.description || '';
                const alt = title || description || '';
                return `<img src="${url}" alt="${alt.replace(/"/g, '&quot;')}" />`;
              }
              return '';
            },
          },
        };
        let html = documentToHtmlString(f.body, options);
        
        // HTML内のYouTubeリンクを検出して、hrefをyoutube:VIDEO_ID形式に変換
        // より寛容な正規表現で、href属性の値を完全に取得
        html = html.replace(
          /<a\s+([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*?)>(.*?)<\/a>/gi,
          (match, before, url, after, text) => {
            const videoId = extractYouTubeVideoId(url);
            if (videoId) {
              return `<a href="youtube:${videoId}" class="youtube-link" data-youtube-id="${videoId}">${text}</a>`;
            }
            return match;
          }
        );
        
        // HTML内のプレーンテキストのYouTube URLも検出して<a>タグに変換
        // <p>https://youtu.be/zDdiWV_740M</p> のような形式
        html = html.replace(
          /(https?:\/\/[^\s<>"']*youtu[^\s<>"']*)/gi,
          (match) => {
            const videoId = extractYouTubeVideoId(match);
            if (videoId) {
              // <a>タグに変換（Turndownが認識できるように）
              return `<a href="youtube:${videoId}"></a>`;
            }
            return match;
          }
        );
        
        body = turndown.turndown(html);
        
        // Turndownで変換されたMarkdownリンクをYouTube形式に変換
        // エスケープされた形式も含めて処理
        body = body.replace(
          /\\?\[\s*\\?\]\s*\(\s*youtube:\s*([a-zA-Z0-9_-]+)\s*\)/g,
          '[](youtube:$1)'
        );
        body = body.replace(
          /\[([^\]]*)\]\(youtube:([a-zA-Z0-9_-]+)\)/g,
          '[$1](youtube:$2)'
        );
        
        // YouTube URLをyoutube:VIDEO_ID形式に変換（念のため再度処理）
        body = convertYouTubeUrlsToMarkdown(body);
      } else if (typeof f.body === 'string') {
        body = f.body;
        // YouTube URLをyoutube:VIDEO_ID形式に変換
        body = convertYouTubeUrlsToMarkdown(body);
      }

      const yamlArray = (arr) => (arr.length ? '\n' + arr.map(v => `  - "${String(v).replace(/"/g, '\\"')}"`).join('\n') : '\n  []');
      const yamlString = (value) => String(value).replace(/"/g, '\\"');

      const frontMatter = `---
slug: "${yamlString(slug)}"
date: ${date}
diary_month:
  - ${diaryMonth}
diary_tag:${yamlArray(tags)}
${voiceType ? `voice_type: "${yamlString(voiceType)}"\n` : ''}${place ? `diary_place: "${yamlString(place)}"\n` : ''}---
`;

      const content = frontMatter + '\n' + body + '\n';

      const filePath = path.join(outDir, `${slug}.md`);
      fs.writeFileSync(filePath, content, 'utf8');

      console.log(`Wrote ${filePath}`);
    }
    
    // Contentfulに存在しないファイルを削除
    console.log('\nChecking for files to delete...');
    const existingFiles = fs.readdirSync(outDir);
    let deletedCount = 0;
    for (const file of existingFiles) {
      if (file === '_index.md') continue; // _index.mdは削除しない
      if (!file.endsWith('.md')) continue;
      
      const fileSlug = file.replace(/\.md$/, '');
      if (!contentfulSlugs.has(fileSlug)) {
        const filePath = path.join(outDir, file);
        fs.unlinkSync(filePath);
        console.log(`Deleted ${filePath} (not found in Contentful)`);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      console.log(`Deleted ${deletedCount} file(s) that were not found in Contentful.`);
    }
  } catch (error) {
    if (error.message && error.message.includes('Content type')) {
      console.warn('Warning: Diary content type not found in Contentful. Skipping diary processing.');
      console.warn('This might be normal if you haven\'t set up the diary content type yet.');
    } else {
      throw error;
    }
  }
}

async function processShouldersOfGiants() {
  const outDir = path.join(__dirname, '..', 'content', 'shoulders-of-giants');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Fetching shoulders-of-giants entries from Contentful...');

  try {
    // 後方互換性のため、新しいIDを優先、なければ古いIDを試す
    let entries;
    try {
      entries = await getAllEntries({
        content_type: '3iZ9V9Emr1bFMBMKGYsCCB', // 現在のShoulders of Giantsコンテンツタイプ（システムID）
        order: '-sys.createdAt',
        include: 0, // リンクされたエントリを含めない（パフォーマンス向上）
      });
    } catch (error) {
      // エラーメッセージまたはエラー詳細にContent type関連のエラーが含まれる場合
      const isContentTypeError = error.message && (
        error.message.includes('Content type') || 
        error.message.includes('unknownContentType') ||
        error.message.includes('DOESNOTEXIST')
      ) || (error.response && error.response.data && error.response.data.details && 
            error.response.data.details.errors && 
            error.response.data.details.errors.some(e => e.name === 'unknownContentType'));
      
      if (isContentTypeError) {
        console.log('   Content type "3iZ9V9Emr1bFMBMKGYsCCB" not found, trying "shoulders_of_giants"...');
        try {
          entries = await getAllEntries({
            content_type: 'shoulders_of_giants', // 旧ID（後方互換性）
            order: '-sys.createdAt',
            include: 0,
          });
        } catch (error2) {
          console.log('   Content type "shoulders_of_giants" not found, trying old ID "shouldersOfGiants"...');
          entries = await getAllEntries({
            content_type: 'shouldersOfGiants', // 旧ID（後方互換性）
            order: '-sys.createdAt',
            include: 0,
          });
        }
      } else {
        throw error;
      }
    }

    console.log(`Found ${entries.length} shoulders-of-giants entries.`);

    // Contentfulから取得したslugのセットを作成（削除対象の判定用）
    const contentfulSlugs = new Set();
    
    // まず全てのslugを収集
    for (const entry of entries) {
      const f = entry.fields || {};
      const slug = f.slug || entry.sys.id;
      contentfulSlugs.add(slug);
    }
    
    // エントリを処理してファイルを生成
    for (const entry of entries) {
      const f = entry.fields || {};

      // Contentfulのslugフィールドを直接使用（フォールバック: エントリID）
      const slug = f.slug || entry.sys.id;

      // topic は Array 型（Symbol の配列）
      const topics = Array.isArray(f.topic) ? f.topic : [];

      // 引用情報
      const bookTitle = typeof f.book_title === 'string' ? f.book_title : '';
      const author = typeof f.author === 'string' ? f.author : '';
      const publisher = typeof f.publisher === 'string' ? f.publisher : '';
      const publishedYear = typeof f.published_year === 'string' ? f.published_year : '';
      const citationOverride = typeof f.citation_override === 'string' ? f.citation_override : '';

      // ★ Rich Text → HTML → Markdown（bodyはRichText）
      let body = '';
      if (f.body && typeof f.body === 'object' && f.body.nodeType) {
        // 画像を処理するカスタムレンダラー
        const options = {
          renderNode: {
            [BLOCKS.EMBEDDED_ASSET]: (node) => {
              const asset = node.data.target;
              if (asset && asset.fields && asset.fields.file) {
                const file = asset.fields.file;
                let url = file.url;
                if (url.startsWith('//')) {
                  url = 'https:' + url;
                }
                const title = asset.fields.title || '';
                const description = asset.fields.description || '';
                const alt = title || description || '';
                return `<img src="${url}" alt="${alt.replace(/"/g, '&quot;')}" />`;
              }
              return '';
            },
          },
        };
        let html = documentToHtmlString(f.body, options);
        
        // HTML内のYouTubeリンクを検出して、hrefをyoutube:VIDEO_ID形式に変換
        // より寛容な正規表現で、href属性の値を完全に取得
        html = html.replace(
          /<a\s+([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*?)>(.*?)<\/a>/gi,
          (match, before, url, after, text) => {
            const videoId = extractYouTubeVideoId(url);
            if (videoId) {
              return `<a href="youtube:${videoId}" class="youtube-link" data-youtube-id="${videoId}">${text}</a>`;
            }
            return match;
          }
        );
        
        // HTML内のプレーンテキストのYouTube URLも検出して<a>タグに変換
        // <p>https://youtu.be/zDdiWV_740M</p> のような形式
        html = html.replace(
          /(https?:\/\/[^\s<>"']*youtu[^\s<>"']*)/gi,
          (match) => {
            const videoId = extractYouTubeVideoId(match);
            if (videoId) {
              // <a>タグに変換（Turndownが認識できるように）
              return `<a href="youtube:${videoId}"></a>`;
            }
            return match;
          }
        );
        
        body = turndown.turndown(html);
        
        // Turndownで変換されたMarkdownリンクをYouTube形式に変換
        // エスケープされた形式も含めて処理
        body = body.replace(
          /\\?\[\s*\\?\]\s*\(\s*youtube:\s*([a-zA-Z0-9_-]+)\s*\)/g,
          '[](youtube:$1)'
        );
        body = body.replace(
          /\[([^\]]*)\]\(youtube:([a-zA-Z0-9_-]+)\)/g,
          '[$1](youtube:$2)'
        );
        
        // YouTube URLをyoutube:VIDEO_ID形式に変換（念のため再度処理）
        body = convertYouTubeUrlsToMarkdown(body);
      } else if (typeof f.body === 'string') {
        body = f.body;
        // YouTube URLをyoutube:VIDEO_ID形式に変換
        body = convertYouTubeUrlsToMarkdown(body);
      }

      const yamlArray = (arr) => (arr.length ? '\n' + arr.map(v => `  - "${String(v).replace(/"/g, '\\"')}"`).join('\n') : '');
      const yamlString = (value) => String(value).replace(/"/g, '\\"');

      const frontMatter = `---
slug: "${yamlString(slug)}"
${topics.length > 0 ? `topic:${yamlArray(topics)}\n` : ''}${bookTitle ? `book_title: "${yamlString(bookTitle)}"\n` : ''}${author ? `author: "${yamlString(author)}"\n` : ''}${publisher ? `publisher: "${yamlString(publisher)}"\n` : ''}${publishedYear ? `published_year: ${publishedYear}\n` : ''}${citationOverride ? `citation_override: "${yamlString(citationOverride)}"\n` : ''}---
`;

      const content = frontMatter + '\n' + body + '\n';

      const filePath = path.join(outDir, `${slug}.md`);
      fs.writeFileSync(filePath, content, 'utf8');

      console.log(`Wrote ${filePath}`);
    }
    
    // Contentfulに存在しないファイルを削除
    console.log('\nChecking for files to delete...');
    const existingFiles = fs.readdirSync(outDir);
    let deletedCount = 0;
    for (const file of existingFiles) {
      if (file === '_index.md') continue; // _index.mdは削除しない
      if (!file.endsWith('.md')) continue;
      
      const fileSlug = file.replace(/\.md$/, '');
      if (!contentfulSlugs.has(fileSlug)) {
        const filePath = path.join(outDir, file);
        fs.unlinkSync(filePath);
        console.log(`Deleted ${filePath} (not found in Contentful)`);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      console.log(`Deleted ${deletedCount} file(s) that were not found in Contentful.`);
    }
  } catch (error) {
    if (error.message && error.message.includes('Content type')) {
      console.warn('Warning: Shoulders of Giants content type not found in Contentful. Skipping shoulders-of-giants processing.');
      console.warn('This might be normal if you haven\'t set up the shoulders-of-giants content type yet.');
    } else {
      throw error;
    }
  }
}

async function main() {
  await processColumn();
  await processDiary();
  await processShouldersOfGiants();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});