# -*- coding: utf-8 -*-
"""
note記事サムネイル生成 ―― シリーズ「曽根崎心中を調べる」第2回

第1回との関係:
- 意匠の骨格は共通（墨の地／右端が和紙／游明朝／柿の罫一本）。シリーズの統一感を保つ。
- 変えるのは「右端の紙に何が書かれているか」。第1回は「書き換へられたのは半丁」。
  今回は**奥書の二つの名前**——豊竹若太夫と紀海音。そこだけを紙に置く。
  記事の核（近松ではない誰かの名前が、そこに残っていた）を一点で語る。

出力: note-articles/thumbnails/02_kaion.png (1280x670)
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1280, 670

SUMI = np.array([13, 10, 8], dtype=np.float32)
WASHI = np.array([232, 224, 206], dtype=np.float32)
INK = (238, 230, 212)
INK_DIM = (150, 138, 118)
AKANE = (198, 92, 48)
SUMI_ON_PAPER = (78, 66, 52)      # 紙に書かれた墨字

MIN = r"C:\Windows\Fonts\yumin.ttf"
MINB = r"C:\Windows\Fonts\yumindb.ttf"


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
    n = fbm(H, W, seed=11)
    n = np.array(Image.fromarray((n * 255).astype(np.uint8))
                 .filter(ImageFilter.GaussianBlur(18)), dtype=np.float32) / 255.0
    v = 0.10 + 0.16 * n
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    v *= (1.0 - 0.25 * y)
    return np.clip(SUMI[None, None, :] + (WASHI - SUMI)[None, None, :] * v[:, :, None], 0, 255)


def paste_leaf(arr, x0=940):
    """右の一片を和紙にする。第1回と同じ作りだが、幅を少し広く取り、名前を二行置く。"""
    n = fbm(H, W - x0, octaves=4, seed=33)
    n = np.array(Image.fromarray((n * 255).astype(np.uint8))
                 .filter(ImageFilter.GaussianBlur(9)), dtype=np.float32) / 255.0
    paper = WASHI[None, None, :] * (0.90 + 0.10 * n[:, :, None])
    g = np.clip(np.linspace(0.72, 1.0, W - x0, dtype=np.float32), 0, 1)[None, :, None]
    arr[:, x0:] = paper * g
    arr[:, x0 - 1:x0 + 1] = np.array([90, 80, 66], dtype=np.float32)
    return arr, x0


def font(path, size, fallback=MIN):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.truetype(fallback, size)


def vtext(d, x, y, s, f, fill, step):
    """縦書き（一字ずつ下へ）。"""
    for ch in s:
        d.text((x, y), ch, font=f, fill=fill)
        y += step
    return y


def main():
    arr = build_ground()
    arr, x0 = paste_leaf(arr)
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)

    f_eyebrow = font(MIN, 25)
    f_main = font(MINB, 88)
    f_sub = font(MINB, 60)
    f_foot = font(MIN, 27)
    f_name = font(MINB, 38)      # 奥書の名前（大きめ）
    f_okuname = font(MIN, 24)    # 奥書の添え

    x = 84
    d.text((x, 78), "シリーズ　曽根崎心中を調べる　第二回", font=f_eyebrow, fill=INK_DIM)
    d.rectangle([x, 128, x + 62, 131], fill=AKANE)

    # 主題
    d.text((x, 182), "久右衛門は、", font=f_main, fill=INK)
    d.text((x, 300), "近松が", font=f_main, fill=INK)
    d.text((x, 424), "書いていない", font=f_sub, fill=INK)

    # 下の注記
    d.text((x, 546), "正徳五年、豊竹座『曽根崎心中十三年忌』の増補", font=f_foot, fill=INK_DIM)
    d.text((x, 588), "――書き足したのは、競争相手の座の作者", font=f_foot, fill=INK_DIM)

    # 右の和紙に「奥書」を写す。二つの名前を並べるのが今回の眼目
    d.text((x0 + 46, 96), "奥書", font=f_okuname, fill=(120, 105, 86))
    vtext(d, x0 + 168, 150, "豊竹若太夫", f_name, SUMI_ON_PAPER, 46)
    vtext(d, x0 + 78, 150, "紀海音", f_name, SUMI_ON_PAPER, 46)

    out = os.path.join(HERE, "02_kaion.png")
    img.save(out)
    g = np.array(img.convert("L"), dtype=np.float32)
    print("書き出し: %s" % out)
    print("  %dx%d / 平均輝度 %.1f" % (img.width, img.height, g.mean()))


if __name__ == "__main__":
    main()
