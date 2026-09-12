import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout, { type DashboardMenuItem } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { AlertTriangle, BarChart3, Download, ExternalLink, FileWarning, Headphones, LayoutDashboard, RefreshCw, ShieldCheck, Trash2, TrendingUp } from "lucide-react";
import { useState } from "react";

const adminNavigation: DashboardMenuItem[] = [
  { icon: LayoutDashboard, label: "المتابعة", path: "/admin" },
];

const reportReasonLabels: Record<string, string> = {
  fraud: "احتيال",
  spam: "إزعاج أو رسائل متكررة",
  harassment: "إساءة أو مضايقة",
  illegal: "محتوى مخالف للقانون",
  inappropriate: "محتوى غير مناسب",
  other: "سبب آخر",
};

const statusLabels: Record<string, string> = {
  open: "جديد",
  reviewing: "قيد المراجعة",
  resolved: "تم الحل",
  dismissed: "مغلق دون إجراء",
  completed: "تمت المعالجة",
  rejected: "مرفوض",
};

const statusColors: Record<string, string> = {
  open: "bg-amber-100 text-amber-800 border-amber-200",
  reviewing: "bg-sky-100 text-sky-800 border-sky-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  dismissed: "bg-slate-100 text-slate-700 border-slate-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
};

function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={statusColors[status] ?? "bg-muted text-muted-foreground"}>{statusLabels[status] ?? status}</Badge>;
}

function StatusSelect({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      aria-label="تحديث الحالة"
      className="h-9 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 disabled:cursor-wait disabled:opacity-60"
      value={value}
      onChange={event => onChange(event.target.value)}
      disabled={disabled}
    >
      {options.map(option => <option key={option} value={option}>{statusLabels[option]}</option>)}
    </select>
  );
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-SY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

function QueueEmpty({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed bg-muted/30 px-5 py-12 text-center text-sm text-muted-foreground">لا توجد {label} حاليًا.</div>;
}

function AdminWorkspace() {
  const utils = trpc.useUtils();
  const [message, setMessage] = useState<string | null>(null);
  const overview = trpc.admin.overview.useQuery();
  const analytics = trpc.admin.analytics.useQuery();
  const reports = trpc.admin.reports.useQuery({});
  const deletions = trpc.admin.deletionRequests.useQuery({});
  const support = trpc.admin.supportRequests.useQuery({});

  const refresh = () => {
    void Promise.all([overview.refetch(), analytics.refetch(), reports.refetch(), deletions.refetch(), support.refetch()]);
  };
  const reportStatus = trpc.admin.updateReportStatus.useMutation({
    onSuccess: () => { setMessage("تم تحديث حالة البلاغ."); void utils.admin.overview.invalidate(); void utils.admin.reports.invalidate(); },
    onError: () => setMessage("تعذر تحديث البلاغ. أعد المحاولة."),
  });
  const deletionStatus = trpc.admin.updateDeletionRequestStatus.useMutation({
    onSuccess: () => { setMessage("تم تحديث طلب الحذف."); void utils.admin.overview.invalidate(); void utils.admin.deletionRequests.invalidate(); },
    onError: () => setMessage("تعذر تحديث طلب الحذف. أعد المحاولة."),
  });
  const supportStatus = trpc.admin.updateSupportRequestStatus.useMutation({
    onSuccess: () => { setMessage("تم تحديث تذكرة الدعم."); void utils.admin.overview.invalidate(); void utils.admin.supportRequests.invalidate(); },
    onError: () => setMessage("تعذر تحديث تذكرة الدعم. أعد المحاولة."),
  });

  const hasError = overview.isError || analytics.isError || reports.isError || deletions.isError || support.isError;

  const downloadCsv = (filename: string, rows: Array<Record<string, unknown>>) => {
    if (!rows.length) { setMessage("لا توجد بيانات لتنزيلها حاليًا."); return; }
    const keys = Object.keys(rows[0]);
    const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [keys, ...rows.map(row => keys.map(key => row[key]))].map(row => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
  };

  return (
    <div dir="rtl" className="mx-auto w-full max-w-7xl space-y-6 pb-10">
      <section className="flex flex-col justify-between gap-4 rounded-3xl border bg-card p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><ShieldCheck className="h-4 w-4" /> إدارة موثوقة</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">لوحة مدير سوقنا سوريا</h1>
          <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">راجع البلاغات، تذاكر الدعم وطلبات حذف البيانات. تغيير الحالة لا يحذف بيانات المستخدم تلقائيًا.</p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={overview.isFetching || reports.isFetching} className="gap-2"><RefreshCw className="h-4 w-4" />تحديث البيانات</Button>
      </section>

      {message ? <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">{message}</div> : null}
      {hasError ? <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">تعذر تحميل بعض البيانات. تحقق من الاتصال ثم اضغط «تحديث البيانات».</div> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={FileWarning} title="بلاغات تحتاج مراجعة" value={overview.data?.openReports} tone="amber" />
        <MetricCard icon={Trash2} title="طلبات حذف بيانات" value={overview.data?.openDeletionRequests} tone="rose" />
        <MetricCard icon={Headphones} title="تذاكر دعم مفتوحة" value={overview.data?.openSupportRequests} tone="sky" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard icon={Download} title="تنزيلات التطبيق" value={analytics.data?.downloads.total} detail={`آخر 30 يومًا: ${analytics.data?.downloads.last30Days ?? "—"} · Android ${analytics.data?.downloads.android ?? 0} · iOS ${analytics.data?.downloads.ios ?? 0}`} growth={analytics.data?.downloads.growth} tone="emerald" />
        <AnalyticsCard icon={TrendingUp} title="نمو المستخدمين" value={analytics.data?.users.total} detail={`المضافون آخر 30 يومًا: ${analytics.data?.users.last30Days ?? "—"}`} growth={analytics.data?.users.growth} tone="sky" />
        <AnalyticsCard icon={BarChart3} title="نمو الإعلانات" value={analytics.data?.listings.total} detail={`المضافة آخر 30 يومًا: ${analytics.data?.listings.last30Days ?? "—"}`} growth={analytics.data?.listings.growth} tone="amber" />
        <AnalyticsCard icon={AlertTriangle} title="البلاغات الكلية" value={analytics.data?.reports.total} detail={`البلاغات آخر 30 يومًا: ${analytics.data?.reports.last30Days ?? "—"}`} growth={analytics.data?.reports.growth} tone="rose" />
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
        <span className="text-sm font-bold text-foreground">تنزيل التقارير:</span>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCsv("souqna-reports.csv", (reports.data ?? []).map(item => ({ id: item.report.id, status: item.report.status, reason: item.report.reason, createdAt: item.report.createdAt, listing: item.listingTitle ?? "" })))}><Download className="h-4 w-4" />البلاغات</Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCsv("souqna-deletion-requests.csv", (deletions.data ?? []).map(item => ({ id: item.request.id, status: item.request.status, user: item.userName ?? "", email: item.userEmail ?? "", requestedAt: item.request.requestedAt })))}><Download className="h-4 w-4" />طلبات الحذف</Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCsv("souqna-support.csv", (support.data ?? []).map(item => ({ id: item.id, status: item.status, subject: item.subject, email: item.email, createdAt: item.createdAt })))}><Download className="h-4 w-4" />الدعم</Button>
      </section>

      <Tabs defaultValue="reports" className="space-y-5">
        <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-2xl bg-muted/70 p-2">
          <TabsTrigger value="reports" className="min-w-fit gap-2 rounded-xl px-4 py-2.5"><AlertTriangle className="h-4 w-4" />البلاغات <span className="text-xs">{reports.data?.length ?? 0}</span></TabsTrigger>
          <TabsTrigger value="deletions" className="min-w-fit gap-2 rounded-xl px-4 py-2.5"><Trash2 className="h-4 w-4" />حذف البيانات <span className="text-xs">{deletions.data?.length ?? 0}</span></TabsTrigger>
          <TabsTrigger value="support" className="min-w-fit gap-2 rounded-xl px-4 py-2.5"><Headphones className="h-4 w-4" />الدعم <span className="text-xs">{support.data?.length ?? 0}</span></TabsTrigger>
        </TabsList>

        <TabsContent value="reports"><section className="space-y-3">
          {reports.isLoading ? <QueueEmpty label="بيانات محملة" /> : reports.data?.length ? reports.data.map(item => (
            <Card key={item.report.id} className="overflow-hidden"><CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_auto]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2"><StatusBadge status={item.report.status} /><span className="text-sm text-muted-foreground">بلاغ #{item.report.id} · {formatDate(item.report.createdAt)}</span></div>
                <h2 className="font-bold text-foreground">{reportReasonLabels[item.report.reason]}</h2>
                <p className="text-sm leading-6 text-muted-foreground">المبلّغ: {item.reporterName || "مستخدم"}{item.reporterEmail ? ` — ${item.reporterEmail}` : ""}</p>
                <p className="text-sm leading-6 text-muted-foreground">الحساب المُبلّغ عنه: {item.reportedUserName || "مستخدم"}{item.reportedUserEmail ? ` — ${item.reportedUserEmail}` : ""}</p>
                {item.listingTitle ? <div className="flex flex-wrap items-center gap-2 text-sm"><span>الإعلان: <strong>{item.listingTitle}</strong></span>{item.report.listingId ? <a className="inline-flex items-center gap-1 text-primary underline underline-offset-4" href={`/ads/${item.report.listingId}`} target="_blank" rel="noreferrer">فتح الإعلان<ExternalLink className="h-3.5 w-3.5" /></a> : null}</div> : null}
                {item.messageBody ? <blockquote className="rounded-xl border-r-4 border-amber-400 bg-amber-50/70 p-3 text-sm leading-6 text-foreground">نص الرسالة المبلّغ عنها: {item.messageBody}</blockquote> : null}
                {item.report.details ? <p className="rounded-xl bg-muted px-3 py-2 text-sm text-foreground">تفاصيل المستخدم: {item.report.details}</p> : null}
              </div>
              <StatusSelect value={item.report.status} options={["open", "reviewing", "resolved", "dismissed"]} disabled={reportStatus.isPending} onChange={status => reportStatus.mutate({ id: item.report.id, status: status as "open" | "reviewing" | "resolved" | "dismissed" })} />
            </CardContent></Card>
          )) : <QueueEmpty label="بلاغات" />}
        </section></TabsContent>

        <TabsContent value="deletions"><section className="space-y-3">
          {deletions.isLoading ? <QueueEmpty label="بيانات محملة" /> : deletions.data?.length ? deletions.data.map(item => (
            <Card key={item.request.id}><CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_auto]">
              <div className="space-y-3"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={item.request.status} /><span className="text-sm text-muted-foreground">طلب #{item.request.id} · {formatDate(item.request.requestedAt)}</span></div><h2 className="font-bold">{item.userName || "مستخدم"}</h2><p className="text-sm text-muted-foreground">{item.userEmail || "لا يتوفر بريد إلكتروني"}</p>{item.request.details ? <p className="rounded-xl bg-muted px-3 py-2 text-sm leading-6">ملاحظة المستخدم: {item.request.details}</p> : <p className="text-sm text-muted-foreground">لا توجد ملاحظة إضافية.</p>}<p className="text-xs leading-5 text-muted-foreground">ضع الحالة «تمت المعالجة» فقط بعد تنفيذ الحذف والتحقق منه يدويًا.</p></div>
              <StatusSelect value={item.request.status} options={["open", "reviewing", "completed", "rejected"]} disabled={deletionStatus.isPending} onChange={status => deletionStatus.mutate({ id: item.request.id, status: status as "open" | "reviewing" | "completed" | "rejected" })} />
            </CardContent></Card>
          )) : <QueueEmpty label="طلبات حذف بيانات" />}
        </section></TabsContent>

        <TabsContent value="support"><section className="space-y-3">
          {support.isLoading ? <QueueEmpty label="بيانات محملة" /> : support.data?.length ? support.data.map(item => (
            <Card key={item.id}><CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_auto]">
              <div className="space-y-3"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={item.status} /><span className="text-sm text-muted-foreground">تذكرة #{item.id} · {formatDate(item.createdAt)}</span></div><h2 className="font-bold">{item.subject}</h2><p className="text-sm text-muted-foreground">{item.name} — <a className="text-primary underline underline-offset-4" href={`mailto:${item.email}`}>{item.email}</a></p><p className="rounded-xl bg-muted px-3 py-3 text-sm leading-7 text-foreground whitespace-pre-wrap">{item.message}</p></div>
              <StatusSelect value={item.status} options={["open", "reviewing", "resolved"]} disabled={supportStatus.isPending} onChange={status => supportStatus.mutate({ id: item.id, status: status as "open" | "reviewing" | "resolved" })} />
            </CardContent></Card>
          )) : <QueueEmpty label="تذاكر دعم" />}
        </section></TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, tone }: { icon: typeof FileWarning; title: string; value?: number; tone: "amber" | "rose" | "sky" }) {
  const tones = { amber: "bg-amber-100 text-amber-700", rose: "bg-rose-100 text-rose-700", sky: "bg-sky-100 text-sky-700" };
  return <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle><span className={`rounded-xl p-2 ${tones[tone]}`}><Icon className="h-5 w-5" /></span></CardHeader><CardContent><div className="text-3xl font-bold text-foreground">{value ?? "—"}</div><p className="mt-1 text-xs text-muted-foreground">تشمل الجديد وقيد المراجعة</p></CardContent></Card>;
}

function AnalyticsCard({ icon: Icon, title, value, detail, growth, tone }: { icon: typeof FileWarning; title: string; value?: number; detail: string; growth?: number; tone: "amber" | "rose" | "sky" | "emerald" }) {
  const tones = { amber: "bg-amber-100 text-amber-700", rose: "bg-rose-100 text-rose-700", sky: "bg-sky-100 text-sky-700", emerald: "bg-emerald-100 text-emerald-700" };
  return <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle><span className={`rounded-xl p-2 ${tones[tone]}`}><Icon className="h-5 w-5" /></span></CardHeader><CardContent><div className="flex items-end gap-2"><div className="text-3xl font-bold text-foreground">{value ?? "—"}</div>{growth !== undefined ? <span className={`mb-1 text-xs font-bold ${growth >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{growth >= 0 ? "+" : ""}{growth}%</span> : null}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></CardContent></Card>;
}

export default function Admin() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-muted/30 p-6" aria-label="جارٍ التحقق من الصلاحية">
        <div className="w-full max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">جارٍ التحقق من صلاحية الدخول…</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <section className="w-full max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-bold text-foreground">تسجيل الدخول للمتابعة</h1>
          <p className="mt-3 leading-7 text-muted-foreground">يلزم تسجيل الدخول بحساب المدير لفتح لوحة إدارة سوقنا سوريا.</p>
          <Button className="mt-6 w-full" onClick={() => startLogin()}>تسجيل الدخول</Button>
        </section>
      </div>
    );
  }
  return (
    <DashboardLayout menuItems={adminNavigation} title="إدارة سوقنا" requireAdmin sidebarSide="right">
      {user?.role === "admin" ? <AdminWorkspace /> : null}
    </DashboardLayout>
  );
}
