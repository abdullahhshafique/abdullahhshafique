/* ============================================================
   main.js  —  Portfolio Cinematic Engine
   Merged: Template scroll-driven cinematic system + Original
   portfolio features (typewriter, nav, mobile menu, copy email,
   GitHub stats, terminal widget, count-up, scroll reveal)
   ============================================================ */

(function() {
    'use strict';

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    /* ====================================================
       YEAR
       ==================================================== */
    var yrEl = document.getElementById('yr');
    if (yrEl) yrEl.textContent = new Date().getFullYear();

    /* ====================================================
       BEATS — Cinematic scroll-driven text reveals
       ==================================================== */
    const beats = [
        { el: document.querySelector('[data-beat="0"]'), s: 0.00, e: 0.10 },
        { el: document.querySelector('[data-beat="1"]'), s: 0.11, e: 0.22 },
        { el: document.querySelector('[data-beat="2"]'), s: 0.23, e: 0.33 },
        { el: document.querySelector('[data-beat="3"]'), s: 0.34, e: 0.47 },
        { el: document.querySelector('[data-beat="4"]'), s: 0.48, e: 0.64 },
        { el: document.querySelector('[data-beat="5"]'), s: 0.65, e: 0.81 },
        { el: document.querySelector('[data-beat="6"]'), s: 0.82, e: 1.00 }
    ];

    function beatOpacity(p, s, e) {
        const mid = (s + e) / 2,
            span = (e - s);
        const fade = span * 0.30;
        if (p < s || p > e) return 0;
        if (p < s + fade) return (p - s) / fade;
        if (p > e - fade) return (e - p) / fade;
        return 1;
    }

    /* ── dots ── */
    const dotRow = document.getElementById('dotRow');
    beats.forEach((b, i) => {
        const d = document.createElement('span');
        d.style.cssText =
            'width:0.5rem;height:0.5rem;border-radius:50%;background:rgba(255,255,255,0.25);transition:background .3s,transform .3s;cursor:pointer;flex-shrink:0;';
        d.addEventListener('click', () => {
            const sec = document.getElementById('cinematic');
            const top = sec.offsetTop + ((b.s + b.e) / 2) * (sec.offsetHeight - window.innerHeight);
            window.scrollTo({ top, behavior: 'smooth' });
        });
        dotRow.appendChild(d);
        b.dot = d;
    });

    /* ── refs ── */
    const section = document.getElementById('cinematic');
    const bgLayer = document.getElementById('bgLayer');
    const midLayer = document.getElementById('midLayer');
    const bouquet = document.getElementById('bouquet');
    const grade = document.getElementById('gradeWash');
    const lbTop = document.getElementById('lbTop');
    const lbBot = document.getElementById('lbBot');
    const tlFill = document.getElementById('timelineFill');
    const timeLabel = document.getElementById('timeLabel');
    const DUR = 12.75;

    let rawP = 0,
        renderP = 0;

    /* ── set background ── */
    const bgImages = [];
    const bgIdx = Math.floor(Math.random() * bgImages.length);
    if (bgLayer) {
        bgLayer.style.backgroundImage = 'url(' + bgImages[bgIdx] + ')';
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
    }

    /* ── raf loop ── */
    function raf() {
        renderP += (rawP - renderP) * 0.10;
        const p = renderP;

        const scale = 1 + p * 0.55 - Math.max(0, p - 0.48) * 0.35;
        const roll = p * 4 - Math.max(0, p - 0.65) * 3;
        const fwd = p * -40;

        if (bouquet) {
            bouquet.style.transform = 'scale(' + scale + ') rotate(' + roll + 'deg) translateY(' + fwd + 'px)';
        }
        if (bgLayer) {
            bgLayer.style.transform = 'scale(' + (1.1 + p * 0.15) + ') translateY(' + (p * -60) + 'px)';
        }
        if (midLayer) {
            midLayer.style.transform = 'translateY(' + (p * 30) + 'px)';
        }

        const pd = p < 0.48 ? p * 0.3 : Math.min(1, (p - 0.40) * 2.2);
        const wa = Math.max(0, (p - 0.60)) * 1.4;
        if (window.__petalDensity) window.__petalDensity(pd);
        if (window.__windAmt) window.__windAmt(wa);

        if (grade) {
            grade.style.opacity = 0.4 + Math.sin(p * Math.PI) * 0.5;
        }

        let lb = 0;
        if (p < 0.06) lb = (p / 0.06) * 7;
        else if (p > 0.92) lb = 7 * (1 - (p - 0.92) / 0.08);
        else lb = 7;
        if (lbTop) lbTop.style.height = lb + 'vh';
        if (lbBot) lbBot.style.height = lb + 'vh';

        if (tlFill) tlFill.style.width = (p * 100) + '%';
        if (timeLabel) timeLabel.textContent = (p * DUR).toFixed(2) + 's';

        beats.forEach(b => {
            const o = beatOpacity(p, b.s, b.e);
            if (b.el) {
                b.el.style.opacity = o.toFixed(3);
                b.el.style.transform = 'translateY(' + ((1 - o) * 18) + 'px)';
            }
            const active = p >= b.s && p <= b.e;
            if (b.dot) {
                b.dot.style.background = active ? '#f5b8d0' : 'rgba(255,255,255,0.25)';
                b.dot.style.transform = active ? 'scale(1.4)' : 'scale(1)';
            }
        });

        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    /* ── scroll update ── */
    function updateScroll() {
        const rect = section.getBoundingClientRect();
        const travel = section.offsetHeight - window.innerHeight;
        const scrolled = Math.min(Math.max(-rect.top, 0), travel);
        rawP = travel > 0 ? scrolled / travel : 0;
        if (reduce) renderP = rawP;
    }

    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    /* ====================================================
       PROGRESS BAR + NAV + SCROLL TO TOP
       ==================================================== */
    var pbar = document.getElementById('pbar');
    var nav = document.getElementById('nav');
    var sto = document.getElementById('scrollTop');

    window.addEventListener('scroll', function() {
        var s = document.documentElement.scrollTop;
        var h = document.documentElement.scrollHeight - window.innerHeight;
        if (pbar && h > 0) pbar.style.width = (s / h * 100) + '%';
        if (nav) nav.classList.toggle('sc', s > 60);
        if (sto) sto.classList.toggle('show', s > window.innerHeight * 0.55);
    }, { passive: true });

    if (sto) {
        sto.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ====================================================
       MOBILE MENU + FOCUS TRAP
       ==================================================== */
    var hbg = document.getElementById('hbg');
    var mob = document.getElementById('mobMenu');

    if (hbg && mob) {
        function mobFocusable() {
            return Array.from(mob.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])'));
        }

hbg.addEventListener('click', function(e) {
    e.stopPropagation();
    window.toggleMob();
});

        mob.addEventListener('keydown', function(e) {
            if (!mob.classList.contains('open') || e.key !== 'Tab') return;
            var items = mobFocusable();
            var first = items[0];
            var last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault(); last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first.focus();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') window.closeMob();
        });
    }

window.closeMob = function() {
    if (!mob || !hbg) return;
    mob.classList.remove('open');
    hbg.classList.remove('open');
    hbg.setAttribute('aria-expanded', 'false');
    mob.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (hbg) hbg.focus();
};
// Add this function to toggle the mobile menu
window.toggleMob = function() {
    if (!mob || !hbg) return;
    var open = mob.classList.contains('open');
    if (open) {
        window.closeMob();
    } else {
        mob.classList.add('open');
        hbg.classList.add('open');
        hbg.setAttribute('aria-expanded', 'true');
        mob.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        var items = mob.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])');
        if (items[0]) setTimeout(function() { items[0].focus(); }, 80);
    }
};
    /* ====================================================
       SCROLL REVEAL
       ==================================================== */
    var revObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(en) {
            if (en.isIntersecting) {
                en.target.classList.add('vis');
                revObs.unobserve(en.target);
            }
        });
    }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.rev').forEach(function(el) { revObs.observe(el); });

    /* ====================================================
       COUNT-UP on stats grid
       ==================================================== */
    function countUp(el, target, duration) {
        var su = el.querySelector('.sunit') ? el.querySelector('.sunit').outerHTML : '';
        var t0 = performance.now();

        function tick(now) {
            var t = Math.min((now - t0) / duration, 1);
            var v = 1 - Math.pow(1 - t, 3);
            el.innerHTML = Math.round(target * v) + su;
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    var countObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(en) {
            if (en.isIntersecting) {
                en.target.querySelectorAll('.snum[data-target]').forEach(function(el) {
                    countUp(el, parseInt(el.dataset.target, 10), 1500);
                });
                countObs.unobserve(en.target);
            }
        });
    }, { threshold: 0.3 });

    var grid = document.querySelector('.stats-grid');
    if (grid) countObs.observe(grid);

    /* ====================================================
       FLOATING METRICS — staggered float animation
       ==================================================== */
    document.querySelectorAll('.m-card').forEach(function(card, i) {
        card.style.animationDelay = (i * 0.18) + 's';
        card.classList.add('m-float');
    });

    /* ====================================================
       COPY EMAIL
       ==================================================== */
    window.copyEmail = function() {
        var email = 'abdullahhshafique@outlook.com';
        var tip = document.getElementById('copyTip');
        var btn = document.querySelector('.copybtn');

        function onCopied() {
            if (tip) tip.classList.add('show');
            if (btn) {
                btn.textContent = 'done';
                btn.style.color = 'var(--pink)';
                btn.style.borderColor = 'var(--pink)';
            }
            setTimeout(function() {
                if (tip) tip.classList.remove('show');
                if (btn) {
                    btn.textContent = 'copy';
                    btn.style.color = '';
                    btn.style.borderColor = '';
                }
            }, 2400);
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(email).then(onCopied).catch(fallback);
        } else {
            fallback();
        }

        function fallback() {
            var ta = document.createElement('textarea');
            ta.value = email;
            ta.style.cssText = 'position:fixed;opacity:0;top:-9999px;left:-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try { document.execCommand('copy'); onCopied(); } catch (_) {}
            document.body.removeChild(ta);
        }
    };

    /* ====================================================
       GSAP ANIMATIONS
       ==================================================== */
    if (window.gsap && window.ScrollTrigger && !reduce) {
        gsap.registerPlugin(ScrollTrigger);

        /* reveal lines */
        document.querySelectorAll('.reveal-line').forEach(line => {
            const inner = line.firstElementChild;
            if (inner) {
                gsap.set(inner, { yPercent: 120 });
                gsap.to(inner, {
                    yPercent: 0,
                    duration: 0.9,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: line,
                        start: 'top 85%'
                    }
                });
            }
        });

        /* fade cards */
        gsap.utils.toArray('.fade-card').forEach((c, i) => {
            gsap.from(c, {
                opacity: 0,
                y: 40,
                duration: 0.7,
                ease: 'power2.out',
                delay: i * 0.1,
                scrollTrigger: {
                    trigger: c,
                    start: 'top 88%'
                }
            });
        });

        /* craft bg parallax */
        gsap.to('#craftBg', {
            yPercent: 20,
            ease: 'none',
            scrollTrigger: {
                trigger: '#craft',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });

        /* integration cards */
        gsap.utils.toArray('#integration .fade-card').forEach(function(c, i) {
            gsap.fromTo(c, { y: 60, rotateX: 12, autoAlpha: 0, transformPerspective: 900 }, {
                y: 0,
                rotateX: 0,
                autoAlpha: 1,
                duration: 0.9,
                ease: 'power3.out',
                scrollTrigger: { trigger: c, start: 'top 88%' }
            });
        });

        /* craft strip */
        gsap.to('#craft .reveal-line', {
            yPercent: -15,
            ease: 'none',
            scrollTrigger: {
                trigger: '#craft',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1
            }
        });

        /* manifesto words */
        const words = document.querySelectorAll('#noema-manifesto .manifesto-text span');
        if (words.length) {
            gsap.fromTo(words, { autoAlpha: 0.12, y: '0.4em' }, {
                autoAlpha: 1,
                y: '0em',
                ease: 'none',
                stagger: 0.4,
                scrollTrigger: {
                    trigger: '#noema-manifesto',
                    start: 'top 70%',
                    end: 'center center',
                    scrub: 1
                }
            });
        }

        /* board */
        gsap.to('#noema-board h2', {
            yPercent: -14,
            ease: 'none',
            scrollTrigger: {
                trigger: '#noema-board',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1
            }
        });
        gsap.utils.toArray('#noema-board article').forEach(function(a, i) {
            gsap.fromTo(a, { y: 70, autoAlpha: 0 }, {
                y: 0,
                autoAlpha: 1,
                duration: 0.8,
                ease: 'power3.out',
                delay: i * 0.08,
                scrollTrigger: { trigger: '#noema-board', start: 'top 75%' }
            });
        });

        /* support */
        gsap.to('#noema-support h2', {
            yPercent: -12,
            ease: 'none',
            scrollTrigger: {
                trigger: '#noema-support',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1
            }
        });
        gsap.utils.toArray('#noema-support article').forEach(function(a, i) {
            gsap.fromTo(a, { y: 90, rotateX: 8, autoAlpha: 0, transformPerspective: 900 }, {
                y: 0,
                rotateX: 0,
                autoAlpha: 1,
                duration: 0.9,
                ease: 'power3.out',
                delay: i * 0.1,
                scrollTrigger: { trigger: '#noema-support', start: 'top 72%' }
            });
        });

        /* footer */
        gsap.fromTo('footer > div', { y: 40, autoAlpha: 0 }, {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: { trigger: 'footer', start: 'top 90%' }
        });

        /* magnetic hover */
        const mag = document.querySelectorAll('nav a, nav button, #craft a, #noema-support button, footer a');
        mag.forEach(function(el) {
            el.style.willChange = 'transform';
            el.addEventListener('mousemove', function(e) {
                const r = el.getBoundingClientRect();
                const mx = (e.clientX - r.left - r.width / 2) / r.width;
                const my = (e.clientY - r.top - r.height / 2) / r.height;
                gsap.to(el, { x: mx * 6, y: my * 4, duration: 0.4, ease: 'power2.out' });
            });
            el.addEventListener('mouseleave', function() {
                gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
            });
        });

        /* dot row hover */
        document.querySelectorAll('#dotRow span').forEach(function(d) {
            d.addEventListener('mouseenter', function() {
                gsap.to(d, { scale: 1.8, duration: 0.3, ease: 'back.out(2)' });
            });
            d.addEventListener('mouseleave', function() {
                gsap.to(d, { scale: 1, duration: 0.3 });
            });
        });
    }

    /* ====================================================
       3D CARD TILT (non-GSAP fallback)
       ==================================================== */
    if (!window.gsap || reduce) {
        document.querySelectorAll('.fade-card').forEach(card => {
            const img = card.querySelector('.card-img');
            const content = card.querySelector('.card-content');
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const cx = rect.width / 2,
                    cy = rect.height / 2;
                const rx = ((y - cy) / cy) * -10;
                const ry = ((x - cx) / cx) * 10;
                card.style.transform =
                    'perspective(1000px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale3d(1.02,1.02,1.02)';
                card.style.transition = 'transform 0.1s ease-out';
                if (img) {
                    img.style.transform = 'translateZ(30px)';
                    img.style.transition = 'transform 0.1s ease-out';
                }
                if (content) {
                    content.style.transform = 'translateZ(20px)';
                    content.style.transition = 'transform 0.1s ease-out';
                }
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
                card.style.transition = 'transform 0.5s ease-out';
                if (img) {
                    img.style.transform = 'translateZ(0px)';
                    img.style.transition = 'transform 0.5s ease-out';
                }
                if (content) {
                    content.style.transform = 'translateZ(0px)';
                    content.style.transition = 'transform 0.5s ease-out';
                }
            });
        });
    }

    /* ====================================================
       GSAP COLLECTION SCRUB
       ==================================================== */
    if (window.gsap && window.ScrollTrigger && !reduce) {
        const cards = gsap.utils.toArray('#collection .fade-card');
        if (cards.length) {
            gsap.fromTo(cards, {
                x: function(i) { return [-260, 0, 240][i] || 0; },
                y: function(i) { return [-80, 120, -80][i] || 0; },
                rotate: function(i) { return [-14, 0, 14][i] || 0; },
                scale: 0.86,
                autoAlpha: 0.4
            }, {
                x: 0,
                y: 0,
                rotate: 0,
                scale: 1,
                autoAlpha: 1,
                stagger: 0.05,
                ease: 'none',
                scrollTrigger: {
                    trigger: '#collection',
                    start: 'top 80%',
                    end: 'top 20%',
                    scrub: 1
                }
            });
        }
        gsap.fromTo('#collection [data-scroll-word]', { y: '6vh', scale: 1.04 }, {
            y: '-4vh',
            scale: 0.99,
            ease: 'none',
            scrollTrigger: {
                trigger: '#collection',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1
            }
        });
    }

    /* ====================================================
       GSAP LOAD GUARD
       ==================================================== */
    if (window.gsap && window.ScrollTrigger) {
        try { gsap.registerPlugin(ScrollTrigger); } catch (e) {}
    }

    /* ====================================================
       CONTEXT MENU BLOCK
       ==================================================== */
    document.addEventListener('contextmenu', function(e) { e.preventDefault(); });

})();

