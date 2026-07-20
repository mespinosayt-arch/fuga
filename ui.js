/* ════════════════════════════════════════════════
   FUGA · Utilidades compartidas
   ════════════════════════════════════════════════ */
window.FugaUI = (() => {
  "use strict";

  const MESES = ["enero","febrero","marzo","abril","mayo","junio",
                 "julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const MESES_CORTO = ["ene","feb","mar","abr","may","jun",
                       "jul","ago","sep","oct","nov","dic"];

  /* Cada cuántos meses se repite el cobro */
  const INTERVAL = { monthly: 1, quarterly: 3, semiannual: 6, yearly: 12 };
  /* Fracción mensual, para el promedio normalizado */
  const FACTOR   = { monthly: 1, quarterly: 1/3, semiannual: 1/6, yearly: 1/12 };
  const FREQ_NAME= { monthly: "Mensual", quarterly: "Trimestral",
                     semiannual: "Semestral", yearly: "Anual" };

  const money  = n => "$" + Math.round(n || 0).toLocaleString("es-CL");
  const today  = () => new Date().toISOString().slice(0, 10);
  const midnight = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };

  function escape(text) {
    return String(text).replace(/[&<>'"]/g, c =>
      ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[c]));
  }

  /* Próxima fecha de cobro a partir de hoy.
     Avanza en saltos del intervalo sin deformar el día del mes. */
  function nextDate(leak) {
    const anchor = new Date(`${leak.nextCharge}T00:00:00`);
    const step   = INTERVAL[leak.frequency];
    const day    = anchor.getDate();
    const t      = midnight();

    let y = anchor.getFullYear();
    let m = anchor.getMonth();
    let guard = 0;
    let d = buildDate(y, m, day);

    while (d < t && guard++ < 600) {
      m += step;
      y += Math.floor(m / 12);
      m = ((m % 12) + 12) % 12;
      d = buildDate(y, m, day);
    }
    return d;
  }

  /* Arma una fecha respetando el día original,
     recortado al último día si el mes es más corto. */
  function buildDate(year, month, day) {
    const last = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, last));
  }

  function daysUntil(leak) {
    return Math.round((nextDate(leak) - midnight()) / 86400000);
  }

  /* ¿Este cobro cae en el mes year/month? Devuelve la fecha o null.
     No usa bucles: compara la distancia en meses contra el intervalo. */
  function chargeInMonth(leak, year, month) {
    const anchor = new Date(`${leak.nextCharge}T00:00:00`);
    const step   = INTERVAL[leak.frequency];
    const diff   = (year * 12 + month) - (anchor.getFullYear() * 12 + anchor.getMonth());
    if (diff % step !== 0) return null;
    return buildDate(year, month, anchor.getDate());
  }

  function dueLabel(leak) {
    const d = daysUntil(leak);
    if (d === 0) return "Hoy";
    if (d === 1) return "Mañana";
    const date = nextDate(leak);
    return `${date.getDate()} ${MESES_CORTO[date.getMonth()]}`;
  }

  function longDate(date) {
    return `${date.getDate()} ${MESES_CORTO[date.getMonth()]} ${date.getFullYear()}`;
  }

  function monthLabel(year, month) {
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth()) return "Este mes";
    return `${MESES[month]} ${year !== now.getFullYear() ? year : ""}`.trim();
  }

  return {
    MESES, MESES_CORTO, INTERVAL, FACTOR, FREQ_NAME,
    money, today, midnight, escape,
    nextDate, buildDate, daysUntil, chargeInMonth,
    dueLabel, longDate, monthLabel
  };
})();
