// @flow
import * as React from "@uniflowed/react";

/// 本文中の囲み。種類は見出しの既定文言も決める。
export component Callout(kind: string = "note", title?: string, children: React.Node) {
  const fallback = match (kind) {
    "tip" => "ヒント",
    "warn" => "注意",
    "gap" => "未実装・制限",
    "done" => "できること",
    _ => "メモ",
  };

  return (
    <aside className={`callout callout-${kind}`}>
      <div className="callout-title">{title ?? fallback}</div>
      {children}
    </aside>
  );
}
