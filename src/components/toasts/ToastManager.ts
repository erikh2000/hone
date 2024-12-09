import Toast, { ToastType } from './Toast';

export type ToastCallback = (toast:Toast) => void;
class ToastManager {
  private _subscriptions:ToastCallback[];
  
  constructor() {
    this._subscriptions = [];
  }
  
  sendToast(message:string, type:ToastType) {
    const toast:Toast = { message, type };
    this._subscriptions.forEach(callback => callback(toast));
  }
  
  subscribe(callback:ToastCallback) {
    if (!this._subscriptions.includes(callback)) this._subscriptions.push(callback);
  }
  
  unsubscribe(callback:ToastCallback) {
    const index = this._subscriptions.indexOf(callback);
    if (index !== -1) this._subscriptions.splice(index, 1);
  }
}

export default ToastManager;