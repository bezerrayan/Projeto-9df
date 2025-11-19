// ============================================
// MENU MOBILE TOGGLE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
        // ensure aria-expanded present
        if (!menuToggle.hasAttribute('aria-expanded')) menuToggle.setAttribute('aria-expanded', 'false');

        menuToggle.addEventListener('click', function() {
            const isActive = navMenu.classList.toggle('active');
            // update aria-expanded for accessibility
            menuToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            
            // Animate hamburger menu
            const spans = menuToggle.querySelectorAll('span');
            if (navMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                const spans = menuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);
            
            if (!isClickInsideNav && !isClickOnToggle && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                const spans = menuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
});

// ============================================
// GALLERY FILTER
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (filterButtons.length > 0 && galleryItems.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Get filter value
                const filterValue = this.getAttribute('data-filter');
                
                // Filter gallery items
                galleryItems.forEach(item => {
                    const category = item.getAttribute('data-category');
                    
                    if (filterValue === 'all' || category === filterValue) {
                        item.classList.remove('hidden');
                        item.style.animation = 'fadeIn 0.5s ease';
                    } else {
                        item.classList.add('hidden');
                    }
                });
            });
        });
    }
});

// ============================================
// SMOOTH SCROLL
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const heroScroll = document.querySelector('.hero-scroll');
    
    if (heroScroll) {
        heroScroll.addEventListener('click', function() {
            const featuresSection = document.querySelector('.features');
            if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
});

// ============================================
// FORM VALIDATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();
            
            // Basic validation
            if (name === '' || email === '' || message === '') {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Por favor, insira um e-mail válido.');
                return;
            }
            
            // Success message (in a real application, you would send this to a server)
            alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
            contactForm.reset();
        });
    }
});

// ============================================
// SCROLL ANIMATIONS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .activity-card, .branch-card, .value-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// ============================================
// HEADER SCROLL EFFECT
// ============================================
let lastScroll = 0;
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    const currentScroll = window.pageYOffset;
    
    if (header) {
        if (currentScroll > 100) {
            header.style.boxShadow = '0 2px 20px rgba(0, 31, 63, 0.3)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0, 31, 63, 0.1)';
        }
    }
    
    lastScroll = currentScroll;
});

// ============================================
// ADD FADE IN ANIMATION
// ============================================
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// PROJECT DETAILS MODAL
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const toggles = document.querySelectorAll('.project-toggle');
    const modal = document.getElementById('projectModal');
    if (!modal) return;
    const modalTitle = modal.querySelector('.project-modal-title');
    const modalBody = modal.querySelector('.project-modal-body');
    const closeBtn = modal.querySelector('.project-modal-close');
    const backdrop = modal.querySelector('.project-modal-backdrop');

    function openModal(title, contentEl) {
        modalTitle.textContent = title || '';
        modalBody.innerHTML = '';
    // clone content to avoid moving original nodes
    const clone = contentEl.cloneNode(true);
    // ensure the cloned details are visible inside the modal
    clone.classList.remove('active');
    clone.classList.remove('project-details');
    clone.style.display = 'block';
    modalBody.appendChild(clone);
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';

        // wire gallery thumbs inside modal to open the image modal (if present)
        const thumbs = modal.querySelectorAll('.gallery-thumb');
        thumbs.forEach(t => {
            t.addEventListener('click', function() {
                const src = this.getAttribute('data-image');
                const imageModal = document.getElementById('imageModal');
                const imageModalSrc = document.getElementById('imageModalSrc');
                if (imageModal && imageModalSrc) {
                    imageModalSrc.onerror = function() { imageModalSrc.src = 'images/logo_9df.png'; };
                    imageModalSrc.src = src || 'images/logo_9df.png';
                    imageModal.classList.add('open');
                }
            });
        });
    }

    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        modalTitle.textContent = '';
        modalBody.innerHTML = '';
        // also close image modal if open
        const imageModal = document.getElementById('imageModal');
        if (imageModal) imageModal.classList.remove('open');
        const imageModalSrc = document.getElementById('imageModalSrc');
        if (imageModalSrc) imageModalSrc.src = '';
    }

    toggles.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const targetSelector = this.getAttribute('data-target');
            if (!targetSelector) return;
            const target = document.querySelector(targetSelector);
            if (!target) return;

            const projectCard = this.closest('.project-card');
            const titleEl = projectCard ? projectCard.querySelector('h2') : null;
            const title = titleEl ? titleEl.textContent.trim() : '';

            openModal(title, target);
        });
    });

    // close handlers
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
});

// ============================================
// HERO CAROUSEL
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const hero = document.querySelector('.hero');
    const slider = document.querySelector('.hero-slider');
    if (!hero || !slider) return;

    // pegar lista de imagens do atributo data-hero-images (csv)
    const data = hero.getAttribute('data-hero-images') || '';
    const list = data.split(',').map(s => s.trim()).filter(Boolean);

    // se não houver lista, use imagens já presentes no markup
    if (list.length === 0) {
        const exist = Array.from(slider.querySelectorAll('img')).map(i => i.src).filter(Boolean);
        list.push(...exist);
    }

    // garantir ao menos uma imagem
    if (list.length === 0) {
        list.push('images/landing.png');
    }

    // construir slides (substitui conteúdo atual)
    slider.innerHTML = '';
    list.forEach((src, i) => {
        const img = document.createElement('img');
        img.className = 'hero-slide' + (i === 0 ? ' active' : '');
        img.src = src;
        img.alt = 'Fundo do site';
        img.loading = 'lazy';
        img.onerror = function() { this.src = 'images/landing.png'; };
        slider.appendChild(img);
    });

    const slides = slider.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return; // nada a animar

    let current = 0;

    // intervalo configurável via atributo data-hero-interval (ms)
    let intervalMs = parseInt(hero.getAttribute('data-hero-interval'), 10);
    if (isNaN(intervalMs) || intervalMs < 1000) intervalMs = 15000;

    // criar controles (prev/next)
    const prevBtn = document.createElement('button');
    prevBtn.className = 'hero-control hero-prev';
    prevBtn.setAttribute('aria-label', 'Anterior');
    prevBtn.innerHTML = '&#10094;';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'hero-control hero-next';
    nextBtn.setAttribute('aria-label', 'Próximo');
    nextBtn.innerHTML = '&#10095;';

    hero.appendChild(prevBtn);
    hero.appendChild(nextBtn);

    // criar indicadores (dots)
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'hero-dots';
    dotsContainer.setAttribute('role', 'tablist');

    slides.forEach((s, i) => {
        const dot = document.createElement('button');
        dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Ir para slide ' + (i + 1));
        dot.dataset.index = String(i);
        dot.addEventListener('click', function() { goTo(parseInt(this.dataset.index, 10)); resetTimer(); });
        dotsContainer.appendChild(dot);
    });

    hero.appendChild(dotsContainer);

    function show(index) {
        slides[current].classList.remove('active');
        const dots = dotsContainer.querySelectorAll('.hero-dot');
        if (dots[current]) dots[current].classList.remove('active');
        current = index;
        slides[current].classList.add('active');
        if (dots[current]) dots[current].classList.add('active');
    }

    function nextSlide() { show((current + 1) % slides.length); }
    function prevSlide() { show((current - 1 + slides.length) % slides.length); }
    function goTo(i) { if (i >= 0 && i < slides.length) show(i); }

    prevBtn.addEventListener('click', function() { prevSlide(); resetTimer(); });
    nextBtn.addEventListener('click', function() { nextSlide(); resetTimer(); });

    // keyboard navigation
    hero.setAttribute('tabindex', '-1');
    hero.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') { prevSlide(); resetTimer(); }
        if (e.key === 'ArrowRight') { nextSlide(); resetTimer(); }
    });

    let timer = setInterval(nextSlide, intervalMs);

    function resetTimer() { clearInterval(timer); timer = setInterval(nextSlide, intervalMs); }

    // pausar enquanto o usuário interage
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', () => { resetTimer(); });

    // pausar quando página não visível
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) clearInterval(timer);
        else { resetTimer(); }
    });
});