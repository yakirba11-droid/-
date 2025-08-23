import React, { useMemo, useState } from "react";
import CarCard from "./CarCard";
import { cars } from "../data/cars";

const segments = ["עירוני","משפחתי","פנאי/קרוסאובר","סדאן","מנהלים","מסחרי","יוקרה","ספורט/על"];
const powertrains = ["בנזין/דיזל","היברידי","חשמלי"];

export default function SmartFinder() {
  const [seg, setSeg] = useState("הכל");
  const [pt, setPt] = useState("הכל");
  const [brand, setBrand] = useState("הכל");
  const [months, setMonths] = useState(60);
  const [mode, setMode] = useState("balloon"); // "regular" | "balloon"

  const brands = useMemo(() => {
    const s = new Set(cars.map(c => c.brand));
    return ["הכל", ...Array.from(s).sort((a,b)=>a.localeCompare(b,'he'))];
  }, []);

  const filtered = cars.filter(c => 
    (seg==="הכל" || c.segment===seg) &&
    (pt==="הכל" || c.powertrain===pt) &&
    (brand==="הכל" || c.brand===brand)
  );

  return (
    <section id="finder" className="section">
      <header className="section-head">
        <h2>מאתר רכב חכם</h2>
        <p className="muted">
          התאימו תקציב חודשי וסוג רכב — מציגים דגמים מובילים והחזר חודשי משוער <b>במסלול בלון (עד 60 ח’)</b>. 
        </p>
      </header>

      <div className="finder-controls">
        <div className="control">
          <label>סוג רכב</label>
          <div className="pill-row">
            <button className={`pill ${seg==="הכל"?"on":""}`} onClick={()=>setSeg("הכל")}>הכל</button>
            {segments.map(s => (
              <button key={s} className={`pill ${seg===s?"on":""}`} onClick={()=>setSeg(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div className="control">
          <label>סוג הנעה</label>
          <div className="pill-row">
            <button className={`pill ${pt==="הכל"?"on":""}`} onClick={()=>setPt("הכל")}>הכל</button>
            {powertrains.map(p => (
              <button key={p} className={`pill ${pt===p?"on":""}`} onClick={()=>setPt(p)}>{p}</button>
            ))}
          </div>
        </div>

        <div className="control">
          <label>מותג</label>
          <select value={brand} onChange={e=>setBrand(e.target.value)} aria-label="בחירת מותג">
            {brands.map(b=><option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="control">
          <label>מסלול מימון</label>
          <div className="seg">
            <button className={`segbtn ${mode==="balloon"?"on":""}`} onClick={()=>setMode("balloon")}>בלון (עד 60 ח’)</button>
            <button className={`segbtn ${mode==="regular"?"on":""}`} onClick={()=>setMode("regular")}>רגיל (עד 100 ח’)</button>
          </div>
        </div>

        <div className="control">
          <label aria-describedby="mths">מס’ חודשים</label>
          <input id="mths" type="range" min={mode==="regular"? 12:12} max={mode==="regular"? 100:60} value={months} onChange={e=>setMonths(parseInt(e.target.value))} />
          <div className="muted">{months} ח’</div>
        </div>
      </div>

      <div className="cars-grid">
        {filtered.map(car => (
          <CarCard key={car.id} car={car} months={months} mode={mode} onLead={(c)=>window.scrollTo({top: document.getElementById("lead").offsetTop-24, behavior:"smooth"})} />
        ))}
      </div>
    </section>
  );
}
