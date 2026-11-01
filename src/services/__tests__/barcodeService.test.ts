// Unit tests for barcode validation and debouncing per PRD Section 3.

import { validateBarcode, validateCheckDigit, BarcodeDebouncer } from '../barcodeService';

describe('barcodeService', () => {
  describe('validateCheckDigit', () => {
    it('validates correct EAN-13 check digits', () => {
      // 4006381333931 is official GS1 example
      expect(validateCheckDigit('4006381333931')).toBe(true);
      // 8901030925542 is verified Indian biscuit barcode
      expect(validateCheckDigit('8901030925542')).toBe(true);
    });

    it('rejects invalid EAN-13 check digits', () => {
      expect(validateCheckDigit('4006381333939')).toBe(false);
      expect(validateCheckDigit('8901030925541')).toBe(false);
    });

    it('validates correct EAN-8 check digits', () => {
      // 73513537 is official GS1 EAN-8 example
      expect(validateCheckDigit('73513537')).toBe(true);
    });

    it('validates correct 12-digit UPC check digits', () => {
      // 614141123452 is official GS1 UPC-12 example
      expect(validateCheckDigit('614141123452')).toBe(true);
    });

    it('rejects invalid length numbers', () => {
      expect(validateCheckDigit('12345')).toBe(false);
      expect(validateCheckDigit('123456789012345')).toBe(false);
    });
  });

  describe('validateBarcode', () => {
    it('accepts valid 13-digit barcode', () => {
      const result = validateBarcode('4006381333931');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects empty or whitespace input', () => {
      const result = validateBarcode('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please enter a barcode number.');
    });

    it('rejects non-digit characters', () => {
      const result = validateBarcode('400638133393A');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Barcode must contain numbers only.');
    });

    it('rejects invalid check digits with clear message', () => {
      const result = validateBarcode('4006381333939');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid barcode check digit.');
    });
  });

  describe('BarcodeDebouncer', () => {
    it('ignores repeat scans within 3000 ms', () => {
      const debouncer = new BarcodeDebouncer(3000);
      const barcode = '4006381333931';

      expect(debouncer.shouldAcceptScan(barcode, 1000)).toBe(true);
      expect(debouncer.shouldAcceptScan(barcode, 2000)).toBe(false);
      expect(debouncer.shouldAcceptScan(barcode, 3999)).toBe(false);
      expect(debouncer.shouldAcceptScan(barcode, 4001)).toBe(true);
    });

    it('accepts different barcode immediately without waiting', () => {
      const debouncer = new BarcodeDebouncer(3000);

      expect(debouncer.shouldAcceptScan('4006381333931', 1000)).toBe(true);
      expect(debouncer.shouldAcceptScan('8901030925542', 1500)).toBe(true);
    });

    it('resets debounce tracking', () => {
      const debouncer = new BarcodeDebouncer(3000);
      const barcode = '4006381333931';

      expect(debouncer.shouldAcceptScan(barcode, 1000)).toBe(true);
      debouncer.reset();
      expect(debouncer.shouldAcceptScan(barcode, 1500)).toBe(true);
    });
  });
});
