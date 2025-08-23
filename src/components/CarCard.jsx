import React from "react";
import { monthlyFromPrice } from "../utils/finance";

export default function CarCard({ car, months=60, mode="balloon", onLead }) {
  const monthly = monthlyFromPrice({ price: car.msrp, months, mode });

  return (
    <article className="car-card" aria-label={`${car.brand} ${car.model}`}>
      <div className="car-imgwrap">
        <img
          src={car.image}
          alt={`${car.brand} ${car.model}`}
          onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display="flex"; }}
        />
        <div className="img-fallback" aria-hidden="true">
          <span>{car.brand[0]}</span>
        </div>
        {car.tags?.length ? (
          <div className="chips">
            {car.tags.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
        ) : null}
      </div>

      <div className="car-info">
        <h3 dir="ltr">{car.brand} {car.model}</h3>
        <p className="muted">
          {car.segment} · {car.powertrain} · {car.year}
        </p>

        <div className="monthly">
          <div className="price">החל מ־<b>₪ {monthly.toLocaleString("he-IL")}</b> לחודש</div>
          <div className="note">* חישוב משוער בלבד. הצעה סופית תיקבע בבדיקה אישית.</div>
        </div>

        <div className="actions">
          <button className="btn primary" onClick={() => onLead?.(car)}>
            קבלו הצעה
          </button>
          <a className="btn ghost" href={`https://wa.me/972526406728?text=${encodeURIComponent(`שלום, אשמח להצעת מימון/זמינות ל־ ${car.brand} ${car.model}`)}`} target="_blank" rel="noreferrer">ווטסאפ</a>
        </div>
      </div>
    </article>
  );
}
