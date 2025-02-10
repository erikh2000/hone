import {useState, useEffect} from "react";
import {useLocation} from "wouter";

import styles from './LoadScreen.module.css';
import { init, useLocalLlm, useCustomLlm } from "./interactions/initialization";
import {HOME_URL} from "@/common/urlUtil.ts";
import ProgressBar from '@/components/progressBar/ProgressBar';
import ProgressStory from '@/components/progressStory/ProgressStory';
import ConfigureCustomLLMDialog from './dialogs/ConfigureCustomLLMDialog';
import CustomLLMConfig from '@/llm/types/CustomLLMConfig';

function LoadScreen() {
  const [percentComplete, setPercentComplete] = useState(0);
  const [currentTask, setCurrentTask] = useState('Loading');
  const [customLlmConfig, setCustomLlmConfig] = useState<CustomLLMConfig|null>(null);
  const [modalDialog, setModalDialog] = useState<string|null>(null);
  const [spielUrl, setSpielUrl] = useState<string|null>(null);
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    async function _async() {
      const initResults = await init();
      if (!initResults) return;
      if (initResults.customLlmConfig) { 
        setCustomLlmConfig(initResults.customLlmConfig);
        setModalDialog(ConfigureCustomLLMDialog.name);
      } else {
        useLocalLlm(setPercentComplete, setCurrentTask, setSpielUrl, setModalDialog, setLocation);
        setLocation(HOME_URL);
      }
    }
    _async();
  }, [setPercentComplete, setCurrentTask, setSpielUrl, setModalDialog]);
  
  return (
    <div className={styles.container}>
      <div className={styles.header}><h1>Hone - Loading</h1></div>
      <div className={styles.content}>
        <ProgressStory svgUrl="/loading/calmPete.svg" spielUrl={spielUrl} currentTask={currentTask} percentComplete={percentComplete} />
        <div className={styles.progressBarContainer}>
          <ProgressBar percentComplete={percentComplete}/>
          {currentTask}
        </div>
      </div>

      <ConfigureCustomLLMDialog 
        isOpen={modalDialog===ConfigureCustomLLMDialog.name} 
        config={customLlmConfig} 
        onUseLocalLLM={() => useLocalLlm(setPercentComplete, setCurrentTask, setSpielUrl, setModalDialog, setLocation)} 
        onUseCustomLLM={(updatedConfig) => useCustomLlm(updatedConfig, setModalDialog, setLocation)}
      />
    </div>
  );
}

export default LoadScreen;