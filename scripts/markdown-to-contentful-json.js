// scripts/markdown-to-contentful-json.js
// MarkdownファイルをContentfulインポート用のJSON形式に変換するスクリプト
// Management APIを使わず、生成されたJSONファイルをContentful Web UIから手動でインポート

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { BLOCKS } = require('@contentful/rich-text-types');

// Markdown→Rich Text変換（段落ベースの簡易実装）
function markdownToRichText(markdown) {
  if (!markdown || !markdown.trim()) {
    return {
      nodeType: BLOCKS.DOCUMENT,
      content: [{
        nodeType: BLOCKS.PARAGRAPH,
        content: [],
      }],
    };
  }

  // 段落を分割（空行で区切る）
  const paragraphs = markdown.split(/\n\s*\n/).filter(p => p.trim());
  
  const document = {
    nodeType: BLOCKS.DOCUMENT,
    data: {}, // Contentful CLIはdataプロパティを要求します
    content: paragraphs.map(para => {
      // 段落内の改行をスペースに変換
      const text = para.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');
      return {
        nodeType: BLOCKS.PARAGRAPH,
        data: {}, // 各ノードにもdataプロパティが必要
        content: text ? [{
          nodeType: 'text',
          value: text,
          marks: [],
          data: {}, // テキストノードにもdataプロパティが必要
        }] : [],
      };
    }),
  };

  // 空の場合は空の段落を返す
  if (document.content.length === 0) {
    document.content.push({
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [],
    });
  }

  return document;
}

// Contentfulエントリ形式のJSONを生成
// ロケールコード: Contentfulのデフォルトロケールを設定してください
// 'en-US' (英語) または 'ja' / 'ja-JP' (日本語) など
// Contentful Web App > Settings > Locales で確認・変更できます
const DEFAULT_LOCALE = 'ja'; // 日本語ロケールを使用（'ja' または 'ja-JP'）

function generateContentfulEntry(slug, frontMatter, body) {
  const richTextBody = markdownToRichText(body.trim());

  const entry = {
    sys: {
      id: slug, // エントリIDとしてslugを使用
      contentType: {
        sys: {
          id: 'shouldersOfGiants',
        },
      },
    },
    fields: {
      slug: {
        [DEFAULT_LOCALE]: slug,
      },
      body: {
        [DEFAULT_LOCALE]: richTextBody,
      },
      topic: {
        [DEFAULT_LOCALE]: Array.isArray(frontMatter.topic) ? frontMatter.topic : (frontMatter.topic ? [frontMatter.topic] : []),
      },
    },
  };

  // オプションフィールドを追加
  if (frontMatter.book_title) {
    entry.fields.book_title = {
      [DEFAULT_LOCALE]: String(frontMatter.book_title),
    };
  }
  if (frontMatter.author) {
    entry.fields.author = {
      [DEFAULT_LOCALE]: String(frontMatter.author),
    };
  }
  if (frontMatter.publisher) {
    entry.fields.publisher = {
      [DEFAULT_LOCALE]: String(frontMatter.publisher),
    };
  }
  if (frontMatter.published_year) {
    entry.fields.published_year = {
      [DEFAULT_LOCALE]: String(frontMatter.published_year),
    };
  }
  if (frontMatter.citation_override) {
    entry.fields.citation_override = {
      [DEFAULT_LOCALE]: String(frontMatter.citation_override),
    };
  }

  return entry;
}

async function generateContentfulJSON() {
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

  const entries = [];

  for (const file of contentfulFiles) {
    const filePath = path.join(contentDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: frontMatter, content: body } = matter(fileContent);

    // slugを生成（ファイル名から拡張子を除いたもの）
    const slug = path.basename(file, '.md');

    try {
      const entry = generateContentfulEntry(slug, frontMatter, body);
      entries.push(entry);
      console.log(`✅ Converted ${file} (slug: ${slug})`);
    } catch (error) {
      console.error(`❌ Error converting ${file}:`, error.message);
    }
  }

  // Contentful CLIインポート形式のJSONを生成
  // Contentful CLIは以下の形式を期待します:
  // {
  //   "contentTypes": [],
  //   "entries": [],
  //   "assets": [],
  //   ...
  // }
  const importData = {
    version: 7,
    contentTypes: [],
    entries: entries,
    assets: [],
    locales: [],
    tags: [],
    webhooks: [],
    editorInterfaces: [],
  };

  // JSONファイルとして保存
  const outputPath = path.join(outputDir, 'shoulders-of-giants-import.json');
  fs.writeFileSync(outputPath, JSON.stringify(importData, null, 2), 'utf8');

  console.log(`\n✅ Generated ${entries.length} entries`);
  console.log(`📄 Output file: ${outputPath}`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Open Contentful Web App`);
  console.log(`   2. Go to Content > Shoulders of Giants`);
  console.log(`   3. Manually create entries using the data from the JSON file`);
  console.log(`   4. Or use Contentful CLI: contentful space import --content-file ${outputPath}`);
  console.log(`\n⚠️  Note: Contentful Web UI does not support direct JSON import.`);
  console.log(`   You'll need to either:`);
  console.log(`   - Manually copy data from JSON to Contentful Web UI`);
  console.log(`   - Use Contentful CLI (which requires Management API access)`);
  console.log(`   - Use a third-party tool or script`);
}

// 実行
generateContentfulJSON().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

