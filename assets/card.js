/* Motor de las tarjetas: lee DATOS (datos.js) + CARD (cada modelo) y arma la página */
(function () {
  const D = window.DATOS;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const q = new URLSearchParams(location.search);
  const persona = (q.get("nombre") || "").trim().slice(0, 40);
  const fmt = persona ? persona.replace(/\b\p{L}/gu, m => m.toUpperCase()) : "";

  /* ---- descuento y premio manuales (?desc=40&premio=...) reemplazan {desc} y {premio} en los textos ---- */
  const base = window.CARD;
  const desc = (q.get("desc") || "").replace(/\D/g, "").slice(0, 2) || String(base.descDefault || 30);
  const premio = (q.get("premio") || "").trim().slice(0, 90) || base.premioDefault || "un detalle sorpresa";
  const manual = (q.get("premio") || "").trim().slice(0, 90).replace(/[.\s]+$/, "");
  const regalo = manual || base.regaloDefault || "";
  const fill = v => typeof v === "string" ? v.replace(/\{regalo\}/g, regalo).replace(/\{desc\}/g, desc).replace(/\{premio\}/g, premio).replace(/\{nombre\}/g, fmt || "Bella")
    : Array.isArray(v) ? v.map(fill)
    : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)])) : v;
  const C = fill(base);

  /* ---- fechas: la promoción dura D.duracionDias desde el día de envío (?d=AAAA-MM-DD) ---- */
  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  let inicioStr = q.get("d");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicioStr || "")) {
    const k = "jb_inicio_" + location.pathname + "_" + persona;
    try { inicioStr = localStorage.getItem(k); if (!inicioStr) { inicioStr = iso(new Date()); localStorage.setItem(k, inicioStr); } }
    catch (e) { inicioStr = iso(new Date()); }
  }
  const inicio = new Date(inicioStr + "T00:00:00");
  const fin = new Date(inicio); fin.setDate(fin.getDate() + D.duracionDias);          // 00:00 del día siguiente al último día válido
  const ultimo = new Date(fin); ultimo.setDate(ultimo.getDate() - 1);
  const f = d => d.toLocaleDateString("es-CO", { day: "numeric", month: "long" });
  const vigencia = C.sorteo ? `Sorteo el ${f(ultimo)}` : `Del ${f(inicio)} al ${f(ultimo)} (${D.duracionDias} días)`;

  const em = C.cumple ? "🎂" : C.ganadora ? "🏆" : "";
  const saludo = em
    ? `${em} ${fmt ? esc(fmt) : "Para mi clienta preferida"} ${em}`
    : (fmt ? `Hola, ${esc(fmt)} 💖` : "Para mi clienta preferida 💖");

  document.documentElement.dataset.tema = C.tema;
  if (C.regalo || C.ganadora) document.documentElement.dataset.regalo = "1";
  document.title = `${C.titulo} · ${D.nombre}`;

  const waMsg = encodeURIComponent(`Hola ${D.nombre} 💖 ${fmt ? "soy " + fmt + ", " : ""}${C.waMensaje}`);
  const items = (C.items || []).map(p => `
    <article class="card reveal"><span class="tag">${esc(p.tag)}</span>
    <div class="ico">${p.icono}</div><h3>${esc(p.titulo)}</h3><p>${esc(p.detalle)}</p></article>`).join("");
  const pasos = (C.pasos || []).map((p, i) => `
    <div class="step reveal"><b>${i + 1}</b><span>${esc(p)}</span></div>`).join("");
  const galeria = C.galeria ? `
  <section class="section gallery">
    <h2 class="reveal">Nuestro trabajo 💅</h2>
    <div class="grid">${D.fotos.map((s, i) => `<img class="reveal ${i % 5 === 0 ? "wide" : ""}" src="${s}" alt="Diseño de uñas ${i + 1}" loading="lazy">`).join("")}</div>
  </section>` : "";

  const R = C.regalo;
  const heroExtra = R
    ? `<button class="gift" id="gift" aria-label="Abrir regalo"><span class="box">${R.icono || "🎁"}</span><small>${esc(R.hint || "Toca para abrir tu regalo")}</small></button>
       <div class="prize" id="prize"><h3>${esc(R.titulo)}</h3><p>${esc(R.detalle)}</p></div>`
    : C.ganadora
    ? `<div class="prize show" id="prize"><div class="trofeo">🏆</div><h3>${esc(C.premioTitulo)}</h3><p>${esc(C.premioDetalle)}</p></div>`
    : `<button class="badge badge-btn" id="sorteoBtn"><span>${esc(C.badge)}</span><small>${esc(C.hint || "toca para ver más 👆")}</small></button>`;

  document.body.innerHTML = `
  <div class="petals" id="petals" aria-hidden="true"></div>
  <header class="hero">
    <div class="logo-wrap"><img id="logo" src="${D.logo}" alt="${esc(D.nombre)}"
      onerror="this.style.display='none';document.getElementById('logoText').style.display='block'">
      <div id="logoText" class="logo-text" style="display:none">${esc(D.nombre)}</div></div>
    <p class="hola">${saludo}</p>
    <p class="eyebrow">${esc(C.eyebrow)}</p>
    <h1>${esc(C.titulo)}</h1>
    <p class="sub">${esc(C.subtitulo)}</p>
    ${heroExtra}
    ${R ? `<a class="btn late" id="verDetalle" href="#detalle" style="display:none">Ver detalles</a>` : C.ganadora ? `<a class="btn" href="#detalle">Ver detalles</a>` : ""}
    <div class="scroll-hint">desliza ↓</div>
  </header>

  <section id="detalle" class="section">
    <h2 class="reveal">${esc(C.seccion)}</h2>
    ${items ? `<div class="cards">${items}</div>` : ""}
    ${pasos ? `<div class="steps">${pasos}</div>` : ""}
  </section>

  ${galeria}

  ${C.frase ? `<section class="section quote reveal"><p>${esc(C.frase)}</p></section>` : ""}

  <section class="section reveal"><h2>${esc(C.cuentaTexto || "¡Corre, termina pronto!")}</h2><div class="countdown" id="countdown"></div></section>

  <section class="section">
    <h2 class="reveal">Dónde y cuándo 📍</h2>
    <div class="info">
      <a class="row reveal" href="${D.mapa}" target="_blank" rel="noopener"><span class="ico">📍</span><div><small>Lugar</small><strong>${esc(D.lugar)}</strong></div></a>
      <div class="row reveal"><span class="ico">🗓️</span><div><small>${C.sorteo ? "Fecha del sorteo" : "Válido"}</small><strong>${esc(vigencia)}</strong></div></div>
      ${D.horario ? `<div class="row reveal"><span class="ico">⏰</span><div><small>Horario</small><strong>${esc(D.horario)}</strong></div></div>` : ""}
      <a class="row reveal" href="tel:+${D.whatsapp}"><span class="ico">📞</span><div><small>Teléfono</small><strong>${esc(D.telefono)}</strong></div></a>
    </div>
  </section>

  <section class="section contact reveal">
    <h2>${esc(C.cierreTitulo || "Reserva tu cita 💅")}</h2>
    <p>${esc(C.cierre)}</p>
    <div class="actions">
      <a class="btn" target="_blank" rel="noopener" href="https://wa.me/${D.whatsapp}?text=${waMsg}">${esc(C.botonWa || "Escríbenos por WhatsApp")}</a>
      ${D.instagram ? `<a class="btn ghost" target="_blank" rel="noopener" href="${D.instagram}">Instagram</a>` : ""}
      <a class="btn ghost" target="_blank" rel="noopener" href="${D.mapa}">Cómo llegar</a>
    </div>
  </section>
  <footer>${esc(D.nombre)} · ${esc(D.slogan)} · Con cariño 💖</footer>`;

  /* cuenta regresiva */
  const cd = document.getElementById("countdown");
  const tick = () => {
    const d = fin - new Date();
    if (d <= 0) { cd.innerHTML = "<p>Esta promoción ya finalizó. ¡Escríbenos para la próxima! 💖</p>"; return; }
    cd.innerHTML = [["días", d / 864e5], ["horas", d / 36e5 % 24], ["min", d / 6e4 % 60], ["seg", d / 1e3 % 60]]
      .map(([l, n]) => `<div><b>${String(Math.floor(n)).padStart(2, "0")}</b><span>${l}</span></div>`).join("");
  };
  tick(); setInterval(tick, 1000);

  /* aparecer al hacer scroll */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("show"); io.unobserve(e.target); }
  }), { threshold: .15 });
  document.querySelectorAll(".reveal").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 90 + "ms"; io.observe(el); });

  /* efectos de fondo */
  const pet = document.getElementById("petals");
  const rnd = (a, b) => a + Math.random() * (b - a);
  if (C.cumple || C.ganadora) {
    pet.classList.add("party");
    for (let i = 0; i < 14; i++) {                       // globos subiendo
      const e = document.createElement("span");
      e.className = "balloon"; e.textContent = "🎈";
      e.style.left = rnd(0, 95) + "%"; e.style.fontSize = rnd(28, 54) + "px";
      e.style.animationDuration = rnd(8, 16) + "s"; e.style.animationDelay = -rnd(0, 16) + "s";
      pet.appendChild(e);
    }
    const cols = ["#ff5fa2", "#ffd166", "#6ec8ff", "#b983ff", "#7ee081", "#ff8a5b"];
    for (let i = 0; i < 45; i++) {                       // confeti cayendo
      const e = document.createElement("i");
      e.className = "conf"; e.style.background = cols[i % cols.length];
      e.style.left = rnd(0, 100) + "%"; e.style.animationDuration = rnd(5, 11) + "s"; e.style.animationDelay = -rnd(0, 11) + "s";
      e.style.width = rnd(6, 11) + "px"; e.style.height = rnd(10, 18) + "px";
      pet.appendChild(e);
    }
  } else {
    [...new Set([...(C.particulas || ["🌸", "💖", "✨", "🌷"]), "⭐", "💫", "🌺", "🦋"])].forEach(s => {
      for (let i = 0; i < 4; i++) {
        const e = document.createElement("span");
        e.textContent = s; e.style.left = rnd(0, 100) + "%"; e.style.fontSize = rnd(14, 32) + "px";
        e.style.animationDuration = rnd(9, 19) + "s"; e.style.animationDelay = -rnd(0, 15) + "s";
        pet.appendChild(e);
      }
    });
  }

  /* estrellas titilando en todo el fondo */
  for (let i = 0; i < 40; i++) {
    const s = document.createElement("b");
    s.className = "star"; s.textContent = ["✦", "✧", "★", "✨"][i % 4];
    s.style.left = rnd(0, 100) + "%"; s.style.top = rnd(0, 100) + "%";
    s.style.fontSize = rnd(8, 20) + "px"; s.style.animationDuration = rnd(1.5, 4) + "s"; s.style.animationDelay = -rnd(0, 4) + "s";
    pet.appendChild(s);
  }
  /* estrellas fugaces */
  setInterval(() => {
    const s = document.createElement("i");
    s.className = "shoot"; s.style.top = rnd(0, 40) + "vh"; s.style.left = rnd(30, 100) + "vw";
    document.body.appendChild(s); setTimeout(() => s.remove(), 1400);
  }, 3500);
  /* destellos que siguen el dedo / mouse y explotan al tocar */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const spark = (x, y, set, dx, dy) => {
    const e = document.createElement("span");
    e.className = "spark"; e.textContent = set[Math.floor(Math.random() * set.length)];
    e.style.left = x + "px"; e.style.top = y + "px"; e.style.fontSize = rnd(12, 24) + "px";
    e.style.setProperty("--dx", dx + "px"); e.style.setProperty("--dy", dy + "px");
    document.body.appendChild(e); setTimeout(() => e.remove(), 900);
  };
  const SP = ["✨", "⭐", "🌸", "💖", "💫", "🌷"];
  if (!reduce) {
    let last = 0;
    addEventListener("pointermove", e => { const n = Date.now(); if (n - last < 70) return; last = n; spark(e.clientX, e.clientY, SP, rnd(-20, 20), rnd(10, 40)); });
    addEventListener("pointerdown", e => { for (let i = 0; i < 10; i++) spark(e.clientX, e.clientY, SP, rnd(-70, 70), rnd(-70, 70)); });
  }

  /* ganadora: lluvia de confeti al abrir y al tocar el premio */
  if (C.ganadora) {
    const hero = document.querySelector(".hero"), prize = document.getElementById("prize");
    const lluvia = () => {
      const set = ["🏆", "🎉", "✨", "🎊", "💖", "⭐"];
      const h = hero.getBoundingClientRect(), p = prize.getBoundingClientRect();
      const cx = p.left - h.left + p.width / 2, cy = p.top - h.top + p.height / 2;   // centro de la tarjeta del premio
      for (let i = 0; i < 50; i++) {
        const c = document.createElement("span");
        c.className = "confetti behind"; c.textContent = set[i % 6];
        c.style.left = cx + (Math.random() - .5) * p.width * .7 + "px";
        c.style.top = cy + (Math.random() - .5) * p.height * .5 + "px";
        const ang = Math.random() * Math.PI * 2, dist = 30 + Math.random() * 45;
        c.style.setProperty("--x", Math.cos(ang) * dist * 1.3 + "vw");
        c.style.setProperty("--y", Math.sin(ang) * dist * .9 + "vh");
        c.style.animationDelay = Math.random() * .3 + "s";
        hero.appendChild(c);
        setTimeout(() => c.remove(), 3000);
      }
    };
    for (let w = 0; w < 5; w++) setTimeout(lluvia, 500 + w * 1100);
    prize.onclick = lluvia;
  }

  /* regalo / pastel + confeti */
  const gift = document.getElementById("gift");
  const sBtn = document.getElementById("sorteoBtn");
  if (sBtn) sBtn.onclick = () => {
    sBtn.classList.remove("pressed"); void sBtn.offsetWidth; sBtn.classList.add("pressed");
    const set = C.sorteo ? ["🎟️", "🎉", "✨", "💜", "🎊"] : ["💖", "✨", "🌸", "⭐", "💅"];
    for (let i = 0; i < 40; i++) {
      const c = document.createElement("span");
      c.className = "confetti"; c.textContent = set[i % 5];
      const r = sBtn.getBoundingClientRect();
      c.style.left = (r.left + r.width / 2) + "px"; c.style.bottom = (innerHeight - r.top - r.height / 2) + "px";
      c.style.setProperty("--x", (Math.random() - .5) * 90 + "vw");
      c.style.setProperty("--y", -(10 + Math.random() * 40) + "vh");
      c.style.animationDelay = Math.random() * .2 + "s";
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 2600);
    }
    setTimeout(() => document.getElementById("detalle").scrollIntoView({ behavior: "smooth", block: "start" }), 750);
  };
  if (gift) gift.onclick = () => {
    gift.classList.add("open");
    setTimeout(() => { document.getElementById("verDetalle").style.display = "inline-block"; }, 3000);
    document.getElementById("prize").classList.add("show");
    const set = C.cumple ? ["🎉", "🎈", "🎂", "✨", "🎊"] : ["🎉", "✨", "💖", "🌸", "🎊"];
    for (let i = 0; i < 40; i++) {
      const c = document.createElement("span");
      c.className = "confetti"; c.textContent = set[i % 5];
      c.style.left = 50 + (Math.random() - .5) * 20 + "%";
      c.style.setProperty("--x", (Math.random() - .5) * 120 + "vw");
      c.style.setProperty("--y", -(20 + Math.random() * 50) + "vh");
      c.style.animationDelay = Math.random() * .3 + "s";
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 2600);
    }
  };
})();
