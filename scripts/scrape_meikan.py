# pip install requests beautifulsoup4 pandas
import re
import time
import requests
import pandas as pd
from bs4 import BeautifulSoup
from urllib.parse import urljoin

BASE = "https://meikandb.kabuki.ne.jp/"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; one-time-scraper/1.0)"}

SLEEP_LIST = 0.6   # 一覧ページ間
SLEEP_ACTOR = 0.6  # 個別ページ間

def get(url):
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    r.encoding = r.apparent_encoding
    return r.text

def parse_actor_page(url):
    html = get(url)
    soup = BeautifulSoup(html, "html.parser")

    # ── h1 > span.name / span.kana から名前を取得 ──
    headline = soup.select_one("div.actor-headline h1")
    name_kanji = ""
    name_kana = ""
    generation = ""
    
    if headline:
        name_span = headline.select_one("span.name")
        kana_span = headline.select_one("span.kana")
        
        if name_span:
            # (N代目)の span を取得して除去
            gen_span = name_span.select_one("span")
            if gen_span:
                gen_text = gen_span.get_text(strip=True)
                gen_m = re.search(r"(\d+代目)", gen_text)
                if gen_m:
                    generation = gen_m.group(1)
                gen_span.decompose()
            # 残りのテキスト = 漢字名
            raw = name_span.get_text(strip=True)
            # 余分な空白を正規化
            name_kanji = re.sub(r"\s+", " ", raw).strip()
        
        if kana_span:
            raw = kana_span.get_text(strip=True)
            name_kana = re.sub(r"\s+", " ", raw).strip()

    # ── dl.actor-data__info から屋号・定紋・所属 ──
    yago = ""
    mon = ""
    aff = ""
    dl = soup.select_one("dl.actor-data__info")
    if dl:
        dts = dl.find_all("dt")
        for dt in dts:
            label = dt.get_text(strip=True)
            dd = dt.find_next_sibling("dd")
            if dd:
                val = dd.get_text(strip=True)
                if label == "屋号":
                    yago = val
                elif label == "定紋":
                    mon = val
                elif label == "所属":
                    aff = val

    # ── プロフィール ──
    profile = ""
    prof_sec = soup.select_one("section#profile .sectionBody p")
    if prof_sec:
        profile = prof_sec.get_text(strip=True)
        # 先頭の▼を除去
        if profile.startswith("▼"):
            profile = profile[1:]
        # 末尾の著者名（〔...〕）を除去
        profile = re.sub(r"〔[^〕]+〕$", "", profile).strip()
        # 長すぎる場合は300文字に切る
        if len(profile) > 300:
            profile = profile[:300] + "…"

    # ── 写真URL ──
    img_url = ""
    img_tag = soup.select_one("div.actor-data__image figure img")
    if img_tag and img_tag.get("src"):
        img_url = img_tag["src"]

    return {
        "name_kanji": name_kanji,
        "name_kana": name_kana,
        "generation": generation,
        "yago": yago,
        "mon": mon,
        "affiliation": aff,
        "profile": profile,
        "image_url": img_url,
    }

def main():
    top = get(BASE)
    soup = BeautifulSoup(top, "html.parser")

    # 「姓から検索」ブロック内のリンク（市川/尾上/中村…）
    surname_links = []
    for a in soup.select('a[href*="current_state=1"][href*="type=1"]'):
        href = a.get("href")
        url = urljoin(BASE, href)
        if url not in surname_links:
            surname_links.append(url)

    print(f"姓の一覧: {len(surname_links)} 件")

    actor_urls = {}  # url -> surname_key（重複排除）
    for sl in surname_links:
        html = get(sl)
        s = BeautifulSoup(html, "html.parser")
        for a in s.select('a[href^="/actor/"], a[href*="/actor/"]'):
            href = a.get("href")
            u = urljoin(BASE, href)
            if re.search(r"/actor/\d+/?$", u):
                actor_urls.setdefault(u, sl)
        time.sleep(SLEEP_LIST)
    
    print(f"俳優ページ: {len(actor_urls)} 件")

    rows = []
    for idx, (url, sl) in enumerate(actor_urls.items()):
        m = re.search(r"/actor/(\d+)/?$", url)
        actor_id = int(m.group(1)) if m else None
        try:
            info = parse_actor_page(url)
        except Exception as e:
            print(f"  ERROR {url}: {e}")
            info = {
                "name_kanji": "", "name_kana": "", "generation": "",
                "yago": "", "mon": "", "affiliation": "",
                "profile": "", "image_url": ""
            }
        rows.append({
            "actor_id": actor_id,
            "url": url,
            "list_page": sl,
            **info
        })
        if (idx + 1) % 50 == 0:
            print(f"  {idx+1}/{len(actor_urls)} 完了")
        time.sleep(SLEEP_ACTOR)

    df = pd.DataFrame(rows).sort_values(["yago", "name_kanji"]).reset_index(drop=True)
    df.to_csv("kabuki_meikan_current_actors.csv", index=False, encoding="utf-8-sig")
    df.to_json("kabuki_meikan_current_actors.json", force_ascii=False, orient="records", indent=2)
    
    # サマリ出力
    with_name = df[df["name_kanji"] != ""].shape[0]
    with_yago = df[df["yago"] != ""].shape[0]
    print(f"saved: {len(df)} actors (名前あり: {with_name}, 屋号あり: {with_yago})")

if __name__ == "__main__":
    main()
