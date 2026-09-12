import { CategoryIcon } from "@/components/marketplace/CategoryIcon";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { categories, syrianProvinces, type ListingCategory } from "../../../shared/marketplace";
import { useLanguage } from "@/contexts/LanguageContext";

type Province = (typeof syrianProvinces)[number];
type Filters = { query: string; category: ListingCategory | ""; province: Province | ""; status: "published" | ""; minPrice: string; maxPrice: string };

function initialFilters(location: string): Filters {
  const parameters = new URLSearchParams(location.split("?")[1] || "");
  return {
    query: parameters.get("query") || "",
    category: (parameters.get("category") as ListingCategory) || "",
    province: (parameters.get("province") as Province) || "",
    status: parameters.get("status") === "published" ? "published" : "",
    minPrice: parameters.get("minPrice") || "",
    maxPrice: parameters.get("maxPrice") || "",
  };
}

export default function Ads() {
  const [location, navigate] = useLocation();
  const [filters, setFilters] = useState<Filters>(() => initialFilters(location));
  const [showFilters, setShowFilters] = useState(false);
  const { t, categoryLabel, provinceLabel } = useLanguage();
  const queryInput = useMemo(() => ({
    query: filters.query.trim() || undefined,
    category: filters.category || undefined,
    province: (filters.province || undefined) as Province | undefined,
    status: filters.status || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    limit: 24,
    offset: 0,
  }), [filters]);
  const listings = trpc.marketplace.list.useQuery(queryInput);

  function applyFilters(event?: FormEvent) {
    event?.preventDefault();
    const parameters = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => value && parameters.set(key, value));
    navigate(`/ads${parameters.size ? `?${parameters.toString()}` : ""}`);
    setShowFilters(false);
  }

  function clearFilters() {
    const clean: Filters = { query: "", category: "", province: "", status: "", minPrice: "", maxPrice: "" };
    setFilters(clean);
    navigate("/ads");
  }

  const hasFilters = Boolean(filters.query || filters.category || filters.province || filters.minPrice || filters.maxPrice);

  return (
    <main className="page-shell bg-[#fcfaf6]">
      <section className="border-b border-[#e9e4dc] bg-[#fffdf9] py-8">
        <div className="container">
          <p className="section-kicker">{t("ads.kicker")}</p>
          <h1 className="section-title">{t("ads.title")}</h1>
          <form onSubmit={applyFilters} className="mt-6 flex flex-col gap-2 rounded-[18px] border border-[#e6dfd3] bg-white p-2 shadow-sm md:flex-row">
            <div className="flex flex-1 items-center gap-2 px-2"><Search size={19} className="text-[#2a7165]" /><Input value={filters.query} onChange={event => setFilters(current => ({ ...current, query: event.target.value }))} className="h-10 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0" placeholder={t("ads.placeholder")} /></div>
            <Button type="submit" className="h-10 rounded-[12px] bg-[#1b4b46] px-6 text-xs font-bold text-white hover:bg-[#123e39]">{t("ads.search")}</Button>
            <button type="button" onClick={() => setShowFilters(value => !value)} className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border border-[#e5ded1] px-4 text-xs font-bold text-[#415852] hover:bg-[#faf5ea]"><SlidersHorizontal size={16} />{t("ads.filters")}</button>
          </form>
          {showFilters && (
            <form onSubmit={applyFilters} className="mt-3 grid gap-3 rounded-[18px] border border-[#e8dfcf] bg-[#fdfaf3] p-4 sm:grid-cols-2 lg:grid-cols-6">
              <label className="filter-field">{t("ads.category")}<select value={filters.category} onChange={event => setFilters(current => ({ ...current, category: event.target.value as ListingCategory | "" }))}><option value="">{t("ads.allCategories")}</option>{categories.map(category => <option value={category.id} key={category.id}>{categoryLabel(category.id)}</option>)}</select></label>
              <label className="filter-field">{t("ads.province")}<select value={filters.province} onChange={event => setFilters(current => ({ ...current, province: event.target.value as Province | "" }))}><option value="">{t("ads.allProvinces")}</option>{syrianProvinces.map(province => <option value={province} key={province}>{provinceLabel(province)}</option>)}</select></label>
              <label className="filter-field">{t("ads.status")}<select value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value as "published" | "" }))}><option value="">{t("ads.allAvailable")}</option><option value="published">{t("ads.published")}</option></select></label>
              <label className="filter-field">{t("ads.min")}<input type="number" min="0" value={filters.minPrice} onChange={event => setFilters(current => ({ ...current, minPrice: event.target.value }))} placeholder="500000" /></label>
              <label className="filter-field">{t("ads.max")}<input type="number" min="0" value={filters.maxPrice} onChange={event => setFilters(current => ({ ...current, maxPrice: event.target.value }))} placeholder="3000000" /></label>
              <div className="flex items-end gap-2"><Button type="submit" className="h-10 flex-1 rounded-xl bg-[#1b4b46] text-xs font-bold">{t("ads.apply")}</Button><button type="button" onClick={clearFilters} className="h-10 rounded-xl px-3 text-xs font-bold text-[#867b6e] hover:bg-white">{t("ads.clear")}</button></div>
            </form>
          )}
        </div>
      </section>

      <section className="container py-8 sm:py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-bold text-[#5c6965]">{listings.isLoading ? t("ads.loading") : `${listings.data?.length || 0} ${t("ads.matching")}`}</p>{hasFilters && <button className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9a6c29]" onClick={clearFilters}><X size={14} />{t("ads.remove")}</button>}</div>
        {listings.isError ? (
          <div className="empty-state"><div><Filter className="mx-auto mb-3 text-[#af852e]" /><p className="font-bold">{t("ads.error")}</p><Button onClick={() => listings.refetch()} variant="outline" className="mt-4">{t("ads.retry")}</Button></div></div>
        ) : listings.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[330px] animate-pulse rounded-[20px] bg-[#eeeae2]" />)}</div>
        ) : listings.data?.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{listings.data.map(listing => <ListingCard key={listing.id} listing={listing} />)}</div>
        ) : (
          <div className="empty-state"><div><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f3ead6] text-[#ad802a]"><Search size={25} /></div><p className="font-bold text-[#405450]">{t("ads.emptyTitle")}</p><p className="mt-2 text-xs">{t("ads.emptyBody")}</p><Button variant="outline" className="mt-5 rounded-xl" onClick={clearFilters}>{t("ads.showAll")}</Button></div></div>
        )}
      </section>
    </main>
  );
}
