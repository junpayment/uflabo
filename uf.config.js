// @flow
import { defineConfig } from "@uniflowed/config";

export default defineConfig({
  site: { url: "https://junpayment.github.io/uflabo" },
  app: {
    router: {
      // GitHub Pages のプロジェクトサイトは https://<user>.github.io/<repo>/ に出る。
      // uf.config.js は実行されず読まれるだけなので、ここは必ずリテラル。
      // ローカルでも同じ /uflabo/ 配下で配信される。
      basePath: "/uflabo",
    },
  },
  tasks: {
    // ページの一覧と検索インデックスは MDX の front matter から生成する。
    // uf 自身が router.js を生成するのと同じで、唯一の出典は各ページのままにする。
    pages: {
      command: "node scripts/pages.mjs",
      inputs: ["app/**", "scripts/pages.mjs"],
      outputs: ["app/_design/pages.js", "public/search-index.json"],
    },
    dev: { command: "uf dev", dependsOn: ["pages"] },
    build: { command: "uf build", dependsOn: ["pages"] },
    check: { command: "uf check", dependsOn: ["pages"] },
    lint: { command: "uf lint" },
    fmt: { command: "uf fmt" },
    test: { command: "uf test" },
    links: { command: "node scripts/check-links.mjs", dependsOn: ["build"] },
    ci: { command: "echo ok", dependsOn: ["fmt:check", "check", "links"] },
    "fmt:check": { command: "uf fmt --check" },
  },
});
