# 歌舞伎研究ノート2「勘平は、なぜ刀で髪を直すのか」動画の組み立て（仮組み）
# 研究ノート1（Codex v13: Documents/Codex/2026-11-07/new-chat/work/video-v13）の画づくりにそろえる:
#   生成りの紙に明朝の見出しと要点／舞台映像は元速度・無音で下に一行の説明／芸談の頁写真／写真のズームは2.5%
# 語りは自声（録音_v2 の28本）。ブロック内の間は残し、録音の待ち時間だけ端で詰める。声は -18 LUFS、全体で約 -16 LUFS
# 公演音声の挿入は「鯉口を鳴らす」のあと（屏風を逆さに立てる→刀を鏡に髪を直す→おかやが出る）
# 字幕は焼き付けず、SRT と MP4 内の切替式トラックにする（研究ノート1と同じ）
# 使い方（リポジトリルートから）: python scripts/video/kenkyu_note02/build.py [audio|graphics|render|mux|all]
import json, math, os, re, subprocess, sys, glob, hashlib, concurrent.futures
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
sys.stdout.reconfigure(encoding='utf-8')

BASE = Path(r'D:/気良歌舞伎/youtubeチャンネル用/歌舞伎研究ノート/02_勘平の刀と屏風')
VOICE = BASE / '録音_v3'  # 2026-11-19 05・14・15 を採用し直した版
WORK = BASE / '作業'
OUT = BASE / '出力'
G = WORK / 'graphics'; A = WORK / 'audio'; R = WORK / 'render'
for p in (WORK, OUT, G, A, R): p.mkdir(parents=True, exist_ok=True)
STAGE = r'D:/気良歌舞伎/ビデオ/清流座/ぎふ清流プラザ令和３年/0627-Cyusingura-Rokudanme.mp4'
PHOTOS = Path(r'C:/Users/NAO/Documents/Codex/2026-11-07/new-chat/outputs/勘平の刀_調査_20261113/sources/user_photos')
KIROKU = Path(r'D:/気良歌舞伎/記録写真/2021/清流文化プラザ公演_忠臣蔵五六段目')
SEED = Path(r'C:/Users/NAO/Documents/Codex/2026-11-03/sns/outputs/動画用録音アプリ/app/seed-note2-v1.json')
STAGE_SRC = '気良歌舞伎 2021年「清流の国ぎふ 地歌舞伎勢揃い公演」六段目より'
W, H, FPS = 1920, 1080, 30
INK = '#171c1c'; PAPER = '#f0ece2'; RED = '#a84132'; MUTED = '#676a63'; LIGHT = '#f0ece2'

seed = json.loads(SEED.read_text(encoding='utf-8'))
BLOCKS = seed['blocks']

# ---------------------------------------------------------------- 画面の設計（ブロックごと）
# 各場面: (種類, 比率, 引数)。比率はそのブロックの長さの中での割合
# video: 公演映像の秒（元速度・無音）, cap: 下の説明
# 章ラベル（右上）
CH = {
 '0': 'はじめに', '1': '01 武士に戻れるという期待', '2': '02 上方の型と十三代目仁左衛門', '3': '03 期待していた来客なのに',
 '4': '04 屏風を逆さにするか', '5': '05 髪を直すまでの、三つのきっかけ', '6': '06 鏡にしない勘平、音を立てない勘平',
 '7': '07 気良歌舞伎では、どう演じたか', '8': '08 二代目松緑のいう「自然になる」'}
def chap(i): return CH[BLOCKS[i]['chapter'][0]]

PLAN = {
 1: [('title', .45, {}), ('video', .55, dict(t=3588.5, cap='屏風の前で、刀を鏡にして髪を直す。', crop=(560,300,920,518)))],
 2: [('video', .5, dict(t=3300, cap='おかやに責められる勘平。')),
     ('card', .5, dict(title='同じ仕草にも、違いがある。', items=[('刀をいつ用意するのか', '帰ってすぐか、侍が来てからか'), ('どんなきっかけで髪を直すのか', '気づいて抜くのか、鞘走るのか')], src='芸談を読み比べる'))],
 3: [('photo', 1, dict(img=str(KIROKU/'2021_清流文化プラザ公演_忠臣蔵五六段目_021.jpg'), title='気良歌舞伎で役者をやっている、澤です。', sub='今回は六段目。刀と屏風の扱いから、勘平の気持ちを考える。'))],
 4: [('video', 1, dict(t=600, cap='五十両を届けて、家に帰ってきた勘平。'))],
 5: [('page', .5, dict(img=str(PHOTOS/'六代目菊五郎_芸_p155.jpg'), name='六代目尾上菊五郎『芸』', lines='着替えの時に\nおかるに大小を\n持ってこさせる', src='六代目尾上菊五郎『芸』155頁／提供写真')),
     ('card', .5, dict(title='紋服と大小を用意するのは、なぜか。', items=[('千崎の来訪を心待ちにして', 'せめて武士の姿で会うため'), ('源六に向けた仕草ではない', '誤って伝えられている、と『芸』')], src='六代目尾上菊五郎『芸』155頁'))],
 6: [('video', .45, dict(t=695, cap='浅葱の紋服に着替える。')),
     ('card', .55, dict(title='二代目松緑は、喜びから読む。', items=[('仇討ちに加われる', '五十両を届けたから'), ('主君に忠義を立てられる', ''), ('武士に戻れる', '刀を用意する動きに、期待が表れる')], src='二代目尾上松緑『松緑芸話』「勘平」'))],
 7: [('card', 1, dict(title='上方系の代表的な扱い', items=[('帰宅時は、普段着風の縞物', 'この時点では大小を持ち出さない'), ('二人の侍が来てから、黒い紋服を着ようとする', 'おかやに取り上げられる'), ('最後に、おかやから着せてもらう', '')], src='石橋健一郎「芸談で綴る狂言鑑賞」『演劇界』平成3年2月（国立劇場公開再録）'))],
 8: [('card', 1, dict(title='遺体を、どこに置くか。', items=[('音羽屋型', '仏壇の下の戸棚の前'), ('関西系', '障子屋体に入れるのが普通らしい'), ('戸棚から、あとで紋服や大小を出すからか', '鑑賞文の推測。言い切らない')], src='石橋健一郎「芸談で綴る狂言鑑賞」（国立劇場公開再録）'))],
 9: [('page', .5, dict(img=str(PHOTOS/'菅原と忠臣蔵_p074.jpg'), name='十三代目片岡仁左衛門\n『菅原と忠臣蔵』', lines='衣裳は東京型\n刀は、侍が来てから', src='十三代目片岡仁左衛門『菅原と忠臣蔵』74頁／提供写真')),
     ('card', .5, dict(title='今そこにいるのは、町人と女性たち。', items=[('千崎が来るかどうかも分からない', ''), ('この段階で大小を差すのは、おかしいのではないか', '十三代目仁左衛門の考え')], src='十三代目片岡仁左衛門『菅原と忠臣蔵』74頁'))],
 10: [('card', 1, dict(title='紋服は先に。刀は、侍が来てから。', items=[('来訪を期待して、先に刀まで用意するのか', '六代目菊五郎・二代目松緑'), ('来たと分かってから、刀を出すのか', '十三代目仁左衛門'), ('勘平は、どこまで先のことを考えているか', '')], src='『芸』155頁／『菅原と忠臣蔵』74・77頁'))],
 11: [('quote', 1, dict(text='折悪けれども勘平は、\n腰ふさぎ脇挟んで出で迎ひ', sub='浄瑠璃の本文には、着替える場面も、大小を用意する場面も書かれていない。', src='『仮名手本忠臣蔵』六段目 床本（現行の文楽の本文）'))],
 12: [('video', .5, dict(t=1725, cap='財布の縞が、同じだった。')), ('video', .5, dict(t=2525, cap='与市兵衛の遺体が運び込まれる。'))],
 13: [('video', .55, dict(t=3520, cap='二人の侍が訪ねてくる。屏風で隠す。')),
      ('card', .45, dict(title='十三代目仁左衛門の段取り', items=[('屏風を立てる', ''), ('仏壇の下の戸棚から刀を出す', '包みをほどく'), ('ここで初めて、刀を用意する', '')], src='十三代目片岡仁左衛門『菅原と忠臣蔵』77頁'))],
 14: [('page', .5, dict(img=str(PHOTOS/'六代目菊五郎_芸_p168.jpg'), name='六代目尾上菊五郎『芸』', lines='屏風を逆にして\n母親と死骸をかくす', src='六代目尾上菊五郎『芸』168頁／提供写真')),
      ('video', .5, dict(t=3540, cap='屏風を逆さに立てて、隠す。'))],
 15: [('card', 1, dict(title='屏風の向きにまで、気がつくだろうか。', items=[('技としては面白い', '十三代目仁左衛門'), ('侍が来てうろたえている勘平は、表のことが気になっている', ''), ('その仕草をする気持ちが、その時の勘平にあるか', '')], src='十三代目片岡仁左衛門『菅原と忠臣蔵』77頁'))],
 16: [('page', .4, dict(img=str(PHOTOS/'六代目菊五郎_芸_p168.jpg'), name='六代目尾上菊五郎『芸』', lines='乱れし髪に心付き\n中腰のまま\n刀を横たえて少し抜き', src='六代目尾上菊五郎『芸』168頁／提供写真')),
      ('flow', .6, dict(title='六代目菊五郎の順序', steps=['髪の乱れに気づく', '刀を少し抜く', '鏡にして直す'], src='六代目尾上菊五郎『芸』167〜168頁'))],
 17: [('page', .4, dict(img=str(PHOTOS/'菅原と忠臣蔵_p078.jpg'), name='十三代目片岡仁左衛門\n『菅原と忠臣蔵』', lines='ほこりを払っていると\n刀が鞘走る', src='十三代目片岡仁左衛門『菅原と忠臣蔵』77〜78頁／提供写真')),
      ('flow', .6, dict(title='十三代目仁左衛門の順序', steps=['ほこりを払う', '鞘走る', '少し抜いて、鏡にして直す'], src='十三代目片岡仁左衛門『菅原と忠臣蔵』77〜78頁'))],
 18: [('flow', 1, dict(title='立ち上がる時の鞘走り', steps=['立ち上がる', 'ふっと鞘走る', '鏡にして直す'], note='七代目尾上菊五郎が、十七代目市村羽左衛門から教わった、と語る（2017年）。誰が最初に考えたかを示す話ではない。', src='松竹「歌舞伎美人」2017年4月5日'))],
 19: [('card', 1, dict(title='同じ「鞘走る」でも。', items=[('ほこりを払う時', '十三代目仁左衛門'), ('立ち上がる時', '七代目尾上菊五郎'), ('駆け出す時', '関西系。大小だけを持って駆け出すはずみに')], src='石橋健一郎「芸談で綴る狂言鑑賞」／『菅原と忠臣蔵』／歌舞伎美人'))],
 20: [('page', .45, dict(img=str(PHOTOS/'団蔵型の勘平_八代目談_01.jpg'), name='八代目市川団蔵\n「団蔵型の勘平」', lines='刀に髪を映して\n直すことはしない', src='八代目市川団蔵談「団蔵型の勘平」／提供写真')),
      ('card', .55, dict(title='鏡にしない勘平もいる。', items=[('七代目市川団蔵の演じ方', '息子の八代目団蔵が語る'), ('刀を鏡にする仕草も', 'すべての勘平に共通するわけではない')], src='八代目市川団蔵談「団蔵型の勘平」'))],
 21: [('card', 1, dict(title='刀を納める音が、合図になる。', items=[('鍔音を合図に、おかやが屏風から出る', '六代目尾上菊五郎『芸』'), ('勘平が逃げると思って、引き止める', ''), ('おかやは刀の音を聞いて出る', '十三代目片岡仁左衛門『菅原と忠臣蔵』')], src='『芸』168頁／『菅原と忠臣蔵』78頁'))],
 22: [('page', .4, dict(img=str(PHOTOS/'六段目の勘平_十五代目羽左衛門_p487.png'), name='十五代目市村羽左衛門\n「六段目の勘平」', lines='「カチン」という音を\nやめた', src='十五代目市村羽左衛門「六段目の勘平」（昭和12年）再録487頁')),
      ('card', .6, dict(title='音を立てずに納めたい。', items=[('刀は静かに納めるもの', '刀剣の専門家から聞いた'), ('表には客人もいる', ''), ('十五代目と十七代目は別の人', '鞘走りを教えたのは十七代目')], src='十五代目市村羽左衛門「六段目の勘平」（『演芸画報』昭和12年12月）'))],
 23: [('video', .5, dict(t=640, cap='気良歌舞伎の勘平。喜び勇んで立ち返る。')), ('video', .5, dict(t=720, cap='紋服を出させ、大小も出させる。'))],
 24: [('video', 1, dict(t=3528, cap='悪い出来事を、屏風の向こうに封じ込めたい。'))],
 25: [('video', .5, dict(t=3585, cap='立ち上がる勢いで、刀が鞘走る。', crop=(560,300,920,518))), ('video', .5, dict(t=3592, cap='そこで、ふと髪の乱れが気になって、直す。', crop=(560,300,920,518)))],
 26: [('card', 1, dict(title='刀を納める音で、気持ちを切り替える。', items=[('髪を整え、襟を正す', ''), ('刀を納め、鯉口を鳴らす', '表の千崎たちを迎えに行く'), ('舞台の上では、おかやが出る合図', '')], src='気良歌舞伎での演じ方（本人の説明）'))],
 27: [('quote', 1, dict(text='ここなども段取りを気にしていたら\nわざとらしくなって、勘平じゃなくなります。\nそれから、たびたびやっているうちに\n自然になるんです。', sub='', src='二代目尾上松緑『松緑芸話』「勘平」より', small=True))],
 28: [('video', .5, dict(t=3590, cap='刀が鏡になる一瞬の、少し前から。', crop=(560,300,920,518))), ('end', .5, {})],
}
STAGE_INSERT = dict(after=26, start=3514.0, end=3612.0, cap='公演映像　屏風を逆さに立て、刀を鏡に髪を直す')

# ---------------------------------------------------------------- 音声
def ff(args, capture=True):
    p = subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-y', *map(str, args)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if p.returncode: raise RuntimeError(p.stderr.decode('utf-8', 'replace')[-3000:])
    return p.stderr.decode('utf-8', 'replace')

def voice_files():
    fs = sorted(glob.glob(str(VOICE / '*.wav')))
    assert len(fs) == 28, len(fs)
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
    jobs.append(('stage', STAGE, STAGE_INSERT['start'], STAGE_INSERT['end'], False, -21))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        res = {r['key']: r for r in pool.map(norm, jobs)}
    # 並べる: ブロック間 0.45秒、章が変わる所 1.0秒、冒頭 0.8秒、末尾 3.0秒
    tl, t = [], 0.8
    for i in range(1, 29):
        r = res[f'{i:02}']
        if i > 1:
            t += 1.0 if BLOCKS[i-1]['chapter'] != BLOCKS[i-2]['chapter'] else 0.45
        tl.append(dict(r, block=i, start=round(t, 3), end=round(t + r['duration'], 3))); t += r['duration']
        if i == STAGE_INSERT['after']:
            t += 0.8; s = res['stage']
            tl.append(dict(s, block='stage', start=round(t, 3), end=round(t + s['duration'], 3))); t += s['duration'] + 0.8
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
fonts = {}
def font(size, serif=False, bold=False):
    k = (int(size), serif, bold)
    if k not in fonts:
        fonts[k] = ImageFont.truetype('C:/Windows/Fonts/' + ('yumin.ttf' if serif else 'YuGothB.ttc' if bold else 'YuGothM.ttc'), int(size))
    return fonts[k]

def text(im, xy, s, size=42, color=INK, serif=False, bold=False, spacing=18, maxw=None):
    d = ImageDraw.Draw(im); lines = s.split('\n'); actual = size
    maxw = maxw or (W - xy[0] - 90)
    while max(d.textlength(l, font=font(actual, serif, bold)) for l in lines) > maxw and actual > 18: actual -= 1
    y = xy[1]
    for l in lines:
        d.text((xy[0], y), l, font=font(actual, serif, bold), fill=color); y += actual + spacing
    return y

def shell(chapter, source):
    im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 20, H), fill=INK)
    text(im, (92, 46), '歌舞伎研究ノート 2', 34, serif=True)
    tw = d.textlength(chapter, font=font(24)); text(im, (int(1826 - tw), 55), chapter, 24, color=RED)
    d.line((94, 121, 1826, 121), fill='#b7b4a9', width=1); d.rectangle((94, 119, 202, 122), fill=RED)
    d.line((94, 970, 1826, 970), fill='#c9c4b8', width=1)
    text(im, (94, 994), source, 24, color=MUTED)
    return im

def g_card(i, a):
    im = shell(chap(i), '出典：' + a['src']); d = ImageDraw.Draw(im)
    text(im, (96, 202), a['title'], 64, serif=True)
    y = 380
    for n, (head, body) in enumerate(a['items']):
        text(im, (98, y + 6), f'{n+1:02}', 24, color=RED)
        d.line((154, y + 9, 154, y + 100), fill='#ccc5b8', width=1)
        text(im, (184, y), head, 42, bold=True)
        if body: text(im, (186, y + 60), body, 28, color=MUTED)
        y += 150
    return im

def g_flow(i, a):
    im = shell(chap(i), '出典：' + a['src']); d = ImageDraw.Draw(im)
    text(im, (96, 202), a['title'], 64, serif=True)
    n = len(a['steps']); bw = 470; gap = (1732 - bw * n) // max(1, n - 1); x = 94
    for k, s in enumerate(a['steps']):
        d.rectangle((x, 430, x + bw, 640), outline='#b7b4a9', width=2)
        text(im, (x + 28, 452), f'{k+1:02}', 26, color=RED)
        text(im, (x + 28, 520), s, 44, bold=True, maxw=bw - 56)
        if k < n - 1:
            ax = x + bw + gap // 2; d.polygon([(ax - 14, 520), (ax + 14, 535), (ax - 14, 550)], fill=RED)
        x += bw + gap
    if a.get('note'): text(im, (96, 720), a['note'], 30, color=MUTED, maxw=1700)
    return im

def g_quote(i, a):
    im = shell(chap(i), '出典：' + a['src']); d = ImageDraw.Draw(im)
    size = 56 if a.get('small') else 72
    d.rectangle((96, 250, 104, 250 + 120 * a['text'].count('\n') + 120), fill=RED)
    y = text(im, (150, 250), a['text'], size, serif=True, spacing=34)
    if a.get('sub'): text(im, (150, y + 50), a['sub'], 32, color=MUTED)
    return im

def g_page(i, a):
    im = shell(chap(i), '出典：' + a['src']); d = ImageDraw.Draw(im)
    d.rectangle((94, 160, 900, 940), fill='#e3ddd0')
    # 提供写真は EXIF の回転情報（向き6＝90度）で縦に立つので、それを当ててから縮める
    p = ImageOps.contain(ImageOps.exif_transpose(Image.open(a['img'])).convert('RGB'), (740, 740), method=Image.Resampling.LANCZOS)
    im.paste(p, (94 + (806 - p.width) // 2, 160 + (780 - p.height) // 2))
    y = text(im, (1000, 250), a['name'], 46, serif=True, spacing=16)
    d.rectangle((1002, y + 30, 1070, y + 34), fill=RED)
    text(im, (1002, y + 80), a['lines'], 40, spacing=22)
    return im

def lower(cap, source=STAGE_SRC, chapter=''):
    fg = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(fg)
    for y in range(H):
        a = int(max(0, (y - 760) / 320) * 200)
        if y < 150: a = max(a, 140 - y)
        if a: d.line((0, y, W, y), fill=(10, 16, 16, a))
    text(fg, (88, 40), '歌舞伎研究ノート 2', 33, color=LIGHT, serif=True)
    if chapter:
        tw = d.textlength(chapter, font=font(24)); text(fg, (int(1830 - tw), 50), chapter, 24, color=LIGHT)
    d.rectangle((92, 922, 100, 972), fill=RED)
    text(fg, (124, 920), cap, 40, color=LIGHT, serif=True)
    text(fg, (126, 1006), source, 22, color='#c9c6bc')
    return fg

def g_photo(i, a):
    bg = ImageOps.fit(Image.open(a['img']).convert('RGB'), (W, H), method=Image.Resampling.LANCZOS, centering=(0.5, 0.4))
    fg = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(fg)
    for y in range(H):
        a2 = int(30 + 200 * max(0, (y - 420) / 660))
        d.line((0, y, W, y), fill=(10, 16, 16, a2))
    text(fg, (88, 40), '歌舞伎研究ノート 2', 33, color=LIGHT, serif=True)
    d.rectangle((92, 742, 161, 747), fill=RED)
    text(fg, (90, 790), a['title'], 60, color=LIGHT, serif=True)
    text(fg, (94, 900), a['sub'], 30, color=LIGHT)
    text(fg, (94, 1011), '気良歌舞伎 2021年「清流の国ぎふ 地歌舞伎勢揃い公演」記録写真', 22, color='#c9c6bc')
    return bg, fg

def frame(t):
    dest = G / f'frame_{t:.1f}.jpg'
    if not dest.exists(): ff(['-ss', t, '-i', STAGE, '-frames:v', 1, '-q:v', 2, dest])
    return dest

def g_title(i, a):
    im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 20, H), fill=INK)
    text(im, (96, 50), '気良歌舞伎', 26, color=MUTED); text(im, (1500, 58), 'KABUKI RESEARCH NOTES', 20, color=MUTED)
    text(im, (96, 150), '歌舞伎研究ノート 2', 44, serif=True)
    d.rectangle((98, 230, 200, 234), fill=RED)
    text(im, (96, 300), '勘平は、なぜ\n刀で髪を直すのか', 80, serif=True, spacing=30, maxw=820)
    text(im, (98, 600), '『仮名手本忠臣蔵』六段目\n逆さ屏風と鞘走りを、芸談から読む', 34, color=MUTED, spacing=16, maxw=820)
    text(im, (98, 960), '語り・構成　気良歌舞伎　澤', 24, color=MUTED)
    p = ImageOps.fit(Image.open(frame(3596.0)).convert('RGB').crop((470, 300, 1390, 820)), (880, 620), method=Image.Resampling.LANCZOS)
    im.paste(p, (960, 230))
    return im

def g_end(i, a):
    im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 20, H), fill=INK)
    text(im, (96, 150), '歌舞伎研究ノート 2', 40, serif=True)
    d.rectangle((98, 225, 200, 229), fill=RED)
    text(im, (96, 300), '次に六段目を見る時は、\n刀が鏡になる少し前から。', 64, serif=True, spacing=28)
    text(im, (98, 560), '出典の一覧と note 記事へのリンクは概要欄に。', 32, color=MUTED)
    text(im, (98, 960), '気良歌舞伎　語り・構成　澤', 24, color=MUTED)
    return im

def build_graphics():
    tl = json.load(open(WORK / 'timeline.json', encoding='utf-8'))
    scenes = []
    gaps_before = {}
    items = tl['items']
    # 各ブロックの画面区間: 前の項目の終わり〜このブロックの終わり（無音のすき間も含めて切れ目なく）
    prev_end = 0.0
    for it in items:
        start, end = prev_end, it['end']
        if it is items[-1]: end = tl['total']
        prev_end = end
        if it['block'] == 'stage':
            ov = lower(STAGE_INSERT['cap'], chapter='公演映像'); ov.save(G / 'stage_ov.png')
            scenes.append(dict(kind='stagevideo', start=start, dur=end - start, t=STAGE_INSERT['start'] - (it['start'] - start), overlay=str(G / 'stage_ov.png'))); continue
        b = it['block']; plan = PLAN[b]; span = end - start; t = start
        for k, (kind, frac, a) in enumerate(plan):
            dur = span * frac if k < len(plan) - 1 else (start + span - t)
            name = f'{b:02}_{k}_{kind}'
            if kind == 'video':
                lower(a['cap'], chapter=chap(b - 1)).save(G / f'{name}.png')
                scenes.append(dict(kind='video', start=t, dur=dur, t=a['t'], crop=a.get('crop'), overlay=str(G / f'{name}.png')))
            elif kind == 'photo':
                bg, fg = g_photo(b - 1, a); bg.save(G / f'{name}_bg.png'); fg.save(G / f'{name}.png')
                scenes.append(dict(kind='photo', start=t, dur=dur, bg=str(G / f'{name}_bg.png'), overlay=str(G / f'{name}.png')))
            else:
                im = dict(title=g_title, end=g_end, card=g_card, flow=g_flow, quote=g_quote, page=g_page)[kind](b - 1, a)
                im.save(G / f'{name}.png')
                scenes.append(dict(kind='still', start=t, dur=dur, src=str(G / f'{name}.png'), first=(b == 1 and k == 0), last=(kind == 'end')))
            t += dur
    json.dump(scenes, open(WORK / 'scenes.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('GRAPHICS', len(scenes), 'scenes')

# ---------------------------------------------------------------- 映像
ENC = ['-c:v', 'h264_nvenc', '-preset', 'p5', '-tune', 'hq', '-rc', 'vbr', '-cq', '20', '-b:v', '0', '-maxrate', '12M', '-bufsize', '24M',
       '-g', '60', '-bf', '0', '-profile:v', 'high',  # B-frame を使うと DTS が負になり、concat のつなぎ目で約3コマずつ落ちる
       '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-video_track_timescale', '15360']

def render_one(pair):
    i, s = pair
    n = round((s['start'] + s['dur']) * FPS) - round(s['start'] * FPS)
    dest = R / f'{i:03}.mp4'; sig = hashlib.sha256((json.dumps(s, sort_keys=True) + json.dumps(ENC)).encode()).hexdigest()
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
FIX = [  # 機械の文字起こしの誤変換（研究ノート2の録音で出たもの）。「方」→「型」は語の並びごとに直す
 ('奏で本中心倉', '仮名手本忠臣蔵'), ('菅原と中心蔵', '菅原と忠臣蔵'), ('中心蔵', '忠臣蔵'), ('みなれた髪', '乱れた髪'), ('みなり', '身なり'), ('見なり', '身なり'), ('目なり', '身なり'),
 ('直す方があります', '直す型があります'), ('という方があります', 'という型があります'), ('という方だそうです', 'という型だそうです'), ('抜く方との', '抜く型との'),
 ('おとわやの方', '音羽屋の型'), ('音和屋の方', '音羽屋の型'), ('おとば屋の方', '音羽屋の型'), ('小戸羽方', '音羽屋型'), ('髪型の方', '上方の型'), ('髪型系', '上方系'), ('神形系', '上方系'), ('髪型の代表的', '上方系の代表的'), ('髪型では', '上方では'), ('髪型には', '関西系には'),
 ('官兵', '勘平'), ('寒平', '勘平'), ('鑑定の動き', '勘平の動き'), ('関係の気持ち', '勘平の気持ち'), ('同様の中', '動揺の中'), ('ケラ歌舞伎', '気良歌舞伎'), ('沢です', '澤です'),
 ('逆サビオーブ', '逆さ屏風'), ('逆さ秒舞', '逆さ屏風'), ('秒舞', '屏風'), ('廟部', '屏風'), ('病部', '屏風'), ('上舞', '屏風'), ('平部', '屏風'), ('平分', '屏風'), ('廟府', '屏風'),
 ('仇打ち', '仇討ち'), ('芸団、芸衣', '『芸』'), ('芸団芸衣', '『芸』'), ('廟舞', '屏風'), ('のゲイでは', 'の『芸』では'), ('大将', '大小'), ('代償', '大小'), ('大賞', '大小'), ('文服', '紋服'), ('元禄', '源六'), ('原録', '源六'), ('方のあり方', '型のあり方'), ('と言うを投げかけ', '問いを投げかけ'),
 ('昌六芸話', '松緑芸話'), ('昌六', '松緑'), ('賞録', '松緑'), ('機体', '期待'), ('不丹着風の島柄', '普段着風の縞柄'), ('岡屋', 'おかや'), ('岡山', 'おかや'), ('門付き', '紋付'),
 ('長人', '町人'), ('大小を指す', '大小を差す'), ('二財門', '仁左衛門'), ('ニザエモン', '仁左衛門'), ('来法', '来訪'), ('由来でしまいます', '揺らいでしまいます'), ('自分が打った', '自分が撃った'),
 ('州と与市兵衛', '舅・与市兵衛'), ('よいちべへ', '与市兵衛'), ('無事に戻れる', '武士に戻れる'), ('終盗', '舅'), ('思い罪', '重い罪'), ('尋ねてやって', '訪ねてやって'), ('応帯', '応対'),
 ('屏風を建てた', '屏風を立てた'), ('紙を直', '髪を直'), ('紙に写', '髪に映'), ('紙を整え', '髪を整え'), ('誇りを払', 'ほこりを払'), ('埃を', 'ほこりを'), ('腰に刺し', '腰に差し'), ('曲げを', '髷を'),
 ('キクゴロウ', '菊五郎'), ('千々、', '父・'), ('唾音', '鍔音'), ('ツバ音', '鍔音'), ('経団', '芸談'), ('ウザエモン', '羽左衛門'), ('喜びさんで', '喜び勇んで'), ('機善', '毅然'),
 ('戦作が来て', '侍が来て'), ('わざとしては', '技としては'), ('六代目菊五郎の刀、', '六代目菊五郎の『芸』では、'), ('刀を収め', '刀を納め'), ('さやばしったから', '鞘走ったから'), ('さやばしる', '鞘走る')]

def fmt(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h:02}:{m:02}:{int(s):02},{int(round((s - int(s)) * 1000)) % 1000:03}'

def build_mux():
    tl = json.load(open(WORK / 'timeline.json', encoding='utf-8'))
    asr = {a['name']: a for a in json.load(open(WORK / 'asr.json', encoding='utf-8'))}
    subs = []
    for it in tl['items']:
        if it['block'] == 'stage': continue
        a = asr[os.path.basename(it['src'])]
        for s in a['segments']:
            st = it['start'] + s['start'] - it['src_in']; en = it['start'] + s['end'] - it['src_in']
            if en <= it['start'] or st >= it['end']: continue
            txt = s['text'].strip()
            for x, y in FIX: txt = txt.replace(x, y)
            # 1行20字前後で折る
            if len(txt) > 22:
                cut = max((m.end() for m in re.finditer('[、。」]', txt[:24])), default=len(txt) // 2)
                txt = txt[:cut] + '\n' + txt[cut:]
            subs.append((max(it['start'], st), min(it['end'], en), txt))
    srt = '\n'.join(f'{k+1}\n{fmt(a)} --> {fmt(b)}\n{t}\n' for k, (a, b, t) in enumerate(subs))
    (OUT / '歌舞伎研究ノート2_日本語字幕_v1.srt').write_text(srt, encoding='utf-8')
    # チャプター（各章の最初のブロックの開始）
    chs, seen = [], set()
    for it in tl['items']:
        if it['block'] == 'stage': chs.append((it['start'], '公演映像　屏風と刀')); continue
        c = BLOCKS[it['block'] - 1]['chapter']
        if c not in seen: seen.add(c); chs.append((0 if not chs else it['start'] - 0.5, c.split('　', 1)[1] if '　' in c else c))
    chs.sort()
    meta = ';FFMETADATA1\ntitle=勘平は、なぜ刀で髪を直すのか｜歌舞伎研究ノート2\n'
    for k, (st, title) in enumerate(chs):
        en = chs[k + 1][0] if k + 1 < len(chs) else tl['total']
        meta += f'[CHAPTER]\nTIMEBASE=1/1000\nSTART={int(st*1000)}\nEND={int(en*1000)}\ntitle={title}\n'
    (WORK / 'chapters.ffmeta').write_text(meta, encoding='utf-8')
    desc = '\n'.join(f'{int(st//60)}:{int(st%60):02} {t}' for st, t in chs)
    (OUT / 'チャプター_v1.txt').write_text(desc, encoding='utf-8')
    dest = OUT / '歌舞伎研究ノート2_勘平の刀と屏風_v1_1080p.mp4'
    ff(['-f', 'concat', '-safe', 0, '-i', R / 'concat.txt', '-i', WORK / 'master.wav', '-i', OUT / '歌舞伎研究ノート2_日本語字幕_v1.srt', '-i', WORK / 'chapters.ffmeta',
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
