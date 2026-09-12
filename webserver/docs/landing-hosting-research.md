# مقارنة استضافة صفحة الهبوط

## القرار المقترح

تُنشأ صفحة الهبوط أولًا ضمن الاستضافة الحالية للمنصة على المسار `/app`، لأن الموقع يعمل بالفعل على نطاق ثابت ولا يحتاج حسابًا خارجيًا أو نقل قاعدة البيانات أو المصادقة. يبقى GitHub Pages خيارًا مجانيًا منفصلًا للنسخة الثابتة فقط، بينما يكون Vercel خيارًا اختياريًا لاحقًا عند الحاجة إلى معاينات مرتبطة بمستودع GitHub.

| الخيار | ملاءمته للصفحة | ملاحظة عملية |
|---|---|---|
| الاستضافة الحالية | الأفضل الآن | لا حساب جديد ولا رابط إضافي؛ الصفحة تتصل مباشرة بالموقع المنشور |
| GitHub Pages | جيد لنسخة ثابتة مستقلة | يستضيف HTML/CSS/JS من مستودع GitHub؛ في GitHub Free يجب أن يكون المستودع عامًا عند استخدام Pages [1] [2] |
| Vercel Hobby | صالح للاختبارات الشخصية وغير التجارية | النشر من GitHub تلقائي عند كل push، لكن وثائق Vercel تصف خطة Hobby بأنها للاستخدام الشخصي وغير التجاري [3] [4] |

## حدود الخصوصية

لا يوضع في مستودع GitHub أي سر أو ملف بيئة أو مفاتيح أو بيانات مستخدمين. تزور GitHub Pages سجلّات IP لأغراض الأمان كما تذكر وثائقها؛ يجب أن تظل صفحة الهبوط بسيطة ولا تجمع بيانات زوار جديدة ما لم يعتمد المالك سياسة خصوصية مناسبة. [1]

## المراجع

[1] [GitHub Pages: What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)  
[2] [GitHub Pages: Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)  
[3] [Vercel: Deploying GitHub Projects](https://vercel.com/docs/git/vercel-for-github)  
[4] [Vercel Pricing](https://vercel.com/pricing)
