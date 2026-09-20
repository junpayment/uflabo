// @noflow
// 素の JavaScript（`node scripts/check-links.mjs` が直接走らせる）。
// dist/ の全ページから内部リンクとアンカーを集め、行き先が存在するか確かめる。
// 相対リンク（href="foo.html"）も拾う。uf build の後に走らせること。
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");

// アプリが配信されるパス。uf.config.js は実行されず読まれるだけなので、
// basePath は必ずリテラルで、こちらもそう読む。
const config = readFileSync(join(ROOT, "uf.config.js"), "utf8");
const BASE = (config.match(/basePath:\s*"([^"]*)"/) ?? [, ""])[1].replace(/\/$/, "");

if (!existsSync(DIST)) {
  console.error("dist/ がありません。先に `uf build` を走らせてください。");
  process.exit(2);
}

function pages(dir, found = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) pages(full, found);
    else if (name === "index.html") found.push(full);
  }
  return found;
}

const files = pages(DIST);

// URL → そのページが持つ id の集合
const idsByPath = new Map();
const pathOf = (file) => {
  const rest = file
    .slice(DIST.length)
    .replace(/index\.html$/, "")
    .replace(/\/$/, "");
  return rest === "" ? "/" : rest;
};
for (const file of files) {
  const html = readFileSync(file, "utf8");
  idsByPath.set(pathOf(file), new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])));
}

let problems = 0;

for (const file of files) {
  const html = readFileSync(file, "utf8");
  const from = pathOf(file);

  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    const [rawTarget, anchor] = href.split("#");

    // base の下にあるものだけがこのサイトのアドレス
    if (
      BASE !== "" &&
      rawTarget.startsWith("/") &&
      !rawTarget.startsWith(BASE + "/") &&
      rawTarget !== BASE
    ) {
      console.log(`base の外   ${from} -> ${href}`);
      problems++;
      continue;
    }
    const target = BASE === "" ? rawTarget : rawTarget.slice(BASE.length) || "/";

    if (target.startsWith("/assets/") || target === "/favicon.svg" || target === "/seam.css")
      continue;
    if (target === "/search-index.json" || target.endsWith("/__uf.flight")) continue;

    // 相対リンクは移行の取り残し。絶対パスで書く
    if (!rawTarget.startsWith("/")) {
      console.log(`相対リンク   ${from} -> ${href}`);
      problems++;
      continue;
    }

    const clean = target.replace(/\/$/, "") || "/";
    if (!idsByPath.has(clean)) {
      console.log(`リンク切れ   ${from} -> ${href}`);
      problems++;
      continue;
    }
    if (anchor != null && anchor !== "" && !idsByPath.get(clean).has(decodeURIComponent(anchor))) {
      console.log(`アンカー切れ ${from} -> ${href}`);
      problems++;
    }
  }
}

console.log(`${files.length} ページを検査、問題 ${problems} 件`);
process.exit(problems === 0 ? 0 : 1);
