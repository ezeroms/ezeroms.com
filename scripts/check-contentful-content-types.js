// scripts/check-contentful-content-types.js
// Contentful側のコンテンツタイプの状況を確認するスクリプト

require('dotenv').config();
const { createClient } = require('contentful-management');

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

async function checkContentTypes() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');

  console.log('Fetching content types from Contentful...\n');

  const contentTypes = await environment.getContentTypes();
  
  console.log(`Found ${contentTypes.items.length} content types:\n`);
  
  const relevantTypes = ['column', 'diary', 'diary_new', 'tweet', 'shouldersOfGiants', 'shoulders_of_giants'];
  
  // すべてのコンテンツタイプを表示
  console.log('All content types:\n');
  for (const contentType of contentTypes.items) {
    const typeId = contentType.sys.id;
    console.log(`  - ${typeId} (${contentType.name})`);
  }
  console.log('');
  
  for (const contentType of contentTypes.items) {
    const typeId = contentType.sys.id;
    if (relevantTypes.includes(typeId) || typeId.includes('column') || typeId.includes('diary') || typeId.includes('tweet') || typeId.includes('shoulder')) {
      console.log(`=== ${typeId} ===`);
      console.log(`  Name: ${contentType.name}`);
      console.log(`  Description: ${contentType.description || '(none)'}`);
      console.log(`  Fields:`);
      
      for (const field of contentType.fields) {
        const fieldInfo = `    - ${field.id} (${field.type})`;
        const required = field.required ? ' [REQUIRED]' : '';
        const localized = field.localized ? ' [LOCALIZED]' : '';
        console.log(`${fieldInfo}${required}${localized}`);
      }
      
      // エントリ数を取得
      try {
        const entries = await environment.getEntries({
          content_type: typeId,
          limit: 1,
        });
        console.log(`  Entries: ${entries.total}`);
      } catch (error) {
        console.log(`  Entries: Error - ${error.message}`);
      }
      
      console.log('');
    }
  }
  
  // エントリの詳細を確認
  console.log('\n=== Entry Details ===\n');
  
  const typesToCheck = [
    { id: 'column', name: 'Column' },
    { id: 'diary', name: 'Diary (new)' },
    { id: 'tweet', name: 'Diary (old/Tweet)' },
    { id: 'shoulders_of_giants', name: 'Shoulders of Giants (new)' },
    { id: 'shouldersOfGiants', name: 'Shoulders of Giants (old)' },
  ];
  
  for (const typeConfig of typesToCheck) {
    try {
      const entries = await environment.getEntries({
        content_type: typeConfig.id,
        limit: 5,
      });
      
      if (entries.items.length > 0) {
        console.log(`${typeConfig.name} (${typeConfig.id}):`);
        console.log(`  Total entries: ${entries.total}`);
        console.log(`  Sample entries:`);
        entries.items.slice(0, 3).forEach(entry => {
          const slug = entry.fields.slug?.['ja-JP'] || entry.fields.slug?.['en-US'] || entry.sys.id;
          const title = entry.fields.title?.['ja-JP'] || entry.fields.title?.['en-US'] || '(no title)';
          console.log(`    - ${entry.sys.id}: slug="${slug}", title="${title}"`);
        });
        console.log('');
      }
    } catch (error) {
      if (error.message && (error.message.includes('Content type') || error.message.includes('unknownContentType'))) {
        console.log(`${typeConfig.name} (${typeConfig.id}): Not found\n`);
      } else {
        console.log(`${typeConfig.name} (${typeConfig.id}): Error - ${error.message}\n`);
      }
    }
  }
}

checkContentTypes().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

