# -*- coding: utf-8 -*-
r"""
note記事の本文図 ―― 『仮名手本忠臣蔵』全十一段をひと目で見る（一覧表の画像）

note は表に非対応なので、記事「全十一段をひと目で見る」の一覧を画像にする。
一行＝一段。左から 段名と場面 ／ 中心人物の顔（関係図と同じ丸写真） ／ 一言と人物名 ／ 描かれる関係。
意匠と写真の切り抜きは gen_kankeizu_chushingura.py を流用する。

出力: note-articles/thumbnails/chushingura_dan_table.png (1080 x 可変)
"""
import os
import sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gen_kankeizu_chushingura as K  # noqa: E402

W = 1080
WASHI = K.WASHI
SUMI, SUMI_DIM, AKANE, LINE = K.SUMI, K.SUMI_DIM, K.AKANE, K.LINE
ROW_TINT = (229, 221, 203)

ROWS = [
    ("大序", "鶴ヶ岡", ["moronao", "wakasa"],
     "顔世御前・高師直・桃井若狭之助",
     "人妻への横恋慕と侮辱が、争いの火種になる。", "夫婦・武家同士の対立"),
    ("二段目", "桃井館", ["honzo", "wakasa", "konami", "rikiya"],
     "本蔵・若狭之助、小浪・力弥",
     "主君を案じる家老の働きと、娘の縁談が動き出す。", "主従・親子・恋"),
    ("三段目", "進物・松の間刃傷", ["hangan", "moronao", "honzo"],
     "判官・師直・本蔵",
     "本蔵の進物のあと、侮辱に耐えかねた判官が斬りかかり、本蔵が止める。",
     "主従・夫婦"),
    # 原作三段目の裏門は今の歌舞伎ではまず出ず、舞踊「落人」に置き換わる。段ではなく「補い」の行
    ("歌舞伎では", "落人\n道行旅路の花聟", ["kanpei", "okaru"],
     "勘平・おかる",
     "主君の大事に居合わせず、死のうとする勘平を、おかるが支えて落ち延びる。原作の裏門に代えて出る舞踊。",
     "恋", "sub"),
    ("四段目", "切腹と城明渡し", ["hangan", "yura"],
     "判官・由良之助",
     "主君の最期の無念を、家臣が引き受ける。", "主従"),
    ("五段目", "山崎街道", ["kanpei", "yoichi", "sadakuro"],
     "勘平・与市兵衛・定九郎",
     "娘の身売りの金が、殺しと誤射を経て勘平の手に渡る。", "親子・夫婦"),
    ("六段目", "勘平腹切", ["kanpei", "okaru", "okaya"],
     "勘平・おかる・おかや",
     "舅殺しと思い込んだ勘平が、真相を知らぬまま腹を切る。", "夫婦・親子・主従"),
    ("七段目", "祇園一力茶屋", ["yura", "okaru", "heiemon"],
     "由良之助・おかる・平右衛門",
     "仇討ちの秘密をめぐり、兄が妹に刃を向ける。", "兄妹・主従"),
    ("八段目", "道行旅路の嫁入", ["tonase", "konami"],
     "戸無瀬・小浪",
     "娘の嫁入りをかなえようと、母娘が山科へ向かう。", "親子・恋"),
    ("九段目", "山科閑居", ["honzo", "tonase", "yura", "oishi"],
     "本蔵・戸無瀬、由良之助・お石",
     "娘の縁談と主君の恨みがぶつかり、父が命を差し出す。", "親子・夫婦・主従"),
    ("十段目", "天川屋", [],
     "天川屋義平・おその",
     "家族を危険にさらされても、商人が仇討ちの秘密を守る。", "夫婦・親子・信義"),
    ("十一段目", "討入り", ["yura"],
     "由良之助・塩冶家の浪士たち",
     "師直を討ち、亡き主君への思いを果たす。", "主従・仲間"),
]

# 列の位置
X_DAN = 56       # 段名・場面
X_PHOTO = 262    # 顔写真（左端）
PHOTO_D = 62
PHOTO_STEP = 50  # 重ねて並べる間隔
X_TEXT = 490     # 一言・人物・関係
X_END = 1030
PAD_TOP, PAD_BOTTOM = 18, 18
LINE_H = 32


def wrap(d, text, font, max_w):
    """日本語向けの折り返し。句読点の直後を優先して切る。"""
    lines, cur = [], ""
    for ch in text:
        # 行頭禁則: 句読点は幅を超えても前の行に付ける
        if d.textlength(cur + ch, font=font) <= max_w or ch in "、。」）":
            cur += ch
            continue
        # 直前の句読点で切れるなら（行の3割より後ろ）、そこで切る
        cut = max(cur.rfind("、"), cur.rfind("。"))
        if cut >= len(cur) * 0.3:
            lines.append(cur[:cut + 1])
            cur = cur[cut + 1:] + ch
        else:
            lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines


def main():
    probe = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    f_title = K.font(K.MINB, 38)
    f_dan = K.font(K.MINB, 28)
    f_scene = K.font(K.MIN, 18)
    f_body = K.font(K.MIN, 22)
    f_people = K.font(K.MIN, 17)
    f_rel = K.font(K.MIN, 17)
    f_note = K.font(K.MIN, 18)

    # 行の高さを先に決める
    f_sub_tag = K.font(K.MIN, 18)
    f_sub_scene = K.font(K.MINB, 22)
    layouts = []
    for row in ROWS:
        body = row[4]
        lines = wrap(probe, body, f_body, X_END - X_TEXT)
        text_h = len(lines) * LINE_H + 8 + 24
        h = max(PAD_TOP + text_h + PAD_BOTTOM, 118)
        layouts.append((lines, h))
    H = 130 + sum(h for _, h in layouts) + 70

    K.H = H  # 地紋を縦長に作る
    img = Image.fromarray(K.build_paper().astype(np.uint8)).convert("RGB")
    d = ImageDraw.Draw(img)

    title = "『仮名手本忠臣蔵』全十一段をひと目で見る"
    tw = d.textlength(title, font=f_title)
    d.text(((W - tw) / 2, 30), title, font=f_title, fill=SUMI)
    sub = "段名の下は主な場面。顔は関係図と同じ中心人物。右端は、その段で描かれる関係。「歌舞伎では」は歌舞伎で加えられた場面。"
    sw = d.textlength(sub, font=f_note)
    d.text(((W - sw) / 2, 84), sub, font=f_note, fill=SUMI_DIM)

    y = 130
    tint = True
    for row, (lines, h) in zip(ROWS, layouts):
        dan, scene, keys, people, body, rel = row[:6]
        sub = len(row) > 6 and row[6] == "sub"
        if sub:
            # 補いの行: 地色は敷かず、左に柿色の細い縦線。段名の代わりに「歌舞伎では」
            d.rectangle([44, y + 10, 47, y + h - 10], fill=AKANE)
            d.text((X_DAN + 8, y + PAD_TOP), dan, font=f_sub_tag, fill=AKANE)
            scene_lines = [sl for seg in scene.split("\n")
                           for sl in wrap(probe, seg, f_sub_scene, X_PHOTO - X_DAN - 12)]
            for j, sl in enumerate(scene_lines):
                d.text((X_DAN + 8, y + PAD_TOP + 28 + j * 28), sl, font=f_sub_scene, fill=SUMI)
        else:
            if tint:
                d.rounded_rectangle([40, y, W - 40, y + h], radius=10, fill=ROW_TINT)
            tint = not tint
            # 段名と場面
            d.text((X_DAN, y + PAD_TOP), dan, font=f_dan, fill=AKANE)
            for j, sl in enumerate(wrap(probe, scene, f_scene, X_PHOTO - X_DAN - 4)):
                d.text((X_DAN, y + PAD_TOP + 40 + j * 24), sl, font=f_scene, fill=SUMI_DIM)
        # 顔写真（重ねて並べる。後ろの人から描く）
        for j, key in reversed(list(enumerate(keys))):
            p = K.round_photo(key, PHOTO_D)
            px, py = X_PHOTO + j * PHOTO_STEP, y + PAD_TOP + 4
            img.paste(p, (px, py), p)
            d.ellipse([px, py, px + PHOTO_D, py + PHOTO_D], outline=K.RING, width=2)
        # 一言・人物・関係
        ty = y + PAD_TOP
        for sl in lines:
            d.text((X_TEXT, ty), sl, font=f_body, fill=SUMI)
            ty += LINE_H
        ty += 6
        d.text((X_TEXT, ty), people, font=f_people, fill=SUMI_DIM)
        rw = d.textlength(rel, font=f_rel)
        d.text((X_END - rw, ty), rel, font=f_rel, fill=AKANE)
        y += h
        d.line([(52, y), (W - 52, y)], fill=LINE, width=1)

    note = "大序が第一段。人物名や場面名は上演台本で異なる。写真は気良歌舞伎 2021年通し上演の人物写真。"
    nw = d.textlength(note, font=f_note)
    d.text(((W - nw) / 2, H - 46), note, font=f_note, fill=SUMI_DIM)

    out = os.path.join(HERE, "chushingura_dan_table.png")
    img.save(out)
    print("書き出し: %s  (%dx%d)" % (out, img.width, img.height))


if __name__ == "__main__":
    main()
