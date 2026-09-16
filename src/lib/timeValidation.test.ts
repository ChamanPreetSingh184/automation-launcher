import { describe, expect, it } from "vitest";
import { isValidTimeOfDay } from "./timeValidation";

describe("isValidTimeOfDay", () => {
  it("accepts valid 24-hour HH:mm values", () => {
    expect(isValidTimeOfDay("00:00")).toBe(true);
    expect(isValidTimeOfDay("17:00")).toBe(true);
    expect(isValidTimeOfDay("23:59")).toBe(true);
  });

  it("rejects out-of-range, malformed, or missing values", () => {
    expect(isValidTimeOfDay("24:00")).toBe(false);
    expect(isValidTimeOfDay("9:00")).toBe(false);
    expect(isValidTimeOfDay("17:00:00")).toBe(false);
    expect(isValidTimeOfDay("5pm")).toBe(false);
    expect(isValidTimeOfDay("")).toBe(false);
    expect(isValidTimeOfDay(null)).toBe(false);
    expect(isValidTimeOfDay(undefined)).toBe(false);
  });
});
