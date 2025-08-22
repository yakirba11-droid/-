import React from "react"

export default function StickyBar({ whatsappNumber }) {
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
