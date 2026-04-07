import { verifyWebhook } from "@clerk/express/webhooks";
import User from "../Modals/user.modal.js";

export const handleclerkwebhooks = async (req, res) => {
  try {
    const evt = await verifyWebhook(req);

    const {
      id,
      first_name,
      last_name,
      profile_image_url,
      username,
      email_addresses,
    } = evt.data;

    const eventType = evt.type;
    console.log(
      `Received webhook with ID ${id} and event type of ${eventType}`,
    );
    console.log("Webhook payload:", evt.data);
    // Create user 
    if (evt.type === "user.created") {
      // console.log("userId:", evt.data.id);
      const createdUser = await User.create({
        clerkId: id,
        first_name: first_name,
        last_name: last_name,
        profile_image_url: profile_image_url,
        username: username,
        email_addresses: email_addresses[0].email_address,
      });
      return res.status(200).json({
        success: true,
        message: "Created user successfully",
        data: createdUser,
      });
    }
    // update user 
    if (evt.type === "user.updated") {
      const user = {
        clerkId: id,
        first_name: first_name,
        last_name: last_name,
        profile_image_url: profile_image_url,
        username: username,
        email_addresses: email_addresses[0].email_address,
      };
      const updatedUser = await User.findOneAndUpdate({ clerkId: id }, user, {
        new: true,
        runValidators: true,
      });
      return res.status(200).json({
        sucess: true,
        message: "Updated successfully",
        data: updatedUser,
      });
    }
    // delete user 
    if (evt.type === "user.deleted") {
      const deletedUser = await User.findOneAndDelete({ clerkId: id });
      return res.status(200).json({
        sucess: true,
        message: "Deleted successfully",
        data: deletedUser,
      });
    }
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return res.status(400).send("Error verifying webhook");
  }
};
