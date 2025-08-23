// src/App.jsx
import { useMemo, useState } from "react";
import "./styles.css";

/* ===== קבועים כלליים ===== */
const PHONE_HUMAN = "052-640-6728";
const PHONE_INTL = "972526406728";
const WA = (txt = "היי, אשמח להצעה") =>
  `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(txt)}`;

/* ===== חישובי החזר (בלי הצגת ריבית ללקוח) ===== */
const ANNUAL_RATE = 0.059; // 5.9% לא להצגה
const r = ANNUAL_RATE / 12;
const currency = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});
function pmt({ price, down = 0, months, balloon = 0 }) {
  const pv = Math.max(0, price - down);
  if (months <= 0) return 0;
  if (r === 0) return (pv - balloon) / months;
  // PMT עם ערך עתידי (בלון)
  const num = r * (pv - balloon / Math.pow(1 + r, months));
  const den = 1 - Math.pow(1 + r, -months);
  return num / den;
}

/* ===== מאגר מודלים לדוגמא (אפשר להרחיב בקלות) ===== */
const MODELS = [
  // עירוני/בנזין־דיזל
  { brand: "Kia", model: "Picanto", type: "עירוני", fuel: "בנזין/דיזל", price: 95000 },
  { brand: "Hyundai", model: "i10", type: "עירוני", fuel: "בנזין/דיזל", price: 98000 },
  { brand: "Suzuki", model: "Swift", type: "עירוני", fuel: "בנזין/דיזל", price: 118000 },
  { brand: "Volkswagen", model: "Golf", type: "עירוני", fuel: "בנזין/דיזל", price: 169000 },
  // משפחתי/סדאן
  { brand: "Toyota", model: "Corolla Hybrid", type: "משפחתי", fuel: "היברידי", price: 162000 },
  { brand: "Hyundai", model: "Elantra", type: "משפחתי", fuel: "בנזין/דיזל", price: 155000 },
  { brand: "Mazda", model: "3", type: "משפחתי", fuel: "בנזין/דיזל", price: 165000 },
  // פנאי/קרוסאובר
  { brand: "BYD", model: "Atto 3", type: "פנאי/קרוסאובר", fuel: "חשמלי", price: 165000 },
  { brand: "MG", model: "ZS EV", type: "פנאי/קרוסאובר", fuel: "חשמלי", price: 145000 },
  { brand: "Mazda", model: "CX-30", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", price: 175000 },
  { brand: "Kia", model: "Sportage", type: "פנאי/קרוסאובר", fuel: "היברידי", price: 205000 },
  { brand: "Hyundai", model: "Tucson", type: "פנאי/קרוסאובר", fuel: "היברידי", price: 199000 },
  { brand: "Skoda", model: "Octavia", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", price: 178000 },
  { brand: "Skoda", model: "Kodiaq", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", price: 235000 },
  { brand: "Volkswagen", model: "Tiguan", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", price: 225000 },
  { brand: "Renault", model: "Captur", type: "פנאי/קרוסאובר", fuel: "היברידי", price: 155000 },
  { brand: "Peugeot", model: "2008", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", price: 145000 },
  // חשמליים פופולריים
  { brand: "Tesla", model: "Model 3", type: "סדאן", fuel: "חשמלי", price: 205000 },
  { brand: "Tesla", model: "Model Y", type: "פנאי/קרוסאובר", fuel: "חשמלי", price: 225000 },
  { brand: "BYD", model: "Dolphin", type: "עירוני", fuel: "חשמלי", price: 129000 },
  { brand: "Geely", model: "Geometry C", type: "פנאי/קרוסאובר", fuel: "חשמלי", price: 155000 },
  { brand: "GWM", model: "Ora", type: "עירוני", fuel: "חשמלי", price: 129000 },
  { brand: "Fiat", model: "500e", type: "עירוני", fuel: "חשמלי", price: 138000 },
  // יוקרה
  { brand: "Audi", model: "Q5 45 TFSI", type: "יוקרה", fuel: "בנזין/דיזל", price: 335000 },
  { brand: "Mercedes", model: "GLC 300", type: "יוקרה", fuel: "בנזין/דיזל", price: 395000 },
  { brand: "Volvo", model: "XC60 Recharge", type: "יוקרה", fuel: "היברידי", price: 365000 },
  { brand: "BMW", model: "X5", type: "יוקרה", fuel: "היברידי", price: 590000 },
  { brand: "Range Rover", model: "Sport", type: "יוקרה", fuel: "היברידי", price: 850000 },
  { brand: "Porsche", model: "Macan", type: "יוקרה", fuel: "בנזין/דיזל", price: 640000 },
  { brand: "Lexus", model: "RX", type: "יוקרה", fuel: "היברידי", price: 420000 },
  { brand: "Genesis", model: "GV70", type: "יוקרה", fuel: "בנזין/דיזל", price: 380000 },
  // מסחרי
  { brand: "Toyota", model: "Proace City", type: "מסחרי", fuel: "בנזין/דיזל", price: 149000 },
  { brand: "Ford", model: "Transit", type: "מסחרי", fuel: "בנזין/דיזל", price: 210000 },
];

/* ===== רכיבי UI קטנים ===== */
const Pill = ({ active, onClick, children, ariaLabel }) => (
  <button
    type="button"
    className={`pill ${active ? "pill--active" : ""}`}
    onClick={onClick}
    aria-pressed={active}
    aria-label={ariaLabel}
  >
    {children}
  </button>
);

const Section = ({ title, subtitle, children, id }) => (
  <section id={id} className="section card">
    <header className="section__head">
      <h2 className="h2">{title}</h2>
      {subtitle && <p className="muted">{subtitle}</p>}
    </header>
    {children}
  </section>
);

/* ===== מחשבון הלוואה ===== */
function LoanCalculator() {
  const [tab, setTab] = useState("balloon"); // 'regular' | 'balloon'
  const [price, setPrice] = useState(150000);
  const [down, setDown] = useState(30000);
  const [monthsRegular, setMonthsRegular] = useState(60); // עד 100
  const [monthsBalloon, setMonthsBalloon] = useState(60); // עד 60
  const maxBalloon = Math.round(price * 0.5);
  const [balloon, setBalloon] = useState(0);

  const monthly = useMemo(() => {
    if (tab === "regular")
      return pmt({ price, down, months: monthsRegular, balloon: 0 });
    return pmt({ price, down, months: monthsBalloon, balloon });
  }, [tab, price, down, monthsRegular, monthsBalloon, balloon]);

  const financeAmount = Math.max(0, price - down);
  const months = tab === "regular" ? monthsRegular : monthsBalloon;

  return (
    <div className="loan">
      <div className="tabs" role="tablist" aria-label="מסלולי מימון">
        <button
          role="tab"
          className={`tab ${tab === "regular" ? "is-active" : ""}`}
          onClick={() => setTab("regular")}
        >
          רגיל (עד 100 ח׳)
        </button>
        <button
          role="tab"
          className={`tab ${tab === "balloon" ? "is-active" : ""}`}
          onClick={() => setTab("balloon")}
        >
          בלון (עד 60 ח׳)
        </button>
      </div>

      <div className="grid">
        <label className="field">
          <span>מחיר רכב</span>
          <input
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(Math.max(0, +e.target.value.replace(/\D/g, "")))}
            aria-label="מחיר הרכב"
          />
        </label>

        <label className="field">
          <span>מקדמה</span>
          <input
            inputMode="numeric"
            value={down}
            onChange={(e) =>
              setDown(Math.min(price, Math.max(0, +e.target.value.replace(/\D/g, ""))))
            }
            aria-label="סכום מקדמה"
          />
        </label>
      </div>

      <div className="field">
        <div className="row space-between">
          <span>מס׳ חודשים</span>
          <span className="muted">{months} ח׳</span>
        </div>
        <input
          type="range"
          min="6"
          max={tab === "regular" ? 100 : 60}
          step="1"
          value={months}
          onChange={(e) =>
            tab === "regular"
              ? setMonthsRegular(+e.target.value)
              : setMonthsBalloon(+e.target.value)
          }
          aria-label="מספר החודשים"
        />
      </div>

      {tab === "balloon" && (
        <div className="field">
          <div className="row space-between">
            <span>סכום בלון בסוף התקופה</span>
            <span className="muted">{currency.format(balloon)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={maxBalloon}
            step="500"
            value={balloon}
            onChange={(e) => setBalloon(Math.min(maxBalloon, +e.target.value))}
            aria-label="סכום בלון"
          />
          <div className="tip">ניתן לבחור כל סכום עד {currency.format(maxBalloon)}.</div>
        </div>
      )}

      <div className="result card--soft">
        <div className="result__item">
          <div className="muted">החזר חודשי משוער:</div>
          <div className="result__value">{currency.format(monthly)}</div>
        </div>
        <div className="result__item">
          <div className="muted">סכום מימון:</div>
          <div className="result__value">{currency.format(financeAmount)}</div>
        </div>
        {tab === "balloon" && (
          <div className="result__item">
            <div className="muted">יתרת בלון בסוף התקופה:</div>
            <div className="result__value">{currency.format(balloon)}</div>
          </div>
        )}
      </div>

      <p className="tiny muted">
        * החישוב להמחשה בלבד; הצעה סופית תיקבע לאחר בדיקה אישית. אין לראות בתוצאה התחייבות.
      </p>

      <div className="row gap">
        <a className="btn" href={WA("מעוניין בהצעה לפי החישוב שביצעתי באתר")}>
          בקשת הצעה בווטסאפ
        </a>
        <a className="btn btn--ghost" href={`tel:${PHONE_HUMAN.replaceAll("-", "")}`}>
          חייגו {PHONE_HUMAN}
        </a>
      </div>
    </div>
  );
}

/* ===== “מאתר רכב חכם” – צ׳אט קצר להתאמה ===== */
function SmartMatcher() {
  // צעד 1: תקציב חודשי
  const [step, setStep] = useState(1);
  const [budget, setBudget] = useState(2500);
  const [fuel, setFuel] = useState("הכל");
  const [type, setType] = useState("הכל");

  // חישוב התאמות: בלון 60 ח׳ עם יתרה 60% (לא מוצג ללקוח)
  const matches = useMemo(() => {
    const balloonRatio = 0.6; // לא מוצג
    const list = MODELS.filter((m) => {
      const okFuel = fuel === "הכל" || m.fuel === fuel;
      const okType = type === "הכל" || m.type === type;
      return okFuel && okType;
    }).map((m) => {
      const monthly = pmt({
        price: m.price,
        down: 0,
        months: 60,
        balloon: Math.round(m.price * balloonRatio),
      });
      return { ...m, monthly };
    });

    // הגבלה לפי תקציב אם יש התאמות
    const inBudget = list.filter((x) => x.monthly <= budget * 1.02);
    const base = (inBudget.length ? inBudget : list).sort(
      (a, b) => a.monthly - b.monthly
    );
    return base.slice(0, 5);
  }, [budget, fuel, type]);

  return (
    <div className="chat card">
      <div className="chat__head">
        <div className="bot">🤖</div>
        <div>
          <div className="h3 tight">מאתר רכב חכם</div>
          <div className="muted tiny">שאלות קצרות ➜ התאמות מהירות</div>
        </div>
      </div>

      {/* צעד 1 */}
      {step === 1 && (
        <div className="chat__step">
          <div className="q">מה התקציב החודשי המשוער לרכב?</div>
          <div className="field">
            <div className="row space-between">
              <span>תקציב:</span>
              <b>{currency.format(budget)}</b>
            </div>
            <input
              type="range"
              min="1000"
              max="15000"
              step="100"
              value={budget}
              onChange={(e) => setBudget(+e.target.value)}
              aria-label="תקציב חודשי"
            />
          </div>
          <div className="row end">
            <button className="btn" onClick={() => setStep(2)}>
              הבא
            </button>
          </div>
        </div>
      )}

      {/* צעד 2 */}
      {step === 2 && (
        <div className="chat__step">
          <div className="q">העדפת הנעה?</div>
          <div className="row wrap gap">
            {["הכל", "בנזין/דיזל", "היברידי", "חשמלי"].map((f) => (
              <Pill key={f} active={fuel === f} onClick={() => setFuel(f)}>
                {f}
              </Pill>
            ))}
          </div>
          <div className="row space-between">
            <button className="btn btn--ghost" onClick={() => setStep(1)}>
              חזור
            </button>
            <button className="btn" onClick={() => setStep(3)}>
              הבא
            </button>
          </div>
        </div>
      )}

      {/* צעד 3 */}
      {step === 3 && (
        <div className="chat__step">
          <div className="q">איזה סוג רכב תרצו?</div>
          <div className="row wrap gap">
            {[
              "הכל",
              "עירוני",
              "משפחתי",
              "סדאן",
              "פנאי/קרוסאובר",
              "מנהלים",
              "יוקרה",
              "מסחרי",
            ].map((t) => (
              <Pill key={t} active={type === t} onClick={() => setType(t)}>
                {t}
              </Pill>
            ))}
          </div>
          <div className="row space-between">
            <button className="btn btn--ghost" onClick={() => setStep(2)}>
              חזור
            </button>
            <button className="btn" onClick={() => setStep(4)}>
              הצג התאמות
            </button>
          </div>
        </div>
      )}

      {/* תוצאות */}
      {step === 4 && (
        <div className="chat__step">
          <div className="q">ההתאמות הבולטות עבורך:</div>
          <ul className="matches">
            {matches.map((m, i) => (
              <li key={i} className="match card--soft">
                <div className="match__title">
                  {m.brand} {m.model}
                </div>
                <div className="muted tiny">
                  {m.type} · {m.fuel}
                </div>
                <div className="match__monthly">
                  החל מ־{currency.format(m.monthly)} לחודש
                </div>
                <div className="row gap">
                  <a
                    className="btn"
                    href={WA(
                      `שלום, מעניין אותי ${m.brand} ${m.model}. אשמח להצעת מימון ולהמשך תהליך.`
                    )}
                  >
                    קבלו הצעה
                  </a>
                  <a className="btn btn--ghost" href={`tel:${PHONE_HUMAN.replaceAll("-", "")}`}>
                    חייגו {PHONE_HUMAN}
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <div className="row space-between">
            <button className="btn btn--ghost" onClick={() => setStep(3)}>
              חזרה לבחירה
            </button>
            <button className="btn" onClick={() => setStep(1)}>
              התחל מחדש
            </button>
          </div>
          <p className="tiny muted">
            * מוצג רק החזר חודשי משוער. נאתר עבורך את המסלול המשתלם ביותר ונעדכן בהצעה מסודרת.
          </p>
        </div>
      )}
    </div>
  );
}

/* ===== טפסים ===== */
function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    msg: "",
  });
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const send = (e) => {
    e.preventDefault();
    const text = `שם: ${form.name}\nטלפון: ${form.phone}\nמייל: ${form.email}\nעיר: ${form.city}\nהודעה: ${form.msg}`;
    window.open(WA(`בקשת יצירת קשר:\n${text}`), "_blank");
  };

  return (
    <form className="form card" onSubmit={send} aria-label="טופס יצירת קשר">
      <h3 className="h3">יצירת קשר</h3>
      <p className="muted">
        נחזור אליך עם הצעה מותאמת אישית — רק כשנמצא עבורך את הטוב ביותר.
      </p>
      <div className="grid">
        <label className="field">
          <span>שם מלא</span>
          <input value={form.name} onChange={on("name")} required />
        </label>
        <label className="field">
          <span>טלפון</span>
          <input
            value={form.phone}
            onChange={on("phone")}
            required
            inputMode="tel"
            pattern="[\d\- ]+"
          />
        </label>
        <label className="field">
          <span>אימייל</span>
          <input type="email" value={form.email} onChange={on("email")} />
        </label>
        <label className="field">
          <span>עיר</span>
          <input value={form.city} onChange={on("city")} />
        </label>
      </div>
      <label className="field">
        <span>הודעה</span>
        <textarea rows="3" value={form.msg} onChange={on("msg")} />
      </label>
      <button className="btn" type="submit">
        שלחו ונחזור אליכם
      </button>
    </form>
  );
}

function TradeInForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    brand: "",
    model: "",
    license: "",
    year: "",
    km: "",
    notes: "",
    photos: [],
  });
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const send = (e) => {
    e.preventDefault();
    const text = `טופס טרייד־אין\nשם: ${form.name}\nטלפון: ${form.phone}\nאימייל: ${form.email}\nעיר: ${form.city}\nמותג: ${form.brand}\nדגם: ${form.model}\nמס׳ רישוי: ${form.license}\nשנת יצור: ${form.year}\nק״מ: ${form.km}\nהערות: ${form.notes}\n(נשלחו/יישלחו תמונות בהודעת המשך)`;
    window.open(WA(text), "_blank");
  };

  return (
    <form className="form card" onSubmit={send} aria-label="טופס טרייד־אין">
      <h3 className="h3">טרייד־אין אונליין</h3>
      <p className="muted">
        הערכת שווי מהירה מרחוק וקידום בעסקה חדשה — ממלאים פרטים ומצרפים תמונות.
      </p>
      <div className="grid">
        <label className="field">
          <span>שם מלא</span>
          <input value={form.name} onChange={on("name")} required />
        </label>
        <label className="field">
          <span>טלפון</span>
          <input
            value={form.phone}
            onChange={on("phone")}
            required
            inputMode="tel"
            pattern="[\d\- ]+"
          />
        </label>
        <label className="field">
          <span>אימייל</span>
          <input type="email" value={form.email} onChange={on("email")} />
        </label>
        <label className="field">
          <span>עיר</span>
          <input value={form.city} onChange={on("city")} />
        </label>
        <label className="field">
          <span>מותג</span>
          <input value={form.brand} onChange={on("brand")} />
        </label>
        <label className="field">
          <span>דגם</span>
          <input value={form.model} onChange={on("model")} />
        </label>
        <label className="field">
          <span>מס׳ רישוי</span>
          <input value={form.license} onChange={on("license")} />
        </label>
        <label className="field">
          <span>שנת יצור</span>
          <input inputMode="numeric" value={form.year} onChange={on("year")} />
        </label>
        <label className="field">
          <span>ק״מ</span>
          <input inputMode="numeric" value={form.km} onChange={on("km")} />
        </label>
      </div>
      <label className="field">
        <span>הערות</span>
        <textarea rows="3" value={form.notes} onChange={on("notes")} />
      </label>
      <label className="field">
        <span>תמונות הרכב</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setForm({ ...form, photos: [...e.target.files] })}
        />
        <div className="tiny muted">את התמונות נצרף/נשלח בהודעת ווטסאפ המשך.</div>
      </label>
      <button className="btn" type="submit">
        שלחו הערכה בווטסאפ
      </button>
    </form>
  );
}

/* ===== אפליקציה ===== */
export default function App() {
  return (
    <div className="app" dir="rtl">
      {/* עליון דביק */}
      <div className="topbar">
        <a className="brand" href="#hero" aria-label="R&M בית">
          R&M
        </a>
        <a className="btn btn--call" href={`tel:${PHONE_HUMAN.replaceAll("-", "")}`}>
          חייגו {PHONE_HUMAN}
        </a>
        <a className="btn btn--ghost" href={WA()}>
          דברו איתי בווטסאפ
        </a>
      </div>

      {/* גיבור */}
      <header id="hero" className="hero card hero--gradient" role="banner">
        <h1 className="h1">
          R&amp;M רכבי יוקרה וספורט בהתאמה אישית
        </h1>
        <p className="lead">
          מתמחים בכל סוגי הרכבים החדשים · מציאת מימון משתלם במיוחד · ליווי מלא עד
          המסירה וגם לאחריה.
        </p>
      </header>

      {/* סיפור קצר עלינו */}
      <Section
        title="מי אנחנו"
        subtitle="יחס VIP, שקיפות מלאה ומיקוד בתוצאה: רכב שמתאים לך ומימון שנוח לך."
        id="about"
      >
        <ul className="bullets">
          <li>מוצאים לך את הרכב המתאים – רק אז חותמים.</li>
          <li>בדיקת מימון רחבה מול בנקים וחברות – עד שמוצאים את המסלול המשתלם ביותר.</li>
          <li>ליווי יד ביד עד המסירה, וגם אחרי – מצטרפים למשפחת R&amp;M.</li>
        </ul>
      </Section>

      {/* מחשבון הלוואה */}
      <Section
        id="loan"
        title="מחשבון הלוואה"
        subtitle="בחרו מסלול, הזינו מחיר ומקדמה ושחקו במספר התשלומים. במסלול בלון בוחרים סכום בלון — עד 50% ממחיר הרכב."
      >
        <LoanCalculator />
      </Section>

      {/* מאתר חכם כצ׳אט */}
      <Section
        id="smart"
        title="מאתר רכב חכם"
        subtitle="צ׳אט קצר שמחזיר התאמות עם החזר חודשי משוער – כדי להתחיל ממדויק."
      >
        <SmartMatcher />
      </Section>

      {/* יצירת קשר + טרייד־אין */}
      <div className="grid2">
        <ContactForm />
        <TradeInForm />
      </div>

      {/* פוטר */}
      <footer className="footer card">
        <div className="foot-brand">R&amp;M</div>
        <p className="muted">
          רכבי יוקרה וספורט בהתאמה אישית · מציאת מימון משתלם בתנאים מיוחדים.
        </p>
        <div className="row gap">
          <a className="btn" href={WA("שלום, אשמח להצעה מותאמת אישית")}>
            ווטסאפ
          </a>
          <a className="btn btn--ghost" href={`tel:${PHONE_HUMAN.replaceAll("-", "")}`}>
            חייגו {PHONE_HUMAN}
          </a>
        </div>
        <div className="tiny muted">© R&amp;M מוטורס 2025 · כל הזכויות שמורות</div>
      </footer>
    </div>
  );
}
