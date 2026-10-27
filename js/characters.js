/* =========================================================
   characters.js — عرض الشخصيات
   ---------------------------------------------------------
   إذا وُجد مسار صورة في assets/assets.js تُستخدم الصورة.
   وإلا يُرسم بديل مؤقت (SVG) بنفس الأبعاد 2:3 ونفس التعبيرات،
   فيتطابق مكان الشخصية وحجمها قبل الاستبدال وبعده.
   ========================================================= */

(function () {
  "use strict";

  /* ارتفاع كل شخصية كنسبة من ارتفاع المشهد (ورد أطول من حاتم قليلًا) */
  var SIZE = { ward: 0.50, hatem: 0.45, dodo: 0.30, mama: 0.66 };

  /* تحويل التعبيرات غير الموجودة لأقرب تعبير متوفر */
  var FALLBACK_EXPR = {
    dodo: { surprised: "happy", proud: "happy", cheer: "happy", laugh: "happy", thinking: "happy", upset: "sad", scared: "sad", cry: "sad" },
    mama: { sad: "worried", surprised: "happy", proud: "happy", cheer: "happy", laugh: "happy", thinking: "happy", upset: "worried", scared: "worried", cry: "worried" }
  };
  /* الرسم المؤقت لحاتم وورد يعرف 5 تعابير؛ الباقي يُحوَّل لأقربها */
  var SVG_EXPR = { cheer: "proud", laugh: "happy", thinking: "surprised", scared: "sad", cry: "sad" };

  var uid = 0;

  function resolveExpr(id, expr) {
    var set = (window.ASSETS && ASSETS.characters[id]) || {};
    if (expr in set && expr !== "base") return expr;
    var fb = FALLBACK_EXPR[id] && FALLBACK_EXPR[id][expr];
    if (fb) return fb;
    return Object.keys(set).filter(function (k) { return k !== "base"; })[0] || "happy";
  }

  /* ---------- الوجه المشترك للأطفال ---------- */
  function face(expr, cx, cy, s) {
    // cx,cy مركز الوجه، s مقياس
    function X(v) { return (cx + v * s).toFixed(1); }
    function Y(v) { return (cy + v * s).toFixed(1); }
    var ink = "#2B1B14", out = "";
    var eyeL = -22, eyeR = 22, eyeY = 0;
    var open = function (rx, ry) {
      return '<g class="eyes" style="transform-origin:' + X(0) + "px " + Y(eyeY) + 'px">' +
        '<ellipse cx="' + X(eyeL) + '" cy="' + Y(eyeY) + '" rx="' + (rx * s) + '" ry="' + (ry * s) + '" fill="' + ink + '"/>' +
        '<ellipse cx="' + X(eyeR) + '" cy="' + Y(eyeY) + '" rx="' + (rx * s) + '" ry="' + (ry * s) + '" fill="' + ink + '"/>' +
        '<circle cx="' + X(eyeL + 2.6) + '" cy="' + Y(eyeY - 3.4) + '" r="' + (2.8 * s) + '" fill="#fff"/>' +
        '<circle cx="' + X(eyeR + 2.6) + '" cy="' + Y(eyeY - 3.4) + '" r="' + (2.8 * s) + '" fill="#fff"/>' +
        '<circle cx="' + X(eyeL - 2) + '" cy="' + Y(eyeY + 3) + '" r="' + (1.3 * s) + '" fill="#fff" opacity=".7"/>' +
        '<circle cx="' + X(eyeR - 2) + '" cy="' + Y(eyeY + 3) + '" r="' + (1.3 * s) + '" fill="#fff" opacity=".7"/>' +
        "</g>";
    };
    var stroke = 'fill="none" stroke="' + ink + '" stroke-width="' + (3.4 * s) + '" stroke-linecap="round"';
    var cheeks = function (op) {
      return '<ellipse cx="' + X(-32) + '" cy="' + Y(17) + '" rx="' + (9 * s) + '" ry="' + (5.5 * s) + '" fill="#F28B8B" opacity="' + op + '"/>' +
             '<ellipse cx="' + X(32) + '" cy="' + Y(17) + '" rx="' + (9 * s) + '" ry="' + (5.5 * s) + '" fill="#F28B8B" opacity="' + op + '"/>';
    };

    switch (expr) {
      case "sad":
      case "worried":
      case "scared":
        out += cheeks(0.3) + open(6.5, 8.5);
        out += '<path d="M' + X(-32) + " " + Y(-12) + " L" + X(-14) + " " + Y(-19) + '" ' + stroke + "/>";
        out += '<path d="M' + X(14) + " " + Y(-19) + " L" + X(32) + " " + Y(-12) + '" ' + stroke + "/>";
        out += '<path d="M' + X(-12) + " " + Y(31) + " Q" + X(0) + " " + Y(20) + " " + X(12) + " " + Y(31) + '" ' + stroke + "/>";
        out += '<path class="tear" d="M' + X(-27) + " " + Y(10) + " q" + (-4 * s) + " " + (8 * s) + " 0 " + (11 * s) + " q" + (4 * s) + " " + (-3 * s) + " 0 " + (-11 * s) + 'z" fill="#7CC4F2"/>';
        break;
      case "upset":
        out += cheeks(0.7) + open(6.5, 8);
        out += '<path d="M' + X(-32) + " " + Y(-19) + " L" + X(-13) + " " + Y(-12) + '" ' + stroke + "/>";
        out += '<path d="M' + X(13) + " " + Y(-12) + " L" + X(32) + " " + Y(-19) + '" ' + stroke + "/>";
        out += '<path d="M' + X(-10) + " " + Y(28) + " Q" + X(0) + " " + Y(22) + " " + X(10) + " " + Y(28) + '" ' + stroke + "/>";
        break;
      case "surprised":
        out += cheeks(0.35) + open(8, 11);
        out += '<path d="M' + X(-32) + " " + Y(-20) + " Q" + X(-22) + " " + Y(-28) + " " + X(-12) + " " + Y(-21) + '" ' + stroke + "/>";
        out += '<path d="M' + X(12) + " " + Y(-21) + " Q" + X(22) + " " + Y(-28) + " " + X(32) + " " + Y(-20) + '" ' + stroke + "/>";
        out += '<ellipse cx="' + X(0) + '" cy="' + Y(28) + '" rx="' + (7 * s) + '" ry="' + (9 * s) + '" fill="#8C3B3B"/>';
        break;
      case "proud":
        out += cheeks(0.55);
        out += '<path d="M' + X(-30) + " " + Y(2) + " Q" + X(-22) + " " + Y(-7) + " " + X(-14) + " " + Y(2) + '" ' + stroke + "/>";
        out += '<path d="M' + X(14) + " " + Y(2) + " Q" + X(22) + " " + Y(-7) + " " + X(30) + " " + Y(2) + '" ' + stroke + "/>";
        out += '<path d="M' + X(-15) + " " + Y(21) + " Q" + X(0) + " " + Y(36) + " " + X(15) + " " + Y(21) + '" ' + stroke + "/>";
        break;
      default: /* happy */
        out += cheeks(0.5) + open(7, 9);
        out += '<path d="M' + X(-15) + " " + Y(20) + " Q" + X(0) + " " + Y(40) + " " + X(15) + " " + Y(20) + ' Z" fill="#8C3B3B"/>';
        out += '<path d="M' + X(-7) + " " + Y(30) + " Q" + X(0) + " " + Y(26) + " " + X(7) + " " + Y(30) + " Q" + X(0) + " " + Y(36) + " " + X(-7) + " " + Y(30) + 'Z" fill="#E77C7C"/>';
    }
    return out;
  }

  function skinDefs(p) {
    return '<radialGradient id="' + p + 'skin" cx=".38" cy=".32" r=".75">' +
             '<stop offset="0" stop-color="#FFE3C6"/><stop offset=".65" stop-color="#F4C49A"/><stop offset="1" stop-color="#DE9F70"/></radialGradient>' +
           '<radialGradient id="' + p + 'shine" cx=".35" cy=".25" r=".6">' +
             '<stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>';
  }

  /* ---------- حاتم ---------- */
  function hatem(expr) {
    var p = "h" + (++uid) + "_";
    return '<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' + skinDefs(p) +
      '<linearGradient id="' + p + 'shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6CC3F5"/><stop offset="1" stop-color="#2E80C4"/></linearGradient>' +
      '<linearGradient id="' + p + 'hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A4632"/><stop offset="1" stop-color="#3E271B"/></linearGradient></defs>' +
      '<ellipse cx="100" cy="292" rx="50" ry="7" fill="#1F3B2A" opacity=".18"/>' +
      // الساقان والحذاء
      '<rect x="78" y="236" width="18" height="46" rx="8" fill="url(#' + p + 'skin)"/>' +
      '<rect x="104" y="236" width="18" height="46" rx="8" fill="url(#' + p + 'skin)"/>' +
      '<ellipse cx="84" cy="286" rx="17" ry="9" fill="#F7F7F2" stroke="#9AB" stroke-width="2"/>' +
      '<ellipse cx="116" cy="286" rx="17" ry="9" fill="#F7F7F2" stroke="#9AB" stroke-width="2"/>' +
      // الشورت
      '<path d="M66 214 h68 l4 30 h-30 l-8 -12 l-8 12 h-30z" fill="#35577F"/>' +
      // الذراعان
      '<g class="arm arm-l" style="transform-origin:66px 152px"><path d="M66 152 L54 182 L50 210" stroke="url(#' + p + 'skin)" stroke-width="17" stroke-linecap="round" fill="none"/><path d="M66 152 L57 176" stroke="#3C91D2" stroke-width="22" stroke-linecap="round"/><circle cx="50" cy="212" r="10" fill="url(#' + p + 'skin)"/></g>' +
      '<g class="arm arm-r" style="transform-origin:134px 152px"><path d="M134 152 L146 182 L150 210" stroke="url(#' + p + 'skin)" stroke-width="17" stroke-linecap="round" fill="none"/><path d="M134 152 L143 176" stroke="#3C91D2" stroke-width="22" stroke-linecap="round"/><circle cx="150" cy="212" r="10" fill="url(#' + p + 'skin)"/></g>' +
      // القميص
      '<rect x="60" y="140" width="80" height="84" rx="30" fill="url(#' + p + 'shirt)"/>' +
      '<rect x="60" y="140" width="80" height="84" rx="30" fill="url(#' + p + 'shine)"/>' +
      // ديناصور صغير على القميص
      '<g transform="translate(88 172)"><ellipse cx="12" cy="12" rx="12" ry="9" fill="#8EDB7E"/><circle cx="22" cy="5" r="6" fill="#8EDB7E"/><path d="M2 10 l-6 -4 l2 7z" fill="#8EDB7E"/><path d="M6 4 l3 -5 l3 5 M12 3 l3 -5 l3 5" fill="#F6B04A"/><circle cx="23" cy="4" r="1.4" fill="#2B1B14"/></g>' +
      // الرأس
      '<g class="head" style="transform-origin:100px 150px">' +
        '<circle cx="38" cy="100" r="11" fill="url(#' + p + 'skin)"/><circle cx="162" cy="100" r="11" fill="url(#' + p + 'skin)"/>' +
        '<circle cx="100" cy="94" r="64" fill="url(#' + p + 'skin)"/>' +
        '<path d="M38 88 C36 42 70 24 104 26 C140 28 166 48 162 90 C152 66 136 56 118 58 C110 46 96 44 84 54 C66 52 48 64 38 88Z" fill="url(#' + p + 'hair)"/>' +
        '<path d="M100 28 C104 14 116 12 120 18 C112 18 108 24 106 30Z" fill="#4A3022"/>' +
        face(expr, 100, 104, 1) +
      "</g></svg>";
  }

  /* ---------- ورد ---------- */
  function ward(expr) {
    var p = "w" + (++uid) + "_";
    return '<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' + skinDefs(p) +
      '<linearGradient id="' + p + 'dress" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9A2EE"/><stop offset="1" stop-color="#8A58C7"/></linearGradient>' +
      '<linearGradient id="' + p + 'hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A3A2A"/><stop offset="1" stop-color="#2F1D14"/></linearGradient></defs>' +
      '<ellipse cx="100" cy="292" rx="50" ry="7" fill="#1F3B2A" opacity=".18"/>' +
      // الساقان والجوارب والحذاء
      '<rect x="79" y="232" width="17" height="50" rx="8" fill="url(#' + p + 'skin)"/>' +
      '<rect x="104" y="232" width="17" height="50" rx="8" fill="url(#' + p + 'skin)"/>' +
      '<rect x="79" y="262" width="17" height="18" rx="6" fill="#fff"/><rect x="104" y="262" width="17" height="18" rx="6" fill="#fff"/>' +
      '<ellipse cx="85" cy="286" rx="15" ry="8.5" fill="#B5375B"/><ellipse cx="115" cy="286" rx="15" ry="8.5" fill="#B5375B"/>' +
      // الذراعان
      '<g class="arm arm-l" style="transform-origin:68px 150px"><path d="M68 150 L56 182 L52 208" stroke="url(#' + p + 'skin)" stroke-width="16" stroke-linecap="round" fill="none"/><path d="M68 150 L60 170" stroke="#B58BE0" stroke-width="21" stroke-linecap="round"/><circle cx="52" cy="210" r="9.5" fill="url(#' + p + 'skin)"/></g>' +
      '<g class="arm arm-r" style="transform-origin:132px 150px"><path d="M132 150 L144 182 L148 208" stroke="url(#' + p + 'skin)" stroke-width="16" stroke-linecap="round" fill="none"/><path d="M132 150 L140 170" stroke="#B58BE0" stroke-width="21" stroke-linecap="round"/><circle cx="148" cy="210" r="9.5" fill="url(#' + p + 'skin)"/></g>' +
      // الفستان
      '<path d="M72 140 Q100 132 128 140 L152 240 Q100 254 48 240 Z" fill="url(#' + p + 'dress)"/>' +
      '<path d="M72 140 Q100 132 128 140 L152 240 Q100 254 48 240 Z" fill="url(#' + p + 'shine)"/>' +
      '<path d="M80 141 Q100 160 120 141 Q100 136 80 141Z" fill="#fff" opacity=".9"/>' +
      '<g fill="#FFE07A"><circle cx="78" cy="214" r="4"/><circle cx="104" cy="224" r="4"/><circle cx="128" cy="210" r="4"/><circle cx="92" cy="190" r="3.5"/><circle cx="116" cy="184" r="3.5"/></g>' +
      // الرأس
      '<g class="head" style="transform-origin:100px 148px">' +
        // الضفيرتان
        '<circle cx="34" cy="78" r="20" fill="url(#' + p + 'hair)"/><circle cx="166" cy="78" r="20" fill="url(#' + p + 'hair)"/>' +
        '<path d="M44 66 l-14 -10 l2 18z M44 66 l-4 -17 l-10 13z" fill="#F56D9B"/><path d="M156 66 l14 -10 l-2 18z M156 66 l4 -17 l10 13z" fill="#F56D9B"/>' +
        '<circle cx="44" cy="66" r="5" fill="#E04D84"/><circle cx="156" cy="66" r="5" fill="#E04D84"/>' +
        '<circle cx="38" cy="102" r="10" fill="url(#' + p + 'skin)"/><circle cx="162" cy="102" r="10" fill="url(#' + p + 'skin)"/>' +
        '<circle cx="100" cy="96" r="62" fill="url(#' + p + 'skin)"/>' +
        '<path d="M38 100 C30 46 66 28 100 28 C134 28 170 46 162 100 C158 80 150 70 140 66 C128 74 108 74 98 62 C88 74 64 76 54 70 C46 78 40 88 38 100Z" fill="url(#' + p + 'hair)"/>' +
        // مشبك وردة
        '<g transform="translate(132 50)"><circle r="5" cx="0" cy="-6" fill="#FFB3CB"/><circle r="5" cx="6" cy="0" fill="#FFB3CB"/><circle r="5" cx="0" cy="6" fill="#FFB3CB"/><circle r="5" cx="-6" cy="0" fill="#FFB3CB"/><circle r="3.5" fill="#FFD84D"/></g>' +
        face(expr, 100, 106, 0.97) +
      "</g></svg>";
  }

  /* ---------- دودو ---------- */
  function dodo(expr) {
    var p = "d" + (++uid) + "_";
    var e = (expr === "happy") ? "happy" : "sad";
    return '<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' +
      '<radialGradient id="' + p + 'g" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#B8F0B4"/><stop offset=".6" stop-color="#78CF85"/><stop offset="1" stop-color="#4FA868"/></radialGradient></defs>' +
      '<ellipse cx="100" cy="292" rx="56" ry="7" fill="#1F3B2A" opacity=".18"/>' +
      '<path class="tail" style="transform-origin:140px 250px" d="M138 236 Q182 238 190 210 Q178 262 132 262Z" fill="url(#' + p + 'g)"/>' +
      '<ellipse cx="78" cy="278" rx="16" ry="12" fill="#5DB673"/><ellipse cx="122" cy="278" rx="16" ry="12" fill="#5DB673"/>' +
      '<ellipse cx="100" cy="240" rx="50" ry="42" fill="url(#' + p + 'g)"/>' +
      '<ellipse cx="100" cy="250" rx="30" ry="28" fill="#F4F0C8"/>' +
      '<g class="head" style="transform-origin:100px 205px">' +
        '<path d="M70 128 l8 -16 l8 16 M90 118 l10 -18 l10 18 M114 128 l8 -16 l8 16" fill="#F6A94A"/>' +
        '<circle cx="100" cy="166" r="54" fill="url(#' + p + 'g)"/>' +
        // قشرة البيضة على الرأس
        '<path d="M64 132 Q100 92 136 132 L128 126 L120 134 L110 124 L100 134 L90 124 L80 134 L72 126Z" fill="#FFFDF3" stroke="#E2DCC2" stroke-width="2"/>' +
        face(e, 100, 168, 0.95) +
      "</g></svg>";
  }

  /* ---------- ماما دودو ---------- */
  function mama(expr) {
    var p = "m" + (++uid) + "_";
    var worried = expr !== "happy";
    var ink = "#2B1B14";
    var brows = worried
      ? '<path d="M44 52 L56 48 M68 48 L80 52" stroke="' + ink + '" stroke-width="3" stroke-linecap="round"/>'
      : "";
    var mouth = worried
      ? '<path d="M54 82 Q62 76 70 82" fill="none" stroke="' + ink + '" stroke-width="3" stroke-linecap="round"/>'
      : '<path d="M50 78 Q62 92 74 78" fill="none" stroke="' + ink + '" stroke-width="3.2" stroke-linecap="round"/>';
    return '<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' +
      '<radialGradient id="' + p + 'g" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#9FE3D5"/><stop offset=".6" stop-color="#4FB8A6"/><stop offset="1" stop-color="#2F8E80"/></radialGradient></defs>' +
      '<ellipse cx="112" cy="292" rx="80" ry="8" fill="#1F3B2A" opacity=".18"/>' +
      '<path d="M170 236 Q200 246 198 270 Q186 252 160 256Z" fill="url(#' + p + 'g)"/>' +
      '<rect x="72" y="248" width="24" height="42" rx="11" fill="#3E9F8F"/><rect x="140" y="248" width="24" height="42" rx="11" fill="#3E9F8F"/>' +
      '<ellipse cx="118" cy="236" rx="70" ry="42" fill="url(#' + p + 'g)"/>' +
      '<g fill="#FFD27A" opacity=".85"><circle cx="100" cy="214" r="7"/><circle cx="126" cy="206" r="6"/><circle cx="150" cy="218" r="6.5"/></g>' +
      '<g class="head" style="transform-origin:90px 230px">' +
        '<path d="M70 220 C54 160 50 110 62 70" stroke="url(#' + p + 'g)" stroke-width="34" stroke-linecap="round" fill="none"/>' +
        '<ellipse cx="62" cy="64" rx="36" ry="30" fill="url(#' + p + 'g)"/>' +
        '<ellipse cx="50" cy="62" rx="5" ry="6.5" fill="' + ink + '"/><ellipse cx="74" cy="62" rx="5" ry="6.5" fill="' + ink + '"/>' +
        '<circle cx="52" cy="59.5" r="2" fill="#fff"/><circle cx="76" cy="59.5" r="2" fill="#fff"/>' +
        '<ellipse cx="40" cy="74" rx="6" ry="3.5" fill="#F28B8B" opacity=".5"/><ellipse cx="84" cy="74" rx="6" ry="3.5" fill="#F28B8B" opacity=".5"/>' +
        brows + mouth +
      "</g></svg>";
  }

  var DRAW = { hatem: hatem, ward: ward, dodo: dodo, mama: mama };

  /* يعيد HTML للشخصية بتعبير معيّن (صورة إن وُجدت، وإلا رسم مؤقت) */
  function imageFor(id, expr) {
    var set = (window.ASSETS && ASSETS.characters[id]) || {};
    return set[expr] || set.base || null;
  }

  /* فقاعة الشعور: تظهر فقط حين لا توجد صورة كاملة لهذا التعبير
     والجسم المعروض هو صورة base المشتركة */
  function feeling(id, expr) {
    var set = (window.ASSETS && ASSETS.characters[id]) || {};
    if (set[expr] || !set.base) return null;
    var f = window.ASSETS && ASSETS.feelings && ASSETS.feelings[id];
    return (f && f[expr]) || null;
  }

  function markup(id, expr) {
    expr = resolveExpr(id, expr);
    var src = imageFor(id, expr);
    if (src) {
      return '<img class="char-img" src="' + src + '" alt="" draggable="false">';
    }
    return DRAW[id] ? DRAW[id](SVG_EXPR[expr] || expr) : "";
  }

  window.CHARACTERS = {
    SIZE: SIZE,
    markup: markup,
    resolveExpr: resolveExpr,
    feeling: feeling,
    isPlaceholder: function (id, expr) {
      return !imageFor(id, resolveExpr(id, expr));
    }
  };
})();
