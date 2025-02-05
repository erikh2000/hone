import Throttler from "../Throttler";

describe('Throttler', () => {
  describe('waiting with no frequency threshold', () => {
    test('ready time is 0 with no frequency threshold or events', () => {
      const t = new Throttler(0, 0);
      expect(t.prepareBeforeRequest()).toBe(0);
    });

    test('ready time is 0 with duration but not max event count', async () => {
      const t = new Throttler(0, 10000);
      expect(t.prepareBeforeRequest(0)).toBe(0);
    });

    test('ready time is 0 with events but no frequency threshold', async () => {
      const t = new Throttler(0, 10000);
      t.prepareBeforeRequest();
      expect(t.prepareBeforeRequest(0)).toBe(0);
      expect(t.prepareBeforeRequest(0)).toBe(0);
    });
  });

  describe('waiting with frequency threshold', () => {
    test('ready time is 0 with events under the frequency threshold', () => {
      const t = new Throttler(2, 1000);
      expect(t.prepareBeforeRequest(0)).toBe(0);
      expect(t.prepareBeforeRequest(0)).toBe(0);
    });

    test('ready time is duration to expire 1 event with an event one past the frequency threshold', () => {
      const t = new Throttler(1, 1000);
      expect(t.prepareBeforeRequest(0)).toBe(0);
      expect(t.prepareBeforeRequest(0)).toBe(1000);
    });

    test('ready time is 0 with last events expiring with exact time', () => {
      const t = new Throttler(1, 1000);
      expect(t.prepareBeforeRequest(0)).toBe(0);
      expect(t.prepareBeforeRequest(1000)).toBe(0);
    });

    test('ready time is 0 with last events expiring with extra time', () => {
      const t = new Throttler(1, 1000);
      expect(t.prepareBeforeRequest(0)).toBe(0);
      expect(t.prepareBeforeRequest(1001)).toBe(0);
    });

    test('ready time is 1ms with 1ms remaining for event to expire', () => {
      const t = new Throttler(1, 1000);
      expect(t.prepareBeforeRequest(0)).toBe(0);
      expect(t.prepareBeforeRequest(999)).toBe(1);
    });
    
    test('ready time covers expiration of three events', () => {
      const t = new Throttler(1, 1000);
      expect(t.prepareBeforeRequest(0)).toBe(0);     // e = [0]
      expect(t.prepareBeforeRequest(200)).toBe(800); // e = [0, 1000]
      expect(t.prepareBeforeRequest(400)).toBe(1600); // e = [0, 1000, 2000]
    });

  });

  describe('wait doubling', () => {
    test('ready time is > 0 after doubling next wait', () => {
      const t = new Throttler(0, 1000);
      t.doubleNextWait(0);
      expect(t.prepareBeforeRequest(0)).toBeGreaterThan(0);
    });

    test('ready time is > 0 after a reset with default and doubling next wait', () => {
      const t = new Throttler(0, 1000);
      t.resetWaitDoubling();
      t.doubleNextWait(0);
      expect(t.prepareBeforeRequest(0)).toBeGreaterThan(0);
    });

    test('reset doubling throws for negative time', () => {
      const t = new Throttler(0, 1000);
      expect(() => t.resetWaitDoubling(-1)).toThrow();
    });

    test('reset doubling throws for zero time', () => {
      const t = new Throttler(0, 1000);
      expect(() => t.resetWaitDoubling(0)).toThrow();
    });

    test('ready time matches value provided in reset after first wait double', () => {
      const t = new Throttler(0, 1000);
      t.resetWaitDoubling(200);
      t.doubleNextWait(0);
      expect(t.prepareBeforeRequest(0)).toBe(200);
    });

    test('ready time returns a 2x time after two wait doubles', () => {
      const t = new Throttler(0, 1000);
      t.resetWaitDoubling(200);
      t.doubleNextWait(0);
      t.doubleNextWait(0);
      expect(t.prepareBeforeRequest(0)).toBe(400);
    });

    test('ready time returns 0 after wait double followed by a reset', () => {
      const t = new Throttler(0, 1000);
      t.resetWaitDoubling(200);
      t.doubleNextWait(0);
      t.resetWaitDoubling(200);
      expect(t.prepareBeforeRequest(0)).toBe(0);
    });

    test('doubled ready time has elapsed time subtracted from it', () => {
      const t = new Throttler(0, 1000);
      t.resetWaitDoubling(200);
      t.doubleNextWait(0);
      expect(t.prepareBeforeRequest(40)).toBe(160);
    });

    test('returns 0 if doubled ready time is equal to elapsed time', () => {
      const t = new Throttler(0, 1000);
      t.resetWaitDoubling(200);
      t.doubleNextWait(0);
      expect(t.prepareBeforeRequest(200)).toBe(0);
    });

    test('returns 0 if doubled ready time is less than to elapsed time', () => {
      const t = new Throttler(0, 1000);
      t.resetWaitDoubling(200);
      t.doubleNextWait(0);
      expect(t.prepareBeforeRequest(201)).toBe(0);
    });
  });

  describe('combined wait doubling with frequency threshold', () => {
    test('returns frequency-based ready time if greater than doubled delay', () => {
      const t = new Throttler(1, 1000);
      t.resetWaitDoubling(200);
      t.prepareBeforeRequest(0);
      t.doubleNextWait(0);
      expect(t.prepareBeforeRequest(0)).toBe(1000);
    });

    test('returns doubled delay for ready time if greater than frequency-based ready time', () => {
      const t = new Throttler(1, 1000);
      t.resetWaitDoubling(1200);
      t.prepareBeforeRequest(0);
      t.doubleNextWait(0);
      expect(t.prepareBeforeRequest(0)).toBe(1200);
    });
  });

  describe('waiting', () => {
    test('returns immediately if no frequency threshold and no doubling', async() => {
      const t = new Throttler(0, 10);
      const start = process.hrtime.bigint();
      await t.waitBeforeRequest();
      const elapsedNs = process.hrtime.bigint() - start;
      expect(elapsedNs).toBeLessThan(1_000_000n); // Less than 1 millisecond
    });

    test('returns after a frequency-based ready time', async() => {
      const t = new Throttler(1, 10);
      const start = process.hrtime.bigint();
      t.prepareBeforeRequest();
      await t.waitBeforeRequest();
      const elapsedNs = process.hrtime.bigint() - start;
      expect(elapsedNs).toBeGreaterThan(1_000_000n); // Greater than 1 millisecond
    });

    test('returns after a doubling-based ready time', async() => {
      const t = new Throttler(0, 10);
      const start = process.hrtime.bigint();
      t.resetWaitDoubling(10);
      t.doubleNextWait();
      await t.waitBeforeRequest();
      const elapsedNs = process.hrtime.bigint() - start;
      expect(elapsedNs).toBeGreaterThan(1_000_000n); // Greater than 1 millisecond
    });
  });
});