import { useMemo, useState } from "react";
import "./styles.css";

/* ===== קבועים כלליים ===== */
const PHONE_HUMAN = "052-640-6728";
const PHONE_INTL = "972526406728";
const WA = (txt = "") =>
  `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(txt)}`;
const CALL_LINK = `tel:${PHONE_INTL}`;

/* ===== חישובי מימון (ריבית סמויה 5.9% שנתי – לא מוצג) ===== */
const APR = 0.059;
const r = APR / 12;
const fmt = (n) =>
  new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 }).format(n);

function pmtEqual(principal, months) {
  if (months <= 0 || principal <= 0) return 0;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}
function pmtBalloon(price, down, months, balloonAmount) {
  const P = Math.max(price - down, 0);
  const pvBalloon = balloonAmount / Math.pow(1 + r, months);
  const adj = Math.max(P - pvBalloon, 0);
  return pmtEqual(adj, months);
}

/* ===== מאגר דגמים (מחיר משוער לשקלול, התצוגה תמיד "החל מ־החזר חודשי") ===== */
const FLEET = [
  // עירוני / סופר־מיני
  { brand: "Kia", model: "Picanto", type: "עירוני", fuel: "בנזין/דיזל", seats: 5, sport: false, price: 102000 },
  { brand: "Hyundai", model: "i10", type: "עירוני", fuel: "בנזין/דיזל", seats: 5, sport: false, price: 105000 },
  { brand: "Suzuki", model: "Swift", type: "עירוני", fuel: "בנזין/דיזל", seats: 5, sport: false, price: 128000 },
  // משפחתי / סדאן
  { brand: "Toyota", model: "Corolla Hybrid", type: "משפחתי", fuel: "היברידי", seats: 5, sport: false, price: 165000 },
  { brand: "Hyundai", model: "Elantra", type: "משפחתי", fuel: "בנזין/דיזל", seats: 5, sport: false, price: 155000 },
  { brand: "Mazda", model: "3", type: "סדאן", fuel: "בנזין/דיזל", seats: 5, sport: false, price: 162000 },
  // פנאי/קרוסאובר
  { brand: "Kia", model: "Sportage", type: "פנאי/קרוסאובר", fuel: "היברידי", seats: 5, sport: false, price: 205000 },
  { brand: "Hyundai", model: "Tucson", type: "פנאי/קרוסאובר", fuel: "היברידי", seats: 5, sport: false, price: 210000 },
  { brand: "Mazda", model: "CX-30", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", seats: 5, sport: false, price: 185000 },
  { brand: "Skoda", model: "Octavia", type: "משפחתי", fuel: "בנזין/דיזל", seats: 5, sport: false, price: 190000 },
  { brand: "Skoda", model: "Kodiaq", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", seats: 7, sport: false, price: 245000 },
  { brand: "Volkswagen", model: "Golf", type: "עירוני", fuel: "בנזין/דיזל", seats: 5, sport: false, price: 195000 },
  // חשמליים
  { brand: "BYD", model: "Atto 3", type: "פנאי/קרוסאובר", fuel: "חשמלי", seats: 5, sport: false, price: 169000 },
  { brand: "MG", model: "ZS EV", type: "פנאי/קרוסאובר", fuel: "חשמלי", seats: 5, sport: false, price: 159000 },
  { brand: "Tesla", model: "Model 3", type: "סדאן", fuel: "חשמלי", seats: 5, sport: true, price: 240000 },
  { brand: "Volvo", model: "XC40 Recharge", type: "פנאי/קרוסאובר", fuel: "חשמלי", seats: 5, sport: false, price: 330000 },
  // מנהלים / יוקרה
  { brand: "Mercedes", model: "C 200", type: "מנהלים", fuel: "בנזין/דיזל", seats: 5, sport: false, price: 380000 },
  { brand: "Mercedes", model: "GLC 300", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", seats: 5, sport: false, price: 560000 },
  { brand: "BMW", model: "3 Series", type: "מנהלים", fuel: "בנזין/דיזל", seats: 5, sport: true, price: 360000 },
  { brand: "BMW", model: "X5", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", seats: 5, sport: true, price: 720000 },
  { brand: "Audi", model: "A4", type: "מנהלים", fuel: "בנזין/דיזל", seats: 5, sport: false, price: 335000 },
  { brand: "Audi", model: "Q5 45 TFSI", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", seats: 5, sport: true, price: 470000 },
  { brand: "Lexus", model: "NX", type: "פנאי/קרוסאובר", fuel: "היברידי", seats: 5, sport: false, price: 330000 },
  { brand: "Lexus", model: "RX", type: "פנאי/קרוסאובר", fuel: "היברידי", seats: 5, sport: false, price: 470000 },
  // פרימיום קצה
  { brand: "Porsche", model: "911 Carrera", type: "ספורט/על", fuel: "בנזין/דיזל", seats: 4, sport: true, price: 1200000 },
  { brand: "Range Rover", model: "Range Rover", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", seats: 5, sport: false, price: 1300000 },
  { brand: "Mercedes", model: "S 580", type: "יוקרה", fuel: "בנזין/דיזל", seats: 5, sport: true, price: 1100000 },
  // מסחרי
  { brand: "Toyota", model: "Hilux", type: "מסחרי", fuel: "דיזל", seats: 5, sport: false, price: 255000 },
  { brand: "Ford", model: "Transit", type: "מסחרי", fuel: "דיזל", seats: 3, sport: false, price: 300000 },
];

/* ===== קומפוננטות ===== */
function Header() {
  return (
    <header className="topbar" dir="rtl">
      <div className="brand">R&amp;M motors</div>
      <div className="actions">
        <a className="btn ghost" href={WA("שלום, אשמח לשוחח בווטסאפ 🙂")}>דברו איתי בווטסאפ</a>
        <a className="btn hollow" href={CALL_LINK} aria-label={`חיוג אל ${PHONE_HUMAN}`}>חיוג</a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" dir="rtl">
      <h1>R&amp;M motors רכבי יוקרה וספורט בהתאמה אישית</h1>
      <p>מתמחים בכל סוגי הרכבים החדשים 0 ק״מ • מציאת מימון משתלם במיוחד • ליווי מלא עד המסירה וגם לאחריה</p>
    </section>
  );
}

function WhyUs() {
  return (
    <section className="pill" dir="rtl">
      <h2>?למה R&amp;M</h2>
      <ul className="bullets">
        <li>מוצאים לך את הרכב המתאים — רק אז חותמים.</li>
        <li>מימון מותאם אישית — השוואה מול בנקים וחברות עד שנמצא את המסלול המשתלם ביותר.</li>
        <li>ליווי יד ביד עד מסירה, וגם אחרי — מצטרפים למשפחת R&amp;M.</li>
      </ul>
      <div className="ctaRow">
        <a className="btn primary" href={WA("שלום, אשמח להצעת מימון/איתור רכב")}>ווטסאפ</a>
        <a className="btn hollow" href={CALL_LINK} aria-label={`חיוג אל ${PHONE_HUMAN}`}>חיוג</a>
      </div>
      <small className="muted">© R&amp;M 2025 • כל הזכויות שמורות</small>
    </section>
  );
}

/* מחשבון הלוואה – שני מסלולים */
function LoanCalculator() {
  const [tab, setTab] = useState("balloon"); // 'balloon' | 'regular'
  const [price, setPrice] = useState(150000);
  const [down, setDown] = useState(30000);
  const [months, setMonths] = useState(60);
  const [balloon, setBalloon] = useState(0); // ₪, עד 50% ממחיר הרכב

  const result = useMemo(() => {
    if (tab === "regular") {
      const p = Math.max(price - down, 0);
      return pmtEqual(p, months);
    } else {
      const maxBalloon = price * 0.5;
      const fixedBalloon = Math.min(balloon, maxBalloon);
      return pmtBalloon(price, down, months, fixedBalloon);
    }
  }, [tab, price, down, months, balloon]);

  const monthly = Math.round(result || 0);

  return (
    <section className="calc card" dir="rtl" id="loan">
      <h2>מחשבון הלוואה</h2>

      <div className="tabs">
        <button className={tab === "balloon" ? "chip on" : "chip"} onClick={() => setTab("balloon")}>בלון (עד 60 ח׳)</button>
        <button className={tab === "regular" ? "chip on" : "chip"} onClick={() => setTab("regular")}>רגיל (עד 100 ח׳)</button>
      </div>

      <div className="grid">
        <label>מחיר רכב
          <input type="number" value={price} onChange={(e)=>setPrice(+e.target.value || 0)} min={20000} step={1000}/>
        </label>
        <label>מקדמה
          <input type="number" value={down} onChange={(e)=>setDown(+e.target.value || 0)} min={0} step={1000}/>
        </label>
      </div>

      <label>מס’ חודשים
        <input type="range" min={tab==="regular"?12:12} max={tab==="regular"?100:60} value={months} onChange={(e)=>setMonths(+e.target.value)} />
        <div className="rangeHint">{months} ח׳</div>
      </label>

      {tab==="balloon" && (
        <label>סכום בלון בסוף התקופה (ניתן לבחור כל סכום עד 50% ממחיר הרכב)
          <input type="range" min={0} max={Math.round(price*0.5)} value={balloon} onChange={(e)=>setBalloon(+e.target.value)} />
          <div className="rangeHint">{fmt(balloon)} ₪</div>
        </label>
      )}

      <div className="result">
        <div><b>החזר חודשי משוער:</b> {fmt(monthly)} ₪</div>
        <div className="tiny muted">* החישוב להמחשה בלבד; הצעה סופית תיקבע לאחר בדיקה אישית. אין לראות בתוצאה התחייבות.</div>
      </div>

      <div className="ctaRow">
        <a className="btn primary" href={WA(`שלום, אשמח להצעת מימון. מחיר רכב: ${fmt(price)} ₪, מקדמה: ${fmt(down)} ₪, חודשים: ${months}${tab==="balloon" ? `, בלון בסוף: ${fmt(balloon)} ₪` : ""}`)}>בקשת הצעה בווטסאפ</a>
        <a className="btn hollow" href={CALL_LINK}>חיוג</a>
      </div>
    </section>
  );
}

/* בוט צ'אט מאתר רכב חכם */
const QUESTIONS = [
  { key: "budgetMonthly", q: "מה התקציב החודשי המשוער לרכב?", type: "range", min: 1500, max: 12000, step: 100 },
  { key: "usage", q: "לאיזה שימוש עיקרי?", type: "choice", opts: ["עיר", "בין־עירוני", "מעורב"] },
  { key: "seats", q: "כמה מקומות ישיבה צריך?", type: "choice", opts: ["2", "4", "5", "7+"] },
  { key: "body", q: "סגנון מרכב מועדף?", type: "choice", opts: ["עירוני", "משפחתי", "פנאי/קרוסאובר", "סדאן", "מסחרי", "לא משנה"] },
  { key: "fuel", q: "סוג הנעה מועדף?", type: "choice", opts: ["בנזין/דיזל", "היברידי", "חשמלי", "לא משנה"] },
  { key: "sporty", q: "מחפש/ת אופי ספורטיבי?", type: "choice", opts: ["כן", "לא"] },
  { key: "brandBias", q: "מותג מועדף? (לא חובה)", type: "text" },
];

function SmartFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ budgetMonthly: 2500 });
  const [matches, setMatches] = useState([]);

  const current = QUESTIONS[step];

  function onAnswer(val) {
    const next = { ...answers, [current.key]: val };
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // חישוב התאמות
      const scored = FLEET.map((car) => {
        let score = 0;

        // תקציב -> ממיר מחיר להחזר חודשי "החל מ" (60 ח', בלון 50%, מקדמה 20%)
        const price = car.price;
        const down = price * 0.2;
        const balloon = price * 0.5;
        const monthly = pmtBalloon(price, down, 60, balloon);
        const target = +next.budgetMonthly || 0;

        // קרבה לתקציב
        if (monthly <= target * 1.15) score += 3;
        if (monthly <= target * 1.00) score += 2;

        // שימוש/מרכב
        const bodyPref = next.body;
        if (bodyPref && bodyPref !== "לא משנה" && car.type === bodyPref) score += 3;
        if (next.usage === "עיר" && ["עירוני","סדאן"].includes(car.type)) score += 1;
        if (next.usage === "בין־עירוני" && ["משפחתי","פנאי/קרוסאובר","מנהלים"].includes(car.type)) score += 1;

        // מושבים
        const needSeats = next.seats === "7+" ? 7 : parseInt(next.seats || "5", 10);
        if ((needSeats >= 7 && car.seats >= 7) || (needSeats <= 5 && car.seats >= 5)) score += 2;

        // הנעה
        const fuelPref = next.fuel;
        if (fuelPref && fuelPref !== "לא משנה" && car.fuel === fuelPref) score += 2;

        // ספורט
        if (next.sporty === "כן" && car.sport) score += 2;
        if (next.sporty === "לא" && !car.sport) score += 1;

        // מותג
        const bias = (next.brandBias || "").trim().toLowerCase();
        if (bias && (car.brand.toLowerCase().includes(bias) || car.model.toLowerCase().includes(bias))) score += 2;

        return { car, monthly: Math.round(monthly), score };
      })
      .filter(x => x.monthly > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

      setMatches(scored);
      setStep(step + 1);
    }
  }

  function reset() {
    setStep(0);
    setAnswers({ budgetMonthly: 2500 });
    setMatches([]);
  }

  return (
    <section className="card" dir="rtl" id="smart">
      <h2>מאתר רכב חכם</h2>
      <p className="muted">צ׳אט קצר שמחזיר התאמות עם החזר חודשי משוער — כדי להתחיל מידית.</p>

      {step < QUESTIONS.length ? (
        <div className="chat">
          <div className="msg bot">{current.q}</div>

          {current.type === "range" && (
            <div className="rangeWrap">
              <input
                type="range"
                min={current.min}
                max={current.max}
                step={current.step}
                value={answers[current.key] ?? current.min}
                onChange={(e) => setAnswers({ ...answers, [current.key]: +e.target.value })}
              />
              <div className="rangeHint">תקציב: {fmt(answers[current.key] ?? current.min)} ₪</div>
              <button className="btn primary" onClick={() => onAnswer(answers[current.key] ?? current.min)}>המשך</button>
            </div>
          )}

          {current.type === "choice" && (
            <div className="chips">
              {current.opts.map((o) => (
                <button key={o} className="chip" onClick={() => onAnswer(o)}>{o}</button>
              ))}
            </div>
          )}

          {current.type === "text" && (
            <div className="grid">
              <input
                placeholder="לדוגמה: Mercedes / יוקרה / אין העדפה"
                value={answers[current.key] ?? ""}
                onChange={(e) => setAnswers({ ...answers, [current.key]: e.target.value })}
              />
              <button className="btn primary" onClick={() => onAnswer(answers[current.key] ?? "")}>המשך</button>
            </div>
          )}
        </div>
      ) : (
        <div className="resultBox">
          <div className="msg bot big">🤖 יש לנו התאמות מוכנות עבורך!</div>
          {matches.map(({ car, monthly }, idx) => (
            <div key={idx} className="rec">
              <div className="recTitle">{car.brand} {car.model}</div>
              <div className="recMeta">{car.type} · {car.fuel}</div>
              <div className="recPay">החל מ־{fmt(monthly)} ₪ לחודש</div>
            </div>
          ))}
          <div className="ctaRow">
            <a
              className="btn primary"
              href={WA(`היי, עניתי בצ׳אט ואני רוצה 3 התאמות: ${matches.map(m=>`${m.car.brand} ${m.car.model} (${fmt(m.monthly)} ₪/ח׳)`).join(" | ")}`)}
            >
              קבלו 3 התאמות בווטסאפ
            </a>
            <button className="btn ghost" onClick={reset}>התחל מחדש</button>
          </div>
        </div>
      )}
    </section>
  );
}

/* יצירת קשר – נוסח מושך */
function ContactForm() {
  const [f, setF] = useState({ name:"", phone:"", email:"", city:"", msg:"" });
  const send = (e) => {
    e.preventDefault();
    const text = `שם: ${f.name}\nטלפון: ${f.phone}\nאימייל: ${f.email}\nעיר: ${f.city}\nהודעה: ${f.msg}`;
    window.open(WA("שלום, אשמח להצעה מותאמת אישית.\n" + text), "_blank");
  };
  return (
    <section className="card" dir="rtl" id="contact">
      <h2>יצירת קשר</h2>
      <p className="muted">נחזור אליך עם הצעה מותאמת אישית — בלי לחץ לחתום, רק כשנמצא עבורך את הטוב ביותר.</p>
      <form onSubmit={send} className="grid">
        <label>שם מלא<input value={f.name} onChange={(e)=>setF({...f, name:e.target.value})} required /></label>
        <label>טלפון<input value={f.phone} onChange={(e)=>setF({...f, phone:e.target.value})} required /></label>
        <label>אימייל<input value={f.email} onChange={(e)=>setF({...f, email:e.target.value})} /></label>
        <label>עיר<input value={f.city} onChange={(e)=>setF({...f, city:e.target.value})} /></label>
        <label className="full">הודעה<textarea value={f.msg} onChange={(e)=>setF({...f, msg:e.target.value})} rows={4} /></label>
        <button className="btn primary full">שלחו ונחזור אליכם</button>
      </form>
    </section>
  );
}

/* טרייד־אין אונליין – העלאת תמונות + שיתוף אוטומטי אם אפשר */
function TradeIn() {
  const [t, setT] = useState({ name:"", phone:"", email:"", brand:"", model:"", year:"", plate:"", km:"", notes:"" });
  const [files, setFiles] = useState([]);

  async function send(e) {
    e.preventDefault();
    const text =
`טרייד־אין:
שם: ${t.name}
טלפון: ${t.phone}
אימייל: ${t.email}
מותג/דגם: ${t.brand} ${t.model}
שנת ייצור: ${t.year} | ק״מ: ${t.km}
מס׳ רישוי: ${t.plate}
הערות: ${t.notes}`;

    // אם הדפדפן תומך בשיתוף קבצים (מובייל) – ננסה שיתוף למקבל (לרוב יופיע ווטסאפ)
    const filesArr = Array.from(files || []);
    if (navigator.share && filesArr.length && navigator.canShare?.({ files: filesArr })) {
      try {
        await navigator.share({ title: "R&M motors – טרייד־אין", text, files: filesArr });
        return;
      } catch (_) { /* fallback לוואטסאפ */ }
    }

    // נפילה לוואטסאפ עם הטקסט; את התמונות אפשר לצרף בחלון שייפתח
    window.open(WA(text + "\n(העלו תמונות בחלון הווטסאפ שייפתח)"), "_blank");
  }

  return (
    <section className="card" dir="rtl" id="tradein">
      <h2>טרייד־אין אונליין</h2>
      <p className="muted">הערכת שווי מהירה מרחוק וקידום בעסקה חדשה — ממלאים טופס מסודר ונחזור עם הצעה.</p>
      <form onSubmit={send} className="grid">
        <label>שם מלא<input value={t.name} onChange={(e)=>setT({...t, name:e.target.value})} required /></label>
        <label>טלפון<input value={t.phone} onChange={(e)=>setT({...t, phone:e.target.value})} required /></label>
        <label>אימייל<input value={t.email} onChange={(e)=>setT({...t, email:e.target.value})} /></label>
        <label>מותג<input value={t.brand} onChange={(e)=>setT({...t, brand:e.target.value})} /></label>
        <label>דגם<input value={t.model} onChange={(e)=>setT({...t, model:e.target.value})} /></label>
        <label>שנת ייצור<input value={t.year} onChange={(e)=>setT({...t, year:e.target.value})} /></label>
        <label>מס׳ רישוי<input value={t.plate} onChange={(e)=>setT({...t, plate:e.target.value})} /></label>
        <label>ק״מ<input value={t.km} onChange={(e)=>setT({...t, km:e.target.value})} /></label>
        <label className="full">הערות<textarea value={t.notes} onChange={(e)=>setT({...t, notes:e.target.value})} rows={3} /></label>
        <label className="full">תמונות (עד 6)
          <input type="file" accept="image/*" multiple onChange={(e)=>setFiles(e.target.files)} />
          <small className="muted">במכשירים תומכים נשלח אוטומטית בווטסאפ; אחרת ייפתח חלון ווטסאפ ותצרפו שם.</small>
        </label>
        <button className="btn primary full">שלחו הערכה בווטסאפ</button>
      </form>
    </section>
  );
}

/* מי אנחנו – סיפור ונקודות תהליך */
function About() {
  return (
    <section className="card" dir="rtl" id="about">
      <h2>מי אנחנו</h2>
      <p>
        R&amp;M motors – בית לרכבי יוקרה וספורט בהתאמה אישית. אנחנו מקשיבים לצורך שלך, מאתרים עבורך את
        הרכב המדויק ומבצעים השוואת מימון רחבה עד שהמסלול באמת משתלם. אחרי המסירה אנחנו ממשיכים ללוות:
        תזכורות לטיפולים, שטיפות, טרייד־אין עתידי ומועדון לקוחות שמרוויח כל השנה.
      </p>

      <div className="steps">
        <div className="step"><b>איתור והתאמה</b><span>ממפים שימוש, תקציב והעדפות — ומציגים רק התאמות פוגעות.</span></div>
        <div className="step"><b>מימון</b><span>בדיקת תנאים מול בנקים וחברות — מתקדמים רק עם ההצעה הטובה ביותר ללקוח.</span></div>
        <div className="step"><b>מסירה</b><span>ליווי מלא עד קבלת הרכב, העברת בעלות וביטוח.</span></div>
        <div className="step"><b>אחריות ושירות מתמשך</b><span>טיפולים, שטיפות, טרייד־אין עתידי והטבות מועדון R&amp;M.</span></div>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="app" dir="rtl">
      <Header />
      <Hero />
      <LoanCalculator />
      <SmartFinder />
      <ContactForm />
      <TradeIn />
      <About />
      <WhyUs />
    </div>
  );
}
