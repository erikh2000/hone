import styles from './ToastPane.module.css';
import Toast, {ToastState} from "./Toast";
import ToastMessage from "./ToastMessage";
import {
  doesToastTypeRequireDismissing,
  subscribeToToasts,
  unsubscribeFromToasts
} from "./toastUtil";

import {MutableRefObject, useEffect, useRef, useState} from "react";

type TrackedToast = Toast & {
  id:number,
  state:ToastState, 
  lastStateTime:number,
  requiresDismissing:boolean
}

let toastIdCounter = 0;

const ANIMATION_INTERVAL_MSECS = 200;
const APPEAR_DURATION_MSECS = 1000;
const MESSAGE_DURATION_MSECS = 5000;
const DISAPPEAR_DURATION_MSECS = 1000;

function _trackNewToast(toastsRef:MutableRefObject<TrackedToast[]>, newToast:Toast) {
  const oldToasts = toastsRef.current;
  const now = Date.now();
  const id = ++toastIdCounter;
  const requiresDismissing = doesToastTypeRequireDismissing(newToast.type);
  const newTrackedToast = {...newToast, state:ToastState.APPEARING, lastStateTime:now, id, requiresDismissing};
  toastsRef.current = [...oldToasts, newTrackedToast];
}

function _dismissToast(toastId:number, toastsRef:MutableRefObject<TrackedToast[]>) {
  const oldToasts = toastsRef.current;
  const now = Date.now();
  toastsRef.current = oldToasts.map((toast) => {
    if (toast.id !== toastId) return toast;
    if (toast.state === ToastState.DISAPPEARING) return {...toast, requiresDismissing:false};
    return {...toast, requiresDismissing:false, lastStateTime:now, state:ToastState.DISAPPEARING};
  });
}

function _updateTrackedToastsForAnimation(toastsRef:MutableRefObject<TrackedToast[]>) {
  const oldToasts = toastsRef.current;
  const now = Date.now();
  let changed = false;
  const updatedToasts = oldToasts.map((toast) => {
    const {state, lastStateTime, requiresDismissing} = toast;
    const timeSinceLastState = now - lastStateTime;
    switch (state) {
      case ToastState.APPEARING:
        if (timeSinceLastState < APPEAR_DURATION_MSECS) return toast;
        changed = true;
        return {...toast, state:ToastState.VISIBLE, lastStateTime:now};
      case ToastState.VISIBLE:
        if (requiresDismissing || timeSinceLastState < MESSAGE_DURATION_MSECS) return toast;
        changed = true;
        return {...toast, state:ToastState.DISAPPEARING, lastStateTime:now};
      case ToastState.DISAPPEARING:
        if (timeSinceLastState < DISAPPEAR_DURATION_MSECS) return toast;
        changed = true;
        return {...toast, state:ToastState.GONE, lastStateTime:now};
      default:
        return toast;
    }
  });
  if (changed) toastsRef.current = updatedToasts.filter((toast) => toast.state !== ToastState.GONE);
}

function ToastPane() {
  const toastsRef = useRef<TrackedToast[]>([]);
  const [frameNo, setFrameNo] = useState<number>(0);

  const onNewToast = (newToast:Toast) => _trackNewToast(toastsRef, newToast);
  
  _updateTrackedToastsForAnimation(toastsRef);
  
  useEffect(() => {
    subscribeToToasts(onNewToast);
    return () => unsubscribeFromToasts(onNewToast);
  },[]);
  
  useEffect(() => {
    setTimeout(() => setFrameNo(frameNo + 1), ANIMATION_INTERVAL_MSECS);
  }, [frameNo, setFrameNo]);
  
  const renderedToasts = toastsRef.current.map((toast) => (
    <ToastMessage toast={toast} toastState={toast.state} key={toast.id} onDismiss={() => _dismissToast(toast.id, toastsRef)}/>
  ));
  return (
    <div className={styles.container}>
      {renderedToasts}
    </div>
  );
}

export default ToastPane;