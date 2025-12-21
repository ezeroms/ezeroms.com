// scripts/check-duplicate-diary-entries.js
// ContentfulのDiaryエントリで重複をチェック

require('dotenv').config();
const { createClient } = require('contentful');

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
  accessToken: process.env.CONTENTFUL_PREVIEW_TOKEN || process.env.CONTENTFUL_ACCESS_TOKEN,
  host: process.env.CONTENTFUL_PREVIEW_TOKEN ? 'preview.contentful.com' : 'cdn.contentful.com',
});

async function checkDuplicates() {
  try {
    console.log('Fetching all diary entries from Contentful...\n');
    
    const entries = await client.getEntries({
      content_type: '2Kymz8f5lsk5BSap6oSM9L',
      limit: 1000,
    });

    console.log(`Total entries: ${entries.total}\n`);

    // 「ドボク模型グランプリ」を含むエントリを探す
    const matchingEntries = [];
    
    for (const entry of entries.items) {
      const body = entry.fields.body;
      if (!body) continue;
      
      // Rich Textをテキストに変換
      let bodyText = '';
      if (typeof body === 'object' && body.nodeType) {
        // Rich Text形式
        const extractText = (node) => {
          if (node.nodeType === 'text') {
            return node.value || '';
          }
          if (node.content && Array.isArray(node.content)) {
            return node.content.map(extractText).join('');
          }
          return '';
        };
        bodyText = extractText(body);
      } else if (typeof body === 'string') {
        bodyText = body;
      }
      
      if (bodyText.includes('ドボク模型グランプリ')) {
        const slug = entry.fields.slug || entry.sys.id;
        const date = entry.fields.date || '';
        matchingEntries.push({
          slug,
          date,
          id: entry.sys.id,
          bodyPreview: bodyText.substring(0, 100),
        });
      }
    }

    console.log(`Found ${matchingEntries.length} entries with "ドボク模型グランプリ":\n`);
    matchingEntries.forEach((entry, index) => {
      console.log(`${index + 1}. Slug: ${entry.slug}`);
      console.log(`   Date: ${entry.date}`);
      console.log(`   Entry ID: ${entry.id}`);
      console.log(`   Body preview: ${entry.bodyPreview}...\n`);
    });

    // slugの重複をチェック
    const slugMap = new Map();
    entries.items.forEach(entry => {
      const slug = entry.fields.slug || entry.sys.id;
      if (!slugMap.has(slug)) {
        slugMap.set(slug, []);
      }
      slugMap.get(slug).push(entry);
    });

    const duplicateSlugs = Array.from(slugMap.entries()).filter(([slug, entries]) => entries.length > 1);
    if (duplicateSlugs.length > 0) {
      console.log('\n⚠️  Duplicate slugs found:\n');
      duplicateSlugs.forEach(([slug, entries]) => {
        console.log(`Slug: ${slug} (${entries.length} entries)`);
        entries.forEach(entry => {
          console.log(`  - Entry ID: ${entry.sys.id}, Date: ${entry.fields.date || 'N/A'}`);
        });
        console.log('');
      });
    } else {
      console.log('\n✅ No duplicate slugs found.');
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

checkDuplicates();

