// scripts/delete-diary-content-type-entries.js
// diaryコンテンツタイプ（Column用）のエントリを削除するスクリプト
// 注意: このスクリプトは、diaryコンテンツタイプのエントリが既にcolumnに移行されていることを前提としています

require('dotenv').config();
const { createClient } = require('contentful-management');

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

async function deleteDiaryContentTypeEntries() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');

  console.log('Fetching entries from "diary" content type (Column content)...\n');
  
  const entries = await environment.getEntries({
    content_type: 'diary',
    limit: 1000,
  });
  
  console.log(`Found ${entries.items.length} entries.\n`);
  console.log('⚠️  WARNING: This will delete all entries from the "diary" content type.');
  console.log('   Make sure these entries have been migrated to "column" content type.\n');
  
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
      
      // レート制限を避けるために少し待機
      if (deletedCount % 10 === 0) {
        console.log('   Waiting 1 second to avoid rate limiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Error deleting ${entry.sys.id}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n=== Deletion Summary ===');
  console.log(`✅ Successfully deleted: ${deletedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${entries.items.length}`);
  
  if (deletedCount > 0) {
    console.log('\n⚠️  After deleting entries, you can delete the "diary" content type manually in Contentful Web App,');
    console.log('   or run the cleanup script again.');
  }
}

deleteDiaryContentTypeEntries().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

