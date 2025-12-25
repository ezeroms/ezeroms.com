// scripts/delete-contentful-duplicates.js
require('dotenv').config();
const { createClient } = require('contentful');
const contentfulManagement = require('contentful-management');
const { documentToPlainTextString } = require('@contentful/rich-text-plain-text-renderer');

// Contentful Delivery API クライアント（読み取り用）
const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
  accessToken: process.env.CONTENTFUL_PREVIEW_TOKEN || process.env.CONTENTFUL_ACCESS_TOKEN,
  host: process.env.CONTENTFUL_PREVIEW_TOKEN ? 'preview.contentful.com' : 'cdn.contentful.com',
});

// Contentful Management API クライアント（削除用）
const managementClient = contentfulManagement.createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
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

async function deleteDuplicates(dryRun = true) {
  console.log(`Fetching shoulders-of-giants entries from Contentful... (dry-run: ${dryRun})\n`);
  
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
    });
  }

  // 重複を検出
  const toDelete = [];
  for (const [body, entriesList] of bodyToEntries.entries()) {
    if (entriesList.length > 1 && body.length > 0) {
      // 作成日時でソート（古い順）- 最初のエントリを残し、残りを削除対象に
      entriesList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      for (let j = 1; j < entriesList.length; j++) {
        toDelete.push(entriesList[j]);
      }
    }
  }

  if (toDelete.length === 0) {
    console.log('No duplicate entries found in Contentful.');
    return;
  }

  console.log(`Found ${toDelete.length} duplicate entries to delete.\n`);

  if (dryRun) {
    console.log('DRY RUN MODE - No entries will be deleted.\n');
    console.log('Entries that would be deleted:');
    for (const entry of toDelete.slice(0, 20)) {
      console.log(`  - ID: ${entry.id}, Slug: ${entry.slug}, Created: ${entry.createdAt}`);
    }
    if (toDelete.length > 20) {
      console.log(`  ... and ${toDelete.length - 20} more entries.`);
    }
    console.log(`\nTo actually delete these entries, run with: node scripts/delete-contentful-duplicates.js --execute`);
    return;
  }

  // 実際に削除
  const space = await managementClient.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');

  console.log('Deleting duplicate entries...\n');
  let deletedCount = 0;
  let errorCount = 0;

  for (const entry of toDelete) {
    try {
      const entryToDelete = await environment.getEntry(entry.id);
      await entryToDelete.unpublish();
      await entryToDelete.delete();
      console.log(`Deleted: ${entry.id} (slug: ${entry.slug})`);
      deletedCount++;
    } catch (error) {
      console.error(`Error deleting ${entry.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\nDeleted ${deletedCount} entries. ${errorCount} errors.`);
}

// 実行
const args = process.argv.slice(2);
const execute = args.includes('--execute') || args.includes('-e');

deleteDuplicates(!execute)
  .then(() => {
    console.log('\nDone.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

