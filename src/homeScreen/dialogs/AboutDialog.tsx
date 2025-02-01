import OkayDialog from "@/components/modalDialogs/OkayDialog";

type Props = {
  onClose: () => void,
  isOpen: boolean
}

function AboutDialog({ onClose, isOpen }: Props) {
  return (
    <OkayDialog title="About Hone" 
      isOpen={isOpen}
      description="There was an AI feature I wanted from Excel that Microsoft wasn't giving me. And it seemed like a really useful feature. So I made Hone. I hope you like it. -Erik"
      onOkay={onClose} 
    />
  );
}

export default AboutDialog;