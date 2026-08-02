#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
上段3枚（icon-0, icon-2, icon-4）の上の余白を詰め、下に余白を足して縦のバランスを取る。
使い方: python scripts/fix_icon_padding.py [割合]
  割合: 上から削る割合（0.0～0.3、省略時は 0.15 = 15%）
"""
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow が必要です: pip install Pillow")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
ICONS_DIR = ROOT / "assets" / "menu-icons"
TARGETS = (0, 2, 4)


def main():
    ratio = float(sys.argv[1]) if len(sys.argv) > 1 else 0.15
    if not (0 < ratio < 0.35):
        ratio = 0.15

    for i in TARGETS:
        path = ICONS_DIR / f"icon-{i}.png"
        if not path.exists():
            print(f"スキップ（なし）: {path}")
            continue
        img = Image.open(path).convert("RGBA")
        w, h = img.size
        trim = int(h * ratio)
        if trim <= 0:
            continue
        # 上を trim ピクセル削り、下に trim ピクセル（背景色）を足す
        top_crop = img.crop((0, trim, w, h))
        new_img = Image.new("RGBA", (w, h), (0, 0, 0, 255))
        new_img.paste(top_crop, (0, 0))
        new_img.save(path)
        print(f"修正: {path}（上 {trim}px 削って下に余白）")

    print("完了。")


if __name__ == "__main__":
    main()
