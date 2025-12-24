// scripts/check-duplicate-entries.js
// 重複しているエントリ（同じslugを持つエントリ）をチェックするスクリプト

require('dotenv').config();
const { createClient } = require('contentful-management');

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

async function checkDuplicateEntries() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');

  console.log('Checking for duplicate entries across all content types...\n');
  
  const contentTypes = await environment.getContentTypes();
  
  // すべてのエントリを取得してslugでグループ化
  const entriesBySlug = {};
  const contentTypesToCheck = [];
  
  // 主要なコンテンツタイプを確認
  for (const contentType of contentTypes.items) {
    const typeId = contentType.sys.id;
    const typeName = contentType.name;
    
    // 主要なコンテンツタイプのみチェック
    if (['Column', 'Diary', 'Shoulders of Giants', 'About', 'Work'].includes(typeName) || 
        typeId.includes('Column') || typeId.includes('Diary') || typeId.includes('Shoulders') || 
        typeId.includes('shoulders') || typeId === 'about' || typeId === 'work') {
      contentTypesToCheck.push({ id: typeId, name: typeName });
    }
  }
  
  console.log(`Checking ${contentTypesToCheck.length} content types:\n`);
  for (const ct of contentTypesToCheck) {
    console.log(`  - ${ct.name} (${ct.id})`);
  }
  console.log('');
  
  // 各コンテンツタイプからエントリを取得
  for (const ct of contentTypesToCheck) {
    try {
      const entries = await environment.getEntries({
        content_type: ct.id,
        limit: 1000,
      });
      
      console.log(`Processing ${ct.name} (${ct.id}): ${entries.items.length} entries`);
      
      for (const entry of entries.items) {
        const slug = entry.fields.slug?.['ja-JP'] || entry.fields.slug?.['en-US'] || entry.sys.id;
        
        if (!entriesBySlug[slug]) {
          entriesBySlug[slug] = [];
        }
        
        entriesBySlug[slug].push({
          id: entry.sys.id,
          contentType: ct.name,
          contentTypeId: ct.id,
          slug: slug,
          published: entry.isPublished(),
        });
      }
    } catch (error) {
      console.error(`Error fetching entries for ${ct.name} (${ct.id}):`, error.message);
    }
  }
  
  // 重複を検出
  console.log('\n=== Duplicate Entries Check ===\n');
  const duplicates = [];
  
  for (const [slug, entries] of Object.entries(entriesBySlug)) {
    if (entries.length > 1) {
      duplicates.push({ slug, entries });
    }
  }
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate entries found.\n');
  } else {
    console.log(`⚠️  Found ${duplicates.length} duplicate slugs:\n`);
    
    for (const duplicate of duplicates) {
      console.log(`Slug: "${duplicate.slug}"`);
      console.log(`  Found in ${duplicate.entries.length} entries:`);
      for (const entry of duplicate.entries) {
        console.log(`    - ${entry.id} (${entry.contentType}, published: ${entry.published})`);
      }
      console.log('');
    }
  }
  
  // コンテンツタイプごとのエントリ数を表示
  console.log('\n=== Entry Counts by Content Type ===\n');
  const countsByType = {};
  
  for (const ct of contentTypesToCheck) {
    try {
      const entries = await environment.getEntries({
        content_type: ct.id,
        limit: 1,
      });
      countsByType[ct.name] = entries.total;
      console.log(`  ${ct.name} (${ct.id}): ${entries.total} entries`);
    } catch (error) {
      console.log(`  ${ct.name} (${ct.id}): Error - ${error.message}`);
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Total content types checked: ${contentTypesToCheck.length}`);
  console.log(`Total unique slugs: ${Object.keys(entriesBySlug).length}`);
  console.log(`Duplicate slugs: ${duplicates.length}`);
  
  if (duplicates.length > 0) {
    console.log('\n⚠️  Recommendation: Review and delete duplicate entries manually in Contentful Web App.');
  }
}

checkDuplicateEntries().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

