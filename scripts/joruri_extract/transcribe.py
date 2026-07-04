# -*- coding: utf-8 -*-
"""声ステムをfaster-whisperで文字起こしし、タイムスタンプ付きJSONを出力"""
import json
import sys

from faster_whisper import WhisperModel

AUDIO = r"D:\気良歌舞伎\台本\曽根崎心中\audio_sep\曽根崎心中_声_浄瑠璃と台詞.flac"
OUT = r"D:\気良歌舞伎\台本\曽根崎心中\audio_sep\transcript_vocals.json"


def main():
    model = WhisperModel("large-v3", device="cuda", compute_type="float16")
    segments, info = model.transcribe(
        AUDIO,
        language="ja",
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 700},
        beam_size=5,
        condition_on_previous_text=False,
    )
    out = []
    for seg in segments:
        out.append({
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": seg.text.strip(),
        })
        print(f"[{seg.start/60:6.2f}m] {seg.text.strip()[:50]}", flush=True)

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"DONE segments={len(out)}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
