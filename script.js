document.addEventListener('DOMContentLoaded', function () {
    applyAdminContent();
    setupMenu();
    setupHeaderShadow();
    setupYear();
    setupCalendar();
    setupGalleryFilter();
    setupProjectToggles();
    setupContactForm();
    setupAdminMode();
});

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

function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) {
        return;
    }

    const feedback = document.getElementById('contactFeedback');
    const draftWrapper = document.getElementById('contactDraftWrapper');
    const draftField = document.getElementById('contactDraft');

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const subject = document.getElementById('subject').value.trim() || 'Contato pelo site';
        const message = document.getElementById('message').value.trim();

        if (!name || !email || !message) {
            feedback.textContent = 'Preencha nome, e-mail e mensagem antes de continuar.';
            return;
        }

        const draft =
            'Nome: ' + name + '\n' +
            'E-mail para retorno: ' + email + '\n' +
            'Assunto: ' + subject + '\n\n' +
            message;

        if (draftField && draftWrapper) {
            draftField.value = draft;
            draftWrapper.hidden = false;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(draft).then(function () {
                feedback.textContent = 'Mensagem copiada. Agora você pode encaminhá-la ao grupo pelos canais disponíveis.';
            }).catch(function () {
                feedback.textContent = 'Não foi possível copiar automaticamente. Use o campo abaixo para copiar manualmente.';
            });
            return;
        }

        feedback.textContent = 'Use o campo abaixo para copiar sua mensagem manualmente.';
    });
}

var ADMIN_STORAGE_KEY = 'gear9df-admin-data-v1';

function getCurrentPageName() {
    var name = window.location.pathname.split('/').pop();
    return name || 'index.html';
}

function loadAdminState() {
    try {
        var raw = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (!raw) {
            return { pages: {} };
        }
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            return { pages: {} };
        }
        if (!parsed.pages || typeof parsed.pages !== 'object') {
            parsed.pages = {};
        }
        return parsed;
    } catch (error) {
        return { pages: {} };
    }
}

function saveAdminState(state) {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(state));
}

function ensurePageState(state, pageName) {
    if (!state.pages[pageName]) {
        state.pages[pageName] = {
            text: {},
            images: {},
            sections: {},
            extras: []
        };
    }

    if (!state.pages[pageName].text) {
        state.pages[pageName].text = {};
    }
    if (!state.pages[pageName].images) {
        state.pages[pageName].images = {};
    }
    if (!state.pages[pageName].sections) {
        state.pages[pageName].sections = {};
    }
    if (!Array.isArray(state.pages[pageName].extras)) {
        state.pages[pageName].extras = [];
    }

    return state.pages[pageName];
}

function buildAdminPath(element, root) {
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

function getEditableTextNodes(root) {
    return Array.from(root.querySelectorAll('h1, h2, h3, h4, p, .eyebrow, .btn'))
        .filter(function (node) {
            if (!node.textContent || !node.textContent.trim()) {
                return false;
            }

            if (node.closest('.admin-shell')) {
                return false;
            }

            return true;
        })
        .map(function (node, index) {
            return {
                index: index,
                key: buildAdminPath(node, root),
                element: node,
                label: node.tagName.toLowerCase() + ' - ' + node.textContent.trim().replace(/\s+/g, ' ').slice(0, 60)
            };
        });
}

function getEditableImages(root) {
    return Array.from(root.querySelectorAll('img'))
        .filter(function (node) {
            return !node.closest('.admin-shell');
        })
        .map(function (node, index) {
            return {
                index: index,
                key: buildAdminPath(node, root),
                element: node,
                label: 'Imagem ' + (index + 1) + ' - ' + (node.getAttribute('alt') || node.getAttribute('src') || 'sem descricao')
            };
        });
}

function getEditableSections(root) {
    return Array.from(root.children)
        .filter(function (node) {
            return node.tagName === 'SECTION' && !node.classList.contains('admin-extra-section');
        })
        .map(function (node, index) {
            var heading = node.querySelector('h1, h2, h3');
            return {
                index: index,
                key: buildAdminPath(node, root),
                element: node,
                label: heading ? heading.textContent.trim() : 'Secao ' + (index + 1)
            };
        });
}

function readEditableText(node) {
    if (node.classList.contains('btn')) {
        var clone = node.cloneNode(true);
        clone.querySelectorAll('i').forEach(function (icon) {
            icon.remove();
        });
        return clone.textContent.trim();
    }

    return node.innerHTML.trim();
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
    Array.from(root.querySelectorAll('.admin-extra-section')).forEach(function (section) {
        section.remove();
    });

    pageState.extras.forEach(function (extra) {
        var section = document.createElement('section');
        section.className = 'section admin-extra-section' + (extra.tone === 'soft' ? ' section-soft' : '') + (extra.tone === 'dark' ? ' cta-band' : '');

        if (extra.tone === 'dark') {
            section.innerHTML =
                '<div class="shell cta-layout">' +
                '<div>' +
                '<div class="eyebrow light">Secao personalizada</div>' +
                '<h2>' + (extra.title || 'Nova secao') + '</h2>' +
                '<p>' + (extra.text || '') + '</p>' +
                '</div>' +
                '<div class="button-row">' +
                (extra.buttonLabel && extra.buttonHref ? '<a href="' + extra.buttonHref + '" class="btn btn-light">' + extra.buttonLabel + '</a>' : '') +
                '</div>' +
                '</div>';
        } else {
            section.innerHTML =
                '<div class="shell">' +
                '<div class="split-layout">' +
                '<div>' +
                '<div class="eyebrow">Secao personalizada</div>' +
                '<h2 class="section-title left">' + (extra.title || 'Nova secao') + '</h2>' +
                '<p class="section-text">' + (extra.text || '') + '</p>' +
                (extra.buttonLabel && extra.buttonHref ? '<div class="button-row"><a href="' + extra.buttonHref + '" class="btn btn-primary">' + extra.buttonLabel + '</a></div>' : '') +
                '</div>' +
                (extra.imageSrc ? '<div class="media-card"><img src="' + extra.imageSrc + '" alt="' + (extra.imageAlt || '') + '" class="cover-image" loading="lazy" decoding="async"></div>' : '') +
                '</div>' +
                '</div>';
        }

        root.appendChild(section);
    });
}

function applyAdminContent() {
    var root = document.querySelector('main');
    if (!root) {
        return;
    }

    var state = loadAdminState();
    var pageName = getCurrentPageName();
    var pageState = ensurePageState(state, pageName);

    getEditableTextNodes(root).forEach(function (entry) {
        if (Object.prototype.hasOwnProperty.call(pageState.text, entry.key)) {
            writeEditableText(entry.element, pageState.text[entry.key]);
        }
    });

    getEditableImages(root).forEach(function (entry) {
        var imageOverride = pageState.images[entry.key];
        if (!imageOverride) {
            return;
        }

        if (imageOverride.src) {
            entry.element.setAttribute('src', imageOverride.src);
        }
        if (typeof imageOverride.alt === 'string') {
            entry.element.setAttribute('alt', imageOverride.alt);
        }
    });

    getEditableSections(root).forEach(function (entry) {
        var sectionOverride = pageState.sections[entry.key];
        entry.element.hidden = !!(sectionOverride && sectionOverride.hidden);
    });

    renderAdminExtraSections(root, pageState);
}

function setupAdminShortcut() {
    window.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.shiftKey && event.key === '9') {
            event.preventDefault();
            var url = new URL(window.location.href);
            if (url.searchParams.get('gearadmin') === '1') {
                url.searchParams.delete('gearadmin');
            } else {
                url.searchParams.set('gearadmin', '1');
            }
            window.location.href = url.toString();
        }
    });
}

function injectAdminStyles() {
    if (document.getElementById('gearAdminStyles')) {
        return;
    }

    var style = document.createElement('style');
    style.id = 'gearAdminStyles';
    style.textContent =
        '.admin-launch{position:fixed;right:18px;bottom:18px;z-index:1100;border:none;border-radius:999px;padding:12px 16px;background:#0d2d5a;color:#fff;font:700 14px/1 Syne,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.2);cursor:pointer}' +
        '.admin-shell{position:fixed;top:0;right:0;width:min(430px,100vw);height:100vh;z-index:1200;background:#f7fbff;border-left:1px solid rgba(13,45,90,.12);box-shadow:-20px 0 60px rgba(0,0,0,.16);transform:translateX(100%);transition:transform .25s ease;display:flex;flex-direction:column}' +
        '.admin-shell.open{transform:translateX(0)}' +
        '.admin-head{padding:18px 18px 12px;background:#0d2d5a;color:#fff;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}' +
        '.admin-head strong{display:block;font-size:1rem}' +
        '.admin-head span{display:block;font-size:.8rem;opacity:.8;margin-top:4px}' +
        '.admin-close{border:none;background:rgba(255,255,255,.14);color:#fff;border-radius:10px;padding:8px 10px;cursor:pointer}' +
        '.admin-body{padding:16px 16px 28px;overflow:auto;display:grid;gap:14px}' +
        '.admin-card{background:#fff;border:1px solid rgba(13,45,90,.08);border-radius:18px;padding:14px;display:grid;gap:12px;box-shadow:0 8px 24px rgba(13,45,90,.06)}' +
        '.admin-card h3{margin:0;font-size:1rem}' +
        '.admin-note{margin:0;color:#516073;font-size:.84rem;line-height:1.55}' +
        '.admin-field{display:grid;gap:6px}' +
        '.admin-field label,.admin-card summary{font-weight:700;color:#10284b;cursor:pointer}' +
        '.admin-field input,.admin-field textarea,.admin-field select{width:100%;border:1px solid rgba(13,45,90,.14);border-radius:12px;padding:10px 12px;font:500 13px/1.5 Syne,sans-serif;background:#fff}' +
        '.admin-field textarea{min-height:88px;resize:vertical}' +
        '.admin-list{display:grid;gap:10px;max-height:320px;overflow:auto;padding-right:4px}' +
        '.admin-item{border:1px solid rgba(13,45,90,.1);border-radius:14px;padding:10px;display:grid;gap:8px;background:#fbfdff}' +
        '.admin-item small{color:#6b7a8d;font-size:.76rem}' +
        '.admin-row{display:flex;gap:8px;flex-wrap:wrap}' +
        '.admin-row button{border:none;border-radius:999px;padding:10px 12px;background:#1e79e7;color:#fff;font:700 12px/1 Syne,sans-serif;cursor:pointer}' +
        '.admin-row .ghost{background:#e8f1ff;color:#0d2d5a}' +
        '.admin-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px}' +
        '.admin-json{min-height:120px}' +
        '@media (max-width: 640px){.admin-launch{right:12px;bottom:12px}.admin-shell{width:100vw}}';
    document.head.appendChild(style);
}

function setupAdminMode() {
    setupAdminShortcut();

    var params = new URLSearchParams(window.location.search);
    if (params.get('gearadmin') !== '1') {
        return;
    }

    var root = document.querySelector('main');
    if (!root) {
        return;
    }

    injectAdminStyles();

    var pageName = getCurrentPageName();
    var state = loadAdminState();
    var pageState = ensurePageState(state, pageName);
    var textTargets = getEditableTextNodes(root);
    var imageTargets = getEditableImages(root);
    var sectionTargets = getEditableSections(root);

    var panel = document.createElement('aside');
    panel.className = 'admin-shell open';
    panel.innerHTML =
        '<div class="admin-head">' +
        '<div><strong>Modo administrador</strong><span>' + pageName + ' · acesso oculto por ?gearadmin=1</span></div>' +
        '<button type="button" class="admin-close">Fechar</button>' +
        '</div>' +
        '<div class="admin-body">' +
        '<section class="admin-card">' +
        '<h3>Como funciona</h3>' +
        '<p class="admin-note">Este painel edita a pagina atual no proprio navegador e salva no armazenamento local. Nao e autenticacao real. Para abrir ou fechar rapidamente, use Ctrl+Shift+9.</p>' +
        '<div class="admin-row">' +
        '<button type="button" data-admin-action="export">Exportar JSON</button>' +
        '<button type="button" class="ghost" data-admin-action="reset-page">Resetar pagina</button>' +
        '<button type="button" class="ghost" data-admin-action="reset-all">Resetar tudo</button>' +
        '</div>' +
        '</section>' +
        '<details class="admin-card" open><summary>Textos editaveis (' + textTargets.length + ')</summary><div class="admin-list" data-admin-text-list></div></details>' +
        '<details class="admin-card"><summary>Imagens (' + imageTargets.length + ')</summary><div class="admin-list" data-admin-image-list></div></details>' +
        '<details class="admin-card"><summary>Secoes</summary><div class="admin-list" data-admin-section-list></div></details>' +
        '<section class="admin-card">' +
        '<h3>Adicionar secao personalizada</h3>' +
        '<div class="admin-field"><label>Titulo</label><input type="text" data-extra-title></div>' +
        '<div class="admin-field"><label>Texto</label><textarea data-extra-text></textarea></div>' +
        '<div class="admin-field"><label>Botao</label><input type="text" data-extra-button-label></div>' +
        '<div class="admin-field"><label>Link do botao</label><input type="text" data-extra-button-href placeholder="contato.html ou https://..."></div>' +
        '<div class="admin-field"><label>Imagem (opcional)</label><input type="text" data-extra-image-src placeholder="images/sua-foto.jpg"></div>' +
        '<div class="admin-field"><label>ALT da imagem</label><input type="text" data-extra-image-alt></div>' +
        '<div class="admin-field"><label>Tom visual</label><select data-extra-tone><option value="plain">Claro</option><option value="soft">Suave</option><option value="dark">Escuro</option></select></div>' +
        '<div class="admin-row"><button type="button" data-admin-action="add-extra">Adicionar secao</button></div>' +
        '<div class="admin-list" data-admin-extra-list></div>' +
        '</section>' +
        '<section class="admin-card">' +
        '<h3>Importar ou copiar configuracao</h3>' +
        '<div class="admin-field"><label>JSON completo</label><textarea class="admin-json" data-admin-json></textarea></div>' +
        '<div class="admin-row">' +
        '<button type="button" data-admin-action="apply-json">Aplicar JSON</button>' +
        '<button type="button" class="ghost" data-admin-action="copy-json">Copiar JSON</button>' +
        '</div>' +
        '</section>' +
        '</div>';

    document.body.appendChild(panel);

    var launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'admin-launch';
    launcher.textContent = 'Administrador';
    document.body.appendChild(launcher);

    var closeButton = panel.querySelector('.admin-close');
    closeButton.addEventListener('click', function () {
        var url = new URL(window.location.href);
        url.searchParams.delete('gearadmin');
        window.location.href = url.toString();
    });

    launcher.addEventListener('click', function () {
        panel.classList.toggle('open');
    });

    var textList = panel.querySelector('[data-admin-text-list]');
    textTargets.forEach(function (entry) {
        var item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML =
            '<label>' + entry.label + '</label>' +
            '<small>' + entry.key + '</small>' +
            '<textarea></textarea>';

        var field = item.querySelector('textarea');
        field.value = Object.prototype.hasOwnProperty.call(pageState.text, entry.key) ? pageState.text[entry.key] : readEditableText(entry.element);
        field.addEventListener('input', function () {
            var latestState = loadAdminState();
            var latestPageState = ensurePageState(latestState, pageName);
            latestPageState.text[entry.key] = field.value;
            saveAdminState(latestState);
            writeEditableText(entry.element, field.value);
        });
        textList.appendChild(item);
    });

    var imageList = panel.querySelector('[data-admin-image-list]');
    imageTargets.forEach(function (entry) {
        var imageOverride = pageState.images[entry.key] || {};
        var item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML =
            '<label>' + entry.label + '</label>' +
            '<small>' + entry.key + '</small>' +
            '<div class="admin-field"><label>src</label><input type="text" value=""></div>' +
            '<div class="admin-field"><label>alt</label><input type="text" value=""></div>';

        var srcField = item.querySelectorAll('input')[0];
        var altField = item.querySelectorAll('input')[1];
        srcField.value = imageOverride.src || entry.element.getAttribute('src') || '';
        altField.value = typeof imageOverride.alt === 'string' ? imageOverride.alt : (entry.element.getAttribute('alt') || '');

        function saveImage() {
            var latestState = loadAdminState();
            var latestPageState = ensurePageState(latestState, pageName);
            latestPageState.images[entry.key] = {
                src: srcField.value.trim(),
                alt: altField.value.trim()
            };
            saveAdminState(latestState);
            if (srcField.value.trim()) {
                entry.element.setAttribute('src', srcField.value.trim());
            }
            entry.element.setAttribute('alt', altField.value.trim());
        }

        srcField.addEventListener('change', saveImage);
        altField.addEventListener('input', saveImage);
        imageList.appendChild(item);
    });

    var sectionList = panel.querySelector('[data-admin-section-list]');
    sectionTargets.forEach(function (entry) {
        var sectionOverride = pageState.sections[entry.key] || {};
        var item = document.createElement('div');
        item.className = 'admin-item admin-toggle';
        item.innerHTML =
            '<div><label>' + entry.label + '</label><small>' + entry.key + '</small></div>' +
            '<label><input type="checkbox"> Mostrar</label>';
        var checkbox = item.querySelector('input');
        checkbox.checked = !sectionOverride.hidden;
        checkbox.addEventListener('change', function () {
            var latestState = loadAdminState();
            var latestPageState = ensurePageState(latestState, pageName);
            latestPageState.sections[entry.key] = { hidden: !checkbox.checked };
            saveAdminState(latestState);
            entry.element.hidden = !checkbox.checked;
        });
        sectionList.appendChild(item);
    });

    var extraList = panel.querySelector('[data-admin-extra-list]');

    function renderExtraList() {
        var latestState = loadAdminState();
        var latestPageState = ensurePageState(latestState, pageName);
        extraList.innerHTML = '';

        latestPageState.extras.forEach(function (extra) {
            var item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML =
                '<label>' + (extra.title || 'Secao sem titulo') + '</label>' +
                '<small>' + extra.id + '</small>' +
                '<div class="admin-row"><button type="button">Remover</button></div>';

            item.querySelector('button').addEventListener('click', function () {
                var currentState = loadAdminState();
                var currentPageState = ensurePageState(currentState, pageName);
                currentPageState.extras = currentPageState.extras.filter(function (node) {
                    return node.id !== extra.id;
                });
                saveAdminState(currentState);
                renderAdminExtraSections(root, currentPageState);
                renderExtraList();
                syncJsonField();
            });

            extraList.appendChild(item);
        });
    }

    function syncJsonField() {
        panel.querySelector('[data-admin-json]').value = JSON.stringify(loadAdminState(), null, 2);
    }

    panel.querySelector('[data-admin-action="add-extra"]').addEventListener('click', function () {
        var latestState = loadAdminState();
        var latestPageState = ensurePageState(latestState, pageName);
        latestPageState.extras.push({
            id: 'extra-' + Date.now(),
            title: panel.querySelector('[data-extra-title]').value.trim(),
            text: panel.querySelector('[data-extra-text]').value.trim(),
            buttonLabel: panel.querySelector('[data-extra-button-label]').value.trim(),
            buttonHref: panel.querySelector('[data-extra-button-href]').value.trim(),
            imageSrc: panel.querySelector('[data-extra-image-src]').value.trim(),
            imageAlt: panel.querySelector('[data-extra-image-alt]').value.trim(),
            tone: panel.querySelector('[data-extra-tone]').value
        });
        saveAdminState(latestState);
        renderAdminExtraSections(root, latestPageState);
        renderExtraList();
        syncJsonField();
    });

    panel.querySelector('[data-admin-action="export"]').addEventListener('click', function () {
        syncJsonField();
        panel.querySelector('[data-admin-json]').focus();
        panel.querySelector('[data-admin-json]').select();
    });

    panel.querySelector('[data-admin-action="copy-json"]').addEventListener('click', function () {
        syncJsonField();
        var jsonField = panel.querySelector('[data-admin-json]');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(jsonField.value);
            return;
        }
        jsonField.focus();
        jsonField.select();
        document.execCommand('copy');
    });

    panel.querySelector('[data-admin-action="apply-json"]').addEventListener('click', function () {
        try {
            var parsed = JSON.parse(panel.querySelector('[data-admin-json]').value);
            if (!parsed.pages || typeof parsed.pages !== 'object') {
                throw new Error('JSON invalido');
            }
            saveAdminState(parsed);
            window.location.reload();
        } catch (error) {
            window.alert('Nao foi possivel aplicar o JSON. Revise a estrutura antes de salvar.');
        }
    });

    panel.querySelector('[data-admin-action="reset-page"]').addEventListener('click', function () {
        var latestState = loadAdminState();
        delete latestState.pages[pageName];
        saveAdminState(latestState);
        window.location.reload();
    });

    panel.querySelector('[data-admin-action="reset-all"]').addEventListener('click', function () {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
        window.location.reload();
    });

    renderExtraList();
    syncJsonField();
}
