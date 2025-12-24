// scripts/delete-empty-content-types.js
// エントリが0の古いコンテンツタイプを削除するスクリプト

require('dotenv').config();
const { createClient } = require('contentful-management');

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

async function deleteEmptyContentTypes() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');

  console.log('Fetching all content types...\n');
  const contentTypes = await environment.getContentTypes();
  
  // 削除対象の古いコンテンツタイプID
  const oldContentTypesToDelete = [
    'shouldersOfGiants', // 古いShoulders of Giants
    'tweet', // 古いDiary
  ];
  
  console.log('=== Checking Old Content Types ===\n');
  const toDelete = [];
  
  for (const contentTypeId of oldContentTypesToDelete) {
    try {
      const contentType = contentTypes.items.find(ct => ct.sys.id === contentTypeId);
      if (!contentType) {
        console.log(`⏭️  ${contentTypeId}: Not found (already deleted?)`);
        continue;
      }
      
      // エントリ数を確認
      const entries = await environment.getEntries({
        content_type: contentTypeId,
        limit: 1,
      });
      
      if (entries.total === 0) {
        toDelete.push({
          id: contentTypeId,
          name: contentType.name,
          published: contentType.isPublished(),
        });
        console.log(`✅ ${contentTypeId} (${contentType.name}): 0 entries - will delete`);
      } else {
        console.log(`⚠️  ${contentTypeId} (${contentType.name}): ${entries.total} entries - skipping`);
      }
    } catch (error) {
      console.error(`❌ Error checking ${contentTypeId}:`, error.message);
    }
  }
  
  if (toDelete.length === 0) {
    console.log('\nNo empty content types to delete.\n');
    return;
  }
  
  // 削除を実行
  console.log(`\n=== Deleting ${toDelete.length} empty content types ===\n`);
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
  
  console.log('\n=== Deletion Summary ===');
  console.log(`✅ Successfully deleted: ${deletedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${toDelete.length}`);
}

deleteEmptyContentTypes().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

