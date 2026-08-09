/**
 * パスワードマネージャ（1Password / LastPass / Bitwarden 等）に
 * ログイン以外の管理画面フォームを無視させる属性。
 * @see https://developer.1password.com/docs/web/compatible-website-design/
 */
export const ignorePasswordManagersProps = {
  "data-1p-ignore": true,
  "data-op-ignore": true,
  "data-lpignore": "true",
  "data-bwignore": "true",
  "data-form-type": "other",
  autoComplete: "off",
} as const;
