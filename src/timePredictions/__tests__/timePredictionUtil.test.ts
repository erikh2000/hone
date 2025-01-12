import { initialize, storeActualTime, setDefault, predictTime, deinitialize, MAX_STORE_TIMES } from "../timePredictionUtil";

describe('timePredictionUtil', () => {

  describe('initialization', () => {
    afterEach(() => { deinitialize(); });

    describe('APIs other than initialize()', () => {
      it('throws if not initialized', () => {
        expect(() => predictTime('')).toThrow();
        expect(() => storeActualTime('', 0)).toThrow();
        expect(() => setDefault('', 0)).toThrow();
      });
    });

    it('initializing twice without deinitializing throws', async () => {  
      const predictions = {};
      await initialize(predictions);
      await expect(initialize(predictions)).rejects.toThrow();
    });

    it('initializing twice with deinitialize after first is okay', async () => {  
      const predictions = {};
      await initialize(predictions);
      deinitialize();
      await initialize(predictions);
    });
  })

  describe('predictions from defaults', () => {
    afterEach(() => { deinitialize(); });

    it('returns 0 for a prediction group with no default or history', async () => {
      const predictions = {};
      await initialize(predictions);
      const prediction = predictTime('x');
      expect(prediction).toBe(0);
    });

    it('returns default for a prediction group with a default', async() => {
      const predictions = { 'x': { previousTimes:[], defaultTime: 123 } };
      await initialize(predictions);
      const prediction = predictTime('x');
      expect(prediction).toBe(123);
    });

    it('returns same default when prediction group is requested twice with no history', async() => {
      const predictions = { 'x': { previousTimes:[], defaultTime: 123 } };
      await initialize(predictions);
      const prediction1 = predictTime('x');
      const prediction2 = predictTime('x');
      expect(prediction1).toBe(123);
      expect(prediction2).toBe(123);
    });

    it('returns new default for a prediction group when default is changed', async() => {
      const predictions = { 'x': { previousTimes:[], defaultTime: 123 } };
      await initialize(predictions);
      setDefault('x', 456);
      const prediction = predictTime('x');
      expect(prediction).toBe(456);
    });

    it('returns new default for a prediction group that was not previously present', async() => {
      const predictions = { 'x': { previousTimes:[], defaultTime: 123 } };
      await initialize(predictions);
      setDefault('y', 456);
      const prediction = predictTime('y');
      expect(prediction).toBe(456);
    });
  });
  
  describe('predictions from history', () => {
    afterEach(() => { deinitialize(); });

    it('returns same time for a prediction group when one time is stored', async() => {
      const predictions = { 'x': { previousTimes:[], defaultTime: 123 } };
      await initialize(predictions);
      storeActualTime('x', 321);
      const prediction = predictTime('x');
      expect(prediction).toBe(321);
    });

    it('returns average of two times for a prediction group when two times are stored', async() => {
      const predictions = { 'x': { previousTimes:[], defaultTime: 123 } };
      await initialize(predictions);
      storeActualTime('x', 6);
      storeActualTime('x', 8);
      const prediction = predictTime('x');
      expect(prediction).toBe(7);
    });

    it('returns average of MAX_STORE_TIMES times after storing same number of times', async() => {
      const predictions = { 'x': { previousTimes:[], defaultTime: 123 } };
      await initialize(predictions);
      expect(MAX_STORE_TIMES).toBe(5);
      storeActualTime('x', 1);
      storeActualTime('x', 2);
      storeActualTime('x', 3);
      storeActualTime('x', 4);
      storeActualTime('x', 5);
      const prediction = predictTime('x');
      expect(prediction).toBe(3);
    });

    it('returns average of last MAX_STORE_TIMES times after storing more than MAX_STORE_TIMES times', async() => {
      const predictions = { 'x': { previousTimes:[], defaultTime: 123 } };
      await initialize(predictions);
      expect(MAX_STORE_TIMES).toBe(5);
      storeActualTime('x', 1);
      storeActualTime('x', 2);
      storeActualTime('x', 3);
      storeActualTime('x', 4);
      storeActualTime('x', 5);
      storeActualTime('x', 6);
      const prediction = predictTime('x');
      expect(prediction).toBe(4);
    });

    it('returns prediction from a prediction group created by storing a time', async() => {
      const predictions = { 'x': { previousTimes:[], defaultTime: 123 } };
      await initialize(predictions);
      storeActualTime('y', 10);
      const prediction = predictTime('y');
      expect(prediction).toBe(10);
    });
  });

  describe('default scaling', () => {
    afterEach(() => { deinitialize(); });

    it('returns default that is same as what was set if no times stored', async() => {
      const predictions = { 'x': { previousTimes:[], defaultTime:100 } };
      await initialize(predictions);
      const prediction = predictTime('x');
      expect(prediction).toBe(100);
    });

    it('returns default that is half scaled after time stored that is half of a default', async() => {
      const predictions = { 'x': { previousTimes:[], defaultTime:100 }, 'y': { previousTimes:[], defaultTime:300 } };
      await initialize(predictions);
      storeActualTime('x', 50);
      const prediction = predictTime('y');
      expect(prediction).toBe(150);
    });

    it('returns default that is 2x scaled after time stored that is 2x of a default', async() => {
      const predictions = { 'x': { previousTimes:[], defaultTime:100 }, 'y': { previousTimes:[], defaultTime:300 } };
      await initialize(predictions);
      storeActualTime('x', 200);
      const prediction = predictTime('y');
      expect(prediction).toBe(600);
    });

    it('returns unscaled default after time stored that is 1x of a default', async() => {
      const predictions = { 'x': { previousTimes:[], defaultTime:100 }, 'y': { previousTimes:[], defaultTime:300 } };
      await initialize(predictions);
      storeActualTime('x', 100);
      const prediction = predictTime('y');
      expect(prediction).toBe(300);
    });

    it('returns unscaled default after time of 0 is stored', async() => {
      const predictions = { 'x': { previousTimes:[], defaultTime:100 }, 'y': { previousTimes:[], defaultTime:300 } };
      await initialize(predictions);
      storeActualTime('x', 0);
      const prediction = predictTime('y');
      expect(prediction).toBe(300);
    });
  });
  
});