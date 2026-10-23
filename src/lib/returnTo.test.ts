import { describe, expect, it } from "vitest";
import { sanitizeReturnTo } from "./returnTo";

describe("sanitizeReturnTo", () => {
  it.each(["https://evil.test", "//evil.test/x", "/login", "/auth/callback", "/x\\evil", "/x\nnext"])("rejects %s", value => {
    expect(sanitizeReturnTo(value)).toBeNull();
  });
  it("preserves safe path, query, and hash", () => {
    expect(sanitizeReturnTo("/scan/42?view=detail#actions")).toBe("/scan/42?view=detail#actions");
  });
  it("keeps customer and admin targets isolated", () => {
    expect(sanitizeReturnTo("/admin/users")).toBeNull();
    expect(sanitizeReturnTo("/admin/users", true)).toBe("/admin/users");
    expect(sanitizeReturnTo("/dashboard", true)).toBeNull();
  });
  it.each(['/guymhan', '/guymhan/login', '/guymhan?return_to=/admin/users', '/admin/login', '/admin/auth/callback'])("does not loop back into an admin sign-in entry: %s", value => {
    expect(sanitizeReturnTo(value)).toBeNull();
    expect(sanitizeReturnTo(value, true)).toBeNull();
  });
});
