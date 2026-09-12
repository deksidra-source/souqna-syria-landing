import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Bell, Menu, MessageCircle, Plus, Search, X, Home, UserCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { type Locale, useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

const links = [
  ["/ads", "nav.browse"],
  ["/ads?category=real_estate", "nav.realEstate"],
  ["/ads?category=vehicles", "nav.vehicles"],
  ["/ads?category=jobs", "nav.jobs"],
] as const;

export function MarketHeader() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { locale, setLocale, t } = useLanguage();
  const unreadMessages = trpc.conversations.unreadCount.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 15_000, refetchIntervalInBackground: false });
  const unreadCount = unreadMessages.data ?? 0;

  const closeMenu = () => setOpen(false);
  const displayName = user?.name?.split(" ")[0] || "حسابي";

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-[#e9e3da]/80 bg-[#fffdf9]/92 backdrop-blur-xl">
      <div className="container flex h-[72px] items-center justify-between gap-4">
        <Link href="/" className="brand-mark shrink-0" aria-label="الانتقال إلى سوقنا سوريا">
          <span className="brand-glyph">س</span>
          <span>
            <strong>{t("brand.name")}</strong>
            <small>{t("brand.country")}</small>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="التنقل الرئيسي">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${location === href || (href === "/ads" && location.startsWith("/ads")) ? "nav-link-active" : ""}`}>
              {t(label)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <select aria-label="Language" className="h-9 rounded-lg border border-[#e6dfd5] bg-white px-2 text-xs font-bold text-[#38524d] outline-none" value={locale} onChange={event => setLocale(event.target.value as Locale)}>
            <option value="ar">العربية</option><option value="en">English</option><option value="tr">Türkçe</option>
          </select>
          <Link href="/ads" className="header-icon-button" aria-label="البحث في الإعلانات">
            <Search size={19} />
          </Link>
          <Link href="/admin" className="header-icon-button" aria-label="لوحة المدير" title="لوحة المدير"><ShieldCheck size={19} /></Link>
          {isAuthenticated && (
            <><Link href="/messages" className="header-icon-button relative" aria-label={unreadCount ? `${t("nav.messages")} (${unreadCount})` : t("nav.messages")}><MessageCircle size={19} />{unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#b58329] px-1 text-[9px] font-extrabold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}</Link><Link href="/notifications" className="header-icon-button" aria-label={t("nav.notifications")}><Bell size={19} /></Link></>
          )}
          {!loading &&
            (isAuthenticated ? (
              <div className="flex items-center gap-2 pr-1">
                <Link href="/my-listings" className="account-chip">
                  <span className="account-avatar">{displayName.slice(0, 1)}</span>
                  <span>{t("account.hello")} {displayName}</span>
                </Link>
                <button className="text-xs font-bold text-[#81766b] hover:text-[#163f3b]" onClick={() => logout()}>
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <button className="login-button" onClick={() => startLogin()}>
                {t("nav.login")}
              </button>
            ))}
          <Link href="/publish" className="publish-button">
            <Plus size={18} />
            {t("nav.publish")}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link href="/publish" className="mobile-publish" aria-label={t("nav.publish")}>
            <Plus size={20} />
          </Link>
          <button className="header-icon-button" onClick={() => setOpen(value => !value)} aria-label={t("nav.menu")} aria-expanded={open}>
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#ece7df] bg-[#fffdf9] px-4 py-4 shadow-xl md:hidden">
          <nav className="mx-auto grid max-w-xl gap-1" aria-label="قائمة الهاتف">
            <div className="mb-2 flex items-center justify-between gap-2">
              <select aria-label="Language" className="h-9 rounded-lg border border-[#e6dfd5] bg-white px-2 text-xs font-bold text-[#38524d] outline-none" value={locale} onChange={event => setLocale(event.target.value as Locale)}>
                <option value="ar">العربية</option><option value="en">English</option><option value="tr">Türkçe</option>
              </select>
            </div>
            {links.map(([href, label]) => (
              <Link key={href} href={href} onClick={closeMenu} className="mobile-nav-link">
                {t(label)}
              </Link>
            ))}
            <Link href="/admin" onClick={closeMenu} className="mobile-nav-link flex items-center gap-2"><ShieldCheck size={17} />لوحة المدير</Link>
            {isAuthenticated ? (
              <>
                <Link href="/my-listings" onClick={closeMenu} className="mobile-nav-link">{t("nav.myListings")}</Link>
                <Link href="/messages" onClick={closeMenu} className="mobile-nav-link flex items-center justify-between">{t("nav.messages")}{unreadCount > 0 && <span className="rounded-full bg-[#b58329] px-2 py-0.5 text-[10px] font-extrabold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}</Link>
                <Link href="/notifications" onClick={closeMenu} className="mobile-nav-link">{t("nav.notifications")}</Link>
                <button onClick={() => { logout(); closeMenu(); }} className="mobile-nav-link text-right">{t("nav.logout")}</button>
              </>
            ) : (
              <button onClick={() => startLogin()} className="mobile-nav-link text-right">{t("nav.login")}</button>
            )}
          </nav>
        </div>
      )}
    </header>
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-[68px] items-center justify-around border-t border-[#e9e3da] bg-[#fffdf9]/96 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(34,57,50,0.08)] backdrop-blur-xl md:hidden" aria-label="التنقل السفلي">
      <Link href="/" className={`flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-extrabold ${location === "/" ? "text-[#1b6258]" : "text-[#7d877f]"}`}><Home size={19} />الرئيسية</Link>
      <Link href="/ads" className={`flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-extrabold ${location.startsWith("/ads") ? "text-[#1b6258]" : "text-[#7d877f]"}`}><Search size={19} />تصفح</Link>
      <Link href="/publish" className="-mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1b554d] text-white shadow-lg" aria-label={t("nav.publish")}><Plus size={24} /></Link>
      <Link href="/messages" className={`flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-extrabold ${location.startsWith("/messages") ? "text-[#1b6258]" : "text-[#7d877f]"}`}><MessageCircle size={19} />الرسائل</Link>
      <Link href="/my-listings" className={`flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-extrabold ${location.startsWith("/my-listings") ? "text-[#1b6258]" : "text-[#7d877f]"}`}><UserCircle size={19} />حسابي</Link>
    </nav>
    </>
  );
}
