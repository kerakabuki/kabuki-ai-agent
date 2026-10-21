# -*- coding: utf-8 -*-
r"""
note記事サムネイル（写真入り案）―― 「仮名手本忠臣蔵のあらすじと見どころ」

文字だけの chushingura.png と同じ墨地・和紙の型で、右端の紙に三つの家の顔
（由良之助・本蔵・勘平）を丸く置く。写真の切り抜きは関係図スクリプトを流用。

出力: note-articles/thumbnails/chushingura_photo.png (1280x670)
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
X0 = 830  # 紙の左端（文字版より広く取る）


def main():
    arr = T.build_ground()
    arr, x0 = T.paste_leaf(arr, X0)
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGB")
    d = ImageDraw.Draw(img)

    f_eyebrow = T.font(T.MIN, 32)
    f_main = T.font(T.MINB, 104)    # 演目名を主役に
    f_sub = T.font(T.MINB, 48)      # 記事の読み筋
    f_label = T.font(T.MIN, 22)

    # 文字は三つだけ: 肩・演目名・添えの一行。下の説明文は置かない
    x = 66
    d.text((x, 168), "あらすじと見どころ", font=f_eyebrow, fill=T.INK_DIM)
    d.rectangle([x, 226, x + 70, 230], fill=T.AKANE)
    d.text((x, 272), "仮名手本忠臣蔵", font=f_main, fill=T.INK)
    d.text((x, 424), "三つの家の物語", font=f_sub, fill=T.INK_DIM)

    # 右端の紙: 三つの家の顔
    faces = [("yura", 950, 190, 176), ("honzo", 1140, 335, 176), ("kanpei", 950, 480, 176)]
    for key, cx, cy, dia in faces:
        p = K.round_photo(key, dia)
        img.paste(p, (int(cx - dia / 2), int(cy - dia / 2)), p)
        d.ellipse([cx - dia / 2, cy - dia / 2, cx + dia / 2, cy + dia / 2],
                  outline=(120, 106, 86), width=3)
    labels = [("由良之助", 950, 190 + 88 + 6), ("本蔵", 1140, 335 + 88 + 6), ("勘平", 950, 480 + 88 + 6)]
    for text, cx, ty in labels:
        w = d.textlength(text, font=f_label)
        d.text((cx - w / 2, ty), text, font=f_label, fill=(96, 82, 64))

    out = os.path.join(HERE, "chushingura_photo.png")
    img.save(out)
    print("書き出し: %s  (%dx%d)" % (out, img.width, img.height))


if __name__ == "__main__":
    main()
