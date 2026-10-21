# -*- coding: utf-8 -*-
r"""
note記事の本文図 ―― 『仮名手本忠臣蔵』三つの家の人物関係（写真入り）

記事「全十一段をひと目で見る」の直前に置く一枚。
塩冶家・桃井家・勘平の家（山崎）の三つの箱に、気良歌舞伎 2021年 忠臣蔵通し上演の
口上用写真（役ごとの人物写真）を丸く抜いて並べ、箱をまたぐ線（許嫁・横恋慕など）を引く。
顔世御前だけ写真が無いので名前のみ。天川屋は省く。

写真の元: D:\気良歌舞伎\歌舞伎２０２１年\口上用写真\{演者}\{役名}.jpg
CROPS は原寸の (left, top, right, bottom)。顔が丸の上寄り三分の一に来るように切る。

出力: note-articles/thumbnails/chushingura_kankeizu.png (1280x1080)
"""
import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1280, 1080

WASHI = np.array([236, 229, 212], dtype=np.float32)
SUMI = (52, 44, 36)
SUMI_DIM = (118, 104, 86)
AKANE = (190, 84, 42)
LINE = (140, 126, 106)
BOX = (168, 154, 132)
RING = (120, 106, 86)

MIN = r"C:\Windows\Fonts\yumin.ttf"
MINB = r"C:\Windows\Fonts\yumindb.ttf"

PHOTO_ROOT = r"D:\気良歌舞伎\歌舞伎２０２１年\口上用写真"
PHOTOS = {
    "hangan":  r"林克彦\塩冶判官高定.jpg",
    "moronao": r"佐藤憲司\高武蔵守師直.jpg",
    "wakasa":  r"坪井和也\桃井若狭之助.png",
    "honzo":   r"澤奈央也\九段目の加古川本蔵.jpg",
    "tonase":  r"佐藤真哉\本蔵妻　戸無瀬.jpg",
    "konami":  r"鈴木崇\本蔵娘小浪.png",
    "yura":    r"奥村将典\九段目の大星由良之助.jpg",
    "oishi":   r"和田将典\由良之助妻お石.jpg",
    "rikiya":  r"秋栃健太\九段目の大星力弥.jpg",
    "kanpei":  r"澤奈央也\早野勘平.jpg",
    "okaru":   r"佐藤真哉\六段目の女房おかる.jpg",
    "heiemon": r"髙田新一郎\七段目の寺岡平右衛門.jpg",
    "yoichi":  r"佐藤憲司\百姓与市兵衛.jpg",
    "okaya":   r"髙田新一郎\母おかや.jpg",
}
CROPS = {
    "hangan":  (890, 320, 1190, 620),
    "moronao": (905, 40, 1325, 460),
    "wakasa":  (756, 170, 1276, 690),
    "honzo":   (880, 40, 1240, 400),
    "tonase":  (800, 190, 1220, 610),
    "konami":  (662, 220, 1222, 780),
    "yura":    (790, 60, 1270, 540),
    "oishi":   (810, 240, 1210, 640),
    "rikiya":  (750, 280, 1190, 720),
    "kanpei":  (698, 795, 1848, 1945),
    "okaru":   (930, 995, 2180, 2245),
    "heiemon": (818, 1075, 2068, 2325),
    "yoichi":  (813, 855, 1963, 2005),
    "okaya":   (838, 670, 1838, 1670),
}
D = 120  # 丸写真の直径


def fbm(h, w, octaves=4, seed=7, persistence=0.55):
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


def build_paper():
    n = fbm(H, W, seed=23)
    n = np.array(Image.fromarray((n * 255).astype(np.uint8))
                 .filter(ImageFilter.GaussianBlur(10)), dtype=np.float32) / 255.0
    paper = WASHI[None, None, :] * (0.94 + 0.06 * n[:, :, None])
    return np.clip(paper, 0, 255)


def font(path, size, fallback=MIN):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.truetype(fallback, size)


def round_photo(key, d=D):
    """原寸写真を CROPS で切り、直径 d の丸に抜く（マスクは4倍で描いて縮小）。"""
    im = ImageOps.exif_transpose(Image.open(os.path.join(PHOTO_ROOT, PHOTOS[key]))).convert("RGB")
    l, t, r, b = CROPS[key]
    l, t = max(0, l), max(0, t)
    r, b = min(im.width, r), min(im.height, b)
    side = min(r - l, b - t)
    crop = im.crop((l, t, l + side, t + side)).resize((d * 2, d * 2), Image.LANCZOS)
    crop = crop.resize((d, d), Image.LANCZOS)
    mask = Image.new("L", (d * 4, d * 4), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, d * 4 - 1, d * 4 - 1], fill=255)
    mask = mask.resize((d, d), Image.LANCZOS)
    out = Image.new("RGBA", (d, d), (0, 0, 0, 0))
    out.paste(crop, (0, 0), mask)
    return out


class Fig:
    def __init__(self, img):
        self.img = img
        self.d = ImageDraw.Draw(img)
        self.f_title = font(MINB, 38)
        self.f_name = font(MINB, 27)
        self.f_role = font(MIN, 17)
        self.f_rel = font(MIN, 20)
        self.f_box = font(MIN, 24)
        self.f_note = font(MIN, 18)
        self.circles = {}   # key -> (cx, cy, r)

    def _bbox(self, text, f):
        l, t, r, b = self.d.textbbox((0, 0), text, font=f)
        return r - l, b - t

    def node(self, key, cx, top, name, role="", photo=None, photos=None):
        """丸写真（または名前だけの丸）を上に、名前と役どころを下に。"""
        cy = top + D / 2
        if photos:                      # 二人一組（与市兵衛・おかや）
            d2 = 100
            for i, pk in enumerate(photos):
                x = cx - 52 + (i * 104) - d2 / 2
                y = cy - d2 / 2
                self.img.paste(round_photo(pk, d2), (int(x), int(y)), round_photo(pk, d2))
                self.d.ellipse([x, y, x + d2, y + d2], outline=RING, width=2)
            self.circles[key] = (cx, cy, 104)
        elif photo:
            p = round_photo(photo)
            self.img.paste(p, (int(cx - D / 2), int(top)), p)
            self.d.ellipse([cx - D / 2, top, cx + D / 2, top + D], outline=RING, width=2)
            self.circles[key] = (cx, cy, D / 2)
        else:                           # 写真なし: 薄い丸に名の二字
            self.d.ellipse([cx - D / 2, top, cx + D / 2, top + D],
                           fill=(222, 213, 194), outline=RING, width=2)
            short = name[:2]
            w, h = self._bbox(short, self.f_name)
            self.d.text((cx - w / 2, cy - h / 2 - 4), short, font=self.f_name, fill=SUMI_DIM)
            self.circles[key] = (cx, cy, D / 2)
        w, h = self._bbox(name, self.f_name)
        self.d.text((cx - w / 2, top + D + 8), name, font=self.f_name, fill=SUMI)
        if role:
            rw, rh = self._bbox(role, self.f_role)
            self.d.text((cx - rw / 2, top + D + 8 + h + 6), role, font=self.f_role, fill=SUMI_DIM)

    def _edge(self, key, toward):
        cx, cy, r = self.circles[key]
        dx, dy = toward[0] - cx, toward[1] - cy
        n = math.hypot(dx, dy) or 1
        return cx + dx / n * (r + 4), cy + dy / n * (r + 4)

    def link(self, a, b, label="", width=2, color=LINE, offset=(0, 0), arrow=False, t=0.5):
        """a→b に丸の縁から縁へ線。label は線上の位置 t（0=a側）に offset を足して置く。"""
        ca, cb = self.circles[a][:2], self.circles[b][:2]
        p = self._edge(a, cb)
        q = self._edge(b, ca)
        self.d.line([p, q], fill=color, width=width)
        if arrow:
            ang = math.atan2(q[1] - p[1], q[0] - p[0])
            s = 11
            self.d.polygon([q, (q[0] - s * math.cos(ang - 0.45), q[1] - s * math.sin(ang - 0.45)),
                            (q[0] - s * math.cos(ang + 0.45), q[1] - s * math.sin(ang + 0.45))],
                           fill=color)
        if label:
            w, h = self._bbox(label, self.f_rel)
            mx = p[0] + (q[0] - p[0]) * t + offset[0]
            my = p[1] + (q[1] - p[1]) * t + offset[1]
            self.d.rectangle([mx - w / 2 - 6, my - h / 2 - 3, mx + w / 2 + 6, my + h / 2 + 5],
                             fill=tuple(int(v) for v in WASHI))
            self.d.text((mx - w / 2, my - h / 2 - 2), label, font=self.f_rel, fill=AKANE)

    def box(self, x0, y0, x1, y1, title):
        self.d.rounded_rectangle([x0, y0, x1, y1], radius=14, outline=BOX, width=2)
        w, h = self._bbox(title, self.f_box)
        self.d.rectangle([x0 + 22, y0 - h / 2 - 6, x0 + 22 + w + 16, y0 + h / 2 + 6],
                         fill=tuple(int(v) for v in WASHI))
        self.d.text((x0 + 30, y0 - h / 2 - 4), title, font=self.f_box, fill=AKANE)


def main():
    img = Image.fromarray(build_paper().astype(np.uint8)).convert("RGB")
    fg = Fig(img)
    d = fg.d

    title = "『仮名手本忠臣蔵』三つの家の人物関係"
    w, _ = fg._bbox(title, fg.f_title)
    d.text(((W - w) / 2, 30), title, font=fg.f_title, fill=SUMI)
    d.rectangle([(W - 62) / 2, 90, (W + 62) / 2, 93], fill=AKANE)

    # 箱を先に描き、写真はその上に載せる
    fg.box(40, 320, 625, 775, "塩冶家")
    fg.box(655, 320, 1240, 775, "桃井家")
    fg.box(40, 830, 1240, 1040, "勘平の家（山崎）")

    # 敵役
    fg.node("moronao", 640, 112, "高師直", "足利家の執事", photo="moronao")

    # 塩冶家
    fg.node("hangan", 190, 345, "塩冶判官", "主君", photo="hangan")
    fg.node("kaoyo", 450, 345, "顔世御前", "判官の妻")
    fg.node("yura", 140, 575, "大星由良之助", "家老", photo="yura")
    fg.node("oishi", 340, 575, "お石", "由良之助の妻", photo="oishi")
    fg.node("rikiya", 540, 575, "力弥", "息子", photo="rikiya")
    fg.link("hangan", "kaoyo", "夫婦")
    fg.link("hangan", "yura", "主従", t=0.75)
    fg.link("yura", "oishi", "夫婦")
    fg.link("oishi", "rikiya", "親子")

    # 桃井家
    fg.node("wakasa", 1090, 345, "桃井若狭之助", "主君", photo="wakasa")
    fg.node("konami", 740, 575, "小浪", "娘", photo="konami")
    fg.node("tonase", 940, 575, "戸無瀬", "本蔵の妻・継母", photo="tonase")
    fg.node("honzo", 1140, 575, "加古川本蔵", "家老", photo="honzo")
    fg.link("wakasa", "honzo", "主従", t=0.75)
    fg.link("honzo", "tonase", "夫婦")
    fg.link("tonase", "konami", "親子")

    # 家をまたぐ線
    fg.link("rikiya", "konami", "許嫁", color=AKANE, width=3)
    fg.link("moronao", "kaoyo", "横恋慕", arrow=True, t=0.6, offset=(42, 0))
    fg.link("moronao", "hangan", "侮辱", arrow=True, t=0.72, offset=(-38, 0))
    fg.link("wakasa", "moronao", "斬ろうとする", arrow=True, t=0.5, offset=(0, -18))

    # 勘平の家（山崎）
    fg.node("kanpei", 180, 855, "早野勘平", "判官の供", photo="kanpei")
    fg.node("okaru", 450, 855, "おかる", "顔世御前の腰元", photo="okaru")
    fg.node("oyako", 730, 855, "与市兵衛・おかや", "おかるの両親", photos=["yoichi", "okaya"])
    fg.node("heiemon", 1020, 855, "寺岡平右衛門", "おかるの兄・足軽", photo="heiemon")
    fg.link("kanpei", "okaru", "恋人・夫婦")
    fg.link("okaru", "oyako", "親子")
    fg.link("oyako", "heiemon", "親子")

    note = "写真は気良歌舞伎 2021年「仮名手本忠臣蔵」通し上演の人物写真。顔世御前は写真なし。線の言葉は劇中の関係。"
    w, _ = fg._bbox(note, fg.f_note)
    d.text(((W - w) / 2, 1052), note, font=fg.f_note, fill=SUMI_DIM)

    out = os.path.join(HERE, "chushingura_kankeizu.png")
    img.save(out)
    print("書き出し: %s  (%dx%d)" % (out, img.width, img.height))


if __name__ == "__main__":
    main()
