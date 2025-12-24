// scripts/migrate-content-types.js
// Contentful側のコンテンツタイプIDを変更するスクリプト
//
// 注意: Contentful Management APIではコンテンツタイプのIDを直接変更することはできません。
// このスクリプトは、新しいコンテンツタイプを作成し、既存のエントリを移行する手順を案内します。
//
// 手順:
// 1. Contentful Web Appで新しいコンテンツタイプを作成（column, diary, shoulders_of_giants）
// 2. このスクリプトを実行してエントリを移行
// 3. 古いコンテンツタイプを削除（手動）

require('dotenv').config();
const { createClient } = require('contentful-management');

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

// エントリを新しいコンテンツタイプにコピーする関数
async function migrateEntries(environment, sourceTypeId, targetTypeId, displayName) {
  console.log(`\n=== Migrating ${displayName} ===`);
  console.log(`  From: ${sourceTypeId}`);
  console.log(`  To: ${targetTypeId}`);
  
  // ターゲットコンテンツタイプが存在するか確認
  let targetContentType;
  try {
    targetContentType = await environment.getContentType(targetTypeId);
    console.log(`  ✅ Target content type "${targetTypeId}" exists`);
  } catch (error) {
    console.error(`  ❌ Target content type "${targetTypeId}" not found!`);
    console.error(`     Please create it in Contentful Web App first.`);
    return { successCount: 0, errorCount: 0, total: 0 };
  }
  
  // ソースコンテンツタイプからエントリを取得
  let sourceEntries;
  try {
    sourceEntries = await environment.getEntries({
      content_type: sourceTypeId,
      limit: 1000,
    });
    console.log(`  Found ${sourceEntries.items.length} entries to migrate`);
  } catch (error) {
    console.error(`  ❌ Error fetching entries from "${sourceTypeId}":`, error.message);
    return { successCount: 0, errorCount: 0, total: 0 };
  }
  
  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;
  
  for (const entry of sourceEntries.items) {
    try {
      // 既にターゲットコンテンツタイプに同じslugのエントリが存在するか確認
      const slug = entry.fields.slug?.['ja-JP'] || entry.fields.slug?.['en-US'] || entry.sys.id;
      
      let existingEntry = null;
      try {
        const existingEntries = await environment.getEntries({
          content_type: targetTypeId,
          'fields.slug[ja-JP]': slug,
          limit: 1,
        });
        if (existingEntries.items.length > 0) {
          existingEntry = existingEntries.items[0];
        }
      } catch (error) {
        // エントリが見つからない場合は続行
      }
      
      if (existingEntry) {
        console.log(`  ⏭️  Skipping ${entry.sys.id} (slug: ${slug} already exists in target)`);
        skipCount++;
        continue;
      }
      
      // 新しいエントリを作成
      const newFields = {};
      
      // すべてのフィールドをコピー
      for (const fieldId in entry.fields) {
        if (entry.fields[fieldId]) {
          newFields[fieldId] = entry.fields[fieldId];
        }
      }
      
      const newEntry = await environment.createEntry(targetTypeId, {
        fields: newFields,
      });
      
      // 公開
      await newEntry.publish();
      
      console.log(`  ✅ Migrated ${entry.sys.id} → ${newEntry.sys.id} (slug: ${slug})`);
      successCount++;
      
      // レート制限を避けるために少し待機
      if (successCount % 10 === 0) {
        console.log('  Waiting 1 second to avoid rate limiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`  ❌ Error migrating ${entry.sys.id}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n  === ${displayName} Migration Summary ===`);
  console.log(`  ✅ Successfully migrated: ${successCount}`);
  console.log(`  ⏭️  Skipped: ${skipCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  📊 Total processed: ${sourceEntries.items.length}`);
  
  return { successCount, skipCount, errorCount, total: sourceEntries.items.length };
}

async function migrateContentTypes() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');

  console.log('Contentful Content Type Migration Tool');
  console.log('=====================================\n');
  console.log('⚠️  IMPORTANT: Before running this script, please:');
  console.log('   1. Create new content types in Contentful Web App:');
  console.log('      - column (copy fields from "diary" content type)');
  console.log('      - diary (copy fields from "tweet" content type)');
  console.log('      - shoulders_of_giants (copy fields from "shouldersOfGiants" content type)');
  console.log('   2. Ensure field IDs match between old and new content types\n');
  
  // ユーザーに確認を求める（実際には手動で実行する必要がある）
  console.log('This script will migrate entries from old content types to new ones.\n');
  
  // コンテンツタイプのIDを動的に検出
  const allContentTypes = await environment.getContentTypes();
  let columnTypeId = 'column';
  let diaryNewTypeId = 'diary_new';
  let shouldersTypeId = 'shoulders_of_giants';
  
  // システムIDで作成されたコンテンツタイプを検出
  for (const ct of allContentTypes.items) {
    if (ct.name === 'Column' && ct.sys.id !== 'diary') {
      columnTypeId = ct.sys.id;
      console.log(`  Found Column content type with ID: ${columnTypeId}`);
    }
    if (ct.name === 'Diary (New)') {
      diaryNewTypeId = ct.sys.id;
      console.log(`  Found Diary (New) content type with ID: ${diaryNewTypeId}`);
    }
    if (ct.name === 'Shoulders of Giants' && ct.sys.id !== 'shouldersOfGiants') {
      shouldersTypeId = ct.sys.id;
      console.log(`  Found Shoulders of Giants content type with ID: ${shouldersTypeId}`);
    }
  }
  
  // Column: diary → column
  const columnResult = await migrateEntries(environment, 'diary', columnTypeId, 'Column');
  
  // Diary: tweet → diary_new (既存のdiaryはColumn用なので、diary_newを使用)
  const diaryResult = await migrateEntries(environment, 'tweet', diaryNewTypeId, 'Diary');
  const shouldersResult = await migrateEntries(environment, 'shouldersOfGiants', shouldersTypeId, 'Shoulders of Giants');
  
  console.log('\n=== Overall Migration Summary ===');
  console.log(`\nColumn:`);
  console.log(`  ✅ Successfully migrated: ${columnResult.successCount}`);
  console.log(`  ⏭️  Skipped: ${columnResult.skipCount}`);
  console.log(`  ❌ Errors: ${columnResult.errorCount}`);
  console.log(`  📊 Total: ${columnResult.total}`);
  
  console.log(`\nDiary:`);
  console.log(`  ✅ Successfully migrated: ${diaryResult.successCount}`);
  console.log(`  ⏭️  Skipped: ${diaryResult.skipCount}`);
  console.log(`  ❌ Errors: ${diaryResult.errorCount}`);
  console.log(`  📊 Total: ${diaryResult.total}`);
  
  console.log(`\nShoulders of Giants:`);
  console.log(`  ✅ Successfully migrated: ${shouldersResult.successCount}`);
  console.log(`  ⏭️  Skipped: ${shouldersResult.skipCount}`);
  console.log(`  ❌ Errors: ${shouldersResult.errorCount}`);
  console.log(`  📊 Total: ${shouldersResult.total}`);
  
  const totalSuccess = columnResult.successCount + diaryResult.successCount + shouldersResult.successCount;
  const totalSkip = columnResult.skipCount + diaryResult.skipCount + shouldersResult.skipCount;
  const totalError = columnResult.errorCount + diaryResult.errorCount + shouldersResult.errorCount;
  
  console.log(`\n=== Grand Total ===`);
  console.log(`  ✅ Successfully migrated: ${totalSuccess}`);
  console.log(`  ⏭️  Skipped: ${totalSkip}`);
  console.log(`  ❌ Errors: ${totalError}`);
  
  if (totalSuccess > 0) {
    console.log('\n⚠️  After migration:');
    console.log('   1. Verify all entries are correctly migrated');
    console.log('   2. Update contentful-to-markdown.js to use new content type IDs');
    console.log('   3. Delete old content types in Contentful Web App (if desired)');
  }
}

migrateContentTypes().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

