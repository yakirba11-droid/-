import StaticCategoriesDrawer from "./components/StaticCategoriesDrawer";

export default function App() {
  const handleSelectCategory = (cat) => {
    // כאן תעשה סינון מלאי לפי הקטגוריה שנבחרה (אופציונלי)
    // setCategory(cat);
    console.log("קטגוריה שנבחרה:", cat);
  };

  return (
    <div dir="rtl">
      <StaticCategoriesDrawer onSelect={handleSelectCategory} />
      {/* ...שאר הדף... */}
      <section id="contact" style={{padding:"80px 16px"}}>טופס צור קשר</section>
      <section id="club" style={{padding:"80px 16px"}}>מועדון לקוחות R&M</section>
    </div>
  );
}import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

/* ===== הגדרות כלליות ===== */
const APR_DEFAULT = 5.9;                // פנימי בלבד לחישוב, לא מוצג
const LISTING_MONTHS = 60;              // ל"החל מ..."
const LISTING_BALLOON_PCT = 0.60;       // פנימי בלבד, לא מוצג
const WA = "972526406728";              // ← החלף למספר ווצאפ (ללא '+')

/* ===== עזרים ===== */
const fmt = (n) =>
  isFinite(n)
    ? n.toLocaleString("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 })
    : "—";

const slugify = (s = "") =>
  s.toLowerCase().normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-+/g, "-").replace(/^-|-$/g, "");

/** חישוב החזר חודשי */
function monthlyPayment({ price, down = 0, months = 60, plan = "standard", balloonAmount = 0 }) {
  const r = APR_DEFAULT / 100 / 12;
  const P0 = Math.max(0, Number(price || 0) - Number(down || 0));
  if (months <= 0) return 0;
  if (plan === "balloon") {
    const den = 1 - Math.pow(1 + r, -months);
    return (r * (P0 - (balloonAmount || 0) / Math.pow(1 + r, months))) / den;
  }
  if (r === 0) return P0 / months;
  return (P0 * r) / (1 - Math.pow(1 + r, -months));
}

/* ===== קריאת מלאי ===== */
async function parseCSV(url) {
  const res = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
  const text = await res.text();
  const [header, ...rows] = text.trim().split(/\r?\n/);
  const headers = header.split(",").map((h) => h.trim());
  const lux = ["BMW", "Mercedes", "Audi", "Lexus", "Volvo", "Porsche", "Jaguar"];

  const guessCat = (title, fuel) => {
    if (lux.some((b) => (title || "").includes(b))) return "יוקרה";
    if (fuel === "חשמלי") return "חשמלי";
    if (fuel === "היברידי") return "היברידי";
    return "בנזין";
  };

  return rows.filter(Boolean).map((r, idx) => {
    const cols = r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
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
    obj.category = obj.category?.length ? obj.category : guessCat(obj.title, obj.fuel);
    obj.highlights = (obj.highlights || "").split("|").filter(Boolean);
    obj.sold = (obj.sold || "").toLowerCase() === "yes";
    obj.slug = slugify(obj.title || "");
    return obj;
  });
}

/* ===== תמונת רכב לבנה עם fallback ===== */
function CarImage({ slug, alt = "" }) {
  const [srcs, setSrcs] = useState([
    `/cars/${slug}.webp`, `/cars/${slug}.png`, `/cars/${slug}.jpg`, `/cars/_placeholder.svg`,
  ]);
  const [src, setSrc] = useState(srcs[0]);
  const onError = () => {
    setSrcs((prev) => {
      const [, ...rest] = prev;
      setSrc(rest[0] || `/cars/_placeholder.svg`);
      return rest;
    });
  };
  return (
    <div className="car-image-wrap" aria-hidden="true">
      <img src={src} alt={alt} onError={onError} loading="lazy" />
    </div>
  );
}

/* ===== Sidebar (דסקטופ) ===== */
function Sidebar({ countsByCat, activeCat, setActiveCat, brands, activeBrand, setActiveBrand }) {
  const cats = ["חשמלי", "היברידי", "בנזין", "יוקרה"];
  return (
    <aside className="side desktop" aria-label="קטגוריות">
      <nav className="side-nav">
        <div className="side-title">קטגוריות</div>
        {cats.map((c) => (
          <button key={c}
            className={`side-item ${activeCat === c ? "active" : ""}`}
            onClick={() => { setActiveCat(c); setActiveBrand(null); }}
            aria-pressed={activeCat === c}>
            <span className="side-ico">•</span>
            <span className="side-text">{c}</span>
            <span className="side-count">{countsByCat[c] || 0}</span>
          </button>
        ))}
        {activeCat && (
          <>
            <div className="side-title" style={{marginTop:8}}>מותגים</div>
            {[...brands].sort().map((b) => (
              <button key={b}
                className={`side-item ${activeBrand === b ? "active" : ""}`}
                onClick={() => setActiveBrand(b)}
                aria-pressed={activeBrand === b}>
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

/* ===== מגירת קטגוריות למובייל – פתיחה/סגירה מתוקנת ===== */
function MobileSide({ open, onClose, ...props }) {
  return (
    <>
      <div className={`drawer ${open ? "open" : ""}`} role="dialog" aria-modal="true">
        <div className="drawer-head">
          <b>קטגוריות</b>
          <button className="icon" onClick={onClose} aria-label="סגור קטגוריות">✕</button>
        </div>
        <Sidebar {...props} />
      </div>
      {open && <div className="backdrop" onClick={onClose} aria-label="סגור" />}
    </>
  );
}

/* ===== מחשבון הלוואה (ללא אזכור ריביות/אחוזים בטקסט) ===== */
function HomeFinance() {
  const [plan, setPlan] = useState("standard"); // "standard" | "balloon"
  const [price, setPrice] = useState(150000);
  const [down, setDown] = useState(30000);
  const [months, setMonths] = useState(60);
  const [balloonAmount, setBalloonAmount] = useState(0);

  const maxMonths = plan === "standard" ? 100 : 60;
  const maxBalloon = Math.round(price * 0.60); // עד 60% — לא מוצג

  useEffect(() => {
    if (plan === "standard") setBalloonAmount(0);
    if (months > maxMonths) setMonths(maxMonths);
    setBalloonAmount((prev) => Math.min(prev, maxBalloon));
  }, [plan, price, months]);

  const m = Math.round(monthlyPayment({ price, down, months, plan, balloonAmount }));

  return (
    <div className="card finance">
      <div className="title">מחשבון הלוואה</div>
      <div className="plans" role="tablist" aria-label="מסלול">
        <button role="tab" aria-selected={plan==="standard"} className={plan==="standard"?"active":""} onClick={()=>setPlan("standard")}>רגיל (עד 100 ח׳)</button>
        <button role="tab" aria-selected={plan==="balloon"} className={plan==="balloon"?"active":""} onClick={()=>setPlan("balloon")}>בלון (עד 60 ח׳)</button>
      </div>

      <div className="grid2">
        <div className="form">
          <label>מחיר רכב<input type="number" value={price} onChange={(e)=>setPrice(+e.target.value||0)} /></label>
          <label>מקדמה<input type="number" value={down} onChange={(e)=>setDown(+e.target.value||0)} /></label>
          <label>מספר חודשים
            <input type="range" min="12" max={maxMonths} step="6" value={months} onChange={(e)=>setMonths(+e.target.value)} />
            <div className="hint">{months} ח׳</div>
          </label>
          {plan==="balloon" && (
            <label>סכום בלון בסוף התקופה
              <input type="range" min="0" max={maxBalloon} step="1000"
                     value={balloonAmount} onChange={(e)=>setBalloonAmount(+e.target.value)} />
              <div className="hint">{fmt(balloonAmount)}</div>
            </label>
          )}
          <div className="summary" aria-live="polite">
            <div><span>החזר חודשי משוער:</span><b>{fmt(m)}</b></div>
            <div><span>סכום מימון:</span><b>{fmt(Math.max(0, price - down))}</b></div>
            {plan==="balloon" && <div><span>בלון לסוף התקופה:</span><b>{fmt(balloonAmount)}</b></div>}
          </div>
          <div className="fine">* החישוב להמחשה בלבד; ההצעה הסופית תיקבע לאחר בדיקה אישית.</div>
        </div>
        <div className="notes">
          <h4>איך זה עובד?</h4>
          <ul>
            <li>מגדירים מחיר, מקדמה ומספר חודשים.</li>
            <li>במסלול בלון: בחירת סכום לסוף התקופה.</li>
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

/* ===== טופס אונליין בסיסי (ליד מיידי) ===== */
function OnlineForm() {
  const [state, setState] = useState({
    fullName: "", phone: "", email: "", city: "",
    wantBrand: "", wantModel: "", license: "",
    tradein: "לא", notes: "",
  });
  const set = (k, v) => setState((s) => ({ ...s, [k]: v }));

  const msg =
`בקשה אונליין – R&M:
שם: ${state.fullName}
טלפון: ${state.phone}
אימייל: ${state.email}
עיר: ${state.city}
רכב רצוי: ${state.wantBrand} ${state.wantModel}
מס' רישוי: ${state.license}
טרייד-אין: ${state.tradein}
הערות: ${state.notes}`.trim();

  return (
    <div className="card">
      <div className="title">טופס אונליין</div>
      <div className="grid2">
        <div className="form">
          <label>שם מלא<input value={state.fullName} onChange={(e)=>set("fullName", e.target.value)} /></label>
          <label>טלפון<input inputMode="tel" value={state.phone} onChange={(e)=>set("phone", e.target.value)} /></label>
          <label>אימייל<input type="email" value={state.email} onChange={(e)=>set("email", e.target.value)} /></label>
          <label>עיר<input value={state.city} onChange={(e)=>set("city", e.target.value)} /></label>
          <label>מותג רצוי<input value={state.wantBrand} onChange={(e)=>set("wantBrand", e.target.value)} /></label>
          <label>דגם רצוי<input value={state.wantModel} onChange={(e)=>set("wantModel", e.target.value)} /></label>
          <label>מס׳ רישוי<input inputMode="numeric" value={state.license} onChange={(e)=>set("license", e.target.value)} /></label>
          <label>טרייד-אין
            <select value={state.tradein} onChange={(e)=>set("tradein", e.target.value)}>
              <option>לא</option><option>כן</option>
            </select>
          </label>
          <label>הערות<textarea rows="3" value={state.notes} onChange={(e)=>set("notes", e.target.value)} /></label>
        </div>
        <div className="notes">
          <p>ממלאים פרטים ומקבלים שיחה חוזרת עם הצעה מותאמת אישית.</p>
          <a className="btn primary mt16" target="_blank" rel="noreferrer"
             href={`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`}>
            שלח אלינו בווטסאפ
          </a>
        </div>
      </div>
    </div>
  );
}

/* ===== עמוד טרייד-אין נפרד ===== */
function TradeInPage({ onBack }) {
  const [s, setS] = useState({
    fullName: "", phone: "", email: "",
    brand: "", model: "", year: "", km: "",
    license: "", condition: "מצב טוב", notes: "",
  });
  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));

  const msg =
`טופס טרייד-אין – R&M:
שם: ${s.fullName}
טלפון: ${s.phone}
אימייל: ${s.email}
מותג/דגם: ${s.brand} ${s.model}
שנה: ${s.year} | ק״מ: ${s.km}
מס׳ רישוי: ${s.license}
מצב רכב: ${s.condition}
הערות: ${s.notes}`.trim();

  return (
    <div className="card">
      <button className="btn" onClick={onBack}>↩︎ חזרה</button>
      <div className="title" style={{marginTop:8}}>טרייד־אין אונליין</div>
      <div className="grid2">
        <div className="form">
          <label>שם מלא<input value={s.fullName} onChange={(e)=>set("fullName", e.target.value)} /></label>
          <label>טלפון<input inputMode="tel" value={s.phone} onChange={(e)=>set("phone", e.target.value)} /></label>
          <label>אימייל<input type="email" value={s.email} onChange={(e)=>set("email", e.target.value)} /></label>
          <label>מותג<input value={s.brand} onChange={(e)=>set("brand", e.target.value)} /></label>
          <label>דגם<input value={s.model} onChange={(e)=>set("model", e.target.value)} /></label>
          <label>שנת ייצור<input inputMode="numeric" value={s.year} onChange={(e)=>set("year", e.target.value)} /></label>
          <label>ק״מ<input inputMode="numeric" value={s.km} onChange={(e)=>set("km", e.target.value)} /></label>
          <label>מס׳ רישוי<input inputMode="numeric" value={s.license} onChange={(e)=>set("license", e.target.value)} /></label>
          <label>מצב רכב
            <select value={s.condition} onChange={(e)=>set("condition", e.target.value)}>
              <option>מצב מצוין</option>
              <option>מצב טוב</option>
              <option>מצב סביר</option>
              <option>צריך טיפול</option>
            </select>
          </label>
          <label>הערות<textarea rows="4" value={s.notes} onChange={(e)=>set("notes", e.target.value)} /></label>
        </div>
        <div className="notes">
          <p>לאחר מילוי הטופס נבצע הערכת שווי מהירה ונחזור אליך עם הצעת עסקה.</p>
          <a className="btn primary mt16" target="_blank" rel="noreferrer"
             href={`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`}>
            שלח את פרטי הטרייד־אין בווטסאפ
          </a>
        </div>
      </div>
    </div>
  );
}

/* ===== "מאתר רכב חכם" (שם חדש לצ׳אט) ===== */
function MatchChatInline({ cars }) {
  const [step, setStep] = useState(1);
  const [budget, setBudget] = useState(160000);
  const [fuel, setFuel] = useState("לא משנה");
  const [style, setStyle] = useState("לא משנה");
  const [maxMonthly, setMaxMonthly] = useState(0);

  const scored = useMemo(() => {
    const mapStyle = (title) => {
      const t = (title || "").toLowerCase();
      if (/(picanto|i10|up!|aygo|swift)/i.test(t)) return "עירוני";
      if (/(sportage|tucson|kona|x1|x3|q3|q5|rav|yaris cross|cx-5|hr-v|cr-v|niro)/i.test(t)) return "קרוסאובר/SUV";
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

        const per = Math.round(
          monthlyPayment({
            price: c.price,
            months: LISTING_MONTHS,
            plan: "balloon",
            balloonAmount: c.price * LISTING_BALLOON_PCT,
          })
        );
        score += Math.max(0, 30 - Math.abs(per - (maxMonthly || per)) / 50);
        score += Math.max(0, 40 - Math.abs((c.price || 0) - budget) / 10000);
        if ((c.year || 0) >= 2024) score += 5;
        return { car: c, per, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [cars, budget, fuel, style, maxMonthly]);

  return (
    <div className="card chat-inline">
      <div className="title">מאתר רכב חכם</div>

      {step === 1 && (
        <div className="chat-body">
          <div className="q">מה התקציב המשוער לרכב?</div>
          <input type="range" min="70000" max="450000" step="5000" value={budget} onChange={(e)=>setBudget(+e.target.value)} />
          <div className="hint">תקציב: <b>{fmt(budget)}</b></div>
          <div className="chat-actions"><button className="btn primary" onClick={()=>setStep(2)}>המשך</button></div>
        </div>
      )}

      {step === 2 && (
        <div className="chat-body">
          <div className="q">דלק מועדף?</div>
          <div className="chips">
            {["לא משנה","חשמלי","היברידי","בנזין","יוקרה"].map((f)=>(
              <button key={f} className={`chip ${fuel===f?"on":""}`} onClick={()=>setFuel(f)}>{f}</button>
            ))}
          </div>
          <div className="chat-actions">
            <button className="btn" onClick={()=>setStep(1)}>חזרה</button>
            <button className="btn primary" onClick={()=>setStep(3)}>המשך</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="chat-body">
          <div className="q">סגנון מתאים?</div>
          <div className="chips">
            {["לא משנה","עירוני","משפחתי","קרוסאובר/SUV","יוקרה"].map((s)=>(
              <button key={s} className={`chip ${style===s?"on":""}`} onClick={()=>setStyle(s)}>{s}</button>
            ))}
          </div>
          <div className="q mt8">יעד חודשי (רשות):</div>
          <input type="number" placeholder="₪ חודשי יעד" value={maxMonthly||""} onChange={(e)=>setMaxMonthly(e.target.value?+e.target.value:0)} />
          <div className="chat-actions">
            <button className="btn" onClick={()=>setStep(2)}>חזרה</button>
            <button className="btn primary" onClick={()=>setStep(4)}>מצא לי</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="chat-body">
          <div className="q">התאמות מובילות עבורך</div>
          <div className="rec-list">
            {scored.map(({ car, per }, i)=>(
              <div key={car.id} className="rec">
                <div className="idx">{i+1}</div>
                <div className="meta">
                  <div className="t">{car.title}</div>
                  <div className="s">{car.fuel} · {car.year}</div>
                  <div className="m">החל מ: <b>{fmt(per)}</b> לחודש</div>
                </div>
                <a className="btn sm" target="_blank" rel="noreferrer"
                   href={`https://wa.me/${WA}?text=${encodeURIComponent(`שלום, קיבלתי התאמה ואני מעוניין ב-${car.title} חדש 0 ק״מ.`)}`}>
                  ווטסאפ
                </a>
              </div>
            ))}
            {scored.length===0 && <div className="muted">אין התאמות — נסו לשנות פרמטרים.</div>}
          </div>
          <div className="chat-actions">
            <button className="btn" onClick={()=>setStep(1)}>התחל מחדש</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== כרטיס דגם ===== */
function CarCard({ car, onOpen }) {
  const perBalloon = Math.round(
    monthlyPayment({
      price: car.price,
      months: LISTING_MONTHS,
      plan: "balloon",
      balloonAmount: car.price * LISTING_BALLOON_PCT,
    })
  );
  return (
    <button className="car-card" onClick={onOpen} aria-label={`פתח ${car.title}`}>
      <CarImage slug={car.slug} alt={car.title} />
      <div className="car-meta">
        <div className="car-t">{car.title}</div>
        <div className="car-s">{car.fuel} · {car.year}</div>
        <div className="car-m">החל מ: <b>{fmt(perBalloon)}</b> לחודש</div>
      </div>
    </button>
  );
}

/* ===== דף פירוט דגם ===== */
function ModelPage({ car, onBack }) {
  const perBalloon = Math.round(
    monthlyPayment({
      price: car.price,
      months: LISTING_MONTHS,
      plan: "balloon",
      balloonAmount: car.price * LISTING_BALLOON_PCT,
    })
  );
  return (
    <div className="card">
      <button className="btn" onClick={onBack}>↩︎ חזרה</button>
      <div className="title" style={{marginTop:8}}>{car.title}</div>
      <CarImage slug={car.slug} alt={car.title} />
      <div className="meta"><span>0 ק״מ</span><span>{car.year}</span><span>{car.fuel}</span></div>
      <ul className="features">{car.highlights?.map((h)=> <li key={h}>{h}</li>)}</ul>
      <div className="summary" style={{marginTop:8}}>
        <div><span>החל מהחזר חודשי (משוער):</span> <b>{fmt(perBalloon)}</b></div>
      </div>
      <a className="btn primary mt16" target="_blank" rel="noreferrer"
         href={`https://wa.me/${WA}?text=${encodeURIComponent(`שלום, מעוניין בפרטים על ${car.title} חדש 0 ק״מ (${car.year}).`)}`}>
        בקשת פרטים בווטסאפ
      </a>
    </div>
  );
}

/* ===== קאטלוג ===== */
function Catalog({ cars, activeCat, setActiveCat, activeBrand, setActiveBrand, onOpenCar }) {
  const brands = useMemo(() => {
    const s = new Set(cars.filter(c => c.category === activeCat).map(c => c.brand));
    return [...s].sort();
  }, [cars, activeCat]);

  const list = cars.filter(c =>
    c.category === activeCat && (!activeBrand || c.brand === activeBrand)
  );

  return (
    <div className="card">
      <div className="title">קטלוג – {activeCat}{activeBrand ? ` / ${activeBrand}` : ""}</div>
      {!activeBrand && (
        <div className="brand-row">
          {brands.map(b => (
            <button key={b} className="chip" onClick={()=>setActiveBrand(b)}>{b}</button>
          ))}
        </div>
      )}
      <div className="grid3">
        {list.map(c => (
          <CarCard key={c.id} car={c} onOpen={()=>onOpenCar(c)} />
        ))}
        {list.length === 0 && <div className="muted">אין דגמים להצגה — בחר מותג אחר.</div>}
      </div>
    </div>
  );
}

/* ===== אפליקציה ===== */
export default function App() {
  useEffect(()=>{ document.documentElement.dir = "rtl"; document.title = "R&M מוטורס — חדש 0 ק״מ"; }, []);
  const [cars, setCars] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [activeBrand, setActiveBrand] = useState(null);
  const [activeCar, setActiveCar] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [route, setRoute] = useState("home"); // "home" | "tradein"

  useEffect(() => { parseCSV("/inventory.csv").then(setCars).catch(()=>setCars([])); }, []);

  const countsByCat = useMemo(() => {
    const m = { חשמלי: 0, היברידי: 0, בנזין: 0, יוקרה: 0 };
    cars.forEach(c => { if (m[c.category] != null) m[c.category]++; });
    return m;
  }, [cars]);

  const brandsInCat = useMemo(() => {
    const s = new Set(cars.filter(c => c.category === activeCat).map(c => c.brand));
    return s;
  }, [cars, activeCat]);

  return (
    <div className="wrap">
      {/* Header */}
      <header className="hdr">
        <button
          className="btn ghost"
          onClick={()=>setDrawer(true)}
          aria-label="פתח קטגוריות">
          ☰ קטגוריות
        </button>
        <a className="btn ghost" target="_blank" rel="noreferrer"
           href={`https://wa.me/${WA}?text=${encodeURIComponent("היי, מעוניין ברכב חדש 0 ק\"מ.")}`}>
          ווטסאפ
        </a>
        <div className="brand">R&M מוטורס — חדש 0 ק״מ</div>
        <div className="muted sm">שירות פרימיום · מחירים מיוחדים · ליווי מלא</div>
      </header>

      {/* מגירת קטגוריות למובייל */}
      <MobileSide
        open={drawer}
        onClose={()=>setDrawer(false)}
        countsByCat={countsByCat}
        activeCat={activeCat}
        setActiveCat={(c)=>{ setActiveCat(c); setActiveBrand(null); setRoute("home"); setDrawer(false); }}
        brands={brandsInCat}
        activeBrand={activeBrand}
        setActiveBrand={(b)=>{ setActiveBrand(b); setRoute("home"); setDrawer(false); }}
      />

      <main className="main">
        {/* Sidebar לדסקטופ */}
        <Sidebar
          countsByCat={countsByCat}
          activeCat={activeCat}
          setActiveCat={(c)=>{ setActiveCat(c); setActiveBrand(null); setRoute("home"); }}
          brands={brandsInCat}
          activeBrand={activeBrand}
          setActiveBrand={setActiveBrand}
        />

        <section className="content">
          {/* ניווט פשוט */}
          {route === "tradein" ? (
            <TradeInPage onBack={()=>setRoute("home")} />
          ) : activeCar ? (
            <ModelPage car={activeCar} onBack={()=>setActiveCar(null)} />
          ) : activeCat ? (
            <Catalog
              cars={cars}
              activeCat={activeCat}
              setActiveCat={setActiveCat}
              activeBrand={activeBrand}
              setActiveBrand={setActiveBrand}
              onOpenCar={setActiveCar}
            />
          ) : (
            <>
              <div className="hero card">
                <span className="badge">חדש 0 ק״מ בלבד</span>
                <h1>רק מה שחשוב: מימון, טרייד־אין ו<strong>מאתר רכב חכם</strong>.</h1>
                <p className="muted">את הרכבים תבחרו דרך הקטגוריות בצד — מסודר ונקי.</p>
                <div className="hero-actions">
                  <button className="btn" onClick={()=>setRoute("tradein")}>פתח טופס טרייד־אין</button>
                </div>
              </div>
              <HomeFinance />
              <MatchChatInline cars={cars} />
              <OnlineForm />
              <div className="card">
                <div className="title">טרייד־אין אונליין</div>
                <p>הערכת שווי מהירה מרחוק וקיזוז בעסקה חדשה. לחץ למילוי טופס מסודר.</p>
                <button className="btn" onClick={()=>setRoute("tradein")}>למילוי טופס טרייד־אין</button>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="ftr">
        <a className="btn ghost" target="_blank" rel="noreferrer"
           href={`https://wa.me/${WA}?text=${encodeURIComponent("שלום, מבקש הצעת מחיר/מימון לרכב חדש 0 ק\"מ.")}`}>
          דברו איתנו בווטסאפ
        </a>
        <div className="muted sm">© 2025 R&M מוטורס · חדש 0 ק״מ</div>
      </footer>
    </div>
  );
}
import { useState, useMemo } from "react";
import CategoriesDrawer from "./components/CategoriesDrawer";
// ...ייבוא המלאי שלך
import inventory from "../public/inventory.json"; // או טעינה מ-CSV אצלך

export default function App() {
  const [category, setCategory] = useState(null);

  // מסנן מלאי לפי הקטגוריה שנבחרה
  const filtered = useMemo(() => {
    if (!category) return inventory;
    return inventory.filter((car) => {
      // נורמליזציה: יש לך field כמו car.category או car.fuel
      const cat = (car.category || car.fuel || "").trim();
      if (category === "בנזין/דיזל") return /בנזין|דיזל/i.test(cat);
      return cat === category;
    });
  }, [category]);

  return (
    <div dir="rtl">
      {/* כפתור + מגירה */}
      <CategoriesDrawer current={category} onSelect={setCategory} />

      {/* ...כותרת/הרואו/מחשבון וכו'... */}

      {/* רשימת המלאי */}
      <section id="inventory" style={{ padding: "16px 12px" }}>
        {!category ? (
          <h2 style={{margin: "6px 0 14px 0"}}>כל הדגמים</h2>
        ) : (
          <h2 style={{margin: "6px 0 14px 0"}}>
            מציג: <span style={{fontWeight:"700"}}>{category}</span>
            <button
              onClick={() => setCategory(null)}
              style={{
                marginInlineStart: 10, border: "1px solid #e5e7eb",
                borderRadius: 10, padding: "2px 8px", background: "#fff"
              }}
            >
              ניקוי סינון
            </button>
          </h2>
        )}

        <div style={{display:"grid", gap: 12}}>
          {filtered.map((car) => (
            <article key={car.id} style={{border:"1px solid #e5e7eb", borderRadius: 14, padding: 12}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <strong>{car.title}</strong>
                <small style={{opacity:.7}}>{car.category || car.fuel}</small>
              </div>
              {/* תמונה */}
              {car.image && (
                <img
                  src={car.image}
                  alt={car.title}
                  style={{width:"100%", borderRadius:12, marginTop:8, background:"#f8fafc"}}
                />
              )}
              {/* מידע נוסף... */}
            </article>
          ))}
        </div>
      </section>

      {/* עוגני ניווט ל"צור קשר" ו"מועדון" */}
      <section id="contact" style={{padding:"52px 16px"}}>…טופס צור קשר…</section>
      <section id="club" style={{padding:"52px 16px"}}>…מועדון לקוחות R&M…</section>
    </div>
  );
}
