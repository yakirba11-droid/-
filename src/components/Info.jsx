import React from 'react'

export default function Info({ label, value }) {
  return (
    <div className="bg-neutral-50 rounded-xl border p-3">
      <div className="text-[11px] text-neutral-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}
