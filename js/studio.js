/* =========================================================
   studio.js — استوديو التسجيل (للكبار)
   ---------------------------------------------------------
   يُفتح بضغطة مطوّلة على زر الميكروفون في شاشة البداية،
   حتى لا يفتحه الأطفال صدفة.
   لكل جملة: تسجيل، استماع، إعادة، حذف.
   التسجيلات تُحفظ على الجهاز (recordings.js) وتعمل في اللعبة فورًا.
   ========================================================= */

(function () {
  "use strict";

  var MAX_SEC = 20;
  var WHO = [
    { k: "all", name: "الكل" },
    { k: "narrator", name: "الراوية" },
    { k: "hatem", name: "حاتم" },
    { k: "ward", name: "ورد" },
    { k: "dodo", name: "دودو" },
    { k: "mama", name: "ماما دودو" }
  ];
  var TONE = { happy: "فرحان", laugh: "يضحك", proud: "بفخر", cheer: "بحماس", sad: "حزين", upset: "زعلان",
               surprised: "مستغرب", scared: "خايف", cry: "يبكي", thinking: "يفكّر", worried: "قلقانة" };
  var SCENE = { intro: "الافتتاحية", s1: "الموقف ١: الزحليقة", s2: "الموقف ٢: الحجر اللامع",
                s3: "الموقف ٣: جسر النهر", ending: "النهاية" };

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    open: $("btnStudio"), panel: $("studio"), close: $("studioClose"), who: $("studioWho"),
    list: $("studioList"), count: $("studioCount"), fill: $("studioFill"), note: $("studioNote"),
    exp: $("studioExport"), imp: $("studioImport"), impFile: $("studioImportFile"), toast: $("studioToast"),
    onlyMissing: $("studioMissing")
  };

  /* كل الجمل بترتيب القصة */
  var LINES = [];
  Object.keys(STORY.scenes).forEach(function (sid) {
    var sc = STORY.scenes[sid], base = sid.split("_")[0];
    var where = (SCENE[base] || sid) + (sid.indexOf("_good") > 0 ? " · بعد الاختيار الموفّق" : sid.indexOf("_hint") > 0 ? " · تلميح" : "");
    sc.lines.forEach(function (l) {
      var tone = l.who === "narrator" ? "هادئ ودافئ" : l.who === "mama" ? "حنون" : (TONE[l.expr] || "");
      LINES.push({ id: l.id, who: l.who, text: l.text, where: where, tone: tone,
                   only: l.for ? STORY.characters[l.for].name : "" });
    });
  });

  var current = "all", onlyMissing = false;
  var rec = null;       // التسجيل الجاري { id, mr, chunks, t0, timer, raf }
  var stream = null, actx = null, analyser = null;
  var armedDelete = null;
  var canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

  /* ---------- الفتح بضغطة مطوّلة ---------- */
  var holdTimer = null;
  function holdStart(e) {
    e.preventDefault();
    el.open.classList.add("holding");
    holdTimer = setTimeout(function () { el.open.classList.remove("holding"); openStudio(); }, 800);
  }
  function holdEnd() {
    if (holdTimer) {
      clearTimeout(holdTimer); holdTimer = null;
      if (el.open.classList.contains("holding")) toast("اضغطي مطوّلًا لفتح استوديو التسجيل");
    }
    el.open.classList.remove("holding");
  }
  el.open.addEventListener("pointerdown", holdStart);
  ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { el.open.addEventListener(ev, holdEnd); });
  el.open.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openStudio(); } });
  el.open.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  function openStudio() {
    AUDIO.stopLine();
    el.panel.hidden = false;
    el.note.hidden = canRecord;
    el.toast.hidden = true;
    render();
  }
  function closeStudio() {
    stopRecording(true);
    AUDIO.stopLine();
    releaseMic();
    el.panel.hidden = true;
  }
  el.close.addEventListener("click", closeStudio);

  /* ---------- الميكروفون ---------- */
  function getMic() {
    if (stream) return Promise.resolve(stream);
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    }).then(function (s) {
      stream = s;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        actx = new AC();
        analyser = actx.createAnalyser(); analyser.fftSize = 512;
        actx.createMediaStreamSource(s).connect(analyser);
      } catch (e) { analyser = null; }
      return s;
    });
  }
  function releaseMic() {
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    if (actx) { try { actx.close(); } catch (e) { /* لا شيء */ } actx = null; analyser = null; }
  }
  function pickMime() {
    var opts = ["audio/mp4", "audio/mp4;codecs=mp4a.40.2", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
    for (var i = 0; i < opts.length; i++) { try { if (MediaRecorder.isTypeSupported(opts[i])) return opts[i]; } catch (e) { /* لا شيء */ } }
    return "";
  }

  function startRecording(id) {
    if (rec) { stopRecording(); return; }
    AUDIO.stopLine();
    getMic().then(function (s) {
      var mime = pickMime(), mr;
      try { mr = mime ? new MediaRecorder(s, { mimeType: mime }) : new MediaRecorder(s); }
      catch (e) { mr = new MediaRecorder(s); }
      rec = { id: id, mr: mr, chunks: [], t0: Date.now(), cancelled: false };
      mr.ondataavailable = function (e) { if (e.data && e.data.size) rec.chunks.push(e.data); };
      mr.onstop = function () {
        var r = rec; rec = null;
        cancelAnimationFrame(r.raf); clearInterval(r.timer);
        if (r.cancelled || !r.chunks.length) { render(); return; }
        var blob = new Blob(r.chunks, { type: (r.mr.mimeType || r.chunks[0].type || "audio/mp4").split(";")[0] });
        var dur = (Date.now() - r.t0) / 1000;
        if (dur < 0.6) { toast("التسجيل قصير جدًا. اضغطي ثم تكلّمي، ثم اضغطي إيقاف."); render(); return; }
        RECORDINGS.save(r.id, blob, dur).then(function () {
          render();
          AUDIO.playSrc(RECORDINGS.urlFor(r.id));
        }).catch(function () { toast("ما قدرت أحفظ التسجيل على الجهاز. تأكدي أن المتصفح ليس في وضع التصفح الخاص."); render(); });
      };
      mr.start();
      render();
      rec.timer = setInterval(tick, 200);
      meter();
    }).catch(function () {
      toast("الميكروفون غير مسموح. من إعدادات Safari اسمحي للموقع باستخدام الميكروفون، ثم أعيدي المحاولة.");
    });
  }
  function stopRecording(cancel) {
    if (!rec) return;
    rec.cancelled = !!cancel;
    try { rec.mr.stop(); } catch (e) { rec = null; }
  }
  function tick() {
    if (!rec) return;
    var s = (Date.now() - rec.t0) / 1000;
    var t = el.list.querySelector('[data-id="' + rec.id + '"] .rec-time');
    if (t) t.textContent = s.toFixed(1) + " ث";
    if (s >= MAX_SEC) stopRecording();
  }
  function meter() {
    if (!rec) return;
    var bar = el.list.querySelector('[data-id="' + rec.id + '"] .rec-level i');
    if (bar && analyser) {
      var d = new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(d);
      var peak = 0; for (var i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i] - 128));
      bar.style.width = Math.min(100, peak / 128 * 160).toFixed(0) + "%";
    }
    rec.raf = requestAnimationFrame(meter);
  }

  /* ---------- العرض ---------- */
  function renderChips() {
    el.who.innerHTML = "";
    WHO.forEach(function (w) {
      var items = LINES.filter(function (l) { return w.k === "all" || l.who === w.k; });
      var got = items.filter(function (l) { return RECORDINGS.has(l.id); }).length;
      var b = document.createElement("button");
      b.type = "button"; b.className = "st-chip"; b.dataset.who = w.k;
      b.setAttribute("aria-pressed", String(w.k === current));
      b.innerHTML = "<span></span><span class=\"n\"></span>";
      b.firstChild.textContent = w.name;
      b.lastChild.textContent = got + "/" + items.length;
      b.addEventListener("click", function () { if (rec) return; current = w.k; render(); el.list.scrollTop = 0; });
      el.who.appendChild(b);
    });
  }

  function render() {
    renderChips();
    var items = LINES.filter(function (l) { return current === "all" || l.who === current; });
    var got = items.filter(function (l) { return RECORDINGS.has(l.id); }).length;
    el.count.textContent = "سُجّل " + got + " من " + items.length;
    el.fill.style.width = (items.length ? got / items.length * 100 : 0) + "%";
    el.exp.disabled = RECORDINGS.count() === 0;

    var frag = document.createDocumentFragment(), last = null, shown = 0;
    items.forEach(function (l) {
      var has = RECORDINGS.has(l.id), isRec = rec && rec.id === l.id;
      if (onlyMissing && has && !isRec) return;
      if (l.where !== last) {
        var h = document.createElement("div"); h.className = "st-scene"; h.textContent = l.where; frag.appendChild(h); last = l.where;
      }
      shown++;
      var c = document.createElement("article");
      c.className = "st-card" + (has ? " has" : "") + (isRec ? " recording" : "");
      c.dataset.id = l.id; c.dataset.who = l.who;
      c.innerHTML =
        '<div class="st-meta"><span class="st-speaker"></span><span class="st-tone"></span><span class="st-only"></span><code class="st-id"></code></div>' +
        '<p class="st-text"></p>' +
        '<div class="st-actions"></div>';
      c.querySelector(".st-speaker").textContent = STORY.characters[l.who].name;
      var tone = c.querySelector(".st-tone"); if (l.tone) tone.textContent = "بصوت " + l.tone; else tone.remove();
      var only = c.querySelector(".st-only"); if (l.only) only.textContent = "مسار " + l.only + " فقط"; else only.remove();
      c.querySelector(".st-id").textContent = l.id;
      c.querySelector(".st-text").textContent = l.text;
      var act = c.querySelector(".st-actions");

      if (isRec) {
        act.innerHTML = '<button type="button" class="st-btn stop" data-act="stop"><span class="dot"></span>إيقاف</button>' +
          '<span class="rec-time">0.0 ث</span><span class="rec-level"><i></i></span>' +
          '<button type="button" class="st-btn ghost" data-act="cancel">إلغاء</button>';
      } else if (has) {
        var inf = RECORDINGS.info(l.id) || {};
        act.innerHTML = '<button type="button" class="st-btn play" data-act="play">▶ استمعي</button>' +
          '<button type="button" class="st-btn ghost" data-act="rec">🎙 أعيدي</button>' +
          '<button type="button" class="st-btn ghost del" data-act="del"></button>' +
          (inf.dur ? '<span class="st-dur"></span>' : "");
        var del = act.querySelector(".del");
        del.textContent = armedDelete === l.id ? "تأكيد الحذف" : "حذف";
        if (armedDelete === l.id) del.classList.add("armed");
        if (inf.dur) act.querySelector(".st-dur").textContent = inf.dur.toFixed(1) + " ث";
      } else {
        act.innerHTML = '<button type="button" class="st-btn rec" data-act="rec"' + (canRecord ? "" : " disabled") + '><span class="dot"></span>سجّلي</button>';
      }
      frag.appendChild(c);
    });
    if (!shown) {
      var e = document.createElement("p"); e.className = "st-empty";
      e.textContent = "كل الجمل هنا مسجّلة. 👏";
      frag.appendChild(e);
    }
    el.list.innerHTML = "";
    el.list.appendChild(frag);
    var on = el.who.querySelector('[aria-pressed="true"]');
    if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  el.list.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b) return;
    var id = b.closest(".st-card").dataset.id, act = b.dataset.act;
    if (act !== "del") armedDelete = null;
    if (act === "rec") startRecording(id);
    else if (act === "stop") stopRecording();
    else if (act === "cancel") stopRecording(true);
    else if (act === "play") AUDIO.playSrc(RECORDINGS.urlFor(id));
    else if (act === "del") {
      if (armedDelete === id) { armedDelete = null; RECORDINGS.remove(id).then(render); }
      else { armedDelete = id; render(); }
    }
  });

  el.onlyMissing.addEventListener("change", function () { onlyMissing = el.onlyMissing.checked; render(); });

  /* ---------- تصدير واستيراد ---------- */
  el.exp.addEventListener("click", function () {
    el.exp.disabled = true;
    RECORDINGS.exportZip().then(function (r) {
      var d = new Date(), stamp = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      var a = document.createElement("a");
      a.href = URL.createObjectURL(r.blob);
      a.download = "تسجيلات-حاتم-وورد-" + stamp + ".zip";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      toast("تم تجهيز ملف فيه " + r.count + " تسجيل. تجدينه في التنزيلات، أرسليه في المحادثة.");
    }).catch(function () { toast("تعذّر تجهيز الملف."); })
      .then(function () { el.exp.disabled = RECORDINGS.count() === 0; });
  });
  el.imp.addEventListener("click", function () { el.impFile.click(); });
  el.impFile.addEventListener("change", function () {
    var f = el.impFile.files && el.impFile.files[0]; if (!f) return;
    RECORDINGS.importZip(f).then(function (n) { toast("تمت إضافة " + n + " تسجيل."); render(); })
      .catch(function () { toast("هذا الملف ليس ملف تسجيلات صدّرته اللعبة."); })
      .then(function () { el.impFile.value = ""; });
  });

  /* ---------- رسالة قصيرة ---------- */
  var toastTimer = null;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.hidden = true; }, 4200);
  }

  document.addEventListener("visibilitychange", function () { if (document.hidden) stopRecording(); });
  RECORDINGS.onChange(function () { if (!el.panel.hidden && !rec) render(); });

  window.STUDIO = { open: openStudio, close: closeStudio };
})();
