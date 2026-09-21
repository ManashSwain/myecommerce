
import {Newsletter} from "../Modals/newsletter.modal.js";

// Subscribe to newsletter
export const subscribeNewsletter = async (req, res) => {
  try {
    // req.body is undefined when the request has no JSON content-type
    const { email } = req.body ?? {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    const existingSubscriber = await Newsletter.findOne({
      email: normalizedEmail,
    });

    if (existingSubscriber?.isSubscribed) {
      return res.status(409).json({
        message: "This email is already subscribed",
      });
    }

    // Reactivate if the email previously unsubscribed
    if (existingSubscriber) {
      existingSubscriber.isSubscribed = true;
      await existingSubscriber.save();

      return res.status(200).json({
        message: "You have subscribed successfully",
      });
    }

    await Newsletter.create({
      email: normalizedEmail,
    });

    return res.status(201).json({
      message: "You have subscribed successfully",
    });
  } catch (error) {
    // Handles duplicate-key race conditions
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This email is already subscribed",
      });
    }

    console.error("Newsletter subscription error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};