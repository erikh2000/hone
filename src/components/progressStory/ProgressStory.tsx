import { useEffect, useState } from "react";

import LivingSvg from "@/components/livingSvg/LivingSvg";
import { SquiggleType } from "@/components/squiggleFilter/SquiggleFilter";
import { startSpiel, stopSpiel, updateProgress } from "./interactions/story";

type Props = {
  svgUrl:string,
  spielUrl:string,
  percentComplete:number,
  playLooped:boolean
}

const WAIT_SECONDS = 3;
function ProgressStory({svgUrl, spielUrl, playLooped, percentComplete}:Props) {
  const [textReplacements, setTextReplacements] = useState<{[key:string]:string}>({});

  useEffect(() => {
    startSpiel(WAIT_SECONDS, spielUrl, playLooped, setTextReplacements);
    return stopSpiel;
  }, [spielUrl]);

  useEffect(() => {
    updateProgress(percentComplete);
  }, [percentComplete]);

  return (
    <>
      <LivingSvg url={svgUrl} squiggleType={SquiggleType.SUBTLE} textSquiggles={true} textReplacements={textReplacements}/>
    </>
  );
}

export default ProgressStory;