// scripts/contentful-to-markdown.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('contentful');
const { documentToPlainTextString } = require('@contentful/rich-text-plain-text-renderer');

// Contentful クライアント
const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

async function main() {
  const outDir = path.join(__dirname, '..', 'content', 'diary'); // Hugo の diary 用ディレクトリ
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Fetching entries from Contentful...');

  const entries = await client.getEntries({
    content_type: 'diary', // ← Diary モデルの API ID に合わせる
    limit: 1000,
    order: '-fields.date',
  });

  console.log(`Found ${entries.items.length} diary entries.`);

  for (const entry of entries.items) {
    const f = entry.fields || {};

    const title = f.title || 'Untitled';
    const slug = f.slug || entry.sys.id;
    const date = f.date || new Date().toISOString();

    // tags は配列前提に揃える
    const tags = Array.isArray(f.tags) ? f.tags : [];

    // body は string / Rich Text 両対応
    let body = '';
    if (typeof f.body === 'string') {
      body = f.body;
    } else if (f.body && typeof f.body === 'object' && f.body.nodeType) {
      // Rich Text をプレーンテキスト化
      body = documentToPlainTextString(f.body);
    } else {
      body = '';
    }

    // YAML で問題が出ないようにダブルクオートをエスケープ
    const safeTitle = String(title).replace(/"/g, '\\"');

    const frontMatter = `---
title: "${safeTitle}"
date: ${date}
slug: "${slug}"
tags: [${tags.map(t => `"${String(t).replace(/"/g, '\\"')}"`).join(', ')}]
draft: false
---
`;

    const content = frontMatter + body + '\n';

    const filePath = path.join(outDir, `${slug}.md`);
    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`Wrote ${filePath}`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});