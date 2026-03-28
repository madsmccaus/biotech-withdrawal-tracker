import { useState, useEffect, useCallback, createContext, useContext } from "react";

const OPENFDA_BASE = "https://api.fda.gov/drug/drugsfda.json";

// ─── Theme ──────────────────────────────────────────────────

const themes = {
  dark: {
    bg: "#0b0b12",
    bgSurface: "#10101a",
    bgCard: "#14141f",
    bgCardHover: "#191926",
    bgCardSelected: "#1a1a2e",
    bgInput: "#10101a",
    bgPill: "#1a1a28",
    bgHeader: "#0e0e17",
    border: "#1e1e2e",
    borderLight: "#16161f",
    borderFocus: "#6366f1",
    text: "#d0d0e0",
    textHeading: "#eaeaf4",
    textSecondary: "#8888aa",
    textMuted: "#555570",
    textFaint: "#3a3a50",
    accent: "#6366f1",
    accentSoft: "#818cf8",
    accentBg: "#1c1c38",
    accentBorder: "#2e2e55",
    red: "#f87171",
    redBg: "#2a1215",
    redBorder: "#5c2127",
    amber: "#fbbf24",
    amberBg: "#2a2012",
    amberBorder: "#5c4a21",
    green: "#4ade80",
    greenBg: "#122a15",
    greenBorder: "#215c27",
    blue: "#60a5fa",
    blueBg: "#12222a",
    blueBorder: "#21475c",
    purple: "#a78bfa",
    purpleBg: "#1e1533",
    purpleBorder: "#3b2d63",
    timelineLine: "#1e1e2e",
    timelineDot: "#333355",
    scrollThumb: "#252535",
  },
  light: {
    bg: "#f7f7fa",
    bgSurface: "#ffffff",
    bgCard: "#ffffff",
    bgCardHover: "#f0f0f6",
    bgCardSelected: "#eef0ff",
    bgInput: "#ffffff",
    bgPill: "#f0f0f6",
    bgHeader: "#ffffff",
    border: "#e2e2ec",
    borderLight: "#eeeef4",
    borderFocus: "#6366f1",
    text: "#2e2e3e",
    textHeading: "#111122",
    textSecondary: "#5e5e7a",
    textMuted: "#8888a0",
    textFaint: "#b0b0c0",
    accent: "#6366f1",
    accentSoft: "#818cf8",
    accentBg: "#eef0ff",
    accentBorder: "#c7caff",
    red: "#dc2626",
    redBg: "#fef2f2",
    redBorder: "#fecaca",
    amber: "#d97706",
    amberBg: "#fffbeb",
    amberBorder: "#fde68a",
    green: "#16a34a",
    greenBg: "#f0fdf4",
    greenBorder: "#bbf7d0",
    blue: "#2563eb",
    blueBg: "#eff6ff",
    blueBorder: "#bfdbfe",
    purple: "#7c3aed",
    purpleBg: "#f5f3ff",
    purpleBorder: "#ddd6fe",
    timelineLine: "#e2e2ec",
    timelineDot: "#c0c0d0",
    scrollThumb: "#d0d0dd",
  },
};

const ThemeContext = createContext(themes.dark);

function useTheme() {
  return useContext(ThemeContext);
}

// ─── Utilities ──────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = dateStr.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
  try {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

// ─── Small Components ───────────────────────────────────────

function StatusPill({ status }) {
  const t = useTheme();
  const colorMap = {
    Withdrawn: { bg: t.redBg, border: t.redBorder, text: t.red },
    Discontinued: { bg: t.amberBg, border: t.amberBorder, text: t.amber },
    Prescription: { bg: t.greenBg, border: t.greenBorder, text: t.green },
    "Over-the-counter": { bg: t.blueBg, border: t.blueBorder, text: t.blue },
  };
  const c = colorMap[status] || { bg: t.bgPill, border: t.border, text: t.textSecondary };
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", fontSize: 11, fontWeight: 600,
      letterSpacing: "0.02em", borderRadius: 4, background: c.bg,
      border: `1px solid ${c.border}`, color: c.text,
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    }}>
      {status}
    </span>
  );
}

function Spinner({ message }) {
  const t = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: t.textSecondary, fontSize: 13 }}>
      <div style={{
        width: 14, height: 14, border: `2px solid ${t.border}`,
        borderTopColor: t.textSecondary, borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      {message || "Loading..."}
    </div>
  );
}

function ThemeToggle({ isDark, onToggle }) {
  const t = useTheme();
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 34, height: 34, borderRadius: 8,
        background: t.bgCard, border: `1px solid ${t.border}`,
        cursor: "pointer", color: t.textSecondary, fontSize: 16,
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = t.bgCardHover; e.currentTarget.style.color = t.textHeading; }}
      onMouseLeave={e => { e.currentTarget.style.background = t.bgCard; e.currentTarget.style.color = t.textSecondary; }}
    >
      {isDark ? "☀" : "☾"}
    </button>
  );
}

// ─── Intro / Empty State ────────────────────────────────────

function IntroPanel() {
  const t = useTheme();
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100%", padding: 40,
    }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔬</div>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: t.textHeading, marginBottom: 8, lineHeight: 1.4 }}>
          Select an application to explore
        </h2>
        <p style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
          Click any entry in the list to see its full submission history, sponsor details, active substances, and linked FDA documents.
        </p>
        <div style={{
          padding: 16, borderRadius: 8, background: t.bgCard, border: `1px solid ${t.border}`,
          textAlign: "left", fontSize: 12, color: t.textSecondary, lineHeight: 1.7,
        }}>
          <div style={{ fontWeight: 600, color: t.textHeading, marginBottom: 6, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            How to use this tool
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: t.accent, fontWeight: 600 }}>Withdrawn Products</span> — shows drugs and biologics removed from market
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: t.accent, fontWeight: 600 }}>All Biologics</span> — shows all BLA (Biologics License Application) entries
          </div>
          <div>
            <span style={{ color: t.accent, fontWeight: 600 }}>Search</span> — query any openFDA field (try "gene therapy" or a specific application number)
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Application Card ───────────────────────────────────────

function AppCard({ app, onSelect, isSelected }) {
  const t = useTheme();
  const withdrawn = (app.products || []).filter(p => p.marketing_status === "Withdrawn");
  const sponsor = app.sponsor_name || app.openfda?.manufacturer_name?.[0] || "Unknown sponsor";
  const brand = app.openfda?.brand_name?.[0] || "Unnamed product";
  const generic = app.openfda?.generic_name?.[0] || "";
  const pharmClass = app.openfda?.pharm_class_epc?.[0] || "";
  const isBLA = (app.application_number || "").startsWith("BLA");

  return (
    <div
      onClick={() => onSelect(app)}
      style={{
        padding: "14px 16px",
        background: isSelected ? t.bgCardSelected : "transparent",
        borderBottom: `1px solid ${t.borderLight}`,
        cursor: "pointer",
        transition: "background 0.12s",
        borderLeft: isSelected ? `3px solid ${t.accent}` : "3px solid transparent",
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = t.bgCardHover; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? t.bgCardSelected : "transparent"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.textHeading, lineHeight: 1.3, flex: 1, marginRight: 8 }}>
          {brand}
        </div>
        <span style={{
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
          color: isBLA ? t.purple : t.textMuted,
          background: isBLA ? t.purpleBg : t.bgPill,
          padding: "2px 6px", borderRadius: 3, whiteSpace: "nowrap",
          border: `1px solid ${isBLA ? t.purpleBorder : t.border}`,
        }}>
          {app.application_number}
        </span>
      </div>
      {generic && <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 3 }}>{generic}</div>}
      <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 6 }}>{sponsor}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {withdrawn.length > 0 && <StatusPill status="Withdrawn" />}
        {pharmClass && (
          <span style={{
            fontSize: 10, color: t.textMuted, background: t.bgPill, padding: "2px 6px",
            borderRadius: 3, border: `1px solid ${t.border}`,
          }}>
            {pharmClass.replace(/\s*\[EPC\]\s*/, "")}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Detail Panel ───────────────────────────────────────────

function DetailPanel({ app }) {
  const t = useTheme();

  if (!app) return <IntroPanel />;

  const sponsor = app.sponsor_name || app.openfda?.manufacturer_name?.[0] || "Unknown";
  const brand = app.openfda?.brand_name?.[0] || "Unnamed";
  const generic = app.openfda?.generic_name?.[0] || "—";
  const substances = app.openfda?.substance_name?.join(", ") || "—";
  const pharmClass = app.openfda?.pharm_class_epc?.join(", ") || "—";
  const moa = app.openfda?.pharm_class_moa?.join(", ") || "—";
  const route = app.openfda?.route?.join(", ") || "—";
  const isBLA = (app.application_number || "").startsWith("BLA");

  const sectionStyle = { marginBottom: 24 };
  const labelStyle = {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: t.textMuted,
    textTransform: "uppercase", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace",
  };
  const valueStyle = { fontSize: 13, color: t.text, lineHeight: 1.5 };

  return (
    <div style={{ padding: "28px 32px", overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: t.textHeading, marginBottom: 4, lineHeight: 1.2 }}>
          {brand}
        </div>
        <div style={{ fontSize: 14, color: t.textSecondary, marginBottom: 10 }}>{generic}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{
            fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
            color: isBLA ? t.purple : t.textSecondary,
            background: isBLA ? t.purpleBg : t.bgPill,
            padding: "3px 10px", borderRadius: 5,
            border: `1px solid ${isBLA ? t.purpleBorder : t.border}`,
          }}>
            {app.application_number}
          </span>
          {isBLA && (
            <span style={{
              fontSize: 10, color: t.purple, fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              BIOLOGIC
            </span>
          )}
          {(app.products || []).some(p => p.marketing_status === "Withdrawn") && (
            <StatusPill status="Withdrawn" />
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, ...sectionStyle }}>
        <div>
          <div style={labelStyle}>Sponsor</div>
          <div style={valueStyle}>{sponsor}</div>
        </div>
        <div>
          <div style={labelStyle}>Route</div>
          <div style={{ ...valueStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{route}</div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Active Substances</div>
        <div style={valueStyle}>{substances}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, ...sectionStyle }}>
        <div>
          <div style={labelStyle}>Pharmacologic Class</div>
          <div style={{ ...valueStyle, fontSize: 12 }}>{pharmClass.replace(/\s*\[EPC\]\s*/g, "")}</div>
        </div>
        <div>
          <div style={labelStyle}>Mechanism of Action</div>
          <div style={{ ...valueStyle, fontSize: 12 }}>{moa.replace(/\s*\[MoA\]\s*/g, "")}</div>
        </div>
      </div>

      {/* Products */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Products ({(app.products || []).length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(app.products || []).map((p, i) => (
            <div key={i} style={{
              padding: "10px 14px", borderRadius: 8,
              background: t.bgCard, border: `1px solid ${t.border}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: t.text }}>
                  {(p.active_ingredients || []).map(ai => ai.name).join(", ") || "—"}
                </span>
                <StatusPill status={p.marketing_status} />
              </div>
              <div style={{ fontSize: 11, color: t.textMuted }}>
                {p.dosage_form}{p.route ? ` — ${p.route}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submissions Timeline */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Submission History ({(app.submissions || []).length})</div>
        <div style={{ position: "relative", paddingLeft: 20 }}>
          <div style={{
            position: "absolute", left: 7, top: 6, bottom: 6,
            width: 2, background: t.timelineLine, borderRadius: 1,
          }} />
          {(app.submissions || []).slice(0, 20).map((s, i) => (
            <div key={i} style={{ position: "relative", paddingBottom: 14, paddingLeft: 18 }}>
              <div style={{
                position: "absolute", left: -14, top: 6,
                width: 10, height: 10, borderRadius: "50%",
                background: s.submission_status === "AP" ? t.green : t.timelineDot,
                border: `2px solid ${t.bg}`,
              }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{
                    fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                    color: t.textSecondary, marginRight: 8, fontWeight: 500,
                  }}>
                    {s.submission_type}{s.submission_number}
                  </span>
                  <span style={{ fontSize: 11, color: t.textMuted }}>
                    {s.submission_class_code_description || ""}
                  </span>
                </div>
                <span style={{
                  fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  color: t.textFaint, whiteSpace: "nowrap", marginLeft: 12,
                }}>
                  {formatDate(s.submission_status_date)}
                </span>
              </div>
              {s.submission_status && (
                <div style={{
                  fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  color: s.submission_status === "AP" ? t.green : t.textMuted,
                  marginTop: 2,
                }}>
                  {s.submission_status}
                </div>
              )}
              {s.submission_public_notes && (
                <div style={{
                  fontSize: 11, color: t.red, marginTop: 6,
                  padding: "6px 10px", background: t.redBg, borderRadius: 6,
                  border: `1px solid ${t.redBorder}`, lineHeight: 1.5,
                }}>
                  {s.submission_public_notes}
                </div>
              )}
              {(s.application_docs || []).length > 0 && (
                <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {s.application_docs.map((d, di) => (
                    <a
                      key={di}
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 11, color: t.accent, textDecoration: "none",
                        padding: "3px 8px", borderRadius: 4,
                        background: t.accentBg, border: `1px solid ${t.accentBorder}`,
                        fontFamily: "'JetBrains Mono', monospace",
                        transition: "opacity 0.12s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      ↗ {d.title || d.type}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────

export default function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("withdrawn");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState(null);
  const [totalHits, setTotalHits] = useState(0);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bwt-theme");
      if (saved) return saved === "dark";
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches !== false;
    }
    return true;
  });

  const t = isDark ? themes.dark : themes.light;

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem("bwt-theme", next ? "dark" : "light");
      return next;
    });
  };

  const fetchData = useCallback(async (query) => {
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      let url;
      if (query === "__withdrawn__") {
        url = `${OPENFDA_BASE}?search=products.marketing_status:"Withdrawn"&limit=99`;
      } else if (query === "__bla__") {
        url = `${OPENFDA_BASE}?search=application_number:BLA*&limit=99`;
      } else {
        url = `${OPENFDA_BASE}?search=${encodeURIComponent(query)}&limit=99`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      setApplications(data.results || []);
      setTotalHits(data.meta?.results?.total || 0);
    } catch (e) {
      setError(e.message);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function getStats() {
      try {
        const res = await fetch(`${OPENFDA_BASE}?count=products.marketing_status.exact&limit=10`);
        const data = await res.json();
        setStats({ marketingStatuses: data.results || [] });
      } catch {}
    }
    getStats();
    fetchData("__withdrawn__");
  }, [fetchData]);

  const handleFilterChange = (f) => {
    setFilter(f);
    if (f === "withdrawn") fetchData("__withdrawn__");
    else if (f === "all_bla") fetchData("__bla__");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setFilter("search");
      fetchData(searchQuery.trim());
    }
  };

  const filterButtons = [
    { key: "withdrawn", label: "Withdrawn Products" },
    { key: "all_bla", label: "All Biologics" },
  ];

  return (
    <ThemeContext.Provider value={t}>
      <div style={{
        width: "100%", height: "100vh", background: t.bg, color: t.text,
        fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
        display: "flex", flexDirection: "column", overflow: "hidden",
        transition: "background 0.2s, color 0.2s",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
          @keyframes spin { to { transform: rotate(360deg) } }
          * { box-sizing: border-box; }
          ::placeholder { color: ${t.textFaint}; }
          ::-webkit-scrollbar { width: 7px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: ${t.textMuted}; }
        `}</style>

        {/* ── Header ── */}
        <div style={{
          padding: "14px 24px",
          borderBottom: `1px solid ${t.border}`,
          background: t.bgHeader,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18 }}>🔬</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.textHeading, letterSpacing: "-0.01em" }}>
                Biotech Withdrawal Tracker
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>
                Exploring withdrawn drug and biologic applications via openFDA
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                  fontSize: 13, color: t.textFaint, pointerEvents: "none",
                }}>⌕</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='Search (e.g. "gene therapy", BLA125353)'
                  style={{
                    width: 290, padding: "8px 12px 8px 30px", fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    background: t.bgInput, border: `1px solid ${t.border}`,
                    borderRadius: 8, color: t.text, outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => e.target.style.borderColor = t.borderFocus}
                  onBlur={e => e.target.style.borderColor = t.border}
                />
              </div>
              <button type="submit" style={{
                padding: "8px 16px", fontSize: 12, fontWeight: 600,
                background: t.accent, color: "#fff", border: "none",
                borderRadius: 8, cursor: "pointer", transition: "opacity 0.12s",
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Search
              </button>
            </form>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div style={{
          padding: "10px 24px",
          borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, background: t.bgSurface,
        }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: t.textMuted, marginRight: 4, fontWeight: 500 }}>View:</span>
            {filterButtons.map(f => (
              <button
                key={f.key}
                onClick={() => handleFilterChange(f.key)}
                style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 500,
                  background: filter === f.key ? t.accentBg : "transparent",
                  color: filter === f.key ? t.accentSoft : t.textMuted,
                  border: `1px solid ${filter === f.key ? t.accentBorder : "transparent"}`,
                  borderRadius: 6, cursor: "pointer", transition: "all 0.12s",
                }}
                onMouseEnter={e => { if (filter !== f.key) e.currentTarget.style.background = t.bgCardHover; }}
                onMouseLeave={e => { if (filter !== f.key) e.currentTarget.style.background = "transparent"; }}
              >
                {f.label}
              </button>
            ))}
            {filter === "search" && (
              <span style={{
                padding: "6px 14px", fontSize: 11, fontWeight: 500,
                background: t.accentBg, color: t.accentSoft,
                border: `1px solid ${t.accentBorder}`, borderRadius: 6,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                "{searchQuery}"
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {totalHits > 0 && (
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: t.textMuted }}>
                {totalHits.toLocaleString()} results
              </span>
            )}
            {stats?.marketingStatuses && (
              <span style={{
                fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: t.textFaint,
              }}>
                {stats.marketingStatuses.find(s => s.term === "Withdrawn")?.count.toLocaleString() || "?"} withdrawn across all FDA products
              </span>
            )}
          </div>
        </div>

        {/* ── Main Content ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* List */}
          <div style={{
            width: 380, flexShrink: 0,
            borderRight: `1px solid ${t.border}`,
            overflowY: "auto", background: t.bgSurface,
          }}>
            {loading && (
              <div style={{ padding: 24 }}>
                <Spinner message="Querying openFDA..." />
              </div>
            )}
            {error && (
              <div style={{ padding: 24, fontSize: 13, color: t.red, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Something went wrong</div>
                <div style={{ fontSize: 12, color: t.textMuted }}>{error}</div>
                <button
                  onClick={() => fetchData("__withdrawn__")}
                  style={{
                    marginTop: 12, padding: "6px 14px", fontSize: 12, fontWeight: 500,
                    background: t.bgCard, border: `1px solid ${t.border}`,
                    borderRadius: 6, cursor: "pointer", color: t.text,
                  }}
                >
                  Try again
                </button>
              </div>
            )}
            {!loading && !error && applications.length === 0 && (
              <div style={{ padding: 24, fontSize: 13, color: t.textMuted, lineHeight: 1.6 }}>
                No results found. Try a different search term or filter.
              </div>
            )}
            {!loading && applications.map((app, i) => (
              <AppCard
                key={app.application_number + i}
                app={app}
                onSelect={setSelected}
                isSelected={selected?.application_number === app.application_number}
              />
            ))}
          </div>

          {/* Detail */}
          <div style={{ flex: 1, overflow: "hidden", background: t.bg }}>
            <DetailPanel app={selected} />
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "8px 24px",
          borderTop: `1px solid ${t.border}`,
          background: t.bgSurface,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, color: t.textFaint }}>
            Data from openFDA · Not for clinical or production use
          </span>
          <a
            href="https://open.fda.gov/apis/drug/drugsfda/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 10, color: t.textFaint, textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.color = t.accent}
            onMouseLeave={e => e.currentTarget.style.color = t.textFaint}
          >
            openFDA API docs ↗
          </a>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
