/* =========================================================
   backgrounds.js — الخلفيات
   ---------------------------------------------------------
   إن وُجد مسار في ASSETS.backgrounds تُستخدم الصورة،
   وإلا تُرسم خلفية مؤقتة (SVG) بنفس التكوين:
   الأرض في الخُمس السفلي، والشخصيات تقف عليها.
   ========================================================= */

(function () {
  "use strict";

  var W = 1200, H = 800;

  function base(skyTop, skyBottom, extra) {
    return '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + skyTop + '"/><stop offset="1" stop-color="' + skyBottom + '"/></linearGradient>' +
      '<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9BD67E"/><stop offset="1" stop-color="#6DB65E"/></linearGradient>' +
      '<radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF6C9"/><stop offset="1" stop-color="#FFF6C9" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#sky)"/>' +
      '<circle cx="980" cy="140" r="170" fill="url(#sun)"/><circle cx="980" cy="140" r="58" fill="#FFE89A"/>' +
      clouds() +
      // بركان بعيد هادئ
      '<path d="M120 520 L260 300 L300 300 L450 520Z" fill="#B9C9E6"/><path d="M260 300 Q280 286 300 300 L292 320 Q280 310 268 320Z" fill="#E7EEF9"/>' +
      '<path d="M0 520 Q160 420 340 480 T720 450 T1200 470 V800 H0Z" fill="#A9D9A0"/>' +
      '<path d="M0 560 Q200 500 420 540 T860 520 T1200 540 V800 H0Z" fill="#8ECB85"/>' +
      palms(70, 470, 1.0) + palms(1110, 480, 0.9) +
      extra +
      '<path d="M0 640 Q300 616 600 636 T1200 630 V800 H0Z" fill="url(#ground)"/>' +
      ferns() +
      "</svg>";
  }

  function clouds() {
    var c = function (x, y, s) {
      return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')" fill="#fff" opacity=".9">' +
        '<ellipse cx="0" cy="0" rx="60" ry="26"/><ellipse cx="40" cy="-14" rx="44" ry="30"/><ellipse cx="-38" cy="-8" rx="36" ry="22"/></g>';
    };
    return '<g class="bg-clouds">' + c(260, 150, 1) + c(640, 100, 0.8) + c(1100, 260, 0.7) + "</g>";
  }

  function palms(x, y, s) {
    var leaf = function (r) {
      return '<path transform="rotate(' + r + ')" d="M0 0 Q60 -30 130 10 Q60 -6 0 0Z" fill="#4E9E5A"/>';
    };
    return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')">' +
      '<path d="M-8 180 Q-20 80 4 0 L14 2 Q0 90 10 180Z" fill="#9C6B45"/>' +
      '<g transform="translate(8 0)">' + leaf(-170) + leaf(-130) + leaf(-60) + leaf(-15) + leaf(20) + leaf(160) + "</g></g>";
  }

  function ferns() {
    var f = function (x, s, flip) {
      return '<g transform="translate(' + x + " 800) scale(" + (flip ? -s : s) + " " + s + ')" fill="#5BAA5E">' +
        '<path d="M0 0 Q-10 -80 -60 -130 Q-20 -70 0 0Z"/><path d="M0 0 Q10 -100 50 -150 Q14 -90 0 0Z" fill="#4F9E55"/><path d="M0 0 Q-40 -40 -100 -50 Q-40 -30 0 0Z"/></g>';
    };
    return f(40, 1, false) + f(1170, 1.1, true) + f(620, 0.5, false);
  }

  function flowers(list) {
    return list.map(function (p) {
      return '<g transform="translate(' + p[0] + " " + p[1] + ')"><circle r="7" cx="0" cy="-7" fill="' + p[2] + '"/><circle r="7" cx="7" cy="0" fill="' + p[2] + '"/><circle r="7" cx="0" cy="7" fill="' + p[2] + '"/><circle r="7" cx="-7" cy="0" fill="' + p[2] + '"/><circle r="5" fill="#FFE07A"/></g>';
    }).join("");
  }

  var SCENES = {
    meadow: function () {
      return base("#BFE6F7", "#E9F7EC",
        flowers([[220, 690, "#F7A1C4"], [380, 720, "#FFFFFF"], [840, 700, "#C9A2EE"], [990, 730, "#F7A1C4"], [560, 760, "#FFFFFF"]]));
    },
    slide: function () {
      // ديناصور ضخم نائم ظهره تلة، وذيله زحليقة
      return base("#C6E8F6", "#EEF8EA",
        '<g transform="translate(560 640)">' +
          '<path d="M-420 0 Q-300 -330 0 -330 Q240 -330 300 -120 Q420 -60 560 -10 Q420 -20 300 0Z" fill="#7FC7A6"/>' +
          '<path d="M-380 -10 Q-280 -290 0 -300 Q200 -300 270 -110" fill="none" stroke="#9EDDBF" stroke-width="22" stroke-linecap="round" opacity=".7"/>' +
          '<g fill="#F6B04A"><path d="M-260 -250 l30 -50 l30 50z"/><path d="M-150 -300 l30 -56 l30 56z"/><path d="M-30 -318 l30 -58 l30 58z"/><path d="M90 -300 l30 -54 l30 54z"/></g>' +
          '<ellipse cx="-380" cy="-60" rx="80" ry="64" fill="#7FC7A6"/><path d="M-410 -76 q14 -10 28 0" stroke="#2B1B14" stroke-width="5" fill="none" stroke-linecap="round"/>' +
          '<path d="M-360 -40 q20 12 40 0" stroke="#2B1B14" stroke-width="4" fill="none" stroke-linecap="round"/>' +
          '<text x="-410" y="-150" font-size="34" fill="#5E9E83" font-family="sans-serif">z z</text>' +
        "</g>" +
        flowers([[160, 720, "#F7A1C4"], [1040, 740, "#FFFFFF"]]));
    },
    rocks: function () {
      return base("#C9E5F4", "#F1F6E6",
        '<g fill="#B7AFA3"><ellipse cx="300" cy="640" rx="170" ry="90"/><ellipse cx="200" cy="600" rx="90" ry="70" fill="#C9C1B4"/>' +
        '<ellipse cx="930" cy="636" rx="190" ry="100"/><ellipse cx="1040" cy="590" rx="100" ry="76" fill="#C9C1B4"/><ellipse cx="840" cy="580" rx="70" ry="50" fill="#D3CCC0"/></g>' +
        '<g transform="translate(600 650)" class="bg-gem"><circle r="60" fill="#FFF6B3" opacity=".55"/>' +
          '<path d="M0 -26 L22 -6 L14 22 L-14 22 L-22 -6Z" fill="#7FD8F2" stroke="#fff" stroke-width="4"/><path d="M0 -26 L6 -2 L0 22 L-6 -2Z" fill="#fff" opacity=".6"/></g>' +
        flowers([[120, 740, "#C9A2EE"], [1100, 740, "#F7A1C4"]]));
    },
    river: function () {
      return base("#C3E5F6", "#EEF8EA",
        '<path d="M0 600 Q300 570 600 590 T1200 585 V700 Q900 690 600 705 T0 700Z" fill="#7CC8EE"/>' +
        '<path d="M80 620 q40 -10 80 0 M420 640 q40 -10 80 0 M820 625 q40 -10 80 0 M1020 660 q40 -10 80 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>' +
        '<g fill="#B7AFA3"><ellipse cx="480" cy="648" rx="38" ry="18"/><ellipse cx="720" cy="652" rx="38" ry="18"/></g>' +
        '<g class="bridge-rocks" fill="#A39A8C"><ellipse cx="560" cy="650" rx="42" ry="20"/><ellipse cx="640" cy="652" rx="42" ry="20"/></g>');
    },
    nest: function () {
      return base("#FFE3C4", "#F4F8E4",
        '<path d="M0 600 Q300 570 600 590 T1200 585 V700 Q900 690 600 705 T0 700Z" fill="#7CC8EE"/>' +
        '<g fill="#A39A8C"><ellipse cx="400" cy="650" rx="44" ry="20"/><ellipse cx="480" cy="648" rx="44" ry="20"/><ellipse cx="560" cy="650" rx="44" ry="20"/><ellipse cx="640" cy="652" rx="44" ry="20"/><ellipse cx="720" cy="652" rx="44" ry="20"/></g>' +
        '<g transform="translate(260 650)"><ellipse rx="130" ry="44" fill="#B98552"/><ellipse cy="-10" rx="104" ry="28" fill="#8C5E36"/>' +
        '<ellipse cx="-40" cy="-30" rx="26" ry="32" fill="#FFFDF3"/><ellipse cx="20" cy="-34" rx="26" ry="32" fill="#F4EFFF"/></g>' +
        flowers([[100, 720, "#F7A1C4"], [880, 730, "#C9A2EE"], [1000, 710, "#FFFFFF"], [1120, 740, "#F7A1C4"]]));
    }
  };

  function markup(id) {
    var src = window.ASSETS && ASSETS.backgrounds[id];
    if (src) return '<img class="bg-img" src="' + src + '" alt="" draggable="false">';
    // معرّفات فريدة حتى لا تتداخل تدرّجات خلفيتين أثناء الانتقال
    var p = "bg" + (++uid) + "_";
    return (SCENES[id] || SCENES.meadow)().replace(/(id="|url\(#)(sky|ground|sun)/g, "$1" + p + "$2");
  }
  var uid = 0;

  window.BACKGROUNDS = { markup: markup };
})();
