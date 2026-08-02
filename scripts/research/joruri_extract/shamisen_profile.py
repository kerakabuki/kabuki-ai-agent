# -*- coding: utf-8 -*-
"""三味線ステムの0.5秒ごとのRMSプロファイルを計算して保存"""
import sys

import numpy as np
import soundfile as sf

AUDIO = r"D:\気良歌舞伎\台本\曽根崎心中\audio_sep\曽根崎心中_三味線.flac"
OUT = r"D:\気良歌舞伎\台本\曽根崎心中\audio_sep\shamisen_rms.npy"

HOP_SEC = 0.5


def main():
    rms_list = []
    with sf.SoundFile(AUDIO) as f:
        hop = int(f.samplerate * HOP_SEC)
        while True:
            block = f.read(hop, dtype="float32", always_2d=True)
            if len(block) == 0:
                break
            mono = block.mean(axis=1)
            rms_list.append(float(np.sqrt(np.mean(mono ** 2) + 1e-12)))

    rms = np.array(rms_list, dtype=np.float32)
    np.save(OUT, rms)
    db = 20 * np.log10(rms + 1e-9)
    print(f"frames={len(rms)} hop={HOP_SEC}s total={len(rms)*HOP_SEC/60:.1f}min")
    print(f"db: min={db.min():.1f} median={np.median(db):.1f} max={db.max():.1f}")
    # 活動率の目安
    for th in (-50, -45, -40, -35):
        print(f"  > {th}dB: {(db > th).mean()*100:.1f}%")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
