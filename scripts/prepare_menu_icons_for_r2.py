#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
assets/menu-icons/ の icon-*.png を R2 用の menu-icon-*.png にコピーする。
ウィジェット・LINE は https://kabukiplus.com/assets/menu-icon-*.png を参照するので、
出力先のファイルを R2 バケット assets-keranosuke にアップロードする。
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "assets" / "menu-icons"
OUT_DIR = ROOT / "assets" / "menu-icons-for-r2"

# icon番号 → R2用ファイル名（ウィジェット・flex_menu の MENU_ITEMS 順）
MAPPING = [
    ("icon-0.png", "menu-icon-kera.png"),
    ("icon-5.png", "menu-icon-enmoku.png"),
    ("icon-2.png", "menu-icon-recommend.png"),
    ("icon-4.png", "menu-icon-glossary.png"),
    ("icon-7.png", "menu-icon-quiz.png"),
    ("icon-6.png", "menu-icon-news.png"),
    ("icon-8.png", "menu-icon-training.png"),
]


def main():
    SRC_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for src_name, out_name in MAPPING:
        src = SRC_DIR / src_name
        dst = OUT_DIR / out_name
        if src.exists():
            dst.write_bytes(src.read_bytes())
            print(f"  {src_name} → {out_name}")
        else:
            print(f"  スキップ（なし）: {src_name}")

    print(f"\n→ {OUT_DIR} に 7 ファイルを用意しました。")
    print("  Cloudflare ダッシュボード → R2 → バケット assets-keranosuke → Upload でこの中身をアップロードしてください。")
    print("  アップロード後、ウィジェットと LINE のメニューにアイコンが反映されます。")


if __name__ == "__main__":
    main()
