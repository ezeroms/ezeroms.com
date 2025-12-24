// scripts/compare-all-contentful-local.js
// ContentfulのエントリとローカルのMarkdownファイルを比較するスクリプト（全コンテンツタイプ対応）

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('contentful');
const matter = require('gray-matter');

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

async function compareAllContentfulAndLocal() {
  console.log('Comparing Contentful entries with local Markdown files...\n');
  
  const contentTypes = [
    { 
      id: '21x9qoYgM1TRew9Oagxt8s', 
      name: 'Column', 
      localDir: 'column',
      contentTypeId: '21x9qoYgM1TRew9Oagxt8s'
    },
    { 
      id: '3iZ9V9Emr1bFMBMKGYsCCB', 
      name: 'Shoulders of Giants', 
      localDir: 'shoulders-of-giants',
      contentTypeId: '3iZ9V9Emr1bFMBMKGYsCCB'
    },
  ];
  
  for (const ct of contentTypes) {
    console.log(`\n=== ${ct.name} ===\n`);
    
    // Contentfulからエントリを取得
    console.log(`Fetching ${ct.name} entries from Contentful...`);
    let entries;
    try {
      entries = await client.getEntries({
        content_type: ct.contentTypeId,
        limit: 1000,
      });
    } catch (error) {
      console.error(`Error fetching ${ct.name}:`, error.message);
      continue;
    }
    
    console.log(`Found ${entries.items.length} entries in Contentful.`);
    
    // Contentfulのslugを取得
    const contentfulSlugs = new Set();
    const contentfulEntries = {};
    
    for (const entry of entries.items) {
      // slugフィールドを取得（ロケール対応）
      let slug = '';
      if (entry.fields.slug) {
        if (typeof entry.fields.slug === 'string') {
          slug = entry.fields.slug;
        } else if (entry.fields.slug['ja-JP']) {
          slug = entry.fields.slug['ja-JP'];
        } else if (entry.fields.slug['en-US']) {
          slug = entry.fields.slug['en-US'];
        } else {
          slug = Object.values(entry.fields.slug)[0] || entry.sys.id;
        }
      } else {
        slug = entry.sys.id;
      }
      contentfulSlugs.add(slug);
      contentfulEntries[slug] = {
        id: entry.sys.id,
        slug: slug,
        updatedAt: entry.sys.updatedAt,
      };
    }
    
    // ローカルのMarkdownファイルを取得
    const localDir = path.join(__dirname, '..', 'content', ct.localDir);
    if (!fs.existsSync(localDir)) {
      console.log(`Local directory ${ct.localDir} does not exist.`);
      continue;
    }
    
    const localFiles = fs.readdirSync(localDir)
      .filter(file => file.endsWith('.md') && file !== '_index.md')
      .map(file => {
        const filePath = path.join(localDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = matter(content);
        const slug = parsed.data.slug || path.basename(file, '.md');
        return {
          filename: file,
          slug: slug,
          data: parsed.data,
        };
      });
    
    console.log(`Found ${localFiles.length} Markdown files in local.`);
    
    // ローカルのslugを取得
    const localSlugs = new Set();
    const localFilesBySlug = {};
    
    for (const file of localFiles) {
      localSlugs.add(file.slug);
      if (!localFilesBySlug[file.slug]) {
        localFilesBySlug[file.slug] = [];
      }
      localFilesBySlug[file.slug].push(file);
    }
    
    // 比較
    // Contentfulにあってローカルにないもの
    const onlyInContentful = Array.from(contentfulSlugs).filter(slug => !localSlugs.has(slug));
    if (onlyInContentful.length > 0) {
      console.log(`⚠️  ${onlyInContentful.length} entries in Contentful but not in local`);
    }
    
    // ローカルにあってContentfulにないもの
    const onlyInLocal = Array.from(localSlugs).filter(slug => !contentfulSlugs.has(slug));
    if (onlyInLocal.length > 0) {
      console.log(`⚠️  ${onlyInLocal.length} files in local but not in Contentful`);
    }
    
    // 両方にあるもの
    const inBoth = Array.from(contentfulSlugs).filter(slug => localSlugs.has(slug));
    console.log(`✅ ${inBoth.length} entries in both Contentful and local.`);
    
    // サマリー
    console.log(`\n${ct.name} Summary:`);
    console.log(`  Contentful entries: ${entries.items.length}`);
    console.log(`  Local files: ${localFiles.length}`);
    console.log(`  In both: ${inBoth.length}`);
    console.log(`  Only in Contentful: ${onlyInContentful.length}`);
    console.log(`  Only in local: ${onlyInLocal.length}`);
  }
}

compareAllContentfulAndLocal().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

