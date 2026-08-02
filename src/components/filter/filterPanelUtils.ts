/**
 * 絞り込みパネル共通の小さなユーティリティ。
 */

/** 配列に値がなければ追加、あれば削除する（チェックボックス／チップ用）。 */
export function toggleListValue<T>(list: T[], value: T): T[] {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }
  return [...list, value];
}
