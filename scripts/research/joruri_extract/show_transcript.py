# -*- coding: utf-8 -*-
import json
import sys

lo = float(sys.argv[1]) * 60 if len(sys.argv) > 1 else 0
hi = float(sys.argv[2]) * 60 if len(sys.argv) > 2 else 1e9

with open(r"D:\気良歌舞伎\台本\曽根崎心中\audio_sep\transcript_vocals.json", encoding="utf-8") as f:
    t = json.load(f)
for g in t:
    if lo <= g["start"] <= hi:
        d = g["end"] - g["start"]
        print(f"{g['start']/60:6.2f}m ({d:5.1f}s) {g['text'][:55]}")
