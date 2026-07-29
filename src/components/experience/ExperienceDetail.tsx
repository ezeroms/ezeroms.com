"use client";

import type { Experience, ExperienceProject } from "@/types/content";
import {
  formatExperienceDuration,
  formatExperiencePeriod,
} from "@/lib/content/experience-meta";
import { cn } from "@/lib/cn";
import { proseBodyClass } from "@/lib/site/prose-styles";

type Props = {
  item: Experience;
  className?: string;
};

function projectPeriod(project: ExperienceProject): string {
  if (!project.start_date) return "";
  return formatExperiencePeriod(
    project.start_date,
    project.end_date === undefined ? null : project.end_date,
  );
}

/** 職歴の詳細カード（会社概要 + プロジェクト一覧）。 */
export function ExperienceDetail({ item, className }: Props) {
  const period = formatExperiencePeriod(item.start_date, item.end_date);
  const duration = formatExperienceDuration(item.start_date, item.end_date);

  return (
    <aside
      className={cn("rounded-lg bg-white p-6", className)}
      style={{
        boxShadow:
          "0 1px 2px rgba(60,64,67,0.18), 0 1px 3px 1px rgba(60,64,67,0.08)",
      }}
      aria-live="polite"
    >
      <p className="m-0 text-xs text-[#70757a]">
        {period}
        {duration ? ` · ${duration}` : ""}
      </p>
      <h2 className="m-0 mt-1 text-base font-medium leading-snug tracking-tight text-[#3c4043]">
        {item.organization}
      </h2>
      {item.note ? (
        <p className="m-0 mt-1 text-sm text-[#70757a]">{item.note}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#70757a]">
        {item.employment_type ? (
          <span className="rounded bg-[#f1f3f4] px-2 py-0.5 text-[#3c4043]">
            {item.employment_type}
          </span>
        ) : null}
        {item.employee_count ? <span>{item.employee_count}</span> : null}
        {item.capital ? <span>{item.capital}</span> : null}
      </div>

      {item.business ? (
        <p className="m-0 mt-3 text-sm leading-relaxed text-[#70757a]">
          {item.business}
        </p>
      ) : null}

      {item.title || item.role ? (
        <p className="m-0 mt-4 text-sm font-medium text-[#3c4043]">
          {[item.title, item.role].filter(Boolean).join(" · ")}
        </p>
      ) : null}

      {item.summary ? (
        <p className="m-0 mt-2 text-sm leading-relaxed text-[#70757a]">
          {item.summary}
        </p>
      ) : null}

      {item.body_html?.trim() ? (
        <div
          className={cn(
            "mt-4 max-w-none text-base leading-[1.8] text-[#3c4043]",
            proseBodyClass,
          )}
          dangerouslySetInnerHTML={{ __html: item.body_html }}
        />
      ) : null}

      {item.projects?.length ? (
        <div className="mt-6 space-y-4">
          {item.projects.map((project) => {
            const projPeriod = projectPeriod(project);
            return (
              <div
                key={`${project.title}-${project.start_date ?? ""}`}
                className="rounded-md bg-[#f8f9fa] p-4"
              >
                {projPeriod ? (
                  <p className="m-0 text-xs tabular-nums text-[#70757a]">
                    {projPeriod}
                  </p>
                ) : null}
                <p className="m-0 mt-0.5 text-sm font-medium text-[#3c4043]">
                  {project.title}
                </p>
                {project.description ? (
                  <p className="m-0 mt-1 text-sm leading-relaxed text-[#70757a]">
                    {project.description}
                  </p>
                ) : null}
                {project.tasks?.length ? (
                  <ul className="m-0 mt-2 list-none space-y-0.5 p-0">
                    {project.tasks.map((task) => (
                      <li
                        key={task}
                        className="text-sm leading-snug text-[#3c4043] before:mr-1 before:content-['・']"
                      >
                        {task}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {(project.role || project.team_scale) && (
                  <p className="m-0 mt-2 text-xs text-[#70757a]">
                    {[project.role, project.team_scale]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </aside>
  );
}
