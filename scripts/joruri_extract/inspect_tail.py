# -*- coding: utf-8 -*-
"""声ステムのRMSプロファイル計算と、終盤区間のレベル確認"""
import sys

import numpy as np
import soundfile as sf

DIR = r"D:\気良歌舞伎\台本\曽根崎心中\audio_sep"
VOCALS = DIR + r"\曽根崎心中_声_浄瑠璃と台詞.flac"
HOP_SEC = 0.5


def profile(path):
    rms_list = []
    with sf.SoundFile(path) as f:
        hop = int(f.samplerate * HOP_SEC)
        while True:
            block = f.read(hop, dtype="float32", always_2d=True)
            if len(block) == 0:
                break
            rms_list.append(float(np.sqrt(np.mean(block.mean(axis=1) ** 2) + 1e-12)))
    return np.array(rms_list, dtype=np.float32)


def main():
    v = profile(VOCALS)
    np.save(DIR + r"\vocals_rms.npy", v)
    vdb = 20 * np.log10(v + 1e-9)
    sdb = 20 * np.log10(np.load(DIR + r"\shamisen_rms.npy") + 1e-9)

    print("1分ごとの活動率(声 > -45dB / 三味線 > -55dB), 60分以降:")
    per_min = int(60 / HOP_SEC)
    n_min = len(vdb) // per_min
    for m in range(60, n_min + 1):
        a, b = m * per_min, min((m + 1) * per_min, len(vdb))
        if a >= len(vdb):
            break
        va = (vdb[a:b] > -45).mean() * 100
        sa = (sdb[a:b] > -55).mean() * 100
        smax = sdb[a:b].max()
        print(f"  {m:3d}m: voice {va:5.1f}%  shamisen {sa:5.1f}% (max {smax:6.1f}dB)")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
