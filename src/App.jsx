// src/App.js
import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Fuel, Gauge, Calendar, Search } from 'lucide-react'

// ===================== קבועים פנימיים (לא מוצגים באתר) =====================
const APR_DEFAULT = 5.9           // ריבית פנימית בלבד (צמוד מדד) — לא מוצגת
const MONTHS_DEFAULT = 60         // ברירת מחדל 60 ח׳
const BALLOON_FRAC = 0.5          // בלון 50% מסוף תקופה

// ===================== עזרי חישוב/פורמט =====================
function monthlyPayment({ price, down = 0, months = MONTHS_DEFAULT, plan = 'standard', apr = APR_DEFAULT }) {
  const P0 = Math.max(0, Number(price || 0) - Number(down || 0))
  const r = (apr / 100) / 12
  if (months <= 0) return 0

  if (plan === 'balloon') {
    // מסלול בלון: 60 תשלומים חודשיים + בלון 50% משווי הרכב בסוף תקופה
    const F = BALLOON_FRAC * Number(price || 0)
    if (r === 0) return (P0 - F) / months
    const den = 1 - Math.pow(1 + r, -months)
    return (r * (P0 - F / Math.pow(1 + r, months))) / den
  } else {
    // רגיל (שפיצר)
    if (r === 0) return P0 / months
    return (P0 * r) / (1 - Math.pow(1 + r, -months))
  }
}

const fmt = (n) => isFinite(n)
  ? n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
  : '—'

const slugify = (s='') =>
  s.toLowerCase()
   .normalize('NFKD')
   .replace(/[^\p{L}\p{N}]+/gu, '-')
   .replace(/-+/g, '-')
   .replace(/^-|-$/g, '')

// ===================== מרכיבי UI פנימיים =====================
function CarImage({ slug, alt = "" }) {
  const [src, setSrc] = useState(`/cars/${slug}.png?v=2`)
  return (
    <div className="bg-white">
      <img
        src={src}
        alt={alt}
        className="h-52 w-full object-contain bg-white"
        onError={() => setSrc('/cars/_placeholder.svg?v=2')}
        loading="lazy"
      />
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="bg-neutral-50 rounded-xl border p-3">
      <div className="text-[11px] text-neutral-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}

function LeadForm({ defaultMsg = "", whatsappNumber = "9725XXXXXXXX" }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [msg, setMsg] = useState(defaultMsg)

  const submit = (e) => {
    e.preventDefault()
    const text = encodeURIComponent(`שם: ${name}\nטלפון: ${phone}\nהודעה: ${msg}`)
    const wa = `https://wa.me/${whatsappNumber}?text=${text}`
    window.open(wa, "_blank")
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className="border rounded-xl p-2" placeholder="שם מלא" value={name} onChange={e => setName(e.target.value)} required />
        <input className="border rounded-xl p-2" placeholder="טלפון" value={phone} onChange={e => setPhone(e.target.value)} required />
      </div>
      <textarea className="w-full border rounded-xl p-3 min-h-[100px] focus:outline-none focus:ring-2"
        placeholder="איך נוכל לעזור?" value={msg} onChange={e => setMsg(e.target.value)} />
      <button type="submit" className="rounded-2xl px-4 py-2 bg-black text-white">שליחה בווטסאפ</button>
    </form>
  )
}

function StickyBar({ whatsappNumber }) {
  return (
    <div className="fixed bottom-0 inset-x-0 md:hidden z-50">
      <div className="mx-3 mb-3 rounded-2xl shadow-lg bg-black text-white flex items-center justify-between p-3">
        <div className="text-sm">
          <div className="font-bold">רוצה הצעה מהירה?</div>
          <div className="opacity-80">נחזור אליך בווטסאפ</div>
        </div>
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 bg-white text-black rounded-xl"
        >ווטסאפ</a>
      </div>
    </div>
  )
}

function FinanceCalculator() {
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

// ===================== טעינת CSV (עם קטגוריות) =====================
const parseCSV = async (url) => {
  const full = `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`
  const res = await fetch(full, { cache: 'no-store' })
  const text = await res.text()
  const [header, ...rows] = text.trim().split(/\r?\n/)
  const headers = header.split(',').map(h => h.trim())
  const luxBrands = ["BMW","Mercedes","Audi","Lexus","Volvo"]

  const deriveCategory = (title, fuel) => {
    if (luxBrands.some(b => (title||"").includes(b))) return "יוקרה"
    if ((fuel||"") === "חשמלי") return "חשמלי"
    if ((fuel||"") === "היברידי") return "היברידי"
    return "בנזין"
  }

  return rows.filter(Boolean).map(r => {
    const cols = r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.replace(/^"|"$/g,'').trim())
    const obj = {}
    headers.forEach((h,i) => obj[h] = cols[i])

    // טיפוסים
    obj.year = Number(obj.year)
    obj.price = Number(obj.price)
    obj.msrp = obj.msrp ? Number(obj.msrp) : null
    obj.km = Number(obj.km)
    obj.delivery_weeks = obj.delivery_weeks ? Number(obj.delivery_weeks) : null
    obj.highlights = (obj.highlights || '').split('|').filter(Boolean)
    obj.sold = (obj.sold || '').toLowerCase() === 'yes'

    // קטגוריה: קח מה-CSV אם קיימת; אחרת גזור
    obj.category = obj.category && obj.category.length ? obj.category : deriveCategory(obj.title, obj.fuel)

    // מותג + slug + נתיב תמונה לוקאלי
    obj.brand = (obj.title || '').split(' ')[0]
    obj.slug = slugify(obj.title || '')
    obj.image = `/cars/${obj.slug}.png?v=2`

    return obj
  })
}

// ===================== האפליקציה הראשית =====================
export default function App() {
  useEffect(() => {
    document.documentElement.dir = 'rtl'
    document.title = 'R&M מוטורס — חדש 0 ק״מ'
  }, [])

  const whatsappNumber = '9725XXXXXXXX' // ← להחליף למספר שלך (בינלאומי, בלי + ובלי 0)
  const [cars, setCars] = useState([])

  // סינונים
  const [query, setQuery] = useState('')
  const [fuel, setFuel] = useState('הכל')
  const [brand, setBrand] = useState('הכל')
  const [category, setCategory] = useState('הכל') // 'הכל' | 'חשמלי' | 'היברידי' | 'בנזין' | 'יוקרה'
  const [sort, setSort] = useState('newest')
  const [maxPrice, setMaxPrice] = useState(0)
  const [maxMonthly, setMaxMonthly] = useState(0)

  // מסלולי מימון לתצוגה
  const [plan, setPlan] = useState('standard') // 'standard' | 'balloon'
  const [months, setMonths] = useState(60)     // רגיל בלבד; בלון = 60

  useEffect(() => {
    parseCSV('/inventory.csv').then(setCars).catch(() => {
      // Fallback דוגמאי אם אין CSV
      setCars([
        { id:'n1', title:'Hyundai Tucson Premium', year:2025, price:169900, msrp:184900, km:0, gear:'אוטומט', fuel:'היברידי', color:'לבן', delivery_weeks:2, highlights:['חדש 0 ק״מ','מחיר השקה','ליווי עד מסירה'].join('|'), sold:'no', category:'היברידי' }
      ].map(x => {
        const obj = { ...x }
        obj.highlights = (obj.highlights || '').split('|').filter(Boolean)
        obj.sold = (obj.sold || '').toLowerCase() === 'yes'
        obj.brand = (obj.title || '').split(' ')[0]
        obj.slug = slugify(obj.title || '')
        obj.image = `/cars/${obj.slug}.png?v=2`
        return obj
      }))
    })
  }, [])

  const brands = useMemo(() => ['הכל', ...Array.from(new Set(cars.map(c => c.brand).filter(Boolean)))], [cars])
  const maxObservedPrice = useMemo(() => (cars.length ? Math.max(...cars.map(c => c.price || 0)) : 0), [cars])
  const maxObservedMonthly = useMemo(() => {
    if (!cars.length) return 0
    return Math.ceil(Math.max(...cars.map(c => monthlyPayment({ price: c.price, months: plan==='balloon'?60:months, plan }))) / 10) * 10
  }, [cars, plan, months])

  const filtered = useMemo(() => {
    let items = cars
      .filter(c => (c.km ?? 0) <= 15 && !c.sold) // 0 ק״מ בלבד
      .filter(c => (query ? `${c.title} ${c.fuel||''}`.toLowerCase().includes(query.toLowerCase()) : true))
      .filter(c => (fuel === 'הכל' ? true : c.fuel === fuel))
      .filter(c => (brand === 'הכל' ? true : c.brand === brand))
      .filter(c => (category === 'הכל' ? true : c.category === category))
      .filter(c => (maxPrice > 0 ? Number(c.price) <= maxPrice : true))
      .filter(c => {
        if (maxMonthly <= 0) return true
        const m = monthlyPayment({ price: c.price, months: plan === 'balloon' ? 60 : months, plan })
        return m <= maxMonthly
      })

    if (sort === 'newest') items.sort((a,b) => b.year - a.year)
    if (sort === 'price_low') items.sort((a,b) => a.price - b.price)
    if (sort === 'price_high') items.sort((a,b) => b.price - a.price)
    return items
  }, [cars, query, fuel, brand, category, sort, maxPrice, maxMonthly, plan, months])

  const [openId, setOpenId] = useState(null)
  const opened = filtered.find(c => c.id === openId)
  const openCar = (id) => setOpenId(id)
  const closeCar = () => setOpenId(null)

  const openWhatsApp = (car) => {
    const text = encodeURIComponent(`שלום, מעוניין ב-${car.title} חדש 0 ק״מ (${car.year}). אשמח להצעת מחיר ומסלול מימון מתאים.`)
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png?v=3" alt="R&M מוטורס" className="h-8 w-auto" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">R&amp;M מוטורס — חדש 0 ק״מ</h1>
              <p className="text-sm text-neutral-500">רכב יוקרה וספורט בהתאמה אישית</p>
            </div>
          </div>
          <a className="rounded-2xl px-4 py-2 border" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">ווטסאפ</a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 px-4 py-12 md:py-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
              רק רכבים <span className="bg-gradient-to-l from-white to-[#E7DFCF] bg-clip-text text-transparent">חדשים 0 ק״מ</span> — מחירים מיוחדים ומימון מותאם
            </h2>
            <p className="mt-4 text-white/90">ליווי מלא של כל התהליך — לא חותמים עד שמצאנו את הטוב ביותר ללקוח.</p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {['0 ק״מ אמיתי','מחירים מיוחדים','מימון מותאם','ליווי עד ואחרי המסירה'].map(b => (
                <div key={b} className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl p-3">
                  <CheckCircle2 size={16} /> <span>{b}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3">
              <a href="#inventory"><button className="rounded-2xl px-6 py-2 bg-white text-black">למלאי</button></a>
              <a href="#finance"><button className="rounded-2xl px-6 py-2 border border-white/50">מחשבוני מימון</button></a>
            </div>
            <div className="mt-4 text-[11px] text-white/80">
              * תנאי המימון צמודי מדד ועשויים להשתנות לפי דירוג הלקוח.
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <img src="/logo.png?v=3" alt="R&M מוטורס" className="w-full max-w-md h-72 md:h-96 object-contain" />
          </div>
        </div>
      </section>

      {/* מחשבוני מימון */}
      <section id="finance" className="max-w-7xl mx-auto px-4 pb-4">
        <FinanceCalculator />
      </section>

      {/* סינון + מלאי */}
      <section id="inventory" className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* פס סינון עליון */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex-1 flex items-center gap-2">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} />
                <input placeholder="חיפוש לפי דגם/דלק..." className="pl-9 border rounded-xl p-2 w-full" value={query} onChange={e => setQuery(e.target.value)} />
              </div>
              <select className="border rounded-xl p-2 w-40" value={fuel} onChange={e => setFuel(e.target.value)}>
                {['הכל','בנזין','דיזל','היברידי','חשמלי'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select className="border rounded-xl p-2 w-40" value={brand} onChange={e => setBrand(e.target.value)}>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select className="border rounded-xl p-2 w-40" value={category} onChange={e => setCategory(e.target.value)}>
                {['הכל','חשמלי','היברידי','בנזין','יוקרה'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select className="border rounded-xl p-2 w-48" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">שנה חדשה קודם</option>
                <option value="price_low">מחיר נמוך קודם</option>
                <option value="price_high">מחיר גבוה קודם</option>
              </select>
            </div>
          </div>

          {/* בוררי מסלול/חודשים + סליידרים לתקציב */}
          <div className="mt-3 grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-3">
            <div className="bg-neutral-50 border rounded-2xl p-3">
              <label className="text-sm text-neutral-700">מסלול מימון</label>
              <div className="mt-2 flex items-center gap-2">
                <button className={`rounded-xl px-3 py-2 border ${plan==='standard' ? 'bg-black text-white' : ''}`} onClick={() => setPlan('standard')} type="button">רגיל</button>
                <button className={`rounded-xl px-3 py-2 border ${plan==='balloon' ? 'bg-black text-white' : ''}`} onClick={() => setPlan('balloon')} type="button">בלון (50% / 60ח׳)</button>
              </div>
            </div>

            <div className="bg-neutral-50 border rounded-2xl p-3">
              <label className="text-sm text-neutral-700">מס׳ חודשים {plan==='balloon' ? '(קבוע 60)' : ''}</label>
              <input type="range" min={12} max={96} step={12} disabled={plan==='balloon'} value={months} onChange={e => setMonths(parseInt(e.target.value))} className="w-full mt-2" />
              <div className="text-xs text-neutral-600 mt-1">{plan==='balloon' ? '60' : months} ח׳</div>
            </div>

            <div className="bg-neutral-50 border rounded-2xl p-3">
              <label className="text-sm text-neutral-700">תקרת מחיר: {maxPrice > 0 ? fmt(maxPrice) : 'ללא'}</label>
              <input type="range" min={0} max={maxObservedPrice || 400000} step={1000} value={maxPrice} onChange={e => setMaxPrice(parseInt(e.target.value))} className="w-full mt-2" />
            </div>

            <div className="bg-neutral-50 border rounded-2xl p-3">
              <label className="text-sm text-neutral-700">תקרת תשלום חודשי: {maxMonthly > 0 ? fmt(maxMonthly) : 'ללא'}</label>
              <input type="range" min={0} max={maxObservedMonthly || 5000} step={50} value={maxMonthly} onChange={e => setMaxMonthly(parseInt(e.target.value))} className="w-full mt-2" />
            </div>
          </div>

          {/* רשת כרטיסים */}
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(car => {
              const m = Math.round(monthlyPayment({ price: car.price, months: plan==='balloon'?60:months, plan }))
              return (
                <div key={car.id} className="rounded-3xl overflow-hidden shadow-sm border hover:shadow-md transition bg-white">
                  {/* תמונה אחידה: קובץ מקומי או Placeholder */}
                  <CarImage slug={car.slug} alt={car.title} />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold">{car.title}</h3>
                      <div className="text-right">
                        {car.msrp ? <div className="text-xs line-through text-neutral-500">{fmt(car.msrp)}</div> : null}
                        <div className="text-base font-extrabold">{fmt(car.price)}</div>
                        <div className="text-[11px] text-neutral-500">החל מ־<b>{fmt(m)}</b> לחודש</div>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                      <div className="flex items-center gap-1"><Gauge size={16} /> 0 ק״מ</div>
                      <div className="flex items-center gap-1"><Calendar size={16} /> {car.year}</div>
                      <div className="flex items-center gap-1"><Fuel size={16} /> {car.fuel}</div>
                    </div>

                    <ul className="mt-3 text-sm text-neutral-700 list-disc pr-5 space-y-1">
                      {car.highlights?.map(h => <li key={h}>{h}</li>)}
                    </ul>

                    <div className="mt-4 flex items-center gap-2">
                      <button className="rounded-2xl px-4 py-2 bg-black text-white flex-1" onClick={() => setOpenId(car.id)}>בקשת הצעת מחיר</button>
                      <button className="rounded-2xl px-4 py-2 border" onClick={() => openWhatsApp(car)}>ווטסאפ</button>
                    </div>

                    <div className="mt-2 text-[11px] text-neutral-500">
                      * תנאי המימון צמודי מדד ועשויים להשתנות לפי דירוג הלקוח.
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && <div className="text-center py-16 text-neutral-500">אין רכבים זמינים לפי הסינון.</div>}
        </div>
      </section>

      {/* למה אצלנו */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ['השירות הטוב ביותר','זמינות, שקיפות וליווי אישי עד ואחרי המסירה.'],
            ['מחירים מיוחדים מאוד','דילים חזקים על חדש 0 ק״מ בעזרת הספקים שלנו.'],
            ['מימון מותאם אישית','מסלולים אישיים — לא חותמים עד שמצאנו את הטוב ביותר.'],
          ].map(([t,d]) => (
            <div key={t} className="rounded-2xl border bg-white p-5">
              <div className="flex items-center gap-2 text-lg font-bold"><CheckCircle2 size={18}/>{t}</div>
              <p className="text-sm text-neutral-600 mt-2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* טופס כללי */}
      <section className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h3 className="text-2xl font-extrabold">מצטרפים למשפחה</h3>
          <p className="text-neutral-600 mt-1">השאירו פרטים ונחזור עם ההצעה הטובה ביותר.</p>
          <div className="mt-4 bg-neutral-50 rounded-2xl border p-4">
            <LeadForm defaultMsg="מעוניין/ת ברכב חדש 0 ק״מ + מסלול מימון מתאים" whatsappNumber={whatsappNumber} />
          </div>
        </div>
      </section>

      {/* מודל הצעת מחיר */}
      {openId && opened && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeCar}>
          <div className="bg-white rounded-2xl p-4 w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold mb-3">{opened.title} · {opened.year}</h4>
            <CarImage slug={opened.slug} alt={opened.title} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Info label="ק״מ" value="0" />
              <Info label="דלק" value={opened.fuel || '—'} />
              <Info label="מחיר" value={fmt(opened.price)} />
              <Info label="אספקה" value={opened.delivery_weeks ? `${opened.delivery_weeks} שבועות` : 'מיידי'} />
            </div>
            <div className="mt-3">
              <LeadForm defaultMsg={`בקשת הצעת מחיר על ${opened.title} חדש 0 ק״מ`} whatsappNumber={whatsappNumber} />
            </div>
            <div className="mt-4 text-left">
              <button className="rounded-xl px-4 py-2 border" onClick={closeCar}>סגירה</button>
            </div>
            <div className="mt-2 text-[11px] text-neutral-500">
              * תנאי המימון צמודי מדד ועשויים להשתנות לפי דירוג הלקוח.
            </div>
          </div>
        </div>
      )}

      {/* סטיקי-בר לנייד */}
      <StickyBar whatsappNumber={whatsappNumber} />
    </div>
  )
}
