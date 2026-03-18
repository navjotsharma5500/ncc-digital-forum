/* eslint-disable no-restricted-globals */
import { useState, useEffect } from "react";

// ─── API BASE URL ─────────────────────────────────────────────────────────────
// Development:  http://localhost:5000/api
// Production:   set REACT_APP_API_URL in frontend/.env
const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ─── API HELPERS ──────────────────────────────────────────────────────────────
const apiFetch = async (path, method = "GET", body = null) => {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
};
const apiGet    = (path)       => apiFetch(path);
const apiPost   = (path, body) => apiFetch(path, "POST",   body);
const apiPut    = (path, body) => apiFetch(path, "PUT",    body);
const apiDelete = (path)       => apiFetch(path, "DELETE");

// MongoDB returns _id — normalise to id throughout the app
const norm    = (item) => item ? { ...item, id: item._id || item.id } : item;
const normArr = (arr)  => Array.isArray(arr) ? arr.map(norm) : [];

// ─── DEFAULT DATA (while loading / API offline fallback) ──────────────────────
const defaultData = {
  stats:      { visitors: 0, activeCadets: 0, registeredCadets: 0 },
  nccLogo: "", thaparLogo: "",
  backLink:   "https://www.thapar.edu/students",
  heroImage:  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/NCC_parade.jpg/1200px-NCC_parade.jpg",
  aim: {
    title: "Aim Of the NCC Digital Forum",
    desc1: "NCC Digital Forum is a platform for Cadets to share their experiences and values imbibed while undergoing NCC Training.",
    desc2: "The forum provides for an unprecedented exchange of experiences amongst 15 Lac NCC Cadets across the country.",
  },
  news: [], events: [], categories: [], albums: [], alumni: [], archives: [], registrations: [],
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const icons = {
    edit:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    plus:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    close:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    logout: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    img:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  };
  return icons[name] || null;
};

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
const inp = { width: "100%", padding: "10px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 14, marginBottom: 10, boxSizing: "border-box", fontFamily: "inherit" };
const btn = (bg, color = "#fff") => ({ background: bg, color, border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontSize: 14, fontWeight: 600 });

function Field({ label, value, onChange, type = "text", rows }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>{label}</label>
      {rows
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} style={{ ...inp, resize: "vertical" }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inp} />}
    </div>
  );
}
function EditBtn({ onClick, label = "Edit" }) {
  return (
    <button onClick={onClick} style={{ position: "absolute", top: 8, right: 8, background: "#1a73e8", color: "#fff", border: "none", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", zIndex: 10, display: "flex", alignItems: "center", gap: 4 }}>
      <Icon name="edit" size={11} color="#fff" /> {label}
    </button>
  );
}
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: wide ? 700 : 480, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem 1.5rem", borderBottom: "1px solid #eee" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8 }}><Icon name="close" size={20} /></button>
        </div>
        <div style={{ padding: "1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}
function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 20 }}>
      <div style={{ width: 52, height: 52, border: "5px solid #e8eaed", borderTop: "5px solid #1a1a6e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#888", fontSize: 15 }}>Loading NCC Digital Forum...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [data, setData]       = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView]       = useState("home");
  const [viewParam, setViewParam] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [stats, content, news, events, categories, albums, alumni, archives] = await Promise.all([
          apiGet("/stats"), apiGet("/content"), apiGet("/news"), apiGet("/events"),
          apiGet("/categories"), apiGet("/albums"), apiGet("/alumni"), apiGet("/archives"),
        ]);
        setData({
          stats:      norm(stats) || defaultData.stats,
          nccLogo:    content?.nccLogo    || "",
          thaparLogo: content?.thaparLogo || "",
          backLink:   content?.backLink   || "https://www.thapar.edu/students",
          heroImage:  content?.heroImage  || defaultData.heroImage,
          aim: {
            title: content?.aimTitle || defaultData.aim.title,
            desc1: content?.aimDesc1 || defaultData.aim.desc1,
            desc2: content?.aimDesc2 || defaultData.aim.desc2,
          },
          news: normArr(news), events: normArr(events), categories: normArr(categories),
          albums: normArr(albums), alumni: normArr(alumni), archives: normArr(archives),
          registrations: [],
        });
        apiPost("/stats/increment-visitor").catch(() => {});
      } catch (e) { console.error("API load failed:", e); }
      finally     { setLoading(false); }
    })();
  }, []);

  const update = (key, val) => setData(d => ({ ...d, [key]: val }));

  if (loading) return <Spinner />;
  if (view === "admin")    return <AdminPanel   data={data} update={update} setData={setData} onLogout={() => { setIsAdmin(false); setView("home"); }} />;
  if (view === "login")    return <LoginPage    onLogin={() => { setIsAdmin(true); setView("admin"); }} onBack={() => setView("home")} />;
  if (view === "category") return <CategoryPage catId={viewParam} data={data} update={update} onBack={() => setView("home")} isAdmin={isAdmin} />;
  if (view === "alumni")   return <AlumniPage   data={data} update={update} onBack={() => setView("home")} isAdmin={isAdmin} />;
  if (view === "archives") return <ArchivesPage data={data} update={update} onBack={() => setView("home")} isAdmin={isAdmin} />;

  return (
    <MainPage data={data} update={update} isAdmin={isAdmin}
      onAdminLogin={() => setView("login")}
      onCategoryClick={id => { setViewParam(id); setView("category"); }}
      onAlumni={() => setView("alumni")} onArchives={() => setView("archives")}
      searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin, onBack }) {
  const [pw, setPw]     = useState("");
  const [err, setErr]   = useState("");
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true); setErr("");
    try {
      const r = await apiPost("/admin/login", { password: pw });
      if (r.success) onLogin(); else setErr("Incorrect password.");
    } catch { setErr("Incorrect password."); }
    finally { setBusy(false); }
  };
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f2027,#203a43,#2c5364)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "2.5rem", width: 380, boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 64, height: 64, background: "#1a1a6e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: 28 }}>🎖️</div>
          <h2 style={{ margin: 0, color: "#1a1a6e", fontSize: 22, fontWeight: 800 }}>Admin Login</h2>
          <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>NCC Digital Forum Control Panel</p>
        </div>
        <Field label="Admin Password" value={pw} onChange={setPw} type="password" />
        {err && <p style={{ color: "#e53e3e", fontSize: 13, marginBottom: 8 }}>{err}</p>}
        <button onClick={handle} disabled={busy} style={{ ...btn("#1a1a6e"), width: "100%", padding: "12px", fontSize: 15, borderRadius: 10, marginBottom: 10, opacity: busy ? 0.7 : 1 }}>
          {busy ? "Verifying..." : "Login to Admin Panel"}
        </button>
        <button onClick={onBack} style={{ ...btn("transparent", "#666"), width: "100%", border: "1.5px solid #ddd", padding: "12px", fontSize: 14, borderRadius: 10 }}>← Back to Website</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function MainPage({ data, update, isAdmin, onAdminLogin, onCategoryClick, onAlumni, onArchives, searchQuery, setSearchQuery }) {
  const [showReg,   setShowReg]   = useState(false);
  const [showNews,  setShowNews]  = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [editSec,   setEditSec]   = useState(null);

  return (
    <div style={{ fontFamily: "'Segoe UI',sans-serif", minHeight: "100vh", background: "#f8f9fa" }}>

      {/* HEADER */}
      <header style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {data.nccLogo
              ? <img src={data.nccLogo} alt="NCC" style={{ width: 52, height: 52, objectFit: "contain", borderRadius: "50%" }} onError={e => e.target.style.display="none"} />
              : <div style={{ width: 52, height: 52, background: "linear-gradient(135deg,#1a1a6e,#c41e3a)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 14 }}>NCC</div>}
            <div>
              <div style={{ fontWeight: 900, fontSize: 20, color: "#1a1a6e", letterSpacing: 2 }}>NCC</div>
              <div style={{ fontSize: 9, color: "#c41e3a", fontWeight: 700, letterSpacing: 1 }}>NATIONAL CADET CORPS</div>
            </div>
          </div>
          <a href={data.backLink || "https://www.thapar.edu/students"} target="_blank" rel="noopener noreferrer"
            style={{ background: "#1a1a6e", color: "#fff", padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
            ← Back to Main Website
          </a>
          <div style={{ display: "flex", alignItems: "center", background: "#f1f3f4", borderRadius: 24, padding: "8px 16px", flex: 1, maxWidth: 320, gap: 8 }}>
            <Icon name="search" size={16} color="#666" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search NCC Forum..." style={{ border: "none", background: "none", outline: "none", fontSize: 14, color: "#333", width: "100%" }} />
          </div>
          <div style={{ marginLeft: "auto" }}>
            {data.thaparLogo
              ? <img src={data.thaparLogo} alt="Thapar" style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 8 }} onError={e => e.target.style.display="none"} />
              : <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#b22222,#8b0000)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 11, textAlign: "center", lineHeight: 1.2 }}>THAPAR<br/>UNIV</div>}
          </div>
          {!isAdmin
            ? <button onClick={onAdminLogin} style={{ ...btn("#e8f0fe","#1a73e8"), fontSize: 12, padding: "7px 14px", borderRadius: 20 }}>🔐 Admin</button>
            : <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✅ Admin Mode ON</div>}
        </div>
      </header>

      {/* HERO */}
      <div style={{ position: "relative" }}>
        <img src={data.heroImage} alt="NCC" style={{ width: "100%", height: 480, objectFit: "cover", display: "block" }}
          onError={e => e.target.src="https://placehold.co/1200x480/1a1a6e/white?text=NCC+Digital+Forum"} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 60%,rgba(0,0,0,0.4))" }} />
        {isAdmin && (
          <button onClick={() => setEditSec("hero")} style={{ position: "absolute", top: 12, left: 12, ...btn("#1a73e8"), borderRadius: 20, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="img" size={13} color="#fff" /> Change Hero Image
          </button>
        )}
      </div>

      {/* STATS */}
      <div style={{ background: "#1a1a6e" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, textAlign: "center" }}>
          <div style={{ position: "relative", padding: "10px 0" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#00d4ff" }}>{(data.stats.visitors||0).toLocaleString()}</div>
            <div style={{ fontSize: 13, color: "#aad4ff", fontWeight: 600, letterSpacing: 1 }}>VISITOR No.</div>
            {isAdmin && <EditBtn onClick={() => setEditSec("visitors")} label="Edit" />}
          </div>
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.2)", borderRight: "1px solid rgba(255,255,255,0.2)", position: "relative", padding: "10px 0" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#ff6b6b" }}>{(data.stats.activeCadets||0).toLocaleString()}</div>
            <div style={{ fontSize: 13, color: "#ffaaa5", fontWeight: 600, letterSpacing: 1 }}>ACTIVE CADET</div>
            {isAdmin && <EditBtn onClick={() => setEditSec("activeCadets")} label="Edit" />}
          </div>
          <div style={{ position: "relative", padding: "10px 0" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#ffd700" }}>{(data.stats.registeredCadets||0).toLocaleString()}</div>
            <div style={{ fontSize: 13, color: "#ffe88a", fontWeight: 600, letterSpacing: 1 }}>CADET'S REGISTERED</div>
            <button onClick={() => setShowReg(true)} style={{ marginTop: 8, background: "#ffd700", color: "#1a1a6e", border: "none", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>📝 Registration</button>
            {isAdmin && <EditBtn onClick={() => setEditSec("registeredCadets")} label="Edit" />}
          </div>
        </div>
      </div>

      {/* AIM */}
      <div style={{ background: "#1a1a6e", paddingBottom: 40 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 20px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 4, height: 36, background: "#ffd700", borderRadius: 2 }} />
            <h2 style={{ color: "#fff", margin: 0, fontSize: 28, fontWeight: 800 }}>{data.aim.title}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <p style={{ color: "#c8d6e5", fontSize: 15, lineHeight: 1.8, margin: 0 }}>{data.aim.desc1}</p>
            <p style={{ color: "#c8d6e5", fontSize: 15, lineHeight: 1.8, margin: 0 }}>{data.aim.desc2}</p>
          </div>
          {isAdmin && <EditBtn onClick={() => setEditSec("aim")} label="Edit Aim" />}
        </div>
      </div>

      {/* NEWS & EVENTS */}
      <div style={{ background: "#fff", padding: "50px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 4, height: 28, background: "#c41e3a", borderRadius: 2 }} />
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a6e" }}>📰 News Corner</h3>
              </div>
              {isAdmin && <button onClick={() => setShowNews(true)} style={{ ...btn("#1a73e8"), fontSize: 12, borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}><Icon name="plus" size={12} color="#fff" /> Add News</button>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.news.map(n => (
                <NewsCard key={n.id} item={n} isAdmin={isAdmin}
                  onDelete={async id => { await apiDelete(`/news/${id}`); update("news", data.news.filter(x => x.id !== id)); }}
                  onEdit={async item => { const u = norm(await apiPut(`/news/${item.id}`, item)); update("news", data.news.map(x => x.id === u.id ? u : x)); }} />
              ))}
              {data.news.length === 0 && <p style={{ color: "#aaa", fontSize: 14 }}>No news yet.</p>}
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 4, height: 28, background: "#1a73e8", borderRadius: 2 }} />
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a6e" }}>📅 Event Corner</h3>
              </div>
              {isAdmin && <button onClick={() => setShowEvent(true)} style={{ ...btn("#1a73e8"), fontSize: 12, borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}><Icon name="plus" size={12} color="#fff" /> Add Event</button>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.events.map(e => (
                <EventCard key={e.id} item={e} isAdmin={isAdmin}
                  onDelete={async id => { await apiDelete(`/events/${id}`); update("events", data.events.filter(x => x.id !== id)); }}
                  onEdit={async item => { const u = norm(await apiPut(`/events/${item.id}`, item)); update("events", data.events.map(x => x.id === u.id ? u : x)); }} />
              ))}
              {data.events.length === 0 && <p style={{ color: "#aaa", fontSize: 14 }}>No events yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* CADET CORNER */}
      <CadetCorner data={data} update={update} isAdmin={isAdmin} onCategoryClick={onCategoryClick} />

      {/* NCC FOR STATUES */}
      <div style={{ background: "#0096c7", padding: "60px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 40 }}>
            <div style={{ width: 4, height: 32, background: "#ffd700", borderRadius: 2 }} />
            <h2 style={{ color: "#fff", margin: 0, fontSize: 30, fontWeight: 800 }}>NCC for Statues</h2>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 40 }}>
            <button onClick={onArchives} style={{ ...btn("#fff","#0096c7"), borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 700, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 180 }}>
              <span style={{ fontSize: 36 }}>🏛️</span>Archives
            </button>
            <button onClick={onAlumni} style={{ ...btn("#fff","#0096c7"), borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 700, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 180 }}>
              <span style={{ fontSize: 36 }}>🎓</span>Our Alumni
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: "#1a1a2e", color: "#aaa", textAlign: "center", padding: "20px" }}>
        <p style={{ margin: 0, fontSize: 14 }}>
          Developed by{" "}
          <a href="https://www.linkedin.com/in/navjot-sharma-0bb7143b1" target="_blank" rel="noopener noreferrer"
            style={{ color: "#ffd700", fontWeight: 700, textDecoration: "none", borderBottom: "1px solid #ffd70060" }}>Navjot Sharma 🔗</a>
          &nbsp;|&nbsp;
          <a href="#" onClick={e => { e.preventDefault(); onAdminLogin(); }} style={{ color: "#aad4ff", textDecoration: "none" }}>Admin Panel</a>
        </p>
      </footer>

      {/* MODALS */}
      {showReg   && <RegistrationModal data={data} update={update} onClose={() => setShowReg(false)} />}
      {showNews  && <AddNewsModal  onAdd={async item => { const n = norm(await apiPost("/news",  item)); update("news",  [...data.news,  n]); setShowNews(false);  }} onClose={() => setShowNews(false)}  />}
      {showEvent && <AddEventModal onAdd={async item => { const e = norm(await apiPost("/events",item)); update("events",[...data.events,e]); setShowEvent(false); }} onClose={() => setShowEvent(false)} />}
      {editSec === "hero"             && <EditHeroModal  data={data} update={update} onClose={() => setEditSec(null)} />}
      {editSec === "aim"              && <EditAimModal   data={data} update={update} onClose={() => setEditSec(null)} />}
      {editSec === "visitors"         && <EditStatModal label="Visitor No."       field="visitors"         data={data} update={update} onClose={() => setEditSec(null)} />}
      {editSec === "activeCadets"     && <EditStatModal label="Active Cadets"     field="activeCadets"     data={data} update={update} onClose={() => setEditSec(null)} />}
      {editSec === "registeredCadets" && <EditStatModal label="Registered Cadets" field="registeredCadets" data={data} update={update} onClose={() => setEditSec(null)} />}
    </div>
  );
}

// ─── NEWS CARD ────────────────────────────────────────────────────────────────
function NewsCard({ item, isAdmin, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(item);
  if (editing) return (
    <div style={{ background: "#f8f9fa", borderRadius: 10, padding: 14, border: "1.5px solid #1a73e8" }}>
      <Field label="Title"       value={form.title} onChange={v => setForm(f=>({...f,title:v}))} />
      <Field label="Description" value={form.desc}  onChange={v => setForm(f=>({...f,desc:v}))}  rows={3} />
      <Field label="Date"        value={form.date}  onChange={v => setForm(f=>({...f,date:v}))} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { onEdit(form); setEditing(false); }} style={btn("#1a73e8")}>Save</button>
        <button onClick={() => setEditing(false)} style={btn("#eee","#333")}>Cancel</button>
      </div>
    </div>
  );
  return (
    <div style={{ background: "#f8faff", borderRadius: 10, padding: 14, border: "1px solid #e3eaff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "#1a1a6e", fontSize: 14, marginBottom: 4 }}>{item.title}</div>
          <div style={{ color: "#555", fontSize: 13, lineHeight: 1.6 }}>{item.desc}</div>
          <div style={{ color: "#c41e3a", fontSize: 11, fontWeight: 700, marginTop: 6 }}>📅 {item.date}</div>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 4, marginLeft: 10 }}>
            <button onClick={() => setEditing(true)}   style={{ background: "#e8f0fe", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}><Icon name="edit"  size={13} color="#1a73e8" /></button>
            <button onClick={() => onDelete(item.id)}  style={{ background: "#fce8e6", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}><Icon name="trash" size={13} color="#d93025" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EVENT CARD ───────────────────────────────────────────────────────────────
function EventCard({ item, isAdmin, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(item);
  if (editing) return (
    <div style={{ background: "#f8f9fa", borderRadius: 10, padding: 14, border: "1.5px solid #1a73e8" }}>
      <Field label="Title"       value={form.title}       onChange={v => setForm(f=>({...f,title:v}))} />
      <Field label="Description" value={form.desc}        onChange={v => setForm(f=>({...f,desc:v}))}  rows={3} />
      <Field label="Date"        value={form.date}        onChange={v => setForm(f=>({...f,date:v}))} />
      <Field label="Image URL"   value={form.image||""}   onChange={v => setForm(f=>({...f,image:v}))} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { onEdit(form); setEditing(false); }} style={btn("#1a73e8")}>Save</button>
        <button onClick={() => setEditing(false)} style={btn("#eee","#333")}>Cancel</button>
      </div>
    </div>
  );
  return (
    <div style={{ background: "#f0f8ff", borderRadius: 10, padding: 14, border: "1px solid #cce5ff" }}>
      {item.image && <img src={item.image} alt={item.title} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "#1a1a6e", fontSize: 14, marginBottom: 4 }}>{item.title}</div>
          <div style={{ color: "#555", fontSize: 13, lineHeight: 1.6 }}>{item.desc}</div>
          <div style={{ color: "#1a73e8", fontSize: 11, fontWeight: 700, marginTop: 6 }}>📅 {item.date}</div>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 4, marginLeft: 10 }}>
            <button onClick={() => setEditing(true)}   style={{ background: "#e8f0fe", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}><Icon name="edit"  size={13} color="#1a73e8" /></button>
            <button onClick={() => onDelete(item.id)}  style={{ background: "#fce8e6", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}><Icon name="trash" size={13} color="#d93025" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CADET CORNER ─────────────────────────────────────────────────────────────
function CadetCorner({ data, update, isAdmin, onCategoryClick }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ name: "", cover: "" });
  const addCat = async () => {
    if (!form.name) return;
    const c = norm(await apiPost("/categories", form));
    update("categories", [...data.categories, c]);
    setForm({ name: "", cover: "" }); setShowAdd(false);
  };
  return (
    <div style={{ background: "#fafafa", padding: "60px 20px", borderTop: "4px solid #e8eaed" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 32, background: "#c41e3a", borderRadius: 2 }} />
            <h2 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: "#1a1a6e" }}>🎖️ Cadet's Corner</h2>
            <div style={{ width: 4, height: 32, background: "#c41e3a", borderRadius: 2 }} />
          </div>
          <p style={{ color: "#666", marginTop: 8, fontSize: 14 }}>Activities performed by the NCC cadets across the country</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20 }}>
          {data.categories.map(cat => (
            <CategoryCard key={cat.id} cat={cat} isAdmin={isAdmin} onClick={() => onCategoryClick(cat.id)}
              onDelete={async id => {
                const catAlbums = data.albums.filter(a => String(a.catId) === String(id));
                await Promise.all(catAlbums.map(a => apiDelete(`/albums/${a.id}`)));
                await apiDelete(`/categories/${id}`);
                update("categories", data.categories.filter(c => c.id !== id));
                update("albums", data.albums.filter(a => String(a.catId) !== String(id)));
              }}
              onEdit={async updated => {
                const s = norm(await apiPut(`/categories/${updated.id}`, updated));
                update("categories", data.categories.map(c => c.id === s.id ? s : c));
              }} />
          ))}
          {isAdmin && (
            showAdd
              ? <div style={{ background: "#fff", borderRadius: 14, border: "2px dashed #1a73e8", padding: 16 }}>
                  <Field label="Category Name"   value={form.name}  onChange={v => setForm(f=>({...f,name:v}))} />
                  <Field label="Cover Image URL" value={form.cover} onChange={v => setForm(f=>({...f,cover:v}))} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={addCat} style={btn("#1a73e8")}>Add</button>
                    <button onClick={() => setShowAdd(false)} style={btn("#eee","#333")}>Cancel</button>
                  </div>
                </div>
              : <button onClick={() => setShowAdd(true)} style={{ background: "#fff", borderRadius: 14, border: "2px dashed #1a73e8", padding: 20, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#1a73e8", fontWeight: 700, fontSize: 14, minHeight: 200 }}>
                  <Icon name="plus" size={32} color="#1a73e8" /> Add Category
                </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ cat, isAdmin, onClick, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState(cat);
  if (editing) return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #1a73e8", padding: 14 }}>
      <Field label="Name"            value={form.name}  onChange={v => setForm(f=>({...f,name:v}))} />
      <Field label="Cover Image URL" value={form.cover} onChange={v => setForm(f=>({...f,cover:v}))} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { onEdit(form); setEditing(false); }} style={btn("#1a73e8")}>Save</button>
        <button onClick={() => setEditing(false)} style={btn("#eee","#333")}>Cancel</button>
      </div>
    </div>
  );
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", cursor: "pointer", position: "relative", transition: "transform 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.transform="translateY(-4px)"}
      onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}>
      <div onClick={onClick}>
        <img src={cat.cover||`https://placehold.co/300x200/1a1a6e/white?text=${cat.name}`} alt={cat.name} style={{ width: "100%", height: 180, objectFit: "cover" }} onError={e => e.target.src=`https://placehold.co/300x200/1a1a6e/white?text=${cat.name}`} />
        <div style={{ background: "#fff", padding: "12px", textAlign: "center" }}>
          <div style={{ fontWeight: 700, color: "#1a1a6e", fontSize: 14 }}>{cat.name}</div>
        </div>
      </div>
      {isAdmin && (
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
          <button onClick={e => { e.stopPropagation(); setEditing(true); }}    style={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}><Icon name="edit"  size={13} color="#1a73e8" /></button>
          <button onClick={e => { e.stopPropagation(); onDelete(cat.id); }} style={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}><Icon name="trash" size={13} color="#d93025" /></button>
        </div>
      )}
    </div>
  );
}

// ─── CATEGORY PAGE ────────────────────────────────────────────────────────────
function CategoryPage({ catId, data, update, onBack, isAdmin }) {
  const cat    = data.categories.find(c => c.id === catId);
  const albums = data.albums.filter(a => String(a.catId) === String(catId));
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState({ title: "", desc: "", images: "" });
  const [viewAlbum, setViewAlbum] = useState(null);

  const addAlbum = async () => {
    if (!form.title) return;
    const imgs = form.images.split("\n").filter(Boolean);
    const a = norm(await apiPost("/albums", { catId, title: form.title, desc: form.desc, images: imgs }));
    update("albums", [...data.albums, a]);
    setForm({ title: "", desc: "", images: "" }); setShowAdd(false);
  };

  if (viewAlbum) return (
    <AlbumView album={viewAlbum} onBack={() => setViewAlbum(null)} isAdmin={isAdmin}
      onUpdate={async a => { const s = norm(await apiPut(`/albums/${a.id}`, a)); update("albums", data.albums.map(x => x.id===s.id?s:x)); setViewAlbum(s); }}
      onDelete={async () => { await apiDelete(`/albums/${viewAlbum.id}`); update("albums", data.albums.filter(x=>x.id!==viewAlbum.id)); setViewAlbum(null); }} />
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ background: "#1a1a6e", padding: "20px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ ...btn("rgba(255,255,255,0.2)","#fff"), borderRadius: 20, fontSize: 13 }}>← Back</button>
        <h2 style={{ color: "#fff", margin: 0, fontSize: 22, fontWeight: 800 }}>🎖️ {cat?.name||"Category"}</h2>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, color: "#1a1a6e", fontSize: 20 }}>Albums ({albums.length})</h3>
          {isAdmin && <button onClick={() => setShowAdd(true)} style={{ ...btn("#1a73e8"), borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}><Icon name="plus" size={14} color="#fff" /> Add Album</button>}
        </div>
        {showAdd && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 24, border: "2px solid #1a73e8" }}>
            <Field label="Album Title"  value={form.title}  onChange={v => setForm(f=>({...f,title:v}))} />
            <Field label="Description"  value={form.desc}   onChange={v => setForm(f=>({...f,desc:v}))}  rows={2} />
            <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Image URLs (one per line)</label>
            <textarea value={form.images} onChange={e => setForm(f=>({...f,images:e.target.value}))} rows={4} style={{ ...inp, resize: "vertical" }} placeholder="https://..." />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addAlbum} style={btn("#1a73e8")}>Add Album</button>
              <button onClick={() => setShowAdd(false)} style={btn("#eee","#333")}>Cancel</button>
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 }}>
          {albums.map(album => (
            <div key={album.id} onClick={() => setViewAlbum(album)} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", transition: "transform 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.transform="translateY(-4px)"}
              onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}>
              <img src={album.images[0]||"https://placehold.co/300x200/1a1a6e/white?text=Album"} alt={album.title} style={{ width: "100%", height: 160, objectFit: "cover" }} onError={e => e.target.src="https://placehold.co/300x200/1a1a6e/white?text=Album"} />
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 700, color: "#1a1a6e", fontSize: 15 }}>{album.title}</div>
                <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>{album.desc}</div>
                <div style={{ color: "#1a73e8", fontSize: 11, marginTop: 6 }}>📷 {album.images.length} photo(s)</div>
              </div>
            </div>
          ))}
          {albums.length === 0 && <p style={{ color: "#aaa" }}>No albums yet.</p>}
        </div>
      </div>
    </div>
  );
}

function AlbumView({ album, onBack, isAdmin, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ ...album, images: album.images.join("\n") });
  const save = () => { onUpdate({ ...form, images: form.images.split("\n").filter(Boolean) }); setEditing(false); };
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ background: "#1a1a6e", padding: "20px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ ...btn("rgba(255,255,255,0.2)","#fff"), borderRadius: 20, fontSize: 13 }}>← Back</button>
        <h2 style={{ color: "#fff", margin: 0, fontSize: 22, fontWeight: 800 }}>{album.title}</h2>
        {isAdmin && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={() => setEditing(!editing)} style={btn("#ffd700","#1a1a6e")}>✏️ Edit</button>
            <button onClick={() => { if (window.confirm("Delete album?")) onDelete(); }} style={btn("#c41e3a")}>🗑️ Delete</button>
          </div>
        )}
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
        {editing ? (
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 24, border: "2px solid #1a73e8" }}>
            <Field label="Title"       value={form.title}  onChange={v => setForm(f=>({...f,title:v}))} />
            <Field label="Description" value={form.desc}   onChange={v => setForm(f=>({...f,desc:v}))}  rows={2} />
            <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Image URLs (one per line)</label>
            <textarea value={form.images} onChange={e => setForm(f=>({...f,images:e.target.value}))} rows={5} style={{ ...inp, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={save} style={btn("#1a73e8")}>Save</button>
              <button onClick={() => setEditing(false)} style={btn("#eee","#333")}>Cancel</button>
            </div>
          </div>
        ) : <p style={{ color: "#666", marginBottom: 24 }}>{album.desc}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
          {album.images.map((img, i) => (
            <img key={i} src={img} alt={`Photo ${i+1}`} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}
              onError={e => e.target.src="https://placehold.co/300x200/1a1a6e/white?text=Photo"} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ALUMNI PAGE ──────────────────────────────────────────────────────────────
function AlumniPage({ data, update, onBack, isAdmin }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ name: "", desc: "", image: "" });
  const add = async () => {
    if (!form.name) return;
    const a = norm(await apiPost("/alumni", form));
    update("alumni", [...data.alumni, a]);
    setForm({ name: "", desc: "", image: "" }); setShowAdd(false);
  };
  return (
    <EntryListPage title="Our Alumni" emoji="🎓" items={data.alumni} nameKey="name" onBack={onBack} isAdmin={isAdmin}
      onDelete={async id => { await apiDelete(`/alumni/${id}`); update("alumni", data.alumni.filter(x=>x.id!==id)); }}
      onEdit={async item => { const s = norm(await apiPut(`/alumni/${item.id}`,item)); update("alumni", data.alumni.map(x=>x.id===s.id?s:x)); }}
      addForm={showAdd ? (
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 24, border: "2px solid #1a73e8" }}>
          <Field label="Name / Title" value={form.name}  onChange={v => setForm(f=>({...f,name:v}))} />
          <Field label="Description"  value={form.desc}  onChange={v => setForm(f=>({...f,desc:v}))}  rows={3} />
          <Field label="Photo URL"    value={form.image} onChange={v => setForm(f=>({...f,image:v}))} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={add} style={btn("#1a73e8")}>Add Alumni</button>
            <button onClick={() => setShowAdd(false)} style={btn("#eee","#333")}>Cancel</button>
          </div>
        </div>
      ) : null}
      onShowAdd={() => setShowAdd(true)} />
  );
}

// ─── ARCHIVES PAGE ────────────────────────────────────────────────────────────
function ArchivesPage({ data, update, onBack, isAdmin }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ heading: "", desc: "", image: "" });
  const add = async () => {
    if (!form.heading) return;
    const a = norm(await apiPost("/archives", form));
    update("archives", [...data.archives, a]);
    setForm({ heading: "", desc: "", image: "" }); setShowAdd(false);
  };
  return (
    <EntryListPage title="Archives" emoji="🏛️" items={data.archives} nameKey="heading" onBack={onBack} isAdmin={isAdmin}
      onDelete={async id => { await apiDelete(`/archives/${id}`); update("archives", data.archives.filter(x=>x.id!==id)); }}
      onEdit={async item => { const s = norm(await apiPut(`/archives/${item.id}`,item)); update("archives", data.archives.map(x=>x.id===s.id?s:x)); }}
      addForm={showAdd ? (
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 24, border: "2px solid #1a73e8" }}>
          <Field label="Heading"     value={form.heading} onChange={v => setForm(f=>({...f,heading:v}))} />
          <Field label="Description" value={form.desc}    onChange={v => setForm(f=>({...f,desc:v}))}    rows={3} />
          <Field label="Image URL"   value={form.image}   onChange={v => setForm(f=>({...f,image:v}))} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={add} style={btn("#1a73e8")}>Add Archive</button>
            <button onClick={() => setShowAdd(false)} style={btn("#eee","#333")}>Cancel</button>
          </div>
        </div>
      ) : null}
      onShowAdd={() => setShowAdd(true)} />
  );
}

function EntryListPage({ title, emoji, items, nameKey, onBack, isAdmin, onDelete, onEdit, addForm, onShowAdd }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ background: "#1a1a6e", padding: "20px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ ...btn("rgba(255,255,255,0.2)","#fff"), borderRadius: 20, fontSize: 13 }}>← Back</button>
        <h2 style={{ color: "#fff", margin: 0, fontSize: 22, fontWeight: 800 }}>{emoji} {title}</h2>
        {isAdmin && <button onClick={onShowAdd} style={{ ...btn("#ffd700","#1a1a6e"), marginLeft: "auto", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}><Icon name="plus" size={14} color="#1a1a6e" /> Add</button>}
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
        {addForm}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24 }}>
          {items.map(item => <EntryCard key={item.id} item={item} nameKey={nameKey} isAdmin={isAdmin} onDelete={onDelete} onEdit={onEdit} />)}
          {items.length === 0 && <p style={{ color: "#aaa" }}>Nothing here yet.</p>}
        </div>
      </div>
    </div>
  );
}

function EntryCard({ item, nameKey, isAdmin, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState(item);
  if (editing) return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "2px solid #1a73e8" }}>
      <Field label={nameKey==="name"?"Name":"Heading"} value={form[nameKey]} onChange={v => setForm(f=>({...f,[nameKey]:v}))} />
      <Field label="Description" value={form.desc}  onChange={v => setForm(f=>({...f,desc:v}))}  rows={3} />
      <Field label="Image URL"   value={form.image} onChange={v => setForm(f=>({...f,image:v}))} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { onEdit(form); setEditing(false); }} style={btn("#1a73e8")}>Save</button>
        <button onClick={() => setEditing(false)} style={btn("#eee","#333")}>Cancel</button>
      </div>
    </div>
  );
  return (
    <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", position: "relative" }}>
      <img src={item.image||"https://placehold.co/300x200/1a1a6e/white?text=Image"} alt={item[nameKey]} style={{ width: "100%", height: 180, objectFit: "cover" }} onError={e => e.target.src="https://placehold.co/300x200/1a1a6e/white?text=Image"} />
      <div style={{ padding: 16 }}>
        <h4 style={{ margin: "0 0 8px", color: "#1a1a6e", fontSize: 16, fontWeight: 700 }}>{item[nameKey]}</h4>
        <p style={{ color: "#666", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
      </div>
      {isAdmin && (
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
          <button onClick={() => setEditing(true)}  style={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}><Icon name="edit"  size={13} color="#1a73e8" /></button>
          <button onClick={() => onDelete(item.id)} style={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}><Icon name="trash" size={13} color="#d93025" /></button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function AdminPanel({ data, update, onLogout }) {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview",      label: "📊 Overview" },
    { id: "stats",         label: "📈 Stats & Content" },
    { id: "news",          label: "📰 News" },
    { id: "events",        label: "📅 Events" },
    { id: "categories",    label: "🎖️ Categories" },
    { id: "alumni",        label: "🎓 Alumni" },
    { id: "archives",      label: "🏛️ Archives" },
    { id: "registrations", label: "📝 Registrations" },
  ];
  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ background: "#1a1a6e", padding: "16px 24px", display: "flex", alignItems: "center" }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>⚙️ NCC Admin Panel</div>
        <button onClick={onLogout} style={{ ...btn("rgba(255,255,255,0.15)","#fff"), marginLeft: "auto", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="logout" size={14} color="#fff" /> Logout & View Site
        </button>
      </div>
      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
        <div style={{ width: 210, background: "#fff", borderRight: "1px solid #e8eaed", padding: "20px 0" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "block", width: "100%", padding: "12px 20px", background: tab===t.id?"#e8f0fe":"none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: tab===t.id?700:400, color: tab===t.id?"#1a73e8":"#555", borderLeft: tab===t.id?"3px solid #1a73e8":"3px solid transparent" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, padding: "30px", overflow: "auto" }}>
          {tab === "overview"      && <AdminOverview      data={data} />}
          {tab === "stats"         && <AdminStats         data={data} update={update} />}
          {tab === "news"          && <AdminNews          data={data} update={update} />}
          {tab === "events"        && <AdminEvents        data={data} update={update} />}
          {tab === "categories"    && <AdminCategories    data={data} update={update} />}
          {tab === "alumni"        && <AdminAlumni        data={data} update={update} />}
          {tab === "archives"      && <AdminArchives      data={data} update={update} />}
          {tab === "registrations" && <AdminRegistrations />}
        </div>
      </div>
    </div>
  );
}

function AdminCard({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 24 }}>
      <h3 style={{ margin: "0 0 20px", color: "#1a1a6e", fontSize: 18, fontWeight: 700 }}>{title}</h3>
      {children}
    </div>
  );
}

function AdminOverview({ data }) {
  return (
    <div>
      <h2 style={{ color: "#1a1a6e", marginBottom: 24 }}>Dashboard Overview</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          { label: "Visitors",      val: (data.stats.visitors||0).toLocaleString(),         color: "#1a73e8" },
          { label: "Active Cadets", val: (data.stats.activeCadets||0).toLocaleString(),     color: "#c41e3a" },
          { label: "Registered",    val: (data.stats.registeredCadets||0).toLocaleString(), color: "#0f9d58" },
          { label: "News Items",    val: data.news.length,     color: "#ff6d00" },
          { label: "Events",        val: data.events.length,   color: "#7c4dff" },
          { label: "Categories",    val: data.categories.length, color: "#00acc1" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "20px", border: `2px solid ${s.color}20`, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminStats({ data, update }) {
  const [sf,  setSf]  = useState(data.stats);
  const [hero, setHero] = useState(data.heroImage||"");
  const [ncc,  setNcc]  = useState(data.nccLogo||"");
  const [thap, setThap] = useState(data.thaparLogo||"");
  const [link, setLink] = useState(data.backLink||"https://www.thapar.edu/students");
  const [aim,  setAim]  = useState(data.aim);
  const [msg,  setMsg]  = useState("");
  const flash = m => { setMsg(m); setTimeout(()=>setMsg(""),2500); };

  const saveStats = async () => {
    const s = norm(await apiPut("/stats", sf));
    update("stats", s); flash("✅ Stats saved!");
  };
  const saveContent = async () => {
    await apiPut("/content", { heroImage: hero, nccLogo: ncc, thaparLogo: thap, backLink: link, aimTitle: aim.title, aimDesc1: aim.desc1, aimDesc2: aim.desc2 });
    update("heroImage", hero); update("nccLogo", ncc); update("thaparLogo", thap); update("backLink", link); update("aim", aim);
    flash("✅ Content saved!");
  };

  return (
    <div>
      {msg && <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: "10px 16px", borderRadius: 8, marginBottom: 20, fontWeight: 600 }}>{msg}</div>}
      <AdminCard title="🏷️ Header & Branding">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a6e", marginBottom: 10 }}>NCC Logo (Left)</div>
            <Field label="Image URL" value={ncc} onChange={setNcc} />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {ncc ? <img src={ncc} alt="NCC" style={{ width: 60, height: 60, objectFit: "contain", borderRadius: "50%", border: "2px solid #e8eaed" }} onError={e=>e.target.style.display="none"} />
                   : <div style={{ width: 60, height: 60, background: "linear-gradient(135deg,#1a1a6e,#c41e3a)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 13 }}>NCC</div>}
              <div style={{ fontSize: 12, color: "#888" }}>{ncc?"✅ Custom logo":"Using default"}</div>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#b22222", marginBottom: 10 }}>Thapar Logo (Right)</div>
            <Field label="Image URL" value={thap} onChange={setThap} />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {thap ? <img src={thap} alt="Thapar" style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 8, border: "2px solid #e8eaed" }} onError={e=>e.target.style.display="none"} />
                    : <div style={{ width: 60, height: 60, background: "linear-gradient(135deg,#b22222,#8b0000)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 11, textAlign: "center", lineHeight: 1.3 }}>THAPAR<br/>UNIV</div>}
              <div style={{ fontSize: 12, color: "#888" }}>{thap?"✅ Custom logo":"Using default"}</div>
            </div>
          </div>
        </div>
        <Field label='🔗 "Back to Main Website" Link' value={link} onChange={setLink} />
        <div style={{ fontSize: 12, color: "#888", marginTop: -8, marginBottom: 12 }}>
          Current: <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: "#1a73e8" }}>{link}</a>
        </div>
        <Field label="🖼️ Hero Image URL" value={hero} onChange={setHero} />
        {hero && <img src={hero} alt="Hero" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} onError={e=>e.target.style.display="none"} />}
        <button onClick={saveContent} style={{ ...btn("#1a1a6e"), borderRadius: 8 }}>💾 Save Header & Hero</button>
      </AdminCard>

      <AdminCard title="📊 Site Statistics">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          <Field label="Visitors"          value={sf.visitors}         type="number" onChange={v=>setSf(f=>({...f,visitors:Number(v)}))} />
          <Field label="Active Cadets"     value={sf.activeCadets}     type="number" onChange={v=>setSf(f=>({...f,activeCadets:Number(v)}))} />
          <Field label="Registered Cadets" value={sf.registeredCadets} type="number" onChange={v=>setSf(f=>({...f,registeredCadets:Number(v)}))} />
        </div>
        <button onClick={saveStats} style={btn("#0f9d58")}>💾 Save Stats</button>
      </AdminCard>

      <AdminCard title="🎯 Aim Section">
        <Field label="Title"               value={aim.title} onChange={v=>setAim(f=>({...f,title:v}))} />
        <Field label="Description (Left)"  value={aim.desc1} onChange={v=>setAim(f=>({...f,desc1:v}))} rows={4} />
        <Field label="Description (Right)" value={aim.desc2} onChange={v=>setAim(f=>({...f,desc2:v}))} rows={4} />
        <button onClick={saveContent} style={btn("#0f9d58")}>💾 Save Aim</button>
      </AdminCard>
    </div>
  );
}

function AdminNews({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ title:"", desc:"", date:"" });
  const add = async () => {
    if (!form.title) return;
    const n = norm(await apiPost("/news", form));
    update("news", [...data.news, n]); setForm({ title:"", desc:"", date:"" }); setShowAdd(false);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ color: "#1a1a6e", margin: 0 }}>📰 News Management</h2>
        <button onClick={() => setShowAdd(!showAdd)} style={{ ...btn("#1a73e8"), borderRadius: 20 }}>+ Add News</button>
      </div>
      {showAdd && (
        <AdminCard title="Add News">
          <Field label="Title"       value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} />
          <Field label="Description" value={form.desc}  onChange={v=>setForm(f=>({...f,desc:v}))}  rows={3} />
          <Field label="Date"        value={form.date}  onChange={v=>setForm(f=>({...f,date:v}))} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={add} style={btn("#0f9d58")}>Add</button>
            <button onClick={() => setShowAdd(false)} style={btn("#eee","#333")}>Cancel</button>
          </div>
        </AdminCard>
      )}
      {data.news.map(n => (
        <AdminCard key={n.id} title={n.title}>
          <p style={{ color: "#666", marginBottom: 8 }}>{n.desc}</p>
          <p style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>📅 {n.date}</p>
          <button onClick={async () => { await apiDelete(`/news/${n.id}`); update("news", data.news.filter(x=>x.id!==n.id)); }}
            style={{ ...btn("#fce8e6","#c5221f"), fontSize: 12, borderRadius: 8 }}>🗑️ Delete</button>
        </AdminCard>
      ))}
    </div>
  );
}

function AdminEvents({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ title:"", desc:"", date:"", image:"" });
  const add = async () => {
    if (!form.title) return;
    const e = norm(await apiPost("/events", form));
    update("events", [...data.events, e]); setForm({ title:"", desc:"", date:"", image:"" }); setShowAdd(false);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ color: "#1a1a6e", margin: 0 }}>📅 Events Management</h2>
        <button onClick={() => setShowAdd(!showAdd)} style={{ ...btn("#1a73e8"), borderRadius: 20 }}>+ Add Event</button>
      </div>
      {showAdd && (
        <AdminCard title="Add Event">
          <Field label="Title"       value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} />
          <Field label="Description" value={form.desc}  onChange={v=>setForm(f=>({...f,desc:v}))}  rows={3} />
          <Field label="Date"        value={form.date}  onChange={v=>setForm(f=>({...f,date:v}))} />
          <Field label="Image URL"   value={form.image} onChange={v=>setForm(f=>({...f,image:v}))} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={add} style={btn("#0f9d58")}>Add</button>
            <button onClick={() => setShowAdd(false)} style={btn("#eee","#333")}>Cancel</button>
          </div>
        </AdminCard>
      )}
      {data.events.map(e => (
        <AdminCard key={e.id} title={e.title}>
          <p style={{ color: "#666", marginBottom: 8 }}>{e.desc}</p>
          <p style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>📅 {e.date}</p>
          <button onClick={async () => { await apiDelete(`/events/${e.id}`); update("events", data.events.filter(x=>x.id!==e.id)); }}
            style={{ ...btn("#fce8e6","#c5221f"), fontSize: 12, borderRadius: 8 }}>🗑️ Delete</button>
        </AdminCard>
      ))}
    </div>
  );
}

function AdminCategories({ data, update }) {
  const [showAddCat,   setShowAddCat]   = useState(false);
  const [catForm,      setCatForm]      = useState({ name:"", cover:"" });
  const [expandedCat,  setExpandedCat]  = useState(null);
  const [albumForms,   setAlbumForms]   = useState({});
  const [showAlbumAdd, setShowAlbumAdd] = useState({});
  const [picForms,     setPicForms]     = useState({});

  const addCat = async () => {
    if (!catForm.name) return;
    const c = norm(await apiPost("/categories", catForm));
    update("categories", [...data.categories, c]); setCatForm({ name:"", cover:"" }); setShowAddCat(false);
  };
  const addAlbum = async catId => {
    const f = albumForms[catId]||{ title:"", desc:"", images:"" };
    if (!f.title) return;
    const a = norm(await apiPost("/albums", { catId, title:f.title, desc:f.desc, images:f.images.split("\n").filter(Boolean) }));
    update("albums", [...data.albums, a]);
    setAlbumForms(p=>({...p,[catId]:{ title:"", desc:"", images:"" }}));
    setShowAlbumAdd(p=>({...p,[catId]:false}));
  };
  const addPic = async album => {
    const url=(picForms[album.id]||"").trim(); if (!url) return;
    const s = norm(await apiPut(`/albums/${album.id}`,{...album,images:[...album.images,url]}));
    update("albums", data.albums.map(a=>a.id===s.id?s:a)); setPicForms(p=>({...p,[album.id]:""}));
  };
  const removePic = async (album, idx) => {
    const s = norm(await apiPut(`/albums/${album.id}`,{...album,images:album.images.filter((_,i)=>i!==idx)}));
    update("albums", data.albums.map(a=>a.id===s.id?s:a));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: "#1a1a6e", margin: 0 }}>🎖️ Categories & Albums</h2>
        <button onClick={()=>setShowAddCat(s=>!s)} style={{ ...btn("#1a73e8"), borderRadius: 20, display:"flex", alignItems:"center", gap:6 }}>
          <Icon name="plus" size={14} color="#fff" /> Add Category
        </button>
      </div>
      {showAddCat && (
        <AdminCard title="New Category">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Category Name"   value={catForm.name}  onChange={v=>setCatForm(f=>({...f,name:v}))} />
            <Field label="Cover Image URL" value={catForm.cover} onChange={v=>setCatForm(f=>({...f,cover:v}))} />
          </div>
          {catForm.cover && <img src={catForm.cover} alt="preview" style={{ width:"100%", height:120, objectFit:"cover", borderRadius:8, marginBottom:12 }} onError={e=>e.target.style.display="none"} />}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={addCat} style={btn("#0f9d58")}>✅ Create</button>
            <button onClick={()=>setShowAddCat(false)} style={btn("#eee","#333")}>Cancel</button>
          </div>
        </AdminCard>
      )}
      {data.categories.map(cat => {
        const albums = data.albums.filter(a=>String(a.catId)===String(cat.id));
        const isExp  = expandedCat===cat.id;
        const af     = albumForms[cat.id]||{ title:"", desc:"", images:"" };
        return (
          <div key={cat.id} style={{ background:"#fff", borderRadius:14, marginBottom:16, border:"1px solid #e8eaed", overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", background:"#f8faff", borderBottom:isExp?"1px solid #e3eaff":"none" }}>
              <img src={cat.cover||"https://placehold.co/60/1a1a6e/white?text=C"} alt={cat.name} style={{ width:52, height:52, objectFit:"cover", borderRadius:8 }} onError={e=>e.target.src="https://placehold.co/60/1a1a6e/white?text=C"} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:"#1a1a6e", fontSize:16 }}>{cat.name}</div>
                <div style={{ color:"#888", fontSize:12 }}>{albums.length} album(s) · {albums.reduce((s,a)=>s+a.images.length,0)} photo(s)</div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setExpandedCat(isExp?null:cat.id)} style={{ ...btn(isExp?"#1a1a6e":"#e8f0fe",isExp?"#fff":"#1a73e8"), fontSize:12, borderRadius:8 }}>
                  {isExp?"▲ Collapse":"▼ Manage"}
                </button>
                <button onClick={async()=>{
                  if (!window.confirm(`Delete "${cat.name}"?`)) return;
                  const ca=data.albums.filter(a=>String(a.catId)===String(cat.id));
                  await Promise.all(ca.map(a=>apiDelete(`/albums/${a.id}`)));
                  await apiDelete(`/categories/${cat.id}`);
                  update("categories",data.categories.filter(c=>c.id!==cat.id));
                  update("albums",data.albums.filter(a=>String(a.catId)!==String(cat.id)));
                }} style={{ ...btn("#fce8e6","#c5221f"), fontSize:12, borderRadius:8 }}>🗑️</button>
              </div>
            </div>
            {isExp && (
              <div style={{ padding:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={{ fontWeight:700, color:"#555", fontSize:14 }}>Albums in {cat.name}</div>
                  <button onClick={()=>setShowAlbumAdd(p=>({...p,[cat.id]:!p[cat.id]}))} style={{ ...btn("#e8f0fe","#1a73e8"), fontSize:12, borderRadius:20, display:"flex", alignItems:"center", gap:5 }}>
                    <Icon name="plus" size={12} color="#1a73e8" /> Add Album
                  </button>
                </div>
                {showAlbumAdd[cat.id] && (
                  <div style={{ background:"#f0f4ff", borderRadius:10, padding:14, marginBottom:16, border:"1.5px solid #b3c6ff" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <Field label="Title"       value={af.title} onChange={v=>setAlbumForms(p=>({...p,[cat.id]:{...af,title:v}}))} />
                      <Field label="Description" value={af.desc}  onChange={v=>setAlbumForms(p=>({...p,[cat.id]:{...af,desc:v}}))} />
                    </div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:4 }}>Image URLs (one per line)</label>
                    <textarea value={af.images} onChange={e=>setAlbumForms(p=>({...p,[cat.id]:{...af,images:e.target.value}}))} rows={3} style={{ ...inp, resize:"vertical" }} placeholder="https://..." />
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>addAlbum(cat.id)} style={btn("#0f9d58")}>✅ Create Album</button>
                      <button onClick={()=>setShowAlbumAdd(p=>({...p,[cat.id]:false}))} style={btn("#eee","#333")}>Cancel</button>
                    </div>
                  </div>
                )}
                {albums.length===0 && <p style={{ color:"#bbb", fontSize:13 }}>No albums yet.</p>}
                {albums.map(album=>(
                  <div key={album.id} style={{ background:"#f8f9fa", borderRadius:10, padding:14, marginBottom:12, border:"1px solid #e8eaed" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div>
                        <div style={{ fontWeight:700, color:"#1a1a6e", fontSize:14 }}>{album.title}</div>
                        <div style={{ color:"#888", fontSize:12 }}>{album.desc} · {album.images.length} photo(s)</div>
                      </div>
                      <button onClick={async()=>{ await apiDelete(`/albums/${album.id}`); update("albums",data.albums.filter(a=>a.id!==album.id)); }}
                        style={{ ...btn("#fce8e6","#c5221f"), fontSize:11, borderRadius:6, padding:"5px 10px" }}>🗑️ Delete</button>
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                      {album.images.map((img,idx)=>(
                        <div key={idx} style={{ position:"relative", width:80, height:70 }}>
                          <img src={img} alt={`p${idx}`} style={{ width:80, height:70, objectFit:"cover", borderRadius:6 }} onError={e=>e.target.src="https://placehold.co/80x70/ccc/555?text=?"} />
                          <button onClick={()=>removePic(album,idx)} style={{ position:"absolute", top:2, right:2, background:"rgba(200,0,0,0.85)", border:"none", borderRadius:"50%", width:18, height:18, cursor:"pointer", color:"#fff", fontSize:11, padding:0 }}>×</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <input value={picForms[album.id]||""} onChange={e=>setPicForms(p=>({...p,[album.id]:e.target.value}))}
                        placeholder="Paste image URL to add photo..." style={{ ...inp, margin:0, flex:1 }} />
                      <button onClick={()=>addPic(album)} style={{ ...btn("#1a73e8"), padding:"10px 14px" }}><Icon name="plus" size={14} color="#fff" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {data.categories.length===0 && <p style={{ color:"#aaa" }}>No categories yet.</p>}
    </div>
  );
}

function AdminAlumni({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ name:"", desc:"", image:"" });
  const add = async () => {
    if (!form.name) return;
    const a = norm(await apiPost("/alumni", form));
    update("alumni",[...data.alumni,a]); setForm({name:"",desc:"",image:""}); setShowAdd(false);
  };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h2 style={{ color:"#1a1a6e", margin:0 }}>🎓 Alumni Management</h2>
        <button onClick={()=>setShowAdd(s=>!s)} style={{ ...btn("#1a73e8"), borderRadius:20, display:"flex", alignItems:"center", gap:6 }}>
          <Icon name="plus" size={14} color="#fff" /> Add More
        </button>
      </div>
      {showAdd && (
        <AdminCard title="Add Alumni">
          <Field label="Name / Title" value={form.name}  onChange={v=>setForm(f=>({...f,name:v}))} />
          <Field label="Description"  value={form.desc}  onChange={v=>setForm(f=>({...f,desc:v}))}  rows={3} />
          <Field label="Photo URL"    value={form.image} onChange={v=>setForm(f=>({...f,image:v}))} />
          {form.image && <img src={form.image} alt="preview" style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover", marginBottom:12 }} onError={e=>e.target.style.display="none"} />}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={add} style={btn("#0f9d58")}>✅ Add Alumni</button>
            <button onClick={()=>setShowAdd(false)} style={btn("#eee","#333")}>Cancel</button>
          </div>
        </AdminCard>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
        {data.alumni.map(a=>(
          <div key={a.id} style={{ background:"#fff", borderRadius:12, padding:16, border:"1px solid #e8eaed" }}>
            <img src={a.image} alt={a.name} style={{ width:60, height:60, borderRadius:"50%", objectFit:"cover" }} onError={e=>e.target.src="https://placehold.co/60/1a1a6e/white?text=A"} />
            <div style={{ fontWeight:700, marginTop:8, color:"#1a1a6e" }}>{a.name}</div>
            <div style={{ color:"#888", fontSize:12, marginTop:4 }}>{a.desc}</div>
            <button onClick={async()=>{ await apiDelete(`/alumni/${a.id}`); update("alumni",data.alumni.filter(x=>x.id!==a.id)); }}
              style={{ ...btn("#fce8e6","#c5221f"), fontSize:12, borderRadius:8, marginTop:10 }}>🗑️ Delete</button>
          </div>
        ))}
        {data.alumni.length===0 && <p style={{ color:"#aaa" }}>No alumni yet.</p>}
      </div>
    </div>
  );
}

function AdminArchives({ data, update }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ heading:"", desc:"", image:"" });
  const add = async () => {
    if (!form.heading) return;
    const a = norm(await apiPost("/archives", form));
    update("archives",[...data.archives,a]); setForm({heading:"",desc:"",image:""}); setShowAdd(false);
  };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h2 style={{ color:"#1a1a6e", margin:0 }}>🏛️ Archives Management</h2>
        <button onClick={()=>setShowAdd(s=>!s)} style={{ ...btn("#1a73e8"), borderRadius:20, display:"flex", alignItems:"center", gap:6 }}>
          <Icon name="plus" size={14} color="#fff" /> Add More
        </button>
      </div>
      {showAdd && (
        <AdminCard title="Add Archive Entry">
          <Field label="Heading"     value={form.heading} onChange={v=>setForm(f=>({...f,heading:v}))} />
          <Field label="Description" value={form.desc}    onChange={v=>setForm(f=>({...f,desc:v}))}    rows={3} />
          <Field label="Image URL"   value={form.image}   onChange={v=>setForm(f=>({...f,image:v}))} />
          {form.image && <img src={form.image} alt="preview" style={{ width:"100%", height:120, objectFit:"cover", borderRadius:8, marginBottom:12 }} onError={e=>e.target.style.display="none"} />}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={add} style={btn("#0f9d58")}>✅ Add Archive</button>
            <button onClick={()=>setShowAdd(false)} style={btn("#eee","#333")}>Cancel</button>
          </div>
        </AdminCard>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
        {data.archives.map(a=>(
          <div key={a.id} style={{ background:"#fff", borderRadius:12, overflow:"hidden", border:"1px solid #e8eaed" }}>
            <img src={a.image} alt={a.heading} style={{ width:"100%", height:140, objectFit:"cover" }} onError={e=>e.target.src="https://placehold.co/300x140/1a1a6e/white?text=Archive"} />
            <div style={{ padding:14 }}>
              <div style={{ fontWeight:700, color:"#1a1a6e" }}>{a.heading}</div>
              <div style={{ color:"#888", fontSize:12, marginTop:4 }}>{a.desc}</div>
              <button onClick={async()=>{ await apiDelete(`/archives/${a.id}`); update("archives",data.archives.filter(x=>x.id!==a.id)); }}
                style={{ ...btn("#fce8e6","#c5221f"), fontSize:12, borderRadius:8, marginTop:10 }}>🗑️ Delete</button>
            </div>
          </div>
        ))}
        {data.archives.length===0 && <p style={{ color:"#aaa" }}>No archives yet.</p>}
      </div>
    </div>
  );
}

function AdminRegistrations() {
  const [regs, setRegs] = useState([]);
  useEffect(()=>{ apiGet("/registrations").then(r=>setRegs(normArr(r))).catch(()=>{}); },[]);
  return (
    <div>
      <h2 style={{ color:"#1a1a6e", marginBottom:20 }}>📝 Registrations ({regs.length})</h2>
      {regs.length===0 ? <p style={{ color:"#888" }}>No registrations yet.</p> : (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#1a1a6e", color:"#fff" }}>
                {["#","Name","Email","Phone","Course","Year","Date"].map(h=><th key={h} style={{ padding:"10px 12px", textAlign:"left" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {regs.map((r,i)=>(
                <tr key={r.id} style={{ background:i%2?"#f8faff":"#fff", borderBottom:"1px solid #eee" }}>
                  <td style={{ padding:"10px 12px" }}>{i+1}</td>
                  <td style={{ padding:"10px 12px" }}>{r.name}</td>
                  <td style={{ padding:"10px 12px" }}>{r.email}</td>
                  <td style={{ padding:"10px 12px" }}>{r.phone}</td>
                  <td style={{ padding:"10px 12px" }}>{r.course}</td>
                  <td style={{ padding:"10px 12px" }}>{r.year}</td>
                  <td style={{ padding:"10px 12px" }}>{r.date||new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── INLINE EDIT MODALS ───────────────────────────────────────────────────────
function EditHeroModal({ data, update, onClose }) {
  const [url, setUrl] = useState(data.heroImage);
  const save = async () => { await apiPut("/content",{heroImage:url}); update("heroImage",url); onClose(); };
  return (
    <Modal title="Edit Hero Image" onClose={onClose}>
      <Field label="Image URL" value={url} onChange={setUrl} />
      {url && <img src={url} alt="preview" style={{ width:"100%", height:160, objectFit:"cover", borderRadius:8, marginBottom:12 }} onError={e=>e.target.style.display="none"} />}
      <button onClick={save} style={{ ...btn("#1a73e8"), width:"100%" }}>💾 Save</button>
    </Modal>
  );
}
function EditAimModal({ data, update, onClose }) {
  const [form, setForm] = useState(data.aim);
  const save = async () => { await apiPut("/content",{aimTitle:form.title,aimDesc1:form.desc1,aimDesc2:form.desc2}); update("aim",form); onClose(); };
  return (
    <Modal title="Edit Aim Section" onClose={onClose} wide>
      <Field label="Title"               value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} />
      <Field label="Description (Left)"  value={form.desc1} onChange={v=>setForm(f=>({...f,desc1:v}))} rows={4} />
      <Field label="Description (Right)" value={form.desc2} onChange={v=>setForm(f=>({...f,desc2:v}))} rows={4} />
      <button onClick={save} style={{ ...btn("#1a73e8"), width:"100%" }}>💾 Save</button>
    </Modal>
  );
}
function EditStatModal({ label, field, data, update, onClose }) {
  const [val, setVal] = useState(data.stats[field]);
  const save = async () => { const s={...data.stats,[field]:val}; await apiPut("/stats",s); update("stats",s); onClose(); };
  return (
    <Modal title={`Edit ${label}`} onClose={onClose}>
      <Field label={label} value={val} onChange={v=>setVal(Number(v))} type="number" />
      <button onClick={save} style={{ ...btn("#1a73e8"), width:"100%" }}>💾 Save</button>
    </Modal>
  );
}
function RegistrationModal({ data, update, onClose }) {
  const [form, setForm]           = useState({name:"",email:"",phone:"",course:"",year:""});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy]           = useState(false);
  const submit = async () => {
    if (!form.name||!form.email) return;
    setBusy(true);
    try {
      await apiPost("/registrations",{...form,date:new Date().toLocaleDateString()});
      const newStats={...data.stats,registeredCadets:data.stats.registeredCadets+1};
      await apiPut("/stats",newStats); update("stats",newStats); setSubmitted(true);
    } catch(e){console.error(e);}
    finally{setBusy(false);}
  };
  if (submitted) return (
    <Modal title="Registration Successful! 🎉" onClose={onClose}>
      <div style={{ textAlign:"center", padding:"20px 0" }}>
        <div style={{ fontSize:60, marginBottom:12 }}>✅</div>
        <p style={{ color:"#0f9d58", fontWeight:700, fontSize:16 }}>You have been registered successfully!</p>
        <p style={{ color:"#666", fontSize:14 }}>Welcome to NCC Digital Forum, {form.name}!</p>
        <button onClick={onClose} style={{ ...btn("#1a73e8"), marginTop:12 }}>Close</button>
      </div>
    </Modal>
  );
  return (
    <Modal title="📝 Cadet Registration" onClose={onClose}>
      <Field label="Full Name *" value={form.name}   onChange={v=>setForm(f=>({...f,name:v}))} />
      <Field label="Email *"     value={form.email}  onChange={v=>setForm(f=>({...f,email:v}))}  type="email" />
      <Field label="Phone"       value={form.phone}  onChange={v=>setForm(f=>({...f,phone:v}))} />
      <Field label="Course"      value={form.course} onChange={v=>setForm(f=>({...f,course:v}))} />
      <Field label="Year"        value={form.year}   onChange={v=>setForm(f=>({...f,year:v}))} />
      <button onClick={submit} disabled={busy} style={{ ...btn("#1a1a6e"), width:"100%", padding:"12px", fontSize:15, borderRadius:10, opacity:busy?0.7:1 }}>
        {busy?"Registering...":"🎖️ Register as Cadet"}
      </button>
    </Modal>
  );
}
function AddNewsModal({ onAdd, onClose }) {
  const [form,setForm]=useState({title:"",desc:"",date:new Date().toLocaleDateString()});
  return (
    <Modal title="Add News" onClose={onClose}>
      <Field label="Title"       value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} />
      <Field label="Description" value={form.desc}  onChange={v=>setForm(f=>({...f,desc:v}))}  rows={3} />
      <Field label="Date"        value={form.date}  onChange={v=>setForm(f=>({...f,date:v}))} />
      <button onClick={()=>{if(form.title)onAdd(form);}} style={{ ...btn("#1a73e8"), width:"100%" }}>Add News</button>
    </Modal>
  );
}
function AddEventModal({ onAdd, onClose }) {
  const [form,setForm]=useState({title:"",desc:"",date:new Date().toLocaleDateString(),image:""});
  return (
    <Modal title="Add Event" onClose={onClose}>
      <Field label="Title"       value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} />
      <Field label="Description" value={form.desc}  onChange={v=>setForm(f=>({...f,desc:v}))}  rows={3} />
      <Field label="Date"        value={form.date}  onChange={v=>setForm(f=>({...f,date:v}))} />
      <Field label="Image URL"   value={form.image} onChange={v=>setForm(f=>({...f,image:v}))} />
      <button onClick={()=>{if(form.title)onAdd(form);}} style={{ ...btn("#1a73e8"), width:"100%" }}>Add Event</button>
    </Modal>
  );
}