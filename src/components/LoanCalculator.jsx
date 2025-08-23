import React, { useMemo, useState } from "react";
import { pmtMonthly } from "../utils/finance";

export default function LoanCalculator() {
  const [price, setPrice] = useState(150_000);
  const [down, setDown] = useState(30_000);
  const [months, setMonths] = useState(60);
  const [mode, setMode] = useState("balloon");
  const residual = useMemo(()=> mode==="balloon" ? Math.round(price*0.5) : 0, [price, mode]);

  const pmt = pmtMonthly({ price, down, months, residual, mode });

  return (
    <section id="calc" className="section">
      <header className="section-head">
        <h2>מחשבון הלוואה</h2>
        <p className="muted">תשלום חודשי משוער בלבד. בבלון: בחירת יתרת סוף תקופה (עד 50%).</p>
      </header>

      <div className="card calc">
        <div className="seg">
          <button className={`segbtn ${mode==="balloon"?"on":""}`} onClick={()=>setMode("balloon")}>בלון (עד 60 ח’)</button>
          <button className={`segbtn ${mode==="regular"?"on":""}`} onClick={()=>setMode("regular")}>רגיל (עד 100 ח’)</button>
        </div>

        <label>מחיר רכב</label>
        <input inputMode="numeric" value={price} onChange={e=>setPrice(parseInt(e.target.value||0))} />

        <label>מקדמה</label>
        <input inputMode="numeric" value={down} onChange={e=>setDown(parseInt(e.target.value||0))} />

        <label>מס’ חודשים</label>
        <input type="range" min={12} max={mode==="regular"?100:60} value={months} onChange={e=>setMonths(parseInt(e.target.value))} />
        <div className="muted">{months} ח’</div>

        {mode==="balloon" && (
          <>
            <label>יתרת בלון בסוף התקופה (עד 50% מהמחיר)</label>
            <input type="range" min={0} max={Math.round(price*0.5)} value={residual}
                   onChange={()=>{}} disabled />
            <div className="muted">₪ {residual.toLocaleString("he-IL")}</div>
          </>
        )}

        <div className="result">
          <div>החזר חודשי משוער:</div>
          <div className="big">₪ {pmt.toLocaleString("he-IL")}</div>
        </div>

        <a className="btn primary wide" href="https://wa.me/972526406728?text=%D7%94%D7%99%D7%99%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%94%D7%A6%D7%A2%D7%AA%20%D7%9E%D7%99%D7%9E%D7%95%D7%9F%20%D7%9C%D7%A4%D7%99%20%D7%94%D7%97%D7%99%D7%A9%D7%95%D7%91" target="_blank" rel="noreferrer">
          בקשת הצעה בוואטסאפ
        </a>
      </div>
    </section>
  );
}
