# -*- coding: utf-8 -*-
r"""
note記事の本文図 ―― 『仮名手本忠臣蔵』三つの家の人物関係（写真入り）

記事「全十一段をひと目で見る」の直前に置く一枚。note 向けの縦長。
家系図の作法で描く: 夫婦は並べて二重線でつなぎ、子は二重線の中点から下へ垂らす。
塩冶家・桃井家・勘平の家（山崎）の三つの箱に、気良歌舞伎 2021年 忠臣蔵通し上演の
口上用写真（役ごとの人物写真）を丸く抜いて置き、箱をまたぐ線（許嫁・抱き止める・横恋慕など）を引く。
顔世御前だけ写真が無いので名前のみ。天川屋は省く。師直は塩冶家の箱の外、上に置く。

写真の元: D:\気良歌舞伎\歌舞伎２０２１年\口上用写真\{演者}\{役名}.jpg
CROPS は原寸の (left, top, right, bottom)。顔が丸の上寄り三分の一に来るように切る。

出力: note-articles/thumbnails/chushingura_kankeizu.png (1080x1680)
"""
import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1810

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
    "sadakuro": r"和田将典\斧定九郎.jpg",   # 関係図では使わず、一覧表の五段目で使う
}
CROPS = {
    "hangan":  (890, 320, 1190, 620),
    "moronao": (905, 40, 1325, 460),
    "wakasa":  (756, 170, 1276, 690),
    "honzo":   (800, -50, 1200, 350),
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
    "sadakuro": (1500, 550, 2500, 1550),
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
    if t < 0:
        # 顔が写真の上端ぎりぎりのとき: 上端の平均色で上に足して、丸の中で顔を下げる
        pad = -t
        edge = tuple(int(v) for v in np.array(im)[:8].reshape(-1, 3).mean(axis=0))
        im = ImageOps.expand(im, border=(0, pad, 0, 0), fill=edge)
        t, b = 0, b + pad
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
        self.text_bottom = {}  # key -> 名前・役どころの下端 y（下へ出る線はここから引く）

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
        bottom = top + D + 8 + h + 6
        if role:
            rw, rh = self._bbox(role, self.f_role)
            self.d.text((cx - rw / 2, bottom), role, font=self.f_role, fill=SUMI_DIM)
            bottom += rh + 6
        self.text_bottom[key] = bottom + 4

    def _edge(self, key, toward):
        """丸の縁の点。相手がほぼ真下なら、名前と役どころの下端から出す（文字を線が横切らないように）。"""
        cx, cy, r = self.circles[key]
        dx, dy = toward[0] - cx, toward[1] - cy
        if dy > r and abs(dx) <= 160 and key in self.text_bottom:
            return cx, self.text_bottom[key]
        n = math.hypot(dx, dy) or 1
        return cx + dx / n * (r + 4), cy + dy / n * (r + 4)

    def link(self, a, b, label="", width=2, color=LINE, offset=(0, 0), arrow=False, t=0.5, shift=0):
        """a→b に丸の縁から縁へ線。label は線上の位置 t（0=a側）に offset を足して置く。
        shift は線を垂直方向にずらす量（同じ二人の間に往復の線を引くとき用）。"""
        ca, cb = self.circles[a][:2], self.circles[b][:2]
        p = self._edge(a, cb)
        q = self._edge(b, ca)
        if shift:
            dx, dy = q[0] - p[0], q[1] - p[1]
            n = math.hypot(dx, dy) or 1
            nx, ny = -dy / n * shift, dx / n * shift
            p = (p[0] + nx, p[1] + ny)
            q = (q[0] + nx, q[1] + ny)
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
        self.d.rounded_rectangle([x0, y0, x1, y1], radius=14, fill=(229, 221, 203), outline=BOX, width=2)
        w, h = self._bbox(title, self.f_box)
        self.d.rectangle([x0 + 22, y0 - h / 2 - 6, x0 + 22 + w + 16, y0 + h / 2 + 6],
                         fill=tuple(int(v) for v in WASHI))
        self.d.text((x0 + 30, y0 - h / 2 - 4), title, font=self.f_box, fill=AKANE)

    def polyline(self, points, label="", label_at=None, color=LINE, width=2, arrow=False, dashed=False):
        """折れ線。label は label_at の座標に紙色の下地を敷いて置く。arrow で終点に矢尻、dashed で破線。"""
        if dashed:
            for (x0, y0), (x1, y1) in zip(points, points[1:]):
                n = math.hypot(x1 - x0, y1 - y0)
                k = max(1, int(n / 14))
                for i in range(k):
                    if i % 2 == 0:
                        self.d.line([(x0 + (x1 - x0) * i / k, y0 + (y1 - y0) * i / k),
                                     (x0 + (x1 - x0) * (i + 1) / k, y0 + (y1 - y0) * (i + 1) / k)],
                                    fill=color, width=width)
        else:
            self.d.line(points, fill=color, width=width, joint="curve")
        if arrow:
            p, q = points[-2], points[-1]
            ang = math.atan2(q[1] - p[1], q[0] - p[0])
            s = 11
            self.d.polygon([q, (q[0] - s * math.cos(ang - 0.45), q[1] - s * math.sin(ang - 0.45)),
                            (q[0] - s * math.cos(ang + 0.45), q[1] - s * math.sin(ang + 0.45))],
                           fill=color)
        if label and label_at:
            w, h = self._bbox(label, self.f_rel)
            mx, my = label_at
            self.d.rectangle([mx - w / 2 - 6, my - h / 2 - 3, mx + w / 2 + 6, my + h / 2 + 5],
                             fill=tuple(int(v) for v in WASHI))
            self.d.text((mx - w / 2, my - h / 2 - 2), label, font=self.f_rel, fill=color if color != LINE else AKANE)

    # ---- 家系図の作法 ----
    def couple(self, a, b, label="", gap=5):
        """同じ段に並んだ夫婦を二重線でつなぐ。戻り値は二重線の中点（子の線の起点）。"""
        (ax, ay, ar), (bx, by, br) = self.circles[a], self.circles[b]
        x0, x1 = min(ax, bx) + ar + 4, max(ax, bx) - br - 4
        y = ay
        for dy in (-gap, gap):
            self.d.line([(x0, y + dy), (x1, y + dy)], fill=LINE, width=2)
        if label:
            w, h = self._bbox(label, self.f_rel)
            mx = (x0 + x1) / 2
            self.d.text((mx - w / 2, y - gap - h - 8), label, font=self.f_rel, fill=AKANE)
        return ((x0 + x1) / 2, y)

    def children(self, mid, keys, bar_y=None):
        """二重線の中点 mid から下へ線を垂らし、子（複数なら横棒で分岐）につなぐ。"""
        tops = [(self.circles[k][0], self.circles[k][1] - self.circles[k][2] - 4) for k in keys]
        if len(keys) == 1:
            cx, top = tops[0]
            if abs(cx - mid[0]) < 1:
                self.d.line([mid, (cx, top)], fill=LINE, width=2)
            else:
                by = bar_y if bar_y else (mid[1] + top) / 2
                self.d.line([mid, (mid[0], by), (cx, by), (cx, top)], fill=LINE, width=2, joint="curve")
            return
        by = bar_y if bar_y else (mid[1] + min(t for _, t in tops)) / 2
        self.d.line([mid, (mid[0], by)], fill=LINE, width=2)
        xs = [cx for cx, _ in tops]
        self.d.line([(min(xs), by), (max(xs), by)], fill=LINE, width=2)
        for cx, top in tops:
            self.d.line([(cx, by), (cx, top)], fill=LINE, width=2)


def main():
    img = Image.fromarray(build_paper().astype(np.uint8)).convert("RGB")
    fg = Fig(img)
    d = fg.d

    title = "『仮名手本忠臣蔵』三つの家の人物関係"
    w, _ = fg._bbox(title, fg.f_title)
    d.text(((W - w) / 2, 30), title, font=fg.f_title, fill=SUMI)

    # 箱は家老の家（大星家・加古川家）と勘平の家。主君と師直は箱の上に置く
    fg.box(40, 640, 520, 1170, "大星家")
    fg.box(560, 640, 1040, 1170, "加古川家")
    fg.box(40, 1210, 1040, 1715, "勘平の家（山崎）")

    # 最上段: 師直（判官の真上）
    fg.node("moronao", 390, 100, "高師直", "足利家の執事", photo="moronao")

    # 主君の段: 塩冶判官（と妻の顔世御前）、桃井若狭之助（本蔵の真上）
    fg.node("kaoyo", 170, 400, "顔世御前", "判官の妻")
    fg.node("hangan", 390, 400, "塩冶判官", "塩冶家の主君", photo="hangan")
    fg.node("wakasa", 720, 400, "桃井若狭之助", "桃井家の主君", photo="wakasa")

    # 大星家（塩冶家の家老）
    fg.node("oishi", 170, 690, "お石", "由良之助の妻", photo="oishi")
    fg.node("yura", 390, 690, "大星由良之助", "塩冶家の家老", photo="yura")
    fg.node("rikiya", 280, 960, "力弥", "由良之助の息子", photo="rikiya")

    # 加古川家（桃井家の家老）
    fg.node("honzo", 720, 690, "加古川本蔵", "桃井家の家老", photo="honzo")
    fg.node("tonase", 940, 690, "戸無瀬", "本蔵の妻・小浪の継母", photo="tonase")
    fg.node("konami", 830, 960, "小浪", "本蔵の娘", photo="konami")

    # 勘平の家（山崎）
    fg.node("yoichi", 610, 1250, "与市兵衛", "百姓", photo="yoichi")
    fg.node("okaya", 830, 1250, "おかや", "与市兵衛の妻", photo="okaya")
    fg.node("kanpei", 390, 1500, "早野勘平", "塩冶家の家来・判官の供", photo="kanpei")
    fg.node("okaru", 610, 1500, "おかる", "顔世御前の腰元", photo="okaru")
    fg.node("heiemon", 830, 1500, "寺岡平右衛門", "おかるの兄・足軽", photo="heiemon")

    # 夫婦（二重線）と子
    fg.couple("kaoyo", "hangan")
    m = fg.couple("oishi", "yura")
    fg.children(m, ["rikiya"])
    m = fg.couple("honzo", "tonase")
    fg.children(m, ["konami"])
    m = fg.couple("yoichi", "okaya")
    fg.children(m, ["okaru", "heiemon"], bar_y=1460)
    fg.couple("kanpei", "okaru", label="恋人・夫婦")

    # 主従（縦の直線）: 判官 → 由良之助 → 勘平、若狭之助 → 本蔵
    fg.link("hangan", "yura", "主従", offset=(36, 0))
    fg.link("wakasa", "honzo", "主従", offset=(36, 0))
    yx, _, _ = fg.circles["yura"]
    kx, ky, kr = fg.circles["kanpei"]
    fg.polyline([(yx, fg.text_bottom["yura"]), (kx, ky - kr - 4)], label="主従", label_at=(yx, 1190))

    # 許嫁（破線）
    (rx, ry, rr), (cx_, cy_, cr) = fg.circles["rikiya"], fg.circles["konami"]
    fg.polyline([(rx + rr + 4, ry), (cx_ - cr - 4, cy_)], label="許嫁", label_at=(540, ry), dashed=True)

    # 事件の動き（柿色の矢印、直角配線）
    CONF = AKANE
    mx_, my_, mr = fg.circles["moronao"]
    kx_, ky2, kr2 = fg.circles["kaoyo"]
    fg.polyline([(mx_ - mr - 4, my_), (kx_, my_), (kx_, ky2 - kr2 - 4)],
                label="横恋慕", label_at=(kx_, 300), color=CONF, arrow=True)
    fg.link("moronao", "hangan", "侮辱", arrow=True, t=0.5, offset=(-36, 0), shift=-8, color=CONF)
    fg.link("hangan", "moronao", "斬りかかる", arrow=True, t=0.5, offset=(64, 0), shift=-8, color=CONF)
    wx, wy, wr = fg.circles["wakasa"]
    fg.polyline([(wx, wy - wr - 4), (wx, my_), (mx_ + mr + 4, my_)],
                label="斬ろうとするが、思いとどまる", label_at=(620, my_ - 36), color=CONF, arrow=True)
    hx, hy, hr = fg.circles["honzo"]
    jx, jy, jr = fg.circles["hangan"]
    fg.polyline([(hx - hr - 4, hy), (540, hy), (540, jy), (jx + jr + 4, jy)],
                label="抱き止める", label_at=(540, 600), color=CONF, arrow=True)

    # 凡例
    lx, ly = 70, 1740
    fg.d.line([(lx, ly), (lx + 40, ly)], fill=LINE, width=2)
    fg.d.line([(lx, ly + 7), (lx + 40, ly + 7)], fill=LINE, width=2)
    fg.d.text((lx + 50, ly - 10), "夫婦（子は中点から下へ）", font=fg.f_note, fill=SUMI_DIM)
    lx = 380
    fg.d.line([(lx, ly + 3), (lx + 40, ly + 3)], fill=LINE, width=2)
    fg.d.text((lx + 50, ly - 10), "主従", font=fg.f_note, fill=SUMI_DIM)
    lx = 520
    for i in range(0, 40, 14):
        fg.d.line([(lx + i, ly + 3), (lx + i + 7, ly + 3)], fill=LINE, width=2)
    fg.d.text((lx + 50, ly - 10), "許嫁", font=fg.f_note, fill=SUMI_DIM)
    lx = 660
    fg.d.line([(lx, ly + 3), (lx + 40, ly + 3)], fill=CONF, width=2)
    fg.d.polygon([(lx + 40, ly + 3), (lx + 30, ly - 2), (lx + 30, ly + 8)], fill=CONF)
    fg.d.text((lx + 50, ly - 10), "事件の動き", font=fg.f_note, fill=SUMI_DIM)

    note = "写真は気良歌舞伎 2021年「仮名手本忠臣蔵」通し上演の人物写真。顔世御前は写真なし。"
    w, _ = fg._bbox(note, fg.f_note)
    d.text(((W - w) / 2, 1775), note, font=fg.f_note, fill=SUMI_DIM)

    out = os.path.join(HERE, "chushingura_kankeizu.png")
    img.save(out)
    print("書き出し: %s  (%dx%d)" % (out, img.width, img.height))


if __name__ == "__main__":
    main()
