# -*- coding: utf-8 -*-
"""曽我対面の超訳動画と同じ型の題字カードと、画面左上のロゴ札を作る。

  python title_card.py card   <切り抜きPNG> <出力PNG> <大題字> [小題字]        静止画
  python title_card.py motion <切り抜きPNG> <出力mp4> <大題字> [小題字] [秒]   動きつき（写真が寄りながら流れ、題字が逆に流れ、最後に白く飛ぶ）
  python title_card.py logo   <出力PNG>

カード: 赤地に細かい地紋、左に役者の切り抜き（白い縁光り）、右に縦書きの大題字（源ノ角ゴシック Black・白・黒縁）、小題字は横書き。
ロゴ札: 赤い角丸に「氣」の紋（白抜き）＋「気良歌舞伎」＋「KERA KABUKI」。
"""
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT_GO = r"C:\Windows\Fonts\NotoSansJP-VF.ttf"
FONT_SERIF = r"C:\Windows\Fonts\NotoSerifJP-VF.ttf"
TITLE_FONT = "gothic"      # gothic | mincho（源ノ明朝 Black）
TITLE_STROKE = True        # 黒い縁取り（False なら影だけ）
NAME_ON_PHOTO = False      # 役名を写真にかぶせる
EMBLEM = r"D:\気良歌舞伎\youtubeチャンネル用\気良歌舞伎ロゴ-removebg-preview.png"
COLORS = {   # シリーズの地色: 対面=赤・封印切=緑・切られ与三=青。曽根崎心中の候補は紫（天満屋の暖簾とお初の帯）か紺（道行の夜）
    "red": ((165, 28, 34), (140, 20, 26)),
    "purple": ((78, 42, 110), (64, 32, 92)),
    "navy": ((26, 38, 82), (18, 28, 66)),
    "green": ((34, 92, 60), (26, 76, 48)),
}
BG, BG_DARK = COLORS["red"]
W, H = 1920, 1080
FPS = 30000 / 1001


def title_font(size, weight="Black"):
    f = ImageFont.truetype(FONT_SERIF if TITLE_FONT == "mincho" else FONT_GO, size)
    try:
        f.set_variation_by_name(weight)
    except Exception:
        pass
    return f


def gothic(size, weight="Black"):
    f = ImageFont.truetype(FONT_GO, size)
    try:
        f.set_variation_by_name(weight)
    except Exception:
        pass
    return f


def pattern_bg(color="red"):
    """地色に七宝つなぎの地紋（低コントラスト）"""
    base, dark = COLORS[color]
    img = Image.new("RGB", (W, H), base)
    d = ImageDraw.Draw(img)
    r = 36
    for y in range(-r, H + r, r):
        for x in range(-r, W + r, r):
            off = r // 2 if (y // r) % 2 else 0
            d.ellipse((x + off - r, y - r, x + off + r, y + r), outline=dark, width=2)
    return img.convert("RGBA")


def glow_cutout(cut, height, glow=18):
    """切り抜きを指定の高さにして、白い縁光りを付ける"""
    r = height / cut.height
    cut = cut.resize((int(cut.width * r), height), Image.LANCZOS)
    pad = glow * 3
    canvas = Image.new("RGBA", (cut.width + pad * 2, cut.height + pad * 2), (0, 0, 0, 0))
    a = cut.getchannel("A")
    white = Image.new("RGBA", cut.size, (255, 255, 255, 255))
    white.putalpha(a)
    halo = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    halo.alpha_composite(white, (pad, pad))
    halo = halo.filter(ImageFilter.GaussianBlur(glow))
    ha = halo.getchannel("A").point(lambda v: min(255, int(v * 2.2)))
    halo.putalpha(ha)
    canvas.alpha_composite(halo)
    canvas.alpha_composite(cut, (pad, pad))
    return canvas


def vtext(d, text, x_center, y_top, size, stroke):
    f = title_font(size)
    y = y_top
    for ch in text:
        bb = d.textbbox((0, 0), ch, font=f)
        d.text((x_center - (bb[2] - bb[0]) / 2 - bb[0], y - bb[1]), ch, font=f, fill=(255, 255, 255),
               stroke_width=stroke if TITLE_STROKE else 0, stroke_fill=(0, 0, 0))
        y += int(size * 1.08)


def drop_shadow(layer, blur=10, alpha=200, offset=(4, 6)):
    a = layer.getchannel("A").point(lambda v: int(v * alpha / 255))
    sh = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    sh.putalpha(a)
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    out = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    out.alpha_composite(sh, offset)
    out.alpha_composite(layer)
    return out


def title_layer_h(work, line, small=None, name=None):
    """横書き案: 右端に縦書きの演目名（work）、その左に横書きの台詞（line。| で改行）、下に小題字、役名は写真にかぶせる"""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    wsize = int(os.environ.get("WORK_SIZE", "150"))
    work_left = os.environ.get("WORK_POS") == "left"
    photo_right = os.environ.get("PHOTO_RIGHT") == "1"
    lines = [l for l in line.split("|") if l]
    lsize = int(os.environ.get("LINE_SIZE", "128"))
    f = title_font(lsize)
    total = len(lines) * int(lsize * 1.25)
    y = (H - total) // 2 - 10
    if photo_right:
        # 写真が右: 台詞は左揃え（視線の先＝左に文字を集める）。札は WORK_STYLE で: v=左端に縦 / h=台詞の下に小さく横 / none=なし
        style = os.environ.get("WORK_STYLE", "v")
        left = 60 + wsize + 70 if style == "v" else 120
        if style == "v":
            vtext(d, work, 60 + wsize // 2, (H - int(wsize * 1.08 * len(work))) // 2 - 10, wsize, 10)
        for ln in lines:
            bb = d.textbbox((0, 0), ln, font=f)
            d.text((left - bb[0], y - bb[1]), ln, font=f, fill=(255, 255, 255),
                   stroke_width=8 if TITLE_STROKE else 0, stroke_fill=(0, 0, 0))
            y += int(lsize * 1.25)
        if style == "h":
            fh = title_font(46, "Bold")
            x = left + 6
            for ch in work:
                d.text((x, y + 6), ch, font=fh, fill=(255, 255, 255))
                x += d.textlength(ch, font=fh) + 6
        right = left + 900
    else:
        wx = 60 + wsize // 2 if work_left else W - 60 - wsize // 2
        vtext(d, work, wx, (H - int(wsize * 1.08 * len(work))) // 2 - 10, wsize, 10)
        right = W - 80 if work_left else W - 60 - wsize - 70
        for ln in lines:
            bb = d.textbbox((0, 0), ln, font=f)
            d.text((right - (bb[2] - bb[0]) - bb[0], y - bb[1]), ln, font=f, fill=(255, 255, 255),
                   stroke_width=8 if TITLE_STROKE else 0, stroke_fill=(0, 0, 0))
            y += int(lsize * 1.25)
    if name:
        vtext(d, name, 560 + int(os.environ.get("FIG_DX", "0")), H - 110 - int(110 * 1.08 * len(name)), 110, 8)
    if small:
        fs = gothic(52, "Bold")
        bb = d.textbbox((0, 0), small, font=fs)
        d.text((right - (bb[2] - bb[0]) - bb[0], y + 10), small, font=fs, fill=(255, 255, 255),
               stroke_width=6 if TITLE_STROKE else 0, stroke_fill=(0, 0, 0))
    return img if TITLE_STROKE else drop_shadow(img)


def title_layer(big, small=None, name=None):
    if os.environ.get("LAYOUT") == "h":      # 横書き案: big=演目名（縦）、small=台詞（横・|で改行）、name=役名
        return title_layer_h(big, small, os.environ.get("SMALL2"), name)
    """題字だけの透明レイヤー。big＝縦書きの大題字（右寄り）、name＝役名（大題字の左に小さめ）、small＝横書きの小題字"""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cols = [c for c in big.split("|") if c]          # 「死ぬる|覚悟が|聞きたい」のように | で列を分ける（右から左へ）
    n = max(len(c) for c in cols)
    size = min(300, int(820 / (n * 1.08)))
    x = W - 150 - size // 2
    y_top = (H - int(size * 1.08 * n)) // 2 - 20      # 列の頭をそろえる（長さが違っても上端は同じ）
    for col in cols:
        vtext(d, col, x, y_top, size, max(6, size // 12))
        x -= int(size * 1.22)
    if name:
        nsize = 110
        if NAME_ON_PHOTO:   # 写真（左下）にかぶせる: 帯のあたり、写真の縁を少し越える位置
            vtext(d, name, 560, H - 110 - int(nsize * 1.08 * len(name)), nsize, 8)
        else:
            vtext(d, name, x - 40, (H - int(nsize * 1.08 * len(name))) // 2 - 20, nsize, 8)
    if small:
        fs = gothic(56, "Bold")
        bb = d.textbbox((0, 0), small, font=fs)
        d.text((W - 150 - (bb[2] - bb[0]) - 40, H - 100), small, font=fs, fill=(255, 255, 255),
               stroke_width=6 if TITLE_STROKE else 0, stroke_fill=(0, 0, 0))
    return img if TITLE_STROKE else drop_shadow(img)


def compose(bg, fig, title, fig_scale=1.0, fig_dx=0, fig_dy=0, title_dy=0):
    frame = bg.copy()
    if fig_scale != 1.0:
        fig = fig.resize((int(fig.width * fig_scale), int(fig.height * fig_scale)), Image.BILINEAR)
    if os.environ.get("PHOTO_RIGHT") == "1":
        frame.alpha_composite(fig, (int(W - fig.width + 54 - fig_dx + int(os.environ.get("FIG_DX", "0"))), int(H - fig.height + 120 + fig_dy + int(os.environ.get("FIG_DY", "0")))))
    else:
        frame.alpha_composite(fig, (int(-54 + fig_dx + int(os.environ.get("FIG_DX", "0"))), int(H - fig.height + 120 + fig_dy)))
    frame.alpha_composite(title, (0, int(title_dy)))
    return frame


def make_card(cut_path, out, big, small=None, color="red", name=None):
    bg = pattern_bg(color)
    fig = glow_cutout(Image.open(cut_path).convert("RGBA"), int(os.environ.get("FIG_H", "1250")))
    compose(bg, fig, title_layer(big, small, name)).convert("RGB").save(out)
    print("card", out)


def make_motion(cut_path, out, big, small=None, sec=3.5, color="red", name=None, move="zoom"):
    """写真: zoom＝その場で 1.00→1.10 に寄る／pan＝寄りながら左上へ流れる。題字: 下から上へ 48px 流れる。最後の 0.4 秒で白く飛ぶ。"""
    from render import ACODEC, VCODEC   # 本編と同じ符号化で結合できるように
    bg = pattern_bg(color)
    fig = glow_cutout(Image.open(cut_path).convert("RGBA"), int(os.environ.get("FIG_H", "1250")))
    title = title_layer(big, small, name)
    n = int(round(sec * FPS))
    work = out + "_frames"
    os.makedirs(work, exist_ok=True)
    white_from = n - int(round(0.4 * FPS))
    for i in range(n):
        p = i / max(1, n - 1)
        if move == "zoom":   # 顔のあたりを中心に寄る（左下に置いた切り抜きが大きくなる分、顔が動かないよう左上へ戻す）
            sc = 1.0 + 0.10 * p
            frame = compose(bg, fig, title, fig_scale=sc, fig_dx=-(sc - 1) * fig.width * 0.45, fig_dy=(sc - 1) * fig.height * 0.1,
                            title_dy=24 - 48 * p)
        else:
            frame = compose(bg, fig, title, fig_scale=1.0 + 0.06 * p, fig_dx=-30 * p, fig_dy=-20 * p, title_dy=24 - 48 * p)
        if i >= white_from:
            a = (i - white_from) / max(1, n - 1 - white_from)
            frame = Image.blend(frame, Image.new("RGBA", (W, H), (255, 255, 255, 255)), min(1.0, a))
        frame.convert("RGB").save(os.path.join(work, f"f_{i:04d}.png"))
    subprocess.run(["ffmpeg", "-v", "warning", "-y", "-framerate", "30000/1001", "-i", os.path.join(work, "f_%04d.png"),
                    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", f"{n / FPS:.3f}",
                    "-vf", "format=yuv420p", *VCODEC, *ACODEC, "-shortest", out], check=True)
    print("motion", out, f"{n} frames")


def make_thumb(cut_path, out, work, line, color="purple", face_frac=0.50, fig_h=1400, fig_x=-564, fig_y=-427):
    """サムネ用: 同じ意匠で、切り抜きの上部（顔〜胸）だけを大きく。1920×1080 で描いて 1280×720 に縮める"""
    bg = pattern_bg(color)
    cut = Image.open(cut_path).convert("RGBA")
    face_frac = float(os.environ.get("FACE_FRAC", face_frac))
    cut = cut.crop((0, 0, cut.width, int(cut.height * face_frac)))
    fig_h = int(os.environ.get("FIG_H", fig_h))
    fig = glow_cutout(cut, fig_h)
    fig_x = int(os.environ.get("FIG_X", fig_x))
    fig_y = int(os.environ.get("FIG_Y", fig_y))
    photo_right = os.environ.get("PHOTO_RIGHT") == "1"
    if photo_right:   # 顔を右 1/3 に（x=1400 あたり）
        fig_x = fig_x + (1400 - 520)
    bg.alpha_composite(fig, (fig_x, fig_y))
    d = ImageDraw.Draw(bg)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    wsize = int(os.environ.get("WORK_SIZE", "96"))
    lines = [l for l in line.split("|") if l]
    lsize = int(os.environ.get("LINE_SIZE", "138"))
    f = title_font(lsize)
    y = (H - len(lines) * int(lsize * 1.22)) // 2 + int(os.environ.get("LINE_Y", "110"))
    if photo_right:
        style = os.environ.get("WORK_STYLE", "v")
        if style == "v":
            vtext(ld, work, 50 + wsize // 2, (H - int(wsize * 1.08 * len(work))) // 2, wsize, 8)
        left = 50 + wsize + 60 if style == "v" else 90
        if style == "h2":   # 台詞の上に横書き・別書体（WORK_FONT: gothic | engei）
            wf = os.environ.get("WORK_FONT", "gothic")
            fw = ImageFont.truetype(r"C:\Windows\Fonts\TA_engeifude.ttf", wsize) if wf == "engei" else gothic(wsize, "Black")
            x = left
            for ch in work:
                ld.text((x, y - wsize - 50), ch, font=fw, fill=(255, 255, 255))
                x += ld.textlength(ch, font=fw) + 10
        for ln in lines:
            bb = ld.textbbox((0, 0), ln, font=f)
            ld.text((left - bb[0], y - bb[1]), ln, font=f, fill=(255, 255, 255))
            y += int(lsize * 1.22)
    else:
        vtext(ld, work, W - 50 - wsize // 2, (H - int(wsize * 1.08 * len(work))) // 2, wsize, 8)
        right = W - 50 - wsize - 60
        for ln in lines:
            bb = ld.textbbox((0, 0), ln, font=f)
            ld.text((right - (bb[2] - bb[0]) - bb[0], y - bb[1]), ln, font=f, fill=(255, 255, 255))
            y += int(lsize * 1.22)
    tag = os.environ.get("TAG")
    if tag:   # 上にシリーズ名の札（白地に紫の文字・角丸）
        ft = gothic(int(os.environ.get("TAG_SIZE", "60")), "Black")
        tw = ld.textlength(tag, font=ft)
        tx, ty = 90, int(os.environ.get("TAG_Y", "120"))
        ld.rounded_rectangle((tx - 24, ty - 14, tx + tw + 24, ty + ft.size + 18), radius=14, fill=(245, 240, 232, 255))
        tag_color = tuple(int(v) for v in os.environ.get("TAG_COLOR", "78,42,110").split(","))   # 札の文字色（地色に合わせる）
        ld.text((tx, ty), tag, font=ft, fill=tag_color)
    bg.alpha_composite(drop_shadow(layer, blur=12, alpha=230, offset=(5, 7)))
    bg.convert("RGB").resize((1280, 720), Image.LANCZOS).save(out, quality=95)
    print("thumb", out)


def make_logo(out):
    """左上のロゴ札（透明PNG・1920×1080 の画面にそのまま重ねる）"""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x0, y0, w, h = 28, 24, 300, 84
    d.rounded_rectangle((x0, y0, x0 + w, y0 + h), radius=10, fill=(178, 32, 38, 235))
    em = Image.open(EMBLEM).convert("RGBA")
    a = em.getchannel("A")
    white = Image.new("RGBA", em.size, (255, 255, 255, 255))
    white.putalpha(a)
    eh = h - 14
    white = white.resize((int(em.width * eh / em.height), eh), Image.LANCZOS)
    img.alpha_composite(white, (x0 + 8, y0 + 7))
    f1 = gothic(34, "Bold")
    f2 = gothic(17, "Bold")
    tx = x0 + 8 + white.width + 10
    d.text((tx, y0 + 10), "気良歌舞伎", font=f1, fill=(255, 255, 255))
    d.text((tx + 2, y0 + 54), "KERA KABUKI", font=f2, fill=(255, 255, 255))
    img.save(out)
    print("logo", out)


if __name__ == "__main__":
    TITLE_FONT = os.environ.get("TITLE_FONT", TITLE_FONT)
    TITLE_STROKE = os.environ.get("TITLE_STROKE", "1" if TITLE_STROKE else "0") == "1"
    NAME_ON_PHOTO = os.environ.get("NAME_ON_PHOTO", "1" if NAME_ON_PHOTO else "0") == "1"
    mode = sys.argv[1]
    a = sys.argv
    if mode == "card":     # card <切り抜き> <出力> <大題字> [小題字] [色] [役名]
        make_card(a[2], a[3], a[4], a[5] if len(a) > 5 else None, a[6] if len(a) > 6 else "red", a[7] if len(a) > 7 else None)
    elif mode == "motion": # motion <切り抜き> <出力> <大題字> [小題字] [秒] [色] [役名] [zoom|pan]
        make_motion(a[2], a[3], a[4], a[5] if len(a) > 5 else None, float(a[6]) if len(a) > 6 else 3.5,
                    a[7] if len(a) > 7 else "red", a[8] if len(a) > 8 else None, a[9] if len(a) > 9 else "zoom")
    elif mode == "thumb":  # thumb <切り抜き> <出力> <演目札> <台詞> [色]
        make_thumb(a[2], a[3], a[4], a[5], a[6] if len(a) > 6 else "purple")
    else:
        make_logo(sys.argv[2])
