# -*- coding: utf-8 -*-
"""
note記事サムネイル生成 ―― 「仮名手本忠臣蔵のあらすじと見どころ」

意匠の骨格は曽根崎シリーズと共通（墨の地／右端が和紙／游明朝／柿の罫一本）。
右端の紙には題名「仮名手本忠臣蔵」を縦書きし、「三つの家をたどる」と添える。
（「本〔忠臣〕蔵」の仕掛けは本文で軽く触れるだけなので、見出しでは目立たせない）

出力: note-articles/thumbnails/chushingura.png (1280x670)
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


def vtext(d, x, y, s, f, fill, step, accents=None, accent_fill=AKANE):
    """縦書き。accents に入っている文字だけ accent_fill で描く。"""
    accents = accents or set()
    for ch in s:
        d.text((x, y), ch, font=f, fill=accent_fill if ch in accents else fill)
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
    f_title = font(MINB, 58)
    f_label = font(MIN, 24)
    f_small = font(MIN, 22)

    x = 84
    d.text((x, 78), "歌舞伎のあらすじと見どころ", font=f_eyebrow, fill=INK_DIM)
    d.rectangle([x, 128, x + 62, 131], fill=AKANE)

    d.text((x, 216), "討入りの前に、", font=f_main, fill=INK)
    d.text((x, 340), "家族の物語がある", font=f_main, fill=INK)

    d.text((x, 546), "全十一段をひと目で見渡して、", font=f_foot, fill=INK_DIM)
    d.text((x, 588), "本蔵・勘平・由良之助、三つの家の線をたどる", font=f_foot, fill=INK_DIM)

    # 右端の紙: 題名を縦書き。添え書きは「三つの家」の読み筋だけにする。
    d.text((x0 + 46, 70), "全十一段", font=f_label, fill=(120, 105, 86))
    vtext(d, x0 + 198, 130, "仮名手本忠臣蔵", f_title, SUMI_ON_PAPER, 72)
    vtext(d, x0 + 108, 150, "三つの家をたどる", f_small, (120, 105, 86), 28)
    vtext(d, x0 + 70, 150, "討入りまでの道のり", f_small, (120, 105, 86), 28)

    out = os.path.join(HERE, "chushingura.png")
    img.save(out)
    g = np.array(img.convert("L"), dtype=np.float32)
    print("書き出し: %s" % out)
    print("  %dx%d / 平均輝度 %.1f" % (img.width, img.height, g.mean()))


if __name__ == "__main__":
    main()
