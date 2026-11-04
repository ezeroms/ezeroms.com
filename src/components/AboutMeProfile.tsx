import { ArticleProse } from "@/components/ArticleProse";
import { cn } from "@/lib/cn";
import { aboutWebLinkIcon } from "@/lib/content/about-web-icons";
import { contentCard } from "@/lib/site/card-styles";
import {
  articleBodyClass,
  articleDetailClass,
} from "@/lib/site/prose-styles";
import type { MeProfilePayload } from "@/types/content";

type Props = {
  data: MeProfilePayload;
};

/**
 * Structured About / Me page (name as h1, sub_name below).
 * Column 詳細と同じ枠なし紙面。Favorite things / Based in は本文に含める。
 */
export function AboutMeProfile({ data }: Props) {
  const { profile, web_links: links } = data;
  const cover = profile.cover_image?.trim() || "/images/about/profile.webp";

  return (
    <div className="w-full font-sans text-foreground">
      <article className="mx-auto min-w-0 w-full max-w-2xl overflow-visible py-4">
        <div className="mb-6 overflow-hidden rounded-lg bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            className="m-0 block h-auto w-full object-cover"
          />
        </div>

        <h1 className="m-0 text-2xl font-semibold leading-tight tracking-tight text-foreground min-[768px]:text-3xl">
          {profile.name}
        </h1>
        {profile.sub_name?.trim() ? (
          <p className="m-0 mt-2 text-base text-muted-foreground min-[768px]:text-lg">
            {profile.sub_name}
          </p>
        ) : null}

        {profile.bio_html?.trim() ? (
          <ArticleProse
            html={profile.bio_html}
            className={cn(
              "mt-8",
              articleBodyClass,
              articleDetailClass,
              "about-me__bio",
              "[&_hr+h2]:mt-0 [&_hr+h3]:mt-0 [&_h2:has(+hr)]:mb-0 [&_h3:has(+hr)]:mb-0",
            )}
          />
        ) : null}

        {links.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-3 mt-0 scroll-mt-6 text-xl font-semibold tracking-tight">
              🌏 Around the Web
            </h2>
            <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 min-[520px]:grid-cols-3">
              {links.map((link) => (
                <li key={link.id} className="m-0 min-w-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={contentCard({
                      link: true,
                      className:
                        "group flex items-center gap-2.5 px-3 py-2.5 text-inherit no-underline",
                    })}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={aboutWebLinkIcon(link.label, link.url)}
                      alt=""
                      width={28}
                      height={28}
                      className="m-0 size-7 shrink-0 grayscale opacity-60 transition-[filter,opacity] duration-200 group-hover:grayscale-0 group-hover:opacity-100 group-focus-visible:grayscale-0 group-focus-visible:opacity-100"
                    />
                    <span className="min-w-0 truncate text-sm font-medium leading-tight">
                      {link.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </div>
  );
}
