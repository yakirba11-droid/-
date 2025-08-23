import React, { useState } from "react";

export default function LeadForm() {
  const [form, setForm] = useState({ name:"", phone:"", email:"", city:"", msg:"" });

  const text = `השאירו פרטים – נחזור עם התאמה אישית ורעיון מימון שמוריד תשלום חודשי, בלי לחץ לחתום.`;

  const send = () => {
    const body =
`שם: ${form.name}
טלפון: ${form.phone}
אימייל: ${form.email}
עיר: ${form.city}
הודעה: ${form.msg}`;
    const url = `https://wa.me/972526406728?text=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
  };

  return (
    <section id="lead" className="section">
      <header className="section-head">
        <h2>יצירת קשר</h2>
        <p className="muted">{text}</p>
      </header>

      <div className="card form">
        {["name","phone","email","city"].map((k) => (
          <input key={k} placeholder={place(k)} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} />
        ))}
        <textarea rows="4" placeholder="הודעה" value={form.msg} onChange={e=>setForm({...form,msg:e.target.value})}/>
        <button className="btn primary wide" onClick={send}>שלחו ונחזור אליכם</button>
      </div>
    </section>
  );
}

function place(k){
  switch(k){
    case "name": return "שם מלא";
    case "phone": return "טלפון";
    case "email": return "אימייל";
    case "city": return "עיר";
    default: return "";
  }
}
