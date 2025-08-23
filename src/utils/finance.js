// PMT חישוב תשלום חודשי. לא מציגים ריבית למשתמש.
export function pmtMonthly({ price, down=0, months=60, residual=0, mode="balloon" }) {
  // "ריבית פנימית" לשיקלול בלבד – לא מוצגת (5.9%/שנה).
  const annual = 0.059;
  const r = annual / 12;

  const pv = Math.max(price - down, 0);

  if (months <= 0 || pv <= 0) return 0;

  if (mode === "balloon") {
    // PMT עם יתרת סיום (residual) – FV בסוף תקופה
    // נוסחה: pmt = (pv*r + r*fv/(1+r)^n) / (1 - (1+r)^-n)
    const fv = residual;
    const pow = Math.pow(1 + r, months);
    const pmt = (pv * r + (r * fv) / pow) / (1 - 1 / pow);
    return Math.max(Math.round(pmt), 0);
  }

  // רגיל – ללא יתרה
  const pow = Math.pow(1 + r, months);
  const pmt = (pv * r * pow) / (pow - 1);
  return Math.max(Math.round(pmt), 0);
}

export function monthlyFromPrice({ price, months=60, mode="balloon" }) {
  // ברירת מחדל: בלון, יתרה 50% (מהמחירון)
  const residual = mode === "balloon" ? Math.round(price * 0.5) : 0;
  return pmtMonthly({ price, months, residual, mode });
}
