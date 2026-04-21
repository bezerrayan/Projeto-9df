// ── Constants ────────────────────────────────────────────────────
const NAV = [
  { section: "Principal",  id: "dashboard",    icon: "fa-gauge",           label: "Dashboard" },
  { section: "Principal",  id: "calendario",   icon: "fa-calendar-days",   label: "Calendário" },
  { section: "Principal",  id: "noticias",     icon: "fa-newspaper",       label: "Notícias" },
  { section: "Principal",  id: "galeria",       icon: "fa-images",          label: "Galeria" },
  { section: "Principal",  id: "projetos",      icon: "fa-hands-helping",   label: "Projetos" },
  { section: "Principal",  id: "ramos",         icon: "fa-layer-group",     label: "Ramos" },
  { section: "Principal",  id: "atividades",    icon: "fa-star",            label: "Atividades" },
  { section: "Principal",  id: "membros",       icon: "fa-users",           label: "Membros" },
  { section: "Principal",  id: "documentos",    icon: "fa-file-pdf",        label: "Documentos" },
  { section: "Páginas",    id: "paginas",       icon: "fa-pen-ruler",       label: "Conteúdo do site" },
  { section: "Páginas",    id: "links",         icon: "fa-link",            label: "Links Úteis" },
  { section: "Sistema",    id: "mensagens",     icon: "fa-inbox",           label: "Mensagens" },
  { section: "Sistema",    id: "contato",       icon: "fa-envelope",        label: "Contato" },
  { section: "Sistema",    id: "config",        icon: "fa-sliders",         label: "Configurações" },
];

const PAGE_META = {
  "index.html":      { icon: "fa-house",        label: "Home",        desc: "Hero, avisos e chamadas principais." },
  "sobre.html":      { icon: "fa-circle-info",  label: "Sobre",       desc: "Apresentação institucional e história." },
  "atividades.html": { icon: "fa-star",          label: "Atividades",  desc: "Atividades em destaque." },
  "galeria.html":    { icon: "fa-images",        label: "Galeria",     desc: "Textos e imagens da galeria." },
  "noticias.html":   { icon: "fa-newspaper",     label: "Notícias",    desc: "Atualizações e destaques do grupo." },
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
const EDITABLE_TEXT_SELECTOR = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "li", "label", "button", "a",
  ".eyebrow", ".btn", ".text-link", ".mini-link-pill",
  ".notice-tag", ".chip", ".badge", ".hero-motto",
  ".section-label", ".floating-card strong", ".hero-stats strong", ".hero-stats span",
  "[data-subject-toggle-label]", "[data-subject-option]",
].join(",");
const EDITABLE_ATTRS = [
  { selector: "a[href]", attr: "href", title: "Destino do link" },
  { selector: "iframe[src]", attr: "src", title: "Fonte do iframe/mapa" },
  { selector: "input[placeholder]", attr: "placeholder", title: "Placeholder do campo" },
  { selector: "textarea[placeholder]", attr: "placeholder", title: "Placeholder do campo" },
  { selector: "button[data-subject-option]", attr: "data-subject-option", title: "Valor enviado do assunto" },
  { selector: "[aria-label]", attr: "aria-label", title: "Texto de acessibilidade" },
];

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
let DOCUMENTS_IMPORTED_FROM_PUBLIC = false;
const SCHEMA_CACHE = {};

// ── Boot ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", boot);

async function boot() {
  const token = localStorage.getItem("gear9df_token");
  // Redireciona se não houver token (login.html na Hostinger)
  if (!token) { location.href = "login.html"; return; }

  try {
    const session = await window.apiFetch("/auth/session");
    setUserInfo(session.email || localStorage.getItem("gear9df_user") || "Admin");
    document.getElementById("logout-btn").addEventListener("click", doLogout);
    document.getElementById("save-btn").addEventListener("click", () => doSave());
    document.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); doSave(); } });
    document.getElementById("content-area").addEventListener("input", markDirty);
    document.addEventListener("input", (e) => {
      const input = e.target.closest("[data-media-kind]");
      if (input) syncMediaPreview(input);
    });

    // Event delegation global para upload de imagens/docs (.img-upload-trigger)
    document.addEventListener("change", async (e) => {
      const fileInput = e.target.closest(".img-upload-trigger");
      if (!fileInput || !fileInput.files?.length) return;

      const targetId  = fileInput.dataset.targetId;
      const targetSel = fileInput.dataset.targetSel;
      const statusId  = fileInput.dataset.statusId;
      const endpoint  = fileInput.dataset.uploadEndpoint || "/admin/upload/image";
      const fieldName = fileInput.dataset.fieldName || "image";
      const previewId = fileInput.dataset.previewId;

      const target   = targetId  ? document.getElementById(targetId)  : (targetSel ? document.querySelector(targetSel) : null);
      const statusEl = statusId  ? document.getElementById(statusId)  : null;

      try {
        const formData = new FormData();
        formData.append(fieldName, fileInput.files[0]);
        if (statusEl) { statusEl.textContent = "⏳ Enviando…"; statusEl.style.color = "var(--c-ink-2)"; }
        toast("Enviando arquivo…");
        const data = await window.apiFetch(endpoint, { method: "POST", body: formData });
        if (target) {
          target.value = data.path;
          syncMediaPreview(target);
        }
        if (previewId) {
          const img = document.getElementById(previewId);
          if (img) img.src = data.path;
        }
        if (statusEl) { statusEl.textContent = "✓ Upload concluído"; statusEl.style.color = "var(--c-green)"; }
        toast("Arquivo enviado com sucesso!");
        markDirty();
        fileInput.value = "";
      } catch (err) {
        console.error('[FRONTEND UPLOAD ERROR]', err);
        const errorMsg = err.message || "Erro desconhecido";
        if (statusEl) { 
          statusEl.textContent = `✗ Falha: ${errorMsg}`; 
          statusEl.style.color = "#ef4444"; 
        }
        toast(`Falha no upload: ${errorMsg}`, "error");
      }
    });
    
    // Rota corrigida no novo backend
    STATE = normalizeContent(await window.apiFetch("/content/admin"));
    ensureState();
    buildSidebar();
    navigate(PAGE);
  } catch (err) {
    console.error("Boot error:", err);
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
  if (!nav) return;
  const sections = {};
  NAV.forEach(item => {
    sections[item.section] = sections[item.section] || [];
    sections[item.section].push(item);
  });
  
  nav.innerHTML = Object.entries(sections).map(([sec, items]) => `
    <div class="sb-section-label">${esc(sec)}</div>
    ${items.map(item => `
      <div class="sb-item${item.id === PAGE ? " active" : ""}" data-page="${item.id}">
        <i class="fas ${item.icon}"></i>
        <span>${esc(item.label)}</span>
      </div>
    `).join("")}
  `).join("");

  nav.querySelectorAll(".sb-item").forEach(el =>
    el.addEventListener("click", () => {
      captureCurrent();
      PAGE = el.dataset.page;
      buildSidebar();
      navigate(PAGE);
    })
  );
}

// ── Navigation ────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: ["Dashboard", "Visão geral do grupo"],
  calendario: ["Calendário", "Agenda de eventos e atividades"],
  galeria: ["Galeria", "Fotos para o site público"],
  noticias: ["Notícias", "Destaques, avisos e novidades do grupo"],
  projetos: ["Projetos", "Projetos e frentes especiais"],
  ramos: ["Ramos", "Apresentação das seções por faixa etária"],
  atividades: ["Atividades", "Vivências em destaque no site"],
  membros: ["Membros", "Cadastro interno da equipe"],
  documentos: ["Documentos", "Upload de PDFs, regimentos e matrizes"],
  paginas: ["Conteúdo do site", "Edite textos e imagens por página"],
  links: ["Links Úteis", "Adicione atalhos para sistemas regionais ou lojinha"],
  mensagens: ["Mensagens", "Mensagens recebidas pelo formulário de contato"],
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
  if (page === "noticias")   return tplNoticias();
  if (page === "galeria")    return tplGaleria();
  if (page === "projetos")   return tplProjetos();
  if (page === "ramos")      return tplRamos();
  if (page === "atividades") return tplAtividades();
  if (page === "membros")    return tplMembros();
  if (page === "documentos") return tplDocumentos();
  if (page === "paginas")    return tplPaginas();
  if (page === "links")      return tplLinks();
  if (page === "mensagens")  return tplMensagens();
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
  <div class="hero-banner" style="background: linear-gradient(135deg, var(--c-sidebar) 0%, #1e293b 100%); padding: 40px; border-radius: var(--r-lg); margin-bottom: 32px; box-shadow: var(--sh-md);">
    <h2 style="font-size: 2rem; margin-bottom: 16px;">Bem-vindo ao Painel do 9º DF</h2>
    <p style="font-size: 1.1rem; opacity: 0.9; max-width: 800px;">Gerencie todo o conteúdo do site e as rotinas do grupo em um ambiente centralizado e intuitivo.</p>
    <div class="hero-actions" style="margin-top: 24px;">
      <button class="btn btn-primary" data-nav="paginas"><i class="fas fa-edit"></i> Editar Site</button>
      <button class="btn btn-ghost" data-nav="calendario" style="background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: #fff;"><i class="fas fa-calendar-alt"></i> Ver Agenda</button>
    </div>
  </div>

  <div class="grid-3" style="margin-bottom: 32px;">
    ${statTile("Membros Ativos", ativos, "atualmente no grupo", "fa-users", "blue")}
    ${statTile("Eventos no Mês", eventos, `${MONTHS[CAL_MONTH]} de ${CAL_YEAR}`, "fa-calendar-check", "green")}
    ${statTile("Projetos em Curso", projAbertos, "em andamento", "fa-tasks", "amber")}
  </div>

  <div class="grid-2">
    <div class="card" style="padding: 24px;">
      <div class="card-head" style="margin-bottom: 20px;">
        <div>
          <div class="card-title" style="font-size: 1.2rem;">Próximos Eventos</div>
          <div class="card-desc" style="font-size: 0.9rem;">Agenda imediata do grupo</div>
        </div>
        <button class="btn btn-ghost btn-xs" data-nav="calendario"><i class="fas fa-arrow-right"></i></button>
      </div>
      ${dashboardEvents()}
    </div>
    <div class="card" style="padding: 24px;">
      <div class="card-head" style="margin-bottom: 20px;">
        <div>
          <div class="card-title" style="font-size: 1.2rem;">Efetivo por Ramo</div>
          <div class="card-desc" style="font-size: 0.9rem;">Distribuição de membros</div>
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
    <p>Gerencie as imagens do site com upload direto ou colando uma URL, sempre com pré-visualização antes de salvar.</p>
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
      const previewId = `pe-preview-${p.id}`;
      const statusId = `pe-status-${p.id}`;
      area.innerHTML = `<div class="card" style="margin-top:0; border: 2px solid var(--c-blue); box-shadow: var(--sh-md);">
        <div class="card-title" style="margin-bottom:12px; font-weight: 700;">Editando Imagem</div>
        <div class="form-row">
          <div class="fg"><label>Título</label><input id="pe-title" value="${esc(p.title)}"></div>
          <div class="fg"><label>Categoria</label><select id="pe-cat">
            ${["acampamento","atividade","evento","comunidade"].map(c => `<option value="${c}"${p.category===c?" selected":""}>${cap(c)}</option>`).join("")}
          </select></div>
        </div>
        ${renderImagePicker({
          label: "Imagem da galeria",
          value: p.src,
          previewId,
          statusId,
          uploadAttrs: `data-target-id="pe-src"`,
          inputHtml: `<div class="fg"><label>Caminho da imagem</label><input id="pe-src" data-media-kind="image" data-preview-id="${previewId}" value="${esc(p.src)}" placeholder="Envie uma imagem ou cole a URL"></div>`,
        })}
        <div class="fg"><label>Legenda</label><input id="pe-caption" value="${esc(p.caption)}"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px;">
          <button class="btn btn-sm btn-ghost" id="pe-cancel">Cancelar</button>
          <button class="btn btn-sm btn-primary" id="pe-save">Salvar Alterações</button>
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
        title: `${p.icon || "🌟"} ${p.title}`, sub: p.category || p.meta || "",
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
              ${["planejado","ativo","concluido"].map(s => `<option value="${s}"${p.status===s?" selected":""}>` + cap(s) + `</option>`).join("")}
            </select></div>
            <div class="fg"><label>Progresso (%)</label><input type="number" min="0" max="100" data-proj-progress="${p.id}" value="${esc(String(p.progress||0))}"></div>
          </div>
          <div class="form-row">
            <div class="fg"><label>Categoria</label><input data-proj-cat="${p.id}" value="${esc(p.category||p.meta||"")}"></div>
            <div class="fg"><label>Tags / meta</label><input data-proj-meta="${p.id}" value="${esc(p.meta||"")}"></div>
          </div>
          ${renderImagePicker({
            label: "Imagem do projeto",
            value: p.src || "",
            previewId: `proj-preview-${p.id}`,
            statusId: `proj-status-${p.id}`,
            uploadAttrs: `data-target-id="proj-src-${p.id}"`,
            inputHtml: `<div class="fg"><label>Caminho da imagem</label><input id="proj-src-${p.id}" data-proj-src="${p.id}" data-media-kind="image" data-preview-id="proj-preview-${p.id}" value="${esc(p.src||"")}" placeholder="Envie uma imagem ou cole a URL"></div>`,
          })}
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
    p.category = val(`[data-proj-cat="${id}"]`, p.category);
    p.meta     = val(`[data-proj-meta="${id}"]`, p.meta);
    p.src      = val(`[data-proj-src="${id}"]`, p.src);
    p.description = val(`[data-proj-desc="${id}"]`, p.description);
    renderProjetos(); toast("Projeto atualizado."); markDirty();
  }, id => {
    STATE.adminPanel.projects = STATE.adminPanel.projects.filter(p => p.id !== id);
    renderProjetos(); toast("Projeto removido."); markDirty();
  });
}

function tplNoticias() {
  return `
  <div class="hero-banner">
    <h2>Notícias</h2>
    <p>Publique destaques, chamadas e novidades do grupo para a home e para a página de notícias.</p>
    <div class="hero-actions">
      <button class="btn btn-primary btn-sm" data-open-modal="modal-news"><i class="fas fa-newspaper"></i> Nova notícia</button>
    </div>
  </div>
  <div class="card">
    <div class="card-head">
      <div class="card-title">Notícias publicadas</div>
    </div>
    <div id="noticias-list" class="items-list"></div>
  </div>`;
}

function renderNoticias() {
  const list = document.getElementById("noticias-list");
  if (!list) return;

  const rows = STATE.adminPanel.news.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  list.innerHTML = rows.length
    ? rows.map(n => itemCard({
        id: n.id,
        type: "news",
        title: n.title,
        sub: n.date ? fmtDate(n.date) : "Sem data",
        badges: [
          { label: n.tag || "Notícia", cls: "badge-blue" },
          n.featured ? { label: "Destaque", cls: "badge-amber" } : null,
        ].filter(Boolean),
        desc: n.summary,
        icon: "fa-newspaper",
        fields: `
          <div class="form-row">
            <div class="fg"><label>Título</label><input data-news-title="${n.id}" value="${esc(n.title)}"></div>
            <div class="fg"><label>Tag</label><input data-news-tag="${n.id}" value="${esc(n.tag || "Notícia")}"></div>
          </div>
          <div class="form-row">
            <div class="fg"><label>Data</label><input type="date" data-news-date="${n.id}" value="${esc(n.date || "")}"></div>
            <div class="fg"><label>Destaque principal</label><select data-news-featured="${n.id}">
              <option value="false"${n.featured ? "" : " selected"}>Não</option>
              <option value="true"${n.featured ? " selected" : ""}>Sim</option>
            </select></div>
          </div>
          ${renderImagePicker({
            label: "Imagem da notícia",
            value: n.src || "",
            previewId: `news-preview-${n.id}`,
            statusId: `news-status-${n.id}`,
            uploadAttrs: `data-target-id="news-src-${n.id}"`,
            inputHtml: `<div class="fg"><label>Caminho da imagem</label><input id="news-src-${n.id}" data-news-src="${n.id}" data-media-kind="image" data-preview-id="news-preview-${n.id}" value="${esc(n.src || "")}" placeholder="Envie uma imagem ou cole a URL"></div>`,
          })}
          <div class="fg"><label>Resumo curto</label><textarea rows="2" data-news-summary="${n.id}">${esc(n.summary || "")}</textarea></div>
          <div class="fg"><label>Texto da notícia</label><textarea rows="6" data-news-body="${n.id}">${esc(n.body || "")}</textarea></div>`,
      })).join("")
    : `<div class="empty-state"><i class="fas fa-newspaper"></i><p>Nenhuma notícia cadastrada.</p></div>`;

  bindItemCards("news", id => {
    const n = STATE.adminPanel.news.find(x => x.id === id);
    if (!n) return;
    n.title = val(`[data-news-title="${id}"]`, n.title);
    n.tag = val(`[data-news-tag="${id}"]`, n.tag);
    n.date = val(`[data-news-date="${id}"]`, n.date);
    n.src = val(`[data-news-src="${id}"]`, n.src);
    n.summary = val(`[data-news-summary="${id}"]`, n.summary);
    n.body = val(`[data-news-body="${id}"]`, n.body);
    n.featured = val(`[data-news-featured="${id}"]`, String(n.featured)) === "true";
    if (n.featured) {
      STATE.adminPanel.news.forEach(item => {
        if (item.id !== id) item.featured = false;
      });
    }
    renderNoticias(); toast("Notícia atualizada."); markDirty();
  }, id => {
    STATE.adminPanel.news = STATE.adminPanel.news.filter(n => n.id !== id);
    renderNoticias(); toast("Notícia removida."); markDirty();
  });
}

// ── Template: Ramos ───────────────────────────────────────────────
function tplRamos() {
  const branch = STATE.adminPanel.branches[BRANCH];
  const imgs = branch.images || {};
  function imgField(label, id, key) {
    return renderImagePicker({
      label,
      value: imgs[key] || "",
      previewId: `${id}-preview`,
      statusId: `${id}-status`,
      uploadAttrs: `data-target-id="${id}"`,
      inputHtml: `<div class="fg"><label>Caminho da imagem</label><input id="${id}" data-media-kind="image" data-preview-id="${id}-preview" value="${esc(imgs[key]||"")}" placeholder="Envie uma imagem ou cole a URL"></div>`,
    });
  }
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
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--c-border)">
      <div style="font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--c-ink-3);margin-bottom:12px">Imagens do ramo</div>
      <div class="form-row">
        ${imgField('Foto principal', 'ramo-img-main', 'main')}
        ${imgField('Logo / Badge', 'ramo-img-badge', 'badge')}
      </div>
      <div class="form-row">
        ${imgField('Miniatura 1', 'ramo-img-thumb1', 'thumb1')}
        ${imgField('Miniatura 2', 'ramo-img-thumb2', 'thumb2')}
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:16px">
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
        title: `${a.icon || "⭐"} ${a.title}`, sub: a.category || "Destaque no site",
        badges: [
          ...(a.category ? [{ label: a.category, cls: "badge-gray" }] : []),
          ...(a.meta ? [{ label: a.meta, cls: "badge-blue" }] : []),
        ],
        desc: a.description,
        fields: `
          <div class="form-row">
            <div class="fg"><label>Emoji</label><input data-ativ-icon="${a.id}" value="${esc(a.icon||"⭐")}" style="max-width:80px"></div>
            <div class="fg"><label>Título</label><input data-ativ-title="${a.id}" value="${esc(a.title)}"></div>
          </div>
          <div class="fg"><label>Categoria</label><input data-ativ-cat="${a.id}" value="${esc(a.category||"")}"></div>
          <div class="fg"><label>Especificação curta</label><input data-ativ-meta="${a.id}" value="${esc(a.meta||"")}" placeholder="ex: Aventura ao ar livre, liderança, trabalho em equipe"></div>
          ${renderImagePicker({
            label: "Imagem da atividade",
            value: a.src || "",
            previewId: `at-preview-${a.id}`,
            statusId: `at-status-${a.id}`,
            uploadAttrs: `data-target-id="at-src-${a.id}"`,
            inputHtml: `<div class="fg"><label>Caminho da imagem</label><input id="at-src-${a.id}" data-ativ-src="${a.id}" data-media-kind="image" data-preview-id="at-preview-${a.id}" value="${esc(a.src||"")}" placeholder="Envie uma imagem ou cole a URL"></div>`,
            helper: "Essa imagem vai aparecer na vitrine pública de atividades.",
          })}
          <div class="fg"><label>Descrição</label><textarea rows="3" data-ativ-desc="${a.id}">${esc(a.description||"")}</textarea></div>`,
      })).join("")
    : `<div class="empty-state"><i class="fas fa-star"></i><p>Nenhuma atividade cadastrada.</p></div>`;
  bindItemCards("activity", id => {
    const a = STATE.adminPanel.activities.find(x => x.id === id);
    if (!a) return;
    a.icon = val(`[data-ativ-icon="${id}"]`, a.icon) || "⭐";
    a.title = val(`[data-ativ-title="${id}"]`, a.title);
    a.category = val(`[data-ativ-cat="${id}"]`, a.category);
    a.meta = val(`[data-ativ-meta="${id}"]`, a.meta);
    a.src = val(`[data-ativ-src="${id}"]`, a.src);
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
          avatar: { bg, fg, initials: initials(m.name) },
          fields: `
            <div class="form-row">
              <div class="fg"><label>Nome</label><input data-mb-nome="${m.id}" value="${esc(m.name)}"></div>
              <div class="fg"><label>Ramo</label><select data-mb-ramo="${m.id}">
                ${["Filhotes","Lobinhos","Escoteiros","Seniores","Pioneiros"].map(b => `<option${m.branch===b?" selected":""}>${b}</option>`).join("")}
              </select></div>
            </div>
            <div class="form-row">
              <div class="fg"><label>Função</label><select data-mb-func="${m.id}">
                ${["Jovem","Monitor","Chefe"].map(r => `<option${m.role===r?" selected":""}>${r}</option>`).join("")}
              </select></div>
              <div class="fg"><label>Ingresso</label><input type="number" data-mb-ano="${m.id}" value="${esc(m.since)}"></div>
            </div>
            <div class="fg"><label>Status</label><select data-mb-status="${m.id}">
              ${["ativo","pendente","inativo"].map(s => `<option value="${s}"${m.status===s?" selected":""}>${cap(s)}</option>`).join("")}
            </select></div>`,
        });
      }).join("")
    : `<div class="empty-state"><i class="fas fa-users"></i><p>${search || branch ? "Nenhum resultado." : "Nenhum membro cadastrado."}</p></div>`;
  bindItemCards("member", id => {
    captureCurrent();
    renderMembros(); toast("Membro atualizado."); markDirty();
  }, id => {
    STATE.adminPanel.members = STATE.adminPanel.members.filter(m => m.id !== id);
    renderMembros(); toast("Membro removido."); markDirty();
  });
}

// ── Template: Páginas do site ─────────────────────────────────────
function tplPaginas() {
  const meta = PAGE_META[CONTENT_PAGE] || { label: "Página", icon: "fa-file", desc: "" };
  const pageIndex = PUBLIC_PAGES.indexOf(CONTENT_PAGE) + 1;
  return `
  <div class="hero-banner">
    <h2>Conteúdo do site</h2>
    <p>Edite textos e imagens por página sem precisar mexer no código-fonte.</p>
    <p style="opacity:.8; margin-top: 8px;">Escolha a página, envie imagens com pré-visualização e salve tudo no topo quando terminar.</p>
    <div class="hero-actions">
      <a class="btn btn-sm" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);color:#fff" href="/${CONTENT_PAGE}" target="_blank" rel="noreferrer"><i class="fas fa-arrow-up-right-from-square"></i> Ver página</a>
    </div>
  </div>
  <div class="content-workspace">
    <div class="content-guide">
      <div class="guide-card">
        <div class="guide-step">1</div>
        <div><strong>Escolha a página</strong><span>Use os cartões abaixo para alternar entre Home, Sobre, Contato e outras áreas do site.</span></div>
      </div>
      <div class="guide-card">
        <div class="guide-step">2</div>
        <div><strong>Edite com segurança</strong><span>Textos podem ser alterados livremente e imagens agora aceitam upload com pré-visualização.</span></div>
      </div>
      <div class="guide-card">
        <div class="guide-step">3</div>
        <div><strong>Confira e publique</strong><span>Abra a página em nova aba para revisar o resultado antes de salvar e publicar.</span></div>
      </div>
    </div>
    <div class="page-overview">
      <div class="card page-summary">
        <div class="page-summary-top">
          <div class="page-summary-title">
            <div class="page-summary-icon"><i class="fas ${meta.icon}"></i></div>
            <div>
              <strong>${esc(meta.label)}</strong>
              <span>${esc(meta.desc)}</span>
            </div>
          </div>
          <span class="badge badge-blue">Página ${pageIndex} de ${PUBLIC_PAGES.length}</span>
        </div>
        <div class="page-meta-pills">
          <span class="meta-pill"><i class="fas fa-font"></i> Textos guiados</span>
          <span class="meta-pill"><i class="fas fa-image"></i> Upload com preview</span>
          <span class="meta-pill"><i class="fas fa-floppy-disk"></i> Salvar no topo</span>
        </div>
      </div>
      <div class="content-actions">
        <div class="content-tip-card">
          <strong>Dica rápida</strong>
          <p>Se uma imagem não estiver boa, clique em "Enviar imagem", aguarde o status ficar verde e então use "Ver página" para conferir.</p>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">Páginas disponíveis</div>
          <div class="card-desc">Clique em qualquer cartão para editar aquela página.</div>
        </div>
      </div>
      <div class="page-tabs-grid" id="page-tabs">
        ${PUBLIC_PAGES.map(p => {
          const m = PAGE_META[p];
          return `<button class="page-tab-card${p === CONTENT_PAGE ? " active" : ""}" data-page-tab="${p}">
            <div class="page-tab-icon"><i class="fas ${m.icon}"></i></div>
            <strong>${esc(m.label)}</strong>
            <span>${esc(m.desc)}</span>
          </button>`;
        }).join("")}
      </div>
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
    const attrs = getFeaturedEntries(CONTENT_PAGE, schema.attrs || [], false);
    wrap.innerHTML = `
      <div style="margin-bottom:15px;">
        <div class="notice notice-info">
          <i class="fas fa-info-circle"></i>
          <strong>DICA de edição:</strong> os campos abaixo são ligados diretamente ao site. Para trocar uma imagem, use o botão de upload; para limpar um conteúdo, deixe o campo vazio e salve.
        </div>
      </div>
      <div class="editor-grid">
        <div class="editor-column">
          <div class="card">
            <div class="section-title-wrap">
              <div>
                <div class="card-title">Textos principais</div>
                <p class="section-caption">Frases e descrições que aparecem com maior destaque nessa página.</p>
              </div>
              <span class="badge badge-blue">${texts.length}</span>
            </div>
          ${texts.length
            ? texts.map((f, idx) => `<div class="text-field-card" style="margin-bottom:14px">
                <div class="field-kicker">Campo ${idx + 1}</div>
                <div class="fg" style="margin-top:12px">
                  <label>${esc(f.title)}</label>
                  <textarea data-site-text="${esc(f.key)}" rows="${Math.max(2, Math.min(6, (f.value || "").split("\n").length + 1))}">${esc(pState.text[f.key] ?? f.value)}</textarea>
                </div>
                <div class="field-hint">${esc(f.hint)}</div>
              </div>`).join("")
            : `<div class="empty-state"><i class="fas fa-font"></i><p>Nenhum campo identificado.</p></div>`}
          </div>
        </div>
        <div class="editor-column">
          <div class="card">
            <div class="section-title-wrap">
              <div>
                <div class="card-title">Imagens</div>
                <p class="section-caption">Envie uma imagem e confira o preview antes de salvar.</p>
              </div>
              <span class="badge badge-blue">${images.length}</span>
            </div>
            <div class="image-stack">
          ${images.length
            ? images.map((f, idx) => {
                const ov = pState.images[f.key] || {};
                const inputId = `page-input-${hashStr(`${CONTENT_PAGE}-${f.key}`)}`;
                const previewId = `page-preview-${hashStr(`${CONTENT_PAGE}-${f.key}`)}`;
                const statusId = `page-status-${hashStr(`${CONTENT_PAGE}-${f.key}`)}`;
                return `<div class="image-field-card${idx === 0 ? " primary" : ""}">
                  ${renderImagePicker({
                    label: f.title,
                    value: ov.src ?? f.src,
                    previewId,
                    statusId,
                    uploadAttrs: `data-target-id="${inputId}"`,
                    inputHtml: `<div class="fg"><label>Caminho da imagem</label><input id="${inputId}" data-site-img-src="${esc(f.key)}" data-media-kind="image" data-preview-id="${esc(previewId)}" value="${esc(ov.src ?? f.src)}" placeholder="Envie uma imagem ou cole a URL"></div>`,
                    altHtml: `<div class="fg"><label>Texto alternativo</label><input data-site-img-alt="${esc(f.key)}" value="${esc(ov.alt ?? f.alt)}" placeholder="Descreva a imagem para acessibilidade"></div>`,
                    helper: esc(f.hint),
                  })}
                </div>`;
              }).join("")
            : `<div class="empty-state"><i class="fas fa-image"></i><p>Nenhuma imagem identificada.</p></div>`}
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="section-title-wrap">
          <div>
            <div class="card-title">Links, botões e campos especiais</div>
            <p class="section-caption">Destinos de botões, links externos, mapa incorporado e textos de placeholder.</p>
          </div>
          <span class="badge badge-blue">${attrs.length}</span>
        </div>
        <div class="editor-grid">
          ${attrs.length
            ? attrs.map((f, idx) => `<div class="text-field-card" style="margin-bottom:14px">
                <div class="field-kicker">Campo especial ${idx + 1}</div>
                <div class="fg" style="margin-top:12px">
                  <label>${esc(f.title)}</label>
                  <input data-site-attr="${esc(f.key)}" value="${esc((pState.attrs && pState.attrs[f.key]) ?? f.value)}">
                </div>
                <div class="field-hint">${esc(f.hint)}</div>
              </div>`).join("")
            : `<div class="empty-state"><i class="fas fa-link"></i><p>Nenhum link ou campo especial identificado.</p></div>`}
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
      ${renderImagePicker({
        label: "Imagem do bloco",
        value: ex.imageSrc,
        previewId: `extra-preview-${esc(ex.id)}`,
        statusId: `extra-status-${esc(ex.id)}`,
        uploadAttrs: `data-target-id="extra-input-${esc(ex.id)}"`,
        inputHtml: `<div class="fg"><label>Caminho da imagem</label><input id="extra-input-${esc(ex.id)}" data-extra-img-src data-media-kind="image" data-preview-id="extra-preview-${esc(ex.id)}" value="${esc(ex.imageSrc)}" placeholder="Envie uma imagem ou cole a URL"></div>`,
        altHtml: `<div class="fg"><label>Alt da imagem</label><input data-extra-img-alt value="${esc(ex.imageAlt)}" placeholder="Descreva a imagem"></div>`,
      })}
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
  const schema = SCHEMA_CACHE[CONTENT_PAGE] || { texts: [], images: [], attrs: [] };
  const ps = ensurePageState(CONTENT_PAGE);
  const nextText = {};
  schema.texts.forEach(f => {
    const el = document.querySelector(`[data-site-text="${cssescape(f.key)}"]`);
    if (!el) return;
    const v = el.value.trim();
    // salva sempre, até vazio, para permitir limpar conteúdo
    nextText[f.key] = v;
  });
  ps.text = nextText;
  const nextImages = {};
  schema.images.forEach(f => {
    const src = document.querySelector(`[data-site-img-src="${cssescape(f.key)}"]`);
    const alt = document.querySelector(`[data-site-img-alt="${cssescape(f.key)}"]`);
    if (!src) return;
    const obj = {};
    const srcVal = src.value.trim();
    const altVal = alt ? alt.value.trim() : "";
    if (srcVal !== f.src) obj.src = srcVal;
    if (alt && altVal !== f.alt) obj.alt = altVal;
    // permite limpar a imagem
    if (srcVal === "" && f.src) obj.src = "";
    if (alt && altVal === "" && f.alt) obj.alt = "";
    if (Object.keys(obj).length) nextImages[f.key] = obj;
  });
  ps.images = nextImages;
  const nextAttrs = {};
  (schema.attrs || []).forEach(f => {
    const el = document.querySelector(`[data-site-attr="${cssescape(f.key)}"]`);
    if (!el) return;
    nextAttrs[f.key] = el.value.trim();
  });
  ps.attrs = nextAttrs;
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
    texts: Array.from(root.querySelectorAll(EDITABLE_TEXT_SELECTOR))
      .filter(n => isEditableTextElement(n, root))
      .map(n => ({ key: buildKey(n, root), label: `${n.tagName.toLowerCase()} — ${n.textContent.trim().replace(/\s+/g," ").slice(0,70)}`, value: n.textContent.trim() })),
    images: Array.from(root.querySelectorAll("img"))
      .map((n, i) => ({ key: buildKey(n, root), label: `img ${i+1} — ${n.alt || n.src || ""}`, src: n.getAttribute("src") || "", alt: n.getAttribute("alt") || "" })),
    attrs: getEditableAttrs(root),
  };
  SCHEMA_CACHE[page] = schema;
  return schema;
}

function isEditableTextElement(node, root) {
  if (!node || !node.textContent || !node.textContent.trim()) return false;
  if (node.closest("script,style,svg,.admin-shell")) return false;
  const text = node.textContent.trim().replace(/\s+/g, " ");
  const parentEditable = node.parentElement?.closest?.(EDITABLE_TEXT_SELECTOR);
  if (parentEditable && parentEditable !== node && root.contains(parentEditable)) {
    const parentText = parentEditable.textContent.trim().replace(/\s+/g, " ");
    if (parentText === text) return false;
  }

  const childEditable = Array.from(node.querySelectorAll?.(EDITABLE_TEXT_SELECTOR) || [])
    .find(child => child.textContent.trim().replace(/\s+/g, " ") === text);
  if (childEditable) return false;

  return true;
}

function getEditableAttrs(root) {
  const seen = new Set();
  return EDITABLE_ATTRS.flatMap(def =>
    Array.from(root.querySelectorAll(def.selector)).map(node => {
      const value = node.getAttribute(def.attr) || "";
      if (!value.trim()) return null;
      const key = `${buildKey(node, root)}@${def.attr}`;
      if (seen.has(key)) return null;
      seen.add(key);
      const text = node.textContent.trim().replace(/\s+/g, " ").slice(0, 50);
      return {
        key,
        label: `${def.title} — ${text || value.slice(0, 70)}`,
        value,
      };
    }).filter(Boolean)
  );
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
  return parts.join('>'); // mantém o mesmo padrão de buildAdminPath do script.js
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
  const tagMap = { h1:"Título principal", h2:"Subtítulo", h3:"Subtítulo", h4:"Cabeçalho", h5:"Cabeçalho", h6:"Cabeçalho", p:"Parágrafo", li:"Item de lista", label:"Rótulo", button:"Botão", a:"Link", span:"Texto curto", strong:"Número/destaque", div:"Destaque", eyebrow:"Destaque", btn:"Botão" };
  return items.map((item, i) => {
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

    modal("modal-news", "Nova notícia", `
      <div class="form-row">
        <div class="fg"><label>Título</label><input id="nw-title"></div>
        <div class="fg"><label>Tag</label><input id="nw-tag" value="Notícia"></div>
      </div>
      <div class="form-row">
        <div class="fg"><label>Data</label><input type="date" id="nw-date"></div>
        <div class="fg"><label>Destaque principal</label><select id="nw-featured"><option value="false">Não</option><option value="true">Sim</option></select></div>
      </div>
      ${renderImagePicker({
        label: "Imagem da notícia",
        value: "",
        previewId: "nw-preview",
        statusId: "nw-upload-status",
        uploadAttrs: `data-target-id="nw-src"`,
        inputHtml: `<div class="fg"><label>Caminho da imagem</label><input id="nw-src" data-media-kind="image" data-preview-id="nw-preview" placeholder="Envie uma imagem ou cole a URL"></div>`,
      })}
      <div class="fg"><label>Resumo curto</label><textarea id="nw-summary" rows="2"></textarea></div>
      <div class="fg"><label>Texto da notícia</label><textarea id="nw-body" rows="5"></textarea></div>`,
      "add-news-btn", "Adicionar"),

    modal("modal-photo", "Adicionar foto", `
      <div class="form-row">
        <div class="fg"><label>Título</label><input id="ph-title"></div>
        <div class="fg"><label>Categoria</label><select id="ph-cat">
          ${["acampamento","atividade","evento","comunidade"].map(c => `<option value="${c}">${cap(c)}</option>`).join("")}
        </select></div>
      </div>
      ${renderImagePicker({
        label: "Imagem",
        value: "",
        previewId: "ph-preview",
        statusId: "ph-upload-status",
        uploadAttrs: `id="ph-file" data-target-id="ph-src"`,
        inputHtml: `<div class="fg"><label>Caminho da imagem</label><input id="ph-src" data-media-kind="image" data-preview-id="ph-preview" placeholder="Envie uma imagem ou cole a URL"></div>`,
      })}
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
      <div class="fg"><label>Categoria</label><input id="pr-cat" placeholder="ex: Ação Social, Ambiental…"></div>
      <div class="fg"><label>Tags / meta</label><input id="pr-meta"></div>
      ${renderImagePicker({
        label: "Imagem do projeto",
        value: "",
        previewId: "pr-preview",
        statusId: "pr-upload-status",
        uploadAttrs: `data-target-id="pr-src"`,
        inputHtml: `<div class="fg"><label>Caminho da imagem</label><input id="pr-src" data-media-kind="image" data-preview-id="pr-preview" placeholder="Envie uma imagem ou cole a URL"></div>`,
      })}
      <div class="fg"><label>Descrição</label><textarea id="pr-desc" rows="3"></textarea></div>`,
      "add-project-btn", "Criar"),

    modal("modal-activity", "Nova atividade", `
      <div class="form-row">
        <div class="fg"><label>Emoji</label><input id="at-icon" value="⭐" style="max-width:80px"></div>
        <div class="fg"><label>Título</label><input id="at-title"></div>
      </div>
      <div class="fg"><label>Categoria</label><input id="at-cat" placeholder="ex: Acampamento, Serviço…"></div>
      <div class="fg"><label>Especificação curta</label><input id="at-meta" placeholder="ex: Aventura ao ar livre, progressão pessoal, patrulha"></div>
      ${renderImagePicker({
        label: "Imagem da atividade",
        value: "",
        previewId: "at-image-preview",
        statusId: "at-upload-status",
        uploadAttrs: `data-target-id="at-src"`,
        inputHtml: `<div class="fg"><label>Caminho da imagem</label><input id="at-src" data-media-kind="image" data-preview-id="at-image-preview" placeholder="Envie uma imagem ou cole a URL"></div>`,
        helper: "Prefira uma foto horizontal marcante da atividade.",
      })}
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
      if (!title) { toast("Preencha o título da foto."); return; }
      const src = normPath(document.getElementById("ph-src")?.value || "");
      if (!src) { toast("Selecione uma imagem e aguarde o upload concluir.", "warn"); return; }
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
        category: document.getElementById("pr-cat")?.value.trim() || "",
        meta: document.getElementById("pr-meta")?.value.trim() || "",
        src: document.getElementById("pr-src")?.value.trim() || "",
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
      STATE.adminPanel.activities.push({
        id: uid("at"),
        icon: document.getElementById("at-icon")?.value || "⭐",
        title,
        category: document.getElementById("at-cat")?.value.trim() || "",
        meta: document.getElementById("at-meta")?.value.trim() || "",
        src: document.getElementById("at-src")?.value.trim() || "",
        description: document.getElementById("at-desc")?.value.trim() || "",
      });
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
  if (page === "mensagens") initMensagens();
  if (page === "noticias") {
    renderNoticias();
    document.getElementById("add-news-btn")?.addEventListener("click", () => {
      const title = document.getElementById("nw-title")?.value.trim();
      const src = normPath(document.getElementById("nw-src")?.value || "");
      if (!title) { toast("Preencha o título da notícia."); return; }
      if (!src) { toast("Selecione uma imagem para a notícia.", "warn"); return; }
      const featured = (document.getElementById("nw-featured")?.value || "false") === "true";
      if (featured) {
        STATE.adminPanel.news.forEach(item => { item.featured = false; });
      }
      STATE.adminPanel.news.push({
        id: uid("nw"),
        title,
        tag: document.getElementById("nw-tag")?.value.trim() || "Notícia",
        date: document.getElementById("nw-date")?.value || "",
        summary: document.getElementById("nw-summary")?.value.trim() || "",
        body: document.getElementById("nw-body")?.value.trim() || "",
        src,
        featured,
      });
      closeModal("modal-news"); renderNoticias(); toast("Notícia adicionada."); markDirty();
    });
  }
  if (page === "documentos") {
    renderDocumentos();
    if (!STATE.adminPanel.documents.length) {
      importDocumentsFromPublicPage().then(count => {
        if (count) renderDocumentos();
      });
    }
    document.getElementById("add-doc-btn")?.addEventListener("click", () => {
      const title = document.getElementById("doc-title")?.value.trim();
      if (!title) { toast("Preencha o título."); return; }
      const src = normPath(document.getElementById("doc-src")?.value || "");
      if (!src) { toast("Selecione um arquivo e aguarde o upload concluir.", "warn"); return; }
      STATE.adminPanel.documents.push({
        id: uid("doc"), title,
        desc: document.getElementById("doc-desc")?.value.trim() || "",
        category: document.getElementById("doc-cat")?.value || "Geral", src
      });
      closeModal("modal-document"); renderDocumentos(); toast("Documento adicionado."); markDirty();
    });
  }
  if (page === "links") {
    renderLinks();
    document.getElementById("add-link-btn")?.addEventListener("click", () => {
      const title = document.getElementById("lk-title")?.value.trim();
      const href = document.getElementById("lk-href")?.value.trim();
      if (!title || !href) { toast("Preencha título e link."); return; }
      STATE.adminPanel.links.push({
        id: uid("lk"), title, href,
        desc: document.getElementById("lk-desc")?.value.trim() || "",
        icon: document.getElementById("lk-icon")?.value.trim() || "fa-link"
      });
      closeModal("modal-link"); renderLinks(); toast("Link adicionado."); markDirty();
    });
  }
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
  if (PAGE === "ramos")      captureBranch();
  if (PAGE === "paginas")    capturePaginasContent();
  if (PAGE === "contato")    captureContato();
  if (PAGE === "config")     captureConfig();
  if (PAGE === "calendario") captureEvents();
  if (PAGE === "noticias")   captureNews();
  if (PAGE === "galeria")    capturePhotos();
  if (PAGE === "projetos")   captureProjects();
  if (PAGE === "atividades") captureActivities();
  if (PAGE === "membros")    captureMembros();
  if (PAGE === "documentos") captureDocuments();
  if (PAGE === "links")      captureLinks();
}

function captureNews() {
  STATE.adminPanel.news.forEach(n => {
    n.title = val(`[data-news-title="${n.id}"]`, n.title);
    n.tag = val(`[data-news-tag="${n.id}"]`, n.tag);
    n.date = val(`[data-news-date="${n.id}"]`, n.date);
    n.src = val(`[data-news-src="${n.id}"]`, n.src);
    n.summary = val(`[data-news-summary="${n.id}"]`, n.summary);
    n.body = val(`[data-news-body="${n.id}"]`, n.body);
    n.featured = val(`[data-news-featured="${n.id}"]`, String(n.featured)) === "true";
  });
}

function captureEvents() {
  STATE.adminPanel.events.forEach(e => {
    e.title = val(`[data-ev-title="${e.id}"]`, e.title);
    e.date = val(`[data-ev-date="${e.id}"]`, e.date);
    e.type = val(`[data-ev-type="${e.id}"]`, e.type);
    e.description = val(`[data-ev-desc="${e.id}"]`, e.description);
  });
}

function capturePhotos() {
  STATE.adminPanel.photos.forEach(p => {
    p.title = val(`[data-ph-title="${p.id}"]`, p.title);
    p.category = val(`[data-ph-cat="${p.id}"]`, p.category);
    p.src = normPath(val(`[data-ph-src="${p.id}"]`, p.src));
    p.caption = val(`[data-ph-caption="${p.id}"]`, p.caption);
    // Note: Galeria uses specific edit form ID for some logic, 
    // but captureCurrent uses these data attributes.
  });
}

function captureProjects() {
  STATE.adminPanel.projects.forEach(p => {
    p.title    = val(`[data-proj-title="${p.id}"]`, p.title);
    p.icon     = val(`[data-proj-icon="${p.id}"]`, p.icon);
    p.status   = val(`[data-proj-status="${p.id}"]`, p.status);
    p.progress = Number(val(`[data-proj-progress="${p.id}"]`, p.progress));
    p.category = val(`[data-proj-cat="${p.id}"]`, p.category);
    p.meta     = val(`[data-proj-meta="${p.id}"]`, p.meta);
    p.src      = val(`[data-proj-src="${p.id}"]`, p.src);
    p.description = val(`[data-proj-desc="${p.id}"]`, p.description);
  });
}

function captureActivities() {
  STATE.adminPanel.activities.forEach(a => {
    a.icon        = val(`[data-ativ-icon="${a.id}"]`, a.icon);
    a.title       = val(`[data-ativ-title="${a.id}"]`, a.title);
    a.category    = val(`[data-ativ-cat="${a.id}"]`, a.category);
    a.meta        = val(`[data-ativ-meta="${a.id}"]`, a.meta);
    a.src         = val(`[data-ativ-src="${a.id}"]`, a.src);
    a.description = val(`[data-ativ-desc="${a.id}"]`, a.description);
  });
}

function captureMembros() {
  STATE.adminPanel.members.forEach(m => {
    m.name = val(`[data-mb-nome="${m.id}"]`, m.name);
    m.branch = val(`[data-mb-ramo="${m.id}"]`, m.branch);
    m.role = val(`[data-mb-func="${m.id}"]`, m.role);
    m.since = val(`[data-mb-ano="${m.id}"]`, m.since);
    m.status = val(`[data-mb-status="${m.id}"]`, m.status);
  });
}

function captureDocuments() {
  STATE.adminPanel.documents.forEach(d => {
    d.title = val(`[data-doc-title="${d.id}"]`, d.title);
    d.category = val(`[data-doc-cat="${d.id}"]`, d.category);
    d.src = normPath(val(`[data-doc-src="${d.id}"]`, d.src));
    d.desc = val(`[data-doc-desc="${d.id}"]`, d.desc);
  });
}

function normalizeImportedDocumentHref(href) {
  const raw = String(href || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw, window.location.href);
    if (url.origin === window.location.origin) {
      return normPath(url.pathname);
    }
    return url.toString();
  } catch {
    return normPath(raw);
  }
}

async function importDocumentsFromPublicPage() {
  if (DOCUMENTS_IMPORTED_FROM_PUBLIC || STATE.adminPanel.documents.length) {
    return STATE.adminPanel.documents.length;
  }

  try {
    const response = await fetch("documentos.html", { cache: "no-store" });
    if (!response.ok) throw new Error(`Falha ao carregar documentos.html (${response.status})`);

    const html = await response.text();
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const cards = Array.from(parsed.querySelectorAll("#docs-dynamic .doc-card"));
    if (!cards.length) return 0;

    const imported = cards.map((card, index) => {
      const title = card.querySelector("h3")?.textContent?.trim() || `Documento ${index + 1}`;
      const desc = card.querySelector(".doc-card-head p")?.textContent?.trim() || "";
      const category = card.querySelector(".doc-badge, .doc-meta span")?.textContent?.trim() || "Geral";
      const href = card.querySelector(".doc-actions a[href]")?.getAttribute("href") || "";

      return {
        id: uid("doc"),
        title,
        desc,
        category,
        src: normalizeImportedDocumentHref(href),
      };
    }).filter(doc => doc.src);

    if (!imported.length) return 0;

    STATE.adminPanel.documents = imported;
    DOCUMENTS_IMPORTED_FROM_PUBLIC = true;
    markDirty();
    toast("Documentos atuais carregados da página pública. Clique em Salvar para manter no painel.");
    return imported.length;
  } catch (error) {
    console.warn("[ADMIN DOCUMENTS IMPORT]", error);
    return 0;
  }
}

function captureLinks() {
  STATE.adminPanel.links.forEach(l => {
    l.title = val(`[data-lk-title="${l.id}"]`, l.title);
    l.icon = val(`[data-lk-icon="${l.id}"]`, l.icon);
    l.href = val(`[data-lk-href="${l.id}"]`, l.href);
    l.desc = val(`[data-lk-desc="${l.id}"]`, l.desc);
    
    // Capture sub-items
    const subItems = [];
    document.querySelectorAll(`[data-lk-sub-row="${l.id}"]`).forEach(row => {
      const label = row.querySelector("[data-lk-sub-label]").value.trim();
      const href = row.querySelector("[data-lk-sub-href]").value.trim();
      if (label || href) subItems.push({ label, href });
    });
    l.items = subItems;
  });
}

function captureBranch() {
  const b = STATE.adminPanel.branches[BRANCH];
  if (!b) return;
  const nome = document.getElementById("ramo-nome"); if (nome) b.name = nome.value.trim();
  const idade = document.getElementById("ramo-idade"); if (idade) b.age = idade.value.trim();
  const d1 = document.getElementById("ramo-desc1"); if (d1) b.short = d1.value.trim();
  const d2 = document.getElementById("ramo-desc2"); if (d2) b.long  = d2.value.trim();
  const bl = document.getElementById("ramo-bullets"); if (bl) b.bullets = bl.value.split("\n").map(s => s.trim()).filter(Boolean);
  // Imagens
  if (!b.images) b.images = { main: "", badge: "", thumb1: "", thumb2: "" };
  const im = document.getElementById("ramo-img-main");   if (im)  b.images.main   = im.value.trim();
  const ib = document.getElementById("ramo-img-badge");  if (ib)  b.images.badge  = ib.value.trim();
  const it1= document.getElementById("ramo-img-thumb1"); if (it1) b.images.thumb1 = it1.value.trim();
  const it2= document.getElementById("ramo-img-thumb2"); if (it2) b.images.thumb2 = it2.value.trim();
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
    await window.apiFetch("/content", {
      method: "POST",
      body: STATE
    });
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
  try { await window.apiFetch("/auth/logout", { method: "POST" }); } catch {}
  localStorage.removeItem("gear9df_token");
  localStorage.removeItem("gear9df_user");
  location.href = "login.html";
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

function toast(msg, type = "success") {
  const t = document.getElementById("toast");
  const icon = document.getElementById("toast-icon");
  document.getElementById("toast-msg").textContent = msg;
  
  if (icon) {
    icon.className = type === "warn" || type === "error" ? "fas fa-circle-exclamation" : "fas fa-circle-check";
    icon.style.color = type === "warn" ? "#f59e0b" : type === "error" ? "#ef4444" : "#7dd3fc";
  }
  
  t.classList.add("show");
  clearTimeout(TOAST_TIMER);
  TOAST_TIMER = setTimeout(() => {
    t.classList.remove("show");
    if (icon) icon.removeAttribute("style");
  }, 2800);
}

// ── Modals open/close ─────────────────────────────────────────────
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.querySelectorAll("input,textarea").forEach(el => { el.value = el.defaultValue; });
  m.querySelectorAll("select").forEach(el => { el.selectedIndex = 0; });
  m.querySelectorAll("[data-media-kind]").forEach(syncMediaPreview);
  m.querySelectorAll(".media-status").forEach(el => { el.textContent = ""; el.removeAttribute("style"); });
  m.classList.add("open");
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("open");
}

// ── Item card component ───────────────────────────────────────────
function itemCard({ id, type, title, sub, badges, desc, fields, avatar, icon, children }) {
  const badgeHtml = (badges || []).filter(Boolean).map(b => `<span class="badge ${b.cls || "badge-gray"}">${esc(typeof b === "string" ? b : b.label)}</span>`).join("");
  const leftMedia = avatar
    ? `<div class="sb-avatar" style="background:${avatar.bg};color:${avatar.fg};width:40px;height:40px;font-size:14px;">${esc(avatar.initials)}</div>`
    : icon
    ? `<div style="font-size:24px;color:var(--c-blue);"><i class="fas ${icon}"></i></div>`
    : "";

  return `
  <div class="item-card" data-card="${type}:${id}" style="margin-bottom: 16px;">
    <div class="item-card-view" data-view style="padding: 20px; display: flex; align-items: start; gap: 20px;">
      ${leftMedia ? `<div class="item-media">${leftMedia}</div>` : ""}
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
          <div class="item-title" style="font-size: 1.1rem; color: var(--c-ink);">${esc(title)}</div>
          <div class="item-actions">
            <button class="btn btn-xs btn-ghost" data-edit-card="${type}:${id}"><i class="fas fa-pen"></i> Editar</button>
            <button class="btn btn-xs btn-danger" data-del-card="${type}:${id}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        ${sub ? `<div class="item-sub" style="color: var(--c-ink-3); font-size: 0.9rem; margin-top: 4px;">${esc(sub)}</div>` : ""}
        <div class="item-meta" style="margin-top: 8px;">${badgeHtml}</div>
        ${desc ? `<div class="item-desc" style="margin-top: 12px; font-size: 0.95rem; line-height: 1.6;">${esc(desc)}</div>` : ""}
        ${children ? `<div class="item-children" style="margin-top: 16px; border-top: 1px solid var(--c-border); padding-top: 16px;">${children}</div>` : ""}
      </div>
    </div>
    <div class="item-edit-form" data-edit style="display:none; padding: 24px; background: #f8fafc; border-top: 1px solid var(--c-border);">
      <div style="font-weight: 700; margin-bottom: 20px; color: var(--c-ink);">Editando item</div>
      ${fields}
      <div class="item-edit-footer" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--c-border);">
        <button class="btn btn-sm btn-ghost" data-cancel-card="${type}:${id}">Cancelar</button>
        <button class="btn btn-sm btn-primary" data-save-card="${type}:${id}"><i class="fas fa-check"></i> Salvar Alterações</button>
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
  p.events     = Array.isArray(p.events)     ? p.events     : [];
  p.news       = Array.isArray(p.news)       ? p.news.map(normalizeNews) : [];
  p.photos     = Array.isArray(p.photos)     ? p.photos.map(normalizePhoto) : [];
  p.projects   = Array.isArray(p.projects)   ? p.projects.map(normalizeProject)  : [];
  p.activities = Array.isArray(p.activities) ? p.activities.map(normalizeActivity) : [];
  p.members    = Array.isArray(p.members)    ? p.members    : [];
  p.documents  = Array.isArray(p.documents)  ? p.documents  : [];
  p.links      = Array.isArray(p.links)      ? p.links      : [];
  const emptyImages = () => ({ main: "", badge: "", thumb1: "", thumb2: "" });
  p.branches = p.branches || {};
  const defaultBranches = {
    filhotes:   { name: "Filhotes",   age: "5 a 7 anos",   short: "Primeiros passos no escotismo.",            long: "", bullets: [] },
    lobinhos:   { name: "Lobinhos",   age: "7 a 10 anos",  short: "Alcateia com amizade e responsabilidade.",  long: "", bullets: [] },
    escoteiros: { name: "Escoteiros", age: "10 a 15 anos", short: "Sistema de patrulhas e autonomia crescente.",long: "", bullets: [] },
    seniores:   { name: "Seniores",   age: "15 a 18 anos", short: "Desafios intensos e protagonismo juvenil.",  long: "", bullets: [] },
    pioneiros:  { name: "Pioneiros",  age: "18 a 22 anos", short: "Serviço ao próximo e projeto de vida.",      long: "", bullets: [] },
  };
  Object.entries(defaultBranches).forEach(([k, def]) => {
    if (!p.branches[k]) p.branches[k] = def;
    if (!p.branches[k].images) p.branches[k].images = emptyImages();
    else {
      p.branches[k].images = {
        main:   p.branches[k].images.main   || "",
        badge:  p.branches[k].images.badge  || "",
        thumb1: p.branches[k].images.thumb1 || "",
        thumb2: p.branches[k].images.thumb2 || "",
      };
    }
  });
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
  if (!STATE.pages[page] || typeof STATE.pages[page] !== "object") STATE.pages[page] = { text: {}, images: {}, attrs: {}, sections: {}, extras: [] };
  const s = STATE.pages[page];
  s.text    = (s.text    && typeof s.text    === "object") ? s.text    : {};
  s.images  = (s.images  && typeof s.images  === "object") ? s.images  : {};
  s.attrs   = (s.attrs   && typeof s.attrs   === "object") ? s.attrs   : {};
  s.sections= (s.sections&& typeof s.sections=== "object") ? s.sections: {};
  s.extras  = Array.isArray(s.extras) ? s.extras : [];
  return s;
}

function normalizePhoto(p) {
  return { id: p.id || uid("ph"), title: String(p.title || "").trim(), category: String(p.category || "atividade").toLowerCase(), caption: String(p.caption || p.title || "").trim(), src: p.src || "" };
}

function normalizeNews(item) {
  return {
    id: item.id || uid("nw"),
    title: String(item.title || "").trim(),
    tag: String(item.tag || "Destaque").trim(),
    date: String(item.date || "").trim(),
    summary: String(item.summary || "").trim(),
    body: String(item.body || "").trim(),
    src: String(item.src || "").trim(),
    featured: Boolean(item.featured),
  };
}

function normalizeProject(p) {
  return {
    id:          p.id          || uid("pr"),
    title:       String(p.title       || "").trim(),
    icon:        String(p.icon        || "🌟"),
    status:      String(p.status      || "planejado"),
    progress:    Number(p.progress    || 0),
    category:    String(p.category    || p.meta || "").trim(),
    meta:        String(p.meta        || "").trim(),
    src:         String(p.src         || "").trim(),
    description: String(p.description || "").trim(),
  };
}

function normalizeActivity(a) {
  return {
    id:          a.id          || uid("at"),
    icon:        String(a.icon        || "⭐"),
    title:       String(a.title       || "").trim(),
    category:    String(a.category    || "").trim(),
    meta:        String(a.meta        || "").trim(),
    src:         String(a.src         || "").trim(),
    description: String(a.description || "").trim(),
  };
}

function renderImagePicker({
  label,
  inputHtml,
  value = "",
  previewId,
  statusId,
  uploadAttrs = "",
  altHtml = "",
  helper = "",
}) {
  const hasImage = !!value && isImageLike(value);
  return `
    <div class="media-field">
      <div class="media-field-head">
        <label>${esc(label)}</label>
        <label class="btn btn-sm btn-ghost media-upload-btn">
          <i class="fas fa-upload"></i> Enviar imagem
          <input type="file" accept="image/*" class="img-upload-trigger" data-status-id="${esc(statusId)}" ${uploadAttrs}>
        </label>
      </div>
      <div class="media-field-body">
        <div class="media-preview-card${hasImage ? " has-image" : ""}" data-preview-card="${esc(previewId)}">
          <img id="${esc(previewId)}" src="${esc(value)}" alt="${esc(label)}" style="display:${hasImage ? "block" : "none"}">
          <div class="media-preview-empty">
            <i class="fas fa-image"></i>
            <span>Nenhuma imagem selecionada</span>
          </div>
        </div>
        <div class="media-field-inputs">
          ${inputHtml}
          <div class="media-status" id="${esc(statusId)}"></div>
          ${helper ? `<div class="media-helper">${helper}</div>` : ""}
          ${altHtml}
        </div>
      </div>
    </div>`;
}

function renderFilePicker({
  label,
  inputHtml,
  value = "",
  previewId,
  statusId,
  uploadAttrs = "",
  helper = "",
}) {
  const name = fileNameFromPath(value);
  return `
    <div class="media-field">
      <div class="media-field-head">
        <label>${esc(label)}</label>
        <label class="btn btn-sm btn-ghost media-upload-btn">
          <i class="fas fa-upload"></i> Enviar arquivo
          <input type="file" class="img-upload-trigger" data-status-id="${esc(statusId)}" ${uploadAttrs}>
        </label>
      </div>
      <div class="media-field-body media-field-body-file">
        <div class="file-preview-card${value ? " has-file" : ""}" id="${esc(previewId)}">
          ${value
            ? `<div class="file-preview-icon"><i class="fas fa-file-lines"></i></div><div><strong>${esc(name || "Arquivo enviado")}</strong><span>${esc(value)}</span></div>`
            : `<div class="file-preview-empty"><i class="fas fa-file-arrow-up"></i><span>Nenhum arquivo selecionado</span></div>`}
        </div>
        <div class="media-field-inputs">
          ${inputHtml}
          <div class="media-status" id="${esc(statusId)}"></div>
          ${helper ? `<div class="media-helper">${helper}</div>` : ""}
        </div>
      </div>
    </div>`;
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
function isSafeImagePath(s) { return /^[a-z0-9/._-]+$/.test(normPath(s)) && GALLERY_EXTENSIONS.includes(normPath(s).split(".").pop()?.toLowerCase()); }
function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function fmtDate(s) { if (!s) return ""; const [y,m,d] = String(s).split("-"); return `${d}/${m}/${y}`; }
function typeColor(t) { return t==="regional"?"var(--c-amber)":t==="nacional"?"var(--c-red)":"var(--c-green)"; }
function badgeForType(t) { return t==="regional"?"badge-amber":t==="nacional"?"badge-red":"badge-green"; }
function saveErrorMsg(err) { const m = String(err?.message||""); if(m.includes("unauthorized")||m.includes("forbidden")||m.includes("401")||m.includes("403")) return "Sessão expirada. Faça login novamente."; return "Não foi possível salvar. Verifique os campos e tente novamente."; }
function cssescape(s) { return (window.CSS?.escape?.(s)) ?? String(s).replace(/["\\]/g,"\\$&"); }
function val(sel, fallback="") { const el = document.querySelector(sel); return el ? el.value.trim() : fallback; }
function fileNameFromPath(s) {
  const clean = String(s || "").trim().split(/[?#]/)[0];
  return clean ? clean.split("/").pop() || clean : "";
}
function isImageLike(s) {
  return /(^https?:\/\/|^\/|^images\/|^\.\/|^\.{2}\/|^data:image\/).+\.(webp|jpg|jpeg|png|svg)(?:[?#].*)?$/i.test(String(s || "").trim())
    || /^data:image\//i.test(String(s || "").trim());
}
function syncImagePreview(input) {
  if (!input) return;
  const previewId = input.dataset.previewId;
  if (!previewId) return;
  const card = document.querySelector(`[data-preview-card="${cssescape(previewId)}"]`);
  const img = document.getElementById(previewId);
  if (!card || !img) return;
  const src = input.value.trim();
  const hasImage = !!src && isImageLike(src);
  img.src = src || "";
  img.style.display = hasImage ? "block" : "none";
  card.classList.toggle("has-image", hasImage);
}
function syncFilePreview(input) {
  if (!input) return;
  const previewId = input.dataset.previewId;
  const box = previewId ? document.getElementById(previewId) : null;
  if (!box) return;
  const src = input.value.trim();
  const name = fileNameFromPath(src);
  box.innerHTML = src
    ? `<div class="file-preview-icon"><i class="fas fa-file-lines"></i></div><div><strong>${esc(name || "Arquivo enviado")}</strong><span>${esc(src)}</span></div>`
    : `<div class="file-preview-empty"><i class="fas fa-file-arrow-up"></i><span>Nenhum arquivo selecionado</span></div>`;
  box.classList.toggle("has-file", !!src);
}
function syncMediaPreview(input) {
  if (!input) return;
  if (input.dataset.mediaKind === "file") syncFilePreview(input);
  else syncImagePreview(input);
}

// A função apiFetch local foi removida pois agora utilizamos o window.apiFetch global do arquivo api.js

// ── Modals Append ─────────────────────────────────────────────────
const originalRenderModals = renderModals;
renderModals = function() {
  originalRenderModals();
  const root = document.getElementById("modal-root");
  root.innerHTML += modal(
    "modal-document", "Novo Documento",
    `<div class="form-row">
      <div class="fg"><label>Título</label><input id="doc-title"></div>
      <div class="fg"><label>Categoria</label><select id="doc-cat"><option>Regimento</option><option>Estatuto</option><option>Geral</option><option>Modelo</option></select></div>
    </div>
    ${renderFilePicker({
      label: "Arquivo (PDF, Word, Excel)",
      value: "",
      previewId: "doc-file-preview",
      statusId: "doc-upload-status",
      uploadAttrs: `id="doc-file" accept=".pdf,.doc,.docx,.xls,.xlsx" data-target-id="doc-src" data-upload-endpoint="/admin/upload/document" data-field-name="file"`,
      inputHtml: `<div class="fg"><label>Caminho/URL do arquivo</label><input id="doc-src" data-media-kind="file" data-preview-id="doc-file-preview" placeholder="Envie um arquivo ou cole a URL"></div>`,
      helper: "Aceita PDF, Word e Excel.",
    })}
    <div class="fg"><label>Descrição (opcional)</label><textarea id="doc-desc" rows="2"></textarea></div>`,
    "add-doc-btn", "Adicionar"
  ) + modal(
    "modal-link", "Novo Link",
    `<div class="form-row">
      <div class="fg"><label>Título</label><input id="lk-title"></div>
      <div class="fg"><label>Ícone FA (ex: fa-sitemap)</label><input id="lk-icon" value="fa-link"></div>
    </div>
    <div class="fg"><label>URL (destino)</label><input id="lk-href" placeholder="https://..."></div>
    <div class="fg"><label>Descrição (opcional)</label><input id="lk-desc"></div>`,
    "add-link-btn", "Criar"
  );
};

// ── Template: Mensagens ───────────────────────────────────────────
function tplMensagens() {
  return `
  <div class="hero-banner">
    <h2>Mensagens de Contato</h2>
    <p>Visualize as mensagens recebidas pelo site.</p>
  </div>
  <div class="card" style="margin-top:16px;">
    <div id="mensagens-list" class="items-list">
      <div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Carregando mensagens...</p></div>
    </div>
  </div>`;
}

async function initMensagens() {
  const list = document.getElementById("mensagens-list");
  if (!list) return;
  try {
    const res = await window.apiFetch("/contact");
    if (!res.messages || !res.messages.length) {
      list.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhuma mensagem recebida ainda.</p></div>`;
      return;
    }
    list.innerHTML = res.messages.map(m => `
      <div style="padding:16px;border-bottom:1px solid var(--c-border);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <strong style="color:var(--c-ink);font-size:15px;">${esc(m.subject || "Sem assunto")}</strong>
            <span class="badge ${m.is_read ? "badge-green" : "badge-amber"}">${m.is_read ? "Lida" : "Nova"}</span>
          </div>
          <span style="font-size:12px;color:var(--c-ink-3);">${new Date(m.date).toLocaleString()}</span>
        </div>
        <div style="margin-bottom:8px;font-size:13px;color:var(--c-ink-2);">
          De: <strong>${esc(m.name)}</strong> (${esc(m.email)})
        </div>
        <div style="font-size:14px;color:var(--c-ink);white-space:pre-wrap;background:var(--c-surface);padding:12px;border-radius:var(--r-md);">${esc(m.message)}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
          <button class="btn btn-xs btn-ghost" data-msg-reply-toggle="${esc(m.id)}"><i class="fas fa-reply"></i> Responder</button>
          ${m.is_read ? "" : `<button class="btn btn-xs btn-ghost" data-msg-read="${esc(m.id)}"><i class="fas fa-envelope-open"></i> Marcar como lida</button>`}
          <button type="button" class="btn btn-xs btn-ghost" data-open-mailbox><i class="fas fa-paper-plane"></i> Abrir no e-mail</button>
        </div>
        <div id="reply-box-${esc(m.id)}" style="display:none;margin-top:12px;padding:12px;border:1px solid var(--c-border);border-radius:var(--r-md);background:#f8fbff;">
          <div class="fg"><label>Assunto da resposta</label><input id="reply-subject-${esc(m.id)}" value="${esc(`Re: ${m.subject || "Contato pelo site"}`)}"></div>
          <div class="fg"><label>Mensagem</label><textarea id="reply-body-${esc(m.id)}" rows="5" placeholder="Escreva a resposta para ${esc(m.name)}..."></textarea></div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">
            <button class="btn btn-xs btn-ghost" data-msg-reply-cancel="${esc(m.id)}">Cancelar</button>
            <button class="btn btn-xs btn-primary" data-msg-reply-send="${esc(m.id)}"><i class="fas fa-paper-plane"></i> Enviar resposta</button>
          </div>
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-msg-reply-toggle]").forEach(btn =>
      btn.addEventListener("click", () => {
        const box = document.getElementById(`reply-box-${btn.dataset.msgReplyToggle}`);
        if (box) box.style.display = box.style.display === "none" ? "block" : "none";
      })
    );

    list.querySelectorAll("[data-msg-reply-cancel]").forEach(btn =>
      btn.addEventListener("click", () => {
        const box = document.getElementById(`reply-box-${btn.dataset.msgReplyCancel}`);
        if (box) box.style.display = "none";
      })
    );

    list.querySelectorAll("[data-msg-read]").forEach(btn =>
      btn.addEventListener("click", async () => {
        try {
          await window.apiFetch(`/contact/${btn.dataset.msgRead}/read`, { method: "POST" });
          toast("Mensagem marcada como lida.");
          initMensagens();
        } catch {
          toast("Não foi possível marcar a mensagem como lida.", "error");
        }
      })
    );

    list.querySelectorAll("[data-open-mailbox]").forEach(btn =>
      btn.addEventListener("click", () => {
        window.open("https://mail.hostinger.com/mailboxes/INBOX", "_blank", "noopener");
      })
    );

    list.querySelectorAll("[data-msg-reply-send]").forEach(btn =>
      btn.addEventListener("click", async () => {
        const id = btn.dataset.msgReplySend;
        const subject = document.getElementById(`reply-subject-${id}`)?.value.trim() || "";
        const body = document.getElementById(`reply-body-${id}`)?.value.trim() || "";
        if (!body) {
          toast("Escreva a mensagem da resposta.", "warn");
          return;
        }
        try {
          btn.disabled = true;
          await window.apiFetch(`/contact/${id}/reply`, {
            method: "POST",
            body: { subject, body }
          });
          toast("Resposta enviada com sucesso!");
          initMensagens();
        } catch (err) {
          toast(`Falha ao enviar resposta: ${err.message || "erro desconhecido"}`, "error");
        } finally {
          btn.disabled = false;
        }
      })
    );
  } catch (err) {
    list.innerHTML = `<div class="notice notice-warn">Falha ao carregar as mensagens.</div>`;
  }
}

// ── Template: Documentos ──────────────────────────────────────────
function tplDocumentos() {
  return `
  <div class="hero-banner">
    <h2>Documentos</h2>
    <p>Upload de PDFs, regimentos internos, matrizes de atividades e cronogramas.</p>
    <div class="hero-actions">
      <button class="btn btn-primary btn-sm" data-open-modal="modal-document"><i class="fas fa-file-pdf"></i> Novo documento</button>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><div class="card-title">Arquivos disponíveis</div></div>
    <div id="docs-list" class="items-list"></div>
  </div>`;
}

function renderDocumentos() {
  const list = document.getElementById("docs-list");
  if (!list) return;
  list.innerHTML = STATE.adminPanel.documents.length
    ? STATE.adminPanel.documents.map(d => itemCard({
        id: d.id, type: "document",
        title: d.title, sub: d.category,
        badges: [{ label: d.category, cls: "badge-blue" }],
        desc: d.desc,
        icon: "fa-file-lines",
        fields: `
          <div class="form-row">
            <div class="fg"><label>Título</label><input data-doc-title="${d.id}" value="${esc(d.title)}"></div>
            <div class="fg"><label>Categoria</label><input data-doc-cat="${d.id}" value="${esc(d.category)}"></div>
          </div>
          ${renderFilePicker({
            label: "Arquivo do documento",
            value: d.src,
            previewId: `doc-preview-${d.id}`,
            statusId: `doc-status-${d.id}`,
            uploadAttrs: `accept=".pdf,.doc,.docx,.xls,.xlsx" data-target-id="doc-src-${d.id}" data-upload-endpoint="/admin/upload/document" data-field-name="file"`,
            inputHtml: `<div class="fg"><label>Caminho/URL do arquivo</label><input id="doc-src-${d.id}" data-doc-src="${d.id}" data-media-kind="file" data-preview-id="doc-preview-${d.id}" value="${esc(d.src)}" placeholder="Envie um arquivo ou cole a URL"></div>`,
          })}
          <div class="fg"><label>Descrição</label><textarea rows="2" data-doc-desc="${d.id}">${esc(d.desc)}</textarea></div>`
      })).join("")
    : `<div class="empty-state"><i class="fas fa-file-pdf"></i><p>Nenhum documento cadastrado.</p></div>`;
  bindItemCards("document", id => {
    const d = STATE.adminPanel.documents.find(x => x.id === id);
    if (!d) return;
    d.title = val(`[data-doc-title="${id}"]`, d.title);
    d.category = val(`[data-doc-cat="${id}"]`, d.category);
    d.src = normPath(val(`[data-doc-src="${id}"]`, d.src));
    d.desc = val(`[data-doc-desc="${id}"]`, d.desc);
    renderDocumentos(); toast("Documento atualizado."); markDirty();
  }, id => {
    STATE.adminPanel.documents = STATE.adminPanel.documents.filter(d => d.id !== id);
    renderDocumentos(); toast("Documento removido."); markDirty();
  });
}

// ── Template: Links ───────────────────────────────────────────────
function tplLinks() {
  return `
  <div class="hero-banner">
    <h2>Links Úteis</h2>
    <p>Atalhos rápidos para sistemas do escotismo (Paxtu, mAPPa) ou outros sites relacionados.</p>
    <div class="hero-actions">
      <button class="btn btn-primary btn-sm" data-open-modal="modal-link"><i class="fas fa-link"></i> Novo link</button>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><div class="card-title">Atalhos configurados</div></div>
    <div id="links-list" class="items-list"></div>
  </div>`;
}

function renderLinks() {
  const list = document.getElementById("links-list");
  if (!list) return;
  list.innerHTML = STATE.adminPanel.links.length
    ? STATE.adminPanel.links.map(l => {
        const subItemsHtml = (l.items || []).map(item => `
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--c-ink-2); margin-top: 4px;">
            <i class="fas fa-caret-right" style="color: var(--c-blue); opacity: 0.5;"></i>
            <strong>${esc(item.label)}:</strong>
            <span style="text-decoration: underline; opacity: 0.8;">${esc(item.href)}</span>
          </div>
        `).join("");

        const subItemsFields = (l.items || []).map((item, idx) => `
          <div style="display: flex; gap: 10px; margin-bottom: 8px;" data-lk-sub-row="${l.id}">
            <input placeholder="Rótulo (ex: Instagram)" data-lk-sub-label value="${esc(item.label)}" style="flex: 1;">
            <input placeholder="URL" data-lk-sub-href value="${esc(item.href)}" style="flex: 2;">
            <button class="btn btn-xs btn-danger btn-icon" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
          </div>
        `).join("");

        return itemCard({
          id: l.id, type: "link",
          title: l.title, sub: l.href || (l.items && l.items.length ? `${l.items.length} sub-links` : "Sem destino"),
          badges: [], desc: l.desc, icon: l.icon || "fa-link",
          children: subItemsHtml ? `<div style="margin-top: 10px;">${subItemsHtml}</div>` : "",
          fields: `
            <div class="form-row">
              <div class="fg"><label>Título do Grupo</label><input data-lk-title="${l.id}" value="${esc(l.title)}"></div>
              <div class="fg"><label>Ícone FA</label><input data-lk-icon="${l.id}" value="${esc(l.icon)}"></div>
            </div>
            <div class="fg"><label>Destino Principal (opcional se houver sub-links)</label><input data-lk-href="${l.id}" value="${esc(l.href)}"></div>
            <div class="fg"><label>Descrição</label><input data-lk-desc="${l.id}" value="${esc(l.desc)}"></div>
            
            <div style="margin-top: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--c-ink-3);">Sub-links de atalho</label>
                <button class="btn btn-xs btn-ghost" onclick="addLinkSubItem('${l.id}')"><i class="fas fa-plus"></i> Novo sub-link</button>
              </div>
              <div id="lk-subs-${l.id}">${subItemsFields}</div>
            </div>`
        });
      }).join("")
    : `<div class="empty-state"><i class="fas fa-link"></i><p>Nenhum link adicionado.</p></div>`;

  bindItemCards("link", id => {
    captureCurrent(); // Ensure we capture the latest sub-items
    renderLinks(); 
    toast("Link atualizado."); 
    markDirty();
  }, id => {
    STATE.adminPanel.links = STATE.adminPanel.links.filter(l => l.id !== id);
    renderLinks(); 
    toast("Link removido."); 
    markDirty();
  });
}

function addLinkSubItem(linkId) {
  const container = document.getElementById(`lk-subs-${linkId}`);
  if (!container) return;
  const div = document.createElement("div");
  div.style.display = "flex";
  div.style.gap = "10px";
  div.style.marginBottom = "8px";
  div.setAttribute("data-lk-sub-row", linkId);
  div.innerHTML = `
    <input placeholder="Rótulo" data-lk-sub-label style="flex: 1;">
    <input placeholder="URL" data-lk-sub-href style="flex: 2;">
    <button class="btn btn-xs btn-danger btn-icon" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
  `;
  container.appendChild(div);
}
