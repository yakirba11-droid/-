import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

/* ================= עזרי חישוב ================= */
const APR_DEFAULT = 5.9; // צמוד מדד
const BALLOON_FRAC = 0.5;

const fmt = (n) =>
  isFinite(n)
    ? n.toLocaleString("he-IL", {
        style: "currency",
        currency: "ILS",
        maximumFractionDigits: 0,
      })
    : "—";

const slugify = (s = "") =>
  s.toLowerCase().replace(/[^\w]+/g, "-").replace(/-+/g, "-");

/* ================= חישוב תשלום חודשי ================= */
function monthlyPayment({ price, down = 0, months = 60, plan = "standard" }) {
  const P0 = Math.max(0, Number(price) - Number(down));
  const r = APR_DEFAULT / 100 / 12;
  if (plan === "balloon") {
    const F = BALLOON_FRAC * price;
    return (r * (P0 - F / Math.pow(1 + r, months))) / (1 - Math.pow(1 + r, -months));
  }
  return (r * P0) / (1 - Math.pow(1 + r, -months));
}

/* ================= קומפוננטות ================= */
function CarImage({ slug, alt }) {
  return (
    <div className="car-image-wrap">
      <img src={`/cars/${slug}.png`} alt={alt} onError={(e)=>{e.target.src="/cars/_placeholder.svg"}} />
    </div>
  );
}

function SidebarCategories({ activeTab, setActiveTab, countsByCat }) {
  const items = [
    { key: "הכל", icon: "🏠" },
    { key: "חשמלי", icon: "⚡️" },
    { key: "היברידי", icon: "♻️" },
    { key: "בנזין", icon: "⛽️" },
    { key: "יוקרה", icon: "⭐️" },
  ];
  return (
    <aside className="side">
      <div className="side-title">קטגוריות</div>
      <nav className="side-nav">
        {items.map(({ key, icon }) => (
          <button
            key={key}
            className={`side-item ${activeTab === key ? "active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            <span>{icon}</span>
            <span className="side-text">{key}</span>
            <span className="side-count">{countsByCat[key] || 0}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function FinanceCalculator() {
  const [plan, setPlan] = useState("standard");
  const [price, setPrice] = useState(150000);
  const [down, setDown] = useState(30000);
  const [months, setMonths] = useState(60);

  const m = Math.round(monthlyPayment({ price, down, months, plan }));
  const balloonEnd = plan === "balloon" ? Math.round(price * BALLOON_FRAC) : 0;

  return (
    <div className="card finance">
      <div className="title">מחשבוני מימון</div>
      <div className="plans">
        <button className={plan==="standard"?"active":""} onClick={()=>setPlan("standard")}>רגיל</button>
        <button className={plan==="balloon"?"active":""} onClick={()=>setPlan("balloon")}>בלון 50%/60ח׳</button>
      </div>
      <div className="form">
        <label>מחיר<input type="number" value={price} onChange={(e)=>setPrice(+e.target.value)}/></label>
        <label>מקדמה<input type="number" value={down} onChange={(e)=>setDown(+e.target.value)}/></label>
        <label>חודשים<input type="number" value={months} disabled={plan==="balloon"} onChange={(e)=>setMonths(+e.target.value)}/></label>
      </div>
      <div className="summary">
        <div>חודשי משוער: {fmt(m)}</div>
        {plan==="balloon" && <div>בלון סוף תקופה: {fmt(balloonEnd)}</div>}
      </div>
      <div className="fine">* החישוב להמחשה בלבד · ריבית צמוד מדד 5.9% · עשוי להשתנות לפי דירוג הלקוח</div>
    </div>
  );
}

/* ================= אפליקציה ================= */
export default function App() {
  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.title = "R&M מוטורס — חדש 0 ק״מ";
  }, []);

  const whatsapp = "9725XXXXXXXX"; // ← להחליף למספר שלך
  const [activeTab, setActiveTab] = useState("הכל");

  const cars = [
    {id:"1", title:"Hyundai Tucson Hybrid", year:2025, price:199900, fuel:"היברידי", category:"היברידי", slug:"hyundai-tucson-hybrid", highlights:["0 ק״מ","מפרט עשיר","אספקה מיידית"]},
    {id:"2", title:"Tesla Model 3", year:2025, price:189900, fuel:"חשמלי", category:"חשמלי", slug:"tesla-model-3", highlights:["טעינה מהירה","טכנולוגיה מתקדמת"]},
    {id:"3", title:"BMW X5", year:2025, price:399900, fuel:"בנזין", category:"יוקרה", slug:"bmw-x5", highlights:["יוקרה","0 ק״מ","מנוע חזק"]},
  ];

  const countsByCat = {
    הכל: cars.length,
    חשמלי: cars.filter(c=>c.category==="חשמלי").length,
    היברידי: cars.filter(c=>c.category==="היברידי").length,
    בנזין: cars.filter(c=>c.category==="בנזין").length,
    יוקרה: cars.filter(c=>c.category==="יוקרה").length,
  };

  const filtered = cars.filter(c=>activeTab==="הכל" ? true : c.category===activeTab);

  return (
    <div className="site">
      <header className="header">
        <div className="container row sb">
          <div className="row g8 a-center">
            <img src="/logo.png" alt="R&M מוטורס" className="logo"/>
            <div>
              <div className="brand">R&M מוטורס — חדש 0 ק״מ</div>
              <div className="sub">רכב יוקרה וספורט בהתאמה אישית</div>
            </div>
          </div>
          <a className="btn outline" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">ווטסאפ</a>
        </div>
      </header>

      <section className="container layout-with-side">
        <SidebarCategories activeTab={activeTab} setActiveTab={setActiveTab} countsByCat={countsByCat}/>
        <div className="layout-main grid3 gap24">
          {filtered.map(car=>{
            const perMonth = Math.round(monthlyPayment({price:car.price, plan:"standard"}));
            return (
              <div key={car.id} className="car-card">
                <CarImage slug={car.slug} alt={car.title}/>
                <div className="card-body">
                  <h3>{car.title}</h3>
                  <div>{fmt(car.price)}</div>
                  <div>החל מ־{fmt(perMonth)} לחודש</div>
                  <ul>{car.highlights.map(h=><li key={h}>{h}</li>)}</ul>
                  <a className="btn primary" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`שלום, מעוניין ב-${car.title}`)}`} target="_blank" rel="noreferrer">בקשת הצעת מחיר</a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="finance" className="container">
        <FinanceCalculator/>
      </section>

      <footer className="footer">
        <div className="container row sb">
          <div className="muted">© {new Date().getFullYear()} R&M מוטורס — כל הזכויות שמורות</div>
          <a className="btn white" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">ווטסאפ</a>
        </div>
      </footer>
    </div>
  );
}
