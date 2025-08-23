import { useMemo, useState } from "react";
import "./styles.css";

/* ===== הגדרות כלליות ===== */
const PHONE_HUMAN = "052-640-6728";
const PHONE_INTL = "972526406728";
const WA = (txt = "שלום, אשמח לשוחח") =>
  `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(txt)}`;

/* ריבית פנימית לחישוב בלבד (לא מוצגת) */
const APR = 0.059;

/* עזרי חישוב */
const fmt = (n) =>
  n.toLocaleString("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });

/* החזר חודשי רגיל */
function pmt({ principal, months, apr = APR }) {
  const r = apr / 12;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

/* החזר חודשי במסלול בלון (ללא הצגת אחוזים למשתמש) */
function pmtBalloon({ price, down, months, balloonAmount, apr = APR }) {
  const financed = Math.max(0, price - down - 0); // בסיס
  const r = apr / 12;
  const f = Math.pow(1 + r, months);
  // לוקחים הלוואה על כל הסכום הממומן, ובסוף משלמים "סכום בלון"
  const monthly = (financed * r * f - balloonAmount * r) / (f - 1);
  return Math.max(0, monthly);
}

/* ====== מלאי דמו (בר־הרחבה) ======
   שדות: brand, model, year, body, seats, power, luxury, msrp
   (אפשר להעתיק שורות ולהגדיל – הבוט כבר יודע לסנן) */
const INVENTORY = [
  // עירוני/משפחתי
  { brand: "Toyota", model: "Corolla Hybrid", year: 2025, body: "משפחתי", seats: 5, power: "היברידי", luxury: false, msrp: 155000 },
  { brand: "Hyundai", model: "Elantra", year: 2025, body: "משפחתי", seats: 5, power: "בנזין/דיזל", luxury: false, msrp: 142000 },
  { brand: "Kia", model: "Picanto", year: 2025, body: "עירוני", seats: 5, power: "בנזין/דיזל", luxury: false, msrp: 88500 },
  { brand: "Mazda", model: "CX-30", year: 2025, body: "פנאי/קרוסאובר", seats: 5, power: "בנזין/דיזל", luxury: false, msrp: 175000 },
  { brand: "Skoda", model: "Kodiaq", year: 2025, body: "פנאי/קרוסאובר", seats: 7, power: "בנזין/דיזל", luxury: false, msrp: 240000 },
  { brand: "BYD", model: "Atto 3", year: 2025, body: "פנאי/קרוסאובר", seats: 5, power: "חשמלי", luxury: false, msrp: 165000 },
  { brand: "MG", model: "ZS EV", year: 2025, body: "פנאי/קרוסאובר", seats: 5, power: "חשמלי", luxury: false, msrp: 149000 },
  { brand: "Volkswagen", model: "Golf", year: 2025, body: "עירוני", seats: 5, power: "בנזין/דיזל", luxury: false, msrp: 185000 },
  { brand: "Peugeot", model: "5008", year: 2025, body: "פנאי/קרוסאובר", seats: 7, power: "בנזין/דיזל", luxury: false, msrp: 235000 },

  // מנהלים/יוקרה
  { brand: "Audi", model: "Q5 45 TFSI", year: 2025, body: "פנאי/קרוסאובר", seats: 5, power: "בנזין/דיזל", luxury: true, msrp: 375000 },
  { brand: "Mercedes", model: "GLC 300", year: 2025, body: "פנאי/קרוסאובר", seats: 5, power: "בנזין/דיזל", luxury: true, msrp: 455000 },
  { brand: "BMW", model: "X5 40i", year: 2025, body: "פנאי/קרוסאובר", seats: 7, power: "בנזין/דיזל", luxury: true, msrp: 650000 },
  { brand: "Volvo", model: "XC60 Recharge", year: 2025, body: "פנאי/קרוסאובר", seats: 5, power: "היברידי", luxury: true, msrp: 420000 },
  { brand: "Tesla", model: "Model 3", year: 2025, body: "סדאן", seats: 5, power: "חשמלי", luxury: true, msrp: 199000 },
  { brand: "Porsche", model: "Cayenne", year: 2025, body: "פנאי/קרוסאובר", seats: 5, power: "בנזין/דיזל", luxury: true, msrp: 900000 },

  // טנדר/מסחרי/7+
  { brand: "Toyota", model: "Hilux", year: 2025, body: "טנדר", seats: 5, power: "דיזל", luxury: false, msrp: 240000 },
  { brand: "Ford", model: "Transit Custom", year: 2025, body: "מסחרי", seats: 3, power: "דיזל", luxury: false, msrp: 235000 },
  { brand: "Mercedes", model: "V-Class", year: 2025, body: "מנהלים", seats: 7, power: "בנזין/דיזל", luxury: true, msrp: 590000 },

  // ספורט/על
  { brand: "BMW", model: "M4", year: 2025, body: "ספורט/על", seats: 4, power: "בנזין/דיזל", luxury: true, msrp: 850000 },
  { brand: "Ferrari", model: "Roma", year: 2025, body: "ספורט/על", seats: 2, power: "בנזין/דיזל", luxury: true, msrp: 2200000 },
];

/* ============================================
   רכיב: כותרת עליונה יוקרתית שחור/זהב
   ============================================ */
function Header() {
  return (
    <header className="hdr">
      <div className="brand">R&amp;M motors</div>
      {/* לחצן חיוג ללא הצגת מספר */}
      <a className="pill pill-outline" href={`tel:${PHONE_INTL}`}>חיוג</a>
    </header>
  );
}

/* ============================================
   סעיף "מי אנחנו" – פתיחה/סיפור
   ============================================ */
function About() {
  return (
    <section className="hero">
      <h1>R&amp;M motors רכבי יוקרה וספורט בהתאמה אישית</h1>
      <p className="lead">
        מתמחים בכל סוגי הרכבים החדשים 0 ק״מ – מוצאים מימון משתלם במיוחד,
        וליווי מלא עד המסירה וגם אחריה.
      </p>

      <div className="about-grid">
        <div className="about-card">
          <h3>מי אנחנו</h3>
          <p>
            ב־R&amp;M אנו משלבים מומחיות שוק, קשרים ישירים מול יבואנים ובנקים, ושירות VIP אמיתי.
            אנחנו מתחילים בהבנת הצורך האישי שלך – שימוש יומיומי, משפחה, יוקרה, או רכב עבודה –
            לאחר מכן משווים בין כל מסלולי המימון המובילים בארץ, ומתקדמים אך ורק
            עם ההצעה הטובה ביותר עבורך. אתך יד ביד עד לרגע קבלת הרכב – וגם הרבה אחרי.
          </p>
          <ul>
            <li>השוואת מימון רחבה מול בנקים וחברות – בחירת המסלול המשתלם ביותר ללקוח.</li>
            <li>התאמה אישית של דגם/תת־דגם לפי שימוש, מקומות, הנעה, יוקרה ותקציב.</li>
            <li>אחריות ושירות מתמשך: תזכורות לטיפולים, שטיפות, טרייד־אין עתידי ומועדון לקוחות.</li>
          </ul>
        </div>

        <aside className="about-card">
          <h3>יצירת קשר</h3>
          <p>רוצים לדבר עכשיו? אנחנו כאן:</p>
          <div className="cta-row">
            <a className="pill pill-solid" href={WA("שלום, אשמח להתאמת רכב ומימון")}>ווטסאפ</a>
            <a className="pill pill-outline" href={`tel:${PHONE_INTL}`}>חיוג</a>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ============================================
   בוט צ׳אט – מאתר רכב חכם
   ============================================ */
const uses = ["עירוני", "משפחתי", "פנאי/קרוסאובר", "מנהלים", "ספורט/על", "מסחרי", "טנדר", "7 מקומות", "יוקרה"];
const powers = ["בנזין/דיזל", "היברידי", "חשמלי", "לא משנה"];
const seatsOpts = ["2", "4-5", "7+"];

function SmartFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAns] = useState({
    use: "",
    power: "",
    seats: "",
    luxury: null,
    monthly: 2500,
    brandPref: "לא משנה",
  });

  const questions = [
    {
      key: "use",
      title: "מה יהיה השימוש המרכזי ברכב?",
      options: uses,
    },
    {
      key: "power",
      title: "איזה סוג הנעה מתאים לך?",
      options: powers,
    },
    {
      key: "seats",
      title: "כמה מושבים תצטרך?",
      options: seatsOpts,
    },
    {
      key: "luxury",
      title: "רמת יוקרה מועדפת?",
      options: ["יוקרתי", "סטנדרטי", "לא משנה"],
      map: (v) => (v === "יוקרתי" ? true : v === "סטנדרטי" ? false : null),
    },
  ];

  const done = step >= questions.length;

  const results = useMemo(() => {
    if (!done) return [];
    const wantsLuxury = answers.luxury;
    const desiredSeats = answers.seats === "7+" ? 7 : answers.seats === "4-5" ? 5 : 2;

    // סינון לפי שימוש
    const byUse = INVENTORY.filter((c) => {
      if (answers.use === "7 מקומות") return c.seats >= 7;
      if (answers.use === "יוקרה") return c.luxury;
      if (answers.use === "טנדר") return c.body === "טנדר";
      if (answers.use === "מסחרי") return c.body === "מסחרי";
      return c.body.includes(answers.use);
    });

    // סינון אנרגיה
    const byPower = answers.power === "לא משנה" ? byUse : byUse.filter((c) => c.power === answers.power);

    // סינון מושבים
    const bySeats = byPower.filter((c) => (desiredSeats >= 7 ? c.seats >= 7 : c.seats >= desiredSeats));

    // יוקרה
    const byLux =
      wantsLuxury == null ? bySeats : bySeats.filter((c) => c.luxury === wantsLuxury);

    // דירוג לפי קרבה לתקציב חודשי (בלון 60, סכום בלון 50% לא מוצג)
    const score = (car) => {
      const monthly = pmtBalloon({
        price: car.msrp,
        down: 0,
        months: 60,
        balloonAmount: car.msrp * 0.5,
      });
      return Math.abs(monthly - answers.monthly);
    };

    return byLux
      .map((c) => ({ car: c, distance: score(c) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [answers, done]);

  function pick(oKey, val) {
    const q = questions[step];
    const mapped = q.map ? q.map(val) : val;
    setAns((s) => ({ ...s, [q.key]: mapped }));
    setStep((s) => s + 1);
  }

  return (
    <section className="section">
      <h2 className="section-title">מאתר רכב חכם</h2>
      <p className="section-sub">
        צ׳אט קצר ומדויק שמחזיר לך 3 התאמות חכמות. ניתן לכוון תקציב חודשי משוער כדי לחדד תוצאות.
      </p>

      {!done ? (
        <div className="chat">
          <div className="bot-bubble">
            <b>🤖 R&amp;M BOT</b>
            <div className="q-title">{questions[step].title}</div>
          </div>
          <div className="answers">
            {questions[step].options.map((op) => (
              <button key={op} className="chip" onClick={() => pick(questions[step].key, op)}>
                {op}
              </button>
            ))}
          </div>

          {/* בורר תקציב חודשי זמין לאורך כל התהליך */}
          <div className="budget">
            <label>תקציב חודשי משוער</label>
            <input
              type="range"
              min={800}
              max={15000}
              step={100}
              value={answers.monthly}
              onChange={(e) => setAns((s) => ({ ...s, monthly: Number(e.target.value) }))}
            />
            <div className="money">{fmt(answers.monthly)}</div>
          </div>
        </div>
      ) : (
        <div className="match-card">
          <div className="match-title">
            <span>🤖</span> יש לנו התאמות מוכנות עבורך!
          </div>

          {results.map(({ car }, i) => {
            const monthly = pmtBalloon({
              price: car.msrp,
              down: 0,
              months: 60,
              balloonAmount: car.msrp * 0.5,
            });
            return (
              <div key={i} className="car-row">
                <div className="car-name">
                  {car.brand} {car.model}
                </div>
                <div className="car-meta">
                  {car.year} · {car.body} · {car.power}
                </div>
                <div className="car-pay">החל מ־{fmt(monthly)} לחודש</div>
              </div>
            );
          })}

          <div className="match-actions">
            <a
              className="pill pill-solid"
              href={WA(
                `אשמח לקבל 3 התאמות לרכב.\nשימוש: ${answers.use}\nהנעה: ${answers.power}\nמושבים: ${answers.seats}\nתקציב חודשי: ${fmt(
                  answers.monthly
                )}`
              )}
            >
              שלחו לי את ההתאמות בוואטסאפ
            </a>
            <button className="pill pill-outline" onClick={() => { setStep(0); setAns({ use: "", power: "", seats: "", luxury: null, monthly: 2500, brandPref: "לא משנה" }); }}>
              התחלה מחדש
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ============================================
   מחשבון הלוואה (רגיל / בלון)
   ============================================ */
function LoanCalculator() {
  const [mode, setMode] = useState("balloon"); // "classic" / "balloon"
  const [price, setPrice] = useState(150000);
  const [down, setDown] = useState(30000);
  const [months, setMonths] = useState(60);
  const [balloon, setBalloon] = useState(0);

  const maxBalloon = Math.round(price * 0.5); // עד 50% – לא מוצג כאחוז
  const financed = Math.max(0, price - down);

  const result = useMemo(() => {
    if (mode === "classic") {
      const m = Math.min(100, months);
      return pmt({ principal: financed, months: m });
    } else {
      const m = Math.min(60, months);
      return pmtBalloon({ price, down, months: m, balloonAmount: balloon });
    }
  }, [mode, price, down, months, balloon, financed]);

  return (
    <section className="section">
      <h2 className="section-title">מחשבון הלוואה</h2>
      <p className="section-sub">בחרו מסלול, הזינו מחיר ומקדמה ושחקו במספר התשלומים. במסלול בלון תבחרו סכום בלון לסוף התקופה – עד הסכום המותר.</p>

      <div className="mode-tabs">
        <button className={`tab ${mode === "classic" ? "on" : ""}`} onClick={() => setMode("classic")}>
          רגיל (עד 100 ח׳)
        </button>
        <button className={`tab ${mode === "balloon" ? "on" : ""}`} onClick={() => setMode("balloon")}>
          בלון (עד 60 ח׳)
        </button>
      </div>

      <div className="grid-2">
        <label className="input">
          <span>מחיר רכב</span>
          <input type="number" value={price} onChange={(e) => setPrice(+e.target.value || 0)} />
        </label>
        <label className="input">
          <span>מקדמה</span>
          <input type="number" value={down} onChange={(e) => setDown(+e.target.value || 0)} />
        </label>
      </div>

      <div className="slider">
        <div className="slider-row">
          <span>מס׳ חודשים</span>
          <b>{months} ח׳</b>
        </div>
        <input
          type="range"
          min="12"
          max={mode === "classic" ? 100 : 60}
          value={months}
          onChange={(e) => setMonths(+e.target.value)}
        />
      </div>

      {mode === "balloon" && (
        <div className="slider">
          <div className="slider-row">
            <span>סכום בלון בסוף התקופה</span>
            <b>{fmt(balloon)}</b>
          </div>
          <input
            type="range"
            min="0"
            max={maxBalloon}
            step="500"
            value={balloon}
            onChange={(e) => setBalloon(+e.target.value)}
          />
          <div className="hint">ניתן לבחור כל סכום עד {fmt(maxBalloon)}.</div>
        </div>
      )}

      <div className="result">
        <div>החזר חודשי משוער</div>
        <div className="big">{fmt(result)}</div>
        <div className="mini">* חישוב להמחשה בלבד. הצעה סופית תיקבע לאחר בדיקה אישית.</div>
      </div>

      <div className="cta-row">
        <a className="pill pill-solid" href={WA("שלום, ראיתי את המחשבון ואשמח להצעה מותאמת")}>
          בקשת הצעה בוואטסאפ
        </a>
      </div>
    </section>
  );
}

/* ============================================
   טפסים
   ============================================ */
function ContactForm() {
  const [data, setData] = useState({ name: "", phone: "", email: "", city: "", msg: "" });
  const qs = encodeURIComponent(
    `שם: ${data.name}\nטלפון: ${data.phone}\nאימייל: ${data.email}\nעיר: ${data.city}\nהודעה: ${data.msg}`
  );
  return (
    <section className="section">
      <h2 className="section-title">יצירת קשר</h2>
      <p className="section-sub">נחזור אליך עם הצעה מותאמת אישית – בלי לחץ לחתום, רק כשנמצא עבורך את הטוב ביותר.</p>

      <div className="grid-2">
        <label className="input">
          <span>שם מלא</span>
          <input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
        </label>
        <label className="input">
          <span>טלפון</span>
          <input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} />
        </label>
      </div>

      <div className="grid-2">
        <label className="input">
          <span>אימייל</span>
          <input value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
        </label>
        <label className="input">
          <span>עיר</span>
          <input value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} />
        </label>
      </div>

      <label className="input">
        <span>הודעה</span>
        <textarea rows="4" value={data.msg} onChange={(e) => setData({ ...data, msg: e.target.value })} />
      </label>

      <div className="cta-row">
        <a className="pill pill-solid" href={`https://wa.me/${PHONE_INTL}?text=${qs}`}>שלחו ונחזור אליכם</a>
      </div>
    </section>
  );
}

function TradeInForm() {
  const [f, setF] = useState({
    name: "", phone: "", email: "",
    brand: "", model: "", year: "", plate: "", km: "", note: ""
  });

  const txt = `טרייד־אין:
שם: ${f.name}
טלפון: ${f.phone}
אימייל: ${f.email}
מותג/דגם: ${f.brand} ${f.model}
שנת יצור: ${f.year}
מס׳ רישוי: ${f.plate}
ק״מ: ${f.km}
הערות: ${f.note}`;

  return (
    <section className="section">
      <h2 className="section-title">טרייד־אין אונליין</h2>
      <p className="section-sub">הערכת שווי מהירה מרחוק וקידום בעסקה חדשה — ממלאים טופס מסודר ונחזור עם הצעה.</p>

      <div className="grid-2">
        <label className="input"><span>שם מלא</span>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </label>
        <label className="input"><span>טלפון</span>
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </label>
      </div>

      <div className="grid-2">
        <label className="input"><span>אימייל</span>
          <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </label>
        <label className="input"><span>מותג</span>
          <input value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} />
        </label>
      </div>

      <div className="grid-2">
        <label className="input"><span>דגם</span>
          <input value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} />
        </label>
        <label className="input"><span>שנת יצור</span>
          <input value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} />
        </label>
      </div>

      <div className="grid-2">
        <label className="input"><span>מס׳ רישוי</span>
          <input value={f.plate} onChange={(e) => setF({ ...f, plate: e.target.value })} />
        </label>
        <label className="input"><span>ק״מ</span>
          <input value={f.km} onChange={(e) => setF({ ...f, km: e.target.value })} />
        </label>
      </div>

      <label className="input">
        <span>הערות</span>
        <textarea rows="3" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      </label>

      <div className="cta-row">
        <a className="pill pill-solid" href={WA(txt)}>שלחו הערכה בוואטסאפ</a>
      </div>
    </section>
  );
}

/* ============================================
   תחתית (וואטסאפ/חיוג)
   ============================================ */
function Footer() {
  return (
    <footer className="footer">
      <div className="cta-row">
        <a className="pill pill-solid" href={WA("שלום, מעוניין/ת בפרטים נוספים")}>ווטסאפ</a>
        <a className="pill pill-outline" href={`tel:${PHONE_INTL}`}>חיוג</a>
      </div>
      <div className="copy">© R&amp;M 2025 · כל הזכויות שמורות</div>
    </footer>
  );
}

/* ============================================
   האפליקציה
   ============================================ */
export default function App() {
  return (
    <div dir="rtl" className="app">
      <Header />
      <About />
      <SmartFinder />
      <LoanCalculator />
      <ContactForm />
      <TradeInForm />
      <Footer />
    </div>
  );
}
