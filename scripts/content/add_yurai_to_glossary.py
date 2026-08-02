import json, sys

sys.stdout.reconfigure(encoding='utf-8')

with open("C:/Users/NAO/AppData/Local/Temp/glossary_v3.json", encoding="utf-8") as f:
    data = json.load(f)

terms = data.get("terms", [])
print(f"Starting with {len(terms)} terms")

# 由来語データ（yurai_page.js から転記）
yurai_terms = [
    {
        "term": "愛想づかし（あいそづかし）",
        "reading": "あいそづかし",
        "term_en": "Aiso-zukashi",
        "kabuki": "縁切物で、女性が愛する男を助けるためにわざと冷たく突き放す演技。",
        "kabuki_en": "In breakup plays, the woman coldly rejects the man she loves to secretly help him.",
        "modern": "相手に対して冷たい態度をとること、愛想を尽かすこと。",
        "modern_en": "To act cold toward someone; to lose patience or affection.",
        "note": "「愛想尽かし」は歌舞伎の演技用語だが、日常語「愛想を尽かす」が歌舞伎由来かは諸説あり",
    },
    {
        "term": "板につく（いたにつく）",
        "reading": "いたにつく",
        "term_en": "Ita ni tsuku",
        "kabuki": "役者の演技が舞台（板）にしっくり馴染むこと。経験を積んだ役者の芸を褒める表現。",
        "kabuki_en": "When an actor's performance fits naturally on the stage (ita = boards). A compliment for a seasoned performer.",
        "modern": "地位や役割にふさわしい振る舞いが自然にできている様子。",
        "modern_en": "To look natural and fitting in one's role or position.",
    },
    {
        "term": "一枚看板（いちまいかんばん）",
        "reading": "いちまいかんばん",
        "term_en": "Ichimai kanban",
        "kabuki": "芝居小屋の看板に名前が大きく書かれる一座の代表的な役者。",
        "kabuki_en": "The star actor whose name appears largest on the theater's billboard.",
        "modern": "組織やチームの中心人物、看板的存在。",
        "modern_en": "The face of an organization; the star player.",
    },
    {
        "term": "裏方（うらかた）",
        "reading": "うらかた",
        "term_en": "Urakata",
        "kabuki": "舞台裏で大道具・小道具・衣裳・照明など、表に見えない仕事を担当する人。",
        "kabuki_en": "Backstage crew handling sets, props, costumes, and lighting — the unseen workers.",
        "modern": "表に出ず、陰で組織や仕事を支える人。",
        "modern_en": "A behind-the-scenes supporter; someone who works out of the spotlight.",
    },
    {
        "term": "お家芸（おいえげい）",
        "reading": "おいえげい",
        "term_en": "Oie-gei",
        "kabuki": "各俳優の家に代々伝わる得意な演目や演技。「成田屋」なら荒事、「音羽屋」なら世話物など。",
        "kabuki_en": "Signature plays and styles passed down through each acting family.",
        "modern": "その人や組織の得意技、代名詞的な強み。",
        "modern_en": "One's specialty or signature skill; something an organization is known for.",
    },
    {
        "term": "大詰め（おおづめ）",
        "reading": "おおづめ",
        "term_en": "Oozume",
        "kabuki": "歌舞伎の最終幕。物語のクライマックスが展開される場面。",
        "kabuki_en": "The final act of a kabuki play, where the climax unfolds.",
        "modern": "物事の最終段階、決着がつく場面。",
        "modern_en": "The final stage of something; the climax.",
    },
    {
        "term": "大向こうを唸らせる（おおむこうをうならせる）",
        "reading": "おおむこうをうならせる",
        "term_en": "Oomuko wo unaraseru",
        "kabuki": "劇場の最上階にいる目の肥えた常連客（大向こう）をも感嘆させるほどの名演技。",
        "kabuki_en": "A performance so superb it impresses even the discerning regulars in the uppermost gallery seats.",
        "modern": "専門家や玄人をも感心させる見事な腕前。",
        "modern_en": "To impress even experts and connoisseurs with one's skill.",
    },
    {
        "term": "御曹司（おんぞうし）",
        "reading": "おんぞうし",
        "term_en": "Onzoshi",
        "kabuki": "歌舞伎役者の家の跡取り息子を指す。名門一門の若手として注目される存在。",
        "kabuki_en": "The heir of a kabuki acting family, closely watched as the next generation.",
        "modern": "名家や有力者の息子。裕福な家庭の若者。",
        "modern_en": "The son of a wealthy or powerful family; a privileged young man.",
        "note": "元は武家の子息を指す語。歌舞伎界で広く使われ現代に定着",
    },
    {
        "term": "大根役者（だいこんやくしゃ）",
        "reading": "だいこんやくしゃ",
        "term_en": "Daikon yakusha",
        "kabuki": "演技が下手な役者を指す蔑称。大根は食あたりしない（当たらない）ことから、「当たらない＝人気が出ない・うまくない」役者の意。",
        "kabuki_en": "A derogatory term for a bad actor. Daikon radish never causes food poisoning ('ataru'), so 'doesn't hit' = 'never a hit.'",
        "modern": "演技が下手な人。嘘や演技が見え透いている人にも使う。",
        "modern_en": "A bad actor. Also used for someone whose lies or pretense are transparently unconvincing.",
    },
    {
        "term": "肩書（かたがき）",
        "reading": "かたがき",
        "term_en": "Katagaki",
        "kabuki": "番付（配役表）で役者の名前の右肩に、所属する座本（劇場責任者）の名を書いたこと。名前の「肩」に「書く」が由来。",
        "kabuki_en": "On the banzuke, the zamoto's name was written at the 'shoulder' of each actor's name — literally 'shoulder writing.'",
        "modern": "名刺などに書く役職や地位。",
        "modern_en": "A job title or position written on business cards.",
    },
    {
        "term": "顔が売れる（かおがうれる）",
        "reading": "かおがうれる",
        "term_en": "Kao ga ureru",
        "kabuki": "顔見世興行で名前と顔を売り出すことから。",
        "kabuki_en": "From kaomise performances where actors promoted their name and face.",
        "modern": "有名になること、広く知られるようになること。",
        "modern_en": "To become well-known; to gain fame.",
    },
    {
        "term": "口説き（くどき）",
        "reading": "くどき",
        "term_en": "Kudoki",
        "kabuki": "女形が切々と嘆いたり訴えたりする演技。泣きながら心情を語る愁嘆場の見せ場。",
        "kabuki_en": "A female-role actor's emotional plea or lament — a highlight of grief scenes.",
        "modern": "相手を説得するためにしつこく頼み込むこと。恋愛で「口説く」。",
        "modern_en": "To persistently persuade; in romance, to 'hit on' or 'sweet-talk.'",
    },
    {
        "term": "黒衣（くろご）",
        "reading": "くろご",
        "term_en": "Kurogo",
        "kabuki": "全身黒ずくめの後見。「黒は見えない」という歌舞伎の約束事で、観客からは存在しないものとされる。",
        "kabuki_en": "A stage assistant dressed entirely in black, invisible by kabuki convention.",
        "modern": "表に出ず、裏で物事を支える人。「縁の下の力持ち」に近い意味。",
        "modern_en": "Someone who works behind the scenes; an unsung supporter.",
    },
    {
        "term": "黒幕（くろまく）",
        "reading": "くろまく",
        "term_en": "Kuromaku",
        "kabuki": "夜の場面や場面転換で使う黒い幕。舞台の裏側で場面を操作する。",
        "kabuki_en": "A black curtain used for night scenes or scene changes, controlling the stage from behind.",
        "modern": "表に出ず、陰で人や組織を操る人物。",
        "modern_en": "A mastermind; someone pulling strings from behind the scenes.",
    },
    {
        "term": "ケレン味（けれんみ）",
        "reading": "けれんみ",
        "term_en": "Kerenmi",
        "kabuki": "宙乗り・早替わりなどの奇抜で大胆な演出。外連（けれん）は本来「ごまかし」の意味だが、歌舞伎ではエンタメ性の高い演出として肯定的に使われる。",
        "kabuki_en": "Spectacular staging like flying or quick costume changes. Originally 'trickery,' in kabuki it's positive showmanship.",
        "modern": "はったりや虚飾。「ケレン味のない」は「実直で飾り気のない」の意。",
        "modern_en": "Showmanship or bluff. 'Kerenmi no nai' means 'straightforward and unpretentious.'",
    },
    {
        "term": "こけら落とし（こけらおとし）",
        "reading": "こけらおとし",
        "term_en": "Kokera otoshi",
        "kabuki": "新築の劇場で行う最初の興行。「こけら」は建築で出る木の削りくずで、完成時に落とすことから。",
        "kabuki_en": "The inaugural performance at a newly built theater. 'Kokera' means wood shavings brushed off at construction completion.",
        "modern": "新しい施設の開業イベント。スタジアムや美術館にも使う。",
        "modern_en": "An opening event for a new facility — used for stadiums, galleries, etc.",
    },
    {
        "term": "差し金（さしがね）",
        "reading": "さしがね",
        "term_en": "Sashigane",
        "kabuki": "竹の棒の先に蝶や鳥をつけて操る小道具。後見が裏から操作する。",
        "kabuki_en": "A prop — a bamboo rod with a butterfly or bird attached, manipulated from behind by a stage assistant.",
        "modern": "裏で人を操ること。「あいつの差し金だろう」のように使う。",
        "modern_en": "To manipulate someone behind the scenes. 'It must be his doing.'",
    },
    {
        "term": "鞘当て（さやあて）",
        "reading": "さやあて",
        "term_en": "Sayaate",
        "kabuki": "二人の武士がすれ違う時に刀の鞘がぶつかり、争いになる場面。恋敵同士の対立を描くことが多い。",
        "kabuki_en": "A scene where two samurai's scabbards collide as they pass, sparking a fight — often depicting romantic rivalry.",
        "modern": "同じ相手をめぐって争うこと。恋愛の三角関係。",
        "modern_en": "A love triangle; rivalry over the same person.",
    },
    {
        "term": "三枚目（さんまいめ）",
        "reading": "さんまいめ",
        "term_en": "Sanmaime",
        "kabuki": "芝居小屋の看板の右から三番目に名前が書かれた、滑稽な役（道化方）を演じる役者。",
        "kabuki_en": "The actor whose name appeared third from the right on the theater billboard — the comic role player.",
        "modern": "お調子者、ひょうきんな人。",
        "modern_en": "A funny, clownish person; a comedian.",
    },
    {
        "term": "修羅場（しゅらば）",
        "reading": "しゅらば",
        "term_en": "Shuraba",
        "kabuki": "能・歌舞伎で合戦の場面を描く「修羅物」から。仏教の阿修羅が戦う世界を再現する勇壮な演目。",
        "kabuki_en": "From 'shura-mono' (battle plays) in noh and kabuki, depicting the fierce world of the Buddhist Ashura.",
        "modern": "激しい争いや混乱の場。「浮気がバレて修羅場に」のようにも使う。",
        "modern_en": "A scene of fierce conflict or chaos. Also used for dramatic personal confrontations.",
        "note": "元は仏教用語。能の「修羅物」を経て歌舞伎にも取り入れられた",
    },
    {
        "term": "正念場（しょうねんば）",
        "reading": "しょうねんば",
        "term_en": "Shonenba",
        "kabuki": "役者が本当の実力を見せる最も重要な場面。「性根場」とも書き、役の本質を表現する箇所。",
        "kabuki_en": "The crucial scene where an actor must show their true skill — revealing the character's essence.",
        "modern": "ここぞという大事な局面。「人生の正念場」",
        "modern_en": "A crucial moment; the make-or-break point.",
    },
    {
        "term": "十八番（おはこ）",
        "reading": "おはこ",
        "term_en": "Ohako / Juhachiban",
        "kabuki": "七代目市川團十郎が選んだ市川家の得意演目18本「歌舞伎十八番」。その台本を桐の箱（はこ）に保管したことから「おはこ」とも。",
        "kabuki_en": "The 18 signature plays of the Ichikawa family. Scripts were stored in paulownia boxes ('hako'), hence 'ohako.'",
        "modern": "最も得意な技や芸。「カラオケの十八番」",
        "modern_en": "One's specialty or go-to skill. 'My go-to karaoke song.'",
    },
    {
        "term": "助六寿司（すけろくずし）",
        "reading": "すけろくずし",
        "term_en": "Sukeroku-zushi",
        "kabuki": "歌舞伎十八番『助六由縁江戸桜』の登場人物に由来。助六の恋人「揚巻（あげまき）」の名前から、「揚げ」（稲荷寿司）と「巻き」（海苔巻き）を組み合わせた寿司。",
        "kabuki_en": "Named after the kabuki play Sukeroku. 'Agemaki' splits into 'age' (fried tofu sushi) and 'maki' (rolled sushi).",
        "modern": "稲荷寿司と海苔巻きの詰め合わせ。スーパーやコンビニでもおなじみ。",
        "modern_en": "An assortment of inari sushi and nori rolls — a staple at supermarkets and convenience stores.",
    },
    {
        "term": "捨て台詞（すてぜりふ）",
        "reading": "すてぜりふ",
        "term_en": "Sute-zerifu",
        "kabuki": "台本にない台詞のこと。場をつなぐためや、役者同士のアドリブの掛け合いで即興的に発せられる台詞。台本から外れた「捨てる」台詞の意。",
        "kabuki_en": "Lines not in the script — improvised dialogue to fill gaps or ad-libbed exchanges between actors.",
        "modern": "去り際に吐く捨て台詞、脅し文句。",
        "modern_en": "A parting shot; a threatening remark made when leaving.",
    },
    {
        "term": "世話女房（せわにょうぼう）",
        "reading": "せわにょうぼう",
        "term_en": "Sewa-nyobo",
        "kabuki": "世話物に登場する、夫の面倒をよく見る健気な女房役。",
        "kabuki_en": "A devoted wife character in sewamono plays, diligently caring for her husband.",
        "modern": "甲斐甲斐しく夫の世話を焼く妻。",
        "modern_en": "A doting, attentive wife who takes great care of her husband.",
    },
    {
        "term": "千両役者（せんりょうやくしゃ）",
        "reading": "せんりょうやくしゃ",
        "term_en": "Senryo yakusha",
        "kabuki": "年俸が千両にも達するほどの超人気役者。江戸時代、千両は途方もない大金だった。",
        "kabuki_en": "An actor earning a staggering annual salary of 1,000 ryo — an enormous sum in the Edo period.",
        "modern": "ここぞという場面で力を発揮する、頼りになる人物。",
        "modern_en": "A star performer; someone who delivers when it counts the most.",
    },
    {
        "term": "だんまり",
        "reading": "だんまり",
        "term_en": "Danmari",
        "kabuki": "暗闇の場面で、複数の登場人物が無言のまま手探りで宝物などを奪い合う様式的な演出。",
        "kabuki_en": "A stylized scene where characters silently grope in the dark, vying for a treasure.",
        "modern": "黙りこくること。「だんまりを決め込む」＝何も言わず黙っている。",
        "modern_en": "Remaining silent. 'To clam up' — refusing to speak.",
    },
    {
        "term": "とちる",
        "reading": "とちる",
        "term_en": "Tochiru",
        "kabuki": "役者が台詞や演技を間違えること。歌舞伎座では、役者がとちっても目立ちにくい席を「とちり席」（7・8列目あたり）と呼び、通に人気の良席として知られる。",
        "kabuki_en": "When an actor flubs their lines. At Kabukiza, seats where mistakes are least noticeable (rows 7-8) are called 'tochiri-seki' — prized by connoisseurs.",
        "modern": "失敗する、しくじる。「プレゼンでとちった」",
        "modern_en": "To mess up; to blunder. 'I flubbed the presentation.'",
        "note": "語源は「栃の実」説のほか「栃麺棒」説など諸説あり",
    },
    {
        "term": "どさ回り（どさまわり）",
        "reading": "どさまわり",
        "term_en": "Dosamawari",
        "kabuki": "一座が地方を巡業すること。旅回りの一座の苦労を表す芸能用語。",
        "kabuki_en": "A troupe's touring of rural areas — expressing the hardship of traveling troupes.",
        "modern": "地方を転々とすること。左遷や不遇を暗示することも。",
        "modern_en": "Traveling around the provinces; sometimes implying a demotion or hardship.",
        "note": "「佐渡の逆さ読み」説は俗説。語源は未確定",
    },
    {
        "term": "泥仕合（どろじあい）",
        "reading": "どろじあい",
        "term_en": "Dorojiai",
        "kabuki": "泥棒同士が争う場面。互いの素性を暴露し合い、みっともない争いになる。",
        "kabuki_en": "A scene of thieves fighting, exposing each other's secrets in an ugly quarrel.",
        "modern": "互いの欠点や秘密を暴露し合う醜い争い。",
        "modern_en": "A mudslinging match; an ugly dispute where both sides expose each other's faults.",
        "note": "芝居由来とする説が有力だが、相撲由来説もあり",
    },
    {
        "term": "どんでん返し（どんでんがえし）",
        "reading": "どんでんがえし",
        "term_en": "Donden-gaeshi",
        "kabuki": "大道具の背景を豪快に倒して場面転換する技法。大太鼓が「どんでん」と鳴ることから。",
        "kabuki_en": "A dramatic scene change where the set piece is flipped over, accompanied by booming drums.",
        "modern": "物語や状況が最後に正反対にひっくり返ること。",
        "modern_en": "A plot twist; a complete reversal of the situation at the end.",
    },
    {
        "term": "ドロン（どろん）",
        "reading": "どろん",
        "term_en": "Doron",
        "kabuki": "幽霊や妖怪が消える時に、大太鼓で「どろどろ」と鳴らす効果音。",
        "kabuki_en": "The drum sound effect — 'doro doro' — played when ghosts or spirits vanish.",
        "modern": "こっそり姿を消すこと。「会議中にドロンした」",
        "modern_en": "To slip away; to disappear quietly.",
    },
    {
        "term": "なあなあ",
        "reading": "なあなあ",
        "term_en": "Naanaa",
        "kabuki": "舞台上で内緒話をする演技の時に、互いに「なあ、なあ」と口パクで呼びかけ合う仕草から。",
        "kabuki_en": "From mouthing 'naa, naa' to each other when acting out a whispered conversation on stage.",
        "modern": "馴れ合いで適当に済ませること。「なあなあで済ませる」",
        "modern_en": "To settle something loosely by mutual compromise; to be too chummy.",
    },
    {
        "term": "奈落（ならく）",
        "reading": "ならく",
        "term_en": "Naraku",
        "kabuki": "花道を含む舞台床下の暗い空間。セリの機構が設置されている。仏教の地獄「奈落」になぞらえた。",
        "kabuki_en": "The dark space beneath the stage housing seri lift mechanisms, named after the Buddhist hell 'naraka.'",
        "modern": "「奈落の底に落ちる」＝どん底の状態に陥ること。",
        "modern_en": "'Falling to the depths of naraku' — hitting rock bottom.",
    },
    {
        "term": "二枚目（にまいめ）",
        "reading": "にまいめ",
        "term_en": "Nimaime",
        "kabuki": "芝居小屋の看板の右から二番目に名前が書かれた、色男・美男の役を演じる役者。",
        "kabuki_en": "The actor listed second from the right on the billboard — playing the handsome romantic lead.",
        "modern": "ハンサムな男性、イケメン。",
        "modern_en": "A handsome man; a good-looking guy.",
    },
    {
        "term": "のべつ幕なし（のべつまくなし）",
        "reading": "のべつまくなし",
        "term_en": "Nobetsu makunashi",
        "kabuki": "幕が下りることなく、ずっと芝居が続くこと。通常は幕間に休憩があるが、それもなく上演し続ける。",
        "kabuki_en": "Performing continuously without the curtain ever coming down — no intermissions.",
        "modern": "ひっきりなしに続くこと。「のべつ幕なしにしゃべる」",
        "modern_en": "Non-stop; incessantly. 'Talking non-stop.'",
    },
    {
        "term": "ノリ（のり）",
        "reading": "のり",
        "term_en": "Nori",
        "kabuki": "役者がお囃子のリズムに合わせて台詞を言ったり動いたりすること。音楽と一体化する演技技法。",
        "kabuki_en": "An actor matching their dialogue and movement to the rhythm of the musical ensemble.",
        "modern": "リズム感、調子のよさ。「ノリがいい」「ノリノリ」",
        "modern_en": "Rhythm, groove, vibe. 'Good vibes,' 'getting into it.'",
    },
    {
        "term": "花形（はながた）",
        "reading": "はながた",
        "term_en": "Hanagata",
        "kabuki": "人気のある若手の花形役者。華やかな存在感で舞台の花となる俳優。",
        "kabuki_en": "A popular young star actor who blooms like a flower on stage.",
        "modern": "人気者、スター。「チームの花形選手」",
        "modern_en": "A star; the leading figure.",
    },
    {
        "term": "花道（はなみち）",
        "reading": "はなみち",
        "term_en": "Hanamichi",
        "kabuki": "客席を貫いて舞台へとつながる通路。登退場や見せ場に使う歌舞伎独自の舞台装置。",
        "kabuki_en": "A raised walkway through the audience to the stage — kabuki's unique staging element.",
        "modern": "引退や去り際を飾る場面。「花道を飾る」＝見事な引退。",
        "modern_en": "A grand exit or retirement. 'Decorating the hanamichi' = a beautiful farewell.",
    },
    {
        "term": "幕切れ（まくぎれ）",
        "reading": "まくぎれ",
        "term_en": "Makugire",
        "kabuki": "引き幕が閉まり、一幕が終わること。",
        "kabuki_en": "The closing of the draw curtain, ending an act.",
        "modern": "物事の終わり、決着。「事件の幕切れ」",
        "modern_en": "The end of something; a conclusion.",
    },
    {
        "term": "幕の内弁当（まくのうちべんとう）",
        "reading": "まくのうちべんとう",
        "term_en": "Makunouchi bento",
        "kabuki": "幕間（まくあい）に食べるために作られた弁当が起源。多種のおかずを少しずつ詰め合わせたスタイル。",
        "kabuki_en": "Originally made for eating during intermissions. Features many small dishes packed together.",
        "modern": "多種のおかずが入った弁当の一般名称。駅弁やコンビニでもおなじみ。",
        "modern_en": "A general term for a multi-dish boxed lunch.",
    },
    {
        "term": "幕を引く（まくをひく）",
        "reading": "まくをひく",
        "term_en": "Maku wo hiku",
        "kabuki": "引き幕を引いて一幕を終わりにすること。",
        "kabuki_en": "To draw the curtain, ending an act.",
        "modern": "物事を終わらせること。「この問題に幕を引く」",
        "modern_en": "To bring something to an end.",
    },
    {
        "term": "見得を切る（みえをきる）",
        "reading": "みえをきる",
        "term_en": "Mie wo kiru",
        "kabuki": "動きを止めて決めポーズを取り、首を振って目をぐっと見開く歌舞伎の代表的な演技。",
        "kabuki_en": "Kabuki's iconic pose — freezing in position, swinging the head, and opening the eyes wide.",
        "modern": "大げさな態度で自信を示すこと。「強気に見得を切る」",
        "modern_en": "To show off or bluff with exaggerated confidence.",
    },
    {
        "term": "見せ場（みせば）",
        "reading": "みせば",
        "term_en": "Miseba",
        "kabuki": "芝居の中で最も見応えのある場面。役者が技を披露する最大の見どころ。",
        "kabuki_en": "The most impressive scene in a play — the showpiece where actors display their greatest skill.",
        "modern": "最も注目される場面や瞬間。「プレゼンの見せ場」",
        "modern_en": "The highlight or most impressive moment.",
    },
    {
        "term": "めりはり",
        "reading": "めりはり",
        "term_en": "Merihari",
        "kabuki": "義太夫節や長唄で、音の高低・強弱の変化をつけること。「減り（めり）」と「張り（はり）」の合成語。",
        "kabuki_en": "In gidayu and nagauta music, the contrast of pitch and volume — 'meri' (lowering) and 'hari' (projecting).",
        "modern": "物事に起伏や変化をつけること。「めりはりのある生活」",
        "modern_en": "To add variation and contrast.",
    },
    {
        "term": "檜舞台（ひのきぶたい）",
        "reading": "ひのきぶたい",
        "term_en": "Hinoki butai",
        "kabuki": "最高級の檜（ひのき）で作られた格式ある舞台。能舞台や一流の劇場に使われた。",
        "kabuki_en": "A stage made of premium hinoki cypress — used for the finest theaters and noh stages.",
        "modern": "実力を発揮する晴れの場。「檜舞台に立つ」＝大舞台で活躍する。",
        "modern_en": "A grand stage to showcase one's abilities.",
    },
    {
        "term": "市松模様（いちまつもよう）",
        "reading": "いちまつもよう",
        "term_en": "Ichimatsu moyo",
        "kabuki": "江戸時代の人気役者・初代佐野川市松が舞台で着用した袴の柄が大流行したことから。",
        "kabuki_en": "From the hakama pattern worn by the popular Edo-era actor Sanogawa Ichimatsu I, which became a huge trend.",
        "modern": "二色の正方形を交互に並べたチェッカー柄。東京2020五輪のエンブレムにも採用。",
        "modern_en": "A checkerboard pattern — also featured in the Tokyo 2020 Olympics emblem.",
    },
    {
        "term": "楽屋落ち（がくやおち）",
        "reading": "がくやおち",
        "term_en": "Gakuya ochi",
        "kabuki": "楽屋（控え室）の内輪だけがわかるネタや冗談。",
        "kabuki_en": "Inside jokes that only those in the dressing room (gakuya) would understand.",
        "modern": "内輪にしか通じない話やギャグ。",
        "modern_en": "An inside joke; humor that only insiders would get.",
    },
    {
        "term": "てんてこまい",
        "reading": "てんてこまい",
        "term_en": "Tentekomai",
        "kabuki": "小太鼓の音「てんてこ」に合わせてせわしなく踊りまわること。祭りや芝居の囃子で使われた。",
        "kabuki_en": "Frantic dancing to the small drum rhythm 'tenteko,' used in festival and theater music.",
        "modern": "忙しくて慌ただしい様子。「朝からてんてこまいだ」",
        "modern_en": "Frantically busy; in a tizzy.",
        "note": "歌舞伎に限らず芝居・祭りの囃子全般に由来",
    },
    {
        "term": "大喜利（おおぎり）",
        "reading": "おおぎり",
        "term_en": "Ogiri",
        "kabuki": "歌舞伎の一日の興行の最後の演目「大切（おおぎり）」から。お客を楽しませて送り出す締めくくり。",
        "kabuki_en": "From 'ogiri,' the final play of a kabuki program — the entertaining send-off for the audience.",
        "modern": "寄席やバラエティ番組で出演者が知恵を競う即興コーナー。",
        "modern_en": "An improvisational comedy segment where performers compete with wit.",
        "note": "歌舞伎の「大切」が語源とされるが、寄席芸能から発展した説もあり",
    },
]

# 既存用語の名前セット（重複防止）
existing = set()
for t in terms:
    raw = t.get("term", "")
    clean = raw.split("\uff08")[0].split("(")[0]
    existing.add(clean)

# 由来語を glossary 形式に変換して追加
added = 0
skipped = 0
for yt in yurai_terms:
    raw = yt["term"]
    clean = raw.split("\uff08")[0].split("（")[0]
    if clean in existing:
        print(f"  SKIP (exists): {raw}")
        skipped += 1
        continue

    # desc: 歌舞伎の意味 + 現代の意味を統合
    note_ja = f" ※{yt['note']}" if yt.get("note") else ""
    desc = f"【歌舞伎では】{yt['kabuki']}【現代では】{yt['modern']}{note_ja}"

    note_en = f" *Note: {yt.get('note_en', yt.get('note', ''))}" if yt.get("note") else ""
    desc_en = f"[In Kabuki] {yt.get('kabuki_en', '')} [Today] {yt.get('modern_en', '')}{note_en}"

    glossary_entry = {
        "term": raw,
        "reading": yt["reading"],
        "term_en": yt["term_en"],
        "desc": desc,
        "desc_en": desc_en,
        "category": "由来語",
    }
    terms.append(glossary_entry)
    added += 1
    print(f"  ADD: {raw}")

print(f"\nAdded: {added}, Skipped: {skipped}")

# ソート
terms.sort(key=lambda t: t.get("reading", "") or "")
data["terms"] = terms
print(f"Total: {len(terms)}")

out_path = "C:/Users/NAO/AppData/Local/Temp/glossary_v4.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Saved to {out_path}")
