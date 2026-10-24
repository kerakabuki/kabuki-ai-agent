# -*- coding: utf-8 -*-
r"""
note記事の見出し画像 ―― 「仮名手本忠臣蔵 七段目 祇園一力茶屋」

全段の記事（gen_thumb_chushingura_photo.py）と同じ型。右端の紙に、七段目の二人
（大星由良之助・おかる）の顔を大きく丸く置く。写真は 2021年 通し上演の口上用写真で、
丸抜きは関係図スクリプトの round_photo を使い、七段目の扮装の写真をここで PHOTOS/CROPS に足す。

出力: note-articles/thumbnails/gionichiriki.png (1280x670)
"""
import os
import sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gen_thumb_chushingura as T  # noqa: E402  墨地・和紙・フォント
import gen_kankeizu_chushingura as K  # noqa: E402  丸写真

W, H = T.W, T.H
X0 = 830  # 紙の左端（全段の記事と同じ）

# 七段目の扮装の口上用写真（関係図の yura・okaru は九段目・六段目の扮装）
K.PHOTOS["yura7"] = r"澤奈央也\七段目の大星由良之助.jpg"
K.CROPS["yura7"] = (980, 120, 2700, 1840)
K.PHOTOS["okaru7"] = r"佐藤憲司\七段目の遊女おかる.JPG"
K.CROPS["okaru7"] = (765, 40, 1325, 600)


def main():
    arr = T.build_ground()
    arr, x0 = T.paste_leaf(arr, X0)
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGB")
    d = ImageDraw.Draw(img)

    f_eyebrow = T.font(T.MIN, 32)
    f_main = T.font(T.MINB, 104)
    f_sub = T.font(T.MINB, 48)
    f_label = T.font(T.MIN, 24)

    x = 66
    d.text((x, 168), "あらすじと見どころ", font=f_eyebrow, fill=T.INK_DIM)
    d.rectangle([x, 226, x + 70, 230], fill=T.AKANE)
    d.text((x, 272), "仮名手本忠臣蔵", font=f_main, fill=T.INK)
    d.text((x, 424), "七段目　祇園一力茶屋", font=f_sub, fill=T.INK_DIM)

    # 右端の紙: 由良之助（上）とおかる（下）
    faces = [("yura7", "大星由良之助", 1055, 190, 210), ("okaru7", "おかる", 1055, 465, 210)]
    for key, label, cx, cy, dia in faces:
        p = K.round_photo(key, dia)
        img.paste(p, (int(cx - dia / 2), int(cy - dia / 2)), p)
        d.ellipse([cx - dia / 2, cy - dia / 2, cx + dia / 2, cy + dia / 2], outline=(120, 106, 86), width=3)
        w = d.textlength(label, font=f_label)
        d.text((cx - w / 2, cy + dia / 2 + 6), label, font=f_label, fill=(96, 82, 64))

    out = os.path.join(HERE, "gionichiriki.png")
    img.save(out)
    print("書き出し: %s  (%dx%d)" % (out, img.width, img.height))


if __name__ == "__main__":
    main()
