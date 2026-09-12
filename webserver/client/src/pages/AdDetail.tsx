import { ListingMap } from "@/components/marketplace/ListingMap";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowRight, ChevronLeft, Flag, Heart, MapPin, MessageCircle, Phone, ShieldCheck, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useRoute } from "wouter";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

function formatPrice(price: string | null, currency: "SYP" | "USD", type: "fixed" | "negotiable" | "on_request", locale: "ar" | "en" | "tr", t: (key: string) => string) {
  if (type === "on_request") return t("detail.onRequest");
  if (!price) return t("detail.contactPrice");
  const localeCode = locale === "ar" ? "ar-SY" : locale === "tr" ? "tr-TR" : "en-US";
  return `${new Intl.NumberFormat(localeCode, { maximumFractionDigits: 0 }).format(Number(price))} ${t(currency === "USD" ? "detail.currencyUsd" : "detail.currencySyp")}${type === "negotiable" ? ` — ${t("detail.negotiable")}` : ""}`;
}

export default function AdDetail() {
  const [, params] = useRoute("/ads/:id");
  const id = Number(params?.id);
  const [selectedImage, setSelectedImage] = useState(0);
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { t, locale, dir, categoryLabel } = useLanguage();
  const detail = trpc.marketplace.detail.useQuery({ id }, { enabled: Number.isInteger(id) && id > 0 });
  const interest = trpc.marketplace.addInterest.useMutation({ onSuccess: data => toast.success(data.created ? t("detail.showInterest") : t("detail.save")), onError: error => toast.error(error.message) });
  const startConversation = trpc.conversations.start.useMutation({ onSuccess: conversation => { if (conversation) navigate(`/messages/${conversation.id}`); }, onError: error => toast.error(error.message) });
  const reportListing = trpc.safety.reportListing.useMutation({ onSuccess: () => toast.success(t("safety.reported")), onError: error => toast.error(error.message || t("safety.actionError")) });

  if (detail.isLoading) return <main className="container page-shell py-10"><div className="h-[520px] animate-pulse rounded-3xl bg-[#eeeae2]" /></main>;
  if (detail.isError || !detail.data) return <main className="container page-shell py-12" dir={dir}><div className="empty-state"><div><p className="font-bold">{t("detail.unavailable")}</p><Link href="/ads" className="mt-4 inline-flex text-xs font-bold text-[#217064]">{t("detail.back")}</Link></div></div></main>;

  const listing = detail.data;
  const selected = listing.images[selectedImage] || listing.images[0];
  const recordInterest = (type: "favorite" | "contact") => { if (!isAuthenticated) return startLogin(); interest.mutate({ listingId: listing.id, type }); };
  const messageOwner = () => { if (!isAuthenticated) return startLogin(); startConversation.mutate({ listingId: listing.id }); };
  const report = () => { if (!isAuthenticated) return startLogin(); const details = window.prompt(t("safety.reportPrompt")); if (details !== null) reportListing.mutate({ listingId: listing.id, reason: "other", details: details || undefined }); };

  return (
    <main className="page-shell bg-[#fcfaf6] py-6 sm:py-9" dir={dir}>
      <div className="container">
        <Link href="/ads" className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-[#65716e] hover:text-[#1a6257]"><ArrowRight size={16} />{t("detail.back")}</Link>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_360px]">
          <section>
            <div className="overflow-hidden rounded-[24px] border border-[#e9e3da] bg-white shadow-sm">
              <div className="relative aspect-[1.45/1] bg-[#e7e8e1] sm:aspect-[1.75/1]">
                {selected ? <img src={selected.url} alt={selected.altText || listing.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[#6a887f]">{t("detail.noImages")}</div>}
                <span className={`absolute top-4 inline-flex items-center gap-1 rounded-full bg-[#fffdf9e8] px-3 py-1.5 text-[11px] font-bold text-[#335953] backdrop-blur ${dir === "rtl" ? "right-4" : "left-4"}`}><Tag size={14} />{categoryLabel(listing.category)}</span>
              </div>
              {listing.images.length > 1 && <div className="flex gap-2 overflow-x-auto p-3">{listing.images.map((image, index) => <button key={image.id} onClick={() => setSelectedImage(index)} className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${selectedImage === index ? "border-[#2f786b]" : "border-transparent"}`}><img src={image.url} alt="" className="h-full w-full object-cover" /></button>)}</div>}
            </div>

            <section className="mt-6 rounded-[22px] border border-[#e9e3da] bg-white p-5 sm:p-7">
              <h2 className="text-base font-extrabold text-[#294640]">{t("detail.heading")}</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-8 text-[#625f58]">{listing.description}</p>
              {Object.keys(listing.attributes).length > 0 && <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3">{Object.entries(listing.attributes).map(([key, value]) => <div key={key} className="rounded-xl bg-[#faf7f0] p-3"><p className="text-[10px] font-bold text-[#91877a]">{t(`detail.attr.${key}`) === `detail.attr.${key}` ? key : t(`detail.attr.${key}`)}</p><p className="mt-1 text-xs font-extrabold text-[#38524d]">{String(value)}</p></div>)}</div>}
            </section>
            {(listing.latitude && listing.longitude) && <section className="mt-6"><h2 className="mb-3 text-sm font-extrabold text-[#294640]">{t("detail.location")}</h2><ListingMap coordinates={{ latitude: Number(listing.latitude), longitude: Number(listing.longitude) }} /></section>}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="rounded-[22px] border border-[#e9e3da] bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold text-[#9b7a31]">{categoryLabel(listing.category)}</p>
              <h1 className="mt-2 text-lg font-extrabold leading-8 text-[#26433e]">{listing.title}</h1>
              <p className="mt-4 text-xl font-extrabold tracking-[-.05em] text-[#1b554d]">{formatPrice(listing.price, listing.currency, listing.priceType, locale, t)}</p>
              <p className="mt-1 text-[11px] text-[#8e8377]">{listing.priceType === "on_request" ? t("detail.onRequest") : listing.priceType === "negotiable" ? t("detail.negotiable") : ""}</p>
              <div className="mt-5 border-t border-[#eee9e2] pt-4 text-xs text-[#736c62]"><p className="flex items-center gap-2"><MapPin size={16} className="text-[#2b7468]" />{[listing.province, listing.area].filter(Boolean).join("، ")}</p></div>
            </section>
            <section className="rounded-[22px] border border-[#dfe7df] bg-[#f5faf6] p-5">
              <p className="text-xs font-extrabold text-[#34554d]">{t("detail.contact")}</p>
              <p className="mt-2 text-[11px] leading-6 text-[#78837d]">{listing.ownerName || listing.contactName} · {t("detail.contactBody")}</p>
              {listing.isPhoneVisible ? <a href={`tel:${listing.contactPhone}`} onClick={() => recordInterest("contact")} className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1b4b46] text-xs font-bold text-white"><Phone size={16} />{listing.contactPhone}</a> : <Button onClick={() => recordInterest("contact")} className="mt-4 h-11 w-full rounded-xl bg-[#1b4b46] text-xs font-bold"><MessageCircle size={16} />{t("detail.showInterest")}</Button>}
              <Button onClick={messageOwner} disabled={startConversation.isPending} variant="outline" className="mt-3 h-10 w-full rounded-xl border-[#cfe0d7] text-xs font-bold text-[#346359] hover:bg-white"><MessageCircle size={16} />{startConversation.isPending ? t("chat.starting") : t("chat.start")}</Button>
              <button onClick={() => recordInterest("favorite")} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#cfe0d7] text-xs font-bold text-[#346359] hover:bg-white"><Heart size={16} />{t("detail.save")}</button>
              <button onClick={report} disabled={reportListing.isPending} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl text-[11px] font-bold text-[#8a6b43] hover:bg-[#fff9ef]"><Flag size={14} />{t("safety.report")}</button>
            </section>
            <p className="flex gap-2 px-1 text-[10px] leading-5 text-[#8a8176]"><ShieldCheck size={16} className="shrink-0 text-[#a47c2f]" />{t("detail.safety")}</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
