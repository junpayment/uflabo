"use client";
// @flow
import * as React from "@uniflowed/react";
import { Link, useRoute } from "@uniflowed/router";

import { PAGES } from "./pages.js";
import { sectionLabel } from "./sections.js";

/// ページの見出しと、前後ページ送り。どちらも front matter が唯一の出典なので、
/// 本文の MDX は h1 も説明文も繰り返さない。
export component PageHeader() {
  const route = useRoute();
  const page = PAGES.find((one) => one.path === route.pathname);
  if (page == null || page.path === "/") return null;

  return (
    <>
      <p className="eyebrow">{sectionLabel(page.section)}</p>
      <h1>{page.title}</h1>
      {page.description !== "" && <p className="lede">{page.description}</p>}
    </>
  );
}

export component PageFooter() {
  const route = useRoute();
  const ordered = PAGES.filter((one) => one.path !== "/");
  const at = ordered.findIndex((one) => one.path === route.pathname);
  if (at < 0) return null;

  const page = ordered[at];
  const previous = at > 0 ? ordered[at - 1] : null;
  const next = at < ordered.length - 1 ? ordered[at + 1] : null;

  return (
    <>
      {page.source !== "" && (
        <p className="source">
          元ネタ:{" "}
          <a href={`https://docs.uniflowed.dev${page.source}`} target="_blank" rel="noreferrer">
            docs.uniflowed.dev{page.source}
          </a>
          （英語）
        </p>
      )}
      <nav className="pager" aria-label="前後のページ">
        {previous == null ? (
          <span />
        ) : (
          <Link to={previous.path} className="pager-prev">
            <span>← 前</span>
            <strong>{previous.title}</strong>
          </Link>
        )}
        {next == null ? (
          <span />
        ) : (
          <Link to={next.path} className="pager-next">
            <span>次 →</span>
            <strong>{next.title}</strong>
          </Link>
        )}
      </nav>
    </>
  );
}
