import { useEffect, useState } from "react";

import LivingSvg from "@/components/livingSvg/LivingSvg";
import { SquiggleType } from "@/components/squiggleFilter/SquiggleFilter";
import { startSpiel, stopSpiel, updateProgress, updateCurrentTask } from "./interactions/story";

type Props = {
  svgUrl:string,
  spielUrl:string|null,
  percentComplete:number,
  currentTask:string,
  playLooped?:boolean
}

const WAIT_SECONDS = 3;
function ProgressStory({svgUrl, spielUrl, playLooped, percentComplete, currentTask}:Props) {
  const [textReplacements, setTextReplacements] = useState<{[key:string]:string}>({});

  useEffect(() => {
    if (!spielUrl) return;
    startSpiel(WAIT_SECONDS, spielUrl, playLooped===true, setTextReplacements);
    return stopSpiel;
  }, [spielUrl]);

  useEffect(() => {
    updateProgress(percentComplete);
  }, [percentComplete]);

  useEffect(() => {
    updateCurrentTask(currentTask);
  }, [currentTask])

  return (
    <>
      <LivingSvg url={svgUrl} squiggleType={SquiggleType.SUBTLE} textSquiggles={true} textReplacements={textReplacements}/>
    </>
  );
}

export default ProgressStory;