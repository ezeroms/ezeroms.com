// scripts/migrate-locale-en-to-ja.js
// 既存のen-USロケールのコンテンツをja-JPに移行するスクリプト

require('dotenv').config();
const { createClient } = require('contentful-management');

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

// 移行対象のコンテンツタイプ
// 注意: 後方互換性のため、古いIDと新しいIDの両方を試す
// - Column: 'diary'（旧）→ 'column'（新）
// - Diary: 'tweet'（旧）→ 'diary'（新）
// - Shoulders of Giants: 'shouldersOfGiants'（旧）→ 'shoulders_of_giants'（新）
const CONTENT_TYPES = [
  { new: 'column', old: 'diary' },      // Columnコンテンツ
  { new: 'diary', old: 'tweet' },       // Diaryコンテンツ
  { new: 'shoulders_of_giants', old: 'shouldersOfGiants' }, // Shoulders of Giantsコンテンツ
];

async function migrateContentType(environment, contentTypeConfig) {
  // コンテンツタイプIDを決定（新しいIDを優先、なければ古いIDを試す）
  let contentType = contentTypeConfig.new || contentTypeConfig.old;
  const oldContentType = contentTypeConfig.old;
  const displayName = contentTypeConfig.new || contentTypeConfig.old;
  
  console.log(`\n=== Processing ${displayName} ===`);

  let skip = 0;
  const limit = 100;
  let total = 0;
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // まず新しいIDで試す
  try {
    await environment.getEntries({
      content_type: contentTypeConfig.new,
      limit: 1,
      skip: 0,
    });
    contentType = contentTypeConfig.new;
    console.log(`   Using content type ID: ${contentType}`);
  } catch (error) {
    // 新しいIDが存在しない場合は、古いIDで試す
    // エラーメッセージに'Content type'、'unknownContentType'、または'DOESNOTEXIST'が含まれる場合
    const isContentTypeError = oldContentType && (
      (error.message && (error.message.includes('Content type') || error.message.includes('unknownContentType') || error.message.includes('DOESNOTEXIST'))) ||
      (error.response && error.response.data && error.response.data.details && error.response.data.details.errors && 
       error.response.data.details.errors.some(e => e.name === 'unknownContentType'))
    );
    
    if (isContentTypeError) {
      console.log(`   New content type '${contentTypeConfig.new}' not found, trying old ID '${oldContentType}'...`);
      try {
        await environment.getEntries({
          content_type: oldContentType,
          limit: 1,
          skip: 0,
        });
        contentType = oldContentType;
        console.log(`   Using content type ID: ${contentType}`);
      } catch (oldError) {
        console.error(`❌ Error: Neither '${contentTypeConfig.new}' nor '${oldContentType}' content type found.`);
        return { successCount: 0, skipCount: 0, errorCount: 1, total: 0 };
      }
    } else {
      throw error;
    }
  }

  while (true) {
    try {
      const response = await environment.getEntries({
        content_type: contentType,
        limit: limit,
        skip: skip,
      });

      if (total === 0) {
        total = response.total;
        console.log(`Found ${total} entries.`);
      }

      if (response.items.length === 0) {
        break;
      }

      for (const entry of response.items) {
        try {
          // en-USのフィールドを取得
          const fields = entry.fields;
          
          // slugフィールドの有無を確認（slugがないコンテンツタイプもあるため、任意のフィールドで確認）
          const hasEnUS = Object.keys(fields).some(fieldName => 
            fields[fieldName] && fields[fieldName]['en-US'] !== undefined
          );
          const hasJaJP = Object.keys(fields).some(fieldName => 
            fields[fieldName] && fields[fieldName]['ja-JP'] !== undefined
          );

          // 既にja-JPがある場合はスキップ
          if (hasJaJP) {
            skipCount++;
            continue;
          }

          // en-USがない場合もスキップ
          if (!hasEnUS) {
            skipCount++;
            continue;
          }

          // en-USのデータをja-JPにコピー
          const updatedFields = {};

          // 各フィールドをja-JPにコピー
          Object.keys(fields).forEach(fieldName => {
            if (fields[fieldName] && fields[fieldName]['en-US'] !== undefined) {
              updatedFields[fieldName] = {
                ...fields[fieldName],
                'ja-JP': fields[fieldName]['en-US'],
              };
            }
          });

          // エントリを更新
          entry.fields = { ...entry.fields, ...updatedFields };
          const updatedEntry = await entry.update();
          await updatedEntry.publish(); // 更新後、公開
          
          const slug = fields.slug?.['en-US'] || entry.sys.id;
          console.log(`✅ Migrated ${entry.sys.id} (slug: ${slug})`);
          successCount++;

          // レート制限を避けるために少し待機
          if (successCount % 10 === 0) {
            console.log('   Waiting 1 second to avoid rate limiting...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`❌ Error migrating ${entry.sys.id}:`, error.message);
          errorCount++;
        }
      }

      skip += limit;
      if (response.items.length < limit) {
        break;
      }
    } catch (fetchError) {
      console.error(`❌ Error fetching ${contentType}:`, fetchError.message);
      errorCount++;
      break;
    }
  }

  console.log(`\n=== ${displayName} Summary ===`);
  console.log(`✅ Successfully migrated: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${total}`);

  return { successCount, skipCount, errorCount, total };
}

async function migrateLocale() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');

  console.log('Starting locale migration from en-US to ja-JP...\n');

  let totalSuccess = 0;
  let totalSkip = 0;
  let totalError = 0;
  let totalProcessed = 0;

  for (const contentTypeConfig of CONTENT_TYPES) {
    try {
      const result = await migrateContentType(environment, contentTypeConfig);
      totalSuccess += result.successCount;
      totalSkip += result.skipCount;
      totalError += result.errorCount;
      totalProcessed += result.total;
    } catch (error) {
      const displayName = contentTypeConfig.new || contentTypeConfig.old;
      console.error(`❌ Fatal error processing ${displayName}:`, error.message);
      totalError++;
    }
  }

  console.log('\n=== Overall Migration Summary ===');
  console.log(`✅ Successfully migrated: ${totalSuccess}`);
  console.log(`⏭️  Skipped: ${totalSkip}`);
  console.log(`❌ Errors: ${totalError}`);
  console.log(`📊 Total processed: ${totalProcessed}`);
}

// 実行
migrateLocale().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

