/**
 * 絞り込みパネル共通の小さなユーティリティ。
 * 各 *FilterPanel で同じ実装をコピーしないための置き場。
 */

/** 配列に値がなければ追加、あれば削除する（チェックボックス用）。 */
export function toggleListValue<T>(list: T[], value: T): T[] {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }
  return [...list, value];
}

/**
 * 選択中の値をパネル見出し横の要約文言にする。
 * 例: [] → 「指定なし」、3件以上 → 「A、B 他1」
 */
export function summarizeFilterSelection(values: string[]): string {
  if (!values.length) return "指定なし";
  if (values.length <= 2) return values.join("、");
  const head = values.slice(0, 2).join("、");
  const restCount = values.length - 2;
  return `${head} 他${restCount}`;
}
