import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

/* ================= קבועים ועזרים ================= */
const APR_DEFAULT = 5.9;        // צמוד מדד (להמחשה בלבד; לא מוצג)
const BALLOON_FRAC = 0.5;       // בלון 50% סוף תקופה
const WA = "9725XXXXXXXX";      // ← החלף למספר הווטסאפ שלך (ללא +)

const fmt = (n) =>
  isFinite(n)
    ? n.toLocaleString("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 })
    : "—";

const slugify = (s = "") =>
  s.toLowerCase().normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/* תשלום חודשי */
function monthlyPayment({ price, down = 0, months = 60, plan = "standard" }) {
  const P0 = Math.max(0, Number(price || 0) - Number(down || 0));
  const r = APR_DEFAULT / 100 / 12;
  if (months <= 0) return 0;
  if (plan === "balloon") {
    const F = BALLOON_FRAC * Number(price || 0);
    const den = 1 - Math.pow(1 + r, -months);
    return (r * (P0 - F / Math.pow(1 + r, months))) / den;
  } else {
    if (r === 0) return P0 / months;
    return (P0 * r) / (1 - Math.pow(1 + r, -months));
  }
}

/* קריאת CSV מהמלאי */
async function parseCSV(url) {
  const res = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
  const text = await res.text();
  const [header, ...rows] = text.trim().split(/\r?\n/);
  const headers = header.split(",").map((h) => h.trim());
  const lux = ["BMW", "Mercedes", "Audi", "Lexus", "Volvo", "Porsche", "Jaguar"];

  const deriveCat = (title, fuel) => {
    if (lux.some((b) => (title || "").includes(b))) return "יוקרה";
    if (fuel === "חשמלי") return "חשמלי";
    if (fuel === "היברידי") return "היברידי";
    return "בנזין";
  };

  return rows.filter(Boolean).map((r, idx) => {
    const cols = r
      .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
      .map((c) => c.replace(/^"|"$/g, "").trim());

    const obj = {};
    headers.forEach((h, i) => (obj[h] = cols[i]));

    obj.id = obj.id || String(idx + 1);
    obj.title = obj.title || "";
    obj.year = +obj.year || 2025;
    obj.price = +obj.price || 0;
    obj.msrp = obj.msrp ? +obj.msrp : null;
    obj.km = +obj.km || 0;
    obj.delivery_weeks = obj.delivery_weeks ? +obj.delivery_weeks : null;
    obj.fuel = obj.fuel || "";
    obj.highlights = (obj.highlights || "").split("|").filter(Boolean);
    obj.sold = (obj.sold || "").toLowerCase() === "yes";
    obj.category = obj.category?.length ? obj.category : deriveCat(obj.title, obj.fuel);
    obj.brand = (obj.title || "").split(" ")[0];
    obj.slug = slugify(obj.title || "");
    return obj;
  });
}

/* תמונת רכב + Fallback */
function CarImage({ slug, alt = "" }) {
  const [srcs, setSrcs] = useState([
    `/cars/${slug}.webp?v=8`,
    `/cars/${slug}.png?v=8`,
    `/cars/${slug}.jpg?v=8`,
    `/cars/_placeholder.svg?v=8`,
  ]);
  const [src, setSrc] = useState(srcs[0]);
  const onError = () => {
    setSrcs((prev) => {
      const [, ...rest] = prev;
      setSrc(rest[0] || `/cars/_placeholder.svg?v=8`);
      return rest;
    });
  };
  return (
    <div className="car-image-wrap">
      <img src={src} alt={alt} loading="lazy" onError={onError} />
    </div>
  );
}

/* Sidebar + Drawer מובייל */
function Sidebar({ active, setActive, counts, open, setOpen }) {
  const items = [
    ["חשמלי", "⚡️"],
    ["היברידי", "♻️"],
    ["בנזין", "⛽️"],
    ["יוקרה", "⭐️"],
  ];
  const Menu = (
    <nav className="side-nav">
      <div className="side-title">קטגוריות</div>
      {items.map(([key, ico]) => (
        <button
          key={key}
          className={`side-item ${active === key ? "active" : ""}`}
          onClick={() => {
            setActive(key);
            setOpen?.(false);
          }}
        >
          <span className="side-ico">{ico}</span>
          <span className="side-text">{key}</span>
          <span className="side-count">{counts[key] || 0}</span>
        </button>
      ))}
    </nav>
  );
  return (
    <>
      <aside className="side desktop">{Menu}</aside>
      <div className={`drawer ${open ? "open" : ""}`}>
        <div className="drawer-panel">
          <button className="drawer-close" onClick={() => setOpen(false)}>
            ✕
          </button>
          {Menu}
        </div>
        <div className="drawer-backdrop" onClick={() => setOpen(false)} />
      </div>
    </>
  );
}

/* כרטיס קטגוריה לדף הבית */
function CategoryCard({ label, count, onClick, emoji }) {
  return (
    <button className="cat-card" onClick={onClick}>
      <div className="cat-emoji">{emoji}</div>
      <div className="cat-title">{label}</div>
      <div className="cat-count">{count} דגמים</div>
    </button>
  );
}

/* מחשבון מימון */
function FinanceCalculator() {
  const [plan, setPlan] = useState("standard");
  const [price, setPrice] = useState(150000);
  const [down, setDown] = useState(30000);
  const [months, setMonths] = useState(60);

  const per = useMemo(
    () => Math.round(monthlyPayment({ price, down, months: plan === "balloon" ? 60 : months, plan })),
    [price, down, months, plan]
  );
  const balloon = plan === "balloon" ? Math.round(price * BALLOON_FRAC) : 0;

  return (
    <div className="card finance">
      <div className="title">מחשבוני מימון</div>
      <div className="plans">
        <button className={plan === "standard" ? "active" : ""} onClick={() => setPlan("standard")}>
          רגיל
        </button>
        <button className={plan === "balloon" ? "active" : ""} onClick={() => setPlan("balloon")}>
          בלון (50%/60ח׳)
        </button>
      </div>
      <div className="grid2">
        <div className="form">
          <label>
            מחיר
            <input type="number" value={price} onChange={(e) => setPrice(+e.target.value || 0)} />
          </label>
          <label>
            מקדמה
            <input type="number" value={down} onChange={(e) => setDown(+e.target.value || 0)} />
          </label>
          <label>
            חודשים {plan === "balloon" ? "— 60 קבוע" : ""}
            <input
              type="range"
              min="12"
              max="96"
              step="12"
              disabled={plan === "balloon"}
              value={months}
              onChange={(e) => setMonths(+e.target.value)}
            />
            <div className="hint">{plan === "balloon" ? 60 : months} ח׳</div>
          </label>
          <div className="summary">
            <div>
              <span>חודשי משוער:</span>
              <b>{fmt(per)}</b>
            </div>
            <div>
              <span>סכום מימון:</span>
              <b>{fmt(Math.max(0, price - down))}</b>
            </div>
            {plan === "balloon" && (
              <div>
                <span>בלון סוף תקופה (50%):</span>
                <b>{fmt(balloon)}</b>
              </div>
            )}
          </div>
        </div>
        <ul className="notes">
          <li>החישוב להמחשה בלבד.</li>
          <li>
            תנאי המימון <b>צמודי מדד</b> ועשויים להשתנות לפי דירוג הלקוח.
          </li>
          <li>מסלול בלון: 60 תשלומים חודשיים + 50% בסוף התקופה.</li>
        </ul>
      </div>
    </div>
  );
}

/* === צ'אט־בוט התאמה === */
function ChatBot({ cars }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [budget, setBudget] = useState(160000);
  const [fuel, setFuel] = useState("לא משנה");
  const [style, setStyle] = useState("לא משנה"); // עירוני/משפחתי/קרוסאובר/SUV/יוקרה
  const [maxMonthly, setMaxMonthly] = useState(0);

  // ניקוד לכל רכב לפי העדפות
  const scored = useMemo(() => {
    const mapStyle = (title) => {
      const t = (title || "").toLowerCase();
      if (/(i10|picanto|aygo|up!|spark)/i.test(t)) return "עירוני";
      if (/(sportage|tucson|kona|x1|x3|q3|q5|rav|yaris cross|cx-5|hr-v|cr-v)/i.test(t)) return "קרוסאובר/SUV";
      // ברירת מחדל
      return "משפחתי";
    };

    return cars
      .filter((c) => !c.sold && (c.km ?? 0) <= 15)
      .map((c) => {
        let score = 0;
        // דלק
        if (fuel === "לא משנה") score += 20;
        else if (c.fuel === fuel || c.category === fuel) score += 20;

        // סגנון
        const st = mapStyle(c.title);
        if (style === "לא משנה") score += 10;
        else if (st === style || (style === "יוקרה" && c.category === "יוקרה")) score += 10;

        // תקציב קרוב → ניקוד גבוה
        const diff = Math.abs((c.price || 0) - (budget || 0));
        score += Math.max(0, 40 - diff / 10000); // כל 10k מוריד נקודה

        // חודשי יעד (אם מולא)
        if (maxMonthly > 0) {
          const m = Math.round(monthlyPayment({ price: c.price, months: 60, plan: "standard" }));
          const mdiff = Math.abs(m - maxMonthly);
          score += Math.max(0, 20 - mdiff / 50);
        }

        // שנה חדשה
        if ((c.year || 0) >= 2024) score += 5;

        return { car: c, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [cars, budget, fuel, style, maxMonthly]);

  const restart = () => {
    setStep(1);
    setBudget(160000);
    setFuel("לא משנה");
    setStyle("לא משנה");
    setMaxMonthly(0);
  };

  return (
    <>
      {/* בועת פתיחה */}
      <button className="chat-launcher" onClick={() => setOpen(true)} aria-label="צ'אט התאמה">
        🤖
      </button>

      {open && (
        <div className="chat">
          <div className="chat-head">
            <div>צ'אט התאמה • R&M</div>
            <button className="icon" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          {step === 1 && (
            <div className="chat-body">
              <div className="q">מה התקציב המשוער לרכב?</div>
              <input
                type="range"
                min="70000"
                max="450000"
                step="5000"
                value={budget}
                onChange={(e) => setBudget(+e.target.value)}
              />
              <div className="hint">תקציב: <b>{fmt(budget)}</b></div>
              <div className="chat-actions">
                <button className="btn primary" onClick={() => setStep(2)}>
                  הבא
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="chat-body">
              <div className="q">דלק מועדף?</div>
              <div className="chips">
                {["לא משנה", "חשמלי", "היברידי", "בנזין", "יוקרה"].map((f) => (
                  <button key={f} className={`chip ${fuel === f ? "on" : ""}`} onClick={() => setFuel(f)}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="chat-actions">
                <button className="btn" onClick={() => setStep(1)}>
                  חזרה
                </button>
                <button className="btn primary" onClick={() => setStep(3)}>
                  הבא
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="chat-body">
              <div className="q">מה הסגנון המתאים?</div>
              <div className="chips">
                {["לא משנה", "עירוני", "משפחתי", "קרוסאובר/SUV", "יוקרה"].map((s) => (
                  <button key={s} className={`chip ${style === s ? "on" : ""}`} onClick={() => setStyle(s)}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="q mt8">יש יעד חודשי? (לא חובה)</div>
              <input
                type="number"
                placeholder="₪ חודשי יעד (למשל 2500)"
                value={maxMonthly || ""}
                onChange={(e) => setMaxMonthly(e.target.value ? +e.target.value : 0)}
              />
              <div className="chat-actions">
                <button className="btn" onClick={() => setStep(2)}>
                  חזרה
                </button>
                <button className="btn primary" onClick={() => setStep(4)}>
                  קבל התאמות
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="chat-body">
              <div className="q">ההתאמות המובילות עבורך</div>
              <div className="rec-list">
                {scored.map(({ car }, i) => {
                  const per = Math.round(monthlyPayment({ price: car.price, months: 60, plan: "standard" }));
                  return (
                    <div key={car.id} className="rec">
                      <div className="idx">{i + 1}</div>
                      <div className="meta">
                        <div className="t">{car.title}</div>
                        <div className="s">
                          {fmt(car.price)} · {car.fuel} · {car.year}
                        </div>
                        <div className="m">חודשי משוער: <b>{fmt(per)}</b></div>
                      </div>
                      <a
                        className="btn sm"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://wa.me/${WA}?text=${encodeURIComponent(
                          `שלום, קיבלתי התאמה מצ'אט הבוט ואני מעוניין ב-${car.title} חדש 0 ק״מ (${car.year}).`
                        )}`}
                      >
                        ווטסאפ
                      </a>
                    </div>
                  );
                })}
                {scored.length === 0 && <div className="muted">אין התאמות כרגע—נסה לשנות פרמטרים.</div>}
              </div>
              <div className="chat-actions">
                <button className="btn" onClick={restart}>התחל מחדש</button>
                <button className="btn primary" onClick={() => setOpen(false)}>סגור</button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ================= אפליקציה ================= */
export default function App() {
  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.title = "R&M מוטורס — חדש 0 ק״מ";
  }, []);

  const [cars, setCars] = useState([]);
  const [activeTab, setActiveTab] = useState(null); // דף הבית: קטגוריות בלבד
  const [drawerOpen, setDrawerOpen] = useState(false);

  // טען מלאי
  useEffect(() => {
    parseCSV("/inventory.csv")
      .then(setCars)
      .catch(() => {
        // Fallback מינימלי אם אין CSV עדיין
        setCars([
          { id: "1", title: "Tesla Model 3", year: 2025, price: 189900, fuel: "חשמלי", category: "חשמלי", slug: "tesla-model-3", highlights: ["טעינה מהירה", "0 ק״מ"] },
          { id: "2", title: "Hyundai Tucson Hybrid", year: 2025, price: 199900, fuel: "היברידי", category: "היברידי", slug: "hyundai-tucson-hybrid", highlights: ["מאובזר", "0 ק״מ"] },
          { id: "3", title: "Kia Picanto", year: 2025, price: 79900, fuel: "בנזין", category: "בנזין", slug: "kia-picanto", highlights: ["עירונית חסכונית"] },
        ]);
      });
  }, []);

  const counts = useMemo(
    () => ({
      חשמלי: cars.filter((c) => c.category === "חשמלי").length,
      היברידי: cars.filter((c) => c.category === "היברידי").length,
      בנזין: cars.filter((c) => c.category === "בנזין").length,
      יוקרה: cars.filter((c) => c.category === "יוקרה").length,
    }),
    [cars]
  );

  const list = useMemo(() => {
    if (!activeTab) return [];
    return cars
      .filter((c) => c.category === activeTab && !c.sold && (c.km ?? 0) <= 15)
      .sort((a, b) => a.price - b.price);
  }, [cars, activeTab]);

  return (
    <div className="site">
      {/* HEADER */}
      <header className="header">
        <div className="container row sb a-center">
          <div className="row g8 a-center">
            <img src="/logo.png?v=9" alt="R&M מוטורס" className="logo" />
            <div>
              <div className="brand">R&amp;M מוטורס — חדש 0 ק״מ</div>
              <div className="sub">שירות פרימיום · מחירים מיוחדים · ליווי מלא</div>
            </div>
          </div>
          <div className="row g8 a-center">
            <button className="btn white only-mobile" onClick={() => setDrawerOpen(true)}>☰ קטגוריות</button>
            <a className="btn outline" href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">ווטסאפ</a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="container grid2 gap32 a-center">
          <div>
            <div className="chip">חדש 0 ק״מ בלבד</div>
            <h1>מוצאים לך <span className="grad">את הדיל המושלם</span> — ורק אז חותמים</h1>
            <p className="muted">מימון מותאם · מחירים מיוחדים · ליווי מלא עד המסירה וגם לאחריה.</p>
            <div className="row g8 mt16">
              <a href="#categories" className="btn primary">לבחירת קטגוריה</a>
              <a href="#finance" className="btn white">מחשבוני מימון</a>
            </div>
            <div className="fine">* תנאי המימון צמודי מדד ועשויים להשתנות לפי דירוג הלקוח.</div>
          </div>
          <div className="hero-visual"><img src="/logo.png?v=9" alt="R&M" /></div>
        </div>
      </section>

      {/* פריסה עם Sidebar */}
      <section className="container layout-with-side">
        <Sidebar active={activeTab ?? "—"} setActive={setActiveTab} counts={counts} open={drawerOpen} setOpen={setDrawerOpen} />

        <div className="layout-main">
          {/* דף הבית: קטגוריות בלבד */}
          {!activeTab && (
            <section id="categories" className="home-cats">
              <h2 className="section-title">בחרו קטגוריה</h2>
              <div className="grid-cats">
                <CategoryCard label="חשמלי" emoji="⚡️" count={counts["חשמלי"]} onClick={() => setActiveTab("חשמלי")} />
                <CategoryCard label="היברידי" emoji="♻️" count={counts["היברידי"]} onClick={() => setActiveTab("היברידי")} />
                <CategoryCard label="בנזין"  emoji="⛽️" count={counts["בנזין"]}   onClick={() => setActiveTab("בנזין")} />
                <CategoryCard label="יוקרה"  emoji="⭐️" count={counts["יוקרה"]}   onClick={() => setActiveTab("יוקרה")} />
              </div>
            </section>
          )}

          {/* אחרי בחירת קטגוריה: דגמים */}
          {activeTab && (
            <>
              <div className="section-head">
                <h2>{activeTab} — דגמים</h2>
                <button className="btn" onClick={() => setActiveTab(null)}>↩︎ חזרה לקטגוריות</button>
              </div>
              <div className="grid3 gap24">
                {list.map((car) => {
                  const per = Math.round(monthlyPayment({ price: car.price, months: 60, plan: "standard" }));
                  return (
                    <div key={car.id} className="car-card">
                      <div className="ribbons">
                        <span className="ribbon dark">{car.category}</span>
                        {!!car.delivery_weeks && <span className="ribbon light">אספקה {car.delivery_weeks} ש׳</span>}
                      </div>
                      <CarImage slug={car.slug} alt={car.title} />
                      <div className="card-body">
                        <div className="title-row">
                          <h3 className="car-title">{car.title}</h3>
                          <div className="price">
                            {car.msrp ? <div className="msrp">{fmt(car.msrp)}</div> : null}
                            <div className="now">{fmt(car.price)}</div>
                            <div className="per">החל מ־<b>{fmt(per)}</b> לחודש</div>
                          </div>
                        </div>
                        <div className="meta"><span>0 ק״מ</span><span>{car.year}</span><span>{car.fuel}</span></div>
                        <ul className="features">{car.highlights?.slice(0, 3).map((h) => <li key={h}>{h}</li>)}</ul>
                        <div className="row g8 mt8">
                          <a
                            className="btn primary flex1"
                            href={`https://wa.me/${WA}?text=${encodeURIComponent(`שלום, מעוניין ב-${car.title} חדש 0 ק״מ (${car.year}). אשמח להצעת מחיר ומסלול מימון.`)}`}
                            target="_blank" rel="noreferrer"
                          >
                            בקשת הצעת מחיר
                          </a>
                          <a className="btn outline" href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">ווטסאפ</a>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {list.length === 0 && <div className="empty">אין דגמים זמינים בקטגוריה זו.</div>}
              </div>
            </>
          )}

          {/* מחשבון */}
          <section id="finance" className="mt16"><FinanceCalculator /></section>
        </div>
      </section>

      {/* צ'אט־בוט התאמה */}
      <ChatBot cars={cars} />

      {/* פוטר */}
      <footer className="footer">
        <div className="container row sb a-center">
          <div className="muted">© {new Date().getFullYear()} R&M מוטורס — חדש 0 ק״מ</div>
          <a className="btn white" href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">דברו איתנו בווטסאפ</a>
        </div>
      </footer>
    </div>
  );
}
