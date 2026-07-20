/* ════════════════════════════════════════════════
   FUGA · Aplicación
   ════════════════════════════════════════════════ */
(() => {
  "use strict";

  const $  = id => document.getElementById(id);
  const ui = window.FugaUI;
  const store = window.FugaStorage;

  let state = store.load();
  let selectedId = null;
  let toastTimer = null;
  let currentView = "home";
  let listFilter = "todas";

  /* Mes que se está mirando en el inicio */
  const now = new Date();
  let viewYear  = now.getFullYear();
  let viewMonth = now.getMonth();

  const PALETTE = ["#E50914","#1DB954","#10A37F","#4285F4","#8B5CF6",
                   "#FF9F2E","#22D3EE","#64748B"];

  /* ─────────── Íconos ─────────── */
  const ICON = {
    chevron:  '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    left:     '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    repeat:   '<svg viewBox="0 0 24 24"><path d="M4 9a5 5 0 0 1 5-5h9M18 4l-3-3M18 4l-3 3"/><path d="M20 15a5 5 0 0 1-5 5H6M6 20l3 3M6 20l3-3"/></svg>',
    dollar:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M14.6 9.3c-.5-.8-1.5-1.3-2.6-1.3-1.5 0-2.6.8-2.6 1.9 0 2.6 5.4 1.3 5.4 4 0 1.2-1.2 2.1-2.8 2.1-1.2 0-2.3-.5-2.8-1.4M12 6.4v11.2"/></svg>',
    trend:    '<svg viewBox="0 0 24 24"><path d="M3 16.5l5.5-5.5 3.5 3.5L21 5.5"/><path d="M15.5 5.5H21v5.5"/></svg>',
    note:     '<svg viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M8 9h8M8 13h8M8 17h4"/></svg>',
    pause:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M10 9.2v5.6M14 9.2v5.6"/></svg>',
    play:     '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M10.3 8.8l5 3.2-5 3.2z"/></svg>',
    trash:    '<svg viewBox="0 0 24 24"><path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7"/><path d="M6.5 6.5l.9 12.2a1.7 1.7 0 0 0 1.7 1.6h5.8a1.7 1.7 0 0 0 1.7-1.6l.9-12.2"/><path d="M10.5 10.5v6M13.5 10.5v6"/></svg>',
    edit:     '<svg viewBox="0 0 24 24"><path d="M4 20h4.2l9.6-9.6a2.1 2.1 0 0 0 0-3l-1.2-1.2a2.1 2.1 0 0 0-3 0L4 15.8z"/><path d="M14.5 6.5l3 3"/></svg>',
    search:   '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>',
    down:     '<svg viewBox="0 0 24 24"><path d="M12 5v13M6.5 12.5L12 18l5.5-5.5"/></svg>',
    close:    '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* ─────────── Cálculo ─────────── */
  const money   = ui.money;
  const toCLP   = l => l.currency === "USD" ? l.amount * state.rate : l.amount;
  const perMonth= l => toCLP(l) * ui.FACTOR[l.frequency];
  const active  = () => state.leaks.filter(l => !l.paused);
  const persist = () => store.save(state);

  /* Plata que sale realmente en un mes dado */
  function monthCash(year, month, leaks = active()) {
    return leaks.reduce((sum, l) =>
      ui.chargeInMonth(l, year, month) ? sum + toCLP(l) : sum, 0);
  }

  /* Costo real de una suscripción en los próximos 12 meses */
  function annualCost(leak) {
    let total = 0;
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      if (ui.chargeInMonth(leak, d.getFullYear(), d.getMonth())) total += toCLP(leak);
    }
    return total;
  }

  const categoryLabel = id =>
    (store.CATEGORIES.find(c => c.id === id) || { label: "Otros" }).label;

  /* ─────────── Piezas de interfaz ─────────── */
  function logoHTML(leak, large = false) {
    const initial = ui.escape(leak.name.slice(0, 1).toUpperCase());
    const bg = `linear-gradient(145deg, ${leak.color}, #0b0b0c 140%)`;
    return `<div class="service-logo${large ? " large" : ""}" style="background:${bg}">${initial}</div>`;
  }

  function itemHTML(leak) {
    let sub, cls = "";
    if (leak.paused) {
      sub = "Pausada";
    } else {
      const d = ui.daysUntil(leak);
      sub = ui.dueLabel(leak);
      if (d <= 1) cls = "due-now";
      else if (d <= 5) cls = "due-soon";
    }
    return `<article class="subscription${leak.paused ? " is-paused" : ""}" data-id="${leak.id}">
      ${logoHTML(leak)}
      <div class="subscription-info">
        <b>${ui.escape(leak.name)}</b>
        <small class="${cls}">${sub}</small>
      </div>
      <div class="subscription-amount">${money(toCLP(leak))}${ICON.chevron}</div>
    </article>`;
  }

  function emptyHTML(title, text) {
    return `<div class="empty-state"><b>${title}</b><small>${text}</small></div>`;
  }

  /* ─────────── Vista: Inicio ─────────── */
  function renderHome() {
    const act = active();
    const cash = monthCash(viewYear, viewMonth);
    const normalized = act.reduce((s, l) => s + perMonth(l), 0);

    const isNow  = viewYear === now.getFullYear() && viewMonth === now.getMonth();
    const isPast = new Date(viewYear, viewMonth) < new Date(now.getFullYear(), now.getMonth());

    $("overviewLabel").textContent = isPast ? "ESE MES SE FUERON" : isNow ? "ESTE MES SE IRÁN" : "ESE MES SE IRÁN";
    $("monthlyTotal").textContent = money(cash);
    $("overviewNote").textContent = act.length
      ? `Promedio normalizado ${money(normalized)} al mes`
      : "";
    $("activeCount").textContent = act.length;
    $("annualTotal").textContent = act.length ? `${money(normalized * 12)} al año` : "";
    $("allCount").textContent = `${state.leaks.length} en total`;

    const label = $("monthLabel");
    label.textContent = ui.monthLabel(viewYear, viewMonth);
    label.classList.toggle("off", !isNow);

    /* Próximos cobros: siempre desde hoy, no dependen del mes elegido */
    const upcoming = [...act].sort((a, b) => ui.nextDate(a) - ui.nextDate(b)).slice(0, 6);
    $("upcomingList").innerHTML = upcoming.length
      ? upcoming.map(itemHTML).join("")
      : emptyHTML("Aún no tienes suscripciones", "Toca el botón + y agrega la primera para ver tus próximos cobros.");
  }

  /* ─────────── Vista: Todas ─────────── */
  function renderAll() {
    const query = ($("searchInput").value || "").trim().toLowerCase();
    let list = [...state.leaks];

    if (listFilter === "activas")  list = list.filter(l => !l.paused);
    if (listFilter === "pausadas") list = list.filter(l => l.paused);
    if (query) list = list.filter(l =>
      l.name.toLowerCase().includes(query) ||
      categoryLabel(l.category).toLowerCase().includes(query));

    list.sort((a, b) => perMonth(b) - perMonth(a));

    const paused = state.leaks.filter(l => l.paused).length;
    $("allSubtitle").textContent =
      `${state.leaks.length} registradas · ${state.leaks.length - paused} activas · ${paused} pausadas`;

    $("allList").innerHTML = list.length
      ? list.map(itemHTML).join("")
      : emptyHTML(query ? "Sin resultados" : "Nada por aquí",
                  query ? "Prueba con otro nombre o categoría." : "Agrega tu primera suscripción con el botón +.");
  }

  /* ─────────── Vista: Estadísticas ─────────── */
  function renderInsights() {
    const act = active();
    const normalized = act.reduce((s, l) => s + perMonth(l), 0);
    const paused = state.leaks.filter(l => l.paused);
    const savedByPausing = paused.reduce((s, l) => s + perMonth(l), 0);

    $("statAverage").textContent = money(normalized);
    $("statYear").textContent    = money(normalized * 12);
    $("statActive").textContent  = act.length;
    $("statSaved").textContent   = money(savedByPausing);

    /* Proyección de 12 meses con cobros reales */
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({
        y: d.getFullYear(),
        m: d.getMonth(),
        total: monthCash(d.getFullYear(), d.getMonth(), act)
      });
    }
    const max = Math.max(...months.map(m => m.total), 1);
    $("yearChart").innerHTML = months.map((m, i) => {
      const h = Math.max(4, (m.total / max) * 110);
      return `<div class="col" title="${ui.MESES[m.m]}: ${money(m.total)}">
        <div class="bar${i === 0 ? " on" : ""}" style="height:${h}px;animation-delay:${i * 35}ms"></div>
        <span class="lbl">${ui.MESES_CORTO[m.m][0]}</span>
      </div>`;
    }).join("");
    $("yearHint").textContent = act.length
      ? `El mes más caro será ${ui.MESES[months.reduce((a, b) => b.total > a.total ? b : a).m]}.`
      : "Sin datos todavía.";

    /* Reparto por categoría */
    const sums = {};
    act.forEach(l => { sums[l.category] = (sums[l.category] || 0) + perMonth(l); });
    const rows = Object.entries(sums).sort((a, b) => b[1] - a[1]);
    $("catList").innerHTML = rows.length ? rows.map(([id, value], i) => {
      const pct = normalized ? (value / normalized * 100) : 0;
      const color = (act.find(l => l.category === id) || {}).color || "#64748B";
      return `<div class="cat-row">
        <div class="cat-top"><span>${ui.escape(categoryLabel(id))}</span><b>${money(value)}<em>${pct.toFixed(0)}%</em></b></div>
        <div class="cat-track"><div class="cat-fill" style="width:${pct}%;background:${color};animation-delay:${i * 60}ms"></div></div>
      </div>`;
    }).join("") : `<p class="hint" style="margin:0">Agrega suscripciones para ver el reparto.</p>`;
  }

  /* ─────────── Vista: Ajustes ─────────── */
  function renderSettings() {
    $("rateInput").value = state.rate;
    const usd = state.leaks.filter(l => l.currency === "USD").length;
    $("rateNote").textContent = usd
      ? `${usd} suscripción${usd > 1 ? "es" : ""} en dólares usa${usd > 1 ? "n" : ""} este valor.`
      : "Ninguna suscripción en dólares por ahora.";
    $("dataNote").textContent = `${state.leaks.length} registros guardados en este dispositivo.`;
  }

  /* ─────────── Render maestro ─────────── */
  function render() {
    renderHome();
    if (currentView === "all")      renderAll();
    if (currentView === "insights") renderInsights();
    if (currentView === "settings") renderSettings();
  }

  /* ─────────── Navegación ─────────── */
  function go(view) {
    currentView = view;
    ["home","all","insights","settings"].forEach(v => {
      $("view-" + v).hidden = v !== view;
    });
    document.querySelectorAll(".bottom-nav [data-action]").forEach(b =>
      b.classList.toggle("selected", b.dataset.action === view));
    window.scrollTo({ top: 0, behavior: "instant" });
    render();
  }

  /* ─────────── Detalle ─────────── */
  function openDetail(id) {
    const leak = state.leaks.find(l => l.id === id);
    if (!leak) return;
    selectedId = id;

    const logo = $("detailLogo");
    logo.textContent = leak.name.slice(0, 1).toUpperCase();
    logo.style.background = `linear-gradient(145deg, ${leak.color}, #0b0b0c 140%)`;

    $("detailName").textContent = leak.name;
    $("detailCategory").textContent = categoryLabel(leak.category);
    $("detailPaused").hidden = !leak.paused;

    $("detailNext").textContent = leak.paused ? "En pausa" : ui.dueLabel(leak);
    $("detailDate").textContent = leak.paused ? "Sin cobros programados" : ui.longDate(ui.nextDate(leak));
    $("detailFrequency").textContent = ui.FREQ_NAME[leak.frequency];
    $("detailAmount").textContent = money(toCLP(leak));
    $("detailCurrency").textContent = leak.currency === "USD"
      ? `USD ${leak.amount} · dólar a ${money(state.rate)}`
      : "CLP";

    $("detailAnnual").textContent = money(leak.paused ? 0 : annualCost(leak));
    $("detailNotes").textContent = leak.notes || "Sin notas.";

    $("pauseLabel").textContent = leak.paused ? "Reactivar" : "Pausar";
    $("pauseIcon").innerHTML = leak.paused ? ICON.play : ICON.pause;

    renderMiniBars(leak);

    $("backdrop").hidden = false;
    $("detailScreen").hidden = false;
    document.body.style.overflow = "hidden";
  }

  /* Seis meses reales: los cinco anteriores y el actual */
  function renderMiniBars(leak) {
    const cells = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const charged = !leak.paused && ui.chargeInMonth(leak, d.getFullYear(), d.getMonth());
      cells.push({ m: d.getMonth(), value: charged ? toCLP(leak) : 0, current: i === 0 });
    }
    const max = Math.max(...cells.map(c => c.value), 1);
    $("miniBars").innerHTML = cells.map((c, i) => {
      const h = c.value ? Math.max(14, (c.value / max) * 81) : 6;
      return `<div class="mb">
        <i class="${c.current && c.value ? "on" : ""}" style="height:${h}px;animation-delay:${i * 50}ms"></i>
        <small>${ui.MESES_CORTO[c.m][0]}</small>
      </div>`;
    }).join("");
  }

  function closeDetail() {
    $("detailScreen").hidden = true;
    $("backdrop").hidden = true;
    document.body.style.overflow = "";
    selectedId = null;
  }

  /* ─────────── Formulario ─────────── */
  function paintSwatches(selected) {
    $("colorSwatches").innerHTML = PALETTE.map(c =>
      `<button type="button" data-color="${c}" class="${c === selected ? "on" : ""}" style="background:${c}" aria-label="Color ${c}"></button>`
    ).join("");
    $("colorInput").value = selected;
  }

  function openForm(leak = null, focus = "nameInput") {
    const form = $("leakForm");
    form.reset();

    if (leak) {
      $("sheetKicker").textContent = "EDITAR REGISTRO";
      $("sheetTitle").textContent  = leak.name;
      $("leakId").value            = leak.id;
      $("nameInput").value         = leak.name;
      $("amountInput").value       = leak.amount;
      $("currencyInput").value     = leak.currency;
      $("frequencyInput").value    = leak.frequency;
      $("nextChargeInput").value   = leak.nextCharge;
      $("categoryInput").value     = leak.category;
      $("notesInput").value        = leak.notes;
      paintSwatches(leak.color);
    } else {
      $("sheetKicker").textContent = "NUEVO REGISTRO";
      $("sheetTitle").textContent  = "Agregar suscripción";
      $("leakId").value            = "";
      $("nextChargeInput").value   = ui.today();
      $("categoryInput").value     = "streaming";
      paintSwatches(PALETTE[0]);
    }

    $("backdrop").hidden = false;
    $("leakSheet").hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => $(focus).focus(), 80);
  }

  function closeForm() {
    $("leakSheet").hidden = true;
    if ($("detailScreen").hidden) {
      $("backdrop").hidden = true;
      document.body.style.overflow = "";
    }
  }

  function newId() {
    return crypto.randomUUID ? crypto.randomUUID() : "l" + Date.now() + Math.random().toString(36).slice(2);
  }

  function submit(event) {
    event.preventDefault();

    const id = $("leakId").value;
    const data = {
      name:       $("nameInput").value.trim(),
      amount:     Number($("amountInput").value),
      currency:   $("currencyInput").value,
      frequency:  $("frequencyInput").value,
      nextCharge: $("nextChargeInput").value,
      category:   $("categoryInput").value,
      notes:      $("notesInput").value.trim(),
      color:      $("colorInput").value
    };

    if (!data.name)        { flash("Falta el nombre"); return; }
    if (!(data.amount > 0)){ flash("El monto debe ser mayor que cero"); return; }
    if (!data.nextCharge)  { flash("Falta la fecha del próximo cobro"); return; }

    if (id) {
      const leak = state.leaks.find(l => l.id === id);
      if (!leak) return;
      Object.assign(leak, data);
      persist(); closeForm(); render();
      if (!$("detailScreen").hidden) openDetail(id);
      flash("Cambios guardados");
    } else {
      state.leaks.push({ id: newId(), paused: false, ...data });
      persist(); closeForm(); render();
      flash("Suscripción agregada");
    }
  }

  /* ─────────── Respaldos ─────────── */
  function download(filename, content, type) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type }));
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function exportJSON() {
    download("fuga-respaldo.json", JSON.stringify(state, null, 2), "application/json");
    flash("Respaldo descargado");
  }

  function exportCSV() {
    const head = ["Nombre","Categoria","Monto","Moneda","Monto CLP","Frecuencia",
                  "Promedio mensual CLP","Costo 12 meses CLP","Proximo cobro","Estado","Notas"];
    const rows = state.leaks.map(l => [
      l.name, categoryLabel(l.category), l.amount, l.currency, Math.round(toCLP(l)),
      ui.FREQ_NAME[l.frequency], Math.round(perMonth(l)), Math.round(annualCost(l)),
      ui.nextDate(l).toISOString().slice(0, 10),
      l.paused ? "Pausada" : "Activa",
      (l.notes || "").replace(/[\r\n]+/g, " ")
    ]);
    const csv = [head, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    download("fuga.csv", "\uFEFF" + csv, "text/csv;charset=utf-8");
    flash("Planilla descargada");
  }

  function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state = store.replace(JSON.parse(reader.result));
        persist(); render();
        flash(`Respaldo restaurado: ${state.leaks.length} registros`);
      } catch {
        flash("Ese archivo no es un respaldo válido");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  /* ─────────── Aviso ─────────── */
  function flash(text) {
    const el = $("toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  /* ─────────── Eventos ─────────── */
  function bind() {
    /* Categorías del formulario */
    $("categoryInput").innerHTML = store.CATEGORIES
      .map(c => `<option value="${c.id}">${c.label}</option>`).join("");

    /* Íconos que se inyectan una vez */
    $("iconCalendar").innerHTML = ICON.calendar;
    $("iconRepeat").innerHTML   = ICON.repeat;
    $("iconDollar").innerHTML   = ICON.dollar;
    $("iconTrend").innerHTML    = ICON.trend;
    $("iconNote").innerHTML     = ICON.note;
    $("iconNoteArrow").innerHTML= ICON.chevron;
    $("iconSearch").innerHTML   = ICON.search;
    $("iconDown").innerHTML     = ICON.down;
    $("iconAllArrow").innerHTML = ICON.chevron;
    $("closeDetail").innerHTML  = ICON.left;
    $("editDetail").innerHTML   = ICON.edit;
    $("closeSheet").innerHTML   = ICON.close;
    $("trashIcon").innerHTML    = ICON.trash;
    $("prevMonth").innerHTML    = ICON.left;
    $("nextMonth").innerHTML    = ICON.chevron;

    /* Navegación */
    document.querySelectorAll(".bottom-nav [data-action]").forEach(b =>
      b.addEventListener("click", () => go(b.dataset.action)));
    $("settingsButton").addEventListener("click", () => go("settings"));
    $("allButton").addEventListener("click", () => go("all"));
    $("addButton").addEventListener("click", () => openForm());

    /* Mes */
    $("prevMonth").addEventListener("click", () => shiftMonth(-1));
    $("nextMonth").addEventListener("click", () => shiftMonth(1));
    $("monthLabel").addEventListener("click", () => {
      viewYear = now.getFullYear(); viewMonth = now.getMonth(); renderHome();
    });

    /* Lista */
    $("searchInput").addEventListener("input", renderAll);
    document.querySelectorAll(".filters button").forEach(b =>
      b.addEventListener("click", () => {
        listFilter = b.dataset.filter;
        document.querySelectorAll(".filters button").forEach(x => x.classList.toggle("on", x === b));
        renderAll();
      }));

    /* Detalle */
    $("closeDetail").addEventListener("click", closeDetail);
    $("editDetail").addEventListener("click", () => {
      const leak = state.leaks.find(l => l.id === selectedId);
      if (leak) openForm(leak);
    });
    $("notesCard").addEventListener("click", () => {
      const leak = state.leaks.find(l => l.id === selectedId);
      if (leak) openForm(leak, "notesInput");
    });
    $("pauseButton").addEventListener("click", () => {
      const leak = state.leaks.find(l => l.id === selectedId);
      if (!leak) return;
      leak.paused = !leak.paused;
      persist(); render(); openDetail(leak.id);
      flash(leak.paused ? "Pausada. Sigue visible en Todas." : "Suscripción reactivada");
    });
    $("deleteButton").addEventListener("click", () => {
      const leak = state.leaks.find(l => l.id === selectedId);
      if (!leak) return;
      if (!confirm(`¿Eliminar ${leak.name}? No se puede deshacer.`)) return;
      state.leaks = state.leaks.filter(l => l.id !== selectedId);
      persist(); closeDetail(); render(); flash("Suscripción eliminada");
    });

    /* Formulario */
    $("leakForm").addEventListener("submit", submit);
    $("closeSheet").addEventListener("click", closeForm);
    $("colorSwatches").addEventListener("click", e => {
      const b = e.target.closest("button[data-color]");
      if (!b) return;
      $("colorInput").value = b.dataset.color;
      $("colorSwatches").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
    });
    $("backdrop").addEventListener("click", () => {
      if (!$("leakSheet").hidden) closeForm();
      else closeDetail();
    });

    /* Ajustes */
    $("rateInput").addEventListener("change", () => {
      const value = Number($("rateInput").value);
      if (!(value > 0)) { $("rateInput").value = state.rate; flash("Valor inválido"); return; }
      state.rate = value; persist(); render(); flash("Valor del dólar actualizado");
    });
    $("exportJson").addEventListener("click", exportJSON);
    $("exportCsv").addEventListener("click", exportCSV);
    $("importButton").addEventListener("click", () => $("importFile").click());
    $("importFile").addEventListener("change", importJSON);
    $("wipeButton").addEventListener("click", () => {
      if (!confirm("Se borrarán todas las suscripciones de este dispositivo. ¿Continuar?")) return;
      state.leaks = []; persist(); render(); flash("Todo borrado");
    });

    /* Abrir detalle desde cualquier lista */
    document.addEventListener("click", e => {
      const card = e.target.closest(".subscription[data-id]");
      if (card) openDetail(card.dataset.id);
    });

    /* Escape cierra capas */
    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      if (!$("leakSheet").hidden) closeForm();
      else if (!$("detailScreen").hidden) closeDetail();
    });
  }

  function shiftMonth(delta) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    viewYear = d.getFullYear();
    viewMonth = d.getMonth();
    renderHome();
  }

  bind();
  go("home");
})();
