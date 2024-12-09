import ToastManager, {ToastCallback} from "./ToastManager";
import {ToastType} from "./Toast";

const toastManager = new ToastManager();

export function infoToast(message:string) {
    toastManager.sendToast(message, ToastType.INFO);
}

export function importantToast(message:string) {
  toastManager.sendToast(message, ToastType.IMPORTANT);
}

export function errorToast(message:string) {
  toastManager.sendToast(message, ToastType.ERROR);
}

export function subscribeToToasts(callback:ToastCallback) {
  toastManager.subscribe(callback);
}

export function unsubscribeFromToasts(callback:ToastCallback) {
  toastManager.unsubscribe(callback);
}

export function doesToastTypeRequireDismissing(type:ToastType):boolean {
  return type === ToastType.ERROR || type === ToastType.IMPORTANT;
} 