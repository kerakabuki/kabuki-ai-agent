# 歌舞伎研究ノート3「由良之助は、手紙を垂らすのか、巻き取るのか」動画の組み立て（仮組み）
# 研究ノート2（scripts/video/kenkyu_note02/build.py）の道具を写して作った。画づくりも研究ノート1・2にそろえる:
#   生成りの紙に明朝の見出しと要点／舞台映像は元速度・無音で下に一行の説明／芸談の頁写真
# 語りは自声（声の収録室 seed-note3-v4 の36本。30番だけ録り直しの take07）。声は -18 LUFS、全体で約 -16 LUFS
# 公演音声の挿入は2か所: 14番のあと（長暖簾が落ちて独吟・手水）、25番のあと（三人の絵＝繰りおろす文）
# 29番の頭の「そう書いています」は28番の引用を受ける一言なので切らない。28→29の間は詰める
# 字幕は焼き付けず、SRT と MP4 内の切替式トラックにする
# 使い方（リポジトリルートから）: python scripts/video/kenkyu_note03/build.py [audio|graphics|render|mux|all]
#   字幕の元の文字起こしは transcribe.py（audio のあと、mux の前に一度）
import json, math, os, re, subprocess, sys, glob, hashlib, concurrent.futures
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
sys.stdout.reconfigure(encoding='utf-8')

BASE = Path(r'D:/気良歌舞伎/youtubeチャンネル用/歌舞伎研究ノート/03_由良之助の文')
VOICE = BASE / '録音_v1'
WORK = BASE / '作業'
OUT = BASE / '出力'
G = WORK / 'graphics'; A = WORK / 'audio'; R = WORK / 'render'
for p in (WORK, OUT, G, A, R): p.mkdir(parents=True, exist_ok=True)
STAGE = r'D:/気良歌舞伎/ビデオ/平成26年忠臣蔵七段目.mp4'  # 1280x720。YouTube 2LCGmgf-qhM と同じ時刻
P = BASE / '資料写真'
KR = Path(r'D:/気良歌舞伎/記録写真/2014/祭礼公演_子ども白浪＋忠臣蔵七段目＋太功記')
def kr(who, f): return dict(img=str(KR / who / '演目_祇園一力' / f), credit=f'気良歌舞伎 2014年公演 記録写真（撮影：{who}様）' if who != '撮影者不明' else '気良歌舞伎 2014年公演 記録写真')
SEED = Path(r'C:/Users/NAO/Documents/Codex/2026-11-03/sns/outputs/動画用録音アプリ/app/seed-note3-v4.json')
STAGE_SRC = '気良歌舞伎 2014年公演『仮名手本忠臣蔵』七段目より（由良之助＝澤）'
NOTE = '歌舞伎研究ノート 3'
NVOICE = 36
W, H, FPS = 1920, 1080, 30
INK = '#171c1c'; PAPER = '#f0ece2'; RED = '#a84132'; MUTED = '#676a63'; LIGHT = '#f0ece2'

seed = json.loads(SEED.read_text(encoding='utf-8'))
BLOCKS = seed['blocks']

# ---------------------------------------------------------------- 画面の設計（ブロックごと）
CH = {'0': 'はじめに', '1': '01 手紙を開く前の作法', '2': '02 江戸から明治へ', '3': '03 昭和の決断',
      '4': '04 端の切れた手紙と、いたずら紙', '5': '05 おわりに'}
def chap(i): return CH[BLOCKS[i]['chapter'][0]]

S_SUGA = '十三代目片岡仁左衛門『菅原と忠臣蔵』（向陽書房、昭和56年）'
S_GEI = '六代目尾上菊五郎『藝』（改造社、昭和22年）'
S_K85 = '『歌舞伎』第85号（明治40年5月）国立国会図書館デジタルコレクション'
S_MATSU = '七代目松本幸四郎『松のみと里 琴松芸談』（法木書店、昭和12年）'
# 頁の写真を出すのは保護期間の切れた資料だけ（『藝』・『歌舞伎』第85号）。『菅原と忠臣蔵』『芸づくし忠臣蔵』は引用の文字だけ（2026-11-21）
# 各場面: (種類, 始まり, 引数)。始まりは 0＝ブロックの頭、小数＝ブロックの長さの中の割合、文字列＝台本のその言葉を語り始めた所
# qspan: 語りがそのまま読み上げる引用を、声に合わせて何枚かに分けて全文出す（from〜to は台本の言葉）
# 2014年の映像は、使う区間で由良之助が画面に入っていることをコマで確かめてある（2026-11-21。16:38〜16:50・20:58〜21:12 は左へ切れる）
PLAN = {
 1: [('title', 0, {}), ('video', .5, dict(t=1181, cap='釣灯籠の下で、密書を読む由良之助。'))],
 2: [('video', 0, dict(t=1186, cap='二階のおかる、縁の下の九太夫。')),
     ('quote', '「あんな', dict(text='「あんな大事な手紙を、\n地面につくようなことを\nするだろうか」', sub='最初に抱いた、素朴な疑問。', src=''))],
 3: [('card', 0, dict(title='手紙を、垂らすか。巻き取るか。', items=[('繰りおろす', '読みながら、順に下へ垂らしていく'), ('巻き取る', '垂らさずに、手元で巻きながら読む')], src=''))],
 4: [('card', 0, dict(title='今回の資料', items=[('『歌舞伎』第85号（明治40年）', '市村座の型と、編者の注記'), ('七代目松本幸四郎『松のみと里』（昭和12年）', ''), ('六代目尾上菊五郎『藝』（昭和22年）', ''), ('十三代目片岡仁左衛門『菅原と忠臣蔵』（昭和56年）', ''), ('2014年 気良歌舞伎の舞台', '私が由良之助を演じた')], src=''))],
 5: [('video', 0, dict(t=815, cap='由良之助が奥へ入っている間に、九太夫が刀を抜いて確かめる。')),
     ('video', 'といっても', dict(t=868, cap='駕籠には乗らず、縁の下へ忍び込む。'))],
 6: [('video', 0, dict(t=990, cap='「一寸行って来るぞよ」')),
     ('page', .18, dict(img=str(P/'歌舞伎85号_2_p48_暖簾の場面.png'), name='『歌舞伎』第85号', lines='明治40年3月\n市村座の型', src=S_K85 + ' 48頁')),
     ('qspan', '「暖簾の後まで', dict(to='前へ出て」', src=S_K85 + ' 48頁'))],
 7: [('page', 0, dict(img=str(P/'歌舞伎85号_3_p48_独吟.png'), name='『歌舞伎』第85号', lines='明治の歌舞伎座\n市川八百蔵の型', src=S_K85 + ' 48頁')),
     ('card', '刀を取り上げて', dict(title='八百蔵の鍔音', items=[('刀を取り上げて、少し抜き掛ける', '「九太はもう」'), ('抜いて見たな、と察する', ''), ('鞘に納めて、鍔音を聞かせる', '「往なれたそうな」')], src=S_K85 + ' 48頁 注記'))],
 8: [('quote', 0, dict(text='十三代目片岡仁左衛門', sub='『菅原と忠臣蔵』（昭和56年）', src='')),
     ('qspan', '自分の刀の位置', dict(to='私もそうします', src=S_SUGA))],
 9: [('page', 0, dict(img=str(P/'歌舞伎85号_3_p48_独吟.png'), name='長唄の独吟', lines='「父よ母よと\n啼く聲聞けば」', src=S_K85 + ' 48頁'))],
 10: [('snap', 0, dict(kr('中田幸三', 'DPP_8221.JPG'), cap='手水鉢で、手と口を清める。', c=(0.5, 0.4))),
      ('card', 'ちなみに', dict(title='独吟と手水の段取り', items=[('十三代目仁左衛門', '独吟に合わせて刀を置き、扇を衿元に、手水'), ('『歌舞伎』第85号（明治40年）', '独吟の間に縁先へ。義太夫になってから手水')], src='『菅原と忠臣蔵』／『歌舞伎』第85号 48頁'))],
 11: [('snap', 0, dict(kr('中田幸三', 'DPP_8286.JPG'), cap='釣灯籠の下で。', c=(0.5, 0.35))),
      ('card', 'という写実的な', dict(title='写実の仕草', items=[('灯芯を掻き立て、油のついた指を鬢で拭く', ''), ('上包みを灯籠の火で燃やして、下に落とす', '')], src='『歌舞伎』第85号／『菅原と忠臣蔵』'))],
 12: [('snap', 0, dict(kr('中田幸三', 'DPP_8222.JPG'), cap='2014年。手紙をいただいて、開く。', c=(0.5, 0.35))),
      ('video', '舞台で本物の火', dict(t=1120, cap='本物の火は、使えなかった。'))],
 13: [('card', 0, dict(title='火の扱いには、神経を使う。', items=[('燃やした灰が、客席へ飛ぶ', ''), ('舞台の布に、燃え移る', '')], src=S_MATSU))],
 14: [('snap', 0, dict(kr('中田幸三', 'DPP_8284.JPG'), cap='七段目の中でも、私が好きなところ。', c=(0.5, 0.35)))],
 15: [('quote', 0, dict(text='これだけ警戒して開いた密書を、\nなぜ、下へ垂らすのか。', sub='', src=''))],
 16: [('page', 0, dict(img=str(P/'藝_p73.jpg'), name='六代目尾上菊五郎『藝』', lines='寫實に合理的に\nすぐれた工夫が\n篩ひ殘つた', src=S_GEI + ' 73頁／蔵書写真')),
      ('qspan', '初めの間は', dict(to='篩い残った', src=S_GEI + ' 73頁', hl='すぐれた工夫が篩い残った'))],
 17: [('page', 0, dict(img=str(P/'藝_p77.jpg'), name='六代目尾上菊五郎『藝』', lines='少しく巻讀みにして\n讀むうちに\n端の方を取落し', src=S_GEI + ' 77〜78頁（評判記『役者正札附』を引く）／蔵書写真')),
      ('card', 'また坂田半五郎', dict(title='江戸の工夫', items=[('三世坂東彦三郎', '少し巻きながら読み、端を垂らしていく'), ('坂田半五郎', '羽織の中へ入れて読み、簪の音で取り落とす')], src=S_GEI + ' 77〜78頁'))],
 18: [('card', 0, dict(title='九代目市川團十郎の型', items=[('芝翫から、梅玉の型を聞き出した', '芝翫＝四代目中村芝翫、梅玉＝三代目中村歌右衛門の俳名とみられる'), ('両手で長文を受けながら読む', ''), ('簪の音で後ろへ隠すと、ばらりと長く落ちる', '')], src=S_GEI + ' 78頁')),
      ('page', 'という型を取り入れて', dict(img=str(P/'藝_p78.jpg'), name='六代目尾上菊五郎『藝』', lines='芝翫から梅玉の型を\n聞出して、うまいものが\n見付つた', src=S_GEI + ' 78頁／蔵書写真'))],
 19: [('page', 0, dict(img=str(P/'歌舞伎85号_4a_p49_伊原_前半.png'), name='『歌舞伎』第85号', lines='左から繰り出して\n右で巻きながら読む', src=S_K85 + ' 49頁')),
      ('page', 'ところが', dict(img=str(P/'歌舞伎85号_4b_p49_伊原_後半.png'), name='劇評家・伊原青々園', lines='古書を見て、\nこう提言した', src=S_K85 + ' 49頁')),
      ('qspan', '「片端を', dict(to='都合も好い」', src='伊原青々園の提言（' + S_K85 + ' 49頁）'))],
 20: [('video', 0, dict(t=1160, cap='十五代目市村羽左衛門も、垂らして読んだ。')),
      ('qspan', '「もっとも', dict(to='形が悪かった」', src=S_K85 + ' 49頁'))],
 21: [('quote', 0, dict(text='十三代目片岡仁左衛門', sub='『菅原と忠臣蔵』（昭和56年）', src='')),
      ('qspan', '九代目團十郎さんも', dict(to='型になっているのです', src=S_SUGA))],
 22: [('card', 0, dict(title='七代目松本幸四郎の段取り', items=[('左手から繰り出し、右手で巻きながら読む', ''), ('簪が落ちたのに驚いて、手が外れる', ''), ('手紙が長く、縁の方へ流れる', '')], src=S_MATSU))],
 23: [('flow', 0, dict(title='十三代目仁左衛門の決断', steps=['父と同じ、巻き取る型', '研究会の先生方と相談', '順に繰りおろす型へ'], src=S_SUGA))],
 24: [('quote', 0, dict(text='理由の一つめ\n義太夫の本文', sub='', src='')),
      ('qspan', '「下家よりは', dict(to='神ならず」', src='『仮名手本忠臣蔵』七段目 床本')),
      ('quote', '最初から順に', dict(text='最初から順に繰りおろせば、\n本文の流れに、ピタリと合う。', sub='このあとに、おかるの簪が落ちる。', src=''))],
 25: [('quote', 0, dict(text='「第一、絵にもなる」\n「さまとしてもいいですね」', sub='理由の二つめ', src=S_SUGA)),
      ('snap', '二階のおかるが', dict(kr('撮影者不明', '2014_撮影者不明_演目_祇園一力_011.jpg'), cap='二階のおかる、一階の由良之助、縁の下の九太夫。', c=(0.5, 1.0)))],
 26: [('video', 0, dict(t=1246, cap='簪の音に驚いて、手紙を後ろへ。')),
      ('snap', .28, dict(kr('中田幸三', 'DPP_8225.JPG'), cap='後ろ手で巻いていくと、端が切れている。', c=(0.5, 0.35))),
      ('card', 'この段取りは', dict(title='端が切れていることに気づく', items=[('三世坂東彦三郎の型', '江戸。評判記『役者正札附』'), ('『歌舞伎』第85号', '明治40年。「端の切れたのが手に障るので不審の科」'), ('十三代目仁左衛門の芸談', '昭和')], src=S_GEI + '／' + S_K85.split('国立')[0] + '／' + S_SUGA))],
 27: [('card', 0, dict(title='下に誰かいるのか、試す。', items=[('九代目の型', '懐紙を丸め、「風に吹かれて」と縁から落とす'), ('九太夫が、思わず手を出す', '')], src=S_SUGA + ' 109頁')),
      ('qspan', '「フン', dict(to='じゃのう」', src=S_SUGA + ' 109頁'))],
 28: [('quote', 0, dict(text='十三代目片岡仁左衛門', sub='『菅原と忠臣蔵』（昭和56年）', src='')),
      ('qspan', '「これは私が', dict(to='なんです」', src=S_SUGA)),
      ('card', '使うのは懐紙', dict(title='十三代目仁左衛門の、いたずら紙', items=[('茶屋で、髪に付けられた紙', '松嶋屋では「いたずら紙」'), ('付けたまま、二度目の出', 'ここで取って丸めて落とす')], src=S_SUGA + ' 105頁')),
      ('qspan', '「これをそのまま', dict(to='落とし……」', src=S_SUGA + ' 109〜110頁'))],
 29: [('quote', 0, dict(text='十五代目片岡仁左衛門', sub='関容子『芸づくし忠臣蔵』の聞き書きより', src='')),
      ('qspan', '「父は', dict(to='ますよ」', src='十五代目片岡仁左衛門（関容子『芸づくし忠臣蔵』）')),
      ('quote', '茶屋の遊びの', dict(text='茶屋の遊びの名残の一枚が、\n九太夫をあぶり出す\n道具に変わる。', sub='', src=''))],
 30: [('snap', 0, dict(kr('中田幸三', 'DPP_8226.JPG'), cap='髪に付けたいたずら紙が、肩にはらりとかかる。', c=(0.55, 0.3))),
      ('video', '2014年の舞台では', dict(t=1338, cap='2014年。丸めて、そっと落とす。'))],
 31: [('card', 0, dict(title='二つの考え方', items=[('垂らさずに、巻き取る', '大事な密書。写実・合理性を貫く'), ('順に、繰りおろす', '本文に合い、三人が並ぶ絵面になる')], src=''))],
 32: [('flow', 0, dict(title='200年の工夫', steps=['江戸', '明治', '昭和'], src=''))],
 33: [('snap', 0, dict(kr('猪島敏昭', '2014祇園一力茶屋 (65).jpg'), cap='2014年。順に繰りおろす型を選んだ。', c=(0.5, 0.5)))],
 34: [('snap', 0, dict(kr('撮影者不明', '2014_撮影者不明_演目_祇園一力_014.jpg'), cap='一通の手紙で、三人が一つに繋がる。', c=(0.5, 1.0)))],
 35: [('quote', 0, dict(text='「第一画面の形になって好く」\n　　伊原青々園（明治）\n「第一、絵にもなる」\n　　十三代目片岡仁左衛門（昭和）', sub='', src='『歌舞伎』第85号 49頁／' + S_SUGA, small=True))],
 36: [('end', 0, {})],
}
# 公演映像の挿入（元の音を生かす）。after のブロックのあとに入れる
INSERTS = [
 dict(after=14, start=1020.0, end=1108.0, cap='公演映像　長暖簾が落ちて、独吟と手水', chapter='公演映像　独吟と手水'),
 dict(after=25, start=1146.0, end=1200.0, cap='公演映像　繰りおろす文', chapter='公演映像　繰りおろす文'),
]
TIGHT = {29}  # 前のブロックとの間を詰める（29番の頭の「そう書いています」が28番の引用を受ける）


# ---------------------------------------------------------------- 音声
def ff(args, capture=True):
    p = subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-y', *map(str, args)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if p.returncode: raise RuntimeError(p.stderr.decode('utf-8', 'replace')[-3000:])
    return p.stderr.decode('utf-8', 'replace')

def voice_files():
    fs = sorted(glob.glob(str(VOICE / '*.wav')))
    assert len(fs) == NVOICE, len(fs)
    return fs

def speech_bounds(f, dur):
    log = ff(['-i', f, '-af', 'highpass=f=80,silencedetect=noise=-42dB:d=0.25', '-f', 'null', '-'])
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    first = ends[0] if starts and starts[0] < 0.05 and ends else 0.0
    last = starts[-1] if starts and (len(ends) < len(starts)) else dur
    return first, last

def norm(job):
    key, src, a, b, voice, target = job
    dur = b - a
    filt = 'highpass=f=65,pan=stereo|c0=c0|c1=c0' if voice else 'anull'
    pre = ['-ss', a, '-t', dur, '-i', src, '-vn']
    m = json.loads(re.search(r'\{\s*"input_i".*?\}', ff(pre + ['-af', filt + f',loudnorm=I={target}:TP=-2:LRA=11:print_format=json', '-f', 'null', '-']), re.S).group())
    ln = (f'loudnorm=I={target}:TP=-2:LRA=11:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:measured_LRA={m["input_lra"]}'
          f':measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true')
    chain = f'{filt},{ln},afade=t=in:d=0.04,afade=t=out:st={max(0, dur - 0.08)}:d=0.08'
    dest = A / f'{key}.wav'
    ff(pre + ['-af', chain, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', dest])
    return dict(key=key, src=src, src_in=a, src_out=b, path=str(dest), duration=dur)

def build_audio():
    jobs = []
    for i, f in enumerate(voice_files(), 1):
        d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))
        first, last = speech_bounds(f, d)
        jobs.append((f'{i:02}', f, max(0, first - 0.35), min(d, last + 0.45), True, -18))
    for k, ins in enumerate(INSERTS): jobs.append((f'stage{k}', STAGE, ins['start'], ins['end'], False, -21))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        res = {r['key']: r for r in pool.map(norm, jobs)}
    # 並べる: ブロック間 0.45秒、章が変わる所 1.0秒、冒頭 0.8秒、末尾 3.0秒
    tl, t = [], 0.8
    for i in range(1, NVOICE + 1):
        r = res[f'{i:02}']
        if i > 1:
            t += 1.0 if BLOCKS[i-1]['chapter'] != BLOCKS[i-2]['chapter'] else 0.15 if i in TIGHT else 0.45
        tl.append(dict(r, block=i, start=round(t, 3), end=round(t + r['duration'], 3))); t += r['duration']
        for k, ins in enumerate(INSERTS):
            if i == ins['after']:
                t += 0.8; s = res[f'stage{k}']
                tl.append(dict(s, block='stage', ins=k, start=round(t, 3), end=round(t + s['duration'], 3))); t += s['duration'] + 0.8
    total = t + 3.0
    json.dump(dict(total=total, items=tl), open(WORK / 'timeline.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    # 合成（adelay で配置）
    ins, fl = [], []
    for k, it in enumerate(tl):
        ins += ['-i', it['path']]
        ms = round(it['start'] * 1000)
        fl.append(f'[{k}:a]adelay={ms}|{ms}[a{k}]')
    mix = ''.join(f'[a{k}]' for k in range(len(tl))) + f'amix=inputs={len(tl)}:normalize=0:dropout_transition=0,apad,atrim=duration={total:.3f}[m]'
    ff(ins + ['-filter_complex', ';'.join(fl) + ';' + mix, '-map', '[m]', '-ar', '48000', '-c:a', 'pcm_s24le', WORK / 'assembly.wav'])
    # 全体を -16 LUFS に
    m = json.loads(re.search(r'\{\s*"input_i".*?\}', ff(['-i', WORK / 'assembly.wav', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']), re.S).group())
    ff(['-i', WORK / 'assembly.wav', '-af', f'loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:measured_LRA={m["input_lra"]}:measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true',
        '-ar', '48000', '-c:a', 'pcm_s24le', WORK / 'master.wav'])
    print('AUDIO total', round(total, 1), 's')

# ---------------------------------------------------------------- 画像
# 字の大きさはスマホで読めるように決めた（2026-11-21 本人指摘）: 見出し72・項目56・補足40・引用80・映像の説明54・出典30
fonts = {}
def font(size, serif=False, bold=False):
    k = (int(size), serif, bold)
    if k not in fonts:
        fonts[k] = ImageFont.truetype('C:/Windows/Fonts/' + ('yumin.ttf' if serif else 'YuGothB.ttc' if bold else 'YuGothM.ttc'), int(size))
    return fonts[k]

def text(im, xy, s, size=42, color=INK, serif=False, bold=False, spacing=18, maxw=None, hl=None):
    d = ImageDraw.Draw(im); lines = s.split('\n'); actual = size
    maxw = maxw or (W - xy[0] - 90)
    while max(d.textlength(l, font=font(actual, serif, bold)) for l in lines) > maxw and actual > 18: actual -= 1
    y = xy[1]
    for l in lines:
        d.text((xy[0], y), l, font=font(actual, serif, bold), fill=(RED if hl and hl in l else color)); y += actual + spacing
    return y

def shell(chapter, source):
    im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 20, H), fill=INK)
    text(im, (92, 40), NOTE, 40, serif=True)
    tw = d.textlength(chapter, font=font(32)); text(im, (int(1826 - tw), 50), chapter, 32, color=RED)
    d.line((94, 121, 1826, 121), fill='#b7b4a9', width=1); d.rectangle((94, 119, 202, 122), fill=RED)
    if source:
        d.line((94, 966, 1826, 966), fill='#c9c4b8', width=1)
        text(im, (94, 990), source, 30, color=MUTED, maxw=1730)
    return im

def src_of(a): return ('出典：' + a['src']) if a.get('src') else ''

def g_card(i, a):
    im = shell(chap(i), src_of(a)); d = ImageDraw.Draw(im)
    text(im, (96, 175), a['title'], 72, serif=True)
    n = len(a['items']); y = 330
    step = min(190, (930 - 330 - 110) // max(1, n - 1)) if n > 1 else 190
    for k, (head, body) in enumerate(a['items']):
        text(im, (98, y + 12), f'{k+1:02}', 32, color=RED)
        d.line((166, y + 12, 166, y + (step - 30 if n > 1 else 120)), fill='#ccc5b8', width=2)
        text(im, (196, y), head, 56 if n < 5 else 50, bold=True, maxw=1630)
        if body: text(im, (198, y + (70 if n < 5 else 62)), body, 40 if n < 5 else 34, color=MUTED, maxw=1630)
        y += step
    return im

def g_flow(i, a):
    im = shell(chap(i), src_of(a)); d = ImageDraw.Draw(im)
    text(im, (96, 175), a['title'], 72, serif=True)
    n = len(a['steps']); bw = 500; gap = (1732 - bw * n) // max(1, n - 1); x = 94
    for k, s in enumerate(a['steps']):
        d.rectangle((x, 400, x + bw, 660), outline='#b7b4a9', width=2)
        text(im, (x + 30, 424), f'{k+1:02}', 32, color=RED)
        text(im, (x + 30, 500), s, 54, bold=True, maxw=bw - 60)
        if k < n - 1:
            ax = x + bw + gap // 2; d.polygon([(ax - 16, 512), (ax + 16, 530), (ax - 16, 548)], fill=RED)
        x += bw + gap
    if a.get('note'): text(im, (96, 720), a['note'], 38, color=MUTED, maxw=1700)
    return im

def g_quote(i, a):
    im = shell(chap(i), src_of(a)); d = ImageDraw.Draw(im)
    size = 64 if a.get('small') else 80
    nl = a['text'].count('\n') + 1
    top = max(170, 540 - nl * (size + 36) // 2 - 30)
    d.rectangle((96, top, 106, top + nl * (size + 36) - 36), fill=RED)
    y = text(im, (150, top), a['text'], size, serif=True, spacing=36, maxw=1660, hl=a.get('hl'))
    if a.get('sub'): text(im, (152, y + 40), a['sub'], 42, color=MUTED, maxw=1660)
    return im

def g_page(i, a):
    im = shell(chap(i), src_of(a)); d = ImageDraw.Draw(im)
    d.rectangle((94, 150, 960, 946), fill='#e3ddd0')
    # 提供写真は EXIF の回転情報（向き6＝90度）で縦に立つので、それを当ててから縮める
    p = ImageOps.contain(ImageOps.exif_transpose(Image.open(a['img'])).convert('RGB'), (820, 770), method=Image.Resampling.LANCZOS)
    im.paste(p, (94 + (866 - p.width) // 2, 150 + (796 - p.height) // 2))
    y = text(im, (1030, 230), a['name'], 56, serif=True, spacing=18, maxw=800)
    d.rectangle((1032, y + 30, 1110, y + 35), fill=RED)
    text(im, (1032, y + 80), a['lines'], 56, spacing=26, maxw=800)
    return im

def lower(cap, source=STAGE_SRC, chapter=''):
    fg = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(fg)
    for y in range(H):
        a = int(max(0, (y - 700) / 380) * 215)
        if y < 160: a = max(a, 150 - y)
        if a: d.line((0, y, W, y), fill=(10, 16, 16, a))
    text(fg, (88, 36), NOTE, 40, color=LIGHT, serif=True)
    if chapter:
        tw = d.textlength(chapter, font=font(32)); text(fg, (int(1830 - tw), 46), chapter, 32, color=LIGHT)
    d.rectangle((92, 902, 102, 962), fill=RED)
    text(fg, (126, 898), cap, 54, color=LIGHT, serif=True, maxw=1700)
    text(fg, (128, 994), source, 30, color='#d6d3ca', maxw=1700)
    return fg

def frame(t):
    dest = G / f'frame_{t:.1f}.jpg'
    if not dest.exists(): ff(['-ss', t, '-i', STAGE, '-frames:v', 1, '-q:v', 2, dest])
    return dest

def g_title(i, a):
    im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 20, H), fill=INK)
    text(im, (96, 50), '気良歌舞伎', 30, color=MUTED); text(im, (1480, 58), 'KABUKI RESEARCH NOTES', 24, color=MUTED)
    text(im, (96, 140), NOTE, 50, serif=True)
    d.rectangle((98, 225, 200, 229), fill=RED)
    text(im, (96, 290), '由良之助は、\n手紙を垂らすのか、\n巻き取るのか', 84, serif=True, spacing=28, maxw=840)
    text(im, (98, 670), '『仮名手本忠臣蔵』七段目\n「繰りおろす文」を、芸談から読む', 42, color=MUTED, spacing=16, maxw=840)
    text(im, (98, 960), '語り・構成　気良歌舞伎　澤', 30, color=MUTED)
    p = ImageOps.fit(Image.open(frame(1181.0)).convert('RGB').crop((0, 100, 1000, 704)), (880, 620), method=Image.Resampling.LANCZOS)
    im.paste(p, (960, 230))
    return im

def g_end(i, a):
    im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 20, H), fill=INK)
    text(im, (96, 150), NOTE, 50, serif=True)
    d.rectangle((98, 235, 200, 239), fill=RED)
    text(im, (96, 300), '次に七段目を見る時は、\n手紙の端の行方まで。', 80, serif=True, spacing=30)
    text(im, (98, 600), '出典の一覧と note 記事へのリンクは概要欄に。', 42, color=MUTED)
    text(im, (98, 960), '気良歌舞伎　語り・構成　澤', 30, color=MUTED)
    return im

# ---------------------------------------------------------------- 声と台本の対応（画面の切り替えと字幕の両方で使う）
NORM = re.compile(r'[\s、。，．「」『』（）()…―—\-・！？!?〽／]')
_asr = None
def block_clock(it):
    """このブロックの台本（声のとおり）の1字ごとに、全体の時間軸での時刻を返す関数を作る"""
    import difflib
    global _asr
    if _asr is None: _asr = {a['name']: a for a in json.load(open(WORK / 'asr.json', encoding='utf-8'))}
    a = _asr[os.path.basename(it['src'])]
    hyp, ht = '', []
    for sg in a['segments']:
        for w in sg['words']:
            wt = NORM.sub('', w['word'])
            for k, ch in enumerate(wt):
                hyp += ch; ht.append(w['start'] + (w['end'] - w['start']) * k / max(1, len(wt)))
    raw = sub_text(it['block']); ref = NORM.sub('', raw)
    mp = {}
    for m in difflib.SequenceMatcher(None, ref, hyp, autojunk=False).get_matching_blocks():
        for k in range(m.size): mp[m.a + k] = ht[m.b + k]
    known = sorted(mp)
    def at(ix):
        if not known: return None
        if ix in mp: v = mp[ix]
        else:
            lo = max([k for k in known if k < ix], default=None); hi = min([k for k in known if k > ix], default=None)
            v = mp[hi] if lo is None else mp[lo] if hi is None else mp[lo] + (mp[hi] - mp[lo]) * (ix - lo) / (hi - lo)
        return it['start'] + v - it['src_in']
    def phrase(p):
        """台本のこの言葉を語り始めた時刻"""
        q = NORM.sub('', p); ix = ref.find(q)
        if ix < 0: raise KeyError(f"{it['block']}番の台本に「{p}」がない")
        return at(ix)
    return raw, ref, at, phrase

def quote_pages(raw, frm, to, limit=60):
    """台本の frm〜to の引用を頁に分ける。文（。）の切れ目で分け、1文が長い時だけ読点で分ける"""
    i = raw.index(frm); j = raw.index(to, i) + len(to)
    q = raw[i:j].replace('\n', '')
    sents = re.findall(r'[^。]+。?[」』]*', q)
    units = []
    for st in sents:
        if len(st) <= limit: units.append(st); continue
        parts = re.findall(r'[^、]+、?', st); cur = ''
        target = len(st) / math.ceil(len(st) / limit)
        for pt in parts:
            if cur and (len(cur) + len(pt) > limit or len(cur) >= target): units.append(cur); cur = ''
            cur += pt
        if cur: units.append(cur)
    pages, cur = [], ''
    for u in units:
        if cur and len(cur) + len(u) > limit: pages.append(cur); cur = ''
        cur += u
    if cur: pages.append(cur)
    return pages

PUNCT = '、。」』…'
def qwrap(s, n=19):
    """引用の1頁を、1行 n 字前後で折る。読点の後ろで折り、行の頭に句読点を置かない"""
    out, line = [], ''
    for p in re.findall(r'[^、。]+[、。」』…]*', s):
        if line and len(line) <= 6 and len(p) > n + 2: p = line + p; line = ''
        while len(p) > n + 2:
            cut = n
            while cut < len(p) and p[cut] in PUNCT: cut += 1
            if line: out.append(line); line = ''
            out.append(p[:cut]); p = p[cut:]
        if line and len(line) + len(p) > n + 2: out.append(line); line = ''
        line += p
    if line: out.append(line)
    return '\n'.join(out)

def build_graphics():
    tl = json.load(open(WORK / 'timeline.json', encoding='utf-8'))
    scenes = []
    items = tl['items']
    prev_end = 0.0
    for it in items:
        start, end = prev_end, it['end']
        if it is items[-1]: end = tl['total']
        prev_end = end
        if it['block'] == 'stage':
            ins = INSERTS[it['ins']]; ovp = G / f"stage{it['ins']}_ov.png"
            # 挿入の区間を変えたのに audio を作り直していないと、音と映像がずれる（2026-11-21 に4秒ずれた）
            if abs(it['src_in'] - ins['start']) > 0.01 or abs(it['src_out'] - ins['end']) > 0.01:
                raise SystemExit(f"公演映像の挿入{it['ins']}の区間が音声と合わない。先に audio を作り直す")
            lower(ins['cap'], chapter='公演映像').save(ovp)
            scenes.append(dict(kind='stagevideo', start=start, dur=end - start, t=ins['start'] - (it['start'] - start), overlay=str(ovp))); continue
        b = it['block']; span = end - start
        raw, ref, at, phrase = block_clock(it)
        # qspan を頁ごとの場面に開き、各場面の始まりの時刻を決める
        plan = []
        for kind, when, a in PLAN[b]:
            if kind == 'qspan':
                for k, pg in enumerate(quote_pages(raw, when, a['to'])):
                    plan.append(('quote', pg[:6] if k else when, dict(text=qwrap(pg), sub='', src=a['src'], hl=a.get('hl'))))
            else: plan.append((kind, when, a))
        starts = []
        for k, (kind, when, a) in enumerate(plan):
            if k == 0 or when == 0: s = start
            elif isinstance(when, str): s = phrase(when) - 0.25
            else: s = start + span * when
            starts.append(max(s, (starts[-1] + 1.2) if starts else start))
        for k, (kind, when, a) in enumerate(plan):
            t = starts[k]; dur = (starts[k + 1] if k + 1 < len(plan) else end) - t
            name = f'{b:02}_{k}_{kind}'
            if kind == 'video':
                lower(a['cap'], chapter=chap(b - 1)).save(G / f'{name}.png')
                scenes.append(dict(kind='video', start=t, dur=dur, t=a['t'], crop=a.get('crop'), overlay=str(G / f'{name}.png')))
            elif kind == 'snap':
                bg = ImageOps.fit(ImageOps.exif_transpose(Image.open(a['img'])).convert('RGB'), (W, H), method=Image.Resampling.LANCZOS, centering=a.get('c', (0.5, 0.5)))
                bg.save(G / f'{name}_bg.png'); lower(a['cap'], source=a['credit'], chapter=chap(b - 1)).save(G / f'{name}.png')
                scenes.append(dict(kind='photo', start=t, dur=dur, bg=str(G / f'{name}_bg.png'), overlay=str(G / f'{name}.png')))
            else:
                im = dict(title=g_title, end=g_end, card=g_card, flow=g_flow, quote=g_quote, page=g_page)[kind](b - 1, a)
                im.save(G / f'{name}.png')
                scenes.append(dict(kind='still', start=t, dur=dur, src=str(G / f'{name}.png'), first=(b == 1 and k == 0), last=(kind == 'end')))
    json.dump(scenes, open(WORK / 'scenes.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('GRAPHICS', len(scenes), 'scenes')

# ---------------------------------------------------------------- 映像
ENC = ['-c:v', 'h264_nvenc', '-preset', 'p5', '-tune', 'hq', '-rc', 'vbr', '-cq', '20', '-b:v', '0', '-maxrate', '12M', '-bufsize', '24M',
       '-g', '60', '-bf', '0', '-profile:v', 'high',  # B-frame を使うと DTS が負になり、concat のつなぎ目で約3コマずつ落ちる
       '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-video_track_timescale', '15360']

def render_one(pair):
    i, s = pair
    n = round((s['start'] + s['dur']) * FPS) - round(s['start'] * FPS)
    dest = R / f'{i:03}.mp4'; sig = hashlib.sha256((json.dumps(s, sort_keys=True) + json.dumps(ENC) + ''.join(str(os.path.getmtime(s[k])) for k in ('src', 'bg', 'overlay') if k in s)).encode()).hexdigest()  # 画像を描き替えたら書き出し直す
    if dest.exists() and (R / f'{i:03}.sha').exists() and (R / f'{i:03}.sha').read_text() == sig: return dest
    cmd = []
    if s['kind'] in ('video', 'stagevideo'):
        c = s.get('crop'); pre = f'crop={c[2]}:{c[3]}:{c[0]}:{c[1]},' if c else ''
        cmd = ['-ss', s['t'], '-i', STAGE, '-loop', 1, '-framerate', FPS, '-i', s['overlay'],
               '-filter_complex', f'[0:v]fps=30,{pre}scale=1920:1080:flags=lanczos,setsar=1,setpts=PTS-STARTPTS[v];[v][1:v]overlay=0:0:format=auto,format=yuv420p[o]', '-map', '[o]']
    elif s['kind'] == 'photo':
        cmd = ['-loop', 1, '-framerate', FPS, '-i', s['bg'], '-loop', 1, '-framerate', FPS, '-i', s['overlay'], '-filter_complex',
               f"[0:v]scale=3840:2160,zoompan=z='1+0.025*on/{max(1, n - 1)}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d={n}:s=1920x1080:fps=30,setsar=1[v];[v][1:v]overlay=0:0:format=auto,format=yuv420p[o]", '-map', '[o]']
    else:
        vf = 'scale=1920:1080,format=yuv420p,setsar=1'
        if s.get('first'): vf += ',fade=t=in:st=0:d=0.6'
        if s.get('last'): vf += f',fade=t=out:st={max(0, n / FPS - 2.0):.2f}:d=2.0'
        cmd = ['-loop', 1, '-framerate', FPS, '-i', s['src'], '-vf', vf]
    ff(cmd + ['-an', '-frames:v', n, '-r', FPS] + ENC + [dest])
    (R / f'{i:03}.sha').write_text(sig); print('RENDERED', i, s['kind'], n, flush=True)
    return dest

def build_render():
    scenes = json.load(open(WORK / 'scenes.json', encoding='utf-8'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: files = list(pool.map(render_one, enumerate(scenes)))
    (R / 'concat.txt').write_text('\n'.join(f"file '{f.as_posix()}'" for f in files), encoding='utf-8')
    print('RENDER done', len(files))

# ---------------------------------------------------------------- 字幕・チャプター・書き出し
FIX = [  # 機械の文字起こしの誤変換（研究ノート3の録音で出たもの）
 ('二座右衛門', '仁左衛門'), ('二財門', '仁左衛門'), ('二座衛門', '仁左衛門'), ('ニザエモン', '仁左衛門'), ('くだ湯', '九太夫'), ('くだゆう', '九太夫'), ('管は', '九太は'), ('くだはもう', '九太はもう'),
 ('調図', '手水'), ('頂図', '手水'), ('長図', '手水'), ('の連', '暖簾'), ('水係', '御簾から'), ('道路', '灯籠'), ('うざいもん', '羽左衛門'), ('肝臓状', '勧進帳'), ('男十郎', '團十郎'), ('詩館', '芝翫'),
 ('オカルの', 'おかるの'), ('オカル', 'おかる'), ('かんざし', '簪'), ('YUKAHONDE', '床本で'), ('ゆらのすけ', '由良之助'), ('ケラ歌舞伎', '気良歌舞伎'), ('沢です', '澤です'),
 ('菅原と中心蔵', '菅原と忠臣蔵'), ('中心蔵', '忠臣蔵'), ('センス', '扇子'), ('1コマ', 'ひとこま')]

def fmt(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h:02}:{m:02}:{int(s):02},{int(round((s - int(s)) * 1000)) % 1000:03}'

# 字幕の文字は台本から取り、出す時刻だけを文字起こしに合わせる（機械の文字起こしは誤変換が多すぎるため）
# 録音で言い回しを変えたブロックは、声のとおりの文をここに書く（2026-11-21 文字起こしで確かめた）
SPOKEN = {
 2: '二階からはおかるが鏡に映して覗き見し、縁の下からは、敵方に内通する九太夫が、垂れてきた手紙の端を盗み読む――。\nただ、私自身、この場面を見たとき、最初に抱いた素朴な疑問はこれでした。\n「あんな大事な手紙を、地面につくようなことをするだろうか」',
 3: '調べてみると、これ、私だけの疑問じゃなかったんです。\n江戸や明治の昔から、歌舞伎の名優たちのあいだでも、ずっと議論になってきた問題だったことがわかりました。\n手紙を読みながら下へ垂らす、つまり「繰りおろす」のか。\nそれとも、垂らさずに、手元で巻き取りながら読むのか。',
 14: 'それでも、鯉口をピシャッとおさめて「往なれたそうな」できまり、独吟に乗せて手水をつかう――この流れは、七段目の中でも私が好きなところです。\nどうしてもお手本にしたくて、一つひとつの所作を丁寧に演じました。',
 30: '由良之助には最初から、いたずら紙を付けておきました。\n肩にはらりとかかった一枚の紙があるだけで、茶屋で遊んでいた雰囲気が出ると思ったんです。\n2014年の舞台では、この仁左衛門さんの型にならって、そのいたずら紙で九太夫を試しました。\nただ、扇子にのせるところまではせず、丸めて、そっと落としています。',
}
EDIT = {  # 台本の一部だけを声に合わせる
 5: [('忍び込んでいます。', '忍び込んでいるのです。')],
 8: [('これは見たな、これで帰ったな', 'これは見たな、そして、これで帰ったな')],
 18: [('芝翫――四代目中村芝翫とみられます――から、梅玉――三代目中村歌右衛門の俳名とみられます――の型', '芝翫から梅玉の型')],
 22: [('実際、ここで', 'ここで')],
 25: [('という理由です。', 'という理由でした。')],
 28: [('松嶋屋では、これを「いたずら紙」と呼んでいるんですね。', '松嶋屋さんは、これを「いたずら紙」と呼んでいます。'), ('仁左衛門の由良之助は、それを', 'それを')],
 29: [('今の十五代目', 'そう書いています。\n今の十五代目'), ('なっているんですね。', 'なっているんです。')],
 32: [('見えてきます。', '見えてきました。')],
}
def sub_text(b):
    if b in SPOKEN: return SPOKEN[b]
    t = BLOCKS[b - 1]['text']
    for x, y in EDIT.get(b, []):
        assert x in t, (b, x); t = t.replace(x, y)
    return t

def chunks(t):
    # 文ごとに切り、長い文は「、」で二つ三つに分ける（1枚38字まで）
    out = []
    for sent in re.findall(r'[^。！？\n]+[。！？」』]*', t.replace('\n\n', '\n')):
        sent = sent.strip()
        if not sent: continue
        while len(sent) > 38:
            cands = [m.end() for m in re.finditer('[、」]', sent) if 10 <= m.end() <= 38]
            cut = min(cands, key=lambda c: abs(c - len(sent) / 2)) if cands else 30
            out.append(sent[:cut]); sent = sent[cut:]
        out.append(sent)
    return out

def wrap(c):
    if len(c) <= 22: return c
    cands = [m.end() for m in re.finditer('[、」』]', c) if 6 <= m.end() <= len(c) - 4]
    cut = min(cands, key=lambda x: abs(x - len(c) / 2)) if cands else len(c) // 2
    return c[:cut] + '\n' + c[cut:]

def build_mux():
    import difflib
    tl = json.load(open(WORK / 'timeline.json', encoding='utf-8'))
    asr = {a['name']: a for a in json.load(open(WORK / 'asr.json', encoding='utf-8'))}
    subs = []
    for it in tl['items']:
        if it['block'] == 'stage': continue
        a = asr[os.path.basename(it['src'])]
        # 文字起こしの1字ごとの時刻
        hyp, ht = '', []
        for sg in a['segments']:
            for w in sg['words']:
                wt = NORM.sub('', w['word'])
                for k, ch in enumerate(wt):
                    hyp += ch; ht.append(w['start'] + (w['end'] - w['start']) * k / max(1, len(wt)))
        cs = chunks(sub_text(it['block']))
        ref = ''.join(NORM.sub('', c) for c in cs)
        mp = {}
        for m in difflib.SequenceMatcher(None, ref, hyp, autojunk=False).get_matching_blocks():
            for k in range(m.size): mp[m.a + k] = ht[m.b + k]
        known = sorted(mp)
        def at(ix):
            if not known: return None
            if ix in mp: return mp[ix]
            lo = max([k for k in known if k < ix], default=None); hi = min([k for k in known if k > ix], default=None)
            if lo is None: return mp[hi]
            if hi is None: return mp[lo]
            return mp[lo] + (mp[hi] - mp[lo]) * (ix - lo) / (hi - lo)
        pos = 0; times = []
        for c in cs:
            n = len(NORM.sub('', c)); times.append((at(pos), at(pos + n - 1))); pos += n
        for k, (c, (st, en)) in enumerate(zip(cs, times)):
            st = it['start'] + st - it['src_in']
            en = (it['start'] + times[k + 1][0] - it['src_in'] - 0.05) if k + 1 < len(cs) else it['end']
            st = max(it['start'], st); en = min(it['end'], max(en, st + 0.8))
            subs.append((st, en, wrap(c)))
    for k in range(len(subs) - 1):  # 重なりを消す
        if subs[k][1] > subs[k + 1][0]: subs[k] = (subs[k][0], subs[k + 1][0] - 0.02, subs[k][2])
    srt = '\n'.join(f'{k+1}\n{fmt(a)} --> {fmt(b)}\n{t}\n' for k, (a, b, t) in enumerate(subs))
    (OUT / '歌舞伎研究ノート3_日本語字幕_v2.srt').write_text(srt, encoding='utf-8')
    # チャプター（各章の最初のブロックの開始）
    chs, seen = [], set()
    for it in tl['items']:
        if it['block'] == 'stage': chs.append((it['start'], INSERTS[it['ins']]['chapter'])); continue
        c = BLOCKS[it['block'] - 1]['chapter']
        if c not in seen: seen.add(c); chs.append((0 if not chs else it['start'] - 0.5, c.split('　', 1)[1] if '　' in c else c))
    chs.sort()
    meta = ';FFMETADATA1\ntitle=由良之助は、手紙を垂らすのか、巻き取るのか｜歌舞伎研究ノート3\n'
    for k, (st, title) in enumerate(chs):
        en = chs[k + 1][0] if k + 1 < len(chs) else tl['total']
        meta += f'[CHAPTER]\nTIMEBASE=1/1000\nSTART={int(st*1000)}\nEND={int(en*1000)}\ntitle={title}\n'
    (WORK / 'chapters.ffmeta').write_text(meta, encoding='utf-8')
    desc = '\n'.join(f'{int(st//60)}:{int(st%60):02} {t}' for st, t in chs)
    (OUT / 'チャプター_v2.txt').write_text(desc, encoding='utf-8')
    dest = OUT / '歌舞伎研究ノート3_由良之助の文_v2_1080p.mp4'
    ff(['-f', 'concat', '-safe', 0, '-i', R / 'concat.txt', '-i', WORK / 'master.wav', '-i', OUT / '歌舞伎研究ノート3_日本語字幕_v2.srt', '-i', WORK / 'chapters.ffmeta',
        '-map', '0:v', '-map', '1:a', '-map', '2:s', '-map_metadata', 3, '-map_chapters', 3, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-c:s', 'mov_text',
        # -shortest だと字幕の終わり（最後の語り）で映像も音も切れるので、全体の長さを -t で指定する
        '-metadata:s:s:0', 'language=jpn', '-t', f"{tl['total']:.3f}", '-movflags', '+faststart', dest])
    print('OUT', dest, len(subs), 'subs', len(chs), 'chapters')

if __name__ == '__main__':
    step = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if step in ('audio', 'all'): build_audio()
    if step in ('graphics', 'all'): build_graphics()
    if step in ('render', 'all'): build_render()
    if step in ('mux', 'all'): build_mux()
