/* ════════════════════════════════════════════════
   FUGA · Almacenamiento
   Misma clave "fuga-v2": los datos existentes se
   conservan y se completan con los campos nuevos.
   ════════════════════════════════════════════════ */
window.FugaStorage = (() => {
  "use strict";

  const KEY = "fuga-v2";
  const defaults = { rate: 950, leaks: [] };

  /* Categorías disponibles. El id se guarda en cada leak. */
  const CATEGORIES = [
    { id: "streaming",     label: "Streaming" },
    { id: "musica",        label: "Música" },
    { id: "software",      label: "Software e IA" },
    { id: "almacenamiento",label: "Almacenamiento" },
    { id: "juegos",        label: "Juegos" },
    { id: "telecom",       label: "Internet y celular" },
    { id: "salud",         label: "Salud y gimnasio" },
    { id: "otros",         label: "Otros" }
  ];

  /* Solo se usa una vez, al migrar registros antiguos
     que no tienen categoría guardada. */
  function guessCategory(name = "") {
    const n = name.toLowerCase();
    if (/netflix|disney|hbo|max|prime|youtube|paramount|apple tv|star/.test(n)) return "streaming";
    if (/spotify|apple music|tidal|deezer|audible/.test(n))                     return "musica";
    if (/chatgpt|openai|claude|gemini|copilot|notion|adobe|canva|figma/.test(n))return "software";
    if (/icloud|google one|dropbox|onedrive|mega|backblaze/.test(n))            return "almacenamiento";
    if (/xbox|playstation|nintendo|steam|game pass|ea play/.test(n))            return "juegos";
    if (/entel|movistar|wom|claro|vtr|mundo|gtd|internet|plan/.test(n))         return "telecom";
    if (/gym|gimnasio|smart fit|energy|isapre|seguro/.test(n))                  return "salud";
    return "otros";
  }

  function normalize(leak) {
    return {
      id:         leak.id || (crypto.randomUUID ? crypto.randomUUID() : "l" + Date.now() + Math.random()),
      name:       String(leak.name || "Sin nombre"),
      amount:     Number(leak.amount) || 0,
      currency:   leak.currency === "USD" ? "USD" : "CLP",
      frequency:  ["monthly","quarterly","semiannual","yearly"].includes(leak.frequency) ? leak.frequency : "monthly",
      nextCharge: leak.nextCharge || new Date().toISOString().slice(0, 10),
      color:      leak.color || "#64748B",
      category:   leak.category || guessCategory(leak.name),
      notes:      typeof leak.notes === "string" ? leak.notes : "",
      paused:     Boolean(leak.paused)
    };
  }

  function load() {
    let raw;
    try {
      raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {
      raw = {};
    }
    const data = { ...defaults, ...raw };
    data.rate  = Number(data.rate) > 0 ? Number(data.rate) : defaults.rate;
    data.leaks = Array.isArray(data.leaks) ? data.leaks.map(normalize) : [];
    return data;
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("No se pudo guardar:", e);
      return false;
    }
  }

  /* Reemplaza el estado completo desde un respaldo importado. */
  function replace(payload) {
    if (!payload || !Array.isArray(payload.leaks)) throw new Error("Respaldo inválido");
    return {
      rate:  Number(payload.rate) > 0 ? Number(payload.rate) : defaults.rate,
      leaks: payload.leaks.map(normalize)
    };
  }

  return { load, save, replace, CATEGORIES, guessCategory, KEY };
})();
