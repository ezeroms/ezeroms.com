import { cn } from "@/lib/cn";

const widthClass = {
  /** 編集フォーム向け（従来どおり） */
  default: "max-w-3xl",
  /** テーブル一覧向け（メイン領域をほぼ画面幅いっぱい） */
  wide: "max-w-none",
} as const;

export type AdminContentWidth = keyof typeof widthClass;

/**
 * 管理画面メインのシングルカラム幅。
 * - default: 読みやすい編集幅（max-w-3xl）
 * - wide: 一覧・テーブル向けの全幅
 */
export function AdminContent({
  width = "default",
  className,
  children,
}: {
  width?: AdminContentWidth;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full", widthClass[width], className)}>
      {children}
    </div>
  );
}
