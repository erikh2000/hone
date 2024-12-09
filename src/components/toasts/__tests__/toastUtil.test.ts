import { infoToast, importantToast, errorToast, subscribeToToasts, unsubscribeFromToasts, doesToastTypeRequireDismissing } from '../toastUtil';
import Toast, { ToastType } from "../Toast";

describe('toastUtil.ts', () => {
  describe('infoToast()', () => {
    it('sends an info toast', () => {
      let receivedToast = false;
      const callback = (toast:Toast) => {
        expect(toast.type).toBe(ToastType.INFO);
        receivedToast = true;
      }
      subscribeToToasts(callback);
      infoToast('test');
      unsubscribeFromToasts(callback);
      expect(receivedToast).toBeTruthy();
    });
  });
  
  describe('importantToast()', () => {
    it('sends an important toast', () => {
      let receivedToast = false;
      const callback = (toast:Toast) => {
        expect(toast.type).toBe(ToastType.IMPORTANT);
        receivedToast = true;
      }
      subscribeToToasts(callback);
      importantToast('test');
      unsubscribeFromToasts(callback);
      expect(receivedToast).toBeTruthy();
    });
  });
  
  describe('errorToast()', () => {
    it('sends an error toast', () => {
      let receivedToast = false;
      const callback = (toast:Toast) => {
        expect(toast.type).toBe(ToastType.ERROR);
        receivedToast = true;
      }
      subscribeToToasts(callback);
      errorToast('test');
      unsubscribeFromToasts(callback);
      expect(receivedToast).toBeTruthy();
    });
  });
  
  describe('doesToastTypeRequireDismissing()', () => {
    it('should return true for ToastType.ERROR', () => {
      expect(doesToastTypeRequireDismissing(ToastType.ERROR)).toBe(true);
    });
    it('should return true for ToastType.IMPORTANT', () => {
      expect(doesToastTypeRequireDismissing(ToastType.IMPORTANT)).toBe(true);
    });
    it('should return false for ToastType.INFO', () => {
      expect(doesToastTypeRequireDismissing(ToastType.INFO)).toBe(false);
    });
  });
});