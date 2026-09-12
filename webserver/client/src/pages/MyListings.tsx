import { ListingCard } from "@/components/marketplace/ListingCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Archive, CirclePause, Edit3, Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { type ListingStatus } from "../../../shared/marketplace";
import { useLanguage } from "@/contexts/LanguageContext";

export default function MyListings() {
  const { isAuthenticated, loading } = useAuth();
  const { t, dir } = useLanguage();
  const [status, setStatus] = useState<ListingStatus | "">("");
  const queryInput = useMemo(() => ({ status: status || undefined }), [status]);
  const listings = trpc.marketplace.mine.useQuery(queryInput, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const refresh = () => { utils.marketplace.mine.invalidate(); utils.marketplace.list.invalidate(); };
  const statusLabel = (value: ListingStatus) => t(`status.${value}`);
  const setStatusMutation = trpc.marketplace.setStatus.useMutation({ onSuccess: () => { toast.success(t("my.updated")); refresh(); }, onError: error => toast.error(error.message) });
  const remove = trpc.marketplace.remove.useMutation({ onSuccess: () => { toast.success(t("my.deleted")); refresh(); }, onError: error => toast.error(error.message) });

  if (!loading && !isAuthenticated) return <main className="container page-shell py-12" dir={dir}><div className="empty-state"><p className="font-bold">{t("my.login")}</p></div></main>;
  return <main className="page-shell bg-[#fcfaf6] py-8 sm:py-10" dir={dir}><div className="container"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="section-kicker">{t("my.kicker")}</p><h1 className="section-title">{t("my.title")}</h1><p className="mt-2 text-xs text-[#82796e]">{t("my.body")}</p></div><Link href="/publish" className="publish-button"><Plus size={17} />{t("my.add")}</Link></div><div className="mt-7 flex items-center justify-between rounded-[18px] border border-[#e9e3da] bg-white p-3"><label className="flex items-center gap-3 text-xs font-bold text-[#596962]">{t("my.status")}<select value={status} onChange={event => setStatus(event.target.value as ListingStatus | "")} className="rounded-lg border border-[#e3ded5] bg-[#fdfbf7] px-3 py-2 text-xs"><option value="">{t("my.all")}</option>{(["published", "paused", "archived", "draft"] as ListingStatus[]).map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label><span className="text-[11px] text-[#998e81]">{listings.data?.length || 0} {t("my.count")}</span></div>{listings.isLoading ? <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-[430px] animate-pulse rounded-[20px] bg-[#eeeae2]" />)}</div> : listings.data?.length ? <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{listings.data.map(listing => <div key={listing.id} className="overflow-hidden rounded-[21px] border border-[#e7e0d6] bg-white"><ListingCard listing={listing} /><div className="flex flex-wrap gap-2 border-t border-[#eee8df] p-3"><span className={`${dir === "rtl" ? "mr-auto" : "ml-auto"} rounded-full bg-[#f2eee6] px-2.5 py-1 text-[10px] font-bold text-[#756c61]`}>{statusLabel(listing.status)}</span><Link href={`/publish/${listing.id}`} className="management-action"><Edit3 size={14} />{t("my.edit")}</Link>{listing.status === "published" ? <button className="management-action" onClick={() => setStatusMutation.mutate({ id: listing.id, status: "paused" })}><CirclePause size={14} />{t("my.pause")}</button> : <button className="management-action" onClick={() => setStatusMutation.mutate({ id: listing.id, status: "published" })}><Loader2 size={14} />{t("my.publish")}</button>}<button className="management-action" onClick={() => setStatusMutation.mutate({ id: listing.id, status: "archived" })}><Archive size={14} />{t("my.archive")}</button><button className="management-action text-[#b84f4b]" onClick={() => { if (window.confirm(t("my.confirmDelete"))) remove.mutate({ id: listing.id }); }}><Trash2 size={14} />{t("my.delete")}</button></div></div>)}</div> : <div className="empty-state mt-6"><div><p className="font-bold text-[#3d544e]">{t("my.empty")}</p><Link href="/publish" className="mt-4 inline-flex rounded-xl bg-[#1b4b46] px-4 py-2 text-xs font-bold text-white">{t("my.first")}</Link></div></div>}</div></main>;
}
