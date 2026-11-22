/**
 * Utility functions for shared input components.
 * Cleans pasted input (currency symbols, commas, spaces, percentages),
 * validates decimal bounds without layout shift, and manages accessible error states.
 */

export function sanitizeNumberString(raw: string): string {
  if (!raw) return "";

  // Remove currency signs, commas, spaces, percentage signs
  let cleaned = raw.replace(/[$£€,\s%]/g, "");

  // Handle minus sign (allow only at the beginning)
  const isNegative = cleaned.startsWith("-");
  cleaned = cleaned.replace(/-/g, "");

  // Keep only digits and at most one decimal point
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }

  // Remove any remaining non-digit/non-period characters
  cleaned = cleaned.replace(/[^0-9.]/g, "");

  return isNegative ? `-${cleaned}` : cleaned;
}

export interface ValidationRule {
  min?: number;
  max?: number;
  required?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error: string;
}

export function validateNumber(
  valueStr: string,
  rules: ValidationRule = {},
): ValidationResult {
  const trimmed = valueStr.trim();

  if (trimmed === "") {
    if (rules.required) {
      return { valid: false, error: "This field is required." };
    }
    return { valid: true, error: "" };
  }

  const num = Number(trimmed);
  if (isNaN(num)) {
    return { valid: false, error: "Please enter a valid number." };
  }

  if (rules.min !== undefined && num < rules.min) {
    return { valid: false, error: `Minimum value is ${rules.min}.` };
  }

  if (rules.max !== undefined && num > rules.max) {
    return { valid: false, error: `Maximum value is ${rules.max}.` };
  }

  return { valid: true, error: "" };
}

/**
 * Attaches client-side paste interception and input validation to an input element.
 */
export function attachInputEnhancements(
  input: HTMLInputElement,
  errorEl: HTMLElement | null,
  rules: ValidationRule = {},
): () => void {
  const onPaste = (e: ClipboardEvent) => {
    const pasteData = e.clipboardData?.getData("text") || "";
    if (/[$£€,\s%]/.test(pasteData)) {
      e.preventDefault();
      const sanitized = sanitizeNumberString(pasteData);
      input.value = sanitized;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const onInput = () => {
    // Check if the current value has illegal pasted symbols
    if (/[$£€,\s%]/.test(input.value)) {
      input.value = sanitizeNumberString(input.value);
    }

    const res = validateNumber(input.value, rules);
    if (!res.valid) {
      input.setAttribute("aria-invalid", "true");
      if (errorEl) {
        errorEl.textContent = res.error;
        errorEl.classList.remove("invisible");
      }
    } else {
      input.removeAttribute("aria-invalid");
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.classList.add("invisible");
      }
    }
  };

  input.addEventListener("paste", onPaste);
  input.addEventListener("input", onInput);

  // Return cleanup function
  return () => {
    input.removeEventListener("paste", onPaste);
    input.removeEventListener("input", onInput);
  };
}
