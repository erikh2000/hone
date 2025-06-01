import { describe, it, expect } from 'vitest';

import { findUniqueName } from '../nameUtil';

describe('nameUtil', () => {
  describe('findUniqueName()', () => {
    it('should return baseName when no existing names', () => {
      expect(findUniqueName('name', [])).toBe('name');
    });

    it('should return baseName when baseName is not in existing names', () => {
      expect(findUniqueName('name', ['name1', 'name2'])).toBe('name');
    });

    it('should return baseName (1) when baseName is in existing names', () => {
      expect(findUniqueName('name', ['name', 'name1', 'name2'])).toBe('name (1)');
    });

    it('should return baseName (2) when baseName and baseName (1) are in existing names', () => {
      expect(findUniqueName('name', ['name', 'name (1)', 'name2'])).toBe('name (2)');
    });
  });
});