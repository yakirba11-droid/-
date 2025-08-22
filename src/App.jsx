import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Fuel, Gauge, Calendar, Search } from 'lucide-react'
import FinanceCalculator from './components/FinanceCalculator.jsx'
import LeadForm from './components/LeadForm.jsx'
import Info from './components/Info.jsx'
import StickyBar from './components/StickyBar.jsx'

// ------- קונפיג מימון לתצוגת "החל מ-₪ לחודש" -------
const APR_DEFAULT = 4.7   // ריבית משוערת שנתית
const MONTHS_DEFAULT = 84 // ברירת מחדל ל-7 שנים
const DOWN_DEFAULT = 0

const fmt = (n) => isFinite(n)
  ? n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
  : '—'

const monthlyFrom = (price, months=MONTHS_DEFAULT, apr=APR_DEFAULT, down=DOWN_DEFAULT) => {
  const P = Math.max(0, Number(price||0) - down)
  const r = (apr / 100) / 12
  if (!P || !months) return 0
  if (r === 0) return P / months
  return (P * r) / (1 - Math.pow(1 + r, -months))
}

// ------- טעינת מלאי מ-CSV עם עקיפת קאש -------
const parseCSV = async (url) => {
  const full = `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`
  const res = await fetch(full, { cache: 'no-store' })
  const text = await res.text()
  const [header, ...rows] = text.trim().split(/\r?\n/)
  const headers = header.split(',').map(h => h.trim())
  return rows.filter(Boolean).map(r => {
    const cols = r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.replace(/^"|"$/g,'').trim())
    const obj = {}
    headers.forEach((h,i) => obj[h] = cols[i])
    obj.year = Number(obj.year); obj.price = Number(obj.price); obj.msrp = obj.msrp ? Number(obj.msrp) : null
    obj.km = Number(obj.km); obj.delivery_weeks = obj.delivery_weeks ? Number(obj.delivery_weeks) : null
    obj.highlights = (obj.highlights || '').split('|').filter(Boolean)
    obj.sold = (obj.sold || '').toLowerCase() === 'yes'
    obj.brand = (obj.title || '').split(' ')[0] // מותג מהטייטל
    return obj
  })
}

export default function App() {
  useEffect(() => {
    document.documentElement.dir = 'rtl'
    document.title = 'R&M מוטורס — חדש 0 ק״מ'
  }, [])

  const whatsappNumber = '9725XXXXXXXX' // ← להחליף למספר שלך
  const [cars, setCars] = useState([])
  const [query, setQuery] = useState('')
  const [fuel, setFuel] = useState('הכל')
  const [sort, setSort] = useState('newest')
  const [maxPrice, setMaxPrice] = useState(0)
  const [maxMonthly, setMaxMonthly] = useState(0)
  const [brand, setBrand] = useState('הכל')
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    parseCSV('/inventory.csv').then(setCars).catch(() => {
      setCars([
        { id:'n1', title:'Hyundai Tucson Premium', year:2025, price:169900, msrp:184900, km:0, gear:'אוטומט', fuel:'היברידי', color:'לבן', delivery_weeks:2, image:'https://images.unsplash.com/photo-1619767886558-efdc259cde1f?q=80&w=1600&auto=format&fit=crop', highlights:['חדש 0 ק״מ','מחיר השקה','ליווי עד מסירה'], sold:false, brand:'Hyundai' },
      ])
    })
  }, [])

  const brands = useMemo(() => ['הכל', ...Array.from(new Set(cars.map(c => c.brand).filter(Boolean)))], [cars])
  const maxObservedPrice = useMemo(() => (cars.length ? Math.max(...cars.map(c => c.price || 0)) : 0), [cars])
  const maxObservedMonthly = useMemo(() => {
    if (!cars.length) return 0
    return Math.ceil(Math.max(...cars.map(c => monthlyFrom(c.price))) / 10) * 10
  }, [cars])

  const filtered = useMemo(() => {
    let items = cars
      .filter(c => (c.km ?? 0) <= 15 && !c.sold)
      .filter(c => (query ? `${c.title} ${c.fuel||''}`.toLowerCase().includes(query.toLowerCase()) : true))
      .filter(c => (fuel === 'הכל' ? true : c.fuel === fuel))
      .filter(c => (brand === 'הכל' ? true : c.brand === brand))
      .filter(c => (maxPrice > 0 ? Number(c.price) <= maxPrice : true))
      .filter(c => (maxMonthly > 0 ? monthlyFrom(c.price) <= maxMonthly : true))

    if (sort === 'newest') items.sort((a,b) => b.year - a.year)
    if (sort === 'price_low') items.sort((a,b) => a.price - b.price)
    if (sort === 'price_high') items.sort((a,b) => b.price - a.price)
    return items
  }, [cars, query, fuel, brand, sort, maxPrice, maxMonthly])

  const openCar = (id) => setOpenId(id)
  const closeCar = () => setOpenId(null)
  const opened = filtered.find(c => c.id === openId)

  const handleWhatsApp = (car) => {
    const text = encodeURIComponent(`שלום, מעוניין ב-${car.title} חדש 0 ק״מ ${car.year}. אשמח להצעת מחיר ומימון.`)
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png?v=2" alt="R&M מוטורס" className="h-8 w-auto" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">R&amp;M מוטורס — חדש 0 ק״מ</h1>
              <p className="text-sm text-neutral-500">רכב יוקרה וספורט בהתאמה אישית</p>
            </div>
          </div>
          <a className="rounded-2xl px-4 py-2 border" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">ווטסאפ</a>
        </div>
      </header>

      {/* HERO — הצעת ערך חזקה כמו באתרים ששלחת */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 px-4 py-12 md:py-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
              רק רכבים <span className="bg-gradient-to-l from-white to-[#E7DFCF] bg-clip-text text-transparent">חדשים 0 ק״מ</span> — מחירים מיוחדים ומימון מותאם
            </h2>
            <p className="mt-4 text-white/90">ליווי מלא של כל התהליך, לא חותמים עד שמצאנו את הטוב ביותר ללקוח.</p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {['0 ק״מ אמיתי', 'מחירים מיוחדים', 'מימון מותאם', 'ליווי עד ואחרי המסירה'].map(b => (
                <div key={b} className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl p-3">
                  <CheckCircle2 size={16} /> <span>{b}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3">
              <a href="#inventory"><button className="rounded-2xl px-6 py-2 bg-white text-black">למלאי</button></a>
              <a href="#finance"><button className="rounded-2xl px-6 py-2 border border-white/50">מחשבוני מימון</button></a>
            </div>

            {/* סטריפ אמון/שיתופי פעולה */}
            <div className="mt-6 text-xs text-white/80">
              עובדים עם גופי מימון ובנקים מובילים — הצעות מותאמות במהירות.
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <img src="/logo.png?v=2" alt="R&M מוטורס" className="w-full max-w-md h-72 md:h-96 object-contain" />
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
          {/* סרגל עליון: חיפוש/מותג/דלק/מיון */}
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
            </div>
            <div className="flex items-center gap-2">
              <select className="border rounded-xl p-2 w-48" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">שנה חדשה קודם</option>
                <option value="price_low">מחיר נמוך קודם</option>
                <option value="price_high">מחיר גבוה קודם</option>
              </select>
            </div>
          </div>

          {/* סליידרים לתקציב */}
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <div className="bg-neutral-50 border rounded-2xl p-3">
              <label className="text-sm text-neutral-700">תקרת מחיר: {maxPrice > 0 ? fmt(maxPrice) : 'ללא'}</label>
              <input type="range" min={0} max={maxObservedPrice || 300000} step={1000} value={maxPrice} onChange={e => setMaxPrice(parseInt(e.target.value))} className="w-full" />
            </div>
            <div className="bg-neutral-50 border rounded-2xl p-3">
              <label className="text-sm text-neutral-700">תקרת תשלום חודשי: {maxMonthly > 0 ? fmt(maxMonthly) : 'ללא'}</label>
              <input type="range" min={0} max={maxObservedMonthly || 4000} step={50} value={maxMonthly} onChange={e => setMaxMonthly(parseInt(e.target.value))} className="w-full" />
            </div>
          </div>

          {/* רשת כרטיסים */}
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(car => {
              const month = Math.round(monthlyFrom(car.price))
              return (
                <div key={car.id} className="rounded-3xl overflow-hidden shadow-sm border hover:shadow-md transition bg-white">
                  <div className="relative">
                    <img src={car.image} alt={car.title} className="h-52 w-full object-cover" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium">חדש · {car.year}</div>
                    {!!car.delivery_weeks && <div className="absolute top-3 left-3 bg-black/80 text-white px-3 py-1 rounded-full text-xs">אספקה {car.delivery_weeks} שבועות</div>}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold">{car.title}</h3>
                      <div className="text-right">
                        {car.msrp ? <div className="text-xs line-through text-neutral-500">{fmt(car.msrp)}</div> : null}
                        <div className="text-base font-extrabold">{fmt(car.price)}</div>
                        <div className="text-[11px] text-neutral-500">החל מ־<b>{fmt(month)}</b> לחודש</div>
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
                      <button className="rounded-2xl px-4 py-2 bg-black text-white flex-1" onClick={() => openCar(car.id)}>בקשת הצעת מחיר</button>
                      <button className="rounded-2xl px-4 py-2 border" onClick={() => handleWhatsApp(car)}>ווטסאפ</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && <div className="text-center py-16 text-neutral-500">אין רכבים זמינים לפי הסינון.</div>}
        </div>
      </section>

      {/* למה אצלנו (Trust) */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ['השירות הטוב ביותר','זמינות, שקיפות וליווי אישי עד ואחרי המסירה.'],
            ['מחירים מיוחדים מאוד','דילים חזקים על חדש 0 ק״מ בעזרת הספקים שלנו.'],
            ['מימון מותאם אישית','השוואת מסלולים מ־מספר גופים — לא חותמים עד שמצאנו את הטוב ביותר.'],
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
            <LeadForm defaultMsg="מעוניין/ת ברכב חדש 0 ק״מ + הצעת מימון מותאמת" whatsappNumber={whatsappNumber} />
          </div>
        </div>
      </section>

      {/* מודל הצעת מחיר פר־דגם */}
      {openId && opened && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeCar}>
          <div className="bg-white rounded-2xl p-4 w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold mb-3">{opened.title} · {opened.year}</h4>
            <img src={opened.image} alt={opened.title} className="w-full h-56 object-cover rounded-xl mb-3" />
            <div className="grid grid-cols-2 gap-2">
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
          </div>
        </div>
      )}

      {/* סטיקי-בר לנייד */}
      <StickyBar whatsappNumber={whatsappNumber} />
    </div>
  )
}
