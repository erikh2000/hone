import { describeDuration } from "../timeUtil";

describe("timeUtil", () => {
  describe("describeDuration()", () => {
    it("0 seconds", () => {
      expect(describeDuration(0)).toBe("0 seconds");
    });
    it("1 second", () => {
      expect(describeDuration(1)).toBe("1 second");
    });
    it("2 - 59 seconds", () => {
      expect(describeDuration(2)).toBe("2 seconds");
      expect(describeDuration(59)).toBe("59 seconds");
    });
    it("60 seconds", () => {
      expect(describeDuration(60)).toBe("1 minute");
    });
    it("61 - 119 seconds", () => {
      expect(describeDuration(61)).toBe("1 minute 1 second");
      expect(describeDuration(119)).toBe("1 minute 59 seconds");
    });
    it("120 - 3599 seconds", () => {
      expect(describeDuration(120)).toBe("2 minutes");
      expect(describeDuration(3599)).toBe("59 minutes");
    });
    it("3600 seconds", () => {
      expect(describeDuration(3600)).toBe("1 hour");
    });
    it("3601+ with 0 minutes", () => {
      expect(describeDuration(3601)).toBe("1 hour");
      expect(describeDuration(7200)).toBe("2 hours");
    });
    it("3601+ with 1 minute", () => {
      expect(describeDuration(3660)).toBe("1 hour 1 minute");
      expect(describeDuration(7260)).toBe("2 hours 1 minute");
    });
    it("3601+ with 2+ minutes", () => {
      expect(describeDuration(3720)).toBe("1 hour 2 minutes");
      expect(describeDuration(7320)).toBe("2 hours 2 minutes");
    });
    it('seconds with decimal places are rounded up', () => {
      expect(describeDuration(.9)).toBe("1 second");
      expect(describeDuration(.5)).toBe("1 second");
      expect(describeDuration(.1)).toBe("1 second");
      expect(describeDuration(1.9)).toBe("2 seconds");
      expect(describeDuration(1.5)).toBe("2 seconds");
      expect(describeDuration(1.1)).toBe("2 seconds");
      expect(describeDuration(60.5)).toBe("1 minute 1 second");
      expect(describeDuration(118.5)).toBe("1 minute 59 seconds");
    });
  });
});