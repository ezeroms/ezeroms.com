// scripts/markdown-to-contentful-csv.js
// MarkdownファイルをContentful手動入力用のCSV形式に変換するスクリプト
// CSVファイルを開いて、Contentful Web UIから手動でコピー&ペースト

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function escapeCsvField(field) {
  if (field === null || field === undefined) {
    return '';
  }
  const str = String(field);
  // CSVの特殊文字をエスケープ
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function generateContentfulCSV() {
  const contentDir = path.join(__dirname, '..', 'content', 'shoulders-of-giants');
  const outputDir = path.join(__dirname, '..', 'contentful-import');
  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md') && f !== '_index.md');

  // Contentful由来のファイル（ランダムな文字列のslug）を除外
  const contentfulFiles = files.filter(f => {
    const slug = path.basename(f, '.md');
    // 手動作成のファイルは、数字のみ（例: -1, -2）
    return /^-\d+$/.test(slug);
  });

  console.log(`Found ${contentfulFiles.length} manually created files to convert.`);

  // CSVヘッダー
  const csvRows = [
    ['Slug', 'Body (Markdown)', 'Topic (comma-separated)', 'Book Title', 'Author', 'Publisher', 'Published Year', 'Citation Override'].map(escapeCsvField).join(',')
  ];

  for (const file of contentfulFiles) {
    const filePath = path.join(contentDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: frontMatter, content: body } = matter(fileContent);

    // slugを生成（ファイル名から拡張子を除いたもの）
    const slug = path.basename(file, '.md');

    const topics = Array.isArray(frontMatter.topic) 
      ? frontMatter.topic.join(', ') 
      : (frontMatter.topic ? String(frontMatter.topic) : '');

    const row = [
      slug,
      body.trim(),
      topics,
      frontMatter.book_title || '',
      frontMatter.author || '',
      frontMatter.publisher || '',
      frontMatter.published_year || '',
      frontMatter.citation_override || '',
    ].map(escapeCsvField);

    csvRows.push(row.join(','));
    console.log(`✅ Converted ${file} (slug: ${slug})`);
  }

  // CSVファイルとして保存
  const outputPath = path.join(outputDir, 'shoulders-of-giants-import.csv');
  fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf8');

  console.log(`\n✅ Generated ${contentfulFiles.length} entries`);
  console.log(`📄 Output file: ${outputPath}`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Open ${outputPath} in Excel or Google Sheets`);
  console.log(`   2. Open Contentful Web App > Content > Shoulders of Giants`);
  console.log(`   3. For each row in the CSV:`);
  console.log(`      - Click "Add entry"`);
  console.log(`      - Copy and paste values from CSV columns to Contentful fields`);
  console.log(`      - For "Body" field: Paste the Markdown text (Contentful will convert it)`);
  console.log(`      - For "Topic" field: Add each topic as a separate tag`);
  console.log(`      - Click "Publish"`);
}

// 実行
generateContentfulCSV().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

