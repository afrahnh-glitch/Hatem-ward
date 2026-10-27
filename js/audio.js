/* =========================================================
   audio.js — مدير الصوت
   ---------------------------------------------------------
   - يشغّل جمل الحوار بمعرّفها: تسجيل محفوظ على الجهاز (RECORDINGS)
     أولًا، ثم AUDIO_MANIFEST.lines
   - الجملة بلا ملف، أو الملف المعطوب، أو الصوت المكتوم:
     تُتجاوز بهدوء ويبقى النص ظاهرًا. الصوت لا يوقف القصة أبدًا.
   - المؤثرات: ملف من AUDIO_MANIFEST.effects إن وُجد،
     وإلا نغمة بسيطة مولّدة داخل المتصفح (لا تحتاج ملفات).
   ========================================================= */

(function () {
  "use strict";

  var M = window.AUDIO_MANIFEST || { lines: {}, effects: {}, music: null };
  var ctx = null, current = null, music = null, muted = false;
  var LINE_TIMEOUT = 20000; // أقصى مدة لجملة واحدة، احتياطًا إن لم يصل حدث النهاية

  try { muted = localStorage.getItem("hw-muted") === "1"; } catch (e) { /* التخزين غير متاح */ }

  function getCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; }
    return ctx;
  }

  /* الآيباد يتطلب لمسة قبل أي صوت: تُستدعى من زر «ابدأ» */
  function unlock() {
    var c = getCtx();
    if (c && c.state === "suspended") { c.resume().catch(function () {}); }
    if (c) {
      try {
        var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
        s.buffer = b; s.connect(c.destination); s.start(0);
      } catch (e) { /* لا شيء */ }
    }
    startMusic();
  }

  function stopLine() {
    if (current) {
      try { current.audio.pause(); } catch (e) { /* لا شيء */ }
      current.finish();
      current = null;
    }
  }

  /* يعيد Promise يُحل عند انتهاء الجملة أو تعذّر تشغيلها: { played: true|false } */
  function playLine(id) {
    stopLine();
    var src = sourceFor(id);
    if (!src || muted) return Promise.resolve({ played: false });

    return new Promise(function (resolve) {
      var done = false, timer = null, a;
      function finish(played) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (current && current.audio === a) current = null;
        resolve({ played: !!played });
      }
      try { a = new Audio(src); } catch (e) { finish(false); return; }
      current = { audio: a, finish: function () { finish(false); } };
      a.onended = function () { finish(true); };
      a.onerror = function () { finish(false); };
      timer = setTimeout(function () { finish(false); }, LINE_TIMEOUT);
      var p = a.play();
      if (p && p.catch) p.catch(function () { finish(false); });
    });
  }

  /* المصدر: تسجيل محفوظ على الجهاز أولًا، ثم ملف من manifest.js */
  function sourceFor(id) {
    var rec = window.RECORDINGS && RECORDINGS.urlFor(id);
    return rec || (M.lines && M.lines[id]) || null;
  }
  function hasLine(id) { return !!sourceFor(id); }

  /* تشغيل مصدر مباشر (للاستوديو) */
  function playSrc(src) {
    stopLine();
    return new Promise(function (resolve) {
      var a, done = false;
      function finish(ok) { if (done) return; done = true; if (current && current.audio === a) current = null; resolve(!!ok); }
      try { a = new Audio(src); } catch (e) { finish(false); return; }
      current = { audio: a, finish: function () { finish(false); } };
      a.onended = function () { finish(true); };
      a.onerror = function () { finish(false); };
      var p = a.play(); if (p && p.catch) p.catch(function () { finish(false); });
    });
  }

  /* ---------- المؤثرات ---------- */
  function tone(freq, start, dur, type, gain, toFreq) {
    var c = getCtx(); if (!c) return;
    var t = c.currentTime + start;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }

  var SYNTH = {
    tap:        function () { tone(700, 0, 0.09, "sine", 0.12); },
    pop:        function () { tone(420, 0, 0.16, "sine", 0.16, 980); },
    transition: function () { tone(320, 0, 0.35, "sine", 0.06, 620); },
    success:    function () { [523, 659, 784].forEach(function (f, i) { tone(f, i * 0.11, 0.22, "triangle", 0.16); }); },
    hint:       function () { tone(587, 0, 0.22, "sine", 0.1); tone(494, 0.18, 0.3, "sine", 0.1); },
    celebrate:  function () {
      [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.12, 0.3, "triangle", 0.15); });
      [1568, 2093, 1760].forEach(function (f, i) { tone(f, 0.55 + i * 0.08, 0.15, "sine", 0.06); });
    }
  };

  function sfx(name) {
    if (muted || !name) return;
    var src = M.effects && M.effects[name];
    try {
      if (src) {
        var a = new Audio(src); a.volume = 0.7;
        var p = a.play(); if (p && p.catch) p.catch(function () {});
        return;
      }
      var c = getCtx();
      if (c && c.state === "suspended") c.resume().catch(function () {});
      if (SYNTH[name]) SYNTH[name]();
    } catch (e) { /* المؤثر اختياري */ }
  }

  /* ---------- الموسيقى الخلفية (اختيارية) ---------- */
  function startMusic() {
    if (!M.music || muted) return;
    try {
      if (!music) { music = new Audio(M.music); music.loop = true; music.volume = 0.18; }
      var p = music.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) { /* لا شيء */ }
  }
  function stopMusic() { if (music) { try { music.pause(); } catch (e) { /* لا شيء */ } } }

  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem("hw-muted", muted ? "1" : "0"); } catch (e) { /* لا شيء */ }
    if (muted) { stopLine(); stopMusic(); } else { startMusic(); }
  }

  /* عند إخفاء التطبيق (قفل الآيباد مثلًا) نوقف الصوت حتى لا يتعلّق */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { stopLine(); stopMusic(); }
    else if (!muted) { startMusic(); }
  });

  window.AUDIO = {
    unlock: unlock, playLine: playLine, playSrc: playSrc, stopLine: stopLine, hasLine: hasLine, sfx: sfx,
    isMuted: function () { return muted; }, setMuted: setMuted
  };
})();
