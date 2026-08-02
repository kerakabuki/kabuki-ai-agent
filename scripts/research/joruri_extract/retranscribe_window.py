# -*- coding: utf-8 -*-
"""幻覚で欠落した55-70.5分の窓を、固定20秒ブロックで再文字起こしし、
transcript_vocals.json を修復する"""
import json
import sys

import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel

DIR = r"D:\気良歌舞伎\台本\曽根崎心中\audio_sep"
AUDIO = DIR + r"\曽根崎心中_声_浄瑠璃と台詞.flac"
WIN_LO, WIN_HI = float(sys.argv[1]) * 60, float(sys.argv[2]) * 60
BLOCK = 20.0


def main():
    with sf.SoundFile(AUDIO) as f:
        sr = f.samplerate
        f.seek(int(WIN_LO * sr))
        data = f.read(int((WIN_HI - WIN_LO) * sr), dtype="float32", always_2d=True)
    mono = data.mean(axis=1)
    n_out = int(len(mono) * 16000 / sr)
    x = np.linspace(0, len(mono) - 1, n_out)
    mono16 = np.interp(x, np.arange(len(mono)), mono).astype(np.float32)

    model = WhisperModel("large-v3", device="cuda", compute_type="float16")
    new_segs = []
    t = 0.0
    total = len(mono16) / 16000
    while t < total:
        blk = mono16[int(t * 16000):int((t + BLOCK) * 16000)]
        if np.sqrt(np.mean(blk ** 2)) < 10 ** (-50 / 20):
            t += BLOCK
            continue
        segments, _ = model.transcribe(
            blk, language="ja", beam_size=5,
            condition_on_previous_text=False,
            no_speech_threshold=0.5,
        )
        for seg in segments:
            text = seg.text.strip()
            if not text:
                continue
            # ブロック内で繰り返しの多い幻覚を除外
            if len(text) > 8 and len(set(text)) / len(text) < 0.3:
                continue
            s = WIN_LO + t + seg.start
            e = min(WIN_LO + t + seg.end, WIN_LO + t + BLOCK)
            new_segs.append({"start": round(s, 2), "end": round(e, 2), "text": text})
            print(f"[{s/60:6.2f}m] ({e-s:4.1f}s) {text[:45]}", flush=True)
        t += BLOCK

    with open(DIR + r"\transcript_vocals.json", encoding="utf-8") as f:
        old = json.load(f)
    kept = [g for g in old if g["end"] <= WIN_LO or g["start"] >= WIN_HI]
    merged = sorted(kept + new_segs, key=lambda g: g["start"])
    with open(DIR + r"\transcript_vocals.json", "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=1)
    print(f"DONE window_segs={len(new_segs)} total={len(merged)}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
