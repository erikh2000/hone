import { generateColumnNames } from "../columnUtil";

describe('columnUtil', () => {
  describe('generateColumnNames()', () => {
    it('Generates "A" header for field count of 1', () => {
      const expected = ['A'];
      const result = generateColumnNames(1);
      expect(result).toEqual(expected);
    });

    it('Generates "A","B" headers for field count of 2', () => {
      const expected = ['A', 'B'];
      const result = generateColumnNames(2);
      expect(result).toEqual(expected);
    });

    it('Returns ["A"..."Z"] for field count of 26.', () => {
      const expected = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const result = generateColumnNames(26);
      expect(result).toEqual(expected);
    });

    it('Returns ["A"..."Z","AA"] for field count of 27.', () => {
      const expected = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(['AA']);
      const result = generateColumnNames(27);
      expect(result).toEqual(expected);
    });

    it('Returns ["A"..."Z","AA","AB"] for field count of 28.', () => {
      const expected = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(['AA','AB']);
      const result = generateColumnNames(28);
      expect(result).toEqual(expected);
    });

    it('Returns ["A"..."Z","AA"..."BZ"] for field count of 52.', () => {
      const first26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const second26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => 'A' + c);
      const expected = first26.concat(second26);
      const result = generateColumnNames(52);
      expect(result).toEqual(expected);
    });

    it('Returns ["A"..."Z","AA"..."AZ","BA"] for field count of 53.', () => {
      const first26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const second26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => 'A' + c);
      const expected = first26.concat(second26).concat(['BA']);
      const result = generateColumnNames(53);
      expect(result).toEqual(expected);
    });

    it('Returns last element of "ZZ" for field count of 702.', () => {
      const expected = 'ZZ';
      const result = generateColumnNames(702).pop();
      expect(result).toEqual(expected);
    });

    it('throws an error for field count of 703.', () => {
      expect(() => generateColumnNames(703)).toThrow();
    });
  });
});