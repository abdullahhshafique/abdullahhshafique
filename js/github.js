/* ============================================================
   github.js  —  GitHub API integration
   • Stars + forks  (localStorage 5-min cache, skeleton loading)
   • 90-day contribution heatmap  (events API → canvas)
   • Language breakdown chart     (languages API → animated bars)
   All XHR — no fetch/Promise polyfill needed.
   Updated: Color scheme changed from green to pink/magenta
   ============================================================ */

(function () {

  var USER      = 'abdullahhshafique';
  var REPOS     = [
    'research-agent-langgraph',
    'pdf-knowledge-assistant',
    'house-price-prediction-api',
    'llm-eval-framework',
    'agent-monitor'
  ];
  var CACHE_KEY = 'gh_data_v5';
  var CACHE_TTL = 5 * 60 * 1000;  /* 5 minutes */

  /* ── tiny XHR helper ── */
  function get(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try { cb(null, JSON.parse(xhr.responseText)); }
        catch (e) { cb(e, null); }
      } else {
        cb(new Error('HTTP ' + xhr.status), null);
      }
    };
    xhr.onerror = function () { cb(new Error('network'), null); };
    xhr.send();
  }

  /* ── apply stars / forks ── */
  function applyStats(stars, forks) {
    var se = document.getElementById('ghStars');
    var fe = document.getElementById('ghForks');
    if (se) se.textContent = stars + ' GitHub stars';
    if (fe) fe.textContent = forks + ' forks';
  }

  /* ── language bar chart ── */
  var LANG_CLR = {
    Python:'#c26a97',      /* pink-dim */
    JavaScript:'#f5b8d0',  /* pink */
    TypeScript:'#22d3ee',  /* cyan */
    HTML:'#e34c26',
    CSS:'#f5b8d0',         /* pink instead of purple */
    Dockerfile:'#384d54',
    Shell:'#89e051',
    Jupyter:'#DA5B0B'
  };

  function drawLangs(langs) {
    var el = document.getElementById('langChart');
    if (!el || !langs) return;
    var entries = Object.entries(langs).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
    var total   = entries.reduce(function (s, e) { return s + e[1]; }, 0);
    if (!total) return;

    el.innerHTML = entries.map(function (e) {
      var name  = e[0], bytes = e[1];
      var pct   = ((bytes / total) * 100).toFixed(1);
      var color = LANG_CLR[name] || '#64748b';
      return '<div class="lang-row">' +
        '<span class="lang-dot" style="background:' + color + '"></span>' +
        '<span class="lang-name">' + name + '</span>' +
        '<div class="lang-bar-wrap">' +
          '<div class="lang-bar" style="width:' + pct + '%;background:' + color + ';"></div>' +
        '</div>' +
        '<span class="lang-pct">' + pct + '%</span>' +
      '</div>';
    }).join('');

    /* Trigger CSS transition */
    requestAnimationFrame(function () {
      el.querySelectorAll('.lang-bar').forEach(function (b) { b.style.opacity = '1'; });
    });
  }

  /* ── 90-day contribution heatmap ── */
  function drawContrib(events) {
    var canvas = document.getElementById('contribCanvas');
    if (!canvas) return;
    var ctx  = canvas.getContext('2d');
    var DPR  = Math.min(window.devicePixelRatio, 2);
    var days = 90;

    /* Build date map */
    var map  = {};
    var now  = new Date();
    for (var i = 0; i < days; i++) {
      var d = new Date(now);
      d.setDate(now.getDate() - i);
      map[d.toISOString().slice(0, 10)] = 0;
    }

    if (Array.isArray(events)) {
      events.forEach(function (ev) {
        if (ev.type === 'PushEvent') {
          var day = ev.created_at.slice(0, 10);
          if (map[day] !== undefined) {
            map[day] += (ev.payload && ev.payload.commits) ? ev.payload.commits.length : 1;
          }
        }
      });
    }

    var CELL = 12, GAP = 3;
    var COLS = Math.ceil(days / 7);
    var W    = COLS * (CELL + GAP);
    var H    = 7    * (CELL + GAP);

    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);

    var dateList = Object.keys(map).sort();  /* oldest first so col increases left→right */
    var vals   = Object.values(map);
    var maxVal = Math.max.apply(null, vals.concat([1]));

    dateList.forEach(function (date, idx) {
      var count = map[date];
      var col   = Math.floor(idx / 7);
      var row   = idx % 7;
      var x     = col * (CELL + GAP);
      var y     = row * (CELL + GAP);
      var t     = count / maxVal;

      /* Pink/magenta heatmap colors instead of green */
      ctx.fillStyle = count === 0
        ? '#131328'
        : 'rgba(' + Math.round(194 + t * 51) + ',' + Math.round(106 + t * 78) + ',' + Math.round(151 + t * 56) + ',' + (0.3 + t * 0.7) + ')';

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, CELL, CELL, 2);
      } else {
        ctx.rect(x, y, CELL, CELL);
      }
      ctx.fill();
    });
  }

  /* ── main init ── */
  function init() {
    /* Check cache */
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (_) {}

    if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
      applyStats(cached.stars, cached.forks);
      drawLangs(cached.langs);
      /* Still fetch events for fresh heatmap (lightweight endpoint) */
      get('https://api.github.com/users/' + USER + '/events?per_page=100', function (err, ev) {
        drawContrib(err ? [] : ev);
      });
      return;
    }

    /* Fetch all repos in parallel via sequential XHRs */
    var stars = 0, forks = 0;
    var langs = {};
    var total = REPOS.length;
    var done  = 0;

    REPOS.forEach(function (repo) {
      get('https://api.github.com/repos/' + USER + '/' + repo, function (err, data) {
        if (!err && data) {
          stars += (data.stargazers_count || 0);
          forks += (data.forks_count      || 0);
        }
        /* Fetch languages for this repo */
        get('https://api.github.com/repos/' + USER + '/' + repo + '/languages', function (err2, ldata) {
          if (!err2 && ldata) {
            Object.keys(ldata).forEach(function (k) {
              langs[k] = (langs[k] || 0) + ldata[k];
            });
          }
          done++;
          if (done === total) {
            applyStats(stars, forks);
            drawLangs(langs);
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify({
                stars: stars, forks: forks, langs: langs, ts: Date.now()
              }));
            } catch (_) {}
          }
        });
      });
    });

    /* Contribution heatmap — independent */
    get('https://api.github.com/users/' + USER + '/events?per_page=100', function (err, ev) {
      drawContrib(err ? [] : ev);
    });
  }

  /* Defer slightly so page paint is not blocked */
  setTimeout(init, 600);

}());