import { describe, expect, it } from "vitest";
import { publicPages } from "./publicPages";

describe("public SEO pages", () => {
  it("uses unique routes, titles and descriptions", () => {
    expect(new Set(publicPages.map(page => page.path)).size).toBe(publicPages.length);
    expect(new Set(publicPages.map(page => page.title)).size).toBe(publicPages.length);
    expect(new Set(publicPages.map(page => page.description)).size).toBe(publicPages.length);
  });

  it("keeps each page substantive without unsupported ratings or reviews", () => {
    for (const page of publicPages) {
      expect(page.sections.length).toBeGreaterThan(0);
      expect(`${page.intro} ${page.sections.map(section => section.body).join(" ")}`).not.toMatch(/aggregateRating|customer review|guaranteed ranking/i);
    }
  });
});
