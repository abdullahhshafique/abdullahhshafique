/* ============================================================
   main.js — Portfolio bootstrap
   Lenis smooth scroll: duration 0.72 (snappy, no lag).
   No ES modules — plain IIFE.
   ============================================================ */

(function () {
  'use strict';

  /* year */
  var yrEl = document.getElementById('yr');
  if (yrEl) yrEl.textContent = new Date().getFullYear();

  /* ====================================================
     LENIS SMOOTH SCROLL
     ==================================================== */
  var lenis = null;

  if (window.Lenis && !window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    lenis = new Lenis({
      duration:        0.72,
      easing:          function (t) { return 1 - Math.pow(1 - t, 3); },
      smoothWheel:     true,
      wheelMultiplier: 0.85,
      touchMultiplier: 2.0,
      infinite:        false
    });

    (function rafLoop(time) {
      lenis.raf(time);
      requestAnimationFrame(rafLoop);
    }(0));

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -80, duration: 0.85 });
        }
      });
    });
  }

  /* ====================================================
     TYPEWRITER
     ==================================================== */
  var twEl = document.getElementById('twTarget');
  if (twEl && !window.matchMedia('(prefers-reduced-motion:reduce)').matches) {

    var TW_LINES = [
      'AGENTS,',
      'RAG SYSTEMS,',
      'LLM APPS,',
      'AI PIPELINES,',
      'SHIP APIS,'
    ];
    var twIdx = 0;
    var twCur = document.createElement('span');
    twCur.className = 'tw-cursor';
    twCur.setAttribute('aria-hidden', 'true');

    function twType() {
      var text = TW_LINES[twIdx % TW_LINES.length];
      var ci   = 0;

      function tick() {
        if (ci <= text.length) {
          twEl.textContent = text.slice(0, ci);
          twEl.appendChild(twCur);
          ci++;
          setTimeout(tick, 65);
        } else {
          setTimeout(twErase, 1900);
        }
      }

      function twErase() {
        var cur = twEl.textContent;
        if (cur.length > 0) {
          twEl.textContent = TW_LINES[twIdx % TW_LINES.length].slice(0, cur.length - 1);
          twEl.appendChild(twCur);
          setTimeout(twErase, 28);
        } else {
          twIdx++;
          setTimeout(twType, 300);
        }
      }

      tick();
    }

    setTimeout(twType, 900);

  } else if (twEl) {
    twEl.textContent = 'DEPLOY RAG .';
  }

  /* ====================================================
     SCROLL: progress bar + nav + scroll-to-top
     ==================================================== */
  var pbar = document.getElementById('pbar');
  var nav  = document.getElementById('nav');
  var sto  = document.getElementById('scrollTop');

  window.addEventListener('scroll', function () {
    var s = document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (pbar && h > 0) pbar.style.width = (s / h * 100) + '%';
    if (nav)  nav.classList.toggle('sc', s > 60);
    if (sto)  sto.classList.toggle('show', s > window.innerHeight * 0.55);
  }, { passive: true });

  if (sto) {
    sto.addEventListener('click', function () {
      if (lenis) lenis.scrollTo(0, { duration: 1.0 });
      else       window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ====================================================
     MOBILE MENU + FOCUS TRAP
     ==================================================== */
  var hbg = document.getElementById('hbg');
  var mob = document.getElementById('mobMenu');

  if (hbg && mob) {
    function mobFocusable() {
      return Array.from(mob.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])'));
    }

    hbg.addEventListener('click', function () {
      var open = mob.classList.toggle('open');
      hbg.classList.toggle('open', open);
      hbg.setAttribute('aria-expanded', open ? 'true' : 'false');
      mob.setAttribute('aria-hidden',   open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        var items = mobFocusable();
        if (items[0]) setTimeout(function () { items[0].focus(); }, 80);
      }
    });

    mob.addEventListener('keydown', function (e) {
      if (!mob.classList.contains('open') || e.key !== 'Tab') return;
      var items = mobFocusable();
      var first = items[0];
      var last  = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') window.closeMob();
    });
  }

  window.closeMob = function () {
    if (!mob || !hbg) return;
    mob.classList.remove('open');
    hbg.classList.remove('open');
    hbg.setAttribute('aria-expanded', 'false');
    mob.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    hbg.focus();
  };

  /* ====================================================
     SCROLL REVEAL
     ==================================================== */
  var revObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('vis');
        revObs.unobserve(en.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.rev').forEach(function (el) { revObs.observe(el); });

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

  var countObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.querySelectorAll('.snum[data-target]').forEach(function (el) {
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
  document.querySelectorAll('.m-card').forEach(function (card, i) {
    card.style.animationDelay = (i * 0.18) + 's';
    card.classList.add('m-float');
  });

  /* ====================================================
     COPY EMAIL
     ==================================================== */
  window.copyEmail = function () {
    var email = 'abdullahhshafique@outlook.com';
    var tip   = document.getElementById('copyTip');
    var btn   = document.querySelector('.copybtn');

    function onCopied() {
      if (tip) tip.classList.add('show');
      if (btn) {
        btn.textContent = 'done';
        btn.style.color = 'var(--success)';
        btn.style.borderColor = 'var(--success)';
      }
      setTimeout(function () {
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
      var ta       = document.createElement('textarea');
      ta.value     = email;
      ta.style.cssText = 'position:fixed;opacity:0;top:-9999px;left:-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); onCopied(); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

}());