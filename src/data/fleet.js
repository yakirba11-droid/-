// src/data/fleet.js
// R&M Motors — Fleet Catalog (HE)
// שים לב: המספרים מקורבים לצורך תצוגת "החל מ' בלבד".
// אפשר לעדכן msrp ידנית לכל דגם. אין חשיפה של ריבית למשתמש.

export const BALLOON_DEFAULT = {
  months: 60,           // עד 60 חוד׳
  residualPct: 0.50,    // 50% מסוף תקופה (בלון)
  down: 30000,          // מקדמה ברירת מחדל לתצוגה
  // הערה: לא מציגים ריבית, זה רק לחישוב "החל מ׳"
  apr: 0.059            // 5.9% צמוד מדד (לשינוי פנימי בלבד)
};

/**
 * חישוב החזר חודשי משוער במסלול בלון.
 * L = מחיר - מקדמה, יתרת בלון = מחיר * residualPct (משולמת בסוף),
 * PV(בלון) = Balloon / (1+r)^n, תשלום חודשי: ( (L - PV) * r ) / (1 - (1+r)^-n ).
 * מוחזר בערך עגול ל־₪10.
 */
export function calcMonthlyBalloon(
  price,
  { months = BALLOON_DEFAULT.months, residualPct = BALLOON_DEFAULT.residualPct, down = BALLOON_DEFAULT.down, apr = BALLOON_DEFAULT.apr } = {}
) {
  const L = Math.max(price - (down || 0), 0);
  const r = (apr || 0) / 12;
  const n = Math.max(months, 1);
  const balloon = price * (residualPct || 0);
  const pvBalloon = balloon / Math.pow(1 + r, n);
  const numer = (L - pvBalloon) * r;
  const denom = 1 - Math.pow(1 + r, -n);
  const pmt = denom > 0 ? numer / denom : 0;
  // עיגול יפה
  const rounded = Math.max(0, Math.round(pmt / 10) * 10);
  return rounded;
}

/**
 * תבנית דגם:
 * {
 *   id, brand, model, year, fuel, body, trim,
 *   category, msrp, img, tags: []  // img — תמונה על רקע לבן (הוסף לתיקייה /public/images/cars/)
 * }
 * קטגוריות מוצעות: "חשמלי", "היברידי", "בנזין/דיזל", "יוקרה", "מסחרי".
 */

export const FLEET = [
  // ---------- חשמליים פופולריים ----------
  { id: 'byd-atto3-ev', brand: 'BYD', model: 'Atto 3', year: 2025, fuel: 'חשמלי', body: 'קרוסאובר', trim: 'Design', category: 'חשמלי', msrp: 149900, img: '/images/cars/byd_atto3_white.png', tags: ['ADAS','משפחתי'] },
  { id: 'byd-dolphin-ev', brand: 'BYD', model: 'Dolphin', year: 2025, fuel: 'חשמלי', body: 'האצ׳בק', trim: 'Comfort', category: 'חשמלי', msrp: 129900, img: '/images/cars/byd_dolphin_white.png', tags: ['עירוני','משפחתי'] },
  { id: 'byd-seal-ev', brand: 'BYD', model: 'Seal', year: 2025, fuel: 'חשמלי', body: 'סדאן', trim: 'Dynamic', category: 'חשמלי', msrp: 194900, img: '/images/cars/byd_seal_white.png', tags: ['סדאן','מהיר'] },
  { id: 'mg-zs-ev', brand: 'MG', model: 'ZS EV', year: 2025, fuel: 'חשמלי', body: 'קרוסאובר', trim: 'Luxury', category: 'חשמלי', msrp: 144900, img: '/images/cars/mg_zs_ev_white.png', tags: ['משפחתי','נוחות'] },
  { id: 'xpeng-g9-ev', brand: 'XPeng', model: 'G9', year: 2025, fuel: 'חשמלי', body: 'קרוסאובר', trim: 'Long Range', category: 'חשמלי', msrp: 299900, img: '/images/cars/xpeng_g9_white.png', tags: ['טכנולוגי','יוקרתי'] },
  { id: 'tesla-model3', brand: 'Tesla', model: 'Model 3', year: 2025, fuel: 'חשמלי', body: 'סדאן', trim: 'RWD', category: 'חשמלי', msrp: 189900, img: '/images/cars/tesla_model3_white.png', tags: ['מהיר','OTA'] },
  { id: 'tesla-modely', brand: 'Tesla', model: 'Model Y', year: 2025, fuel: 'חשמלי', body: 'קרוסאובר', trim: 'RWD', category: 'חשמלי', msrp: 204900, img: '/images/cars/tesla_modely_white.png', tags: ['משפחתי','טעינה מהירה'] },
  { id: 'geely-geometryc-ev', brand: 'Geely', model: 'Geometry C', year: 2025, fuel: 'חשמלי', body: 'קרוסאובר', trim: 'Long Range', category: 'חשמלי', msrp: 154900, img: '/images/cars/geely_geometryc_white.png', tags: ['משפחתי'] },
  { id: 'chery-omoda5-ev', brand: 'Chery', model: 'Omoda 5 EV', year: 2025, fuel: 'חשמלי', body: 'קרוסאובר', trim: 'Premium', category: 'חשמלי', msrp: 159900, img: '/images/cars/chery_omoda5_ev_white.png', tags: ['מעוצב'] },
  { id: 'mg4-ev', brand: 'MG', model: 'MG4', year: 2025, fuel: 'חשמלי', body: 'האצ׳בק', trim: 'Comfort', category: 'חשמלי', msrp: 139900, img: '/images/cars/mg4_white.png', tags: ['עירוני','זריז'] },
  { id: 'volvo-xc40-recharge', brand: 'Volvo', model: 'XC40 Recharge', year: 2025, fuel: 'חשמלי', body: 'קרוסאובר', trim: 'Core', category: 'יוקרה', msrp: 299000, img: '/images/cars/volvo_xc40_recharge_white.png', tags: ['בטיחות','יוקרה'] },

  // ---------- היברידי / היבריד פלאג-אין ----------
  { id: 'toyota-corolla-h', brand: 'Toyota', model: 'Corolla Hybrid', year: 2025, fuel: 'היברידי', body: 'סדאן', trim: 'Active', category: 'היברידי', msrp: 149900, img: '/images/cars/toyota_corolla_h_white.png', tags: ['חסכוני','אמין'] },
  { id: 'toyota-rav4-h', brand: 'Toyota', model: 'RAV4 Hybrid', year: 2025, fuel: 'היברידי', body: 'קרוסאובר', trim: 'Style', category: 'היברידי', msrp: 219900, img: '/images/cars/toyota_rav4_h_white.png', tags: ['פופולרי','מרווח'] },
  { id: 'kia-niro-h', brand: 'Kia', model: 'Niro Hybrid', year: 2025, fuel: 'היברידי', body: 'קרוסאובר', trim: 'Luxe', category: 'היברידי', msrp: 169900, img: '/images/cars/kia_niro_h_white.png', tags: ['חסכוני'] },
  { id: 'hyundai-tucson-hev', brand: 'Hyundai', model: 'Tucson Hybrid', year: 2025, fuel: 'היברידי', body: 'קרוסאובר', trim: 'Premium', category: 'היברידי', msrp: 199900, img: '/images/cars/hyundai_tucson_h_white.png', tags: ['טכנולוגי'] },
  { id: 'mitsubishi-outlander-phev', brand: 'Mitsubishi', model: 'Outlander PHEV', year: 2025, fuel: 'PHEV', body: 'קרוסאובר 7', trim: 'Instyle', category: 'היברידי', msrp: 229900, img: '/images/cars/mitsu_outlander_phev_white.png', tags: ['7מושבים','שקע טעינה'] },
  { id: 'volvo-xc60-recharge', brand: 'Volvo', model: 'XC60 Recharge', year: 2025, fuel: 'PHEV', body: 'קרוסאובר', trim: 'Plus', category: 'יוקרה', msrp: 389000, img: '/images/cars/volvo_xc60_recharge_white.png', tags: ['יוקרה','חזק'] },
  { id: 'lexus-nx-h', brand: 'Lexus', model: 'NX Hybrid', year: 2025, fuel: 'היברידי', body: 'קרוסאובר', trim: 'Business', category: 'יוקרה', msrp: 319000, img: '/images/cars/lexus_nx_h_white.png', tags: ['יוקרתי','חסכוני'] },

  // ---------- בנזין/דיזל ----------
  { id: 'hyundai-i10', brand: 'Hyundai', model: 'i10', year: 2025, fuel: 'בנזין', body: 'מיני', trim: 'Prime', category: 'בנזין/דיזל', msrp: 79900, img: '/images/cars/hyundai_i10_white.png', tags: ['עירוני','חסכוני'] },
  { id: 'hyundai-elantra', brand: 'Hyundai', model: 'Elantra', year: 2025, fuel: 'בנזין', body: 'סדאן', trim: 'Inspiration', category: 'בנזין/דיזל', msrp: 139900, img: '/images/cars/hyundai_elantra_white.png', tags: ['משפחתית'] },
  { id: 'kia-picanto', brand: 'Kia', model: 'Picanto', year: 2025, fuel: 'בנזין', body: 'מיני', trim: 'Urban', category: 'בנזין/דיזל', msrp: 85900, img: '/images/cars/kia_picanto_white.png', tags: ['עירוני'] },
  { id: 'kia-sportage', brand: 'Kia', model: 'Sportage', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'EX', category: 'בנזין/דיזל', msrp: 179900, img: '/images/cars/kia_sportage_white.png', tags: ['משפחתי','מרווח'] },
  { id: 'mazda-3', brand: 'Mazda', model: 'Mazda3', year: 2025, fuel: 'בנזין', body: 'האצ׳בק', trim: 'Comfort', category: 'בנזין/דיזל', msrp: 154900, img: '/images/cars/mazda3_white.png', tags: ['איכות','נהיגה'] },
  { id: 'mazda-cx30', brand: 'Mazda', model: 'CX-30', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'Active', category: 'בנזין/דיזל', msrp: 169900, img: '/images/cars/mazda_cx30_white.png', tags: ['פרימיום-לייט'] },
  { id: 'skoda-octavia', brand: 'Skoda', model: 'Octavia', year: 2025, fuel: 'בנזין', body: 'סטיישן', trim: 'Ambition', category: 'בנזין/דיזל', msrp: 169900, img: '/images/cars/skoda_octavia_white.png', tags: ['מרווח','משפחתי'] },
  { id: 'skoda-kodiaq', brand: 'Skoda', model: 'Kodiaq', year: 2025, fuel: 'בנזין', body: 'SUV 7', trim: 'Style', category: 'בנזין/דיזל', msrp: 229900, img: '/images/cars/skoda_kodiaq_white.png', tags: ['7מושבים'] },
  { id: 'vw-golf', brand: 'Volkswagen', model: 'Golf', year: 2025, fuel: 'בנזין', body: 'האצ׳בק', trim: 'Life', category: 'בנזין/דיזל', msrp: 169900, img: '/images/cars/vw_golf_white.png', tags: ['אייקון'] },
  { id: 'cupra-formentor', brand: 'Cupra', model: 'Formentor', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'V1', category: 'בנזין/דיזל', msrp: 209900, img: '/images/cars/cupra_formentor_white.png', tags: ['ספורטיבי'] },
  { id: 'renault-clio', brand: 'Renault', model: 'Clio', year: 2025, fuel: 'בנזין', body: 'האצ׳בק', trim: 'Iconic', category: 'בנזין/דיזל', msrp: 99900, img: '/images/cars/renault_clio_white.png', tags: ['עירונית'] },
  { id: 'renault-arkana', brand: 'Renault', model: 'Arkana', year: 2025, fuel: 'בנזין', body: 'קופה-SUV', trim: 'Techno', category: 'בנזין/דיזל', msrp: 154900, img: '/images/cars/renault_arkana_white.png', tags: ['מעוצב'] },
  { id: 'nissan-qashqai', brand: 'Nissan', model: 'Qashqai', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'Acenta', category: 'בנזין/דיזל', msrp: 169900, img: '/images/cars/nissan_qashqai_white.png', tags: ['משפחתי'] },
  { id: 'nissan-xtrail', brand: 'Nissan', model: 'X-Trail', year: 2025, fuel: 'בנזין', body: 'SUV 7', trim: 'N-Connecta', category: 'בנזין/דיזל', msrp: 219900, img: '/images/cars/nissan_xtrail_white.png', tags: ['7מושבים'] },
  { id: 'peugeot-208', brand: 'Peugeot', model: '208', year: 2025, fuel: 'בנזין', body: 'האצ׳בק', trim: 'Allure', category: 'בנזין/דיזל', msrp: 109900, img: '/images/cars/peugeot_208_white.png', tags: ['עירונית','מעוצבת'] },
  { id: 'peugeot-2008', brand: 'Peugeot', model: '2008', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'Active', category: 'בנזין/דיזל', msrp: 139900, img: '/images/cars/peugeot_2008_white.png', tags: ['עירוני-גבוה'] },
  { id: 'peugeot-3008', brand: 'Peugeot', model: '3008', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'Premium', category: 'בנזין/דיזל', msrp: 199900, img: '/images/cars/peugeot_3008_white.png', tags: ['פרימיום-לייט'] },
  { id: 'citroen-c3', brand: 'Citroën', model: 'C3', year: 2025, fuel: 'בנזין', body: 'האצ׳בק', trim: 'Feel', category: 'בנזין/דיזל', msrp: 94900, img: '/images/cars/citroen_c3_white.png', tags: ['נוחות'] },
  { id: 'opel-mokka', brand: 'Opel', model: 'Mokka', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'Edition', category: 'בנזין/דיזל', msrp: 139900, img: '/images/cars/opel_mokka_white.png', tags: ['מעוצב'] },
  { id: 'honda-civic', brand: 'Honda', model: 'Civic', year: 2025, fuel: 'בנזין', body: 'סדאן', trim: 'Elegance', category: 'בנזין/דיזל', msrp: 189900, img: '/images/cars/honda_civic_white.png', tags: ['נהיגה'] },
  { id: 'subaru-xv', brand: 'Subaru', model: 'XV', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'Style', category: 'בנזין/דיזל', msrp: 154900, img: '/images/cars/subaru_xv_white.png', tags: ['AWD'] },
  { id: 'suzuki-swift', brand: 'Suzuki', model: 'Swift', year: 2025, fuel: 'בנזין', body: 'האצ׳בק', trim: 'GLX', category: 'בנזין/דיזל', msrp: 99900, img: '/images/cars/suzuki_swift_white.png', tags: ['אמין','חסכוני'] },
  { id: 'suzuki-vitara', brand: 'Suzuki', model: 'Vitara', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'GLX', category: 'בנזין/דיזל', msrp: 129900, img: '/images/cars/suzuki_vitara_white.png', tags: ['קומפקטי'] },
  { id: 'mitsubishi-asx', brand: 'Mitsubishi', model: 'ASX', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'Instyle', category: 'בנזין/דיזל', msrp: 129900, img: '/images/cars/mitsu_asx_white.png', tags: ['ערך-מוסיף'] },

  // ---------- יוקרה (בנזין/היברידי/חשמלי) ----------
  { id: 'mercedes-glc', brand: 'Mercedes', model: 'GLC 300', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'AMG Line', category: 'יוקרה', msrp: 489000, img: '/images/cars/mercedes_glc_white.png', tags: ['יוקרה','טכנולוגיה'] },
  { id: 'audi-q5', brand: 'Audi', model: 'Q5 45 TFSI', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'S-Line', category: 'יוקרה', msrp: 435000, img: '/images/cars/audi_q5_white.png', tags: ['פרימיום','נוחות'] },
  { id: 'bmw-3', brand: 'BMW', model: '330i', year: 2025, fuel: 'בנזין', body: 'סדאן', trim: 'M Sport', category: 'יוקרה', msrp: 399000, img: '/images/cars/bmw_3_white.png', tags: ['נהיגה','יוקרה'] },
  { id: 'bmw-x3', brand: 'BMW', model: 'X3 30i', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'xLine', category: 'יוקרה', msrp: 459000, img: '/images/cars/bmw_x3_white.png', tags: ['משפחתי-יוקרתי'] },
  { id: 'lexus-ux', brand: 'Lexus', model: 'UX 250h', year: 2025, fuel: 'היברידי', body: 'קרוסאובר', trim: 'Luxury', category: 'יוקרה', msrp: 259000, img: '/images/cars/lexus_ux_white.png', tags: ['חסכוני','שקט'] },
  { id: 'porsche-macan-ev', brand: 'Porsche', model: 'Macan Electric', year: 2025, fuel: 'חשמלי', body: 'קרוסאובר', trim: 'Base', category: 'יוקרה', msrp: 699000, img: '/images/cars/porsche_macan_ev_white.png', tags: ['ביצועים'] },
  { id: 'landrover-defender', brand: 'Land Rover', model: 'Defender 110', year: 2025, fuel: 'בנזין', body: 'SUV שטח', trim: 'SE', category: 'יוקרה', msrp: 599000, img: '/images/cars/landrover_defender_white.png', tags: ['שטח','אייקון'] },

  // ---------- מסחרי ----------
  { id: 'toyota-proace-city', brand: 'Toyota', model: 'ProAce City', year: 2025, fuel: 'דיזל', body: 'מסחרי קומפקטי', trim: 'L1', category: 'מסחרי', msrp: 139900, img: '/images/cars/toyota_proace_city_white.png', tags: ['עסקים'] },
  { id: 'ford-transit-custom', brand: 'Ford', model: 'Transit Custom', year: 2025, fuel: 'דיזל', body: 'מסחרי בינוני', trim: 'Trend', category: 'מסחרי', msrp: 219900, img: '/images/cars/ford_transit_custom_white.png', tags: ['נפח העמסה'] },
  { id: 'fiat-ducato', brand: 'Fiat', model: 'Ducato', year: 2025, fuel: 'דיזל', body: 'מסחרי גדול', trim: 'L2H2', category: 'מסחרי', msrp: 249900, img: '/images/cars/fiat_ducato_white.png', tags: ['צי'] },
  { id: 'maxus-edeliver3', brand: 'Maxus', model: 'eDeliver 3', year: 2025, fuel: 'חשמלי', body: 'מסחרי קומפקטי', trim: 'Long', category: 'מסחרי', msrp: 179900, img: '/images/cars/maxus_edeliver3_white.png', tags: ['חשמלי','עירוני'] },

  // ---------- דגמי ערך/שוק ישראלי ----------
  { id: 'dacia-sandero', brand: 'Dacia', model: 'Sandero', year: 2025, fuel: 'בנזין', body: 'האצ׳בק', trim: 'Essential', category: 'בנזין/דיזל', msrp: 84900, img: '/images/cars/dacia_sandero_white.png', tags: ['זול'] },
  { id: 'dacia-duster', brand: 'Dacia', model: 'Duster', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'Comfort', category: 'בנזין/דיזל', msrp: 119900, img: '/images/cars/dacia_duster_white.png', tags: ['שטח-קל'] },
  { id: 'jeep-compass', brand: 'Jeep', model: 'Compass', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'Limited', category: 'בנזין/דיזל', msrp: 199900, img: '/images/cars/jeep_compass_white.png', tags: ['מותג-שטח'] },
  { id: 'mini-cooper', brand: 'MINI', model: 'Cooper', year: 2025, fuel: 'בנזין', body: 'האצ׳בק', trim: 'Classic', category: 'יוקרה', msrp: 229000, img: '/images/cars/mini_cooper_white.png', tags: ['אייקון','עיצוב'] },

  // ---------- מותגי סין נוספים ----------
  { id: 'chery-tiggo7pro', brand: 'Chery', model: 'Tiggo 7 Pro', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'Premium', category: 'בנזין/דיזל', msrp: 139900, img: '/images/cars/chery_tiggo7pro_white.png', tags: ['ערך'] },
  { id: 'jaecoo-j7', brand: 'Jaecoo', model: 'J7', year: 2025, fuel: 'בנזין', body: 'קרוסאובר', trim: 'Elite', category: 'בנזין/דיזל', msrp: 169900, img: '/images/cars/jaecoo_j7_white.png', tags: ['מעוצב'] },
  { id: 'voyah-free', brand: 'Voyah', model: 'Free', year: 2025, fuel: 'חשמלי', body: 'קרוסאובר', trim: 'AWD', category: 'יוקרה', msrp: 359900, img: '/images/cars/voyah_free_white.png', tags: ['יוקרה סינית'] },
  { id: 'seres-5', brand: 'Seres', model: '5', year: 2025, fuel: 'חשמלי', body: 'קרוסאובר', trim: 'Premium', category: 'חשמלי', msrp: 219900, img: '/images/cars/seres_5_white.png', tags: ['חזק'] },
];

// מחזיר אוסף מדגמי "כרטיסים" מוכן לתצוגה, כולל חישוב "החל מ׳".
export function getFleetCards(options = {}) {
  return FLEET.map(car => ({
    ...car,
    monthlyFrom: calcMonthlyBalloon(car.msrp, options)
  }));
}

// חיתוכים נוחים
export const byCategory = (cat) => FLEET.filter(x => x.category === cat);
export const byBrand = (brand) => FLEET.filter(x => x.brand.toLowerCase() === String(brand).toLowerCase());
export const searchFleet = (q='') => {
  const s = q.trim().toLowerCase();
  if (!s) return FLEET;
  return FLEET.filter(x =>
    [x.brand, x.model, x.fuel, x.body, ...(x.tags||[])].join(' ').toLowerCase().includes(s)
  );
};
