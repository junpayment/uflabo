# uflabo

uf（Uniflowed）の日本語解説サイト。[docs.uniflowed.dev](https://docs.uniflowed.dev/)（2026 年 9 月時点）を元にした非公式のドキュメントです。

**このサイト自身が uf で動いています。** 48 ページは `app/` 配下の MDX で、`uf build` がすべてプリレンダリングします。

公開先: <https://junpayment.github.io/uflabo/>

`main` に push すると GitHub Actions が uf を入れ、`uf run ci`（整形チェック・型チェック・ビルド・リンク検査）を通してから `dist/` を GitHub Pages に出します。

## 配信先とパス

GitHub Pages のプロジェクトサイトは `https://<user>.github.io/<repo>/` に出るので、`uf.config.js` で `app.router.basePath: "/uflabo"` を設定しています。ローカルも同じく `/uflabo/` 配下で配信されます（`http://localhost:3000/uflabo/`）。

uf が base を付けてくれるのは **uf 自身が書くアドレス**だけです。`<Link to>`、履歴、アセットの URL、sitemap。**本文の Markdown リンクは素の `<a>` になるので付きません**。だから本文のリンクは `/uflabo/why/compare` のように base 込みで書きます。付け忘れは `uf run links` が「base の外」として落とします。

自分で組む絶対 URL は `basePath()` を通します（レイアウトのスタイルシートと favicon、検索インデックスの取得がそれです）。

## 使い方

```sh
uf install        # 依存を入れる
uf run dev        # 開発サーバー（http://127.0.0.1:5173）
uf run build      # 本番ビルド → dist/
uf start          # ビルド済みを配信（http://localhost:3000）
uf run ci         # fmt --check、check、build、リンク検査
```

`uf run dev` / `build` / `check` は `pages` タスクに依存しているので、ページ一覧と検索インデックスは自動で作り直されます。

## 構成

```
uf.config.js            唯一の設定ファイル
app.js                  アプリのエントリ（routerView）
app/
  $layout.js            ドキュメント、マストヘッド、サイドバー、目次、フッター
  $page.mdx             トップページ
  <section>/<slug>/
    $page.mdx           1 ページ 1 ファイル
  _design/              共有コンポーネント（_ 始まりはルートにならない）
    Sidebar.js          "use client" — useRoute() で現在位置を印す
    Toc.js              "use client" — ページ内目次と読んでいる位置
    Search.js           "use client" — 全ページ検索
    PageFrame.js        "use client" — 見出しと前後ページ送り
    Callout.js          囲み（メモ / ヒント / 注意 / 未実装・制限）
    Figure.js           タイトル付きコードブロック
    sections.js         セクションの順序と表示名
    pages.js            生成物。触らない
public/
  seam.css              スタイルシート
  search-index.json     生成物。触らない
scripts/
  pages.mjs             front matter → pages.js と search-index.json
  check-links.mjs       dist/ のリンクとアンカーの検査
```

### ページの front matter

```yaml
---
title: "ルーティング"
description: "一覧とページ見出しに出る 1 行説明"
section: "app"          # intro / why / start / app / targets / toolchain / reference
order: 2                # セクション内の並び順
source: "/guide/routing"  # 元にした公式ページ。末尾のリンクになる
---
```

front matter が唯一の出典です。`title` と `description` は uf が `<title>` と `<meta>`、OG タグにし、`scripts/pages.mjs` が同じものからサイドバー・見出し・前後ページ送り・検索インデックスを作ります。**本文に h1 は書きません。**

### 本文で使えるもの

MDX なので Markdown がそのまま書け、コンポーネントを import できます。

- **見出しの id** は uf が github-slugger で振ります（日本語もそのまま id になる）。目次は同じアルゴリズムを `scripts/pages.mjs` で再現しているので、ページを描画してから DOM を読む必要がありません。
- **コードのハイライト**はビルド時。ライトとダークの両方が CSS 変数で入り、`component` や `hook` は Flow のキーワードとして色が付きます。
- **囲み**は `<Callout kind="warn" title="…">`。`kind` は `note` / `tip` / `warn` / `gap` / `done`。
- **タイトル付きコード**は `<Figure title="uf.config.js">` でフェンスを包みます。MDX はフェンスの meta を描画しないためです。

```mdx
import { Callout } from "../../_design/Callout.js";

<Callout kind="warn" title="証明されていないこと">
本文。
</Callout>
```

## uf を使ってみて踏んだこと

このサイトを移植する過程で見つけたものです。uf 0.0.0-alpha.40 時点。

- **CSS を `import` すると hydration がずれます。** `uf new` した素のプロジェクトに `import "./app/probe.css"` を 1 行足すだけで React error #418 が出ます。サーバーが書いた head と、クライアントが最初に描く head の並びが食い違うためです。このサイトはスタイルシートを `public/seam.css` に置き、レイアウトから `<link>` で読むことで回避しています。
- **レイアウトに自前の `<head>` を書くと、本番でだけずれます。** uf は自分のメタタグを head の途中に差し込むので、`<head>` の子は分断されます。`<meta>` と `<link>` は `<body>` 側に書けば React が head へ持ち上げます。
- `uf dev` の hydration 診断が優秀です。食い違ったノードと、サーバー側・ブラウザ側それぞれが描いたものを名指ししてくれるので、上の 2 つはどちらもそれで特定できました。
- `scripts/*.mjs` は `node` が直接走らせるので Flow ではありません。先頭に `// @noflow` と書くのが uf の作法です（uf は Flow のエントリポイントをコマンドとして走らせられません。uf の #316）。

## ライセンスと出典

非公式・非商用の解説です。uf 本体は [ubugeeei-prod/uf](https://github.com/ubugeeei-prod/uf) で開発されています。各ページ末尾に元にした公式ページへのリンクがあります。
