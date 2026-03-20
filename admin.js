// ── Constants ────────────────────────────────────────────────────
const NAV = [
  { section: "Principal",  id: "dashboard",    icon: "fa-gauge",           label: "Dashboard" },
  { section: "Principal",  id: "calendario",   icon: "fa-calendar-days",   label: "Calendário" },
  { section: "Principal",  id: "galeria",       icon: "fa-images",          label: "Galeria" },
  { section: "Principal",  id: "projetos",      icon: "fa-hands-helping",   label: "Projetos" },
  { section: "Principal",  id: "ramos",         icon: "fa-layer-group",     label: "Ramos" },
  { section: "Principal",  id: "atividades",    icon: "fa-star",            label: "Atividades" },
  { section: "Principal",  id: "membros",       icon: "fa-users",           label: "Membros" },
  { section: "Páginas",    id: "paginas",       icon: "fa-pen-ruler",       label: "Conteúdo do site" },
  { section: "Sistema",    id: "contato",       icon: "fa-envelope",        label: "Contato" },
  { section: "Sistema",    id: "config",        icon: "fa-sliders",         label: "Configurações" },
];

const PAGE_META = {
  "index.html":      { icon: "fa-house",        label: "Home",        desc: "Hero, avisos e chamadas principais." },
  "sobre.html":      { icon: "fa-circle-info",  label: "Sobre",       desc: "Apresentação institucional e história." },
  "atividades.html": { icon: "fa-star",          label: "Atividades",  desc: "Atividades em destaque." },
  "galeria.html":    { icon: "fa-images",        label: "Galeria",     desc: "Textos e imagens da galeria." },
  "ramo.html":       { icon: "fa-layer-group",   label: "Ramos",       desc: "Ramos e faixas etárias." },
  "projetos.html":   { icon: "fa-hands-helping", label: "Projetos",    desc: "Projetos em destaque." },
  "contato.html":    { icon: "fa-envelope",      label: "Contato",     desc: "Canais e localização." },
  "documentos.html": { icon: "fa-file-lines",    label: "Documentos",  desc: "Arquivos e explicações." },
  "equipe.html":     { icon: "fa-users",         label: "Equipe",      desc: "Chefia e referências." },
  "participar.html": { icon: "fa-user-plus",     label: "Participar",  desc: "Como entrar no grupo." },
  "links.html":      { icon: "fa-link",          label: "Links",       desc: "Links externos de apoio." },
};

const PUBLIC_PAGES = Object.keys(PAGE_META);

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTHS_SHORT = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const GALLERY_EXTENSIONS = ["webp","jpg","jpeg","png","svg"];
const MEMBER_COLORS = [["#eff6ff","#1d4ed8"],["#f0fdf4","#15803d"],["#fefce8","#a16207"],["#fef2f2","#b91c1c"],["#f5f3ff","#6d28d9"]];

// ── State ─────────────────────────────────────────────────────────
let STATE = { pages: {}, adminPanel: {} };
let PAGE = "dashboard";
let BRANCH = "filhotes";
let CAL_MONTH = new Date().getMonth();
let CAL_YEAR = new Date().getFullYear();
let CONTENT_PAGE = "index.html";
let SAVING = false;
let DIRTY = false;
let TOAST_TIMER = null;
const SCHEMA_CACHE = {};

// ── Boot ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", boot);

async function boot() {
  try {
    const session = await apiFetch("/api/auth/session");
    if (!session.authenticated) { location.href = "/login"; return; }
    setUserInfo(session.email || "Admin");
    document.getElementById("logout-btn").addEventListener("click", doLogout);
    document.getElementById("save-btn").addEventListener("click", () => doSave());
    document.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); doSave(); } });
    document.getElementById("content-area").addEventListener("input", markDirty);
    STATE = normalizeContent(await apiFetch("/api/admin/content"));
    ensureState();
    buildSidebar();
    navigate(PAGE);
  } catch {
    alert("Não foi possível carregar o painel. Verifique sua conexão.");
  }
}

function setUserInfo(email) {
  document.getElementById("user-email").textContent = email;
  const parts = email.split("@")[0].split(/[._-]/);
  document.getElementById("user-initials").textContent = parts.slice(0,2).map(s => s[0]?.toUpperCase() || "").join("") || "AD";
}

// ── Sidebar ───────────────────────────────────────────────────────
function buildSidebar() {
  const nav = document.getElementById("sidebar-nav");
  const sections = {};
  NAV.forEach(item => {
    sections[item.section] = sections[item.section] || [];
    sections[item.section].push(item);
  });
  nav.innerHTML = Object.entries(sections).map(([sec, items]) =>
    `<div class="sb-section">
      <div class="sb-section-label">${esc(sec)}</div>
      <div class="sb-section-row">
        ${items.map(item =>
          `<div class="sb-item${item.id === PAGE ? " active" : ""}" data-page="${item.id}">
            <i class="fas ${item.icon}"></i><span>${esc(item.label)}</span>
          </div>`
        ).join("")}
      </div>
    </div>`
  ).join("");
  nav.querySelectorAll(".sb-item").forEach(el =>
    el.addEventListener("click", () => { captureCurrent(); PAGE = el.dataset.page; buildSidebar(); navigate(PAGE); })
  );
}

// ── Navigation ────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: ["Dashboard", "Visão geral do grupo"],
  calendario: ["Calendário", "Agenda de eventos e atividades"],
  galeria: ["Galeria", "Fotos para o site público"],
  projetos: ["Projetos", "Projetos e frentes especiais"],
  ramos: ["Ramos", "Apresentação das seções por faixa etária"],
  atividades: ["Atividades", "Vivências em destaque no site"],
  membros: ["Membros", "Cadastro interno da equipe"],
  paginas: ["Conteúdo do site", "Edite textos e imagens por página"],
  contato: ["Contato", "Canais e informações de primeira visita"],
  config: ["Configurações", "Identidade e visibilidade do site"],
};

function navigate(page) {
  const [title, sub] = PAGE_TITLES[page] || ["Painel", ""];
  document.getElementById("topbar-title").textContent = title;
  document.getElementById("topbar-sub").textContent = sub;
  renderModals();
  const area = document.getElementById("content-area");
  area.innerHTML = renderPage(page);
  bindPage(page);
  bindGlobal();
  setStatus("ready");
}

function renderPage(page) {
  if (page === "dashboard")  return tplDashboard();
  if (page === "calendario") return tplCalendario();
  if (page === "galeria")    return tplGaleria();
  if (page === "projetos")   return tplProjetos();
  if (page === "ramos")      return tplRamos();
  if (page === "atividades") return tplAtividades();
  if (page === "membros")    return tplMembros();
  if (page === "paginas")    return tplPaginas();
  if (page === "contato")    return tplContato();
  if (page === "config")     return tplConfig();
  return "";
}

// ── Template: Dashboard ───────────────────────────────────────────
function tplDashboard() {
  const p = STATE.adminPanel;
  const ativos = p.members.filter(m => m.status === "ativo").length;
  const eventos = p.events.filter(e => {
    const d = new Date(e.date); return d.getMonth() === CAL_MONTH && d.getFullYear() === CAL_YEAR;
  }).length;
  const projAbertos = p.projects.filter(pr => pr.status !== "concluido").length;

  return `
  <div class="hero-banner">
    <h2>Painel central do GEAR 9º DF</h2>
    <p>Gerencie o site, a agenda e as rotinas do grupo em um único fluxo. Use as frentes de trabalho acima para alternar entre conteúdo, calendário, mídia e configurações.</p>
    <div class="hero-actions">
      <button class="btn btn-primary btn-sm" data-nav="paginas"><i class="fas fa-pen-ruler"></i> Editar site</button>
      <button class="btn btn-sm" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);color:#fff" data-nav="calendario"><i class="fas fa-calendar-check"></i> Agenda</button>
      <button class="btn btn-sm" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);color:#fff" data-nav="config"><i class="fas fa-sliders"></i> Configurações</button>
    </div>
    <div class="hero-stats">
      <div class="hero-stat"><strong>${ativos}</strong><span>Membros ativos</span></div>
      <div class="hero-stat"><strong>${eventos}</strong><span>Eventos em ${MONTHS_SHORT[CAL_MONTH]}/${String(CAL_YEAR).slice(-2)}</span></div>
      <div class="hero-stat"><strong>${projAbertos}</strong><span>Projetos em andamento</span></div>
    </div>
  </div>

  <div class="grid-3">
    ${statTile("Membros ativos", ativos, "cadastro atual", "fa-users", "blue")}
    ${statTile("Fotos na galeria", p.photos.length, "visíveis no site", "fa-images", "green")}
    ${statTile("Projetos ativos", p.projects.filter(pr => pr.status === "ativo").length, "em andamento", "fa-hands-helping", "amber")}
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">Próximos eventos</div>
          <div class="card-desc">Os mais próximos primeiro.</div>
        </div>
        <button class="btn btn-ghost btn-sm" data-nav="calendario"><i class="fas fa-arrow-right"></i></button>
      </div>
      ${dashboardEvents()}
    </div>
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">Distribuição por ramo</div>
          <div class="card-desc">Membros cadastrados no painel.</div>
        </div>
      </div>
      ${dashboardBranches()}
    </div>
  </div>`;
}

function statTile(label, value, sub, icon, color) {
  const colors = { blue: ["#eff6ff","#2563eb"], green: ["#f0fdf4","#16a34a"], amber: ["#fffbeb","#d97706"] };
  const [bg, fg] = colors[color] || colors.blue;
  return `<div class="stat-tile" style="border-left:3px solid ${fg}">
    <small>${esc(label)}</small>
    <strong style="color:${fg}">${value}</strong>
    <span>${esc(sub)}</span>
  </div>`;
}

function dashboardEvents() {
  const upcoming = STATE.adminPanel.events
    .slice().sort((a,b) => a.date.localeCompare(b.date))
    .filter(e => e.date >= dateKey(new Date()))
    .slice(0, 5);
  if (!upcoming.length) return `<div class="empty-state"><i class="fas fa-calendar"></i><p>Nenhum evento próximo cadastrado.</p></div>`;
  return `<div class="ev-list">${upcoming.map(e => `
    <div class="ev-item">
      <div class="ev-dot" style="background:${typeColor(e.type)}"></div>
      <div class="ev-body">
        <div class="ev-title">${esc(e.title)}</div>
        <div class="ev-date">${fmtDate(e.date)} · <span class="badge ${badgeForType(e.type)}">${esc(e.type)}</span></div>
      </div>
    </div>`).join("")}</div>`;
}

function dashboardBranches() {
  const counts = { Filhotes:0, Lobinhos:0, Escoteiros:0, Seniores:0, Pioneiros:0 };
  STATE.adminPanel.members.forEach(m => { if (counts[m.branch] !== undefined) counts[m.branch]++; });
  return `<div class="branch-bar">${Object.entries(counts).map(([name, count]) =>
    `<div class="branch-item"><small>${esc(name)}</small><strong>${count}</strong>
      <div class="prog-bar"><div class="prog-fill" style="width:${Math.round(count / Math.max(1, STATE.adminPanel.members.length) * 100)}%"></div></div>
    </div>`).join("")}</div>`;
}

// ── Template: Calendário ──────────────────────────────────────────
function tplCalendario() {
  return `
  <div class="hero-banner">
    <h2>Calendário</h2>
    <p>Mantenha a agenda clara e confiável para a equipe, famílias e visitantes.</p>
    <div class="hero-actions">
      <button class="btn btn-primary btn-sm" data-open-modal="modal-new-event"><i class="fas fa-plus"></i> Novo evento</button>
    </div>
  </div>
  <div id="cal-wrap"></div>
  <div class="card" id="all-events-card">
    <div class="card-head">
      <div>
        <div class="card-title">Todos os eventos</div>
        <div class="card-desc">Edite ou remova itens conforme necessário.</div>
      </div>
      <span class="badge badge-blue" id="all-events-count">0</span>
    </div>
    <div id="all-events-list" class="scroll-y items-list" style="max-height:400px"></div>
  </div>`;
}

function renderCal() {
  const wrap = document.getElementById("cal-wrap");
  if (!wrap) return;
  const today = new Date();
  const firstDay = new Date(CAL_YEAR, CAL_MONTH, 1).getDay();
  const lastDay = new Date(CAL_YEAR, CAL_MONTH + 1, 0).getDate();
  const monthEvents = STATE.adminPanel.events.filter(e => {
    const d = new Date(e.date); return d.getMonth() === CAL_MONTH && d.getFullYear() === CAL_YEAR;
  }).sort((a,b) => a.date.localeCompare(b.date));
  const allEvents = STATE.adminPanel.events.slice().sort((a,b) => a.date.localeCompare(b.date));

  wrap.innerHTML = `
  <div class="card">
    <div class="card-head">
      <div class="card-title" id="cal-month-label">${MONTHS[CAL_MONTH]} de ${CAL_YEAR}</div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-sm btn-icon" id="cal-prev"><i class="fas fa-chevron-left"></i></button>
        <button class="btn btn-sm btn-icon" id="cal-next"><i class="fas fa-chevron-right"></i></button>
      </div>
    </div>
    <div class="cal-shell">
      <div>
        <div class="cal-grid">
          ${["D","S","T","Q","Q","S","S"].map(d => `<div class="cal-wday">${d}</div>`).join("")}
          ${"<div class='cal-cell empty'></div>".repeat(firstDay)}
          ${Array.from({length: lastDay}, (_, i) => i+1).map(day => {
            const key = dateKey(new Date(CAL_YEAR, CAL_MONTH, day));
            const evs = STATE.adminPanel.events.filter(e => e.date === key);
            const hasReg = evs.some(e => e.type === "regional");
            const isToday = day === today.getDate() && CAL_MONTH === today.getMonth() && CAL_YEAR === today.getFullYear();
            return `<div class="cal-cell${evs.length ? " has-ev" : ""}${hasReg ? " has-reg" : ""}${isToday ? " today" : ""}">${day}</div>`;
          }).join("")}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--c-ink-3)"><span style="width:8px;height:8px;border-radius:99px;background:var(--c-green);display:inline-block"></span>Grupo</span>
          <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--c-ink-3)"><span style="width:8px;height:8px;border-radius:99px;background:var(--c-amber);display:inline-block"></span>Regional</span>
          <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--c-ink-3)"><span style="width:8px;height:8px;border-radius:99px;background:var(--c-red);display:inline-block"></span>Nacional</span>
        </div>
      </div>
      <div>
        <div class="card-title" style="margin-bottom:10px">Eventos de ${MONTHS_SHORT[CAL_MONTH]}</div>
        ${monthEvents.length
          ? `<div class="ev-list">${monthEvents.map(e => `
            <div class="ev-item">
              <div class="ev-dot" style="background:${typeColor(e.type)}"></div>
              <div class="ev-body"><div class="ev-title">${esc(e.title)}</div><div class="ev-date">${fmtDate(e.date)}</div></div>
              <button class="btn btn-xs btn-danger" data-rm-event="${esc(e.id)}"><i class="fas fa-times"></i></button>
            </div>`).join("")}</div>`
          : `<div class="empty-state"><i class="fas fa-calendar"></i><p>Nenhum evento neste mês.</p></div>`}
      </div>
    </div>
  </div>`;

  document.getElementById("cal-prev").addEventListener("click", () => {
    if (CAL_MONTH === 0) { CAL_MONTH = 11; CAL_YEAR--; } else CAL_MONTH--;
    renderCal();
  });
  document.getElementById("cal-next").addEventListener("click", () => {
    if (CAL_MONTH === 11) { CAL_MONTH = 0; CAL_YEAR++; } else CAL_MONTH++;
    renderCal();
  });
  wrap.querySelectorAll("[data-rm-event]").forEach(btn =>
    btn.addEventListener("click", () => {
      STATE.adminPanel.events = STATE.adminPanel.events.filter(e => e.id !== btn.dataset.rmEvent);
      renderCal(); renderAllEvents(); markDirty(); toast("Evento removido.");
    })
  );
  renderAllEvents(allEvents);
}

function renderAllEvents(evs) {
  evs = evs || STATE.adminPanel.events.slice().sort((a,b) => a.date.localeCompare(b.date));
  const cnt = document.getElementById("all-events-count");
  if (cnt) cnt.textContent = String(evs.length);
  const list = document.getElementById("all-events-list");
  if (!list) return;
  list.innerHTML = evs.length
    ? evs.map(e => itemCard({
        id: e.id, type: "event",
        title: e.title, sub: `${fmtDate(e.date)} · ${e.type}`,
        badges: [{ label: e.type, cls: badgeForType(e.type) }],
        desc: e.description || "",
        fields: `
          <div class="form-row">
            <div class="fg"><label>Data</label><input type="date" data-event-date="${e.id}" value="${esc(e.date)}"></div>
            <div class="fg"><label>Tipo</label><select data-event-type="${e.id}">
              ${["grupo","regional","nacional"].map(t => `<option value="${t}"${e.type===t?" selected":""}>${cap(t)}</option>`).join("")}
            </select></div>
          </div>
          <div class="fg"><label>Título</label><input data-event-title="${e.id}" value="${esc(e.title)}"></div>
          <div class="fg"><label>Descrição</label><textarea rows="2" data-event-desc="${e.id}">${esc(e.description||"")}</textarea></div>`,
      })).join("")
    : `<div class="empty-state"><i class="fas fa-calendar-day"></i><p>Nenhum evento cadastrado.</p></div>`;
  bindItemCards("event", id => {
    const ev = STATE.adminPanel.events.find(e => e.id === id);
    if (!ev) return;
    ev.date = val(`[data-event-date="${id}"]`, ev.date);
    ev.type = val(`[data-event-type="${id}"]`, ev.type);
    ev.title = val(`[data-event-title="${id}"]`, ev.title);
    ev.description = val(`[data-event-desc="${id}"]`, ev.description);
    renderCal(); toast("Evento atualizado."); markDirty();
  }, id => {
    STATE.adminPanel.events = STATE.adminPanel.events.filter(e => e.id !== id);
    renderCal(); toast("Evento removido."); markDirty();
  });
}

// ── Template: Galeria ─────────────────────────────────────────────
function tplGaleria() {
  GAL_FILTER = "all";
  return `
  <div class="hero-banner">
    <h2>Galeria de fotos</h2>
    <p>Gerencie as imagens que aparecem no site. Os arquivos devem existir em <strong>images/</strong>.</p>
    <div class="hero-actions">
      <button class="btn btn-primary btn-sm" data-open-modal="modal-photo"><i class="fas fa-plus"></i> Adicionar foto</button>
    </div>
  </div>
  <div class="toolbar">
    <div class="toolbar-left" id="gal-filters">
      ${["all","acampamento","atividade","evento","comunidade"].map(c =>
        `<button class="btn btn-sm${c===GAL_FILTER?" btn-primary":""}" data-gal-filter="${c}">${c==="all"?"Todas":cap(c)}</button>`).join("")}
    </div>
    <div class="toolbar-right"><span class="badge badge-blue" id="gal-count">0</span></div>
  </div>
  <div class="card">
    <div class="card-title" style="margin-bottom:14px">Fotos cadastradas</div>
    <div id="photo-grid"></div>
  </div>`;
}

let GAL_FILTER = "all";

function renderGallery() {
  const photos = STATE.adminPanel.photos.filter(p => GAL_FILTER === "all" || p.category === GAL_FILTER);
  const cnt = document.getElementById("gal-count");
  if (cnt) cnt.textContent = `${photos.length} foto${photos.length !== 1 ? "s" : ""}`;
  const grid = document.getElementById("photo-grid");
  if (!grid) return;
  if (!photos.length) {
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-image"></i><p>Nenhuma foto nesta categoria.</p></div>`;
    return;
  }
  grid.innerHTML = `<div class="gallery-grid">${photos.map(p => `
    <div class="photo-card">
      <div class="photo-thumb">${p.src ? `<img src="${esc(p.src)}" alt="${esc(p.title)}" loading="lazy">` : `<i class="fas fa-image"></i>`}</div>
      <div class="photo-info">
        <div class="photo-name">${esc(p.title)}</div>
        <div class="photo-cat"><span class="badge badge-gray">${esc(p.category)}</span></div>
      </div>
      <div class="photo-actions">
        <button class="btn btn-xs btn-ghost" data-edit-photo="${esc(p.id)}"><i class="fas fa-pen"></i> Editar</button>
        <button class="btn btn-xs btn-danger" data-rm-photo="${esc(p.id)}"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join("")}</div>
  <div id="photo-edit-area" class="scroll-y" style="margin-top:14px;max-height:none"></div>`;

  grid.querySelectorAll("[data-edit-photo]").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = STATE.adminPanel.photos.find(x => x.id === btn.dataset.editPhoto);
      if (!p) return;
      const area = document.getElementById("photo-edit-area");
      area.innerHTML = `<div class="card" style="margin-top:0">
        <div class="card-title" style="margin-bottom:12px">Editando: ${esc(p.title)}</div>
        <div class="form-row">
          <div class="fg"><label>Título</label><input id="pe-title" value="${esc(p.title)}"></div>
          <div class="fg"><label>Categoria</label><select id="pe-cat">
            ${["acampamento","atividade","evento","comunidade"].map(c => `<option value="${c}"${p.category===c?" selected":""}>${cap(c)}</option>`).join("")}
          </select></div>
        </div>
        <div class="fg"><label>Caminho da imagem</label><input id="pe-src" value="${esc(p.src)}"></div>
        <div class="fg"><label>Legenda</label><input id="pe-caption" value="${esc(p.caption)}"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
          <button class="btn btn-sm" id="pe-cancel">Cancelar</button>
          <button class="btn btn-sm btn-primary" id="pe-save">Salvar</button>
        </div>
      </div>`;
      document.getElementById("pe-cancel").addEventListener("click", () => area.innerHTML = "");
      document.getElementById("pe-save").addEventListener("click", () => {
        p.title   = document.getElementById("pe-title").value.trim() || p.title;
        p.category = document.getElementById("pe-cat").value;
        p.src     = normPath(document.getElementById("pe-src").value);
        p.caption = document.getElementById("pe-caption").value.trim();
        area.innerHTML = "";
        renderGallery(); toast("Foto atualizada."); markDirty();
      });
      area.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
  grid.querySelectorAll("[data-rm-photo]").forEach(btn =>
    btn.addEventListener("click", () => {
      STATE.adminPanel.photos = STATE.adminPanel.photos.filter(p => p.id !== btn.dataset.rmPhoto);
      renderGallery(); toast("Foto removida."); markDirty();
    })
  );
}

// ── Template: Projetos ────────────────────────────────────────────
function tplProjetos() {
  return `
  <div class="hero-banner">
    <h2>Projetos</h2>
    <p>Mostre os projetos que merecem destaque. Menos volume, mais contexto.</p>
    <div class="hero-actions">
      <button class="btn btn-primary btn-sm" data-open-modal="modal-project"><i class="fas fa-plus"></i> Novo projeto</button>
    </div>
  </div>
  <div class="card">
    <div class="card-head">
      <div class="card-title">Projetos cadastrados</div>
    </div>
    <div id="projetos-list" class="items-list"></div>
  </div>`;
}

function renderProjetos() {
  const list = document.getElementById("projetos-list");
  if (!list) return;
  list.innerHTML = STATE.adminPanel.projects.length
    ? STATE.adminPanel.projects.map(p => itemCard({
        id: p.id, type: "project",
        title: `${p.icon || "🌟"} ${p.title}`, sub: p.meta,
        badges: [
          { label: p.status, cls: p.status === "ativo" ? "badge-green" : p.status === "concluido" ? "badge-blue" : "badge-amber" },
          { label: `${p.progress}%`, cls: "badge-gray" },
        ],
        desc: p.description,
        fields: `
          <div class="form-row">
            <div class="fg"><label>Nome</label><input data-proj-title="${p.id}" value="${esc(p.title)}"></div>
            <div class="fg"><label>Emoji</label><input data-proj-icon="${p.id}" value="${esc(p.icon||"🌟")}" style="max-width:80px"></div>
          </div>
          <div class="form-row">
            <div class="fg"><label>Status</label><select data-proj-status="${p.id}">
              ${["planejado","ativo","concluido"].map(s => `<option value="${s}"${p.status===s?" selected":""}>${cap(s)}</option>`).join("")}
            </select></div>
            <div class="fg"><label>Progresso (%)</label><input type="number" min="0" max="100" data-proj-progress="${p.id}" value="${esc(String(p.progress||0))}"></div>
          </div>
          <div class="fg"><label>Tags / meta</label><input data-proj-meta="${p.id}" value="${esc(p.meta||"")}"></div>
          <div class="fg"><label>Descrição</label><textarea rows="3" data-proj-desc="${p.id}">${esc(p.description||"")}</textarea></div>
          <div class="prog-bar" style="margin-bottom:4px"><div class="prog-fill" id="prog-preview-${p.id}" style="width:${p.progress||0}%"></div></div>`,
      })).join("")
    : `<div class="empty-state"><i class="fas fa-hands-helping"></i><p>Nenhum projeto cadastrado.</p></div>`;
  bindItemCards("project", id => {
    const p = STATE.adminPanel.projects.find(x => x.id === id);
    if (!p) return;
    p.title    = val(`[data-proj-title="${id}"]`, p.title);
    p.icon     = val(`[data-proj-icon="${id}"]`, p.icon) || "🌟";
    p.status   = val(`[data-proj-status="${id}"]`, p.status);
    p.progress = Math.min(100, Math.max(0, Number(val(`[data-proj-progress="${id}"]`, String(p.progress))) || 0));
    p.meta     = val(`[data-proj-meta="${id}"]`, p.meta);
    p.description = val(`[data-proj-desc="${id}"]`, p.description);
    renderProjetos(); toast("Projeto atualizado."); markDirty();
  }, id => {
    STATE.adminPanel.projects = STATE.adminPanel.projects.filter(p => p.id !== id);
    renderProjetos(); toast("Projeto removido."); markDirty();
  });
}

// ── Template: Ramos ───────────────────────────────────────────────
function tplRamos() {
  const branch = STATE.adminPanel.branches[BRANCH];
  return `
  <div class="card">
    <div class="card-head">
      <div>
        <div class="card-title">Ramos</div>
        <div class="card-desc">Edite a apresentação de cada seção para famílias e jovens.</div>
      </div>
    </div>
    <div class="ramo-tabs">
      ${Object.keys(STATE.adminPanel.branches).map(k =>
        `<div class="ramo-tab${k === BRANCH ? " active" : ""}" data-branch="${k}">${esc(STATE.adminPanel.branches[k].name)}</div>`
      ).join("")}
    </div>
    <div class="fg"><label>Nome do ramo</label><input id="ramo-nome" value="${esc(branch.name)}"></div>
    <div class="fg"><label>Faixa etária</label><input id="ramo-idade" value="${esc(branch.age)}"></div>
    <div class="fg"><label>Descrição curta</label><textarea id="ramo-desc1" rows="2">${esc(branch.short)}</textarea></div>
    <div class="fg"><label>Descrição longa</label><textarea id="ramo-desc2" rows="3">${esc(branch.long)}</textarea></div>
    <div class="fg"><label>Pontos principais (um por linha)</label><textarea id="ramo-bullets" rows="4">${esc(branch.bullets.join("\n"))}</textarea></div>
    <div style="display:flex;justify-content:flex-end;margin-top:6px">
      <button class="btn btn-primary btn-sm" id="ramo-save"><i class="fas fa-floppy-disk"></i> Salvar ramo</button>
    </div>
  </div>`;
}

// ── Template: Atividades ──────────────────────────────────────────
function tplAtividades() {
  return `
  <div class="hero-banner">
    <h2>Atividades</h2>
    <p>Liste as vivências que melhor explicam o dia a dia do grupo para quem está chegando.</p>
    <div class="hero-actions">
      <button class="btn btn-primary btn-sm" data-open-modal="modal-activity"><i class="fas fa-plus"></i> Nova atividade</button>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><div class="card-title">Atividades em destaque</div></div>
    <div id="atividades-list" class="items-list"></div>
  </div>`;
}

function renderAtividades() {
  const list = document.getElementById("atividades-list");
  if (!list) return;
  list.innerHTML = STATE.adminPanel.activities.length
    ? STATE.adminPanel.activities.map(a => itemCard({
        id: a.id, type: "activity",
        title: `${a.icon || "⭐"} ${a.title}`, sub: "Destaque no site",
        badges: [],
        desc: a.description,
        fields: `
          <div class="form-row">
            <div class="fg"><label>Emoji</label><input data-ativ-icon="${a.id}" value="${esc(a.icon||"⭐")}" style="max-width:80px"></div>
            <div class="fg"><label>Título</label><input data-ativ-title="${a.id}" value="${esc(a.title)}"></div>
          </div>
          <div class="fg"><label>Descrição</label><textarea rows="3" data-ativ-desc="${a.id}">${esc(a.description||"")}</textarea></div>`,
      })).join("")
    : `<div class="empty-state"><i class="fas fa-star"></i><p>Nenhuma atividade cadastrada.</p></div>`;
  bindItemCards("activity", id => {
    const a = STATE.adminPanel.activities.find(x => x.id === id);
    if (!a) return;
    a.icon = val(`[data-ativ-icon="${id}"]`, a.icon) || "⭐";
    a.title = val(`[data-ativ-title="${id}"]`, a.title);
    a.description = val(`[data-ativ-desc="${id}"]`, a.description);
    renderAtividades(); toast("Atividade atualizada."); markDirty();
  }, id => {
    STATE.adminPanel.activities = STATE.adminPanel.activities.filter(a => a.id !== id);
    renderAtividades(); toast("Atividade removida."); markDirty();
  });
}

// ── Template: Membros ─────────────────────────────────────────────
function tplMembros() {
  return `
  <div class="hero-banner">
    <h2>Membros</h2>
    <p>Cadastro interno da equipe. Rápido para consultar, objetivo para manter.</p>
    <div class="hero-actions">
      <button class="btn btn-primary btn-sm" data-open-modal="modal-member"><i class="fas fa-user-plus"></i> Novo membro</button>
    </div>
  </div>
  <div class="toolbar">
    <div class="toolbar-left">
      <div class="search-wrap"><i class="fas fa-search"></i><input id="member-search" placeholder="Buscar por nome..."></div>
      <select id="member-branch" style="height:32px;padding:0 8px;border:1px solid var(--c-border);border-radius:var(--r-sm);font-size:12px;background:var(--c-surface);color:var(--c-ink-2)">
        <option value="">Todos os ramos</option>
        ${["Filhotes","Lobinhos","Escoteiros","Seniores","Pioneiros"].map(b => `<option>${b}</option>`).join("")}
      </select>
    </div>
    <div class="toolbar-right"><span class="badge badge-blue" id="members-count">0</span></div>
  </div>
  <div class="card">
    <div class="card-head"><div class="card-title">Perfis</div></div>
    <div id="membros-list" class="items-list"></div>
  </div>`;
}

function renderMembros() {
  const search = (document.getElementById("member-search")?.value || "").toLowerCase();
  const branch = document.getElementById("member-branch")?.value || "";
  const rows = STATE.adminPanel.members.filter(m =>
    (!search || m.name.toLowerCase().includes(search)) && (!branch || m.branch === branch)
  );
  const cnt = document.getElementById("members-count");
  if (cnt) cnt.textContent = String(rows.length);
  const list = document.getElementById("membros-list");
  if (!list) return;
  list.innerHTML = rows.length
    ? rows.map(m => {
        const [bg, fg] = MEMBER_COLORS[hashStr(m.name) % MEMBER_COLORS.length];
        return itemCard({
          id: m.id, type: "member",
          title: m.name, sub: `${m.branch} · ${m.role} · desde ${m.since}`,
          badges: [
            { label: m.branch, cls: "badge-gray" },
            { label: m.status, cls: m.status === "ativo" ? "badge-green" : m.status === "pendente" ? "badge-amber" : "badge-red" },
          ],
          desc: "",
          avatar: { bg, fg, initials: initials(m.name) },
          fields: `
            <div class="form-row">
              <div class="fg"><label>Nome</label><input data-mb-name="${m.id}" value="${esc(m.name)}"></div>
              <div class="fg"><label>Ramo</label><select data-mb-branch="${m.id}">
                ${["Filhotes","Lobinhos","Escoteiros","Seniores","Pioneiros"].map(b => `<option${m.branch===b?" selected":""}>${b}</option>`).join("")}
              </select></div>
            </div>
            <div class="form-row">
              <div class="fg"><label>Função</label><select data-mb-role="${m.id}">
                ${["Jovem","Monitor","Chefe"].map(r => `<option${m.role===r?" selected":""}>${r}</option>`).join("")}
              </select></div>
              <div class="fg"><label>Ingresso</label><input type="number" data-mb-since="${m.id}" value="${esc(m.since)}"></div>
            </div>
            <div class="fg"><label>Status</label><select data-mb-status="${m.id}">
              ${["ativo","pendente","inativo"].map(s => `<option value="${s}"${m.status===s?" selected":""}>${cap(s)}</option>`).join("")}
            </select></div>`,
        });
      }).join("")
    : `<div class="empty-state"><i class="fas fa-users"></i><p>${search || branch ? "Nenhum resultado." : "Nenhum membro cadastrado."}</p></div>`;
  bindItemCards("member", id => {
    const m = STATE.adminPanel.members.find(x => x.id === id);
    if (!m) return;
    m.name   = val(`[data-mb-name="${id}"]`, m.name);
    m.branch = val(`[data-mb-branch="${id}"]`, m.branch);
    m.role   = val(`[data-mb-role="${id}"]`, m.role);
    m.since  = val(`[data-mb-since="${id}"]`, m.since);
    m.status = val(`[data-mb-status="${id}"]`, m.status);
    renderMembros(); toast("Membro atualizado."); markDirty();
  }, id => {
    STATE.adminPanel.members = STATE.adminPanel.members.filter(m => m.id !== id);
    renderMembros(); toast("Membro removido."); markDirty();
  });
}

// ── Template: Páginas do site ─────────────────────────────────────
function tplPaginas() {
  const meta = PAGE_META[CONTENT_PAGE] || { label: "Página", icon: "fa-file", desc: "" };
  return `
  <div class="hero-banner">
    <h2>Conteúdo do site</h2>
    <p>Edite textos e imagens por página sem precisar mexer no código-fonte.</p>
    <div class="hero-actions">
      <a class="btn btn-sm" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);color:#fff" href="/${CONTENT_PAGE}" target="_blank" rel="noreferrer"><i class="fas fa-arrow-up-right-from-square"></i> Ver página</a>
    </div>
  </div>
  <div class="card">
    <div class="card-head">
      <div>
        <div class="card-title"><i class="fas ${meta.icon}" style="color:var(--c-blue);margin-right:6px"></i>${esc(meta.label)}</div>
        <div class="card-desc">${esc(meta.desc)}</div>
      </div>
    </div>
    <div class="tab-strip" id="page-tabs">
      ${PUBLIC_PAGES.map(p => {
        const m = PAGE_META[p];
        return `<button class="tab-btn${p === CONTENT_PAGE ? " active" : ""}" data-page-tab="${p}"><i class="fas ${m.icon}"></i> ${esc(m.label)}</button>`;
      }).join("")}
    </div>
  </div>
  <div id="content-editor-wrap">
    <div class="card"><div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Carregando editor...</p></div></div>
  </div>`;
}

async function initPaginasEditor() {
  document.querySelectorAll("[data-page-tab]").forEach(btn =>
    btn.addEventListener("click", () => {
      if (btn.dataset.pageTab === CONTENT_PAGE) return;
      capturePaginasContent();
      CONTENT_PAGE = btn.dataset.pageTab;
      navigate("paginas");
    })
  );
  await renderPaginasEditor();
}

async function renderPaginasEditor() {
  const wrap = document.getElementById("content-editor-wrap");
  if (!wrap) return;
  wrap.innerHTML = `<div class="card"><div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Lendo ${esc(CONTENT_PAGE)}...</p></div></div>`;
  try {
    const schema = await getPageSchema(CONTENT_PAGE);
    const pState = ensurePageState(CONTENT_PAGE);
    const texts = getFeaturedEntries(CONTENT_PAGE, schema.texts, false);
    const images = getFeaturedEntries(CONTENT_PAGE, schema.images, true);
    wrap.innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-head"><div class="card-title">Textos principais</div><span class="badge badge-blue">${texts.length}</span></div>
          ${texts.length
            ? texts.map(f => `<div style="margin-bottom:14px">
                <div class="fg">
                  <label>${esc(f.title)}</label>
                  <textarea data-site-text="${esc(f.key)}" rows="${Math.max(2, Math.min(6, (f.value || "").split("\n").length + 1))}">${esc(pState.text[f.key] ?? f.value)}</textarea>
                </div>
                <div style="font-size:11px;color:var(--c-ink-3);margin-top:-8px">${esc(f.hint)}</div>
              </div>`).join("")
            : `<div class="empty-state"><i class="fas fa-font"></i><p>Nenhum campo identificado.</p></div>`}
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">Imagens</div><span class="badge badge-blue">${images.length}</span></div>
          ${images.length
            ? images.map(f => {
                const ov = pState.images[f.key] || {};
                return `<div style="margin-bottom:14px">
                  <div class="fg"><label>${esc(f.title)}</label><input data-site-img-src="${esc(f.key)}" value="${esc(ov.src ?? f.src)}"></div>
                  <div class="fg"><label>Texto alternativo</label><input data-site-img-alt="${esc(f.key)}" value="${esc(ov.alt ?? f.alt)}"></div>
                </div>`;
              }).join("")
            : `<div class="empty-state"><i class="fas fa-image"></i><p>Nenhuma imagem identificada.</p></div>`}
        </div>
      </div>
      <div class="card">
        <div class="card-head">
          <div class="card-title">Blocos extras</div>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="badge badge-blue">${pState.extras.length}</span>
            <button class="btn btn-sm btn-primary" id="add-extra-btn"><i class="fas fa-plus"></i> Novo bloco</button>
          </div>
        </div>
        <p style="font-size:12px;color:var(--c-ink-3);margin-bottom:12px">Use blocos extras para adicionar destaques sem alterar a estrutura principal.</p>
        <div id="extras-list">${renderExtras(pState.extras)}</div>
      </div>`;
    bindPaginasEditor();
  } catch {
    wrap.innerHTML = `<div class="card"><div class="notice notice-warn"><i class="fas fa-triangle-exclamation"></i> Não foi possível ler esta página automaticamente.</div></div>`;
  }
}

function renderExtras(extras) {
  if (!extras.length) return `<div class="empty-state"><i class="fas fa-puzzle-piece"></i><p>Nenhum bloco extra ainda.</p></div>`;
  return extras.map(ex => `
    <div data-extra-id="${esc(ex.id)}" style="padding:14px;border:1px solid var(--c-border);border-radius:var(--r-md);margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-size:12px;font-weight:600;color:var(--c-ink)">Bloco extra</span>
        <button class="btn btn-xs btn-danger" data-rm-extra="${esc(ex.id)}"><i class="fas fa-trash"></i></button>
      </div>
      <div class="fg"><label>Título</label><input data-extra-title value="${esc(ex.title)}"></div>
      <div class="fg"><label>Texto</label><textarea rows="3" data-extra-text>${esc(ex.text)}</textarea></div>
      <div class="form-row">
        <div class="fg"><label>Botão</label><input data-extra-btn-label value="${esc(ex.buttonLabel)}"></div>
        <div class="fg"><label>Link do botão</label><input data-extra-btn-href value="${esc(ex.buttonHref)}"></div>
      </div>
      <div class="form-row">
        <div class="fg"><label>Imagem</label><input data-extra-img-src value="${esc(ex.imageSrc)}"></div>
        <div class="fg"><label>Alt da imagem</label><input data-extra-img-alt value="${esc(ex.imageAlt)}"></div>
      </div>
    </div>`).join("");
}

function bindPaginasEditor() {
  document.getElementById("add-extra-btn")?.addEventListener("click", () => {
    capturePaginasContent();
    ensurePageState(CONTENT_PAGE).extras.push({ id: uid("ex"), title: "", text: "", buttonLabel: "", buttonHref: "", imageSrc: "", imageAlt: "" });
    document.getElementById("extras-list").innerHTML = renderExtras(ensurePageState(CONTENT_PAGE).extras);
    bindPaginasEditor(); markDirty();
  });
  document.querySelectorAll("[data-rm-extra]").forEach(btn =>
    btn.addEventListener("click", () => {
      capturePaginasContent();
      const ps = ensurePageState(CONTENT_PAGE);
      ps.extras = ps.extras.filter(ex => ex.id !== btn.dataset.rmExtra);
      document.getElementById("extras-list").innerHTML = renderExtras(ps.extras);
      bindPaginasEditor(); toast("Bloco removido."); markDirty();
    })
  );
}

function capturePaginasContent() {
  const schema = SCHEMA_CACHE[CONTENT_PAGE] || { texts: [], images: [] };
  const ps = ensurePageState(CONTENT_PAGE);
  const nextText = {};
  schema.texts.forEach(f => {
    const el = document.querySelector(`[data-site-text="${cssescape(f.key)}"]`);
    if (!el) return;
    const v = el.value.trim();
    if (v && v !== f.value) nextText[f.key] = v;
  });
  ps.text = nextText;
  const nextImages = {};
  schema.images.forEach(f => {
    const src = document.querySelector(`[data-site-img-src="${cssescape(f.key)}"]`);
    const alt = document.querySelector(`[data-site-img-alt="${cssescape(f.key)}"]`);
    if (!src) return;
    const obj = {};
    if (src.value.trim() && src.value.trim() !== f.src) obj.src = src.value.trim();
    if (alt && alt.value.trim() !== f.alt) obj.alt = alt.value.trim();
    if (Object.keys(obj).length) nextImages[f.key] = obj;
  });
  ps.images = nextImages;
  ps.extras = Array.from(document.querySelectorAll("[data-extra-id]")).map(card => ({
    id: card.dataset.extraId || uid("ex"),
    title:       (card.querySelector("[data-extra-title]")?.value || "").trim(),
    text:        (card.querySelector("[data-extra-text]")?.value || "").trim(),
    buttonLabel: (card.querySelector("[data-extra-btn-label]")?.value || "").trim(),
    buttonHref:  (card.querySelector("[data-extra-btn-href]")?.value || "").trim(),
    imageSrc:    (card.querySelector("[data-extra-img-src]")?.value || "").trim(),
    imageAlt:    (card.querySelector("[data-extra-img-alt]")?.value || "").trim(),
  }));
}

async function getPageSchema(page) {
  if (SCHEMA_CACHE[page]) return SCHEMA_CACHE[page];
  const res = await fetch(`/${page}?nocache=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("fetch_failed");
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.querySelector("main") || doc.body;
  const schema = {
    texts: Array.from(root.querySelectorAll("h1,h2,h3,h4,p,.eyebrow,.btn"))
      .filter(n => n.textContent.trim())
      .map(n => ({ key: buildKey(n, root), label: `${n.tagName.toLowerCase()} — ${n.textContent.trim().replace(/\s+/g," ").slice(0,70)}`, value: n.textContent.trim() })),
    images: Array.from(root.querySelectorAll("img"))
      .map((n, i) => ({ key: buildKey(n, root), label: `img ${i+1} — ${n.alt || n.src || ""}`, src: n.getAttribute("src") || "", alt: n.getAttribute("alt") || "" })),
  };
  SCHEMA_CACHE[page] = schema;
  return schema;
}

function buildKey(el, root) {
  const parts = [];
  let cur = el;
  while (cur && cur !== root) {
    const tag = cur.tagName.toLowerCase();
    let idx = 1, sib = cur.previousElementSibling;
    while (sib) { if (sib.tagName === cur.tagName) idx++; sib = sib.previousElementSibling; }
    parts.unshift(`${tag}:nth-of-type(${idx})`);
    cur = cur.parentElement;
  }
  return parts.join(">");
}

const FEATURED_TEXTS = {
  "index.html":      ["Hero","Aprender","Crescer","Missão","Aviso","CTA"],
  "sobre.html":      ["Título","Baden","História","Valores","Resumo"],
  "atividades.html": ["Título","Cards","CTA"],
  "projetos.html":   ["Título","Projetos","CTA"],
  "contato.html":    ["Título","Canal","Visita","Formulário"],
  "galeria.html":    ["Título","Texto"],
  "ramo.html":       ["Título","Ramo","Faixa"],
};

function getFeaturedEntries(page, items, isImage) {
  const limit = isImage ? 4 : 8;
  const tagMap = { h1:"Título principal", h2:"Subtítulo", h3:"Subtítulo", h4:"Cabeçalho", p:"Parágrafo", eyebrow:"Destaque", btn:"Botão" };
  return items.slice(0, limit).map((item, i) => {
    const rawTag = (item.label || "").split(" — ")[0].trim();
    const title = isImage ? `Imagem ${i+1}` : (tagMap[rawTag] || `Campo ${i+1}`);
    return { ...item, title, hint: (item.label || "").replace(/\s+/g, " ").slice(0, 80) };
  });
}

// ── Template: Contato ─────────────────────────────────────────────
function tplContato() {
  const c = STATE.adminPanel.contact;
  return `
  <div class="notice" style="margin-bottom:0"><i class="fas fa-circle-info"></i> Revise estas informações sempre que houver mudança. São a porta de entrada para famílias e visitantes.</div>
  <div class="grid-2">
    <div class="card">
      <div class="card-head"><div class="card-title">Contato principal</div></div>
      <div class="fg"><label>E-mail</label><input id="c-email" value="${esc(c.email)}"></div>
      <div class="fg"><label>Telefone principal</label><input id="c-phone1" value="${esc(c.phonePrimary)}"></div>
      <div class="fg"><label>Telefone secundário</label><input id="c-phone2" value="${esc(c.phoneSecondary)}"></div>
      <div class="fg"><label>Instagram</label><input id="c-instagram" value="${esc(c.instagram)}"></div>
      <div class="fg"><label>Horário de atividades</label><input id="c-schedule" value="${esc(c.schedule)}"></div>
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title">Endereço</div></div>
      <div class="fg"><label>Logradouro</label><input id="c-addr" value="${esc(c.address)}"></div>
      <div class="form-row">
        <div class="fg"><label>CEP</label><input id="c-cep" value="${esc(c.cep)}"></div>
        <div class="fg"><label>Cidade / Estado</label><input id="c-city" value="${esc(c.cityState)}"></div>
      </div>
      <div class="fg"><label>Link do mapa (Google Maps embed)</label><textarea id="c-maps" rows="3">${esc(c.mapsSrc)}</textarea></div>
    </div>
  </div>`;
}

// ── Template: Configurações ───────────────────────────────────────
function tplConfig() {
  const s = STATE.adminPanel.settings;
  return `
  <div class="grid-2">
    <div class="card">
      <div class="card-head"><div class="card-title">Identidade do grupo</div></div>
      <div class="form-row">
        <div class="fg"><label>Nome curto</label><input id="cfg-short" value="${esc(s.shortName)}"></div>
        <div class="fg"><label>Ano de fundação</label><input id="cfg-founded" value="${esc(s.founded)}"></div>
      </div>
      <div class="fg"><label>Nome completo</label><input id="cfg-full" value="${esc(s.fullName)}"></div>
      <div class="fg"><label>Lema</label><input id="cfg-motto" value="${esc(s.motto)}"></div>
      <div class="fg"><label>Slogan</label><input id="cfg-slogan" value="${esc(s.slogan)}"></div>
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title">Visibilidade de seções</div></div>
      ${[
        ["gallery",       "Galeria de fotos"],
        ["projects",      "Projetos sociais"],
        ["calendar",      "Calendário"],
        ["championBadge", "Banner de conquista"],
        ["contactForm",   "Formulário de contato"],
      ].map(([k, label]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--c-border)">
          <span style="font-size:13px;font-weight:500">${esc(label)}</span>
          <label class="tog"><input type="checkbox" data-vis="${k}"${s.visibility[k] ? " checked" : ""}><span class="tog-sl"></span></label>
        </div>`).join("")}
    </div>
  </div>`;
}

// ── Modals ────────────────────────────────────────────────────────
function renderModals() {
  document.getElementById("modal-root").innerHTML = [
    modal("modal-new-event", "Novo evento", `
      <div class="form-row">
        <div class="fg"><label>Data</label><input type="date" id="ev-date"></div>
        <div class="fg"><label>Tipo</label><select id="ev-type">
          <option value="grupo">Grupo</option><option value="regional">Regional</option><option value="nacional">Nacional</option>
        </select></div>
      </div>
      <div class="fg"><label>Título</label><input id="ev-title"></div>
      <div class="fg"><label>Descrição (opcional)</label><textarea id="ev-desc" rows="2"></textarea></div>`,
      "add-event-btn", "Adicionar"),

    modal("modal-photo", "Adicionar foto", `
      <div class="notice" style="margin-bottom:14px"><i class="fas fa-circle-info"></i> O arquivo deve existir em <strong>images/</strong>. Exemplo: <code>images/galeria/foto.webp</code>.</div>
      <div class="form-row">
        <div class="fg"><label>Título</label><input id="ph-title"></div>
        <div class="fg"><label>Categoria</label><select id="ph-cat">
          ${["acampamento","atividade","evento","comunidade"].map(c => `<option value="${c}">${cap(c)}</option>`).join("")}
        </select></div>
      </div>
      <div class="fg"><label>Caminho (a partir de images/)</label><input id="ph-src" placeholder="images/galeria/foto.webp"></div>
      <div class="fg"><label>Legenda</label><input id="ph-caption"></div>`,
      "add-photo-btn", "Adicionar"),

    modal("modal-project", "Novo projeto", `
      <div class="form-row">
        <div class="fg"><label>Nome</label><input id="pr-nome"></div>
        <div class="fg"><label>Emoji</label><input id="pr-icon" value="🌟" style="max-width:80px"></div>
      </div>
      <div class="form-row">
        <div class="fg"><label>Status</label><select id="pr-status">
          <option value="planejado">Planejado</option><option value="ativo">Ativo</option><option value="concluido">Concluído</option>
        </select></div>
        <div class="fg"><label>Progresso (%)</label><input type="number" id="pr-prog" min="0" max="100" value="0"></div>
      </div>
      <div class="fg"><label>Tags / meta</label><input id="pr-meta"></div>
      <div class="fg"><label>Descrição</label><textarea id="pr-desc" rows="3"></textarea></div>`,
      "add-project-btn", "Criar"),

    modal("modal-activity", "Nova atividade", `
      <div class="form-row">
        <div class="fg"><label>Emoji</label><input id="at-icon" value="⭐" style="max-width:80px"></div>
        <div class="fg"><label>Título</label><input id="at-title"></div>
      </div>
      <div class="fg"><label>Descrição</label><textarea id="at-desc" rows="3"></textarea></div>`,
      "add-activity-btn", "Adicionar"),

    modal("modal-member", "Novo membro", `
      <div class="form-row">
        <div class="fg"><label>Nome completo</label><input id="mb-nome"></div>
        <div class="fg"><label>Ramo</label><select id="mb-ramo">
          ${["Filhotes","Lobinhos","Escoteiros","Seniores","Pioneiros"].map(b => `<option>${b}</option>`).join("")}
        </select></div>
      </div>
      <div class="form-row">
        <div class="fg"><label>Função</label><select id="mb-func"><option>Jovem</option><option>Monitor</option><option>Chefe</option></select></div>
        <div class="fg"><label>Ano de ingresso</label><input type="number" id="mb-ano" value="${new Date().getFullYear()}"></div>
      </div>
      <div class="fg"><label>Status</label><select id="mb-status">
        <option value="ativo">Ativo</option><option value="pendente">Pendente</option><option value="inativo">Inativo</option>
      </select></div>`,
      "add-member-btn", "Cadastrar"),
  ].join("");
}

function modal(id, title, body, confirmId, confirmLabel) {
  return `<div class="modal-overlay" id="${id}">
    <div class="modal-box">
      <div class="modal-head">
        <h3>${esc(title)}</h3>
        <button class="modal-close" data-close="${id}">×</button>
      </div>
      ${body}
      <div class="modal-foot">
        <button class="btn btn-sm" data-close="${id}">Cancelar</button>
        <button class="btn btn-sm btn-primary" id="${esc(confirmId)}">${esc(confirmLabel)}</button>
      </div>
    </div>
  </div>`;
}

// ── bindPage ──────────────────────────────────────────────────────
function bindPage(page) {
  if (page === "calendario") {
    renderCal();
    document.getElementById("add-event-btn")?.addEventListener("click", () => {
      const date = document.getElementById("ev-date")?.value;
      const title = document.getElementById("ev-title")?.value.trim();
      if (!date || !title) { toast("Preencha a data e o título do evento."); return; }
      STATE.adminPanel.events.push({
        id: uid("ev"), date, title,
        type: document.getElementById("ev-type")?.value || "grupo",
        description: document.getElementById("ev-desc")?.value.trim() || "",
      });
      closeModal("modal-new-event"); renderCal(); toast("Evento adicionado."); markDirty();
    });
  }
  if (page === "galeria") {
    document.querySelectorAll("[data-gal-filter]").forEach(btn =>
      btn.addEventListener("click", () => {
        GAL_FILTER = btn.dataset.galFilter;
        document.querySelectorAll("[data-gal-filter]").forEach(b => b.classList.toggle("btn-primary", b.dataset.galFilter === GAL_FILTER));
        renderGallery();
      })
    );
    renderGallery();
    document.getElementById("add-photo-btn")?.addEventListener("click", () => {
      const title = document.getElementById("ph-title")?.value.trim();
      const src   = normPath(document.getElementById("ph-src")?.value || "");
      if (!title) { toast("Preencha o título da foto."); return; }
      if (!src)   { toast("Informe o caminho da imagem."); return; }
      if (!isSafeImagePath(src)) { toast("Caminho inválido — use letras minúsculas, números, traço e barra."); return; }
      STATE.adminPanel.photos.push({ id: uid("ph"), title, category: document.getElementById("ph-cat")?.value || "atividade", src, caption: document.getElementById("ph-caption")?.value.trim() || title });
      closeModal("modal-photo"); renderGallery(); toast("Foto adicionada."); markDirty();
    });
  }
  if (page === "projetos") {
    renderProjetos();
    document.getElementById("add-project-btn")?.addEventListener("click", () => {
      const nome = document.getElementById("pr-nome")?.value.trim();
      if (!nome) { toast("Preencha o nome do projeto."); return; }
      STATE.adminPanel.projects.push({
        id: uid("pr"),
        title: nome,
        icon: document.getElementById("pr-icon")?.value || "🌟",
        status: document.getElementById("pr-status")?.value || "ativo",
        progress: Number(document.getElementById("pr-prog")?.value || 0),
        meta: document.getElementById("pr-meta")?.value.trim() || "",
        description: document.getElementById("pr-desc")?.value.trim() || "",
      });
      closeModal("modal-project"); renderProjetos(); toast("Projeto criado."); markDirty();
    });
  }
  if (page === "ramos") {
    document.querySelectorAll("[data-branch]").forEach(tab =>
      tab.addEventListener("click", () => {
        captureBranch();
        BRANCH = tab.dataset.branch;
        navigate("ramos");
      })
    );
    document.getElementById("ramo-save")?.addEventListener("click", doSave);
  }
  if (page === "atividades") {
    renderAtividades();
    document.getElementById("add-activity-btn")?.addEventListener("click", () => {
      const title = document.getElementById("at-title")?.value.trim();
      if (!title) { toast("Preencha o título da atividade."); return; }
      STATE.adminPanel.activities.push({ id: uid("at"), icon: document.getElementById("at-icon")?.value || "⭐", title, description: document.getElementById("at-desc")?.value.trim() || "" });
      closeModal("modal-activity"); renderAtividades(); toast("Atividade adicionada."); markDirty();
    });
  }
  if (page === "membros") {
    renderMembros();
    document.getElementById("member-search")?.addEventListener("input", renderMembros);
    document.getElementById("member-branch")?.addEventListener("change", renderMembros);
    document.getElementById("add-member-btn")?.addEventListener("click", () => {
      const nome = document.getElementById("mb-nome")?.value.trim();
      if (!nome) { toast("Preencha o nome do membro."); return; }
      STATE.adminPanel.members.push({
        id: uid("mb"), name: nome,
        branch: document.getElementById("mb-ramo")?.value || "Escoteiros",
        role:   document.getElementById("mb-func")?.value || "Jovem",
        since:  document.getElementById("mb-ano")?.value || String(new Date().getFullYear()),
        status: document.getElementById("mb-status")?.value || "ativo",
      });
      closeModal("modal-member"); renderMembros(); toast("Membro cadastrado."); markDirty();
    });
  }
  if (page === "paginas") initPaginasEditor();
}

// ── bindGlobal ────────────────────────────────────────────────────
function bindGlobal() {
  document.querySelectorAll("[data-open-modal]").forEach(btn =>
    btn.addEventListener("click", () => openModal(btn.dataset.openModal))
  );
  document.querySelectorAll("[data-close]").forEach(btn =>
    btn.addEventListener("click", () => closeModal(btn.dataset.close))
  );
  document.querySelectorAll(".modal-overlay").forEach(overlay =>
    overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(overlay.id); })
  );
  document.querySelectorAll("[data-nav]").forEach(btn =>
    btn.addEventListener("click", () => { captureCurrent(); PAGE = btn.dataset.nav; buildSidebar(); navigate(PAGE); })
  );
}

// ── Capture current page state ────────────────────────────────────
function captureCurrent() {
  if (PAGE === "ramos")   captureBranch();
  if (PAGE === "paginas") capturePaginasContent();
  if (PAGE === "contato") captureContato();
  if (PAGE === "config")  captureConfig();
}

function captureBranch() {
  const b = STATE.adminPanel.branches[BRANCH];
  if (!b) return;
  const nome = document.getElementById("ramo-nome"); if (nome) b.name = nome.value.trim();
  const idade = document.getElementById("ramo-idade"); if (idade) b.age = idade.value.trim();
  const d1 = document.getElementById("ramo-desc1"); if (d1) b.short = d1.value.trim();
  const d2 = document.getElementById("ramo-desc2"); if (d2) b.long  = d2.value.trim();
  const bl = document.getElementById("ramo-bullets"); if (bl) b.bullets = bl.value.split("\n").map(s => s.trim()).filter(Boolean);
}

function captureContato() {
  const c = STATE.adminPanel.contact;
  const f = id => document.getElementById(id);
  if (f("c-email"))    c.email          = f("c-email").value.trim();
  if (f("c-phone1"))   c.phonePrimary   = f("c-phone1").value.trim();
  if (f("c-phone2"))   c.phoneSecondary = f("c-phone2").value.trim();
  if (f("c-instagram")) c.instagram     = f("c-instagram").value.trim();
  if (f("c-schedule")) c.schedule       = f("c-schedule").value.trim();
  if (f("c-addr"))     c.address        = f("c-addr").value.trim();
  if (f("c-cep"))      c.cep            = f("c-cep").value.trim();
  if (f("c-city"))     c.cityState      = f("c-city").value.trim();
  if (f("c-maps"))     c.mapsSrc        = f("c-maps").value.trim();
}

function captureConfig() {
  const s = STATE.adminPanel.settings;
  const f = id => document.getElementById(id);
  if (f("cfg-short"))  s.shortName = f("cfg-short").value.trim();
  if (f("cfg-full"))   s.fullName  = f("cfg-full").value.trim();
  if (f("cfg-motto"))  s.motto     = f("cfg-motto").value.trim();
  if (f("cfg-founded")) s.founded  = f("cfg-founded").value.trim();
  if (f("cfg-slogan")) s.slogan    = f("cfg-slogan").value.trim();
  document.querySelectorAll("[data-vis]").forEach(el => {
    s.visibility[el.dataset.vis] = el.checked;
  });
}

// ── Save ──────────────────────────────────────────────────────────
async function doSave() {
  if (SAVING) return;
  captureCurrent();
  SAVING = true;
  setStatus("saving");
  try {
    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(STATE),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "save_failed");
    DIRTY = false;
    setStatus("ready");
    toast("Alterações salvas com sucesso.");
  } catch (err) {
    setStatus("error");
    toast(saveErrorMsg(err));
  } finally {
    SAVING = false;
  }
}

async function doLogout() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  location.href = "/login";
}

// ── Status / Toast ────────────────────────────────────────────────
function setStatus(mode) {
  const dot   = document.getElementById("status-dot");
  const label = document.getElementById("status-label");
  const btn   = document.getElementById("save-btn");
  const colors = { ready: "var(--c-green)", dirty: "var(--c-amber)", saving: "var(--c-blue)", error: "var(--c-red)" };
  const labels = { ready: "Pronto", dirty: "Alterações pendentes", saving: "Salvando…", error: "Falha ao salvar" };
  if (dot)   dot.style.background = colors[mode] || colors.ready;
  if (label) label.textContent    = labels[mode] || "Pronto";
  if (btn)   btn.classList.toggle("saving", mode === "saving");
}

function markDirty() {
  if (!DIRTY) { DIRTY = true; setStatus("dirty"); }
}

function toast(msg) {
  document.getElementById("toast-msg").textContent = msg;
  const t = document.getElementById("toast");
  t.classList.add("show");
  clearTimeout(TOAST_TIMER);
  TOAST_TIMER = setTimeout(() => t.classList.remove("show"), 2800);
}

// ── Modals open/close ─────────────────────────────────────────────
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.querySelectorAll("input,textarea").forEach(el => { el.value = el.defaultValue; });
  m.querySelectorAll("select").forEach(el => { el.selectedIndex = 0; });
  m.classList.add("open");
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("open");
}

// ── Item card component ───────────────────────────────────────────
function itemCard({ id, type, title, sub, badges, desc, fields, avatar, icon }) {
  const badgeHtml = (badges || []).filter(Boolean).map(b => `<span class="badge ${b.cls || "badge-gray"}">${esc(typeof b === "string" ? b : b.label)}</span>`).join("");
  const leftMedia = avatar
    ? `<div style="width:36px;height:36px;border-radius:var(--r-sm);background:${avatar.bg};color:${avatar.fg};display:grid;place-items:center;font-size:11px;font-weight:700;flex-shrink:0">${esc(avatar.initials)}</div>`
    : icon
    ? `<div style="font-size:18px;flex-shrink:0">${esc(icon)}</div>`
    : "";
  return `<div class="item-card" data-card="${type}:${id}">
    <div class="item-card-view" data-view>
      <div style="display:flex;gap:10px;align-items:flex-start;flex:1;min-width:0">
        ${leftMedia}
        <div style="flex:1;min-width:0">
          <div class="item-title">${esc(title)}</div>
          <div class="item-sub">${esc(sub || "")}</div>
          <div class="item-meta">${badgeHtml}</div>
          ${desc ? `<div class="item-desc">${esc(desc)}</div>` : ""}
        </div>
      </div>
      <div class="item-actions">
        <button class="btn btn-xs" data-edit-card="${type}:${id}"><i class="fas fa-pen"></i></button>
        <button class="btn btn-xs btn-danger" data-del-card="${type}:${id}"><i class="fas fa-trash"></i></button>
      </div>
    </div>
    <div class="item-edit-form" data-edit style="display:none">
      ${fields}
      <div class="item-edit-footer">
        <button class="btn btn-xs" data-cancel-card="${type}:${id}">Cancelar</button>
        <button class="btn btn-xs btn-primary" data-save-card="${type}:${id}"><i class="fas fa-floppy-disk"></i> Salvar</button>
      </div>
    </div>
  </div>`;
}

function bindItemCards(type, onSave, onDelete) {
  document.querySelectorAll(`[data-edit-card^="${type}:"]`).forEach(btn => {
    btn.addEventListener("click", () => toggleCard(type, btn.dataset.editCard.split(":")[1], true));
  });
  document.querySelectorAll(`[data-cancel-card^="${type}:"]`).forEach(btn => {
    btn.addEventListener("click", () => toggleCard(type, btn.dataset.cancelCard.split(":")[1], false));
  });
  document.querySelectorAll(`[data-save-card^="${type}:"]`).forEach(btn => {
    btn.addEventListener("click", () => { onSave(btn.dataset.saveCard.split(":")[1]); toggleCard(type, btn.dataset.saveCard.split(":")[1], false); });
  });
  document.querySelectorAll(`[data-del-card^="${type}:"]`).forEach(btn => {
    btn.addEventListener("click", () => onDelete(btn.dataset.delCard.split(":")[1]));
  });
}

function toggleCard(type, id, open) {
  const card = document.querySelector(`[data-card="${type}:${id}"]`);
  if (!card) return;
  card.classList.toggle("editing", open);
  const view = card.querySelector("[data-view]");
  const edit = card.querySelector("[data-edit]");
  if (view) view.style.display = open ? "none" : "grid";
  if (edit) edit.style.display = open ? "flex" : "none";
}

// ── State helpers ─────────────────────────────────────────────────
function normalizeContent(c) {
  return {
    pages: (c && typeof c.pages === "object") ? c.pages : {},
    adminPanel: (c && typeof c.adminPanel === "object") ? c.adminPanel : {},
  };
}

function ensureState() {
  const p = STATE.adminPanel;
  p.events = Array.isArray(p.events) ? p.events : [];
  p.photos = Array.isArray(p.photos) ? p.photos.map(normalizePhoto) : [];
  p.projects = Array.isArray(p.projects) ? p.projects : [];
  p.activities = Array.isArray(p.activities) ? p.activities : [];
  p.members = Array.isArray(p.members) ? p.members : [];
  p.branches = p.branches || {
    filhotes: { name: "Filhotes", age: "5 a 7 anos", short: "Primeiros passos no escotismo.", long: "", bullets: [] },
    lobinhos: { name: "Lobinhos", age: "7 a 10 anos", short: "Alcateia com amizade e responsabilidade.", long: "", bullets: [] },
    escoteiros: { name: "Escoteiros", age: "10 a 15 anos", short: "Sistema de patrulhas e autonomia crescente.", long: "", bullets: [] },
    seniores: { name: "Seniores", age: "15 a 18 anos", short: "Desafios intensos e protagonismo juvenil.", long: "", bullets: [] },
    pioneiros: { name: "Pioneiros", age: "18 a 22 anos", short: "Serviço ao próximo e projeto de vida.", long: "", bullets: [] },
  };
  p.contact = p.contact || { email: "", phonePrimary: "", phoneSecondary: "", instagram: "", schedule: "", address: "", cep: "", cityState: "", mapsSrc: "" };
  p.settings = p.settings || {
    shortName: "GEAR 9º DF",
    fullName: "Grupo Escoteiro do Ar Salgado Filho",
    motto: "Sempre Alerta para Servir",
    founded: "1971",
    slogan: "",
    visibility: { gallery: true, projects: true, calendar: true, championBadge: true, contactForm: true },
  };
  if (!p.settings.visibility) p.settings.visibility = { gallery: true, projects: true, calendar: true, championBadge: true, contactForm: true };
  STATE.adminPanel = p;
}

function ensurePageState(page) {
  if (!STATE.pages[page] || typeof STATE.pages[page] !== "object") STATE.pages[page] = { text: {}, images: {}, sections: {}, extras: [] };
  const s = STATE.pages[page];
  s.text    = (s.text    && typeof s.text    === "object") ? s.text    : {};
  s.images  = (s.images  && typeof s.images  === "object") ? s.images  : {};
  s.sections= (s.sections&& typeof s.sections=== "object") ? s.sections: {};
  s.extras  = Array.isArray(s.extras) ? s.extras : [];
  return s;
}

function normalizePhoto(p) {
  return { id: p.id || uid("ph"), title: String(p.title || "").trim(), category: String(p.category || "atividade").toLowerCase(), caption: String(p.caption || p.title || "").trim(), src: normPath(p.src || "") };
}

// ── Utility ───────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function uid(prefix) { return `${prefix}-${Math.random().toString(36).slice(2,9)}`; }
function cap(s) { return String(s||"").charAt(0).toUpperCase() + String(s||"").slice(1); }
function hashStr(s) { return String(s||"").split("").reduce((a,c) => (((a<<5)-a)+c.charCodeAt(0))|0,0)>>>0; }
function initials(name) { return String(name||"").trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()||"").join("") || "??"; }
function normPath(s) { return String(s||"").trim().replace(/\\/g,"/").replace(/^\/+/,""); }
function isSafeImagePath(s) { return /^[a-z0-9/_\-.]+$/.test(normPath(s)) && GALLERY_EXTENSIONS.includes(normPath(s).split(".").pop()?.toLowerCase()); }
function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function fmtDate(s) { if (!s) return ""; const [y,m,d] = String(s).split("-"); return `${d}/${m}/${y}`; }
function typeColor(t) { return t==="regional"?"var(--c-amber)":t==="nacional"?"var(--c-red)":"var(--c-green)"; }
function badgeForType(t) { return t==="regional"?"badge-amber":t==="nacional"?"badge-red":"badge-green"; }
function saveErrorMsg(err) { const m = String(err?.message||""); if(m.includes("unauthorized")||m.includes("forbidden")||m.includes("401")||m.includes("403")) return "Sessão expirada. Faça login novamente."; return "Não foi possível salvar. Verifique os campos e tente novamente."; }
function cssescape(s) { return (window.CSS?.escape?.(s)) ?? String(s).replace(/["\\]/g,"\\$&"); }
function val(sel, fallback="") { const el = document.querySelector(sel); return el ? el.value.trim() : fallback; }

async function apiFetch(url, opts={}) {
  const res = await fetch(url, { cache:"no-store", ...opts, headers: { Accept:"application/json", ...(opts.headers||{}) } });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || `http_${res.status}`);
  return data;
}
