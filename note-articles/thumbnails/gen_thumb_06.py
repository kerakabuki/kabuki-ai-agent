# -*- coding: utf-8 -*-
"""
note記事サムネイル生成 ―― シリーズ「曽根崎心中を調べる」第6回

意匠の骨格は第1回〜第5回と共通（墨の地／右端が和紙／游明朝／柿の罫一本）。
変えるのは「右端の紙に何が書かれているか」:
  第3回 = 『辛崎心中』の本文（知っている名文が、知らない題の下にある）
  第4回 = 謡曲〈三井寺〉の詞章（同じ型が能の題の下にある）
  第5回 = 『心中大鑑』の一行（誰も知らない一行が、これから効いてくる）
  第6回 = **加賀掾正本の本文**

  紙には「七つの時がはや鳴つて／生滅滅巳とひびかまし」と書き、見出しを「加賀掾正本」にする。
  第3回・第4回は「知っている文句が別の題の下にある」驚きだったが、今回は反転で、
  **知っている題（曽根崎心中）の、知らないほうの本文**を見せる。
  「六つ鳴りて」「寂滅為楽」を知っている人ほど、二列の字がおかしいと気づく。

  「巳」は藤井紫影の頭注の字をそのまま使う（本文中では〔已〕を補って説明している）。

出力: note-articles/thumbnails/06_kahon.png (1280x670)
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
SUMI_ON_PAPER = (78, 66, 52)

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
    n = fbm(H, W, seed=17)
    n = np.array(Image.fromarray((n * 255).astype(np.uint8))
                 .filter(ImageFilter.GaussianBlur(18)), dtype=np.float32) / 255.0
    v = 0.10 + 0.16 * n
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    v *= (1.0 - 0.25 * y)
    return np.clip(SUMI[None, None, :] + (WASHI - SUMI)[None, None, :] * v[:, :, None], 0, 255)


def paste_leaf(arr, x0=940):
    n = fbm(H, W - x0, octaves=4, seed=41)
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
    f_foot = font(MIN, 27)
    f_song = font(MINB, 34)
    f_label = font(MIN, 24)

    x = 84
    d.text((x, 78), "シリーズ　曽根崎心中を調べる　第六回", font=f_eyebrow, fill=INK_DIM)
    d.rectangle([x, 128, x + 62, 131], fill=AKANE)

    d.text((x, 216), "あの名句を、", font=f_main, fill=INK)
    d.text((x, 340), "太夫が直していた", font=f_main, fill=INK)

    d.text((x, 546), "「七つと知りたる鐘を六つまで数ふる」と子規は書いた",
           font=f_foot, fill=INK_DIM)
    d.text((x, 588), "――加賀掾の正本は、まさにそこを直している",
           font=f_foot, fill=INK_DIM)

    d.text((x0 + 46, 92), "加賀掾正本", font=f_label, fill=(120, 105, 86))
    vtext(d, x0 + 176, 140, "七つの時がはや鳴つて", f_song, SUMI_ON_PAPER, 41)
    vtext(d, x0 + 82, 140, "生滅滅巳とひびかまし", f_song, SUMI_ON_PAPER, 41)

    out = os.path.join(HERE, "06_kahon.png")
    img.save(out)
    g = np.array(img.convert("L"), dtype=np.float32)
    print("書き出し: %s" % out)
    print("  %dx%d / 平均輝度 %.1f" % (img.width, img.height, g.mean()))


if __name__ == "__main__":
    main()
