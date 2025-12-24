// scripts/delete-duplicate-content-type-entries.js
// 重複しているコンテンツタイプのうち、エントリ数が少ない方のエントリを削除するスクリプト

require('dotenv').config();
const { createClient } = require('contentful-management');

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

async function deleteDuplicateContentTypeEntries() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');

  console.log('Fetching all content types...\n');
  const contentTypes = await environment.getContentTypes();
  
  // コンテンツタイプを名前でグループ化
  const contentTypesByName = {};
  for (const contentType of contentTypes.items) {
    const name = contentType.name;
    if (!contentTypesByName[name]) {
      contentTypesByName[name] = [];
    }
    contentTypesByName[name].push({
      id: contentType.sys.id,
      name: contentType.name,
      published: contentType.isPublished(),
      entries: null,
    });
  }
  
  // 重複しているコンテンツタイプを確認
  console.log('=== Finding Duplicates ===\n');
  const duplicates = [];
  
  for (const [name, types] of Object.entries(contentTypesByName)) {
    if (types.length > 1) {
      console.log(`⚠️  "${name}" has ${types.length} instances`);
      duplicates.push({ name, types });
    }
  }
  
  // 各コンテンツタイプのエントリ数を取得
  console.log('\n=== Checking Entry Counts ===\n');
  for (const duplicate of duplicates) {
    for (const type of duplicate.types) {
      try {
        const entries = await environment.getEntries({
          content_type: type.id,
          limit: 1,
        });
        type.entries = entries.total;
        console.log(`   ${type.id} (${duplicate.name}): ${type.entries} entries`);
      } catch (error) {
        console.log(`   ${type.id} (${duplicate.name}): Error - ${error.message}`);
        type.entries = -1;
      }
    }
    console.log('');
  }
  
  // 削除対象を決定（エントリ数が少ない方を削除）
  console.log('=== Determining Deletion Targets ===\n');
  const toDelete = [];
  
  for (const duplicate of duplicates) {
    // エントリ数でソート
    const sortedTypes = duplicate.types.filter(t => t.entries >= 0).sort((a, b) => b.entries - a.entries);
    
    if (sortedTypes.length > 1) {
      // エントリ数が最も多いものを残す
      const keepType = sortedTypes[0];
      console.log(`✅ Keeping "${duplicate.name}": ${keepType.id} (${keepType.entries} entries)`);
      
      // 残りのものを削除対象に
      for (let i = 1; i < sortedTypes.length; i++) {
        const type = sortedTypes[i];
        toDelete.push({
          id: type.id,
          name: duplicate.name,
          entries: type.entries,
        });
        console.log(`   ❌ Will delete entries from: ${type.id} (${type.entries} entries)`);
      }
    }
    console.log('');
  }
  
  if (toDelete.length === 0) {
    console.log('No duplicate content types to clean up.\n');
    return;
  }
  
  // エントリを削除
  console.log(`\n=== Deleting Entries from ${toDelete.length} Content Types ===\n`);
  let totalDeleted = 0;
  let totalErrors = 0;
  
  for (const type of toDelete) {
    console.log(`\n--- Processing ${type.name} (${type.id}) ---\n`);
    
    try {
      const entries = await environment.getEntries({
        content_type: type.id,
        limit: 1000,
      });
      
      console.log(`Found ${entries.items.length} entries to delete.\n`);
      
      let deletedCount = 0;
      let errorCount = 0;
      
      for (const entry of entries.items) {
        try {
          // 公開されている場合は非公開にする
          if (entry.isPublished()) {
            await entry.unpublish();
          }
          
          // 削除
          await entry.delete();
          
          const slug = entry.fields.slug?.['ja-JP'] || entry.fields.slug?.['en-US'] || entry.sys.id;
          console.log(`✅ Deleted ${entry.sys.id} (slug: ${slug})`);
          deletedCount++;
          totalDeleted++;
          
          // レート制限を避けるために少し待機
          if (deletedCount % 10 === 0) {
            console.log('   Waiting 1 second to avoid rate limiting...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`❌ Error deleting ${entry.sys.id}:`, error.message);
          errorCount++;
          totalErrors++;
        }
      }
      
      console.log(`\n=== ${type.name} (${type.id}) Summary ===`);
      console.log(`✅ Successfully deleted: ${deletedCount}`);
      console.log(`❌ Errors: ${errorCount}`);
    } catch (error) {
      console.error(`❌ Error fetching entries for ${type.id}:`, error.message);
      totalErrors++;
    }
  }
  
  console.log('\n=== Overall Summary ===');
  console.log(`✅ Successfully deleted: ${totalDeleted} entries`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log(`📊 Total content types processed: ${toDelete.length}`);
  
  console.log('\n⚠️  After deleting entries, run cleanup-duplicate-content-types.js again to delete the empty content types.');
}

deleteDuplicateContentTypeEntries().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

