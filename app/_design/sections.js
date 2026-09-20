// @flow

/// セクションの並び順と表示名。ページの `section` はこのキーのどれか。
export const SECTIONS: $ReadOnlyArray<{ readonly key: string, readonly label: string }> = [
  { key: "intro", label: "はじめに" },
  { key: "why", label: "uf を選ぶ理由" },
  { key: "start", label: "セットアップ" },
  { key: "app", label: "アプリを作る" },
  { key: "targets", label: "動かす場所" },
  { key: "toolchain", label: "ツールチェーン" },
  { key: "reference", label: "リファレンス" },
];

export function sectionLabel(key: string): string {
  return SECTIONS.find((section) => section.key === key)?.label ?? "";
}
