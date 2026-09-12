# رفع صفحة «سوقنا سوريا» إلى GitHub Pages — خطوات بسيطة

> تحتاج فقط إلى حساب GitHub، وملف ZIP الذي أرسلته لك. لا تكتب أي أوامر ولا تشارك كلمة مرورك مع أي شخص.

## قبل البدء

نزّل الملف المسمى `souqna-syria-landing-github-pages.zip` إلى هاتفك أو حاسوبك، ثم فك ضغطه. بعد فك الضغط ستجد خمسة ملفات: `index.html` و`styles.css` و`.nojekyll` و`README.md` و`vercel.json`.

## الخطوة 1: إنشاء مستودع جديد

1. افتح [GitHub](https://github.com) من متصفحك الشخصي وسجّل الدخول إلى حساب **deksidra-source**.
2. اضغط صورة الحساب، ثم اختر **Your repositories**، ثم زر **New**.
3. في **Repository name** اكتب بالضبط: `souqna-syria-landing`.
4. اختر **Public**، ثم اضغط **Create repository**.

> لا تستخدم المستودع الحالي الذي اسمه `-`؛ اتركه كما هو وأنشئ مستودعًا جديدًا للصفحة.

## الخطوة 2: رفع ملفات الصفحة

1. داخل المستودع الجديد اضغط **Add file** ثم **Upload files**.
2. اختر الملفات الخمسة التي ظهرت بعد فك ضغط ZIP، أو اسحبها جميعًا إلى مربع الرفع.
3. تأكد أن ملف `index.html` ظاهر ضمن القائمة؛ هو الملف الذي تفتحه GitHub Pages أولًا.
4. انزل إلى الأسفل واضغط **Commit changes**.

لا ترفع كلمة مرور أو ملف `.env` أو صورًا شخصية أو بيانات مستخدمين. الحزمة المرسلة لك لا تحتوي على هذه الأشياء.

## الخطوة 3: تفعيل GitHub Pages

1. داخل المستودع اضغط تبويب **Settings**.
2. من القائمة الجانبية اختر **Pages**.
3. في قسم **Build and deployment**، اختر **Deploy from a branch**.
4. اختر الفرع **main**، ثم اختر المجلد **/(root)**.
5. اضغط **Save**.

تذكر وثائق GitHub أن النشر قد يحتاج حتى عشر دقائق بعد رفع التغييرات. بعد ذلك تظهر رسالة في نفس صفحة Pages تحتوي رابط الموقع. [1]

## الرابط المتوقع

إذا استخدمت الاسم المقترح للمستودع، سيكون الرابط غالبًا:

`https://deksidra-source.github.io/souqna-syria-landing/`

افتحه على هاتفك وتأكد أن الأيقونة والأزرار تظهر. إذا ظهر خطأ 404، انتظر عشر دقائق ثم افتح **Settings → Pages** وتأكد أن النشر يقرأ من `main` و`/(root)` وأن `index.html` موجود في المستوى الأول للمستودع.

## إن كنت تستخدم الهاتف فقط

استخدم Chrome أو Safari لفتح موقع GitHub وليس التطبيق فقط. إذا لم تجد **Settings** أو **Pages**، افتح قائمة المتصفح واختر **طلب موقع سطح المكتب**، ثم عد إلى المستودع واتبع الخطوة 3.

## بعد النجاح

أرسل لي رابط GitHub Pages النهائي، وسأفحص الصفحة وأتأكد من أنها تفتح بصورة صحيحة. يمكنك بعد ذلك نشر هذا الرابط في Facebook وTelegram وWhatsApp مع رابط المنصة الرئيسية.

## المراجع

[1] [GitHub Docs: Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)  
[2] [GitHub Docs: What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
