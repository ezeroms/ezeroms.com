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

async function main() {
  const outDir = path.join(__dirname, '..', 'content', 'diary');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Fetching entries from Contentful...');

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

  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});