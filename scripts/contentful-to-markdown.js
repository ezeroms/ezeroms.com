// scripts/contentful-to-markdown.js

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
  const outDir = path.join(__dirname, '..', 'content', 'column');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Fetching column entries from Contentful...');

  const entries = await getAllEntries({
    content_type: 'diary', // Contentful側のコンテンツタイプIDは 'diary' だが、実際はColumn
    order: '-fields.date',
    include: 0, // リンクされたエントリを含めない（パフォーマンス向上）
  });

  console.log(`Found ${entries.length} column entries.`);

  for (const entry of entries) {
    const f = entry.fields || {};

    const title = f.title || 'Untitled';
    const slug = f.slug || entry.sys.id;
    
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
      const html = documentToHtmlString(f.body);
      body = turndown.turndown(html);
    } else if (typeof f.body === 'string') {
      body = f.body;
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
}

async function processTweet() {
  const outDir = path.join(__dirname, '..', 'content', 'diary');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Fetching tweet entries from Contentful...');

  try {
  const entries = await getAllEntries({
    content_type: 'tweet',
    order: '-fields.date',
    include: 0, // リンクされたエントリを含めない（パフォーマンス向上）
  });

    console.log(`Found ${entries.length} tweet entries.`);

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
      } else if (typeof f.body === 'string') {
        body = f.body;
      }

      const yamlArray = (arr) => (arr.length ? '\n' + arr.map(v => `  - "${String(v).replace(/"/g, '\\"')}"`).join('\n') : '\n  []');
      const yamlString = (value) => String(value).replace(/"/g, '\\"');

      const frontMatter = `---
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
      console.warn('Warning: Tweet content type not found in Contentful. Skipping tweet processing.');
      console.warn('This might be normal if you haven\'t set up the tweet content type yet.');
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
    const entries = await getAllEntries({
      content_type: 'shouldersOfGiants',
      order: '-sys.createdAt',
      include: 0, // リンクされたエントリを含めない（パフォーマンス向上）
    });

    console.log(`Found ${entries.length} shoulders-of-giants entries.`);

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
        const html = documentToHtmlString(f.body);
        body = turndown.turndown(html);
      } else if (typeof f.body === 'string') {
        body = f.body;
      }

      const yamlArray = (arr) => (arr.length ? '\n' + arr.map(v => `  - "${String(v).replace(/"/g, '\\"')}"`).join('\n') : '');
      const yamlString = (value) => String(value).replace(/"/g, '\\"');

      const frontMatter = `---
${topics.length > 0 ? `topic:${yamlArray(topics)}\n` : ''}${bookTitle ? `book_title: "${yamlString(bookTitle)}"\n` : ''}${author ? `author: "${yamlString(author)}"\n` : ''}${publisher ? `publisher: "${yamlString(publisher)}"\n` : ''}${publishedYear ? `published_year: ${publishedYear}\n` : ''}${citationOverride ? `citation_override: "${yamlString(citationOverride)}"\n` : ''}---
`;

      const content = frontMatter + '\n' + body + '\n';

      const filePath = path.join(outDir, `${slug}.md`);
      fs.writeFileSync(filePath, content, 'utf8');

      console.log(`Wrote ${filePath}`);
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
  await processDiary();
  await processTweet();
  await processShouldersOfGiants();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});