import json, sys

sys.stdout.reconfigure(encoding='utf-8')

with open("C:/Users/NAO/AppData/Local/Temp/glossary_fixed.json", encoding="utf-8") as f:
    data = json.load(f)

terms = data.get("terms", [])
print(f"Starting with {len(terms)} terms")

new_terms = [
    {
        "term": "千秋楽（せんしゅうらく）",
        "reading": "せんしゅうらく",
        "term_en": "Senshuraku (Closing Night)",
        "desc": "公演の最終日。もともとは雅楽の最後に演奏する曲名に由来する。千秋楽には特別なカーテンコールや挨拶が行われることもあり、普段とは違った雰囲気で盛り上がる。「楽日（らくび）」「楽（らく）」とも略される。",
        "desc_en": "The final day of a performance run. The term originates from a gagaku (court music) piece traditionally played last. Closing nights often feature special curtain calls and farewell addresses, creating a uniquely festive atmosphere. Also abbreviated as 'rakubi' or simply 'raku.'"
    },
    {
        "term": "初日（しょにち）",
        "reading": "しょにち",
        "term_en": "Shonichi (Opening Day)",
        "desc": "公演の初日。初日の幕が開くことを「初日が明く」という。役者にとって最も緊張する日であり、楽屋には関係者から届く祝いの品が並ぶ。初日と千秋楽は特別な日として大切にされる。",
        "desc_en": "The opening day of a performance run. The expression 'shonichi ga aku' (the first day opens) describes the curtain rising. The most nerve-wracking day for actors, with dressing rooms filled with congratulatory gifts. Along with closing night, it holds special significance."
    },
    {
        "term": "所作事（しょさごと）",
        "reading": "しょさごと",
        "term_en": "Shosagoto (Dance Piece)",
        "desc": "舞踊を中心とした演目の総称。長唄・常磐津・清元などの音楽に合わせて踊る。物語性のあるものを「舞踊劇」、純粋な踊りを「素踊り」と区別することもある。『京鹿子娘道成寺』『藤娘』『鏡獅子』などが代表的。",
        "desc_en": "A general term for dance-centered works, performed to nagauta, tokiwazu, kiyomoto, and other music. Narrative dances may be called 'buyo-geki' (dance drama) while pure dances are 'su-odori.' Representative works include Musume Dojoji, Fuji Musume, and Kagami Jishi."
    },
    {
        "term": "愁嘆場（しゅうたんば）",
        "reading": "しゅうたんば",
        "term_en": "Shutanba (Grief Scene)",
        "desc": "登場人物が悲しみや苦悩を表す嘆きの場面。親子の別れ、忠義と情の板挟みなど、義太夫狂言に多く見られる。観客の涙を誘う歌舞伎の見せ場のひとつ。『寺子屋』の松王丸の嘆き、『熊谷陣屋』の相模の嘆きなどが代表的。",
        "desc_en": "A scene of grief and lamentation, where characters express deep sorrow. Common in gidayu-kyogen, depicting parent-child separations or agonizing conflicts between duty and emotion. One of kabuki's most moving scene types. Famous examples include Matsuomaru's grief in Terakoya and Sagami's lament in Kumagai Jinya."
    },
    {
        "term": "濡れ場（ぬれば）",
        "reading": "ぬれば",
        "term_en": "Nureba (Love Scene)",
        "desc": "男女の恋愛や情事を描く場面。「濡れ事（ぬれごと）」とも。和事の柔らかい色気で演じられることが多い。初代坂田藤十郎が得意とした「傾城買い狂言」に由来し、上方歌舞伎の伝統的な見せ場。",
        "desc_en": "A romantic or amorous scene between lovers. Also called 'nuregoto.' Typically performed in the soft, sensual wagoto style. Originating from the 'keisei-kai' (courtesan-buying) plays mastered by Sakata Tojuro I, it is a traditional highlight of Kamigata kabuki."
    },
    {
        "term": "勘亭流（かんていりゅう）",
        "reading": "かんていりゅう",
        "term_en": "Kanteiryu (Kabuki Calligraphy)",
        "desc": "歌舞伎の看板や番付に使われる独特の書体。1779年（安永8年）に書家の岡崎屋勘六が考案したとされる。太く丸みを帯びた筆致で隙間なく書くのが特徴で、「客席が隙間なく埋まるように」という願いが込められている。",
        "desc_en": "The distinctive calligraphy style used on kabuki signboards and programs. Said to have been created by calligrapher Okazakiya Kanroku in 1779. Characterized by thick, rounded strokes with no gaps between characters — embodying the wish that 'every seat in the theater be filled.'"
    },
    {
        "term": "渡りぜりふ（わたりぜりふ）",
        "reading": "わたりぜりふ",
        "term_en": "Watari Zerifu (Relay Dialogue)",
        "desc": "つらねを複数の役者で分担して順番に述べる形式。『白浪五人男』の稲瀬川勢揃いの場で五人の盗賊が順に名乗りを述べる場面が最も有名。リズミカルなつなぎが見事で、歌舞伎屈指の名場面として知られる。",
        "desc_en": "A form of tsurane (poetic monologue) split among multiple actors who deliver it in sequence. The most famous example is the lineup scene at Inasegawa in Shiranami Gonin Otoko, where five thieves introduce themselves one by one. The rhythmic relay is considered one of kabuki's greatest scenes."
    },
    {
        "term": "名乗り（なのり）",
        "reading": "なのり",
        "term_en": "Nanori (Self-Introduction)",
        "desc": "登場人物が自らの素性や来歴を名乗る場面。「知らざあ言って聞かせやしょう」で始まる弁天小僧の名乗りが特に有名。正体を隠していた人物が本名を明かす劇的な瞬間でもあり、見顕しと結びつくことが多い。",
        "desc_en": "A scene where a character formally announces their identity and background. Benten Kozo's famous speech beginning 'Shirazaa itte kikaseyasho' (If you don't know, let me tell you) is the most celebrated example. Often linked to 'miarawashi' (identity reveal), creating a dramatic moment of unmasking."
    },
    {
        "term": "見顕し（みあらわし）",
        "reading": "みあらわし",
        "term_en": "Miarawashi (Identity Reveal)",
        "desc": "変装や偽りの姿で登場していた人物が正体を現す場面。衣裳のぶっ返りや引抜きを伴うことが多く、視覚的にも劇的な転換点となる。『弁天娘女男白浪』の浜松屋の場で、女装の弁天小僧が正体を現す場面が代表的。",
        "desc_en": "A scene where a disguised character reveals their true identity. Often accompanied by bukkaeri (costume flip) or hikinuki (costume reveal), creating a visually dramatic turning point. The most famous example is Benten Kozo revealing his true identity at Hamamatsuya in Benten Musume."
    },
    {
        "term": "糸にノル（いとにのる）",
        "reading": "いとにのる",
        "term_en": "Ito ni Noru (Riding the Shamisen)",
        "desc": "義太夫狂言で、太夫の語りや三味線のリズムに合わせて役者が演技すること。義太夫の「糸（三味線の弦）」に「ノル（乗る）」という意味。役者と演奏者の呼吸が一体となることで、義太夫狂言独特の深い情感が生まれる。",
        "desc_en": "In gidayu-kyogen, the technique of an actor synchronizing their performance with the gidayu chanter's narration and shamisen rhythm. Literally 'riding the strings (of the shamisen).' When actor and musicians breathe as one, it creates the uniquely deep emotional quality of gidayu-kyogen."
    },
    {
        "term": "おひねり",
        "reading": "おひねり",
        "term_en": "Ohineri (Money Toss)",
        "desc": "紙に包んだ祝儀を舞台上の役者に向かって投げる風習。地歌舞伎では現在も行われており、観客が役者への声援と感謝を直接伝える参加型の伝統。気良歌舞伎でもおひねりが飛び交い、客席と舞台が一体となって盛り上がる。",
        "desc_en": "The custom of tossing paper-wrapped money onto the stage for actors. Still practiced in regional kabuki (jikabuki) today, it is a participatory tradition where audiences directly express appreciation. At Kera Kabuki, ohineri fly through the air, uniting audience and stage in shared excitement."
    },
    {
        "term": "幕の内弁当（まくのうちべんとう）",
        "reading": "まくのうちべんとう",
        "term_en": "Makunouchi Bento (Intermission Lunchbox)",
        "desc": "幕間に食べる弁当が由来の言葉で、現在は多種のおかずを詰め合わせた弁当の一般名称となっている。歌舞伎観劇では幕間に食事をとる文化があり、劇場内の食堂や持参の弁当で食事を楽しむのも観劇の醍醐味のひとつ。",
        "desc_en": "A lunchbox originally eaten during kabuki intermissions, now a common term for any multi-dish boxed lunch. Eating during intermission is an integral part of the kabuki-going experience — whether dining at the theater's restaurant or bringing your own bento. A delicious tradition that enhances the enjoyment of a full day at the theater."
    }
]

existing = set()
for t in terms:
    raw = t.get("term", "")
    clean = raw.split("\uff08")[0].split("(")[0]
    existing.add(clean)

added = 0
for nt in new_terms:
    clean = nt["term"].split("\uff08")[0].split("(")[0]
    if clean not in existing:
        terms.append(nt)
        added += 1
        print(f"  ADD: {nt['term']}")
    else:
        print(f"  SKIP: {nt['term']}")

print(f"\nAdded: {added}")

terms.sort(key=lambda t: t.get("reading", "") or "")
data["terms"] = terms
print(f"Total: {len(terms)}")

out_path = "C:/Users/NAO/AppData/Local/Temp/glossary_v3.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Saved to {out_path}")
