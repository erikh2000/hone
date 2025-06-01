import { describe, it, expect } from 'vitest';

import { createMovingAverage, updateMovingAverage } from "../simpleMovingAverage";

describe('simpleMovingAverage', () => {
  describe('calculating averages', () => {
    it('initial average should be 0', () => {
      const movingAverageData = createMovingAverage(3);
      expect(movingAverageData.lastAverage).toBe(0);
    });

    it('returns the same value added when series is empty', () => {
      const movingAverageData = createMovingAverage(3);
      expect(updateMovingAverage(5, movingAverageData)).toBe(5);
    });

    it('returns average of two numbers when adding a number to a series of 1', () => {
      const movingAverageData = createMovingAverage(3);
      updateMovingAverage(5, movingAverageData);
      expect(updateMovingAverage(10, movingAverageData)).toBe(7.5);
    });

    it('returns average of 3 numbers when adding a number to a series of 2', () => {
      const movingAverageData = createMovingAverage(3);
      updateMovingAverage(5, movingAverageData);
      updateMovingAverage(5, movingAverageData);
      expect(updateMovingAverage(11, movingAverageData)).toBe(7);
    });

    it('returns average of remaining numbers when adding a number to a full series', () => {
      const movingAverageData = createMovingAverage(2);
      updateMovingAverage(5, movingAverageData);
      updateMovingAverage(5, movingAverageData);
      expect(updateMovingAverage(11, movingAverageData)).toBe(8);
    });
  });
});