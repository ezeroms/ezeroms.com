// scripts/delete-old-content-type-entries.js
// 古いコンテンツタイプ（shouldersOfGiants、tweet）のエントリを削除するスクリプト
// 注意: これらのエントリは既に新しいコンテンツタイプに移行されていることを前提としています

require('dotenv').config();
const { createClient } = require('contentful-management');

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

async function deleteOldContentTypeEntries() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');

  const contentTypesToClean = [
    { id: 'shouldersOfGiants', name: 'Shoulders of Giants (old)' },
    { id: 'tweet', name: 'Diary (old/Tweet)' },
  ];

  for (const contentTypeConfig of contentTypesToClean) {
    console.log(`\n=== Processing ${contentTypeConfig.name} (${contentTypeConfig.id}) ===\n`);
    
    try {
      const entries = await environment.getEntries({
        content_type: contentTypeConfig.id,
        limit: 1000,
      });
      
      console.log(`Found ${entries.items.length} entries.`);
      console.log('⚠️  WARNING: This will delete all entries from this content type.');
      console.log('   Make sure these entries have been migrated to new content types.\n');
      
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
      
      console.log(`\n=== ${contentTypeConfig.name} Deletion Summary ===`);
      console.log(`✅ Successfully deleted: ${deletedCount}`);
      console.log(`❌ Errors: ${errorCount}`);
      console.log(`📊 Total processed: ${entries.items.length}`);
    } catch (error) {
      console.error(`❌ Error fetching entries for ${contentTypeConfig.id}:`, error.message);
    }
  }
  
  console.log('\n⚠️  After deleting entries, you can delete the old content types manually in Contentful Web App,');
  console.log('   or they will be automatically cleaned up in the next cleanup run.');
}

deleteOldContentTypeEntries().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

