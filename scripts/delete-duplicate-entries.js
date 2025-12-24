// scripts/delete-duplicate-entries.js
// 重複しているエントリ（同じslugを持つエントリ）を削除するスクリプト
// 各slugについて、最新の1つを残して他を削除します

require('dotenv').config();
const { createClient } = require('contentful-management');

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

async function deleteDuplicateEntries() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');

  console.log('Checking for duplicate entries...\n');
  
  const contentTypes = await environment.getContentTypes();
  
  // すべてのエントリを取得してslugでグループ化
  const entriesBySlug = {};
  const contentTypesToCheck = [];
  
  // 主要なコンテンツタイプを確認
  for (const contentType of contentTypes.items) {
    const typeId = contentType.sys.id;
    const typeName = contentType.name;
    
    // 主要なコンテンツタイプのみチェック
    if (['Column', 'Diary', 'Shoulders of Giants', 'About', 'Work'].includes(typeName) || 
        typeId.includes('Column') || typeId.includes('Diary') || typeId.includes('Shoulders') || 
        typeId.includes('shoulders') || typeId === 'about' || typeId === 'work') {
      contentTypesToCheck.push({ id: typeId, name: typeName });
    }
  }
  
  // 各コンテンツタイプからエントリを取得
  for (const ct of contentTypesToCheck) {
    try {
      const entries = await environment.getEntries({
        content_type: ct.id,
        limit: 1000,
      });
      
      for (const entry of entries.items) {
        const slug = entry.fields.slug?.['ja-JP'] || entry.fields.slug?.['en-US'] || entry.sys.id;
        
        if (!entriesBySlug[slug]) {
          entriesBySlug[slug] = [];
        }
        
        entriesBySlug[slug].push({
          entry: entry,
          id: entry.sys.id,
          contentType: ct.name,
          contentTypeId: ct.id,
          slug: slug,
          published: entry.isPublished(),
          updatedAt: new Date(entry.sys.updatedAt),
        });
      }
    } catch (error) {
      console.error(`Error fetching entries for ${ct.name} (${ct.id}):`, error.message);
    }
  }
  
  // 重複を検出
  const duplicates = [];
  for (const [slug, entries] of Object.entries(entriesBySlug)) {
    if (entries.length > 1) {
      // 最新の1つを残して他を削除対象に
      const sorted = entries.sort((a, b) => b.updatedAt - a.updatedAt);
      const keep = sorted[0];
      const toDelete = sorted.slice(1);
      
      duplicates.push({ slug, keep, toDelete });
    }
  }
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate entries found.\n');
    return;
  }
  
  console.log(`⚠️  Found ${duplicates.length} duplicate slugs with ${duplicates.reduce((sum, d) => sum + d.toDelete.length, 0)} entries to delete.\n`);
  
  let totalDeleted = 0;
  let totalErrors = 0;
  
  for (const duplicate of duplicates) {
    console.log(`\nProcessing slug: "${duplicate.slug}"`);
    console.log(`  Keeping: ${duplicate.keep.id} (${duplicate.keep.contentType}, updated: ${duplicate.keep.updatedAt.toISOString()})`);
    console.log(`  Deleting ${duplicate.toDelete.length} duplicates:`);
    
    for (const entryInfo of duplicate.toDelete) {
      try {
        const entry = entryInfo.entry;
        
        // 公開されている場合は非公開にする
        if (entry.isPublished()) {
          await entry.unpublish();
        }
        
        // 削除
        await entry.delete();
        
        console.log(`    ✅ Deleted ${entryInfo.id} (${entryInfo.contentType})`);
        totalDeleted++;
        
        // レート制限を避けるために少し待機
        if (totalDeleted % 10 === 0) {
          console.log('    Waiting 1 second to avoid rate limiting...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`    ❌ Error deleting ${entryInfo.id}:`, error.message);
        totalErrors++;
      }
    }
  }
  
  console.log('\n=== Deletion Summary ===');
  console.log(`✅ Successfully deleted: ${totalDeleted}`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log(`📊 Total duplicates processed: ${duplicates.length}`);
}

deleteDuplicateEntries().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

