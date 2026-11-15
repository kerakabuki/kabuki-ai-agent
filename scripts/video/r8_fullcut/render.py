# -*- coding: utf-8 -*-
"""切り替え表と仕上げた音から、幕ごとの動画・タイトル札・全編を書き出す。

  python render.py acts            幕ごと（parts/第一幕.mp4 ...）
  python render.py cards           タイトル札（parts/card_*.mp4）と OP/ED の揃え直し
  python render.py concat          全編を結合（曽根崎心中_全編_v1.mp4）
  python render.py all
"""
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

from common import ACTS, WORK, hiki, yori

OUT = r"F:\260926気良歌舞伎\編集"
PARTS = os.path.join(OUT, "parts")
OPED = r"D:\気良歌舞伎\youtubeチャンネル用\OP・ED"
FONT = r"C:\Windows\Fonts\yumindb.ttf"   # 游明朝 Demibold（「幕が開くまで」と同じ書体）
VERSION = "v1"

VCODEC = ["-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "22", "-b:v", "12M",
          "-maxrate", "20M", "-bufsize", "24M", "-profile:v", "high", "-pix_fmt", "yuv420p",
          "-r", "30000/1001", "-video_track_timescale", "30000"]
ACODEC = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]
LIMITER = "alimiter=limit=0.891:attack=3:release=60:level=false"  # -1dB


def run(cmd):
    print(" ".join(c if " " not in c else f'"{c}"' for c in cmd[:12]), "...", flush=True)
    subprocess.run(cmd, check=True)


def duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def render_act(key, name):
    out = os.path.join(PARTS, f"{name}.mp4")
    if os.path.exists(out):
        print("skip", out)
        return
    edl = json.load(open(os.path.join(WORK, f"edl_{key}.json"), encoding="utf-8"))
    w, h, x, y = edl["crop"]
    hik = [s for s in edl["segments"] if s["src"] == "hiki"]
    enable = "+".join(f"between(t,{s['start'] - 0.001:.3f},{s['end'] - 0.001:.3f})" for s in hik)
    dur = duration(yori(name))
    script = (
        f"[0:v]crop={w}:{h}:{x}:{y},scale=1920:1080:flags=lanczos,setsar=1[w];\n"
        f"[1:v][w]overlay=0:0:enable='{enable}',fade=t=in:st=0:d=1,fade=t=out:st={dur - 1:.3f}:d=1[v];\n"
        f"[2:a]afade=t=in:st=0:d=1,afade=t=out:st={dur - 1:.3f}:d=1,{LIMITER},pan=stereo|c0=c0|c1=c0[a]\n"
    )
    sp = os.path.join(WORK, f"filter_{key}.txt")
    open(sp, "w", encoding="utf-8").write(script)
    run(["ffmpeg", "-v", "warning", "-y",
         "-hwaccel", "cuda", "-i", hiki(name),
         "-hwaccel", "cuda", "-i", yori(name),
         "-i", os.path.join(WORK, "audio", f"{key}_mix.wav"),
         "-filter_complex_script", sp, "-map", "[v]", "-map", "[a]",
         *VCODEC, *ACODEC, "-shortest", out])


def card_png(path, lines):
    """黒地に游明朝。lines = [(文字, サイズ, 上からの位置)]"""
    img = Image.new("RGB", (1920, 1080), (0, 0, 0))
    d = ImageDraw.Draw(img)
    for text, size, cy in lines:
        f = ImageFont.truetype(FONT, size)
        bb = d.textbbox((0, 0), text, font=f)
        d.text(((1920 - (bb[2] - bb[0])) / 2 - bb[0], cy - (bb[3] - bb[1]) / 2 - bb[1]), text, font=f, fill=(235, 230, 220))
    img.save(path)


CARDS = {
    "card_title": [("気良歌舞伎　令和八年公演", 56, 380), ("曽根崎心中", 150, 540), ("近松門左衛門 作", 44, 690)],
    "card_act1": [("第一場", 56, 480), ("生玉社前", 110, 600)],
    "card_act2": [("第二場", 56, 480), ("天満屋", 110, 600)],
    "card_act3": [("幕間映像『灯の螺旋』", 56, 450), ("第三場", 56, 560), ("曽根崎天神の森", 110, 680)],
    "card_kojo": [("口上", 110, 540)],
}


def render_cards():
    for name, lines in CARDS.items():
        png = os.path.join(WORK, f"{name}.png")
        card_png(png, lines)
        out = os.path.join(PARTS, f"{name}.mp4")
        run(["ffmpeg", "-v", "warning", "-y", "-loop", "1", "-framerate", "30000/1001", "-i", png,
             "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", "4",
             "-vf", "fade=t=in:st=0:d=0.6,fade=t=out:st=3.3:d=0.7,format=yuv420p",
             *VCODEC, *ACODEC, "-shortest", out])
    # OP/ED は盛綱陣屋リマスター（2026-09）と同じ最新版（2025-11 作成）。旧 気良歌舞伎オープニング.mp4／終了画面.mp4（2025-01）は使わない
    for src, dst in (("OPEnglish .mp4", "op.mp4"), ("ending.mp4", "ed.mp4")):
        run(["ffmpeg", "-v", "warning", "-y", "-i", os.path.join(OPED, src),
             "-vf", "scale=1920:1080,setsar=1,fps=30000/1001,format=yuv420p",
             "-af", "aresample=48000", *VCODEC, *ACODEC, os.path.join(PARTS, dst)])


def concat():
    order = ["op.mp4", "card_title.mp4", "card_act1.mp4", "第一幕.mp4", "card_act2.mp4", "第二幕.mp4",
             "card_act3.mp4", "第三幕.mp4", "card_kojo.mp4", "口上.mp4", "ed.mp4"]
    lst = os.path.join(WORK, "concat.txt")
    with open(lst, "w", encoding="utf-8") as f:
        for p in order:
            f.write("file '" + os.path.join(PARTS, p).replace("\\", "/") + "'\n")
    out = os.path.join(OUT, f"曽根崎心中_全編_{VERSION}.mp4")
    run(["ffmpeg", "-v", "warning", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy",
         "-movflags", "+faststart", out])
    print("done", out, f"{duration(out) / 60:.1f} min")


if __name__ == "__main__":
    os.makedirs(PARTS, exist_ok=True)
    what = sys.argv[1] if len(sys.argv) > 1 else "all"
    if what in ("cards", "all"):
        render_cards()
    if what in ("acts", "all"):
        for key, name in ACTS:
            if len(sys.argv) > 2 and key not in sys.argv[2:]:
                continue
            render_act(key, name)
    if what in ("concat", "all"):
        concat()
