import EmailSettings from "../Modals/emailSettings.modal.js";
import { ORDER_STATUSES } from "../Modals/order.modal.js";

export const EMAIL_SETTINGS_ID = "order-status";

const isEnabled = (rawStatuses, status) => {
  if (!rawStatuses) return false;
  if (rawStatuses instanceof Map) return rawStatuses.get(status) === true;
  return rawStatuses[status] === true;
};

// Always return a complete set of status flags so a newly added status is
// off until an admin explicitly enables it.
export const normalizeEmailSettings = (settings) => {
  const rawStatuses = settings?.statuses || null;
  const statuses = {};

  for (const status of ORDER_STATUSES) {
    statuses[status] = isEnabled(rawStatuses, status);
  }

  return {
    statuses,
    disabledForAll: settings?.disabledForAll === true,
    updatedAt: settings?.updatedAt || null,
    updatedBy: settings?.updatedBy || "",
  };
};

export const readEmailSettings = async () => {
  const settings = await EmailSettings.findById(EMAIL_SETTINGS_ID).lean();
  return normalizeEmailSettings(settings);
};

// A missing document means every status email is off. Database failures also
// fail closed so a settings outage cannot accidentally send mail.
export const isOrderStatusEmailEnabled = async (status) => {
  if (!ORDER_STATUSES.includes(status)) return false;

  try {
    const settings = await readEmailSettings();
    return !settings.disabledForAll && settings.statuses[status] === true;
  } catch (error) {
    console.error("Could not read email delivery settings:", error.message);
    return false;
  }
};
