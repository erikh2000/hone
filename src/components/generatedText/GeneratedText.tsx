import WaitingEllipsis from "@/components/waitingEllipsis/WaitingEllipsis";
import styles from './GeneratedText.module.css';

export const GENERATING = '...';

type Props = {
  text:string,
  className?:string
}

function GeneratedText({text, className}:Props) {
  const wasGenerating = true;

  const isGenerating = text.trim().endsWith(GENERATING);
  const cleanText = text.replace(GENERATING, '');

  if (isGenerating) {
    const isTrailing = cleanText.length > 0;
    return <span className={className}>{cleanText}<WaitingEllipsis trailing={isTrailing} /></span>;
  }
  const textStyle = wasGenerating ? `${className} ${styles.textFlash}`.trim() : className;
  return <span className={textStyle}>{cleanText}</span>;
}

export default GeneratedText;