import { useEffect, useState } from "react";
import { loadSvgTemplate } from "./svgTemplateUtil";
import SquiggleFilter, { SquiggleType, classNameForSquiggleType } from "@/components/squiggleFilter/SquiggleFilter";
import { TextBox } from "./types/SvgTemplate";
import styles from './LivingSvg.module.css';

type Props = {
  url:string,
  textReplacements?:{[key:string]:string}
  squiggleType?:SquiggleType,
  className?:string
}

const DEFAULT_SQUIGGLE_TYPE = SquiggleType.SUBTLE;

function LivingSvg({url, squiggleType, className, textReplacements}:Props) {
  const [textBoxes, setTextBoxes] = useState<TextBox[]|null>(null);

  useEffect(() => {
    loadSvgTemplate(url).then(svgTemplate => {
      setTextBoxes(svgTemplate.textBoxes);
    });
  }, [url]);

  squiggleType = squiggleType ?? DEFAULT_SQUIGGLE_TYPE;
  const imageClass = `${classNameForSquiggleType(squiggleType)} ${className}`;

  const textBoxesContent = textBoxes?.map(textBox => {
    const text = textReplacements?.[textBox.key] ?? textBox.key;
    return <div key={textBox.key} style={{position:'absolute', left:`${textBox.x*100}%`, 
        top:`${textBox.y*100}%`, width:`${textBox.width*100}%`, height:`${textBox.height*100}%` }}>{text}</div>;
  })

  return <div className={styles.container}>
    <SquiggleFilter squiggleType={squiggleType} />
    <img src={url} className={imageClass} />
    {textBoxesContent}
  </div>;
}

export default LivingSvg;