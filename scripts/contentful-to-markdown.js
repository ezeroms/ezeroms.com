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
const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

// 日付からYYYY-MM形式の月を取得
function getMonthFromDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

async function processDiary() {
  const outDir = path.join(__dirname, '..', 'content', 'diary');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Fetching diary entries from Contentful...');

  const entries = await client.getEntries({
    content_type: 'diary',
    limit: 1000,
    order: '-fields.date',
  });

  console.log(`Found ${entries.items.length} diary entries.`);

  for (const entry of entries.items) {
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
    const entries = await client.getEntries({
      content_type: 'tweet',
      limit: 1000,
      order: '-fields.date',
    });

    console.log(`Found ${entries.items.length} tweet entries.`);

    for (const entry of entries.items) {
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
      const tweetMonth = f.tweetMonth || getMonthFromDate(date);
      const tags = Array.isArray(f.tweetTag) ? f.tweetTag : [];
      const voice = Array.isArray(f.voice_type) ? f.voice_type : [];
      const voiceType = voice.length ? voice[0] : '';
      const emoji = typeof f.emoji === 'string' ? f.emoji : '';
      const place = typeof f.tweetPlace === 'string' ? f.tweetPlace : '';

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
${voiceType ? `voice_type: "${yamlString(voiceType)}"\n` : ''}${place ? `tweet_place: "${yamlString(place)}"\n` : ''}${emoji ? `emoji: "${yamlString(emoji)}"\n` : ''}${emoji ? `tweet_emoji: "${yamlString(emoji)}"\n` : ''}---
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