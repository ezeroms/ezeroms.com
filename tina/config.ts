import { defineConfig } from "tinacms";

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,

  // Get this from tina.io
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  // Get this from tina.io
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "static",
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "static",
    },
  },
  // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/schema/
  schema: {
    collections: [
      {
        name: "about",
        label: "About",
        path: "content/about",
        fields: [
          {
            type: "markdown",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },
      {
        name: "diary",
        label: "Diary",
        path: "content/diary",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "datetime",
            name: "date",
            label: "Date",
            required: true,
            ui: {
              dateFormat: "YYYY-MM-DD",
              timeFormat: false,
            },
          },
          {
            type: "list",
            name: "diaries",
            label: "Diaries",
          },
          {
            type: "string",
            name: "slug",
            label: "Slug",
            required: true,
          },
          {
            type: "select",
            name: "topics",
            label: "Topics",
            options: ["news", "music", "manga-and-anime", "movies-and-dramas", "comedy", "gaming", "sports", "books-and-magazines", "languages-and-foreign-cultures", "design", "internet-and-technology", "natural-science", "humanities-and-social-sciences"],
            list: true,
          },
          {
            type: "markdown",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },
      {
        name: "work",
        label: "Work",
        path: "content/work",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "datetime",
            name: "date",
            label: "Date",
            required: true,
            ui: {
              dateFormat: "YYYY-MM-DD",
              timeFormat: false,
            },
          },
          {
            type: "image",
            name: "image",
            label: "Image",
          },
          {
            type: "markdown",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },
      {
        name: "keyword",
        label: "Keyword",
        path: "content/keyword",
        fields: [
          {
            type: "list",
            name: "keywords",
            label: "Keywords",
          },
          {
            type: "markdown",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },
    ],
  },
});
