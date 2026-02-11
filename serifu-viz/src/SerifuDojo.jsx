import { useState, useRef, useEffect } from "react";

// ── Demo data（動画 iFwMXYtqYA0 / bentenkozo と同期） ──
const DEMO_DATA = {
  metadata: { source: "demo", duration: 147, title: "弁天小僧「知らざぁ言って聞かせやしょう」" },
  phrases: [
    { start: 9.1, end: 19.2, text: "知らざあ言って聞かせやしょう" },
    { start: 30.5, end: 35.0, text: "浜の真砂と五右衛門が" },
    { start: 35.1, end: 39.1, text: "歌に残した盗人の" },
    { start: 39.2, end: 44.6, text: "種は尽きねぇ七里が浜" },
    { start: 44.7, end: 48.1, text: "その白浪の夜働き" },
    { start: 48.2, end: 51.4, text: "以前を言やァ江の島で" },
    { start: 51.5, end: 56.7, text: "年季勤めの稚児ヶ渕" },
    { start: 56.8, end: 59.6, text: "百味で散らす蒔銭を" },
    { start: 59.7, end: 64.5, text: "当に小皿の一文子" },
    { start: 64.6, end: 68.2, text: "百が二百と賽銭の" },
    { start: 68.3, end: 72.5, text: "くすね銭せえだんだんに" },
    { start: 72.6, end: 80.7, text: "悪事はのぼる上の宮" },
    { start: 80.8, end: 83.6, text: "岩本院で講中の" },
    { start: 83.7, end: 87.9, text: "枕さがしも度重なり" },
    { start: 88, end: 91.1, text: "お手長講と札附きに" },
    { start: 91.2, end: 97.6, text: "とうとう島を追い出され" },
    { start: 97.7, end: 101.7, text: "それから若衆の美人局" },
    { start: 101.8, end: 105.3, text: "ここやかしこの寺島で" },
    { start: 105.4, end: 108.8, text: "小耳に聞いた音羽屋の" },
    { start: 108.9, end: 118.2, text: "似ぬ声色で小ゆすりかたり" },
    { start: 118.3, end: 124.3, text: "名さえ由縁（ゆかり）の弁天小僧" },
    { start: 124.4, end: 131, text: "菊之助たァおれがことだ" },
  ],
};

// ── Convert old pitch_curve format to phrase format ──
function convertLegacyData(json) {
  if (json.phrases?.[0]?.text !== undefined) return json;
  if (json.phrases?.[0]?.length > 0) {
    return {
      metadata: json.metadata || {},
      phrases: json.phrases.map((pts, i) => ({
        start: pts[0]?.t || 0,
        end: pts[pts.length - 1]?.t || 0,
        text: `フレーズ ${i + 1}`,
      })),
    };
  }
  return json;
}

// ── Colors ──
const THEME = {
  bg: "#0c0a10",
  surface: "#141218",
  border: "#2a2030",
  gold: "#e2b84a",
  goldGlow: "rgba(226, 184, 74, 0.15)",
  accent: "#c43030",
  text: "#f0ebe4",
  dim: "#706068",
  dimmer: "#3a3040",
  highlight: "#e2b84a",
  unhighlight: "rgba(240, 235, 228, 0.18)",
  success: "#5cb87a",
};

function fmtTime(s) {
  const m = Math.floor((s || 0) / 60);
  const sec = Math.floor((s || 0) % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// ── Karaoke text component ──
function KaraokeText({ text, progress }) {
  // progress: 0 to 1
  const chars = [...text];
  const total = chars.length;

  return (
    <div style={{ display: "inline-block", position: "relative", lineHeight: 1.8 }}>
      {chars.map((ch, i) => {
        const charStart = i / total;
        const charEnd = (i + 1) / total;
        let charProgress = 0;
        if (progress >= charEnd) charProgress = 1;
        else if (progress > charStart)
          charProgress = (progress - charStart) / (charEnd - charStart);

        return (
          <span key={i} style={{ position: "relative", display: "inline-block" }}>
            {/* Base (unhighlighted) */}
            <span style={{ color: THEME.unhighlight, transition: "none" }}>
              {ch}
            </span>
            {/* Overlay (highlighted) */}
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                color: THEME.highlight,
                clipPath: `inset(0 ${Math.round((1 - charProgress) * 100)}% 0 0)`,
                transition: "none",
                textShadow:
                  charProgress > 0 ? `0 0 20px ${THEME.goldGlow}` : "none",
                willChange: "clip-path",
              }}
            >
              {ch}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ── Progress bar for phrase ──
function PhraseProgress({ progress }) {
  return (
    <div
      style={{
        width: "100%",
        height: 3,
        background: THEME.dimmer,
        borderRadius: 2,
        overflow: "hidden",
        marginTop: 8,
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, progress * 100))}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${THEME.accent}, ${THEME.gold})`,
          borderRadius: 2,
          transition: "width 0.05s linear",
        }}
      />
    </div>
  );
}

export default function SerifuDojo() {
  const [data, setData] = useState(DEMO_DATA);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [selPhrase, setSelPhrase] = useState(null);
  const [loop, setLoop] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const audioRef = useRef(null);
  const timeRef = useRef(0);
  const rafRef = useRef(null);
  const manualPlayRef = useRef(false);
  const manualLastRef = useRef(0);
  const activeRef = useRef(null);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  // ── Determine active phrase ──
  const activePhrase = data.phrases?.findIndex(
    (p) => time >= p.start - 0.05 && time <= p.end + 0.1
  );
  const activePhraseIdx = activePhrase >= 0 ? activePhrase : null;

  // ── Calculate progress for a phrase ──
  const phraseProgress = (phrase, currentTime) => {
    if (currentTime < phrase.start) return 0;
    if (currentTime > phrase.end) return 1;
    return (currentTime - phrase.start) / (phrase.end - phrase.start);
  };

  // ── Auto-scroll to active phrase ──
  useEffect(() => {
    if (autoScroll && activePhraseIdx !== null && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activePhraseIdx, autoScroll]);

  // ── Animation loop ──
  useEffect(() => {
    const tick = () => {
      if (hasAudio && audioRef.current && !audioRef.current.paused) {
        const t = audioRef.current.currentTime;
        timeRef.current = t;
        setTime(t);

        // Loop check
        if (loop && selPhrase !== null && data.phrases?.[selPhrase]) {
          const ph = data.phrases[selPhrase];
          if (t > ph.end + 0.3) {
            audioRef.current.currentTime = Math.max(0, ph.start - 0.3);
          }
        }
      } else if (manualPlayRef.current) {
        const now = performance.now();
        const dt = (now - manualLastRef.current) / 1000;
        manualLastRef.current = now;
        const next = timeRef.current + dt;
        timeRef.current = next;
        setTime(next);

        // Loop check (manual)
        if (loop && selPhrase !== null && data.phrases?.[selPhrase]) {
          const ph = data.phrases[selPhrase];
          if (next > ph.end + 0.3) {
            const reset = Math.max(0, ph.start - 0.3);
            timeRef.current = reset;
            setTime(reset);
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [hasAudio, loop, selPhrase, data]);

  // ── File loaders ──
  const loadJson = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const d = convertLegacyData(JSON.parse(ev.target.result));
        setData(d);
        setTime(0);
        timeRef.current = 0;
        setSelPhrase(null);
      } catch {
        alert("JSONの読み込みに失敗しました");
      }
    };
    r.readAsText(f);
    e.target.value = "";
  };

  const loadAudio = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (audioRef.current) {
      audioRef.current.src = URL.createObjectURL(f);
      audioRef.current.load();
      setHasAudio(true);
    }
    e.target.value = "";
  };

  // ── Playback ──
  const togglePlay = () => {
    if (hasAudio && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setPlaying(true);
        manualPlayRef.current = false;
      } else {
        audioRef.current.pause();
        setPlaying(false);
      }
    } else {
      if (manualPlayRef.current) {
        manualPlayRef.current = false;
        setPlaying(false);
      } else {
        manualPlayRef.current = true;
        manualLastRef.current = performance.now();
        setPlaying(true);
      }
    }
  };

  const jumpPhrase = (i) => {
    if (!data.phrases?.[i]) return;
    setSelPhrase(i);
    const st = Math.max(0, data.phrases[i].start - 0.3);
    timeRef.current = st;
    setTime(st);
    if (audioRef.current && hasAudio) audioRef.current.currentTime = st;
  };

  const phrases = data.phrases || [];
  const title = data.metadata?.title || data.metadata?.source || "台詞道場";

  const btnBase = {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6,
    padding: "6px 14px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };

  return (
    <div
      style={{
        background: THEME.bg,
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        color: THEME.text,
        fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${THEME.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 28 }}>🎭</span>
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 2,
              color: THEME.gold,
            }}
          >
            台詞道場
          </div>
          <div style={{ fontSize: 10, color: THEME.dim, letterSpacing: 1 }}>
            {title}
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <label
            style={{ ...btnBase, background: "#1a1822", color: THEME.dim }}
          >
            📄 JSON
            <input
              type="file"
              accept=".json"
              onChange={loadJson}
              style={{ display: "none" }}
            />
          </label>
          <label
            style={{ ...btnBase, background: "#1a1822", color: THEME.dim }}
          >
            🔊 音声
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={loadAudio}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </div>

      {/* ── Controls ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 20px",
          borderBottom: `1px solid ${THEME.border}`,
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={togglePlay}
          style={{
            ...btnBase,
            background: playing ? THEME.accent : "#252230",
            color: "#fff",
            minWidth: 70,
          }}
        >
          {playing ? "⏸ 停止" : "▶ 再生"}
        </button>
        <button
          onClick={() => setLoop(!loop)}
          style={{
            ...btnBase,
            background: loop ? "#2a2010" : "#252230",
            color: loop ? THEME.gold : THEME.dim,
            borderColor: loop ? THEME.gold + "40" : "rgba(255,255,255,0.08)",
          }}
        >
          🔁 ループ {loop ? "ON" : "OFF"}
        </button>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          style={{
            ...btnBase,
            background: "#252230",
            color: autoScroll ? THEME.text : THEME.dim,
          }}
        >
          ↕ 自動スクロール {autoScroll ? "ON" : "OFF"}
        </button>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 12,
            fontFamily: "monospace",
            color: THEME.dim,
          }}
        >
          {fmtTime(time)} / {fmtTime(data.metadata?.duration || 0)}
        </span>
      </div>

      {/* ── Main ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Phrase sidebar */}
        <div
          style={{
            width: 130,
            flexShrink: 0,
            background: THEME.surface,
            borderRight: `1px solid ${THEME.border}`,
            overflowY: "auto",
            padding: "8px 0",
          }}
        >
          <div
            style={{
              padding: "2px 10px 8px",
              fontSize: 10,
              color: THEME.dim,
              letterSpacing: 1,
            }}
          >
            フレーズ ({phrases.length})
          </div>
          {phrases.map((ph, i) => {
            const isActive = i === activePhraseIdx;
            const isSel = i === selPhrase;
            return (
              <button
                key={i}
                onClick={() => jumpPhrase(i)}
                style={{
                  display: "block",
                  width: "100%",
                  border: "none",
                  padding: "6px 10px",
                  textAlign: "left",
                  cursor: "pointer",
                  background: isActive
                    ? THEME.goldGlow
                    : isSel
                      ? "rgba(196,48,48,0.12)"
                      : "transparent",
                  color: isActive ? THEME.gold : isSel ? THEME.accent : THEME.dim,
                  fontSize: 11,
                  fontFamily: "monospace",
                  borderLeft: isActive
                    ? `3px solid ${THEME.gold}`
                    : isSel
                      ? `3px solid ${THEME.accent}`
                      : "3px solid transparent",
                }}
              >
                <div>
                  #{i + 1} {fmtTime(ph.start)}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    marginTop: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: isActive ? THEME.text : THEME.dimmer,
                    fontFamily: "'Noto Sans JP', sans-serif",
                  }}
                >
                  {ph.text}
                </div>
              </button>
            );
          })}
        </div>

        {/* Karaoke display */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "40px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {phrases.map((ph, i) => {
            const isActive = i === activePhraseIdx;
            const isPast = time > ph.end;
            const progress = phraseProgress(ph, time);

            return (
              <div
                key={i}
                ref={isActive ? activeRef : null}
                onClick={() => jumpPhrase(i)}
                style={{
                  padding: "16px 24px",
                  margin: "4px 0",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: isActive ? "rgba(226,184,74,0.06)" : "transparent",
                  borderLeft: isActive
                    ? `3px solid ${THEME.gold}`
                    : "3px solid transparent",
                  transition: "background 0.3s, border-color 0.3s",
                }}
              >
                {/* Phrase number + time */}
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: "monospace",
                    color: isActive ? THEME.gold : THEME.dimmer,
                    marginBottom: 6,
                  }}
                >
                  #{i + 1}　{fmtTime(ph.start)} – {fmtTime(ph.end)}
                  {i === selPhrase && loop && (
                    <span style={{ marginLeft: 8, color: THEME.gold }}>🔁</span>
                  )}
                </div>

                {/* Karaoke text */}
                <div
                  style={{
                    fontSize: isActive ? 32 : 24,
                    fontWeight: isActive ? 700 : 400,
                    letterSpacing: isActive ? 4 : 2,
                    transition: "font-size 0.3s, letter-spacing 0.3s",
                    opacity: isPast && !isActive ? 0.4 : 1,
                  }}
                >
                  {isActive ? (
                    <KaraokeText text={ph.text} progress={progress} />
                  ) : (
                    <span
                      style={{
                        color: isPast ? THEME.dim : THEME.unhighlight,
                      }}
                    >
                      {ph.text}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {isActive && <PhraseProgress progress={progress} />}
              </div>
            );
          })}

          {/* End spacer */}
          <div style={{ height: 200, flexShrink: 0 }} />
        </div>
      </div>

      {/* ── Footer hint ── */}
      {!hasAudio && (
        <div
          style={{
            padding: "8px 20px",
            borderTop: `1px solid ${THEME.border}`,
            fontSize: 11,
            color: THEME.dim,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          🔊 音声ファイルを読み込むと同期再生できます ・ デモデータで動作確認中
        </div>
      )}

      <audio ref={audioRef} style={{ display: "none" }} />
    </div>
  );
}
