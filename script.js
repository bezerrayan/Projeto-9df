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

    // Project Carousel Dots Update
    const carousels = document.querySelectorAll('.project-carousel');
    carousels.forEach(carousel => {
        const container = carousel.closest('.project-carousel-container');
        if (!container) return;
        const dots = container.querySelectorAll('.dot');

        carousel.addEventListener('scroll', () => {
            const index = Math.round(carousel.scrollLeft / carousel.offsetWidth);
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        });
    });
});