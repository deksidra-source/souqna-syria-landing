import { describe, expect, it } from "vitest";
import { buildShareLinks } from "./share";

describe("buildShareLinks", () => {
  it("builds encoded share links without changing the page URL", () => {
    const links = buildShareLinks({
      url: "https://souqnasyria.com/app?lang=ar",
      text: "جرّب سوقنا سوريا",
    });

    expect(links.whatsapp).toContain(encodeURIComponent("https://souqnasyria.com/app?lang=ar"));
    expect(links.telegram).toContain("https%3A%2F%2Fsouqnasyria.com%2Fapp%3Flang%3Dar");
    expect(links.facebook).toBe("https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fsouqnasyria.com%2Fapp%3Flang%3Dar");
  });
});
