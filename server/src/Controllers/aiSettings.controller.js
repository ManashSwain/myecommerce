import AiSettings from "../Modals/aiSettings.modal.js";
import {
  AI_SETTINGS_ID,
  normalizeAiSettings,
  readAiSettings,
} from "../utils/aiSettings.js";

const fail = (res, status, message, code) =>
  res.status(status).json({ success: false, ...(code ? { code } : {}), message });

const serialize = (settings) => normalizeAiSettings(settings);

const handleError = (res, error, context) => {
  console.error(`${context}:`, error);

  if (error?.name === "ValidationError") {
    const message =
      Object.values(error.errors)[0]?.message ||
      "Invalid AI assistant settings.";
    return fail(res, 400, message);
  }

  return fail(res, 500, "Something went wrong. Please try again.");
};

// GET /api/ai-settings — admin view of the global assistant switch.
export const getAiSettings = async (req, res) => {
  try {
    const settings = await readAiSettings();
    return res.status(200).json({ success: true, data: serialize(settings) });
  } catch (error) {
    return handleError(res, error, "getAiSettings error");
  }
};

// PUT /api/ai-settings — turn the assistant on or off for every member.
export const updateAiSettings = async (req, res) => {
  try {
    const body = req.body ?? {};

    if (typeof body.enabled !== "boolean") {
      return fail(res, 400, "enabled must be true or false.");
    }

    const settings = await AiSettings.findByIdAndUpdate(
      AI_SETTINGS_ID,
      {
        $set: {
          enabled: body.enabled,
          updatedBy: req.admin?.email || req.admin?.name || "Admin",
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: body.enabled
        ? "AI assistant enabled for all members."
        : "AI assistant disabled for all members.",
      data: serialize(settings),
    });
  } catch (error) {
    return handleError(res, error, "updateAiSettings error");
  }
};

// GET /api/ai-settings/status — public availability check used by the
// storefront to decide whether to render the chat launcher. Only the boolean
// is exposed; audit fields stay behind the admin route.
export const getAiAssistantStatus = async (req, res) => {
  try {
    const settings = await readAiSettings();
    return res.status(200).json({
      success: true,
      data: { enabled: settings.enabled },
    });
  } catch (error) {
    console.error("getAiAssistantStatus error:", error);
    // Fail closed: if availability cannot be confirmed, hide the launcher.
    return res.status(503).json({
      success: false,
      message: "The assistant status is unavailable right now.",
    });
  }
};
