// @flow
import * as React from "@uniflowed/react";
import type { Metadata } from "@uniflowed/router";
import { Link, basePath } from "@uniflowed/router";

import { PageFooter, PageHeader } from "./_design/PageFrame.js";
import { Search } from "./_design/Search.js";
import { Sidebar } from "./_design/Sidebar.js";
import { Toc } from "./_design/Toc.js";

export const metadata: Metadata = {
  metadataBase: "https://junpayment.github.io",
  title: "uflabo — uf（Uniflowed）日本語解説",
  description: "Flow で書く React のための統合ツールチェーン uf を、日本語で解説するサイト。",
  openGraph: { siteName: "uflabo", type: "website" },
};

export component Layout(children: React.Node) {
  return (
    <html lang="ja">
      <body>
        {/* head 要素は書かない。uf は自分のメタタグを head に差し込むので、
            自前の <head> の子は本番でその間に割り込まれる。React がこれらを head へ持ち上げる。
            スタイルは public/ から読む。`import "…css"` は uf 0.0.0-alpha.40 では
            hydration をずらす（素の `uf new` に 1 行足すだけで再現する）。 */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={`${basePath()}/favicon.svg`} type="image/svg+xml" />
        <link rel="stylesheet" href={`${basePath()}/seam.css`} />
        <a className="skip" href="#main">
          本文へ
        </a>
        <header className="masthead">
          <Link to="/" className="brand">
            <span className="brand-mark">uf</span>
            <span className="brand-name">uflabo</span>
          </Link>
          <span className="brand-tag">Uniflowed 日本語解説</span>
          <Search />
          <a
            className="gh"
            href="https://github.com/ubugeeei-prod/uf"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </header>
        <div className="shell">
          <Sidebar />
          <main id="main" className="main">
            <article className="doc">
              <PageHeader />
              {children}
              <PageFooter />
            </article>
            <Toc />
          </main>
        </div>
        <footer className="footer">
          <p>
            uflabo は{" "}
            <a href="https://docs.uniflowed.dev/" target="_blank" rel="noreferrer">
              uf 公式ドキュメント
            </a>
            （2026年9月時点）を元にした非公式の日本語解説です。uf は 0.0.0-alpha
            のプレリリースで、仕様は予告なく変わります。
          </p>
        </footer>
      </body>
    </html>
  );
}
