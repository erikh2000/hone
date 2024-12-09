import ModalDialog from "./ModalDialog";
import DialogButton from "./DialogButton";
import DialogFooter from "./DialogFooter";

interface IProps {
  cancelText?:string
  confirmText?:string,
  description:string,
  isOpen:boolean,
  onCancel:() => void,
  onConfirm:() => void,
  title:string
}

function ConfirmCancelDialog(props:IProps) {
  const {cancelText, confirmText, description, isOpen, onCancel, onConfirm, title} = props;
  return (
    <ModalDialog isOpen={isOpen} title={title} onCancel={onCancel}>
      <p>{description}</p>
      <DialogFooter>
        <DialogButton text={cancelText ?? 'Cancel'} onClick={onCancel} />
        <DialogButton text={confirmText ?? 'Confirm'} onClick={onConfirm} isPrimary />
      </DialogFooter>
    </ModalDialog>
  );
}

export default ConfirmCancelDialog;