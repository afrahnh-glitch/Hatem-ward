/* =========================================================
   story.js — بيانات القصة فقط (لا منطق هنا)
   ---------------------------------------------------------
   كل مشهد:
     bg      : معرّف الخلفية (انظري assets/assets.js)
     cast    : الشخصيات الظاهرة وتعبيرها الابتدائي
     lines   : جمل الحوار بالترتيب
               id   : معرّف الصوت (يُربط في assets/audio/manifest.js)
               who  : من يتكلم (narrator للراوية)
               expr : تعبير المتكلم أثناء الجملة
                      happy · laugh · proud · cheer · sad · upset · surprised · scared · cry · thinking
               faces: تعبيرات بقية الشخصيات أثناء الجملة (اختياري)
               for  : "hatem" أو "ward" إذا كانت الجملة لمسار شخصية واحدة
               fx   : مؤثر بصري (stars | hearts | sparkle)
               sfx  : مؤثر صوتي (success | hint | pop | celebrate)
     choices: اختيارات لكل شخصية { hatem:[...], ward:[...] }
               icon : رمز الاختيار (يُستبدل بصورة لاحقًا إن رغبتِ)
               text : نص الاختيار
               next : المشهد التالي
     next   : المشهد التالي بعد انتهاء الجمل (إن لم توجد اختيارات)
     back   : لمشاهد التلميح — يعود لاختيارات هذا المشهد
     star   : true = يحصل الطفل على نجمة عند الوصول
     type   : "ending" لمشهد النهاية
   ========================================================= */

window.STORY = {
  title: "مغامرات حاتم وورد",
  adventure: "دودو يبحث عن ماما",
  start: "intro",

  characters: {
    hatem:    { name: "حاتم" },
    ward:     { name: "ورد" },
    dodo:     { name: "دودو" },
    mama:     { name: "ماما دودو" },
    narrator: { name: "الراوية" }
  },

  scenes: {

    /* ---------------- المشهد الافتتاحي ---------------- */
    intro: {
      bg: "meadow",
      cast: { ward: "happy", hatem: "happy" },
      lines: [
        { id: "intro_01", who: "narrator", text: "في غابة الديناصورات، كان حاتم وورد يلعبون مع بعض." },
        { id: "intro_02", who: "ward",  expr: "happy", text: "حاتم! تعال نلعب!" },
        { id: "intro_03", who: "hatem", expr: "happy", text: "يلّا يا ورد!" },
        { id: "intro_04", who: "narrator", text: "فجأة… سمعوا صوت بكاء صغير.", faces: { hatem: "scared", ward: "scared" }, sfx: "pop", enter: { dodo: "sad" } },
        { id: "intro_05", who: "dodo", expr: "sad", text: "أبغى ماما… ضعت عنها.", faces: { hatem: "sad", ward: "sad" } },
        { id: "intro_06", who: "ward",  expr: "happy", text: "لا تخاف يا دودو، إحنا بنساعدك!" },
        { id: "intro_07", who: "hatem", expr: "proud", text: "بنوصّلك لماما!", faces: { dodo: "happy" }, fx: "hearts" }
      ],
      next: "s1"
    },

    /* ---------------- الموقف الأول: الزحليقة ---------------- */
    s1: {
      bg: "slide",
      cast: { ward: "proud", hatem: "upset", dodo: "happy" },
      lines: [
        { id: "s1_01", who: "narrator", text: "الطريق لماما دودو يبدأ من زحليقة ذيل الديناصور الكبير." },
        { id: "s1_02", who: "ward",  expr: "proud", text: "أنا أنزل أول! أنا الأكبر!" },
        { id: "s1_03", who: "hatem", expr: "upset", text: "لا! أنا أبغى أنزل أول!" },
        { id: "s1_04", who: "narrator", for: "hatem", text: "حاتم، وش تسوي؟" },
        { id: "s1_05", who: "narrator", for: "ward",  text: "ورد، وش تسوين؟" }
      ],
      choices: {
        hatem: [
          { icon: "🗣️", text: "أقول لها: أنا زعلان، أبغى دوري", next: "s1_good_hatem" },
          { icon: "✋", text: "أدفّها وأنزل",                     next: "s1_hint_push" },
          { icon: "😭", text: "أصرخ وأبكي",                      next: "s1_hint_cry" }
        ],
        ward: [
          { icon: "🔁", text: "أقول: نتناوب، مرة أنا ومرة أنت",    next: "s1_good_ward" },
          { icon: "👑", text: "أقول: أنا الأكبر، اسكت!",           next: "s1_hint_boss" },
          { icon: "🏃‍♀️", text: "أنزل بسرعة قبله",                  next: "s1_hint_rush" }
        ]
      }
    },

    s1_good_hatem: {
      bg: "slide", star: true,
      cast: { ward: "surprised", hatem: "sad", dodo: "happy" },
      lines: [
        { id: "s1gh_01", who: "hatem", expr: "sad", text: "ورد… أنا زعلان. أبغى دوري." },
        { id: "s1gh_02", who: "ward",  expr: "sad", text: "آسفة يا حاتم. خلّنا نتناوب: أنا مرة، وأنت مرة." },
        { id: "s1gh_03", who: "hatem", expr: "laugh", text: "تمام!", faces: { ward: "happy" }, sfx: "success", fx: "stars" },
        { id: "s1gh_04", who: "narrator", text: "لما قال حاتم وش يحس فيه، فهمته ورد." }
      ],
      next: "s2"
    },

    s1_good_ward: {
      bg: "slide", star: true,
      cast: { ward: "happy", hatem: "upset", dodo: "happy" },
      lines: [
        { id: "s1gw_01", who: "ward",  expr: "happy", text: "تعال نتناوب: مرة أنا، ومرة أنت." },
        { id: "s1gw_02", who: "hatem", expr: "laugh", text: "صدق؟ شكرًا يا ورد!", sfx: "success", fx: "stars" },
        { id: "s1gw_03", who: "narrator", text: "الأكبر مو لازم يكون الأول دايم. اللعب أحلى لما نتناوب." }
      ],
      next: "s2"
    },

    s1_hint_push: {
      bg: "slide", back: "s1",
      cast: { ward: "cry", hatem: "upset", dodo: "sad" },
      lines: [
        { id: "s1hp_01", who: "ward", expr: "cry", text: "آه! وجعتني…", sfx: "hint" },
        { id: "s1hp_02", who: "narrator", faces: { hatem: "sad" }, text: "ورد زعلت. الدفّ يوجّع. وش رايك تقول لها بالكلام وش تحس فيه؟" }
      ]
    },

    s1_hint_cry: {
      bg: "slide", back: "s1",
      cast: { ward: "surprised", hatem: "cry", dodo: "sad" },
      lines: [
        { id: "s1hc_01", who: "ward", expr: "surprised", text: "حاتم؟ ليش تبكي؟ ما فهمت…", sfx: "hint" },
        { id: "s1hc_02", who: "narrator", faces: { hatem: "sad", ward: "happy" }, text: "لما نهدأ ونتكلم، الناس يفهمونا. جرّب تقول: أبغى دوري." }
      ]
    },

    s1_hint_boss: {
      bg: "slide", back: "s1",
      cast: { ward: "proud", hatem: "sad", dodo: "sad" },
      lines: [
        { id: "s1hb_01", who: "hatem", expr: "sad", text: "أنا بعد أبغى ألعب…", sfx: "hint" },
        { id: "s1hb_02", who: "narrator", text: "حاتم زعل. الأكبر مو معناه إنه الأول دايم. وش رايك كل واحد ياخذ دوره؟" }
      ]
    },

    s1_hint_rush: {
      bg: "slide", back: "s1",
      cast: { ward: "surprised", hatem: "sad", dodo: "sad" },
      lines: [
        { id: "s1hr_01", who: "hatem", expr: "sad", text: "ما عطيتيني دور…", sfx: "hint" },
        { id: "s1hr_02", who: "narrator", text: "حاتم صار يحس إنه لحاله. اللعب أحلى لما نتناوب. جرّبي مرة ثانية." }
      ]
    },

    /* ---------------- الموقف الثاني: الحجر اللامع ---------------- */
    s2: {
      bg: "rocks",
      cast: { ward: "surprised", hatem: "surprised", dodo: "happy" },
      lines: [
        { id: "s2_01", who: "narrator", text: "عند الصخور، لقوا حجر لامع يلمع مثل النجمة!", fx: "sparkle", sfx: "pop" },
        { id: "s2_02", who: "dodo",  expr: "happy", text: "ماما تحب الأشياء اللي تلمع!" },
        { id: "s2_03", who: "hatem", expr: "upset", text: "أبغاه!" },
        { id: "s2_04", who: "ward",  expr: "upset", text: "لا، أنا أبغاه!" },
        { id: "s2_05", who: "narrator", for: "hatem", text: "حاتم، وش تسوي؟" },
        { id: "s2_06", who: "narrator", for: "ward",  text: "ورد، وش تسوين؟" }
      ],
      choices: {
        hatem: [
          { icon: "🙏", text: "أطلب بأدب: ممكن أمسكه شوي؟",           next: "s2_good_hatem" },
          { icon: "✊", text: "آخذه من يدها",                           next: "s2_hint_grab" },
          { icon: "😠", text: "أقول: إذا ما عطيتيني ما ألعب معك",      next: "s2_hint_threat" }
        ],
        ward: [
          { icon: "🤲", text: "أقول: نمسكه مع بعض",                     next: "s2_good_ward" },
          { icon: "🙈", text: "أخبّيه ورا ظهري",                        next: "s2_hint_hide" },
          { icon: "👑", text: "أقول: أنا الأكبر، هو لي",                next: "s2_hint_mine" }
        ]
      }
    },

    s2_good_hatem: {
      bg: "rocks", star: true,
      cast: { ward: "upset", hatem: "happy", dodo: "happy" },
      lines: [
        { id: "s2gh_01", who: "hatem", expr: "happy", text: "ورد، ممكن أمسكه شوي؟" },
        { id: "s2gh_02", who: "ward",  expr: "cheer", faces: { hatem: "laugh" }, text: "أكيد! خذه شوي، وبعدين أنا.", sfx: "success", fx: "stars" },
        { id: "s2gh_03", who: "narrator", text: "الكلمة الحلوة تخلّي الكل يحب يشاركنا." }
      ],
      next: "s3"
    },

    s2_good_ward: {
      bg: "rocks", star: true,
      cast: { ward: "happy", hatem: "upset", dodo: "happy" },
      lines: [
        { id: "s2gw_01", who: "ward",  expr: "happy", text: "حاتم، تعال نمسكه مع بعض!" },
        { id: "s2gw_02", who: "hatem", expr: "laugh", faces: { ward: "cheer" }, text: "مع بعض! ونعطيه لماما دودو مع بعض!", sfx: "success", fx: "stars" },
        { id: "s2gw_03", who: "narrator", text: "لما شاركت ورد، صار الحجر أحلى للاثنين." }
      ],
      next: "s3"
    },

    s2_hint_grab: {
      bg: "rocks", back: "s2",
      cast: { ward: "sad", hatem: "upset", dodo: "sad" },
      lines: [
        { id: "s2hg_01", who: "ward", expr: "sad", text: "كان معي…", sfx: "hint" },
        { id: "s2hg_02", who: "narrator", text: "ورد زعلت لأن الحجر انأخذ منها. وش رايك نطلبه بكلمة حلوة؟" }
      ]
    },

    s2_hint_threat: {
      bg: "rocks", back: "s2",
      cast: { ward: "sad", hatem: "upset", dodo: "sad" },
      lines: [
        { id: "s2ht_01", who: "ward", expr: "sad", text: "بس أنا أبغى ألعب معك…", sfx: "hint" },
        { id: "s2ht_02", who: "narrator", text: "ورد خافت تخسر صاحبها. نقدر نطلب بلطف: ممكن أمسكه شوي؟" }
      ]
    },

    s2_hint_hide: {
      bg: "rocks", back: "s2",
      cast: { ward: "proud", hatem: "sad", dodo: "sad" },
      lines: [
        { id: "s2hh_01", who: "hatem", expr: "sad", text: "وين راح؟ أنا بعد أبغى أشوفه…", sfx: "hint" },
        { id: "s2hh_02", who: "narrator", text: "حاتم زعل. الشي الحلو يصير أحلى لما نشاركه. جرّبي مرة ثانية." }
      ]
    },

    s2_hint_mine: {
      bg: "rocks", back: "s2",
      cast: { ward: "proud", hatem: "sad", dodo: "sad" },
      lines: [
        { id: "s2hm_01", who: "hatem", expr: "sad", text: "دايم تقولين أنا الأكبر…", sfx: "hint" },
        { id: "s2hm_02", who: "narrator", text: "حاتم يحب يلعب مثل ورد. الكبيرة الشاطرة تشارك. وش رايك تحاولين مرة ثانية؟" }
      ]
    },

    /* ---------------- الموقف الثالث: جسر النهر ---------------- */
    s3: {
      bg: "river",
      cast: { ward: "surprised", hatem: "surprised", dodo: "sad" },
      lines: [
        { id: "s3_01", who: "narrator", text: "وصلوا للنهر… وماما دودو في الجهة الثانية!", enter: { mama: "worried" } },
        { id: "s3_02", who: "dodo", expr: "sad", text: "ماما! ما أقدر أوصل لك!" },
        { id: "s3_03", who: "narrator", faces: { hatem: "thinking", ward: "thinking" }, text: "لازم يبنون جسر من الصخور. بس الصخرة ثقيلة…" },
        { id: "s3_04", who: "hatem", for: "hatem", expr: "sad", text: "ثقيلة… ما أقدر أشيلها لحالي." },
        { id: "s3_05", who: "ward",  for: "ward",  expr: "sad", text: "ثقيلة… ما أقدر أشيلها لحالي." }
      ],
      choices: {
        hatem: [
          { icon: "🤝", text: "أقول: ورد، ساعديني نشيلها مع بعض",  next: "s3_good_hatem" },
          { icon: "😞", text: "أقول: ما أقدر، خلاص",               next: "s3_hint_giveup" },
          { icon: "👉", text: "أقول: أنتِ شيليها لحالك",           next: "s3_hint_order" }
        ],
        ward: [
          { icon: "🤝", text: "أقول: حاتم، تعال نشيلها مع بعض",   next: "s3_good_ward" },
          { icon: "💪", text: "أقول: أنا أقوى، أشيلها لحالي",      next: "s3_hint_alone" },
          { icon: "😒", text: "أقول: أنت صغير ما تقدر تساعد",      next: "s3_hint_small" }
        ]
      }
    },

    s3_good_hatem: {
      bg: "river", star: true,
      cast: { ward: "sad", hatem: "sad", dodo: "sad", mama: "worried" },
      lines: [
        { id: "s3gh_01", who: "hatem", expr: "happy", text: "ورد، ساعديني! نشيلها مع بعض!" },
        { id: "s3gh_02", who: "ward",  expr: "cheer", faces: { hatem: "cheer" }, text: "يلّا! واحد… اثنين… ثلاثة!", sfx: "success", fx: "stars" }
      ],
      next: "ending"
    },

    s3_good_ward: {
      bg: "river", star: true,
      cast: { ward: "sad", hatem: "sad", dodo: "sad", mama: "worried" },
      lines: [
        { id: "s3gw_01", who: "ward",  expr: "happy", text: "حاتم، تعال! نشيلها مع بعض!" },
        { id: "s3gw_02", who: "hatem", expr: "proud", text: "أنا أساعد! واحد… اثنين… ثلاثة!", faces: { ward: "happy" }, sfx: "success", fx: "stars" }
      ],
      next: "ending"
    },

    s3_hint_giveup: {
      bg: "river", back: "s3",
      cast: { ward: "sad", hatem: "sad", dodo: "sad", mama: "worried" },
      lines: [
        { id: "s3hg_01", who: "dodo", expr: "sad", text: "يعني ما راح أشوف ماما؟", sfx: "hint" },
        { id: "s3hg_02", who: "narrator", text: "لما الشي يصعب علينا، نقدر نطلب مساعدة. مين يقدر يساعد حاتم؟" }
      ]
    },

    s3_hint_order: {
      bg: "river", back: "s3",
      cast: { ward: "sad", hatem: "upset", dodo: "sad", mama: "worried" },
      lines: [
        { id: "s3ho_01", who: "ward", expr: "sad", text: "حتى أنا ما أقدر لحالي…", sfx: "hint" },
        { id: "s3ho_02", who: "narrator", text: "الصخرة ثقيلة على واحد… بس مو على اثنين! جرّب تطلب منها تساعدك." }
      ]
    },

    s3_hint_alone: {
      bg: "river", back: "s3",
      cast: { ward: "sad", hatem: "sad", dodo: "sad", mama: "worried" },
      lines: [
        { id: "s3ha_01", who: "ward", expr: "sad", text: "أووف… ما تحركت!", sfx: "hint" },
        { id: "s3ha_02", who: "narrator", text: "حتى الأقوياء يحتاجون أصحابهم. حاتم ينتظر أحد يقول له: تعال." }
      ]
    },

    s3_hint_small: {
      bg: "river", back: "s3",
      cast: { ward: "proud", hatem: "sad", dodo: "sad", mama: "worried" },
      lines: [
        { id: "s3hs_01", who: "hatem", expr: "sad", text: "بس أنا أقدر أساعد…", sfx: "hint" },
        { id: "s3hs_02", who: "narrator", text: "حاتم صغير، بس يده قوية! وش رايك تعطينه فرصة يساعد؟" }
      ]
    },

    /* ---------------- النهاية المشتركة ---------------- */
    ending: {
      bg: "nest", type: "ending",
      cast: { ward: "happy", hatem: "happy", dodo: "happy", mama: "happy" },
      lines: [
        { id: "end_01", who: "narrator", text: "شالوا الصخور مع بعض… وصار عندهم جسر!", sfx: "celebrate", fx: "sparkle" },
        { id: "end_02", who: "dodo",  expr: "happy", text: "ماما!!", fx: "hearts" },
        { id: "end_03", who: "mama",  expr: "happy", text: "شكرًا يا حاتم! شكرًا يا ورد! رجّعتوا لي دودو." },
        { id: "end_04", who: "hatem", expr: "proud", faces: { ward: "happy" }, text: "إحنا فريق!" },
        { id: "end_05", who: "ward",  expr: "cheer", text: "أحلى فريق!", fx: "stars" },
        { id: "end_06", who: "narrator", text: "اليوم تعلّمنا: نقول وش نحس فيه، ونطلب بلطف، ونتعاون." }
      ]
    }
  }
};
