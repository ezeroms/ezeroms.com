"use client";

import { useEffect } from "react";

export function SiteScripts() {
  useEffect(() => {
    // External links in articles
    const articleLinks = document.querySelectorAll(".article-item a[href]");
    articleLinks.forEach((node) => {
      const link = node as HTMLAnchorElement;
      const href = link.getAttribute("href");
      if (!href || link.hasAttribute("target")) return;
      if (
        href.startsWith("#") ||
        href.startsWith("/") ||
        href.startsWith("./") ||
        href.startsWith("../")
      ) {
        return;
      }
      if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) {
        try {
          if (new URL(href, window.location.href).hostname === window.location.hostname) {
            return;
          }
        } catch {
          return;
        }
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });

    // Sidebar minimize
    const sidebar = document.querySelector(".layout-sidebar");
    const minimizeBtn = document.getElementById("sidebar-minimize-btn");
    function updateButtonState() {
      if (!sidebar || !minimizeBtn) return;
      const isMinimized = sidebar.classList.contains("is-minimized");
      minimizeBtn.setAttribute(
        "aria-label",
        isMinimized ? "サイドバーを最大化" : "サイドバーを最小化",
      );
      minimizeBtn.setAttribute(
        "data-tooltip",
        isMinimized ? "メニューを表示する" : "メニューを非表示にする",
      );
      const svg = minimizeBtn.querySelector("svg");
      if (svg) {
        (svg as SVGElement).style.transform = isMinimized
          ? "rotate(180deg)"
          : "rotate(0deg)";
      }
    }
    const onMinimize = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      sidebar?.classList.toggle("is-minimized");
      updateButtonState();
    };
    minimizeBtn?.addEventListener("click", onMinimize);
    updateButtonState();

    // Hamburger / overlay
    const hamburgerBtn = document.getElementById("sidebar-hamburger-btn");
    const overlay = document.getElementById("sidebar-overlay");
    function openSidebar() {
      sidebar?.classList.add("is-open");
      overlay?.classList.add("is-active");
      hamburgerBtn?.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function closeSidebar() {
      sidebar?.classList.remove("is-open");
      overlay?.classList.remove("is-active");
      hamburgerBtn?.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
    const onHamburger = (e: Event) => {
      e.preventDefault();
      if (sidebar?.classList.contains("is-open")) closeSidebar();
      else openSidebar();
    };
    const onOverlay = (e: Event) => {
      e.preventDefault();
      closeSidebar();
    };
    hamburgerBtn?.addEventListener("click", onHamburger);
    overlay?.addEventListener("click", onOverlay);

    sidebar?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 1079) closeSidebar();
      });
    });

    // Card click (work / column list): li[data-href]
    const onCardClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const card = target.closest("li[data-href]") as HTMLElement | null;
      if (!card) return;
      if (target.closest("a")) return;
      const href = card.dataset.href;
      if (href) window.location.href = href;
    };
    document.addEventListener("click", onCardClick);

    return () => {
      minimizeBtn?.removeEventListener("click", onMinimize);
      hamburgerBtn?.removeEventListener("click", onHamburger);
      overlay?.removeEventListener("click", onOverlay);
      document.removeEventListener("click", onCardClick);
    };
  }, []);

  return null;
}
