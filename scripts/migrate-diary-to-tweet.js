// scripts/migrate-diary-to-tweet.js
// Diaryの記事をTweetディレクトリに移行し、フォーマットをTweet形式に変換する

const fs = require('fs');
const path = require('path');

const diaryDir = path.join(__dirname, '..', 'content', 'diary');
const tweetDir = path.join(__dirname, '..', 'content', 'tweet');

// _index.mdは除外
const excludeFiles = ['_index.md'];

function convertDiaryToTweetFormat(content) {
  // Front matterを抽出
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    console.warn('Front matter not found, skipping conversion');
    return null;
  }
  
  const frontMatter = match[1];
  const body = match[2];
  
  // Front matterをパースして変換
  const lines = frontMatter.split('\n');
  const newFrontMatterLines = [];
  
  let inDiaryTagArray = false;
  let inDiaryMonthArray = false;
  let dateStr = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // titleフィールドを削除
    if (line.startsWith('title:')) {
      continue;
    }
    
    // dateを取得
    if (line.startsWith('date:')) {
      dateStr = line.replace('date:', '').trim().replace(/"/g, '');
      newFrontMatterLines.push(line);
      continue;
    }
    
    // diary_tagをtweet_tagに変換
    if (line.startsWith('diary_tag:')) {
      newFrontMatterLines.push(line.replace('diary_tag:', 'tweet_tag:'));
      inDiaryTagArray = true;
      continue;
    }
    
    // diary_monthをスキップ（後でtweet_monthとして追加）
    if (line.startsWith('diary_month:')) {
      inDiaryMonthArray = true;
      continue;
    }
    
    // diary_placeをtweet_placeに変換
    if (line.startsWith('diary_place:')) {
      newFrontMatterLines.push(line.replace('diary_place:', 'tweet_place:'));
      continue;
    }
    if (line.startsWith('place:')) {
      newFrontMatterLines.push(line.replace('place:', 'tweet_place:'));
      continue;
    }
    
    // diary_tag配列の要素
    if (inDiaryTagArray) {
      if (line.trim() === '' || (!line.startsWith('  -') && !line.startsWith('-') && !line.match(/^\s+-/))) {
        inDiaryTagArray = false;
        if (line.trim() !== '') {
          newFrontMatterLines.push(line);
        }
      } else {
        newFrontMatterLines.push(line);
      }
      continue;
    }
    
    // diary_month配列の要素をスキップ
    if (inDiaryMonthArray) {
      if (line.trim() === '' || (!line.startsWith('  -') && !line.startsWith('-') && !line.match(/^\s+-/))) {
        inDiaryMonthArray = false;
        if (line.trim() !== '') {
          newFrontMatterLines.push(line);
        }
      }
      continue;
    }
    
    // その他のフィールドはそのまま保持（slug, min_temp, max_temp, weatherなど）
    newFrontMatterLines.push(line);
  }
  
  // tweet_monthを追加（dateから計算）
  if (dateStr) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const tweetMonth = `${year}-${month}`;
      
      // tweet_monthをdateの後に追加
      const dateIndex = newFrontMatterLines.findIndex(l => l.startsWith('date:'));
      if (dateIndex >= 0) {
        newFrontMatterLines.splice(dateIndex + 1, 0, `tweet_month: ${tweetMonth}`);
      } else {
        newFrontMatterLines.unshift(`tweet_month: ${tweetMonth}`);
      }
    }
  }
  
  const newFrontMatter = newFrontMatterLines.join('\n');
  return `---\n${newFrontMatter}\n---\n\n${body}`;
}

function migrateDiaryToTweet() {
  const files = fs.readdirSync(diaryDir);
  
  for (const file of files) {
    if (excludeFiles.includes(file)) {
      continue;
    }
    
    const diaryPath = path.join(diaryDir, file);
    const tweetPath = path.join(tweetDir, file);
    
    // 既にtweetディレクトリに同名ファイルがある場合はスキップ
    if (fs.existsSync(tweetPath)) {
      console.log(`Skipping ${file} (already exists in tweet directory)`);
      continue;
    }
    
    const content = fs.readFileSync(diaryPath, 'utf8');
    const convertedContent = convertDiaryToTweetFormat(content);
    
    if (convertedContent) {
      fs.writeFileSync(tweetPath, convertedContent, 'utf8');
      console.log(`Migrated ${file} to tweet directory`);
    } else {
      console.warn(`Failed to convert ${file}`);
    }
  }
  
  console.log('Migration completed.');
}

migrateDiaryToTweet();

