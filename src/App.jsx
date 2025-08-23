// src/App.jsx
import React, { useMemo, useState } from "react";

/* ========= קבועים ========= */
const PHONE_HUMAN = "052-640-6728";
const PHONE_INTL = "972526406728";
const WA = (txt = "שלום, אשמח להצעה") =>
  `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(txt)}`;

// ריבית לחישוב (לא מוצגת באתר)
const RATE_YEAR = 0.059;
const RATE_MONTH = RATE_YEAR / 12;

// סיוע עיצוב מהיר (אינליין כדי לא לשבור קבצים קיימים)
const S = {
  page: {
    direction: "rtl",
    fontFamily:
      "-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,Heebo,Assistant,sans-serif",
    color: "#0f172a",
    background: "#f7f7fb",
    lineHeight: 1.4,
  },
  container: {
    maxWidth: 1060,
    margin: "0 auto",
    padding: "16px",
  },
  hero: {
    position: "relative",
    borderRadius: 24,
    padding: "20px 16px",
    margin: "10px 0 14px",
    color: "white",
    background:
      "linear-gradient(120deg, #5136f5 0%, #9b54ff 35%, #ff7a00 100%)",
    boxShadow: "0 10px 30px rgba(0,0,0,.12)",
    overflow: "hidden",
  },
  chipBar: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 },
  chipLight: {
    background: "#fff",
    color: "#0f172a",
    borderRadius: 999,
    padding: "10px 16px",
    fontWeight: 600,
    boxShadow: "0 6px 20px rgba(15,23,42,.12)",
  },
  chipDark: {
    background: "#111827",
    color: "#fff",
    borderRadius: 999,
    padding: "12px 16px",
    fontWeight: 700,
    boxShadow: "0 6px 20px rgba(15,23,42,.22)",
  },
  section: {
    background: "#fff",
    borderRadius: 22,
    padding: 16,
    margin: "16px 0",
    boxShadow: "0 10px 25px rgba(0,0,0,.06)",
  },
  h2: { fontSize: 22, margin: "0 0 6px", fontWeight: 800 },
  sub: { color: "#475569", marginBottom: 10, fontSize: 14 },
  row: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  input: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    padding: "0 14px",
    background: "#fff",
    fontSize: 16,
  },
  slider: { width: "100%" },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: 14,
    display: "grid",
    gridTemplateColumns: "96px 1fr",
    gap: 12,
    alignItems: "center",
    border: "1px solid #eee",
  },
  img: {
    width: 96,
    height: 60,
    objectFit: "cover",
    borderRadius: 12,
    background: "#fff",
    border: "1px solid #eee",
  },
  small: { color: "#64748b", fontSize: 13 },
  btn: {
    borderRadius: 999,
    padding: "12px 18px",
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,.12)",
  },
  btnPrimary: {
    background: "#111827",
    color: "#fff",
  },
  btnGhost: {
    background: "#fff",
    color: "#111827",
    border: "1px solid #e5e7eb",
  },
  footer: {
    background: "#111827",
    color: "#cbd5e1",
    borderRadius: 22,
    padding: 16,
    margin: "18px 0 40px",
  },
};

/* ========= פונקציות פיננסיות ========= */
function pmt(rate, nper, pv, fv = 0) {
  if (rate === 0) return (pv - fv) / nper;
  const r1 = Math.pow(1 + rate, nper);
  return (rate * (pv * r1 - fv)) / (r1 - 1);
}
function monthlyRegular({ price, down, months }) {
  const pv = Math.max(0, price - down);
  return Math.max(0, pmt(RATE_MONTH, months, pv));
}
function monthlyBalloon({ price, down, months, balloonRatio }) {
  const pv = Math.max(0, price - down);
  const fv = Math.max(0, price * balloonRatio);
  return Math.max(0, pmt(RATE_MONTH, months, pv, fv));
}

/* ========= דאטה: מאגר דגמים ========= */
/* הערה: התמונות הן placeholder לבנות, כדי לשמור קו נקי.
   ניתן להחליף לכתובות CDN של יצרנים בעתיד. */
const carImage = (brand, model) =>
  `https://dummyimage.com/800x480/ffffff/111111.png&text=${encodeURIComponent(
    `${brand} ${model}`
  )}`;

// type: עירוני / משפחתי / פנאי/קרוסאובר / מנהלים / מסחרי / טנדר / יוקרה
// fuel: בנזין/דיזל / היברידי / חשמלי
const FLEET = [
  // עירוני
  { brand: "Kia", model: "Picanto", type: "עירוני", fuel: "בנזין/דיזל", price: 85000 },
  { brand: "Hyundai", model: "i10", type: "עירוני", fuel: "בנזין/דיזל", price: 87000 },
  { brand: "Suzuki", model: "Swift", type: "עירוני", fuel: "בנזין/דיזל", price: 102000 },

  // משפחתי / סדאן
  { brand: "Toyota", model: "Corolla Hybrid", type: "משפחתי", fuel: "היברידי", price: 155000 },
  { brand: "Hyundai", model: "Elantra", type: "משפחתי", fuel: "בנזין/דיזל", price: 139000 },
  { brand: "Mazda", model: "3", type: "משפחתי", fuel: "בנזין/דיזל", price: 142000 },

  // פנאי / קרוסאובר
  { brand: "BYD", model: "Atto 3", type: "פנאי/קרוסאובר", fuel: "חשמלי", price: 165000 },
  { brand: "MG", model: "ZS EV", type: "פנאי/קרוסאובר", fuel: "חשמלי", price: 149000 },
  { brand: "Mazda", model: "CX-30", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", price: 158000 },
  { brand: "Mazda", model: "CX-5", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", price: 198000 },
  { brand: "Nissan", model: "Qashqai", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", price: 169000 },
  { brand: "Hyundai", model: "Tucson", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", price: 175000 },
  { brand: "Skoda", model: "Octavia", type: "פנאי/קרוסאובר", fuel: "בנזין/דיזל", price: 165000 },

  // מנהלים
  { brand: "BMW", model: "320i", type: "מנהלים", fuel: "בנזין/דיזל", price: 299000 },
  { brand: "Mercedes", model: "C200", type: "מנהלים", fuel: "בנזין/דיזל", price: 325000 },
  { brand: "Audi", model: "A4", type: "מנהלים", fuel: "בנזין/דיזל", price: 295000 },

  // יוקרה / פרימיום
  { brand: "Audi", model: "Q5 45 TFSI", type: "יוקרה", fuel: "בנזין/דיזל", price: 365000 },
  { brand: "Mercedes", model: "GLC 300", type: "יוקרה", fuel: "בנזין/דיזל", price: 435000 },
  { brand: "Volvo", model: "XC60 Recharge", type: "יוקרה", fuel: "היברידי", price: 455000 },
  { brand: "Porsche", model: "Taycan", type: "יוקרה", fuel: "חשמלי", price: 780000 },
  { brand: "Range Rover", model: "Autobiography", type: "יוקרה", fuel: "בנזין/דיזל", price: 1050000 },
  { brand: "Bentley", model: "Continental GT", type: "יוקרה", fuel: "בנזין/דיזל", price: 1800000 },

  // חשמליים פופולריים
  { brand: "Tesla", model: "Model 3", type: "משפחתי", fuel: "חשמלי", price: 189000 },
  { brand: "Tesla", model: "Model Y", type: "פנאי/קרוסאובר", fuel: "חשמלי", price: 219000 },
  { brand: "Hyundai", model: "Kona Electric", type: "פנאי/קרוסאובר", fuel: "חשמלי", price: 179000 },
  { brand: "Skoda", model: "Enyaq", type: "פנאי/קרוסאובר", fuel: "חשמלי", price: 235000 },

  // מסחרי / טנדר
  { brand: "Toyota", model: "HiLux", type: "טנדר", fuel: "בנזין/דיזל", price: 245000 },
  { brand: "Ford", model: "Transit", type: "מסחרי", fuel: "בנזין/דיזל", price: 239000 },
  { brand: "Mercedes", model: "Vito", type: "מסחרי", fuel: "בנזין/דיזל", price: 289000 },
];

/* ========= קומפוננטות עזר ========= */
const H3 = ({ children }) => (
  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{children}</div>
);

const Pill = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      ...S.chipLight,
      ...(active ? { background: "#111827", color: "#fff" } : {}),
    }}
    aria-pressed={!!active}
  >
    {children}
  </button>
);

function Money({ val }) {
  const f = new Intl.NumberFormat("he-IL");
  return <b>{f.format(Math.round(val))} ₪</b>;
}

/* ========= עמוד ========= */
export default function App() {
  // טופ בר כפתורים
  const topButtons = (
    <div style={S.chipBar}>
      <a href={WA("שלום, אשמח להצעה על רכב חדש 0 ק\"מ")} style={S.chipLight}>
        דברו איתי בוואטסאפ
      </a>
      <a href={`tel:${PHONE_HUMAN.replaceAll("-", "")}`} style={S.chipDark}>
        התקשרו · {PHONE_HUMAN}
      </a>
    </div>
  );

  /* ----- מחשבון הלוואה ----- */
  const [tabLoan, setTabLoan] = useState("balloon"); // 'balloon' | 'regular'
  const [price, setPrice] = useState(150000);
  const [down, setDown] = useState(30000);
  const [months, setMonths] = useState(60);
  const [balloon, setBalloon] = useState(0.5); // עד 50%

  const pay = useMemo(() => {
    return tabLoan === "balloon"
      ? monthlyBalloon({ price, down, months, balloonRatio: balloon })
      : monthlyRegular({ price, down, months });
  }, [tabLoan, price, down, months, balloon]);

  /* ----- מאתר רכב חכם ----- */
  const [budget, setBudget] = useState(7000); // תקציב חודשי
  const [fType, setFType] = useState("הכל");
  const [fFuel, setFFuel] = useState("הכל");

  // החזר "החל מ" למאתר: מסלול בלון 60 ח', בלון 50%, ללא מקדמה.
  const monthlyForFinder = (carPrice) =>
    monthlyBalloon({
      price: carPrice,
      down: 0,
      months: 60,
      balloonRatio: 0.5,
    });

  const finderCars = useMemo(() => {
    const items = FLEET.map((c) => ({
      ...c,
      month: monthlyForFinder(c.price),
      img: carImage(c.brand, c.model),
    }))
      .filter((c) => (fType === "הכל" ? true : c.type === fType))
      .filter((c) => (fFuel === "הכל" ? true : c.fuel === fFuel))
      .filter((c) => c.month <= budget + 2000) // מעט סלחני לתקציב
      .sort((a, b) => a.month - b.month)
      .slice(0, 30);
    return items;
  }, [budget, fType, fFuel]);

  /* ----- טפסים ----- */
  // יצירת קשר
  const [lead, setLead] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    message: "",
  });
  const submitLead = () => {
    const txt = `היי R&M, אשמח להצעה מותאמת אישית.
שם: ${lead.name}
טלפון: ${lead.phone}
אימייל: ${lead.email}
עיר: ${lead.city}
הודעה: ${lead.message}`;
    window.location.href = WA(txt);
  };

  // טרייד-אין
  const [ti, setTI] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    brand: "",
    model: "",
    plate: "",
    year: "",
    km: "",
    notes: "",
  });
  const submitTI = () => {
    const txt = `בקשת טרייד-אין אונליין:
שם: ${ti.name}
טלפון: ${ti.phone}
אימייל: ${ti.email}
עיר: ${ti.city}
מותג/דגם: ${ti.brand} ${ti.model}
מס' רישוי: ${ti.plate}
שנת יצור: ${ti.year}
ק"מ: ${ti.km}
הערות: ${ti.notes}`;
    window.location.href = WA(txt);
  };

  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* HERO */}
        <header style={S.hero} aria-label="R&M רכבי יוקרה וספורט בהתאמה אישית">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>R&amp;M — חדש 0 ק״מ</div>
              <div style={{ opacity: 0.95, marginTop: 4 }}>
                מתמחים בהתאמת רכב מושלם ומימון משתלם במיוחד.
              </div>
            </div>
            <div
              aria-hidden
              style={{
                background: "#ff9d1b",
                color: "#111",
                fontWeight: 900,
                borderRadius: 16,
                padding: "10px 14px",
                alignSelf: "flex-start",
                whiteSpace: "nowrap",
              }}
            >
              R&amp;M
            </div>
          </div>

          {topButtons}

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2 }}>
              מוצאים לך את הרכב המושלם — ודואגים למימון המשתלם ביותר.
            </div>
            <div style={{ marginTop: 8, opacity: 0.95 }}>
              חדש 0 ק״מ בלבד · ליווי מלא עד ואחרי המסירה.
            </div>
          </div>

          <div style={{ ...S.chipBar, marginTop: 12 }}>
            <a href="#loan" style={S.chipLight}>
              מחשבון הלוואה
            </a>
            <a href="#finder" style={S.chipLight}>
              מאתר רכב חכם
            </a>
            <a href="#lead" style={S.chipLight}>
              יצירת קשר
            </a>
            <a href="#tradein" style={S.chipLight}>
              טרייד-אין
            </a>
          </div>
        </header>

        {/* מאתר רכב חכם */}
        <section id="finder" style={S.section} aria-label="מאתר רכב חכם">
          <h2 style={S.h2}>מאתר רכב חכם</h2>
          <div style={S.sub}>
            בחרו תקציב חודשי משוער – מציגים דגמים מתאימים והחזר חודשי
            התחל מ (מסלול בלון 60 ח׳, בלון 50%).
          </div>

          <H3>תקציב חודשי</H3>
          <input
            style={S.slider}
            type="range"
            min={800}
            max={20000}
            value={budget}
            onChange={(e) => setBudget(+e.target.value)}
          />
          <div style={{ marginBottom: 8 }}>
            <Money val={budget} /> לחודש
          </div>

          <H3>סוגי רכבים</H3>
          <div style={S.row}>
            {["הכל", "עירוני", "משפחתי", "פנאי/קרוסאובר", "מנהלים", "מסחרי", "טנדר", "יוקרה"].map(
              (t) => (
                <Pill key={t} active={fType === t} onClick={() => setFType(t)}>
                  {t}
                </Pill>
              )
            )}
          </div>

          <H3 style={{ marginTop: 10 }}>סוג הנעה</H3>
          <div style={S.row}>
            {["הכל", "בנזין/דיזל", "היברידי", "חשמלי"].map((t) => (
              <Pill key={t} active={fFuel === t} onClick={() => setFFuel(t)}>
                {t}
              </Pill>
            ))}
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            {finderCars.map((c, idx) => (
              <article key={idx} style={S.card}>
                <img
                  src={c.img}
                  alt={`${c.brand} ${c.model}`}
                  loading="lazy"
                  style={S.img}
                />
                <div>
                  <div style={{ fontWeight: 900 }}>
                    {c.brand} {c.model}
                  </div>
                  <div style={S.small}>
                    {c.type} · {c.fuel}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 16 }}>
                    החל מ <Money val={c.month} /> לחודש
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={WA(
                        `היי, בעניין ${c.brand} ${c.model} — אשמח להצעה. החזר חודשי משוער: ${Math.round(
                          c.month
                        )} ₪ לחודש.`
                      )}
                      style={{ ...S.btn, ...S.btnGhost }}
                    >
                      קבלו הצעה
                    </a>
                  </div>
                </div>
              </article>
            ))}

            {finderCars.length === 0 && (
              <div style={S.small}>
                לא נמצאו דגמים בתקציב הנוכחי. נסו להעלות מעט את התקציב או לשנות
                סינון.
              </div>
            )}
          </div>
        </section>

        {/* מחשבון הלוואה */}
        <section id="loan" style={S.section} aria-label="מחשבון הלוואה">
          <h2 style={S.h2}>מחשבון הלוואה</h2>
          <div style={S.row}>
            <Pill active={tabLoan === "regular"} onClick={() => setTabLoan("regular")}>
              רגיל (עד 100 ח׳)
            </Pill>
            <Pill active={tabLoan === "balloon"} onClick={() => setTabLoan("balloon")}>
              בלון (עד 60 ח׳)
            </Pill>
          </div>

          <div style={{ marginTop: 10 }}>
            <H3>מחיר רכב</H3>
            <input
              style={S.input}
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(+e.target.value || 0)}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <H3>מקדמה</H3>
            <input
              style={S.input}
              inputMode="numeric"
              value={down}
              onChange={(e) => setDown(+e.target.value || 0)}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <H3>מספר חודשים</H3>
            <input
              style={S.slider}
              type="range"
              min={tabLoan === "regular" ? 12 : 12}
              max={tabLoan === "regular" ? 100 : 60}
              value={months}
              onChange={(e) => setMonths(+e.target.value)}
            />
            <div><b>{months}</b> ח׳</div>
          </div>

          {tabLoan === "balloon" && (
            <div style={{ marginTop: 10 }}>
              <H3>סכום בלון בסוף התקופה (עד 50% ממחיר הרכב)</H3>
              <input
                style={S.slider}
                type="range"
                min={0}
                max={0.5}
                step={0.01}
                value={balloon}
                onChange={(e) => setBalloon(+e.target.value)}
              />
              <div>
                בלון: <Money val={price * balloon} />
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 16,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "grid",
              gap: 6,
            }}
          >
            <div>
              החזר חודשי משוער: <Money val={pay} />
            </div>
            <div>
              סכום מימון: <Money val={Math.max(0, price - down)} />
            </div>
            {tabLoan === "balloon" && (
              <div>
                בלון לסוף התקופה: <Money val={price * balloon} />
              </div>
            )}
          </div>

          <div style={{ ...S.small, marginTop: 8 }}>
            * החישוב להמחשה בלבד; ההצעה הסופית תיקבע לאחר בדיקה אישית.
          </div>

          <div style={{ marginTop: 10 }}>
            <a
              href={WA(
                `שלום R&M, בקשת חישוב מימון:
סוג מסלול: ${tabLoan === "balloon" ? "בלון" : "רגיל"}
מחיר רכב: ${price} ₪
מקדמה: ${down} ₪
חודשים: ${months}
בלון: ${tabLoan === "balloon" ? Math.round(price * balloon) + " ₪" : "אין"}
החזר חודשי משוער: ${Math.round(pay)} ₪`
              )}
              style={{ ...S.btn, ...S.btnPrimary }}
            >
              בקשת הצעה בוואטסאפ
            </a>
          </div>
        </section>

        {/* יצירת קשר */}
        <section id="lead" style={S.section} aria-label="יצירת קשר">
          <h2 style={S.h2}>יצירת קשר</h2>
          <div style={S.sub}>
            נחזור אליך עם הצעה מותאמת אישית — בלי לחץ לחתום, רק כשנמצא עבורך את
            הטוב ביותר.
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <input
              style={S.input}
              placeholder="שם מלא"
              value={lead.name}
              onChange={(e) => setLead({ ...lead, name: e.target.value })}
            />
            <input
              style={S.input}
              placeholder="טלפון"
              inputMode="tel"
              value={lead.phone}
              onChange={(e) => setLead({ ...lead, phone: e.target.value })}
            />
            <input
              style={S.input}
              placeholder="אימייל"
              inputMode="email"
              value={lead.email}
              onChange={(e) => setLead({ ...lead, email: e.target.value })}
            />
            <input
              style={S.input}
              placeholder="עיר"
              value={lead.city}
              onChange={(e) => setLead({ ...lead, city: e.target.value })}
            />
            <textarea
              style={{ ...S.input, height: 110, paddingTop: 10 }}
              placeholder="מה חשוב לך ברכב החדש?"
              value={lead.message}
              onChange={(e) => setLead({ ...lead, message: e.target.value })}
            />
            <button style={{ ...S.btn, ...S.btnPrimary }} onClick={submitLead}>
              שלחו ונחזור אליכם
            </button>
          </div>
        </section>

        {/* טרייד-אין */}
        <section id="tradein" style={S.section} aria-label="טרייד-אין אונליין">
          <h2 style={S.h2}>טרייד־אין אונליין</h2>
          <div style={S.sub}>
            הערכת שווי מהירה מרחוק וקידום בעסקה חדשה — ממלאים טופס מסודר ונחזור
            עם הצעה.
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <input
              style={S.input}
              placeholder="שם מלא"
              value={ti.name}
              onChange={(e) => setTI({ ...ti, name: e.target.value })}
            />
            <input
              style={S.input}
              placeholder="טלפון"
              inputMode="tel"
              value={ti.phone}
              onChange={(e) => setTI({ ...ti, phone: e.target.value })}
            />
            <input
              style={S.input}
              placeholder="אימייל"
              inputMode="email"
              value={ti.email}
              onChange={(e) => setTI({ ...ti, email: e.target.value })}
            />
            <input
              style={S.input}
              placeholder="עיר"
              value={ti.city}
              onChange={(e) => setTI({ ...ti, city: e.target.value })}
            />

            <div style={S.row}>
              <input
                style={{ ...S.input, flex: 1, minWidth: 140 }}
                placeholder="מותג"
                value={ti.brand}
                onChange={(e) => setTI({ ...ti, brand: e.target.value })}
              />
              <input
                style={{ ...S.input, flex: 1, minWidth: 140 }}
                placeholder="דגם"
                value={ti.model}
                onChange={(e) => setTI({ ...ti, model: e.target.value })}
              />
            </div>

            <div style={S.row}>
              <input
                style={{ ...S.input, flex: 1, minWidth: 140 }}
                placeholder="מס' רישוי"
                value={ti.plate}
                onChange={(e) => setTI({ ...ti, plate: e.target.value })}
              />
              <input
                style={{ ...S.input, flex: 1, minWidth: 140 }}
                placeholder="שנת יצור"
                inputMode="numeric"
                value={ti.year}
                onChange={(e) => setTI({ ...ti, year: e.target.value })}
              />
              <input
                style={{ ...S.input, flex: 1, minWidth: 140 }}
                placeholder="ק״מ"
                inputMode="numeric"
                value={ti.km}
                onChange={(e) => setTI({ ...ti, km: e.target.value })}
              />
            </div>

            <textarea
              style={{ ...S.input, height: 110, paddingTop: 10 }}
              placeholder="הערות"
              value={ti.notes}
              onChange={(e) => setTI({ ...ti, notes: e.target.value })}
            />
            <button style={{ ...S.btn, ...S.btnGhost }} onClick={submitTI}>
              שלחו הערכה בוואטסאפ
            </button>
          </div>
        </section>

        {/* פוטר עם דגשים */}
        <footer style={S.footer}>
          <div style={{ fontWeight: 900, color: "white", marginBottom: 8 }}>R&amp;M</div>
          <ul style={{ margin: 0, paddingInlineStart: 18 }}>
            <li>ליווי מלא בהתאמת הרכב לצרכים שלך.</li>
            <li>ליווי מלא בתהליך המימון מול חברות ובנקים — עד שמוצאים את המסלול המשתלם ביותר.</li>
            <li>שירות VIP עד ואחרי המסירה — מצטרפים למשפחת R&amp;M.</li>
          </ul>

          <div style={{ ...S.chipBar, marginTop: 12 }}>
            <a href={WA()} style={S.chipLight}>
              וואטסאפ
            </a>
            <a href={`tel:${PHONE_HUMAN.replaceAll("-", "")}`} style={S.chipLight}>
              חיוג {PHONE_HUMAN}
            </a>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>
            © R&amp;M 2025 · חדש 0 ק״מ · כל הזכויות שמורות.
          </div>
        </footer>
      </div>
    </div>
  );
}
