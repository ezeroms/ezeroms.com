"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OgImageField } from "@/components/admin/OgImageField";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const EXPERIENCE_EDITOR_FORM_ID = "experience-editor-form";

const IGNORE_PASSWORD_MANAGERS = {
  "data-1p-ignore": true,
  "data-lpignore": "true",
  autoComplete: "off",
} as const;

const EMPTY_PROJECTS_JSON = "[]";

export type ExperienceEditorInitial = {
  slug: string;
  organization: string;
  title: string;
  employment_type: string;
  role: string;
  start_date: string;
  end_date: string;
  business: string;
  employee_count: string;
  capital: string;
  note: string;
  summary: string;
  body_md: string;
  projects_json: string;
  sort_order: string;
  og_image: string;
  status: "published" | "draft";
};

function dateOnlyValue(raw?: string | null) {
  if (!raw?.trim()) return "";
  return raw.trim().slice(0, 10);
}

export function ExperienceEditorForm({
  initial,
  formId = EXPERIENCE_EDITOR_FORM_ID,
  hideSubmit = false,
  onSaved,
  onLoadingChange,
  onDirtyChange,
}: {
  initial?: ExperienceEditorInitial;
  formId?: string;
  hideSubmit?: boolean;
  onSaved?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.slug);

  const [baseline] = useState(() => ({
    organization: initial?.organization ?? "",
    title: initial?.title ?? "",
    employmentType: initial?.employment_type ?? "",
    role: initial?.role ?? "",
    startDate: dateOnlyValue(initial?.start_date),
    endDate: dateOnlyValue(initial?.end_date),
    business: initial?.business ?? "",
    employeeCount: initial?.employee_count ?? "",
    capital: initial?.capital ?? "",
    note: initial?.note ?? "",
    summary: initial?.summary ?? "",
    bodyMd: initial?.body_md ?? "",
    projectsJson: initial?.projects_json?.trim() || EMPTY_PROJECTS_JSON,
    sortOrder: initial?.sort_order ?? "0",
    ogImage: initial?.og_image ?? "",
    status: (initial?.status ?? "published") as "published" | "draft",
  }));

  const [organization, setOrganization] = useState(baseline.organization);
  const [title, setTitle] = useState(baseline.title);
  const [employmentType, setEmploymentType] = useState(baseline.employmentType);
  const [role, setRole] = useState(baseline.role);
  const [startDate, setStartDate] = useState(baseline.startDate);
  const [endDate, setEndDate] = useState(baseline.endDate);
  const [business, setBusiness] = useState(baseline.business);
  const [employeeCount, setEmployeeCount] = useState(baseline.employeeCount);
  const [capital, setCapital] = useState(baseline.capital);
  const [note, setNote] = useState(baseline.note);
  const [summary, setSummary] = useState(baseline.summary);
  const [bodyMd, setBodyMd] = useState(baseline.bodyMd);
  const [projectsJson, setProjectsJson] = useState(baseline.projectsJson);
  const [sortOrder, setSortOrder] = useState(baseline.sortOrder);
  const [ogImage, setOgImage] = useState(baseline.ogImage);
  const [status, setStatus] = useState<"published" | "draft">(baseline.status);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dirty =
    organization !== baseline.organization ||
    title !== baseline.title ||
    employmentType !== baseline.employmentType ||
    role !== baseline.role ||
    startDate !== baseline.startDate ||
    endDate !== baseline.endDate ||
    business !== baseline.business ||
    employeeCount !== baseline.employeeCount ||
    capital !== baseline.capital ||
    note !== baseline.note ||
    summary !== baseline.summary ||
    bodyMd !== baseline.bodyMd ||
    projectsJson !== baseline.projectsJson ||
    sortOrder !== baseline.sortOrder ||
    ogImage !== baseline.ogImage ||
    status !== baseline.status;

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dirty || loading) return;
    setError(null);
    setLoading(true);
    try {
      const payload = {
        organization,
        title,
        employment_type: employmentType,
        role,
        start_date: startDate,
        end_date: endDate || null,
        business,
        employee_count: employeeCount,
        capital,
        note,
        summary,
        body_md: bodyMd,
        projects_json: projectsJson,
        sort_order: sortOrder,
        og_image: ogImage,
        status,
      };
      const res = await fetch(
        isEdit
          ? `/api/admin/experience/${initial!.slug}/`
          : "/api/admin/experience/",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as {
        error?: string;
        item?: { slug: string };
      };
      if (!res.ok) {
        setError(data.error || "保存に失敗しました");
        return;
      }
      router.refresh();
      onSaved?.();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id={formId}
      className="flex flex-col gap-4"
      onSubmit={onSubmit}
      autoComplete="off"
      data-1p-ignore
      data-lpignore="true"
      data-form-type="other"
    >
      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="exp-organization">組織名</Label>
        <Input
          id="exp-organization"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="株式会社…"
          required
          {...IGNORE_PASSWORD_MANAGERS}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="exp-title">肩書き / タイトル</Label>
          <Input
            id="exp-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="デザイナー"
            {...IGNORE_PASSWORD_MANAGERS}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exp-employment">雇用形態</Label>
          <Input
            id="exp-employment"
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            placeholder="正社員 / 業務委託"
            {...IGNORE_PASSWORD_MANAGERS}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exp-role">役割</Label>
        <Input
          id="exp-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          {...IGNORE_PASSWORD_MANAGERS}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="exp-start">開始日</Label>
          <Input
            id="exp-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            {...IGNORE_PASSWORD_MANAGERS}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exp-end">終了日（空欄＝現職）</Label>
          <Input
            id="exp-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            {...IGNORE_PASSWORD_MANAGERS}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exp-summary">概要</Label>
        <Textarea
          id="exp-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          placeholder="担当内容の要約…"
          {...IGNORE_PASSWORD_MANAGERS}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exp-business">事業内容</Label>
        <Textarea
          id="exp-business"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          rows={2}
          {...IGNORE_PASSWORD_MANAGERS}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="exp-employees">従業員数</Label>
          <Input
            id="exp-employees"
            value={employeeCount}
            onChange={(e) => setEmployeeCount(e.target.value)}
            placeholder="175名"
            {...IGNORE_PASSWORD_MANAGERS}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exp-capital">資本金</Label>
          <Input
            id="exp-capital"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
            {...IGNORE_PASSWORD_MANAGERS}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exp-note">補足</Label>
        <Input
          id="exp-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="売却・社名変更など"
          {...IGNORE_PASSWORD_MANAGERS}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exp-body">本文（Markdown・任意）</Label>
        <Textarea
          id="exp-body"
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
          rows={4}
          {...IGNORE_PASSWORD_MANAGERS}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exp-projects">プロジェクト（JSON）</Label>
        <Textarea
          id="exp-projects"
          value={projectsJson}
          onChange={(e) => setProjectsJson(e.target.value)}
          rows={8}
          className="font-mono text-xs"
          spellCheck={false}
          {...IGNORE_PASSWORD_MANAGERS}
        />
        <p className="m-0 text-xs text-muted-foreground">
          title / description / start_date / end_date / role / team_scale /
          tasks[]
        </p>
      </div>

      <OgImageField
        value={ogImage}
        onChange={setOgImage}
        uploadKind="experience"
        disabled={loading}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="exp-sort">並び順</Label>
          <Input
            id="exp-sort"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            {...IGNORE_PASSWORD_MANAGERS}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exp-status">ステータス</Label>
          <Select
            id="exp-status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value === "draft" ? "draft" : "published")
            }
            {...IGNORE_PASSWORD_MANAGERS}
          >
            <option value="published">公開</option>
            <option value="draft">非公開</option>
          </Select>
        </div>
      </div>

      {!hideSubmit ? (
        <button type="submit" className="sr-only">
          保存
        </button>
      ) : null}
    </form>
  );
}
