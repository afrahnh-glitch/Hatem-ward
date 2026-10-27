/* =========================================================
   assets.js — سجل الصور
   ---------------------------------------------------------
   null = الصورة غير جاهزة بعد → يُستخدم البديل.
   عندما تجهز صورة: ضعيها في المجلد ثم اكتبي مسارها بدل null.

   كيف تُختار صورة الشخصية؟
   1) إن وُجدت صورة كاملة للتعبير نفسه (مثل sad) → تُستخدم.
   2) وإلا تُستخدم صورة base (الجسم الأساسي)، ويظهر فوق رأسها
      «فقاعة الشعور» من feelings إن وُجدت لذلك التعبير.
   3) وإن لم توجد base → رسم مؤقت.

   المواصفات (التفاصيل في ASSETS.md):
   - الشخصيات: PNG أو WebP بخلفية شفافة، لوحة 900×1200 (3:4)،
     الشخصية كاملة، القدمان على الحافة السفلية، وطولها واقفةً ≈ 1180.
   - الخلفيات: JPG أو WebP، 2400×1600 (أفقي 3:2)، بلا شخصيات.
   ========================================================= */

window.ASSETS = {
  characters: {
    hatem: {
      base:      "assets/characters/hatem/base.webp",      // واقف مبتسم (الورقة المرجعية)
      happy:     null,                                     // null = يُستخدم base
      laugh:     "assets/characters/hatem/laugh.webp",     // يضحك
      proud:     "assets/characters/hatem/proud.webp",     // يقفز فرحًا
      cheer:     "assets/characters/hatem/proud.webp",     // احتفال (نفس صورة القفز)
      sad:       "assets/characters/hatem/sad.webp",
      upset:     "assets/characters/hatem/upset.webp",     // عاقد ذراعيه
      surprised: "assets/characters/hatem/surprised.webp", // مستغرب
      scared:    "assets/characters/hatem/scared.webp",
      cry:       "assets/characters/hatem/cry.webp",
      thinking:  "assets/characters/hatem/thinking.webp"   // يظهر وقت الاختيار
    },
    ward: {
      base:      "assets/characters/ward/base.webp",       // يداها على خصرها (الورقة المرجعية)
      happy:     null,
      laugh:     "assets/characters/ward/proud.webp",      // لا توجد صورة ضحك مستقلة بعد
      proud:     null,                                     // = base: يداها على خصرها «أنا الأكبر!»
      cheer:     "assets/characters/ward/proud.webp",      // احتفال: تفتح ذراعيها
      sad:       "assets/characters/ward/scared.webp",     // مؤقتًا: لا توجد صورة حزن كاملة بعد
      upset:     "assets/characters/ward/upset.webp",
      surprised: null,                                     // مؤقتًا: base + فقاعة «استغراب»
      scared:    "assets/characters/ward/scared.webp",
      cry:       "assets/characters/ward/cry.webp",
      thinking:  "assets/characters/ward/thinking.webp"
    },
    dodo: { base: null, happy: null, sad: null },
    mama: { base: null, happy: null, worried: null }
  },

  /* فقاعات الشعور: وجه صغير فوق الرأس، يُستخدم فقط لتعبير
     ليس له صورة كاملة بعد (يُعرض فوق صورة base). */
  feelings: {
    ward: {
      surprised: "assets/characters/ward/face-surprised.webp"
    }
  },

  backgrounds: {
    meadow: null,   // ساحة الغابة (الافتتاحية وشاشة البداية)
    slide:  null,   // زحليقة ذيل الديناصور
    rocks:  null,   // الصخور والحجر اللامع
    river:  null,   // النهر
    nest:   null    // عش ماما دودو (النهاية)
  }
};
