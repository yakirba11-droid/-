import React, { useMemo, useState } from "react"

// קבועים פנימיים (לא מוצגים באתר)
const APR_DEFAULT = 5.9;    // צמוד מדד
const MONTHS_DEFAULT = 60;
const BALLOON_FRAC = 0.5;   // 50% בלון

const fmt = (n) => isFinite(n) ? n.toLocaleString("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }) : "—"

function monthlyPayment({ price, down = 0, months = MONTHS_DEFAULT, plan = 'standard', apr = APR_DEFAULT }) {
  const P0 = Math.max(0, Number(price || 0) - Number(down || 0));
  const r = (apr / 100) / 12;
  if (months <= 0) return 0;

  if (plan === 'balloon') {
    const F = BALLOON_FRAC * Number(price || 0);
    if (r === 0) return (P0 - F) / months;
    const den = 1 - Math.pow(1 + r, -months);
    return (r * (P0 - F / Math.pow(1 + r, months))) / den;
  } else {
    if (r === 0) return P0 / months;
    return (P0 * r) / (1 - Math.pow(1 + r, -months));
  }
}

export default function FinanceCalculator() {
  const [plan, setPlan] = useState('standard') // 'standard' | 'balloon'
  const [price, setPrice] = useState(150000)
  const [down, setDown] = useState(30000)
  const [months, setMonths] = useState(60)     // רגיל בלבד; בלון = 60

  const monthPay = useMemo(() => {
    const m = plan === 'balloon' ? 60 : months
    return monthlyPayment({ price, down, months: m, plan })
  }, [price, down, months, plan])

  const financed = Math.max(0, price - down)
  const balloonEnd = plan === 'balloon' ? Math.round(price * BALLOON_FRAC) : 0

  return (
    <div className="rounded-3xl border bg-white p-5 md:p-7 shadow-sm">
      <h3 className="text-2xl font-extrabold mb-4">מחשבוני מימון</h3>

      <div className="mb-3">
        <div className="inline-flex gap-2">
          <button className={`rounded-xl px-3 py-2 border ${plan==='standard' ? 'bg-black text-white' : ''}`} onClick={() => setPlan('standard')} type="button">רגיל</button>
          <button className={`rounded-xl px-3 py-2 border ${plan==='balloon' ? 'bg-black text-white' : ''}`} onClick={() => setPlan('balloon')} type="button">בלון (50% / 60ח׳)</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="space-y-3 text-sm">
            <Row label="מחיר הרכב"><NumberInput value={price} onChange={setPrice} min={0} step={1000} /></Row>
            <Row label="מקדמה"><NumberInput value={down} onChange={setDown} min={0} max={price} step={1000} /></Row>
            <Row label={`משך (חודשים)${plan==='balloon' ? ' — קבוע 60' : ''}`}>
              <input type="range" min={12} max={96} step={12} disabled={plan==='balloon'} value={months} onChange={(e)=>setMonths(parseInt(e.target.value))} className="w-full" />
              <div className="text-[11px] text-neutral-600 mt-1">{plan==='balloon' ? 60 : months} ח׳</div>
            </Row>
          </div>

          <div className="mt-4 bg-neutral-50 rounded-2xl border p-4 text-sm space-y-1">
            <div className="flex items-center justify-between"><span>תשלום חודשי משוער:</span><strong>{fmt(monthPay)}</strong></div>
            <div className="flex items-center justify-between"><span>סכום מימון:</span><strong>{fmt(financed)}</strong></div>
            {plan==='balloon' && (
              <div className="flex items-center justify-between"><span>תשלום בלון בסוף תקופה (50%):</span><strong>{fmt(balloonEnd)}</strong></div>
            )}
          </div>
        </div>

        <div className="text-sm text-neutral-700">
          <ul className="list-disc pr-5 space-y-2">
            <li>החישוב להמחשה בלבד.</li>
            <li>תנאי המימון <strong>צמודי מדד</strong> ועשויים להשתנות לפי דירוג הלקוח.</li>
            <li>מסלול בלון: 60 תשלומים חודשיים + תשלום בלון של 50% משווי הרכב בסוף התקופה.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-2 gap-3 items-center">
      <div className="text-neutral-600">{label}</div>
      <div>{children}</div>
    </div>
  )
}

function NumberInput({ value, onChange, ...rest }) {
  return <input type="number" className="w-full border rounded-xl p-2" value={value} onChange={(e) => onChange(Number(e.target.value))} {...rest} />
}
