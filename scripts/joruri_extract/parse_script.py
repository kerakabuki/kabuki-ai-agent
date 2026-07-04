# -*- coding: utf-8 -*-
"""台本docxから浄瑠璃(〽)と台詞を抽出してJSON化する"""
import json
import re
import sys

import docx

DOCX_PATH = r"D:\気良歌舞伎\台本\曽根崎心中\曽根崎心中.docx"
OUT_PATH = r"D:\気良歌舞伎\台本\曽根崎心中\audio_sep\script_lines.json"

# 役名リスト(台本冒頭の役名欄より)。台詞行の判定に使う
ROLE_PATTERNS = [
    "お初", "お　初", "徳兵衛", "徳兵衞", "九平次", "久右衛門", "惣兵衛",
    "儀兵衛", "彦丸", "彦　丸", "三平", "三　平", "お玉", "お　玉",
    "お千代", "お仲", "お　仲", "おかつ", "嘉助", "嘉　助", "茂兵衛",
    "長蔵", "長　蔵", "おさと", "おくに", "長太", "長　太", "平助", "平　助",
    "町の衆", "下女", "遊女", "亭主", "客",
]


def classify(text: str) -> str:
    t = text.strip()
    if not t:
        return "empty"
    if t.startswith("〽"):
        return "joruri"
    # 「役名　台詞」形式(役名+全角スペース or タブ)
    for role in ROLE_PATTERNS:
        if t.startswith(role):
            rest = t[len(role):]
            if rest.startswith(("　", "\t", " ")):
                return "serifu"
    return "togaki"  # ト書き・場面説明など


def main():
    d = docx.Document(DOCX_PATH)
    lines = []
    for i, p in enumerate(d.paragraphs):
        kind = classify(p.text)
        if kind == "empty":
            continue
        text = p.text.strip()
        # 照合用に記号・空白を除いた正規化テキスト
        norm = re.sub(r"[〽\s、。「」()（）――…・?？!！]", "", text)
        lines.append({"idx": i, "kind": kind, "text": text, "norm": norm})

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(lines, f, ensure_ascii=False, indent=1)

    counts = {}
    for ln in lines:
        counts[ln["kind"]] = counts.get(ln["kind"], 0) + 1
    print("counts:", counts)
    print("joruri chars:", sum(len(l["norm"]) for l in lines if l["kind"] == "joruri"))
    print("serifu chars:", sum(len(l["norm"]) for l in lines if l["kind"] == "serifu"))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
