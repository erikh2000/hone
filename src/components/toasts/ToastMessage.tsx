import styles from './ToastMessage.module.css';
import Toast, {ToastState, ToastType} from "./Toast";
import {doesToastTypeRequireDismissing} from "./toastUtil";

interface IProps {
  onDismiss:() => void,
  toast:Toast,
  toastState:ToastState
}

function _getContainerStyleForType(type:ToastType):string {
  switch (type) {
    case ToastType.ERROR: return styles.containerError;
    case ToastType.IMPORTANT: return styles.containerImportant;
    default: return styles.containerInfo;
  }
}

function _getAnimationStyleForState(state:ToastState):string {
  switch (state) {
    case ToastState.APPEARING: return styles.containerAppear;
    case ToastState.DISAPPEARING: return styles.containerDisappear;
    default: return '';
  }
}

function ToastMessage(props:IProps) {
  const {onDismiss, toast, toastState} = props;
  const {message, type} = toast;
  const showDismissIcon = doesToastTypeRequireDismissing(type);
  
  const containerStyle = `${_getContainerStyleForType(type)} ${_getAnimationStyleForState(toastState)}`;
  const dismissIcon = showDismissIcon ? <div className={styles.dismissIcon} onClick={onDismiss}>✖</div> : null;
  
  return <div className={containerStyle} onClick={onDismiss}><p>{message}</p>{dismissIcon}</div>;
}

export default ToastMessage;