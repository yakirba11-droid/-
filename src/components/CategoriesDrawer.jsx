import { useState, useEffect } from "react";

/** מגירת קטגוריות סטטית – לא תלויה בשום מקור נתונים */
export default function StaticCategoriesDrawer({ onSelect = () => {} }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = [
    { id: "ev",        label: "חשמלי",          icon: "⚡",   type: "filter", value: "חשמלי" },
    { id: "petrol",    label: "בנזין/דיזל",     icon: "⛽",   type: "filter", value: "בנזין/דיזל" },
    { id: "hybrid",    label: "היברידי",        icon: "♻️",   type: "filter", value: "היברידי" },
    { id: "luxury",    label: "יוקרה",          icon: "⭐",   type: "filter", value: "יוקרה" },
    { id: "commercial",label: "מסחרי",          icon: "🚚",   type: "filter", value: "מסחרי" },
    { id: "contact",   label: "צור קשר",        icon: "☎️",   type: "link",   href: "#contact" },
    { id: "club",      label: "מועדון לקוחות R&M", icon: "🎯", type: "link", href: "#club" },
  ];

  const handleClick = (it) => {
    if (it.type === "filter") onSelect(it.value);
    if (it.type === "link" && it.href) {
      const el = document.querySelector(it.href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.location.hash = it.href;
    }
    setOpen(false);
  };

  return (
    <>
      {/* כפתור פתיחה קבוע למעלה-ימין */}
      <button
        dir="rtl"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", top: 14, right: 14, zIndex: 1000,
          background: "#ffffff", color: "#111827",
          border: "1px solid #e5e7eb", borderRadius: 999,
          padding: "10px 16px", fontSize: 16,
          boxShadow: "0 6px 18px rgba(0,0,0,.08)"
        }}
      >
        <span style={{ fontWeight: 700, marginInlineStart: 6 }}>≡</span>
        קטגוריות
      </button>

      {/* שכבה ומגירה */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(0,0,0,.35)", display: "flex",
            justifyContent: "flex-end"
          }}
        >
          <aside
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "85vw", maxWidth: 380, height: "100%",
              background: "#ffffff", color: "#111827",
              boxShadow: "-8px 0 24px rgba(0,0,0,.15)",
              display: "flex", flexDirection: "column"
            }}
          >
            <div style={{
              padding: "18px 16px", borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: 18, fontWeight: 700
            }}>
              קטגוריות
              <button
                onClick={() => setOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: 26, lineHeight: 1, cursor: "pointer" }}
                aria-label="סגור"
              >
                ×
              </button>
            </div>

            {/* הרשימה – תמיד קיימת, בלי תנאים */}
            <nav style={{ padding: 12, display: "grid", gap: 10 }}>
              {items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => handleClick(it)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 14px", background: "#fff", color: "#111827",
                    border: "1px solid #e5e7eb", borderRadius: 12, textAlign: "right"
                  }}
                >
                  <span style={{ fontSize: 18, marginInlineStart: 6 }}>{it.icon}</span>
                  <span style={{ fontSize: 16 }}>{it.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
