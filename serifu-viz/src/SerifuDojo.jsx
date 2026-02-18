import { useState, useRef, useEffect } from "react";

// ── Demo data ──
const DEMO = {
  metadata: { title: "弁天小僧（浜松屋の場）", duration: 147 },
  phrases: [
    { start: 9.1, end: 18.5, text: "知らざあ言って聞かせやしょう" },
    { start: 30.5, end: 34.5, text: "浜の真砂と五右衛門が" },
    { start: 35.1, end: 38.5, text: "歌に残した盗人の" },
    { start: 39.2, end: 44.0, text: "種は尽きねぇ七里が浜" },
    { start: 44.7, end: 47.5, text: "その白浪の夜働き" },
    { start: 48.2, end: 51.0, text: "以前を言やァ江の島で" },
    { start: 51.5, end: 56.0, text: "年季勤めの稚児ヶ渕" },
    { start: 56.8, end: 59.0, text: "百味で散らす蒔銭を" },
    { start: 59.7, end: 64.0, text: "当に小皿の一文子" },
    { start: 64.6, end: 67.5, text: "百が二百と賽銭の" },
    { start: 68.3, end: 72.0, text: "くすね銭せえだんだんに" },
    { start: 72.6, end: 80.0, text: "悪事はのぼる上の宮" },
    { start: 80.8, end: 83.0, text: "岩本院で講中の" },
    { start: 83.7, end: 87.5, text: "枕さがしも度重なり" },
    { start: 88.0, end: 90.5, text: "お手長講と札附きに" },
    { start: 91.2, end: 97.0, text: "とうとう島を追い出され" },
    { start: 97.7, end: 101.0, text: "それから若衆の美人局" },
    { start: 101.8, end: 104.8, text: "ここやかしこの寺島で" },
    { start: 105.4, end: 108.2, text: "小耳に聞いた音羽屋の" },
    { start: 108.9, end: 117.5, text: "似ぬ声色で小ゆすりかたり" },
    { start: 118.3, end: 123.5, text: "名さえ由縁の弁天小僧" },
    { start: 124.4, end: 132.0, text: "菊之助たァおれがことだ" },
  ],
};

const TH = {
  bg: "#0b0910",
  surface: "#13111a",
  border: "#261e2e",
  gold: "#e2b84a",
  goldSoft: "rgba(226,184,74,0.10)",
  red: "#c43030",
  text: "#efe8df",
  dim: "#685e6e",
  dimmer: "#352e3d",
  unlit: "rgba(239,232,223,0.15)",
};

function fmtT(s) {
  return `${Math.floor((s || 0) / 60)}:${String(Math.floor((s || 0) % 60)).padStart(2, "0")}`;
}

// ── Single character with width-based highlight ──
function Char({ ch, progress }) {
  const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));
  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        color: TH.unlit,
      }}
    >
      {/* Invisible char for sizing */}
      <span style={{ visibility: "hidden" }}>{ch}</span>
      {/* Background (unlit) layer */}
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          color: TH.unlit,
          pointerEvents: "none",
        }}
      >
        {ch}
      </span>
      {/* Foreground (lit) layer - clipped by overflow */}
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: `${pct}%`,
          overflow: "hidden",
          whiteSpace: "nowrap",
          color: TH.gold,
          pointerEvents: "none",
        }}
      >
        {ch}
      </span>
    </span>
  );
}

function KaraokeLine({ text, progress }) {
  const chars = [...text];
  const n = chars.length;
  return (
    <div style={{ lineHeight: 1.9 }}>
      {chars.map((ch, i) => {
        const cs = i / n;
        const ce = (i + 1) / n;
        let cp = 0;
        if (progress >= ce) cp = 1;
        else if (progress > cs) cp = (progress - cs) / (ce - cs);
        return <Char key={i} ch={ch} progress={cp} />;
      })}
    </div>
  );
}

function Bar({ progress }) {
  return (
    <div
      style={{
        width: "100%",
        height: 3,
        background: TH.dimmer,
        borderRadius: 2,
        marginTop: 10,
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 2,
          width: `${Math.min(100, Math.max(0, progress * 100))}%`,
          background: `linear-gradient(90deg, ${TH.red}, ${TH.gold})`,
        }}
      />
    </div>
  );
}

export default function SerifuDojo() {
  const [data, setData] = useState(DEMO);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [sel, setSel] = useState(null);
  const [loop, setLoop] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  const audioEl = useRef(null);
  const tRef = useRef(0);
  const rafId = useRef(null);
  const playingRef = useRef(false);
  const lastTs = useRef(0);
  const activeEl = useRef(null);

  // ── Sync refs ──
  useEffect(() => {
    tRef.current = time;
  }, [time]);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // ── Active phrase ──
  const activeIdx = data.phrases?.findIndex(
    (p) => time >= p.start && time <= p.end + 0.05
  );

  // ── Auto-scroll ──
  useEffect(() => {
    if (activeIdx >= 0 && activeEl.current) {
      activeEl.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIdx]);

  // ── Main loop ──
  useEffect(() => {
    const tick = () => {
      // Audio sync
      if (hasAudio && audioEl.current && !audioEl.current.paused) {
        tRef.current = audioEl.current.currentTime;
        setTime(audioEl.current.currentTime);
      }
      // Manual timer
      else if (playingRef.current && !hasAudio) {
        const now = performance.now();
        const dt = (now - lastTs.current) / 1000;
        lastTs.current = now;
        tRef.current += dt;
        setTime(tRef.current);
      }

      // Loop selected phrase
      if (playingRef.current && loop && sel !== null && data.phrases?.[sel]) {
        const ph = data.phrases[sel];
        if (tRef.current > ph.end + 0.2) {
          const rst = ph.start;
          tRef.current = rst;
          setTime(rst);
          if (hasAudio && audioEl.current)
            audioEl.current.currentTime = rst;
        }
      }

      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [hasAudio, loop, sel, data]);

  // ── Controls ──
  const togglePlay = () => {
    if (hasAudio && audioEl.current) {
      if (audioEl.current.paused) {
        audioEl.current.play();
        setPlaying(true);
      } else {
        audioEl.current.pause();
        setPlaying(false);
      }
    } else {
      if (playing) {
        setPlaying(false);
      } else {
        lastTs.current = performance.now();
        setPlaying(true);
      }
    }
  };

  const jump = (i) => {
    const ph = data.phrases?.[i];
    if (!ph) return;
    setSel(i);
    tRef.current = ph.start;
    setTime(ph.start);
    if (hasAudio && audioEl.current) audioEl.current.currentTime = ph.start;
  };

  const reset = () => {
    tRef.current = 0;
    setTime(0);
    setPlaying(false);
    if (hasAudio && audioEl.current) {
      audioEl.current.pause();
      audioEl.current.currentTime = 0;
    }
  };

  const loadJson = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.phrases?.[0]?.text) {
          setData(d);
          reset();
        } else alert("phrases[].text が必要です");
      } catch {
        alert("JSON読み込みエラー");
      }
    };
    r.readAsText(f);
    e.target.value = "";
  };

  const loadAudio = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (audioEl.current) {
      audioEl.current.src = URL.createObjectURL(f);
      audioEl.current.load();
      setHasAudio(true);
    }
    e.target.value = "";
  };

  const progress = (ph) => {
    if (time < ph.start) return 0;
    if (time > ph.end) return 1;
    return (time - ph.start) / (ph.end - ph.start);
  };

  const phrases = data.phrases || [];
  const title = data.metadata?.title || "台詞道場";

  const btn = (bg, fg, border) => ({
    background: bg,
    color: fg,
    border: border || "1px solid rgba(255,255,255,0.06)",
    borderRadius: 6,
    padding: "6px 14px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  });

  return (
    <div
      style={{
        background: TH.bg,
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        color: TH.text,
        fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic ProN',sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 20px",
          borderBottom: `1px solid ${TH.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 26 }}>🎭</span>
        <div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: 3,
              color: TH.gold,
            }}
          >
            台詞道場
          </div>
          <div style={{ fontSize: 10, color: TH.dim }}>{title}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <label style={btn("#181620", TH.dim)}>
            📄 JSON
            <input
              type="file"
              accept=".json"
              onChange={loadJson}
              hidden
            />
          </label>
          <label style={btn("#181620", TH.dim)}>
            🔊 音声
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={loadAudio}
              hidden
            />
          </label>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 20px",
          borderBottom: `1px solid ${TH.border}`,
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={togglePlay}
          style={btn(playing ? TH.red : "#252030", "#fff")}
        >
          {playing ? "⏸ 停止" : "▶ 再生"}
        </button>
        <button onClick={reset} style={btn("#252030", TH.dim)}>
          ⏮ 最初
        </button>
        <button
          onClick={() => setLoop(!loop)}
          style={btn(
            loop ? "#2a2010" : "#252030",
            loop ? TH.gold : TH.dim,
            loop ? `1px solid ${TH.gold}44` : undefined
          )}
        >
          🔁 {loop ? "ON" : "OFF"}
        </button>
        <div style={{ flex: 1 }} />
        <span
          style={{ fontSize: 12, fontFamily: "monospace", color: TH.dim }}
        >
          {fmtT(time)} / {fmtT(data.metadata?.duration)}
        </span>
      </div>

      {/* Main */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div
          style={{
            width: 120,
            flexShrink: 0,
            background: TH.surface,
            borderRight: `1px solid ${TH.border}`,
            overflowY: "auto",
            padding: "6px 0",
          }}
        >
          <div
            style={{
              padding: "2px 8px 6px",
              fontSize: 10,
              color: TH.dim,
            }}
          >
            全{phrases.length}句
          </div>
          {phrases.map((ph, i) => {
            const act = i === activeIdx;
            const s = i === sel;
            return (
              <button
                key={i}
                onClick={() => jump(i)}
                style={{
                  display: "block",
                  width: "100%",
                  border: "none",
                  padding: "5px 8px",
                  textAlign: "left",
                  cursor: "pointer",
                  background: act ? TH.goldSoft : "transparent",
                  color: act ? TH.gold : s ? TH.red : TH.dim,
                  fontSize: 11,
                  fontFamily: "monospace",
                  borderLeft: act
                    ? `3px solid ${TH.gold}`
                    : s
                      ? `3px solid ${TH.red}`
                      : "3px solid transparent",
                }}
              >
                #{i + 1} {fmtT(ph.start)}
              </button>
            );
          })}
        </div>

        {/* Lyrics area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px 28px",
          }}
        >
          {phrases.map((ph, i) => {
            const act = i === activeIdx;
            const past = time > ph.end;
            const p = progress(ph);
            return (
              <div
                key={i}
                ref={act ? activeEl : null}
                onClick={() => jump(i)}
                style={{
                  padding: "14px 20px",
                  margin: "3px 0",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: act ? TH.goldSoft : "transparent",
                  borderLeft: act
                    ? `3px solid ${TH.gold}`
                    : "3px solid transparent",
                  transition: "background 0.2s",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: "monospace",
                    color: act ? TH.gold : TH.dimmer,
                    marginBottom: 4,
                  }}
                >
                  #{i + 1}
                  {i === sel && loop && (
                    <span style={{ marginLeft: 6, color: TH.gold }}>🔁</span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: act ? 30 : 22,
                    fontWeight: act ? 700 : 400,
                    letterSpacing: act ? 4 : 2,
                    transition: "font-size 0.25s, letter-spacing 0.25s",
                    opacity: past && !act ? 0.35 : 1,
                  }}
                >
                  {act ? (
                    <KaraokeLine text={ph.text} progress={p} />
                  ) : (
                    <span
                      style={{
                        color: past ? TH.dim : TH.unlit,
                      }}
                    >
                      {ph.text}
                    </span>
                  )}
                </div>
                {act && <Bar progress={p} />}
              </div>
            );
          })}
          <div style={{ height: 200 }} />
        </div>
      </div>

      {!hasAudio && (
        <div
          style={{
            padding: "6px 20px",
            borderTop: `1px solid ${TH.border}`,
            fontSize: 11,
            color: TH.dim,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          🔊 音声ファイルを読み込むと同期再生 ・ デモモードで動作中
        </div>
      )}

      <audio ref={audioEl} hidden />
    </div>
  );
}
