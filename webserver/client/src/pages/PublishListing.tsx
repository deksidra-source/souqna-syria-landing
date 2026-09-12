import { CategoryIcon } from "@/components/marketplace/CategoryIcon";
import { ListingMap } from "@/components/marketplace/ListingMap";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ImagePlus, Loader2, MapPin, Trash2, UploadCloud } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";
import { categories, categoryFields, syrianProvinces, type ListingCategory } from "../../../shared/marketplace";
import { useLanguage } from "@/contexts/LanguageContext";

type ImageDraft = { name: string; type: string; dataUrl: string };
type Province = (typeof syrianProvinces)[number];
type FormState = { category: ListingCategory; title: string; description: string; province: Province; area: string; price: string; currency: "SYP" | "USD"; priceType: "fixed" | "negotiable" | "on_request"; contactName: string; contactPhone: string; isPhoneVisible: boolean; latitude: number | null; longitude: number | null; attributes: Record<string, string | number | boolean> };

const blankForm: FormState = { category: "real_estate", title: "", description: "", province: "دمشق", area: "", price: "", currency: "SYP", priceType: "fixed", contactName: "", contactPhone: "", isPhoneVisible: true, latitude: null, longitude: null, attributes: {} };
const optionKey: Record<string, string> = { "للبيع": "sale", "للإيجار": "rent", "شقة": "apartment", "منزل": "house", "أرض": "land", "مكتب": "office", "محل": "shop", "دوام كامل": "fullTime", "دوام جزئي": "partTime", "عن بعد": "remote", "تدريب": "internship", "مبتدئ": "beginner", "متوسط": "intermediate", "خبير": "expert", "جديد": "new", "مستعمل بحالة ممتازة": "excellentUsed", "مستعمل": "used", "ضمن المحافظة": "inProvince", "عدة محافظات": "multiProvince" };

export default function PublishListing() {
  const [, routeParams] = useRoute("/publish/:id");
  const editingId = Number(routeParams?.id);
  const isEditing = Number.isInteger(editingId) && editingId > 0;
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const { t, dir, categoryLabel, provinceLabel } = useLanguage();
  const [form, setForm] = useState<FormState>(blankForm);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [imagesChanged, setImagesChanged] = useState(false);
  const [preparedFor, setPreparedFor] = useState<number | null>(null);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const mine = trpc.marketplace.mine.useQuery({}, { enabled: isAuthenticated && isEditing });
  const existing = mine.data?.find(item => item.id === editingId);
  const utils = trpc.useUtils();
  const create = trpc.marketplace.create.useMutation({ onSuccess: () => { utils.marketplace.mine.invalidate(); utils.marketplace.list.invalidate(); toast.success(t("publish.created")); navigate("/my-listings"); }, onError: error => toast.error(error.message) });
  const update = trpc.marketplace.update.useMutation({ onSuccess: () => { utils.marketplace.mine.invalidate(); utils.marketplace.list.invalidate(); toast.success(t("publish.updated")); navigate("/my-listings"); }, onError: error => toast.error(error.message) });
  const acceptPolicies = trpc.safety.acceptPolicies.useMutation({ onError: error => toast.error(error.message) });

  useEffect(() => {
    if (!existing || preparedFor === existing.id) return;
    setForm({ category: existing.category, title: existing.title, description: existing.description, province: existing.province as Province, area: existing.area || "", price: existing.price || "", currency: existing.currency, priceType: existing.priceType, contactName: existing.contactName, contactPhone: existing.contactPhone, isPhoneVisible: existing.isPhoneVisible, latitude: existing.latitude ? Number(existing.latitude) : null, longitude: existing.longitude ? Number(existing.longitude) : null, attributes: existing.attributes || {} });
    setPreparedFor(existing.id);
  }, [existing, preparedFor]);

  const dynamicFields = useMemo(() => categoryFields[form.category], [form.category]);
  const busy = create.isPending || update.isPending || acceptPolicies.isPending;
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(current => ({ ...current, [key]: value }));

  async function onImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const valid = files.slice(0, 8).filter(file => file.type.startsWith("image/") && file.size <= 2_000_000);
    if (valid.length !== files.length) toast.error(t("publish.imageLimit"));
    const next = await Promise.all(valid.map(file => new Promise<ImageDraft>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: String(reader.result) }); reader.onerror = reject; reader.readAsDataURL(file); })));
    setImages(current => [...current, ...next].slice(0, 8));
    setImagesChanged(true);
    event.target.value = "";
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated) return toast.error(t("publish.login"));
    const normalizedAttributes = Object.fromEntries(Object.entries(form.attributes).filter(([, value]) => String(value).trim() !== ""));
    const payload = { ...form, status: "published" as const, area: form.area || null, price: form.price ? Number(form.price) : null, latitude: form.latitude, longitude: form.longitude, attributes: normalizedAttributes };
    if (isEditing) update.mutate({ ...payload, id: editingId, images: imagesChanged ? images : undefined });
    else {
      if (!acceptedPolicies) return toast.error(t("safety.acceptRequired"));
      acceptPolicies.mutate({ policyVersion: "2026-08-26" }, { onSuccess: () => create.mutate({ ...payload, images }) });
    }
  }

  const localizeOption = (value: string) => optionKey[value] ? t(`publish.option.${optionKey[value]}`) : value;
  const fieldPlaceholder = (key: string, fallback?: string) => key === "make" || key === "model" || key === "serviceType" ? t(`publish.placeholder.${key}`) : fallback || "";

  if (!loading && !isAuthenticated) return <main className="container page-shell py-12" dir={dir}><div className="empty-state"><div><p className="font-bold">{t("publish.login")}</p><Button className="mt-4 rounded-xl bg-[#1c4d47]" onClick={() => navigate("/")}>{t("publish.home")}</Button></div></div></main>;
  if (isEditing && mine.isLoading) return <main className="container page-shell py-10"><div className="h-[520px] animate-pulse rounded-3xl bg-[#eeeae2]" /></main>;
  if (isEditing && !existing) return <main className="container page-shell py-12" dir={dir}><div className="empty-state"><p className="font-bold">{t("publish.notFound")}</p></div></main>;

  return (
    <main className="page-shell bg-[#fcfaf6] py-8 sm:py-10" dir={dir}>
      <div className="container max-w-5xl">
        <p className="section-kicker">{isEditing ? t("publish.kickerEdit") : t("publish.kickerCreate")}</p>
        <h1 className="section-title">{isEditing ? t("publish.titleEdit") : t("publish.titleCreate")}</h1>
        <p className="mt-2 text-xs leading-6 text-[#777167]">{t("publish.intro")}</p>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <section className="rounded-[22px] border border-[#e9e3da] bg-white p-5 sm:p-6"><h2 className="text-sm font-extrabold text-[#304943]">{t("publish.stepCategory")}</h2><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{categories.map(category => <button type="button" onClick={() => setForm(current => ({ ...current, category: category.id, attributes: {} }))} className={`rounded-xl border p-3 transition ${dir === "rtl" ? "text-right" : "text-left"} ${form.category === category.id ? "border-[#2c776b] bg-[#edf7f1] text-[#1c5a50]" : "border-[#e9e3da] text-[#6f756c] hover:bg-[#faf8f2]"}`} key={category.id}><CategoryIcon category={category.id} className="mb-2 h-5 w-5" /><span className="block text-[11px] font-extrabold">{categoryLabel(category.id)}</span></button>)}</div></section>
          <section className="rounded-[22px] border border-[#e9e3da] bg-white p-5 sm:p-6"><h2 className="text-sm font-extrabold text-[#304943]">{t("publish.stepDetails")}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="form-field sm:col-span-2">{t("publish.fieldTitle")}<input required minLength={8} value={form.title} onChange={event => setField("title", event.target.value)} placeholder={t("publish.titlePlaceholder")} /></label><label className="form-field sm:col-span-2">{t("publish.fieldDescription")}<textarea required minLength={20} value={form.description} onChange={event => setField("description", event.target.value)} placeholder={t("publish.descriptionPlaceholder")} rows={5} /></label><label className="form-field">{t("publish.fieldProvince")}<select value={form.province} onChange={event => setField("province", event.target.value as Province)}>{syrianProvinces.map(province => <option key={province} value={province}>{provinceLabel(province)}</option>)}</select></label><label className="form-field">{t("publish.fieldArea")}<input value={form.area} onChange={event => setField("area", event.target.value)} placeholder={t("publish.areaPlaceholder")} /></label>{dynamicFields.map(field => <label className="form-field" key={field.key}>{t(`publish.field.${field.key}`)}{field.type === "select" ? <select value={String(form.attributes[field.key] || "")} onChange={event => setField("attributes", { ...form.attributes, [field.key]: event.target.value })}><option value="">{t("publish.choose")}</option>{field.options?.map(option => <option key={option} value={option}>{localizeOption(option)}</option>)}</select> : <input type={field.type} value={String(form.attributes[field.key] || "")} onChange={event => setField("attributes", { ...form.attributes, [field.key]: field.type === "number" && event.target.value ? Number(event.target.value) : event.target.value })} placeholder={fieldPlaceholder(field.key, field.placeholder)} />}</label>)}</div></section>
          <section className="rounded-[22px] border border-[#e9e3da] bg-white p-5 sm:p-6"><h2 className="text-sm font-extrabold text-[#304943]">{t("publish.stepPrice")}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label className="form-field">{t("publish.fieldPriceType")}<select value={form.priceType} onChange={event => setField("priceType", event.target.value as FormState["priceType"])}>{(["fixed", "negotiable", "on_request"] as FormState["priceType"][]).map(value => <option value={value} key={value}>{t(`publish.price.${value === "on_request" ? "onRequest" : value}`)}</option>)}</select></label><label className="form-field">{t("publish.fieldPrice")}<input disabled={form.priceType === "on_request"} required={form.priceType === "fixed"} type="number" min="0" value={form.price} onChange={event => setField("price", event.target.value)} placeholder={t("publish.pricePlaceholder")} /></label><label className="form-field">{t("publish.fieldCurrency")}<select value={form.currency} onChange={event => setField("currency", event.target.value as "SYP" | "USD")}><option value="SYP">{t("publish.currencySyp")}</option><option value="USD">{t("publish.currencyUsd")}</option></select></label><label className="form-field">{t("publish.fieldContactName")}<input required value={form.contactName} onChange={event => setField("contactName", event.target.value)} placeholder={user?.name || t("publish.namePlaceholder")} /></label><label className="form-field">{t("publish.fieldPhone")}<input required value={form.contactPhone} onChange={event => setField("contactPhone", event.target.value)} placeholder="09xx xxx xxx" inputMode="tel" /></label><label className="flex items-end gap-3 rounded-xl border border-[#eae4db] px-3 py-3 text-xs font-bold text-[#53645f]"><input type="checkbox" checked={form.isPhoneVisible} onChange={event => setField("isPhoneVisible", event.target.checked)} className="h-4 w-4 accent-[#1b685c]" />{t("publish.showPhone")}</label></div></section>
          <section className="rounded-[22px] border border-[#e9e3da] bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-extrabold text-[#304943]">{t("publish.stepImages")}</h2><p className="mt-1 text-[10px] text-[#8a8277]">{t("publish.imagesHelp")}</p></div><label className="inline-flex h-10 items-center gap-2 rounded-xl border border-dashed border-[#79a79c] bg-[#f4faf6] px-4 text-xs font-bold text-[#27695f]"><UploadCloud size={17} />{t("publish.selectImages")}<input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={onImagesChange} /></label></div>{images.length > 0 ? <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">{images.map((image, index) => <div key={`${image.name}-${index}`} className="relative aspect-square overflow-hidden rounded-xl"><img className="h-full w-full object-cover" src={image.dataUrl} alt={t("publish.previewAlt")} /><button type="button" onClick={() => { setImages(current => current.filter((_, itemIndex) => itemIndex !== index)); setImagesChanged(true); }} className={`absolute top-1 grid h-6 w-6 place-items-center rounded-full bg-[#533f3bd9] text-white ${dir === "rtl" ? "left-1" : "right-1"}`} aria-label={t("publish.deleteImage")}><Trash2 size={13} /></button></div>)}</div> : <div className="mt-4 grid min-h-28 place-items-center rounded-xl border border-dashed border-[#ded6ca] bg-[#fdfbf7] text-center text-xs text-[#9b9287]"><div><ImagePlus className="mx-auto mb-2 text-[#b38b36]" /><p>{t("publish.addClearImages")}</p></div></div>}</section>
          <section className="rounded-[22px] border border-[#e9e3da] bg-white p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><MapPin size={18} className="text-[#2b7468]" /><div><h2 className="text-sm font-extrabold text-[#304943]">{t("publish.stepLocation")}</h2><p className="mt-1 text-[10px] text-[#8a8277]">{t("publish.locationHelp")}</p></div></div><ListingMap editable coordinates={{ latitude: form.latitude, longitude: form.longitude }} onChange={({ latitude, longitude }) => setForm(current => ({ ...current, latitude, longitude }))} /></section>
          <div className="flex flex-col-reverse justify-between gap-3 rounded-[20px] bg-[#edf4ef] p-4 sm:flex-row sm:items-center"><div><p className="text-[11px] leading-6 text-[#687a74]">{t("publish.finishNote")}</p>{!isEditing && <label className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#456159]"><input type="checkbox" checked={acceptedPolicies} onChange={event => setAcceptedPolicies(event.target.checked)} className="h-4 w-4 accent-[#1b685c]" />{t("safety.acceptTerms")} <Link className="underline" href="/terms">{dir === "rtl" ? "الشروط" : "Terms"}</Link> · <Link className="underline" href="/privacy">{dir === "rtl" ? "الخصوصية" : "Privacy"}</Link></label>}</div><Button disabled={busy} type="submit" className="h-11 shrink-0 rounded-xl bg-[#1b4b46] px-6 text-xs font-bold hover:bg-[#123e39]">{busy && <Loader2 className="animate-spin" size={16} />}{isEditing ? t("publish.save") : t("publish.submit")}</Button></div>
        </form>
      </div>
    </main>
  );
}
