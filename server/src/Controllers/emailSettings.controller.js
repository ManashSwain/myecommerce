import EmailSettings from "../Modals/emailSettings.modal.js";
import { ORDER_STATUSES } from "../Modals/order.modal.js";
import {
  EMAIL_SETTINGS_ID,
  normalizeEmailSettings,
  readEmailSettings,
} from "../utils/orderEmailSettings.js";

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const serialize = (settings) => ({
  ...normalizeEmailSettings(settings),
  availableStatuses: ORDER_STATUSES,
});

const handleError = (res, error, context) => {
  console.error(`${context}:`, error);

  if (error?.name === "ValidationError") {
    const message =
      Object.values(error.errors)[0]?.message ||
      "Invalid email delivery settings.";
    return fail(res, 400, message);
  }

  return fail(res, 500, "Something went wrong. Please try again.");
};

// GET /api/email-settings — current order-status email preferences.
export const getEmailSettings = async (req, res) => {
  try {
    const settings = await readEmailSettings();
    return res.status(200).json({ success: true, data: serialize(settings) });
  } catch (error) {
    return handleError(res, error, "getEmailSettings error");
  }
};

// PUT /api/email-settings — save per-status delivery flags and the global
// pause. Unknown statuses and non-boolean values are rejected rather than
// silently ignored.
export const updateEmailSettings = async (req, res) => {
  try {
    const body = req.body ?? {};
    const current = await readEmailSettings();
    const nextStatuses = { ...current.statuses };

    if (body.statuses !== undefined) {
      if (
        !body.statuses ||
        typeof body.statuses !== "object" ||
        Array.isArray(body.statuses)
      ) {
        return fail(res, 400, "Status settings must be an object.");
      }

      for (const [status, enabled] of Object.entries(body.statuses)) {
        if (!ORDER_STATUSES.includes(status)) {
          return fail(res, 400, `Unknown order status "${status}".`);
        }
        if (typeof enabled !== "boolean") {
          return fail(
            res,
            400,
            `Status "${status}" must be enabled or disabled.`,
          );
        }
        nextStatuses[status] = enabled;
      }
    }

    let disabledForAll = current.disabledForAll;
    if (body.disabledForAll !== undefined) {
      if (typeof body.disabledForAll !== "boolean") {
        return fail(res, 400, "disabledForAll must be true or false.");
      }
      disabledForAll = body.disabledForAll;
    }

    if (
      body.statuses === undefined &&
      body.disabledForAll === undefined
    ) {
      return fail(res, 400, "Nothing to update.");
    }

    const updatedBy = req.admin?.email || req.admin?.name || "Admin";

    const settings = await EmailSettings.findByIdAndUpdate(
      EMAIL_SETTINGS_ID,
      {
        $set: {
          statuses: nextStatuses,
          disabledForAll,
          updatedBy,
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
      message: "Email delivery settings saved.",
      data: serialize(settings),
    });
  } catch (error) {
    return handleError(res, error, "updateEmailSettings error");
  }
};
