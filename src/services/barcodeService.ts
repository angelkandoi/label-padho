// Barcode validation and scanner debouncing service per PRD Section 3.

/**
 * Validates check digit for standard GS1 barcodes (EAN-13, EAN-8, UPC-A).
 * Why needed: Rejects mistyped or corrupt camera barcode reads before making API calls.
 */
export function validateCheckDigit(barcode: string): boolean {
  const cleaned = barcode.trim();
  if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(cleaned)) {
    return false;
  }

  const digits = cleaned.split('').map(Number);
  const checkDigit = digits[digits.length - 1];
  const dataDigits = digits.slice(0, digits.length - 1);

  let sum = 0;
  // Step backwards from rightmost data digit, alternating weights 3 and 1
  for (let i = 0; i < dataDigits.length; i++) {
    const digit = dataDigits[dataDigits.length - 1 - i];
    const weight = i % 2 === 0 ? 3 : 1;
    sum += digit * weight;
  }

  const expectedCheckDigit = (10 - (sum % 10)) % 10;
  return checkDigit === expectedCheckDigit;
}

/**
 * Validates if an input barcode string has a supported length and valid check digit.
 * Why needed: Validates barcode for both camera scanner and manual keyboard entry.
 */
export function validateBarcode(barcode: string): { valid: boolean; error?: string } {
  const cleaned = barcode.trim();
  if (!cleaned) {
    return { valid: false, error: 'Please enter a barcode number.' };
  }

  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'Barcode must contain numbers only.' };
  }

  if (![8, 12, 13, 14].includes(cleaned.length)) {
    return { valid: false, error: 'Barcode must be 8, 12, or 13 digits.' };
  }

  if (!validateCheckDigit(cleaned)) {
    return { valid: false, error: 'Invalid barcode.' };
  }

  return { valid: true };
}

export class BarcodeDebouncer {
  private lastBarcode: string | null = null;
  private lastScanTime: number = 0;
  private debounceMs: number;

  constructor(debounceMs: number = 3000) {
    this.debounceMs = debounceMs;
  }

  /**
   * Checks if a scan event should be accepted or ignored.
   * Why needed: Prevents camera viewfinder from triggering rapid duplicate queries within 3 seconds.
   */
  shouldAcceptScan(barcode: string, now: number = Date.now()): boolean {
    const cleaned = barcode.trim();
    if (cleaned === this.lastBarcode && now - this.lastScanTime < this.debounceMs) {
      return false;
    }
    this.lastBarcode = cleaned;
    this.lastScanTime = now;
    return true;
  }

  /**
   * Resets debounce state.
   * Why needed: Allows immediate rescan when navigating back to camera screen.
   */
  reset(): void {
    this.lastBarcode = null;
    this.lastScanTime = 0;
  }
}

