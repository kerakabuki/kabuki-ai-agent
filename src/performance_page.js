// src/performance_page.js
// =========================================================
// 公演情報 — /performance
// 次回公演予定 ＋ 過去の公演演目一覧
// =========================================================
import { pageShell } from "./web_layout.js";

export function performancePageHTML() {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/jikabuki/gate/kera">JIKABUKI PLUS+</a><span>›</span><a href="/jikabuki/gate/kera/about">気良歌舞伎とは</a><span>›</span>公演情報
    </div>

    <!-- ── 次回公演 ── -->
    <section class="next-perf fade-up">
      <div class="next-perf-badge">NEXT</div>
      <h2 class="next-perf-title">令和８年 気良歌舞伎公演（予定）</h2>
      <div class="next-perf-details">
        <div class="next-perf-row">
          <span class="next-perf-label">📅 日時</span>
          <span class="next-perf-value">令和８年９月２６日（土） 17:00 開演</span>
        </div>
        <div class="next-perf-row">
          <span class="next-perf-label">📍 場所</span>
          <span class="next-perf-value">気良座（旧明方小学校講堂）</span>
        </div>
      </div>
      <p class="next-perf-note">
        ※ 詳細は決まり次第お知らせします。<br>
        最新情報は <a href="https://www.instagram.com/kerakabuki_official/" target="_blank" rel="noopener">Instagram</a> でもご確認いただけます。
      </p>
    </section>

    <!-- ── 過去の公演一覧 ── -->
    <section class="perf-archive fade-up">
      <h2 class="section-title">📜 過去の公演演目</h2>

      <div class="perf-list">

        <div class="perf-year-group">
          <h3 class="perf-year">令和７年（2025）</h3>
          <div class="perf-item">
            <div class="perf-date">9月28日</div>
            <div class="perf-info">
              <div class="perf-venue">五代目座長襲名披露公演（気良座）</div>
              <ul class="perf-enmoku">
                <li>寿曽我対面「工藤館」｜座長襲名劇中口上</li>
                <li>恋飛脚大和往来「封印切」</li>
                <li>白浪五人男「稲瀬川勢揃い」</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="perf-year-group">
          <h3 class="perf-year">令和６年（2024）</h3>
          <div class="perf-item">
            <div class="perf-date">9月28日</div>
            <div class="perf-info">
              <div class="perf-venue">気良座こけら落とし公演（気良座）</div>
              <ul class="perf-enmoku">
                <li>白浪五人男「稲瀬川勢揃い」</li>
                <li>絵本太功記十段目「尼崎閑居」</li>
                <li>仮名手本忠臣蔵七段目「祇園一力茶屋」</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="perf-year-group">
          <h3 class="perf-year">令和５年（2023）</h3>
          <div class="perf-item">
            <div class="perf-date">11月12日</div>
            <div class="perf-info">
              <div class="perf-venue">清流の国ぎふ「地歌舞伎勢揃い公演・秋」（ぎふ清流文化プラザ）</div>
              <ul class="perf-enmoku"><li>菅原伝授手習鑑「寺子屋」</li></ul>
            </div>
          </div>
          <div class="perf-item">
            <div class="perf-date">9月23日</div>
            <div class="perf-info">
              <div class="perf-venue">気良白山神社祭礼公演（気良座）</div>
              <ul class="perf-enmoku">
                <li>白浪五人男「稲瀬川勢揃い」</li>
                <li>与話情浮名横櫛「切られ与三」</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="perf-year-group">
          <h3 class="perf-year">令和４年（2022）</h3>
          <div class="perf-item">
            <div class="perf-date">11月13日</div>
            <div class="perf-info">
              <div class="perf-venue">第29回 飛騨・美濃歌舞伎大会 ぐじょう2022</div>
              <ul class="perf-enmoku"><li>義経千本桜「すし屋」</li></ul>
            </div>
          </div>
        </div>

        <div class="perf-year-group">
          <h3 class="perf-year">令和３年（2021）</h3>
          <div class="perf-item">
            <div class="perf-date">11月27日</div>
            <div class="perf-info">
              <div class="perf-venue">映像配信プロジェクト「通し上演仮名手本忠臣蔵」（旧明方小学校講堂）</div>
              <ul class="perf-enmoku">
                <li>仮名手本忠臣蔵三段目「門前進物」「松の間」</li>
                <li>仮名手本忠臣蔵九段目「山科閑居」</li>
              </ul>
            </div>
          </div>
          <div class="perf-item">
            <div class="perf-date">6月27日</div>
            <div class="perf-info">
              <div class="perf-venue">清流の国ぎふ「2020地歌舞伎勢揃い公演」（ぎふ清流文化プラザ）</div>
              <ul class="perf-enmoku">
                <li>仮名手本忠臣蔵五段目「鉄砲渡し」「二つ玉」</li>
                <li>仮名手本忠臣蔵六段目「勘平腹切」</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="perf-year-group">
          <h3 class="perf-year">令和２年（2020）</h3>
          <div class="perf-item">
            <div class="perf-date">9月11日</div>
            <div class="perf-info">
              <div class="perf-venue">「おうちで歌舞伎」地芝居映像配信プロジェクト（旧明方小学校講堂）</div>
              <ul class="perf-enmoku">
                <li>弁天娘女男白浪「浜松屋」</li>
                <li>弁天娘女男白浪「稲瀬川勢揃い」</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="perf-year-group">
          <h3 class="perf-year">令和元年（2019）</h3>
          <div class="perf-item">
            <div class="perf-date">9月21日</div>
            <div class="perf-info">
              <div class="perf-venue">気良白山神社祭礼公演（明宝コミュニティセンター）</div>
              <ul class="perf-enmoku">
                <li>伊勢音頭恋寝刃</li>
                <li>絵本太功記十段目「尼崎閑居」</li>
              </ul>
            </div>
          </div>
          <div class="perf-item">
            <div class="perf-date">7月14日</div>
            <div class="perf-info">
              <div class="perf-venue">改元記念 清流の国ぎふ「夏の地歌舞伎公演2019」（ぎふ清流文化プラザ）</div>
              <ul class="perf-enmoku"><li>伊勢音頭恋寝刃</li></ul>
            </div>
          </div>
        </div>

        <div class="perf-year-group">
          <h3 class="perf-year">平成30年（2018）</h3>
          <div class="perf-item">
            <div class="perf-date">9月15日</div>
            <div class="perf-info">
              <div class="perf-venue">気良白山神社祭礼公演（明宝コミュニティセンター）</div>
              <ul class="perf-enmoku">
                <li>子ども歌舞伎 白浪五人男「稲瀬川勢揃い」</li>
                <li>一谷嫩軍記「熊谷陣屋」</li>
              </ul>
            </div>
          </div>
        </div>

        <details class="perf-older">
          <summary class="perf-older-btn">平成29年以前の公演を見る ▼</summary>
          <div class="perf-older-body">

            <div class="perf-year-group">
              <h3 class="perf-year">平成29年（2017）</h3>
              <div class="perf-item">
                <div class="perf-date">11月19日</div>
                <div class="perf-info">
                  <div class="perf-venue">高雄・気良青年歌舞伎公演（郡上市総合文化センター）</div>
                  <ul class="perf-enmoku">
                    <li>伽羅先代萩「竹の間」</li>
                    <li>伽羅先代萩「御殿」</li>
                  </ul>
                </div>
              </div>
              <div class="perf-item">
                <div class="perf-date">9月16日</div>
                <div class="perf-info">
                  <div class="perf-venue">気良白山神社祭礼公演（明宝コミュニティセンター）</div>
                  <ul class="perf-enmoku">
                    <li>伽羅先代萩「竹の間」</li>
                    <li>伽羅先代萩「御殿」</li>
                    <li>伽羅先代萩「床下」</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="perf-year-group">
              <h3 class="perf-year">平成28年（2016）</h3>
              <div class="perf-item">
                <div class="perf-date">11月20日</div>
                <div class="perf-info">
                  <div class="perf-venue">高雄・気良青年歌舞伎公演（郡上市総合文化センター）</div>
                  <ul class="perf-enmoku"><li>菅原伝授手習鑑「寺子屋」</li></ul>
                </div>
              </div>
              <div class="perf-item">
                <div class="perf-date">9月17日</div>
                <div class="perf-info">
                  <div class="perf-venue">気良白山神社祭礼公演（明宝コミュニティセンター）</div>
                  <ul class="perf-enmoku"><li>菅原伝授手習鑑「寺子屋」（郡上市長特別出演）</li></ul>
                </div>
              </div>
            </div>

            <div class="perf-year-group">
              <h3 class="perf-year">平成27年（2015）</h3>
              <div class="perf-item">
                <div class="perf-date">10月25日</div>
                <div class="perf-info">
                  <div class="perf-venue">高雄・気良青年歌舞伎公演（郡上市総合文化センター）</div>
                  <ul class="perf-enmoku"><li>箱根霊験記誓仇討「瀧場」</li></ul>
                </div>
              </div>
              <div class="perf-item">
                <div class="perf-date">9月19日</div>
                <div class="perf-info">
                  <div class="perf-venue">気良白山神社祭礼公演（明宝コミュニティセンター）</div>
                  <ul class="perf-enmoku">
                    <li>子ども歌舞伎 白浪五人男「稲瀬川勢揃い」</li>
                    <li>箱根霊験記誓仇討「瀧場」</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="perf-year-group">
              <h3 class="perf-year">平成26年（2014）</h3>
              <div class="perf-item">
                <div class="perf-date">9月20日</div>
                <div class="perf-info">
                  <div class="perf-venue">気良白山神社祭礼公演（明宝コミュニティセンター）</div>
                  <ul class="perf-enmoku">
                    <li>子ども歌舞伎 白浪五人男「稲瀬川勢揃い」</li>
                    <li>仮名手本忠臣蔵七段目「祇園一力茶屋」</li>
                    <li>絵本太功記十段目「尼崎閑居」</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="perf-year-group">
              <h3 class="perf-year">平成25年（2013）</h3>
              <div class="perf-item">
                <div class="perf-date">9月21日</div>
                <div class="perf-info">
                  <div class="perf-venue">気良白山神社祭礼公演（明宝コミュニティセンター）</div>
                  <ul class="perf-enmoku"><li>近江源氏先陣館「盛綱陣屋」</li></ul>
                </div>
              </div>
            </div>

            <div class="perf-year-group">
              <h3 class="perf-year">平成24年（2012）</h3>
              <div class="perf-item">
                <div class="perf-date">9月22日</div>
                <div class="perf-info">
                  <div class="perf-venue">気良白山神社祭礼公演（明宝コミュニティセンター）</div>
                  <ul class="perf-enmoku">
                    <li>寿曽我対面</li>
                    <li>与話情浮名横櫛 源氏店「切られ与三」</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="perf-year-group">
              <h3 class="perf-year">平成23年（2011）</h3>
              <div class="perf-item">
                <div class="perf-date">9月24日</div>
                <div class="perf-info">
                  <div class="perf-venue">気良白山神社祭礼公演（明宝コミュニティセンター）</div>
                  <ul class="perf-enmoku">
                    <li>恋飛脚大和往来「封印切」</li>
                    <li>奥州安達原三段目「袖萩祭文」</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="perf-year-group">
              <h3 class="perf-year">平成22年（2010）</h3>
              <div class="perf-item">
                <div class="perf-date">9月22日</div>
                <div class="perf-info">
                  <div class="perf-venue">気良白山神社祭礼公演（明宝コミュニティセンター）</div>
                  <ul class="perf-enmoku">
                    <li>一谷嫩軍記「熊谷陣屋」</li>
                    <li>白浪五人男「稲瀬川勢揃い」</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="perf-year-group">
              <h3 class="perf-year">平成21年（2009）</h3>
              <div class="perf-item">
                <div class="perf-date">9月22日</div>
                <div class="perf-info">
                  <div class="perf-venue">気良白山神社祭礼公演（明宝コミュニティセンター）</div>
                  <ul class="perf-enmoku">
                    <li>伊勢音頭恋寝刃</li>
                    <li>絵本太功記十段目「尼崎閑居」</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="perf-year-group">
              <h3 class="perf-year">平成20年（2008）</h3>
              <div class="perf-item">
                <div class="perf-date">9月22日</div>
                <div class="perf-info">
                  <div class="perf-venue">気良白山神社祭礼公演（明宝コミュニティセンター）</div>
                  <ul class="perf-enmoku">
                    <li>義経千本桜「すし屋」</li>
                    <li>新版歌祭文「野崎村」</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="perf-year-group">
              <h3 class="perf-year">平成19年（2007）</h3>
              <div class="perf-item">
                <div class="perf-date">9月22日</div>
                <div class="perf-info">
                  <div class="perf-venue">気良白山神社祭礼公演（明宝コミュニティセンター）</div>
                  <ul class="perf-enmoku">
                    <li>仮名手本忠臣蔵五段目「鉄砲渡し」「二つ玉」</li>
                    <li>仮名手本忠臣蔵六段目「勘平腹切」</li>
                    <li>奥州安達原三段目「袖萩祭文」</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="perf-year-group">
              <h3 class="perf-year">平成18年（2006）</h3>
              <div class="perf-item">
                <div class="perf-date">9月22日</div>
                <div class="perf-info">
                  <div class="perf-venue">気良白山神社祭礼公演（明宝コミュニティセンター）</div>
                  <ul class="perf-enmoku">
                    <li>寿曽我対面</li>
                    <li>仮名手本忠臣蔵七段目「祇園一力茶屋」</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="perf-year-group">
              <h3 class="perf-year">平成17年（2005）</h3>
              <div class="perf-item">
                <div class="perf-date">9月22日</div>
                <div class="perf-info">
                  <div class="perf-venue perf-revival">🎉 気良歌舞伎復活公演（明宝コミュニティセンター）</div>
                  <ul class="perf-enmoku">
                    <li>白浪五人男「稲瀬川勢揃い」</li>
                    <li>絵本太功記十段目「尼崎閑居」</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </details>

      </div>
    </section>

    <!-- ── 公演映像 ── -->
    <section class="perf-videos fade-up">
      <h2 class="section-title">🎬 公演映像</h2>
      <p class="perf-videos-intro">
        過去の公演の映像をYouTubeで公開しています。気良座こけら落とし公演をはじめ、白山神社祭礼公演・地歌舞伎勢揃い公演などの名場面をご覧いただけます。
      </p>
      <p class="perf-videos-cta">
        <a href="https://www.youtube.com/results?search_query=気良歌舞伎+公演" target="_blank" rel="noopener" class="perf-videos-btn">📺 YouTubeで公演映像を見る</a>
      </p>
    </section>
  `;

  return pageShell({
    title: "公演情報",
    subtitle: "Performance Schedule",
    bodyHTML,
    brand: "jikabuki",
    activeNav: "jikabuki",
    headExtra: `<style>
      /* ── 次回公演 ── */
      .next-perf {
        background: var(--bg-card);
        border: 2px solid var(--aka);
        border-radius: 16px;
        padding: 2rem 1.5rem;
        text-align: center;
        margin-bottom: 2rem;
        position: relative;
        overflow: hidden;
      }
      .next-perf::before {
        content: "";
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--aka), var(--kin), var(--aka));
      }
      .next-perf-badge {
        display: inline-block;
        background: var(--aka);
        color: #fff;
        font-size: 0.7rem;
        font-weight: bold;
        padding: 0.2rem 1rem;
        border-radius: 20px;
        letter-spacing: 0.15em;
        margin-bottom: 0.8rem;
      }
      .next-perf-title {
        font-size: 1.3rem;
        color: var(--kin);
        margin-bottom: 1rem;
      }
      .next-perf-details { max-width: 400px; margin: 0 auto; }
      .next-perf-row {
        display: flex;
        gap: 0.8rem;
        padding: 0.6rem 0;
        border-bottom: 1px solid var(--border-light);
        align-items: center;
      }
      .next-perf-row:last-child { border-bottom: none; }
      .next-perf-label {
        font-size: 0.88rem;
        color: var(--kin);
        white-space: nowrap;
        min-width: 60px;
      }
      .next-perf-value {
        font-size: 1rem;
        color: var(--text-primary);
        font-weight: bold;
      }
      .next-perf-note {
        margin-top: 1rem;
        font-size: 0.8rem;
        color: var(--text-tertiary);
        line-height: 1.6;
      }
      .next-perf-note a { color: var(--kin); }

      /* ── 公演一覧 ── */
      .perf-list { }
      .perf-year-group { margin-bottom: 1.5rem; }
      .perf-year {
        font-size: 1rem;
        color: var(--kin);
        border-bottom: 1px solid var(--border-light);
        padding-bottom: 0.3rem;
        margin-bottom: 0.6rem;
      }
      .perf-item {
        display: flex;
        gap: 0.8rem;
        padding: 0.6rem 0;
        border-bottom: 1px solid var(--border-medium);
      }
      .perf-item:last-child { border-bottom: none; }
      .perf-date {
        flex-shrink: 0;
        font-size: 0.82rem;
        color: var(--text-tertiary);
        min-width: 55px;
        padding-top: 0.1rem;
      }
      .perf-info { flex: 1; }
      .perf-venue {
        font-size: 0.88rem;
        color: var(--text-primary);
        font-weight: bold;
        margin-bottom: 0.3rem;
      }
      .perf-revival { color: var(--kin); }
      .perf-enmoku {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .perf-enmoku li {
        font-size: 0.84rem;
        color: var(--text-tertiary);
        padding: 0.15rem 0;
        padding-left: 1em;
        text-indent: -1em;
      }
      .perf-enmoku li::before {
        content: "・";
        color: var(--aka);
      }

      /* ── 折りたたみ ── */
      .perf-older {
        margin-top: 1rem;
        border: 1px solid var(--border-light);
        border-radius: 12px;
        overflow: hidden;
        background: var(--bg-subtle);
      }
      .perf-older-btn {
        padding: 0.8rem 1rem;
        font-size: 0.92rem;
        font-weight: bold;
        color: var(--kin);
        cursor: pointer;
        list-style: none;
      }
      .perf-older-btn::-webkit-details-marker { display: none; }
      .perf-older[open] .perf-older-btn { border-bottom: 1px solid var(--border-light); }
      .perf-older-body { padding: 0 1rem 1rem; }

      /* ── 公演映像 ── */
      .perf-videos {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-light);
      }
      .perf-videos-intro {
        font-size: 0.92rem;
        color: var(--text-tertiary);
        line-height: 1.7;
        margin-bottom: 1rem;
      }
      .perf-videos-cta { text-align: center; }
      .perf-videos-btn {
        display: inline-block;
        background: #c4303a;
        color: #fff;
        padding: 0.8rem 1.5rem;
        border-radius: 10px;
        text-decoration: none;
        font-weight: bold;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .perf-videos-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(196,48,58,0.4);
      }

      @media (max-width: 600px) {
        .next-perf { padding: 1.5rem 1rem; }
        .next-perf-title { font-size: 1.1rem; }
        .next-perf-row { flex-direction: column; gap: 0.2rem; }
        .perf-item { flex-direction: column; gap: 0.2rem; }
        .perf-date { min-width: auto; }
      }
    </style>`,
  });
}
