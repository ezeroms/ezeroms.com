// scripts/delete-duplicate-shoulders.js
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

// 内容が重複しているファイルを検出して削除
function deleteDuplicates() {
  const files = fs.readdirSync(shouldersDir)
    .filter(f => f.endsWith('.md') && f !== '_index.md')
    .map(f => path.join(shouldersDir, f));

  const bodyToFiles = new Map(); // body content -> [file paths]

  console.log(`Checking ${files.length} files for duplicates...\n`);

  for (const filePath of files) {
    const body = getBodyContent(filePath);
    
    if (!bodyToFiles.has(body)) {
      bodyToFiles.set(body, []);
    }
    bodyToFiles.get(body).push(filePath);
  }

  // 重複を検出して削除
  const toDelete = [];
  for (const [body, filePaths] of bodyToFiles.entries()) {
    if (filePaths.length > 1) {
      // 最初のファイル以外を削除対象に
      for (let i = 1; i < filePaths.length; i++) {
        toDelete.push(filePaths[i]);
      }
    }
  }

  if (toDelete.length === 0) {
    console.log('No duplicate files found.');
    return;
  }

  console.log(`Found ${toDelete.length} duplicate file(s) to delete.\n`);

  // 削除実行
  let deletedCount = 0;
  for (const filePath of toDelete) {
    const fileName = path.basename(filePath);
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted: ${fileName}`);
      deletedCount++;
    } catch (error) {
      console.error(`Error deleting ${fileName}:`, error.message);
    }
  }

  console.log(`\nDeleted ${deletedCount} duplicate file(s).`);
}

// 実行
try {
  deleteDuplicates();
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}

