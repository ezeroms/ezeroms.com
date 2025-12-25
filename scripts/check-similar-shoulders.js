// scripts/check-similar-shoulders.js
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

// ファイル全体の内容を取得（フロントマターを含む）
function getFullContent(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// 文字列の類似度を計算（簡易版：共通部分の割合）
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// レーベンシュタイン距離を計算
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// 重複・類似ファイルを検出
function findDuplicatesAndSimilar() {
  const files = fs.readdirSync(shouldersDir)
    .filter(f => f.endsWith('.md') && f !== '_index.md')
    .map(f => path.join(shouldersDir, f));

  console.log(`Checking ${files.length} files for duplicates and similar content...\n`);

  const fileData = files.map(filePath => ({
    path: filePath,
    slug: getSlug(filePath),
    body: getBodyContent(filePath),
    normalizedBody: getBodyContent(filePath).replace(/\s+/g, ' ').trim(),
    fullContent: getFullContent(filePath),
    size: fs.statSync(filePath).size
  }));

  // 完全一致の重複を検出
  const exactDuplicates = new Map();
  for (const file of fileData) {
    const key = file.normalizedBody;
    if (!exactDuplicates.has(key)) {
      exactDuplicates.set(key, []);
    }
    exactDuplicates.get(key).push(file);
  }

  const duplicateGroups = [];
  for (const [body, files] of exactDuplicates.entries()) {
    if (files.length > 1) {
      duplicateGroups.push({ type: 'exact', body, files });
    }
  }

  // 結果を表示
  if (duplicateGroups.length > 0) {
    console.log(`Found ${duplicateGroups.length} exact duplicate group(s):\n`);
    
    for (let i = 0; i < duplicateGroups.length; i++) {
      const { body, files } = duplicateGroups[i];
      const preview = body.substring(0, 100).replace(/\n/g, ' ');
      console.log(`Duplicate Group ${i + 1}:`);
      console.log(`  Content preview: ${preview}...`);
      console.log(`  Files (${files.length}):`);
      
      files.sort((a, b) => a.size - b.size);
      
      for (const file of files) {
        console.log(`    - ${path.basename(file.path)} (slug: ${file.slug}, size: ${file.size} bytes)`);
      }
      console.log('');
    }

    // 削除候補
    console.log('\nRecommended files to delete (keeping the first file in each group):\n');
    const toDelete = [];
    for (const { files } of duplicateGroups) {
      files.sort((a, b) => a.size - b.size);
      for (let j = 1; j < files.length; j++) {
        toDelete.push(files[j]);
        console.log(`  - ${path.basename(files[j].path)} (duplicate of ${path.basename(files[0].path)})`);
      }
    }
    console.log(`\nTotal files to delete: ${toDelete.length}`);
    
    return { duplicateGroups, toDelete };
  } else {
    console.log('No exact duplicates found.\n');
    
    // 高度な類似度チェック（時間がかかるので、小規模なサンプルのみ）
    console.log('Checking for similar content (this may take a while)...\n');
    const similarPairs = [];
    
    // すべてのペアを比較（計算量が多いので、bodyが短いものからチェック）
    const sortedFiles = fileData.sort((a, b) => a.body.length - b.body.length);
    
    for (let i = 0; i < Math.min(sortedFiles.length, 50); i++) {
      for (let j = i + 1; j < sortedFiles.length; j++) {
        const file1 = sortedFiles[i];
        const file2 = sortedFiles[j];
        
        // bodyの長さが大きく異なる場合はスキップ
        if (Math.abs(file1.body.length - file2.body.length) > file1.body.length * 0.2) {
          continue;
        }
        
        const similarity = calculateSimilarity(file1.normalizedBody, file2.normalizedBody);
        if (similarity > 0.95) {
          similarPairs.push({ file1, file2, similarity });
        }
      }
    }
    
    if (similarPairs.length > 0) {
      console.log(`Found ${similarPairs.length} similar pairs:\n`);
      for (const { file1, file2, similarity } of similarPairs) {
        console.log(`Similarity: ${(similarity * 100).toFixed(2)}%`);
        console.log(`  - ${path.basename(file1.path)} (${file1.slug})`);
        console.log(`  - ${path.basename(file2.path)} (${file2.slug})`);
        console.log('');
      }
    } else {
      console.log('No similar content found.');
    }
    
    return { duplicateGroups: [], toDelete: [], similarPairs };
  }
}

// 実行
try {
  findDuplicatesAndSimilar();
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}

