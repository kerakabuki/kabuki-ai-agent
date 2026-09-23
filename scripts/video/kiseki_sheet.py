# 軌跡映像の検品シート: カット番号つきで1カット1枚を並べる（写真の差し替え相談用）
#
# 使い方（リポジトリルートから）:
#   node scripts/video/kiseki_build.mjs x --list > "D:/…/軌跡/カット一覧.txt"
#   python scripts/video/kiseki_sheet.py "D:/…/軌跡/気良歌舞伎の軌跡_v3.mp4" "D:/…/軌跡/カット一覧.txt" "D:/…/軌跡/検品" 18.63
#                                        映像                              カット一覧            出力先         OPの尺（秒・なければ0）
import sys, os, re, subprocess, glob
import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont

VIDEO, LIST, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
OFFSET = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(os.path.join(OUT, '*.jpg')):
    os.remove(f)

# カット一覧を読む: "07  0:30  4.8s  ［昭和二十五年］西気良…  ←  歴史資料/…png"
cuts, t = [], OFFSET
for line in open(LIST, encoding='utf-8'):
    m = re.match(r'^(\d\d)\s+\d+:\d\d\s+([\d.]+)s\s+(.*)$', line.rstrip())
    if not m:
        continue
    n, dur, what = m.group(1), float(m.group(2)), m.group(3)
    cuts.append((n, t, dur, what))
    t += dur

# 各カットの真ん中のフレームを抜く
for n, start, dur, what in cuts:
    at = start + dur / 2
    dst = os.path.join(OUT, f'{n}.jpg')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{at:.2f}', '-i', VIDEO,
                    '-frames:v', '1', '-vf', 'scale=640:-1', dst], check=True)

# 4列に並べてカット番号と中身を焼き込む
COLS, CW, LAB = 4, 460, 52
font = ImageFont.truetype('C:/Windows/Fonts/meiryo.ttc', 17)
big = ImageFont.truetype('C:/Windows/Fonts/meiryo.ttc', 26)
cells = []
for n, start, dur, what in cuts:
    p = os.path.join(OUT, f'{n}.jpg')
    img = cv2.imdecode(np.fromfile(p, dtype=np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        continue
    h, w = img.shape[:2]
    label = what.split('  ←  ')[0]
    src = (what.split('  ←  ')[1] if '  ←  ' in what else '')
    cells.append((n, f'{start:.0f}s', label, src.split('/')[-1], cv2.resize(img, (CW, int(h * CW / w)))))

PER = COLS * 6                      # 1枚のシートに24カット
for s in range((len(cells) + PER - 1) // PER):
    part = cells[s * PER:(s + 1) * PER]
    rows = (len(part) + COLS - 1) // COLS
    rh = [max([c[4].shape[0] for c in part[r * COLS:(r + 1) * COLS]] or [0]) + LAB for r in range(rows)]
    sheet = np.zeros((sum(rh), COLS * CW, 3), np.uint8)
    marks, y = [], 0
    for r in range(rows):
        for c, (n, at, label, src, img) in enumerate(part[r * COLS:(r + 1) * COLS]):
            x = c * CW
            sheet[y + LAB:y + LAB + img.shape[0], x:x + CW] = img
            marks.append((x + 6, y + 2, n, at, label, src))
        y += rh[r]
    pil = Image.fromarray(cv2.cvtColor(sheet, cv2.COLOR_BGR2RGB))
    d = ImageDraw.Draw(pil)
    for x, yy, n, at, label, src in marks:
        d.text((x, yy), n, font=big, fill=(255, 220, 90))
        d.text((x + 44, yy + 3), f'{at}  {label[:26]}', font=font, fill=(255, 255, 255))
        d.text((x + 44, yy + 25), src[:44], font=font, fill=(150, 150, 150))
    out = os.path.join(OUT, f'検品シート{s + 1:02d}.jpg')
    pil.save(out, quality=80)
    print(out)
print(f'{len(cells)}カット / OPのぶん {OFFSET}秒 を足して抜いた')
