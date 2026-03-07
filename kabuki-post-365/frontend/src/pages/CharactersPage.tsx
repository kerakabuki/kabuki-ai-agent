import { useState, useEffect } from 'react';
import { RefreshCw, Search } from 'lucide-react';

const NAVI_API = 'https://kabukiplus.com/api/characters';
const NAVI_ENMOKU_API = 'https://kabukiplus.com/api/enmoku';

interface NaviCharacter {
  name: string;
  kana: string;
  desc: string;
  plays: string[];
  roles: string[];
}

interface CastImage {
  charName: string;  // name part only (without kana)
  imageUrl: string;
  playTitle: string;
}

// Extract the display name from "弁天小僧 菊之助（べんてんこぞう きくのすけ）" → "弁天小僧 菊之助"
function extractName(raw: string): string {
  return raw.replace(/（.*?）/g, '').replace(/\(.*?\)/g, '').trim();
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<NaviCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<NaviCharacter | null>(null);

  // Map: character name → image URL from enmoku cast data
  const [castImages, setCastImages] = useState<Record<string, CastImage>>({});
  const [imagesLoading, setImagesLoading] = useState(true);

  const fetchCharacters = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(NAVI_API);
      const data = await res.json();
      if (data.ok) {
        setCharacters(data.characters);
      } else {
        setError(data.error || 'APIエラー');
      }
    } catch (e: any) {
      setError('NAVI APIに接続できません: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch enmoku catalog, then fetch each enmoku detail to get cast images
  const fetchCastImages = async () => {
    setImagesLoading(true);
    try {
      const catalogRes = await fetch(`${NAVI_ENMOKU_API}/catalog`);
      const catalog: { id: string; short: string }[] = await catalogRes.json();

      const imageMap: Record<string, CastImage> = {};

      // Fetch details in parallel (batched)
      const details = await Promise.all(
        catalog.map(async (entry) => {
          try {
            const res = await fetch(`${NAVI_ENMOKU_API}/${entry.id}`);
            if (!res.ok) return null;
            return { id: entry.id, data: await res.json() };
          } catch { return null; }
        })
      );

      for (const item of details) {
        if (!item) continue;
        const { data } = item;
        const playTitle = data.title_short || data.title || '';
        const cast = data.cast || [];
        for (const c of cast) {
          if (c.image) {
            const name = extractName(c.name);
            // Use full URL pointing to kabukiplus.com
            const imageUrl = c.image.startsWith('http')
              ? c.image
              : `https://kabukiplus.com${c.image}`;
            // Only keep first occurrence (prefer first enmoku found)
            if (!imageMap[name]) {
              imageMap[name] = { charName: name, imageUrl, playTitle };
            }
          }
        }
      }

      setCastImages(imageMap);
    } catch (e) {
      console.error('Cast image fetch error:', e);
    } finally {
      setImagesLoading(false);
    }
  };

  useEffect(() => { fetchCharacters(); fetchCastImages(); }, []);

  const filtered = characters.filter(ch => {
    if (!search) return true;
    const q = search.toLowerCase();
    return ch.name.includes(q) || ch.kana.includes(q) ||
      ch.plays.some(p => p.includes(q)) || ch.desc.includes(q);
  });

  const grouped = filtered.reduce((acc: Record<string, NaviCharacter[]>, ch) => {
    const play = ch.plays[0] || '未分類';
    if (!acc[play]) acc[play] = [];
    acc[play].push(ch);
    return acc;
  }, {});

  const getImage = (name: string): CastImage | undefined => castImages[name];

  // Count characters with images
  const withImageCount = characters.filter(ch => castImages[ch.name]).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">キャラクター</h2>
          <p className="text-sm text-gray-500 mt-1">
            KABUKI NAVIから取得 ({characters.length}件)
            {!imagesLoading && withImageCount > 0 && (
              <span className="ml-2 text-green-600">📸 {withImageCount}件に画像あり</span>
            )}
          </p>
        </div>
        <button
          onClick={() => { fetchCharacters(); fetchCastImages(); }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          再取得
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="名前・演目・キーワードで検索..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">NAVI APIからデータを取得中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {search ? '検索結果がありません' : 'キャラクターデータがありません'}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, 'ja')).map(([play, chars]) => (
            <div key={play}>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{play}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {chars.map((ch) => {
                  const img = getImage(ch.name);
                  return (
                    <div
                      key={ch.name}
                      onClick={() => setSelected(ch)}
                      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-red-300 transition-colors"
                    >
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        {img ? (
                          <img
                            src={img.imageUrl}
                            alt={ch.name}
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-xl">
                            🎭
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">{ch.name}</div>
                          {ch.kana && <div className="text-xs text-gray-500">{ch.kana}</div>}
                          {ch.desc && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ch.desc}</p>}
                        </div>
                      </div>
                      {(ch.plays.length > 1 || ch.roles.length > 0) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ch.plays.slice(1).map(p => (
                            <span key={p} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{p}</span>
                          ))}
                          {ch.roles.map(r => (
                            <span key={r} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-4">
              {/* Large thumbnail in modal */}
              {getImage(selected.name) ? (
                <img
                  src={getImage(selected.name)!.imageUrl}
                  alt={selected.name}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-gray-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-3xl">
                  🎭
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selected.name}</h3>
                    {selected.kana && <p className="text-sm text-gray-500">{selected.kana}</p>}
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl flex-shrink-0">&times;</button>
                </div>
                {getImage(selected.name) && (
                  <p className="text-xs text-green-600 mt-1">📸 {getImage(selected.name)!.playTitle}</p>
                )}
              </div>
            </div>

            {selected.desc && (
              <p className="text-sm text-gray-700 mb-4">{selected.desc}</p>
            )}

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">出演演目</h4>
                <div className="flex flex-wrap gap-1">
                  {selected.plays.map(p => (
                    <span key={p} className="text-sm bg-gray-100 px-3 py-1 rounded-lg">{p}</span>
                  ))}
                </div>
              </div>

              {selected.roles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">役柄</h4>
                  <div className="flex flex-wrap gap-1">
                    {selected.roles.map(r => (
                      <span key={r} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
