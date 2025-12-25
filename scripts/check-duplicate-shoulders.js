// scripts/check-duplicate-shoulders.js
const fs = require('fs');
const path = require('path');

const shouldersDir = path.join(__dirname, '..', 'content', 'shoulders-of-giants');

// ファイルのbody（フロントマターを除いた部分）を取得
function getBodyContent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // フロントマターをスキップ
  const frontMatterEnd = content.indexOf('---', 3);
  if (frontMatterEnd === -1) {
    return content.trim();
  }
  return content.substring(frontMatterEnd + 3).trim();
}

// フロントマターからslugを取得
function getSlug(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const slugMatch = content.match(/^slug:\s*["']?([^"'\n]+)["']?/m);
  if (slugMatch) {
    return slugMatch[1];
  }
  // ファイル名からslugを推測
  const fileName = path.basename(filePath, '.md');
  return fileName;
}

// 内容が重複しているファイルを検出
function findDuplicates() {
  const files = fs.readdirSync(shouldersDir)
    .filter(f => f.endsWith('.md') && f !== '_index.md')
    .map(f => path.join(shouldersDir, f));

  const bodyToFiles = new Map(); // body content -> [file paths]
  const fileInfo = []; // [{slug, path, body, size}]

  console.log(`Checking ${files.length} files for duplicates...\n`);

  for (const filePath of files) {
    const body = getBodyContent(filePath);
    const slug = getSlug(filePath);
    const stats = fs.statSync(filePath);

    fileInfo.push({ slug, path: filePath, body, size: stats.size });

    // bodyを正規化（空白を統一）
    const normalizedBody = body.replace(/\s+/g, ' ').trim();
    
    if (!bodyToFiles.has(normalizedBody)) {
      bodyToFiles.set(normalizedBody, []);
    }
    bodyToFiles.get(normalizedBody).push({ slug, path: filePath, size: stats.size, originalBody: body });
  }

  // 重複を検出
  const duplicates = [];
  for (const [body, files] of bodyToFiles.entries()) {
    if (files.length > 1) {
      duplicates.push({ body, files });
    }
  }

  if (duplicates.length === 0) {
    console.log('No duplicate content found.');
    return;
  }

  console.log(`Found ${duplicates.length} duplicate group(s):\n`);

  for (let i = 0; i < duplicates.length; i++) {
    const { body, files } = duplicates[i];
    const preview = body.substring(0, 150).replace(/\n/g, ' ');
    console.log(`Duplicate Group ${i + 1}:`);
    console.log(`  Content preview: ${preview}...`);
    console.log(`  Files (${files.length}):`);
    
    // ファイルサイズでソート（小さい順）
    files.sort((a, b) => a.size - b.size);
    
    for (const file of files) {
      console.log(`    - ${path.basename(file.path)} (slug: ${file.slug}, size: ${file.size} bytes)`);
    }
    console.log('');
  }

  // 推奨削除候補（各グループで最も小さいファイル、または同じサイズの場合は最初のファイル以外）
  console.log('\nRecommended files to delete (keeping the first file in each group):\n');
  const toDelete = [];
  for (const { files } of duplicates) {
    // ファイルサイズでソート
    files.sort((a, b) => a.size - b.size);
    // 最初のファイル以外を削除候補に
    for (let j = 1; j < files.length; j++) {
      toDelete.push(files[j]);
      console.log(`  - ${path.basename(files[j].path)} (duplicate of ${path.basename(files[0].path)})`);
    }
  }

  return { duplicates, toDelete };
}

// 実行
try {
  const result = findDuplicates();
  if (result && result.toDelete.length > 0) {
    console.log(`\nTotal files to delete: ${result.toDelete.length}`);
  }
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}

