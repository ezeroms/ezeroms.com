import { cn } from "@/lib/cn";
import { proseBodyClass } from "@/lib/site/prose-styles";
import type { MeProfilePayload } from "@/types/content";

type Props = {
  data: MeProfilePayload;
};

/**
 * Structured About / Me page (name as h1, sub_name below).
 */
export function AboutMeProfile({ data }: Props) {
  const { profile, favorites, based_in: basedIn, web_links: links } = data;
  const cover = profile.cover_image?.trim() || "/images/about/profile.webp";

  return (
    <div className="w-full font-sans text-foreground">
      <article className="mx-auto min-w-0 w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            className="m-0 block h-auto w-full object-cover"
          />
        </div>

        <div className="px-6 py-6 sm:p-8">
          <div className="mb-6">
            <h1 className="m-0 text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
              {profile.name}
            </h1>
            {profile.sub_name?.trim() ? (
              <p className="mb-0 mt-2 text-base text-muted-foreground sm:text-lg">
                {profile.sub_name}
              </p>
            ) : null}
          </div>

          <div className="my-6 h-px w-full bg-border" aria-hidden />

          {profile.bio_html?.trim() ? (
            <div
              className={cn(
                "about-me__bio min-w-0 text-base leading-[1.8] text-foreground",
                proseBodyClass,
                "[&_p]:m-0 [&_p+p]:mt-4",
                "[&_a]:underline [&_a]:underline-offset-2",
              )}
              dangerouslySetInnerHTML={{ __html: profile.bio_html }}
            />
          ) : null}

          {favorites.length > 0 ? (
            <section className="mt-10">
              <h2 className="mb-3 mt-0 scroll-mt-6 border-b border-border pb-2 text-xl font-semibold tracking-tight">
                😍 Favorite things
              </h2>
              <p className="m-0 text-base leading-[1.8] text-foreground">
                {favorites.map((f) => f.label).join("、")}
              </p>
            </section>
          ) : null}

          {basedIn.length > 0 ? (
            <section className="mt-10">
              <h2 className="mb-3 mt-0 scroll-mt-6 border-b border-border pb-2 text-xl font-semibold tracking-tight">
                🏠 Based in
              </h2>
              <ul className="m-0 list-disc space-y-2 pl-5 text-base leading-relaxed">
                {basedIn.map((item) => (
                  <li key={item.id}>
                    <strong className="font-semibold">{item.location}</strong>
                    {item.body_html?.trim() ? (
                      <>
                        ：
                        <span
                          className={cn(
                            "[&_a]:underline [&_a]:underline-offset-2",
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
              <h2 className="mb-3 mt-0 scroll-mt-6 border-b border-border pb-2 text-xl font-semibold tracking-tight">
                🌏 Around the Web
              </h2>
              <ul className="m-0 list-disc space-y-1.5 pl-5 text-base leading-relaxed">
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
        </div>
      </article>
    </div>
  );
}
