import Admin from "../Modals/admin.modal.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shape a record for the UI. `isSelf` lets the panel disable actions that
// would lock the current admin out.
const serialize = (admin, currentId) => ({
  _id: admin._id,
  email: admin.email,
  name: admin.name || "",
  picture: admin.picture || "",
  role: admin.role,
  isActive: admin.isActive !== false,
  // false = invited by email, hasn't signed in yet.
  isLinked: Boolean(admin.auth0Id),
  isSelf: String(admin._id) === String(currentId),
  createdBy: admin.createdBy || "system",
  lastLoginAt: admin.lastLoginAt || null,
  createdAt: admin.createdAt,
});

const sortAdmins = (list) =>
  [...list].sort((a, b) => {
    if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

// GET /api/admins/me — session check used by the admin SPA's gate.
export const getMyAdmin = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      ...serialize(req.admin, req.admin._id),
      permissions: {
        canManageOwners: req.admin.role === "owner",
      },
    },
  });
};

// GET /api/admins — list everyone with access.
export const listAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}).lean();
    const data = sortAdmins(admins).map((admin) =>
      serialize(admin, req.admin._id),
    );

    return res.status(200).json({
      success: true,
      data,
      summary: {
        total: data.length,
        owners: data.filter((admin) => admin.role === "owner").length,
        active: data.filter((admin) => admin.isActive).length,
      },
    });
  } catch (err) {
    console.error("listAdmins error:", err);
    return res.status(500).json({
      success: false,
      message: "Could not load admins.",
    });
  }
};

// POST /api/admins — add a person by email.
// The Auth0 account may already exist or be created later; either way access
// only becomes usable once an identity with this email signs in.
export const createAdmin = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const name = String(req.body.name || "").trim();
    const role = req.body.role === "owner" ? "owner" : "admin";

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address.",
      });
    }

    // Only owners can mint another owner.
    if (role === "owner" && req.admin.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only an owner can add another owner.",
      });
    }

    const existing = await Admin.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "That email already has admin access.",
      });
    }

    const admin = await Admin.create({
      email,
      name,
      role,
      createdBy: req.admin.email,
    });

    return res.status(201).json({
      success: true,
      message: "Admin added.",
      data: serialize(admin, req.admin._id),
    });
  } catch (err) {
    console.error("createAdmin error:", err);

    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "That email already has admin access.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not add the admin.",
    });
  }
};

// PATCH /api/admins/:adminId — rename, change role, enable/disable.
export const updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    const isSelf = String(admin._id) === String(req.admin._id);
    const nextRole =
      req.body.role !== undefined ? req.body.role : admin.role;
    const nextActive =
      req.body.isActive !== undefined
        ? Boolean(req.body.isActive)
        : admin.isActive;

    if (nextRole !== "owner" && nextRole !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Role must be owner or admin.",
      });
    }

    // Nobody edits their own role/status — prevents accidental lockout.
    if (isSelf && (nextRole !== admin.role || nextActive !== admin.isActive)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role or access status.",
      });
    }

    // Regular admins cannot touch owners or roles.
    if (
      req.admin.role !== "owner" &&
      (admin.role === "owner" || nextRole !== admin.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only an owner can manage owners or change roles.",
      });
    }

    // Never leave the panel without an active owner.
    if (
      admin.role === "owner" &&
      (nextRole !== "owner" || !nextActive)
    ) {
      const activeOwners = await Admin.countDocuments({
        role: "owner",
        isActive: true,
      });
      if (activeOwners <= 1) {
        return res.status(400).json({
          success: false,
          message: "At least one active owner is required.",
        });
      }
    }

    if (req.body.name !== undefined) {
      admin.name = String(req.body.name).trim();
    }
    admin.role = nextRole;
    admin.isActive = nextActive;

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Admin updated.",
      data: serialize(admin, req.admin._id),
    });
  } catch (err) {
    console.error("updateAdmin error:", err);
    return res.status(500).json({
      success: false,
      message: "Could not update the admin.",
    });
  }
};

// DELETE /api/admins/:adminId — revoke access. The Auth0 account itself is
// untouched; the person simply stops passing the allow-list check.
export const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    if (String(admin._id) === String(req.admin._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own admin access.",
      });
    }

    if (admin.role === "owner" && req.admin.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only an owner can remove another owner.",
      });
    }

    if (admin.role === "owner") {
      const owners = await Admin.countDocuments({ role: "owner" });
      if (owners <= 1) {
        return res.status(400).json({
          success: false,
          message: "At least one owner is required.",
        });
      }
    }

    await admin.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Admin access removed.",
    });
  } catch (err) {
    console.error("deleteAdmin error:", err);
    return res.status(500).json({
      success: false,
      message: "Could not remove the admin.",
    });
  }
};
