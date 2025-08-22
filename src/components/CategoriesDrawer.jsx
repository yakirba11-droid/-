import { useState, useEffect } from "react";

/**
 * רכיב מגירת קטגוריות (ימין, RTL)
 * props:
 *  - current: string | null   // הקטגוריה הנבחרת כרגע
 *  - onSelect: (category: string) => void // קריאה חזרה לסינון המלאי
 */
export default function CategoriesDrawer({ current = null, onSelect = () => {} }) {
  const [open, setOpen] = useState(false);

  // סוגרים את המגירה עם ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // כל הקטגוריות – עם אייקון וסוג פעולה (filter/link)
  const categories = [
    { id: "ev",        title: "חשמלי",       icon: "⚡",   type: "filter", value: "חשמלי" },
    { id: "petrol",    title: "בנזין/דיזל",  icon: "⛽",   type: "filter", value: "בנזין/דיזל" },
    { id: "hybrid",    title: "היברידי",     icon: "♻️",   type: "filter", value: "היברידי" },
    { id: "luxury",    title: "יוקרה",       icon: "⭐",   type: "filter", value: "יוקרה" },
    { id: "commercial",title: "מסחרי",       icon: "🚚",   type: "filter", value: "מסחרי" },
    { id: "contact",   title: "צור קשר",      icon: "☎️",   type: "link",   href: "#contact" },
    { id: "club",      title: "מועדון לקוחות R&M", icon: "🎯", type: "link", href: "#club" },
  ];

  const handleItemClick = (item) => {
    if (item.type === "filter") {
      onSelect(item.value);     // מסננים לפי הקטגוריה
      setOpen(false);
      // אם יש עוגן של רשת המלאי – גוללים אליו קלות
      const inv = document.querySelector("#inventory");
      if (inv) inv.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (item.type === "link" && item.href) {
      setOpen(false);
      // ניווט לעוגן בדף
      const el = document.querySelector(item.href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.location.hash = item.href;
    }
  };

  return (
    <>
      {/* כפתור פתיחת מגירה */}
      <button
        dir="rtl"
        onClick={() => setOpen(true)}
        style={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open ? "true" : "false"}
      >
        <span style={styles.burger}>≡</span> קטגוריות
      </button>

      {/* שכבת רקע + המגירה */}
      {open && (
        <div dir="rtl" style={styles.overlay} onClick={() => setOpen(false)}>
          <aside
            role="dialog"
            aria-label="קטגוריות"
            onClick={(e) => e.stopPropagation()}
            style={styles.drawer}
          >
            <header style={styles.header}>
              <strong>קטגוריות</strong>
              <button onClick={() => setOpen(false)} style={styles.closeBtn} aria-label="סגור">×</button>
            </header>

            <nav style={styles.list}>
              {categories.map((cat) => {
                const active = current && cat.value === current;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleItemClick(cat)}
                    style={{
                      ...styles.item,
                      ...(active ? styles.itemActive : {}),
                    }}
                  >
                    <span style={styles.icon}>{cat.icon}</span>
                    <span>{cat.title}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

/* ===== CSS-in-JS מינימלי, RTL ===== */
const styles = {
  trigger: {
    position: "fixed",
    top: 14,
    right: 14,
    zIndex: 60,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "10px 16px",
    fontSize: 16,
    boxShadow: "0 6px 18px rgba(0,0,0,.08)",
  },
  burger: { marginInlineStart: 6, fontWeight: 700, fontSize: 18 },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.35)",
    zIndex: 50,
    display: "flex",
    justifyContent: "flex-end",
  },
  drawer: {
    width: "85vw",
    maxWidth: 380,
    height: "100%",
    background: "#fff",
    boxShadow: "-8px 0 24px rgba(0,0,0,.15)",
    display: "flex",
    flexDirection: "column",
    animation: "slideIn .2s ease-out",
  },
  header: {
    padding: "18px 16px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 18,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: 26,
    lineHeight: 1,
    cursor: "pointer",
  },
  list: { padding: 12, display: "grid", gap: 8 },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    textAlign: "right",
  },
  itemActive: {
    borderColor: "#111827",
    background: "#111827",
    color: "#fff",
  },
  icon: { fontSize: 18, marginInlineStart: 6 },
};
