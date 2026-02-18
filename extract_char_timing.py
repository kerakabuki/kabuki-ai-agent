"""
台詞稽古チャレンジ — 文字単位タイミング抽出スクリプト

YouTube 動画から音声を取得し、Whisper の word_timestamps で
各文字の発声タイミングを抽出。CUES の charTimings に埋め込める
JSON を出力する。

必要なもの:
  pip install yt-dlp openai-whisper

使い方:
  python extract_char_timing.py
  python extract_char_timing.py --model medium
  python extract_char_timing.py --audio bentenkozo.wav   # 既に音声がある場合
"""

import argparse
import json
import os
import sys
import tempfile

# ── CUES 定義（serifu_page.js と同期） ──────────────────────
CUES = [
    {"time": 9.1,  "end": 18.5,  "text": "知らざあ言って聞かせやしょう"},
    {"time": 30.5, "end": 34.5,  "text": "浜の真砂と五右衛門が"},
    {"time": 35.1, "end": 38.5,  "text": "歌に残した盗人の"},
    {"time": 39.2, "end": 44.0,  "text": "種は尽きねぇ七里が浜"},
    {"time": 44.7, "end": 47.5,  "text": "その白浪の夜働き"},
    {"time": 48.2, "end": 51.0,  "text": "以前を言やァ江の島で"},
    {"time": 51.5, "end": 56.0,  "text": "年季勤めの稚児ヶ渕"},
    {"time": 56.8, "end": 59.0,  "text": "百味で散らす蒔銭を"},
    {"time": 59.7, "end": 64.0,  "text": "当に小皿の一文子"},
    {"time": 64.6, "end": 67.5,  "text": "百が二百と賽銭の"},
    {"time": 68.3, "end": 72.0,  "text": "くすね銭せえだんだんに"},
    {"time": 72.6, "end": 80.0,  "text": "悪事はのぼる上の宮"},
    {"time": 80.8, "end": 83.0,  "text": "岩本院で講中の"},
    {"time": 83.7, "end": 87.5,  "text": "枕さがしも度重なり"},
    {"time": 88.0, "end": 90.5,  "text": "お手長講と札附きに"},
    {"time": 91.2, "end": 97.0,  "text": "とうとう島を追い出され"},
    {"time": 97.7, "end": 101.0, "text": "それから若衆の美人局"},
    {"time": 101.8,"end": 104.8, "text": "ここやかしこの寺島で"},
    {"time": 105.4,"end": 108.2, "text": "小耳に聞いた音羽屋の"},
    {"time": 108.9,"end": 117.5, "text": "似ぬ声色で小ゆすりかたり"},
    {"time": 118.3,"end": 123.5, "text": "名さえ由縁の弁天小僧"},
    {"time": 124.4,"end": 132.0, "text": "菊之助たァおれがことだ"},
]

VIDEO_ID = "iFwMXYtqYA0"


def download_audio(video_id, output_path):
    """yt-dlp で YouTube 動画から音声を WAV で抽出"""
    import yt_dlp

    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_path.replace(".wav", ".%(ext)s"),
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "wav",
            "preferredquality": "0",
        }],
        "quiet": True,
    }
    print(f"[1/3] YouTube から音声をダウンロード中... ({video_id})")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    if not os.path.exists(output_path):
        # yt-dlp が拡張子を変えることがある
        for ext in [".wav", ".webm", ".m4a", ".mp3"]:
            candidate = output_path.replace(".wav", ext)
            if os.path.exists(candidate):
                output_path = candidate
                break

    print(f"    -> {output_path}")
    return output_path


def run_whisper(audio_path, model_name="base"):
    """Whisper で word_timestamps 付きの文字起こし"""
    import whisper

    print(f"[2/3] Whisper ({model_name}) で音声解析中...")
    model = whisper.load_model(model_name)
    result = model.transcribe(
        audio_path,
        language="ja",
        word_timestamps=True,
        verbose=False,
    )
    print(f"    -> セグメント数: {len(result['segments'])}")
    return result


def collect_words(whisper_result):
    """Whisper の結果から全 word を時系列で取得"""
    words = []
    for seg in whisper_result["segments"]:
        for w in seg.get("words", []):
            words.append({
                "word": w["word"].strip(),
                "start": round(w["start"], 3),
                "end": round(w["end"], 3),
            })
    return words


def map_cues_to_char_timings(cues, words):
    """
    各 CUE のテキストに対して、Whisper の word タイムスタンプを
    マッピングし、文字ごとの開始時刻（相対秒）を生成する。

    戻り値: 各 CUE に対応する charTimings 配列のリスト
    """
    print("[3/3] CUE と Whisper 結果をマッピング中...")
    results = []

    for ci, cue in enumerate(cues):
        cue_start = cue["time"]
        cue_end = cue["end"]
        cue_text = cue["text"]
        n_chars = len(cue_text)
        duration = cue_end - cue_start

        # この CUE の時間範囲に重なる Whisper word を抽出
        overlapping = []
        for w in words:
            # word の区間が cue の区間と重なるか
            if w["end"] > cue_start and w["start"] < cue_end:
                overlapping.append(w)

        if not overlapping:
            # Whisper で検出できなかった場合 → 均等分割にフォールバック
            print(f"    CUE #{ci}: '{cue_text[:8]}...' - Whisper ヒットなし → 均等分割")
            char_timings = [round(i * duration / n_chars, 3) for i in range(n_chars)]
            results.append(char_timings)
            continue

        # Whisper の word を文字列として結合し、CUE テキストと
        # 文字レベルでアラインメントを試みる
        # （シンプルな貪欲マッチ）
        char_timings = []
        w_idx = 0
        w_char_idx = 0  # 現在の word 内の文字位置

        for ch_i, ch in enumerate(cue_text):
            if w_idx < len(overlapping):
                w = overlapping[w_idx]
                w_text = w["word"]
                w_dur = w["end"] - w["start"]
                w_len = len(w_text)

                # word 内の相対位置から文字の開始時刻を推定
                if w_len > 0:
                    char_start_abs = w["start"] + (w_char_idx / w_len) * w_dur
                else:
                    char_start_abs = w["start"]

                char_timings.append(round(char_start_abs - cue_start, 3))

                w_char_idx += 1
                if w_char_idx >= w_len:
                    w_idx += 1
                    w_char_idx = 0
            else:
                # word が尽きた → 残りの文字は最後の word の end から均等割り
                remaining = n_chars - ch_i
                last_end = overlapping[-1]["end"] if overlapping else cue_start
                remaining_dur = cue_end - last_end
                offset = last_end - cue_start
                for j in range(remaining):
                    char_timings.append(round(offset + j * remaining_dur / remaining, 3))
                break

        # charTimings の長さを n_chars に合わせる
        while len(char_timings) < n_chars:
            last_t = char_timings[-1] if char_timings else 0
            char_timings.append(round(last_t + 0.1, 3))

        char_timings = char_timings[:n_chars]

        # 単調増加を保証
        for i in range(1, len(char_timings)):
            if char_timings[i] <= char_timings[i - 1]:
                char_timings[i] = round(char_timings[i - 1] + 0.01, 3)

        matched_words = len(overlapping)
        print(f"    CUE #{ci}: '{cue_text[:10]}' - {matched_words} words マッチ")
        results.append(char_timings)

    return results


def main():
    parser = argparse.ArgumentParser(description="台詞の文字単位タイミングを抽出")
    parser.add_argument("--model", default="base", help="Whisper モデル (tiny/base/small/medium/large)")
    parser.add_argument("--audio", default=None, help="既存の音声ファイル (指定するとダウンロードをスキップ)")
    parser.add_argument("--output", default="char_timings.json", help="出力 JSON パス")
    args = parser.parse_args()

    audio_path = args.audio
    temp_dir = None

    if audio_path is None:
        # YouTube からダウンロード
        temp_dir = tempfile.mkdtemp()
        audio_path = os.path.join(temp_dir, "audio.wav")
        audio_path = download_audio(VIDEO_ID, audio_path)

    if not os.path.exists(audio_path):
        print(f"[ERROR] 音声ファイルが見つかりません: {audio_path}")
        sys.exit(1)

    # Whisper で解析
    whisper_result = run_whisper(audio_path, model_name=args.model)

    # word 一覧を取得
    words = collect_words(whisper_result)
    print(f"    -> 検出 word 数: {len(words)}")

    # デバッグ用: Whisper の word 一覧を出力
    words_output = os.path.splitext(args.output)[0] + "_words.json"
    with open(words_output, "w", encoding="utf-8") as f:
        json.dump(words, f, indent=2, ensure_ascii=False)
    print(f"    -> Whisper words 保存: {words_output}")

    # CUES にマッピング
    all_timings = map_cues_to_char_timings(CUES, words)

    # 出力 JSON: CUES + charTimings
    output_data = []
    for cue, timings in zip(CUES, all_timings):
        output_data.append({
            "text": cue["text"],
            "time": cue["time"],
            "end": cue["end"],
            "charTimings": timings,
        })

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"\n[完了] {args.output} に charTimings を出力しました")
    print(f"       このデータを serifu_page.js の CUES にコピーしてください")

    # プレビュー
    print("\n--- プレビュー (最初の3フレーズ) ---")
    for entry in output_data[:3]:
        chars = list(entry["text"])
        timings = entry["charTimings"]
        print(f"\n  「{entry['text']}」 ({entry['time']}s - {entry['end']}s)")
        for ch, t in zip(chars, timings):
            print(f"    {ch}  +{t:.3f}s")


if __name__ == "__main__":
    main()
