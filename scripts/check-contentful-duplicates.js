// scripts/check-contentful-duplicates.js
require('dotenv').config();
const { createClient } = require('contentful');
const { documentToPlainTextString } = require('@contentful/rich-text-plain-text-renderer');

// Contentful クライアント
const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
  accessToken: process.env.CONTENTFUL_PREVIEW_TOKEN || process.env.CONTENTFUL_ACCESS_TOKEN,
  host: process.env.CONTENTFUL_PREVIEW_TOKEN ? 'preview.contentful.com' : 'cdn.contentful.com',
});

async function getAllEntries(options) {
  let allEntries = [];
  let skip = 0;
  const limit = 1000;
  
  while (true) {
    try {
      const response = await client.getEntries({
        ...options,
        skip,
        limit,
      });
      
      allEntries = allEntries.concat(response.items);
      
      if (response.items.length < limit) {
        break;
      }
      
      skip += limit;
    } catch (error) {
      console.error('Error fetching entries:', error);
      throw error;
    }
  }
  
  return allEntries;
}

async function checkDuplicates() {
  console.log('Fetching shoulders-of-giants entries from Contentful...');
  
  let entries;
  try {
    entries = await getAllEntries({
      content_type: '3iZ9V9Emr1bFMBMKGYsCCB',
      order: '-sys.createdAt',
      include: 0,
    });
  } catch (error) {
    try {
      entries = await getAllEntries({
        content_type: 'shoulders_of_giants',
        order: '-sys.createdAt',
        include: 0,
      });
    } catch (error2) {
      entries = await getAllEntries({
        content_type: 'shouldersOfGiants',
        order: '-sys.createdAt',
        include: 0,
      });
    }
  }

  console.log(`Found ${entries.length} entries.\n`);

  // body内容を正規化して重複を検出
  const bodyToEntries = new Map();
  
  for (const entry of entries) {
    const f = entry.fields || {};
    const slug = f.slug || entry.sys.id;
    
    // bodyをプレーンテキストに変換して正規化
    let body = '';
    if (f.body && typeof f.body === 'object' && f.body.nodeType) {
      body = documentToPlainTextString(f.body);
    } else if (typeof f.body === 'string') {
      body = f.body;
    }
    
    // 正規化（空白を統一）
    const normalizedBody = body.replace(/\s+/g, ' ').trim();
    
    if (!bodyToEntries.has(normalizedBody)) {
      bodyToEntries.set(normalizedBody, []);
    }
    bodyToEntries.get(normalizedBody).push({
      id: entry.sys.id,
      slug,
      createdAt: entry.sys.createdAt,
      updatedAt: entry.sys.updatedAt,
      body: body.substring(0, 100) // プレビュー用
    });
  }

  // 重複を検出
  const duplicates = [];
  for (const [body, entries] of bodyToEntries.entries()) {
    if (entries.length > 1 && body.length > 0) {
      duplicates.push({ body: body.substring(0, 150), entries });
    }
  }

  if (duplicates.length === 0) {
    console.log('No duplicate entries found in Contentful.');
    return;
  }

  console.log(`Found ${duplicates.length} duplicate groups in Contentful:\n`);

  for (let i = 0; i < duplicates.length; i++) {
    const { body, entries } = duplicates[i];
    console.log(`Duplicate Group ${i + 1}:`);
    console.log(`  Content preview: ${body}...`);
    console.log(`  Entries (${entries.length}):`);
    
    // 作成日時でソート（古い順）
    entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    for (const entry of entries) {
      console.log(`    - ID: ${entry.id}, Slug: ${entry.slug}, Created: ${entry.createdAt}`);
    }
    console.log('');
  }

  // 削除候補（各グループで最初のエントリ以外）
  console.log('\nRecommended entries to delete (keeping the first/oldest entry in each group):\n');
  const toDelete = [];
  for (const { entries } of duplicates) {
    entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    for (let j = 1; j < entries.length; j++) {
      toDelete.push(entries[j]);
      console.log(`  - ${entries[j].id} (slug: ${entries[j].slug}, created: ${entries[j].createdAt})`);
    }
  }
  console.log(`\nTotal entries to delete: ${toDelete.length}`);
  
  return { duplicates, toDelete };
}

// 実行
checkDuplicates()
  .then(() => {
    console.log('\nDone.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

