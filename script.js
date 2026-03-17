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
        { date: '2026-01-08', title: 'Falecimento de Baden-Powell (1941 - Nyeri, Qu\u00EAnia)', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-01-25', title: 'Encontro Nacional de N\u00FAcleos Regionais (Remoto)', type: 'nacional', label: 'Nacional' },
        { date: '2026-02-16', endDate: '2026-02-17', title: 'Carnaval', type: 'feriado', label: 'Feriado' },
        { date: '2026-02-21', endDate: '2026-02-22', title: 'Reuni\u00E3o do Conselho de Administra\u00E7\u00E3o Nacional (Remoto)', type: 'nacional', label: 'Nacional' },
        { date: '2026-02-21', endDate: '2026-02-22', title: 'Reuni\u00E3o da Comiss\u00E3o de \u00C9tica e Disciplina Nacional (A definir)', type: 'nacional', label: 'Nacional' },
        { date: '2026-02-22', title: 'Dia do Fundador (Nascimento de Baden-Powell - 1857)', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-02-28', title: 'Encerramento do exerc\u00EDcio de 2025 e entrega dos balan\u00E7os', type: 'nacional', label: 'Administrativo' },
        { date: '2026-03-13', title: 'Emiss\u00E3o do Parecer da Auditoria Externa', type: 'nacional', label: 'Administrativo' },
        { date: '2026-03-16', title: 'Reuni\u00E3o da Comiss\u00E3o Fiscal Nacional', type: 'nacional', label: 'Nacional' },
        { date: '2026-03-17', title: 'Divulga\u00E7\u00E3o das Demonstra\u00E7\u00F5es Cont\u00E1beis 2025', type: 'nacional', label: 'Administrativo' },
        { date: '2026-04-03', title: 'Sexta-Feira da Paix\u00E3o', type: 'feriado', label: 'Feriado' },
        { date: '2026-04-11', endDate: '2026-04-26', title: 'Semana Escoteira (inclui CQWS - Radioescotismo)', type: 'nacional', label: 'Nacional' },
        { date: '2026-04-18', endDate: '2026-06-14', title: 'Mutir\u00E3o Nacional de Doa\u00E7\u00E3o de Sangue e REDOME', type: 'nacional', label: 'Mobiliza\u00E7\u00E3o' },
        { date: '2026-04-18', title: '12\u00BA Grande Jogo A\u00E9reo', type: 'nacional', label: 'Evento' },
        { date: '2026-04-18', endDate: '2026-04-21', title: '31\u00BA Congresso Escoteiro Nacional', type: 'nacional', label: 'Nacional' },
        { date: '2026-04-18', endDate: '2026-04-21', title: '32\u00AA Assembleia Escoteira Nacional', type: 'nacional', label: 'Nacional' },
        { date: '2026-04-18', endDate: '2026-04-21', title: 'Reuni\u00F5es dos Conselhos de Administra\u00E7\u00E3o e Consultivo', type: 'nacional', label: 'Nacional' },
        { date: '2026-04-18', endDate: '2026-04-21', title: '31\u00BA F\u00F3rum de Jovens L\u00EDderes', type: 'nacional', label: 'Nacional' },
        { date: '2026-04-21', title: 'Tiradentes', type: 'feriado', label: 'Feriado' },
        { date: '2026-04-23', title: 'Dia do Escoteiro', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-04-28', title: 'Dia do Escoteiro do Ar e Dia da Educa\u00E7\u00E3o', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-05-01', title: 'Dia do Trabalhador', type: 'feriado', label: 'Feriado' },
        { date: '2026-05-01', endDate: '2026-05-31', title: '10\u00BA EducA\u00E7\u00E3o Escoteira', type: 'nacional', label: 'Programa' },
        { date: '2026-05-09', title: 'Encontro Nacional de Seguran\u00E7a da Informa\u00E7\u00E3o (Evento 1)', type: 'nacional', label: 'Nacional' },
        { date: '2026-05-09', title: 'Semin\u00E1rio de Di\u00E1logo Inter-religioso', type: 'nacional', label: 'Semin\u00E1rio' },
        { date: '2026-06-01', endDate: '2026-06-30', title: '35\u00BA Mutir\u00E3o Nacional de A\u00E7\u00E3o Ecol\u00F3gica', type: 'nacional', label: 'Mobiliza\u00E7\u00E3o' },
        { date: '2026-06-04', title: 'Corpus Christi', type: 'feriado', label: 'Feriado' },
        { date: '2026-06-04', endDate: '2026-06-07', title: 'Capacita\u00E7\u00F5es Estrat\u00E9gicas Nacionais', type: 'nacional', label: 'Capacita\u00E7\u00E3o' },
        { date: '2026-06-05', title: 'Dia Mundial do Meio Ambiente', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-06-11', title: 'Dia do Escoteiro do Mar', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-06-14', title: 'Anivers\u00E1rio do Escotismo no Brasil (116 anos - 1910)', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-06-18', title: 'Dia do S\u00EAnior', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-06-20', endDate: '2026-06-21', title: '14\u00BA Scout\u2019s Field Day (Radioescotismo)', type: 'nacional', label: 'Evento' },
        { date: '2026-06-29', title: 'Dia do Pioneiro', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-07-13', title: 'Nascimento de Caio Vianna Martins', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-07-18', endDate: '2026-07-22', title: 'Moot Nacional Pioneiro', type: 'nacional', label: 'Evento' },
        { date: '2026-07-31', title: 'Divulga\u00E7\u00E3o do Calend\u00E1rio Nacional 2027', type: 'nacional', label: 'Administrativo' },
        { date: '2026-08-01', title: 'Dia do Escotismo (Acampamento de Brownsea - 1907)', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-08-01', endDate: '2026-08-31', title: '9\u00BA Dia do Amigo', type: 'nacional', label: 'Campanha' },
        { date: '2026-08-04', title: 'Webn\u00E1rio Regime Disciplinar da UEB (Remoto)', type: 'nacional', label: 'Webn\u00E1rio' },
        { date: '2026-08-06', title: 'Dia Interamericano do Escotista', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-08-12', title: 'Dia Internacional da Juventude', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-08-15', endDate: '2026-08-16', title: 'Reuni\u00E3o do Conselho de Administra\u00E7\u00E3o Nacional', type: 'nacional', label: 'Nacional' },
        { date: '2026-08-15', endDate: '2026-08-16', title: 'Grande Jogo Naval', type: 'nacional', label: 'Evento' },
        { date: '2026-08-29', endDate: '2026-08-30', title: '6\u00AA Atividade Nacional de Radioescotismo', type: 'nacional', label: 'Evento' },
        { date: '2026-09-07', title: 'Independ\u00EAncia do Brasil', type: 'feriado', label: 'Feriado' },
        { date: '2026-09-01', endDate: '2026-09-30', title: '28\u00BA Mutir\u00E3o Nacional de A\u00E7\u00E3o Comunit\u00E1ria', type: 'nacional', label: 'Mobiliza\u00E7\u00E3o' },
        { date: '2026-09-05', endDate: '2026-09-07', title: 'Laborat\u00F3rio T\u00E9cnico do Programa Educativo', type: 'nacional', label: 'Forma\u00E7\u00E3o' },
        { date: '2026-09-19', title: 'Encontro Nacional de Seguran\u00E7a da Informa\u00E7\u00E3o (Evento 2)', type: 'nacional', label: 'Nacional' },
        { date: '2026-09-19', endDate: '2026-09-20', title: 'Encontro Nacional de Comunica\u00E7\u00E3o', type: 'nacional', label: 'Nacional' },
        { date: '2026-09-20', title: 'Dia Mundial da Limpeza', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-09-21', title: 'Dia Internacional da Paz', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-09-26', endDate: '2026-09-27', title: 'Reuni\u00E3o do Conselho Consultivo', type: 'nacional', label: 'Nacional' },
        { date: '2026-09-30', title: 'Divulga\u00E7\u00E3o dos Calend\u00E1rios Regionais 2027', type: 'nacional', label: 'Administrativo' },
        { date: '2026-10-04', title: 'Dia do Lobinho', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-10-12', title: 'Dia da Padroeira do Brasil (Nossa Senhora Aparecida)', type: 'feriado', label: 'Feriado' },
        { date: '2026-10-16', endDate: '2026-10-18', title: 'JOTA/JOTI (Jamboree do Ar e Internet)', type: 'nacional', label: 'Evento' },
        { date: '2026-10-17', endDate: '2026-10-18', title: 'Reuni\u00E3o do Conselho de Administra\u00E7\u00E3o Nacional', type: 'nacional', label: 'Nacional' },
        { date: '2026-10-17', endDate: '2026-10-18', title: 'Encontro Nacional das Comiss\u00F5es de \u00C9tica Regionais', type: 'nacional', label: 'Nacional' },
        { date: '2026-11-02', title: 'Finados', type: 'feriado', label: 'Feriado' },
        { date: '2026-11-04', title: 'Anivers\u00E1rio da Uni\u00E3o dos Escoteiros do Brasil (102 anos - 1924)', type: 'comemorativo', label: 'Comemorativo' },
        { date: '2026-11-15', title: 'Proclama\u00E7\u00E3o da Rep\u00FAblica', type: 'feriado', label: 'Feriado' },
        { date: '2026-11-20', endDate: '2026-11-22', title: 'Encontro Nacional de Jovens L\u00EDderes (Jo\u00E3o Pessoa - PB)', type: 'nacional', label: 'Nacional' },
        { date: '2026-12-25', title: 'Natal', type: 'feriado', label: 'Feriado' }
    ];

    const monthLabel = calendarRoot.querySelector('[data-cal-month]');
    const grid = calendarRoot.querySelector('[data-cal-grid]');
    const eventsList = calendarRoot.querySelector('[data-cal-events]');
    const prevBtn = calendarRoot.querySelector('[data-cal-prev]');
    const nextBtn = calendarRoot.querySelector('[data-cal-next]');
    const months = [
        'Janeiro', 'Fevereiro', 'Mar\u00E7o', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    function dateKey(year, month, day) {
        return year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    }

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
            empty.textContent = 'Sem eventos especiais cadastrados para este m\u00EAs.';
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

        const body = [
            'Nome: ' + name,
            'E-mail: ' + email,
            '',
            'Mensagem:',
            message
        ].join('\n');

        window.location.href = 'mailto:contato@escoteiro.com?subject=' +
            encodeURIComponent(subject) +
            '&body=' +
            encodeURIComponent(body);

        feedback.textContent = 'Abrimos seu aplicativo de e-mail para finalizar o envio.';
    });
}
