"use client";
// @flow
import * as React from "@uniflowed/react";
import { useEffect, useRef, useState } from "@uniflowed/react";
import { Link, useRoute } from "@uniflowed/router";

import { PAGES } from "./pages.js";
import { SECTIONS } from "./sections.js";

/// 全ページのナビゲーション。開いているページは useRoute() で決まるので、
/// プリレンダリングされた HTML にも正しい印が入る。
export component Sidebar() {
  const route = useRoute();
  const [open, setOpen] = useState<boolean>(false);
  const box = useRef<HTMLElement | null>(null);

  // 現在のページをサイドバーの中で見える位置に。scrollIntoView は
  // 祖先（ページ本体）まで動かすので、このコンテナだけを動かす。
  useEffect(() => {
    const element = box.current;
    if (element == null) return;
    const current = element.querySelector('a[aria-current="page"]');
    if (current instanceof HTMLElement) {
      element.scrollTop = Math.max(0, current.offsetTop - element.clientHeight / 2);
    }
  }, []);

  return (
    <>
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="sidebar"
        aria-label="メニュー"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>
      <aside id="sidebar" className={open ? "sidebar open" : "sidebar"} ref={box}>
        <nav aria-label="全体のナビゲーション">
          {SECTIONS.map((section) => {
            const items = PAGES.filter((page) => page.section === section.key && page.path !== "/");
            if (items.length === 0) return null;
            return (
              <section className="nav-group" key={section.key}>
                <h3>{section.label}</h3>
                <ul>
                  {items.map((page) => (
                    <li key={page.path}>
                      <Link
                        to={page.path}
                        aria-current={route.pathname === page.path ? "page" : undefined}
                        onClick={() => setOpen(false)}
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
