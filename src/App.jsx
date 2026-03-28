import { useState, useEffect, useCallback } from "react";

const OPENFDA_BASE = "https://api.fda.gov/drug/drugsfda.json";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = dateStr.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
  try {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function StatusPill({ status }) {
  const colors = {
    Withdrawn: { bg: "#2a1215", border: "#5c2127", text: "#f5a3a3" },
    Discontinued: { bg: "#2a2012", border: "#5c4a21", text: "#f5d8a3" },
    Prescription: { bg: "#122a15", border: "#215c27", text: "#a3f5b0" },
    "Over-the-counter": { bg: "#12222a", border: "#21475c", text: "#a3daf5" },
  };
  const c = colors[status] || { bg: "#1e1e2e", border: "#3e3e5e", text: "#c0c0d0" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.03em",
      borderRadius: 4,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    }}>
      {status}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#8888aa", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
      <div style={{
        width: 14, height: 14,
        border: "2px solid #333",
        borderTopColor: "#8888aa",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      Querying openFDA...
    </div>
  );
}

function AppCard({ app, onSelect, isSelected }) {
  const withdrawn = (app.products || []).filter(p => p.marketing_status === "Withdrawn");
  const sponsor = app.sponsor_name || app.openfda?.manufacturer_name?.[0] || "Unknown sponsor";
  const brand = app.openfda?.brand_name?.[0] || "Unnamed product";
  const generic = app.openfda?.generic_name?.[0] || "";
  const pharmClass = app.openfda?.pharm_class_epc?.[0] || "";
  const isBLA = (app.application_number || "").startsWith("BLA");
  const latestSub = app.submissions?.[0];

  return (
    <div
      onClick={() => onSelect(app)}
      style={{
        padding: "14px 16px",
        background: isSelected ? "#1a1a2e" : "transparent",
        borderBottom: "1px solid #1a1a2a",
        cursor: "pointer",
        transition: "background 0.15s",
        borderLeft: isSelected ? "3px solid #6366f1" : "3px solid transparent",
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#111122"; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e0e0f0", lineHeight: 1.3, flex: 1, marginRight: 8 }}>
          {brand}
        </div>
        <span style={{
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          color: isBLA ? "#a78bfa" : "#6b7280",
          background: isBLA ? "#1e1533" : "#161620",
          padding: "2px 6px",
          borderRadius: 3,
          whiteSpace: "nowrap",
          border: `1px solid ${isBLA ? "#3b2d63" : "#252530"}`,
        }}>
          {app.application_number}
        </span>
      </div>
      {generic && <div style={{ fontSize: 11, color: "#7777aa", marginBottom: 4 }}>{generic}</div>}
      <div style={{ fontSize: 11, color: "#555577", marginBottom: 6 }}>{sponsor}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {withdrawn.length > 0 && <StatusPill status="Withdrawn" />}
        {pharmClass && (
          <span style={{
            fontSize: 10, color: "#555577", background: "#0e0e18", padding: "2px 6px",
            borderRadius: 3, border: "1px solid #1e1e2e",
          }}>
            {pharmClass.replace(/\s*\[EPC\]\s*/, "")}
          </span>
        )}
      </div>
    </div>
  );
}

function DetailPanel({ app }) {
  if (!app) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100%", color: "#444466", fontSize: 13,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        Select an application to inspect
      </div>
    );
  }

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
    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#555577",
    textTransform: "uppercase", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace",
  };
  const valueStyle = { fontSize: 13, color: "#c0c0e0", lineHeight: 1.5 };
  const monoStyle = { ...valueStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 };

  return (
    <div style={{ padding: 24, overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#e8e8f8", marginBottom: 4, lineHeight: 1.2 }}>
          {brand}
        </div>
        <div style={{ fontSize: 13, color: "#7777aa" }}>{generic}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <span style={{
            fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
            color: isBLA ? "#a78bfa" : "#8888aa",
            background: isBLA ? "#1e1533" : "#141420",
            padding: "3px 8px", borderRadius: 4,
            border: `1px solid ${isBLA ? "#3b2d63" : "#252535"}`,
          }}>
            {app.application_number}
          </span>
          {isBLA && (
            <span style={{
              fontSize: 10, color: "#a78bfa", fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              BIOLOGIC
            </span>
          )}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Sponsor</div>
        <div style={valueStyle}>{sponsor}</div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Active Substances</div>
        <div style={valueStyle}>{substances}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, ...sectionStyle }}>
        <div>
          <div style={labelStyle}>Pharmacologic Class</div>
          <div style={{ ...valueStyle, fontSize: 12 }}>{pharmClass.replace(/\s*\[EPC\]\s*/g, "")}</div>
        </div>
        <div>
          <div style={labelStyle}>Mechanism of Action</div>
          <div style={{ ...valueStyle, fontSize: 12 }}>{moa.replace(/\s*\[MoA\]\s*/g, "")}</div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Route</div>
        <div style={monoStyle}>{route}</div>
      </div>

      {/* Products */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Products ({(app.products || []).length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(app.products || []).map((p, i) => (
            <div key={i} style={{
              padding: "10px 12px", borderRadius: 6,
              background: "#0c0c16", border: "1px solid #1e1e2e",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#b0b0cc" }}>
                  {(p.active_ingredients || []).map(i => i.name).join(", ") || "—"}
                </span>
                <StatusPill status={p.marketing_status} />
              </div>
              <div style={{ fontSize: 11, color: "#555577" }}>
                {p.dosage_form} — {(p.route || "").toString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submissions Timeline */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Submission History ({(app.submissions || []).length})</div>
        <div style={{ position: "relative", paddingLeft: 16 }}>
          <div style={{
            position: "absolute", left: 5, top: 4, bottom: 4,
            width: 1, background: "#1e1e2e",
          }} />
          {(app.submissions || []).slice(0, 15).map((s, i) => (
            <div key={i} style={{ position: "relative", paddingBottom: 12, paddingLeft: 16 }}>
              <div style={{
                position: "absolute", left: -14, top: 5,
                width: 9, height: 9, borderRadius: "50%",
                background: s.submission_status === "AP" ? "#22c55e" : "#333355",
                border: "2px solid #0a0a14",
              }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{
                    fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                    color: "#8888aa", marginRight: 8,
                  }}>
                    {s.submission_type}{s.submission_number}
                  </span>
                  <span style={{ fontSize: 11, color: "#555577" }}>
                    {s.submission_class_code_description || ""}
                  </span>
                </div>
                <span style={{
                  fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  color: "#444466", whiteSpace: "nowrap",
                }}>
                  {formatDate(s.submission_status_date)}
                </span>
              </div>
              {s.submission_status && (
                <div style={{
                  fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  color: s.submission_status === "AP" ? "#4ade80" : "#6b7280",
                  marginTop: 2,
                }}>
                  {s.submission_status}
                </div>
              )}
              {s.submission_public_notes && (
                <div style={{
                  fontSize: 11, color: "#f5a3a3", marginTop: 4,
                  padding: "4px 8px", background: "#1a1215", borderRadius: 4,
                  border: "1px solid #2a1a20",
                }}>
                  {s.submission_public_notes}
                </div>
              )}
              {(s.application_docs || []).length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {s.application_docs.map((d, di) => (
                    <a
                      key={di}
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block", fontSize: 10, color: "#6366f1",
                        textDecoration: "none", marginRight: 8,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      📄 {d.title || d.type}
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

export default function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("withdrawn"); // withdrawn | all_bla | search
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState(null);
  const [totalHits, setTotalHits] = useState(0);

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

  // Fetch status distribution on mount
  useEffect(() => {
    async function getStats() {
      try {
        const [statusRes, marketingRes] = await Promise.all([
          fetch(`${OPENFDA_BASE}?count=submissions.submission_status.exact&limit=20`),
          fetch(`${OPENFDA_BASE}?count=products.marketing_status.exact&limit=10`),
        ]);
        const statusData = await statusRes.json();
        const marketingData = await marketingRes.json();
        setStats({
          submissionStatuses: statusData.results || [],
          marketingStatuses: marketingData.results || [],
        });
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

  const withdrawnBLAs = applications.filter(
    a => (a.application_number || "").startsWith("BLA") &&
    (a.products || []).some(p => p.marketing_status === "Withdrawn")
  );

  return (
    <div style={{
      width: "100%", height: "100vh",
      background: "#08080f",
      color: "#c0c0d0",
      fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #222233; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #141420",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#e8e8f8", letterSpacing: "-0.02em" }}>
              Biotech Withdrawal Tracker
            </span>
            <span style={{
              fontSize: 9, fontWeight: 600, letterSpacing: "0.1em",
              color: "#6366f1", background: "#16162e",
              padding: "3px 8px", borderRadius: 4,
              fontFamily: "'JetBrains Mono', monospace",
              border: "1px solid #252550",
            }}>
              FDA · openFDA
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#444466", marginTop: 3 }}>
            Drug and biologic applications with withdrawn products
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search openFDA (e.g. gene therapy, BLA125353)"
            style={{
              width: 300, padding: "7px 12px", fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              background: "#0c0c16", border: "1px solid #1e1e2e",
              borderRadius: 6, color: "#c0c0d0", outline: "none",
            }}
            onFocus={e => e.target.style.borderColor = "#6366f1"}
            onBlur={e => e.target.style.borderColor = "#1e1e2e"}
          />
          <button
            type="submit"
            style={{
              padding: "7px 14px", fontSize: 12, fontWeight: 600,
              background: "#6366f1", color: "#fff", border: "none",
              borderRadius: 6, cursor: "pointer",
              fontFamily: "'Instrument Sans', sans-serif",
            }}
          >
            Query
          </button>
        </form>
      </div>

      {/* Filters + Stats Bar */}
      <div style={{
        padding: "10px 20px",
        borderBottom: "1px solid #141420",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        background: "#0a0a14",
      }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { key: "withdrawn", label: "Withdrawn Products" },
            { key: "all_bla", label: "All Biologics (BLAs)" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              style={{
                padding: "5px 12px", fontSize: 11, fontWeight: 600,
                background: filter === f.key ? "#1a1a30" : "transparent",
                color: filter === f.key ? "#a5b4fc" : "#555577",
                border: `1px solid ${filter === f.key ? "#2e2e55" : "transparent"}`,
                borderRadius: 5, cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
          {filter === "search" && (
            <span style={{
              padding: "5px 12px", fontSize: 11, fontWeight: 600,
              background: "#1a1a30", color: "#a5b4fc",
              border: "1px solid #2e2e55", borderRadius: 5,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Search: "{searchQuery}"
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {stats?.marketingStatuses && (
            <div style={{ display: "flex", gap: 10 }}>
              {stats.marketingStatuses.slice(0, 5).map(s => (
                <span key={s.term} style={{
                  fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  color: s.term === "Withdrawn" ? "#f5a3a3" : "#444466",
                }}>
                  {s.term}: {s.count.toLocaleString()}
                </span>
              ))}
            </div>
          )}
          {totalHits > 0 && (
            <span style={{
              fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#555577",
            }}>
              {totalHits.toLocaleString()} total matches
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Application List */}
        <div style={{
          width: 380, flexShrink: 0,
          borderRight: "1px solid #141420",
          overflowY: "auto",
        }}>
          {loading && (
            <div style={{ padding: 20 }}><Spinner /></div>
          )}
          {error && (
            <div style={{
              padding: 20, fontSize: 12, color: "#f5a3a3",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Error: {error}
            </div>
          )}
          {!loading && !error && applications.length === 0 && (
            <div style={{ padding: 20, fontSize: 12, color: "#444466" }}>
              No results found.
            </div>
          )}
          {applications.map((app, i) => (
            <AppCard
              key={app.application_number + i}
              app={app}
              onSelect={setSelected}
              isSelected={selected?.application_number === app.application_number}
            />
          ))}
        </div>

        {/* Detail Panel */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <DetailPanel app={selected} />
        </div>
      </div>
    </div>
  );
}
