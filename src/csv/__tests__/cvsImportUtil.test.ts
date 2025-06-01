import { describe, it, expect } from 'vitest';

import { encodeUtf8 } from '@/common/stringUtil';
import { csvUnicodeToRowArray, csvUtf8ToRowArray, MAX_FIELDNAME_LENGTH, MAX_FIELD_COUNT } from '../csvImportUtil';

describe('cvsImportUtil', () => {
  describe('csvUnicodeToRowArray()', () => {
    describe('general importing', () => {
      it('throws if text is empty', () => {
        const text = '';
        expect(() => csvUnicodeToRowArray(text, true)).toThrow();
      });

      it('throws if text is whitespace', () => {
        const text = '  ';
        expect(() => csvUnicodeToRowArray(text, true)).toThrow();
      });

      it('uses first row of text as header row if includeHeaders is true', () => {
        const text = 'field1,field2\nvalue1,value2';
        const expected = [['field1', 'field2'], ['value1', 'value2']];
        const result = csvUnicodeToRowArray(text, true);
        expect(result).toEqual(expected);
      });

      it('uses generated header row if includeHeaders is false', () => {
        const text = 'value1,value2';
        const expected = [['A', 'B'], ['value1', 'value2']];
        const result = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });

      it('imports text that only contains a header row', () => {
        const text = 'field1,field2';
        const expected = [['field1', 'field2']];
        const result = csvUnicodeToRowArray(text, true);
        expect(result).toEqual(expected);
      });

      it('throws if text contains more than MAX_FIELD_COUNT fields', () => {
        const fieldCount = MAX_FIELD_COUNT + 1;
        const text = 'A,'.repeat(fieldCount);
        expect(() => csvUnicodeToRowArray(text, true)).toThrow();
      });

      it('throws for an inconsistent field count found after 20 rows', () => {
        const text = 'A,B\n'.repeat(20) + 'A';
        expect(() => csvUnicodeToRowArray(text, true)).toThrow();
      });
    });

    describe('row splitting', () => {
      it('returns one row plus headers for text containing no row delimiters', () =>{
        const text = 'no delimiters';
        const expected = [['A'], ['no delimiters']];
        const result = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });

      it('returns two rows plus headers for text containing one row delimiter', () => {
        const text = 'line1\nline2';
        const expected = [['A'], ['line1'], ['line2']];
        const result = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });

      it('returns two rows plus headers for text containing a CRLF delimiter', () => {
        const text = 'line1\r\nline2';
        const expected = [['A'], ['line1'], ['line2']];
        const result = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });

      it('returns one row plus headers for text containing a row delimiter inside of quotes', () => {
        const text = '"line1\nline2"';
        const expected = [['A'], ['line1\nline2']];
        const result = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });

      it('returns one row plus headers for text containing two row delimiters inside of quotes', () => {
        const text = '"a\nb\nc"';
        const expected = [['A'], ['a\nb\nc']];
        const result = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });

      it('returns two rows plus headers for text containing a row delimiter outside of quotes', () => {
        const text = 'line1\n"line2"';
        const expected = [['A'], ['line1'], ['line2']];
        const result = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });

      it('parses rows with a row delimiter on last row', () => {
        const text = 'line1\nline2\n';
        const expected = [['A'], ['line1'], ['line2']];
        const result = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });

      it('parses rows with a CRLF on last row', () => {
        const text = 'line1\r\nline2\r\n';
        const expected = [['A'], ['line1'], ['line2']];
        const result = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });
    });

    describe('generating header rows', () => {
      it('Generates "A" header for field count of 1', () => {
        const text = 'a';
        const expected = [['A'], ['a']];
        const result = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });

      it('Generates "A","B" headers for field count of 2', () => {
        const text = 'a,b';
        const headerRow = ['A', 'B'];
        const valueRow = ['a', 'b'];
        const expected = [headerRow, valueRow];
        const result = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });

      it('Returns ["A"..."Z"] for field count of 26.', () => {
        const text = 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z';
        const headerRow = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const valueRow = 'abcdefghijklmnopqrstuvwxyz'.split('');
        const expected = [headerRow, valueRow];
        const result = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });

      it('Returns ["A"..."Z","AA"] for field count of 27.', () => {
        const text = 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,aa';
        const expected = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(['AA']);
        const [result,] = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });

      it('Returns ["A"..."Z","AA","AB"] for field count of 28.', () => {
        const text = 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,aa,ab';
        const expected = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(['AA','AB']);
        const [result,] = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });

      it('Returns ["A"..."Z","AA"..."BZ"] for field count of 52.', () => {
        const text = 
          'abcdefghijklmnopqrstuvwxyz'.split('').join(',')+','+
          'abcdefghijklmnopqrstuvwxyz'.split('').join(',');
        const first26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const second26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => 'A' + c);
        const expected = first26.concat(second26);
        const [result,] = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });

      it('Returns ["A"..."Z","AA"..."AZ","BA"] for field count of 53.', () => {
        const text = 'x'.repeat(53).split('').join(',');
        const first26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const second26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => 'A' + c);
        const expected = first26.concat(second26).concat(['BA']);
        const [result,] = csvUnicodeToRowArray(text, false);
        expect(result).toEqual(expected);
      });
    });

    describe('detecting field delimiter', () => {
      it('Throws UNSTRUCTURED if both comma-delimited and tab-delimited have inconsistent field counts on 2nd row.', () => {
        const text = 'A,AAAB,B\tBBCC\tCC\nDD\tDDEE,EEFFFF';
        expect(() => csvUnicodeToRowArray(text,true)).toThrow();
      });

      it('Parses fields with TAB delimiter if comma-delimited results in field count inconsistency, but tab-delimited does not.', () => {
        const text = 'AA\tAABB,BBCCCC\nDDDDEEEEFF\tFF';
        const expected = [['AA','AABB,BBCCCC'],['DDDDEEEEFF','FF']];
        const result = csvUnicodeToRowArray(text,true);
        expect(result).toEqual(expected);
      });

      it('Parses fields with COMMA delimiter if tab-delimited results in field count inconsistency, but comma-delimited does not.', () => {
        const text = 'AA\tAABB,BBC\tCCC\nDDDDEE,EEFF\tFF';
        const expected = [['AA\tAABB','BBC\tCCC'],['DDDDEE','EEFF\tFF']];
        const result = csvUnicodeToRowArray(text,true);
        expect(result).toEqual(expected);
      });

      it('Parses fields with TAB delimiter if tab-delimited has a higher field count than comma-delimited.', () => {
        const text = 'AA\tAABBBBCCCC\nDDDDEEEEFF\tFF';
        const expected = [['AA','AABBBBCCCC'],['DDDDEEEEFF','FF']];
        const result = csvUnicodeToRowArray(text,true);
        expect(result).toEqual(expected);
      });

      it('Parses fields with COMMA delimiter if comma-delimited has a higher field count than tab-delimited.', () => {
        const text = 'AAAABB,BBCCCC\nDDDDEEEEFF,FF';
        const expected = [['AAAABB','BBCCCC'],['DDDDEEEEFF','FF']];
        const result = csvUnicodeToRowArray(text,true);
        expect(result).toEqual(expected);
      });

      it('Parses fields with TAB delimiter if tab-delimited and comma-delimited have same field count and no field count inconsistency.', () => {
        const text = 'AA\tAABB,BBCCCC\nDDDDE,EEEFF\tFF';
        const expected = [['AA','AABB,BBCCCC'],['DDDDE,EEEFF','FF']];
        const result = csvUnicodeToRowArray(text,true);
        expect(result).toEqual(expected);
      });

      it('In a longer rowset, parses fields with COMMA delimiter if comma-delimited has a higher field count than tab-delimited.', () => {
        const text = 'A,B\nA,B\nA,B\nA,B\nA,B\nA,B\nA,B\nA,B\nA,B\nA,B\nA,B\nA,B';
        const expected = ['A','B'];
        const result = csvUnicodeToRowArray(text,true);
        expect(result[0]).toEqual(expected);
      });

      it('In a longer rowset, parses fields with tab delimiter if tab-delimited has a higher field count than comma-delimited.', () => {
        const text = 'A\tB\nA\tB\nA\tB\nA\tB\nA\tB\nA\tB\nA\tB\nA\tB\nA\tB\nA\tB';
        const expected = ['A','B'];
        const result = csvUnicodeToRowArray(text,true);
        expect(result[0]).toEqual(expected);
      });

      it('In a longer rowset, with equal field count for parsing by tab or comma delimiters, parses by tabs.', () => {
        const text = 'A\tB,C\nA\tB,C\nA\tB,C\nA\tB,C\nA\tB,C\nA\tB,C\nA\tB,C\nA\tB,C\nA\tB,C\nA\tB,C\nA\tB,C\nA\tB,C';
        const expected = ['A','B,C'];
        const result = csvUnicodeToRowArray(text,true);
        expect(result[0]).toEqual(expected);
      });
    });

    describe('parsing rows to fields', () => {
      it('Parses 1 field for a row with whitespace-only text', () => {
        const text = 'A\n  ';
        const expected = [null];
        const [, result] = csvUnicodeToRowArray(text,true);
        expect(result).toEqual(expected);
      });

      it('Parses 1 field for a row with text that contains no delimiters', () => {
        const text = 'no delimiters';
        const expected = ['no delimiters'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses 2 fields for a row with two non-quoted fields', () => {
        const text = 'field1,field2';
        const expected = ['field1','field2'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      }); 

      it('Parses 2 fields for a row with two quoted fields', () => {
        const text = '"field1","field2"';
        const expected = ['field1','field2'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses 1 field for a row with a quoted field that contains an escaped quote', () => {
        const text = '"field""1"';
        const expected = ['field"1'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses 1 field for a row with a quoted field that contains a field delimiter', () => {
        const text = '"field,1"';
        const expected = ['field,1'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses 1 field for a row with a quoted field that contains 2 field delimiters', () => {
        const text = '"fie,ld,1"';
        const expected = ['fie,ld,1'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses 1 field for a row with a quoted field that contains 2 adjacent field delimiters', () => {
        const text = '"fie,,ld1"';
        const expected = ['fie,,ld1'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses 2 fields for a row with two quoted fields with whitespace between them', () => {
        const text = '"field1" , "field2"';
        const expected = ['field1','field2'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses 2 fields for a row with two non-quoted fields with whitespace between them', () => {
        const text = 'field1 , field2';
        const expected = ['field1 ',' field2'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses 1 fields for a row with 2 field delimiters and an escaped quote inside of quotes', () => {
        const text = '"field1\tfie""ld2\tfield3"';
        const expected = ['field1\tfie"ld2\tfield3'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses 2 fields for a row with a quoted fields, where a field has an escaped quote at start', () => {
        const text = '"field1","""field2"';
        const expected = ['field1', '"field2'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses 2 fields for a row with a quoted fields, where a field has an escaped quote at end', () => {
        const text = '"field1""","field2"';
        const expected = ['field1"', 'field2'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses 1 field for a quoted field containing multiple field delimiters', () => {
        const text = '"love\twill\ttear\tus\tapart"';
        const expected = ['love\twill\ttear\tus\tapart'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Throws for a row with a quoted field that is missing the closing quote', () => {
        const text = '"field1';
        expect(() => csvUnicodeToRowArray(text,false)).toThrow();
      });
    });

    describe('parsing header row', () => {
      it('Returns one string header for a row containing unquoted text with no field delimiters.', () => {
        const text = 'name';
        const expected = [['name']];
        const result = csvUnicodeToRowArray(text,true)
        expect(result).toEqual(expected);
      });

      it('Returns one string header for a row containing quoted text with no field delimiters.', () => {
        const text = '"name"';
        const expected = [['name']];
        const result = csvUnicodeToRowArray(text,true)
        expect(result).toEqual(expected);
      });

      it('Returns one string header for a row containing number with no field delimiters.', () => {
        const text = '123';
        const expected = [['123']];
        const result = csvUnicodeToRowArray(text,true)
        expect(result).toEqual(expected);
      });

      it('Returns two string headers for a row containing a field delimiter.', () => {
        const text = 'field1,field2';
        const expected = [['field1','field2']];
        const result = csvUnicodeToRowArray(text,true)
        expect(result).toEqual(expected);
      });

      it('Returns a header with an empty string', () => {
        const text = 'field1,,field2';
        const expected = [['field1','','field2']];
        const result = csvUnicodeToRowArray(text,true)
        expect(result).toEqual(expected);
      });

      it('Throws if one header is too large (> MAX_FIELDNAME_LENGTH)', () => {
        const text = 'x'.repeat(MAX_FIELDNAME_LENGTH + 1);
        expect(() => csvUnicodeToRowArray(text,true)).toThrow();
      });

      it('Returns header preserving mixed case.', () => {
        const text = 'FiElDnAmE';
        const expected = [['FiElDnAmE']];
        const result = csvUnicodeToRowArray(text,true)
        expect(result).toEqual(expected);
      });

      it('Returns header preserving interior spaces.', () => {
        const text = 'Field Name';
        const expected = [['Field Name']];
        const result = csvUnicodeToRowArray(text,true)
        expect(result).toEqual(expected);
      });

      it('Returns header preserving unicode characters.', () => {
        const text = '🐶';
        const expected = [['🐶']];
        const result = csvUnicodeToRowArray(text,true)
        expect(result).toEqual(expected);
      });

      it('Throws if one header begins with a quote character but does not end with one.', () => {
        const text = '"field1,field2';
        expect(() => csvUnicodeToRowArray(text,true)).toThrow();
      });
    });

    describe('parsing field values', () => {
      it('parses a value as null for an empty, unquoted string', () => {
        const text = 'A\n\n';
        const expected = [null];
        const [,result] = csvUnicodeToRowArray(text,true);
        expect(result).toEqual(expected);
      });

      it('Parses a value as an empty string for an empty, quoted string.', () => {
        const text = '""';
        const expected = [''];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses correct string for a quoted string with characters.', () => {
        const text = '"text"';
        const expected = ['text'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses correct string for a quoted string with whitespace on both sides.', () => {
        const text = '  "text"  ';
        const expected = ['text'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses correct string for text with unescaped quote', () => {
        const text = '"field1,fie""ld2,field3"';
        const expected = ['field1,fie"ld2,field3'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses date for ISO-formatted date/time text.', () => {
        const text = '2022-01-01T12:34:56Z';
        const expected = [new Date('2022-01-01T12:34:56Z')];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses date for ISO-formatted date/time text with whitespace on both sides.', () => {
        const text = '  2022-01-01T12:34:56Z  ';
        const expected = [new Date('2022-01-01T12:34:56Z')];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses string for non-ISO date/time text.', () => {
        const text = 'Jan 1 2022 12:34PM';
        const expected = ['Jan 1 2022 12:34PM'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses true (boolean) for `true` text.', () => {
        const text = 'true';
        const expected = [true];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses true (boolean) for `tRuE` text.', () => {
        const text = 'tRuE';
        const expected = [true];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses false (boolean) for `false` text.', () => {
        const text = 'false';
        const expected = [false];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses false (boolean) for `fAlSe` text.', () => {
        const text = 'fAlSe';
        const expected = [false];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses number for positive integer text.', () => {
        const text = '123';
        const expected = [123];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses number for negative integer text.', () => {
        const text = '-123';
        const expected = [-123];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses number for positive decimal text.', () => {
        const text = '123.45';
        const expected = [123.45];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses number for negative decimal text.', () => {
        const text = '-123.45';
        const expected = [-123.45];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses number for zero.', () => {
        const text = '0';
        const expected = [0];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses number for Infinity.', () => {
        const text = 'Infinity';
        const expected = [Infinity];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses number for -Infinity.', () => {
        const text = '-Infinity';
        const expected = [-Infinity];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses string for `453x` (number followed by alpha) text.', () => {
        const text = '453x';
        const expected = ['453x'];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });

      it('Parses number for number text with whitespace on both sides.', () => {
        const text = '  123  ';
        const expected = [123];
        const [,result] = csvUnicodeToRowArray(text,false);
        expect(result).toEqual(expected);
      });
    })
  });

  describe('csvUtf8ToRowArray()', () => {
    it('parses a byte array', () => {
      const text = 'field1,field2\nvalue1,value2';
      const array = encodeUtf8(text);
      const expected = [['field1', 'field2'], ['value1', 'value2']];
      const result = csvUtf8ToRowArray(array, true);
      expect(result).toEqual(expected);
    })
  })
});