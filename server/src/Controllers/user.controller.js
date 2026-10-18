import { verifyWebhook } from "@clerk/express/webhooks";
import User from "../Modals/user.modal.js";
import { Order } from "../Modals/order.modal.js";

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

// GET ALL USERS (get) — admin.
// Returns a paginated, searchable list of users plus a roll-up summary used
// by the stat cards at the top of the admin Users panel.
// Query: ?search=<term>&page=1&limit=10&status=all|active|blocked
export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const search = (req.query.search || "").trim();
    const status = req.query.status || "all"; // all | active | blocked

    // Build the filter object from search + status.
    const filter = {};
    if (status === "active") filter.isBlocked = { $ne: true };
    if (status === "blocked") filter.isBlocked = true;

    if (search) {
      // Escape regex specials so user input is matched literally.
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { first_name: regex },
        { last_name: regex },
        { username: regex },
        { email_addresses: regex },
      ];
    }

    const total = await User.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const safePage = Math.min(page, totalPages);

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * limit)
      .limit(limit)
      .lean();

    // ---- Summary stats (computed over ALL users, not just this page) ------
    const [totalUsers, blockedUsers] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isBlocked: true }),
    ]);

    // New sign-ups in the last 30 days.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Attach a per-user order count + total spent so the card is informative.
    // Orders store the clerkId as their `userId`, so we match on that. One
    // aggregation for every user on the page keeps it to a single query.
    const pageClerkIds = users.map((u) => u.clerkId).filter(Boolean);
    const orderStats = await Order.aggregate([
      { $match: { userId: { $in: pageClerkIds } } },
      {
        $group: {
          _id: "$userId",
          orders: { $sum: 1 },
          spent: { $sum: "$total" },
        },
      },
    ]);
    const statsByUser = new Map(
      orderStats.map((s) => [String(s._id), s]),
    );

    const data = users.map((u) => {
      const stats = statsByUser.get(String(u.clerkId));
      return {
        _id: u._id,
        clerkId: u.clerkId,
        firstName: u.first_name,
        lastName: u.last_name,
        fullName:
          [u.first_name, u.last_name].filter(Boolean).join(" ") || "—",
        username: u.username || "",
        email: u.email_addresses,
        image: u.profile_image_url || "",
        isBlocked: !!u.isBlocked,
        createdAt: u.createdAt,
        orderCount: stats?.orders || 0,
        totalSpent: Number((stats?.spent || 0).toFixed(2)),
      };
    });

    return res.status(200).json({
      success: true,
      message: "Fetched users successfully",
      data,
      pagination: {
        page: safePage,
        limit,
        total,
        totalPages,
      },
      summary: {
        totalUsers,
        blockedUsers,
        activeUsers: totalUsers - blockedUsers,
        newUsers,
      },
    });
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// BLOCK / UNBLOCK A USER (patch) — admin.
// Body: { isBlocked: boolean }  (omit to toggle the current value)
export const toggleUserBlock = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Explicit value wins; otherwise flip the current state.
    const next =
      typeof req.body?.isBlocked === "boolean"
        ? req.body.isBlocked
        : !user.isBlocked;

    user.isBlocked = next;
    await user.save();

    return res.status(200).json({
      success: true,
      message: next ? "User blocked" : "User unblocked",
      data: {
        _id: user._id,
        isBlocked: user.isBlocked,
      },
    });
  } catch (err) {
    console.error("toggleUserBlock error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
