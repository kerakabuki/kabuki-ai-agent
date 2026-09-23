# -*- coding: utf-8 -*-
"""
note マガジン「曽根崎心中を調べる」カバー画像

各回のサムネイル（gen_thumb_01〜05）と同じ材料を使うが、構図だけ変える。

  記事版 = 左に文字／右に和紙の一片（documentを一点だけ載せる）
  マガジン版 = **中央にまとめる**

理由: マガジンは一覧で正方形に近い比率に切られる。記事版の左右分業だと、
両端（＝文字の頭と和紙）が落ちて何も残らない。
そこで和紙は左右の縁に細く二本だけ置き（切られても構わない装飾）、
情報は中央 670px の正方形に収まる幅に収めた。

出力: note-articles/thumbnails/00_magazine.png (1280x670)
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1280, 670
SAFE = 670                        # 中央の正方形セーフエリア

SUMI = np.array([13, 10, 8], dtype=np.float32)
WASHI = np.array([232, 224, 206], dtype=np.float32)
INK = (238, 230, 212)
INK_DIM = (150, 138, 118)
AKANE = (198, 92, 48)

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


def edge_leaves(arr, w=64):
    """左右の縁に和紙を細く二本。切られても失うもののない装飾。"""
    n = fbm(H, w, octaves=4, seed=41)
    n = np.array(Image.fromarray((n * 255).astype(np.uint8))
                 .filter(ImageFilter.GaussianBlur(9)), dtype=np.float32) / 255.0
    paper = WASHI[None, None, :] * (0.90 + 0.10 * n[:, :, None])

    g = np.clip(np.linspace(1.0, 0.60, w, dtype=np.float32), 0, 1)[None, :, None]
    arr[:, :w] = paper * g
    arr[:, w:w + 2] = np.array([90, 80, 66], dtype=np.float32)

    g2 = np.clip(np.linspace(0.60, 1.0, w, dtype=np.float32), 0, 1)[None, :, None]
    arr[:, W - w:] = paper * g2
    arr[:, W - w - 2:W - w] = np.array([90, 80, 66], dtype=np.float32)
    return arr


def font(path, size, fallback=MIN):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.truetype(fallback, size)


def main():
    arr = build_ground()
    arr = edge_leaves(arr)
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)

    cx = W // 2
    f_eyebrow = font(MIN, 26)
    f_title = font(MINB, 72)      # 9字×72＝648 → 中央670の正方形に収まる
    f_sub = font(MIN, 27)
    f_foot = font(MIN, 24)

    d.text((cx, 196), "シリーズ", font=f_eyebrow, fill=INK_DIM, anchor="mm")
    d.rectangle([cx - 31, 232, cx + 31, 235], fill=AKANE)

    d.text((cx, 316), "曽根崎心中を調べる", font=f_title, fill=INK, anchor="mm")

    d.text((cx, 424), "近松門左衛門の原文を、地芝居の側から読む",
           font=f_sub, fill=INK_DIM, anchor="mm")

    d.text((cx, 534), "気良歌舞伎『曽根崎心中』", font=f_foot, fill=INK_DIM, anchor="mm")
    d.text((cx, 572), "令和8年9月26日（土）　気良座", font=f_foot, fill=INK_DIM, anchor="mm")

    out = os.path.join(HERE, "00_magazine.png")
    img.save(out)

    # セーフエリア検査（中央670×670に文字が収まっているか）
    x0 = (W - SAFE) // 2
    ok = True
    for s, f in (("曽根崎心中を調べる", f_title),
                 ("近松門左衛門の原文を、地芝居の側から読む", f_sub),
                 ("令和8年9月26日（土）　気良座", f_foot)):
        wpx = d.textlength(s, font=f)
        if cx - wpx / 2 < x0 or cx + wpx / 2 > x0 + SAFE:
            ok = False
            print("  はみ出し: %s (%.0fpx)" % (s, wpx))
    g = np.array(img.convert("L"), dtype=np.float32)
    print("書き出し: %s" % out)
    print("  %dx%d / 平均輝度 %.1f / 正方形セーフエリア %s"
          % (img.width, img.height, g.mean(), "OK" if ok else "NG"))


if __name__ == "__main__":
    main()
