var ADMIN_STATE = { pages: {} };
var ADMIN_PAGES = {};
var CURRENT_PAGE = 'index.html';
var AUTO_SAVE_TIMER = null;
var IS_SAVING = false;
var CURRENT_TARGETS = {
    texts: [],
    images: [],
    sections: []
};

document.addEventListener('DOMContentLoaded', function () {
    initializeAdmin();
});

async function initializeAdmin() {
    var sessionResponse = await fetch('/api/auth/session', { credentials: 'same-origin' });
    var sessionData = await sessionResponse.json();

    if (!sessionData.authenticated) {
        window.location.href = '/login?next=' + encodeURIComponent(getRequestedPage());
        return;
    }

    var pagesResponse = await fetch('/api/admin/pages', { credentials: 'same-origin' });
    var pagesData = await pagesResponse.json();
    ADMIN_PAGES = pagesData.pages || {};

    var contentResponse = await fetch('/api/admin/content', { credentials: 'same-origin' });
    ADMIN_STATE = await contentResponse.json();
    if (!ADMIN_STATE.pages) {
        ADMIN_STATE.pages = {};
    }

    setupPageSelect();
    bindGlobalActions();
    setupTabs();
    await loadPageEditor(CURRENT_PAGE);
}

function getRequestedPage() {
    var params = new URLSearchParams(window.location.search);
    return params.get('page') || 'index.html';
}

function ensurePageState(pageName) {
    if (!ADMIN_STATE.pages[pageName]) {
        ADMIN_STATE.pages[pageName] = {
            text: {},
            images: {},
            sections: {},
            extras: []
        };
    }

    var page = ADMIN_STATE.pages[pageName];
    if (!page.text) page.text = {};
    if (!page.images) page.images = {};
    if (!page.sections) page.sections = {};
    if (!Array.isArray(page.extras)) page.extras = [];
    return page;
}

function setupPageSelect() {
    var select = document.getElementById('pageSelect');
    var requested = getRequestedPage();

    Object.keys(ADMIN_PAGES).forEach(function (pageName) {
        var option = document.createElement('option');
        option.value = pageName;
        option.textContent = ADMIN_PAGES[pageName];
        select.appendChild(option);
    });

    CURRENT_PAGE = ADMIN_PAGES[requested] ? requested : 'index.html';
    select.value = CURRENT_PAGE;
    document.getElementById('openPageLink').href = CURRENT_PAGE;

    select.addEventListener('change', function () {
        CURRENT_PAGE = select.value;
        document.getElementById('openPageLink').href = CURRENT_PAGE;
        var url = new URL(window.location.href);
        url.searchParams.set('page', CURRENT_PAGE);
        history.replaceState({}, '', url.toString());
        loadPageEditor(CURRENT_PAGE);
    });
}

function bindGlobalActions() {
    document.getElementById('saveButton').addEventListener('click', saveState);
    document.getElementById('refreshPreviewButton').addEventListener('click', function () {
        refreshPreview(true);
        setStatus('Preview atualizado.');
    });
    document.getElementById('copyJsonButton').addEventListener('click', copyJson);
    document.getElementById('resetPageButton').addEventListener('click', function () {
        delete ADMIN_STATE.pages[CURRENT_PAGE];
        loadPageEditor(CURRENT_PAGE);
        setStatus('Pagina resetada localmente. Salve para persistir.');
    });
    document.getElementById('logoutButton').addEventListener('click', async function () {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'same-origin'
        });
        window.location.href = '/login';
    });
    document.getElementById('addExtraButton').addEventListener('click', addExtraSection);
    bindSearch('textSearch', 'textEditor');
    bindSearch('imageSearch', 'imageEditor');
    bindSearch('sectionSearch', 'sectionEditor');
}

function setupTabs() {
    var tabs = document.querySelectorAll('[data-admin-tab]');
    var panels = document.querySelectorAll('[data-admin-panel]');

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            var target = tab.getAttribute('data-admin-tab');

            tabs.forEach(function (button) {
                button.classList.toggle('active', button === tab);
            });

            panels.forEach(function (panel) {
                panel.classList.toggle('active', panel.getAttribute('data-admin-panel') === target);
            });
        });
    });
}

async function loadPageEditor(pageName) {
    CURRENT_PAGE = pageName;
    ensurePageState(pageName);

    var response = await fetch('/' + pageName, { credentials: 'same-origin' });
    var html = await response.text();
    var parser = new DOMParser();
    var documentNode = parser.parseFromString(html, 'text/html');
    var main = documentNode.querySelector('main');

    if (!main) {
        setStatus('Nao foi possivel ler a estrutura da pagina selecionada.', true);
        return;
    }

    CURRENT_TARGETS.texts = getTextTargets(main);
    CURRENT_TARGETS.images = getImageTargets(main);
    CURRENT_TARGETS.sections = getSectionTargets(main);

    renderTextEditor(pageName);
    renderImageEditor(pageName);
    renderSectionEditor(pageName);
    renderExtraList(pageName);
    updateSummary(pageName);
    syncJson();
    refreshPreview();
    setStatus('Editor carregado para ' + (ADMIN_PAGES[pageName] || pageName) + '.');
}

function buildPath(element, root) {
    var parts = [];
    var current = element;

    while (current && current !== root) {
        var tag = current.tagName.toLowerCase();
        var index = 1;
        var sibling = current.previousElementSibling;

        while (sibling) {
            if (sibling.tagName === current.tagName) {
                index += 1;
            }
            sibling = sibling.previousElementSibling;
        }

        parts.unshift(tag + ':nth-of-type(' + index + ')');
        current = current.parentElement;
    }

    return parts.join(' > ');
}

function getTextTargets(root) {
    return Array.from(root.querySelectorAll('h1, h2, h3, h4, p, .eyebrow, .btn')).filter(function (node) {
        return node.textContent && node.textContent.trim();
    }).map(function (node) {
        return {
            key: buildPath(node, root),
            node: node,
            label: node.tagName.toLowerCase() + ' - ' + node.textContent.trim().replace(/\s+/g, ' ').slice(0, 70)
        };
    });
}

function getImageTargets(root) {
    return Array.from(root.querySelectorAll('img')).map(function (node, index) {
        return {
            key: buildPath(node, root),
            node: node,
            label: 'Imagem ' + (index + 1) + ' - ' + (node.getAttribute('alt') || node.getAttribute('src') || 'sem descricao')
        };
    });
}

function getSectionTargets(root) {
    return Array.from(root.children).filter(function (node) {
        return node.tagName === 'SECTION';
    }).map(function (node, index) {
        var heading = node.querySelector('h1, h2, h3');
        return {
            key: buildPath(node, root),
            label: heading ? heading.textContent.trim() : 'Secao ' + (index + 1)
        };
    });
}

function readTextValue(node) {
    if (node.classList.contains('btn')) {
        var clone = node.cloneNode(true);
        clone.querySelectorAll('i').forEach(function (icon) {
            icon.remove();
        });
        return clone.textContent.trim();
    }
    return node.innerHTML.trim();
}

function renderTextEditor(pageName) {
    var container = document.getElementById('textEditor');
    var pageState = ensurePageState(pageName);
    container.innerHTML = '';

    CURRENT_TARGETS.texts.forEach(function (entry, index) {
        var details = document.createElement('details');
        details.innerHTML =
            '<summary>' + (index + 1) + '. ' + escapeHtml(entry.label) + '</summary>' +
            '<div class="editor-meta">' + escapeHtml(entry.key) + '</div>' +
            '<div class="editor-field"><label>Conteudo</label><textarea></textarea></div>';

        var field = details.querySelector('textarea');
        field.value = Object.prototype.hasOwnProperty.call(pageState.text, entry.key) ? pageState.text[entry.key] : readTextValue(entry.node);
        field.addEventListener('input', function () {
            pageState.text[entry.key] = field.value;
            syncJson();
            queueAutoSave();
        });

        container.appendChild(details);
    });
}

function renderImageEditor(pageName) {
    var container = document.getElementById('imageEditor');
    var pageState = ensurePageState(pageName);
    container.innerHTML = '';

    CURRENT_TARGETS.images.forEach(function (entry, index) {
        var override = pageState.images[entry.key] || {};
        var details = document.createElement('details');
        details.innerHTML =
            '<summary>' + (index + 1) + '. ' + escapeHtml(entry.label) + '</summary>' +
            '<div class="editor-meta">' + escapeHtml(entry.key) + '</div>' +
            '<div class="editor-field"><label>Caminho da imagem</label><input type="text"></div>' +
            '<div class="editor-field"><label>Descricao da imagem (ALT)</label><input type="text"></div>';

        var inputs = details.querySelectorAll('input');
        inputs[0].value = override.src || entry.node.getAttribute('src') || '';
        inputs[1].value = typeof override.alt === 'string' ? override.alt : (entry.node.getAttribute('alt') || '');

        function updateImage() {
            pageState.images[entry.key] = pageState.images[entry.key] || {};
            pageState.images[entry.key].src = inputs[0].value.trim();
            pageState.images[entry.key].alt = inputs[1].value.trim();
            syncJson();
            queueAutoSave();
        }

        inputs[0].addEventListener('input', updateImage);
        inputs[1].addEventListener('input', updateImage);

        container.appendChild(details);
    });
}

function renderSectionEditor(pageName) {
    var container = document.getElementById('sectionEditor');
    var pageState = ensurePageState(pageName);
    container.innerHTML = '';

    CURRENT_TARGETS.sections.forEach(function (entry) {
        var wrapper = document.createElement('div');
        wrapper.className = 'editor-card editor-toggle';
        wrapper.innerHTML =
            '<div><strong>' + escapeHtml(entry.label) + '</strong><div class="editor-meta">' + escapeHtml(entry.key) + '</div></div>' +
            '<input type="checkbox" checked>';

        var checkbox = wrapper.querySelector('input');
        checkbox.checked = !(pageState.sections[entry.key] && pageState.sections[entry.key].hidden);
        checkbox.addEventListener('change', function () {
            pageState.sections[entry.key] = { hidden: !checkbox.checked };
            syncJson();
            queueAutoSave();
        });

        container.appendChild(wrapper);
    });
}

function renderExtraList(pageName) {
    var container = document.getElementById('extraList');
    var pageState = ensurePageState(pageName);
    container.innerHTML = '';

    pageState.extras.forEach(function (extra) {
        var card = document.createElement('div');
        card.className = 'editor-card extra-item';
        card.innerHTML =
            '<strong>' + escapeHtml(extra.title || 'Secao sem titulo') + '</strong>' +
            '<div class="editor-meta">' + escapeHtml(extra.id) + '</div>' +
            '<button type="button" class="btn btn-outline btn-small">Remover</button>';

        card.querySelector('button').addEventListener('click', function () {
            pageState.extras = pageState.extras.filter(function (node) {
                return node.id !== extra.id;
            });
            renderExtraList(pageName);
            updateSummary(pageName);
            syncJson();
            setStatus('Secao extra removida. Salve para publicar.');
            queueAutoSave();
        });

        container.appendChild(card);
    });
}

function addExtraSection() {
    var pageState = ensurePageState(CURRENT_PAGE);
    pageState.extras.push({
        id: 'extra-' + Date.now(),
        title: document.getElementById('extraTitle').value.trim(),
        text: document.getElementById('extraText').value.trim(),
        buttonLabel: document.getElementById('extraButtonLabel').value.trim(),
        buttonHref: document.getElementById('extraButtonHref').value.trim(),
        imageSrc: document.getElementById('extraImageSrc').value.trim(),
        imageAlt: document.getElementById('extraImageAlt').value.trim(),
        tone: document.getElementById('extraTone').value
    });

    document.getElementById('extraTitle').value = '';
    document.getElementById('extraText').value = '';
    document.getElementById('extraButtonLabel').value = '';
    document.getElementById('extraButtonHref').value = '';
    document.getElementById('extraImageSrc').value = '';
    document.getElementById('extraImageAlt').value = '';
    document.getElementById('extraTone').value = 'plain';

    renderExtraList(CURRENT_PAGE);
    updateSummary(CURRENT_PAGE);
    syncJson();
    setStatus('Nova secao adicionada. Salvando...');
    queueAutoSave();
}

async function saveState(isAutoSave) {
    if (IS_SAVING) {
        return;
    }

    try {
        IS_SAVING = true;
        var parsed = JSON.parse(document.getElementById('jsonField').value);
        ADMIN_STATE = parsed;
        var response = await fetch('/api/admin/content', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ADMIN_STATE)
        });

        if (!response.ok) {
            throw new Error('save_failed');
        }

        updateSummary(CURRENT_PAGE);
        setStatus(isAutoSave ? 'Alteracoes salvas automaticamente.' : 'Alteracoes salvas no servidor.');
        refreshPreview(true);
    } catch (error) {
        setStatus('Nao foi possivel salvar. Revise os dados e tente novamente.', true);
    } finally {
        IS_SAVING = false;
    }
}

function copyJson() {
    syncJson();
    var field = document.getElementById('jsonField');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(field.value);
        setStatus('Configuracao copiada.');
        return;
    }

    field.focus();
    field.select();
    document.execCommand('copy');
    setStatus('Configuracao copiada.');
}

function syncJson() {
    document.getElementById('jsonField').value = JSON.stringify(ADMIN_STATE, null, 2);
}

function queueAutoSave() {
    clearTimeout(AUTO_SAVE_TIMER);
    setStatus('Alteracao em rascunho. Salvando...');
    AUTO_SAVE_TIMER = setTimeout(function () {
        saveState(true);
    }, 700);
}

function updateSummary(pageName) {
    var pageState = ensurePageState(pageName);
    document.getElementById('kpiTexts').textContent = CURRENT_TARGETS.texts.length;
    document.getElementById('kpiImages').textContent = CURRENT_TARGETS.images.length;
    document.getElementById('kpiSections').textContent = CURRENT_TARGETS.sections.length;
    document.getElementById('kpiExtras').textContent = pageState.extras.length;
    document.getElementById('currentPageLabel').textContent = 'Pagina atual: ' + (ADMIN_PAGES[pageName] || pageName);
}

function refreshPreview(forceReload) {
    var frame = document.getElementById('previewFrame');
    var src = CURRENT_PAGE;
    if (forceReload) {
        src += '?preview=' + Date.now();
    }
    frame.src = src;
}

function setStatus(message, isError) {
    var line = document.getElementById('statusLine');
    line.textContent = message;
    line.style.color = isError ? '#ff6b6b' : '#4da1ff';
}

function bindSearch(inputId, containerId) {
    var input = document.getElementById(inputId);
    var container = document.getElementById(containerId);

    if (!input || !container) {
        return;
    }

    input.addEventListener('input', function () {
        var term = input.value.trim().toLowerCase();
        Array.from(container.children).forEach(function (item) {
            var text = item.textContent.toLowerCase();
            item.style.display = !term || text.indexOf(term) !== -1 ? '' : 'none';
        });
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
