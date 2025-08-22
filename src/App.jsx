import { useMemo, useState } from "react";
import "./styles.css";

/** ====== קבועים כלליים ====== */
const WHATSAPP_LINK = "https://wa.me/972501234567?text=שלום%20R%26M%20מוטורס";
const CATEGORIES = [
  { id: "electric", label: "⚡ חשמלי" },
  { id: "ice", label: "⛽ בנזין/דיזל" },
  { id: "hybrid", label: "♻️ היברידי" },
  { id: "luxury", label: "⭐ יוקרה" },
  { id: "commercial", label: "🚚 מסחרי" },
  { id: "contact", label: "✉️ צור קשר" },
  { id: "club", label: "👥 מועדון לקוחות R&M" },
];

/** דוגמאות לרכבים בשביל צ'אט ההתאמה (לכותרות בלבד) */
const CARS = [
  { brand: "Kia", model: "Picanto", cat: "ice", price: 92000 },
  { brand: "Hyundai", model: "i10", cat: "ice", price: 98000 },
  { brand: "Suzuki", model: "Swift", cat: "ice", price: 119000 },
  { brand: "BYD", model: "Dolphin", cat: "electric", price: 139000 },
  { brand: "Tesla", model: "Model 3", cat: "electric", price: 195000 },
  { brand: "Toyota", model: "Corolla Hybrid", cat: "hybrid", price: 151000 },
  { brand: "Volvo", model: "XC60 Recharge", cat: "hybrid", price: 365000 },
  { brand: "Mercedes", model: "GLC 300", cat: "luxury", price: 520000 },
  { brand: "Audi", model: "Q5 45 TFSI", cat: "luxury", price: 485000 },
  { brand: "Renault", model: "Trafic", cat: "commercial", price: 249000 },
];

/** חישוב החזר חודשי – בלי להציג ריבית, ריבית ברירת מחדל פנימית 5.9% (צמוד מדד) */
function monthlyPayment({ price, down, months, balloonEnd = 0, annualRate = 0.059 }) {
  const principal = Math.max(0, (price || 0) - (down || 0));
  const r = annualRate / 12; // לא מוצג, פנימי בלבד
  if (months <= 0 || principal <= 0) return 0;
  // נוכחות בלון: מפחיתים את הערך הנוכחי של סכום הבלון מהקרן
  const pvBalloon = balloonEnd > 0 ? balloonEnd / Math.pow(1 + r, months) : 0;
  const financed = Math.max(0, principal - pvBalloon);
  const pmt = financed * (r / (1 - Math.pow(1 + r, -months)));
  return Math.round(pmt);
}

/** להצגת "החל מ־₪" למסלול בלון 60ח׳ עם בלון 50% */
function fromMonthly(price) {
  const months = 60;
  const balloon = Math.round(price * 0.5);
  return monthlyPayment({ price, down: 0, months, balloonEnd: balloon });
}

/** ====== רכיבי UI ====== */

/** כפתור עגול יוקרתי */
const Pill = ({ children, onClick, variant = "gold", className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`pill pill-${variant} ${className}`}
      type="button"
    >
      {children}
    </button>
  );
};

/** מגירת קטגוריות */
function CategoriesDrawer({ open, onClose }) {
  return (
    <div className={`drawer ${open ? "open" : ""}`} role="dialog" aria-label="קטגוריות">
      <div className="drawer-head">
        <span>קטגוריות</span>
        <button className="icon-btn" onClick={onClose} aria-label="סגור">✕</button>
      </div>
      <div className="drawer-body">
        {CATEGORIES.map(c => (
          <a key={c.id} className="drawer-item" href={`#${c.id}`} onClick={onClose}>
            {c.label}
          </a>
        ))}
      </div>
    </div>
  );
}

/** מודאל טרייד־אין */
function TradeInModal({ open, onClose }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    brand: "",
    model: "",
    plate: "",
    tradein: "לא",
    notes: "",
  });
  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // שליחת הליד – פה תוכל לחבר ל־Zapier/Webhook/Email
    const msg = encodeURIComponent(
      `טופס טרייד־אין חדש:\nשם: ${form.fullName}\nטלפון: ${form.phone}\nאימייל: ${form.email}\nעיר: ${form.city}\nמותג: ${form.brand}\nדגם: ${form.model}\nמס' רישוי: ${form.plate}\nטרייד־אין: ${form.tradein}\nהערות: ${form.notes}`
    );
    window.open(`https://wa.me/972501234567?text=${msg}`, "_blank");
    onClose();
  };

  return (
    <div className={`modal ${open ? "open" : ""}`} role="dialog" aria-label="טופס טרייד־אין">
      <div className="modal-card">
        <div className="modal-head">
          <h3>טופס טרייד־אין</h3>
          <button className="icon-btn" onClick={onClose} aria-label="סגור">✕</button>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <input placeholder="שם מלא" value={form.fullName} onChange={e=>update("fullName", e.target.value)} required />
          <input placeholder="טלפון" value={form.phone} onChange={e=>update("phone", e.target.value)} inputMode="tel" required />
          <input placeholder="אימייל" value={form.email} onChange={e=>update("email", e.target.value)} inputMode="email" />
          <input placeholder="עיר" value={form.city} onChange={e=>update("city", e.target.value)} />
          <input placeholder="מותג רצוי" value={form.brand} onChange={e=>update("brand", e.target.value)} />
          <input placeholder="דגם רצוי" value={form.model} onChange={e=>update("model", e.target.value)} />
          <input placeholder="מס' רישוי" value={form.plate} onChange={e=>update("plate", e.target.value)} />
          <select value={form.tradein} onChange={e=>update("tradein", e.target.value)}>
            <option>לא</option>
            <option>כן</option>
          </select>
          <textarea placeholder="הערות" rows={4} value={form.notes} onChange={e=>update("notes", e.target.value)} />
          <Pill variant="gold" className="w100" >
            שלח אלינו בוואטסאפ
          </Pill>
        </form>
        <p className="muted center">ממלאים פרטים ומקבלים שיחה חוזרת עם הצעה מותאמת אישית.</p>
      </div>
    </div>
  );
}

/** צ'אט התאמה – וויזרד קצר */
function MatchChat() {
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(160000);
  const [useCase, setUseCase] = useState(""); // עירוני/משפחתי/עסקי
  const [prefCat, setPrefCat] = useState(""); // קטגוריה מועדפת

  const results = useMemo(() => {
    let list = CARS;
    if (prefCat) list = list.filter(c => c.cat === prefCat);
    if (budget) list = list.filter(c => c.price <= budget * 1.15); // טווח סביר מעל תקציב
    // הוספת תאמה בסיסית לפי שימוש
    if (useCase === "עסקי") list = list.filter(c => ["commercial","luxury"].includes(c.cat) || c.price >= 180000);
    if (useCase === "משפחתי") list = list.filter(c => c.price >= 110000);
    if (useCase === "עירוני") list = list.filter(c => c.price <= 160000);
    return list.slice(0, 5);
  }, [budget, useCase, prefCat]);

  return (
    <section className="card" id="chat">
      <h2 className="center">מאתר רכב חכם</h2>
      {step === 0 && (
        <div className="chat-block">
          <label>מה התקציב המשוער לרכב?</label>
          <div className="range-wrap">
            <input type="range" min="60000" max="700000" value={budget} onChange={e=>setBudget(+e.target.value)} />
            <div className="range-value">₪ {budget.toLocaleString()}</div>
          </div>
          <Pill onClick={()=>setStep(1)} className="mt16">המשך</Pill>
        </div>
      )}
      {step === 1 && (
        <div className="chat-block">
          <label>לאיזה שימוש עיקרי?</label>
          <div className="chips">
            {["עירוני","משפחתי","עסקי"].map(opt=>(
              <button key={opt} className={`chip ${useCase===opt?"active":""}`} onClick={()=>setUseCase(opt)} type="button">{opt}</button>
            ))}
          </div>
          <Pill onClick={()=>setStep(2)} className="mt16">המשך</Pill>
        </div>
      )}
      {step === 2 && (
        <div className="chat-block">
          <label>האם יש העדפה לקטגוריה?</label>
          <div className="chips">
            {[
              {id:"electric",label:"חשמלי"},
              {id:"hybrid",label:"היברידי"},
              {id:"ice",label:"בנזין/דיזל"},
              {id:"luxury",label:"יוקרה"},
              {id:"commercial",label:"מסחרי"},
            ].map(opt=>(
              <button key={opt.id} className={`chip ${prefCat===opt.id?"active":""}`} onClick={()=>setPrefCat(opt.id)} type="button">{opt.label}</button>
            ))}
          </div>
          <Pill onClick={()=>setStep(3)} className="mt16">הצג התאמות</Pill>
        </div>
      )}
      {step === 3 && (
        <div className="chat-results">
          <h3 className="center">ההתאמות המובילות עבורך</h3>
          <div className="results-list">
            {results.map((c, idx)=>(
              <div key={idx} className="result-row">
                <div className="result-title">{c.brand} {c.model}</div>
                <div className="result-sub">החל מ־ ₪ {fromMonthly(c.price).toLocaleString()} לחודש</div>
                <a className="tiny-pill" href={WHATSAPP_LINK} target="_blank">וואטסאפ</a>
              </div>
            ))}
            {results.length === 0 && <p className="center muted">לא נמצאו התאמות. נסה להגדיל תקציב או לשנות קטגוריה.</p>}
          </div>
          <div className="center mt12">
            <Pill onClick={()=>setStep(0)} variant="dark">התחל מחדש</Pill>
          </div>
        </div>
      )}
    </section>
  );
}

/** מחשבון הלוואה */
function LoanCalculator() {
  const [tab, setTab] = useState("balloon"); // balloon | regular
  const [price, setPrice] = useState(150000);
  const [down, setDown] = useState(30000);
  const [months, setMonths] = useState(60);
  const [balloon, setBalloon] = useState(0); // עד 50% ממחיר הרכב
  const maxBalloon = Math.round(price * 0.5);

  const pay = useMemo(() => {
    return monthlyPayment({
      price,
      down,
      months: tab === "regular" ? Math.min(100, months) : Math.min(60, months),
      balloonEnd: tab === "balloon" ? balloon : 0,
    });
  }, [tab, price, down, months, balloon]);

  return (
    <section className="card" id="calculator">
      <h2 className="center">מחשבון הלוואה</h2>
      <div className="tabs">
        <button className={`tab ${tab==="regular"?"active":""}`} onClick={()=>setTab("regular")} type="button">רגיל (עד 100 ח׳)</button>
        <button className={`tab ${tab==="balloon"?"active":""}`} onClick={()=>setTab("balloon")} type="button">בלון (עד 60 ח׳)</button>
      </div>

      <div className="form-grid">
        <input inputMode="numeric" placeholder="מחיר רכב" value={price} onChange={e=>setPrice(+e.target.value || 0)} />
        <input inputMode="numeric" placeholder="מקדמה" value={down} onChange={e=>setDown(+e.target.value || 0)} />
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

      <div className="summary">
        <div><span className="muted">החזר חודשי משוער:</span> <strong>₪ {pay.toLocaleString()}</strong></div>
        <div><span className="muted">סכום מימון:</span> <strong>₪ {Math.max(0, price - down).toLocaleString()}</strong></div>
      </div>

      <p className="disclaimer">
        * החישוב להמחשה בלבד; ההצעה הסופית תיקבע לאחר בדיקה אישית. תנאי המימון צמודי מדד ועשויים להשתנות לפי דירוג הלקוח.
      </p>

      <div className="center">
        <Pill onClick={()=>window.open(WHATSAPP_LINK,"_blank")}>בקשת הצעת מחיר</Pill>
      </div>
    </section>
  );
}

/** כותרת עליונה */
function TopBar({ onOpenCats, onOpenTradeIn }) {
  return (
    <header className="topbar">
      <Pill variant="dark" onClick={()=>window.open(WHATSAPP_LINK,"_blank")}>וואטסאפ</Pill>
      <div className="brand">
        {/* אפשר לשים כאן <img src="/logo.png" alt="R&M Motors" /> אם העלית קובץ */}
        <div className="brand-title">R&M מוטורס — חדש 0 ק״מ</div>
        <div className="brand-sub">שירות פרימיום · מחירים מיוחדים · ליווי מלא</div>
      </div>
      <Pill variant="light" onClick={onOpenCats} >קטגוריות ☰</Pill>
    </header>
  );
}

/** FOOTER קצר */
function Footer({ onOpenTradeIn }) {
  return (
    <footer className="footer">
      <div className="footer-actions">
        <Pill variant="light" onClick={onOpenTradeIn}>למילוי טופס טרייד־אין</Pill>
        <Pill variant="dark" onClick={()=>window.open(WHATSAPP_LINK,"_blank")}>דברו איתנו בוואטסאפ</Pill>
      </div>
      <div className="foot-note">© {new Date().getFullYear()} R&M מוטורס · חדש 0 ק״מ</div>
    </footer>
  );
}

/** עמוד הבית */
export default function App() {
  const [catsOpen, setCatsOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);

  return (
    <div dir="rtl">
      <TopBar onOpenCats={()=>setCatsOpen(true)} onOpenTradeIn={()=>setTradeOpen(true)} />

      {/* HERO קצר */}
      <section className="hero">
        <div className="hero-badge">חדש 0 ק״מ בלבד</div>
        <h1>מוצאים לך את הדיל המושלם — ורק אז חותמים.</h1>
        <div className="hero-points">
          <span>מימון מותאם</span>
          <span>ליווי מלא עד המסירה וגם לאחריה</span>
          <span>מחירים מיוחדים</span>
        </div>
        <div className="hero-cta">
          <Pill onClick={()=>setTradeOpen(true)} variant="light">פתח טופס טרייד־אין</Pill>
          <Pill onClick={()=>document.getElementById("calculator").scrollIntoView({behavior:"smooth"})}>מחשבון מימון</Pill>
        </div>
      </section>

      {/* מחשבון */}
      <LoanCalculator />

      {/* צ'אט התאמה באמצע הדף */}
      <MatchChat />

      {/* קטגוריות (עוגנים ריקים לצורך ניווט/SEO) */}
      <div id="electric" />
      <div id="ice" />
      <div id="hybrid" />
      <div id="luxury" />
      <div id="commercial" />
      <div id="contact" />
      <div id="club" />

      {/* פוטר */}
      <Footer onOpenTradeIn={()=>setTradeOpen(true)} />

      {/* מגירות/מודאלים */}
      <CategoriesDrawer open={catsOpen} onClose={()=>setCatsOpen(false)} />
      <TradeInModal open={tradeOpen} onClose={()=>setTradeOpen(false)} />
    </div>
  );
}
