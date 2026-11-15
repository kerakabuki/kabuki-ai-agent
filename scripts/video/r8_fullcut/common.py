# -*- coding: utf-8 -*-
"""令和8年公演「曽根崎心中」全編編集の共通定義（素材の場所・幕の一覧・作業フォルダ）

素材: プロ撮影の USB SSD（ドライブ文字は毎回確認。環境変数 R8_SRC で上書き可）
作業フォルダ: 計測結果（npz）・切り替え表（edl json）・音（wav）を置く。既定はリポジトリの _scratch/r8_fullcut/
"""
import os

SRC = os.environ.get("R8_SRC", r"F:\260926気良歌舞伎")
_REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
WORK = os.environ.get("R8_WORK", os.path.join(_REPO, "_scratch", "r8_fullcut"))
os.makedirs(WORK, exist_ok=True)

ACTS = [
    ("act1", "第一幕"),
    ("act2", "第二幕"),
    ("act3", "第三幕"),
    ("kojo", "口上"),
]


def hiki(name):
    if name == "第一幕" and os.path.normcase(os.path.abspath(SRC)) == os.path.normcase(r"F:\260926気良歌舞伎"):
        return 'C:\\Users\\NAO\\Documents\\Codex\\2026-10-03\\task\\act1\\source\\wide.mp4'
    return os.path.join(SRC, name, f"{name}_ヒキ_会場音.mp4")


def yori(name):
    if name == "第一幕" and os.path.normcase(os.path.abspath(SRC)) == os.path.normcase(r"F:\260926気良歌舞伎"):
        return 'C:\\Users\\NAO\\Documents\\Codex\\2026-10-03\\task\\act1\\source\\close.mp4'
    return os.path.join(SRC, name, f"{name}_ヨリ_ミキサー収録音.mp4")
