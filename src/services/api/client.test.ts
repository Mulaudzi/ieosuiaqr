import { describe, expect, it } from "vitest";
import { parseApiError } from "./client";

describe("parseApiError", () => {
  it("uses field-level validation details when present", () => {
    expect(
      parseApiError({ message: "Invalid", errors: { email: ["Required", "Invalid"] } }, "Fallback")
    ).toMatchObject({
      message: "email: Required, Invalid",
      details: { email: ["Required", "Invalid"] },
    });
  });

  it("uses the fallback for an empty error", () => {
    expect(parseApiError({}, "Something went wrong").message).toBe("Something went wrong");
  });
});
