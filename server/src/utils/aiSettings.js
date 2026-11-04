import AiSettings from "../Modals/aiSettings.modal.js";

export const AI_SETTINGS_ID = "ai-assistant";

// Existing behaviour is "assistant available", so an untouched installation
// keeps working until an admin explicitly turns it off.
export const DEFAULT_AI_ENABLED = true;

export const normalizeAiSettings = (settings) => ({
  enabled:
    settings?.enabled === undefined || settings?.enabled === null
      ? DEFAULT_AI_ENABLED
      : settings.enabled === true,
  updatedAt: settings?.updatedAt || null,
  updatedBy: settings?.updatedBy || "",
});

export const readAiSettings = async () => {
  const settings = await AiSettings.findById(AI_SETTINGS_ID).lean();
  return normalizeAiSettings(settings);
};
