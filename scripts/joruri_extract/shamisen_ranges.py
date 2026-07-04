# -*- coding: utf-8 -*-
"""三味線が継続的に鳴っている区間(=浄瑠璃・下座の音楽区間)を抽出"""
import sys

import numpy as np

DIR = r"D:\気良歌舞伎\台本\曽根崎心中\audio_sep"
RMS_NPY = DIR + r"\shamisen_rms.npy"

HOP = 0.5
DB_TH = -48.0
GAP_TOL = 8.0   # この秒数以内の途切れは同一区間とみなす(語りの合間の無音を許容)
MIN_LEN = 10.0  # これより短い区間は除外(ツケ等の単発音)


def main():
    rms = np.load(RMS_NPY)
    db = 20 * np.log10(rms + 1e-9)
    active = db > DB_TH

    ranges = []
    start = None
    last_on = None
    for i, a in enumerate(active):
        t = i * HOP
        if a:
            if start is None:
                start = t
            last_on = t
        elif start is not None and t - last_on > GAP_TOL:
            ranges.append((start, last_on + HOP))
            start = None
    if start is not None:
        ranges.append((start, last_on + HOP))

    ranges = [(s, e) for s, e in ranges if e - s >= MIN_LEN]
    total = sum(e - s for s, e in ranges)
    print(f"ranges={len(ranges)} total={total/60:.1f}min")
    for s, e in ranges:
        print(f"  {s/60:6.2f}m - {e/60:6.2f}m  ({e-s:5.0f}s)")

    np.save(DIR + r"\shamisen_ranges.npy", np.array(ranges))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
