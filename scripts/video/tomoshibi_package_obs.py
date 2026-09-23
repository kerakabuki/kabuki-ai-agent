# -*- coding: utf-8 -*-
"""第三幕OBS 配布用一式を、新しい「灯の螺旋」mp4 で次の版として複製・梱包する。

  python scripts/video/tomoshibi_package_obs.py --video "D:\\...\\気良歌舞伎_灯し火の螺旋_現場投影テスト_v21.mp4" \
      --ver v33 --tag 灯の螺旋会場調整 --note "文字拡大・右下の見切れ修正・写真の動き"

前の版（--src、既定は v32 配布用）を丸ごとコピーし、OP の mp4 だけ差し替えて、
app/ の版名・cues.json・scene-template.json・説明テキスト・検証記録・zip・sha256 を作る。
"""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import zipfile
from datetime import date
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
OUTROOT = Path(r'C:\Users\NAO\OneDrive\Documents\気良歌舞伎事務\output')
DEFAULT_SRC = OUTROOT / '第三幕_OBS_Q0_Q1自動フェード_v32_配布用_20260922'
OLD_OP = 'OP_灯の螺旋_終演後テロップ_v21.mp4'


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for part in iter(lambda: f.read(1 << 20), b''):
            h.update(part)
    return h.hexdigest()


def probe(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]))


def read(p):
    return p.read_text(encoding='utf-8-sig')


def write(p, s):
    p.write_text(s, encoding='utf-8')


def replace_all(p, pairs):
    s = read(p)
    for old, new in pairs:
        assert old in s, f'{p.name}: 見つからない: {old[:60]}'
        s = s.replace(old, new)
    write(p, s)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--video', required=True)
    ap.add_argument('--ver', required=True, help='例: v33')
    ap.add_argument('--tag', required=True, help='フォルダ名に入る短い内容。例: 灯の螺旋会場調整')
    ap.add_argument('--note', required=True, help='更新内容の一文')
    ap.add_argument('--src', default=str(DEFAULT_SRC))
    ap.add_argument('--date', default=date.today().strftime('%Y%m%d'))
    a = ap.parse_args()

    src = Path(a.src)
    video = Path(a.video)
    assert src.is_dir() and video.is_file()
    m = re.search(r'_v(\d+)_配布用', src.name)
    prev_ver = 'v' + m.group(1)
    dst = OUTROOT / f'第三幕_OBS_{a.tag}_{a.ver}_配布用_{a.date}'
    zip_path = OUTROOT / f'曽根崎心中_OBS_{a.ver}_{a.tag}_ノートPC用_{a.date}.zip'
    assert not dst.exists(), f'既にある: {dst}'
    new_op = f'OP_灯の螺旋_{a.tag}_{a.ver}.mp4'

    print('コピー中:', src.name, '→', dst.name, flush=True)
    # obs-browser のキャッシュ・ログ類は同梱不要（起動中の OBS がロックしていることもある）
    ignore = shutil.ignore_patterns('.cue-cache', OLD_OP, 'OP_終演後テロップ.ass', 'obs-browser', 'logs', 'profiler_data', 'crashes', 'Cookies*')
    try:
        shutil.copytree(src, dst, ignore=ignore)
    except shutil.Error as e:
        skipped = [item[0] for item in e.args[0]]
        bad = [x for x in skipped if 'plugin_config' not in x and 'logs' not in x]
        assert not bad, bad
        print('ロック中のキャッシュを飛ばした:', len(skipped), flush=True)
    (dst / '録画テスト').mkdir(exist_ok=True)
    for stale in (dst / '録画テスト').iterdir():
        stale.unlink()
    shutil.copy2(video, dst / 'media' / new_op)

    info = probe(dst / 'media' / new_op)
    v = next(s for s in info['streams'] if s['codec_type'] == 'video')
    assert (int(v['width']), int(v['height'])) == (2560, 800)
    duration = float(info['format']['duration'])

    app = dst / 'app'
    old_coll = f'第三幕_OBS_{prev_ver}_灯の螺旋'
    new_coll = f'第三幕_OBS_{a.ver}_灯の螺旋'

    cues_path = app / 'cues.json'
    cues = json.loads(read(cues_path))
    cues['version'] = f'{a.ver}_OBS_tomoshi_spiral_{a.tag}'
    op_cue = next(c for c in cues['cues'] if c['q'] == 'OP_灯の螺旋')
    op_cue['file'] = f'media/{new_op}'
    op_cue['seconds'] = round(duration, 1)
    op_cue['note'] = f'{a.note}。終了後、自動でQ1へ移り、映像は黒から約3秒で浮かび上がります。'
    cues['fieldTest']['video'] = f'media/{new_op}'
    cues['fieldTest']['note'] = '会場実機（2026-09-22）の所見を反映した版。左右位置・境目・音量を再確認する。'
    write(cues_path, json.dumps(cues, ensure_ascii=False, indent=2))

    replace_all(app / 'scene-template.json', [(f'__ROOT__/media/{OLD_OP}', f'__ROOT__/media/{new_op}'), (old_coll, new_coll)])
    scene = json.loads(read(app / 'scene-template.json'))
    for s in scene['sources']:
        f = s.get('settings', {}).get('local_file') or s.get('settings', {}).get('file')
        if f:
            assert (dst / f.replace('__ROOT__/', '')).exists(), f'素材が無い: {f}'
    prof = read(app / 'profile.ini')
    prof = re.sub(r'^Name=.*$', f'Name=第三幕_OBS_{a.ver}_{a.tag}', prof, flags=re.M)
    write(app / 'profile.ini', prof)
    replace_all(app / 'start.ps1', [(old_coll, new_coll)])
    replace_all(app / 'panel.js', [(f'OBS接続済み · {prev_ver} ', f'OBS接続済み · {a.ver} ')])
    s = read(app / 'panel.js')
    s = re.sub(r"(OBS接続済み · v\d+ )[^']*'", rf"\1{a.tag}'", s)
    write(app / 'panel.js', s)
    s = read(app / 'panel.html')
    s = re.sub(rf'OBS {prev_ver}・[^<]*', f'OBS {a.ver}・{a.tag}／Q0→Q1自動フェード／終幕拍子木まで', s)
    write(app / 'panel.html', s)
    for regen in ('runtime-location.txt', 'connection.js'):
        (app / regen).write_text('', encoding='utf-8')

    head = f'{a.ver}（{date.today().strftime("%Y年%-m月%-d日") if sys.platform != "win32" else date.today().strftime("%Y年%m月%d日")}）：{a.note}。Q0→Q1自動フェード・Q1〜Q7・終幕拍子木は{prev_ver}と同じです。\n\n'
    for name in ('使い方と更新内容.txt', '最初に読む_灯の螺旋から第三幕へ.txt'):
        p = dst / name
        s = read(p)
        s = s.replace(f'　{prev_ver}\n', f'　{a.ver}\n', 1) if name.startswith('最初に読む') else s
        write(p, head + s)
    (dst / '検証記録').mkdir(exist_ok=True)
    report = {
        'version': a.ver, 'basedOn': prev_ver, 'entry': '開始.vbs', 'opFile': f'media/{new_op}',
        'opSha256': sha256(dst / 'media' / new_op), 'opDurationSeconds': duration,
        'opFrames': int(v['nb_frames']), 'opCanvas': [2560, 800], 'change': a.note,
        'q1ToQ7Unchanged': True, 'autoQ1FadeUnchanged': True, 'portableOBSIncluded': (dst / '.obs-runtime' / 'bin').exists(),
        'venueProjectionTest': '前版v31で実施、本版は未実施',
    }
    src_report = video.parent / (video.stem.replace('気良歌舞伎_灯し火の螺旋_', '') + '_検証.json')
    if src_report.exists():
        shutil.copy2(src_report, dst / '検証記録' / src_report.name)
        report['videoVerification'] = f'検証記録/{src_report.name}'
    write(dst / '検証記録' / f'{a.ver}_{a.tag}.json', json.dumps(report, ensure_ascii=False, indent=2))

    # start.ps1 を準備モードで通し、パスと構文を検証（OBS は起動しない）
    running = subprocess.run(['tasklist', '/FI', 'IMAGENAME eq obs64.exe'], capture_output=True, text=True).stdout
    if 'obs64.exe' in running:
        print('OBS が起動中のため start.ps1 -PrepareOnly の検証は省略（ノートPC側の初回起動で生成される）', flush=True)
    else:
        r = subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', str(app / 'start.ps1'), '-PrepareOnly'],
                           capture_output=True, text=True)
        print('start.ps1 -PrepareOnly:', (r.stdout + r.stderr).strip()[-300:], flush=True)
        assert r.returncode == 0, 'start.ps1 の準備に失敗'
    shutil.rmtree(dst / '.cue-cache', ignore_errors=True)

    print('zip 作成中:', zip_path.name, flush=True)
    with zipfile.ZipFile(zip_path, 'w') as z:
        for p in sorted(dst.rglob('*')):
            if p.is_dir():
                continue
            rel = f'{dst.name}/{p.relative_to(dst).as_posix()}'
            comp = zipfile.ZIP_STORED if p.suffix.lower() in ('.mp4', '.png', '.jpg', '.dll', '.exe') else zipfile.ZIP_DEFLATED
            z.write(p, rel, compress_type=comp)
    digest = sha256(zip_path).upper()
    (OUTROOT / (zip_path.name + '.sha256')).write_text(f'{digest}  {zip_path.name}\n', encoding='utf-8')
    with zipfile.ZipFile(zip_path) as z:
        n = len(z.namelist())
    print(json.dumps({'folder': str(dst), 'zip': str(zip_path), 'zip_sha256': digest, 'entries': n,
                      'op': new_op, 'op_seconds': duration}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
