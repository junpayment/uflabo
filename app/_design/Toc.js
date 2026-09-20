"use client";
// @flow
import * as React from "@uniflowed/react";
import { useEffect, useState } from "@uniflowed/react";
import { useRoute } from "@uniflowed/router";

import { PAGES } from "./pages.js";

/// ページ内の目次。見出しと id は `uf run pages` が MDX から書き出すので、
/// ここは描画するだけで DOM を読まない。プリレンダリングされた HTML にも目次が入る。
export component Toc() {
  const route = useRoute();
  const page = PAGES.find((one) => one.path === route.pathname);
  const headings = page?.headings ?? [];
  const [active, setActive] = useState<string>("");

  // 読んでいる位置の追跡だけがブラウザの仕事。値は監視の通知で更新する。
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-10% 0px -70% 0px" },
    );

    for (const heading of headings) {
      const node = document.getElementById(heading.id);
      if (node != null) observer.observe(node);
    }
    return () => observer.disconnect();
  }, [route.pathname, headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="toc" aria-label="このページの目次">
      <h4>このページ</h4>
      <ul>
        {headings.map((heading) => (
          <li key={heading.id}>
            <a href={`#${heading.id}`} className={heading.id === active ? "active" : undefined}>
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
