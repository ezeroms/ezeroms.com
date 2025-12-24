// scripts/create-content-types.js
// Contentful側に新しいコンテンツタイプを作成するスクリプト

require('dotenv').config();
const { createClient } = require('contentful-management');

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

async function createContentTypes() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master');

  console.log('Creating new content types in Contentful...\n');

  // 1. Columnコンテンツタイプを作成
  try {
    console.log('Creating "column" content type...');
    const columnContentType = await environment.createContentType({
      sys: {
        id: 'column',
      },
      name: 'Column',
      displayField: 'title',
      fields: [
        {
          id: 'title',
          name: 'Title',
          type: 'Symbol',
          required: true,
          localized: true,
        },
        {
          id: 'slug',
          name: 'Slug',
          type: 'Symbol',
          required: true,
          localized: true,
        },
        {
          id: 'date',
          name: 'Date',
          type: 'Date',
          required: true,
          localized: true,
        },
        {
          id: 'column_month',
          name: 'Column Month',
          type: 'Symbol',
          required: false,
          localized: true,
        },
        {
          id: 'body',
          name: 'Body',
          type: 'RichText',
          required: true,
          localized: true,
        },
        {
          id: 'column_category',
          name: 'Column Category',
          type: 'Array',
          required: false,
          localized: true,
          items: {
            type: 'Symbol',
            validations: [],
          },
        },
        {
          id: 'column_tag',
          name: 'Column Tag',
          type: 'Array',
          required: false,
          localized: true,
          items: {
            type: 'Symbol',
            validations: [],
          },
        },
      ],
    });
    
    await columnContentType.publish();
    console.log('  ✅ Created "column" content type\n');
  } catch (error) {
    if (error.response && error.response.data && error.response.data.sys && error.response.data.sys.id === 'VersionMismatch') {
      console.log('  ⏭️  "column" content type already exists\n');
    } else if (error.message && error.message.includes('already exists')) {
      console.log('  ⏭️  "column" content type already exists\n');
    } else {
      console.error('  ❌ Error creating "column" content type:', error.message);
      if (error.response) {
        console.error('  Response:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }

  // 2. Diaryコンテンツタイプを作成（既存のdiaryはColumnなので、新しいdiaryを作成）
  try {
    console.log('Creating "diary" content type (new)...');
    // 既存のdiaryコンテンツタイプを確認
    let existingDiary;
    try {
      existingDiary = await environment.getContentType('diary');
      console.log('  ⚠️  "diary" content type already exists (currently used for Column)');
      console.log('  ⚠️  Will create "diary_new" first, then you can migrate entries and delete old "diary"\n');
      
      // 一時的にdiary_newとして作成
      const diaryContentTypeNew = await environment.createContentType({
        sys: {
          id: 'diary_new',
        },
        name: 'Diary (New)',
        displayField: 'slug',
        fields: [
          {
            id: 'slug',
            name: 'Slug',
            type: 'Symbol',
            required: true,
            localized: true,
          },
          {
            id: 'date',
            name: 'Date',
            type: 'Date',
            required: true,
            localized: true,
          },
          {
            id: 'diary_month',
            name: 'Diary Month',
            type: 'Symbol',
            required: true,
            localized: true,
          },
          {
            id: 'body',
            name: 'Body',
            type: 'RichText',
            required: true,
            localized: true,
          },
          {
            id: 'diary_tag',
            name: 'Diary Tag',
            type: 'Array',
            required: false,
            localized: true,
            items: {
              type: 'Symbol',
              validations: [],
            },
          },
          {
            id: 'diary_place',
            name: 'Diary Place',
            type: 'Symbol',
            required: false,
            localized: true,
          },
          {
            id: 'voice_type',
            name: 'Voice Type',
            type: 'Array',
            required: false,
            localized: true,
            items: {
              type: 'Symbol',
              validations: [],
            },
          },
        ],
      });
      
      await diaryContentTypeNew.publish();
      console.log('  ✅ Created "diary_new" content type');
      console.log('  ⚠️  After migrating entries from "tweet" to "diary_new", you can:');
      console.log('      1. Delete old "diary" content type (currently Column)');
      console.log('      2. Delete "diary_new" content type');
      console.log('      3. Create new "diary" content type with the same fields\n');
    } catch (error) {
      // diaryが存在しない場合は新規作成
      const diaryContentType = await environment.createContentType({
        sys: {
          id: 'diary',
        },
        name: 'Diary',
        displayField: 'slug',
        fields: [
          {
            id: 'slug',
            name: 'Slug',
            type: 'Symbol',
            required: true,
            localized: true,
          },
          {
            id: 'date',
            name: 'Date',
            type: 'Date',
            required: true,
            localized: true,
          },
          {
            id: 'diary_month',
            name: 'Diary Month',
            type: 'Symbol',
            required: true,
            localized: true,
          },
          {
            id: 'body',
            name: 'Body',
            type: 'RichText',
            required: true,
            localized: true,
          },
          {
            id: 'diary_tag',
            name: 'Diary Tag',
            type: 'Array',
            required: false,
            localized: true,
            items: {
              type: 'Symbol',
              validations: [],
            },
          },
          {
            id: 'diary_place',
            name: 'Diary Place',
            type: 'Symbol',
            required: false,
            localized: true,
          },
          {
            id: 'voice_type',
            name: 'Voice Type',
            type: 'Array',
            required: false,
            localized: true,
            items: {
              type: 'Symbol',
              validations: [],
            },
          },
        ],
      });
      
      await diaryContentType.publish();
      console.log('  ✅ Created "diary" content type\n');
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.sys && error.response.data.sys.id === 'VersionMismatch') {
      console.log('  ⏭️  "diary" content type already exists\n');
    } else if (error.message && error.message.includes('already exists')) {
      console.log('  ⏭️  "diary" content type already exists\n');
    } else {
      console.error('  ❌ Error creating "diary" content type:', error.message);
      if (error.response) {
        console.error('  Response:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }

  // 3. Shoulders of Giantsコンテンツタイプを作成
  try {
    console.log('Creating "shoulders_of_giants" content type...');
    const shouldersContentType = await environment.createContentType({
      sys: {
        id: 'shoulders_of_giants',
      },
      name: 'Shoulders of Giants',
      displayField: 'slug',
      fields: [
        {
          id: 'slug',
          name: 'Slug',
          type: 'Symbol',
          required: true,
          localized: true,
        },
        {
          id: 'body',
          name: 'Body',
          type: 'RichText',
          required: true,
          localized: true,
        },
        {
          id: 'topic',
          name: 'Topic',
          type: 'Array',
          required: false,
          localized: true,
          items: {
            type: 'Symbol',
            validations: [],
          },
        },
        {
          id: 'book_title',
          name: 'Book Title',
          type: 'Symbol',
          required: false,
          localized: true,
        },
        {
          id: 'author',
          name: 'Author',
          type: 'Symbol',
          required: false,
          localized: true,
        },
        {
          id: 'publisher',
          name: 'Publisher',
          type: 'Symbol',
          required: false,
          localized: true,
        },
        {
          id: 'published_year',
          name: 'Published Year',
          type: 'Symbol',
          required: false,
          localized: true,
        },
        {
          id: 'citation_override',
          name: 'Citation Override',
          type: 'Symbol',
          required: false,
          localized: true,
        },
      ],
    });
    
    await shouldersContentType.publish();
    console.log('  ✅ Created "shoulders_of_giants" content type\n');
  } catch (error) {
    if (error.response && error.response.data && error.response.data.sys && error.response.data.sys.id === 'VersionMismatch') {
      console.log('  ⏭️  "shoulders_of_giants" content type already exists\n');
    } else if (error.message && error.message.includes('already exists')) {
      console.log('  ⏭️  "shoulders_of_giants" content type already exists\n');
    } else {
      console.error('  ❌ Error creating "shoulders_of_giants" content type:', error.message);
      if (error.response) {
        console.error('  Response:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }

  console.log('Done. Please run "node scripts/migrate-content-types.js" to migrate entries.');
}

createContentTypes().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

