(function () {
    'use strict';

    /* ── CONFIG ─────────────────────────────────────────────
       Change API_BASE to your deployed backend URL before going live.
       e.g. 'https://api.panchalbrothers.com/api'
           or  'https://panchal-backend.onrender.com/api'
    ────────────────────────────────────────────────────── */
    const API_BASE = '/api';

    /* ── UTILITY: TOAST ─────────────────────────────────── */
    function toast(msg, duration) {
        const t = document.getElementById('toast');
        t.innerHTML = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), duration || 4000);
    }

    /* ── CUSTOM CURSOR ──────────────────────────────────── */
    const cursor = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    (function animCursor() {
        cursor.style.left = mx + 'px';
        cursor.style.top = my + 'px';
        rx += (mx - rx) * 0.12;
        ry += (my - ry) * 0.12;
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
        requestAnimationFrame(animCursor);
    })();

    document.querySelectorAll('a, button, .svc-card, .prod-card, .why-card, .hi-item').forEach(el => {
        el.addEventListener('mouseenter', () => { cursor.classList.add('big'); ring.classList.add('big'); });
        el.addEventListener('mouseleave', () => { cursor.classList.remove('big'); ring.classList.remove('big'); });
    });

    /* ── NAV: SHRINK ON SCROLL ──────────────────────────── */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });

    /* ── BACK TO TOP ────────────────────────────────────── */
    const backTop = document.getElementById('back-top');
    window.addEventListener('scroll', () => {
        backTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    /* ── SCROLL REVEAL (IntersectionObserver) ───────────── */
    const revealEls = document.querySelectorAll('.reveal');
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    revealEls.forEach(el => revealObs.observe(el));

    /* ── COUNTER ANIMATION ──────────────────────────────── */
    function countUp(el, target, suffix, prefix) {
        let n = 0;
        const step = target / 55;
        const timer = setInterval(() => {
            n += step;
            if (n >= target) { n = target; clearInterval(timer); }
            el.textContent = (prefix || '') + Math.floor(n) + (suffix || '');
        }, 22);
    }

    const statsObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                countUp(document.getElementById('cnt1'), 500, '+');
                countUp(document.getElementById('cnt2'), 18, '+');
                countUp(document.getElementById('cnt3'), 20, '+');
                statsObs.disconnect();
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) statsObs.observe(heroStats);

    /* ── LOAD CONTACT INFO FROM BACKEND ─────────────────── */
    async function loadContactInfo() {
        try {
            const res = await fetch(API_BASE + '/contact/info');
            if (!res.ok) return;
            const data = await res.json();
            if (!data.success) return;
            const info = data.data;

            const phoneEl = document.querySelector('.cd-item:nth-child(2) .cd-text span');
            if (phoneEl && info.phones && info.phones.length) {
                phoneEl.textContent = info.phones.join('  |  ');
            }

            const emailEl = document.querySelector('.cd-item:nth-child(3) .cd-text span');
            if (emailEl && info.email) emailEl.textContent = info.email;

            const waBtn = document.querySelector('.wa-btn');
            if (waBtn && info.social && info.social.whatsapp) {
                waBtn.href = info.social.whatsapp + '?text=Hello%20Panchal%20Brothers%2C%20I%20need%20a%20chimney%20quote.';
            }
        } catch (_) {
            /* backend not running — silently ignore, static values remain */
        }
    }

    /* ── LOAD SERVICE OPTIONS FROM BACKEND ──────────────── */
    async function loadServices() {
        try {
            const res = await fetch(API_BASE + '/contact/services');
            if (!res.ok) return;
            const data = await res.json();
            if (!data.success || !data.services) return;
            const sel = document.getElementById('f-service');
            while (sel.options.length > 1) sel.remove(1);
            data.services.forEach(svc => {
                const opt = document.createElement('option');
                opt.value = svc;
                opt.textContent = svc;
                sel.appendChild(opt);
            });
        } catch (_) {
            /* use static options already in HTML */
        }
    }

    /* ── FORM: VALIDATION HELPERS ───────────────────────── */
    const flds = {
        name: document.getElementById('f-name'),
        company: document.getElementById('f-company'),
        phone: document.getElementById('f-phone'),
        email: document.getElementById('f-email'),
        service: document.getElementById('f-service'),
        message: document.getElementById('f-message'),
    };
    const submitBtn = document.getElementById('form-submit');
    const banner = document.getElementById('form-banner');

    function setFieldState(id, isValid, msg) {
        const el = flds[id];
        const err = document.getElementById('err-' + id);
        if (!el) return;
        el.classList.toggle('is-invalid', !isValid);
        el.classList.toggle('is-valid', isValid);
        if (err) err.textContent = isValid ? '' : (msg || '');
    }

    function clearAllStates() {
        Object.keys(flds).forEach(id => {
            const el = flds[id];
            if (el) { el.classList.remove('is-invalid', 'is-valid'); }
            const err = document.getElementById('err-' + id);
            if (err) err.textContent = '';
        });
        banner.style.display = 'none';
        banner.className = 'form-banner';
    }

    function showBanner(type, html) {
        banner.className = 'form-banner ' + type;
        banner.innerHTML = html;
        banner.style.display = 'block';
        banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /* ── FORM: LIVE VALIDATION ──────────────────────────── */
    flds.name.addEventListener('blur', () => {
        const v = flds.name.value.trim();
        setFieldState('name', v.length >= 2, 'Name must be at least 2 characters');
    });

    flds.phone.addEventListener('blur', () => {
        const v = flds.phone.value.trim().replace(/\D/g, '');
        setFieldState('phone', /^[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit Indian mobile number');
    });

    flds.email.addEventListener('blur', () => {
        const v = flds.email.value.trim();
        setFieldState('email', /^\S+@\S+\.\S+$/.test(v), 'Enter a valid email address');
    });

    flds.service.addEventListener('change', () => {
        setFieldState('service', !!flds.service.value, 'Please select a service');
    });

    flds.message.addEventListener('blur', () => {
        const v = flds.message.value.trim();
        setFieldState('message', v.length >= 10, 'Message must be at least 10 characters');
    });

    /* ── FORM: SUBMIT WITH FETCH TO BACKEND ─────────────── */
    submitBtn.addEventListener('click', async () => {
        clearAllStates();

        const name = flds.name.value.trim();
        const company = flds.company.value.trim();
        const rawPhone = flds.phone.value.trim().replace(/\D/g, '');
        const email = flds.email.value.trim().toLowerCase();
        const service = flds.service.value;
        const message = flds.message.value.trim();

        let ok = true;
        if (name.length < 2) { setFieldState('name', false, 'Name is required (min 2 chars)'); ok = false; }
        if (!/^[6-9]\d{9}$/.test(rawPhone)) { setFieldState('phone', false, 'Enter a valid 10-digit Indian mobile number'); ok = false; }
        if (!/^\S+@\S+\.\S+$/.test(email)) { setFieldState('email', false, 'Enter a valid email address'); ok = false; }
        if (!service) { setFieldState('service', false, 'Please select a service'); ok = false; }
        if (message.length < 10) { setFieldState('message', false, 'Please describe your requirements (min 10 chars)'); ok = false; }
        if (!ok) return;

        // Loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-spinner"></span>Sending...';

        try {
            const res = await fetch(API_BASE + '/enquiry/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, company, phone: rawPhone, email, service, message }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showBanner('success',
                    '✅  Enquiry submitted! (ID: <strong>#' + data.enquiryId + '</strong>)<br>' +
                    'We will contact you within 24–48 hours. A confirmation email has been sent to <strong>' + email + '</strong>.'
                );
                submitBtn.innerHTML = '✓  Enquiry Sent!';
                submitBtn.style.background = '#22C55E';
                toast('🎉 Enquiry received! We\'ll call you within 24 hours.', 5000);

                setTimeout(() => {
                    Object.keys(flds).forEach(k => { if (flds[k]) flds[k].value = ''; });
                    clearAllStates();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Send Enquiry →';
                    submitBtn.style.background = '';
                }, 5500);

            } else {
                if (data.details && Array.isArray(data.details)) {
                    data.details.forEach(d => setFieldState(d.field, false, d.message));
                }
                showBanner('error', '⚠️  ' + (data.error || 'Submission failed. Please check the highlighted fields.'));
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Send Enquiry →';
            }

        } catch (err) {
            showBanner('error',
                '⚠️  Server unreachable. Please call us directly:<br>' +
                '<strong>+91 79904 31730</strong> or email <strong>meeralpanchal@panchalbrothers.org</strong>'
            );
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Send Enquiry →';
            console.warn('Enquiry API error:', err.message);
        }
    });

    /* ── ALSO ALLOW CTRL+ENTER ON TEXTAREA ──────────────── */
    flds.message.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.ctrlKey) submitBtn.click();
    });

    /* ── SMOOTH NAV LINK CLICKS ─────────────────────────── */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    /* ── MOBILE NAV ──────────────────────────────────────── */
    (function () {
        const mobileNav = document.getElementById('mobileNav');
        const mobOverlay = document.getElementById('mobOverlay');
        const hamburger = document.getElementById('hamburger');
        if (!mobileNav) return;

        window.toggleMobileNav = function () {
            const isOpen = mobileNav.classList.toggle('open');
            mobOverlay.classList.toggle('active', isOpen);
            hamburger.classList.toggle('open', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        };

        window.closeMobileNav = function () {
            mobileNav.classList.remove('open');
            mobOverlay.classList.remove('active');
            hamburger.classList.remove('open');
            document.body.style.overflow = '';
        };

        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMobileNav(); });
    })();

    /* ── TESTIMONIALS CAROUSEL ────────────────────────────── */
    (function () {
        const track = document.getElementById('testiTrack');
        const dotsWrap = document.getElementById('testiDots');
        const prevBtn = document.getElementById('tPrev');
        const nextBtn = document.getElementById('tNext');
        if (!track || !dotsWrap) return;

        const cards = Array.from(track.children);
        let idx = 0, timer = null;

        function vis() { return window.innerWidth <= 900 ? 1 : 3; }
        function maxIdx() { return Math.max(0, cards.length - vis()); }

        function goTo(i) {
            idx = Math.max(0, Math.min(i, maxIdx()));
            const cardW = cards[0] ? cards[0].offsetWidth : 0;
            track.style.transform = `translateX(-${idx * (cardW + 24)}px)`;
            Array.from(dotsWrap.children).forEach((d, j) => d.classList.toggle('active', j === idx));
        }

        function buildDots() {
            dotsWrap.innerHTML = '';
            for (let i = 0; i <= maxIdx(); i++) {
                const d = document.createElement('button');
                d.className = 'testi-dot' + (i === 0 ? ' active' : '');
                d.setAttribute('aria-label', 'Slide ' + (i + 1));
                d.addEventListener('click', () => { goTo(i); reset(); });
                dotsWrap.appendChild(d);
            }
        }

        const next = () => goTo(idx >= maxIdx() ? 0 : idx + 1);
        const prev = () => goTo(idx <= 0 ? maxIdx() : idx - 1);
        const reset = () => { clearInterval(timer); timer = setInterval(next, 4800); };

        buildDots();
        prevBtn.addEventListener('click', () => { prev(); reset(); });
        nextBtn.addEventListener('click', () => { next(); reset(); });
        window.addEventListener('resize', () => { buildDots(); goTo(0); });

        // Touch / swipe support
        let sx = 0;
        track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
        track.addEventListener('touchend', e => {
            const dx = sx - e.changedTouches[0].clientX;
            if (Math.abs(dx) > 50) { dx > 0 ? next() : prev(); reset(); }
        });

        reset();
    })();

    /* ── INIT API CALLS ─────────────────────────────────── */
    loadContactInfo();
    loadServices();

})();