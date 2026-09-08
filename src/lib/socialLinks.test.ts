import { describe, expect, it } from "vitest";
import { normalizeSocialUrl, parseSocialLinks } from "./socialLinks";

describe("social link normalization", () => {
  it("turns stored handles into tappable platform links", () => {
    expect(normalizeSocialUrl("tiktok", "Sbongile 060")).toBe("https://tiktok.com/@Sbongile060");
    expect(normalizeSocialUrl("instagram", "Teddy.boy")).toBe("https://instagram.com/Teddy.boy");
  });

  it("keeps complete web addresses", () => {
    expect(normalizeSocialUrl("instagram", "https://instagram.com/example")).toBe("https://instagram.com/example");
  });

  it("parses the API's JSON-encoded social link list", () => {
    const links = parseSocialLinks({
      links: JSON.stringify([{ platform: "tiktok", url: "Sbongile 060" }]),
    });
    expect(links[0].href).toBe("https://tiktok.com/@Sbongile060");
  });
});
