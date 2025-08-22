import React, { useMemo, useState } from "react"

const fmt = (n) =>
  isFinite(n) ? n.toLocaleString("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }) : "—"

export default function FinanceCalculator() {
  // מחשבון 1: כמה אשלם בחודש?
  const [price, setPrice] = useState(150000)
  const [down, setDown] = useState(30000)
  const [apr, setApr] = useState(4.9) // ריבית שנתית באחוזים
  const [months, setMonths] = useState(60)

  // מחשבון 2: מה תקציב הרכב לפי תשלום חודשי?
  const [budgetMonthly, setBudgetMonthly] = useState(1800)
  const [budgetDown, setBudgetDown] = useState(30000)
  const [budgetApr, setBudgetApr] = useState(4.9)
  const [budgetMonths, setBudgetMonths] = useState(60)

  const monthPay = useMemo(() => {
    const P = Math.max(0, price - down)
    const r = (apr / 100) / 12
    const n = months
    if (P <= 0) return 0
    if (r === 0) return P / n
    return (P * r) / (1 - Math.pow(1 + r, -n))
  }, [price, down, apr, months])

  const maxCarByBudget = useMemo(() => {
    const pay = Math.max(0, budgetMonthly)
    const r = (budgetApr / 100) / 12
    const n = budgetMonths
    const principal = r === 0 ? (pay * n) : (pay * (1 - Math.pow(1 + r, -n)) / r)
    return Math.max(0, principal + budgetDown)
  }, [budgetMonthly, budgetDown, budgetApr, budgetMonths])

  return (
    <div className="rounded-3xl border bg-white p-5 md:p-7 shadow-sm">
      <h3 className="text-2xl font-extrabold mb-4">מחשבוני מימון</h3>

      {/* מחשבון 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-bold mb-3">כמה אשלם בחודש?</h4>
          <div className="space-y-3 text-sm">
            <Row label="מחיר הרכב">
              <NumberInput value={price} onChange={setPrice} min={0} step={1000} />
            </Row>
            <Row label="מקדמה">
              <NumberInput value={down} onChange={setDown} min={0} max={price} step={1000} />
            </Row>
            <Row label="ריבית שנתית (APR)">
              <NumberInput value={apr} onChange={setApr} min={0} max={20} step={0.1} />
            </Row>
            <Row label="משך (חודשים)">
              <NumberInput value={months} onChange={setMonths} min={12} max={96} step={12} />
            </Row>
          </div>
          <div className="mt-4 bg-neutral-50 rounded-2xl border p-4 text-sm">
            <div className="flex items-center justify-between"><span>תשלום חודשי משוער:</span><strong>{fmt(monthPay)}</strong></div>
            <div className="flex items-center justify-between"><span>סכום מימון:</span><strong>{fmt(Math.max(0, price - down))}</strong></div>
            <div className="flex items-center justify-between"><span>סה״כ ריבית (בקירוב):</span>
              <strong>{fmt(monthPay * months - Math.max(0, price - down))}</strong>
            </div>
          </div>
        </div>

        {/* מחשבון 2 */}
        <div>
          <h4 className="font-bold mb-3">מה המחיר המקסימלי לפי תקציב חודשי?</h4>
          <div className="space-y-3 text-sm">
            <Row label="תקציב חודשי">
              <NumberInput value={budgetMonthly} onChange={setBudgetMonthly} min={0} step={100} />
            </Row>
            <Row label="מקדמה">
              <NumberInput value={budgetDown} onChange={setBudgetDown} min={0} step={1000} />
            </Row>
            <Row label="ריבית שנתית (APR)">
              <NumberInput value={budgetApr} onChange={setBudgetApr} min={0} max={20} step={0.1} />
            </Row>
            <Row label="משך (חודשים)">
              <NumberInput value={budgetMonths} onChange={setBudgetMonths} min={12} max={96} step={12} />
            </Row>
          </div>
          <div className="mt-4 bg-neutral-50 rounded-2xl border p-4 text-sm">
            <div className="flex items-center justify-between"><span>מחיר רכב מקסימלי משוער:</span><strong>{fmt(maxCarByBudget)}</strong></div>
          </div>
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
  return (
    <input
      type="number"
      className="w-full border rounded-xl p-2"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      {...rest}
    />
  )
}
