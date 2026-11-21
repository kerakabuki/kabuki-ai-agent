# 歌舞伎研究ノート2 の自声録音（録音_v2 の28本）を文字起こしし、字幕と切り出し位置の元にする
# 使い方（リポジトリルートから）: python scripts/video/kenkyu_note02/transcribe.py
import json, glob, os, sys
sys.stdout.reconfigure(encoding='utf-8')
from faster_whisper import WhisperModel
VOICE = r'D:/気良歌舞伎/youtubeチャンネル用/歌舞伎研究ノート/02_勘平の刀と屏風/録音_v3'
WORK = r'D:/気良歌舞伎/youtubeチャンネル用/歌舞伎研究ノート/02_勘平の刀と屏風/作業'
os.makedirs(WORK, exist_ok=True)
PROMPT = ('仮名手本忠臣蔵、六段目、勘平、おかる、おかや、与市兵衛、千崎弥五郎、一文字屋、お才、源六、'
          '六代目尾上菊五郎、二代目尾上松緑、松緑芸話、十三代目片岡仁左衛門、菅原と忠臣蔵、七代目尾上菊五郎、'
          '十七代目市村羽左衛門、十五代目市村羽左衛門、八代目市川団蔵、石橋健一郎、気良歌舞伎、澤、'
          '紋服、大小、屏風、逆さ屏風、鞘走る、鍔音、鯉口、障子屋体、上方、縞物、丸本、浄瑠璃。')
m = WhisperModel('medium', device='cpu', compute_type='int8')
# 既にある結果は残し、まだ文字起こししていないファイルだけ足す（採用テイクを替えたとき用）
ASR = os.path.join(WORK, 'asr.json')
out = json.load(open(ASR, encoding='utf-8')) if os.path.exists(ASR) else []
done = {x['name'] for x in out}
for f in sorted(glob.glob(os.path.join(VOICE, '*.wav'))):
    if os.path.basename(f) in done: continue
    segs, info = m.transcribe(f, language='ja', beam_size=5, word_timestamps=True,
                              condition_on_previous_text=False, initial_prompt=PROMPT, vad_filter=True)
    segs = [dict(start=s.start, end=s.end, text=s.text,
                 words=[dict(start=w.start, end=w.end, word=w.word) for w in (s.words or [])]) for s in segs]
    out.append(dict(file=f, name=os.path.basename(f), duration=info.duration, segments=segs))
    print(os.path.basename(f), round(info.duration, 1), ''.join(s['text'] for s in segs)[:60], flush=True)
    json.dump(out, open(ASR, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('DONE', len(out))
