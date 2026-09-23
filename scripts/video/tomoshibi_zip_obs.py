# -*- coding: utf-8 -*-
"""配布用フォルダから zip と sha256 だけ作り直す（梱包の途中で容量切れになった時用）。

  python scripts/video/tomoshibi_zip_obs.py --folder "C:\\...\\第三幕_OBS_..._v35_配布用_20260923" --ver v35 --tag 灯の螺旋完成版 --date 20260923
"""
import argparse
import hashlib
import json
import shutil
import sys
import zipfile
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
OUTROOT = Path(r'C:\Users\NAO\OneDrive\Documents\気良歌舞伎事務\output')


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for part in iter(lambda: f.read(1 << 20), b''):
            h.update(part)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--folder', required=True)
    ap.add_argument('--ver', required=True)
    ap.add_argument('--tag', required=True)
    ap.add_argument('--date', required=True)
    a = ap.parse_args()
    dst = Path(a.folder)
    assert dst.is_dir()
    zip_path = OUTROOT / f'曽根崎心中_OBS_{a.ver}_{a.tag}_ノートPC用_{a.date}.zip'
    need = sum(p.stat().st_size for p in dst.rglob('*') if p.is_file())
    free = shutil.disk_usage(OUTROOT).free
    assert free > need * 1.1, f'空き容量不足: 必要 {need/1e9:.1f}GB / 空き {free/1e9:.1f}GB'
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
        bad = z.testzip()
    assert bad is None, f'zip 破損: {bad}'
    print(json.dumps({'zip': str(zip_path), 'zip_sha256': digest, 'entries': n, 'bytes': zip_path.stat().st_size}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
