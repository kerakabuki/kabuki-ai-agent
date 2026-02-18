#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
icon_grid_path.txt に書いた画像パスを読み、アイコンを切り出します。
1. プロジェクト直下に icon_grid_path.txt を作成
2. 1行目にグリッド画像のフルパスを貼り付け
3. 実行: python scripts/crop_from_path.py
"""
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow が必要です: pip install Pillow")
    sys.exit(1)

# プロジェクトルート（このスクリプトの2つ上）
ROOT = Path(__file__).resolve().parent.parent
PATH_FILE = ROOT / "icon_grid_path.txt"
OUT_DIR = ROOT / "assets" / "menu-icons"


def main():
    if not PATH_FILE.exists():
        print(f"{PATH_FILE} を作成し、1行目にグリッド画像のフルパスを書いてください。")
        sys.exit(1)

    src_path = Path(PATH_FILE.read_text(encoding="utf-8").strip().splitlines()[0].strip())
    if not src_path.exists():
        print(f"ファイルが見つかりません: {src_path}")
        sys.exit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    img = Image.open(src_path).convert("RGBA")
    w, h = img.size
    cols, rows = 3, 3
    cw, rh = w // cols, h // rows
    rh_icon = int(rh * 0.85)

    for row in range(rows):
        for col in range(cols):
            left = col * cw
            top = row * rh
            box = (left, top, left + cw, top + rh_icon)
            cell = img.crop(box)
            out_path = OUT_DIR / f"icon-{row * cols + col}.png"
            cell.save(out_path)
            print(out_path)

    print(f"\n9 枚保存しました: {OUT_DIR}")
    print("0=扇(kera), 1=巻物(enmoku), 2=提灯(recommend), 3=本(却下), 4=いろは本(glossary), 5=巻き紙, 6=高札(news), 7=問答(quiz), 8=刀(training)")
    print("必要なものを menu-icon-*.png にリネームして R2 へ。")


if __name__ == "__main__":
    main()
