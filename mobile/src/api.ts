export type MobileListing = {
  id: number;
  title: string;
  description: string;
  province: string;
  area: string | null;
  price: string | null;
  currency: "SYP" | "USD";
  priceType: "fixed" | "negotiable" | "on_request";
  category: string;
  images: Array<{ url: string }>;
  contactPhone?: string | null;
  isPhoneVisible?: boolean;
};

/** Build-time configuration with the shared preview as a safe default. */
export const apiBaseUrl = (process.env.EXPO_PUBLIC_SOUQNA_API_URL ?? "https://souqnasyr-kumzt8ow.manus.space").replace(/\/$/, "");
export const webBaseUrl = (process.env.EXPO_PUBLIC_SOUQNA_WEB_URL ?? apiBaseUrl).replace(/\/$/, "");

export const apiIsConfigured = apiBaseUrl.length > 0;

function unwrapTrpc<T>(body: unknown): T {
  const data = (body as { result?: { data?: unknown } })?.result?.data;
  if (data && typeof data === "object" && "json" in data) return (data as { json: T }).json;
  return data as T;
}

export async function recordAppDownload(platform: "android" | "ios" | "web") {
  if (!apiBaseUrl) return;
  const payload = { json: { platform, appVersion: process.env.EXPO_PUBLIC_APP_VERSION ?? "1.0.0" } };
  await fetch(`${apiBaseUrl}/api/trpc/analytics.recordDownload`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getListings(input: { query?: string; category?: string } = {}): Promise<MobileListing[]> {
  if (!apiBaseUrl) return [];
  const payload = { json: { limit: 24, offset: 0, ...(input.query ? { query: input.query } : {}), ...(input.category ? { category: input.category } : {}) } };
  const encodedInput = encodeURIComponent(JSON.stringify(payload));
  const response = await fetch(`${apiBaseUrl}/api/trpc/marketplace.list?input=${encodedInput}`);
  if (!response.ok) throw new Error("تعذر تحميل الإعلانات");
  const body = await response.json();
  const data = unwrapTrpc<MobileListing[]>(body) ?? [];
  return Array.isArray(data) ? data : [];
}
