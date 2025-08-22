import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

/* ========= קבועים ========= */
const APR_DEFAULT = 5.9;           // צמוד מדד (להמחשה בלבד; לא מוצג)
const WA = "9725XXXXXXXX";         // ← החלף למספר ווטסאפ שלך (ללא +)

/* ========= עזרי תצוגה וחישוב ========= */
const fmt = (n) =>
  isFinite(n)
    ? n.toLocaleString("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 })
    : "—";

const slugify = (s = "") =>
  s.toLowerCase().normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/** תשלום חודשי:
 * plan = "standard" | "balloon"
 * balloonAmount = סכום בלון בש"ח (לא באחוזים)
 */
function monthlyPayment({ price, down = 0, months = 60, plan = "standard", balloonAmount = 0 }) {
  const P0 = Math.max(0, Number(price || 0) - Number(down || 0));
  const r = APR_DEFAULT / 100 / 12;
  if (months <= 0) return 0;

  if (plan === "balloon") {
    const F = Math.max(0, Math.min(balloonAmount || 0, price * 0.5)); // עד 50% מהמחיר
    const den = 1 - Math.pow(1 + r, -months);
    return (r * (P0 - F / Math.pow(1 + r, months))) / den;
  }
  if (r === 0) return P0 / months;
  return (P0 * r) / (1 - Math.pow(1 + r, -months));
}

/* ========= קריאת CSV ========= */
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
    obj.brand = obj.brand || (obj.title || "").split(" ")[0];
    obj.model = obj.model || (obj.title || "").split(" ").slice(1).join(" ");
    obj.year = +obj.year || 2025;
    obj.price = +obj.price || 0;
    obj.fuel = obj.fuel || "";
    obj.km = +obj.km || 0;
    obj.msrp = obj.msrp ? +obj.msrp : null;
    obj.delivery_weeks = obj.delivery_weeks ? +obj.delivery_weeks : null;
    obj.highlights = (obj.highlights || "").split("|").filter(Boolean);
    obj.sold = (obj.sold || "").toLowerCase() === "yes";
    obj.category = obj.category?.length ? obj.category : deriveCat(obj.title, obj.fuel);
    obj.slug = slugify(obj.title || "");
    return obj;
  });
}

/* ========= מדיה לרכב ========= */
function CarImage({ slug, alt = "" }) {
  const [srcs, setSrcs] = useState([
    `/cars/${slug}.webp?v=10`,
    `/cars/${slug}.png?v=10`,
    `/cars/${slug}.jpg?v=10`,
    `/cars/_placeholder.svg?v=10`,
  ]);
  const [src, setSrc] = useState(srcs[0]);
  const onError = () => {
    setSrcs((prev) => {
      const [, ...rest] = prev;
      setSrc(rest[0] || `/cars/_placeholder.svg?v=10`);
      return rest;
    });
  };
  return (
    <div className="car-image-wrap" aria-hidden="true">
      <img src={src} alt={alt} onError={onError} loading="lazy" />
    </div>
  );
}

/* ========= Sidebar קטגוריות ========= */
function Sidebar({ countsByCat, activeCat, setActiveCat, brands, activeBrand, setActiveBrand }) {
  const cats = ["חשמלי", "היברידי", "בנזין", "יוקרה"];
  return (
    <aside className="side desktop" aria-label="ניווט קטגוריות">
      <nav className="side-nav">
        <div className="side-title">קטגוריות</div>
        {cats.map((c) => (
          <button
            key={c}
            className={`side-item ${activeCat === c ? "active" : ""}`}
            onClick={() => {
              setActiveCat(c);
              setActiveBrand(null);
            }}
            aria-pressed={activeCat === c}
          >
            <span className="side-ico">•</span>
            <span className="side-text">{c}</span>
            <span className="side-count">{countsByCat[c] || 0}</span>
          </button>
        ))}
        {activeCat && (
          <>
            <div className="side-title" style={{ marginTop: 8 }}>
              מותגים
            </div>
            {[...brands].sort().map((b) => (
              <button
                key={b}
                className={`side-item ${activeBrand === b ? "active" : ""}`}
                onClick={() => setActiveBrand(b)}
                aria-pressed={activeBrand === b}
              >
                <span className="side-ico">🏷️</span>
                <span className="side-text">{b}</span>
              </button>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}

/* ========= מחשבון הלוואה לדף הבית ========= */
function HomeFinance() {
  const [plan, setPlan] = useState("standard"); // "standard" | "balloon"
  const [price, setPrice] = useState(150000);
  const [down, setDown] = useState(30000);
  const [months, setMonths] = useState(60);
  const [balloonAmount, setBalloonAmount] = useState(0);

  // הגבולות לפי הדרישה
  const maxMonths = plan === "standard" ? 100 : 60;
  const maxBalloon = Math.round(price * 0.5);

  useEffect(() => {
    // אם עברנו לרגיל – נבטל בלון
    if (plan === "standard") setBalloonAmount(0);
    if (months > maxMonths) setMonths(maxMonths);
    // תקן סכום בלון לאחר שינוי מחיר
    setBalloonAmount((prev) => Math.min(prev, maxBalloon));
  }, [plan, price, months]);

  const m = Math.round(
    monthlyPayment({
      price,
      down,
      months,
      plan,
      balloonAmount,
    })
  );

  return (
    <div className="card finance" aria-label="מחשבון הלוואה">
      <div className="title">מחשבון הלוואה</div>
      <div className="plans" role="tablist" aria-label="סוג מסלול">
        <button
          role="tab"
          aria-selected={plan === "standard"}
          className={plan === "standard" ? "active" : ""}
          onClick={() => setPlan("standard")}
        >
          רגיל (עד 100 ח׳)
        </button>
        <button
          role="tab"
          aria-selected={plan === "balloon"}
          className={plan === "balloon" ? "active" : ""}
          onClick={() => setPlan("balloon")}
        >
          בלון (עד 60 ח׳)
        </button>
      </div>

      <div className="grid2">
        <div className="form">
          <label>
            מחיר רכב
            <input type="number" value={price} onChange={(e) => setPrice(+e.target.value || 0)} />
          </label>
          <label>
            מקדמה
            <input type="number" value={down} onChange={(e) => setDown(+e.target.value || 0)} />
          </label>
          <label>
            מספר חודשים
            <input
              type="range"
              min="12"
              max={maxMonths}
              step="6"
              value={months}
              onChange={(e) => setMonths(+e.target.value)}
            />
            <div className="hint">{months} ח׳</div>
          </label>

          {plan === "balloon" && (
            <label>
              סכום בלון בסוף התקופה (עד 50% ממחיר הרכב)
              <input
                type="range"
                min="0"
                max={maxBalloon}
                step="1000"
                value={balloonAmount}
                onChange={(e) => setBalloonAmount(+e.target.value)}
              />
              <div className="hint">{fmt(balloonAmount)}</div>
            </label>
          )}

          <div className="summary" aria-live="polite">
            <div>
              <span>החזר חודשי משוער:</span>
              <b>{fmt(m)}</b>
            </div>
            <div>
              <span>סכום מימון:</span>
              <b>{fmt(Math.max(0, price - down))}</b>
            </div>
            {plan === "balloon" && (
              <div>
                <span>בלון לסוף התקופה:</span>
                <b>{fmt(balloonAmount)}</b>
              </div>
            )}
          </div>

          <div className="fine">
            * החישוב להמחשה בלבד. תנאי המימון <b>צמודי מדד 5.9%</b> ונתונים עשויים להשתנות לפי דירוג הלקוח.
          </div>
        </div>

        <div className="notes">
          <h4>איך זה עובד?</h4>
          <ul>
            <li>מגדירים מחיר, מקדמה ומספר חודשים.</li>
            <li>במסלול בלון: עד 60 ח׳ + בחירת סכום בלון (עד 50% מהמחיר).</li>
            <li>ליווי מלא עד מסירה וגם לאחריה.</li>
          </ul>
          <a className="btn primary mt16" target="_blank" rel="noreferrer"
             href={`https://wa.me/${WA}?text=${encodeURIComponent("שלום, מעוניין בהצעת מימון עבור רכב חדש 0 ק\"מ.")}`}>
            בקשת הצעה בווטסאפ
          </a>
        </div>
      </div>
    </div>
  );
}

/* ========= Trade-in אונליין ========= */
function TradeInCard() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(2019);
  const [km, setKm] = useState(60000);
  const [phone, setPhone] = useState("");

  const link = `https://wa.me/${WA}?text=${encodeURIComponent(
    `שלום, מעוניין בטרייד-אין.\nרכב נוכחי: ${brand} ${model} ${year}\nק״מ: ${km}\nטלפון: ${phone}`
  )}`;

  return (
    <div className="card" aria-label="טופס טרייד אין">
      <div className="title">טרייד-אין אונליין</div>
      <div className="grid2">
        <div className="form">
          <label>מותג<input value={brand} onChange={(e) => setBrand(e.target.value)} /></label>
          <label>דגם<input value={model} onChange={(e) => setModel(e.target.value)} /></label>
          <label>שנת ייצור<input type="number" value={year} onChange={(e) => setYear(+e.target.value)} /></label>
          <label>ק״מ<input type="number" value={km} onChange={(e) => setKm(+e.target.value)} /></label>
          <label>טלפון לחזרה<input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        </div>
        <div className="notes">
          <ul>
            <li>הערכת שווי מהירה מרחוק.</li>
            <li>אפשרות לקיזוז בעסקה חדשה.</li>
            <li>שירות איסוף ואספקה.</li>
          </ul>
          <a className="btn primary mt16" target="_blank" rel="noreferrer" href={link}>שלח פרטי טרייד-אין</a>
        </div>
      </div>
    </div>
  );
}

/* ========= צ׳אט־בוט התאמה ========= */
function MatchChat({ cars }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [budget, setBudget] = useState(160000);
  const [fuel, setFuel] = useState("לא משנה");
  const [style, setStyle] = useState("לא משנה");
  const [maxMonthly, setMaxMonthly] = useState(0);

  const scored = useMemo(() => {
    const mapStyle = (title) => {
      const t = (title || "").toLowerCase();
      if (/(picanto|i10|up!|aygo|spark)/i.test(t)) return "עירוני";
      if (/(sportage|tucson|kona|x1|x3|q3|q5|rav|yaris cross|cx-5|hr-v|cr-v)/i.test(t)) return "קרוסאובר/SUV";
      return "משפחתי";
    };
    return cars
      .filter((c) => !c.sold && (c.km ?? 0) <= 15)
      .map((c) => {
        let score = 0;
        if (fuel === "לא משנה") score += 20;
        else if (c.fuel === fuel || c.category === fuel) score += 20;
        const st = mapStyle(c.title);
        if (style === "לא משנה") score += 10;
        else if (st === style || (style === "יוקרה" && c.category === "יוקרה")) score += 10;
        score += Math.max(0, 40 - Math.abs((c.price || 0) - budget) / 10000);
        if (maxMonthly > 0) {
          const m = Math.round(monthlyPayment({ price: c.price, months: 60, plan: "standard" }));
          score += Math.max(0, 20 - Math.abs(m - maxMonthly) / 50);
        }
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
      <button className="chat-launcher" onClick={() => setOpen(true)} aria-label="צ׳אט התאמה">🤖</button>
      {open && (
        <div className="chat" role="dialog" aria-modal="true" aria-label="צ׳אט התאמה">
          <div className="chat-head">
            <div>צ׳אט התאמה • R&M</div>
            <button className="icon" onClick={() => setOpen(false)}>✕</button>
          </div>

          {step === 1 && (
            <div className="chat-body">
              <div className="q">מה התקציב המשוער לרכב?</div>
              <input type="range" min="70000" max="450000" step="5000" value={budget} onChange={(e) => setBudget(+e.target.value)} />
              <div className="hint">תקציב: <b>{fmt(budget)}</b></div>
              <div className="chat-actions"><button className="btn primary" onClick={() => setStep(2)}>הבא</button></div>
            </div>
          )}

          {step === 2 && (
            <div className="chat-body">
              <div className="q">דלק מועדף?</div>
              <div className="chips">
                {["לא משנה", "חשמלי", "היברידי", "בנזין", "יוקרה"].map((f) => (
                  <button key={f} className={`chip ${fuel === f ? "on" : ""}`} onClick={() => setFuel(f)}>{f}</button>
                ))}
              </div>
              <div className="chat-actions">
                <button className="btn" onClick={() => setStep(1)}>חזרה</button>
                <button className="btn primary" onClick={() => setStep(3)}>הבא</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="chat-body">
              <div className="q">סגנון מתאים?</div>
              <div className="chips">
                {["לא משנה", "עירוני", "משפחתי", "קרוסאובר/SUV", "יוקרה"].map((s) => (
                  <button key={s} className={`chip ${style === s ? "on" : ""}`} onClick={() => setStyle(s)}>{s}</button>
                ))}
              </div>
              <div className="q mt8">יעד חודשי (רשות):</div>
              <input type="number" placeholder="₪ חודשי יעד" value={maxMonthly || ""} onChange={(e) => setMaxMonthly(e.target.value ? +e.target.value : 0)} />
              <div className="chat-actions">
                <button className="btn" onClick={() => setStep(2)}>חזרה</button>
                <button className="btn primary" onClick={() => setStep(4)}>קבל התאמות</button>
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
                        <div className="s">{car.fuel} · {car.year}</div>
                        <div className="m">החל מהחזר חודשי: <b>{fmt(per)}</b></div>
                      </div>
                      <a className="btn sm" target="_blank" rel="noreferrer"
                         href={`https://wa.me/${WA}?text=${encodeURIComponent(`שלום, קיבלתי התאמה מצ׳אט ואני מעוניין ב-${car.title} חדש 0 ק״מ (${car.year}).`)}`}>
                        ווטסאפ
                      </a>
                    </div>
                  );
                })}
                {scored.length === 0 && <div className="muted">אין התאמות כרגע — נסו לשנות פרמטרים.</div>}
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

/* ========= דף פירוט דגם ========= */
function ModelPage({ car, onBack }) {
  const per60 = Math.round(monthlyPayment({ price: car.price, months: 60, plan: "standard" }));
  return (
    <div className="card">
      <button className="btn" onClick={onBack}>↩︎ חזרה לרשימה</button>
      <div className="title" style={{ marginTop: 8 }}>{car.title}</div>
      <CarImage slug={car.slug} alt={car.title} />
      <div className="meta" style={{ marginTop: 8 }}>
        <span>0 ק״מ</span><span>{car.year}</span><span>{car.fuel}</span>
      </div>
      <ul className="features">{car.highlights?.map((h) => <li key={h}>{h}</li>)}</ul>
      <div className="summary" style={{ marginTop: 10 }}>
        <div><span>החל מהחזר חודשי ב-60 ח׳:</span> <b>{fmt(per60)}</b></div>
      </div>
      <div className="row g8 mt16">
        <a className="btn primary" target="_blank" rel="noreferrer"
           href={`https://wa.me/${WA}?text=${encodeURIComponent(`שלום, מעוניין בפרטים על ${car.title} חדש 0 ק״מ (${car.year}).`)}`}>
          בקשת פרטים בווטסאפ
        </a>
      </div>
    </div>
  );
}

/* ========= האפליקציה ========= */
export default function App() {
  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.title = "R&M מוטורס — חדש 0 ק״מ";
  }, []);

  const [cars, setCars] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [activeBrand, setActiveBrand] = useState(null);
  const [activeCar, setActiveCar] = useState(null); // דגם נבחר לדף פירוט

  useEffect(() => {
    parseCSV("/inventory.csv")
      .then(setCars)
      .catch(() =>
        setCars([
          { id: "1", title: "Tesla Model 3", brand: "Tesla", model: "Model 3", year: 2025, price: 189900, fuel: "חשמלי", category: "חשמלי", slug: "tesla-model-3", highlights: ["טעינה מהירה", "טכנולוגיה מתקדמת"] },
          { id: "2", title: "Hyundai Tucson Hybrid", brand: "Hyundai", model: "Tucson Hybrid", year: 2025, price: 199900, fuel: "היברידי", category: "היברידי", slug: "hyundai-tucson-hybrid", highlights: ["מאובזר", "חסכוני"] },
          { id: "3", title: "Kia Picanto", brand: "Kia", model: "Picanto", year: 2025, price: 79900, fuel: "בנזין", category: "בנזין", slug: "kia-picanto", highlights: ["עירונית", "חסכונית"] },
        ])
      );
  }, []);

  const countsByCat = useMemo(
    () => ({
      חשמלי: cars.filter((c) => c.category === "חשמלי").length,
      היברידי: cars.filter((c) => c.category === "היברידי").length,
      בנזין: cars.filter((c) => c.category === "בנזין").length,
      יוקרה: cars.filter((c) => c.category === "יוקרה").length,
    }),
    [cars]
  );

  const brandsInCat = useMemo(() => {
    if (!activeCat) return new Set();
    return new Set(cars.filter((c) => c.category === activeCat).map((c) => c.brand));
  }, [cars, activeCat]);

  const modelsList = useMemo(() => {
    if (!activeCat || !activeBrand) return [];
    return cars
      .filter((c) => c.category === activeCat && c.brand === activeBrand && !c.sold && (c.km ?? 0) <= 15)
      .sort((a, b) => (a.model || a.title).localeCompare(b.model || b.title));
  }, [cars, activeCat, activeBrand]);

  return (
    <div className="site">
      {/* HEADER */}
      <header className="header">
        <div className="container row sb a-center">
          <div className="row g8 a-center">
            <img src="/logo.png?v=11" alt="R&M מוטורס" className="logo" />
            <div>
              <div className="brand">R&amp;M מוטורס — חדש 0 ק״מ</div>
              <div className="sub">שירות פרימיום · מחירים מיוחדים · ליווי מלא</div>
            </div>
          </div>
          <a className="btn outline" href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">ווטסאפ</a>
        </div>
      </header>

      {/* HERO קצר */}
      <section className="hero">
        <div className="container">
          <div className="chip">חדש 0 ק״מ בלבד</div>
          <h1>רק מה שחשוב: מימון, טרייד-אין וצ׳אט התאמה.</h1>
          <p className="muted">את הרכבים תבחרו דרך הקטגוריות בצד — מסודר ונקי.</p>
        </div>
      </section>

      {/* פריסה: Sidebar + Main */}
      <section className="container layout-with-side">
        <Sidebar
          countsByCat={countsByCat}
          activeCat={activeCat}
          setActiveCat={setActiveCat}
          brands={brandsInCat}
          activeBrand={activeBrand}
          setActiveBrand={setActiveBrand}
        />

        <main className="layout-main">
          {/* דף הבית – לא מציג רכבים כלל */}
          {!activeCat && !activeBrand && !activeCar && (
            <>
              <HomeFinance />
              <div className="mt16" />
              <TradeInCard />
            </>
          )}

          {/* רשימת דגמים לפי קטגוריה+מותג */}
          {activeCat && activeBrand && !activeCar && (
            <>
              <div className="section-head">
                <h2>{activeCat} • {activeBrand} — דגמים</h2>
                <div className="row g8">
                  <button className="btn" onClick={() => setActiveBrand(null)}>↩︎ חזרה למותגים</button>
                  <button className="btn" onClick={() => setActiveCat(null)}>↩︎ חזרה לדף הבית</button>
                </div>
              </div>

              <div className="grid3 gap24">
                {modelsList.map((car) => {
                  const per = Math.round(
                    monthlyPayment({ price: car.price, months: 60, plan: "standard" })
                  );
                  return (
                    <div key={car.id} className="car-card" role="article">
                      <CarImage slug={car.slug} alt={car.title} />
                      <div className="card-body">
                        <h3 className="car-title">{car.title}</h3>
                        {/* בלי מחיר! רק החזר חודשי */}
                        <div className="per">החל מהחזר חודשי: <b>{fmt(per)}</b></div>
                        <ul className="features">{car.highlights?.slice(0,3).map((h)=> <li key={h}>{h}</li>)}</ul>
                        <div className="row g8 mt8">
                          <button className="btn primary" onClick={() => setActiveCar(car)}>לפרטים</button>
                          <a className="btn outline" target="_blank" rel="noreferrer"
                             href={`https://wa.me/${WA}?text=${encodeURIComponent(`שלום, מעוניין בפרטים על ${car.title} חדש 0 ק״מ.`)}`}>
                            ווטסאפ
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {modelsList.length === 0 && <div className="empty">אין דגמים למותג זה.</div>}
              </div>
            </>
          )}

          {/* דף פירוט דגם */}
          {activeCar && <ModelPage car={activeCar} onBack={() => setActiveCar(null)} />}

          {/* צ׳אט בוט קבוע בדף */}
          <MatchChat cars={cars} />
        </main>
      </section>

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
