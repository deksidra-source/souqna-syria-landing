import { z } from "zod";

export const listingCategoryValues = [
  "real_estate",
  "vehicles",
  "auto_parts",
  "electronics",
  "pets",
  "jobs",
  "used_items",
  "services",
] as const;
export const listingStatusValues = ["draft", "published", "paused", "archived"] as const;
export const currencyValues = ["SYP", "USD"] as const;
export const priceTypeValues = ["fixed", "negotiable", "on_request"] as const;
export const interestTypeValues = ["favorite", "contact"] as const;
export const notificationTypeValues = [
  "listing_created",
  "listing_status_changed",
  "new_interest",
  "new_message",
] as const;
export const promotionStatusValues = ["pending", "active", "expired", "failed", "cancelled"] as const;
export const paymentProviderValues = ["ecash"] as const;
export const promotionCategoryValues = ["vehicles", "real_estate"] as const;

export type PromotionCategory = (typeof promotionCategoryValues)[number];
export type PromotionOffer = {
  category: PromotionCategory;
  label: string;
  referenceAmountUsd: number;
  amountSyp: number;
  durationDays: number;
};

export const promotionOffers: Record<PromotionCategory, PromotionOffer> = {
  vehicles: {
    category: "vehicles",
    label: "سيارة مميزة",
    referenceAmountUsd: 1,
    amountSyp: 13_170,
    durationDays: 15,
  },
  real_estate: {
    category: "real_estate",
    label: "عقار مميز",
    referenceAmountUsd: 2,
    amountSyp: 26_340,
    durationDays: 15,
  },
};

export function getPromotionOffer(category: ListingCategory): PromotionOffer | undefined {
  return promotionCategoryValues.includes(category as PromotionCategory)
    ? promotionOffers[category as PromotionCategory]
    : undefined;
}

export type ListingCategory = (typeof listingCategoryValues)[number];
export type ListingStatus = (typeof listingStatusValues)[number];

export const categories: Array<{
  id: ListingCategory;
  label: string;
  description: string;
  icon: "building" | "car" | "briefcase" | "package" | "wrench" | "cpu" | "paw" | "settings";
}> = [
  { id: "real_estate", label: "العقارات", description: "بيع وإيجار السكن والأراضي", icon: "building" },
  { id: "vehicles", label: "السيارات", description: "سيارات، دراجات ومركبات", icon: "car" },
  { id: "auto_parts", label: "قطع الغيار", description: "قطع سيارات ودراجات وشاحنات", icon: "settings" },
  { id: "electronics", label: "الإلكترونيات", description: "هواتف وحواسيب وأجهزة ذكية", icon: "cpu" },
  { id: "pets", label: "الحيوانات", description: "حيوانات ومستلزمات تربية", icon: "paw" },
  { id: "jobs", label: "الوظائف", description: "فرص عمل وكفاءات", icon: "briefcase" },
  { id: "used_items", label: "المستعمل", description: "أجهزة، أثاث ومقتنيات", icon: "package" },
  { id: "services", label: "الخدمات", description: "خدمات مهنية ومحلية", icon: "wrench" },
];

export const categorySubcategories: Record<ListingCategory, string[]> = {
  real_estate: ["شقق", "منازل", "أراضٍ", "محلات", "مكاتب", "مزارع", "للبيع", "للإيجار"],
  vehicles: ["سيارات", "دراجات نارية", "شاحنات", "باصات", "آليات", "إطارات", "للبيع", "للتبديل"],
  auto_parts: ["محركات", "جيربوكس", "بطاريات", "إطارات", "فلاتر وزيوت", "كهرباء سيارات", "هيكل", "إكسسوارات"],
  electronics: ["هواتف", "أجهزة لوحية", "حواسيب", "شاشات وتلفزيونات", "كاميرات", "سماعات", "ألعاب", "شبكات وطابعات", "إكسسوارات"],
  pets: ["قطط", "كلاب", "طيور", "أسماك", "أغنام وماعز", "أبقار ودواجن", "خيول وأرانب", "طعام وأقفاص", "تبنٍّ ومفقودات"],
  jobs: ["طبيب", "ممرض", "صيدلي", "مهندس", "محامي", "محاسب", "مدرس", "مترجم", "مبرمج", "مصمم", "سائق", "مبيعات", "دوام كامل", "دوام جزئي", "عن بُعد", "تدريب"],
  used_items: ["أثاث", "أدوات منزلية", "ملابس", "كتب", "معدات", "تحف ومقتنيات", "جديد", "مستعمل"],
  services: ["صيانة", "نقل وشحن", "تنظيف", "دروس خصوصية", "تصميم وبرمجة", "استشارات", "تصوير", "خدمات منزلية"],
};

export const syrianProvinces = [
  "دمشق",
  "ريف دمشق",
  "حلب",
  "حمص",
  "حماة",
  "اللاذقية",
  "طرطوس",
  "إدلب",
  "درعا",
  "السويداء",
  "دير الزور",
  "الرقة",
  "الحسكة",
  "القنيطرة",
] as const;

export const listingStatusLabels: Record<ListingStatus, string> = {
  draft: "مسودة",
  published: "منشور",
  paused: "متوقف مؤقتًا",
  archived: "مؤرشف",
};

export const priceTypeLabels: Record<(typeof priceTypeValues)[number], string> = {
  fixed: "سعر ثابت",
  negotiable: "قابل للتفاوض",
  on_request: "عند الطلب",
};

export type DynamicField = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  placeholder?: string;
  options?: string[];
};

export const categoryFields: Record<ListingCategory, DynamicField[]> = {
  real_estate: [
    { key: "purpose", label: "نوع العرض", type: "select", options: ["للبيع", "للإيجار"] },
    { key: "propertyType", label: "نوع العقار", type: "select", options: ["شقة", "منزل", "أرض", "مكتب", "محل"] },
    { key: "areaSqm", label: "المساحة بالمتر المربع", type: "number" },
    { key: "rooms", label: "عدد الغرف", type: "number" },
  ],
  vehicles: [
    { key: "make", label: "الماركة", type: "text", placeholder: "مثال: كيا" },
    { key: "model", label: "الطراز", type: "text", placeholder: "مثال: سيراتو" },
    { key: "year", label: "سنة الصنع", type: "number" },
    { key: "mileage", label: "المسافة المقطوعة (كم)", type: "number" },
  ],
  auto_parts: [
    { key: "vehicleType", label: "نوع المركبة", type: "select", options: ["سيارة", "دراجة نارية", "شاحنة", "باص", "آلية"] },
    { key: "make", label: "الماركة", type: "text", placeholder: "مثال: كيا" },
    { key: "model", label: "الطراز", type: "text", placeholder: "مثال: سيراتو" },
    { key: "year", label: "سنة الصنع", type: "number" },
    { key: "partNumber", label: "رقم القطعة", type: "text" },
  ],
  electronics: [
    { key: "deviceType", label: "نوع الجهاز", type: "select", options: ["هاتف", "حاسوب", "شاشة", "كاميرا", "سماعات", "جهاز ألعاب", "أخرى"] },
    { key: "brand", label: "العلامة التجارية", type: "text", placeholder: "مثال: Samsung" },
    { key: "model", label: "الموديل", type: "text" },
    { key: "condition", label: "الحالة", type: "select", options: ["جديد", "مستعمل بحالة ممتازة", "مستعمل"] },
    { key: "warranty", label: "الضمان", type: "select", options: ["يوجد ضمان", "لا يوجد", "ضمان الوكيل"] },
  ],
  pets: [
    { key: "animalType", label: "نوع الحيوان", type: "select", options: ["قطط", "كلاب", "طيور", "أسماك", "أغنام", "ماعز", "أبقار", "دواجن", "خيول", "أرانب"] },
    { key: "breed", label: "السلالة", type: "text" },
    { key: "age", label: "العمر", type: "text", placeholder: "مثال: سنة" },
    { key: "purpose", label: "نوع الإعلان", type: "select", options: ["بيع", "تبنٍّ", "تزاوج", "مفقود", "مستلزمات"] },
  ],
  jobs: [
    { key: "employmentType", label: "نوع الدوام", type: "select", options: ["دوام كامل", "دوام جزئي", "عن بعد", "تدريب"] },
    { key: "company", label: "اسم الجهة", type: "text" },
    { key: "experience", label: "الخبرة المطلوبة", type: "select", options: ["مبتدئ", "متوسط", "خبير"] },
  ],
  used_items: [
    { key: "condition", label: "حالة المنتج", type: "select", options: ["جديد", "مستعمل بحالة ممتازة", "مستعمل"] },
    { key: "brand", label: "العلامة التجارية", type: "text" },
  ],
  services: [
    { key: "serviceType", label: "نوع الخدمة", type: "text", placeholder: "مثال: صيانة كهربائية" },
    { key: "coverage", label: "نطاق الخدمة", type: "select", options: ["ضمن المحافظة", "عدة محافظات", "عن بعد"] },
  ],
};

export const listingCategorySchema = z.enum(listingCategoryValues);
export const listingStatusSchema = z.enum(listingStatusValues);

export const imageUploadSchema = z.object({
  name: z.string().min(1).max(180),
  type: z.string().startsWith("image/"),
  dataUrl: z.string().startsWith("data:image/").max(3_000_000),
});

export const listingPayloadSchema = z.object({
  category: listingCategorySchema,
  status: listingStatusSchema.default("published"),
  title: z.string().trim().min(8, "أدخل عنوانًا من 8 أحرف على الأقل").max(180),
  description: z.string().trim().min(20, "أدخل وصفًا أوضح للإعلان").max(8_000),
  province: z.enum(syrianProvinces),
  area: z.string().trim().max(120).optional().nullable(),
  price: z.number().min(0).max(99_999_999_999).optional().nullable(),
  currency: z.enum(currencyValues).default("SYP"),
  priceType: z.enum(priceTypeValues).default("fixed"),
  contactName: z.string().trim().min(2).max(120),
  contactPhone: z.string().trim().min(6).max(32),
  isPhoneVisible: z.boolean().default(true),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  images: z.array(imageUploadSchema).max(8).default([]),
});

export const createListingSchema = listingPayloadSchema.superRefine((value, ctx) => {
  if (value.priceType === "fixed" && value.price === null) {
    ctx.addIssue({ code: "custom", path: ["price"], message: "السعر مطلوب عند اختيار سعر ثابت" });
  }
});

export const updateListingSchema = listingPayloadSchema
  .omit({ images: true })
  .extend({ id: z.number().int().positive(), images: z.array(imageUploadSchema).max(8).optional() });

export const listingQuerySchema = z
  .object({
    query: z.string().trim().max(120).optional(),
    category: listingCategorySchema.optional(),
    province: z.enum(syrianProvinces).optional(),
    status: z.literal("published").optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    limit: z.number().int().min(1).max(48).default(24),
    offset: z.number().int().min(0).default(0),
  })
  .superRefine((value, ctx) => {
    if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
      ctx.addIssue({ code: "custom", path: ["maxPrice"], message: "الحد الأعلى أقل من الحد الأدنى" });
    }
  });

export const myListingsQuerySchema = z.object({ status: listingStatusSchema.optional() });
export const interestSchema = z.object({
  listingId: z.number().int().positive(),
  type: z.enum(interestTypeValues),
});

export const promotionRequestSchema = z.object({ listingId: z.number().int().positive() });
export const conversationIdSchema = z.object({ conversationId: z.number().int().positive() });
export const startConversationSchema = z.object({ listingId: z.number().int().positive() });
export const sendMessageSchema = z.object({
  conversationId: z.number().int().positive(),
  body: z.string().trim().min(1, "أدخل رسالة قبل الإرسال").max(1_500, "الرسالة طويلة جدًا"),
});

export const reportReasonValues = ["fraud", "spam", "harassment", "illegal", "inappropriate", "other"] as const;
export const reportListingSchema = z.object({
  listingId: z.number().int().positive(),
  reason: z.enum(reportReasonValues),
  details: z.string().trim().max(800).optional(),
});
export const reportMessageSchema = z.object({
  messageId: z.number().int().positive(),
  reason: z.enum(reportReasonValues),
  details: z.string().trim().max(800).optional(),
});
export const blockUserSchema = z.object({ userId: z.number().int().positive() });
export const policyAcceptanceSchema = z.object({ policyVersion: z.string().trim().min(1).max(32) });
export const dataDeletionRequestSchema = z.object({ details: z.string().trim().max(500).optional() });
export const supportRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(4_000),
});

export function categoryLabel(category: ListingCategory) {
  return categories.find(item => item.id === category)?.label ?? category;
}
