import { ArticleProse } from "@/components/ArticleProse";
import { cn } from "@/lib/cn";
import { articleBodyClass, proseBodyClass } from "@/lib/site/prose-styles";
import type { MeProfilePayload } from "@/types/content";

type Props = {
  data: MeProfilePayload;
};

/**
 * Structured About / Me page (name as h1, sub_name below).
 * Column 詳細と同じ枠なし紙面。
 */
export function AboutMeProfile({ data }: Props) {
  const { profile, favorites, based_in: basedIn, web_links: links } = data;
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

        <div className="my-6 h-px w-full bg-border" aria-hidden />

        {profile.bio_html?.trim() ? (
          <ArticleProse
            html={profile.bio_html}
            className={cn(
              articleBodyClass,
              "about-me__bio",
              "[&_p]:m-0 [&_p+p]:mt-4",
            )}
          />
        ) : null}

        {favorites.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-3 mt-0 scroll-mt-6 text-xl font-semibold tracking-tight">
              😍 Favorite things
            </h2>
            <p className="m-0 text-[0.9375rem] leading-[1.8] text-foreground min-[1080px]:text-base">
              {favorites.map((f) => f.label).join("、")}
            </p>
          </section>
        ) : null}

        {basedIn.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-3 mt-0 scroll-mt-6 text-xl font-semibold tracking-tight">
              🏠 Based in
            </h2>
            <ul className="m-0 list-disc space-y-2 pl-5 text-[0.9375rem] leading-relaxed min-[1080px]:text-base">
              {basedIn.map((item) => (
                <li key={item.id}>
                  <strong className="font-semibold">{item.location}</strong>
                  {item.body_html?.trim() ? (
                    <>
                      ：
                      <span
                        className={cn(
                          proseBodyClass,
                          "[&_p]:m-0 [&_p]:inline",
                        )}
                        dangerouslySetInnerHTML={{ __html: item.body_html }}
                      />
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {links.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-3 mt-0 scroll-mt-6 text-xl font-semibold tracking-tight">
              🌏 Around the Web
            </h2>
            <ul className="m-0 list-disc space-y-1.5 pl-5 text-[0.9375rem] leading-relaxed min-[1080px]:text-base">
              {links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    {link.label}
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
