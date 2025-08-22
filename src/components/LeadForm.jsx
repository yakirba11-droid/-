import React, { useState } from 'react'

export default function LeadForm({ defaultMsg = "", whatsappNumber = "9725XXXXXXXX" }) {
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
