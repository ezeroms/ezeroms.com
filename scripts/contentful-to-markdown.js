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
  const outDir = path.join(__dirname, '..', 'content', 'diary');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Fetching diary entries from Contentful...');

  const entries = await getAllEntries({
    content_type: 'diary',
    order: '-fields.date',
  });

  console.log(`Found ${entries.length} diary entries.`);

  for (const entry of entries) {
    const f = entry.fields || {};

    const title = f.title || 'Untitled';
    const slug = f.slug || entry.sys.id;
    const date = f.date || new Date().toISOString();
    const tags = Array.isArray(f.tags) ? f.tags : [];

    let body = '';

    // ★ Rich Text → HTML → Markdown
    if (f.body && typeof f.body === 'object' && f.body.nodeType) {
      const html = documentToHtmlString(f.body);
      body = turndown.turndown(html);
    } else if (typeof f.body === 'string') {
      body = f.body;
    }

    const safeTitle = String(title).replace(/"/g, '\\"');

    const frontMatter = `---
title: "${safeTitle}"
date: ${date}
slug: "${slug}"
tags: [${tags.map(t => `"${String(t).replace(/"/g, '\\"')}"`).join(', ')}]
draft: false
---
`;

    const content = frontMatter + '\n' + body + '\n';

    const filePath = path.join(outDir, `${slug}.md`);
    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`Wrote ${filePath}`);
  }
}

async function processTweet() {
  const outDir = path.join(__dirname, '..', 'content', 'tweet');
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
      const tweetMonth = f.tweet_month || getMonthFromDate(date);
      const tags = Array.isArray(f.tweet_tag) ? f.tweet_tag : [];
      const voice = Array.isArray(f.voice_type) ? f.voice_type : [];
      const voiceType = voice.length ? voice[0] : '';
      const place = typeof f.tweet_place === 'string' ? f.tweet_place : '';

      // ★ Rich Text → HTML → Markdown（bodyはRichText）
      let body = '';
      if (f.body && typeof f.body === 'object' && f.body.nodeType) {
        const html = documentToHtmlString(f.body);
        body = turndown.turndown(html);
      } else if (typeof f.body === 'string') {
        body = f.body;
      }

      const yamlArray = (arr) => (arr.length ? '\n' + arr.map(v => `  - "${String(v).replace(/"/g, '\\"')}"`).join('\n') : ' []');
      const yamlString = (value) => String(value).replace(/"/g, '\\"');

      const frontMatter = `---
date: ${date}
tweet_month: ${tweetMonth}
tweet_tag:${yamlArray(tags)}
${voiceType ? `voice_type: "${yamlString(voiceType)}"\n` : ''}${place ? `tweet_place: "${yamlString(place)}"\n` : ''}---
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

async function main() {
  await processDiary();
  await processTweet();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});