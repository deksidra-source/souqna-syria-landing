import { describe, expect, it } from "vitest";
import { categoryFields, createListingSchema, getPromotionOffer, listingQuerySchema } from "./marketplace";

const validListing = {
  category: "real_estate" as const,
  title: "شقة مفروشة للإيجار في المزة",
  description: "شقة مفروشة ونظيفة ضمن حي هادئ وقريبة من الخدمات الأساسية.",
  province: "دمشق" as const,
  area: "المزة",
  price: 1_500_000,
  currency: "SYP" as const,
  priceType: "fixed" as const,
  contactName: "أحمد",
  contactPhone: "0944000000",
  isPhoneVisible: true,
  latitude: 33.5138,
  longitude: 36.2765,
  attributes: { propertyType: "شقة", rooms: 3 },
  images: [],
};

describe("عقود سوقنا", () => {
  it("تقبل إعلانًا صحيحًا وتضع حالة النشر الافتراضية", () => {
    const result = createListingSchema.parse(validListing);
    expect(result.status).toBe("published");
    expect(result.title).toBe(validListing.title);
  });

  it("ترفض السعر المفقود عندما تكون طريقة السعر ثابتة", () => {
    const result = createListingSchema.safeParse({ ...validListing, price: null });
    expect(result.success).toBe(false);
  });

  it("ترفض نطاق السعر المعكوس في البحث", () => {
    const result = listingQuerySchema.safeParse({ minPrice: 2_000_000, maxPrice: 1_000_000 });
    expect(result.success).toBe(false);
  });

  it("تقبل فلتر الإعلانات المنشورة دون إظهار الحالات الخاصة", () => {
    expect(listingQuerySchema.parse({ status: "published" }).status).toBe("published");
  });

  it("يعرف الحقول الخاصة بكل قسم", () => {
    expect(categoryFields.real_estate.map(field => field.key)).toContain("propertyType");
    expect(categoryFields.vehicles.map(field => field.key)).toContain("mileage");
    expect(categoryFields.jobs.map(field => field.key)).toContain("employmentType");
  });

  it("يعرض ترقية لمدة 15 يومًا للسيارات والعقارات فقط", () => {
    expect(getPromotionOffer("vehicles")).toMatchObject({ amountSyp: 13_170, durationDays: 15 });
    expect(getPromotionOffer("real_estate")).toMatchObject({ amountSyp: 26_340, durationDays: 15 });
    expect(getPromotionOffer("services")).toBeUndefined();
  });
});
