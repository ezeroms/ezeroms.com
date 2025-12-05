#!/bin/bash
# ShortcodeをHTMLに変換するスクリプト

echo "=== Migrating shortcodes to HTML ==="

# Spotify shortcodeをHTMLに変換
find content -name "*.md" -type f -exec sed -i '' \
  's/{{< spotify type="\([^"]*\)" id="\([^"]*\)"\([^>]*\)>}}/<iframe src="https:\/\/open.spotify.com\/embed\/\1\/\2" width="100%" height="152" frameborder="0" allowtransparency="true" allow="encrypted-media" class="spotify"><\/iframe>/g' {} \;

# YouTube shortcodeをHTMLに変換
find content -name "*.md" -type f -exec sed -i '' \
  's/{{< youtube id="\([^"]*\)"\([^>]*\)>}}/<iframe src="https:\/\/www.youtube.com\/embed\/\1" width="100%" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="youtube"><\/iframe>/g' {} \;

echo "✅ Migration complete"
echo "Please review the changes before committing"
