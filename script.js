(function () {
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  var themeToggle = document.getElementById('theme-toggle');

  function currentTheme() {
    return root.getAttribute('data-theme') || (media.matches ? 'dark' : 'light');
  }

  function syncThemeLabel() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    themeToggle.textContent = next === 'dark' ? 'Dark' : 'Light';
    themeToggle.setAttribute('aria-label', 'Switch to ' + next + ' mode');
  }

  themeToggle.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('oss-theme', next); } catch (e) {}
    syncThemeLabel();
  });
  if (media.addEventListener) media.addEventListener('change', syncThemeLabel);
  syncThemeLabel();

  // Contents: on desktop the menu button shows/hides the sidebar (remembered
  // across pages); on phones it opens a full-screen menu (not remembered).
  var toc = document.getElementById('toc');
  var tocToggle = document.getElementById('toc-toggle');
  var current = toc.querySelector('[aria-current="page"]');
  var narrow = window.matchMedia('(max-width: 860px)');

  function scrollTocToCurrent() {
    if (current) toc.scrollTop = current.offsetTop - toc.clientHeight / 2;
  }

  function tocVisible() {
    return narrow.matches ? document.body.classList.contains('toc-open') : !root.classList.contains('toc-collapsed');
  }

  function syncTocToggle() {
    var open = tocVisible();
    tocToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    tocToggle.innerHTML = narrow.matches && open ? '&#10005;' : '&#9776;';
  }

  tocToggle.addEventListener('click', function () {
    if (narrow.matches) {
      document.body.classList.toggle('toc-open');
    } else {
      var hidden = root.classList.toggle('toc-collapsed');
      try { localStorage.setItem('oss-toc', hidden ? 'hidden' : 'shown'); } catch (e) {}
    }
    if (tocVisible()) scrollTocToCurrent();
    syncTocToggle();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('toc-open')) {
      document.body.classList.remove('toc-open');
      syncTocToggle();
    }
  });
  if (narrow.addEventListener) {
    narrow.addEventListener('change', function () {
      document.body.classList.remove('toc-open');
      syncTocToggle();
    });
  }
  syncTocToggle();
  scrollTocToCurrent();
})();

// "Last updated" in the header. publish.py writes the time into
// last-updated.js only when it publishes changes; shown in the reader's
// own time zone and date format.
(function () {
  var stamp = window.OSS_LAST_UPDATED;
  var el = document.getElementById('last-updated');
  var when = stamp ? new Date(stamp) : null;
  if (!el || !when || isNaN(when)) return;
  el.setAttribute('datetime', stamp);
  el.textContent = 'Last updated: ' + when.toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
})();

// Audiobook player (only on stories that have an mp3).
(function () {
  var player = document.getElementById('audio-player');
  if (!player) return;
  var audio = document.getElementById('audio');
  var toggle = document.getElementById('audio-toggle');
  var time = document.getElementById('audio-time');
  var volume = document.getElementById('audio-volume');

  function fmt(seconds) {
    if (!isFinite(seconds)) return '0:00';
    var s = Math.floor(seconds), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(sec).padStart(2, '0');
  }

  function sync() {
    toggle.textContent = audio.paused ? 'Play' : 'Pause';
    time.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
  }

  document.getElementById('audio-open').addEventListener('click', function () {
    player.hidden = false;
    document.body.classList.add('audio-open');
    audio.play();
  });
  toggle.addEventListener('click', function () {
    if (audio.paused) audio.play(); else audio.pause();
  });
  player.querySelectorAll('[data-skip]').forEach(function (button) {
    button.addEventListener('click', function () {
      var target = Math.max(0, audio.currentTime + Number(button.dataset.skip));
      audio.currentTime = isFinite(audio.duration) ? Math.min(target, audio.duration) : target;
    });
  });
  document.getElementById('audio-close').addEventListener('click', function () {
    audio.pause();
    player.hidden = true;
    document.body.classList.remove('audio-open');
  });
  ['play', 'pause', 'timeupdate', 'loadedmetadata', 'ended'].forEach(function (name) {
    audio.addEventListener(name, sync);
  });

  try {
    var saved = parseFloat(localStorage.getItem('oss-volume'));
    if (saved >= 0 && saved <= 1) audio.volume = saved;
  } catch (e) {}
  volume.value = audio.volume;
  volume.addEventListener('input', function () {
    audio.volume = Number(volume.value);
    try { localStorage.setItem('oss-volume', volume.value); } catch (e) {}
  });

  // iPhones ignore volume set by the page (hardware buttons only), so hide
  // the slider where setting it has no effect.
  var current = audio.volume;
  audio.volume = current === 0.5 ? 0.4 : 0.5;
  if (audio.volume === current) document.getElementById('audio-volume-label').hidden = true;
  else audio.volume = current;

  sync();
})();
