import React from "react";
import SmartFinder from "./components/SmartFinder";
import LoanCalculator from "./components/LoanCalculator";
import LeadForm from "./components/LeadForm";
import TradeInForm from "./components/TradeInForm";

export default function App(){
  return (
    <main dir="rtl">
      <TopBar />
      <Hero />
      <SmartFinder />
      <LeadForm />
      <TradeInForm />
      <BottomBanner />
      <Footer />
    </main>
  );
}

function TopBar(){
  return (
    <div className="topbar">
      <a className="btn ghost sm" href="https://wa.me/972526406728" target="_blank">דברו איתי בוואטסאפ</a>
      <a className="btn dark sm" href="tel:0526406728">052-640-6728 חיוג</a>
      <span className="brand-chip">R&M</span>
    </div>
  );
}

function Hero(){
  return (
    <header className="hero">
      <div className="hero-glass">
        <h1>R&M רכבי יוקרה וספורט בהתאמה אישית</h1>
        <p className="muted">מתמחים בכל סוגי הרכבים החדשים · מציאת מימון משתלם במיוחד · ליווי מלא עד המסירה וגם לאחריה</p>
      </div>
    </header>
  );
}

function BottomBanner(){
  return (
    <section className="section banner-bottom">
      <h3>למה R&M?</h3>
      <ul className="ticks">
        <li>מוצאים לך את הרכב המתאים — רק אז חותמים.</li>
        <li>מימון מותאם אישית — השוואה מול בנקים וחברות עד שנמצא את המסלול המשתלם ביותר.</li>
        <li>ליווי יד ביד עד מסירה, וגם אחרי — מצטרפים למשפחת R&M.</li>
      </ul>
    </section>
  );
}

function Footer(){
  return (
    <footer className="footer">
      <div className="logo">R&amp;M</div>
      <div>© R&M חדש 0 ק״מ · {new Date().getFullYear()}</div>
      <a className="btn ghost sm" href="https://wa.me/972526406728" target="_blank" rel="noreferrer">דברו איתנו בוואטסאפ</a>
    </footer>
  );
}
