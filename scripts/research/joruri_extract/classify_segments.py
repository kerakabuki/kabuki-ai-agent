# -*- coding: utf-8 -*-
"""文字起こし区間を「浄瑠璃/台詞」に分類する。

判定材料:
1. 台本との曖昧照合(浄瑠璃〽行 vs 台詞行、rapidfuzz partial_ratio)
2. 三味線ステムの音量(浄瑠璃は三味線を伴う)
"""
import csv
import json
import re
import sys

import numpy as np
from rapidfuzz import fuzz

DIR = r"D:\気良歌舞伎\台本\曽根崎心中\audio_sep"
SCRIPT_JSON = DIR + r"\script_lines.json"
TRANSCRIPT_JSON = DIR + r"\transcript_vocals.json"
RMS_NPY = DIR + r"\shamisen_rms.npy"
OUT_JSON = DIR + r"\segments_classified.json"
OUT_CSV = DIR + r"\segments_classified.csv"

HOP_SEC = 0.5
SHAMISEN_DB_TH = -45.0
MATCH_MARGIN = 10  # 照合スコア差がこれ以上なら台本判定を優先


def norm_text(t: str) -> str:
    return re.sub(r"[〽\s、。「」()（）――…・?？!！]", "", t)


def main():
    with open(SCRIPT_JSON, encoding="utf-8") as f:
        script = json.load(f)
    with open(TRANSCRIPT_JSON, encoding="utf-8") as f:
        segs = json.load(f)
    rms = np.load(RMS_NPY)
    db = 20 * np.log10(rms + 1e-9)

    joruri_lines = [l["norm"] for l in script if l["kind"] == "joruri" and len(l["norm"]) >= 4]
    serifu_lines = [l["norm"] for l in script if l["kind"] == "serifu" and len(l["norm"]) >= 4]

    def shamisen_activity(start, end):
        i0 = max(0, int((start - 1.0) / HOP_SEC))
        i1 = min(len(db), int((end + 1.0) / HOP_SEC) + 1)
        if i1 <= i0:
            return 0.0
        return float((db[i0:i1] > SHAMISEN_DB_TH).mean())

    results = []
    for seg in segs:
        q = norm_text(seg["text"])
        sj = max((fuzz.partial_ratio(q, l) for l in joruri_lines), default=0) if len(q) >= 4 else 0
        ss = max((fuzz.partial_ratio(q, l) for l in serifu_lines), default=0) if len(q) >= 4 else 0
        act = shamisen_activity(seg["start"], seg["end"])

        if len(q) >= 5 and sj - ss >= MATCH_MARGIN:
            kind, why = "joruri", "script"
        elif len(q) >= 5 and ss - sj >= MATCH_MARGIN:
            kind, why = "serifu", "script"
        else:
            kind, why = ("joruri", "shamisen") if act >= 0.5 else ("serifu", "shamisen")

        results.append({
            "start": seg["start"], "end": seg["end"], "text": seg["text"],
            "score_joruri": sj, "score_serifu": ss,
            "shamisen": round(act, 2), "kind": kind, "why": why,
        })

    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=1)
    with open(OUT_CSV, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(results[0].keys()))
        w.writeheader()
        w.writerows(results)

    n_j = sum(1 for r in results if r["kind"] == "joruri")
    dur_j = sum(r["end"] - r["start"] for r in results if r["kind"] == "joruri")
    dur_s = sum(r["end"] - r["start"] for r in results if r["kind"] == "serifu")
    print(f"joruri: {n_j} segs / {dur_j/60:.1f} min")
    print(f"serifu: {len(results)-n_j} segs / {dur_s/60:.1f} min")
    print("--- joruri samples ---")
    shown = 0
    for r in results:
        if r["kind"] == "joruri" and shown < 12:
            print(f"[{r['start']/60:6.2f}m] ({r['why']}, sham={r['shamisen']}) {r['text'][:40]}")
            shown += 1


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
