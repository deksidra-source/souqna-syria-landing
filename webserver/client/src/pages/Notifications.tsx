import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCheck, Heart, Megaphone, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

const iconByType = { listing_created: Megaphone, listing_status_changed: CheckCheck, new_interest: Heart, new_message: MessageCircle };

export default function Notifications() {
  const { isAuthenticated, loading } = useAuth();
  const notifications = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const { t, locale } = useLanguage();
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => utils.notifications.list.invalidate(), onError: error => toast.error(error.message) });
  if (!loading && !isAuthenticated) return <main className="container page-shell py-12"><div className="empty-state"><p className="font-bold">{t("notifications.login")}</p></div></main>;
  const unread = notifications.data?.filter(notification => !notification.isRead).length || 0;
  return <main className="page-shell bg-[#fcfaf6] py-8 sm:py-10"><div className="container max-w-3xl"><div className="flex items-end justify-between gap-4"><div><p className="section-kicker">{t("notifications.kicker")}</p><h1 className="section-title">{t("notifications.title")}</h1><p className="mt-2 text-xs text-[#82796e]">{t("notifications.body")}</p></div>{unread > 0 && <Button onClick={() => markRead.mutate({})} variant="outline" className="h-9 rounded-xl text-xs">{t("notifications.readAll")}</Button>}</div><section className="mt-6 overflow-hidden rounded-[22px] border border-[#e9e3da] bg-white">{notifications.isLoading ? <div className="p-6"><div className="h-16 animate-pulse rounded-xl bg-[#eeeae2]" /></div> : notifications.data?.length ? notifications.data.map(notification => { const Icon = iconByType[notification.type]; return <div key={notification.id} className={`flex gap-3 border-b border-[#eee9e1] p-4 last:border-0 ${!notification.isRead ? "bg-[#fffcf4]" : ""}`}><div className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[#eef6f0] text-[#267165]"><Icon size={18} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="text-xs font-extrabold text-[#35514b]">{notification.title}</p><time className="shrink-0 text-[10px] text-[#9d9387]">{new Date(notification.createdAt).toLocaleDateString(locale === "ar" ? "ar-SY" : locale === "tr" ? "tr-TR" : "en-US")}</time></div><p className="mt-1 text-[11px] leading-6 text-[#746e65]">{notification.body}</p>{notification.listingId && <Link href={`/ads/${notification.listingId}`} className="mt-2 inline-flex text-[10px] font-bold text-[#217064]">{t("notifications.open")}</Link>}</div>{!notification.isRead && <button onClick={() => markRead.mutate({ id: notification.id })} className="h-2 w-2 shrink-0 rounded-full bg-[#d5a844]" aria-label={t("notifications.read")} />}</div>; }) : <div className="empty-state border-0"><div><Bell className="mx-auto mb-3 text-[#b28630]" /><p className="font-bold text-[#425751]">{t("notifications.empty")}</p></div></div>}</section></div></main>;
}
