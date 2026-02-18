import json, sys, io
from collections import Counter

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
d = json.load(open("kabuki_meikan_current_actors.json", "r", encoding="utf-8"))
print(f"Total: {len(d)}")
print(f"With name: {sum(1 for x in d if x['name_kanji'])}")
print(f"With kana: {sum(1 for x in d if x['name_kana'])}")
print(f"With generation: {sum(1 for x in d if x['generation'])}")
print(f"With yago: {sum(1 for x in d if x['yago'])}")
print(f"With mon: {sum(1 for x in d if x['mon'])}")
print(f"With profile: {sum(1 for x in d if x['profile'])}")
print(f"With image: {sum(1 for x in d if x['image_url'])}")
print()
print("=== Top yago ===")
yc = Counter(x["yago"] for x in d if x["yago"])
for y, c in yc.most_common(20):
    print(f"  {y}: {c}")
print()
print("=== Sample famous actors ===")
famous = [x for x in d if x["yago"] and x["mon"]]
for x in famous[:15]:
    gen = f" ({x['generation']})" if x["generation"] else ""
    print(f"  {x['name_kanji']}{gen} / {x['yago']} / {x['mon']}")
