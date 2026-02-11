"""
台詞稽古チャレンジ用ピッチ抽出スクリプト。

動画（.mp4）を渡すと ffmpeg で一時 WAV に変換してから解析します。
ffmpeg が無い場合は事前に音声だけ抽出してください：
  ffmpeg -i input.mp4 -vn -acodec pcm_s16le -ar 22050 output.wav
"""
import json
import os
import subprocess
import sys
import tempfile

import librosa
import numpy as np

HOP_LENGTH = 512
SILENCE_THRESHOLD_SEC = 0.15
DOWNSAMPLE_INTERVAL_SEC = 0.1


def _mp4_to_wav(mp4_path):
    """mp4 を ffmpeg で WAV に変換。ffmpeg が無い場合は None。"""
    try:
        fd, wav_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", mp4_path,
                "-vn", "-acodec", "pcm_s16le", "-ar", "22050", "-ac", "1",
                wav_path,
            ],
            check=True,
            capture_output=True,
        )
        return wav_path
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def extract_kabuki_data(file_path, output_json="serifu_guide.json"):
    def log(msg):
        try:
            print(msg)
        except UnicodeEncodeError:
            print(msg.encode("ascii", errors="replace").decode("ascii"))

    log(f"[OK] 解析開始: {file_path} ...")

    load_path = file_path
    temp_wav = None
    if file_path.lower().endswith(".mp4"):
        temp_wav = _mp4_to_wav(file_path)
        if temp_wav is None:
            log("[!] ffmpeg が見つかりません。次のいずれかを実行してください：")
            log("    1) ffmpeg をインストールする（winget install ffmpeg など）")
            log("    2) 手動で WAV に変換: ffmpeg -i bentenkozo.mp4 -vn -ar 22050 bentenkozo.wav")
            raise SystemExit(1)
        load_path = temp_wav
        log(f"    mp4 -> 一時 WAV に変換しました")

    try:
        # 1. 音声の読み込み (22050Hzでモノラル化)
        y, sr = librosa.load(load_path, sr=22050)
    finally:
        if temp_wav and os.path.exists(temp_wav):
            try:
                os.remove(temp_wav)
            except OSError:
                pass

    # 2. ピッチ抽出 (pYIN) — hop_length を明示して times_like と整合させる
    fmin = librosa.note_to_hz("C2")
    fmax = librosa.note_to_hz("C5")
    f0, voiced_flag, voiced_probs = librosa.pyin(
        y, fmin=fmin, fmax=fmax, sr=sr, hop_length=HOP_LENGTH
    )
    times = librosa.times_like(f0, sr=sr, hop_length=HOP_LENGTH)

    # 3. pitch_curve: 0.1秒ごとに間引きして Web 用に軽量化
    step = max(1, int(DOWNSAMPLE_INTERVAL_SEC * sr / HOP_LENGTH))
    pitch_data = []
    for i in range(0, len(times), step):
        t, f = times[i], f0[i]
        if not np.isnan(f):
            pitch_data.append({"t": round(float(t), 2), "f": round(float(f), 1)})

    # 4. 無音区間で区切ってフレーズ分割（フレーズ単位の練習UI用）
    phrases = []
    current_phrase = []
    last_t = -1.0

    for t, f in zip(times, f0):
        if not np.isnan(f):
            # 前の有声音から silence_threshold 以上空いていれば新区間
            if current_phrase and (t - last_t) > SILENCE_THRESHOLD_SEC:
                phrases.append(current_phrase)
                current_phrase = []
            current_phrase.append({"t": round(float(t), 2), "f": round(float(f), 1)})
            last_t = t
    if current_phrase:
        phrases.append(current_phrase)

    # フレーズ内も 0.1秒間隔で間引いておくと JSON がコンパクトになる
    step_phrase = max(1, int(DOWNSAMPLE_INTERVAL_SEC * sr / HOP_LENGTH))
    phrases_compact = []
    for phrase in phrases:
        if not phrase:
            continue
        pts = [phrase[i] for i in range(0, len(phrase), step_phrase)]
        if pts:
            phrases_compact.append(pts)

    # 5. JSON 出力
    output = {
        "metadata": {
            "source": os.path.basename(file_path),
            "duration": round(float(librosa.get_duration(y=y, sr=sr)), 2),
            "hop_length": HOP_LENGTH,
            "sr": sr,
        },
        "pitch_curve": pitch_data,
        "phrases": phrases_compact,
    }

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    log(f"[OK] 完了: {output_json} (pitch_curve: {len(pitch_data)} pt, phrases: {len(phrases_compact)})")


# 使いかた:
# extract_kabuki_data("shirazaa.wav")
# .mp4 の場合は事前に: ffmpeg -i input.mp4 -vn -ar 22050 output.wav