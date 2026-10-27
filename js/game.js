/* =========================================================
   game.js — محرك اللعبة
   ---------------------------------------------------------
   يقرأ STORY ويعرض المشاهد، ويدير:
   الشاشات، الحوار، الاختيارات، التلميحات، النجوم،
   الانتقالات، الحفظ المحلي، إعادة المشهد والمغامرة.
   لا يحتوي نصوص القصة — كلها في story.js
   ========================================================= */

(function () {
  "use strict";

  var SAVE_KEY = "hw-adventure-v1";
  var TRANSITION_MS = 450;
  var SITUATIONS = ["s1", "s2", "s3"]; // مواقف النجوم الثلاثة

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    app: $("app"), bg: $("bg"), cast: $("cast"), fx: $("fx"), hud: $("hud"), stars: $("stars"),
    start: $("screenStart"), select: $("screenSelect"), reward: $("screenReward"),
    dialogue: $("dialogue"), say: document.querySelector(".say"), speaker: $("speaker"), lineText: $("lineText"),
    choices: $("choices"), choiceRow: $("choiceRow"),
    btnStart: $("btnStart"), btnContinue: $("btnContinue"),
    btnNext: $("btnNext"), btnReplayLine: $("btnReplayLine"), btnRetry: $("btnRetry"),
    btnHome: $("btnHome"), btnReplayScene: $("btnReplayScene"), btnMute: $("btnMute"),
    btnAgain: $("btnAgain"), btnSwap: $("btnSwap"), swapLabel: $("swapLabel"),
    confirm: $("confirm"), btnYes: $("btnConfirmYes"), btnNo: $("btnConfirmNo"),
    curtain: $("curtain")
  };

  /* ---------- الحالة ---------- */
  var state = {
    player: null,        // "hatem" | "ward"
    sceneId: null,
    lines: [],           // جمل المشهد بعد تصفيتها حسب الشخصية
    lineIndex: -1,
    phase: "start",      // start | select | lines | choices | reward
    stars: {},           // { s1:true, ... }
    exprs: {},           // التعبير الحالي لكل شخصية ظاهرة
    busy: false,         // يمنع اللمس أثناء الانتقال
    talkTimer: null,
    bgId: null
  };

  /* ---------- الحفظ المحلي ---------- */
  function save() {
    try {
      var scene = STORY.scenes[state.sceneId];
      var resumeScene = scene && scene.back ? scene.back : state.sceneId;
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 1, player: state.player, scene: resumeScene,
        atChoices: !!(scene && scene.back) || state.phase === "choices",
        stars: state.stars
      }));
    } catch (e) { /* التخزين غير متاح: اللعبة تعمل دون حفظ */ }
  }
  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (!d || d.v !== 1 || !STORY.scenes[d.scene] || (d.player !== "hatem" && d.player !== "ward")) return null;
      return d;
    } catch (e) { return null; }
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* لا شيء */ } }

  /* ---------- أدوات ---------- */
  function show(node) { node.hidden = false; }
  function hide(node) { node.hidden = true; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function other(p) { return p === "hatem" ? "ward" : "hatem"; }

  function transition(fn) {
    if (state.busy) return Promise.resolve();
    state.busy = true;
    AUDIO.stopLine();
    AUDIO.sfx("transition");
    el.curtain.classList.add("on");
    return wait(TRANSITION_MS).then(function () {
      try { fn(); } catch (e) { console.error(e); }
      return wait(60);
    }).then(function () {
      el.curtain.classList.remove("on");
      return wait(TRANSITION_MS * 0.6);
    }).then(function () { state.busy = false; });
  }

  /* ---------- الخلفية ---------- */
  function setBackground(id) {
    if (state.bgId === id) return;
    state.bgId = id;
    var layer = document.createElement("div");
    layer.className = "bg-layer";
    layer.style.opacity = "0";
    layer.innerHTML = BACKGROUNDS.markup(id);
    el.bg.appendChild(layer);
    requestAnimationFrame(function () { layer.style.opacity = "1"; });
    var old = Array.prototype.slice.call(el.bg.children, 0, -1);
    setTimeout(function () { old.forEach(function (n) { n.remove(); }); }, 700);
  }

  /* ---------- الشخصيات ---------- */
  var REL = { ward: 0.80, hatem: 0.72, dodo: 0.46, mama: 1.0 }; // الأطوال النسبية

  function charNode(id) { return el.cast.querySelector('.char[data-id="' + id + '"]'); }

  function setCast(map, opts) {
    opts = opts || {};
    // إزالة من لم يعد في المشهد
    Array.prototype.forEach.call(el.cast.querySelectorAll(".char"), function (n) {
      if (!(n.dataset.id in map)) { n.remove(); delete state.exprs[n.dataset.id]; }
    });
    Object.keys(map).forEach(function (id) { setExpr(id, map[id], opts.entering); });
    layoutCast();
  }

  function setExpr(id, expr, entering) {
    var resolved = CHARACTERS.resolveExpr(id, expr);
    var n = charNode(id);
    if (!n) {
      n = document.createElement("div");
      n.className = "char" + (id === "mama" ? " flip" : "") + (id === state.player ? " player" : "");
      n.dataset.id = id;
      n.innerHTML = '<div class="char-body"></div>';
      n.style.setProperty("--blink", (3.8 + Math.random() * 2.4).toFixed(2) + "s");
      if (entering) n.classList.add("entering");
      el.cast.appendChild(n);
      state.exprs[id] = null;
    }
    if (state.exprs[id] !== resolved) {
      var html = CHARACTERS.markup(id, resolved);
      // لا نعيد رسم الصورة نفسها (يمنع الوميض حين تكون كل التعبيرات صورة base واحدة)
      if (n.dataset.markup !== html) {
        n.querySelector(".char-body").innerHTML = html;
        n.dataset.markup = html;
        if (state.exprs[id] !== null) {
          n.classList.remove("swap"); void n.offsetWidth; n.classList.add("swap");
        }
      }
      n.dataset.expr = resolved;
      state.exprs[id] = resolved;
    }
    setFeeling(id, CHARACTERS.feeling(id, expr) ? expr : resolved);
    n.classList.toggle("player", id === state.player);
  }

  /* فقاعة الشعور فوق الرأس (وجه من الورقة المرجعية) */
  function setFeeling(id, key) {
    var n = charNode(id);
    if (!n) return;
    var src = key ? CHARACTERS.feeling(id, key) : null;
    var b = n.querySelector(".feel");
    if (!src) { if (b) b.remove(); return; }
    if (b && b.dataset.src === src) return;
    if (!b) {
      b = document.createElement("div");
      b.className = "feel";
      b.innerHTML = '<img alt="" draggable="false">';
      n.appendChild(b);
    }
    b.dataset.src = src;
    b.querySelector("img").src = src;
    b.classList.remove("in"); void b.offsetWidth; b.classList.add("in");
  }

  function enterChars(map) {
    Object.keys(map).forEach(function (id) { setExpr(id, map[id], true); });
    layoutCast();
  }

  /* توزيع الشخصيات من اليمين لليسار حسب ترتيبها، مع ضبط الحجم ليتسع المشهد */
  function layoutCast() {
    var nodes = Array.prototype.slice.call(el.cast.querySelectorAll(".char"));
    if (!nodes.length) return;
    // ترتيب ثابت: ورد وحاتم يمينًا، ثم دودو، ثم ماما يسارًا
    var ORDER = { ward: 0, hatem: 1, dodo: 2, mama: 3 };
    nodes.sort(function (a, b) { return ORDER[a.dataset.id] - ORDER[b.dataset.id]; });

    var W = el.app.clientWidth, H = el.app.clientHeight;
    // الأرض فوق اللوحة السفلية الظاهرة (الحوار أو أزرار البداية) حتى تظهر الأقدام
    var portrait = H > W;
    var panel = !el.dialogue.hidden ? el.dialogue
      : (!el.start.hidden ? el.start.querySelector(".start-actions")
      : (!el.choices.hidden && portrait ? el.choices : null));
    var dlg = panel ? (H - panel.getBoundingClientRect().top + el.app.getBoundingClientRect().top) : (state.lastPanel || 140);
    if (panel === el.dialogue) state.lastPanel = dlg; // أثناء الاختيارات نُبقي الأرض نفسها حتى لا تقفز الشخصيات
    var floor = Math.max(60, dlg * 0.9);
    var hud = 90;
    var avail = Math.max(120, H - floor - hud);
    var base = avail * (portrait ? 0.62 : 0.86);
    var heights = nodes.map(function (n) { return base * REL[n.dataset.id]; });
    var widths = heights.map(function (h) { return h * 3 / 4; });
    var gap = -W * 0.01; // اللوحات فيها هوامش شفافة، فنقرّبها قليلًا
    var total = widths.reduce(function (a, b) { return a + b; }, 0) + gap * (nodes.length - 1);
    var maxW = W * 0.94;
    if (total > maxW) {
      var k = maxW / total;
      heights = heights.map(function (h) { return h * k; });
      widths = widths.map(function (w) { return w * k; });
      gap *= k;
      total = maxW;
    }
    var x = (W - total) / 2; // المسافة من اليمين
    nodes.forEach(function (n, i) {
      var center = x + widths[i] / 2;
      n.style.right = (center / W * 100).toFixed(2) + "%";
      n.style.height = heights[i].toFixed(1) + "px";
      n.style.setProperty("--floor", floor.toFixed(0) + "px");
      x += widths[i] + gap;
    });
  }

  function setTalking(id, ms) {
    clearTimeout(state.talkTimer);
    Array.prototype.forEach.call(el.cast.querySelectorAll(".char.talking"), function (n) { n.classList.remove("talking"); });
    if (!id) return;
    var n = charNode(id);
    if (!n) return;
    n.classList.add("talking");
    if (ms) state.talkTimer = setTimeout(function () { n.classList.remove("talking"); }, ms);
  }

  /* ---------- المؤثرات البصرية ---------- */
  var FX_SVG = {
    stars:   '<svg viewBox="0 0 24 24"><path d="m12 2 3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z" fill="#FFC93C" stroke="#E89A12" stroke-width="1"/></svg>',
    hearts:  '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="#F57FA6"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24"><path d="M12 1c1 6 5 10 11 11-6 1-10 5-11 11-1-6-5-10-11-11 6-1 10-5 11-11z" fill="#FFF3A6"/></svg>'
  };
  function burst(kind) {
    if (!FX_SVG[kind]) return;
    var count = 12;
    for (var i = 0; i < count; i++) {
      var p = document.createElement("div");
      p.className = "particle";
      p.innerHTML = FX_SVG[kind];
      p.style.left = (15 + Math.random() * 70) + "%";
      p.style.top = (35 + Math.random() * 30) + "%";
      p.style.setProperty("--s", (26 + Math.random() * 30).toFixed(0) + "px");
      p.style.setProperty("--dx", ((Math.random() - 0.5) * 160).toFixed(0) + "px");
      p.style.setProperty("--rot", ((Math.random() - 0.5) * 120).toFixed(0) + "deg");
      p.style.animationDelay = (Math.random() * 0.35).toFixed(2) + "s";
      el.fx.appendChild(p);
      (function (node) { setTimeout(function () { node.remove(); }, 2400); })(p);
    }
  }

  /* ---------- النجوم ---------- */
  var STAR_SVG = '<svg viewBox="0 0 24 24"><path d="m12 2 3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>';
  function renderStars(newKey) {
    el.stars.innerHTML = SITUATIONS.map(function (k) {
      return '<span class="star-slot' + (state.stars[k] ? " on" : "") + (k === newKey ? " new" : "") + '">' + STAR_SVG + "</span>";
    }).join("");
    var got = SITUATIONS.filter(function (k) { return state.stars[k]; }).length;
    el.stars.setAttribute("aria-label", "النجوم: " + got + " من " + SITUATIONS.length);
  }

  /* ---------- المشاهد ---------- */
  function linesFor(scene) {
    return scene.lines.filter(function (l) { return !l.for || l.for === state.player; });
  }

  function enterScene(id, opts) {
    opts = opts || {};
    var scene = STORY.scenes[id];
    if (!scene) { console.error("مشهد غير موجود:", id); return; }
    state.sceneId = id;
    state.lines = linesFor(scene);
    state.lineIndex = -1;

    hide(el.start); hide(el.select); hide(el.reward);
    show(el.hud);
    setBackground(scene.bg);
    setCast(scene.cast || {});

    var newStar = null;
    if (scene.star) {
      var key = id.split("_")[0];
      if (!state.stars[key]) { state.stars[key] = true; newStar = key; }
    }
    renderStars(newStar);

    if (opts.atChoices && scene.choices) {
      showChoices();
    } else {
      hide(el.choices);
      show(el.dialogue);
      advanceLine();
    }
    save();
  }

  function goTo(id, opts) {
    return transition(function () { enterScene(id, opts); });
  }

  /* من زر «التالي»: يُتجاهل أثناء الانتقال */
  function nextLine() {
    if (state.busy) return;
    advanceLine();
  }

  /* تقدّم داخلي (يُستدعى أيضًا عند دخول المشهد أثناء الانتقال) */
  function advanceLine() {
    AUDIO.stopLine();
    state.lineIndex++;
    if (state.lineIndex >= state.lines.length) { endOfLines(); return; }
    showLine(state.lines[state.lineIndex]);
  }

  function showLine(line) {
    state.phase = "lines";
    hide(el.choices); show(el.dialogue);
    hide(el.btnRetry); show(el.btnNext); show(el.btnReplayLine);
    el.btnNext.classList.remove("ready");

    if (line.enter) enterChars(line.enter);
    if (line.faces) Object.keys(line.faces).forEach(function (id) { if (charNode(id)) setExpr(id, line.faces[id]); });
    if (line.expr && line.who !== "narrator") setExpr(line.who, line.expr);
    if (line.fx) burst(line.fx);
    if (line.sfx) AUDIO.sfx(line.sfx);

    var who = line.who;
    el.speaker.textContent = (STORY.characters[who] || {}).name || "";
    el.speaker.dataset.who = who;
    el.lineText.textContent = line.text;
    el.lineText.classList.toggle("narr", who === "narrator");
    el.say.classList.remove("fresh"); void el.say.offsetWidth; el.say.classList.add("fresh");

    // إذا كانت الجملة الأخيرة في مشهد تلميح: زر «نجرّب مرة ثانية» بدل «التالي»
    var scene = STORY.scenes[state.sceneId];
    if (scene.back && state.lineIndex === state.lines.length - 1) {
      hide(el.btnNext); show(el.btnRetry);
    }

    speak(line);
    layoutCast();
  }

  function speak(line) {
    var who = line.who === "narrator" ? null : line.who;
    var est = Math.max(1200, Math.min(4500, line.text.length * 70));
    var hasAudio = AUDIO.hasLine(line.id) && !AUDIO.isMuted();
    setTalking(who, hasAudio ? 0 : est);
    var token = {};
    state.speakToken = token;
    var readyAfter = hasAudio ? 0 : Math.min(est, 1800);
    AUDIO.playLine(line.id).then(function (r) {
      if (state.speakToken !== token) return;
      if (r.played) setTalking(null);
      if (!r.played && hasAudio) setTalking(who, est); // الملف تعذّر: نكمل بالحركة فقط
      setTimeout(function () {
        if (state.speakToken === token) el.btnNext.classList.add("ready");
      }, r.played ? 0 : readyAfter);
    });
  }

  function endOfLines() {
    var scene = STORY.scenes[state.sceneId];
    setTalking(null);
    if (scene.choices) { showChoices(); save(); return; }
    if (scene.back) { goTo(scene.back, { atChoices: true }); return; }
    if (scene.type === "ending") { transition(showReward); return; }
    if (scene.next) { goTo(scene.next); return; }
  }

  function showChoices() {
    state.phase = "choices";
    setTalking(null);
    hide(el.dialogue);
    var scene = STORY.scenes[state.sceneId];
    // ترتيب عشوائي في كل مرة حتى لا يحفظ الطفل مكان الإجابة بدل معناها
    var list = ((scene.choices && scene.choices[state.player]) || []).slice();
    for (var j = list.length - 1; j > 0; j--) {
      var r = Math.floor(Math.random() * (j + 1)), tmp = list[j]; list[j] = list[r]; list[r] = tmp;
    }
    el.choiceRow.innerHTML = "";
    list.forEach(function (c, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "choice";
      b.dataset.next = c.next;
      b.dataset.index = String(i);
      b.innerHTML = '<span class="choice-ico" aria-hidden="true"></span><span class="choice-text"></span>';
      var ico = b.querySelector(".choice-ico");
      if (/\.(png|webp|svg|jpg)$/i.test(c.icon)) { ico.innerHTML = '<img alt="" src="' + c.icon + '">'; }
      else { ico.textContent = c.icon; }
      b.querySelector(".choice-text").textContent = c.text;
      el.choiceRow.appendChild(b);
    });
    show(el.choices);
    setExpr(state.player, "thinking"); // الطفل يفكّر وقت الاختيار
    AUDIO.sfx("pop");
    layoutCast();
    save();
  }

  function pickChoice(btn) {
    if (state.busy || state.phase !== "choices") return;
    AUDIO.sfx("tap");
    btn.classList.add("picked");
    state.phase = "picked";
    var next = btn.dataset.next;
    setTimeout(function () { goTo(next); }, 220);
  }

  /* ---------- الشاشات ---------- */
  function showStart() {
    state.phase = "start";
    hide(el.hud); hide(el.dialogue); hide(el.choices); hide(el.select); hide(el.reward);
    setBackground("meadow");
    state.player = null;
    setCast({ ward: "happy", hatem: "happy" });
    show(el.start);
    layoutCast();
    var saved = load();
    el.btnContinue.hidden = !saved;
    el.btnStart.querySelector("span:last-child").textContent = saved ? "من البداية" : "ابدأ";
  }

  function showSelect() {
    state.phase = "select";
    hide(el.start);
    setCast({});
    Array.prototype.forEach.call(document.querySelectorAll(".pick-art"), function (n) {
      n.innerHTML = CHARACTERS.markup(n.dataset.art, "happy");
    });
    Array.prototype.forEach.call(document.querySelectorAll(".pick"), function (n) { n.classList.remove("chosen"); });
    show(el.select);
  }

  function startAdventure(player) {
    state.player = player;
    state.stars = {};
    clearSave();
    goTo(STORY.start);
  }

  function showReward() {
    state.phase = "reward";
    hide(el.dialogue); hide(el.choices);
    el.swapLabel.textContent = "العب بشخصية " + STORY.characters[other(state.player)].name;
    setExpr("hatem", "cheer"); setExpr("ward", "cheer");
    layoutCast();
    show(el.reward);
    AUDIO.sfx("celebrate");
    setTimeout(function () { burst("stars"); }, 300);
    setTimeout(function () { burst("hearts"); }, 900);
    clearSave();
  }

  /* ---------- الأزرار ---------- */
  el.btnStart.addEventListener("click", function () {
    AUDIO.unlock(); AUDIO.sfx("tap");
    clearSave();
    transition(showSelect);
  });
  el.btnContinue.addEventListener("click", function () {
    AUDIO.unlock(); AUDIO.sfx("tap");
    var d = load();
    if (!d) { transition(showSelect); return; }
    state.player = d.player;
    state.stars = d.stars || {};
    goTo(d.scene, { atChoices: d.atChoices });
  });

  Array.prototype.forEach.call(document.querySelectorAll(".pick"), function (b) {
    b.addEventListener("click", function () {
      if (state.busy || state.phase !== "select") return;
      state.phase = "picking";
      AUDIO.unlock(); AUDIO.sfx("success");
      b.classList.add("chosen");
      setTimeout(function () { startAdventure(b.dataset.pick); }, 380);
    });
  });

  el.btnNext.addEventListener("click", function () { AUDIO.sfx("tap"); nextLine(); });
  el.btnRetry.addEventListener("click", function () { AUDIO.sfx("tap"); nextLine(); });
  el.btnReplayLine.addEventListener("click", function () {
    var line = state.lines[state.lineIndex];
    if (line && state.phase === "lines") speak(line);
  });

  el.choiceRow.addEventListener("click", function (e) {
    var b = e.target.closest(".choice");
    if (b) pickChoice(b);
  });

  el.btnReplayScene.addEventListener("click", function () {
    if (state.busy || !state.sceneId) return;
    AUDIO.sfx("tap");
    var scene = STORY.scenes[state.sceneId];
    // مشهد التلميح يعاد من أول الموقف نفسه
    var target = scene.back || state.sceneId;
    goTo(target);
  });

  el.btnHome.addEventListener("click", function () {
    if (state.busy) return;
    AUDIO.sfx("tap");
    show(el.confirm);
    el.btnNo.focus();
  });
  el.btnNo.addEventListener("click", function () { hide(el.confirm); });
  el.btnYes.addEventListener("click", function () {
    hide(el.confirm);
    clearSave();
    state.stars = {};
    state.sceneId = null;
    transition(showStart);
  });

  el.btnAgain.addEventListener("click", function () { AUDIO.sfx("tap"); startAdventure(state.player); });
  el.btnSwap.addEventListener("click", function () { AUDIO.sfx("tap"); startAdventure(other(state.player)); });

  function syncMute() {
    var m = AUDIO.isMuted();
    el.btnMute.setAttribute("aria-pressed", m ? "true" : "false");
    el.btnMute.setAttribute("aria-label", m ? "تشغيل الصوت" : "كتم الصوت");
  }
  el.btnMute.addEventListener("click", function () { AUDIO.setMuted(!AUDIO.isMuted()); syncMute(); });

  // لوحة المفاتيح (للتجربة على الكمبيوتر وجهاز التحكم)
  document.addEventListener("keydown", function (e) {
    if (!el.confirm.hidden || state.phase !== "lines") return;
    if (e.key === "ArrowLeft" || e.key === "PageDown") {
      e.preventDefault();
      nextLine();
    }
  });

  var resizeTimer;
  window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(layoutCast, 120); });

  // واجهة صغيرة للاختبار الآلي (لا تؤثر على اللعب)
  window.__HW = { state: state, goTo: goTo, enterScene: enterScene };

  /* تحميل الصور مسبقًا حتى لا تتأخر عند أول ظهور */
  (function preload() {
    var list = [];
    function walk(o) { Object.keys(o || {}).forEach(function (k) { var v = o[k]; if (typeof v === "string") list.push(v); else if (v && typeof v === "object") walk(v); }); }
    walk(window.ASSETS);
    list.forEach(function (src) { var i = new Image(); i.src = src; });
  })();

  syncMute();
  renderStars();
  showStart();
})();
