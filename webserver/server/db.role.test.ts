import { describe, expect, it } from "vitest";
import { getAuthoritativeRoleForUpsert } from "./db";

describe("مزامنة دور المستخدم عند تسجيل الدخول", () => {
  it("لا تفرض دور مستخدم على حساب له دور محفوظ في قاعدة البيانات", () => {
    expect(getAuthoritativeRoleForUpsert({ openId: "owner-account", role: undefined })).toBeUndefined();
  });

  it("تحتفظ بتصريح المدير الصريح عند المزامنة", () => {
    expect(getAuthoritativeRoleForUpsert({ openId: "owner-account", role: "admin" })).toBe("admin");
  });
});
