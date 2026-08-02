# -*- coding: utf-8 -*-
"""64分以降のWhisperセグメントごとの台本照合スコアを確認"""
import json
import re
import sys

from rapidfuzz import fuzz

DIR = r"D:\気良歌舞伎\台本\曽根崎心中\audio_sep"


def norm_text(t):
    return re.sub(r"[〽\s、。「」()（）――…・?？!！]", "", t)


def main():
    with open(DIR + r"\script_lines.json", encoding="utf-8") as f:
        script = json.load(f)
    with open(DIR + r"\transcript_vocals.json", encoding="utf-8") as f:
        transcript = json.load(f)

    joruri = [(l["norm"], l["idx"]) for l in script if l["kind"] == "joruri" and len(l["norm"]) >= 4]
    serifu = [(l["norm"], l["idx"]) for l in script if l["kind"] == "serifu" and len(l["norm"]) >= 4]

    for g in transcript:
        if g["start"] < 64 * 60:
            continue
        q = norm_text(g["text"])
        if len(q) < 3:
            print(f"{g['start']/60:6.2f}m short  | {g['text'][:40]}")
            continue
        bj = max(joruri, key=lambda x: fuzz.partial_ratio(q, x[0]))
        bs = max(serifu, key=lambda x: fuzz.partial_ratio(q, x[0]))
        sj = fuzz.partial_ratio(q, bj[0])
        ss = fuzz.partial_ratio(q, bs[0])
        tag = "JOR" if sj > ss else "SER"
        print(f"{g['start']/60:6.2f}m {tag} j={sj:3.0f} s={ss:3.0f} | {g['text'][:36]}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
