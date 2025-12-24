// scripts/regenerate-diary-only.js
// Contentfulからdiaryエントリーのみを取得してmdファイルを再生成するスクリプト

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('contentful');

// ★ 公式: Rich Text → HTML
const { documentToHtmlString } = require('@contentful/rich-text-html-renderer');

// ★ HTML → Markdown
const TurndownService = require('turndown');
const turndown = new TurndownService();

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
        const html = documentToHtmlString(f.body);
        body = turndown.turndown(html);
        // YouTube URLをyoutube:VIDEO_ID形式に変換
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
  } catch (error) {
    if (error.message && error.message.includes('Content type')) {
      console.warn('Warning: Diary content type not found in Contentful. Skipping diary processing.');
      console.warn('This might be normal if you haven\'t set up the diary content type yet.');
    } else {
      throw error;
    }
  }
}

processDiary().then(() => {
  console.log('Done.');
}).catch(err => {
  console.error(err);
  process.exit(1);
});

