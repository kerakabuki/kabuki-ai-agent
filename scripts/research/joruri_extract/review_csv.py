# -*- coding: utf-8 -*-
import csv
import sys

PATH = r"D:\気良歌舞伎\台本\曽根崎心中\audio_sep\joruri_regions.csv"

lo = float(sys.argv[1]) if len(sys.argv) > 1 else 0
hi = float(sys.argv[2]) if len(sys.argv) > 2 else 999

with open(PATH, encoding="utf-8-sig") as f:
    rows = list(csv.DictReader(f))
for r in rows:
    m = float(r["start"]) / 60
    if lo <= m <= hi:
        print(f"{m:6.2f}m {r['dur']:>6}s {r['kind']:6} cov={r['coverage']:<4} "
              f"jor={r['score_joruri']:<5} ser={r['score_serifu']:<5} "
              f"sham={r['shamisen']:<4} {r['text'][:42]}")
