import WaitingEllipsis from "@/components/waitingEllipsis/WaitingEllipsis";
import {parseSimpleResponse} from "@/common/sloppyJsonUtil";

export const GENERATING = '...';

type Props = {
  text:string,
  className?:string
}

function GeneratedText({text, className}:Props) {
  const isGenerating = text.trim().endsWith(GENERATING);
  const cleanText = '' + parseSimpleResponse(text.replace(GENERATING, ''));

  if (isGenerating) {
    const isTrailing = cleanText.length > 0;
    return <span className={className}>{cleanText}<WaitingEllipsis trailing={isTrailing} /></span>;
  }
  return <span className={className}>{cleanText}</span>;
}

export default GeneratedText;