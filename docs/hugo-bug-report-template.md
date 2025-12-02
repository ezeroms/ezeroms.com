# Hugo Bug Report: Section name "tweet" causes layout resolution issue

## Issue Title
Section name "tweet" causes standalone HTML template (`list.html`) to be ignored, falls back to `baseof.html`

## Description

When using "tweet" as a section name, Hugo ignores the standalone HTML template (`layouts/tweet/list.html`) and falls back to using `baseof.html` instead. This behavior does not occur with other section names (e.g., "diary", "work", "column", or "tweet2").

## Steps to Reproduce

1. Create a section named "tweet" with `content/tweet/_index.md`:
   ```markdown
   ---
   title: "Tweet"
   layout: "list"
   ---
   ```

2. Create a standalone HTML template `layouts/tweet/list.html`:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <meta charset="utf-8">
       <title>Test</title>
   </head>
   <body>
       <h1>This should be rendered</h1>
   </body>
   </html>
   ```

3. Build the site with `hugo`

4. Check `public/tweet/index.html` - it will be wrapped with `baseof.html` instead of using the standalone template

## Expected Behavior

The standalone HTML template (`layouts/tweet/list.html`) should be used, and the output should be a complete HTML document without `baseof.html` wrapping, similar to how `layouts/diary/list.html` works.

## Actual Behavior

Hugo ignores `layouts/tweet/list.html` and uses `baseof.html` instead, resulting in a wrapped HTML document.

## Environment

- **Hugo Version**: v0.152.2+extended+withdeploy
- **Build Date**: 2025-10-24T15:31:49Z
- **Platform**: darwin/amd64
- **Installation Method**: Homebrew

## Additional Context

### Test Results

1. **"tweet" section**: Problem occurs - `baseof.html` is used
2. **"tweet2" section**: Works correctly - standalone template is used
3. **"diary" section**: Works correctly - standalone template is used
4. **"work" section**: Works correctly (uses `{{ define }}` blocks with `baseof.html`)
5. **"column" section**: Works correctly (uses `{{ define }}` blocks with `baseof.html`)

### File Comparison

`layouts/diary/list.html` and `layouts/tweet/list.html` are structurally identical (only section names and taxonomy names differ), yet `diary` works correctly while `tweet` does not.

### Project Investigation

We investigated our project to ensure this is not a project-specific issue:
- No `layouts/_default/list.html` or `layouts/_default/section.html` exists
- No special handling for "tweet" section in `baseof.html`
- No special configuration in `config.toml` or `cloudcannon.config.yml`
- No custom code that forces `baseof.html` for "tweet" section

### Generated Output Comparison

**`public/diary/index.html` (working correctly):**
- 63 lines
- Starts with `<!DOCTYPE html>` (standalone HTML)
- Not wrapped with `baseof.html`

**`public/tweet/index.html` (problem):**
- 1479 lines
- Starts with `<!DOCTYPE html><html lang="en">` (wrapped with `baseof.html`)
- Contains `baseof.html` structure
- Contains `tweet-container` class (suggesting it's using a taxonomy template structure)

**`public/tweet2/index.html` (working correctly):**
- 23 lines
- Starts with `<!DOCTYPE html>` (standalone HTML)
- Not wrapped with `baseof.html`

### Hugo Template Metrics

When building with `hugo --templateMetrics`, `tweet/list.html` is shown as executed once (144.417µs), but the output is still wrapped with `baseof.html`, suggesting Hugo reads the template but doesn't recognize it as a standalone HTML document.

### Key Findings

1. **Template Execution**: `tweet/list.html` is executed according to `hugo --templateMetrics`, but the output is wrapped with `baseof.html`
2. **Output Structure**: `public/tweet/index.html` contains `tweet-container` class, which suggests it's using a taxonomy template structure (similar to `layouts/tweet_tag/term.html`)
3. **Comparison**: `public/diary/index.html` (63 lines, standalone HTML) vs `public/tweet/index.html` (1479 lines, wrapped with `baseof.html`)
4. **Template Files**: `layouts/tweet/list.html` and `layouts/diary/list.html` are structurally identical (only section names and taxonomy names differ)

## Related Files

- `content/tweet/_index.md`
- `layouts/tweet/list.html`
- `layouts/diary/list.html` (for comparison)
- `layouts/tweet2/list.html` (for comparison)

## Workaround

Currently using a workaround in `baseof.html` to detect the `/tweet/` section list page and implement redirect logic there, since the standalone template is ignored.

## References

- Hugo Template Lookup Order: https://gohugo.io/templates/lookup-order/
- Section Templates: https://gohugo.io/templates/section-templates/

