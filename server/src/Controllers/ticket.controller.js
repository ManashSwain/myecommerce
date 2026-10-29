import { clerkClient } from "@clerk/express";
import mongoose from "mongoose";
import Ticket, {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "../Modals/ticket.modal.js";
import User from "../Modals/user.modal.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TICKETS_PER_HOUR = 10;
const MAX_REPLY_LENGTH = 3000;
const HOUR_MS = 60 * 60 * 1000;

const readText = (value) =>
  typeof value === "string" ? value.trim() : "";

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const serializeReply = (reply, { admin = false } = {}) => ({
  message: reply?.message || "",
  authorName: reply?.authorName || "Support team",
  ...(admin ? { authorEmail: reply?.authorEmail || "" } : {}),
  createdAt: reply?.createdAt || null,
});

// `admin: true` includes internal audit fields (staff email addresses). The
// customer view only exposes what the customer should see.
const serializeTicket = (ticket, { admin = false } = {}) => ({
  _id: String(ticket._id),
  ticketNumber: ticket.ticketNumber,
  subject: ticket.subject,
  description: ticket.description,
  category: ticket.category,
  priority: ticket.priority,
  status: ticket.status,
  requester: {
    name: ticket.requester?.name || "",
    email: ticket.requester?.email || "",
  },
  orderNumber: ticket.orderNumber || "",
  source: ticket.source,
  createdBy:
    admin && (ticket.createdBy?.email || ticket.createdBy?.name)
      ? {
          name: ticket.createdBy.name || "",
          email: ticket.createdBy.email || "",
        }
      : null,
  statusUpdatedAt: ticket.statusUpdatedAt || null,
  statusUpdatedBy: admin ? ticket.statusUpdatedBy || "" : "",
  adminReplies: (ticket.adminReplies || []).map((reply) =>
    serializeReply(reply, { admin }),
  ),
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt,
});

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const handleError = (res, error, context) => {
  console.error(`${context}:`, error);

  if (error?.name === "ValidationError") {
    const message =
      Object.values(error.errors)[0]?.message || "Invalid ticket details.";
    return fail(res, 400, message);
  }

  return fail(res, 500, "Something went wrong. Please try again.");
};

// Shared validation for customer- and admin-created tickets. Admin-only
// fields (priority/status) are ignored for customer submissions.
const parseTicket = (body, { adminFields = false } = {}) => {
  const errors = [];
  const subject = readText(body.subject);
  const description = readText(body.description);
  const orderNumber = readText(body.orderNumber);

  let category = readText(body.category) || "other";
  if (!TICKET_CATEGORIES.includes(category)) {
    errors.push("Choose a valid ticket category.");
    category = "other";
  }

  if (subject.length < 5) {
    errors.push("Subject must be at least 5 characters long.");
  } else if (subject.length > 160) {
    errors.push("Subject must be 160 characters or fewer.");
  }

  if (description.length < 10) {
    errors.push("Please describe the issue in at least 10 characters.");
  } else if (description.length > 5000) {
    errors.push("Description must be 5000 characters or fewer.");
  }

  if (orderNumber.length > 64) {
    errors.push("Order number must be 64 characters or fewer.");
  }

  let priority = "normal";
  let status = "open";

  if (adminFields) {
    if (body.priority !== undefined && body.priority !== "") {
      priority = readText(body.priority);
      if (!TICKET_PRIORITIES.includes(priority)) {
        errors.push("Choose a valid priority.");
        priority = "normal";
      }
    }

    if (body.status !== undefined && body.status !== "") {
      status = readText(body.status);
      if (!TICKET_STATUSES.includes(status)) {
        errors.push("Choose a valid ticket status.");
        status = "open";
      }
    }
  }

  return {
    errors,
    values: { subject, description, category, orderNumber, priority, status },
  };
};

// Prefer our own user record, then Clerk's API. The request-body fallback is
// only used when neither is available (e.g. during local setup) and the ticket
// still belongs to the authenticated Clerk user.
const resolveCustomer = async (clerkId, body) => {
  try {
    const user = await User.findOne({ clerkId }).lean();
    if (user?.email_addresses) {
      const name =
        [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
        user.username ||
        user.email_addresses;
      return {
        clerkId,
        name: name.slice(0, 120),
        email: user.email_addresses.toLowerCase(),
      };
    }
  } catch (error) {
    console.error("resolveCustomer local lookup failed:", error);
  }

  try {
    const user = await clerkClient.users.getUser(clerkId);
    const email =
      user.emailAddresses.find(
        (entry) => entry.id === user.primaryEmailAddressId,
      )?.emailAddress || user.emailAddresses[0]?.emailAddress;

    if (email) {
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        user.username ||
        email.split("@")[0];
      return {
        clerkId,
        name: name.slice(0, 120),
        email: email.toLowerCase(),
      };
    }
  } catch (error) {
    console.error("resolveCustomer Clerk lookup failed:", error.message);
  }

  const fallbackEmail = readText(body.email).toLowerCase();
  if (!EMAIL_RE.test(fallbackEmail)) return null;

  const fallbackName =
    readText(body.name).slice(0, 120) || fallbackEmail.split("@")[0];

  return { clerkId, name: fallbackName, email: fallbackEmail };
};

// Link an admin-created ticket to a storefront account when the email matches
// one, so the ticket also appears in that customer's "My tickets" list.
const findUserByEmail = async (email) => {
  try {
    return await User.findOne({
      email_addresses: {
        $regex: `^${escapeRegex(email)}$`,
        $options: "i",
      },
    }).lean();
  } catch (error) {
    console.error("findUserByEmail failed:", error);
    return null;
  }
};

// POST /api/tickets — signed-in customer raises a ticket.
export const createTicket = async (req, res) => {
  try {
    const { errors, values } = parseTicket(req.body ?? {});
    if (errors.length) return fail(res, 400, errors[0]);

    const rateWindow = new Date(Date.now() - HOUR_MS);
    const recentCount = await Ticket.countDocuments({
      "requester.clerkId": req.clerkUserId,
      source: "customer",
      createdAt: { $gte: rateWindow },
    });

    if (recentCount >= MAX_TICKETS_PER_HOUR) {
      return fail(
        res,
        429,
        "You've opened several tickets recently. Please wait before creating another.",
      );
    }

    const requester = await resolveCustomer(
      req.clerkUserId,
      req.body ?? {},
    );

    if (!requester) {
      return fail(
        res,
        400,
        "We couldn't load your account email. Please refresh and try again.",
      );
    }

    const ticket = await Ticket.create({
      ...values,
      requester,
      source: "customer",
      statusUpdatedBy: "customer",
    });

    return res.status(201).json({
      success: true,
      message: "Support ticket created.",
      data: serializeTicket(ticket),
    });
  } catch (error) {
    return handleError(res, error, "createTicket error");
  }
};

// GET /api/tickets/mine — the signed-in customer's ticket history.
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      "requester.clerkId": req.clerkUserId,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const summary = {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "open").length,
      inProgress: tickets.filter((ticket) => ticket.status === "in_progress")
        .length,
      resolved: tickets.filter((ticket) => ticket.status === "resolved")
        .length,
      closed: tickets.filter((ticket) => ticket.status === "closed").length,
    };

    return res.status(200).json({
      success: true,
      data: tickets.map(serializeTicket),
      summary,
    });
  } catch (error) {
    return handleError(res, error, "getMyTickets error");
  }
};

// GET /api/tickets — admin list with search, filters and pagination.
export const listTickets = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const status = readText(req.query.status);
    const priority = readText(req.query.priority);
    const category = readText(req.query.category);
    const search = readText(req.query.search);

    if (status && status !== "all" && !TICKET_STATUSES.includes(status)) {
      return fail(res, 400, "Invalid status filter.");
    }
    if (
      priority &&
      priority !== "all" &&
      !TICKET_PRIORITIES.includes(priority)
    ) {
      return fail(res, 400, "Invalid priority filter.");
    }
    if (
      category &&
      category !== "all" &&
      !TICKET_CATEGORIES.includes(category)
    ) {
      return fail(res, 400, "Invalid category filter.");
    }

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (priority && priority !== "all") filter.priority = priority;
    if (category && category !== "all") filter.category = category;

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { ticketNumber: regex },
        { subject: regex },
        { description: regex },
        { orderNumber: regex },
        { "requester.name": regex },
        { "requester.email": regex },
      ];
    }

    const total = await Ticket.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const safePage = Math.min(page, totalPages);

    const [tickets, allTotal, open, inProgress, resolved, closed, urgent] =
      await Promise.all([
        Ticket.find(filter)
          .sort({ createdAt: -1 })
          .skip((safePage - 1) * limit)
          .limit(limit)
          .lean(),
        Ticket.countDocuments({}),
        Ticket.countDocuments({ status: "open" }),
        Ticket.countDocuments({ status: "in_progress" }),
        Ticket.countDocuments({ status: "resolved" }),
        Ticket.countDocuments({ status: "closed" }),
        Ticket.countDocuments({ priority: "urgent", status: { $ne: "closed" } }),
      ]);

    return res.status(200).json({
      success: true,
      data: tickets.map((ticket) => serializeTicket(ticket, { admin: true })),
      summary: {
        total: allTotal,
        open,
        inProgress,
        resolved,
        closed,
        urgent,
      },
      pagination: {
        page: safePage,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return handleError(res, error, "listTickets error");
  }
};

// POST /api/tickets/admin — admin creates a ticket on a customer's behalf.
export const createAdminTicket = async (req, res) => {
  try {
    const body = req.body ?? {};
    const { errors, values } = parseTicket(body, { adminFields: true });
    if (errors.length) return fail(res, 400, errors[0]);

    const requesterName = readText(
      body.requesterName || body.name,
    );
    const requesterEmail = readText(
      body.requesterEmail || body.email,
    ).toLowerCase();

    if (!requesterName || requesterName.length > 120) {
      return fail(
        res,
        400,
        "Enter the customer's name (120 characters or fewer).",
      );
    }
    if (!EMAIL_RE.test(requesterEmail) || requesterEmail.length > 200) {
      return fail(res, 400, "Enter a valid customer email address.");
    }

    const linkedUser = await findUserByEmail(requesterEmail);

    const ticket = await Ticket.create({
      ...values,
      requester: {
        clerkId: linkedUser?.clerkId || "",
        name: requesterName,
        email: requesterEmail,
      },
      source: "admin",
      createdBy: {
        adminId: req.admin._id,
        name: req.admin.name || req.admin.email,
        email: req.admin.email,
      },
      statusUpdatedBy: req.admin.email,
    });

    return res.status(201).json({
      success: true,
      message: "Support ticket created.",
      data: serializeTicket(ticket, { admin: true }),
    });
  } catch (error) {
    return handleError(res, error, "createAdminTicket error");
  }
};

// PATCH /api/tickets/admin/:ticketId — move a ticket through the workflow.
export const updateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return fail(res, 400, "Invalid ticket id.");
    }

    const updates = {};
    const push = {};
    const body = req.body ?? {};

    if (body.status !== undefined) {
      const status = readText(body.status);
      if (!TICKET_STATUSES.includes(status)) {
        return fail(res, 400, "Choose a valid ticket status.");
      }
      updates.status = status;
      updates.statusUpdatedAt = new Date();
      updates.statusUpdatedBy = req.admin.email;
    }

    if (body.priority !== undefined) {
      const priority = readText(body.priority);
      if (!TICKET_PRIORITIES.includes(priority)) {
        return fail(res, 400, "Choose a valid priority.");
      }
      updates.priority = priority;
    }

    // The reply is public: it appears in the customer's ticket history.
    const response = readText(body.response);
    if (response) {
      if (response.length < 2) {
        return fail(res, 400, "Write a slightly longer reply.");
      }
      if (response.length > MAX_REPLY_LENGTH) {
        return fail(
          res,
          400,
          `Reply must be ${MAX_REPLY_LENGTH} characters or fewer.`,
        );
      }

      push.adminReplies = {
        message: response,
        authorName: req.admin.name || "Support team",
        authorEmail: req.admin.email,
        adminId: req.admin._id,
        createdAt: new Date(),
      };
    }

    if (!Object.keys(updates).length && !Object.keys(push).length) {
      return fail(res, 400, "Nothing to update.");
    }

    const updateDoc = { ...updates };
    if (Object.keys(push).length) updateDoc.$push = push;

    const ticket = await Ticket.findByIdAndUpdate(ticketId, updateDoc, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!ticket) return fail(res, 404, "Ticket not found.");

    return res.status(200).json({
      success: true,
      message: "Ticket updated.",
      data: serializeTicket(ticket, { admin: true }),
    });
  } catch (error) {
    return handleError(res, error, "updateTicket error");
  }
};
