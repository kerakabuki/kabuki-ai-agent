"""PWA アイコン生成スクリプト
keranosuke-icon-kabuki.png (2048x2048) から PWA 用の 4 サイズを生成する。

出力:
  assets/pwa-icons/icon-192.png          — 192x192 (any)
  assets/pwa-icons/icon-512.png          — 512x512 (any)
  assets/pwa-icons/icon-maskable-192.png — 192x192 (maskable, セーフゾーン内に収縮)
  assets/pwa-icons/icon-maskable-512.png — 512x512 (maskable, セーフゾーン内に収縮)
"""
import os
from PIL import Image

SRC = os.path.join(os.path.dirname(__file__), "..", "assets", "keranosuke-icon-kabuki.png")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "pwa-icons")
os.makedirs(OUT_DIR, exist_ok=True)

img = Image.open(SRC).convert("RGBA")

# ── 通常アイコン (any) ──
for size in (192, 512):
    resized = img.resize((size, size), Image.LANCZOS)
    out_path = os.path.join(OUT_DIR, f"icon-{size}.png")
    resized.save(out_path, "PNG", optimize=True)
    print(f"  Created {out_path}")

# ── マスカブルアイコン ──
# maskable は safe zone = 中心 80% の円。
# 元アイコンを 80% に縮小して背景色 (#1E1A15) の上に中央配置。
BG_COLOR = (30, 26, 21, 255)  # ほぼ黒（元アイコンの背景に近い）

for size in (192, 512):
    canvas = Image.new("RGBA", (size, size), BG_COLOR)
    inner_size = int(size * 0.80)
    inner = img.resize((inner_size, inner_size), Image.LANCZOS)
    offset = (size - inner_size) // 2
    canvas.paste(inner, (offset, offset), inner)
    out_path = os.path.join(OUT_DIR, f"icon-maskable-{size}.png")
    canvas.save(out_path, "PNG", optimize=True)
    print(f"  Created {out_path}")

print("\nDone! Upload these to R2 ASSETS_BUCKET under the /assets/ prefix:")
print("  icon-192.png")
print("  icon-512.png")
print("  icon-maskable-192.png")
print("  icon-maskable-512.png")
