document.addEventListener('DOMContentLoaded', function () {
    applyAdminContent();
    setupMenu();
    setupHeaderShadow();
    setupYear();
    setupScrollAnimations();
    setupAdminMode();

    fetchSiteContent().then(function(state) {
        applyAdminContent(state);
        applyDynamicCalendar(state);
        applyDynamicGallery(state);
        applyDynamicProjects(state);
        applyDynamicActivities(state);
        applyDynamicTeam(state);
        applyDynamicDocuments(state);
        applyDynamicLinks(state);
        applyDynamicContact(state);
        applyDynamicRamos(state);
        applyVisibility(state);
        setupGalleryFilter();
        setupProjectToggles();
        setupContactForm(state);
    });
});

function esc(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function setupMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-nav');

    if (!toggle || !nav) {
        return;
    }

    toggle.addEventListener('click', function () {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');

        const bars = toggle.querySelectorAll('span');
        if (bars.length === 3) {
            bars[0].style.transform = open ? 'translateY(7px) rotate(45deg)' : '';
            bars[1].style.opacity = open ? '0' : '1';
            bars[2].style.transform = open ? 'translateY(-7px) rotate(-45deg)' : '';
        }
    });

    nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            nav.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');

            const bars = toggle.querySelectorAll('span');
            bars.forEach(function (bar) {
                bar.style.transform = '';
                bar.style.opacity = '';
            });
        });
    });
}

function setupHeaderShadow() {
    const header = document.querySelector('.site-header');
    if (!header) {
        return;
    }

    function onScroll() {
        header.classList.toggle('scrolled', window.scrollY > 16);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    // Mark elements for reveal
    const revealSelectors = [
        '.section-head', '.section-title', '.section-text', 
        '.hero-copy h1', '.hero-copy p', '.card', 
        '.team-card', '.doc-card', '.resource-card', 
        '.activity-card', '.project-card', '.notice-card',
        '.floating-card', '.hero-stats div', '.mini-card', '.link-group-card'
    ];

    document.querySelectorAll(revealSelectors.join(', ')).forEach((el, i) => {
        if (!el.classList.contains('reveal')) {
            el.classList.add('reveal', 'reveal-up');
            // Stagger delay for grid items
            const parent = el.parentElement;
            if (parent && (parent.classList.contains('grid') || parent.className.includes('grid'))) {
                const delay = (i % 3) * 100;
                if (delay > 0) el.setAttribute('data-delay', delay);
            }
        }
        observer.observe(el);
    });
}

function setupYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll('.current-year').forEach(function (node) {
        node.textContent = year;
    });
}

function setupCalendar() {
    const calendarRoot = document.querySelector('[data-group-calendar]');
    if (!calendarRoot) {
        return;
    }

    const events = [
        { date: '2026-01-01', title: 'Dia Mundial da Paz', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-01-08', title: 'Falecimento de Baden-Powell (1941 - Nyeri, Quênia)', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-01-12', endDate: '2026-02-12', title: 'Curso Avançado Escotista e Dirigente (EAD)', type: 'grupo', label: 'Curso' },
        { date: '2026-01-24', endDate: '2026-01-25', title: 'Acampamento de Férias Escoteiro (Pioneirias)', type: 'grupo', label: 'Grupo' },
        { date: '2026-01-25', title: 'Encontro Nacional de Núcleos Regionais (Remoto)', type: 'regional', label: 'Regional' },
        { date: '2026-02-07', title: 'INDABA de Abertura', type: 'grupo', label: 'Grupo' },
        { date: '2026-02-14', endDate: '2026-02-17', title: 'Curso Avançado Escotista e Dirigente (presencial - Carnaval)', type: 'grupo', label: 'Curso' },
        { date: '2026-02-16', endDate: '2026-02-17', title: 'Carnaval', type: 'feriado', label: 'Feriado' },
        { date: '2026-02-21', endDate: '2026-02-22', title: 'Reunião do Conselho de Administração Nacional (Remoto)', type: 'regional', label: 'Regional' },
        { date: '2026-02-21', endDate: '2026-02-22', title: 'Reunião da Comissão de Ética e Disciplina Nacional', type: 'regional', label: 'Regional' },
        { date: '2026-02-21', title: 'Retorno das atividades GEARSF', type: 'grupo', label: 'Grupo' },
        { date: '2026-02-21', title: '1ª chamada de novos escoteiros e reunião com responsáveis', type: 'grupo', label: 'Grupo' },
        { date: '2026-02-22', title: 'Dia do Fundador (Nascimento de Baden-Powell)', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-02-28', title: 'Encerramento do exercício de 2025 e entrega dos balanços', type: 'regional', label: 'Regional' },
        { date: '2026-02-28', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-03-07', title: 'Abertura Regional (UEBDF)', type: 'regional', label: 'Regional' },
        { date: '2026-03-09', endDate: '2026-03-27', title: 'Curso Preliminar (EAD)', type: 'grupo', label: 'Curso' },
        { date: '2026-03-13', title: 'Emissão do Parecer da Auditoria Externa', type: 'regional', label: 'Regional' },
        { date: '2026-03-14', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-03-14', title: '4º Congresso Regional Escoteiro', type: 'regional', label: 'Regional' },
        { date: '2026-03-14', title: 'Fórum de Jovens Líderes', type: 'regional', label: 'Regional' },
        { date: '2026-03-14', title: 'Fóruns dos Ramos', type: 'regional', label: 'Regional' },
        { date: '2026-03-15', title: 'Assembleia Regional', type: 'regional', label: 'Regional' },
        { date: '2026-03-16', title: 'Reunião da Comissão Fiscal Nacional', type: 'regional', label: 'Regional' },
        { date: '2026-03-17', title: 'Divulgação das Demonstrações Contábeis 2025', type: 'regional', label: 'Regional' },
        { date: '2026-03-21', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-03-21', title: 'Assembleia de Grupo', type: 'grupo', label: 'Grupo' },
        { date: '2026-03-21', title: '2ª chamada de novos membros', type: 'grupo', label: 'Grupo' },
        { date: '2026-03-28', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-03-28', title: 'Curso Preliminar (presencial)', type: 'grupo', label: 'Curso' },
        { date: '2026-04-03', title: 'Sexta-feira Santa', type: 'feriado', label: 'Feriado' },
        { date: '2026-04-04', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-04-11', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-04-11', title: '3ª chamada de novos membros', type: 'grupo', label: 'Grupo' },
        { date: '2026-04-11', endDate: '2026-04-26', title: 'Semana Escoteira', type: 'grupo', label: 'Grupo' },
        { date: '2026-04-18', endDate: '2026-06-14', title: 'Mutirão Nacional de Doação de Sangue e REDOME', type: 'regional', label: 'Regional' },
        { date: '2026-04-18', title: '10º Grande Jogo Aéreo (grupo)', type: 'grupo', label: 'Grupo' },
        { date: '2026-04-18', title: '12º Grande Jogo Aéreo', type: 'regional', label: 'Regional' },
        { date: '2026-04-18', endDate: '2026-04-21', title: '31º Congresso Escoteiro Nacional', type: 'regional', label: 'Regional' },
        { date: '2026-04-18', endDate: '2026-04-21', title: '32ª Assembleia Escoteira Nacional', type: 'regional', label: 'Regional' },
        { date: '2026-04-18', endDate: '2026-04-21', title: 'Reuniões dos Conselhos de Administração e Consultivo', type: 'regional', label: 'Regional' },
        { date: '2026-04-18', endDate: '2026-04-21', title: '31º Fórum de Jovens Líderes', type: 'regional', label: 'Regional' },
        { date: '2026-04-21', title: 'Tiradentes', type: 'feriado', label: 'Feriado' },
        { date: '2026-04-23', title: 'Dia do Escoteiro', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-04-25', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-04-25', endDate: '2026-04-26', title: 'Curso CATAr (Técnicas do Ar - Adulto)', type: 'grupo', label: 'Curso' },
        { date: '2026-04-28', title: 'Dia do Escoteiro do Ar e Dia da Educação', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-05-01', title: 'Dia do Trabalho', type: 'feriado', label: 'Feriado' },
        { date: '2026-05-01', endDate: '2026-05-31', title: '10º EducAção Escoteira', type: 'regional', label: 'Regional' },
        { date: '2026-05-02', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-05-04', endDate: '2026-05-29', title: 'Curso Intermediário (EAD)', type: 'grupo', label: 'Curso' },
        { date: '2026-05-09', title: 'Encontro Nacional de Segurança da Informação (Evento 1)', type: 'regional', label: 'Regional' },
        { date: '2026-05-09', title: 'Seminário de Diálogo Inter-religioso', type: 'regional', label: 'Regional' },
        { date: '2026-05-09', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-05-16', endDate: '2026-05-17', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-05-16', endDate: '2026-05-17', title: 'ERTE + Jogo da Cidade', type: 'grupo', label: 'Grupo' },
        { date: '2026-05-22', endDate: '2026-05-23', title: 'Festa Junina', type: 'grupo', label: 'Grupo' },
        { date: '2026-05-23', endDate: '2026-05-24', title: 'Arepio', type: 'grupo', label: 'Grupo' },
        { date: '2026-05-30', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-05-30', endDate: '2026-05-31', title: 'Curso Intermediário (presencial)', type: 'grupo', label: 'Curso' },
        { date: '2026-06-01', endDate: '2026-06-30', title: '35º Mutirão Nacional de Ação Ecológica', type: 'regional', label: 'Regional' },
        { date: '2026-06-04', title: 'Corpus Christi', type: 'feriado', label: 'Feriado' },
        { date: '2026-06-04', endDate: '2026-06-07', title: 'Capacitações Estratégicas Nacionais', type: 'regional', label: 'Regional' },
        { date: '2026-06-05', title: 'Dia Mundial do Meio Ambiente', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-06-06', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-06-11', title: 'Dia do Escoteiro do Mar', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-06-13', endDate: '2026-06-14', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-06-13', endDate: '2026-06-14', title: 'Bivaque do Ramo Filhotes', type: 'grupo', label: 'Grupo' },
        { date: '2026-06-14', title: 'Fundação do Escotismo no Brasil (1910)', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-06-18', title: 'Dia do Sênior', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-06-20', endDate: '2026-06-21', title: '14º Scout’s Field Day (Radioescotismo)', type: 'regional', label: 'Regional' },
        { date: '2026-06-20', title: '35º MUTECO (atividade de grupo)', type: 'grupo', label: 'Grupo' },
        { date: '2026-06-27', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-06-27', endDate: '2026-06-28', title: 'Encerramento do 1º semestre', type: 'grupo', label: 'Grupo' },
        { date: '2026-06-27', endDate: '2026-06-28', title: 'ARDIS (Acampamento Regional Sênior)', type: 'regional', label: 'Regional' },
        { date: '2026-06-29', title: 'Dia do Pioneiro', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-07-04', title: 'INDABA de Avaliação e início do recesso', type: 'grupo', label: 'Grupo' },
        { date: '2026-07-11', title: 'Recesso Escoteiro', type: 'grupo', label: 'Grupo' },
        { date: '2026-07-13', title: 'Nascimento de Caio Vianna Martins', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-07-18', title: 'Recesso', type: 'grupo', label: 'Grupo' },
        { date: '2026-07-18', title: 'Congresso Regional de Educação Não-Formal', type: 'regional', label: 'Regional' },
        { date: '2026-07-18', endDate: '2026-07-22', title: 'Moot Nacional Pioneiro', type: 'regional', label: 'Nacional' },
        { date: '2026-07-25', title: 'Retorno das atividades', type: 'grupo', label: 'Grupo' },
        { date: '2026-07-25', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-07-25', title: '1ª chamada de novos membros', type: 'grupo', label: 'Grupo' },
        { date: '2026-07-25', title: 'Bivaque de férias (festival de comida mateira)', type: 'grupo', label: 'Grupo' },
        { date: '2026-07-31', title: 'Divulgação do Calendário Nacional 2027', type: 'regional', label: 'Regional' },
        { date: '2026-08-01', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-08-01', title: '2ª chamada de novos membros', type: 'grupo', label: 'Grupo' },
        { date: '2026-08-01', title: 'Dia do Escotismo', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-08-01', endDate: '2026-08-31', title: '9º Dia do Amigo', type: 'regional', label: 'Regional' },
        { date: '2026-08-04', title: 'Webnário Regime Disciplinar da UEB (Remoto)', type: 'regional', label: 'Regional' },
        { date: '2026-08-06', title: 'Dia Interamericano do Escotista', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-08-08', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-08-08', title: '3ª chamada de novos membros', type: 'grupo', label: 'Grupo' },
        { date: '2026-08-12', title: 'Dia Internacional da Juventude', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-08-14', endDate: '2026-08-16', title: 'AeroMosquito Show', type: 'grupo', label: 'Grupo' },
        { date: '2026-08-15', endDate: '2026-08-16', title: 'Reunião do Conselho de Administração Nacional', type: 'regional', label: 'Regional' },
        { date: '2026-08-15', endDate: '2026-08-16', title: 'Grande Jogo Naval', type: 'regional', label: 'Regional' },
        { date: '2026-08-15', endDate: '2026-08-16', title: 'Encontro Regional de Jovens Líderes', type: 'regional', label: 'Regional' },
        { date: '2026-08-22', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-08-29', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-08-29', title: '68º aniversário do Escotismo no DF', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-08-29', endDate: '2026-08-30', title: '6ª Atividade Nacional de Radioescotismo', type: 'regional', label: 'Regional' },
        { date: '2026-08-29', endDate: '2026-08-30', title: 'Grande Jogo Naval', type: 'regional', label: 'Regional' },
        { date: '2026-08-29', endDate: '2026-08-30', title: 'Radioescotismo (Echolink/DMR)', type: 'regional', label: 'Regional' },
        { date: '2026-09-01', title: 'Encontro do 1º Grupo de Gilwell', type: 'regional', label: 'Regional' },
        { date: '2026-09-01', endDate: '2026-09-30', title: '28º Mutirão Nacional de Ação Comunitária', type: 'regional', label: 'Regional' },
        { date: '2026-09-05', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-09-05', endDate: '2026-09-07', title: 'Laboratório Técnico do Programa Educativo', type: 'regional', label: 'Regional' },
        { date: '2026-09-05', endDate: '2026-09-07', title: 'Moot Regional Pioneiro', type: 'regional', label: 'Regional' },
        { date: '2026-09-07', title: 'Independência do Brasil', type: 'feriado', label: 'Feriado' },
        { date: '2026-09-12', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-09-14', endDate: '2026-11-02', title: 'Curso Preliminar (EAD)', type: 'grupo', label: 'Curso' },
        { date: '2026-09-19', title: 'Encontro Nacional de Segurança da Informação (Evento 2)', type: 'regional', label: 'Regional' },
        { date: '2026-09-19', endDate: '2026-09-20', title: 'Encontro Nacional de Comunicação', type: 'regional', label: 'Regional' },
        { date: '2026-09-19', title: '28º MUTCOM (grupo)', type: 'grupo', label: 'Grupo' },
        { date: '2026-09-20', title: 'Dia Mundial da Limpeza', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-09-21', title: 'Dia Internacional da Paz', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-09-26', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-09-26', endDate: '2026-09-27', title: 'Reunião do Conselho Consultivo', type: 'regional', label: 'Regional' },
        { date: '2026-09-26', endDate: '2026-09-27', title: '49ª Jan-Bra', type: 'regional', label: 'Regional' },
        { date: '2026-09-30', title: 'Divulgação dos Calendários Regionais 2027', type: 'regional', label: 'Regional' },
        { date: '2026-10-01', endDate: '2026-11-06', title: 'Curso Intermediário (EAD)', type: 'grupo', label: 'Curso' },
        { date: '2026-10-03', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-10-03', title: 'Curso Preliminar (presencial)', type: 'grupo', label: 'Curso' },
        { date: '2026-10-04', title: 'Dia do Lobinho', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-10-10', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-10-12', title: 'Nossa Senhora Aparecida', type: 'feriado', label: 'Feriado' },
        { date: '2026-10-16', endDate: '2026-10-18', title: 'JOTA/JOTI', type: 'grupo', label: 'Grupo' },
        { date: '2026-10-16', endDate: '2026-10-18', title: 'JOTA/JOTI (Jamboree do Ar e Internet)', type: 'regional', label: 'Regional' },
        { date: '2026-10-17', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-10-17', endDate: '2026-10-18', title: 'Reunião do Conselho de Administração Nacional', type: 'regional', label: 'Regional' },
        { date: '2026-10-17', endDate: '2026-10-18', title: 'Encontro Nacional das Comissões de Ética Regionais', type: 'regional', label: 'Regional' },
        { date: '2026-10-17', title: '55º aniversário do grupo GEARSF', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-10-24', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-10-31', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-11-02', title: 'Finados', type: 'feriado', label: 'Feriado' },
        { date: '2026-11-04', title: '102 anos da UEB', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-11-04', title: 'Aniversário da União dos Escoteiros do Brasil (102 anos - 1924)', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-11-07', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-11-07', endDate: '2026-11-08', title: 'Curso Intermediário (presencial)', type: 'grupo', label: 'Curso' },
        { date: '2026-11-14', title: 'Atividades das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-11-15', title: 'Proclamação da República', type: 'feriado', label: 'Feriado' },
        { date: '2026-11-20', title: 'Dia da Consciência Negra', type: 'feriado', label: 'Feriado' },
        { date: '2026-11-20', endDate: '2026-11-22', title: 'Encontro Nacional de Jovens Líderes (João Pessoa - PB)', type: 'regional', label: 'Regional' },
        { date: '2026-11-21', title: 'Atividades das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-11-21', endDate: '2026-11-22', title: 'Vigília Regional Pioneira', type: 'regional', label: 'Regional' },
        { date: '2026-11-27', endDate: '2026-11-29', title: 'Acampamento de Grupo (encerramento do ano)', type: 'grupo', label: 'Grupo' },
        { date: '2026-11-30', title: 'Dia do Evangélico', type: 'feriado', label: 'Feriado' },
        { date: '2026-12-03', title: 'Encontro Regional de Formadores', type: 'regional', label: 'Regional' },
        { date: '2026-12-05', title: 'INDABA de Encerramento', type: 'grupo', label: 'Grupo' },
        { date: '2026-12-05', title: 'Dia Internacional do Voluntariado', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-12-25', title: 'Natal', type: 'feriado', label: 'Feriado' }
    ];

    const monthLabel = calendarRoot.querySelector('[data-cal-month]');
    const grid = calendarRoot.querySelector('[data-cal-grid]');
    const eventsList = calendarRoot.querySelector('[data-cal-events]');
    const prevBtn = calendarRoot.querySelector('[data-cal-prev]');
    const nextBtn = calendarRoot.querySelector('[data-cal-next]');
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    function formatDateRange(event) {
        const start = event.date.split('-').map(Number);
        if (!event.endDate) {
            return String(start[2]).padStart(2, '0') + '/' + String(start[1]).padStart(2, '0') + '/' + start[0];
        }

        const end = event.endDate.split('-').map(Number);
        return (
            String(start[2]).padStart(2, '0') + '/' + String(start[1]).padStart(2, '0') + '/' + start[0] +
            ' - ' +
            String(end[2]).padStart(2, '0') + '/' + String(end[1]).padStart(2, '0') + '/' + end[0]
        );
    }

    function eventCoversDate(event, targetDate) {
        const startDate = new Date(event.date + 'T00:00:00');
        const endDate = new Date((event.endDate || event.date) + 'T23:59:59');
        return targetDate >= startDate && targetDate <= endDate;
    }

    function shouldHighlightDate(event, targetDate) {
        const startDate = new Date(event.date + 'T00:00:00');

        if (!event.endDate) {
            return targetDate.getTime() === startDate.getTime();
        }

        const endDate = new Date(event.endDate + 'T00:00:00');
        const diffDays = Math.round((endDate - startDate) / 86400000) + 1;

        if (diffDays <= 4) {
            return eventCoversDate(event, targetDate);
        }

        return targetDate.getTime() === startDate.getTime();
    }

    function renderEvents() {
        const monthlyEvents = events
            .filter(function (event) {
                const start = event.date.split('-').map(Number);
                const end = (event.endDate || event.date).split('-').map(Number);
                const eventStart = new Date(start[0], start[1] - 1, start[2]);
                const eventEnd = new Date(end[0], end[1] - 1, end[2]);
                const monthStart = new Date(currentYear, currentMonth, 1);
                const monthEnd = new Date(currentYear, currentMonth + 1, 0);
                return eventStart <= monthEnd && eventEnd >= monthStart;
            })
            .sort(function (a, b) {
                return a.date.localeCompare(b.date);
            });

        eventsList.innerHTML = '';

        if (monthlyEvents.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'empty';
            empty.textContent = 'Sem eventos especiais cadastrados para este mês.';
            eventsList.appendChild(empty);
            return;
        }

        monthlyEvents.forEach(function (event) {
            const item = document.createElement('li');
            item.innerHTML =
                '<div class="event-meta">' +
                '<span class="tag ' + event.type + '">' + (event.label || event.type) + '</span>' +
                '<span>' + formatDateRange(event) + '</span>' +
                '</div>' +
                '<div class="event-title">' + event.title + '</div>';
            eventsList.appendChild(item);
        });
    }

    function renderCalendar() {
        monthLabel.textContent = months[currentMonth] + ' de ' + currentYear;
        grid.innerHTML = '';

        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);

        for (let i = 0; i < firstDay.getDay(); i += 1) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            grid.appendChild(empty);
        }

        for (let day = 1; day <= lastDay.getDate(); day += 1) {
            const cell = document.createElement('div');
            const currentDate = new Date(currentYear, currentMonth, day);
            const highlightedEvents = events.filter(function (event) {
                return shouldHighlightDate(event, currentDate);
            });

            cell.className = 'calendar-day';
            cell.textContent = String(day);

            if (currentDate.getDay() === 6) {
                cell.classList.add('saturday');
            }

            if (
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear()
            ) {
                cell.classList.add('today');
            }

            if (highlightedEvents.length > 0) {
                cell.classList.add('has-event');
                if (highlightedEvents.some(function (event) { return event.type === 'feriado'; })) {
                    cell.classList.add('has-holiday');
                } else if (highlightedEvents.some(function (event) { return event.type === 'comemorativo'; })) {
                    cell.classList.add('has-commemorative');
                } else if (highlightedEvents.some(function (event) { return event.type === 'regional'; })) {
                    cell.classList.add('has-regional');
                }
            }

            grid.appendChild(cell);
        }

        renderEvents();
    }

    prevBtn.addEventListener('click', function () {
        currentMonth -= 1;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear -= 1;
        }
        renderCalendar();
    });

    nextBtn.addEventListener('click', function () {
        currentMonth += 1;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear += 1;
        }
        renderCalendar();
    });

    renderCalendar();
}

function setupGalleryFilter() {
    const buttons = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.gallery-item');

    if (buttons.length === 0 || items.length === 0) {
        return;
    }

    buttons.forEach(function (button) {
        button.addEventListener('click', function () {
            const filter = button.getAttribute('data-filter');

            buttons.forEach(function (node) {
                node.classList.remove('active');
            });
            button.classList.add('active');

            items.forEach(function (item) {
                const visible = filter === 'all' || item.getAttribute('data-category') === filter;
                item.style.display = visible ? '' : 'none';
            });
        });
    });
}

function setupProjectToggles() {
    const toggles = document.querySelectorAll('.project-toggle');

    toggles.forEach(function (toggle) {
        toggle.addEventListener('click', function () {
            const card = toggle.closest('.project-card');
            if (!card) {
                return;
            }

            const expanded = card.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            toggle.textContent = expanded ? 'Fechar detalhes' : 'Saiba mais';
        });
    });
}

// ── Site Content Dynamic Fetching ───────────────────────────────
// Version LOG to confirm update: v1.0.3 - Sinc Total
console.log("%c[GEAR 9º DF]%c Script de conteúdo iniciado.", "color:#2563eb;font-weight:bold;", "color:inherit;");

var SITE_CONTENT_CACHE = null;

function fetchSiteContent() {
    console.log("[API] Buscando conteúdo do site...");
    return window.apiFetch('/content')
        .then(function(data) { 
            console.log("[API] Conteúdo recebido com sucesso:", data);
            SITE_CONTENT_CACHE = data; 
            return data; 
        })
        .catch(function(err) { 
            console.error("[API ERROR] Falha ao carregar conteúdo. Verifique se o CORS_ORIGINS está correto no Railway.", err);
            return { pages: {}, adminPanel: {} }; 
        });
}

function applyDynamicCalendar(state) {
    var events = (state.adminPanel && Array.isArray(state.adminPanel.events)) ? state.adminPanel.events : [];
    if (!events.length) { setupCalendar(); return; } // fallback
    // We will just invoke setupCalendar but we should realistically merge.
    // Since setupCalendar is complex, we just prepend admin events to it globally if needed.
    window.ADMIN_EVENTS = events; 
    setupCalendar();
}

function applyDynamicGallery(state) {
    var container = document.getElementById('gallery-dynamic');
    if (!container) return;
    var photos = (state.adminPanel && Array.isArray(state.adminPanel.photos)) ? state.adminPanel.photos : [];
    if (!photos.length) return;
    container.innerHTML = photos.map(function(p) {
        return '<article class="gallery-item" data-category="' + esc(p.category) + '">' +
            '<img loading="lazy" src="' + esc(p.src) + '" alt="' + esc(p.title) + '" class="cover-image">' +
            '<div class="gallery-overlay"><span>' + esc(p.title) + '</span><small>' + esc(p.caption || '') + '</small></div>' +
        '</article>';
    }).join("");
}

function applyDynamicProjects(state) {
    var container = document.getElementById('projects-dynamic');
    if (!container) return;
    var projects = (state.adminPanel && Array.isArray(state.adminPanel.projects)) ? state.adminPanel.projects : [];
    if (!projects.length) return;
    container.innerHTML = projects.map(function(p) {
        var imgHtml = p.src
            ? '<div class="project-image"><img loading="lazy" src="' + esc(p.src) + '" alt="' + esc(p.title) + '" class="cover-image"></div>'
            : '';
        return '<article class="project-card">' +
            imgHtml +
            '<div class="project-body">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                   '<span class="badge badge-gray">' + esc(p.category || p.meta || '') + '</span>' +
                   '<span class="badge ' + (p.status==='ativo'?'badge-green':'badge-amber') + '">' + esc(p.status) + '</span>' +
                '</div>' +
                '<h3>' + (p.icon ? p.icon + ' ' : '') + esc(p.title) + '</h3>' +
                '<p>' + esc(p.description || '') + '</p>' +
            '</div></article>';
    }).join("");
}

function applyDynamicActivities(state) {
    var container = document.getElementById('activities-dynamic');
    if (!container) return;
    var activities = (state.adminPanel && Array.isArray(state.adminPanel.activities)) ? state.adminPanel.activities : [];
    if (!activities.length) return;
    container.innerHTML = activities.map(function(a) {
        return '<article class="activity-card">' +
            '<div class="activity-body">' +
                '<span class="info-icon"><i class="fas fa-star"></i></span>' +
                (a.icon ? '<span style="font-size:2rem;margin-bottom:8px;display:block">' + esc(a.icon) + '</span>' : '') +
                '<h3>' + esc(a.title) + '</h3>' +
                '<p>' + esc(a.description || '') + '</p>' +
                (a.category ? '<div style="margin-top:14px"><span class="badge badge-gray">' + esc(a.category) + '</span></div>' : '') +
            '</div></article>';
    }).join("");
}

function applyDynamicTeam(state) {
    var container = document.getElementById('team-dynamic');
    if (!container) return;
    var members = (state.adminPanel && Array.isArray(state.adminPanel.members)) ? state.adminPanel.members : [];
    var activeMembers = members.filter(function(m) { return m.status === 'ativo'; });
    if (!activeMembers.length) return;
    container.innerHTML = "";
    activeMembers.sort(function(a, b) {
        var aDir = a.role.toLowerCase().includes('diretor') ? -1 : 1;
        var bDir = b.role.toLowerCase().includes('diretor') ? -1 : 1;
        if (aDir !== bDir) return aDir - bDir;
        return a.name.localeCompare(b.name);
    });
    activeMembers.forEach(function(m) {
        var card = document.createElement('article');
        card.className = 'team-card animate-on-scroll';
        var initials = m.name.trim().split(/\\s+/).slice(0,2).map(function(w){return w[0].toUpperCase()}).join("");
        card.innerHTML = 
            '<div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;">' +
               '<div style="width:48px;height:48px;border-radius:12px;background:var(--blue-100);color:var(--blue-700);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0;">' + initials + '</div>' +
               '<div style="display:flex;flex-direction:column;gap:4px">' +
                 '<span class="team-role" style="margin:0;font-size:12px;opacity:0.8">' + esc(m.branch || 'Apoio') + '</span>' +
                 '<h3 style="margin:0;font-size:1.1rem;line-height:1.2;">' + esc(m.name) + '</h3>' +
               '</div>' +
            '</div>' +
            '<p style="font-size:0.92rem;line-height:1.6;margin-top:0">' + esc(m.role) + (m.since ? ' desde ' + esc(m.since) : '') + '.</p>';
        container.appendChild(card);
    });
}

function applyDynamicDocuments(state) {
    const container = document.getElementById('docs-dynamic');
    if (!container) return;
    const docs = (state.adminPanel && Array.isArray(state.adminPanel.documents)) ? state.adminPanel.documents : [];
    if (!docs.length) return;
    
    container.innerHTML = docs.map(d => `
        <article class="doc-card">
            <div class="doc-card-head">
                <span class="info-icon"><i class="fas ${d.src && d.src.endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-lines'}"></i></span>
                <div>
                    <h3>${esc(d.title)}</h3>
                    <p>${esc(d.desc || '')}</p>
                </div>
            </div>
            <div class="doc-meta">
                <span class="badge badge-gray">${esc(d.category || 'Geral')}</span>
                <div class="doc-actions">
                    <a href="${esc(d.src)}" target="_blank" class="btn btn-primary btn-small">Visualizar</a>
                    <a href="${esc(d.src)}" download class="btn btn-outline btn-small">Baixar</a>
                </div>
            </div>
        </article>
    `).join("");
    setupScrollAnimations(); // Refresh animations for new elements
}

function applyDynamicLinks(state) {
    const container = document.getElementById('links-dynamic');
    if (!container) return;
    const links = (state.adminPanel && Array.isArray(state.adminPanel.links)) ? state.adminPanel.links : [];

    if (!links.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-link"></i><p>Nenhum link útil cadastrado no momento.</p></div>';
        return;
    }

    // Change class to support the new grid layout
    container.className = 'links-grid';

    container.innerHTML = links.map(l => {
        const items = Array.isArray(l.items) ? l.items : (l.href ? [{ label: 'Acessar Link', href: l.href }] : []);
        return `
        <article class="link-group-card reveal reveal-up">
            <div class="link-group-head">
                <div class="link-group-icon"><i class="fas ${esc(l.icon || 'fa-link')}"></i></div>
                <h3>${esc(l.title)}</h3>
                <p>${esc(l.desc || '')}</p>
            </div>
            <div class="link-items">
                ${items.map(item => `
                    <a href="${esc(item.href)}" target="_blank" class="link-item">
                        <span>${esc(item.label)}</span>
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                `).join("")}
            </div>
        </article>
    `;
    }).join("");
    setupScrollAnimations();
}

function applyDynamicContact(state) {
    var c = state.adminPanel && state.adminPanel.contact ? state.adminPanel.contact : null;
    if (!c) return;
    // Email
    document.querySelectorAll('[data-contact-email]').forEach(function(el) {
        if (c.email) { el.textContent = c.email; el.href = 'mailto:' + c.email; }
    });
    // Telefone principal (suporta phonePrimary ou phone)
    var phone = c.phonePrimary || c.phone || '';
    document.querySelectorAll('[data-contact-phone]').forEach(function(el) {
        if (phone) { el.textContent = phone; el.href = 'https://wa.me/' + phone.replace(/\D/g, ''); }
    });
    // Endereço
    document.querySelectorAll('[data-contact-address]').forEach(function(el) {
        if (c.address) el.textContent = c.address;
    });
    // Horário (suporta schedule ou hours)
    var schedule = c.schedule || c.hours || '';
    document.querySelectorAll('[data-contact-hours]').forEach(function(el) {
        if (schedule) el.textContent = schedule;
    });
    // Instagram
    document.querySelectorAll('[data-contact-instagram]').forEach(function(el) {
        if (c.instagram) { el.textContent = c.instagram; if (el.tagName === 'A') el.href = 'https://instagram.com/' + c.instagram.replace('@',''); }
    });
}

function applyDynamicRamos(state) {
    var branches = state.adminPanel && state.adminPanel.branches ? state.adminPanel.branches : null;
    if (!branches) return;

    // Mapa: chave do branch => seletor do article na página ramo.html
    var branchOrder = ['filhotes', 'lobinhos', 'escoteiros', 'seniores', 'pioneiros'];
    var articles = Array.from(document.querySelectorAll('[data-branch]'));

    branchOrder.forEach(function(key) {
        var b = branches[key];
        if (!b) return;

        // Encontrar o article correspondente
        var el = document.querySelector('[data-branch="' + key + '"]');
        if (!el) return;

        // Textos
        var nameEl = el.querySelector('[data-branch-name]');
        if (nameEl && b.name) nameEl.textContent = b.name;

        var ageEl = el.querySelector('[data-branch-age]');
        if (ageEl && b.age) ageEl.textContent = b.age;

        var descEl = el.querySelector('[data-branch-desc]');
        if (descEl && (b.short || b.long)) descEl.textContent = b.long || b.short;

        // Bullets / lista de pontos
        if (b.bullets && b.bullets.length) {
            var ul = el.querySelector('[data-branch-bullets]');
            if (ul) {
                ul.innerHTML = b.bullets.map(function(pt) {
                    return '<li><i class="fas fa-check-circle"></i>' + esc(pt) + '</li>';
                }).join('');
            }
        }

        // Imagens
        if (b.images) {
            var mainImg = el.querySelector('[data-branch-img="main"]');
            if (mainImg && b.images.main) mainImg.src = b.images.main;

            var badgeImg = el.querySelector('[data-branch-img="badge"]');
            if (badgeImg && b.images.badge) badgeImg.src = b.images.badge;

            var thumb1Img = el.querySelector('[data-branch-img="thumb1"]');
            if (thumb1Img && b.images.thumb1) thumb1Img.src = b.images.thumb1;

            var thumb2Img = el.querySelector('[data-branch-img="thumb2"]');
            if (thumb2Img && b.images.thumb2) thumb2Img.src = b.images.thumb2;
        }
    });
}

function applyVisibility(state) {
    var v = state.adminPanel && state.adminPanel.settings && state.adminPanel.settings.visibility ? state.adminPanel.settings.visibility : {};
    if (v.gallery === false) { var g = document.getElementById('gallery-dynamic'); if (g) g.closest('section').style.display = 'none'; }
    if (v.projects === false) { var p = document.getElementById('projects-dynamic'); if (p) p.closest('section').style.display = 'none'; }
    if (v.contactForm === false) { var c = document.getElementById('contact-form-panel'); if (c) c.style.display = 'none'; }
}

// ── Contact Form Override ─────────────────────────────────────────
function getCurrentPageName() {
    var name = window.location.pathname.split('/').pop();
    return name || 'index.html';
}

function buildAdminPath(element, root) {
    var parts = [];
    var current = element;
    while (current && current !== root) {
        var tag = current.tagName.toLowerCase();
        var index = 1;
        var sibling = current.previousElementSibling;
        while (sibling) {
            if (sibling.tagName === current.tagName) index += 1;
            sibling = sibling.previousElementSibling;
        }
        parts.unshift(tag + ':nth-of-type(' + index + ')');
        current = current.parentElement;
    }
    return parts.join('>'); // format igual ao admin.js para garantir match de chaves
}

function getEditableTextNodes(root) {
    return Array.from(root.querySelectorAll('h1, h2, h3, h4, p, .eyebrow, .btn'))
        .filter(function (node) {
            if (!node.textContent || !node.textContent.trim()) return false;
            if (node.closest('.admin-shell')) return false;
            return true;
        })
        .map(function (node, index) {
            return {
                index: index,
                key: buildAdminPath(node, root),
                element: node
            };
        });
}

function getEditableImages(root) {
    return Array.from(root.querySelectorAll('img'))
        .filter(function (node) { return !node.closest('.admin-shell'); })
        .map(function (node, index) {
            return {
                index: index,
                key: buildAdminPath(node, root),
                element: node
            };
        });
}

function getEditableSections(root) {
    return Array.from(root.children)
        .filter(function (node) {
            return node.tagName === 'SECTION' && !node.classList.contains('admin-extra-section');
        })
        .map(function (node, index) {
            return {
                index: index,
                key: buildAdminPath(node, root),
                element: node
            };
        });
}

function writeEditableText(node, value) {
    if (node.classList.contains('btn')) {
        var icon = node.querySelector('i');
        if (icon) {
            var iconClone = icon.cloneNode(true);
            node.innerHTML = '';
            node.appendChild(document.createTextNode(value + ' '));
            node.appendChild(iconClone);
            return;
        }
        node.textContent = value;
        return;
    }
    node.innerHTML = value;
}

function renderAdminExtraSections(root, pageState) {
    Array.from(root.querySelectorAll('.admin-extra-section')).forEach(function (s) { s.remove(); });
    (pageState.extras || []).forEach(function (extra) {
        var section = document.createElement('section');
        section.className = 'section admin-extra-section' + (extra.tone === 'soft' ? ' section-soft' : '') + (extra.tone === 'dark' ? ' cta-band' : '');
        if (extra.tone === 'dark') {
            section.innerHTML = '<div class="shell cta-layout"><div><div class="eyebrow light">Seção personalizada</div>' +
                '<h2>' + esc(extra.title || 'Nova seção') + '</h2><p>' + esc(extra.text || '') + '</p></div>' +
                '<div class="button-row">' + (extra.buttonLabel && extra.buttonHref ? '<a href="' + esc(extra.buttonHref) + '" class="btn btn-light">' + esc(extra.buttonLabel) + '</a>' : '') + '</div></div>';
        } else {
            section.innerHTML = '<div class="shell"><div class="split-layout"><div><div class="eyebrow">Seção personalizada</div>' +
                '<h2 class="section-title left">' + esc(extra.title || 'Nova seção') + '</h2><p class="section-text">' + esc(extra.text || '') + '</p>' +
                (extra.buttonLabel && extra.buttonHref ? '<div class="button-row"><a href="' + esc(extra.buttonHref) + '" class="btn btn-primary">' + esc(extra.buttonLabel) + '</a></div>' : '') + '</div>' +
                (extra.imageSrc ? '<div class="media-card"><img src="' + esc(extra.imageSrc) + '" class="cover-image" loading="lazy"></div>' : '') + '</div></div>';
        }
        root.appendChild(section);
    });
}

function ensurePageState(state, pageName) {
    if (!state.pages) state.pages = {};
    if (!state.pages[pageName]) state.pages[pageName] = { text: {}, images: {}, sections: {}, extras: [] };
    var p = state.pages[pageName];
    p.text = p.text || {}; p.images = p.images || {}; p.sections = p.sections || {}; p.extras = p.extras || [];
    return p;
}

function applyAdminContent(state) {
    var root = document.querySelector('main');
    if (!root) return;
    
    // Se vier sem estado, tenta usar o cache global
    if (!state) state = SITE_CONTENT_CACHE;
    if (!state) return;

    var pageName = getCurrentPageName();
    var pageState = ensurePageState(state, pageName);

    getEditableTextNodes(root).forEach(function (entry) {
        if (pageState.text && Object.prototype.hasOwnProperty.call(pageState.text, entry.key)) {
            writeEditableText(entry.element, pageState.text[entry.key]);
        }
    });

    getEditableImages(root).forEach(function (entry) {
        var img = pageState.images ? pageState.images[entry.key] : undefined;
        if (img && Object.prototype.hasOwnProperty.call(img, 'src')) entry.element.setAttribute('src', img.src || '');
        if (img && Object.prototype.hasOwnProperty.call(img, 'alt')) entry.element.setAttribute('alt', img.alt || '');
    });

    getEditableSections(root).forEach(function (entry) {
        var s = pageState.sections[entry.key];
        if (s) entry.element.hidden = !!s.hidden;
    });

    renderAdminExtraSections(root, pageState);
}

function setupContactForm(state) {
    var form = document.getElementById('contactForm') || document.querySelector('.contact-form-panel');
    if (!form) return;
    var btn = form.querySelector('button[type="submit"]') || form.querySelector('button');
    var feedback = document.getElementById('contactFeedback');
    var draftWrapper = document.getElementById('contactDraftWrapper');
    var draftField = document.getElementById('contactDraft');
    var subjectInput = document.getElementById('subject');
    var subjectChips = form.querySelectorAll('[data-subject-option]');
    if (btn) { btn.innerHTML = 'Enviar mensagem <i class="fas fa-paper-plane"></i>'; }
    subjectChips.forEach(function(chip) {
        chip.addEventListener('click', function() {
            if (!subjectInput) return;
            subjectInput.value = chip.dataset.subjectOption || '';
            subjectInput.focus();
            subjectChips.forEach(function(item) { item.classList.remove('active'); });
            chip.classList.add('active');
        });
    });
    if (subjectInput) {
        subjectInput.addEventListener('input', function() {
            var current = subjectInput.value.trim();
            subjectChips.forEach(function(chip) {
                chip.classList.toggle('active', current && current === (chip.dataset.subjectOption || ''));
            });
        });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var nameInput = document.getElementById('name');
        var emailInput = document.getElementById('email');
        var messageInput = document.getElementById('message');
        var name = nameInput ? nameInput.value.trim() : '';
        var email = emailInput ? emailInput.value.trim() : '';
        var subject = subjectInput ? subjectInput.value.trim() : '';
        var msg = messageInput ? messageInput.value.trim() : '';

        if (!name || !email || !msg) {
            if (feedback) {
                feedback.innerHTML = '<span style="color:#b91c1c;font-weight:600;"><i class="fas fa-circle-exclamation"></i> Preencha nome, e-mail e mensagem.</span>';
            }
            return;
        }

        if (feedback) {
            feedback.innerHTML = '<span style="color:var(--blue-600);font-weight:600;"><i class="fas fa-spinner fa-spin"></i> Enviando mensagem...</span>';
        }
        if (draftWrapper) draftWrapper.hidden = true;
        if (btn) btn.disabled = true;

        var payload = { name: name, email: email, subject: subject || 'Contato pelo site', message: msg };
        window.apiFetch('/contact', { method: 'POST', body: payload })
        .then(function() {
            if (feedback) {
                feedback.innerHTML = '<span style="color:var(--blue-600);font-weight:600;"><i class="fas fa-check-circle"></i> Mensagem enviada com sucesso!</span>';
            }
            if (draftField) {
                draftField.value =
                    'Nome: ' + name + '\n' +
                    'E-mail: ' + email + '\n' +
                    'Assunto: ' + (subject || 'Contato pelo site') + '\n\n' +
                    msg;
            }
            if (draftWrapper) draftWrapper.hidden = false;
            form.reset();
        })
        .catch(function(error) {
            if (feedback) {
                feedback.innerHTML = '<span style="color:#b91c1c;font-weight:600;"><i class="fas fa-exclamation-circle"></i> Erro ao enviar: ' + esc(error && error.message ? error.message : 'tente novamente.') + '</span>';
            }
        })
        .finally(function() {
            if (btn) btn.disabled = false;
        });
    });
}

function loadAdminState() {
    return SITE_CONTENT_CACHE || { pages: {} };
}

function setupAdminShortcut() {
    window.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.shiftKey && event.key === '9') {
            event.preventDefault();
            window.location.href = '/admin?page=' + encodeURIComponent(getCurrentPageName());
        }
    });
}

function setupAdminMode() {
    setupAdminShortcut();

    var params = new URLSearchParams(window.location.search);
    if (params.get('gearadmin') !== '1') {
        return;
    }
    window.location.href = '/admin?page=' + encodeURIComponent(getCurrentPageName());
}
