import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildShareLinks } from "@/lib/share";
import { ArrowRight, Check, Copy, Download, Facebook, Globe2, Image, MessageCircle, Search, Send, Share2, ShieldCheck, Smartphone } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const copy = {
  ar: {
    eyebrow: "سوقنا سوريا على هاتفك", title: "اعثر على الإعلان المناسب أينما كنت.", lead: "تطبيق سوقنا سوريا يسهّل تصفح الإعلانات والبحث وحفظ مسودة إعلان مع الصور والموقع، بالعربية والإنكليزية والتركية.", browse: "تصفّح الإعلانات", test: "اختبار عبر Expo Go", note: "الموقع متاح الآن، أما Expo Go فهو للاختبار المجاني قبل الإطلاق في المتاجر.", section: "ما الذي تستطيع فعله الآن؟", features: [["بحث منظم", "ابحث ضمن العقارات والسيارات والوظائف والمستعمل والخدمات."], ["صور وموقع", "حضّر مسودة إعلان، واختر الصور والموقع التقريبي من هاتفك."], ["ثلاث لغات", "بدّل بين العربية والإنكليزية والتركية مع اتجاه مناسب لكل لغة."], ["تواصل آمن", "تُفتح الرسائل وإدارة الإعلانات في الموقع للمصادقة الآمنة."], ["إبلاغ وحظر", "بلّغ عن محتوى مخالف واحظر المستخدم غير المرغوب به."], ["خصوصيتك", "اطلع على الشروط والخصوصية واطلب الدعم أو حذف البيانات."]], how: "كيف تختبر التطبيق مجانًا؟", steps: [["ثبّت Expo Go", "حمّل Expo Go مجانًا على هاتف Android أو iPhone."], ["امسح رمز QR", "بعد تشغيل نسخة الاختبار من الحاسوب، امسح رمز QR لفتح التطبيق."], ["أرسل ملاحظتك", "جرّب البحث واللغات والمسودة وأرسل أي مشكلة لفريق سوقنا سوريا."]], current: "ابدأ من الموقع الآن", currentBody: "لا تنتظر المتجر: افتح الموقع، استكشف الإعلانات، أو أضف إعلانك مجانًا.", go: "صفحة Expo Go", safety: "استخدم المنصة بمسؤولية. لا ترسل أموالًا أو وثائق حساسة قبل التحقق المباشر من الطرف الآخر.", footer: "سوقنا سوريا — منصة إعلانات مبوبة سورية." },
  en: {
    eyebrow: "Souqna Syria on your phone", title: "Find the right listing wherever you are.", lead: "Souqna Syria makes it easier to browse listings, search, and prepare a listing draft with photos and a location in Arabic, English, and Turkish.", browse: "Browse listings", test: "Test with Expo Go", note: "The website is live now; Expo Go is free testing before app-store release.", section: "What can you do today?", features: [["Organized search", "Search real estate, vehicles, jobs, used goods, and services."], ["Photos and location", "Prepare a listing draft and choose photos and an approximate location."], ["Three languages", "Switch between Arabic, English, and Turkish with the right layout direction."], ["Secure contact", "Messages and listing management open in the website for secure authentication."], ["Report and block", "Report problematic content and block an unwanted user."], ["Your privacy", "Read the terms and privacy policy, then request support or deletion." ]], how: "How do you test the app for free?", steps: [["Install Expo Go", "Download Expo Go for free on an Android phone or iPhone."], ["Scan the QR code", "After starting the test build from a computer, scan its QR code to open the app."], ["Share feedback", "Try search, languages, and drafts, then share issues with Souqna Syria." ]], current: "Start from the website today", currentBody: "Do not wait for the store: explore listings or post a free listing now.", go: "Expo Go page", safety: "Use the platform responsibly. Do not send money or sensitive documents before directly verifying the other party.", footer: "Souqna Syria — Syrian classifieds marketplace." },
  tr: {
    eyebrow: "Souqna Suriye telefonunuzda", title: "Doğru ilanı nerede olursanız olun bulun.", lead: "Souqna Suriye, ilanları gezmeyi, aramayı ve görsellerle konum içeren ilan taslağı hazırlamayı Arapça, İngilizce ve Türkçe olarak kolaylaştırır.", browse: "İlanları keşfet", test: "Expo Go ile test et", note: "Web sitesi şimdi yayında; Expo Go, mağaza yayını öncesi ücretsiz test içindir.", section: "Bugün ne yapabilirsiniz?", features: [["Düzenli arama", "Emlak, araç, iş, ikinci el ve hizmet ilanlarında arama yapın."], ["Görsel ve konum", "İlan taslağı hazırlayın; görsel ve yaklaşık konum seçin."], ["Üç dil", "Arapça, İngilizce ve Türkçe arasında uygun sayfa yönüyle geçiş yapın."], ["Güvenli iletişim", "Mesajlar ve ilan yönetimi güvenli giriş için web sitesinde açılır."], ["Bildir ve engelle", "Sorunlu içeriği bildirin ve istenmeyen kullanıcıyı engelleyin."], ["Gizliliğiniz", "Koşulları ve gizlilik politikasını okuyun; destek veya silme talep edin." ]], how: "Uygulamayı ücretsiz nasıl test edersiniz?", steps: [["Expo Go'yu yükleyin", "Expo Go'yu Android veya iPhone'a ücretsiz yükleyin."], ["QR kodu tarayın", "Test sürümünü bilgisayardan başlattıktan sonra QR kodu tarayın."], ["Geri bildirim paylaşın", "Arama, diller ve taslakları deneyin; sorunları Souqna Suriye ile paylaşın." ]], current: "Bugün web sitesinden başlayın", currentBody: "Mağazayı beklemeyin: ilanları keşfedin veya hemen ücretsiz ilan verin.", go: "Expo Go sayfası", safety: "Platformu sorumlu kullanın. Karşı tarafı doğrudan doğrulamadan para veya hassas belge göndermeyin.", footer: "Souqna Suriye — Suriye ilan platformu." },
} as const;

const icons = [Search, Image, Globe2, MessageCircle, ShieldCheck, ShieldCheck];
const stepIcons = [Download, Smartphone, MessageCircle];
const shareCopy = {
  ar: { title: "شارك سوقنا سوريا", intro: "ساعدنا في الوصول إلى أشخاص أكثر عبر مشاركة هذه الصفحة.", system: "مشاركة", whatsapp: "واتساب", telegram: "تيليغرام", facebook: "فيسبوك", copy: "نسخ الرابط", copied: "تم نسخ الرابط" },
  en: { title: "Share Souqna Syria", intro: "Help us reach more people by sharing this page.", system: "Share", whatsapp: "WhatsApp", telegram: "Telegram", facebook: "Facebook", copy: "Copy link", copied: "Link copied" },
  tr: { title: "Souqna Suriye'yi paylaş", intro: "Bu sayfayı paylaşarak daha fazla kişiye ulaşmamıza yardımcı olun.", system: "Paylaş", whatsapp: "WhatsApp", telegram: "Telegram", facebook: "Facebook", copy: "Bağlantıyı kopyala", copied: "Bağlantı kopyalandı" },
} as const;

export default function AppLanding() {
  const { locale, dir } = useLanguage();
  const text = copy[locale];
  const share = shareCopy[locale];
  const [shareStatus, setShareStatus] = useState("");
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;
  const shareText = locale === "ar" ? "اكتشف سوقنا سوريا للإعلانات المبوبة." : locale === "tr" ? "Souqna Suriye ilan platformunu keşfedin." : "Discover Souqna Syria, a Syrian classifieds marketplace.";
  const shareLinks = buildShareLinks({ url: shareUrl, text: shareText });

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus(share.copied);
    } catch {
      setShareStatus(shareUrl);
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Souqna Syria", text: shareText, url: shareUrl });
        return;
      } catch {
        // Closing the device share dialog should not show an error.
        return;
      }
    }
    await copyLink();
  };

  return <main dir={dir} className="overflow-hidden bg-[#fcfaf6] text-[#284640]">
    <section className="relative isolate overflow-hidden border-b border-[#ebe4d8] bg-[radial-gradient(circle_at_75%_30%,#e0f0e9,transparent_29%),radial-gradient(circle_at_15%_10%,#f9e6bd,transparent_32%),#fcfaf6] py-16 sm:py-24">
      <div className="container grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
        <div className="max-w-2xl">
          <p className="section-kicker">{text.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-black leading-[1.1] tracking-[-.06em] text-[#174941] sm:text-6xl">{text.title}</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#5f716b] sm:text-lg">{text.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/ads"><Button size="lg" className="rounded-xl bg-[#1b5a50] px-6 text-sm hover:bg-[#14473f]"><Search size={17} />{text.browse}</Button></Link><a href="https://expo.dev/go" target="_blank" rel="noreferrer"><Button size="lg" variant="outline" className="rounded-xl border-[#bcd4ca] bg-white px-6 text-sm text-[#265a51]"><Smartphone size={17} />{text.test}</Button></a></div>
          <p className="mt-4 text-xs leading-6 text-[#71817b]">{text.note}</p>
        </div>
        <div className="relative mx-auto w-full max-w-[330px] rounded-[38px] border-[9px] border-[#234d46] bg-[#faf6ed] p-3 shadow-[0_30px_80px_-30px_rgba(20,76,66,.6)]"><div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-[#234d46]" /><div className="overflow-hidden rounded-[26px] bg-[#fffdf8] p-5 pt-10"><img src="/manus-storage/souqna-syria-app-icon_f03af332.png" alt="Souqna Syria" className="mx-auto h-20 w-20 rounded-[22px] shadow-sm" /><p className="mt-5 text-center text-xs font-extrabold text-[#2b554d]">Souqna Syria</p><div className="mt-6 h-10 rounded-xl bg-[#e8f2ec]" /><div className="mt-3 grid grid-cols-2 gap-2"><div className="h-24 rounded-xl bg-[#f5ebd4]" /><div className="h-24 rounded-xl bg-[#e6f0ec]" /></div><div className="mt-3 h-24 rounded-xl bg-[#f1efea]" /></div></div>
      </div>
    </section>
    <section className="container py-16 sm:py-24"><p className="section-kicker">{text.section}</p><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{text.features.map(([title, body], index) => { const Icon = icons[index]; return <article key={title} className="rounded-2xl border border-[#e8e2d8] bg-white p-5 shadow-[0_12px_35px_-28px_rgba(22,63,55,.6)]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9f3ed] text-[#1d695d]"><Icon size={19} /></span><h2 className="mt-4 font-extrabold">{title}</h2><p className="mt-2 text-sm leading-7 text-[#687971]">{body}</p></article>; })}</div></section>
    <section className="border-y border-[#e6dfd4] bg-[#f2f7f3] py-16 sm:py-20"><div className="container"><p className="section-kicker">{text.how}</p><div className="mt-8 grid gap-6 md:grid-cols-3">{text.steps.map(([title, body], index) => { const Icon = stepIcons[index]; return <div key={title} className="relative rounded-2xl bg-white p-6"><span className="text-xs font-black text-[#b0832b]">0{index + 1}</span><Icon className="mt-5 text-[#1d695d]" size={26} /><h2 className="mt-4 font-extrabold">{title}</h2><p className="mt-2 text-sm leading-7 text-[#687971]">{body}</p></div>; })}</div></div></section>
    <section className="container py-16 sm:py-24"><div className="rounded-[28px] bg-[#1b5149] px-6 py-10 text-white sm:px-10"><p className="text-sm font-bold text-[#e8c77e]">{text.current}</p><h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">{text.currentBody}</h2><div className="mt-7 flex flex-wrap gap-3"><Link href="/"><Button size="lg" className="rounded-xl bg-[#f4d487] text-[#244840] hover:bg-[#f8dfa4]"><ArrowRight size={17} />{text.browse}</Button></Link><Link href="/support"><Button size="lg" variant="outline" className="rounded-xl border-white/35 bg-transparent text-white hover:bg-white/10">{locale === "ar" ? "الدعم" : locale === "tr" ? "Destek" : "Support"}</Button></Link></div><div className="mt-9 rounded-2xl border border-white/20 bg-white/10 p-5"><div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="flex items-center gap-2 font-extrabold"><Share2 size={18} />{share.title}</h3><p className="mt-1 text-sm text-white/75">{share.intro}</p></div><Button type="button" onClick={nativeShare} size="sm" className="mt-3 rounded-lg bg-white text-[#1b5149] hover:bg-[#f7f3ea] sm:mt-0"><Share2 size={16} />{share.system}</Button></div><div className="mt-4 flex flex-wrap gap-2"><a href={shareLinks.whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#25D366] px-3 text-sm font-bold text-white transition hover:bg-[#1eae54] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><MessageCircle size={16} />{share.whatsapp}</a><a href={shareLinks.telegram} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#229ED9] px-3 text-sm font-bold text-white transition hover:bg-[#1c87ba] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Send size={16} />{share.telegram}</a><a href={shareLinks.facebook} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#1877F2] px-3 text-sm font-bold text-white transition hover:bg-[#1264cf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Facebook size={16} />{share.facebook}</a><Button type="button" onClick={copyLink} size="sm" variant="outline" className="min-h-10 rounded-lg border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"><Copy size={16} />{share.copy}</Button></div><p aria-live="polite" className="mt-3 min-h-5 text-xs text-[#f4d487]">{shareStatus ? <><Check className="me-1 inline" size={14} />{shareStatus}</> : null}</p></div></div><p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-6 text-[#71817b]">{text.safety}</p></section>
    <footer className="border-t border-[#ece5da] py-8"><div className="container flex flex-col gap-3 text-xs text-[#71817b] sm:flex-row sm:items-center sm:justify-between"><p>{text.footer}</p><div className="flex gap-4 font-bold text-[#41635b]"><Link href="/privacy">{locale === "ar" ? "الخصوصية" : locale === "tr" ? "Gizlilik" : "Privacy"}</Link><Link href="/terms">{locale === "ar" ? "الشروط" : locale === "tr" ? "Koşullar" : "Terms"}</Link></div></div></footer>
  </main>;
}
