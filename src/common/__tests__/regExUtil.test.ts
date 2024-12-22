import { createNonGlobalRegex, escapeRegexCharacters, findNonWhiteSpace, findWhiteSpace } from '../regExUtil';

describe('regExUtil', () => {
  describe('escapeRegexCharacters()', () => {
    it('empty string -> empty string', () => {
      expect(escapeRegexCharacters('')).toBe('');
    });

    it('no special characters -> same string', () => {
      expect(escapeRegexCharacters('abc')).toBe('abc');
    });

    it('special characters in middle of string -> escaped string', () => {
      expect(escapeRegexCharacters('a.b')).toBe('a\\.b');
    });

    it('special characters at start of string -> escaped string', () => {
      expect(escapeRegexCharacters('.ab')).toBe('\\.ab');
    });

    it('special characters at end of string -> escaped string', () => {
      expect(escapeRegexCharacters('ab.')).toBe('ab\\.');
    });

    it('multiple special characters in middle of string -> escaped string', () => {
      expect(escapeRegexCharacters('a.b.c')).toBe('a\\.b\\.c');
    });

    // No point in testing all special characters, as that would just be a 
    // restatement of the regex.
  });

  describe('createNonGlobalRegex()', () => {
    it('regex is global -> regex is non-global', () => {
      const regex = /abc/g;
      const result = createNonGlobalRegex(regex);
      expect(result).not.toBe(regex);
      expect(result.source).toBe(regex.source);
      expect(result.flags).toBe('');
    });

    it('regex is not global -> same regex', () => {
      const regex = /abc/;
      const result = createNonGlobalRegex(regex);
      expect(result).toBe(regex);
    });

    it('regex is empty -> same regex', () => {
      const regex = /(?:)/;
      const result = createNonGlobalRegex(regex);
      expect(result).toBe(regex);
    });
  });

  describe('findNonWhiteSpace()', () => {
    it('empty string -> -1', () => {
      expect(findNonWhiteSpace('')).toBe(-1);
    });

    it('no non-whitespace characters -> -1', () => {
      const text = '\t\n\v\f\r ';
      expect(findNonWhiteSpace(text)).toBe(-1);
    });

    it('non-whitespace characters at start -> 0', () => {
      expect(findNonWhiteSpace('abc')).toBe(0);
    });

    it('non-whitespace characters in middle -> 1', () => {
      expect(findNonWhiteSpace(' a c')).toBe(1);
    });

    it('non-whitespace characters at end -> 2', () => {
      expect(findNonWhiteSpace('  a')).toBe(2);
    });

    it('fromPos starts with non-whitespace character -> fromPos', () => {
      expect(findNonWhiteSpace('abc', 1)).toBe(1);
    });

    it('fromPos starts with whitespace char, followed by non-ws -> next non-ws', () => {
      expect(findNonWhiteSpace(' a c', 1)).toBe(1);
    });

    it('fromPos starts ws, and has no non-ws chars following -> -1', () => {
      expect(findNonWhiteSpace('  ', 1)).toBe(-1);
    });

    it('fromPos is -1 -> -1', () => {
      expect(findNonWhiteSpace('abc', -1)).toBe(-1);
    });

    it('fromPos is past end -> -1', () => {
      expect(findNonWhiteSpace('abc', 3)).toBe(-1);
    });
  });

  describe('findWhiteSpace()', () => {
    it('empty string -> -1', () => {
      expect(findWhiteSpace('')).toBe(-1);
    });

    it('no whitespace characters -> -1', () => {
      const text = 'abc';
      expect(findWhiteSpace(text)).toBe(-1);
    });

    it('whitespace characters at start -> 0', () => {
      expect(findWhiteSpace(' abc')).toBe(0);
    });

    it('whitespace characters in middle -> 1', () => {
      expect(findWhiteSpace('a c')).toBe(1);
    });

    it('whitespace characters at end -> 2', () => {
      expect(findWhiteSpace('ab ')).toBe(2);
    });

    it('fromPos starts with whitespace character -> fromPos', () => {
      expect(findWhiteSpace('a c', 1)).toBe(1);
    });

    it('fromPos starts with non-WS char, followed by whitespace -> next ws', () => {
      expect(findWhiteSpace('ab c', 1)).toBe(2);
    });

    it('fromPos starts non-ws, and has no ws chars following -> -1', () => {
      expect(findWhiteSpace('abc', 1)).toBe(-1);
    });

    it('fromPos is -1 -> -1', () => {
      expect(findWhiteSpace('abc', -1)).toBe(-1);
    });

    it('fromPos is past end -> -1', () => {
      expect(findWhiteSpace('abc', 3)).toBe(-1);
    });
  });
});