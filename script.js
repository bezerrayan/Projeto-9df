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
        { date: '2026-03-07', title: 'Abertura Regional', type: 'regional' },
        { date: '2026-03-14', title: 'Atividade de se\u00E7\u00F5es', type: 'grupo' },
        { date: '2026-03-21', title: 'Atividade de se\u00E7\u00F5es', type: 'grupo' },
        { date: '2026-03-28', title: 'Atividade de se\u00E7\u00F5es', type: 'grupo' },
        { date: '2026-04-25', title: 'Atividade de se\u00E7\u00F5es', type: 'grupo' }
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

    function renderEvents() {
        const monthlyEvents = events
            .filter(function (event) {
                const parts = event.date.split('-').map(Number);
                return parts[0] === currentYear && parts[1] === currentMonth + 1;
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
            const parts = event.date.split('-').map(Number);
            const item = document.createElement('li');
            item.innerHTML =
                '<div class="event-meta">' +
                '<span class="tag ' + event.type + '">' + event.type + '</span>' +
                '<span>' + String(parts[2]).padStart(2, '0') + '/' + String(parts[1]).padStart(2, '0') + '/' + parts[0] + '</span>' +
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
                return event.date === dateKey(currentYear, currentMonth, day);
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
                if (currentEvents.some(function (event) { return event.type === 'regional'; })) {
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
