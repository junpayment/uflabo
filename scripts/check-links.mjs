// @noflow
// 素の JavaScript（`node scripts/check-links.mjs` が直接走らせる）。
// dist/ の全ページから内部リンクとアンカーを集め、行き先が存在するか確かめる。
// 相対リンク（href="foo.html"）も拾う。uf build の後に走らせること。
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");

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
    if (href.startsWith("/assets/") || href === "/favicon.svg" || href === "/seam.css") continue;

    const [target, anchor] = href.split("#");

    // 相対リンクは移行の取り残し。絶対パスで書く
    if (!target.startsWith("/")) {
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
