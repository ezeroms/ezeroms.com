// scripts/update-column-diary-slug.js
// ColumnとDiaryのslugを16桁のランダム文字列に統一するスクリプト

require('dotenv').config();
const { createClient } = require('contentful-management');

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

// 16桁のランダム文字列（小文字アルファベットと数字）を生成
function generateRandomSlug() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// slugが16桁のランダム文字列（小文字アルファベットと数字）かどうかをチェック
function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  // 16桁で、小文字アルファベットと数字のみ
  return /^[a-z0-9]{16}$/.test(slug);
}

async function updateContentTypeSlugs(environment, contentTypeConfig) {
  const contentTypeId = contentTypeConfig.new || contentTypeConfig.old;
  const displayName = contentTypeConfig.displayName || contentTypeId;
  
  console.log(`\n=== Processing ${displayName} ===`);

  // コンテンツタイプIDを決定（新しいIDを優先、なければ古いIDを試す）
  let actualContentTypeId = contentTypeConfig.new;
  let entries;
  try {
    entries = await environment.getEntries({
      content_type: contentTypeConfig.new,
      limit: 1000,
    });
  } catch (error) {
    // 新しいIDが存在しない場合は、古いIDで試す
    if (contentTypeConfig.old && error.message && (error.message.includes('Content type') || error.message.includes('unknownContentType'))) {
      console.log(`   Content type "${contentTypeConfig.new}" not found, trying old ID "${contentTypeConfig.old}"...`);
      actualContentTypeId = contentTypeConfig.old;
      entries = await environment.getEntries({
        content_type: contentTypeConfig.old,
        limit: 1000,
      });
    } else {
      throw error;
    }
  }

  console.log(`   Found ${entries.items.length} entries.`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const updatedSlugs = []; // 重複チェック用

  for (const entry of entries.items) {
    try {
      // slugを取得（ロケール対応）
      const fields = entry.fields;
      let currentSlug = null;
      
      if (fields.slug) {
        // 複数のロケールがある場合を考慮
        currentSlug = fields.slug['ja-JP'] || fields.slug['en-US'] || Object.values(fields.slug)[0];
      }

      // slugが空の場合はスキップ（必須フィールドが不足している可能性がある）
      if (!currentSlug || currentSlug.trim() === '') {
        console.log(`   ⏭️  Skipping ${entry.sys.id} (slug is empty, may have missing required fields)`);
        skippedCount++;
        continue;
      }
      
      // slugが有効な形式かチェック
      if (isValidSlug(currentSlug)) {
        // デバッグ用: スキップされたslugを表示
        // console.log(`   ⏭️  Skipping ${entry.sys.id} (slug: ${currentSlug} is already valid)`);
        skippedCount++;
        continue;
      }
      
      // 日付形式のslugを検出（ISO 8601形式）
      if (currentSlug && /^\d{4}-\d{2}-\d{2}/.test(currentSlug)) {
        console.log(`   📅 Found date-format slug: ${currentSlug} for entry ${entry.sys.id}`);
      }
      
      // デバッグ用: 更新対象のslugを表示
      console.log(`   🔍 Found invalid slug: ${currentSlug} for entry ${entry.sys.id}`);

      // 新しいランダムなslugを生成（重複チェック）
      let newSlug;
      let attempts = 0;
      do {
        newSlug = generateRandomSlug();
        attempts++;
        if (attempts > 100) {
          throw new Error('Failed to generate unique slug after 100 attempts');
        }
      } while (updatedSlugs.includes(newSlug));

      updatedSlugs.push(newSlug);

      // slugを更新
      const updatedFields = {
        ...fields,
        slug: {
          ...fields.slug,
          'ja-JP': newSlug,
        },
      };

      entry.fields = updatedFields;
      const updatedEntry = await entry.update();
      
      // 公開（必須フィールドが不足している場合はスキップ）
      try {
        await updatedEntry.publish();
      } catch (publishError) {
        if (publishError.message && publishError.message.includes('required')) {
          console.log(`   ⚠️  Entry ${entry.sys.id} updated but not published (missing required fields)`);
        } else {
          throw publishError;
        }
      }

      console.log(`   ✅ Updated ${entry.sys.id}: ${currentSlug || '(empty)'} → ${newSlug}`);
      updatedCount++;

      // レート制限を避けるために少し待機
      if (updatedCount % 10 === 0) {
        console.log('   Waiting 1 second to avoid rate limiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`   ❌ Error updating ${entry.sys.id}:`, error.message);
      if (error.response) {
        console.error('   Response details:', JSON.stringify(error.response.data, null, 2));
      }
      errorCount++;
    }
  }

  console.log(`\n=== ${displayName} Summary ===`);
  console.log(`   ✅ Successfully updated: ${updatedCount}`);
  console.log(`   ⏭️  Skipped (already valid): ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total processed: ${entries.items.length}`);

  return { successCount: updatedCount, skipCount: skippedCount, errorCount, total: entries.items.length };
}

async function updateSlugs() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');

  console.log('Starting slug update for Column and Diary...');

  const columnResult = await updateContentTypeSlugs(environment, {
    new: 'column',
    old: 'diary', // 旧ID（Columnコンテンツは以前'diary'というIDだった）
    displayName: 'Column',
  });

  // Diaryは、tweetコンテンツタイプ（旧ID）も含めて処理
  let diaryResult = { successCount: 0, skipCount: 0, errorCount: 0, total: 0 };
  
  // まず新しいID (diary) を試す
  try {
    const diaryNewResult = await updateContentTypeSlugs(environment, {
      new: 'diary',
      old: null,
      displayName: 'Diary (new)',
    });
    diaryResult.successCount += diaryNewResult.successCount;
    diaryResult.skipCount += diaryNewResult.skipCount;
    diaryResult.errorCount += diaryNewResult.errorCount;
    diaryResult.total += diaryNewResult.total;
  } catch (error) {
    if (error.message && (error.message.includes('Content type') || error.message.includes('unknownContentType'))) {
      console.log('   Diary (new) content type not found, will try old ID...');
    } else {
      throw error;
    }
  }
  
  // 次に古いID (tweet) を試す
  try {
    const diaryOldResult = await updateContentTypeSlugs(environment, {
      new: 'tweet',
      old: null,
      displayName: 'Diary (old/tweet)',
    });
    diaryResult.successCount += diaryOldResult.successCount;
    diaryResult.skipCount += diaryOldResult.skipCount;
    diaryResult.errorCount += diaryOldResult.errorCount;
    diaryResult.total += diaryOldResult.total;
  } catch (error) {
    if (error.message && (error.message.includes('Content type') || error.message.includes('unknownContentType'))) {
      console.log('   Tweet (old) content type not found.');
    } else {
      throw error;
    }
  }

  console.log('\n=== Overall Summary ===');
  console.log(`\nColumn:`);
  console.log(`  ✅ Successfully updated: ${columnResult.successCount}`);
  console.log(`  ⏭️  Skipped: ${columnResult.skipCount}`);
  console.log(`  ❌ Errors: ${columnResult.errorCount}`);
  console.log(`  📊 Total: ${columnResult.total}`);
  
  console.log(`\nDiary:`);
  console.log(`  ✅ Successfully updated: ${diaryResult.successCount}`);
  console.log(`  ⏭️  Skipped: ${diaryResult.skipCount}`);
  console.log(`  ❌ Errors: ${diaryResult.errorCount}`);
  console.log(`  📊 Total: ${diaryResult.total}`);
  
  const totalSuccess = columnResult.successCount + diaryResult.successCount;
  const totalSkip = columnResult.skipCount + diaryResult.skipCount;
  const totalError = columnResult.errorCount + diaryResult.errorCount;
  const totalProcessed = columnResult.total + diaryResult.total;
  
  console.log(`\n=== Grand Total ===`);
  console.log(`  ✅ Successfully updated: ${totalSuccess}`);
  console.log(`  ⏭️  Skipped: ${totalSkip}`);
  console.log(`  ❌ Errors: ${totalError}`);
  console.log(`  📊 Total processed: ${totalProcessed}`);
}

// 実行
updateSlugs().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

