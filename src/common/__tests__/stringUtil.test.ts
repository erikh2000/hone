import { isEmpty } from "../stringUtil";

describe('stringUtil', () => {
  describe('isEmpty()', () => {
    it('returns true when value is null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('returns true when value is an empty string', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('returns true when value is undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('returns false when value is a string with at least one character', () => {
      expect(isEmpty('a')).toBe(false);
    });

    it('returns false when value is a number', () => {
      expect(isEmpty(1)).toBe(false);
    });

    it('returns false when value is a boolean', () => {
      expect(isEmpty(true)).toBe(false);
    });

    it('returns false when value is an object', () => {
      expect(isEmpty({})).toBe(false);
    });

    it('returns false when value is an array', () => {
      expect(isEmpty([])).toBe(false);
    });

    it('returns false when value is a function', () => {
      expect(isEmpty(() => {})).toBe(false);
    });

    it('returns false when value is a symbol', () => {
      expect(isEmpty(Symbol())).toBe(false);
    });
  });
});  