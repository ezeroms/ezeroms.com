"use client";

type Props = {
  title?: string;
};

/** Minimal mobile top bar with hamburger (opens sidebar via SiteScripts) */
export function MobileHeader({ title }: Props) {
  return (
    <header className="mobile-header">
      <button
        type="button"
        id="sidebar-hamburger-btn"
        className="mobile-header__hamburger"
        aria-label="メニューを開く"
        aria-expanded="false"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {title ? <span className="mobile-header__title">{title}</span> : null}
    </header>
  );
}
