// ============================================
// MENU MOBILE TOGGLE
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function () {
            const isActive = navMenu.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');

            // Hamburger animation
            const spans = menuToggle.querySelectorAll('span');
            if (isActive) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close menu on link click
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                const spans = menuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }
});

// ============================================
// HEADER SCROLL EFFECT
// ============================================
window.addEventListener('scroll', function () {
    const header = document.querySelector('.header');
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

// ============================================
// HERO CAROUSEL
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    const hero = document.querySelector('.hero');
    const slider = document.querySelector('.hero-slider');
    if (!hero || !slider) return;

    const data = hero.getAttribute('data-hero-images') || '';
    const list = data.split(',').map(s => s.trim()).filter(Boolean);

    if (list.length > 0) {
        slider.innerHTML = '';
        list.forEach((src, i) => {
            const img = document.createElement('img');
            img.className = 'hero-slide' + (i === 0 ? ' active' : '');
            img.src = src;
            img.alt = 'Fundo';
            img.loading = 'lazy';
            img.onerror = function () { this.src = 'images/landing.png'; };
            slider.appendChild(img);
        });
    }

    const slides = slider.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;

    let current = 0;
    let intervalMs = parseInt(hero.getAttribute('data-hero-interval'), 10) || 8000;

    function showSlide(index) {
        slides[current].classList.remove('active');
        current = (index + slides.length) % slides.length;
        slides[current].classList.add('active');

        // Update dots if they exist
        const dots = document.querySelectorAll('.hero-dot');
        if (dots.length > 0) {
            dots.forEach(d => d.classList.remove('active'));
            dots[current].classList.add('active');
        }
    }

    let timer = setInterval(() => showSlide(current + 1), intervalMs);

    function resetTimer() {
        clearInterval(timer);
        timer = setInterval(() => showSlide(current + 1), intervalMs);
    }
});

// ============================================
// GALLERY & PROJECT MODALS
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    // Gallery Filter
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function () {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                const filter = this.getAttribute('data-filter');
                galleryItems.forEach(item => {
                    if (filter === 'all' || item.getAttribute('data-category') === filter) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });
            });
        });
    }

    // Modal logic
    const modal = document.getElementById('projectModal');
    if (modal) {
        const closeBtn = modal.querySelector('.project-modal-close');
        const backdrop = modal.querySelector('.project-modal-backdrop');
        const toggles = document.querySelectorAll('.project-toggle');

        toggles.forEach(btn => {
            btn.addEventListener('click', function () {
                const target = document.querySelector(this.getAttribute('data-target'));
                const title = this.closest('.project-card')?.querySelector('h3')?.textContent || '';
                if (target) {
                    modal.querySelector('.project-modal-title').textContent = title;
                    const body = modal.querySelector('.project-modal-body');
                    body.innerHTML = '';
                    const clone = target.cloneNode(true);
                    clone.style.display = 'block';
                    body.appendChild(clone);
                    modal.classList.add('open');
                }
            });
        });

        const close = () => modal.classList.remove('open');
        if (closeBtn) closeBtn.onclick = close;
        if (backdrop) backdrop.onclick = close;
    }

    // Project Carousel Controls + Dots
    const carousels = document.querySelectorAll('.project-carousel');
    carousels.forEach(carousel => {
        const container = carousel.closest('.project-carousel-container');
        if (!container) return;
        const slides = Array.from(carousel.querySelectorAll('img'));
        const dots = container.querySelectorAll('.dot');
        const prevBtn = container.querySelector('[data-carousel-prev]');
        const nextBtn = container.querySelector('[data-carousel-next]');

        const getCurrentIndex = () => {
            if (slides.length === 0) return 0;
            let activeIndex = 0;
            let minDistance = Number.POSITIVE_INFINITY;

            slides.forEach((slide, index) => {
                const distance = Math.abs(slide.offsetLeft - carousel.scrollLeft);
                if (distance < minDistance) {
                    minDistance = distance;
                    activeIndex = index;
                }
            });

            return activeIndex;
        };

        const goToSlide = (index) => {
            if (slides.length === 0) return;
            const safeIndex = (index + slides.length) % slides.length;
            carousel.scrollTo({ left: slides[safeIndex].offsetLeft, behavior: 'smooth' });
        };

        const updateDots = () => {
            const index = getCurrentIndex();
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        };

        carousel.addEventListener('scroll', updateDots);

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => goToSlide(index));
        });

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                goToSlide(getCurrentIndex() - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                goToSlide(getCurrentIndex() + 1);
            });
        }

        updateDots();
    });
});
// ============================================
// IMAGE PERFORMANCE
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('loading')) {
            img.loading = img.classList.contains('hero-slide') ? 'eager' : 'lazy';
        }
        if (!img.hasAttribute('decoding')) {
            img.decoding = 'async';
        }
    });
});

// ============================================
// FOOTER YEAR
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    const year = String(new Date().getFullYear());
    document.querySelectorAll('.current-year').forEach(node => {
        node.textContent = year;
    });
});

// ============================================
// GROUP CALENDAR
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    const calendarRoot = document.querySelector('[data-group-calendar]');
    if (!calendarRoot) return;

    // Editar lista para marcar eventos do grupo e regionais
    // Formato: YYYY-MM-DD
    const groupEvents = [
        { date: '2026-03-07', title: 'Abertura Regional', type: 'regional' },
        { date: '2026-03-14', title: 'Atividade de seções', type: 'grupo' },
        { date: '2026-03-21', title: 'Atividade de seções', type: 'grupo' },
        { date: '2026-03-28', title: 'Atividade de seções', type: 'grupo' },
        { date: '2026-04-25', title: 'Atividade de seções', type: 'grupo' }
    ];

    const monthLabel = calendarRoot.querySelector('[data-cal-month]');
    const grid = calendarRoot.querySelector('[data-cal-grid]');
    const eventsList = calendarRoot.querySelector('[data-cal-events]');
    const prevBtn = calendarRoot.querySelector('[data-cal-prev]');
    const nextBtn = calendarRoot.querySelector('[data-cal-next]');
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const now = new Date();
    let currentMonth = now.getMonth();
    let currentYear = now.getFullYear();

    function getDateKey(year, month, day) {
        return year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    }

    function renderMonth() {
        monthLabel.textContent = monthNames[currentMonth] + ' de ' + currentYear;
        grid.innerHTML = '';

        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startOffset = firstDay.getDay();
        const totalDays = lastDay.getDate();

        for (let i = 0; i < startOffset; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            grid.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateKey = getDateKey(currentYear, currentMonth, day);
            const dayEvents = groupEvents.filter(event => event.date === dateKey);

            const cell = document.createElement('div');
            cell.className = 'calendar-day';
            cell.textContent = day;

            if (date.getDay() === 6) {
                cell.classList.add('saturday');
                cell.title = 'Atividade regular do grupo';
            }

            if (
                day === now.getDate() &&
                currentMonth === now.getMonth() &&
                currentYear === now.getFullYear()
            ) {
                cell.classList.add('today');
            }

            if (dayEvents.length > 0) {
                cell.classList.add('has-event');
                if (dayEvents.some(event => event.type === 'regional')) {
                    cell.classList.add('has-regional');
                }

                const tooltip = dayEvents.map(event => event.title).join(' | ');
                cell.title = cell.title ? cell.title + ' | ' + tooltip : tooltip;
            }

            grid.appendChild(cell);
        }

        renderEventList();
    }

    function renderEventList() {
        const monthlyEvents = groupEvents
            .filter(event => {
                const [year, month] = event.date.split('-').map(Number);
                return year === currentYear && month === currentMonth + 1;
            })
            .sort((a, b) => a.date.localeCompare(b.date));

        eventsList.innerHTML = '';

        if (monthlyEvents.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'empty';
            empty.textContent = 'Sem eventos especiais cadastrados para este mês.';
            eventsList.appendChild(empty);
            return;
        }

        monthlyEvents.forEach(event => {
            const [year, month, day] = event.date.split('-').map(Number);
            const item = document.createElement('li');
            item.innerHTML =
                '<div class="event-meta">' +
                '<span class="tag ' + event.type + '">' + event.type + '</span>' +
                '<span>' + String(day).padStart(2, '0') + '/' + String(month).padStart(2, '0') + '/' + year + '</span>' +
                '</div>' +
                '<p class="event-title">' + event.title + '</p>';
            eventsList.appendChild(item);
        });
    }

    prevBtn.addEventListener('click', function () {
        currentMonth -= 1;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear -= 1;
        }
        renderMonth();
    });

    nextBtn.addEventListener('click', function () {
        currentMonth += 1;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear += 1;
        }
        renderMonth();
    });

    renderMonth();
});

// ============================================
// CONTACT FORM
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const feedback = document.getElementById('contactFeedback');

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const name = document.getElementById('name')?.value.trim() || '';
        const email = document.getElementById('email')?.value.trim() || '';
        const subject = document.getElementById('subject')?.value.trim() || 'Contato pelo site';
        const message = document.getElementById('message')?.value.trim() || '';

        if (!name || !email || !message) {
            if (feedback) feedback.textContent = 'Preencha nome, e-mail e mensagem antes de enviar.';
            return;
        }

        const body = [
            'Nome: ' + name,
            'E-mail: ' + email,
            '',
            'Mensagem:',
            message
        ].join('\n');

        const mailto = 'mailto:contato@escoteiro.com?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(body);
        window.location.href = mailto;

        if (feedback) feedback.textContent = 'Abrimos seu app de e-mail para finalizar o envio.';
    });
});

