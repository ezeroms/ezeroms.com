// scripts/markdown-to-contentful.js
// MarkdownファイルをContentfulにインポートするスクリプト
//
// 使用方法:
// 1. .envファイルにCONTENTFUL_MANAGEMENT_TOKENを追加（Contentful Management API用のトークン）
// 2. node scripts/markdown-to-contentful.js を実行
//
// 注意:
// - Contentful由来のファイル（ランダムな文字列のslug）は自動的にスキップされます
// - 手動作成のファイル（-1.md, -2.mdなど）のみがインポート対象になります
// - 既にContentfulに存在するslugの場合はスキップされます

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { createClient } = require('contentful-management');
const { BLOCKS, INLINES, MARKS } = require('@contentful/rich-text-types');
const { marked } = require('marked');

// Contentful Management API クライアント
const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN, // Management API用のトークン
});

// MarkdownをRich Text形式に変換する関数
function markdownToRichText(markdown) {
  // まずMarkdownをHTMLに変換（Turndownの逆）
  // 簡易的な実装: 段落と改行を処理
  const lines = markdown.split('\n');
  const document = {
    nodeType: BLOCKS.DOCUMENT,
    content: [],
  };

  let currentParagraph = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === '') {
      // 空行: 現在の段落を閉じる
      if (currentParagraph) {
        document.content.push(currentParagraph);
        currentParagraph = null;
      }
    } else {
      // テキスト行: 段落に追加
      if (!currentParagraph) {
        currentParagraph = {
          nodeType: BLOCKS.PARAGRAPH,
          content: [],
        };
      }
      
      // 行をテキストノードとして追加
      currentParagraph.content.push({
        nodeType: 'text',
        value: trimmed,
        marks: [],
      });
      
      // 段落内の改行（最後の行でない場合）
      if (lines.indexOf(line) < lines.length - 1 && lines[lines.indexOf(line) + 1].trim() !== '') {
        currentParagraph.content.push({
          nodeType: 'text',
          value: ' ',
          marks: [],
        });
      }
    }
  }

  // 最後の段落を追加
  if (currentParagraph) {
    document.content.push(currentParagraph);
  }

  // 空の場合は空の段落を返す
  if (document.content.length === 0) {
    document.content.push({
      nodeType: BLOCKS.PARAGRAPH,
      content: [],
    });
  }

  return document;
}

// Markdown→Rich Text変換（段落ベースの簡易実装）
function markdownToRichTextAdvanced(markdown) {
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
    content: paragraphs.map(para => {
      // 段落内の改行をスペースに変換
      const text = para.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');
      return {
        nodeType: BLOCKS.PARAGRAPH,
        content: text ? [{
          nodeType: 'text',
          value: text,
          marks: [],
        }] : [],
      };
    }),
  };

  // 空の場合は空の段落を返す
  if (document.content.length === 0) {
    document.content.push({
      nodeType: BLOCKS.PARAGRAPH,
      content: [],
    });
  }

  return document;
}

async function importMarkdownToContentful() {
  const contentDir = path.join(__dirname, '..', 'content', 'shoulders-of-giants');
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md') && f !== '_index.md');

  // Contentfulから既存のエントリを取得してslugのリストを作成
  console.log('Fetching existing entries from Contentful...');
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');
  
  let existingSlugs = new Set();
  try {
    const entries = await environment.getEntries({
      content_type: 'shouldersOfGiants',
      limit: 1000,
    });
    entries.items.forEach(entry => {
      // slugフィールドの構造を確認（ロケール対応）
      let slug = null;
      if (entry.fields.slug) {
        if (typeof entry.fields.slug === 'object' && entry.fields.slug['ja-JP']) {
          slug = entry.fields.slug['ja-JP'];
        } else if (typeof entry.fields.slug === 'string') {
          slug = entry.fields.slug;
        }
      }
      // slugが取得できない場合はエントリIDを使用
      if (!slug) {
        slug = entry.sys.id;
      }
      existingSlugs.add(slug);
    });
    console.log(`Found ${existingSlugs.size} existing entries in Contentful.`);
  } catch (error) {
    console.warn('⚠️  Could not fetch existing entries:', error.message);
    console.warn('   Continuing anyway...');
  }

  // Contentful由来のファイル（ランダムな文字列のslug）を除外
  const contentfulFiles = files.filter(f => {
    const slug = path.basename(f, '.md');
    // Contentful由来のファイルは、ランダムな文字列（例: dbhb4zaywtxe6ig2）
    // 手動作成のファイルは、数字のみ（例: -1, -2）
    return /^-\d+$/.test(slug);
  });

  console.log(`Found ${contentfulFiles.length} manually created files to import.`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const file of contentfulFiles) {
    const filePath = path.join(contentDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: frontMatter, content: body } = matter(fileContent);

    // slugを生成（ファイル名から拡張子を除いたもの）
    const slug = path.basename(file, '.md');

    // 既に存在する場合はスキップ
    if (existingSlugs.has(slug)) {
      console.log(`⏭️  Skipping ${file} (already exists in Contentful)`);
      skipCount++;
      continue;
    }

    try {
      // Rich Text形式に変換
      const richTextBody = markdownToRichTextAdvanced(body.trim());

      // Contentfulエントリのフィールドを構築
      const fields = {
        slug: {
          'ja-JP': slug,
        },
        body: {
          'ja-JP': richTextBody,
        },
        topic: {
          'ja-JP': Array.isArray(frontMatter.topic) ? frontMatter.topic : (frontMatter.topic ? [frontMatter.topic] : []),
        },
      };

      // オプションフィールドを追加（値がある場合のみ）
      if (frontMatter.book_title) {
        fields.book_title = {
          'ja-JP': String(frontMatter.book_title),
        };
      }
      if (frontMatter.author) {
        fields.author = {
          'ja-JP': String(frontMatter.author),
        };
      }
      if (frontMatter.publisher) {
        fields.publisher = {
          'ja-JP': String(frontMatter.publisher),
        };
      }
      if (frontMatter.published_year) {
        fields.published_year = {
          'ja-JP': String(frontMatter.published_year),
        };
      }
      if (frontMatter.citation_override) {
        fields.citation_override = {
          'ja-JP': String(frontMatter.citation_override),
        };
      }

      // Contentfulエントリを作成
      const entry = await environment.createEntry('shouldersOfGiants', {
        fields: fields,
      });

      // エントリを公開（オプション）
      // await entry.publish();

      console.log(`✅ Imported ${file} (slug: ${slug})`);
      successCount++;
      
      // レート制限を避けるために少し待機
      if (successCount % 10 === 0) {
        console.log('   Waiting 1 second to avoid rate limiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Error importing ${file}:`, error.message);
      if (error.response) {
        console.error('   Response:', JSON.stringify(error.response, null, 2));
      }
      if (error.request) {
        console.error('   Request details:', error.request);
      }
      errorCount++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`⏭️  Skipped (already exists): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${contentfulFiles.length}`);
}

// 実行
importMarkdownToContentful().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

