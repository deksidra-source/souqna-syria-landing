import { CategoryIcon } from "@/components/marketplace/CategoryIcon";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowUpLeft, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { categories, categorySubcategories } from "../../../shared/marketplace";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { t, categoryLabel } = useLanguage();
  const latest = trpc.marketplace.list.useQuery({ limit: 6, offset: 0 });

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/ads?query=${encodeURIComponent(query)}` : "/ads");
  }

  return (
    <main className="page-shell overflow-hidden">
      <section className="relative bg-[#fffaf1] pb-16 pt-12 sm:pb-20 sm:pt-16">
        <div className="absolute inset-x-0 top-0 h-[430px] overflow-hidden" aria-hidden="true">
          <div className="absolute -right-24 -top-44 h-[470px] w-[470px] rounded-full bg-[#d9e5d8] blur-3xl opacity-70" />
          <div className="absolute -left-24 top-8 h-[350px] w-[350px] rounded-full bg-[#f5d475] blur-3xl opacity-35" />
          <div className="absolute right-[28%] top-8 h-20 w-20 rotate-12 rounded-[26px] border border-[#e5bf63]/50" />
        </div>
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e7d59e] bg-[#fffdfa]/80 px-4 py-2 text-[11px] font-bold text-[#8e6d25] shadow-sm">
              <Sparkles size={14} /> {t("home.kicker")}
            </p>
            <h1 className="mx-auto max-w-3xl font-[Noto_Kufi_Arabic] text-[clamp(1.75rem,4.7vw,3.65rem)] font-bold leading-[1.5] tracking-[-.08em] text-[#173f3b]">
              {t("home.titleA")} <span className="relative whitespace-nowrap text-[#aa7e27]">{t("home.titleB")}<span className="absolute -bottom-1 right-0 h-[7px] w-full -rotate-1 rounded-full bg-[#f2ce6c]/60" /></span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-[#71695e] sm:text-base">
              {t("home.subtitle")}
            </p>
          </div>

          <form onSubmit={submitSearch} className="mx-auto mt-9 flex max-w-4xl flex-col gap-2 rounded-[22px] border border-[#e4ddd0] bg-white p-2 shadow-[0_18px_42px_rgba(48,54,41,0.12)] sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3 px-3">
              <Search className="shrink-0 text-[#2d7166]" size={22} />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="h-12 w-full border-0 bg-transparent text-sm font-medium text-[#2b3f3a] outline-none placeholder:text-[#a39b90]"
                placeholder={t("home.placeholder")}
                aria-label={t("home.searchAria")}
              />
            </div>
            <Button type="submit" className="h-12 rounded-[15px] bg-[#1c4d47] px-7 text-sm font-bold text-[#fff9ec] hover:bg-[#123e39]">{t("home.search")}</Button>
          </form>

          <div className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-[#8a8176]">
            <span>{t("home.popular")}</span>
            <Link href="/ads?category=real_estate" className="hover:text-[#1f655c]">{t("home.rentals")}</Link>
            <Link href="/ads?category=vehicles" className="hover:text-[#1f655c]">{t("home.usedCars")}</Link>
            <Link href="/ads?category=jobs" className="hover:text-[#1f655c]">{t("home.openJobs")}</Link>
          </div>
        </div>
      </section>

      <section className="container -mt-5 relative z-10">
        <div className="grid grid-cols-2 overflow-hidden rounded-[22px] border border-[#e9e2d5] bg-white shadow-[0_12px_28px_rgba(43,64,58,0.07)] sm:grid-cols-3 lg:grid-cols-4">
          {categories.map(category => (
            <div key={category.id} className="border-b border-l border-[#eee9e1] p-4 sm:p-5">
              <button type="button" onClick={() => setExpandedCategory(current => current === category.id ? null : category.id)} className="group w-full text-right">
              <div className="mb-3 flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#f5f0e6] text-[#1d665b] transition duration-200 group-hover:-translate-y-1 group-hover:bg-[#dbece5]">
                <CategoryIcon category={category.id} className="h-5 w-5" />
              </div><span className="text-lg font-bold text-[#2b7567]">{expandedCategory === category.id ? "−" : "+"}</span></div>
              <h2 className="text-xs font-extrabold text-[#29443f]">{categoryLabel(category.id)}</h2>
              <p className="mt-1 hidden text-[10px] leading-5 text-[#8c8378] lg:block">{category.description}</p>
              </button>
              {expandedCategory === category.id && <div className="mt-3 flex flex-wrap gap-2 border-t border-[#eee9e1] pt-3">{categorySubcategories[category.id].map(sub => <Link key={sub} href={`/ads?category=${category.id}&query=${encodeURIComponent(sub)}`} className="rounded-full bg-[#f3f7f2] px-3 py-1.5 text-[11px] font-bold text-[#487168] hover:bg-[#dcece5]">{sub}</Link>)}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="container py-16 sm:py-20">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="section-kicker">{t("home.new")}</p>
            <h2 className="section-title">{t("home.latest")}</h2>
          </div>
          <Link href="/ads" className="hidden items-center gap-1 text-xs font-extrabold text-[#247264] hover:text-[#154e46] sm:inline-flex">{t("home.all")} <ArrowLeft size={16} /></Link>
        </div>
        {latest.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[335px] animate-pulse rounded-[20px] bg-[#eeeae2]" />)}</div>
        ) : latest.data?.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{latest.data.map(listing => <ListingCard key={listing.id} listing={listing} />)}</div>
        ) : (
          <div className="empty-state px-6"><div><p className="font-bold text-[#3c504c]">{t("home.emptyTitle")}</p><p className="mt-2 text-xs">{t("home.emptyBody")}</p><Link href="/publish" className="mt-5 inline-flex rounded-xl bg-[#1c4d47] px-4 py-2 text-xs font-bold text-white">{t("home.add")}</Link></div></div>
        )}
        <Link href="/ads" className="mt-6 inline-flex items-center gap-1 text-xs font-extrabold text-[#247264] sm:hidden">{t("home.all")} <ArrowLeft size={16} /></Link>
      </section>

      <section className="border-y border-[#e9e2d8] bg-[#f3efe5]">
        <div className="container grid gap-7 py-10 sm:grid-cols-3 sm:gap-0 sm:py-12">
          {[
            [ShieldCheck, t("home.safeTitle"), t("home.safeBody")],
            [MapPin, t("home.localTitle"), t("home.localBody")],
            [ArrowUpLeft, t("home.fastTitle"), t("home.fastBody")],
          ].map(([Icon, title, body], index) => {
            const FeatureIcon = Icon as typeof ShieldCheck;
            return <div className="flex gap-3 sm:border-l sm:border-[#ddd4c3] sm:px-8 first:pr-0 last:border-l-0 last:pl-0" key={title as string}><div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#fffaf0] text-[#af852e]"><FeatureIcon size={20} /></div><div><h3 className="text-xs font-extrabold text-[#31504b]">{title as string}</h3><p className="mt-1 text-[11px] leading-6 text-[#7d766d]">{body as string}</p></div></div>;
          })}
        </div>
      </section>

      <footer className="container flex flex-col gap-4 py-8 text-[10px] font-medium text-[#887f74] sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {t("brand.name")} {t("brand.country")}. {t("footer")}</p>
        <div className="flex gap-4"><Link href="/ads">{t("nav.browse")}</Link><Link href="/publish">{t("nav.publish")}</Link><Link href="/my-listings">{t("nav.myListings")}</Link></div>
      </footer>
    </main>
  );
}
