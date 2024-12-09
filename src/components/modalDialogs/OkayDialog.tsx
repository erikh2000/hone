import ModalDialog from "./ModalDialog";
import DialogButton from "./DialogButton";
import DialogFooter from "./DialogFooter";

interface IProps {
  okayText?:string,
  description:string,
  isOpen:boolean,
  onOkay:() => void,
  title:string
}

function OkayDialog(props:IProps) {
  const {okayText, description, isOpen, onOkay, title} = props;
  return (
    <ModalDialog isOpen={isOpen} title={title}>
      <p>{description}</p>
      <DialogFooter>
        <DialogButton text={okayText ?? 'Okay'} onClick={onOkay} isPrimary />
      </DialogFooter>
    </ModalDialog>
  );
}

export default OkayDialog;