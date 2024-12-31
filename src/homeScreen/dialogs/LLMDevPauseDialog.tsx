import ConfirmCancelDialog from "@/components/modalDialogs/ConfirmCancelDialog";

const description = `This dialog pauses things before doing the heavy work of loading the LLM, ` +
                    `which could otherwise be triggered on each code change. ` + 
                    `If the web app is deployed to a non-local server, you won't see this dialog.`;

type Props = {
  isOpen:boolean,
  onConfirm:()=>void
  onCancel:()=>void
}

function LLMDevPauseDialog(props:Props) {
  const { isOpen, onConfirm, onCancel } = props;

  if (!isOpen) return null;

  return (
    <ConfirmCancelDialog 
      title="Local Development" isOpen={isOpen} 
      onConfirm={onConfirm} confirmText="Load LLM" 
      onCancel={onCancel}
      description={description} 
    />
  );
}

export default LLMDevPauseDialog;