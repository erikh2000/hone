import OkayDialog from "@/components/modalDialogs/OkayDialog";

type Props = {
  isOpen:boolean,
  onOkay:()=>void
}

function LLMDevPauseDialog(props:Props) {
  const { isOpen, onOkay } = props;

  if (!isOpen) return null;

  return (
    <OkayDialog title="Local Development" isOpen={isOpen} onOkay={onOkay} okayText="Continue"
      description="This dialog pauses things before doing the heavy work of loading the LLM, which could otherwise be triggered on each code change. If the web app is deployed to a non-local server, you won't see this dialog." 
    />
  );
}

export default LLMDevPauseDialog;