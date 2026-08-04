/* ==========================================================================
 * ui.js — shared utilities, navigation, theme, particles, reveals, toasts
 * ========================================================================== */

window.ESC = window.ESC || {};

(function () {
    'use strict';

    /* ------------------------------------------------------------------
     * DOM helpers
     * ------------------------------------------------------------------ */
    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

    /* ------------------------------------------------------------------
     * Navigation
     * ------------------------------------------------------------------ */
    function initNavigation() {
        const navbar = $('#navbar');
        const toggle = $('#navToggle');
        const menu = $('#navMenu');

        const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        if (toggle && menu) {
            const closeMenu = () => {
                menu.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.setAttribute('aria-label', 'Open navigation menu');
            };

            toggle.addEventListener('click', () => {
                const open = menu.classList.toggle('open');
                toggle.setAttribute('aria-expanded', String(open));
                toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
            });

            $$('.nav-link', menu).forEach((link) => link.addEventListener('click', closeMenu));

            document.addEventListener('click', (event) => {
                if (menu.classList.contains('open') && !menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
            });
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') closeMenu();
            });
        }
    }

    /* ------------------------------------------------------------------
     * Theme toggle (dark default, light persisted)
     * ------------------------------------------------------------------ */
    const THEME_KEY = 'esc-theme';

    function applyTheme(theme) {
        const root = document.documentElement;
        root.classList.toggle('theme-light', theme === 'light');
        const btn = $('#themeToggle');
        if (btn) btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
        const meta = $('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme === 'light' ? '#F7F9FC' : '#0F172A');
    }

    function initTheme() {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored) applyTheme(stored);

        const btn = $('#themeToggle');
        if (btn) {
            btn.addEventListener('click', () => {
                const next = document.documentElement.classList.contains('theme-light') ? 'dark' : 'light';
                applyTheme(next);
                localStorage.setItem(THEME_KEY, next);
            });
        }
    }

    /* ------------------------------------------------------------------
     * Smooth scrolling for .js-scroll-to buttons
     * ------------------------------------------------------------------ */
    function initSmoothScroll() {
        $$('.js-scroll-to').forEach((button) => {
            button.addEventListener('click', () => {
                const target = document.querySelector(button.dataset.target);
                if (target) {
                    const top = target.getBoundingClientRect().top + window.scrollY - 60;
                    window.scrollTo({ top, behavior: 'smooth' });
                }
            });
        });
    }

    /* ------------------------------------------------------------------
     * Reveal-on-scroll (IntersectionObserver)
     * ------------------------------------------------------------------ */
    function initReveals() {
        const elements = $$('.reveal');
        if (!('IntersectionObserver' in window)) {
            elements.forEach((el) => el.classList.add('visible'));
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );
        elements.forEach((el) => observer.observe(el));
    }

    /* ------------------------------------------------------------------
     * Button ripple effect
     * ------------------------------------------------------------------ */
    function initRipples() {
        $$('.btn').forEach((button) => {
            button.addEventListener('pointerdown', (event) => {
                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                ripple.style.width = `${size}px`;
                ripple.style.height = `${size}px`;
                ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
                ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
                button.appendChild(ripple);
                ripple.addEventListener('animationend', () => ripple.remove());
            });
        });
    }

    /* ------------------------------------------------------------------
     * Hero particles + neural connections (canvas)
     * ------------------------------------------------------------------ */
    function initParticles() {
        const canvas = $('#particleCanvas');
        if (!canvas || !canvas.getContext) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const ctx = canvas.getContext('2d');
        let width, height, particles;
        const COUNT = window.innerWidth < 780 ? 36 : 64;

        const resize = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            width = canvas.width = rect.width;
            height = canvas.height = rect.height;
        };

        const seed = () => {
            particles = Array.from({ length: COUNT }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: 1 + Math.random() * 1.8,
            }));
        };

        const tick = () => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
                ctx.fill();

                for (let j = i + 1; j < particles.length; j += 1) {
                    const q = particles[j];
                    const dx = p.x - q.x;
                    const dy = p.y - q.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < 130) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.strokeStyle = `rgba(6, 182, 212, ${0.18 * (1 - dist / 130)})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            });

            requestAnimationFrame(tick);
        };

        resize();
        seed();
        tick();
        window.addEventListener('resize', resize, { passive: true });
    }

    /* ------------------------------------------------------------------
     * Animated number counters (hero stats)
     * ------------------------------------------------------------------ */
    function animateCounter(el) {
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const duration = 1400;
        const start = performance.now();

        const step = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            const value = target * eased;
            el.textContent = (Number.isInteger(target) ? Math.round(value) : value.toFixed(2)) + suffix;
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    function initCounters() {
        const counters = $$('[data-count]');
        if (!('IntersectionObserver' in window)) {
            counters.forEach(animateCounter);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );
        counters.forEach((el) => observer.observe(el));
    }

    /* ------------------------------------------------------------------
     * Performance image fullscreen viewer
     * ------------------------------------------------------------------ */
    function initFullscreenViewer() {
        const viewer = $('#fullscreenViewer');
        const image = $('#fullscreenImage');
        if (!viewer) return;

        const open = (src) => {
            image.src = src;
            viewer.hidden = false;
            document.body.style.overflow = 'hidden';
        };
        const close = () => {
            viewer.hidden = true;
            document.body.style.overflow = '';
        };

        $$('[data-expand]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const img = btn.closest('[data-figure]').querySelector('.perf-img');
                if (img) open(img.src);
            });
        });
        $$('.perf-img').forEach((img) => img.addEventListener('click', () => open(img.src)));

        const closeBtn = $('[data-close-fs]');
        if (closeBtn) closeBtn.addEventListener('click', close);
        viewer.addEventListener('click', (event) => {
            if (event.target === viewer) close();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !viewer.hidden) close();
        });
    }

    /* ------------------------------------------------------------------
     * Toast notifications
     * ------------------------------------------------------------------ */
    let toastTimer = null;

    function showToast(message, type = 'info', duration = 2600) {
        let toast = $('#toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.className = `toast ${type === 'error' ? 'toast--error' : ''}${type === 'success' ? 'toast--success' : ''}`;
        toast.hidden = false;

        void toast.offsetWidth;
        requestAnimationFrame(() => toast.classList.add('show'));

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => { toast.hidden = true; }, 500);
        }, duration);
    }

    /* ------------------------------------------------------------------
     * Static content data (5 classes, tech stack)
     * ------------------------------------------------------------------ */
    const CLASS_DATA = [
        { name: 'Dog Bark', color: '#A78BFA', desc: 'Short, rhythmic bursts of a barking dog.' },
        { name: 'Car Horn', color: '#F59E0B', desc: 'Sharp repeated honks from vehicles.' },
        { name: 'Engine Idling', color: '#34D399', desc: 'Low rumbling of an idling engine.' },
        { name: 'Siren', color: '#60A5FA', desc: 'Rising and falling emergency wail.' },
        { name: 'Street Music', color: '#22D3EE', desc: 'Music played live on the street.' },
    ];

    const CLASS_ICONS = {
        'Dog Bark': 'M10 5v6M14 5v6M6 9h12M4 21v-7a8 8 0 0 1 16 0v7M9 21v-5h6v5',
        'Car Horn': 'M5 12V8a7 7 0 0 1 14 0v4M5 12h14M7 12v7h4v-7M13 12v7h4v-7',
        'Engine Idling': 'M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM8 12h8M12 12v4M9 16H6a3 3 0 0 0-3 3v2h6M15 16h3a3 3 0 0 1 3 3v2h-6M3 21h18',
        'Siren': 'M12 3a7 7 0 0 0-7 7v5H3v3h18v-3h-2v-5a7 7 0 0 0-7-7ZM9 21h6',
        'Street Music': 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    };

    const STACK = [
        { name: 'Python', color: '#38BDF8', icon: 'M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5' },
        { name: 'TensorFlow', color: '#F59E0B', icon: 'M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5' },
        { name: 'Keras', color: '#EF4444', icon: 'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2ZM2 10h20M6 6v4M10 6v4M14 6v4M18 6v4' },
        { name: 'Librosa', color: '#10B981', icon: 'M12 2a3 3 0 0 0-3 3v7a6 6 0 0 0 12 0V5a3 3 0 0 0-3-3Z' },
        { name: 'NumPy', color: '#7C3AED', icon: 'M8 2v20M16 2v20M4 8h16M4 16h16M12 2v20' },
        { name: 'Flask', color: '#94A3B8', icon: 'M5 5h14M5 19h14M12 5v14M5 12h14' },
        { name: 'HTML5', color: '#F59E0B', icon: 'M4 3h16l-2 16-6 2-6-2-2-16ZM9 9h6M12 9v7' },
        { name: 'CSS3', color: '#38BDF8', icon: 'M4 3h16l-2 16-6 2-6-2-2-16ZM9 12h6M12 12v4' },
        { name: 'JavaScript', color: '#EAB308', icon: 'M8 3 4 12l4 9M16 3l4 9-4 9M13 6l-2 12M11 6l-2 12' },
    ];

    /* ------------------------------------------------------------------
     * Public API
     * ------------------------------------------------------------------ */
    ESC.$ = $;
    ESC.$$ = $$;
    ESC.showToast = showToast;
    ESC.CLASS_DATA = CLASS_DATA;
    ESC.CLASS_ICONS = CLASS_ICONS;
    ESC.STACK = STACK;

    ESC.initUI = function () {
        initNavigation();
        initTheme();
        initSmoothScroll();
        initReveals();
        initRipples();
        initParticles();
        initCounters();
        initFullscreenViewer();
    };
})();
