import { describe, it, expect } from 'vitest';

import Rowset from "@/sheets/types/Rowset";
import { COMMA, rowArrayToCsvUnicode, rowArrayToCsvUtf8, TAB } from "../csvExportUtil";

describe('csvExportUtil', () => {
  describe('rowArrayToCsvUnicode()', () => {
    describe('error checking', () => {
      // Need a control test for any throws beneath to be meaningful.
      it('does not throw if row has same fields as field names', () => { 
        const rowArray = [ ['a', 'b', 'c'] ];
        const fieldNames = ['one', 'two', 'three'];
        expect(() => rowArrayToCsvUnicode(rowArray, fieldNames, false)).not.toThrow();
      });

      it('throws if any row has less fields than field names', () => {
        const rowArray = [
          ['a', 'b', 'c'],
          ['a', 'b']
        ];
        const fieldNames = ['one', 'two', 'three'];
        expect(() => rowArrayToCsvUnicode(rowArray, fieldNames, false)).toThrow();
      });

      it('throws if any row has more fields than field names', () => {
        const rowArray = [
          ['a', 'b', 'c'],
          ['a', 'b', 'c', 'd']
        ];
        const fieldNames = ['one', 'two', 'three'];
        expect(() => rowArrayToCsvUnicode(rowArray, fieldNames, false)).toThrow();
      });

      it('throws if fieldNames is empty', () => {
        const rowArray:Rowset = [];
        const fieldNames:string[] = [];
        expect(() => rowArrayToCsvUnicode(rowArray, fieldNames, false)).toThrow();
      });
    });

    describe('datasets with no rows', () => {
      it('encodes an empty string when addHeader is false and row array is empty', () => {
        const rowArray:Rowset = [];
        const fieldNames = ['one', 'two', 'three'];
        const addHeaders = false;
        const expected = '';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes an array of header names when addHeader is true and row array is empty', () => {
        const rowArray:Rowset = [];
        const fieldNames = ['one', 'two', 'three'];
        const addHeaders = true;
        const expected = 'one\ttwo\tthree\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });
    });

    describe('datasets with rows', () => {
      it('encodes a one-column-one-row dataset', () => {
        const rowArray = [ ['a'] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\na\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes a two-column-one-row dataset', () => {
        const rowArray = [ ['a', 'b'] ];
        const fieldNames = ['one', 'two'];
        const addHeaders = true;
        const expected = 'one\ttwo\r\na\tb\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes a one-column-two-row dataset', () => {
        const rowArray = [ ['a'], ['b'] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\na\r\nb\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes a two-column-two-row dataset', () => {
        const rowArray = [ ['a', 'b'], ['c', 'd'] ];
        const fieldNames = ['one', 'two'];
        const addHeaders = true;
        const expected = 'one\ttwo\r\na\tb\r\nc\td\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes a dataset with comma delimiter', () => {
        const rowArray = [ ['a', 'b'], ['c', 'd'] ];
        const fieldNames = ['one', 'two'];
        const addHeaders = true;
        const expected = 'one,two\r\na,b\r\nc,d\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders, COMMA)).toBe(expected);
      });
    })

    describe('headings', () => {
      it('encodes a heading preserving lower and upper case', () => {
        const rowArray:Rowset = [];
        const fieldNames = ['One'];
        const addHeaders = true;
        const expected = 'One\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes a heading preserving interior whitespace', () => {
        const rowArray:Rowset = [];
        const fieldNames = ['One Two'];
        const addHeaders = true;
        const expected = `One Two\r\n`;
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes a heading trimming leading whitespace', () => {
        const rowArray:Rowset = [];
        const fieldNames = [' One'];
        const addHeaders = true;
        const expected = 'One\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes a heading trimming trailing whitespace', () => {
        const rowArray:Rowset = [];
        const fieldNames = ['One '];
        const addHeaders = true;
        const expected = 'One\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes a heading preserving non-alphanumeric ASCII characters', () => {
        const rowArray:Rowset = [];
        const fieldNames = ['One!@#$%^&*()_+'];
        const addHeaders = true;
        const expected = `One!@#$%^&*()_+\r\n`;
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes a heading preserving quote characters', () => {
        const rowArray:Rowset = [];
        const fieldNames = ['One"'];
        const addHeaders = true;
        const expected = `"One"""\r\n`;
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes a heading preserving field delimiter characters when delimiter is comma', () => {
        const rowArray:Rowset = [];
        const fieldNames = ['One,'];
        const addHeaders = true;
        const expected = `"One,"\r\n`;
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders, COMMA)).toBe(expected);
      });

      it('encodes a heading preserving field delimiter characters when delimiter is tab', () => {
        const rowArray:Rowset = [];
        const fieldNames = ['One\tTwo'];
        const addHeaders = true;
        const expected = `"One\tTwo"\r\n`;
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders, TAB)).toBe(expected);
      });

      it('encodes a heading preserving row delimeter characters', () => {
        const rowArray:Rowset = [];
        const fieldNames = ['One\rTwo\nThree\r\nFour'];
        const addHeaders = true;
        const expected = `"One\rTwo\nThree\r\nFour"\r\n`;
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders, TAB)).toBe(expected);
      });

      it('encodes a heading preserving Unicode (non-ASCII) characters', () => {
        const rowArray:Rowset = [];
        const fieldNames = ['One😀'];
        const addHeaders = true;
        const expected = 'One😀\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });
    });

    // * Encodes date/time as an ISO string
    describe('date and time values', () => {
      it('encodes a date as an ISO string', () => {
        const rowArray = [ [new Date('2021-08-01 1:23 am')] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\n2021-08-01T08:23:00.000Z\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });
    });

    describe('text cell values', () => {
      it('encodes text preserving lower and upper case', () => {
        const rowArray = [ ['One'] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\nOne\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes text preserving interior whitespace', () => {
        const rowArray = [ ['One Two'] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = `one\r\nOne Two\r\n`;
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes text preserving leading whitespace', () => {
        const rowArray = [ [' One'] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\n One\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes text preserving trailing whitespace', () => {
        const rowArray = [ ['One '] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\nOne \r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes text preserving non-alphanumeric ASCII characters', () => {
        const rowArray = [ ['One!@#$%^&*()_+'] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = `one\r\nOne!@#$%^&*()_+\r\n`;
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes text preserving quote characters', () => {
        const rowArray = [ ['One"'] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = `one\r\n"One"""\r\n`;
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes text preserving field delimiter characters when delimiter is comma', () => {
        const rowArray = [ ['One,'] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = `one\r\n"One,"\r\n`;
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders, COMMA)).toBe(expected);
      });

      it('encodes text preserving field delimiter characters when delimiter is tab', () => {
        const rowArray = [ ['One\tTwo'] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = `one\r\n"One\tTwo"\r\n`;
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders, TAB)).toBe(expected);
      });

      it('encodes text preserving row delimeter characters', () => {
        const rowArray = [ ['One\rTwo\nThree\r\nFour'] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = `one\r\n"One\rTwo\nThree\r\nFour"\r\n`;
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders, TAB)).toBe(expected);
      });

      it('encodes text containing Unicode (non-ASCII) characters', () => {
        const rowArray = [ ['One😀'] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\nOne😀\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });
    });

    describe('numeric cell values', () => {
      it('encodes a positive whole integer', () => {
        const rowArray = [ [123] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\n123\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes a negative whole integer', () => {
        const rowArray = [ [-123] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\n-123\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes a positive decimal', () => {
        const rowArray = [ [123.456] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\n123.456\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes a negative decimal', () => {
        const rowArray = [ [-123.456] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\n-123.456\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes Infinity as string', () => {
        const rowArray = [ [Infinity] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\nInfinity\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes -Infinity as string', () => {
        const rowArray = [ [-Infinity] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\n-Infinity\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes NaN as string', () => {
        const rowArray = [ [NaN] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\nNaN\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });
    });

    // * Encodes true
    // * Encodes false
    describe('boolean cell values', () => {
      it('encodes true', () => {
        const rowArray = [ [true] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\ntrue\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes false', () => {
        const rowArray = [ [false] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\nfalse\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });
    });

    describe('null / undefined cell values', () => {
      it('encodes null as empty string', () => {
        const rowArray = [ [null] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\n\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });

      it('encodes undefined as empty string', () => {
        const rowArray = [ [undefined] ];
        const fieldNames = ['one'];
        const addHeaders = true;
        const expected = 'one\r\n\r\n';
        expect(rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders)).toBe(expected);
      });
    });
  });

  describe('rowArrayToCsvUtf8()', () => {
    it('encodes a rowset with no BOM at beginning of file', () => {
      const rowArray = [ ['a']];
      const fieldNames = ['one'];
      const addHeaders = true;
      // String version of sequence below: "one\r\na\r\n"
      const expected = new Uint8Array([111, 110, 101, 13, 10, 97, 13, 10]);
      expect(rowArrayToCsvUtf8(rowArray, fieldNames, addHeaders)).toEqual(expected);
    });

    it('encodes an ASCII-only rowset to an encoding containing no values for UTF-8 multi-byte sequences', () => {
      const rowArray = [ ['a']];
      const fieldNames = ['one'];
      const addHeaders = true;
      const received = rowArrayToCsvUtf8(rowArray, fieldNames, addHeaders);
      for(let i = 0; i < received.length; i++) {
        const value = received[i];
        expect(value).toBeLessThan(128);
      }
    });

    it('encodes a rowset with non-ASCII characters', () => {
      const rowArray = [ ['😀']];
      const fieldNames = ['one'];
      const addHeaders = true;
      // String version of sequence below: "one\r\n😀\r\n"
      const expected = new Uint8Array([111, 110, 101, 13, 10, 240, 159, 152, 128, 13, 10]);
      expect(rowArrayToCsvUtf8(rowArray, fieldNames, addHeaders)).toEqual(expected);
    });
  });
});