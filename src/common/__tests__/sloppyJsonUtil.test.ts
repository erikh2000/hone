import { describe, it, expect } from 'vitest';

import { parseSimpleResponse } from '../sloppyJsonUtil';

describe('sloppyJsonUtil', () => {
  describe('parseSimpleResponse()', () => {
    it('returns empty string for an empty string', () => {
      expect(parseSimpleResponse('')).toBe('');
    });

    it('parses whitespace to an empty string', () => {
      expect(parseSimpleResponse(' \n\t')).toBe('');
    });

    it('parses non-whitespace to an empty string', () => {
      expect(parseSimpleResponse(' \n\t')).toBe('');
    });

    it('parses `{` to an empty string', () =>{
      expect(parseSimpleResponse('{')).toBe('');
    })

    it('parses `{r` to an empty string', () => {
      expect(parseSimpleResponse('{"r')).toBe('');
    });

    it('parses `{"r` to an empty string', () => {
      expect(parseSimpleResponse('{"r')).toBe('');
    });

    it('parses `{"r"` to an empty string', () => {
      expect(parseSimpleResponse('{"r"')).toBe('');
    });

    it('parses `{"r":` to an empty string', () => {
      expect(parseSimpleResponse('{"r":')).toBe('');
    });

    it('parses `{"r": ` to an empty string', () => {
      expect(parseSimpleResponse('{"r": ')).toBe('');
    });

    it('parses `{"r":"` to an empty string"', () => {
      expect(parseSimpleResponse('{"r":')).toBe('');
    });

    it('parses `{"r":""` to an empty string', () => {
      expect(parseSimpleResponse('{"r":""')).toBe('');
    });

    it('parses `{"r":  ` to an empty string', () => {
      expect(parseSimpleResponse('{"r":  ')).toBe('');
    });

    it('parses `{"r":"your answer` to `your answer`', () => {
      expect(parseSimpleResponse('{"r":"your answer')).toBe('your answer');
    });

    it('parses `{"r":"your answer"` to `your answer`', () => {
      expect(parseSimpleResponse('{"r":"your answer"')).toBe('your answer');
    });

    it('parses `{"r": "your answer"` to `your answer`', () => {
      expect(parseSimpleResponse('{"r": "your answer"')).toBe('your answer');
    });

    it('parses `{"r":"your answer"}` to `your answer`', () => {
      expect(parseSimpleResponse('{"r":"your answer"}')).toBe('your answer');
    });

    it('parses `{"r":3` to 3', () => {
      expect(parseSimpleResponse('{"r":3')).toBe(3);
    });

    it('parses `{"r": 3}` to `3`', () => {
      expect(parseSimpleResponse('{"r": 3}')).toBe(3);
    });

    it('parses `{"r":3.14` to 3.14', () => {
      expect(parseSimpleResponse('{"r":3.14')).toBe(3.14);
    });

    it('parses `{"r":-7` to -7', () => {
      expect(parseSimpleResponse('{"r":-7')).toBe(-7);
    });

    it('parses `{"r": -7}` to -7', () => {
      expect(parseSimpleResponse('{"r": -7}')).toBe(-7);
    });

    it('parses `{"r":7x` to `7x`', () => {
      expect(parseSimpleResponse('{"r":7x')).toBe('7x');
    });

    it('parses `{"r":true` to true', () => {
      expect(parseSimpleResponse('{"r":true')).toBe(true);
    });

    it('parses `{"r": true}` to true', () => {
      expect(parseSimpleResponse('{"r": true}')).toBe(true);
    });

    it('parses `{"r":TRUE` to true', () => {
      expect(parseSimpleResponse('{"r":TRUE')).toBe(true);
    });

    it('parses `{"r":truex` to `truex`', () => {
      expect(parseSimpleResponse('{"r":truex')).toBe('truex');
    });

    it('parses `{"r":false` to false', () => {
      expect(parseSimpleResponse('{"r":false')).toBe(false);
    });

    it('parses `{"r": false}` to false', () => {
      expect(parseSimpleResponse('{"r": false}')).toBe(false);
    });

    it('parses `{"r":FALSE}` to false', () => {
      expect(parseSimpleResponse('{"r":FALSE')).toBe(false);
    });

    it('parses `{"r":falsex` to `falsex`', () => {
      expect(parseSimpleResponse('{"r":falsex')).toBe('falsex');
    });

    it('parses `{"r":null` to null', () => {
      expect(parseSimpleResponse('{"r":null')).toBe(null);
    });

    it('parses `{"r": null}` to null', () => {
      expect(parseSimpleResponse('{"r": null}')).toBe(null);
    });

    it('parses `{"r":"null` to `null`', () => {
      expect(parseSimpleResponse('{"r":"null')).toBe('null');
    });

    it('parses `{"r":nullx` to `nullx`', () => {
      expect(parseSimpleResponse('{"r":"nullx')).toBe('nullx');
    });

    it('parses `{"r":[]` to `[]`', () => {
      expect(parseSimpleResponse('{"r":[]')).toBe('[]');
    });

    it('parses `{"r": []` to `[]`', () => {
      expect(parseSimpleResponse('{"r": []')).toBe('[]');
    });

    it('parses `{"r":[]}` to `[]`', () => {
      expect(parseSimpleResponse('{"r":[]}')).toBe('[]');
    });

    it('parses `{"r":{}` to `{}`', () => {
      expect(parseSimpleResponse('{"r":[]')).toBe('[]');
    });

    it('parses `{"r": {}` to `{}`', () => {
      expect(parseSimpleResponse('{"r": []')).toBe('[]');
    });

    it('parses `{"r":{"r":"dog"}` to `{"r":"dog"`', () => {
      expect(parseSimpleResponse('{"r":{"r":"dog"}')).toBe('{"r":"dog"');
    });

    it('parses `{"r":{"r":"dog"}}` to `{"r":"dog"}`', () => {
      expect(parseSimpleResponse('{"r":{"r":"dog"}}')).toBe('{"r":"dog"}');
    });
  });
});