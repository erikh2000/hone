import { useState, useEffect } from "react";

import DialogButton from "@/components/modalDialogs/DialogButton";
import DialogFooter from "@/components/modalDialogs/DialogFooter";
import ModalDialog from "@/components/modalDialogs/ModalDialog";
import DialogTextInput from "@/components/modalDialogs/DialogTextInput";
import CustomLLMConfig from "@/llm/types/CustomLLMConfig"
import { areUserSettingsMissing } from "@/llm/customLlmUtil";
import Checkbox from "@/components/checkbox/Checkbox";

type Props = {
  config:CustomLLMConfig|null,
  isOpen:boolean,
  onUseLocalLLM:() => void,
  onUseCustomLLM:(updatedConfig:CustomLLMConfig, persistSettings:boolean) => void
}

function _settingsContent(config:CustomLLMConfig, setUpdatedConfig:Function, persistSettings:boolean, 
    setPersistSettings:(persistSettings:boolean) => void):JSX.Element|null {
  const settingKeys = Object.keys(config.userSettings);
  if (!settingKeys.length) return null;

  const _settingsInputs = settingKeys.map(key => {
    return (
      <DialogTextInput key={key} labelText={key} value={config.userSettings[key]} 
      onChangeText={text => {
        const nextConfig = {...config};
        nextConfig.userSettings = {...config.userSettings};
        nextConfig.userSettings[key] = text;
        setUpdatedConfig(nextConfig);
      }}/>
    );
  });

  return (
    <>
      <p>Settings Required for Custom LLM:</p>
      {_settingsInputs}
      <Checkbox label="Remember settings on this device" isChecked={persistSettings} onChange={setPersistSettings}/>
    </>
  );
}

function ConfigureCustomLLMSettingsDialog({config, isOpen, onUseLocalLLM, onUseCustomLLM}:Props) {
  const [updatedConfig, setUpdatedConfig] = useState<CustomLLMConfig|null>(null);
  const [persistSettings, setPersistSettings] = useState<boolean>(false);

  useEffect(() => {
    if (!config) return;
    setUpdatedConfig({...config});
  }, [config]);

  if (!isOpen || !updatedConfig) return null;

  const settingsContent = _settingsContent(updatedConfig, setUpdatedConfig, persistSettings, setPersistSettings);
  const isCustomLlmDisabled = areUserSettingsMissing(updatedConfig.userSettings);

  return (
    <ModalDialog isOpen={isOpen} title="Configure Custom LLM Settings">
      <p>This instance of Hone has been configured to use a custom LLM at {updatedConfig.completionUrl}. 
      If you prefer, you can instead use a local LLM to keep your data solely on this device.</p>
      {settingsContent}
      <DialogFooter>
        <DialogButton text="Use Local LLM" onClick={onUseLocalLLM}/>
        <DialogButton text="Use Custom LLM" onClick={() => onUseCustomLLM(updatedConfig, persistSettings)} isPrimary disabled={isCustomLlmDisabled}/>
      </DialogFooter>
    </ModalDialog>
  );
}

export default ConfigureCustomLLMSettingsDialog;