import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowRight, Ban, Flag, MessageCircle, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

export default function Messages() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const [, params] = useRoute("/messages/:id");
  const [, navigate] = useLocation();
  const conversationId = Number(params?.id);
  const [body, setBody] = useState("");
  const utils = trpc.useUtils();
  const conversations = trpc.conversations.mine.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 15_000, refetchIntervalInBackground: false });
  const detail = trpc.conversations.detail.useQuery({ conversationId }, { enabled: isAuthenticated && Number.isInteger(conversationId) && conversationId > 0, refetchInterval: 8_000, refetchIntervalInBackground: false });
  const markRead = trpc.conversations.markRead.useMutation({
    onSuccess: () => {
      utils.conversations.mine.invalidate();
      utils.conversations.unreadCount.invalidate();
    },
  });
  const reportMessage = trpc.safety.reportMessage.useMutation({ onSuccess: () => toast.success(t("safety.reported")), onError: error => toast.error(error.message || t("safety.actionError")) });
  const blockUser = trpc.safety.blockUser.useMutation({
    onSuccess: () => { toast.success(t("safety.blocked")); navigate("/messages"); utils.conversations.mine.invalidate(); utils.conversations.unreadCount.invalidate(); },
    onError: error => toast.error(error.message || t("safety.actionError")),
  });
  const send = trpc.conversations.send.useMutation({
    onSuccess: () => { setBody(""); detail.refetch(); conversations.refetch(); utils.conversations.unreadCount.invalidate(); },
  });

  useEffect(() => {
    if (!params?.id && conversations.data?.[0]?.conversation.id) navigate(`/messages/${conversations.data[0].conversation.id}`);
  }, [conversations.data, navigate, params?.id]);

  useEffect(() => {
    if (isAuthenticated && Number.isInteger(conversationId) && conversationId > 0 && detail.data) {
      markRead.mutate({ conversationId });
    }
  }, [conversationId, detail.data?.messages.length, isAuthenticated]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    send.mutate({ conversationId, body: body.trim() });
  }

  if (!isAuthenticated) {
    return <main className="container page-shell py-12"><div className="empty-state"><div><MessageCircle className="mx-auto mb-4 text-[#b0812c]" size={32} /><p className="font-bold text-[#36504b]">{t("chat.loginTitle")}</p><p className="mt-2 text-xs text-[#756d63]">{t("chat.loginBody")}</p><Button className="mt-5" onClick={() => startLogin()}>{t("nav.login")}</Button></div></div></main>;
  }

  return (
    <main className="page-shell bg-[#fcfaf6] py-6 sm:py-9">
      <div className="container">
        <Link href="/ads" className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-[#65716e] hover:text-[#1a6257]"><ArrowRight size={16} />{t("chat.back")}</Link>
        <div className="grid min-h-[620px] overflow-hidden rounded-[24px] border border-[#e7e0d5] bg-white shadow-sm lg:grid-cols-[310px_minmax(0,1fr)]">
          <aside className="border-b border-[#ebe5da] bg-[#fdfaf4] p-4 lg:border-b-0 lg:border-l">
            <h1 className="px-2 text-base font-extrabold text-[#284641]">{t("chat.title")}</h1>
            {conversations.isLoading ? <div className="mt-5 h-20 animate-pulse rounded-xl bg-[#eee9df]" /> : conversations.data?.length ? <div className="mt-4 space-y-2">{conversations.data.map(item => <Link key={item.conversation.id} href={`/messages/${item.conversation.id}`} className={`block rounded-xl p-3 transition ${conversationId === item.conversation.id ? "bg-[#e4f0e9]" : "hover:bg-white"}`}><div className="flex items-start justify-between gap-2"><p className="text-xs font-extrabold text-[#31514b]">{item.listingTitle || t("chat.listing")}</p>{item.unreadCount > 0 && <span className="rounded-full bg-[#b58329] px-2 py-0.5 text-[10px] font-extrabold text-white" aria-label={`${item.unreadCount} ${t("chat.unread")}`}>{item.unreadCount}</span>}</div><p className="mt-1 text-[10px] text-[#8a8176]">{item.conversation.lastMessageAt.toLocaleDateString()}</p></Link>)}</div> : <p className="px-2 pt-5 text-xs leading-6 text-[#81786e]">{t("chat.empty")}</p>}
          </aside>
          <section className="flex min-h-[420px] flex-col">
            {detail.isLoading ? <div className="m-auto h-20 w-2/3 animate-pulse rounded-xl bg-[#eee9df]" /> : detail.data ? <>
              <header className="flex items-center justify-between gap-3 border-b border-[#eee9e1] px-5 py-4"><p className="text-sm font-extrabold text-[#294640]">{detail.data.listingTitle || t("chat.listing")}</p><Button type="button" variant="outline" size="sm" disabled={blockUser.isPending} onClick={() => { if (window.confirm(t("safety.blockConfirm"))) blockUser.mutate({ userId: detail.data!.counterpartId }); }}><Ban size={14} />{t("safety.block")}</Button></header>
              <div className="flex-1 space-y-3 overflow-y-auto bg-[#fffcf7] p-5">{detail.data.messages.length ? detail.data.messages.map(message => <div key={message.id} className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.senderId === user?.id ? "ml-auto bg-[#e2efe8] text-[#264840]" : "mr-auto bg-white text-[#4c514c] shadow-sm"}`}><p>{message.body}</p><div className="mt-1 flex items-center justify-between gap-3"><time className="block text-[10px] opacity-60">{message.createdAt.toLocaleString()}</time>{message.senderId !== user?.id && <button type="button" onClick={() => { const details = window.prompt(t("safety.reportPrompt")); if (details !== null) reportMessage.mutate({ messageId: message.id, reason: "other", details: details || undefined }); }} className="inline-flex items-center gap-1 text-[10px] font-bold opacity-70 hover:opacity-100"><Flag size={12} />{t("safety.report")}</button>}</div></div>) : <p className="py-10 text-center text-xs text-[#847b70]">{t("chat.noMessages")}</p>}</div>
              <form onSubmit={submit} className="flex gap-2 border-t border-[#eee9e1] p-3"><input value={body} onChange={event => setBody(event.target.value)} maxLength={1500} placeholder={t("chat.placeholder")} className="h-11 flex-1 rounded-xl border border-[#dfd8ca] bg-white px-3 text-sm outline-none focus:border-[#4a8d81]" /><Button type="submit" disabled={send.isPending} className="h-11 rounded-xl bg-[#1b4b46] px-4"><Send size={16} />{t("chat.send")}</Button></form>
            </> : <div className="m-auto text-center"><MessageCircle className="mx-auto mb-3 text-[#b0812c]" size={30} /><p className="text-sm font-bold text-[#52635e]">{t("chat.choose")}</p></div>}
          </section>
        </div>
      </div>
    </main>
  );
}
