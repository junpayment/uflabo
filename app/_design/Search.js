"use client";
// @flow
import * as React from "@uniflowed/react";
import { useEffect, useRef, useState } from "@uniflowed/react";
import { basePath, useRouter } from "@uniflowed/router";

type Entry = {|
  readonly path: string,
  readonly title: string,
  readonly section: string,
  readonly description: string,
  readonly headings: $ReadOnlyArray<string>,
  readonly text: string,
|};

type Hit = {| readonly entry: Entry, readonly snippet: string |};

/// ページ横断の検索。索引は `uf run pages` が front matter と本文から書く
/// public/search-index.json で、最初に検索欄へ触れたときだけ取りに行く。
export component Search() {
  const router = useRouter();
  const [index, setIndex] = useState<$ReadOnlyArray<Entry> | null>(null);
  const [hits, setHits] = useState<$ReadOnlyArray<Hit>>([]);
  const [query, setQuery] = useState<string>("");
  const field = useRef<HTMLInputElement | null>(null);

  // `/` で検索欄へ。入力中の要素があるときは邪魔しない。
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        field.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function load(): Promise<$ReadOnlyArray<Entry>> {
    if (index != null) return index;
    const answer = await fetch(`${basePath()}/search-index.json`);
    const loaded = await answer.json();
    setIndex(loaded);
    return loaded;
  }

  function search(entries: $ReadOnlyArray<Entry>, raw: string): $ReadOnlyArray<Hit> {
    const terms = raw
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term !== "");
    if (terms.length === 0) return [];

    return entries
      .map((entry) => {
        const title = entry.title.toLowerCase();
        const headings = entry.headings.join(" ").toLowerCase();
        const description = entry.description.toLowerCase();
        const text = entry.text.toLowerCase();
        let score = 0;
        for (const term of terms) {
          const inText = text.split(term).length - 1;
          if (title.includes(term)) score += 10;
          if (headings.includes(term)) score += 4;
          if (description.includes(term)) score += 3;
          score += Math.min(inText, 5);
          if (
            !title.includes(term) &&
            !headings.includes(term) &&
            !description.includes(term) &&
            inText === 0
          ) {
            return { entry, score: -1 };
          }
        }
        return { entry, score };
      })
      .filter((scored) => scored.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((scored) => {
        const first = terms.find((term) => scored.entry.text.toLowerCase().includes(term));
        if (first == null) return { entry: scored.entry, snippet: scored.entry.description };
        const at = scored.entry.text.toLowerCase().indexOf(first);
        return {
          entry: scored.entry,
          snippet: scored.entry.text.slice(Math.max(0, at - 40), at + 80),
        };
      });
  }

  async function onInput(next: string) {
    setQuery(next);
    if (next.trim() === "") {
      setHits([]);
      return;
    }
    setHits(search(await load(), next.trim()));
  }

  function go(path: string) {
    setQuery("");
    setHits([]);
    void router.push(path);
  }

  return (
    <div className="search">
      <input
        ref={field}
        type="search"
        value={query}
        placeholder="ページを検索…"
        aria-label="ページを検索"
        autoComplete="off"
        onChange={(event) => {
          void onInput(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setQuery("");
            setHits([]);
            event.currentTarget.blur();
          }
        }}
      />
      {hits.length > 0 && (
        <ul className="search-results">
          {hits.map((hit) => (
            <li key={hit.entry.path}>
              <a
                href={hit.entry.path}
                onClick={(event) => {
                  event.preventDefault();
                  go(hit.entry.path);
                }}
              >
                <span className="sr-section">{hit.entry.section}</span>
                <span className="sr-title">{hit.entry.title}</span>
                <span className="sr-snippet">{hit.snippet}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {query.trim() !== "" && hits.length === 0 && (
        <ul className="search-results">
          <li className="sr-empty">見つかりませんでした</li>
        </ul>
      )}
    </div>
  );
}
