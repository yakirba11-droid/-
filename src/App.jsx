import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

/** ================= קבועים פנימיים (לא מוצגים) ================= */
const APR_DEFAULT = 5.9;      // צמוד מדד, להמחשה בלבד (לא מוצג)
const MONTHS_DEFAULT = 60;
const BALLOON_FRAC = 0.5;     // בלון 50% סוף תקופה

/** ================= עזרי חישוב/פורמט ================= */
const fmt = (n) =>
  isFinite(n)
    ? n.toLocaleString("he-IL", {
        style: "currency",
        currency: "ILS",
        maximumFractionDigits: 0,
      })
    : "—";

const slugify = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

function monthlyPayment({
  price,
  down = 0,
  months = MONTHS_DEFAULT,
  plan = "standard",
  apr = APR_DEFAULT,
}) {
  const P0 = Math.max(0, Number(price || 0) - Number(down || 0));
  const r = apr / 100 / 12;
  if (months <= 0) return 0;
  if (plan === "balloon") {
    const F = BALLOON_FRAC * Number(price || 0);
    if (r === 0) return (P0 - F) / months;
    const den = 1 - Math.pow(1 + r, -months);
    return (r * (P0 - F / Math.pow(1 + r, months))) / den;
  } else {
    if (r === 0) return P0 / months;
    return (P0 * r) / (1 - Math.pow(1 + r, -months));
  }
}

/** ================= תמונת רכב עם Placeholder ================= */
function CarImage({ slug, alt = "" }) {
  const [srcs, setSrcs] = useState([
    `/cars/${slug}.webp?v=4`,
    `/cars/${slug}.png?v=4`,
    `/cars/${slug}.jpg?v=4`,
    `/cars/_placeholder.svg?v=4`,
  ]);
  const [src, setSrc] = useState(srcs[0]);

  const onError = () => {
    setSrcs((prev) => {
      const [, ...rest] = prev;
      setSrc(rest[0] || `/cars/_placeholder.svg?v=4`);
      return rest;
    });
  };

  return (
    <div className="car-image-wrap">
      <img src={src} onError={onError} alt={alt} loading="lazy" />
    </div>
  );
}

/** ================= אייקונים קלים (SVG inline) ================= */
const Icon = {
  Fuel: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path
        d="M7 2h7a1 1 0 0 1 1 1v18H6V3a1 1 0 0 1 1-1zm8 6h2l2 2v8a2 2 0 0 1-2 2h-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 7h3M9 11h3M9 15h3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Gauge: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path d="M21 12a9 9 0 1 0-18 0" fill="none" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M12 12l6-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Cal: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

/** ================= קריאת CSV ================= */
async function parseCSV(url) {
  const full = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
  const res = await fetch(full, { cache: "no-store" });
  const text = await res.text();
  const [header, ...rows] = text.trim().split(/\r?\n/);
  const headers = header.split(",").map((h) => h.trim());
  const lux = ["BMW", "Mercedes", "Audi", "Lexus", "Volvo"];

  const deriveCat = (title, fuel) => {
    if (lux.some((b) => (title || "").includes(b))) return "יוקרה";
    if (fuel === "חשמלי") return "חשמלי";
    if (fuel === "היברידי") return "היברידי";
    return "בנזין";
  };

  return rows
    .filter(Boolean)
    .map((r) => {
      const cols = r
        .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        .map((c) => c.replace(/^"|"$/g, "").trim());
      const obj = {};
      headers.forEach((h, i) => (obj[h] = cols[i]));

      obj.year = Number(obj.year);
      obj.price = Number(obj.price);
      obj.msrp = obj.msrp ? Number(obj.msrp) : null;
      obj.km = Number(obj.km);
      obj.delivery_weeks = obj.delivery_weeks ? Number(obj.delivery_weeks) : null;
      obj.highlights = (obj.highlights || "").split("|").filter(Boolean);
      obj.sold = (obj.sold || "").toLowerCase() === "yes";
      obj.category = obj.category?.length ? obj.category : deriveCat(obj.title, obj.fuel);
      obj.brand = (obj.title || "").split(" ")[0];
      obj.slug = slugify(obj.title || "");
      obj.image = `/cars/${obj.slug}.png?v=4`;
      return obj;
    });
}

/** ================= קומפוננטות עזר ================= */
function LeadForm({ defaultMsg = "", whatsapp = "9725XXXXXXXX" }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState(defaultMsg);
  const submit = (e) => {
    e.preventDefault();
    const text = encodeURIComponent(`שם: ${name}\nטלפון: ${phone}\nהודעה: ${msg}`);
    window.open(`https://wa.me/${whatsapp}?text=${text}`, "_blank");
  };
  return (
    <form onSubmit={submit} className="lead-form">
      <input placeholder="שם מלא" value={name} onChange={(e)=>setName(e.target.value)} required />
      <input placeholder="טלפון" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
      <textarea placeholder="איך נוכל לעזור?" value={msg} onChange={(e)=>setMsg(e.target.value)} />
      <button type="submit">שליחה בווטסאפ</button>
    </form>
  );
}

function FinanceCalculator() {
  const [plan, setPlan] = useState("standard"); // standard | balloon
  const [price, setPrice] = useState(150000);
  const [down, setDown] = useState(30000);
  const [months, setMonths] = useState(60);

  const m = useMemo(() => monthlyPayment({ price, down, months: plan==="balloon"?60:months, plan }), [price, down, months, plan]);
  const financed = Math.max(0, price - down);
  const balloonEnd = plan === "balloon" ? Math.round(price * BALLOON_FRAC) : 0;

  return (
    <div className="card finance">
      <div className="title">מחשבוני מימון</div>
      <div className="plans">
        <button className={plan==="standard"?"active":""} onClick={()=>setPlan("standard")}>רגיל</button>
        <button className={plan==="balloon"?"active":""} onClick={()=>setPlan("balloon")}>בלון (50%/60ח׳)</button>
      </div>

      <div className="grid2">
        <div className="form">
          <label>מחיר הרכב<input type="number" value={price} onChange={(e)=>setPrice(+e.target.value||0)} /></label>
          <label>מקדמה<input type="number" value={down} onChange={(e)=>setDown(+e.target.value||0)} /></label>
          <label>משך (חודשים) {plan==="balloon"?"— 60 קבוע":""}
            <input type="range" min="12" max="96" step="12" disabled={plan==="balloon"} value={months} onChange={(e)=>setMonths(+e.target.value)} />
            <div className="hint">{plan==="balloon"?60:months} ח׳</div>
          </label>

          <div className="summary">
            <div><span>חודשי משוער:</span><b>{fmt(m)}</b></div>
            <div><span>סכום מימון:</span><b>{fmt(financed)}</b></div>
            {plan==="balloon" && <div><span>בלון סוף תקופה (50%):</span><b>{fmt(balloonEnd)}</b></div>}
          </div>
        </div>

        <ul className="notes">
          <li>החישוב להמחשה בלבד.</li>
          <li>תנאי המימון <b>צמודי מדד</b> ועשויים להשתנות לפי דירוג הלקוח.</li>
          <li>מסלול בלון: 60 תשלומים חודשיים + 50% בסוף התקופה.</li>
        </ul>
      </div>
    </div>
  );
}

/** ================= האפליקציה ================= */
export default function App() {
  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.title = "R&M מוטורס — חדש 0 ק״מ";
  }, []);

  const whatsapp = "9725XXXXXXXX"; // ← להחליף למספר שלך
  const [cars, setCars] = useState([]);
  const [activeTab, setActiveTab] = useState("הכל");

  // חיפוש/סינון
  const [query, setQuery] = useState("");
  const [fuel, setFuel] = useState("הכל");
  const [brand, setBrand] = useState("הכל");
  const [sort, setSort] = useState("newest");
  const [maxPrice, setMaxPrice] = useState(0);
  const [maxMonthly, setMaxMonthly] = useState(0);
  const [plan, setPlan] = useState("standard");
  const [months, setMonths] = useState(60);

  // טען CSV
  useEffect(() => {
    parseCSV("/inventory.csv")
      .then(setCars)
      .catch(() => {
        // Fallback דוגמה אם אין CSV
        setCars([
          {
            id: "n1",
            title: "Hyundai Tucson Hybrid",
            year: 2025,
            price: 199900,
            msrp: 209900,
            km: 0,
            gear: "אוטומט",
            fuel: "היברידי",
            color: "לבן",
            delivery_weeks: 2,
            highlights: ["חדש 0 ק״מ", "ליווי עד מסירה", "מחיר מיוחד"],
            sold: false,
            category: "היברידי",
            brand: "Hyundai",
            slug: "hyundai-tucson-hybrid",
          },
        ]);
      });
  }, []);

  const brands = useMemo(
    () => ["הכל", ...Array.from(new Set(cars.map((c) => c.brand).filter(Boolean)))],
    [cars]
  );

  const countsByCat = useMemo(
    () => ({
      הכל: cars.length,
      חשמלי: cars.filter((c) => c.category === "חשמלי").length,
      היברידי: cars.filter((c) => c.category === "היברידי").length,
      בנזין: cars.filter((c) => c.category === "בנזין").length,
      יוקרה: cars.filter((c) => c.category === "יוקרה").length,
    }),
    [cars]
  );

  const maxObservedPrice = useMemo(
    () => (cars.length ? Math.max(...cars.map((c) => c.price || 0)) : 0),
    [cars]
  );

  const maxObservedMonthly = useMemo(() => {
    if (!cars.length) return 0;
    return Math.ceil(
      Math.max(
        ...cars.map((c) =>
          monthlyPayment({
            price: c.price,
            months: plan === "balloon" ? 60 : months,
            plan,
          })
        )
      ) / 10
    ) * 10;
  }, [cars, plan, months]);

  // מסנן
  const filtered = useMemo(() => {
    let items = cars
      .filter((c) => (c.km ?? 0) <= 15 && !c.sold)
      .filter((c) => (activeTab === "הכל" ? true : c.category === activeTab))
      .filter((c) => (query ? `${c.title} ${c.fuel || ""}`.toLowerCase().includes(query.toLowerCase()) : true))
      .filter((c) => (fuel === "הכל" ? true : c.fuel === fuel))
      .filter((c) => (brand === "הכל" ? true : c.brand === brand))
      .filter((c) => (maxPrice > 0 ? Number(c.price) <= maxPrice : true))
      .filter((c) => {
        if (maxMonthly <= 0) return true;
        const m = monthlyPayment({
          price: c.price,
          months: plan === "balloon" ? 60 : months,
          plan,
        });
        return m <= maxMonthly;
      });

    if (sort === "newest") items.sort((a, b) => b.year - a.year);
    if (sort === "price_low") items.sort((a, b) => a.price - b.price);
    if (sort === "price_high") items.sort((a, b) => b.price - a.price);
    return items;
  }, [cars, activeTab, query, fuel, brand, sort, maxPrice, maxMonthly, plan, months]);

  return (
    <div className="site">
      {/* HEADER */}
      <header className="header">
        <div className="container row sb">
          <div className="row g8 a-center">
            <img src="/logo.png?v=5" alt="R&M מוטורס" className="logo" />
            <div>
              <div className="brand">R&amp;M מוטורס — חדש 0 ק״מ</div>
              <div className="sub">שירות פרימיום · מחירים מיוחדים · ליווי מלא</div>
            </div>
          </div>
          <a className="btn outline" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
            ווטסאפ
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="container grid2 gap32 a-center">
          <div>
            <div className="chip">חדש 0 ק״מ בלבד</div>
            <h1>
              מוצאים לך <span className="grad">את הדיל המושלם</span> — ורק אז חותמים
            </h1>
            <p className="muted">
              מחירים מיוחדים מאוד · מימון מותאם · ליווי מלא עד המסירה וגם לאחריה.
            </p>
            <div className="bullets">
              {["0 ק״מ אמיתי", "מימון מותאם", "אספקה מהירה", "שקיפות מלאה"].map((b) => (
                <div key={b} className="bullet">
                  <Icon.Check />
                  <span>{b}</span>
                </div>
              ))}
            </div>
            <div className="row g8 mt16">
              <a href="#inventory" className="btn primary">למלאי</a>
              <a href="#finance" className="btn white">מחשבוני מימון</a>
            </div>
            <div className="fine">* תנאי המימון צמודי מדד ועשויים להשתנות לפי דירוג הלקוח.</div>
          </div>
          <div className="hero-visual">
            <img src="/logo.png?v=5" alt="R&M" />
          </div>
        </div>
      </section>

      {/* טאבים לפי קטגוריה */}
      <section className="tabs">
        <div className="container row wrap g8">
          {["הכל", "חשמלי", "היברידי", "בנזין", "יוקרה"].map((t) => (
            <button
              key={t}
              className={`tab ${activeTab === t ? "active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t} <span className="count">({countsByCat[t] || 0})</span>
            </button>
          ))}
        </div>
      </section>

      {/* סינון + מסלולי תשלום */}
      <section id="inventory" className="filters">
        <div className="container">
          <div className="filter-grid">
            <div className="search">
              <input
                placeholder="חיפוש לפי דגם/דלק…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select value={fuel} onChange={(e) => setFuel(e.target.value)}>
              {["הכל", "בנזין", "דיזל", "היברידי", "חשמלי"].map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select value={brand} onChange={(e) => setBrand(e.target.value)}>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">שנה חדשה קודם</option>
              <option value="price_low">מחיר נמוך קודם</option>
              <option value="price_high">מחיר גבוה קודם</option>
            </select>

            <div className="plan card-mini">
              <div className="label">מסלול</div>
              <div className="row g8">
                <button className={`sm ${plan==="standard"?"active":""}`} onClick={()=>setPlan("standard")}>רגיל</button>
                <button className={`sm ${plan==="balloon"?"active":""}`} onClick={()=>setPlan("balloon")}>בלון 50%/60ח׳</button>
              </div>
            </div>

            <div className="card-mini">
              <div className="label">מס׳ חודשים {plan==="balloon"?"(קבוע 60)":""}</div>
              <input type="range" min="12" max="96" step="12" disabled={plan==="balloon"} value={months} onChange={(e)=>setMonths(+e.target.value)} />
              <div className="hint">{plan==="balloon"?60:months} ח׳</div>
            </div>

            <div className="card-mini">
              <div className="label">תקרת מחיר: {maxPrice>0?fmt(maxPrice):"ללא"}</div>
              <input type="range" min="0" max={maxObservedPrice||400000} step="1000" value={maxPrice} onChange={(e)=>setMaxPrice(+e.target.value)} />
            </div>

            <div className="card-mini">
              <div className="label">תקרת חודשי: {maxMonthly>0?fmt(maxMonthly):"ללא"}</div>
              <input type="range" min="0" max={maxObservedMonthly||5000} step="50" value={maxMonthly} onChange={(e)=>setMaxMonthly(+e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      {/* רשת רכבים */}
      <section className="grid-wrap">
        <div className="container grid3 gap24">
          {filtered.map((car) => {
            const perMonth = Math.round(
              monthlyPayment({
                price: car.price,
                months: plan === "balloon" ? 60 : months,
                plan,
              })
            );
            return (
              <div key={car.id} className="car-card">
                {/* ריבונים */}
                <div className="ribbons">
                  <span className="ribbon dark">{car.category}</span>
                  {!!car.delivery_weeks && (
                    <span className="ribbon light">
                      אספקה {car.delivery_weeks} ש׳
                    </span>
                  )}
                </div>

                <CarImage slug={car.slug} alt={car.title} />

                <div className="card-body">
                  <div className="title-row">
                    <h3 className="car-title">{car.title}</h3>
                    <div className="price">
                      {car.msrp ? (
                        <div className="msrp">{fmt(car.msrp)}</div>
                      ) : null}
                      <div className="now">{fmt(car.price)}</div>
                      <div className="per">
                        החל מ־<b>{fmt(perMonth)}</b> לחודש
                      </div>
                    </div>
                  </div>

                  <div className="meta">
                    <span><Icon.Gauge /> 0 ק״מ</span>
                    <span><Icon.Cal /> {car.year}</span>
                    <span><Icon.Fuel /> {car.fuel}</span>
                  </div>

                  <ul className="features">
                    {car.highlights?.slice(0, 3).map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>

                  <div className="row g8 mt8">
                    <a
                      className="btn primary flex1"
                      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                        `שלום, מעוניין ב-${car.title} חדש 0 ק״מ (${car.year}). אשמח להצעת מחיר ומסלול מימון מתאים.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      בקשת הצעת מחיר
                    </a>
                    <a
                      className="btn outline"
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ווטסאפ
                    </a>
                  </div>

                  <div className="fine mt8">
                    * תנאי המימון צמודי מדד ועשויים להשתנות לפי דירוג הלקוח.
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="empty">אין רכבים זמינים לפי הסינון.</div>
          )}
        </div>
      </section>

      {/* מחשבוני מימון */}
      <section id="finance" className="container">
        <FinanceCalculator />
      </section>

      {/* למה אצלנו / שלבים */}
      <section className="container steps">
        <div className="title">איך זה עובד</div>
        <div className="grid4 gap16">
          {[
            ["שיחה קצרה", "מגדירים תקציב, צורך וסגנון."],
            ["השוואת דילים", "לא חותמים עד שמוצאים את הטוב ביותר."],
            ["מימון מותאם", "רגיל או בלון — מה שמתאים ללקוח."],
            ["מסירה וליווי", "עד המסירה וגם אחרי — משפחת R&M."],
          ].map(([t, d]) => (
            <div key={t} className="step">
              <div className="step-title">{t}</div>
              <div className="muted">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="faq">
        <div className="container">
          <div className="title">שאלות נפוצות</div>
          <details>
            <summary>האם כל הרכבים באמת 0 ק״מ?</summary>
            כן — רק רכבים חדשים 0 ק״מ. חלקם עם נסיעות בדיקה קצרות (עד 15 ק״מ).
          </details>
          <details>
            <summary>מהי ריבית המימון?</summary>
            הריבית הפנימית לחישוב היא 5.9% צמוד מדד — אך בפועל מותאמת פר לקוח. אנחנו לא מציגים ריבית באתר; ההצעה הסופית ניתנת אחרי בדיקת דירוג.
          </details>
          <details>
            <summary>מהו מסלול בלון?</summary>
            60 תשלומים חודשיים + תשלום בלון של 50% משווי הרכב בסוף התקופה.
          </details>
        </div>
      </section>

      {/* פוטר */}
      <footer className="footer">
        <div className="container">
          <div className="row sb a-center">
            <div className="muted">
              © {new Date().getFullYear()} R&M מוטורס — חדש 0 ק״מ. כל הזכויות שמורות.
            </div>
            <a className="btn white" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
              דברו איתנו בווטסאפ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
