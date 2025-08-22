import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, MapPin, Car, Fuel, Gauge, Calendar, Search, CheckCircle2 } from 'lucide-react'
import Info from './components/Info.jsx'
import LeadForm from './components/LeadForm.jsx'

const CARS = [
  { id: 'c1', title: 'Toyota Corolla', year: 2022, price: 87900, km: 32500, gear: 'אוטומט', fuel: 'בנזין', location: 'פתח תקווה', image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=1600&auto=format&fit=crop', highlights: ['יד ראשונה','מטופל במוסך מורשה','מצב מעולה'] },
  { id: 'c2', title: 'Hyundai Tucson', year: 2021, price: 124900, km: 44800, gear: 'אוטומט', fuel: 'היברידי', location: 'ראשון לציון', image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1f?q=80&w=1600&auto=format&fit=crop', highlights: ['חסכוני','מובילאיי','מצלמת רוורס'] },
  { id: 'c3', title: 'Kia Picanto', year: 2020, price: 52900, km: 59200, gear: 'אוטומט', fuel: 'בנזין', location: 'פרדס חנה', image: 'https://images.unsplash.com/photo-1618843479314-0164913fd9ae?q=80&w=1600&auto=format&fit=crop', highlights: ['קטנה וחסכונית','מצב פנימי נקי','מתאים לעיר'] },
  { id: 'c4', title: 'Tesla Model 3', year: 2023, price: 169900, km: 17800, gear: 'אוטומט', fuel: 'חשמלי', location: 'תל אביב', image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1f?q=80&w=1600&auto=format&fit=crop', highlights: ['אוטופיילוט','טעינה מהירה','אחריות יצרן'] },
]

const formatPrice = (n) => n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })

export default function App() {
  useEffect(() => {
    document.documentElement.dir = 'rtl'
    document.title = 'R&M Motors'
  }, [])

  const [query, setQuery] = useState('')
  const [gear, setGear] = useState('הכל')
  const [fuel, setFuel] = useState('הכל')
  const [sort, setSort] = useState('newest')
  const [maxPrice, setMaxPrice] = useState(0)
  const [openId, setOpenId] = useState(null)

  const maxObservedPrice = useMemo(() => Math.max(...CARS.map(c => c.price)), [])
  const filtered = useMemo(() => {
    let items = CARS.filter(c =>
      (query ? `${c.title} ${c.location}`.toLowerCase().includes(query.toLowerCase()) : true) &&
      (gear === 'הכל' ? true : c.gear === gear) &&
      (fuel === 'הכל' ? true : c.fuel === fuel) &&
      (maxPrice > 0 ? c.price <= maxPrice : true)
    )
    if (sort === 'newest') items.sort((a,b) => b.year - a.year)
    if (sort === 'price_low') items.sort((a,b) => a.price - b.price)
    if (sort === 'price_high') items.sort((a,b) => b.price - a.price)
    return items
  }, [query, gear, fuel, sort, maxPrice])

  const whatsappNumber = '972526406728' // <- החלף למספר שלך אם צריך
  const handleWhatsApp = (car) => {
    const text = encodeURIComponent(`שלום, ראיתי את הרכב ${car.title} שנת ${car.year} במחיר ${formatPrice(car.price)}. אשמח לפרטים נוספים.`)
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank')
  }

  const openCar = (id) => setOpenId(id)
  const closeCar = () => setOpenId(null)
  const opened = filtered.find(c => c.id === openId)

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Top bar */}
      <div className="w-full bg-black text-white text-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <Phone size={16} /> <span>התקשר עכשיו: <a href="tel:0526406728" className="underline underline-offset-4">052-640-6728</a></span>
          </div>
          <a className="flex items-center gap-2 underline underline-offset-4" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
            <span>שלח ווטסאפ</span>
          </a>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Car /> 
            <div>
              <h1 className="text-xl font-bold tracking-tight">YB Motors</h1>
              <p className="text-sm text-neutral-500">אמינות. שקיפות. אחריות.</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#inventory" className="hover:opacity-70">מלאי</a>
            <a href="#finance" className="hover:opacity-70">מימון</a>
            <a href="#contact" className="hover:opacity-70">צור קשר</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 px-4 py-12 md:py-16 items-center">
          <div>
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-extrabold leading-tight">
              מוצאים את הרכב הבא שלכם ב־
              <span className="bg-gradient-to-l from-neutral-900 to-neutral-400 bg-clip-text text-transparent"> YB Motors</span>
            </motion.h2>
            <p className="mt-4 text-neutral-600">בדיקות מכון, היסטוריית טיפולים, אפשרויות מימון גמישות ואחריות אמיתית. הכל במקום אחד.</p>
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <a href="#inventory"><button className="rounded-2xl px-6 py-2 bg-black text-white">למלאי הרכבים</button></a>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
                <button className="rounded-2xl px-6 py-2 border">התייעצות בווטסאפ</button>
              </a>
            </div>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {['אחריות עד שנה','אפשרות טרייד־אין','מימון עד 100%','בדיקת מכון'].map(b => (
                <div key={b} className="flex items-center gap-2 bg-white rounded-2xl shadow-sm p-3">
                  <CheckCircle2 size={16} /> <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1549924231-f129b911e442?q=80&w=1600&auto=format&fit=crop" alt="מגרש רכבים" className="w-full h-72 md:h-96 object-cover rounded-3xl shadow" />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section id="inventory" className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex-1 flex items-center gap-2">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} />
                <input placeholder="חיפוש לפי דגם/עיר..." className="pl-9 border rounded-xl p-2 w-full" value={query} onChange={e => setQuery(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <select className="border rounded-xl p-2 w-40" value={gear} onChange={e => setGear(e.target.value)}>
                  {['הכל','אוטומט','ידני'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select className="border rounded-xl p-2 w-40" value={fuel} onChange={e => setFuel(e.target.value)}>
                  {['הכל','בנזין','דיזל','היברידי','חשמלי'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select className="border rounded-xl p-2 w-48" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">חדשים קודם</option>
                <option value="price_low">מחיר נמוך קודם</option>
                <option value="price_high">מחיר גבוה קודם</option>
              </select>
            </div>
          </div>

          <div className="mt-3 bg-neutral-50 border rounded-2xl p-3">
            <label className="text-sm text-neutral-700">תקרת מחיר: {maxPrice > 0 ? formatPrice(maxPrice) : 'ללא'}</label>
            <input type="range" min={0} max={maxObservedPrice} step={1000} value={maxPrice} onChange={e => setMaxPrice(parseInt(e.target.value))} className="w-full" />
          </div>

          {/* Cars grid */}
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(car => (
              <div key={car.id} className="rounded-3xl overflow-hidden shadow-sm border hover:shadow-md transition">
                <div className="relative">
                  <img src={car.image} alt={car.title} className="h-52 w-full object-cover" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium">
                    {car.year}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{car.title}</h3>
                    <span className="text-primary font-extrabold">{formatPrice(car.price)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                    <div className="flex items-center gap-1"><Gauge size={16} /> {car.km.toLocaleString('he-IL')} ק"מ</div>
                    <div className="flex items-center gap-1"><Calendar size={16} /> {car.year}</div>
                    <div className="flex items-center gap-1"><Fuel size={16} /> {car.fuel}</div>
                  </div>
                  <ul className="mt-3 text-sm text-neutral-700 list-disc pr-5 space-y-1">
                    {car.highlights.map(h => <li key={h}>{h}</li>)}
                  </ul>
                  <div className="mt-4 flex items-center gap-2">
                    <button className="rounded-2xl px-4 py-2 bg-black text-white flex-1" onClick={() => handleWhatsApp(car)}>שיחה בווטסאפ</button>
                    <button className="rounded-2xl px-4 py-2 border" onClick={() => openCar(car.id)}>עוד פרטים</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-neutral-500">לא נמצאו רכבים התואמים לסינון</div>
          )}
        </div>
      </section>

      {/* Finance */}
      <section id="finance" className="mt-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-l from-neutral-900 to-neutral-700 text-white rounded-3xl p-6 md:p-8 shadow">
            <h3 className="text-2ל font-extrabold">אפשרויות מימון נוחות</h3>
            <p className="mt-2 text-white/90 max-w-2xl">עד 100% מימון בכפוף לאישור חברת המימון. פריסה נוחה, ריביות תחרותיות, ואפשרות טרייד־אין על הרכב הישן.</p>
            <div className="mt-4">
              <button className="rounded-2xl px-4 py-2 bg-white text-black" onClick={() => setOpenId('finance')}>בדיקת זכאות מהירה</button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Map */}
      <section id="contact" className="mt-12 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h3 className="text-2xl font-extrabold">צור קשר</h3>
            <p className="mt-2 text-neutral-600">נשמח לראות אתכם ולצאת לנסיעת מבחן.</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2"><Phone size={18}/> <a className="underline" href="tel:0526406728">052-640-6728</a></div>
              <div className="flex items-center gap-2"><MapPin size={18}/> יאנוח־ג'ת • <a className="underline" href="https://waze.com/ul?ll=33.016,35.251&navigate=yes" target="_blank" rel="noreferrer">ניווט בוויז</a></div>
            </div>
            <div className="mt-6 bg-neutral-50 border rounded-2ל p-4">
              <LeadForm defaultMsg="רוצה תיאום הגעה למגרש" />
            </div>
          </div>
          <div className="h-72 md:h-96 w-full rounded-3xl overflow-hidden border">
            <iframe
              title="map"
              src="https://www.google.com/maps?q=33.016,35.251&z=12&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-10 border-t">
        <div className="max-w-7xl mx-auto px-4 py-8 text-sm text-neutral-600 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} YB Motors · כל הזכויות שמורות</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:underline">מדיניות פרטיות</a>
            <a href="#" className="hover:underline">תקנון</a>
          </div>
        </div>
      </footer>

      {/* Simple Modal */}
      {openId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeCar}>
          <div className="bg-white rounded-2xl p-4 w-full max-w-xl" onClick={e => e.stopPropagation()}>
            {openId === 'finance' ? (
              <>
                <h4 className="text-lg font-bold mb-3">בדיקת זכאות למימון</h4>
                <LeadForm defaultMsg="מבקש בדיקת זכאות למימון" />
              </>
            ) : (
              opened && (
                <>
                  <h4 className="text-lg font-bold mb-3">{opened.title} · {opened.year}</h4>
                  <img src={opened.image} alt={opened.title} className="w-full h-56 object-cover rounded-xl mb-3" />
                  <div className="grid grid-cols-2 gap-2">
                    <Info label='ק"מ' value={opened.km.toLocaleString('he-IL') + ' ק\"מ'} />
                    <Info label='גיר' value={opened.gear} />
                    <Info label='דלק' value={opened.fuel} />
                    <Info label='מיקום' value={opened.location} />
                  </div>
                  <div className="mt-3">
                    <LeadForm defaultMsg={`אני מעוניין ב-${opened.title} שנת ${opened.year}.`} />
                  </div>
                </>
              )
            )}
            <div className="mt-4 text-left">
              <button className="rounded-xl px-4 py-2 border" onClick={closeCar}>סגירה</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
