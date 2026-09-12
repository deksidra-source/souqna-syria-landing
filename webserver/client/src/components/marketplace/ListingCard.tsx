import { ArrowLeft, MapPin, Tag } from "lucide-react";
import { Link } from "wouter";
import { categoryLabel, type ListingCategory } from "../../../../shared/marketplace";
import { CategoryIcon } from "./CategoryIcon";
import { useLanguage, type Locale } from "@/contexts/LanguageContext";

export type ListingPreview = {
  id: number;
  category: ListingCategory;
  title: string;
  province: string;
  area: string | null;
  price: string | null;
  currency: "SYP" | "USD";
  priceType: "fixed" | "negotiable" | "on_request";
  createdAt: Date | string;
  images: Array<{ id: number; url: string; altText: string | null }>;
};

function formatPrice(listing: ListingPreview, locale: Locale, t: (key: string) => string) {
  if (listing.priceType === "on_request") return t("card.onRequest");
  if (!listing.price) return t("card.contactPrice");
  const amount = new Intl.NumberFormat(locale === "ar" ? "ar-SY" : locale === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: 0 }).format(Number(listing.price));
  const currency = listing.currency === "USD" ? "$" : locale === "ar" ? "ل.س" : "SYP";
  return `${amount} ${currency}${listing.priceType === "negotiable" ? ` · ${t("card.negotiable")}` : ""}`;
}

function dateLabel(value: Date | string, locale: Locale, t: (key: string) => string) {
  const date = new Date(value);
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (days === 0) return t("card.today");
  if (days === 1) return t("card.yesterday");
  if (days < 7) return `${t("card.ago")} ${days} ${t("card.days")}`;
  return date.toLocaleDateString(locale === "ar" ? "ar-SY" : locale === "tr" ? "tr-TR" : "en-US", { day: "numeric", month: "short" });
}

export function ListingCard({ listing }: { listing: ListingPreview }) {
  const image = listing.images[0];
  const { t, locale, categoryLabel } = useLanguage();
  return (
    <article className="listing-card group">
      <div className="listing-image-shell">
        {image ? (
          <img className="listing-image" src={image.url} alt={image.altText || listing.title} />
        ) : (
          <div className="listing-image-placeholder">
            <CategoryIcon category={listing.category} className="h-10 w-10" />
          </div>
        )}
        <span className="category-badge"><Tag size={13} />{categoryLabel(listing.category)}</span>
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <div className="mb-2 flex items-start justify-between gap-3">
          <p className="listing-price">{formatPrice(listing, locale, t)}</p>
          <time className="listing-time">{dateLabel(listing.createdAt, locale, t)}</time>
        </div>
        <Link href={`/ads/${listing.id}`} className="listing-title">{listing.title}</Link>
        <p className="listing-location"><MapPin size={15} />{[listing.province, listing.area].filter(Boolean).join("، ")}</p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="listing-meta">{t("card.verified")}</span>
          <Link href={`/ads/${listing.id}`} className="listing-link">{t("card.details")} <ArrowLeft size={15} /></Link>
        </div>
      </div>
    </article>
  );
}
