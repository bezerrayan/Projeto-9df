document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHeaderShadow();
    setupYear();
    setupCalendar();
    setupGalleryFilter();
    setupProjectToggles();
    setupContactForm();
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
        { date: '2026-01-24', endDate: '2026-01-25', title: 'Acampamento de Férias Escoteiro (Pioneirias)', type: 'grupo', label: 'Grupo' },
        { date: '2026-01-25', title: 'Encontro Nacional de Núcleos Regionais (Remoto)', type: 'regional', label: 'Regional' },
        { date: '2026-01-12', endDate: '2026-02-12', title: 'Curso Avançado Escotista e Dirigente (EAD)', type: 'grupo', label: 'Curso' },
        { date: '2026-02-07', title: 'INDABA de Abertura', type: 'grupo', label: 'Grupo' },
        { date: '2026-02-14', endDate: '2026-02-17', title: 'Curso Avançado Escotista e Dirigente (presencial - Carnaval)', type: 'grupo', label: 'Curso' },
        { date: '2026-02-16', endDate: '2026-02-17', title: 'Carnaval', type: 'feriado', label: 'Feriado' },
        { date: '2026-02-21', endDate: '2026-02-22', title: 'Reunião do Conselho de Administração Nacional (Remoto)', type: 'regional', label: 'Regional' },
        { date: '2026-02-21', endDate: '2026-02-22', title: 'Reunião da Comissão de Ética e Disciplina Nacional (A definir)', type: 'regional', label: 'Regional' },
        { date: '2026-02-21', title: 'Retorno das atividades GEARSF', type: 'grupo', label: 'Grupo' },
        { date: '2026-02-21', title: '1ª chamada de novos escoteiros e reunião com responsáveis', type: 'grupo', label: 'Grupo' },
        { date: '2026-02-22', title: 'Dia do Fundador (Nascimento de Baden-Powell)', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-02-28', title: 'Encerramento do exercício de 2025 e entrega dos balanços', type: 'regional', label: 'Regional' },
        { date: '2026-02-28', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-03-07', title: 'Abertura Regional (UEBDF)', type: 'regional', label: 'Regional' },
        { date: '2026-03-09', endDate: '2026-03-27', title: 'Curso Preliminar (EAD)', type: 'grupo', label: 'Curso' },
        { date: '2026-03-13', title: 'Emissão do Parecer da Auditoria Externa', type: 'regional', label: 'Regional' },
        { date: '2026-03-14', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-03-14', title: '4º Congresso Regional Escoteiro', type: 'grupo', label: 'Regional' },
        { date: '2026-03-14', title: 'Fórum de Jovens Líderes', type: 'grupo', label: 'Regional' },
        { date: '2026-03-14', title: 'Fóruns dos Ramos', type: 'grupo', label: 'Regional' },
        { date: '2026-03-15', title: 'Assembleia Regional', type: 'grupo', label: 'Regional' },
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
        { date: '2026-06-27', endDate: '2026-06-28', title: 'ARDIS (Acampamento Regional Sênior)', type: 'grupo', label: 'Regional' },
        { date: '2026-06-29', title: 'Dia do Pioneiro', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-07-04', title: 'INDABA de Avaliação e início do recesso', type: 'grupo', label: 'Grupo' },
        { date: '2026-07-11', title: 'Recesso Escoteiro', type: 'grupo', label: 'Grupo' },
        { date: '2026-07-13', title: 'Nascimento de Caio Vianna Martins', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-07-18', title: 'Recesso', type: 'grupo', label: 'Grupo' },
        { date: '2026-07-18', title: 'Congresso Regional de Educação Não-Formal', type: 'grupo', label: 'Regional' },
        { date: '2026-07-18', endDate: '2026-07-22', title: 'Moot Nacional Pioneiro', type: 'grupo', label: 'Nacional' },
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
        { date: '2026-08-15', endDate: '2026-08-16', title: 'Encontro Regional de Jovens Líderes', type: 'grupo', label: 'Regional' },
        { date: '2026-08-22', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-08-29', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-08-29', title: '68º aniversário do Escotismo no DF', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-08-29', endDate: '2026-08-30', title: '6ª Atividade Nacional de Radioescotismo', type: 'regional', label: 'Regional' },
        { date: '2026-08-29', endDate: '2026-08-30', title: 'Grande Jogo Naval', type: 'grupo', label: 'Regional' },
        { date: '2026-08-29', endDate: '2026-08-30', title: 'Radioescotismo (Echolink/DMR)', type: 'grupo', label: 'Regional' },
        { date: '2026-09-01', title: 'Encontro do 1º Grupo de Gilwell', type: 'grupo', label: 'Regional' },
        { date: '2026-09-01', endDate: '2026-09-30', title: '28º Mutirão Nacional de Ação Comunitária', type: 'regional', label: 'Regional' },
        { date: '2026-09-05', title: 'Atividade das Seções', type: 'grupo', label: 'Grupo' },
        { date: '2026-09-05', endDate: '2026-09-07', title: 'Laboratório Técnico do Programa Educativo', type: 'regional', label: 'Regional' },
        { date: '2026-09-05', endDate: '2026-09-07', title: 'Moot Regional Pioneiro', type: 'grupo', label: 'Regional' },
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
        { date: '2026-09-26', endDate: '2026-09-27', title: '49ª Jan-Bra', type: 'grupo', label: 'Regional' },
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
        { date: '2026-11-21', endDate: '2026-11-22', title: 'Vigília Regional Pioneira', type: 'grupo', label: 'Regional' },
        { date: '2026-11-27', endDate: '2026-11-29', title: 'Acampamento de Grupo (encerramento do ano)', type: 'grupo', label: 'Grupo' },
        { date: '2026-11-30', title: 'Dia do Evangélico', type: 'feriado', label: 'Feriado' },
        { date: '2026-12-03', title: 'Encontro Regional de Formadores', type: 'grupo', label: 'Regional' },
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
            const currentEvents = events.filter(function (event) {
                return eventCoversDate(event, currentDate);
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

            if (currentEvents.length > 0) {
                cell.classList.add('has-event');
                if (currentEvents.some(function (event) { return event.type === 'feriado'; })) {
                    cell.classList.add('has-holiday');
                } else if (currentEvents.some(function (event) { return event.type === 'comemorativo'; })) {
                    cell.classList.add('has-commemorative');
                } else if (currentEvents.some(function (event) { return event.type === 'regional'; })) {
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

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const subject = document.getElementById('subject').value.trim() || 'Contato pelo site';
        const message = document.getElementById('message').value.trim();

        if (!name || !email || !message) {
            feedback.textContent = 'Preencha nome, e-mail e mensagem antes de enviar.';
            return;
        }

        const body = encodeURIComponent('Nome: ' + name + '\nE-mail: ' + email + '\n\n' + message);
        window.location.href = 'mailto:contato@escoteiro.com?subject=' + encodeURIComponent(subject) + '&body=' + body;
        feedback.textContent = 'Seu aplicativo de e-mail foi aberto para concluir o envio.';
        form.reset();
    });
}
