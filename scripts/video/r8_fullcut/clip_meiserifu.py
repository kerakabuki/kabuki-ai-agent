# -*- coding: utf-8 -*-
"""名台詞クリップ（【わかる！超訳】型）を、全編の幕ごとの部品から切り出して組み立てる。

  python clip_meiserifu.py clips/ohatsu_kakugo.json          # 本編 → 出力
  python clip_meiserifu.py clips/ohatsu_kakugo.json --preview 40   # 40秒時点の確認画像だけ

画面の型は既存の台詞解説動画（弁天小僧「さてその次は江の島の」など）と同じ:
  右上に原文の台詞を縦書き（游明朝）、下に現代語の超訳を横書き（BIZ UDゴシック・括弧つき）。
構成: OP → 黒札（演目・場・状況） → 本編（字幕焼き込み） → （差し込み）→ ED。
OP/ED・札・本編の映像は render.py と同じ符号化なので、結合は再符号化なし。
"""
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from render import ACODEC, LIMITER, OPED, PARTS, VCODEC, duration, run

FONT_MIN = r"C:\Windows\Fonts\yumindb.ttf"          # 原文（縦書き）
FONT_GO = r"C:\Windows\Fonts\BIZ-UDGothicB.ttc"     # 超訳（横書き）
VERT_SHADE = 110   # 縦書きの後ろの影の濃さ（0 で無し）
RUBY_DY = 0.0      # ルビの上下位置（文字の大きさに対する割合。マイナスで上へ）
VERT_TOP = 70      # 縦書きの上端。元映像の右上に焼き込みの題があるときは json の "vert_top" で下げる
NOTE_STYLE = ""    # "band" で左上の説明を札つき・大きめにする（json の "note_style"）
NOTE_Y = 130       # 左上の一行の位置。元映像の左上に焼き込みのロゴがあるときは json の "note_y" で下げる
W, H = 1920, 1080


def shadowed(img, layer_draw_fn):
    """白文字＋柔らかい黒影。layer_draw_fn(draw, fill) で同じ図形を2回描く"""
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    layer_draw_fn(ImageDraw.Draw(sh), (0, 0, 0, 230))
    sh = sh.filter(ImageFilter.GaussianBlur(5))
    img.alpha_composite(sh)
    img.alpha_composite(sh)
    fg = Image.new("RGBA", img.size, (0, 0, 0, 0))
    layer_draw_fn(ImageDraw.Draw(fg), (255, 255, 255, 255))
    img.alpha_composite(fg)


def parse_ruby(text):
    """'不愍｛ふびん｝さ' → [('不','ふびん',2),('愍',None,0),('さ',None,0)]。
    ルビは直前の漢字の連なり全体に掛かり、先頭の字に (よみ, 字数) で付く"""
    out, i = [], 0
    while i < len(text):
        ch = text[i]
        if ch == "｛":
            j = text.index("｝", i + 1)
            ruby = text[i + 1:j]
            k = len(out)
            while k > 0 and _is_kanji(out[k - 1][0]) and out[k - 1][1] is None:
                k -= 1
            if k == len(out):   # 漢字が無ければ直前の1字に
                k = len(out) - 1
            out[k] = (out[k][0], ruby, len(out) - k)
            i = j + 1
        else:
            out.append((ch, None, 0))
            i += 1
    return out


def _is_kanji(ch):
    return "一" <= ch <= "鿿" or ch in "々〆"


def strip_ruby(text):
    return "".join(ch for ch, _, _ in parse_ruby(text))


def draw_vertical(draw, text, x_right, y_top, size, fill):
    """縦書き1列。句読点は右上に寄せ、長音は横倒しにする。ルビ（漢字｛よみ｝）は文字の右に小さく。戻り値は列の幅"""
    f = ImageFont.truetype(FONT_MIN, size)
    fr = ImageFont.truetype(FONT_MIN, int(size * 0.42))
    step = int(size * 1.12)
    y = y_top
    for ch, ruby, span in parse_ruby(text):
        x = x_right - size
        if ruby:
            rstep = int(size * 0.42 * 1.05)
            block = (span - 1) * step + size          # ルビが掛かる親文字の縦の長さ
            ry = y + (block - rstep * len(ruby)) / 2 + size * RUBY_DY
            for rc in ruby:
                draw.text((x + size * 1.02, ry), rc, font=fr, fill=fill)
                ry += rstep
        if ch in "、。":
            draw.text((x + size * 0.55, y - size * 0.45), ch, font=f, fill=fill)
            y += int(size * 0.7)
            continue
        if ch in "ー―－…":
            # 横倒し: 一旦小さな画像に描いて回転（三点リーダは縦に点が並ぶ）
            tile = Image.new("RGBA", (size * 2, size * 2), (0, 0, 0, 0))
            ImageDraw.Draw(tile).text((size * 0.5, size * 0.5), "…" if ch == "…" else "ー", font=f, fill=fill)
            tile = tile.rotate(-90, resample=Image.BICUBIC)
            draw._image.alpha_composite(tile, (int(x - size * 0.5), int(y - size * 0.5)))
            y += step
            continue
        dx = size * 0.12 if ch in "ぁぃぅぇぉっゃゅょァィゥェォッャュョ" else 0
        draw.text((x + dx, y), ch, font=f, fill=fill)
        y += step
    return size


FONT_TITLE = r"C:\Windows\Fonts\NotoSansJP-VF.ttf"   # 源ノ角ゴシック（可変。Black を指定）


def title_png(path, text, size=170):
    """画面中央に大きくゴシック Black（超訳ナビのタイトルと同じ書体）"""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    f = ImageFont.truetype(FONT_TITLE, size)
    try:
        f.set_variation_by_name("Black")
    except Exception:
        pass

    def draw_all(d, fill):
        bb = d.textbbox((0, 0), text, font=f)
        d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], H / 2 - (bb[3] - bb[1]) / 2 - bb[1]), text, font=f, fill=fill)

    shadowed(img, draw_all)
    img.save(path)


def note_png(path, text, size=46):
    """左上に状況の説明。json の "note_style": "band" なら、墨の札を敷いて大きめに出す（`|` で2行まで）"""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if NOTE_STYLE == "band":
        size = 56
        f = ImageFont.truetype(FONT_GO, size)
        rows = text.split("|")
        d0 = ImageDraw.Draw(img)
        tw = max(d0.textlength(r, font=f) for r in rows)
        lh = int(size * 1.45)
        x0, y0 = 64, NOTE_Y
        d0.rectangle([x0, y0, x0 + tw + 76, y0 + lh * len(rows) + 30], fill=(20, 17, 18, 205))
        d0.rectangle([x0, y0, x0 + 10, y0 + lh * len(rows) + 30], fill=(160, 62, 44, 255))   # 弁柄の縦線
        for i, r in enumerate(rows):
            d0.text((x0 + 40, y0 + 16 + lh * i), r, font=f, fill=(255, 255, 255, 255))
        img.save(path)
        return
    f = ImageFont.truetype(FONT_GO, size)

    def draw_all(d, fill):
        d.text((80, NOTE_Y), text, font=f, fill=fill)   # ロゴ札（左上）の下

    shadowed(img, draw_all)
    img.save(path)


def split_long(col, limit=13):
    """縦書きの列が長ければ、真ん中に近い読点で2列に割る（読点が無ければ真ん中で）"""
    plain = strip_ruby(col)
    if len(plain) <= limit:
        return [col]
    cands = [i for i, ch in enumerate(col) if ch in "、"]
    mid = len(col) // 2
    cut = min(cands, key=lambda i: abs(i - mid)) + 1 if cands else mid
    return [col[:cut], col[cut:]]


def wrap_trans(d, text, f, max_w):
    """超訳が幅に収まらなければ、真ん中に近い読点で2行に折る"""
    if d.textlength(text, font=f) <= max_w:
        return [text]
    cands = [i for i, ch in enumerate(text) if ch in "、"]
    mid = len(text) // 2
    cut = min(cands, key=lambda i: abs(i - mid)) + 1 if cands else mid
    return [text[:cut], text[cut:]]


def caption_png(path, orig, trans, size_v=68, size_h=66, h=None):
    """orig=縦書きの原文（右上・明朝）、trans=超訳（下中央・ゴシック・（ ）付き）、h=横書きの台詞（下中央・明朝・括弧なし。訳なしの回用）"""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if h:
        fh = ImageFont.truetype(FONT_MIN, int(size_h * 1.12))
        lines = h.split("|")
        # 横書きの台詞の後ろにも薄い影の帯
        if VERT_SHADE:
            band_h = len(lines) * int(size_h * 1.12 * 1.35) + 90
            shade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            ImageDraw.Draw(shade).rounded_rectangle((160, H - 60 - band_h, W - 160, H - 20), radius=30, fill=(0, 0, 0, VERT_SHADE))
            img.alpha_composite(shade.filter(ImageFilter.GaussianBlur(28)))

        def draw_h(d, fill):
            y = H - 120 - (len(lines) - 1) * int(size_h * 1.12 * 1.35)
            for ln in lines:
                bb = d.textbbox((0, 0), ln, font=fh)
                d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], y - (bb[3] - bb[1]) / 2 - bb[1]), ln, font=fh, fill=fill)
                y += int(size_h * 1.12 * 1.35)
        shadowed(img, draw_h)
        img.save(path)
        return
    cols = []
    for c in orig.replace("――", "").replace("、", "").split("|"):   # 縦書きの原文に読点は出さない（ユーザー指示 2026-10-10）
        if c:
            cols += split_long(c)
    # それでも長い列は下の超訳にかからないよう文字を小さく（句読点は半分の高さで数える）
    longest = max((sum(0.7 if ch in "、。" else 1.0 for ch in strip_ruby(c)) for c in cols), default=0)
    if longest > 10.5:   # 10字までは固定の大きさ。超える列だけ縮める（大きさが行ごとに変わるのは不評）
        size_v = min(size_v, int((H - 230 - VERT_TOP) / (longest * 1.12)))

    # 縦書きの後ろに薄い影の帯（文字の塊の外側 60px まで、ぼかして）
    if cols and VERT_SHADE:
        ncol = len(cols)
        band_w = int(size_v * 1.5 * ncol) + 120
        band_h = int(size_v * 1.12 * longest) + 140
        shade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(shade).rounded_rectangle((W - 90 - band_w + 60, VERT_TOP - 60, W - 20, VERT_TOP - 60 + band_h), radius=30, fill=(0, 0, 0, VERT_SHADE))
        img.alpha_composite(shade.filter(ImageFilter.GaussianBlur(28)))

    def draw_all(d, fill):
        # 縦書き: 右上。列は右から左へ
        x_right = W - 90
        for col in cols:
            draw_vertical(d, col, x_right, VERT_TOP, size_v, fill)
            x_right -= int(size_v * 1.5)
        # 横書き: 下中央（幅に収まらなければ2行）
        if trans:
            f = ImageFont.truetype(FONT_GO, size_h)
            lines = wrap_trans(d, trans, f, 1700)
            lines = [f"（{lines[0]}" + ("）" if len(lines) == 1 else "")] + ([lines[1] + "）"] if len(lines) > 1 else [])
            y = H - 110 - (len(lines) - 1) * int(size_h * 1.3)
            for ln in lines:
                bb = d.textbbox((0, 0), ln, font=f)
                d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], y - (bb[3] - bb[1]) / 2 - bb[1]), ln, font=f, fill=fill)
                y += int(size_h * 1.3)

    shadowed(img, draw_all)
    img.save(path)


def card_png(path, lines):
    """黒地・游明朝（render.py の札と同じ作り）。lines = [(文字, サイズ, 上からの位置)]"""
    img = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(img)
    for text, size, cy in lines:
        f = ImageFont.truetype(FONT_MIN, size)
        for i, ln in enumerate(text.split("\n")):
            bb = d.textbbox((0, 0), ln, font=f)
            y = cy + i * int(size * 1.6)
            d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], y - (bb[3] - bb[1]) / 2 - bb[1]), ln, font=f, fill=(235, 230, 220))
    img.save(path)


def render_card(conf, work, out):
    c = conf["card"]
    if c.get("video"):                      # 作ってある動画（title_card.py motion）をそのまま札に
        import shutil
        shutil.copyfile(c["video"], out)
        return
    if c.get("image"):                      # 作ってある画像をそのまま札に
        png = c["image"]
    else:
        png = os.path.join(work, "card.png")
        card_png(png, [tuple(x) for x in c["lines"]])
    dur = c.get("sec", 5.0)
    fi, fo = c.get("fade_in", 0.6), c.get("fade_out", 0.7)
    vf = "format=yuv420p"
    if fi:
        vf = f"fade=t=in:st=0:d={fi}," + vf
    if fo:
        vf = f"fade=t=out:st={dur - fo:.2f}:d={fo}," + vf
    run(["ffmpeg", "-v", "warning", "-y", "-loop", "1", "-framerate", "30000/1001", "-i", png,
         "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", str(dur),
         "-vf", vf, *VCODEC, *ACODEC, "-shortest", out])


def default_render(c, png):
    if "title" in c:
        title_png(png, c["title"])
    elif "note" in c:
        note_png(png, c["note"])
    else:
        caption_png(png, c["orig"], c.get("trans", ""), h=c.get("h"))


def caption_track(caps, t0, total, work, tag, render=default_render, size=(W, H)):
    """字幕を時間で区切って1枚ずつ合成し、concat demuxer 用のリストを返す（入力は1本で済む）。
    caps の要素: {s,e, orig/trans | title | note, fade?, fade_out?}。fade は数コマに分けてアルファを上げる。
    render(c, png) で1枚を描く（画面サイズが違う動画は差し替える）。"""
    FR = 30000 / 1001
    blank = os.path.join(work, f"blank_{size[0]}x{size[1]}.png")
    if not os.path.exists(blank):
        Image.new("RGBA", size, (0, 0, 0, 0)).save(blank)
    items = []   # (開始, 終了, 画像パス, アルファ)
    for i, c in enumerate(caps):
        s0, e0 = max(0.0, c["s"] - t0), min(total, c["e"] - t0)
        if e0 <= s0:
            continue
        png = os.path.join(work, f"cap_{tag}_{i:02d}.png")
        render(c, png)
        fade, fout = c.get("fade", 0), c.get("fade_out", 0)
        body_s, body_e = s0 + fade, e0 - fout
        if fade:
            steps = max(2, int(round(fade * FR)))
            for k in range(steps):
                items.append((s0 + k * fade / steps, s0 + (k + 1) * fade / steps, png, (k + 1) / steps))
        items.append((body_s, body_e, png, 1.0))
        if fout:
            steps = max(2, int(round(fout * FR)))
            for k in range(steps):
                items.append((body_e + k * fout / steps, body_e + (k + 1) * fout / steps, png, 1 - (k + 1) / steps))
    # 区切り位置
    cuts = sorted({0.0, total} | {x for it in items for x in it[:2]})
    cuts = [round(c, 4) for c in cuts]
    lines, cache = [], {}
    for a, b in zip(cuts, cuts[1:]):
        if b - a < 1e-3:
            continue
        mid = (a + b) / 2
        active = tuple((it[2], it[3]) for it in items if it[0] <= mid < it[1])
        if not active:
            path = blank
        elif active in cache:
            path = cache[active]
        else:
            img = Image.new("RGBA", size, (0, 0, 0, 0))
            for png, alpha in active:
                layer = Image.open(png).convert("RGBA")
                if alpha < 1.0:
                    a_ch = layer.getchannel("A").point(lambda v: int(v * alpha))
                    layer.putalpha(a_ch)
                img.alpha_composite(layer)
            path = os.path.join(work, f"slice_{tag}_{len(cache):03d}.png")
            img.save(path)
            cache[active] = path
        lines.append(f"file '{path.replace(chr(92), '/')}'\nduration {b - a:.4f}\n")
    lines.append(f"file '{path.replace(chr(92), '/')}'\n")   # 最後の1枚（concat の作法）
    lst = os.path.join(work, f"caps_{tag}.txt")
    open(lst, "w", encoding="utf-8").write("".join(lines))
    return lst


def render_segment(seg, caps, work, out, tag):
    """seg: {video, audio(省略時 video), in, out, fade_in, fade_out, afade_in, afade_out, freeze}。
    caps: 字幕（絶対秒）。字幕は1本のスライドショー入力にまとめて重ねる"""
    t0, t1 = seg["in"], seg["out"]
    dur = t1 - t0
    freeze = seg.get("freeze", 0.0)          # 終わりのコマを止めて延ばす秒数（音は無音）
    total = dur + freeze
    video = seg["video"]
    audio = seg.get("audio", video)
    inputs = ["-ss", f"{t0:.3f}", "-t", f"{dur:.3f}", "-i", video]
    if audio != video:
        a0 = seg.get("audio_in", t0)       # 音だけ別の秒から取る（答えの画に拍手の続きを敷く等）
        inputs += ["-ss", f"{a0:.3f}", "-t", f"{dur:.3f}", "-i", audio]
    a_idx = 1 if audio != video else 0
    lst = caption_track(caps, t0, total, work, tag)
    c_idx = a_idx + 1
    inputs += ["-f", "concat", "-safe", "0", "-i", lst]
    logo = seg.get("logo")
    if logo:
        inputs += ["-i", logo]
    parts = []
    chain = "[0:v]"
    if seg.get("crop"):   # ヒキの原素材などを舞台に寄せて切り出す [w,h,x,y]
        w, h, x, y = seg["crop"]
        parts.append(f"{chain}crop={w}:{h}:{x}:{y},scale=1920:1080:flags=lanczos,setsar=1[vc]")
        chain = "[vc]"
    if freeze:
        parts.append(f"{chain}tpad=stop_mode=clone:stop_duration={freeze:.3f}[vf]")
        chain = "[vf]"
    parts.append(f"[{c_idx}:v]format=rgba,fps=30000/1001[caps]")
    parts.append(f"{chain}[caps]overlay=0:0:eof_action=pass[vo0]")
    if logo:
        parts.append(f"[vo0][{c_idx + 1}:v]overlay=0:0[vo]")
    else:
        parts.append("[vo0]null[vo]")
    fi, fo = seg.get("fade_in", 0.5), seg.get("fade_out", 0.8)
    afi, afo = seg.get("afade_in", fi), seg.get("afade_out", fo)
    vfade = f"fade=t=out:st={total - fo:.3f}:d={fo}," if fo else ""
    fic = seg.get("fade_in_color", "black")   # 白く飛んだ札から受けるときは white
    parts.append(f"[vo]fade=t=in:st=0:d={fi}:color={fic},{vfade}format=yuv420p[v]")
    gain = seg.get("gain_db", 0)             # 元の音が小さい素材（2021年の配信映像など）を持ち上げる
    gain_f = f"volume={gain}dB," if gain else ""
    parts.append(f"[{a_idx}:a]{gain_f}afade=t=in:st=0:d={afi},afade=t=out:st={dur - afo:.3f}:d={afo},apad=pad_dur={freeze:.3f},"
                 f"{LIMITER},pan=stereo|c0=c0|c1=c0[a]")
    sp = os.path.join(work, f"filter_{tag}.txt")
    open(sp, "w", encoding="utf-8").write(";\n".join(parts))
    run(["ffmpeg", "-v", "warning", "-y", *inputs, "-filter_complex_script", sp, "-map", "[v]", "-map", "[a]",
         *VCODEC, *ACODEC, "-t", f"{total:.3f}", out])


def preview(conf, work, at):
    """本編の at 秒（絶対秒）の確認画像を work/preview.png に"""
    seg = conf["main"]
    cap = next((c for c in conf["captions"] if c["s"] <= at < c["e"]), None)
    png = os.path.join(work, "preview_cap.png")
    caption_png(png, cap["orig"] if cap else "", cap.get("trans", "") if cap else "", h=cap.get("h") if cap else None)
    out = os.path.join(work, "preview.png")
    run(["ffmpeg", "-v", "warning", "-y", "-ss", f"{at:.3f}", "-i", seg["video"], "-i", png,
         "-filter_complex", "[0:v][1:v]overlay=0:0", "-frames:v", "1", "-update", "1", out])
    print(out)


def main():
    global VERT_TOP, NOTE_Y, NOTE_STYLE
    conf = json.load(open(sys.argv[1], encoding="utf-8"))
    VERT_TOP = conf.get("vert_top", VERT_TOP)
    NOTE_Y = conf.get("note_y", NOTE_Y)
    NOTE_STYLE = conf.get("note_style", NOTE_STYLE)
    work = os.path.join(os.path.dirname(os.path.abspath(sys.argv[1])), "_work", conf["name"])
    os.makedirs(work, exist_ok=True)
    if "--preview" in sys.argv:
        preview(conf, work, float(sys.argv[sys.argv.index("--preview") + 1]))
        return
    out_dir = conf["out_dir"]
    os.makedirs(out_dir, exist_ok=True)
    card = None
    if conf.get("card"):
        card = os.path.join(work, "card.mp4")
        render_card(conf, work, card)
    main_mp4 = os.path.join(work, "main.mp4")
    render_segment(conf["main"], conf["captions"], work, main_mp4, "main")
    order = []
    for i, pre in enumerate(conf.get("preroll", [])):   # OP の前に置く「つかみ」
        p = os.path.join(work, f"pre{i}.mp4")
        render_segment(pre, pre.get("captions", conf["captions"]), work, p, f"pre{i}")
        order.append(p)
    order += ([os.path.join(PARTS, "op.mp4")] if conf.get("op", True) else []) + ([card] if card else []) + [main_mp4]
    for i, ins in enumerate(conf.get("inserts", [])):
        p = os.path.join(work, f"insert{i}.mp4")
        render_segment(ins, ins.get("captions", []), work, p, f"ins{i}")
        order.append(p)
    order.append(os.path.join(PARTS, "ed.mp4"))
    lst = os.path.join(work, "concat.txt")
    with open(lst, "w", encoding="utf-8") as f:
        for p in order:
            f.write("file '" + p.replace("\\", "/") + "'\n")
    out = os.path.join(out_dir, conf["output"])
    run(["ffmpeg", "-v", "warning", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy",
         "-movflags", "+faststart", out])
    print("done", out, f"{duration(out):.1f}s")


if __name__ == "__main__":
    main()
