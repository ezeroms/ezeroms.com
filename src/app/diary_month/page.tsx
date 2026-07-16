import { redirect } from "next/navigation";
import { listDiaryMonths } from "@/lib/content/queries";

export const dynamic = "force-dynamic";

export default async function DiaryMonthIndex() {
  const months = await listDiaryMonths().catch(() => [] as string[]);
  if (months.length) redirect(`/diary_month/${months[months.length - 1]}/`);
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Notes</h1>
      <p>まだ Notes がありません。</p>
    </main>
  );
}
