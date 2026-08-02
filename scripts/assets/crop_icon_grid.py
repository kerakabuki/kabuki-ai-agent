#!/usr/bin/env python3
"""
3x3 グリッドのアイコン画像を1枚ずつ切り出して保存する。
使い方:
  pip install Pillow
  python scripts/crop_icon_grid.py <入力画像パス> [出力フォルダ] [--icon-only]

  --icon-only  各マスの下のラベル（英語など）を除き、アイコン部分だけ切り出す（上約75%）
"""
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow が必要です: pip install Pillow")
    sys.exit(1)


def main():
    args = [a for a in sys.argv[1:] if a != "--icon-only"]
    icon_only = "--icon-only" in sys.argv

    if len(args) < 1:
        print(__doc__)
        sys.exit(0)

    src = Path(args[0])
    out_dir = Path(args[1]) if len(args) > 1 else Path("assets/menu-icons")

    if not src.exists():
        print(f"ファイルが見つかりません: {src}")
        sys.exit(1)

    out_dir.mkdir(parents=True, exist_ok=True)
    img = Image.open(src).convert("RGBA")
    w, h = img.size

    cols, rows = 3, 3
    cw, rh = w // cols, h // rows
    if icon_only:
        rh_icon = int(rh * 0.75)

    for row in range(rows):
        for col in range(cols):
            left = col * cw
            top = row * rh
            if icon_only:
                box = (left, top, left + cw, top + rh_icon)
            else:
                box = (left, top, left + cw, top + rh)
            cell = img.crop(box)
            out_path = out_dir / f"icon-{row * cols + col}.png"
            cell.save(out_path)
            print(out_path)

    print(f"\n{cols * rows} 枚保存しました: {out_dir}")
    print("必要なものを menu-icon-kera.png などの名前にリネームして R2 にアップロードしてください。")


if __name__ == "__main__":
    main()
