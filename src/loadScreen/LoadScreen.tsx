import styles from './LoadScreen.module.css';
import { init } from "./interactions/initialization";
import {HOME_URL} from "@/common/urlUtil.ts";
import ProgressBar from '@/components/progressBar/ProgressBar';
import ProgressStory from '@/components/progressStory/ProgressStory';

import {useState, useEffect} from "react";
import {useLocation} from "wouter";

function LoadScreen() {
  const [percentComplete, setPercentComplete] = useState(0);
  const [currentTask, setCurrentTask] = useState('Loading');
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    init(setPercentComplete, setCurrentTask).then((isInitialized) => { if (isInitialized) setLocation(HOME_URL); });
  }, [setPercentComplete, setCurrentTask]);
  
  return (
    <div className={styles.container}>
      <div className={styles.header}><h1>Hone - Loading</h1></div>
      <div className={styles.content}>
        <ProgressStory svgUrl="/loading/calmPete.svg" spielUrl='/loading/calmPete.spiel' currentTask={currentTask} percentComplete={percentComplete} />
        <div className={styles.progressBarContainer}>
          <ProgressBar percentComplete={percentComplete}/>
          {currentTask}
        </div>
      </div>
    </div>
  );
}

export default LoadScreen;