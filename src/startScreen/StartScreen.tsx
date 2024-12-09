import styles from './StartScreen.module.css';
import {LOAD_URL} from "@/common/urlUtil.ts";
import {isServingLocally} from "@/developer/devEnvUtil.ts";

import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import LLMDevPauseDialog from './dialogs/LLMDevPauseDialog';

function StartScreen() {
  const [, setLocation] = useLocation();
  const [modalDialog, setModalDialog] = useState<string|null>(null);

  useEffect(() => {
    if (isServingLocally()) {
      setModalDialog(LLMDevPauseDialog.name);
    } else {
      _continue();
    }
  },[]);

  function _continue() {
    setModalDialog(null);
    setLocation(LOAD_URL);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}><h1>Hone</h1></div>
      <LLMDevPauseDialog isOpen={modalDialog === LLMDevPauseDialog.name} onOkay={_continue} />
    </div>
  );
}

export default StartScreen;