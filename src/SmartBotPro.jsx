import { useEffect, useMemo, useRef, useState } from "react";

/* ===== Utils: חישוב החזר חודשי (ריבית סמויה 5.9% — לא מוצג) ===== */
const APR = 0.059;
const r = APR / 12;
const fmt = (n) => new Intl.NumberFormat("he-IL").format(Math.round(n || 0));
const sanitize = (s="") => (s || "").toString().trim().toLowerCase();

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

/* ===== Web Worker (למלאי גדול מאוד) ===== */
function makeMatcherWorker() {
  const code = `
    const APR=0.059, r=APR/12;
    const pmtEq=(P,m)=> m>0 && P>0 ? (P*r)/(1-Math.pow(1+r,-m)) : 0;
    const pmtBalloon=(price,down,months,balloon)=>{
      const P=Math.max(price-down,0);
      const pv=balloon/Math.pow(1+r,months);
      const adj=Math.max(P-pv,0);
      return pmtEq(adj,months);
    };
    let INV=[];
    onmessage = (e)=>{
      const {type, inventory, answers} = e.data||{};
      if(type==="set"){ INV = Array.isArray(inventory)? inventory:[]; postMessage({type:"ready"}); return; }
      if(type==="match"){
        const res = (INV||[]).map((car)=>{
          // monthly (בלון 60ח', מקדמה 20%, בלון 50%)
          const price = +car.price || 0;
          const down = price*0.2;
          const monthly = pmtBalloon(price, down, 60, price*0.5);
          let score=0, why=[];
          const target = +answers.budgetMonthly || 0;
          if(target){
            if(monthly<=target*1.00){ score+=6; why.push("בתקציב שלך"); }
            else if(monthly<=target*1.15){ score+=3; why.push("קרוב לתקציב"); }
          }
          const seatsNeed = answers.seats==="7+"?7:parseInt(answers.seats||"0",10);
          if(seatsNeed){ if((seatsNeed>=7 && (car.seats||0)>=7)||(seatsNeed<7 && (car.seats||0)>=5)){ score+=2; why.push("מס׳ מקומות מתאים"); } }
          const bodyPref = answers.body;
          if(bodyPref && bodyPref!=="לא משנה" && car.body===bodyPref){ score+=3; why.push("סוג רכב שביקשת"); }
          const fuelPref = answers.fuel;
          if(fuelPref && fuelPref!=="לא משנה" && car.fuel===fuelPref){ score+=2; why.push("סוג הנעה מועדף"); }
          if(answers.sporty==="כן" && car.sport){ score+=2; why.push("ביצועים/ספורט"); }
          if(answers.sporty==="לא" && !car.sport){ score+=1; }
          const usage = answers.usage;
          if(usage==="עבודה" && (car.body==="מסחרי" || car.body==="טנדר")){ score+=2; }
          if(usage==="שטח" && (car.body==="פנאי/קרוסאובר" || car.drivetrain==="4x4")){ score+=2; }
          const bias = (answers.brandBias||"").toLowerCase();
          if(bias && (car.brand||"").toLowerCase().includes(bias)){ score+=2; why.push("מותג מועדף"); }
          return {car, monthly: Math.round(monthly), score, why};
        })
        .filter(x=>x.monthly>0)
        .sort((a,b)=> b.score - a.score || a.monthly - b.monthly)
        .slice(0,3);
        postMessage({type:"match", results:res});
      }
    };
  `;
  const blob = new Blob([code], { type: "application/javascript" });
  return new Worker(URL.createObjectURL(blob));
}

/* ===== טעינת מלאי: JSON מה-public או CSV של Google Sheets ===== */
async function fetchInventory({ inventoryUrl, sheetCsvUrl }) {
  // 1) JSON מתוך /public/inventory.json (מומלץ למאות אלפים)
  if (inventoryUrl) {
    try {
      const r = await fetch(inventoryUrl, { cache: "no-store" });
      if (r.ok) return await r.json();
    } catch {}
  }
  // 2) CSV (שיטס – קובץ מפורסם לציבור)
  if (sheetCsvUrl) {
    try {
      const r = await fetch(sheetCsvUrl, { cache: "no-store" });
      if (r.ok) {
        const text = await r.text();
        const [head, ...rows] = text.trim().split(/\r?\n/).map(l => l.split(","));
        const idx = (k) => head.findIndex(h => h.trim().toLowerCase()===k);
        const j = (a, i) => (a[i]||"").trim();
        return rows.map(a => ({
          brand: j(a, idx("brand")), model: j(a, idx("model")), trim: j(a, idx("trim")),
          year: +j(a, idx("year"))||2025, body: j(a, idx("body")),
          fuel: j(a, idx("fuel")), seats: +j(a, idx("seats"))||5,
          drivetrain: j(a, idx("drivetrain")), transmission: j(a, idx("transmission")),
          luxury: ["כן","true","1","y","yes"].includes(sanitize(j(a, idx("luxury")))),
          sport: ["כן","true","1","y","yes"].includes(sanitize(j(a, idx("sport")))),
          price: +j(a, idx("price"))||0,
        }));
      }
    } catch {}
  }
  // 3) דוגמית אם אין קבצים
  return [
    { brand:"Toyota", model:"Corolla Hybrid", trim:"Active", year:2025, body:"משפחתי", fuel:"היברידי", seats:5, drivetrain:"FWD", transmission:"AT", luxury:false, sport:false, price:165000 },
    { brand:"Skoda", model:"Kodiaq", trim:"Ambition", year:2025, body:"פנאי/קרוסאובר", fuel:"בנזין", seats:7, drivetrain:"FWD", transmission:"AT", luxury:false, sport:false, price:245000 },
    { brand:"Mercedes", model:"GLC 300", trim:"AMG Line", year:2025, body:"פנאי/קרוסאובר", fuel:"בנזין", seats:5, drivetrain:"AWD", transmission:"AT", luxury:true, sport:true, price:560000 },
    { brand:"BYD", model:"Atto 3", trim:"Design", year:2025, body:"פנאי/קרוסאובר", fuel:"חשמלי", seats:5, drivetrain:"FWD", transmission:"AT", luxury:false, sport:false, price:169000 },
    { brand:"Ford", model:"Transit", trim:"L2H2", year:2025, body:"מסחרי", fuel:"דיזל", seats:3, drivetrain:"FWD", transmission:"MT", luxury:false, sport:false, price:300000 },
    { brand:"Isuzu", model:"D-MAX", trim:"4x4", year:2025, body:"טנדר", fuel:"דיזל", seats:5, drivetrain:"4x4", transmission:"AT", luxury:false, sport:false, price:235000 },
    { brand:"MAN", model:"TGL", trim:"7.5t", year:2025, body:"משאית עד 5 טון", fuel:"דיזל", seats:3, drivetrain:"RWD", transmission:"AT", luxury:false, sport:false, price:490000 },
  ];
}

/* ===== שאלון מכוון (אפשר להרחיב בקלות) ===== */
const QUESTIONS = [
  { key:"budgetMonthly",  type:"range",  q:"מה התקציב החודשי המשוער?", min:1500, max:20000, step:100 },
  { key:"usage",          type:"choice", q:"לאיזה שימוש עיקרי?", opts:["עיר","בין־עירוני","מעורב","משפחה","עבודה","שטח","יוקרה","ספורט"] },
  { key:"seats",          type:"choice", q:"כמה מקומות ישיבה?",  opts:["2","4","5","6","7+"] },
  { key:"body",           type:"choice", q:"איזה סוג רכב מועדף?", opts:["עירוני","סדאן","משפחתי","פנאי/קרוסאובר","מנהלים","מסחרי","טנדר","משאית עד 5 טון","ספורט/על","יוקרה","לא משנה"] },
  { key:"fuel",           type:"choice", q:"סוג הנעה מועדף?",     opts:["בנזין","דיזל","היברידי","חשמלי","לא משנה"] },
  { key:"sporty",         type:"choice", q:"מחפש/ת אופי ספורטיבי?", opts:["כן","לא"] },
  { key:"brandBias",      type:"text",   q:"מותג מועדף? (לא חובה) — אפשר לכתוב גם תת-דגם/סדרה" },
  { key:"features",       type:"multi",  q:"מה חשוב לך במיוחד? אפשר לבחור כמה", opts:["בטיחות מתקדמת","4x4","גרירה","חסכוני במיוחד","תא מטען גדול","מערכת מולטימדיה","נוחות גבוהה","ביצועים חזקים"] },
];

/* ===== UI helpers ===== */
const Chip = (p)=> <button {...p} className={`chip ${p.className||""}`.trim()} />;
const Msg  = ({children,bot,big}) => <div className={`msg ${bot?"bot":""} ${big?"big":""}`.trim()}>{children}</div>;

export default function SmartBotPro({ inventoryUrl="/inventory.json", sheetCsvUrl="" }) {
  const [inv, setInv] = useState([]);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ budgetMonthly: 2500 });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Worker for huge inventories
  const workerRef = useRef(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await fetchInventory({ inventoryUrl, sheetCsvUrl });
      if (!alive) return;
      setInv(data);
      const w = makeMatcherWorker();
      workerRef.current = w;
      w.onmessage = (e)=>{
        const {type, results:res} = e.data||{};
        if(type==="ready") setReady(true);
        if(type==="match"){ setResults(res||[]); setLoading(false); }
      };
      w.postMessage({type:"set", inventory:data});
    })();
    return ()=>{ alive=false; workerRef.current?.terminate?.(); };
  }, [inventoryUrl, sheetCsvUrl]);

  const current = QUESTIONS[step];
  const setAns = (k,v)=> setAnswers(a=>({ ...a, [k]: v }));

  const askMatch = ()=>{
    setLoading(true);
    workerRef.current?.postMessage({type:"match", answers});
  };

  // הצעת טקסט לשיתוף
  const shareText = useMemo(()=>{
    const base = results.map(r=>`${r.car.brand} ${r.car.model} ${r.car.trim || ""} – החל מ־${fmt(r.monthly)} ₪/ח׳`).join(" | ");
    return `עניתי בבוט ורוצה להתקדם:\n${base}`;
  }, [results]);

  return (
    <section className="card" dir="rtl" id="smart">
      <h2>מאתר רכב חכם</h2>
      <p className="muted">בוט צ׳אט שמכוון אותך לדגמים המדויקים — בסוף מציג 3 התאמות עם החזר חודשי.</p>

      {ready ? (
        <>
          {step < QUESTIONS.length ? (
            <div className="chat">
              <Msg bot>{current.q}</Msg>

              {current.type==="range" && (
                <div className="rangeWrap">
                  <input type="range"
                    min={current.min} max={current.max} step={current.step}
                    value={answers[current.key] ?? current.min}
                    onChange={(e)=>setAns(current.key, +e.target.value)}
                  />
                  <div className="rangeHint">תקציב: {fmt(answers[current.key] ?? current.min)} ₪</div>
                  <button className="btn primary" onClick={()=>setStep(step+1)}>המשך</button>
                </div>
              )}

              {current.type==="choice" && (
                <div className="chips">
                  {current.opts.map(o=>(
                    <Chip key={o} onClick={()=>{ setAns(current.key,o); setStep(step+1); }}>{o}</Chip>
                  ))}
                </div>
              )}

              {current.type==="multi" && (
                <div className="chips">
                  {(answers.features||[]);
                  }
                  {current.opts.map(o=>{
                    const on = (answers.features||[]).includes(o);
                    return (
                      <Chip key={o} className={on?"on":""}
                        onClick={()=> setAns("features", on ? (answers.features||[]).filter(x=>x!==o) : [...(answers.features||[]), o])}
                      >
                        {o}
                      </Chip>
                    );
                  })}
                  <div style={{marginTop:8}}>
                    <button className="btn primary" onClick={()=>setStep(step+1)}>המשך</button>
                  </div>
                </div>
              )}

              {current.type==="text" && (
                <div className="grid">
                  <input
                    placeholder="לדוגמה: Mercedes / Corolla / AMG"
                    value={answers[current.key] || ""}
                    onChange={(e)=>setAns(current.key, e.target.value)}
                  />
                  <button className="btn primary" onClick={()=>setStep(step+1)}>המשך</button>
                </div>
              )}
            </div>
          ) : (
            <div className="resultBox">
              <Msg bot big>🤖 מוכן! מחשב עבורך את 3 ההתאמות המובילות…</Msg>
              {!results.length && !loading && <div className="muted">לחץ/י “חשב התאמות” לקבלת הצעות.</div>}
              <div className="ctaRow">
                <button className="btn primary" onClick={askMatch} disabled={loading}>
                  {loading ? "מחשב…" : "חשב התאמות"}
                </button>
                <button className="btn ghost" onClick={()=>{ setStep(0); setAnswers({ budgetMonthly: 2500 }); setResults([]); }}>התחל מחדש</button>
              </div>

              {results.map((x,i)=>(
                <div key={i} className="rec">
                  <div>
                    <div className="recTitle">{x.car.brand} {x.car.model}{x.car.trim?` ${x.car.trim}`:""}</div>
                    <div className="recMeta">{x.car.year} · {x.car.body} · {x.car.fuel}{x.car.seats?` · ${x.car.seats} מקומות`:""}</div>
                    <div className="muted tiny">{(x.why||[]).slice(0,3).join(" · ")}</div>
                  </div>
                  <div className="recPay">החל מ־{fmt(x.monthly)} ₪ לחודש</div>
                </div>
              ))}

              {results.length>0 && (
                <div className="ctaRow">
                  <a className="btn primary" href={`https://wa.me/972526406728?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">
                    שלחו לי בווטסאפ
                  </a>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="muted">טוען מלאי…</div>
      )}
    </section>
  );
}
