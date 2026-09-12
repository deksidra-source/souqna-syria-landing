import { describe, expect, it } from "vitest";
import { translate, translateProvince } from "./LanguageContext";

describe("الترجمة متعددة اللغات", () => {
  it("يعرض النصوص الأساسية بالعربية والإنكليزية والتركية", () => {
    expect(translate("ar", "home.search")).toBe("ابحث الآن");
    expect(translate("en", "home.search")).toBe("Search now");
    expect(translate("tr", "home.search")).toBe("Ara");
  });

  it("يعود إلى العربية عند غياب مفتاح في اللغة المختارة", () => {
    expect(translate("en", "notifications.read")).toBe("Mark as read");
    expect(translate("tr", "unknown.key")).toBe("unknown.key");
  });

  it("يترجم تدفقات التفاصيل والنشر وإدارة الإعلانات", () => {
    expect(translate("en", "detail.contact")).toBe("Contact the advertiser");
    expect(translate("tr", "publish.submit")).toBe("İlanı yayınla");
    expect(translate("ar", "my.archive")).toBe("أرشفة");
  });

  it("يعرض أسماء المحافظات وفق لغة الواجهة مع ثبات قيمها الداخلية", () => {
    expect(translateProvince("en", "دمشق")).toBe("Damascus");
    expect(translateProvince("tr", "ريف دمشق")).toBe("Şam kırsalı");
    expect(translateProvince("ar", "حلب")).toBe("حلب");
  });
});
