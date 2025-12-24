// scripts/compare-contentful-local.js
// ContentfulのエントリとローカルのMarkdownファイルを比較するスクリプト

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

async function compareContentfulAndLocal() {
  console.log('Comparing Contentful entries with local Markdown files...\n');
  
  // ContentfulからDiaryエントリを取得
  console.log('Fetching Diary entries from Contentful...');
  const diaryContentTypeId = '2Kymz8f5lsk5BSap6oSM9L'; // 現在のDiaryコンテンツタイプID
  const entries = await client.getEntries({
    content_type: diaryContentTypeId,
    limit: 1000,
  });
  
  console.log(`Found ${entries.items.length} entries in Contentful.\n`);
  
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
  const diaryDir = path.join(__dirname, '..', 'content', 'diary');
  const localFiles = fs.readdirSync(diaryDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md')
    .map(file => {
      const filePath = path.join(diaryDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(content);
      const slug = parsed.data.slug || path.basename(file, '.md');
      return {
        filename: file,
        slug: slug,
        data: parsed.data,
      };
    });
  
  console.log(`Found ${localFiles.length} Markdown files in local.\n`);
  
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
  console.log('=== Comparison Results ===\n');
  
  // Contentfulにあってローカルにないもの
  const onlyInContentful = Array.from(contentfulSlugs).filter(slug => !localSlugs.has(slug));
  if (onlyInContentful.length > 0) {
    console.log(`⚠️  ${onlyInContentful.length} entries in Contentful but not in local:`);
    onlyInContentful.forEach(slug => {
      console.log(`   - ${slug} (${contentfulEntries[slug].id})`);
    });
    console.log('');
  }
  
  // ローカルにあってContentfulにないもの
  const onlyInLocal = Array.from(localSlugs).filter(slug => !contentfulSlugs.has(slug));
  if (onlyInLocal.length > 0) {
    console.log(`⚠️  ${onlyInLocal.length} files in local but not in Contentful:`);
    onlyInLocal.forEach(slug => {
      const files = localFilesBySlug[slug];
      files.forEach(file => {
        console.log(`   - ${file.filename} (slug: ${slug})`);
      });
    });
    console.log('');
  }
  
  // 両方にあるもの
  const inBoth = Array.from(contentfulSlugs).filter(slug => localSlugs.has(slug));
  console.log(`✅ ${inBoth.length} entries in both Contentful and local.\n`);
  
  // ローカルに重複があるか確認
  const duplicateSlugs = Object.entries(localFilesBySlug)
    .filter(([slug, files]) => files.length > 1);
  
  if (duplicateSlugs.length > 0) {
    console.log(`⚠️  ${duplicateSlugs.length} duplicate slugs in local files:`);
    duplicateSlugs.forEach(([slug, files]) => {
      console.log(`   - ${slug}: ${files.length} files`);
      files.forEach(file => {
        console.log(`     * ${file.filename}`);
      });
    });
    console.log('');
  }
  
  // サマリー
  console.log('=== Summary ===');
  console.log(`Contentful entries: ${entries.items.length}`);
  console.log(`Local files: ${localFiles.length}`);
  console.log(`In both: ${inBoth.length}`);
  console.log(`Only in Contentful: ${onlyInContentful.length}`);
  console.log(`Only in local: ${onlyInLocal.length}`);
  console.log(`Local duplicates: ${duplicateSlugs.length}`);
  
  if (onlyInLocal.length > 0) {
    console.log('\n⚠️  Recommendation: Delete local files that are not in Contentful, or regenerate from Contentful.');
  }
}

compareContentfulAndLocal().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

