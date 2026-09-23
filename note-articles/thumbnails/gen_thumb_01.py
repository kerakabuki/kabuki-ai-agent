# -*- coding: utf-8 -*-
"""
note記事サムネイル生成 ―― シリーズ「曽根崎心中を調べる」第1回

意匠の考え方:
- 記事の核は「最後の半丁だけが書き換えられた」こと。
  画面を丁（和本の紙一枚）に見立て、右端の一片だけ紙の色を変える。
  そこだけが差し替えられた、という一点で全部を語る。
- note のフィードは白地なので、墨色の地は目に立つ。
- 書体は游明朝。研究記事の硬さに合わせ、行書は使わない。

出力: note-articles/thumbnails/01_ohatsu-tenjinki.png (1280x670)
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1280, 670

SUMI = np.array([13, 10, 8], dtype=np.float32)        # 地の墨
WASHI = np.array([232, 224, 206], dtype=np.float32)   # 差し替えられた紙
INK = (238, 230, 212)                                  # 文字（生成り）
INK_DIM = (150, 138, 118)
AKANE = (198, 92, 48)                                  # 差し色（柿）

MIN = r"C:\Windows\Fonts\yumin.ttf"      # 游明朝
MINB = r"C:\Windows\Fonts\yumindb.ttf"   # 游明朝 Demibold（無ければ游明朝）


def fbm(h, w, octaves=5, seed=3, persistence=0.55):
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), dtype=np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        res = 2 ** (o + 2)
        small = rng.random((max(2, res), max(2, int(res * w / h)))).astype(np.float32)
        layer = np.array(Image.fromarray((small * 255).astype(np.uint8))
                         .resize((w, h), Image.BICUBIC), dtype=np.float32) / 255.0
        out += layer * amp
        tot += amp
        amp *= persistence
    return out / tot


def build_ground():
    """墨の地。わずかな濃淡を持たせ、平板な黒にしない。"""
    n = fbm(H, W, seed=7)
    n = np.array(Image.fromarray((n * 255).astype(np.uint8))
                 .filter(ImageFilter.GaussianBlur(18)), dtype=np.float32) / 255.0
    v = 0.10 + 0.16 * n                       # ごく浅い揺らぎ
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    v *= (1.0 - 0.25 * y)                     # 下へわずかに沈める
    img = SUMI[None, None, :] + (WASHI - SUMI)[None, None, :] * v[:, :, None]
    return np.clip(img, 0, 255)


def paste_halfleaf(arr, x0=980):
    """右の一片だけを『紙』に差し替える。ここが半丁。"""
    n = fbm(H, W - x0, octaves=4, seed=21)
    n = np.array(Image.fromarray((n * 255).astype(np.uint8))
                 .filter(ImageFilter.GaussianBlur(9)), dtype=np.float32) / 255.0
    paper = WASHI[None, None, :] * (0.90 + 0.10 * n[:, :, None])   # 紙の斑
    # 綴じ側（左端）へ向けてわずかに陰る
    g = np.clip(np.linspace(0.72, 1.0, W - x0, dtype=np.float32), 0, 1)[None, :, None]
    paper = paper * g
    arr[:, x0:] = paper
    # 折り目の線
    arr[:, x0 - 1:x0 + 1] = np.array([90, 80, 66], dtype=np.float32)
    return arr


def font(path, size, fallback=MIN):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.truetype(fallback, size)


def main():
    arr = build_ground()
    arr = paste_halfleaf(arr)
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)

    f_eyebrow = font(MIN, 25)
    f_main = font(MINB, 92)
    f_sub = font(MINB, 62)
    f_foot = font(MIN, 27)
    f_leaf = font(MIN, 30)

    x = 84
    # 上のラベル
    d.text((x, 78), "シリーズ　曽根崎心中を調べる　第一回", font=f_eyebrow, fill=INK_DIM)
    # 柿色の短い罫
    d.rectangle([x, 128, x + 62, 131], fill=AKANE)

    # 主題
    d.text((x, 178), "徳兵衛が", font=f_main, fill=INK)
    d.text((x, 288), "死なない", font=f_main, fill=INK)
    d.text((x, 412), "『曽根崎心中』がある", font=f_sub, fill=INK)

    # 下の注記
    d.text((x, 536), "享保十八年、豊竹座『お初天神記』", font=f_foot, fill=INK_DIM)
    d.text((x, 578), "――お初だけが死ぬ、もうひとつの結末", font=f_foot, fill=INK_DIM)

    # 半丁の側に、そこが書き換えられた紙であることを示す一行（縦書き）
    xx, yy = 1088, 150
    for ch in "書き換へられたのは半丁":
        d.text((xx, yy), ch, font=f_leaf, fill=(92, 78, 62))
        yy += 38

    out = os.path.join(HERE, "01_ohatsu-tenjinki.png")
    img.save(out)
    g = np.array(img.convert("L"), dtype=np.float32)
    print("書き出し: %s" % out)
    print("  %dx%d / 平均輝度 %.1f" % (img.width, img.height, g.mean()))


if __name__ == "__main__":
    main()
