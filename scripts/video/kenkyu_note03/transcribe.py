# 歌舞伎研究ノート3 の自声録音（録音_v1 の36本）を文字起こしし、字幕の元にする
# 使い方（リポジトリルートから）: python scripts/video/kenkyu_note03/transcribe.py
# 研究ノート2の transcribe.py と同じ形。CUDA の cublas が入っていないので CPU の large-v3-turbo を使う
import json, glob, os, sys
sys.stdout.reconfigure(encoding='utf-8')
from faster_whisper import WhisperModel
VOICE = r'D:/気良歌舞伎/youtubeチャンネル用/歌舞伎研究ノート/03_由良之助の文/録音_v1'
WORK = r'D:/気良歌舞伎/youtubeチャンネル用/歌舞伎研究ノート/03_由良之助の文/作業'
os.makedirs(WORK, exist_ok=True)
PROMPT = ('仮名手本忠臣蔵、七段目、祇園一力茶屋、由良之助、おかる、九太夫、力弥、顔世御前、密書、釣灯籠、簪、鯉口、鍔音、長暖簾、独吟、手水、'
          '六代目尾上菊五郎、藝、十三代目片岡仁左衛門、菅原と忠臣蔵、七代目松本幸四郎、松のみどり、九代目市川團十郎、十五代目市村羽左衛門、'
          '市川八百蔵、伊原青々園、三世坂東彦三郎、坂田半五郎、役者正札附、芝翫、梅玉、松嶋屋、いたずら紙、懐紙、扇子、繰りおろす、床本、気良歌舞伎、澤。')
m = WhisperModel('mobiuslabsgmbh/faster-whisper-large-v3-turbo', device='cpu', compute_type='int8', cpu_threads=16)
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
