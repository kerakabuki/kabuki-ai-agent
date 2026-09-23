# -*- coding: utf-8 -*-
"""灯の螺旋 v21 レンダラー（第三幕直前の投影映像・2560×800・30fps）

Codex が作った構成JSON（全カット構成_v32.json / OP構成_v9.json）を正本にして、
映像トラックを丸ごと描き直す。音声トラックは v20 の mp4 からそのままコピーする。

v20 からの変更点（2026-09-22 会場実機の所見を反映）
  - 左パネルの文字を拡大（本文 52→76px 基準、幅 880px に収まらない行は自動縮小・折返し）
  - OP を 2560×800 でネイティブに描画（レターボックス解消・ロゴ拡大・三段組拡大）
  - 公演実績ロールの右下（演目名・写真クレジット）を上げ、下限を y=720 に
  - 写真に「呼吸」（寄り／引き 4.5%）、昭和十五年の絵はカメラパン、テロップは浮き上がって入る
  - 18.6〜22.4 秒の白フェードと終幕に「灯の螺旋」の粒子

使い方（リポジトリルートから）
  python scripts/video/tomoshibi_v21.py --dry            # カット表と文字サイズの確認
  python scripts/video/tomoshibi_v21.py --sample         # 代表フレームを JPG で書き出し
  python scripts/video/tomoshibi_v21.py --range 15 30    # 区間だけ mp4 に（確認用・無音）
  python scripts/video/tomoshibi_v21.py --render         # 全編（音声は v20 をコピー）
"""
import argparse
import bisect
import hashlib
import json
import math
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(r'D:\気良歌舞伎\台本\曽根崎心中\output\軌跡\Codex検品_20260921')
PLAN = ROOT / '最新動画案_公演実績ロール_20260921' / '全カット構成_v32.json'
OPJ = ROOT / '冒頭演出案_20260921' / 'OP構成_v9.json'
FIELD = ROOT / '現場投影テスト_20260921'
BASE = FIELD / '気良歌舞伎_灯し火の螺旋_現場投影テスト_v20.mp4'
VER = 'v21'
OUT = FIELD / f'気良歌舞伎_灯し火の螺旋_現場投影テスト_{VER}.mp4'
QA = FIELD / f'{VER}_検品'

W, H, FPS = 2560, 800, 30
TOTAL = 528.2
LEFT, RIGHT = (0, 0, 1280, 800), (1280, 0, 2560, 800)
LEFT_SAFE, LCX = (350, 1230), 790      # 会場で見える範囲（第三幕 v26 と同じ基準）
RIGHT_SAFE, RCX = (1280, 2320), 1800
BOTTOM_LIMIT = 720                     # 会場でロール右下が見切れた → 文字はここまで
PHOTO_BOX = (1320, 30, 2520, 738)      # 通常カットの写真枠（contain）
ROLL_BOX = (1320, 30, 2520, 616)       # ロール中の写真枠（下の文字を上げるため詰める）
ROLL_TITLE_Y, ROLL_CREDIT_Y = 628, 682
ROLL_VIEW = (350, 32, 880, 688)        # 左のスクロール窓 x,y,w,h（下端は見える範囲 720 まで。Codex v7 は 736 高）
OP_PHOTO_BOX = (1331, 32, 2509, 768)   # OP の右写真（4% 余白）

FONT_B = r'C:\Windows\Fonts\yumindb.ttf'   # 游明朝 Demibold（Codex と同じ）
FONT_M = r'C:\Windows\Fonts\meiryob.ttc'   # メイリオ Bold（OP 三段組）
FONT_K = r'C:\Windows\Fonts\FGCCPKAI_new.TTC'  # CP CORPUS 毛筆楷書（第三幕の詞章と同じ。投影焼き込み可）
QUOTE_SIZE = 96
COL_BODY, COL_LEAD, COL_CREDIT, COL_RED, COL_GOLD = '#f3efe5', '#e4c792', '#d8d1c5', '#ef6658', '#eacb8d'

BODY_TARGET, CARD_TARGET, BODY_FLOOR, LEFT_MAXW = 76, 84, 58, 860
LEAD_SIZE, CREDIT_SIZE = 50, 38
# 第三幕OBS v31 で OP に焼き込まれた修正（OP_終演後テロップ.ass）。構成JSONには未反映なのでここで上書きする。
LEAD_OVERRIDES = {52: ['終演後……', '新世代から声があがる']}
KB_AMOUNT = 0.045                      # 写真の呼吸（4.5%）。contain のときは 1.0 を超えないので端は絶対に切れない
COVER_MAX_CROP = 0.10                  # 右パネル全面に敷くとき、縦横どちらかの切れがこの割合までなら全面（cover）にする

model = json.loads(PLAN.read_text(encoding='utf-8'))
op = json.loads(OPJ.read_text(encoding='utf-8'))
cuts = sorted(model['cuts'], key=lambda c: c['start'])


def retime(seg, a, b):
    """区間 [a,b] にカット列 seg を詰め直す。札は元の長さを保ち、写真は元の長さに比例して配分。"""
    cards = [c for c in seg if c['kind'] == 'card']
    photos = [c for c in seg if c['kind'] != 'card']
    if not photos:                                     # 札だけの区間は札も比例配分
        cards, photos = [], seg
    fixed = sum(c['end'] - c['start'] for c in cards)
    share = (b - a - fixed) / sum(c['end'] - c['start'] for c in photos)
    t = a
    for c in seg:
        old_start, old_dur = c['start'], c['end'] - c['start']
        dur = old_dur if c in cards else old_dur * share
        c['start'], c['end'], c['duration'] = round(t, 3), round(t + dur, 3), round(dur, 3)
        for s in c.get('photo_sequence') or []:          # 連続写真の内側の時刻も同じ比率で
            s['start'] = round(c['start'] + (s['start'] - old_start) * dur / old_dur, 3)
            s['end'] = round(c['start'] + (s['end'] - old_start) * dur / old_dur, 3)
        t += dur
    seg[-1]['end'] = round(b, 3)


def apply_timeline(tl):
    """構成の組み替え: remove で外し、insert_after で差し込み、refit の区間を詰め直す。"""
    by = {c['number']: c for c in cuts}
    moving = [by[n] for n in tl.get('remove', [])]
    for c in moving:
        cuts.remove(c)
    for after, nums in tl.get('insert_after', {}).items():
        anchor = by[int(after)]
        idx = cuts.index(anchor)
        for k, n in enumerate(nums):
            by[n]['chapter'] = anchor['chapter']
            by[n].pop('transition_in', None)
            cuts.insert(idx + 1 + k, by[n])
    for spec in tl.get('add', []):                       # 新しい札（近松の引用など）。時刻は refit で決まる
        c = {'number': spec['number'], 'kind': spec.get('kind', 'card'), 'chapter': spec.get('chapter', 7),
             'lines': spec.get('lines', []), 'lead': spec.get('lead', ''), 'credit': spec.get('credit', []),
             'source': None, 'start': 0.0, 'end': float(spec['duration']), 'duration': float(spec['duration']),
             'note': spec.get('note', '')}
        if 'right_lines' in spec:
            c['right_title'] = {'lead': '', 'lines': spec['right_lines']}
        if 'transition' in spec:
            c['transition_in'] = {'type': spec['transition'][0], 'seconds': float(spec['transition'][1])}
        by[c['number']] = c
        moving.append(c)
        cuts.insert(cuts.index(by[int(spec['after'])]) + 1, c)
    for a, b in tl.get('refit', []):
        i0 = next(i for i, c in enumerate(cuts) if c not in moving and abs(c['start'] - a) < 1e-6)
        try:                                              # 区間の終わり＝b から始まる（動かしていない）カットの直前まで
            i1 = next(i for i, c in enumerate(cuts) if c not in moving and abs(c['start'] - b) < 1e-6) - 1
        except StopIteration:
            i1 = len(cuts) - 1
        retime(cuts[i0:i1 + 1], a, b)
    for num, t in sorted(tl.get('set_starts', {}).items(), key=lambda kv: float(kv[1])):   # 拍に合わせた開始時刻
        c = by[int(num)]
        idx = cuts.index(c)
        prev = cuts[idx - 1]
        c['start'] = float(t)
        prev['end'] = float(t)
        c['duration'] = round(c['end'] - c['start'], 3)
        prev['duration'] = round(prev['end'] - prev['start'], 3)
    for i in range(1, len(cuts)):
        assert abs(cuts[i]['start'] - cuts[i - 1]['end']) < 1e-3, (cuts[i - 1]['number'], cuts[i]['number'])


def apply_captions(path):
    """テロップ差し替え JSON（番号 → lead/lines/credit/right_lines、_timeline で組み替え）を構成に重ねる。"""
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    if data.get('_timeline'):
        apply_timeline(data['_timeline'])
    if data.get('_roll_extra'):                          # 公演実績ロールを一演目2枚に
        rc = next(c for c in cuts if c['kind'] == 'roll')
        extra = data['_roll_extra']['photos']
        photos = []
        for ph in rc['photos']:
            photos.append(ph)
            if ph['key'] in extra:
                second = dict(ph)
                second['source'] = extra[ph['key']]
                photos.append(second)
        rc['photos'] = photos
    by_number = {c['number']: c for c in cuts}
    n = 0
    for key, o in data.items():
        if not key.isdigit():
            continue
        c = by_number[int(key)]
        for f in ('lead', 'lines', 'credit', 'fit', 'line_beats', 'beat_photos'):
            if f in o:
                c[f] = o[f]
        if 'right_lines' in o:
            c['right_title']['lines'] = o['right_lines']
        if 'transition' in o:                      # 例: ["fade", 0.8] — 音楽の入りに札を合わせる等
            c['transition_in'] = {'type': o['transition'][0], 'seconds': float(o['transition'][1])}
        n += 1
    return n


_ci = [i for i, a in enumerate(sys.argv) if a == '--captions']
if _ci:
    print('テロップ差し替え:', apply_captions(sys.argv[_ci[0] + 1]), 'カット', flush=True)
starts = [c['start'] for c in cuts]
assert abs(model['total_seconds'] - TOTAL) < 1e-6
WHITE = model['white_transition']
OP_END = cuts[0]['end']                                  # 18.633…
REVEAL_END = WHITE['showa_reveal_complete']              # 25.9

# ---------------------------------------------------------------- 基本部品
_fonts = {}


def font(path, size, index=0):
    key = (path, size, index)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(path, size, index=index)
    return _fonts[key]


def width(text, f):
    return f.getlength(text)


def smooth(a):
    a = 0.0 if a < 0 else 1.0 if a > 1 else a
    return a * a * (3 - 2 * a)


def clamp01(a):
    return 0.0 if a < 0 else 1.0 if a > 1 else a


BLACK = Image.new('RGB', (W, H), 'black')
BLACK_L = Image.new('RGB', (1280, H), 'black')
BLACK_R = Image.new('RGB', (1280, H), 'black')
WHITE_IMG = Image.new('RGB', (W, H), 'white')


def split_line(s):
    """句読点の直後を優先して 2 行に分ける。"""
    best = None
    for i in range(2, len(s) - 1):
        if s[i - 1] in '、。，・　 ' or s[i] in '「『':
            if best is None or abs(i - len(s) / 2) < abs(best - len(s) / 2):
                best = i
    if best is None:
        best = len(s) // 2
    return [s[:best], s[best:]]


def fit_block(lines, target, floor, maxw, path=FONT_B):
    lines = list(lines)
    size = target
    for _ in range(4):
        size = target
        while size > floor and max(width(l, font(path, size)) for l in lines) > maxw:
            size -= 2
        if max(width(l, font(path, size)) for l in lines) <= maxw:
            return lines, size
        k = max(range(len(lines)), key=lambda n: width(lines[n], font(path, size)))
        lines[k:k + 1] = split_line(lines[k])
    return lines, size


def draw_blocks(im, blocks, cx, cy):
    """blocks=[(text, font, color, line_height)] を cy を中心に縦積み。"""
    d = ImageDraw.Draw(im)
    total = sum(b[3] for b in blocks)
    y = cy - total / 2
    boxes = []
    for text, f, col, hgt in blocks:
        if f is not None and text:
            d.text((cx, y + hgt / 2), text, font=f, fill=col, anchor='mm')
            boxes.append(d.textbbox((cx, y + hgt / 2), text, font=f, anchor='mm'))
        y += hgt
    return boxes


# ---------------------------------------------------------------- 左パネルの文字
_left_layers = {}
_left_info = {}


def lead_lines(c):
    lead = LEAD_OVERRIDES.get(c['number'], c.get('lead') or '')
    return lead if isinstance(lead, list) else ([lead] if lead else [])


def left_blocks(c):
    """(小見出しブロック, 本文ブロック, size, lines)。小見出しは別レイヤーにして連続カットで保持できるようにする。"""
    n = c['number']
    lines = list(c.get('lines') or [])
    leads = lead_lines(c)
    credit = list(c.get('credit') or [])
    blocks = []
    if c['kind'] == 'quote':                             # 近松の詞章（第三幕の投影と同じ毛筆楷書）
        blocks.append((lines[0], font(FONT_K, QUOTE_SIZE), COL_BODY, 150))
        return [], blocks, QUOTE_SIZE, lines
    if n in (60, 61):                                   # 「曽根崎心中」の題名カード
        blocks.append((lines[0], font(FONT_B, 96), COL_BODY, 150))
        blocks.append(('', None, None, 16))
        blocks += [(l, font(FONT_B, 40), COL_CREDIT, 60) for l in credit]
        return [], blocks, 96, lines
    if n == 62:                                          # 気良歌舞伎の新世代 × AI・デジタル
        blocks.append((lines[0], font(FONT_B, 72), COL_BODY, 110))
        blocks.append((lines[1], font(FONT_B, 56), COL_GOLD, 90))
        blocks.append((lines[2], font(FONT_B, 76), COL_RED, 112))
        return [], blocks, 72, lines
    target = CARD_TARGET if c['kind'] == 'card' else BODY_TARGET
    size = target
    if lines:
        lines, size = fit_block(lines, target, BODY_FLOOR, LEFT_MAXW)
    lead_blocks = [(l, font(FONT_B, LEAD_SIZE), COL_LEAD, 66) for l in leads]
    blocks += [(l, font(FONT_B, size), COL_BODY, round(size * 1.42)) for l in lines]
    if credit:
        blocks.append(('', None, None, 16))
        blocks += [(l, font(FONT_B, CREDIT_SIZE), COL_CREDIT, 56) for l in credit]
    return lead_blocks, blocks, size, lines


LEAD_Y = 272                      # 小見出しの固定位置（連続カットで保持するため、本文の高さに依らない）
BODY_Y, BODY_Y_WITH_LEAD = 400, 442


def left_layer(i):
    """カット i の左テロップ (小見出しRGBA, 本文RGBA) を返す（キャッシュ）。無い側は None。"""
    if i in _left_layers:
        return _left_layers[i]
    c = cuts[i]
    lead_blocks, blocks, size, lines = left_blocks(c)
    lead_im = body_im = None
    boxes = []
    if lead_blocks:
        lead_im = Image.new('RGBA', (1280, H), (0, 0, 0, 0))
        boxes += draw_blocks(lead_im, lead_blocks, LCX, LEAD_Y)
    if any(b[1] is not None for b in blocks):
        body_im = Image.new('RGBA', (1280, H), (0, 0, 0, 0))
        total = sum(b[3] for b in blocks)
        if lead_blocks:
            lead_bottom = LEAD_Y + sum(b[3] for b in lead_blocks) / 2
            cy = max(BODY_Y_WITH_LEAD, lead_bottom + 22 + total / 2)
        else:
            cy = BODY_Y
        boxes += draw_blocks(body_im, blocks, LCX, cy)
        if c.get('line_beats'):                            # 行ごとに別レイヤー（拍に合わせて1行ずつ出す）
            per_line = []
            body_idx = [k for k, b in enumerate(blocks) if b[1] is not None and b[2] == COL_BODY]
            for j, bi in enumerate(body_idx):
                im = Image.new('RGBA', (1280, H), (0, 0, 0, 0))
                only = [(b if k == bi or b[2] != COL_BODY else ('', None, None, b[3])) for k, b in enumerate(blocks)]
                if j:                                        # 補助行は最初の行のレイヤーにだけ
                    only = [(b if k == bi else ('', None, None, b[3])) for k, b in enumerate(blocks)]
                draw_blocks(im, only, LCX, cy)
                per_line.append(im)
            _line_layers[i] = per_line
    _left_layers[i] = (lead_im, body_im)
    _left_info[i] = (size, lines, boxes)
    return _left_layers[i]


_line_layers = {}


def same_left(i, j):
    a, b = cuts[i], cuts[j]
    return (a.get('lines'), a.get('lead'), a.get('credit')) == (b.get('lines'), b.get('lead'), b.get('credit'))


def same_lead(i, j):
    return bool(lead_lines(cuts[i])) and lead_lines(cuts[i]) == lead_lines(cuts[j])


def paste_left(frame, layer, k=1.0, dy=0):
    if layer is None or k <= 0:
        return
    alpha = layer.getchannel('A')
    if k < 1:
        alpha = alpha.point(lambda v: int(v * k))
    frame.paste(layer, (0, int(round(dy))), alpha)


def compose_left(i, t, k=1.0, dy=0, lead_k=None):
    """左パネルだけ（RGB 1280×800）。lead_k を指定すると小見出しの不透明度を本文と別にできる。"""
    panel = Image.new('RGB', (1280, H), 'black')
    c = cuts[i]
    if c['kind'] == 'roll':
        return roll_frame(t, k).crop(LEFT)
    lead_im, body_im = left_layer(i)
    if c.get('line_beats') and i in _line_layers:
        for layer, beat in zip(_line_layers[i], c['line_beats']):
            kk = smooth((t - float(beat)) / 0.12) * (k if k < 1 else 1)
            paste_left(panel, layer, kk, 8 * (1 - kk))
    else:
        paste_left(panel, body_im, k, dy)
    paste_left(panel, lead_im, k if lead_k is None else lead_k, 0)
    return panel


# ---------------------------------------------------------------- 写真
_photos = {}


def load_photo(path, box):
    key = (str(path), box)
    if key in _photos:
        return _photos[key]
    with Image.open(path) as raw:
        im = ImageOps.exif_transpose(raw).convert('RGB')
    bw, bh = box[2] - box[0], box[3] - box[1]
    im.thumbnail((round(bw * 1.3), round(bh * 1.3)), Image.Resampling.LANCZOS)
    _photos[key] = im
    return im


def place_photo(frame, im, box, scale=1.0, drift=(0.0, 0.0), cover=False):
    """box に contain（cover=True なら箱いっぱいに敷き、はみ出しは切る）。scale<=1 なら contain は絶対に切れない。"""
    bw, bh = box[2] - box[0], box[3] - box[1]
    fit = (max if cover else min)(bw / im.width, bh / im.height)
    s = fit * scale
    w, h = max(1, round(im.width * s)), max(1, round(im.height * s))
    resized = im.resize((w, h), Image.Resampling.BICUBIC)
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    x = round(cx - w / 2 + drift[0] * (bw - w) / 2)
    y = round(cy - h / 2 + drift[1] * (bh - h) / 2)
    x0, y0 = max(x, box[0]), max(y, box[1])
    x1, y1 = min(x + w, box[2]), min(y + h, box[3])
    if x1 > x0 and y1 > y0:
        frame.paste(resized.crop((x0 - x, y0 - y, x1 - x, y1 - y)), (x0, y0))


def breathe(i, p):
    e = smooth(p)
    return 1.0 - KB_AMOUNT + KB_AMOUNT * e if i % 2 == 0 else 1.0 - KB_AMOUNT * e


PAN_CUTS = {3, 4, 5}                     # 昭和十五年の絵（記録画）はカメラが渡る


def pan_args(im, box, p):
    bw, bh = box[2] - box[0], box[3] - box[1]
    fit = min(bw / im.width, bh / im.height) * 1.12
    w, h = im.width * fit, im.height * fit
    e = smooth(p)
    d = -1 + 2 * e
    return 1.12, ((d, 0.0) if (w - bw) >= (h - bh) else (0.0, d))


def auto_fit(im):
    """右パネル(1280×800)に対して、切れが COVER_MAX_CROP 以下なら cover、それ以上（縦長など）なら contain。"""
    panel = 1280 / 800
    ratio = im.width / im.height
    crop = 1 - panel / ratio if ratio > panel else 1 - ratio / panel
    return 'cover' if crop <= COVER_MAX_CROP else 'contain'


def fit_mode(c, im):
    f = c.get('fit')
    return f if f in ('cover', 'contain') else auto_fit(im)


def draw_photo(panel, im, box, i, p, mode):
    """呼吸つきで写真を置く。cover は 1.0→1.045 で寄る（切れが増える側）、contain は 0.955→1.0（絶対に切れない）。"""
    if mode == 'cover':
        e = smooth(p)
        scale = 1.0 + KB_AMOUNT * e if i % 2 == 0 else 1.0 + KB_AMOUNT * (1 - e)
        place_photo(panel, im, box, scale, cover=True)
    else:
        place_photo(panel, im, box, breathe(i, p))


def photo_source_at(c, t):
    seq = c.get('photo_sequence')
    if seq:
        for k, s in enumerate(seq):
            if s['start'] <= t < s['end'] or k == len(seq) - 1:
                return s['source'], k, s['start'], (seq[k - 1]['source'] if k else None)
    return c.get('source'), 0, c['start'], None


def beat_photo_at(c, t):
    """beat_photos=[{source,t},…] から時刻 t の写真と、その区間の始まり・直前の写真を返す。"""
    seq = c['beat_photos']
    k = max([n for n, e in enumerate(seq) if float(e['t']) <= t + 1e-6] or [0])
    cur = seq[k]
    nxt_t = float(seq[k + 1]['t']) if k + 1 < len(seq) else c['end']
    prev = seq[k - 1]['source'] if k else None
    return cur['source'], float(cur['t']), nxt_t, prev


def right_photo(i, t, box=PHOTO_BOX):
    """カット i の右パネル（写真＋呼吸）。RGB 1280×800。"""
    c = cuts[i]
    panel = Image.new('RGB', (W, H), 'black')
    if c.get('beat_photos'):                              # 拍ごとに写真を替える（稽古の連打など）
        src, seg_start, seg_end, prev_src = beat_photo_at(c, t)
        p = clamp01((t - seg_start) / max(0.3, seg_end - seg_start))
        im = load_photo(src, RIGHT)
        draw_photo(panel, im, RIGHT, i + int(seg_start * 10), p, fit_mode(c, im))
        right = panel.crop(RIGHT)
        if prev_src and t - seg_start < 0.12:
            pp = Image.new('RGB', (W, H), 'black')
            pim = load_photo(prev_src, RIGHT)
            draw_photo(pp, pim, RIGHT, i, 1.0, fit_mode(c, pim))
            right = Image.blend(pp.crop(RIGHT), right, smooth((t - seg_start) / 0.12))
        return right
    src, k, seg_start, prev_src = photo_source_at(c, t)
    if not src:
        return panel.crop(RIGHT)
    dur = c['end'] - c['start']
    p = clamp01((t - c['start']) / dur)
    box = RIGHT                                           # 右パネルいっぱいに使う（会場の要望：右は写真を大きく）
    im = load_photo(src, box)
    if c['number'] in PAN_CUTS:
        scale, drift = pan_args(im, box, p)
        place_photo(panel, im, box, scale, drift)
    else:
        draw_photo(panel, im, box, i, p, fit_mode(c, im))
    right = panel.crop(RIGHT)
    if prev_src and t - seg_start < 1.0:                 # 連続写真の中の 1 秒クロスフェード
        prev_panel = Image.new('RGB', (W, H), 'black')
        pim = load_photo(prev_src, box)
        draw_photo(prev_panel, pim, box, i, 1.0, fit_mode(c, pim))
        right = Image.blend(prev_panel.crop(RIGHT), right, smooth((t - seg_start) / 1.0))
    return right


# ---------------------------------------------------------------- 公演実績ロール
roll_cut = next(c for c in cuts if c['kind'] == 'roll')
ROLL_I = cuts.index(roll_cut)
RX, RY, RVW, RVH = ROLL_VIEW
_roll = {}


def roll_assets():
    if _roll:
        return _roll
    strip = Image.new('RGB', (RVW, roll_cut['roll_height']), 'black')
    d = ImageDraw.Draw(strip)
    for ln in roll_cut['roll_lines']:
        d.text((0, ln['y']), ln['text'], font=font(FONT_B, ln['size']), fill=ln['color'], anchor='lt')
    mask = Image.new('L', (RVW, RVH), 255)
    md = ImageDraw.Draw(mask)
    for yy in range(16):
        a = round(255 * yy / 15)
        md.line((0, yy, RVW, yy), fill=a)
        md.line((0, RVH - 1 - yy, RVW, RVH - 1 - yy), fill=a)
    photos = []
    for p in roll_cut['photos']:
        photos.append((load_photo(p['source'], RIGHT), p))
    _roll.update(strip=strip, mask=mask, photos=photos)
    return _roll


def roll_photo_seconds():
    return roll_cut['duration'] / len(roll_cut['photos'])


_roll_shade = None


def roll_shade():
    """ロールの写真の下端に敷く影（文字を読ませるため）。RGBA 1280×280、下へ行くほど濃い。"""
    global _roll_shade
    if _roll_shade is None:
        h = 280
        alpha = np.clip((np.arange(h, dtype=np.float32) / h) ** 1.3 * 215, 0, 215).astype(np.uint8)
        a = np.repeat(alpha[:, None], 1280, axis=1)
        _roll_shade = Image.fromarray(np.dstack([np.zeros((h, 1280, 3), np.uint8), a]), 'RGBA')
    return _roll_shade


def roll_right(idx, local):
    a = roll_assets()
    im, p = a['photos'][min(idx, len(a['photos']) - 1)]
    panel = Image.new('RGB', (W, H), 'black')
    draw_photo(panel, im, RIGHT, idx, clamp01(local / roll_photo_seconds()), fit_mode(p, im))
    right = panel.crop(RIGHT)
    shade = roll_shade()
    right.paste(shade, (0, H - shade.height), shade)
    d = ImageDraw.Draw(right)
    size = 42
    while width(p['caption_title'], font(FONT_B, size)) > 1000:
        size -= 1
    d.text((40, ROLL_TITLE_Y), p['caption_title'], font=font(FONT_B, size), fill='white', anchor='lt')
    for n, line in enumerate(p['photo_credit']):
        d.text((40, ROLL_CREDIT_Y + n * 34), line, font=font(FONT_B, 30), fill=COL_CREDIT, anchor='lt')
    return right


def roll_frame(t, k=1.0):
    a = roll_assets()
    local = t - roll_cut['start']
    dur = roll_cut['duration']
    frame = Image.new('RGB', (W, H), 'black')
    offset = RVH - (a['strip'].height + RVH) * local / dur
    view = a['strip'].transform((RVW, RVH), Image.Transform.AFFINE, (1, 0, 0, 0, 1, -offset),
                                resample=Image.Resampling.BICUBIC, fillcolor='black')
    mask = a['mask'] if k >= 1 else a['mask'].point(lambda v: int(v * k))
    frame.paste(view, (RX, RY), mask)
    sec = roll_photo_seconds()
    idx = min(len(roll_cut['photos']) - 1, int(local // sec))
    right = roll_right(idx, local - idx * sec)
    if idx and local - idx * sec < 0.5:                 # 写真の切替は 0.5 秒だけフェード
        right = Image.blend(roll_right(idx - 1, sec), right, smooth((local - idx * sec) / 0.5))
    frame.paste(right, (1280, 0))
    return frame


# ---------------------------------------------------------------- 灯の粒子
_rng = np.random.default_rng(7)


def glow_sprite(radius):
    r = int(radius)
    y, x = np.mgrid[-r:r + 1, -r:r + 1]
    g = np.exp(-(x * x + y * y) / (2 * (radius / 2.2) ** 2)).astype(np.float32)
    return g


_sprites = {r: glow_sprite(r) for r in range(5, 19)}
N_SPIRAL, ARMS = 210, 3                # 三本の腕を持つ渦。外側ほど角度が進んでいるので腕が曲がって見える
spiral_birth = _rng.uniform(0.0, 1.2, N_SPIRAL)
spiral_r0 = _rng.uniform(120, 380, N_SPIRAL)
spiral_th = _rng.integers(0, ARMS, N_SPIRAL) * (2 * math.pi / ARMS) + _rng.normal(0, 0.10, N_SPIRAL) \
    + 1.4 * math.pi * (spiral_r0 / 380)
spiral_sz = _rng.integers(6, 16, N_SPIRAL)
SPIRAL_LIFE = 2.3
N_RISE = 70
rise_x = _rng.uniform(RIGHT_SAFE[0] + 80, RIGHT_SAFE[1] - 80, N_RISE)
rise_phase = _rng.uniform(0, 2 * math.pi, N_RISE)
rise_speed = _rng.uniform(40, 72, N_RISE)
rise_y0 = _rng.uniform(H + 10, H + 140, N_RISE)
rise_sz = _rng.integers(5, 12, N_RISE)
LIGHT = np.array([1.0, 0.80, 0.50], np.float32)          # 灯りの色（暖色）
N_STAR = 70                                             # 昇った灯が落ち着いて星になる（第三場の星空へ）
star_x = _rng.uniform(RIGHT_SAFE[0] + 60, RIGHT_SAFE[1] - 60, N_STAR)
star_y = _rng.uniform(40, 380, N_STAR)
star_ph = _rng.uniform(0, 2 * math.pi, N_STAR)
star_sz = _rng.integers(5, 9, N_STAR)


def star_points(t, env):
    if env <= 0:
        return []
    return [(star_x[n], star_y[n], env * (0.22 + 0.16 * math.sin(1.7 * t + star_ph[n])), star_sz[n]) for n in range(N_STAR)]


def add_lights(frame, points, gain=1.0):
    """points=[(x,y,intensity,size)] を加算合成。"""
    if not points:
        return frame
    arr = np.asarray(frame).astype(np.float32)
    for x, y, inten, sz in points:
        sp = _sprites[int(sz)]
        r = sp.shape[0] // 2
        xi, yi = int(round(x)), int(round(y))
        x0, y0, x1, y1 = xi - r, yi - r, xi + r + 1, yi + r + 1
        sx0, sy0 = max(0, -x0), max(0, -y0)
        cx0, cy0, cx1, cy1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
        if cx1 <= cx0 or cy1 <= cy0:
            continue
        patch = sp[sy0:sy0 + (cy1 - cy0), sx0:sx0 + (cx1 - cx0)]
        arr[cy0:cy1, cx0:cx1, :] += patch[:, :, None] * (255 * inten * gain) * LIGHT[None, None, :]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def spiral_points(tau):
    pts = []
    for cx, cy in ((LCX, 400), (RCX, 400)):
        p = np.clip((tau - spiral_birth) / SPIRAL_LIFE, 0, 1)
        alive = (p > 0) & (p < 1)
        r = spiral_r0 * (1 - 0.92 * p ** 1.15)
        th = spiral_th + 2.2 * math.pi * p
        xs = cx + r * np.cos(th)
        ys = cy + 0.82 * r * np.sin(th) - 40 * p
        inten = np.minimum(1, p / 0.15) * (1 - 0.35 * p)
        for n in np.nonzero(alive)[0]:
            pts.append((xs[n], ys[n], float(inten[n]) * 0.85, spiral_sz[n]))
    return pts


def rise_points(tau, env):
    pts = []
    for n in range(N_RISE):
        y = rise_y0[n] - rise_speed[n] * tau
        x = rise_x[n] + 18 * math.sin(rise_phase[n] + tau * 0.9)
        if 0 <= y < H:
            fade = min(1.0, (H - y) / 120) * max(0.0, y / 260)
            pts.append((x, y, 0.55 * fade * env, rise_sz[n]))
    return pts


# ---------------------------------------------------------------- 灯が燃えてロゴになる（OP 0〜3.9秒）
NOISE_G = _rng.random((256, 256)).astype(np.float32)
FLAME_CX, FLAME_BASE = LCX, 620                      # 炎の根元（左パネルの中央下）
FLAME_W, FLAME_H = 300, 420                          # 炎の描画域（px）
N_LOGO = 3400
OPENING_MODE = 'spark'                               # 'flame' = 炎の柱つき ／ 'spark' = 灯一粒から火の粉がロゴへ
EMBER = (LCX, 560)                                   # 灯一粒の位置
N_EMBER_SPARKS = 36


def vnoise(u, v):
    u0 = np.floor(u).astype(np.int64); v0 = np.floor(v).astype(np.int64)
    fu = u - u0; fv = v - v0
    fu = fu * fu * (3 - 2 * fu); fv = fv * fv * (3 - 2 * fv)
    u0 %= 256; v0 %= 256; u1 = (u0 + 1) % 256; v1 = (v0 + 1) % 256
    a = NOISE_G[v0, u0]; b = NOISE_G[v0, u1]; c = NOISE_G[v1, u0]; d = NOISE_G[v1, u1]
    return (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv


def flame_lut():
    stops = [(0.0, (0, 0, 0)), (0.22, (110, 8, 0)), (0.48, (255, 84, 0)), (0.74, (255, 196, 48)), (1.0, (255, 250, 214))]
    lut = np.zeros((256, 3), np.float32)
    for i in range(256):
        x = i / 255
        for (a, ca), (b, cb) in zip(stops, stops[1:]):
            if a <= x <= b:
                q = (x - a) / (b - a)
                lut[i] = [ca[k] * (1 - q) + cb[k] * q for k in range(3)]
                break
    return lut


FLAME_LUT = flame_lut()


def flame_plume(t, height, gain):
    """ノイズで揺れる炎。height=0..1 で丈、gain で明るさ。RGB float (FLAME_H, FLAME_W)。"""
    w, h = FLAME_W // 3, FLAME_H // 3
    X, Y = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    yfrac = (h - 1 - Y) / h                               # 0=根元, 1=先端
    u, v = X / 11.0, Y / 11.0 + t * 5.5
    n = 0.55 * vnoise(u, v) + 0.30 * vnoise(2 * u + 7, 2 * v + 3) + 0.15 * vnoise(4 * u + 11, 4 * v + 5)
    reach = np.clip(yfrac / max(height, 0.05), 0, 1)
    hw = 0.46 * w * (1 - reach) ** 0.75 + 2
    lateral = np.clip(1 - ((X - w / 2) / hw) ** 2, 0, 1)
    vertical = (1 - reach) ** 1.25
    dens = np.clip((n * 1.45 - 0.36) * lateral * vertical * 2.4 * gain, 0, 1)
    # 描画域の縁で切れて見えないよう、左右と根元をなだらかに落とす
    wx = np.clip(np.minimum(X, w - 1 - X) / 9.0, 0, 1)
    wy = np.clip((h - 1 - Y) / 7.0, 0, 1)
    dens *= (wx * wx * (3 - 2 * wx)) * (wy * wy * (3 - 2 * wy))
    img = Image.fromarray((dens * 255).astype(np.uint8)).resize((FLAME_W, FLAME_H), Image.Resampling.BILINEAR)
    d = np.asarray(img).astype(np.float32) / 255
    rgb = FLAME_LUT[(d * 255).astype(np.uint8)]
    halo = np.asarray(img.filter(ImageFilter.GaussianBlur(14))).astype(np.float32) / 255
    Xf, Yf = np.meshgrid(np.arange(FLAME_W, dtype=np.float32), np.arange(FLAME_H, dtype=np.float32))
    win = np.clip(np.minimum(Xf, FLAME_W - 1 - Xf) / 40.0, 0, 1) * np.clip((FLAME_H - 1 - Yf) / 30.0, 0, 1) * np.clip(Yf / 30.0, 0, 1)
    rgb += (halo * win)[:, :, None] * np.array([255, 96, 12], np.float32) * 0.55
    return rgb


def add_region(arr, rgb, x0, y0):
    h, w = rgb.shape[:2]
    arr[y0:y0 + h, x0:x0 + w, :] += rgb
    return arr


_logo_pts = None


def logo_points():
    global _logo_pts
    if _logo_pts is None:
        layer = np.asarray(op_logo()).astype(np.float32) / 255
        ys, xs = np.nonzero(layer[:, :, 3] > 0.5)
        pick = _rng.choice(len(xs), size=min(N_LOGO, len(xs)), replace=False)
        tx, ty = xs[pick].astype(np.float32), ys[pick].astype(np.float32)
        col = layer[ys[pick], xs[pick], :3]
        n = len(pick)
        sx = FLAME_CX + _rng.normal(0, 34, n)
        sy = FLAME_BASE - _rng.uniform(40, 330, n)
        depart = _rng.uniform(0.95, 1.85, n)
        flight = _rng.uniform(0.85, 1.35, n)
        mx, my = (sx + tx) / 2 + _rng.uniform(-150, 150, n), (sy + ty) / 2 - _rng.uniform(60, 200, n)
        sz = _rng.integers(5, 8, n)
        ex, ey = EMBER                                   # spark モード：一粒の灯から出発し、弧を描いて上のロゴへ
        sx2 = ex + _rng.normal(0, 14, n)
        sy2 = ey + _rng.normal(0, 10, n)
        dep2 = _rng.uniform(0.9, 2.05, n)
        fl2 = _rng.uniform(0.9, 1.4, n)
        mx2 = (sx2 + tx) / 2 + _rng.uniform(-170, 170, n)
        my2 = np.minimum(sy2, ty) - _rng.uniform(60, 230, n)
        _logo_pts = dict(tx=tx, ty=ty, col=col, sx=sx, sy=sy, dep=depart, fl=flight, mx=mx, my=my, sz=sz,
                         sx2=sx2, sy2=sy2, dep2=dep2, fl2=fl2, mx2=mx2, my2=my2)
    return _logo_pts


ember_b = _rng.uniform(0.4, 2.2, N_EMBER_SPARKS)
ember_vx = _rng.uniform(-22, 22, N_EMBER_SPARKS)
ember_vy = _rng.uniform(70, 150, N_EMBER_SPARKS)
ember_ph = _rng.uniform(0, 6.28, N_EMBER_SPARKS)
ember_sz = _rng.integers(5, 8, N_EMBER_SPARKS)


def spark_logo(frame, t):
    """灯が一粒ともり、ふくらみ、その光が火の粉になって立ち昇り、ロゴの形に集まる。炎の柱は出さない。"""
    arr = np.asarray(frame).astype(np.float32)
    ex, ey = EMBER
    if t >= 0.1:
        g = smooth((t - 0.1) / 0.7)                         # 0.8秒でふくらみ切る
        fade = 1 - smooth((t - 1.3) / 1.3)                  # 火の粉が出ていくにつれ 2.6秒で消える
        flick = 0.93 + 0.07 * math.sin(t * 31) * math.sin(t * 7.3)
        inten = (0.25 + 0.75 * g) * fade * flick
        if inten > 0.01:
            r = int(12 + 78 * g)
            yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
            halo = np.exp(-(xx * xx + yy * yy) / (2 * (r / 2.3) ** 2)).astype(np.float32) * inten * 255 * 0.85
            core = np.exp(-(xx * xx + yy * yy) / (2 * (6.0) ** 2)).astype(np.float32) * inten * 255 * 1.2
            g2 = halo[:, :, None] * LIGHT[None, None, :] + core[:, :, None] * np.array([1.0, 0.96, 0.85], np.float32)[None, None, :]
            y0, x0 = ey - r, ex - r
            y1, x1 = min(H, y0 + g2.shape[0]), min(W, x0 + g2.shape[1])
            gy0, gx0 = max(0, -y0), max(0, -x0)
            arr[max(0, y0):y1, max(0, x0):x1, :] += g2[gy0:gy0 + (y1 - max(0, y0)), gx0:gx0 + (x1 - max(0, x0))]
    frame = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    # 灯から立ち昇る小さな火の粉
    pts = []
    for n in range(N_EMBER_SPARKS):
        tau = t - ember_b[n]
        if 0 <= tau < 1.6:
            x = ex + ember_vx[n] * tau + 10 * math.sin(ember_ph[n] + tau * 6)
            y = ey - ember_vy[n] * tau
            pts.append((x, y, 0.8 * (1 - tau / 1.6), int(ember_sz[n])))
    frame = add_lights(frame, pts)
    # 火の粉がロゴへ
    k_logo = smooth((t - 2.35) / 0.55)
    if 0.85 <= t < 3.1:
        P = logo_points()
        p = np.clip((t - P['dep2']) / P['fl2'], 0, 1)
        e = p * p * (3 - 2 * p)
        x = (1 - e) ** 2 * P['sx2'] + 2 * (1 - e) * e * P['mx2'] + e * e * P['tx']
        y = (1 - e) ** 2 * P['sy2'] + 2 * (1 - e) * e * P['my2'] + e * e * P['ty']
        flick = 0.75 + 0.25 * np.sin(t * 23 + P['tx'] * 0.05)
        born = (t >= P['dep2'] - 0.12)
        inten = np.where(p < 1, 0.85 * flick, 0.7) * (1 - k_logo)
        cpts = []
        for n in np.nonzero(born)[0]:
            c = P['col'][n] * e[n] + np.array([1.0, 0.62, 0.18], np.float32) * (1 - e[n])
            cpts.append((x[n], y[n], float(inten[n]), int(P['sz'][n]), c))
        frame = add_lights_colored(frame, cpts)
    if k_logo > 0:
        paste_left(frame, op_logo(), k_logo)
    return frame


def flame_logo(frame, t):
    """0〜3.9秒：灯が一粒 → ぼわっと燃え上がる → 火の粉がロゴの形に集まる → ロゴが定着。"""
    arr = np.asarray(frame).astype(np.float32)
    # 炎（音の立ち上がり 0.1秒で点火、1秒ほど燃えて衰える）
    if 0.1 <= t < 2.9:
        life = smooth((t - 0.1) / 0.35) * (1 - smooth((t - 1.1) / 1.6))
        height = 0.25 + 0.75 * smooth((t - 0.15) / 0.5)
        rgb = flame_plume(t, height * (0.35 + 0.65 * life), 0.35 + 0.9 * life)
        arr = add_region(arr, rgb, FLAME_CX - FLAME_W // 2, FLAME_BASE - FLAME_H)
    # ぼわっ（点火の閃光）
    if 0.1 <= t < 1.6:
        r = 26 + 260 * smooth((t - 0.1) / 0.4)
        b = smooth((t - 0.1) / 0.25) * (1 - smooth((t - 0.45) / 1.1)) * 0.9
        sp = glow_sprite(min(int(r), 200))
        pts = [(FLAME_CX, FLAME_BASE - 90, b, 18)]
        frame = add_lights(Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)), pts)
        arr = np.asarray(frame).astype(np.float32)
        yy, xx = np.mgrid[-int(r):int(r) + 1, -int(r):int(r) + 1]
        g = np.exp(-(xx * xx + yy * yy) / (2 * (r / 2.4) ** 2)).astype(np.float32) * b * 255
        y0, x0 = FLAME_BASE - 90 - int(r), FLAME_CX - int(r)
        gy0, gx0 = max(0, -y0), max(0, -x0)
        y1, x1 = min(H, y0 + g.shape[0]), min(W, x0 + g.shape[1])
        arr[max(0, y0):y1, max(0, x0):x1, :] += g[gy0:gy0 + (y1 - max(0, y0)), gx0:gx0 + (x1 - max(0, x0))][:, :, None] * LIGHT[None, None, :]
    # 火の粉がロゴへ
    k_logo = smooth((t - 2.35) / 0.55)
    if 0.9 <= t < 3.1:
        P = logo_points()
        p = np.clip((t - P['dep']) / P['fl'], 0, 1)
        e = p * p * (3 - 2 * p)
        x = (1 - e) ** 2 * P['sx'] + 2 * (1 - e) * e * P['mx'] + e * e * P['tx']
        y = (1 - e) ** 2 * P['sy'] + 2 * (1 - e) * e * P['my'] + e * e * P['ty']
        flick = 0.75 + 0.25 * np.sin(t * 23 + P['tx'] * 0.05)
        born = (t >= P['dep'] - 0.25)
        inten = np.where(p < 1, 0.85 * flick, 0.7) * (1 - k_logo)
        pts = []
        for n in np.nonzero(born)[0]:
            c = P['col'][n] * e[n] + np.array([1.0, 0.62, 0.18], np.float32) * (1 - e[n])
            pts.append((x[n], y[n], float(inten[n]), int(P['sz'][n]), c))
        frame = add_lights_colored(Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)), pts)
        arr = np.asarray(frame).astype(np.float32)
    frame = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    if k_logo > 0:
        paste_left(frame, op_logo(), k_logo)
    return frame


def add_lights_colored(frame, points):
    """add_lights の色つき版。points=[(x,y,intensity,size,rgb0..1)]"""
    if not points:
        return frame
    arr = np.asarray(frame).astype(np.float32)
    for x, y, inten, sz, col in points:
        sp = _sprites[int(sz)]
        r = sp.shape[0] // 2
        xi, yi = int(round(x)), int(round(y))
        x0, y0, x1, y1 = xi - r, yi - r, xi + r + 1, yi + r + 1
        sx0, sy0 = max(0, -x0), max(0, -y0)
        cx0, cy0, cx1, cy1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
        if cx1 <= cx0 or cy1 <= cy0:
            continue
        patch = sp[sy0:sy0 + (cy1 - cy0), sx0:sx0 + (cx1 - cx0)]
        arr[cy0:cy1, cx0:cx1, :] += patch[:, :, None] * (255 * inten) * np.asarray(col, np.float32)[None, None, :]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


# ---------------------------------------------------------------- OP（0〜18.63）
_op_logo = None
_op_caps = {}
op_by_title = {s['title']: s['source'] for s in op['sources']}


def op_logo():
    global _op_logo
    if _op_logo is None:
        with Image.open(op['logo']['source']) as raw:
            logo = raw.convert('RGBA')
        s = 640 / logo.width
        logo = logo.resize((640, round(logo.height * s)), Image.Resampling.LANCZOS)
        layer = Image.new('RGBA', (1280, H), (0, 0, 0, 0))
        layer.paste(logo, (LCX - 320, 400 - logo.height // 2), logo)
        _op_logo = layer
    return _op_logo


OP_SIZES = (116, 96, 140)


def op_caption(cap):
    """(上2段「気良歌舞伎／×」の固定レイヤー, 語句だけのレイヤー, 文字枠)。上2段は全語句で共通なので出しっぱなしにできる。"""
    key = cap['keyword']
    if key in _op_caps:
        return _op_caps[key]
    fixed = Image.new('RGBA', (1280, H), (0, 0, 0, 0))
    word = Image.new('RGBA', (1280, H), (0, 0, 0, 0))
    blocks_fixed = [(cap['lines'][0], font(FONT_M, OP_SIZES[0]), '#f7f5ef', 150),
                    (cap['lines'][1], font(FONT_M, OP_SIZES[1]), COL_GOLD, 130),
                    ('', None, None, 180)]
    blocks_word = [('', None, None, 150), ('', None, None, 130),
                   (cap['lines'][2], font(FONT_M, OP_SIZES[2]), COL_RED, 180)]
    boxes = draw_blocks(fixed, blocks_fixed, LCX, 400) + draw_blocks(word, blocks_word, LCX, 400)
    _op_caps[key] = (fixed, word, boxes)
    return _op_caps[key]


def op_frame(t):
    frame = Image.new('RGB', (W, H), 'black')
    n = round(t * FPS)
    for s in op['schedule']:
        if s['start'] <= t < s['end'] and s['label'] in op_by_title:
            im = load_photo(op_by_title[s['label']], RIGHT)
            hold = s['end'] - s['start']
            q = smooth((t - s['start']) / hold) if hold >= 0.9 else 1.0
            if auto_fit(im) == 'cover':
                place_photo(frame, im, RIGHT, 1.0 + 0.03 * (1 - q), cover=True)
            else:
                place_photo(frame, im, RIGHT, 1.0 - 0.03 * (1 - q))
            break
    if t < op['logo']['end']:
        frame = spark_logo(frame, t) if OPENING_MODE == 'spark' else flame_logo(frame, t)
    else:
        cap = next((c for c in op['captions'] if c['start_frame'] <= n < c['end_frame']), None)
        if cap:
            fixed, word, _ = op_caption(cap)
            first = op['captions'][0]['start_frame']
            k0 = smooth((n - first + 1) / 3)                 # 「気良歌舞伎／×」は最初の一拍で出て、以後は残る
            paste_left(frame, fixed, k0, 8 * (1 - k0))
            k = smooth((n - cap['start_frame'] + 1) / 3)     # 語句だけ拍ごとに替わる
            paste_left(frame, word, k, 8 * (1 - k))
    if t > 18.30:
        frame = Image.blend(frame, BLACK, smooth((t - 18.30) / 0.3))
    return frame


# ---------------------------------------------------------------- 白い光と灯の螺旋（18.63〜25.9）
def white_frame(t):
    if t < WHITE['hold_until']:
        b = smooth((t - WHITE['start']) / (WHITE['full_white'] - WHITE['start']))
        frame = Image.new('RGB', (W, H), (round(247 * b), round(245 * b), round(241 * b)))
        if b < 0.985:
            frame = add_lights(frame, spiral_points(t - WHITE['start']), gain=(1 - b))
        return frame
    q = smooth((t - WHITE['hold_until']) / (REVEAL_END - WHITE['hold_until']))
    target = compose(2, t, 1.0, 0)
    return Image.blend(Image.new('RGB', (W, H), (247, 245, 241)), target, q)


# ---------------------------------------------------------------- 終幕の右パネル（第三場の題名と結びの言葉）
def finale_cuts():
    ai = next(c for c in cuts if c['number'] == 62)
    title = next(c for c in cuts if c['number'] == 60)
    return ai, title


def finale_right(t):
    """終幕の右パネル。新世代×AIの札：結びの言葉と昇る灯 → 灯が星になって残る → 題名の札：「第三場」。"""
    ai, title = finale_cuts()
    panel = Image.new('RGB', (1280, H), 'black')
    if not (ai['start'] <= t < title['end'] + 1.0):
        return panel
    full = Image.new('RGB', (W, H), 'black')
    pts = []
    if t < ai['end']:
        env = smooth((t - ai['start']) / 1.2) * (1 - smooth((t - (ai['end'] - 1.0)) / 1.0))
        pts += rise_points(t - ai['start'], env)
    star_env = smooth((t - (ai['end'] - 1.5)) / 2.0) * (1 - smooth((t - title['end']) / 1.0))
    pts += star_points(t, star_env)
    full = add_lights(full, pts)
    panel = full.crop(RIGHT)
    if t < ai['end']:
        k = smooth((t - (ai['start'] + 1.4)) / 1.2) * (1 - smooth((t - (ai['end'] - 1.0)) / 1.0))
        if k > 0:
            layer = Image.new('RGBA', (1280, H), (0, 0, 0, 0))
            draw_blocks(layer, [(l, font(FONT_B, 58), COL_BODY, 96) for l in ai['right_title']['lines']], RCX - 1280, 400)
            panel.paste(layer, (0, 0), layer.getchannel('A').point(lambda v: int(v * k)))
    if t >= title['start']:
        k = smooth((t - (title['start'] + 1.6)) / 2.0) * (1 - smooth((t - title['end']) / 1.0))
        if k > 0:
            layer = Image.new('RGBA', (1280, H), (0, 0, 0, 0))
            draw_blocks(layer, [(title['right_title']['lead'], font(FONT_B, 46), COL_LEAD, 80),
                                (title['right_title']['lines'][0], font(FONT_B, 68), COL_BODY, 110)], RCX - 1280, 400)
            panel.paste(layer, (0, 0), layer.getchannel('A').point(lambda v: int(v * k)))
    return panel


# ---------------------------------------------------------------- カット合成
def compose(i, t, k=1.0, dy=0):
    """カット i を時刻 t で描く（切替のフェードは含まない）。k, dy は左テロップの入り。"""
    c = cuts[i]
    if c['kind'] == 'roll':
        return roll_frame(t, k)
    frame = Image.new('RGB', (W, H), 'black')
    if c['kind'] == 'black':
        if t >= finale_cuts()[0]['start']:
            frame.paste(finale_right(t), (1280, 0))
        return frame
    if c.get('right_title'):
        frame.paste(finale_right(t), (1280, 0))
    elif c.get('source') or c.get('photo_sequence'):
        frame.paste(right_photo(i, t), (1280, 0))
    lead_im, body_im = left_layer(i)
    if c.get('line_beats') and i in _line_layers:           # 行ごとに拍で出す（本文の入りは行の拍が決める）
        for layer, beat in zip(_line_layers[i], c['line_beats']):
            kk = smooth((t - float(beat)) / 0.12)
            paste_left(frame, layer, kk, 8 * (1 - kk))
        paste_left(frame, lead_im, max(k, smooth((t - c['start']) / 0.12)), 0)
    else:
        paste_left(frame, body_im, k, dy)
        paste_left(frame, lead_im, k, 0)
    if c['kind'] == 'quote' and k > 0:
        layer = Image.new('RGBA', (1280, H), (0, 0, 0, 0))
        draw_blocks(layer, [(l, font(FONT_K, QUOTE_SIZE), COL_BODY, 150) for l in c['right_title']['lines']], RCX - 1280, 400)
        frame.paste(layer, (1280, int(round(dy))), layer.getchannel('A').point(lambda v: int(v * k)))
    return frame


def transition_of(i):
    c = cuts[i]
    tr = c.get('transition_in')
    if tr:
        return tr['type'], float(tr['seconds'])
    if c['kind'] == 'black':
        return 'fade-through-black', 1.0
    dur = c['end'] - c['start']
    return 'fade', min(2.4, max(1.0, round(dur * 0.4, 2)))   # 短いカットは切替も短く（4秒→1.6秒）


_end_frames = {}


def end_frame(i):
    if i not in _end_frames:
        _end_frames[i] = compose(i, cuts[i]['end'] - 1 / FPS, 1.0, 0)
    return _end_frames[i]


def frame_at(t):
    if t < OP_END:
        return op_frame(t)
    if t < REVEAL_END:
        return white_frame(t)
    i = bisect.bisect_right(starts, t + 1e-9) - 1
    c = cuts[i]
    local = t - c['start']
    ttype, tsec = transition_of(i)
    hold_left = same_left(i - 1, i)
    quick_left = ttype == 'right-photo-only-crossfade' and not hold_left   # 右だけ短く切り替え、左の文字は0.5秒で溶かす
    tleft = 0.5 if quick_left else tsec
    if ttype == 'from-white' or tsec <= 0 or local >= max(tsec, tleft):
        return compose(i, t, 1.0, 0)
    a = local / tsec
    prev = end_frame(i - 1)
    if ttype == 'beat':                                     # 拍で切替：右は一瞬、左は文字がポンと出る
        k = smooth(a)
        cur = compose(i, t, 1.0, 0)
        out = Image.new('RGB', (W, H), 'black')
        if hold_left:
            left = cur.crop(LEFT)
        else:
            left = compose_left(i, t, k, 8 * (1 - k), lead_k=(1.0 if same_lead(i - 1, i) else k))
        out.paste(left, (0, 0))
        out.paste(Image.blend(prev.crop(RIGHT), cur.crop(RIGHT), k), (1280, 0))
        return out
    if hold_left or ttype == 'right-photo-only-crossfade':
        k, dy = 1.0, 0
    elif a < 0.7:
        k, dy = 0.0, 0
    else:
        k = smooth((a - 0.7) / 0.3)
        dy = 22 * (1 - k)
    cur = compose(i, t, k, dy)
    out = Image.new('RGB', (W, H), 'black')
    # 右パネル
    if c.get('right_title') or cuts[i - 1].get('right_title') or c['kind'] == 'black':
        right = cur.crop(RIGHT)
    elif local >= tsec:
        right = cur.crop(RIGHT)
    elif ttype == 'fade-through-black':
        if a < 0.5:
            right = Image.blend(prev.crop(RIGHT), BLACK_R, smooth(a / 0.5))
        else:
            right = Image.blend(BLACK_R, cur.crop(RIGHT), smooth((a - 0.5) / 0.5))
    else:
        right = Image.blend(prev.crop(RIGHT), cur.crop(RIGHT), smooth(a))
    # 左パネル：前の文字を消し切ってから次の文字が浮き上がる（Codex v6 と同じ 30/40/30）
    hold_lead = same_lead(i - 1, i) and c['kind'] != 'roll' and cuts[i - 1]['kind'] != 'roll'
    if c['kind'] == 'black':
        left = Image.blend(prev.crop(LEFT), BLACK_L, smooth(a))
    elif quick_left:
        left = Image.blend(prev.crop(LEFT), cur.crop(LEFT), smooth(local / tleft))
    elif hold_left or ttype == 'right-photo-only-crossfade':
        left = cur.crop(LEFT)
    elif hold_lead:                                        # 同じ小見出しは消さずに保持し、本文だけ入れ替える
        if a < 0.3:
            left = compose_left(i - 1, cuts[i - 1]['end'] - 1 / FPS, 1 - smooth(a / 0.3), 0, lead_k=1.0)
        elif a < 0.7:
            left = compose_left(i, t, 0.0, 0, lead_k=1.0)
        else:
            left = compose_left(i, t, k, dy, lead_k=1.0)
    elif a < 0.3:
        left = Image.blend(prev.crop(LEFT), BLACK_L, smooth(a / 0.3))
    elif a < 0.7:
        left = BLACK_L
    else:
        left = cur.crop(LEFT)
    out.paste(left, (0, 0))
    out.paste(right, (1280, 0))
    return out


# ---------------------------------------------------------------- 書き出し
def run(args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', *map(str, args)], check=True)


def probe(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]))


def audio_hash(path):
    return subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:a:0', '-c:a', 'copy',
                                    '-f', 'hash', '-hash', 'sha256', '-'], text=True).strip()


def encode(path, frames, count, label):
    cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
           '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p',
           '-movflags', '+faststart', str(path)]
    QA.mkdir(exist_ok=True)
    log = (QA / (path.stem + '.log')).open('wb')
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=log)
    started = time.time()
    try:
        for n, fr in enumerate(frames):
            proc.stdin.write(fr.tobytes())
            if n % 600 == 0:
                el = time.time() - started
                eta = (count - n) * el / n if n else 0
                print(f'{label} {n}/{count} {el:.0f}s 残り約{eta / 60:.1f}分', flush=True)
        proc.stdin.close()
        assert proc.wait() == 0, 'ffmpeg failed: ' + (QA / (path.stem + '.log')).read_text(errors='replace')
    except BaseException:
        proc.kill()
        raise
    finally:
        log.close()


def check_frame(t, frame):
    """安全域の数値検査：左の明るい画素は x350〜1230、右の文字（ロール中）は y<=720。"""
    g = np.asarray(frame.convert('L'))
    issues = []
    lit = g[:, :1280] > 60
    cols = np.nonzero(lit.any(axis=0))[0]
    if len(cols) and (cols.min() < LEFT_SAFE[0] or cols.max() > LEFT_SAFE[1]):
        issues.append(f'左 x{cols.min()}〜{cols.max()}')
    rows = np.nonzero(lit.any(axis=1))[0]
    if len(rows) and rows.max() > BOTTOM_LIMIT:
        issues.append(f'左 y下端{rows.max()}')
    if roll_cut['start'] <= t < roll_cut['end']:
        rlit = g[:, 1280:] > 60
        rrows = np.nonzero(rlit.any(axis=1))[0]
        if len(rrows) and rrows.max() > BOTTOM_LIMIT:
            issues.append(f'右 y下端{rrows.max()}')
    return issues


SAMPLE_TIMES = [1.0, 2.5, 4.3, 8.2, 12.4, 16.5, 18.0, 19.4, 20.6, 21.5, 23.6, 25.0, 27, 36, 45, 55, 70, 100, 110, 116,
                150, 158, 162, 168, 175, 185, 196, 199.5, 205, 250, 300, 340, 346, 349, 353, 360, 367, 369.5, 378, 383,
                392, 398, 407, 413, 422, 436, 446, 458, 465, 471, 476, 481, 490, 497, 503, 508, 511.5, 515, 521.2,
                523.6, 526, 527.3]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry', action='store_true')
    ap.add_argument('--sample', action='store_true')
    ap.add_argument('--times', type=str, default='')
    ap.add_argument('--range', nargs=2, type=float)
    ap.add_argument('--render', action='store_true')
    ap.add_argument('--captions', type=str, default='', help='テロップ差し替え JSON（読み込みは起動時に済んでいる）')
    ap.add_argument('--out', type=str, default='', help='出力版名（例: v22）。省略時は v21')
    a = ap.parse_args()
    global VER, OUT, QA
    if a.out:
        VER = a.out
        OUT = FIELD / f'気良歌舞伎_灯し火の螺旋_現場投影テスト_{VER}.mp4'
        QA = FIELD / f'{VER}_検品'
    QA.mkdir(exist_ok=True)

    if a.dry:
        print(f'{"i":>2} {"no":>2} {"kind":16} {"start":>7} {"end":>7} {"trans":26} {"font":>4}  lines / source')
        for i, c in enumerate(cuts):
            left_layer(i)
            size, lines, boxes = _left_info.get(i, (0, [], []))
            ttype, tsec = transition_of(i)
            src = Path(c['source']).name if c.get('source') else ('seq' if c.get('photo_sequence') else '-')
            hold = '=' if i and same_left(i - 1, i) else ('^' if i and same_lead(i - 1, i) else ' ')
            print(f'{i:>2} {c["number"]:>2} {c["kind"]:16} {c["start"]:7.2f} {c["end"]:7.2f} {ttype:20}{tsec:5.2f} {size:>4}{hold} {" / ".join(lines)}  <{src}>')
            for b in boxes:
                if b[0] < LEFT_SAFE[0] or b[2] > LEFT_SAFE[1]:
                    print(f'      !! 安全域超過 {b}')
        return

    if a.sample or a.times:
        times = [float(x) for x in a.times.split(',')] if a.times else SAMPLE_TIMES
        tiles = []
        for t in times:
            fr = frame_at(t)
            issues = check_frame(t, fr)
            name = QA / f'sample_{t:07.2f}.jpg'
            fr.save(name, quality=90)
            tile = fr.resize((1280, 400), Image.Resampling.BILINEAR)
            ImageDraw.Draw(tile).text((8, 6), f'{t:.2f}s ' + (' / '.join(issues) if issues else ''), font=font(FONT_B, 24), fill='#ff6' if issues else '#9f9')
            tiles.append(tile)
            print(f'{t:7.2f}s ' + (' !! ' + '; '.join(issues) if issues else 'ok'), flush=True)
        cols = 2
        rows = (len(tiles) + cols - 1) // cols
        sheet = Image.new('RGB', (1280 * cols, 400 * rows), 'black')
        for n, tile in enumerate(tiles):
            sheet.paste(tile, ((n % cols) * 1280, (n // cols) * 400))
        sheet.save(QA / 'sample_sheet.jpg', quality=85)
        print('sheet:', QA / 'sample_sheet.jpg')
        return

    if a.range:
        t0, t1 = a.range
        n0, n1 = round(t0 * FPS), round(t1 * FPS)
        path = QA / f'range_{t0:g}-{t1:g}.mp4'
        encode(path, (frame_at(n / FPS) for n in range(n0, n1)), n1 - n0, 'range')
        print('wrote', path)
        return

    if a.render:
        total = round(TOTAL * FPS)
        base = probe(BASE)
        bv = next(s for s in base['streams'] if s['codec_type'] == 'video')
        assert int(bv['nb_frames']) == total, (bv['nb_frames'], total)
        video = QA / f'{VER}_video_only.mp4'
        encode(video, (frame_at(n / FPS) for n in range(total)), total, '本編')
        run(['-y', '-itsoffset', bv['start_time'], '-i', video, '-i', BASE, '-map', '0:v:0', '-map', '1:a:0',
             '-c', 'copy', '-movflags', '+faststart', OUT])
        out = probe(OUT)
        ov = next(s for s in out['streams'] if s['codec_type'] == 'video')
        assert int(ov['nb_frames']) == total
        assert abs(float(out['format']['duration']) - float(base['format']['duration'])) < 0.05
        run(['-i', OUT, '-f', 'null', '-'])
        assert audio_hash(OUT) == audio_hash(BASE)
        report = {
            'version': VER, 'file': str(OUT), 'source_audio': str(BASE), 'plan': str(PLAN), 'opening': str(OPJ),
            'sha256': hashlib.sha256(OUT.read_bytes()).hexdigest(), 'frames': total,
            'duration': float(out['format']['duration']), 'canvas': [W, H], 'fps': FPS,
            'audio_identical_to_v20': True, 'full_decode_passed': True,
            'left_safe_x': list(LEFT_SAFE), 'bottom_limit_y': BOTTOM_LIMIT,
            'body_font_px': [BODY_TARGET, BODY_FLOOR], 'card_font_px': CARD_TARGET, 'op_caption_px': list(OP_SIZES),
            'roll_caption_y': [ROLL_TITLE_Y, ROLL_CREDIT_Y], 'photo_breathing': KB_AMOUNT, 'pan_cuts': sorted(PAN_CUTS),
            'spiral_lights': [WHITE['start'], WHITE['hold_until']], 'rising_lights': [520.8, 527.8],
            'physical_venue_test_performed': False,
        }
        (FIELD / f'現場投影テスト_{VER}_検証.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return
    ap.print_help()


if __name__ == '__main__':
    main()
