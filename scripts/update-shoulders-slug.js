// scripts/update-shoulders-slug.js
// Shoulders of Giantsのslugを16桁のランダム文字列に統一するスクリプト

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

async function updateShouldersSlugs() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');

  console.log('Fetching Shoulders of Giants entries...');

  // 後方互換性のため、新しいIDと古いIDの両方を試す
  // 移行後のシステムIDも試す
  let contentType = 'shoulders_of_giants';
  let entries;
  try {
    entries = await environment.getEntries({
      content_type: contentType,
      limit: 1000,
    });
  } catch (error) {
    // システムIDで試す（移行後のコンテンツタイプ）
    if (error.message && (error.message.includes('Content type') || error.message.includes('unknownContentType'))) {
      console.log('   Content type "shoulders_of_giants" not found, trying system ID "18izXeliYBQIx6oVw8NNYi"...');
      try {
        contentType = '18izXeliYBQIx6oVw8NNYi';
        entries = await environment.getEntries({
          content_type: contentType,
          limit: 1000,
        });
      } catch (error2) {
        // 古いIDで試す
        if (error2.message && (error2.message.includes('Content type') || error2.message.includes('unknownContentType'))) {
          console.log('   Content type system ID not found, trying old ID "shouldersOfGiants"...');
          contentType = 'shouldersOfGiants';
          entries = await environment.getEntries({
            content_type: contentType,
            limit: 1000,
          });
        } else {
          throw error2;
        }
      }
    } else {
      throw error;
    }
  }

  console.log(`Found ${entries.items.length} entries.`);

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

      // slugが有効な形式かチェック
      if (isValidSlug(currentSlug)) {
        console.log(`⏭️  Skipping ${entry.sys.id} (slug: ${currentSlug} is already valid)`);
        skippedCount++;
        continue;
      }

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
      
      // 公開
      await updatedEntry.publish();

      console.log(`✅ Updated ${entry.sys.id}: ${currentSlug || '(empty)'} → ${newSlug}`);
      updatedCount++;

      // レート制限を避けるために少し待機
      if (updatedCount % 10 === 0) {
        console.log('   Waiting 1 second to avoid rate limiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Error updating ${entry.sys.id}:`, error.message);
      if (error.response) {
        console.error('Response details:', JSON.stringify(error.response.data, null, 2));
      }
      errorCount++;
    }
  }

  console.log('\n=== Update Summary ===');
  console.log(`✅ Successfully updated: ${updatedCount}`);
  console.log(`⏭️  Skipped (already valid): ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${entries.items.length}`);
}

// 実行
updateShouldersSlugs().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

