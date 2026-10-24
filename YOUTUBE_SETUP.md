# تفعيل استيراد قوائم YouTube تلقائيًا

الكود يضيف endpoint على Cloudflare Pages Functions في `/api/playlist`. لا يعمل هذا الجزء على GitHub Pages وحده، لأن GitHub Pages يستضيف ملفات ثابتة ولا يشغّل وظائف خادم.

## 1) إنشاء مفتاح YouTube Data API
1. افتح https://console.cloud.google.com/
2. أنشئ مشروعًا أو اختر مشروعًا موجودًا.
3. من APIs & Services > Library فعّل **YouTube Data API v3**.
4. من APIs & Services > Credentials أنشئ **API key**.
5. من إعدادات المفتاح، قيّده إلى YouTube Data API v3. لا تضع المفتاح داخل `index.html` ولا تنشره في GitHub.

## 2) نشر الموقع مع الوظيفة
1. افتح https://dash.cloudflare.com/ وسجّل الدخول.
2. اختر Workers & Pages > Create > Pages > Connect to Git.
3. اختر مستودع `hussein11982/madrasti`.
4. استخدم مجلد الجذر `/` كـ build output directory، واترك أمر البناء فارغًا لموقع HTML ثابت.
5. بعد النشر، افتح إعدادات المشروع > Settings > Variables and Secrets وأضف متغيرًا سريًا باسم `YOUTUBE_API_KEY`، والصق قيمة المفتاح فيه.
6. أعد النشر. يجب أن يصبح endpoint متاحًا على `https://اسم-الموقع.pages.dev/api/playlist?url=...`.

## ما الذي يفعله الاستيراد؟
- يقبل رابط قائمة تشغيل YouTube العامة أو غير المدرجة.
- يجلب عناصر القائمة على دفعات، ويقرأ تاريخ النشر المتاح لكل فيديو.
- يرتب الأقدم أولًا ويضيف عنوان الفيديو ورابطه إلى الفصل.
- المحاضرات الخاصة أو المحذوفة لا يمكن استيرادها.
- تظل بيانات الدراسة محفوظة محليًا في المتصفح كما في النسخة الحالية.

ملاحظة: YouTube API لها حصة استخدام يومية. لا تشارك المفتاح، وراقب الاستخدام من Google Cloud Console.
