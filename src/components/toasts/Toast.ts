export enum ToastType {
  INFO = 'info',
  IMPORTANT = 'important',
  ERROR = 'error'
}

export enum ToastState {
  APPEARING,
  VISIBLE,
  DISAPPEARING,
  GONE
}

type Toast = {
  message:string,
  type:ToastType
}

export default Toast;