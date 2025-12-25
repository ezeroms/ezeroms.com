// scripts/fix-ellipsis-brackets-contentful.js
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

// Contentful Management API クライアント（更新用）
const managementClient = contentfulManagement.createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

// Rich Textドキュメント内のテキストノードを再帰的に修正
function fixEllipsisBracketsInRichText(node) {
  if (!node) return node;
  
  // ノードのコピーを作成
  const fixedNode = { ...node };
  
  // TEXTノードの場合、テキストを置換
  if (node.nodeType === 'text') {
    if (node.value) {
      // \\\[…\] → […]
      let fixedValue = node.value.replace(/\\\[…\]/g, '[…]');
      // \\\[\.\.\.\] → […]
      fixedValue = fixedValue.replace(/\\\[\.\.\.\]/g, '[…]');
      // \\\[ → [
      fixedValue = fixedValue.replace(/\\\[/g, '[');
      // \\\] → ]
      fixedValue = fixedValue.replace(/\\\]/g, ']');
      
      fixedNode.value = fixedValue;
    }
    return fixedNode;
  }
  
  // 子ノードがある場合、再帰的に処理
  if (node.content && Array.isArray(node.content)) {
    fixedNode.content = node.content.map(child => fixEllipsisBracketsInRichText(child));
  }
  
  return fixedNode;
}

async function getAllEntries(options) {
  let allEntries = [];
  let skip = 0;
  const limit = 100;
  
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

async function fixEllipsisBrackets(dryRun = true) {
  console.log(`Fetching shoulders-of-giants entries from Contentful... (dry-run: ${dryRun})\n`);
  
  let entries;
  try {
    entries = await getAllEntries({
      content_type: '3iZ9V9Emr1bFMBMKGYsCCB', // Shoulders of Giants content type ID
      select: 'sys.id,sys.createdAt,sys.updatedAt,fields.slug,fields.body',
      include: 0,
    });
  } catch (error) {
    console.error('Error fetching entries from Contentful:', error);
    return;
  }
  
  console.log(`Found ${entries.length} entries.\n`);
  
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const environmentId = process.env.CONTENTFUL_ENVIRONMENT || 'master';
  
  const space = await managementClient.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);
  
  let updateCount = 0;
  let skipCount = 0;
  
  for (const entry of entries) {
    const f = entry.fields || {};
    const body = f.body;
    
    if (!body || typeof body !== 'object' || !body.nodeType) {
      continue;
    }
    
    // プレーンテキストに変換して確認
    const plainText = documentToPlainTextString(body);
    if (!plainText.includes('\\[') && !plainText.includes('\\]')) {
      continue; // 修正不要
    }
    
    const slug = f.slug ? (typeof f.slug === 'string' ? f.slug : (f.slug['ja-JP'] || f.slug['en-US'] || Object.values(f.slug)[0])) : entry.sys.id;
    
    console.log(`Entry: ${slug} (${entry.sys.id})`);
    console.log(`  Contains escaped brackets, will be fixed`);
    
    if (dryRun) {
      console.log(`  [DRY RUN] Would update this entry\n`);
      updateCount++;
      continue;
    }
    
    try {
      // Management APIでエントリを取得
      const entryToUpdate = await environment.getEntry(entry.sys.id);
      
      // Rich Textドキュメントを修正（既存のbodyフィールドから取得）
      const currentBody = entryToUpdate.fields.body ? entryToUpdate.fields.body['ja-JP'] : body;
      const fixedBody = fixEllipsisBracketsInRichText(currentBody);
      
      // bodyフィールドを更新
      entryToUpdate.fields.body = {
        'ja-JP': fixedBody,
      };
      
      // エントリを更新
      const updatedEntry = await entryToUpdate.update();
      
      // 公開されている場合は公開も維持
      if (updatedEntry.isPublished()) {
        await updatedEntry.publish();
      }
      console.log(`  ✓ Updated\n`);
      updateCount++;
    } catch (err) {
      console.error(`  ✗ Failed to update: ${err.message}\n`);
      skipCount++;
    }
  }
  
  if (dryRun) {
    console.log(`\n[DRY RUN] Would update ${updateCount} entries.`);
    console.log(`To actually update, run with: node scripts/fix-ellipsis-brackets-contentful.js --execute`);
  } else {
    console.log(`\nUpdated ${updateCount} entries.`);
    if (skipCount > 0) {
      console.log(`Skipped ${skipCount} entries due to errors.`);
    }
  }
}

const args = process.argv.slice(2);
const executeFlag = args.includes('--execute');

fixEllipsisBrackets(!executeFlag)
  .then(() => {
    console.log('\nDone.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });

