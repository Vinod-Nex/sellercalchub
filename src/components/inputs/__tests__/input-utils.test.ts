import { describe, it, expect } from "vitest";
import { sanitizeNumberString, validateNumber } from "../input-utils";

describe("input-utils: sanitizeNumberString", () => {
  it("strips dollar signs and commas from currency strings", () => {
    expect(sanitizeNumberString("$1,450.50")).toBe("1450.50");
    expect(sanitizeNumberString("$50.00")).toBe("50.00");
    expect(sanitizeNumberString("$ 100,000.99")).toBe("100000.99");
  });

  it("strips pound signs and euro signs", () => {
    expect(sanitizeNumberString("£45.00")).toBe("45.00");
    expect(sanitizeNumberString("£1,250.75")).toBe("1250.75");
    expect(sanitizeNumberString("€99.90")).toBe("99.90");
  });

  it("strips percentages and whitespace", () => {
    expect(sanitizeNumberString(" 15% ")).toBe("15");
    expect(sanitizeNumberString("12.5%")).toBe("12.5");
  });

  it("preserves single decimal point and consolidates multiple points", () => {
    expect(sanitizeNumberString("12.34.56")).toBe("12.3456");
    expect(sanitizeNumberString("0.99")).toBe("0.99");
  });

  it("handles empty and negative values appropriately", () => {
    expect(sanitizeNumberString("")).toBe("");
    expect(sanitizeNumberString("-$25.00")).toBe("-25.00");
  });
});

describe("input-utils: validateNumber", () => {
  it("validates numbers within min/max bounds", () => {
    expect(validateNumber("50", { min: 0, max: 100 }).valid).toBe(true);
    expect(validateNumber("-5", { min: 0 }).valid).toBe(false);
    expect(validateNumber("-5", { min: 0 }).error).toBe("Minimum value is 0.");
    expect(validateNumber("150", { max: 100 }).valid).toBe(false);
    expect(validateNumber("150", { max: 100 }).error).toBe(
      "Maximum value is 100.",
    );
  });

  it("handles non-numeric input", () => {
    expect(validateNumber("abc").valid).toBe(false);
    expect(validateNumber("abc").error).toBe("Please enter a valid number.");
  });

  it("handles required checks", () => {
    expect(validateNumber("", { required: true }).valid).toBe(false);
    expect(validateNumber("", { required: true }).error).toBe(
      "This field is required.",
    );
    expect(validateNumber("", { required: false }).valid).toBe(true);
  });
});
