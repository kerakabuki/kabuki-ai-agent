import json, sys

sys.stdout.reconfigure(encoding='utf-8')

with open("C:/Users/NAO/AppData/Local/Temp/glossary_updated.json", encoding="utf-8") as f:
    data = json.load(f)

terms = data.get("terms", [])
print(f"Starting with {len(terms)} terms")

# --- 正確性の修正 ---

fixes = {}

# 1. ツラネ: 弁天小僧は「渡りぜりふ」であり、つらねの代表例は『暫』
fixes["ツラネ"] = {
    "desc": "荒事の主役が花道で長々と述べる、七五調のせりふ。歌舞伎独特の闘達な雄弁術とされる。歌舞伎十八番『暫』の鎌倉権五郎が最も代表的。冒頭に難解な美文が並ぶが、言葉の流れと勢いで観客を魅了する。『白浪五人男』のように複数人で分担する形は「渡りぜりふ」と呼ばれ、つらねの変形。『外郎売』の早口の言い立てもつらねの一種。",
    "desc_en": "A long poetic monologue in 7-5 syllable rhythm, delivered by the aragoto hero on the hanamichi. Considered kabuki's distinctive form of bold oratory. Kamakura Gongoro in Shibaraku is the most representative example. The Shiranami Gonin Otoko version, split among multiple speakers, is called 'watari-zerifu' (relay dialogue) — a variation of tsurane. The rapid-fire speech in Uiro Uri is also a type of tsurane."
}

# 2. 愛想尽かし: 「遊女が客に」は範囲が狭い。本質は女性が男を助けるために心ならずも
fixes["愛想尽かし"] = {
    "desc": "「縁切物」と呼ばれる演目群の重要な場面。相思相愛の男女でありながら、大切な宝や大金を必要としている男の事情を助けるため、女性が真意を隠して心ならずも冷たく突き放す。男がこの真意を理解できず悲劇に至るのが典型的な展開。『伊勢音頭恋寝刃』『籠釣瓶花街酔醒』などが代表的。",
    "desc_en": "A pivotal scene in 'enkiri-mono' (breakup plays). Despite being deeply in love, the woman coldly rejects the man — not from genuine hatred, but to secretly help him in his desperate circumstances (finding a lost treasure, raising money). The tragedy typically unfolds when the man fails to understand her true intentions. Representative works include Ise Ondo and Kagotsurubeé."
}

# 3. 隈取: 猿隈を追加
fixes["隈取"] = {
    "desc": "歌舞伎の特徴的な化粧法で、筋肉や血管の隆起を誇張して描く。「隈を描く」ではなく「隈を取る」と言う。色に意味があり、紅隈（赤）は正義・勇気・若さ、藍隈（青）は悪人・怨霊・冷酷さ、茶隈は鬼や精霊などの変化（へんげ）を表す。猿隈は滑稽味のある役に用いる特殊な隈。荒事の主人公や敵役に用いられる。",
    "desc_en": "Kabuki's most distinctive face painting technique, exaggerating the lines of muscles and blood vessels. The term literally means 'taking shadows' (not 'drawing'). Colors carry specific meanings: beniguma (red) represents justice and heroism; aiguma (indigo/blue) represents villains and vengeful spirits; chaguma (brown) indicates demons and supernatural transformations; saruguma (monkey pattern) is used for comical roles. Primarily seen in aragoto-style performances."
}

# 4. 見得: 「引っ張りの見得/絵面の見得」を追加
fixes["見得"] = {
    "desc": "歌舞伎の代表的な演技法。頭を回しながら腕や足を大きく動かした後、一瞬動きを止めて印象的なポーズで決める。ツケの音が加わり、感情や決意を強く印象づける。代表的な型に「元禄見得」（『暫』）、「石投げの見得」（『勧進帳』）、「柱巻きの見得」（『鳴神』）がある。複数人物が同時に一枚の絵のように決まる「引っ張りの見得」（絵面の見得）は幕切れの名場面で、『寿曽我対面』が典型。",
    "desc_en": "One of kabuki's most iconic acting techniques. After swinging the head while moving arms and legs dynamically, the actor freezes in a powerful pose, punctuated by tsuke beats. Famous types include Genroku Mie (Shibaraku), Ishinage no Mie (Kanjincho), and Hashiramaki no Mie (Narukami). The 'hippari no mie' (or 'ezura no mie') features multiple characters freezing simultaneously like a living painting — a spectacular curtain-closing tableau, with Kotobuki Soga no Taimen as the classic example."
}

# 5. モドリ: 「底を割ってはいけない」の戒めを追加
fixes["もどり"] = {
    "desc": "悪人に見えていた人物が、実は深い事情を背負った善人だったと明かす劇的な展開。多くは腹を切るか刺されて死ぬ間際に本心が明かされる。最後のどんでん返しが眼目のため、途中で本心を見せる「底を割る」演技は古くから戒められている。『義経千本桜』の権太、『実盛物語』の瀬尾十郎、『摂州合邦辻』の玉手御前が代表的。",
    "desc_en": "A dramatic twist where a character believed to be a villain reveals they were actually good all along, typically confessing their true motives while dying from a wound. Since the surprise reversal is the whole point, actors are traditionally warned never to 'break the bottom' (soko wo waru) — showing the character's true nature too early. Famous examples include Gonta in Yoshitsune Senbon Zakura, Seo in Sanemori Monogatari, and Tamategozen in Sesshu Gappo ga Tsuji."
}

# 修正を適用
fixed = 0
for t in terms:
    raw = t.get("term", "")
    # 括弧前の名前を取得
    clean = raw.split("\uff08")[0].split("(")[0]
    if clean in fixes:
        t["desc"] = fixes[clean]["desc"]
        t["desc_en"] = fixes[clean]["desc_en"]
        fixed += 1
        print(f"  FIX: {raw}")

print(f"\nFixed: {fixed}")

# ソート
terms.sort(key=lambda t: t.get("reading", "") or "")
data["terms"] = terms
print(f"Total: {len(terms)}")

out_path = "C:/Users/NAO/AppData/Local/Temp/glossary_fixed.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Saved to {out_path}")
