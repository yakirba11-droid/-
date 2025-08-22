import React, { useState } from "react"

export default function CarImage({ slug, alt = "" }) {
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
