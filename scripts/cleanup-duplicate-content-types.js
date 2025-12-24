// scripts/cleanup-duplicate-content-types.js
// 重複しているコンテンツタイプを削除するスクリプト

require('dotenv').config();
const { createClient } = require('contentful-management');

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

async function cleanupDuplicateContentTypes() {
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
      entries: null, // 後で取得
    });
  }
  
  // 重複しているコンテンツタイプを確認
  console.log('=== Content Types by Name ===\n');
  const duplicates = [];
  
  for (const [name, types] of Object.entries(contentTypesByName)) {
    if (types.length > 1) {
      console.log(`⚠️  "${name}" has ${types.length} instances:`);
      for (const type of types) {
        console.log(`   - ${type.id} (published: ${type.published})`);
      }
      duplicates.push({ name, types });
      console.log('');
    }
  }
  
  // 各コンテンツタイプのエントリ数を取得
  console.log('=== Checking Entry Counts ===\n');
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
  
  // 削除候補を決定
  console.log('=== Deletion Candidates ===\n');
  const toDelete = [];
  
  for (const duplicate of duplicates) {
    // エントリ数が0またはエラーのものを削除候補に
    // エントリ数が最も多いものを残す
    const typesWithEntries = duplicate.types.filter(t => t.entries > 0);
    const typesWithoutEntries = duplicate.types.filter(t => t.entries === 0 || t.entries === -1);
    
    if (typesWithEntries.length > 0) {
      // エントリ数が最も多いものを残す
      const keepType = typesWithEntries.reduce((max, current) => 
        current.entries > max.entries ? current : max
      );
      
      console.log(`✅ Keeping "${duplicate.name}": ${keepType.id} (${keepType.entries} entries)`);
      
      // 残りのものを削除候補に
      for (const type of duplicate.types) {
        if (type.id !== keepType.id) {
          toDelete.push({
            id: type.id,
            name: duplicate.name,
            entries: type.entries,
            published: type.published,
          });
          console.log(`   ❌ Will delete: ${type.id} (${type.entries} entries, published: ${type.published})`);
        }
      }
    } else {
      // すべてエントリがない場合は、最初の1つを残して他を削除
      const keepType = duplicate.types[0];
      console.log(`✅ Keeping "${duplicate.name}": ${keepType.id} (no entries, but keeping first one)`);
      
      for (let i = 1; i < duplicate.types.length; i++) {
        const type = duplicate.types[i];
        toDelete.push({
          id: type.id,
          name: duplicate.name,
          entries: type.entries,
          published: type.published,
        });
        console.log(`   ❌ Will delete: ${type.id} (${type.entries} entries, published: ${type.published})`);
      }
    }
    console.log('');
  }
  
  if (toDelete.length === 0) {
    console.log('No duplicate content types to delete.\n');
    return;
  }
  
  // 削除を実行
  console.log(`\n=== Deleting ${toDelete.length} duplicate content types ===\n`);
  let deletedCount = 0;
  let errorCount = 0;
  
  for (const type of toDelete) {
    try {
      const contentType = await environment.getContentType(type.id);
      
      // 公開されている場合は非公開にする
      if (contentType.isPublished()) {
        console.log(`   Unpublishing ${type.id}...`);
        await contentType.unpublish();
      }
      
      // 削除
      console.log(`   Deleting ${type.id} (${type.name})...`);
      await contentType.delete();
      
      console.log(`   ✅ Deleted ${type.id}\n`);
      deletedCount++;
      
      // レート制限を避けるために少し待機
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`   ❌ Error deleting ${type.id}:`, error.message);
      if (error.response) {
        console.error('   Response:', JSON.stringify(error.response.data, null, 2));
      }
      errorCount++;
    }
  }
  
  console.log('\n=== Cleanup Summary ===');
  console.log(`✅ Successfully deleted: ${deletedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${toDelete.length}`);
}

cleanupDuplicateContentTypes().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

