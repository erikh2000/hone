import { describe, it, expect } from 'vitest';

import { fillTemplate, isEmpty } from "../stringUtil";

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

  describe('fillTemplate()', () => {
      it('returns empty string for empty template', () => {
        const template = '';
        const variables = {};
        const expected = '';
        expect(fillTemplate(template, variables)).toEqual(expected);
      });
  
      it('returns unmodified template string when contains no replacement markers', () => {
        const template = 'quick brown fox';
        const variables = {color:'red'};
        const expected = 'quick brown fox';
        expect(fillTemplate(template, variables)).toEqual(expected);
      });
  
      it('returns unmodified template string when contains no matching replacements', () => {
        const template = 'quick brown {animal}';
        const variables = {color:'red'};
        const expected = 'quick brown {animal}';
        expect(fillTemplate(template, variables)).toEqual(expected);
      });
  
      it('returns string with a replacement', () => {
        const template = 'quick brown {animal}';
        const variables = {animal:'fox'};
        const expected = 'quick brown fox';
        expect(fillTemplate(template, variables)).toEqual(expected);
      });
  
      it('returns string with same marker replaced in multiple locations', () => {
        const template = 'quick brown {animal} was a {animal}';
        const variables = {animal:'fox'};
        const expected = 'quick brown fox was a fox';
        expect(fillTemplate(template, variables)).toEqual(expected);
      });
  
      it('returns string with replacements made to different markers', () => {
        const template = 'quick {color} {animal}';
        const variables = {animal:'fox', color:'brown'};
        const expected = 'quick brown fox';
        expect(fillTemplate(template, variables)).toEqual(expected);
      });
    });
});  