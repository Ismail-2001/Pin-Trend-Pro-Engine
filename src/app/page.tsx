"use client";

import { useState, useEffect, useCallback } from "react";
import type { KeywordPackage, BatchRecord, AppSettings, GenerationResult } from "../lib/types";

const DEFAULT_SETTINGS: AppSettings = {
  anthropicApiKey: "",
  blogUrls: [],
  defaultKeywordCount: 60,
  defaultSeasonalCount: 18,
  defaultEvergreenCount: 24,
  defaultTrendingCount: 18,
};

type Page = "dashboard" | "generator" | "results" | "settings";

export default function Home() {
  const [page, setPage] = useState<Page>("dashboard");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [currentKeywords, setCurrentKeywords] = useState<KeywordPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  // Load persisted state
  useEffect(() => {
    try {
      const s = localStorage.getItem("pintrend_settings");
      if (s) setSettings(JSON.parse(s));
      const b = localStorage.getItem("pintrend_batches");
      if (b) setBatches(JSON.parse(b));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem("pintrend_settings", JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem("pintrend_batches", JSON.stringify(batches));
  }, [batches]);

  const showToast = useCallback((msg: string, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleGenerate = async (count: number, seasonal: number, evergreen: number, trending: number) => {
    if (!settings.anthropicApiKey) {
      setError("Add your Anthropic API key in Settings first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count,
          seasonal,
          evergreen,
          trending,
          blogUrls: settings.blogUrls,
          apiKey: settings.anthropicApiKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      const result = data as GenerationResult;
      setCurrentKeywords(result.keywords);
      const batch: BatchRecord = {
        id: `batch_${Date.now()}`,
        timestamp: new Date().toISOString(),
        keyword_count: result.run_metadata.keyword_count,
        seasonal_count: result.run_metadata.seasonal_count,
        evergreen_count: result.run_metadata.evergreen_count,
        trending_count: result.run_metadata.trending_count,
        season_context: result.run_metadata.season_context,
        keywords: result.keywords,
      };
      setBatches(prev => [batch, ...prev]);
      showToast(`Generated ${result.keywords.length} keywords!`);
      setPage("results");
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (keywords: KeywordPackage[]) => {
    const headers = [
      "id",
      "keyword",
      "type",
      "intent",
      "audience_segment",
      "trend_score",
      "competition_level",
      "estimated_monthly_searches",
      "seasonal_window",
      "pin_format",
      "pin_title_en",
      "pin_title_es",
      "pin_description_en",
      "pin_description_es",
      "image_prompt",
      "suggested_blog_index",
      "suggested_blog_reason",
      "monetization_angle",
      "ab_test_title_en",
      "content_hook",
    ];
    const rows = keywords.map(k =>
      headers.map(h => `"${String((k as any)[h] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pintrend_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported!");
  };

  const exportJSON = (keywords: KeywordPackage[]) => {
    const blob = new Blob([JSON.stringify({ keywords }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pintrend_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("JSON exported!");
  };

  return (
    <div className="app-layout">
      <Sidebar
        page={page}
        setPage={setPage}
        batchCount={batches.length}
        keywordCount={batches.reduce((s, b) => s + b.keyword_count, 0)}
      />
      <main className="main-content">
        {page === "dashboard" && (
          <Dashboard
            batches={batches}
            setPage={setPage}
            onLoadBatch={b => {
              setCurrentKeywords(b.keywords);
              setPage("results");
            }}
          />
        )}
        {page === "generator" && (
          <Generator settings={settings} loading={loading} error={error} onGenerate={handleGenerate} />
        )}
        {page === "results" && (
          <Results
            keywords={currentKeywords}
            onExportCSV={exportCSV}
            onExportJSON={exportJSON}
            batches={batches}
            onLoadBatch={b => setCurrentKeywords(b.keywords)}
          />
        )}
        {page === "settings" && (
          <Settings settings={settings} setSettings={setSettings} showToast={showToast} />
        )}
      </main>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

/* ━━━ SIDEBAR ━━━ */
function Sidebar({
  page,
  setPage,
  batchCount,
  keywordCount,
}: {
  page: Page;
  setPage: (p: Page) => void;
  batchCount: number;
  keywordCount: number;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">🌵</div>
          <div className="logo-text">
            <h1>PinTrend Pro</h1>
            <span>Mexican Home Decor</span>
          </div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        {([
          ["dashboard", "📊", "Dashboard"],
          ["generator", "⚡", "Generate Keywords"],
          ["results", "🎯", "Results"],
          ["settings", "⚙️", "Settings"],
        ] as [Page, string, string][]).map(([id, icon, label]) => (
          <button
            key={id}
            className={`nav-link ${page === id ? "active" : ""}`}
            onClick={() => setPage(id)}
          >
            <span className="icon">{icon}</span> {label}
          </button>
        ))}
        <div className="nav-section-label" style={{ marginTop: "auto" }}>
          Stats
        </div>
        <div style={{ padding: "8px 16px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Total Batches</span>
            <span style={{ color: "var(--gold-light)" }}>{batchCount}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Keywords Generated</span>
            <span style={{ color: "var(--terracotta-light)" }}>{keywordCount}</span>
          </div>
        </div>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-version">PinTrend Pro v2.1.0</div>
      </div>
    </aside>
  );
}

/* ━━━ DASHBOARD ━━━ */
function Dashboard({
  batches,
  setPage,
  onLoadBatch,
}: {
  batches: BatchRecord[];
  setPage: (p: Page) => void;
  onLoadBatch: (b: BatchRecord) => void;
}) {
  const totalKw = batches.reduce((s, b) => s + b.keyword_count, 0);
  const totalSeasonal = batches.reduce((s, b) => s + b.seasonal_count, 0);
  const totalEvergreen = batches.reduce((s, b) => s + b.evergreen_count, 0);
  const totalTrending = batches.reduce((s, b) => s + b.trending_count, 0);

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Your Pinterest content intelligence command center</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card gold">
          <div className="stat-label">Total Keywords</div>
          <div className="stat-value">{totalKw}</div>
          <div className="stat-sub">across {batches.length} batches</div>
        </div>
        <div className="stat-card sage">
          <div className="stat-label">Evergreen</div>
          <div className="stat-value">{totalEvergreen}</div>
          <div className="stat-sub">40% target</div>
        </div>
        <div className="stat-card rosa">
          <div className="stat-label">Trending</div>
          <div className="stat-value">{totalTrending}</div>
          <div className="stat-sub">30% target</div>
        </div>
        <div className="stat-card terracotta">
          <div className="stat-label">Seasonal</div>
          <div className="stat-value">{totalSeasonal}</div>
          <div className="stat-sub">30% target</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        <button className="btn btn-primary" onClick={() => setPage("generator")}>
          ⚡ Generate New Batch
        </button>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">📋 Recent Batches</div>
        </div>
        {batches.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🌵</div>
            <h3>No batches yet</h3>
            <p>Generate your first batch of Pinterest keywords to get started.</p>
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Keywords</th>
                <th>Seasonal</th>
                <th>Evergreen</th>
                <th>Trending</th>
                <th>Context</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {batches.slice(0, 10).map(b => (
                <tr key={b.id}>
                  <td>{new Date(b.timestamp).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600, color: "var(--gold-light)" }}>{b.keyword_count}</td>
                  <td>{b.seasonal_count}</td>
                  <td>{b.evergreen_count}</td>
                  <td>{b.trending_count}</td>
                  <td
                    style={{
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {b.season_context}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => onLoadBatch(b)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ━━━ GENERATOR ━━━ */
function Generator({
  settings,
  loading,
  error,
  onGenerate,
}: {
  settings: AppSettings;
  loading: boolean;
  error: string;
  onGenerate: (c: number, s: number, e: number, t: number) => void;
}) {
  const [count, setCount] = useState(settings.defaultKeywordCount);
  const [seasonal, setSeasonal] = useState(settings.defaultSeasonalCount);
  const [evergreen, setEvergreen] = useState(settings.defaultEvergreenCount);
  const [trending, setTrending] = useState(settings.defaultTrendingCount);

  const total = seasonal + evergreen + trending;
  const isValid = total === count && count >= 10 && count <= 70 && !!settings.anthropicApiKey;

  return (
    <>
      <div className="page-header">
        <h2>Generate Keywords</h2>
        <p>AI-powered Pinterest keyword generation with web search intelligence</p>
      </div>
      {!settings.anthropicApiKey && (
        <div className="card" style={{ borderColor: "var(--terracotta)", marginBottom: 24 }}>
          <p style={{ color: "var(--terracotta-light)", fontSize: "0.85rem" }}>
            ⚠️ No API key configured. Go to Settings to add your Anthropic API key.
          </p>
        </div>
      )}
      <div className="card">
        <div className="card-header">
          <div className="card-title">⚡ Batch Configuration</div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Total Keywords</label>
            <input
              type="number"
              className="form-input"
              value={count}
              onChange={e => setCount(+e.target.value)}
              min={10}
              max={70}
            />
            <div className="form-hint">Min 10, Max 70 per batch</div>
          </div>
          <div className="form-group">
            <label className="form-label">Seasonal (30%)</label>
            <input
              type="number"
              className="form-input"
              value={seasonal}
              onChange={e => setSeasonal(+e.target.value)}
              min={0}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Evergreen (40%)</label>
            <input
              type="number"
              className="form-input"
              value={evergreen}
              onChange={e => setEvergreen(+e.target.value)}
              min={0}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Trending (30%)</label>
            <input
              type="number"
              className="form-input"
              value={trending}
              onChange={e => setTrending(+e.target.value)}
              min={0}
            />
          </div>
        </div>
        {total !== count && (
          <p style={{ color: "var(--terracotta-light)", fontSize: "0.8rem", marginBottom: 12 }}>
            ⚠️ Split total ({total}) must equal keyword count ({count})
          </p>
        )}
        {error && (
          <p style={{ color: "var(--terracotta-light)", fontSize: "0.8rem", marginBottom: 12 }}>
            ❌ {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            className="btn btn-primary"
            disabled={!isValid || loading}
            onClick={() => onGenerate(count, seasonal, evergreen, trending)}
          >
            {loading ? "🔄 Generating..." : "🚀 Generate Keywords"}
          </button>
          {loading && (
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              This may take 1-2 minutes with web search...
            </span>
          )}
        </div>
        {loading && (
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: "60%" }} />
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">📝 Current Blog URLs ({settings.blogUrls.length})</div>
        </div>
        {settings.blogUrls.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No blog URLs configured. Add them in Settings for automatic link matching.
          </p>
        ) : (
          <div style={{ maxHeight: 200, overflow: "auto" }}>
            {settings.blogUrls.map((url: string, i: number) => (
              <div
                key={i}
                style={{
                  padding: "6px 0",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span style={{ color: "var(--text-muted)", marginRight: 8 }}>[{i}]</span>
                {url}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ━━━ RESULTS ━━━ */
function Results({
  keywords,
  onExportCSV,
  onExportJSON,
  batches,
  onLoadBatch,
}: {
  keywords: KeywordPackage[];
  onExportCSV: (k: KeywordPackage[]) => void;
  onExportJSON: (k: KeywordPackage[]) => void;
  batches: BatchRecord[];
  onLoadBatch: (b: BatchRecord) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [langTab, setLangTab] = useState<"en" | "es">("en");
  const [selectedBatch, setSelectedBatch] = useState("");

  const filtered = keywords.filter(k => {
    if (filter !== "all" && k.type !== filter) return false;
    if (
      search &&
      !k.keyword.toLowerCase().includes(search.toLowerCase()) &&
      !k.pin_title_en.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <>
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h2>Results</h2>
          <p>{keywords.length} keywords in current view</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {batches.length > 0 && (
            <select
              className="form-input"
              style={{ width: 200, padding: "8px 12px" }}
              value={selectedBatch}
              onChange={e => {
                setSelectedBatch(e.target.value);
                const b = batches.find(b => b.id === e.target.value);
                if (b) onLoadBatch(b);
              }}
            >
              <option value="">Load batch...</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {new Date(b.timestamp).toLocaleDateString()} — {b.keyword_count} kw
                </option>
              ))}
            </select>
          )}
          <div className="tab-switcher">
            <button
              className={`tab-btn ${langTab === "en" ? "active" : ""}`}
              onClick={() => setLangTab("en")}
            >
              🇺🇸 EN
            </button>
            <button
              className={`tab-btn ${langTab === "es" ? "active" : ""}`}
              onClick={() => setLangTab("es")}
            >
              🇲🇽 ES
            </button>
          </div>
          <div className="dropdown">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowExport(!showExport)}>
              📥 Export
            </button>
            {showExport && (
              <div className="dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    onExportCSV(filtered);
                    setShowExport(false);
                  }}
                >
                  📄 Export CSV
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    onExportJSON(filtered);
                    setShowExport(false);
                  }}
                >
                  📋 Export JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="filter-bar">
        {["all", "evergreen", "seasonal", "trending"].map(f => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <input
          className="filter-search"
          placeholder="Search keywords..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {filtered.length} results
        </span>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🌺</div>
          <h3>No keywords found</h3>
          <p>
            {keywords.length === 0
              ? "Generate a batch first or load one from the dropdown."
              : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="keywords-grid">
          {filtered.map(k => (
            <KeywordCard key={k.id} kw={k} lang={langTab} />
          ))}
        </div>
      )}
    </>
  );
}

/* ━━━ KEYWORD CARD ━━━ */
function KeywordCard({ kw, lang }: { kw: KeywordPackage; lang: "en" | "es" }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="keyword-card" onClick={() => setExpanded(!expanded)}>
      <div className="keyword-card-header">
        <span className="keyword-id">{kw.id}</span>
        <div className="trend-score-bar">
          <div className="trend-dots">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`trend-dot ${
                  i < kw.trend_score ? (kw.trend_score >= 8 ? "hot" : "active") : ""
                }`}
              />
            ))}
          </div>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{kw.trend_score}/10</span>
        </div>
      </div>
      <div className="keyword-text">{kw.keyword}</div>
      <div className="keyword-badges">
        <span className={`badge badge-${kw.type}`}>{kw.type}</span>
        <span className="badge badge-intent">{kw.intent}</span>
        <span className={`badge badge-competition-${kw.competition_level}`}>
          {kw.competition_level}
        </span>
        <span className="badge badge-score">{kw.estimated_monthly_searches}</span>
      </div>
      <div className="keyword-section">
        <div className="keyword-section-label">{lang === "en" ? "🇺🇸" : "🇲🇽"} Pin Title</div>
        <div className="keyword-section-value" style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {lang === "en" ? kw.pin_title_en : kw.pin_title_es}
        </div>
      </div>
      <div className="keyword-section">
        <div className="keyword-section-label">Description</div>
        <div className="keyword-section-value">
          {lang === "en" ? kw.pin_description_en : kw.pin_description_es}
        </div>
      </div>
      {kw.content_hook && <div className="keyword-hook">💡 {kw.content_hook}</div>}
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <div className="keyword-section">
            <div className="keyword-section-label">🔄 A/B Test Title</div>
            <div className="keyword-section-value">{kw.ab_test_title_en}</div>
          </div>
          <div className="keyword-section">
            <div className="keyword-section-label">🎨 Image Prompt</div>
            <div className="keyword-section-value" style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
              {kw.image_prompt}
            </div>
          </div>
          <div className="keyword-section">
            <div className="keyword-section-label">🔗 Blog Match</div>
            <div className="keyword-section-value">
              {kw.suggested_blog_index === -1 ? "No match" : `[${kw.suggested_blog_index}]`} —{" "}
              {kw.suggested_blog_reason}
            </div>
          </div>
          <div className="keyword-badges" style={{ marginTop: 8 }}>
            <span className="badge badge-score">📌 {kw.pin_format}</span>
            <span className="badge badge-intent">👤 Segment {kw.audience_segment}</span>
            <span className="badge badge-evergreen">💰 {kw.monetization_angle}</span>
            {kw.seasonal_window && <span className="badge badge-seasonal">📅 {kw.seasonal_window}</span>}
          </div>
        </div>
      )}
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
          {expanded ? "▲ Click to collapse" : "▼ Click to expand"}
        </span>
      </div>
    </div>
  );
}

/* ━━━ SETTINGS ━━━ */
function Settings({
  settings,
  setSettings,
  showToast,
}: {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  showToast: (m: string, t?: string) => void;
}) {
  const [apiKey, setApiKey] = useState(settings.anthropicApiKey);
  const [urlText, setUrlText] = useState(settings.blogUrls.join("\n"));
  const [counts, setCounts] = useState({
    kw: settings.defaultKeywordCount,
    s: settings.defaultSeasonalCount,
    e: settings.defaultEvergreenCount,
    t: settings.defaultTrendingCount,
  });

  const save = () => {
    const urls = urlText
      .split("\n")
      .map(u => u.trim())
      .filter(Boolean);
    setSettings({
      anthropicApiKey: apiKey,
      blogUrls: urls,
      defaultKeywordCount: counts.kw,
      defaultSeasonalCount: counts.s,
      defaultEvergreenCount: counts.e,
      defaultTrendingCount: counts.t,
    });
    showToast("Settings saved!");
  };

  return (
    <>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Configure your PinTrend Pro agent</p>
      </div>
      <div className="settings-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔑 API Configuration</div>
          </div>
          <div className="form-group">
            <label className="form-label">Anthropic API Key</label>
            <input
              type="password"
              className="form-input"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
            />
            <div className="form-hint">
              Required for keyword generation. Uses Claude Sonnet 4 with web search.
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 Default Batch Sizes</div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total</label>
              <input
                type="number"
                className="form-input"
                value={counts.kw}
                onChange={e => setCounts({ ...counts, kw: +e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Seasonal</label>
              <input
                type="number"
                className="form-input"
                value={counts.s}
                onChange={e => setCounts({ ...counts, s: +e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Evergreen</label>
              <input
                type="number"
                className="form-input"
                value={counts.e}
                onChange={e => setCounts({ ...counts, e: +e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Trending</label>
              <input
                type="number"
                className="form-input"
                value={counts.t}
                onChange={e => setCounts({ ...counts, t: +e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="card full-width">
          <div className="card-header">
            <div className="card-title">🔗 Blog URLs</div>
          </div>
          <div className="form-group">
            <label className="form-label">Blog URLs (one per line)</label>
            <textarea
              className="form-textarea"
              value={urlText}
              onChange={e => setUrlText(e.target.value)}
              placeholder={
                "https://yourblog.com/talavera-kitchen-ideas\nhttps://yourblog.com/dia-de-muertos-altar\nhttps://yourblog.com/hacienda-living-room"
              }
              rows={8}
            />
            <div className="form-hint">
              {urlText.split("\n").filter((u: string) => u.trim()).length} URLs configured. These are used for
              automatic blog post matching.
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <button className="btn btn-primary" onClick={save}>
          💾 Save Settings
        </button>
      </div>
    </>
  );
}
