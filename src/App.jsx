import { useMemo, useState } from "react";
import "./styles.css";

/* ===== הגדרות כלליות ===== */
const PHONE_HUMAN = "052-640-6728";
const PHONE_INTL = "972526406728";
const WA = (txt="שלום, אשמח להצעה") =>
  `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(txt)}`;

/* נתוני דגמים קצרים לצ'אט ההתאמה (כותרות בלבד) */
const FLEET = [
  // עירוני/מיני
  { brand:"Kia", model:"Picanto", type:"עירוני", fuel:"בנזין/דיזל", msrp: 92000 },
  { brand:"Hyundai", model:"i10", type:"עירוני", fuel:"בנזין/דיזל", msrp: 98000 },
  { brand:"Suzuki", model:"Swift", type:"עירוני", fuel:"בנזין/דיזל", msrp: 119000 },
  // משפחתי/סדאן
  { brand:"Toyota", model:"Corolla Hybrid", type:"משפחתי", fuel:"היברידי", msrp: 151000 },
  { brand:"Hyundai", model:"Elantra", type:"משפחתי", fuel:"בנזין/דיזל", msrp: 148000 },
  // פנאי/קרוסאובר
  { brand:"BYD", model:"Atto 3", type:"פנאי/קרוסאובר", fuel:"חשמלי", msrp: 165000 },
  { brand:"MG", model:"ZS EV", type:"פנאי/קרוסאובר", fuel:"חשמלי", msrp: 145000 },
  { brand:"Mazda", model:"CX-30", type:"פנאי/קרוסאובר", fuel:"בנזין/דיזל", msrp: 169000 },
  // יוקרה
  { brand:"Audi", model:"Q5 45 TFSI", type:"יוקרה", fuel:"בנזין/דיזל", msrp: 485000 },
  { brand:"Mercedes", model:"GLC 300", type:"יוקרה", fuel:"בנזין/דיזל", msrp: 520000 },
  { brand:"Volvo", model:"XC60 Recharge", type:"יוקרה", fuel:"היברידי", msrp: 365000 },
  // מסחרי/טנדר
  { brand:"Renault", model:"Trafic", type:"מסחרי", fuel:"דיזל", msrp: 249000 },
  { brand:"Toyota", model:"Hilux", type:"טנדר", fuel:"דיזל", msrp: 268000 },
  // חשמל מלא
  { brand:"Tesla", model:"Model 3", type:"סדאן", fuel:"חשמלי", msrp: 195000 },
  { brand:"Geely", model:"Geometry C", type:"פנאי/קרוסאובר", fuel:"חשמלי", msrp: 145000 },
];

/* חישוב החזר חודשי: ריבית ברירת מחדל 5.9% פנימית (לא מוצגת) */
function monthlyPayment({ price, down, months, balloonEnd = 0, annualRate = 0.059 }) {
  const principal = Math.max(0, (price || 0) - (down || 0));
  const r = annualRate / 12;
  if (months <= 0 || principal <= 0) return 0;
  const pvBalloon = balloonEnd > 0 ? balloonEnd / Math.pow(1 + r, months) : 0;
  const financed = Math.max(0, principal - pvBalloon);
  const pmt = financed * (r / (1 - Math.pow(1 + r, -months)));
  return Math.round(pmt);
}
/* "החל מ־₪" למסלול בלון 60 ח׳ עם בלון 50% */
const fromMonthly = (price) =>
  monthlyPayment({ price, down: 0, months: 60, balloonEnd: Math.round(price * 0.5) });

/* ===== רכיבי UI ===== */
const Pill = ({ children, onClick, type="button", variant="brand", className="", ariaLabel }) => (
  <button
    type={type}
    onClick={onClick}
    aria-label={ariaLabel}
    className={`pill pill-${variant} ${className}`}
  >
    {children}
  </button>
);

/* כותרת עליונה */
function Header() {
  return (
    <header className="header" role="banner">
      <a className="skip" href="#main">דלג לתוכן</a>
      <div className="logo-wrap" aria-label="R&M מוטורס">
        {/* אם יש קובץ /logo.png, אפשר להחליף ל־img */}
        <div className="logo-mark" aria-hidden>R&M</div>
        <div className="logo-text">
          <div className="t1">R&M מוטורס — חדש 0 ק״מ</div>
          <div className="t2">מתמחים בהתאמת רכב מושלמת ומימון משתלם במיוחד</div>
        </div>
      </div>
      <div className="header-cta">
        <a className="pill pill-light" href={WA("שלום, מעוניין/ת בהצעה")} target="_blank" rel="noreferrer">
          דברו איתי בוואטסאפ
        </a>
        <a className="pill pill-dark" href={`tel:${PHONE_HUMAN.replaceAll("-","")}`} aria-label={`התקשרו ${PHONE_HUMAN}`}>
          התקשרו {PHONE_HUMAN}
        </a>
      </div>
    </header>
  );
}

/* אזור פתיח יוקרתי */
function Hero() {
  return (
    <section className="hero" aria-label="פתיח">
      <div className="hero-badge">חדש 0 ק״מ · ליווי מלא עד ואחרי המסירה</div>
      <h1>אנחנו מוצאים לך את הרכב המושלם — ודואגים למימון המשתלם ביותר.</h1>
      <ul className="hero-points">
        <li>ייעוץ מותאם אישית</li>
        <li>מחירים מיוחדים ויחס VIP</li>
        <li>טופס טרייד־אין אונליין</li>
        <li>אתר נגיש וקל להפעלה</li>
      </ul>
      <div className="hero-actions">
        <a className="pill pill-light" href="#contact">יצירת קשר</a>
        <a className="pill pill-dark" href="#tradein">טרייד־אין</a>
        <a className="pill pill-brand" href="#calculator">מחשבון הלוואה</a>
      </div>
    </section>
  );
}

/* מחשבון הלוואה */
function LoanCalculator() {
  const [tab, setTab] = useState("balloon");    // balloon | regular
  const [price, setPrice] = useState(150000);
  const [down, setDown] = useState(30000);
  const [months, setMonths] = useState(60);
  const [balloon, setBalloon] = useState(0);

  const maxBalloon = Math.round(price * 0.5);
  const pay = useMemo(() => monthlyPayment({
    price,
    down,
    months: tab === "regular" ? Math.min(100, months) : Math.min(60, months),
    balloonEnd: tab === "balloon" ? balloon : 0,
  }), [tab, price, down, months, balloon]);

  return (
    <section className="card" id="calculator" aria-label="מחשבון הלוואה">
      <div className="card-head">
        <h2>מחשבון הלוואה</h2>
        <div className="tabs" role="tablist" aria-label="סוג מסלול">
          <button role="tab" aria-selected={tab==="regular"} className={`tab ${tab==="regular"?"active":""}`} onClick={()=>setTab("regular")}>רגיל (עד 100 ח׳)</button>
          <button role="tab" aria-selected={tab==="balloon"} className={`tab ${tab==="balloon"?"active":""}`} onClick={()=>setTab("balloon")}>בלון (עד 60 ח׳)</button>
        </div>
      </div>

      <div className="form-grid">
        <label className="fld">
          <span>מחיר רכב</span>
          <input inputMode="numeric" value={price} onChange={e=>setPrice(+e.target.value || 0)} aria-label="מחיר רכב" />
        </label>
        <label className="fld">
          <span>מקדמה</span>
          <input inputMode="numeric" value={down} onChange={e=>setDown(+e.target.value || 0)} aria-label="מקדמה" />
        </label>
      </div>

      <label className="lbl">מספר חודשים</label>
      <input type="range" min="6" max={tab==="regular"?100:60} value={months} onChange={e=>setMonths(+e.target.value)} />
      <div className="range-foot">{months} ח׳</div>

      {tab==="balloon" && (
        <>
          <label className="lbl">סכום בלון בסוף התקופה (עד 50% ממחיר הרכב)</label>
          <input type="range" min="0" max={maxBalloon} value={balloon} onChange={e=>setBalloon(+e.target.value)} />
          <div className="range-foot">₪ {balloon.toLocaleString()}</div>
        </>
      )}

      <div className="summary" aria-live="polite">
        <div><span className="muted">החזר חודשי משוער:</span> <strong>₪ {pay.toLocaleString()}</strong></div>
        <div><span className="muted">סכום מימון:</span> <strong>₪ {Math.max(0, price - down).toLocaleString()}</strong></div>
      </div>

      <p className="note">
        * להמחשה בלבד. ההצעה הסופית תיקבע לאחר בדיקה אישית. תנאי המימון צמודי מדד ועשויים להשתנות לפי דירוג הלקוח.
      </p>

      <div className="center">
        <a className="pill pill-brand" href={WA("שלום, מעוניין/ת בהצעה לפי המחשבון")} target="_blank" rel="noreferrer">בקשת הצעה בווטסאפ</a>
      </div>
    </section>
  );
}

/* מאתר רכב חכם */
function SmartMatcher() {
  const [budget, setBudget] = useState(180000);
  const [types, setTypes] = useState(new Set());   // כל סוגי הרכבים
  const [fuel, setFuel]   = useState(new Set());   // חשמלי/היברידי/בנזין/דיזל

  const allTypes = ["עירוני","משפחתי","פנאי/קרוסאובר","סדאן","מנהלים","מסחרי","טנדר","יוקרה"];
  const allFuel  = ["חשמלי","היברידי","בנזין/דיזל","דיזל"];

  const toggle = (set, value) => {
    const s = new Set(set);
    s.has(value) ? s.delete(value) : s.add(value);
    return s;
  };

  const matches = useMemo(() => {
    let list = [...FLEET];
    list = list.filter(c => c.msrp <= Math.max(90000, budget*1.15));
    if (types.size) list = list.filter(c => types.has(c.type));
    if (fuel.size)  list = list.filter(c => fuel.has(c.fuel));
    return list.slice(0, 8);
  }, [budget, types, fuel]);

  return (
    <section className="card" id="smart" aria-label="מאתר רכב חכם">
      <div className="card-head">
        <h2>מאתר רכב חכם</h2>
        <p className="muted">בחרו תקציב וסוגים רלוונטיים — מציגים דגמים מובילים והחזר חודשי <b>החל מ־</b> (מסלול בלון 60 ח׳, בלון 50%).</p>
      </div>

      <label className="lbl">תקציב משוער</label>
      <input type="range" min="60000" max="700000" value={budget} onChange={e=>setBudget(+e.target.value)} />
      <div className="range-foot">₪ {budget.toLocaleString()}</div>

      <div className="chips-wrap">
        <div className="chips-title">סוגי רכבים</div>
        <div className="chips">
          {allTypes.map(t=>(
            <button
              key={t}
              className={`chip ${types.has(t)?"active":""}`}
              onClick={()=>setTypes(prev=>toggle(prev,t))}
              type="button"
            >{t}</button>
          ))}
        </div>
      </div>

      <div className="chips-wrap">
        <div className="chips-title">סוג הנעה</div>
        <div className="chips">
          {allFuel.map(f=>(
            <button
              key={f}
              className={`chip ${fuel.has(f)?"active":""}`}
              onClick={()=>setFuel(prev=>toggle(prev,f))}
              type="button"
            >{f}</button>
          ))}
        </div>
      </div>

      <div className="grid" aria-live="polite">
        {matches.map((c, i)=>(
          <div className="car-card" key={i}>
            <div className="car-title">{c.brand} {c.model}</div>
            <div className="car-sub">{c.type} · {c.fuel}</div>
            <div className="car-price">החל מ־ ₪ {fromMonthly(c.msrp).toLocaleString()} לחודש</div>
            <div className="car-actions">
              <a className="pill pill-light" href={WA(`שלום, מעוניין ב${c.brand} ${c.model}`)} target="_blank" rel="noreferrer">קבלו הצעה</a>
            </div>
          </div>
        ))}
        {matches.length===0 && <p className="center muted">אין התאמות לקריטריונים — נסו להגדיל תקציב או לשנות סוג.</p>}
      </div>
    </section>
  );
}

/* טופס יצירת קשר */
function ContactForm() {
  const [form, setForm] = useState({ name:"", phone:"", email:"", city:"", message:"" });
  const update = (k,v)=>setForm(p=>({...p,[k]:v}));

  const submit = (e) => {
    e.preventDefault();
    const txt = `פרטי קשר:
שם: ${form.name}
טלפון: ${form.phone}
אימייל: ${form.email}
עיר: ${form.city}
הודעה: ${form.message}`;
    window.open(WA(txt), "_blank");
  };

  return (
    <section className="card" id="contact" aria-label="יצירת קשר">
      <div className="card-head">
        <h2>יצירת קשר</h2>
        <p className="muted">נחזור אליך עם הצעה מותאמת אישית — בלי לחץ לחתום, רק כשמצאנו עבורך את הטוב ביותר.</p>
      </div>
      <form className="form-grid" onSubmit={submit}>
        <label className="fld"><span>שם מלא</span><input value={form.name} onChange={e=>update("name", e.target.value)} required /></label>
        <label className="fld"><span>טלפון</span><input inputMode="tel" value={form.phone} onChange={e=>update("phone", e.target.value)} required /></label>
        <label className="fld"><span>אימייל</span><input inputMode="email" value={form.email} onChange={e=>update("email", e.target.value)} /></label>
        <label className="fld"><span>עיר</span><input value={form.city} onChange={e=>update("city", e.target.value)} /></label>
        <label className="fld fld-wide"><span>הודעה</span><textarea rows={4} value={form.message} onChange={e=>update("message", e.target.value)} /></label>
        <div className="fld fld-wide center">
          <Pill variant="brand" type="submit" className="w100">שלחו ונחזור אליכם</Pill>
        </div>
      </form>
    </section>
  );
}

/* טופס טרייד־אין */
function TradeIn() {
  const [form, setForm] = useState({
    fullName:"", phone:"", email:"", city:"",
    brand:"", model:"", plate:"", km:"", year:"", notes:""
  });
  const update=(k,v)=>setForm(p=>({...p,[k]:v}));
  const submit=(e)=>{
    e.preventDefault();
    const txt = `טופס טרייד־אין:
שם: ${form.fullName}
טלפון: ${form.phone}
אימייל: ${form.email}
עיר: ${form.city}
מותג: ${form.brand}
דגם: ${form.model}
מס' רישוי: ${form.plate}
שנה: ${form.year}
ק״מ: ${form.km}
הערות: ${form.notes}`;
    window.open(WA(txt), "_blank");
  };
  return (
    <section className="card" id="tradein" aria-label="טרייד־אין אונליין">
      <div className="card-head">
        <h2>טרייד־אין אונליין</h2>
        <p className="muted">הערכת שווי מהירה מרחוק וקידום בעסקה חדשה — ממלאים טופס מסודר ונחזור עם הצעה.</p>
      </div>
      <form className="form-grid" onSubmit={submit}>
        <label className="fld"><span>שם מלא</span><input value={form.fullName} onChange={e=>update("fullName",e.target.value)} required /></label>
        <label className="fld"><span>טלפון</span><input inputMode="tel" value={form.phone} onChange={e=>update("phone",e.target.value)} required /></label>
        <label className="fld"><span>אימייל</span><input inputMode="email" value={form.email} onChange={e=>update("email",e.target.value)} /></label>
        <label className="fld"><span>עיר</span><input value={form.city} onChange={e=>update("city",e.target.value)} /></label>
        <label className="fld"><span>מותג</span><input value={form.brand} onChange={e=>update("brand",e.target.value)} /></label>
        <label className="fld"><span>דגם</span><input value={form.model} onChange={e=>update("model",e.target.value)} /></label>
        <label className="fld"><span>מס' רישוי</span><input value={form.plate} onChange={e=>update("plate",e.target.value)} /></label>
        <label className="fld"><span>שנת יצור</span><input inputMode="numeric" value={form.year} onChange={e=>update("year",e.target.value)} /></label>
        <label className="fld"><span>ק״מ</span><input inputMode="numeric" value={form.km} onChange={e=>update("km",e.target.value)} /></label>
        <label className="fld fld-wide"><span>הערות</span><textarea rows={3} value={form.notes} onChange={e=>update("notes",e.target.value)} /></label>
        <div className="fld fld-wide center">
          <Pill variant="dark" type="submit" className="w100">שלחו הערכה בווטסאפ</Pill>
        </div>
      </form>
    </section>
  );
}

/* פוטר */
function Footer(){
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-cols">
        <div>
          <div className="logo-mark small">R&M</div>
          <p className="muted">רכב יוקרתי וספורט בהתאמה אישית · מציאת מימון משתלם בתנאים מיוחדים בשוק.</p>
        </div>
        <div className="footer-cta">
          <a className="pill pill-light" href={WA()} target="_blank" rel="noreferrer">ווטסאפ</a>
          <a className="pill pill-dark" href={`tel:${PHONE_HUMAN.replaceAll("-","")}`}>חיוג {PHONE_HUMAN}</a>
        </div>
      </div>
      <div className="foot-note">© {new Date().getFullYear()} R&M מוטורס · כל הזכויות שמורות</div>
    </footer>
  );
}

export default function App(){
  return (
    <div dir="rtl" id="main">
      <Header />
      <Hero />
      <LoanCalculator />
      <SmartMatcher />
      <ContactForm />
      <TradeIn />
      <Footer />
    </div>
  );
}
