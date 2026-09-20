// @flow
import * as React from "@uniflowed/react";

/// タイトル付きのコードブロック。MDX のフェンスは meta を描画しないので、
/// ファイル名を見せたいフェンスはこれで包む。
export component Figure(title: string, children: React.Node) {
  return (
    <figure className="code">
      <figcaption className="code-title">{title}</figcaption>
      {children}
    </figure>
  );
}
