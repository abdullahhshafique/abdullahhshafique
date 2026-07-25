/* ============================================================
   terminal.js — "now building" terminal widget
   Fetches recent GitHub push events for real commit messages.
   Falls back to static cycling if API unavailable.
   ============================================================ */

(function () {

  var widget = document.getElementById('terminalWidget');
  var out    = widget && widget.querySelector('.term-out');
  if (!widget || !out) return;

  var STATIC = [
    'research-agent  · streaming mode',
    'pdf-assistant   · re-ranking chunks',
    'eval-framework  · hybrid BM25+vec',
    'agent-monitor   · grafana exporter',
    'portfolio       · Catalyst Garden redesign'
  ];

  var lines = STATIC.slice();
  var lIdx  = 0;
  var cIdx  = 0;
  var cur   = null;
  var timer = null;

  function getCursor() {
    if (!cur) {
      cur = document.createElement('span');
      cur.className = 'tw-cursor';
      cur.setAttribute('aria-hidden', 'true');
    }
    return cur;
  }

  function typeNext() {
    var text = lines[lIdx % lines.length];
    cIdx = 0;

    function typeChar() {
      if (cIdx <= text.length) {
        out.textContent = text.slice(0, cIdx);
        out.appendChild(getCursor());
        cIdx++;
        timer = setTimeout(typeChar, 36 + Math.random() * 18);
      } else {
        timer = setTimeout(function () {
          lIdx = (lIdx + 1) % lines.length;
          cIdx = 0;
          typeNext();
        }, 2600);
      }
    }

    typeChar();
  }

  setTimeout(typeNext, 2800);

  /* Try to fetch real commits */
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://api.github.com/users/abdullahhshafique/events?per_page=30');
  xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4 || xhr.status < 200 || xhr.status >= 300) return;
    try {
      var events = JSON.parse(xhr.responseText);
      var real   = [];
      for (var i = 0; i < events.length; i++) {
        var ev = events[i];
        if (ev.type === 'PushEvent' && ev.payload && ev.payload.commits && ev.payload.commits.length) {
          var msg  = (ev.payload.commits[0].message || '').split('\n')[0].slice(0, 36);
          var repo = ev.repo && ev.repo.name ? ev.repo.name.split('/')[1] : 'repo';
          real.push(repo.slice(0, 16).padEnd(16) + '· ' + msg);
          if (real.length >= 5) break;
        }
      }
      if (real.length >= 2) {
        lines = real.concat(STATIC.slice(0, 2));
      }
    } catch (_) {}
  };
  xhr.send();

  widget.addEventListener('click', function () {
    widget.classList.toggle('expanded');
  });

}());