/* ============================================================
   cursor.js — Custom cursor + particle trail
   Desktop only. Disabled on touch devices.
   ============================================================ */

(function () {

  /* touch guard */
  if (window.matchMedia('(pointer:coarse)').matches) {
    ['curDot', 'curRing', 'trailCanvas'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    return;
  }

  var dot  = document.getElementById('curDot');
  var ring = document.getElementById('curRing');
  var tc   = document.getElementById('trailCanvas');
  if (!dot || !ring) return;

  /* trail canvas */
  var ctx = null;
  if (tc) {
    function resizeTrail() {
      tc.width  = window.innerWidth;
      tc.height = window.innerHeight;
    }
    resizeTrail();
    window.addEventListener('resize', resizeTrail, { passive: true });
    ctx = tc.getContext('2d');
  }

  /* state */
  var mx = -500, my = -500;
  var rx = -500, ry = -500;
  var spawnX = 0, spawnY = 0;

  /* particle pool */
  var POOL  = 24;
  var pool  = [];
  var pHead = 0;
  for (var i = 0; i < POOL; i++) {
    pool.push({ x:0, y:0, life:0, maxLife:0, r:0 });
  }

  /* mouse move */
  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    var dx = mx - spawnX, dy = my - spawnY;
    if (dx*dx + dy*dy > 100) {
      var p = pool[pHead % POOL];
      p.x = mx; p.y = my;
      p.maxLife = p.life = 18 + Math.random() * 10;
      p.r = 1.5 + Math.random() * 1.8;
      pHead++;
      spawnX = mx; spawnY = my;
    }
  }, { passive: true });

  /* leave / enter */
  document.addEventListener('mouseleave', function () {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function () {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });

  /* hover expand */
  function addHover(el) {
    el.addEventListener('mouseenter', function () { document.body.classList.add('hov'); });
    el.addEventListener('mouseleave', function () { document.body.classList.remove('hov'); });
  }
  document.querySelectorAll(
    'a, button, .pill, .stag, .m-card, .pcard, .sys-card, .proof-card, .pl, .nav-hire'
  ).forEach(addHover);

  /* RAF loop */
  var LERP = 0.13;

  (function loop() {
    requestAnimationFrame(loop);

    /* dot: instant */
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';

    /* ring: smooth lerp */
    rx += (mx - rx) * LERP;
    ry += (my - ry) * LERP;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';

    /* particle trail */
    if (ctx) {
      ctx.clearRect(0, 0, tc.width, tc.height);
      for (var i = 0; i < POOL; i++) {
        var p = pool[i];
        if (p.life <= 0) continue;
        p.life--;
        var t = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * t, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(18,31,39,' + (t * 0.35).toFixed(3) + ')';
        ctx.fill();
      }
    }
  }());

}());