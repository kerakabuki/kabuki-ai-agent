import json, sys

sys.stdout.reconfigure(encoding='utf-8')

with open("C:/Users/NAO/AppData/Local/Temp/glossary_full.json", encoding="utf-8") as f:
    data = json.load(f)

terms = data.get("terms", [])

# --- 1. 不足用語を追加 ---
new_terms = [
    {
        "term": "顔見世（かおみせ）",
        "reading": "かおみせ",
        "term_en": "Kaomise (Face-Showing Performance)",
        "desc": "1年の始まりに俳優のお披露目をする興行。江戸時代、俳優が芝居小屋と1年契約を結んでいた名残。現在は11月の歌舞伎座「吉例顔見世大歌舞伎」や12月の南座「吉例顔見世興行」が代表的。",
        "desc_en": "A season-opening performance where actors are formally presented to the audience. A tradition from the Edo period when actors signed annual contracts with theaters. Today, the most famous are Kabukiza's November and Minamiza's December kaomise productions."
    },
    {
        "term": "後見（こうけん）",
        "reading": "こうけん",
        "term_en": "Koken (Stage Assistant)",
        "desc": "俳優の影のように動き、演技が滞りなく進むよう補助する役。小道具の受け渡し、衣裳替えの手伝い、差金の操作などを行う。裃姿の「裃後見」と黒装束の「黒衣」がある。",
        "desc_en": "An on-stage assistant who moves like the actor's shadow, ensuring the performance runs smoothly. Handles prop handoffs, costume changes, and puppetry rod operations. Appears either in formal kamishimo attire or as a black-clad kurogo."
    },
    {
        "term": "桟敷（さじき）",
        "reading": "さじき",
        "term_en": "Sajiki (Box Seats)",
        "desc": "歌舞伎座や南座などにある、客席の左右に位置する一段高い特別席。掘りごたつ式でゆったりと観劇できる。江戸時代から続く伝統的な客席形式。",
        "desc_en": "Elevated box seats located on either side of the auditorium in traditional kabuki theaters. Offering a spacious, relaxed viewing experience in a sunken-floor style, these prestigious seats date back to the Edo period."
    },
    {
        "term": "差金（さしがね）",
        "reading": "さしがね",
        "term_en": "Sashigane (Puppetry Rod)",
        "desc": "竹棒の先に蝶や鳥、人魂などをつけて操る歌舞伎独特の小道具。『鏡獅子』では蝶が獅子のまわりを飛ぶ様子を表現する。後見が操作する。",
        "desc_en": "A unique kabuki prop consisting of a bamboo rod with butterflies, birds, or spirit flames attached to the tip. In Kagami Jishi, it creates the illusion of butterflies fluttering around the lion. Operated by a koken stage assistant."
    },
    {
        "term": "襲名（しゅうめい）",
        "reading": "しゅうめい",
        "term_en": "Shumei (Name Succession)",
        "desc": "俳優が先祖や父兄、師匠が名のっていた名前を受け継ぐこと。歌舞伎界最大の慶事のひとつで、披露口上を伴う襲名披露興行が行われる。名前だけでなく型や芸風も受け継がれていく。",
        "desc_en": "The ceremony of an actor inheriting the stage name of an ancestor, parent, or master. One of kabuki's most celebrated traditions, marked by special performances featuring formal stage addresses. Not just names but artistic styles and kata are passed down."
    },
    {
        "term": "遠見（とおみ）",
        "reading": "とおみ",
        "term_en": "Tomi (Distant View)",
        "desc": "二つの意味がある。一つは遠方の景色を舞台背景に描いたもの。もう一つは、登場人物と同じ扮装をした子役が登場することで、その人物が遠くにいるように見せる演出技法。",
        "desc_en": "Has two meanings: (1) a painted backdrop depicting a distant landscape, and (2) a staging technique where a child actor in the same costume as the main character appears to create the illusion of the character being far away."
    },
    {
        "term": "引込み（ひっこみ）",
        "reading": "ひっこみ",
        "term_en": "Hikkomi (Stage Exit)",
        "desc": "俳優が退場すること。特に花道を使った退場を指すことが多い。幕を閉めた後も花道に残った俳優が演技を続けて去る「幕外の引込み」は、強い余韻を残す名演出。",
        "desc_en": "An actor's exit from the stage, especially via the hanamichi. The most memorable form is makusoto no hikkomi, where the actor remains on the hanamichi after the curtain closes, continuing to perform before departing."
    },
    {
        "term": "一幕見（ひとまくみ）",
        "reading": "ひとまくみ",
        "term_en": "Hitomakumi (Single-Act Ticket)",
        "desc": "全幕ではなく一幕だけを観ること、またはそのための客席。比較的安価に観たい幕だけを楽しめるため、歌舞伎初心者や時間のない人にもおすすめ。歌舞伎座4階に専用席がある。",
        "desc_en": "Watching just one act rather than the full program, or the designated seating for this. A budget-friendly option perfect for beginners or those short on time. Kabukiza has dedicated seats on the 4th floor."
    },
    {
        "term": "まねき看板（まねきかんばん）",
        "reading": "まねきかんばん",
        "term_en": "Maneki Kanban (Invitation Signboard)",
        "desc": "劇場正面に掲げる宣伝看板で、勘亭流という独特の書体で俳優の紋と名前を記す。「招く」（大勢の客を招く）という意味が込められている。京都・南座の顔見世で掲げられるものが特に有名。",
        "desc_en": "Promotional signboards displayed at theater entrances, featuring actors' crests and names in the distinctive kanteiryu calligraphy style. The ones at Kyoto's Minamiza during kaomise are especially famous."
    },
    {
        "term": "屋号（やごう）",
        "reading": "やごう",
        "term_en": "Yago (House Name)",
        "desc": "歌舞伎俳優の家ごとに伝わる称号。「成田屋」（市川團十郎家）、「音羽屋」（尾上菊五郎家）、「中村屋」（中村勘三郎家）など。大向うからの掛け声で屋号が飛ぶのは歌舞伎ならではの風景。",
        "desc_en": "Hereditary house names for kabuki acting families, such as 'Naritaya' (Ichikawa Danjuro), 'Otowaya' (Onoe Kikugoro), and 'Nakamuraya' (Nakamura Kanzaburo). Audience members shout these names during dramatic moments."
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

# --- 2. 短い説明を拡充 ---
updates = {
    "\u9688\u53d6": {  # 隈取
        "desc": "歌舞伎の特徴的な化粧法で、筋肉や血管の隆起を誇張して描く。色に意味があり、赤（紅隈）は正義・勇気・若さ、藍（藍隈）は悪・妖怪・冷酷さ、茶色は鬼や人間を超えた存在を表す。荒事の主人公や敵役に用いられる。",
        "desc_en": "Kabuki's distinctive face painting technique that exaggerates the lines of muscles and blood vessels. Colors carry meaning: red (beniguma) represents justice, courage, and youth; indigo (aiguma) represents evil, supernatural beings, and cruelty; brown indicates demons or superhuman entities. Used primarily in aragoto-style roles."
    },
    "\u9ed2\u8863": {  # 黒衣
        "desc": "後見の一種で、黒色の衣裳で全身を包み俳優の演技を補助する役。歌舞伎では「黒は見えない」という約束事があり、観客からは存在しないものとして扱われる。衣裳替えや小道具の受け渡し、差金の操作などを行う。",
        "desc_en": "A type of stage assistant dressed entirely in black who helps actors during performance. Under kabuki's convention that 'black is invisible,' the audience treats them as if they don't exist. They handle costume changes, prop handoffs, and puppet rod operations."
    },
    "\u82b1\u9053": {  # 花道
        "desc": "舞台から客席を貫いて伸びる通路で、登退場や見せ場に使う歌舞伎独特の舞台装置。舞台から三分（約3割）の位置を「七三（しちさん）」と呼び、ここで見得を切ったり名乗りを述べたりする重要なポイント。途中に「すっぽん」というせり上がり装置がある。",
        "desc_en": "A raised walkway extending from the stage through the audience. The spot about 30% from the stage end is called 'shichisan' (seven-three), a crucial point where actors strike poses and deliver speeches. Contains the 'suppon' trapdoor lift for supernatural appearances."
    },
    "\u7fa9\u592a\u592b": {  # 義太夫
        "desc": "竹本義太夫が大成した語りと三味線による音楽形式。太夫（語り手）と三味線方の二人一組で物語を語り進める。人形浄瑠璃（文楽）から移入され、歌舞伎の時代物には欠かせない音楽。義太夫が入る歌舞伎を「義太夫狂言」「丸本物」と呼ぶ。",
        "desc_en": "A narrative music form perfected by Takemoto Gidayu, performed by a chanter (tayu) and shamisen player as a duo. Originally from bunraku puppet theater, it became essential for kabuki period plays. Kabuki works featuring gidayu are called 'gidayu kyogen' or 'maruhon mono.'"
    },
    "\u30bb\u30ea": {  # セリ
        "desc": "舞台の一部を上下させる仕掛けで、登場人物を舞台下からせり上げたり、場面転換に使う。花道の「すっぽん」もセリの一種。大セリは舞台中央の大型のもので、建物ごとせり上がる迫力ある演出が可能。",
        "desc_en": "A mechanism that raises or lowers part of the stage floor, used for dramatic character entrances from below or scene changes. The 'suppon' on the hanamichi is a type of seri. The large 'oseri' at center stage can lift entire sets for spectacular effects."
    },
    "\u30c4\u30b1\u6253\u3061": {  # ツケ打ち
        "desc": "舞台の上手で、役者の動きに合わせてツケ板を叩く担当者。見得、足拍子、立回りなど、演技のタイミングに合わせて拍子木で板を打ち、動きに迫力と臨場感を加える。演者との呼吸が重要な職人技。",
        "desc_en": "The person who strikes wooden clappers on a board at stage right, perfectly timed to actors' movements including mie poses, stomping, and fight scenes. Adds impact and immediacy to the performance. Requires expert timing and perfect synchronization with the actors."
    },
    "\u5948\u843d": {  # 奈落
        "desc": "花道を含めた舞台の床下空間。セリなどの舞台機構が設置されている。昔は暗く環境が悪かったため、仏教の地獄を意味する「奈落」の名がついた。現在は通路や大道具の製作場所としても使われる。",
        "desc_en": "The space beneath the stage and hanamichi floor, housing stage machinery like seri lifts. Named after the Buddhist concept of naraka (hell) because it was once a dark, harsh environment. Today it also serves as a corridor and workshop for building large props."
    }
}

updated = 0
for t in terms:
    raw = t.get("term", "")
    clean = raw.split("\uff08")[0].split("(")[0]
    if clean in updates:
        t["desc"] = updates[clean]["desc"]
        t["desc_en"] = updates[clean]["desc_en"]
        updated += 1
        print(f"  UPD: {raw}")

print(f"Updated: {updated}")

# --- 3. 50音順にソート ---
terms.sort(key=lambda t: t.get("reading", "") or "")

data["terms"] = terms
print(f"\nTotal: {len(terms)}")

out_path = "C:/Users/NAO/AppData/Local/Temp/glossary_updated.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Saved to {out_path}")
