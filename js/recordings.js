/* =========================================================
   recordings.js — تسجيلات العائلة المحفوظة على الجهاز
   ---------------------------------------------------------
   تُحفظ في IndexedDB داخل المتصفح (على هذا الجهاز فقط).
   اللعبة تفضّل التسجيل المحفوظ هنا، ثم ملف manifest.js،
   ثم النص وحده.
   - تصدير: ملف zip واحد فيه كل التسجيلات بأسماء المعرّفات.
   - استيراد: إرجاع ملف zip صدّرته اللعبة نفسها.
   ========================================================= */

(function () {
  "use strict";

  var DB_NAME = "hatem-ward", STORE = "lines", VERSION = 1;
  var urls = {};       // id -> object URL
  var meta = {};       // id -> { type, at, dur, size }
  var listeners = [];
  var dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error("no-idb")); return; }
      var req;
      try { req = indexedDB.open(DB_NAME, VERSION); } catch (e) { reject(e); return; }
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbPromise;
  }

  function tx(mode, fn) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(STORE, mode);
        var store = t.objectStore(STORE);
        var out = fn(store);
        t.oncomplete = function () { resolve(out && out.result !== undefined ? out.result : out); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }

  function emit() { listeners.forEach(function (fn) { try { fn(); } catch (e) { /* لا شيء */ } }); }

  function setLocal(rec) {
    if (urls[rec.id]) URL.revokeObjectURL(urls[rec.id]);
    urls[rec.id] = URL.createObjectURL(rec.blob);
    meta[rec.id] = { type: rec.type, at: rec.at, dur: rec.dur || 0, size: rec.blob.size };
  }

  /* تحميل كل التسجيلات عند فتح اللعبة */
  var ready = tx("readonly", function (store) { return store.getAll(); })
    .then(function (all) { (all || []).forEach(function (r) { if (r && r.blob) setLocal(r); }); emit(); })
    .catch(function () { /* التخزين غير متاح: اللعبة تعمل بدون تسجيلات محلية */ });

  function save(id, blob, dur) {
    var rec = { id: id, blob: blob, type: blob.type || "audio/mp4", at: Date.now(), dur: dur || 0 };
    return tx("readwrite", function (store) { store.put(rec); }).then(function () {
      setLocal(rec);
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* لا شيء */ }
      emit();
    });
  }

  function remove(id) {
    return tx("readwrite", function (store) { store.delete(id); }).then(function () {
      if (urls[id]) URL.revokeObjectURL(urls[id]);
      delete urls[id]; delete meta[id];
      emit();
    });
  }

  function getAll() { return tx("readonly", function (store) { return store.getAll(); }); }

  /* ---------- ZIP (بلا ضغط — الصوت مضغوط أصلًا) ---------- */
  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

  function extFor(type) {
    type = (type || "").toLowerCase();
    if (type.indexOf("mp4") >= 0 || type.indexOf("aac") >= 0 || type.indexOf("m4a") >= 0) return "m4a";
    if (type.indexOf("webm") >= 0) return "webm";
    if (type.indexOf("ogg") >= 0) return "ogg";
    if (type.indexOf("wav") >= 0) return "wav";
    if (type.indexOf("mpeg") >= 0) return "mp3";
    return "audio";
  }
  var TYPE_FOR = { m4a: "audio/mp4", webm: "audio/webm", ogg: "audio/ogg", wav: "audio/wav", mp3: "audio/mpeg" };

  function buildZip(files) { // files: [{name, data:Uint8Array}]
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    var d = new Date(), dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
        dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, dosTime, true); h.setUint16(12, dosDate, true); h.setUint32(14, crc, true);
      h.setUint32(18, size, true); h.setUint32(22, size, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, f.data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(10, 0, true); c.setUint16(12, dosTime, true); c.setUint16(14, dosDate, true); c.setUint32(16, crc, true);
      c.setUint32(20, size, true); c.setUint32(24, size, true); c.setUint16(28, name.length, true);
      c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + size;
    });
    var cSize = central.reduce(function (a, p) { return a + p.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cSize, true); e.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: "application/zip" });
  }

  function readZip(buf) { // يقرأ ملفات zip غير المضغوطة (التي تصدّرها اللعبة)
    var u8 = new Uint8Array(buf), dv = new DataView(buf), out = [], dec = new TextDecoder();
    var eocd = -1;
    for (var i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) throw new Error("not-zip");
    var count = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true);
    for (var n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error("bad-zip");
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      var nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      var local = dv.getUint32(p + 42, true), name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      var lnlen = dv.getUint16(local + 26, true), lxlen = dv.getUint16(local + 28, true);
      var start = local + 30 + lnlen + lxlen;
      if (method === 0) out.push({ name: name, data: u8.slice(start, start + csize) });
      p += 46 + nlen + xlen + clen;
    }
    return out;
  }

  function exportZip() {
    return getAll().then(function (all) {
      all = (all || []).filter(function (r) { return r && r.blob; });
      return Promise.all(all.map(function (r) {
        return r.blob.arrayBuffer().then(function (ab) { return { name: "lines/" + r.id + "." + extFor(r.type), data: new Uint8Array(ab) }; });
      })).then(function (files) {
        var list = {};
        all.forEach(function (r) { list[r.id] = { file: "lines/" + r.id + "." + extFor(r.type), type: r.type, dur: r.dur, at: new Date(r.at).toISOString() }; });
        files.push({ name: "recordings.json", data: new TextEncoder().encode(JSON.stringify(list, null, 2)) });
        return { blob: buildZip(files), count: all.length };
      });
    });
  }

  function importZip(file) {
    return file.arrayBuffer().then(function (buf) {
      var entries = readZip(buf), jobs = [];
      entries.forEach(function (e) {
        var m = /^lines\/([A-Za-z0-9_]+)\.([a-z0-9]+)$/.exec(e.name);
        if (!m) return;
        jobs.push(save(m[1], new Blob([e.data], { type: TYPE_FOR[m[2]] || "audio/mp4" }), 0));
      });
      return Promise.all(jobs).then(function () { return jobs.length; });
    });
  }

  window.RECORDINGS = {
    ready: ready,
    urlFor: function (id) { return urls[id] || null; },
    has: function (id) { return !!urls[id]; },
    info: function (id) { return meta[id] || null; },
    count: function () { return Object.keys(urls).length; },
    save: save,
    remove: remove,
    exportZip: exportZip,
    importZip: importZip,
    onChange: function (fn) { listeners.push(fn); }
  };
})();
