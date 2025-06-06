import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import TimePredictions from "@/timePredictions/types/TimePredictions";
import { getTimePredictions, setTimePredictions, isModelCached, setModelCached } from "../timePredictions";
import * as PathStore from '@/persistence/pathStore';

type MockedFn = ReturnType<typeof vi.fn>;

vi.mock('@/persistence/pathStore');

describe('timePredictions', () => {
  let fakeStore:{[key:string]:string} = {};
  
  beforeEach(() => {
    fakeStore = {};
    (PathStore.getText as MockedFn).mockImplementation(
      (key:string) => Promise.resolve(fakeStore[key]));
    (PathStore.setText as MockedFn).mockImplementation(
      (key:string, text:string) => { fakeStore[key] = text; return Promise.resolve(); });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getting and setting time predictions', () => {
    it('returns null if no predictions have been stored', async () => {
      const predictions = await getTimePredictions();
      expect(predictions).toBeNull();
    });

    it('gets predictions previously stored', async () => {
      const predictions = {};
      await setTimePredictions(predictions);
      const result = await getTimePredictions();
      expect(result).toEqual(predictions);
    });

    it('gets predictions populated with groups', async () => {
      const predictions = {
        x:{previousTimes:[3,4,5],defaultTime:7},
        y:{previousTimes:[35,45],defaultTime:75}
      };
      await setTimePredictions(predictions);
      const result = await getTimePredictions();
      expect(result).toEqual(predictions);
    });
  });

  describe('handling invalid time prediction data', () => {
    it('throws when null was stored', async () => {
      const invalidPredictions = (null as unknown) as TimePredictions;
      setTimePredictions(invalidPredictions);
      await expect(getTimePredictions()).rejects.toThrow();
    });

    it('returns null when undefined was stored', async () => { // Storing undefined is same thing as deleting a key.
      const invalidPredictions = (undefined as unknown) as TimePredictions;
      setTimePredictions(invalidPredictions);
      expect(await getTimePredictions()).toBeNull();
    });

    it('throws when a non-JSON string was stored', async () => {
      const invalidPredictions = ('not JSON' as unknown) as TimePredictions;
      setTimePredictions(invalidPredictions);
      await expect(getTimePredictions()).rejects.toThrow();
    });

    it('throws when a prediction group is not an object', async () => {
      const invalidPredictions = ({ x: 123 } as unknown) as TimePredictions;
      setTimePredictions(invalidPredictions);
      await expect(getTimePredictions()).rejects.toThrow();
    });

    it('throws when previousTimes is missing from a prediction group', async () => {
      const invalidPredictions = ({ x: { defaultTime: 123 } } as unknown) as TimePredictions;
      setTimePredictions(invalidPredictions);
      await expect(getTimePredictions()).rejects.toThrow();
    });

    it('throws when previousTimes is not an array', async () => {
      const invalidPredictions = ({ x: { previousTimes: 123, defaultTime: 123 } } as unknown) as TimePredictions;
      setTimePredictions(invalidPredictions);
      await expect(getTimePredictions()).rejects.toThrow();
    });

    it('throws when previousTimes is as array of strings rather than numbers', async () => {
      const invalidPredictions = ({ x: { previousTimes: ['123'], defaultTime: 123 } } as unknown) as TimePredictions;
      setTimePredictions(invalidPredictions);
      await expect(getTimePredictions()).rejects.toThrow();
    });

    it('throws when defaultTime is missing from a prediction group', async () => {
      const invalidPredictions = ({ x: { previousTimes: [], } } as unknown) as TimePredictions;
      setTimePredictions(invalidPredictions);
      await expect(getTimePredictions()).rejects.toThrow();
    });

    it('throws when defaultTime is not a number', async () => {
      const invalidPredictions = ({ x: { previousTimes: [], defaultTime: '123' } } as unknown) as TimePredictions;
      setTimePredictions(invalidPredictions);
      await expect(getTimePredictions()).rejects.toThrow();
    });
  });

  describe('cached model manifest', () => {
    it('returns false for a model if no manifest has been persisted', async () => {
      expect(await isModelCached('model')).toBe(false);
    });

    it('returns false for an uncached model', async () => {
      await setModelCached('model1');
      expect(await isModelCached('model2')).toBe(false);
    });

    it('returns true for a cached model', async () => {
      await setModelCached('model');
      expect(await isModelCached('model')).toBe(true);
    });

    it('returns true for a model that was marked cached multiple times', async () => {
      await setModelCached('model');
      await setModelCached('model');
      expect(await isModelCached('model')).toBe(true);
    });

    it('returns true for multiple models that were marked cached', async () => {
      await setModelCached('model1');
      await setModelCached('model2');
      await setModelCached('model3');
      expect(await isModelCached('model1')).toBe(true);
      expect(await isModelCached('model2')).toBe(true);
      expect(await isModelCached('model3')).toBe(true);
    });
  });
});