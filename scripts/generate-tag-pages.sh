#!/bin/bash

# Tweetセクションのタグページを生成するスクリプト

CONTENT_DIR="content/tweet"
TAG_DIR="${CONTENT_DIR}/tag"

# タグディレクトリを作成
mkdir -p "$TAG_DIR"

# 既存のタグを取得
tags=$(grep -r "tweet_tag:" "$CONTENT_DIR"/*.md 2>/dev/null | \
    sed -n 's/.*tweet_tag:.*$//p' | \
    grep -E "^\s+-" | \
    sed 's/^\s*-\s*//' | \
    sed 's/[[:space:]]*$//' | \
    sort -u)

# 各タグごとに_index.mdを生成
for tag in $tags; do
    if [ -n "$tag" ]; then
        tag_slug=$(echo "$tag" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
        tag_dir="${TAG_DIR}/${tag_slug}"
        mkdir -p "$tag_dir"
        
        cat > "${tag_dir}/_index.md" <<EOF
---
title: "${tag}"
---
EOF
        echo "Created: ${tag_dir}/_index.md"
    fi
done

echo "Tag pages generated successfully!"




