# -*- coding: utf-8 -*-
"""浄瑠璃だけの音声を生成する(v2)。

ロジック:
- 義太夫の歌唱はWhisperがまともに文字起こしできない(無出力か幻覚になる)のに対し、
  役者の台詞は正しく文字起こしされ台本と照合できる。これを利用し、
  「信頼できる文字起こしがあり台本の台詞と照合する時間帯」を台詞として除外、
  残りの声活動時間帯を浄瑠璃とする。
- 台本上、浄瑠璃(〽)は天満屋の場後半〜道行にのみ存在するため GATE_SEC 以前は対象外。

出力:
1. 曽根崎心中_浄瑠璃のみ_フル尺.flac (元動画と同じタイムライン)
2. 曽根崎心中_浄瑠璃のみ_連結.flac (浄瑠璃区間だけの連結)
3. joruri_regions.csv (レビュー用)
"""
import csv
import json
import re
import sys

import numpy as np
import soundfile as sf
from rapidfuzz import fuzz

DIR = r"D:\気良歌舞伎\台本\曽根崎心中\audio_sep"
VOCALS = DIR + r"\曽根崎心中_声_浄瑠璃と台詞.flac"
SHAMISEN = DIR + r"\曽根崎心中_三味線.flac"

HOP = 0.5
GATE_SEC = 40.4 * 60  # 〽夜の編み笠(最初の浄瑠璃)の直前
VOICE_DB_TH = -45.0

# 信頼できるWhisperセグメントの条件
MAX_SEG_DUR = 20.0       # これより長いセグメントは幻覚とみなし無視
MIN_CHAR_RATE = 1.0      # 文字数/秒がこれ未満ならタイミング不正とみなし無視
SERIFU_PAD = 0.2         # 台詞区間の前後拡張(秒)

MERGE_GAP = 2.0          # 浄瑠璃区間の結合許容ギャップ
MIN_REGION = 2.0         # これより短い浄瑠璃区間は捨てる
PAD = 0.3
FADE_SEC = 0.05


def norm_text(t):
    return re.sub(r"[〽\s、。「」()（）――…・?？!！]", "", t)


def merge_ranges(ranges, gap):
    if not ranges:
        return []
    ranges = sorted(ranges)
    out = [list(ranges[0])]
    for s, e in ranges[1:]:
        if s - out[-1][1] <= gap:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return [tuple(r) for r in out]


def main():
    with open(DIR + r"\script_lines.json", encoding="utf-8") as f:
        script = json.load(f)
    with open(DIR + r"\transcript_vocals.json", encoding="utf-8") as f:
        transcript = json.load(f)
    vdb = 20 * np.log10(np.load(DIR + r"\vocals_rms.npy") + 1e-9)

    joruri_lines = [l["norm"] for l in script if l["kind"] == "joruri" and len(l["norm"]) >= 4]
    serifu_lines = [l["norm"] for l in script if l["kind"] == "serifu" and len(l["norm"]) >= 4]

    # --- 台詞マスク: 信頼できる文字起こしで台本台詞に照合する時間帯 ---
    serifu_ranges = []
    seg_log = []
    for g in transcript:
        dur = g["end"] - g["start"]
        q = norm_text(g["text"])
        reliable = 0 < dur <= MAX_SEG_DUR and len(q) / max(dur, 0.1) >= MIN_CHAR_RATE
        if not reliable:
            seg_log.append((g, "unreliable", 0, 0))
            continue
        sj = max((fuzz.partial_ratio(q, l) for l in joruri_lines), default=0) if len(q) >= 2 else 0
        ss = max((fuzz.partial_ratio(q, l) for l in serifu_lines), default=0) if len(q) >= 2 else 0
        # 台詞除外は「台本の台詞行に明確に照合した」場合のみ
        is_serifu = (len(q) >= 4 and ss >= 55 and ss > sj) or \
                    (len(q) >= 2 and ss >= 85 and ss > sj)
        if is_serifu:
            serifu_ranges.append((g["start"] - SERIFU_PAD, g["end"] + SERIFU_PAD))
            seg_log.append((g, "serifu", sj, ss))
        else:
            seg_log.append((g, "keep", sj, ss))
    serifu_ranges = merge_ranges(serifu_ranges, 0.0)

    # --- 声活動マスク(0.5秒グリッド) ---
    n = len(vdb)
    voice = vdb > VOICE_DB_TH
    serifu_mask = np.zeros(n, dtype=bool)
    for s, e in serifu_ranges:
        serifu_mask[max(0, int(s / HOP)):min(n, int(e / HOP) + 1)] = True
    gate_idx = int(GATE_SEC / HOP)
    cand = voice.copy()
    cand[:gate_idx] = False
    cand &= ~serifu_mask

    # グリッド -> 区間
    raw = []
    start = None
    for i in range(n):
        t = i * HOP
        if cand[i] and start is None:
            start = t
        elif not cand[i] and start is not None:
            raw.append((start, t))
            start = None
    if start is not None:
        raw.append((start, n * HOP))

    sdb = 20 * np.log10(np.load(DIR + r"\shamisen_rms.npy") + 1e-9)

    def shamisen_act(s, e):
        i0, i1 = int(s / HOP), max(int(s / HOP) + 1, int(e / HOP))
        return float((sdb[i0:i1] > -50).mean())

    joruri_regions = []
    for s, e in merge_ranges(raw, MERGE_GAP):
        if e - s < MIN_REGION:
            continue
        # 短い区間は三味線を伴う場合のみ採用(台詞の隙間の誤検出対策)
        if e - s < 8.0 and shamisen_act(s, e) < 0.2:
            continue
        joruri_regions.append((s, e))
    joruri_regions = merge_ranges([(max(0, s - PAD), e + PAD) for s, e in joruri_regions], 0.5)

    # --- レビューCSV ---
    with open(DIR + r"\joruri_regions.csv", "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["start_min", "start_sec", "end_sec", "dur_sec"])
        for s, e in joruri_regions:
            w.writerow([f"{s/60:.2f}", f"{s:.1f}", f"{e:.1f}", f"{e-s:.1f}"])

    total = sum(e - s for s, e in joruri_regions)
    print(f"joruri regions: {len(joruri_regions)} / {total/60:.1f} min")
    print(f"serifu ranges excluded: {len(serifu_ranges)}")
    n_unrel = sum(1 for _, k, _, _ in seg_log if k == "unreliable")
    print(f"unreliable whisper segments ignored: {n_unrel}")
    for s, e in joruri_regions:
        print(f"  {s/60:6.2f}m - {e/60:6.2f}m ({e-s:5.0f}s)")

    # --- レンダリング ---
    vf = sf.SoundFile(VOCALS)
    shf = sf.SoundFile(SHAMISEN)
    sr = vf.samplerate
    n_total = min(len(vf), len(shf))
    fade_n = int(FADE_SEC * sr)

    vmask = np.zeros(n_total, dtype=np.float32)
    for s, e in joruri_regions:
        a, b = int(s * sr), min(int(e * sr), n_total)
        vmask[a:b] = 1.0
        if a - fade_n >= 0:
            vmask[a - fade_n:a] = np.linspace(0, 1, fade_n)
        if b + fade_n <= n_total:
            vmask[b:b + fade_n] = np.linspace(1, 0, fade_n)

    gate_n = int(GATE_SEC * sr)
    out_full = sf.SoundFile(DIR + r"\曽根崎心中_浄瑠璃のみ_フル尺.flac", "w",
                            samplerate=sr, channels=2, format="FLAC")
    block = sr * 30
    pos = 0
    while pos < n_total:
        m = min(block, n_total - pos)
        v = vf.read(m, dtype="float32", always_2d=True)
        sh = shf.read(m, dtype="float32", always_2d=True)
        k = vmask[pos:pos + m, None]
        mix = v[:len(k)] * k + sh[:len(k)]
        if pos + m <= gate_n:
            mix[:] = 0.0
        elif pos < gate_n:
            mix[: gate_n - pos] = 0.0
        out_full.write(np.clip(mix, -1, 1))
        pos += m
    out_full.close()

    out_cat = sf.SoundFile(DIR + r"\曽根崎心中_浄瑠璃のみ_連結.flac", "w",
                           samplerate=sr, channels=2, format="FLAC")
    for s, e in joruri_regions:
        a, b = int(s * sr), min(int(e * sr), n_total)
        vf.seek(a)
        shf.seek(a)
        v = vf.read(b - a, dtype="float32", always_2d=True)
        sh = shf.read(b - a, dtype="float32", always_2d=True)
        seg = v + sh
        nf = min(fade_n, len(seg))
        seg[:nf] *= np.linspace(0, 1, nf)[:, None]
        seg[-nf:] *= np.linspace(1, 0, nf)[:, None]
        out_cat.write(np.clip(seg, -1, 1))
    out_cat.close()
    vf.close()
    shf.close()
    print("DONE")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
