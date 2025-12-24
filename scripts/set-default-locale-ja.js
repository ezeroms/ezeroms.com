// scripts/set-default-locale-ja.js
// Contentfulのデフォルトロケールをja-JPに変更するスクリプト

require('dotenv').config();
const { createClient } = require('contentful-management');

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

async function setDefaultLocale() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');

  console.log('Fetching locales...');

  // すべてのロケールを取得
  const locales = await environment.getLocales();
  
  console.log(`Found ${locales.items.length} locales:`);
  locales.items.forEach(locale => {
    console.log(`  - ${locale.name} (${locale.code})${locale.default ? ' [DEFAULT]' : ''}`);
  });

  // ja-JPロケールを探す
  const jaJPLocale = locales.items.find(locale => locale.code === 'ja-JP');
  const enUSLocale = locales.items.find(locale => locale.code === 'en-US');

  if (!jaJPLocale) {
    console.error('❌ ja-JP locale not found. Please add it first in Contentful Web App.');
    process.exit(1);
  }

  if (jaJPLocale.default) {
    console.log('✅ ja-JP is already the default locale.');
    return;
  }

  // 現在のデフォルトロケールを確認
  const currentDefault = locales.items.find(locale => locale.default);
  if (currentDefault) {
    console.log(`Current default locale: ${currentDefault.name} (${currentDefault.code})`);
  }

  try {
    // デフォルトロケールをja-JPに変更
    console.log('\nChanging default locale to ja-JP...');
    
    // 注意: Contentful Management APIでは、デフォルトロケールを直接変更することはできません
    // ロケールを更新する際に、既存のデフォルトロケールを非デフォルトにする必要があります
    
    // まず、現在のデフォルトロケールを非デフォルトにする
    if (currentDefault && currentDefault.code !== 'ja-JP') {
      console.log(`Removing default from ${currentDefault.code}...`);
      // ロケールの更新は、defaultプロパティを変更することで行います
      // ただし、Contentful Management APIでは、デフォルトロケールを変更するには
      // 新しいロケールを作成するか、既存のロケールを更新する必要があります
      
      // 実際には、デフォルトロケールの変更はWeb UIから行う必要があります
      // または、ロケールを削除して再作成する必要があります
      console.log('⚠️  Note: Default locale cannot be changed via Management API.');
      console.log('   Please change it manually in Contentful Web App:');
      console.log('   1. Go to Settings > Locales');
      console.log('   2. Click on ja-JP locale');
      console.log('   3. Click "Set as default"');
      console.log('   4. Confirm the change');
    }

    // 代替案: ロケールの順序を変更することはできませんが、
    // 少なくともja-JPロケールが存在することを確認できます
    console.log('\n✅ ja-JP locale exists and is ready to be set as default.');
    console.log('   Please complete the change in Contentful Web App.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
    throw error;
  }
}

// 実行
setDefaultLocale().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

