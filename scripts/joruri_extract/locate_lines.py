# -*- coding: utf-8 -*-
"""特定の台本行が音声のどの時刻にあるかを文字起こしから探す"""
import json
import re
import sys

from rapidfuzz import fuzz

DIR = r"D:\気良歌舞伎\台本\曽根崎心中\audio_sep"

TARGETS = [
    ("p11 #150 お千代:何も聞かんせぬか", "のうお初さま何も聞かんせぬか徳さまは何やらわけの悪いこと"),
    ("p11 #154 お初:いっそ死んで", "きけばきく程胸いたみわしから先に死にそうな"),
    ("p11 #161 嘉助:天満屋はここか", "ちと物をおたずね申します天満屋という茶屋はここか"),
    ("p12 #164 お玉:恋知りの初さま", "おたずねの天満屋十四五から三十までの丸顔面長お望み次第"),
    ("p12 #174 久右衛門:伯父親方", "わしは徳兵衛めが伯父親方平野屋久右衛門という者"),
    ("p12 #180 久右衛門:金は払わぬ", "入れいうなら入ろうがわしは金は払わぬぞや"),
    ("p13 #188 お初:徳さまかいの", "いこう気がつきたかど見てこう徳さまかいの"),
    ("p13 #190 徳兵衛:巧みなれば", "聞きやる通りの巧みなれば言う程己が非に落ちる"),
    ("p13 #194 惣兵衛:内へ入りゃ", "世間に悪い沙汰があるお初内へ入りゃ"),
]


def norm(t):
    return re.sub(r"[〽\s、。「」()（）――…・?？!！]", "", t)


def main():
    with open(DIR + r"\transcript_vocals.json", encoding="utf-8") as f:
        transcript = json.load(f)

    for label, target in TARGETS:
        tq = norm(target)
        best = None
        for g in transcript:
            q = norm(g["text"])
            if len(q) < 4:
                continue
            sc = fuzz.partial_ratio(tq, q)
            if best is None or sc > best[0]:
                best = (sc, g)
        sc, g = best
        print(f"{label}\n  -> score={sc:3.0f} [{g['start']/60:6.2f}m] {g['text'][:40]}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
