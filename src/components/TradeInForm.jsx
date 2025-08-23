import React, { useState } from "react";

export default function TradeInForm() {
  const [f, setF] = useState({
    name:"", phone:"", email:"", brand:"", model:"", plate:"", year:"", km:"", notes:""
  });

  const tagline = "הערכת שווי מהירה מרחוק — מקדמים עסקה חדשה בליווי צמוד.";

  const send = () => {
    const body =
`טרייד־אין:
שם: ${f.name}
טלפון: ${f.phone}
אימייל: ${f.email}
מותג: ${f.brand}
דגם: ${f.model}
מס' רישוי: ${f.plate}
שנת יצור: ${f.year}
ק״מ: ${f.km}
הערות: ${f.notes}`;
    window.open(`https://wa.me/972526406728?text=${encodeURIComponent(body)}`,"_blank");
  };

  return (
    <section id="trade" className="section">
      <header className="section-head">
        <h2>טרייד־אין אונליין</h2>
        <p className="muted">{tagline}</p>
      </header>

      <div className="card form">
        <input placeholder="שם מלא" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
        <input placeholder="טלפון" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/>
        <input placeholder="אימייל" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/>
        <input placeholder="מותג" value={f.brand} onChange={e=>setF({...f,brand:e.target.value})}/>
        <input placeholder="דגם" value={f.model} onChange={e=>setF({...f,model:e.target.value})}/>
        <input placeholder="מס' רישוי" value={f.plate} onChange={e=>setF({...f,plate:e.target.value})}/>
        <input placeholder="שנת יצור" value={f.year} onChange={e=>setF({...f,year:e.target.value})}/>
        <input placeholder="ק״מ" value={f.km} onChange={e=>setF({...f,km:e.target.value})}/>
        <textarea rows="3" placeholder="הערות" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/>
        <div className="upload-hint">אפשר להעלות תמונות ברגע השליחה בוואטסאפ 📸</div>
        <button className="btn ghost wide" onClick={send}>שלחו אלינו בוואטסאפ</button>
      </div>
    </section>
  );
}
