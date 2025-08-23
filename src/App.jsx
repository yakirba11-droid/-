import { useMemo, useState } from "react";
import "./styles.css";

/* ===== הגדרות כלליות ===== */
const PHONE_HUMAN = "052-640-6728";
const PHONE_INTL = "972526406728";
const WA = (txt = "שלום, אשמח להצעה") =>
  `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(txt)}`;

/* ===== עזרי חישוב ===== */
// לא מציגים ריבית למשתמש, אך מחשבים ברקע.
const RATE_ANNUAL = 0.059; // לא מוצג
const rMonthly = RATE_ANNUAL / 12;
const fmt = (n) =>
  "₪ " +
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** תשלום חודשי רגיל (PV, n) */
function pmtRegular(pv, n) {
  if (n <= 0) return 0;
  if (rMonthly === 0) return pv / n;
  const a = Math.pow(1 + rMonthly, -n);
  return (pv * rMonthly) / (1 - a);
}

/** תשלום חודשי עם בלון (PV, n, FV) */
function pmtBalloon(pv, n, fv) {
  if (n <= 0) return 0;
  if (rMonthly === 0) return (pv - fv / Math.pow(1, n)) / n;
  const a = Math.pow(1 + rMonthly, -n);
  return ((pv - fv * a) * rMonthly) / (1 - a);
}

/* ===== קומפוננטות UI ===== */

function HeaderCTA() {
  return (
    <div
      dir="rtl"
      className="sticky top-0 z-50"
      style={{
        backdropFilter: "saturate(140%) blur(8px)",
        background: "rgba(255,255,255,0.75)",
        borderBottom: "1px solid #eee",
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: 920,
          margin: "0 auto",
          padding: "12px 14px",
          display: "flex",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a
          href="#top"
          aria-label="R&M"
          style={{
            background: "#FF9F1C",
            color: "#000",
            fontWeight: 800,
            borderRadius: 28,
            padding: "10px 14px",
            boxShadow: "inset 0 -2px 0 rgba(0,0,0,.15)",
          }}
        >
          R&M
        </a>

        <div style={{ display: "flex", gap: 8 }}>
          <a
            href={`tel:${PHONE_INTL}`}
            style={pill("outline")}
            aria-label="חיוג"
          >
            חיוג {PHONE_HUMAN}
          </a>
          <a
            href={WA("שלום, אשמח להצעת מימון/רכב")}
            style={pill("solid")}
            aria-label="דברו איתי בוואטסאפ"
          >
            דברו איתי בוואטסאפ
          </a>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section dir="rtl" style={{ padding: "18px 14px 6px" }}>
      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
          borderRadius: 28,
          padding: 20,
          background:
            "linear-gradient(135deg, #cbb6ff 0%, #ffb3a7 40%, #ffdf9e 100%)",
        }}
      >
        <div
          style={{
            borderRadius: 22,
            padding: "26px 20px",
            background: "rgba(255,255,255,0.55)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              lineHeight: 1.35,
              fontWeight: 800,
              color: "#111",
            }}
          >
            R&M רכבי יוקרה וספורט בהתאמה אישית
          </h1>
          <p style={{ margin: "10px 0 0", color: "#333", fontSize: 16 }}>
            מתמחים בכל סוגי הרכבים החדשים • מציאת מימון משתלם במיוחד • ליווי
            מלא עד המסירה וגם לאחריה
          </p>
        </div>
      </div>
    </section>
  );
}

function LoanCalculator() {
  const [mode, setMode] = useState("balloon"); // 'regular' | 'balloon'
  const [price, setPrice] = useState(150000);
  const [down, setDown] = useState(30000);
  const [months, setMonths] = useState(60);
  const [balloon, setBalloon] = useState(0); // נבחר רק במצב בלון

  // מגבלות
  const maxBalloon = Math.floor(price * 0.5);
  const minMonths = mode === "regular" ? 3 : 6;
  const maxMonths = mode === "regular" ? 100 : 60;

  // קלאמפ
  const safeDown = Math.min(Math.max(down, 0), price);
  const safeBalloon = mode === "balloon" ? Math.min(Math.max(balloon, 0), maxBalloon) : 0;
  const safeMonths = Math.min(Math.max(months, minMonths), maxMonths);

  const financed = Math.max(price - safeDown, 0);

  const monthly = useMemo(() => {
    if (mode === "regular") return pmtRegular(financed, safeMonths);
    return pmtBalloon(financed, safeMonths, safeBalloon);
  }, [mode, financed, safeMonths, safeBalloon]);

  return (
    <section dir="rtl" style={{ padding: "22px 14px" }} id="calc">
      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
          borderRadius: 18,
          padding: 16,
          background: "#fff",
          boxShadow: "0 8px 24px rgba(0,0,0,.06)",
          border: "1px solid #eee",
        }}
      >
        <h2 style={{ margin: "0 0 10px", fontSize: 22 }}>מחשבון הלוואה</h2>

        <div
          role="tablist"
          aria-label="בחירת מסלול"
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setMode("regular")}
            style={tab(mode === "regular")}
            role="tab"
          >
            רגיל (עד 100 ח׳)
          </button>
          <button
            onClick={() => setMode("balloon")}
            style={tab(mode === "balloon")}
            role="tab"
          >
            בלון (עד 60 ח׳)
          </button>
        </div>

        <Field
          label="מחיר רכב"
          value={price}
          onChange={(v) => setPrice(safeNum(v))}
          min={20000}
          max={3000000}
          step={1000}
        />

        <Field
          label="מקדמה"
          value={safeDown}
          onChange={(v) => setDown(safeNum(v))}
          min={0}
          max={price}
          step={1000}
        />

        <div style={{ marginTop: 14 }}>
          <label
            style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
          >
            מס׳ חודשים
          </label>
          <input
            type="range"
            min={minMonths}
            max={maxMonths}
            value={safeMonths}
            onChange={(e) => setMonths(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ fontSize: 13, color: "#555" }}>{safeMonths} ח׳</div>
        </div>

        {mode === "balloon" && (
          <div style={{ marginTop: 14 }}>
            <label
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              סכום בלון בסוף התקופה
            </label>
            <input
              type="range"
              min={0}
              max={maxBalloon}
              value={safeBalloon}
              onChange={(e) => setBalloon(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ fontSize: 13, color: "#555" }}>
              ניתן לבחור כל סכום עד {fmt(maxBalloon)}.
            </div>
          </div>
        )}

        <div
          aria-live="polite"
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 14,
            background: "#f8f8fb",
            border: "1px dashed #ddd",
            lineHeight: 1.7,
          }}
        >
          <div>
            <strong>החזר חודשי משוער:</strong> {fmt(monthly)}
          </div>
          <div>
            <strong>סכום מימון:</strong> {fmt(financed)}
          </div>
          {mode === "balloon" && (
            <div>
              <strong>יתרת בלון בסוף התקופה:</strong> {fmt(safeBalloon)}
            </div>
          )}
          <p style={{ fontSize: 12, color: "#666", margin: "8px 0 0" }}>
            * החישוב להמחשה בלבד; הצעה סופית תיקבע לאחר בדיקה אישית. אין לראות
            בתוצאה התחייבות.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <a href={`tel:${PHONE_INTL}`} style={pill("outline")}>
            חיוג {PHONE_HUMAN}
          </a>
          <a
            href={WA(
              `שלום, מעוניין/ת בהצעת מימון. מחיר: ${fmt(
                price
              )}, מקדמה: ${fmt(safeDown)}, חודשים: ${safeMonths}${
                mode === "balloon" ? `, בלון: ${fmt(safeBalloon)}` : ""
              }`
            )}
            style={pill("solid")}
          >
            בקשת הצעה בוואטסאפ
          </a>
        </div>
      </div>
    </section>
  );
}

function SmartFinderChat() {
  // צ'אט קצר: תקציב חודשי -> סוג רכב -> סוג הנעה -> תוצאה כללית (בלי שמות דגמים)
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(2500);
  const [category, setCategory] = useState("");
  const [power, setPower] = useState("");

  const estMonthly = useMemo(() => {
    // מייצרים אומדן ע״ב התקציב והעדפות – רק להנעה לפעולה, בלי מודלים
    const base = Math.max(1500, Math.min(budget, 10000));
    return Math.round(base);
  }, [budget]);

  const summary = `מאתר רכב חכם – סיכום:
תקציב חודשי: ${fmt(estMonthly)}
קטגוריה: ${category || "גמיש"}
סוג הנעה: ${power || "גמיש"}

נשמח לשלוח 3 התאמות מדויקות ולהתקדם להצעה משתלמת.`;

  return (
    <section dir="rtl" style={{ padding: "14px" }} id="smart">
      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
          borderRadius: 18,
          padding: 16,
          background: "#fff",
          boxShadow: "0 8px 24px rgba(0,0,0,.06)",
          border: "1px solid #eee",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>מאתר רכב חכם</h2>
        <p style={{ margin: "6px 0 16px", color: "#555" }}>
          צ׳אט קצר שמחזיר התאמות עם החזר חודשי משוער – כדי להתחיל מידית.
        </p>

        {step === 0 && (
          <div>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
              מה התקציב החודשי המשוער לרכב?
            </label>
            <input
              type="range"
              min={1500}
              max={10000}
              step={100}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ marginTop: 6, fontWeight: 700 }}>{fmt(budget)}</div>

            <div style={{ marginTop: 14 }}>
              <button style={pill("solid")} onClick={() => setStep(1)}>
                המשך
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
              איזה סוג רכב מעניין אותך?
            </label>
            <WrapBtns
              options={[
                "עירוני",
                "משפחתי",
                "פנאי/קרוסאובר",
                "מנהלים",
                "מסחרי",
                "יוקרה",
                "ספורט/על",
                "סדאן",
              ]}
              value={category}
              onChange={setCategory}
            />
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <button style={pill("outline")} onClick={() => setStep(0)}>
                חזרה
              </button>
              <button style={pill("solid")} onClick={() => setStep(2)}>
                הבא
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
              העדפת הנעה?
            </label>
            <WrapBtns
              options={["בנזין/דיזל", "היברידי", "חשמלי", "ללא עדיפות"]}
              value={power}
              onChange={setPower}
            />
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <button style={pill("outline")} onClick={() => setStep(1)}>
                חזרה
              </button>
              <button style={pill("solid")} onClick={() => setStep(3)}>
                הצג התאמה
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div
            style={{
              marginTop: 4,
              padding: 12,
              borderRadius: 14,
              background: "#f8f8fb",
              border: "1px dashed #ddd",
              lineHeight: 1.7,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 22 }}>🤖</span>
              <strong>יש לנו התאמה מוכנה עבורך!</strong>
            </div>
            <div style={{ marginTop: 8 }}>
              החזר חודשי התחלתי סביב <strong>{fmt(estMonthly)}</strong> (מסלול
              בלון עד 60 ח׳). לפרטים והתאמה סופית לחץ על וואטסאפ.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <a
                href={WA(summary)}
                style={pill("solid")}
              >
                קבלו 3 התאמות בוואטסאפ
              </a>
              <button style={pill("outline")} onClick={() => setStep(0)}>
                התחל מחדש
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function About() {
  return (
    <section dir="rtl" style={{ padding: "10px 14px 0" }}>
      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
          borderRadius: 18,
          padding: 18,
          background: "linear-gradient(180deg,#ffffff 0%, #f7f5ff 100%)",
          border: "1px solid #eee",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>מי אנחנו</h2>
        <p style={{ color: "#444", lineHeight: 1.8 }}>
          ב־R&amp;M אנחנו חיים ונושמים רכבים חדשים – עם יחס VIP, שקיפות מלאה
          ומיקוד בתוצאה: רכב שמתאים לך ומימון שנוח לך. אנחנו משווים בין כל
          חברות המימון והבנקים **ורק אחרי** שמצאנו את המסלול המשתלם ביותר –
          מתקדמים יחד.
        </p>
        <ul style={{ margin: 0, paddingInlineStart: 20, lineHeight: 1.9 }}>
          <li>מוצאים לך את הרכב המתאים – רק אז חותמים.</li>
          <li>בדיקת מימון רחבה מול בנקים וחברות – עד שנמצא את המסלול המשתלם.</li>
          <li>ליווי יד ביד עד המסירה, וגם אחרי – מצטרפים למשפחת R&amp;M.</li>
        </ul>
      </div>
    </section>
  );
}

function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const text = `בקשת יצירת קשר:
שם: ${name}
טלפון: ${phone}
אימייל: ${email}
עיר: ${city}
הודעה: ${msg}`;

  return (
    <section dir="rtl" style={{ padding: "14px" }} id="contact">
      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
          borderRadius: 18,
          padding: 16,
          background: "#fff",
          boxShadow: "0 8px 24px rgba(0,0,0,.06)",
          border: "1px solid #eee",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>יצירת קשר</h2>
        <p style={{ margin: "6px 0 14px", color: "#555" }}>
          נחזור אליך עם הצעה מותאמת אישית – בלי לחץ לחתום, רק כשמצאנו עבורך את
          הטוב ביותר.
        </p>

        <Grid two>
          <Input label="שם מלא" value={name} onChange={setName} />
          <Input label="טלפון" value={phone} onChange={setPhone} pattern="^[0-9\-+ ]*$" />
          <Input label="אימייל" value={email} onChange={setEmail} />
          <Input label="עיר" value={city} onChange={setCity} />
          <TextArea label="הודעה" value={msg} onChange={setMsg} rows={4} wide />
        </Grid>

        <div style={{ marginTop: 12 }}>
          <a href={WA(text)} style={pill("solid")}>
            שלחו ונחזור אליכם
          </a>
        </div>
      </div>
    </section>
  );
}

function TradeInForm() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    brand: "",
    model: "",
    year: "",
    km: "",
    plate: "",
    notes: "",
    imageUrl: "",
  });

  const txt = `טופס טרייד־אין:
שם: ${form.fullName}
טלפון: ${form.phone}
אימייל: ${form.email}
מותג: ${form.brand}
דגם: ${form.model}
שנת יצור: ${form.year}
ק״מ: ${form.km}
מס׳ רישוי: ${form.plate}
תמונה/קישור: ${form.imageUrl}
הערות: ${form.notes}`;

  return (
    <section dir="rtl" style={{ padding: "14px" }} id="tradein">
      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
          borderRadius: 18,
          padding: 16,
          background: "#fff",
          boxShadow: "0 8px 24px rgba(0,0,0,.06)",
          border: "1px solid #eee",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>טרייד־אין אונליין</h2>
        <p style={{ margin: "6px 0 14px", color: "#555" }}>
          הערכת שווי מהירה מרחוק וקידום בעסקה חדשה – ממלאים טופס מסודר ונחזור
          עם הצעה.
        </p>

        <Grid two>
          <Input
            label="שם מלא"
            value={form.fullName}
            onChange={(v) => setForm({ ...form, fullName: v })}
          />
          <Input
            label="טלפון"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            pattern="^[0-9\-+ ]*$"
          />
          <Input
            label="אימייל"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />
          <Input
            label="מותג"
            value={form.brand}
            onChange={(v) => setForm({ ...form, brand: v })}
          />
          <Input
            label="דגם"
            value={form.model}
            onChange={(v) => setForm({ ...form, model: v })}
          />
          <Input
            label="שנת יצור"
            value={form.year}
            onChange={(v) => setForm({ ...form, year: v })}
          />
          <Input
            label="ק״מ"
            value={form.km}
            onChange={(v) => setForm({ ...form, km: v })}
          />
          <Input
            label="מס׳ רישוי"
            value={form.plate}
            onChange={(v) => setForm({ ...form, plate: v })}
          />
          <Input
            label="תמונה/קישור"
            value={form.imageUrl}
            onChange={(v) => setForm({ ...form, imageUrl: v })}
            placeholder="קישור לתמונה (לא חובה)"
            wide
          />
          <TextArea
            label="הערות"
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
            rows={4}
            wide
          />
        </Grid>

        <div style={{ marginTop: 12 }}>
          <a href={WA(txt)} style={pill("solid")}>
            שלחו הערכה בוואטסאפ
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer dir="rtl" style={{ padding: "18px 14px 34px" }}>
      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
          borderRadius: 18,
          padding: 16,
          background: "#fff",
          border: "1px solid #eee",
          boxShadow: "0 8px 24px rgba(0,0,0,.06)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>למה R&M?</h3>
        <ul style={{ margin: 0, paddingInlineStart: 20, lineHeight: 1.9 }}>
          <li>מוצאים לך את הרכב המתאים – רק אז חותמים.</li>
          <li>מימון מותאם אישית – השוואה מול בנקים וחברות עד שנמצא את המסלול המשתלם ביותר.</li>
          <li>ליווי יד ביד עד מסירה, וגם אחרי – מצטרפים למשפחת R&M.</li>
        </ul>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <a href={`tel:${PHONE_INTL}`} style={pill("outline")}>
            חיוג {PHONE_HUMAN}
          </a>
          <a href={WA("שלום, רוצה לדבר על רכב/מימון")} style={pill("solid")}>
            וואטסאפ
          </a>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
          © R&M 2025 • כל הזכויות שמורות
        </div>
      </div>
    </footer>
  );
}

/* ===== רכיבי עזר קטנים ===== */

function Field({ label, value, onChange, min, max, step = 1000 }) {
  return (
    <div style={{ marginTop: 10 }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(safeNum(e.target.value))}
        style={inputStyle}
      />
    </div>
  );
}

function Input({ label, value, onChange, placeholder, pattern, wide }) {
  return (
    <div style={{ flex: wide ? "1 1 100%" : "1 1 0", minWidth: 0 }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>
      <input
        value={value}
        placeholder={placeholder}
        pattern={pattern}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 3, wide }) {
  return (
    <div style={{ flex: wide ? "1 1 100%" : "1 1 0", minWidth: 0 }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, resize: "vertical" }}
      />
    </div>
  );
}

function Grid({ children, two = false }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: two ? "1fr 1fr" : "1fr",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function WrapBtns({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt === value ? "" : opt)}
          style={chip(opt === value)}
          aria-pressed={opt === value}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  fontSize: 16,
  padding: "12px 12px",
  borderRadius: 12,
  border: "1px solid #e6e6ea",
  background: "#fff",
  outline: "none",
};

function chip(active) {
  return {
    padding: "8px 14px",
    borderRadius: 999,
    border: active ? "2px solid #805ad5" : "1px solid #e5e7eb",
    background: active ? "rgba(128,90,213,.08)" : "#fff",
    color: "#111",
    fontWeight: 600,
  };
}

function pill(variant) {
  const base = {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 999,
    fontWeight: 800,
    textDecoration: "none",
    lineHeight: 1,
  };
  if (variant === "solid") {
    return {
      ...base,
      background: "#111",
      color: "#fff",
      boxShadow: "inset 0 -2px 0 rgba(255,255,255,.08)",
    };
  }
  return {
    ...base,
    background: "#fff",
    color: "#111",
    border: "1px solid #dcdcdc",
  };
}

function tab(active) {
  return {
    padding: "8px 12px",
    borderRadius: 999,
    border: active ? "2px solid #805ad5" : "1px solid #e5e7eb",
    background: active ? "rgba(128,90,213,.08)" : "#fff",
    fontWeight: 700,
  };
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* ===== ה־App ===== */

export default function App() {
  return (
    <div dir="rtl" style={{ background: "#f8fafc", minHeight: "100vh" }} id="top">
      <HeaderCTA />
      <Hero />
      <About />
      <LoanCalculator />
      <SmartFinderChat />
      <ContactForm />
      <TradeInForm />
      <Footer />
    </div>
  );
}
