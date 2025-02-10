import CustomLLMConfig from "@/llm/types/CustomLLMConfig";
import { CUSTOM_LLM_USER_SETTINGS_KEY } from "./pathTemplates";
import { deleteByKey, getText, setText } from "./pathStore";

// Return true is settings were available, false if not.
export async function getCustomLlmUserSettings(config:CustomLLMConfig):Promise<boolean> {
  const configKeys = Object.keys(config.userSettings);
  if (!configKeys.length) { // This config doesn't use user settings, so exit early.
    await deleteByKey(CUSTOM_LLM_USER_SETTINGS_KEY); // If current config has no keys, any old settings are stale.
    return false;
  } 

  const settingsText = await getText(CUSTOM_LLM_USER_SETTINGS_KEY);
  if (!settingsText) return false; // No stored settings avaiable.

  try {
    // The retrieved settings may have values that don't correspond to the current config.
    // Only copy values that match keys in the current config.
    const retrievedSettings = JSON.parse(settingsText);
    for(let i = 0; i < configKeys.length; ++i) {
      const key = configKeys[i];
      const retrievedValue = retrievedSettings[key]
      if (retrievedValue !== undefined) config.userSettings[key] = retrievedValue;
    }
    return true;
  } catch (e) {
    console.error('Failed to parse custom LLM user settings', e);
    await deleteByKey(CUSTOM_LLM_USER_SETTINGS_KEY); // Settings corrupted, just delete them.
    return false;
  }
}

export async function setCustomLlmUserSettings(settings:Record<string,string>) {
  const configKeys = Object.keys(settings);
  if (!configKeys.length) return; // This config doesn't use user settings, so exit early.

  const settingsText = JSON.stringify(settings);
  await setText(CUSTOM_LLM_USER_SETTINGS_KEY, settingsText); // This may clear dead key/value pairs not used by current config. That's by design.
}

export async function clearCustomLlmUserSettings() {
 await deleteByKey(CUSTOM_LLM_USER_SETTINGS_KEY);
}