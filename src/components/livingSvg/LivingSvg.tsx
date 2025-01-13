import { useEffect, useState } from "react";
import { loadSvgTemplate } from "./svgTemplateUtil";
import SquiggleFilter, { SquiggleType, classNameForSquiggleType } from "@/components/squiggleFilter/SquiggleFilter";
import { TextBox } from "./types/SvgTemplate";
import styles from './LivingSvg.module.css';
import { baseUrl } from "@/common/urlUtil";

type Props = {
  url:string,
  textReplacements?:{[key:string]:string}
  squiggleType?:SquiggleType,
  textSquiggles?:boolean,
  className?:string
}

const DEFAULT_SQUIGGLE_TYPE = SquiggleType.SUBTLE;

function LivingSvg({url, squiggleType, className, textReplacements, textSquiggles}:Props) {
  const [textBoxes, setTextBoxes] = useState<TextBox[]|null>(null);
  
  useEffect(() => {
    loadSvgTemplate(url).then(svgTemplate => {
      setTextBoxes(svgTemplate.textBoxes);
    });
  }, [url]);

  squiggleType = squiggleType ?? DEFAULT_SQUIGGLE_TYPE;
  const squiggleClass = classNameForSquiggleType(squiggleType);
  const imageClass = `${styles.image} ${squiggleClass}`;

  const textBoxesContent = textBoxes?.map(textBox => {
    const text = textReplacements?.[textBox.key];
    if (!text) return null;
    const textBoxClassName = textSquiggles ? `${styles.speech} ${squiggleClass}` : styles[textBox.className];
    return (
      <div key={textBox.key} className={textBoxClassName}
            style={{position:'absolute', left:`${textBox.x*100}%`, top:`${textBox.y*100}%`, maxWidth:`${textBox.width*100}%` }}>
          {text}
      </div>
    );
  })

  return <div className={`${styles.container} ${className}`}>
    <SquiggleFilter squiggleType={squiggleType} />
    <img src={baseUrl(url)} className={imageClass} />
    {textBoxesContent}
  </div>;
}

export default LivingSvg;