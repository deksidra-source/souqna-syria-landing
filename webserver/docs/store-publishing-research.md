# مصادر ومتطلبات النشر الرسمية — 26 أغسطس 2026

## Expo / EAS

- النشر إلى المتاجر يتطلب ملف **AAB** موقّعًا لأندرويد وملف **IPA** موقّعًا لـ iOS. يمكن لـ EAS Submit رفعهما إلى Google Play Console وApp Store Connect، لكنه لا يدير بيانات صفحة المتجر أو لقطات الشاشة أو ملاحظات الإصدار. المصدر: https://docs.expo.dev/deploy/submit-to-app-stores/
- أول رفع Android عبر EAS Submit يذهب افتراضيًا إلى الاختبار الداخلي، بينما يصل رفع iOS إلى App Store Connect ثم TestFlight؛ ولا يصبح إصدارًا عامًا تلقائيًا. المصدر: https://docs.expo.dev/deploy/submit-to-app-stores/

## Google Play

- حساب الناشر الشخصي يحتاج اسمًا وعنوانًا قانونيين وبريدَي اتصال/مطوّر ورقم هاتف مع تحقق؛ حساب المؤسسة يحتاج كذلك رقم D-U-N-S وبيانات المؤسسة. المصدر: https://support.google.com/googleplay/android-developer/answer/13628312?hl=en
- يتطلب Play Console سياسة خصوصية وقسم Data Safety دقيقًا يشمل البيانات التي تجمعها المكتبات وSDKs؛ حتى التطبيقات التي لا تجمع بيانات يجب أن تكمل النموذج وتضع رابط سياسة خصوصية. المصدر: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
- للحسابات الشخصية المنشأة بعد 13 نوفمبر 2023، يلزم اختبار مغلق فيه 12 مختبرًا منضمًا بصورة متواصلة لمدة 14 يومًا قبل طلب إتاحة الإنتاج. المصدر: https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
- يتطلب Play Console بيانات تعريف قانونية قابلة للتحقق، وبيانات التطبيق، وسياسة خصوصية وData Safety، وبيانات دخول تجريبية أو موارد مراجعة عند وجود مصادقة. المصدر: https://support.google.com/googleplay/android-developer/answer/10788890?hl=en

## Apple

- اعتبارًا من 28 أبريل 2026، يجب أن تُبنى تطبيقات iOS/iPadOS المرفوعة إلى App Store Connect باستخدام iOS/iPadOS 26 SDK أو أحدث. المصدر: https://developer.apple.com/app-store/submitting/
- صفحة App Store تتطلب الاسم والأيقونة والوصف ولقطات الشاشة والكلمات المفتاحية؛ ويجب إدخال تفاصيل خصوصية التطبيق في App Store Connect. المصدر: https://developer.apple.com/app-store/submitting/
- Apple تطلب روابط دعم وخصوصية فعالة، وحساب اختبار صالح وبيانات دخوله عند وجود مصادقة، مع ملاحظات مراجعة واضحة. المصدر: https://developer.apple.com/distribute/app-review/
- يتعين ألا يحتوي الإصدار المرسل للمراجعة على محتوى مؤقت أو مسارات معطلة أو وظائف ناقصة. المصدر: https://developer.apple.com/distribute/app-review/

## الإعلانات والدردشة باعتبارها محتوى ينشئه المستخدم

Apple تطلب من التطبيقات التي تحتوي على محتوى ينشئه المستخدم توفير ترشيح للمحتوى المسيء وآلية إبلاغ واستجابة في الوقت المناسب وحظر المستخدمين المسيئين ومعلومات اتصال منشورة. المصدر: https://developer.apple.com/app-store/review/guidelines/

Google Play تطلب شروط استخدام قبل إنشاء أو رفع المحتوى، وإبلاغًا وحظرًا داخل التطبيقين، ومراقبة مستمرة واتخاذ إجراء مناسب على المستخدمين أو المحتوى المخالف. تنطبق هذه المتطلبات مباشرةً على الإعلانات والدردشة الثنائية في سوقنا سوريا. المصدر: https://support.google.com/googleplay/android-developer/answer/9876937?hl=en
