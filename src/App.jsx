import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

/* ===== קבועים ועזר ===== */
const APR_DEFAULT = 5.9;          // צמוד מדד (לא מוצג)
const BALLOON_FRAC = 0.5;         // בלון 50% בסוף תקופה
const fmt = (n)=> isFinite(n) ? n.toLocaleString("he-IL",{style:"currency",currency:"ILS",maximumFractionDigits:0}) : "—";
const slugify = (s="")=>s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");

/* תשלום חודשי */
function monthlyPayment({price, down=0, months=60, plan="standard"}) {
  const P0 = Math.max(0, Number(price||0) - Number(down||0));
  const r  = APR_DEFAULT/100/12;
  if (plan==="balloon") {
    const F = BALLOON_FRAC * Number(price||0);
    const den = 1 - Math.pow(1+r, -months);
    return (r * (P0 - F/Math.pow(1+r, months))) / den;
  }
  const den = 1 - Math.pow(1+r, -months);
  return (r*P0)/den;
}

/* קריאת CSV מהמלאי */
async function parseCSV(url){
  const res = await fetch(`${url}?v=${Date.now()}`, {cache:"no-store"});
  const text = await res.text();
  const [header, ...rows] = text.trim().split(/\r?\n/);
  const headers = header.split(",").map(h=>h.trim());
  const lux = ["BMW","Mercedes","Audi","Lexus","Volvo"];
  const deriveCat = (title, fuel)=>{
    if (lux.some(b=>(title||"").includes(b))) return "יוקרה";
    if (fuel==="חשמלי") return "חשמלי";
    if (fuel==="היברידי") return "היברידי";
    return "בנזין";
  };
  return rows.filter(Boolean).map(r=>{
    const cols = r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c=>c.replace(/^"|"$/g,"").trim());
    const o={}; headers.forEach((h,i)=>o[h]=cols[i]);
    o.year=+o.year; o.price=+o.price; o.msrp=o.msrp?+o.msrp:null; o.km=+o.km;
    o.delivery_weeks=o.delivery_weeks?+o.delivery_weeks:null;
    o.highlights=(o.highlights||"").split("|").filter(Boolean);
    o.sold=(o.sold||"").toLowerCase()==="yes";
    o.category=o.category?.length?o.category:deriveCat(o.title,o.fuel);
    o.brand=(o.title||"").split(" ")[0];
    o.slug=slugify(o.title||"");
    return o;
  });
}

/* תמונה + Fallback */
function CarImage({slug, alt}) {
  const [srcs,setSrcs]=useState([`/cars/${slug}.webp?v=7`,`/cars/${slug}.png?v=7`,`/cars/${slug}.jpg?v=7`,`/cars/_placeholder.svg?v=7`]);
  const [src,setSrc]=useState(srcs[0]);
  const onError=()=>setSrcs(prev=>{const[,...rest]=prev; setSrc(rest[0]||`/cars/_placeholder.svg?v=7`); return rest;});
  return <div className="car-image-wrap"><img src={src} onError={onError} alt={alt} loading="lazy"/></div>;
}

/* Sidebar קטגוריות + Drawer במובייל */
function Sidebar({active, setActive, counts, open, setOpen}){
  const items=[["הכל","🏠"],["חשמלי","⚡️"],["היברידי","♻️"],["בנזין","⛽️"],["יוקרה","⭐️"]];
  const Menu=(
    <nav className="side-nav">
      <div className="side-title">קטגוריות</div>
      {items.map(([key,ico])=>(
        <button key={key} className={`side-item ${active===key?"active":""}`} onClick={()=>{setActive(key); setOpen?.(false);}}>
          <span className="side-ico">{ico}</span>
          <span className="side-text">{key}</span>
          <span className="side-count">{counts[key]||0}</span>
        </button>
      ))}
    </nav>
  );
  return (
    <>
      <aside className="side desktop">{Menu}</aside>
      <div className={`drawer ${open?"open":""}`}>
        <div className="drawer-panel">
          <button className="drawer-close" onClick={()=>setOpen(false)}>✕</button>
          {Menu}
        </div>
        <div className="drawer-backdrop" onClick={()=>setOpen(false)}/>
      </div>
    </>
  );
}

/* קלף קטגוריה גדול לדף הבית */
function CategoryCard({label, count, onClick, emoji}){
  return (
    <button className="cat-card" onClick={onClick}>
      <div className="cat-emoji">{emoji}</div>
      <div className="cat-title">{label}</div>
      <div className="cat-count">{count} דגמים</div>
    </button>
  );
}

/* מחשבון מימון נקי */
function FinanceCalculator(){
  const [plan,setPlan]=useState("standard");
  const [price,setPrice]=useState(150000);
  const [down,setDown]=useState(30000);
  const [months,setMonths]=useState(60);
  const m = Math.round(monthlyPayment({price,down,months: plan==="balloon"?60:months,plan}));
  const balloon = plan==="balloon" ? Math.round(price*BALLOON_FRAC) : 0;
  return (
    <div className="card finance">
      <div className="title">מחשבוני מימון</div>
      <div className="plans">
        <button className={plan==="standard"?"active":""} onClick={()=>setPlan("standard")}>רגיל</button>
        <button className={plan==="balloon"?"active":""} onClick={()=>setPlan("balloon")}>בלון (50%/60ח׳)</button>
      </div>
      <div className="grid2">
        <div className="form">
          <label>מחיר<input type="number" value={price} onChange={e=>setPrice(+e.target.value||0)}/></label>
          <label>מקדמה<input type="number" value={down} onChange={e=>setDown(+e.target.value||0)}/></label>
          <label>חודשים {plan==="balloon"?"— 60 קבוע":""}
            <input type="range" min="12" max="96" step="12" disabled={plan==="balloon"} value={months} onChange={e=>setMonths(+e.target.value)}/>
            <div className="hint">{plan==="balloon"?60:months} ח׳</div>
          </label>
          <div className="summary">
            <div><span>חודשי משוער:</span><b>{fmt(m)}</b></div>
            <div><span>סכום מימון:</span><b>{fmt(Math.max(0,price-down))}</b></div>
            {plan==="balloon" && <div><span>בלון סוף תקופה (50%):</span><b>{fmt(balloon)}</b></div>}
          </div>
        </div>
        <ul className="notes">
          <li>החישוב להמחשה בלבד.</li>
          <li>תנאי המימון <b>צמודי מדד</b> ועשויים להשתנות לפי דירוג הלקוח.</li>
          <li>מסלול בלון: 60 תשלומים + 50% בסוף התקופה.</li>
        </ul>
      </div>
    </div>
  );
}

/* ======= האפליקציה ======= */
export default function App(){
  useEffect(()=>{ document.documentElement.dir="rtl"; document.title="R&M מוטורס — חדש 0 ק״מ"; },[]);
  const whatsapp="9725XXXXXXXX"; // להחליף למספר שלך

  const [cars,setCars]=useState([]);
  const [drawerOpen,setDrawerOpen]=useState(false);

  // ברירת מחדל: אין קטגוריה נבחרת → דף הבית מציג רק קטגוריות
  const [activeTab,setActiveTab]=useState(null);

  // טען את המלאי
  useEffect(()=>{
    parseCSV("/inventory.csv").then(setCars).catch(()=>{
      // Fallback קצר אם אין CSV
      setCars([
        {id:"1", title:"Tesla Model 3", year:2025, price:189900, fuel:"חשמלי", category:"חשמלי", slug:"tesla-model-3", highlights:["0 ק״מ","טעינה מהירה"]},
        {id:"2", title:"Hyundai Tucson Hybrid", year:2025, price:199900, fuel:"היברידי", category:"היברידי", slug:"hyundai-tucson-hybrid", highlights:["0 ק״מ","מאובזר"]},
      ]);
    });
  },[]);

  // מונים לפי קטגוריה
  const counts = useMemo(()=>({
    הכל: cars.length,
    חשמלי: cars.filter(c=>c.category==="חשמלי").length,
    היברידי: cars.filter(c=>c.category==="היברידי").length,
    בנזין:  cars.filter(c=>c.category==="בנזין").length,
    יוקרה:  cars.filter(c=>c.category==="יוקרה").length,
  }),[cars]);

  // רשימת דגמים לפי קטגוריה נבחרת
  const list = useMemo(()=>{
    if (!activeTab || activeTab==="הכל") return [];
    return cars
      .filter(c=>c.category===activeTab && !c.sold && (c.km??0)<=15)
      .sort((a,b)=>a.price-b.price);
  },[cars,activeTab]);

  return (
    <div className="site">
      {/* HEADER */}
      <header className="header">
        <div className="container row sb a-center">
          <div className="row g8 a-center">
            <img src="/logo.png?v=7" alt="R&M מוטורס" className="logo"/>
            <div>
              <div className="brand">R&amp;M מוטורס — חדש 0 ק״מ</div>
              <div className="sub">שירות פרימיום · מחירים מיוחדים · ליווי מלא</div>
            </div>
          </div>
          <div className="row g8 a-center">
            <button className="btn white only-mobile" onClick={()=>setDrawerOpen(true)}>☰ קטגוריות</button>
            <a className="btn outline" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">ווטסאפ</a>
          </div>
        </div>
      </header>

      {/* HERO קצר ונקי */}
      <section className="hero">
        <div className="container grid2 gap32 a-center">
          <div>
            <div className="chip">חדש 0 ק״מ בלבד</div>
            <h1>מוצאים לך <span className="grad">את הדיל המושלם</span> — ורק אז חותמים</h1>
            <p className="muted">מימון מותאם · מחירים מיוחדים · ליווי מלא עד המסירה וגם לאחריה.</p>
            <div className="row g8 mt16">
              <a href="#categories" className="btn primary">לבחירת קטגוריה</a>
              <a href="#finance" className="btn white">מחשבוני מימון</a>
            </div>
            <div className="fine">* תנאי המימון צמודי מדד ועשויים להשתנות לפי דירוג הלקוח.</div>
          </div>
          <div className="hero-visual"><img src="/logo.png?v=7" alt="R&M"/></div>
        </div>
      </section>

      {/* פריסה עם Sidebar */}
      <section className="container layout-with-side">
        <Sidebar active={activeTab??"—"} setActive={setActiveTab} counts={counts} open={drawerOpen} setOpen={setDrawerOpen}/>

        {/* MAIN */}
        <div className="layout-main">
          {/* דף הבית: כרטיסי קטגוריות בלבד */}
          {!activeTab && (
            <div id="categories" className="grid3 gap24">
              <CategoryCard label="חשמלי" emoji="⚡️" count={counts["חשמלי"]} onClick={()=>setActiveTab("חשמלי")} />
              <CategoryCard label="היברידי" emoji="♻️" count={counts["היברידי"]} onClick={()=>setActiveTab("היברידי")} />
              <CategoryCard label="בנזין" emoji="⛽️" count={counts["בנזין"]}   onClick={()=>setActiveTab("בנזין")} />
              <CategoryCard label="יוקרה"  emoji="⭐️" count={counts["יוקרה"]}   onClick={()=>setActiveTab("יוקרה")} />
            </div>
          )}

          {/* לאחר בחירת קטגוריה: רשימת דגמים בלבד */}
          {activeTab && activeTab!=="הכל" && (
            <>
              <div className="section-head">
                <h2>{activeTab} — דגמים</h2>
                <button className="btn" onClick={()=>setActiveTab(null)}>↩︎ חזרה לקטגוריות</button>
              </div>
              <div className="grid3 gap24">
                {list.map(car=>{
                  const per = Math.round(monthlyPayment({price:car.price, plan:"standard"}));
                  return (
                    <div key={car.id} className="car-card">
                      <div className="ribbons"><span className="ribbon dark">{car.category}</span></div>
                      <CarImage slug={car.slug} alt={car.title}/>
                      <div className="card-body">
                        <div className="title-row">
                          <h3 className="car-title">{car.title}</h3>
                          <div className="price">
                            {car.msrp ? <div className="msrp">{fmt(car.msrp)}</div> : null}
                            <div className="now">{fmt(car.price)}</div>
                            <div className="per">החל מ־<b>{fmt(per)}</b> לחודש</div>
                          </div>
                        </div>
                        <div className="meta"><span>0 ק״מ</span><span>{car.year}</span><span>{car.fuel}</span></div>
                        <ul className="features">{car.highlights?.slice(0,3).map(h=><li key={h}>{h}</li>)}</ul>
                        <div className="row g8 mt8">
                          <a className="btn primary flex1" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`שלום, מעוניין ב-${car.title} חדש 0 ק״מ (${car.year}).`)}`} target="_blank" rel="noreferrer">בקשת הצעת מחיר</a>
                          <a className="btn outline" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">ווטסאפ</a>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {list.length===0 && <div className="empty">אין דגמים בקטגוריה זו.</div>}
              </div>
            </>
          )}

          {/* מחשבון */}
          <section id="finance" className="mt16"><FinanceCalculator/></section>
        </div>
      </section>

      {/* פוטר */}
      <footer className="footer">
        <div className="container row sb a-center">
          <div className="muted">© {new Date().getFullYear()} R&M מוטורס — חדש 0 ק״מ</div>
          <a className="btn white" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">ווטסאפ</a>
        </div>
      </footer>
    </div>
  );
}
