// @noflow
// 素の JavaScript。`node scripts/pages.mjs` が直接走らせるので、Flow の注釈は書けない
// （uf は Flow エントリポイントをコマンドとして走らせられない: uf の #316）。
// app/**/$page.mdx の front matter から、ページ一覧と検索インデックスを書く。
// 唯一の出典は各ページの front matter で、ここは写しを作るだけ。
// `uf run pages`（dev / build / check が dependsOn で先に走らせる）
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join, relative, dirname } from "node:path";

import GithubSlugger from "github-slugger";

const ROOT = new URL("..", import.meta.url).pathname;
const APP = join(ROOT, "app");

const SECTIONS = ["intro", "why", "start", "app", "targets", "toolchain", "reference"];

const SECTION_LABELS = {
  intro: "はじめに",
  why: "uf を選ぶ理由",
  start: "セットアップ",
  app: "アプリを作る",
  targets: "動かす場所",
  toolchain: "ツールチェーン",
  reference: "リファレンス",
};

function findPages(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    if (name === "_design") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...findPages(full));
    else if (name === "$page.mdx") found.push(full);
  }
  return found;
}

function parseFrontMatter(src) {
  const matched = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (matched == null) return [{}, src];
  const meta = {};
  for (const line of matched[1].split("\n")) {
    const at = line.indexOf(":");
    if (at < 0) continue;
    meta[line.slice(0, at).trim()] = line
      .slice(at + 1)
      .trim()
      .replace(/^"|"$/g, "");
  }
  return [meta, src.slice(matched[0].length)];
}

const pages = findPages(APP).map((file) => {
  const [meta, body] = parseFrontMatter(readFileSync(file, "utf8"));
  const dir = relative(APP, dirname(file));
  const path = dir === "" ? "/" : `/${dir}`;

  // 見出しの id は MDX が github-slugger で振る。同じものをここで作るので、
  // 目次はページを描画してから DOM を読まずに済む。
  const slugger = new GithubSlugger();
  const headings = [...body.matchAll(/^## +(.*)$/gm)].map((match) => {
    const text = match[1].replace(/[`*]/g, "").trim();
    return { id: slugger.slug(text), text };
  });

  const text = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/^import .*$/gm, " ")
    .replace(/[#*`>|\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    path,
    title: meta.title ?? path,
    description: meta.description ?? "",
    section: meta.section ?? "intro",
    order: Number(meta.order ?? "999"),
    source: meta.source ?? "",
    headings,
    text,
  };
});

pages.sort((a, b) => {
  const left = SECTIONS.indexOf(a.section);
  const right = SECTIONS.indexOf(b.section);
  return left - right || a.order - b.order;
});

const list = pages
  .map((page) => {
    const headings = page.headings
      .map(
        (heading) =>
          `      { id: ${JSON.stringify(heading.id)}, text: ${JSON.stringify(heading.text)} },`,
      )
      .join("\n");
    return (
      `  {\n` +
      `    path: ${JSON.stringify(page.path)},\n` +
      `    title: ${JSON.stringify(page.title)},\n` +
      `    description: ${JSON.stringify(page.description)},\n` +
      `    section: ${JSON.stringify(page.section)},\n` +
      `    source: ${JSON.stringify(page.source)},\n` +
      `    headings: [\n${headings}\n    ],\n` +
      `  },`
    );
  })
  .join("\n");

writeFileSync(
  join(APP, "_design/pages.js"),
  `// @flow
// 生成物。書き換えず、\`uf run pages\` を走らせること。出典は各ページの front matter。

export type Heading = {| readonly id: string, readonly text: string |};

export type Page = {|
  readonly path: string,
  readonly title: string,
  readonly description: string,
  readonly section: string,
  readonly source: string,
  readonly headings: $ReadOnlyArray<Heading>,
|};

export const PAGES: $ReadOnlyArray<Page> = [
${list}
];
`,
);

mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(
  join(ROOT, "public/search-index.json"),
  JSON.stringify(
    pages.map((page) => ({
      path: page.path,
      title: page.title,
      section: SECTION_LABELS[page.section] ?? page.section,
      description: page.description,
      headings: page.headings.map((heading) => heading.text),
      text: page.text.slice(0, 4000),
    })),
  ),
);

console.log(`wrote app/_design/pages.js and public/search-index.json (${pages.length} pages)`);
