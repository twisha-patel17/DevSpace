
const mongoose = require("mongoose");

const Workspace = require("../models/workspace.model");
const User = require("../models/user.model");

const searchWorkspaceMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const query =
      typeof req.query.q === "string" ? req.query.q.trim() : "";

    const actorId = req.user?.userId;

    if (!actorId || !mongoose.isValidObjectId(actorId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID.",
      });
    }

    if (query.length < 2) {
      return res.status(200).json({
        success: true,
        users: [],
      });
    }

    const workspace = await Workspace.findById(workspaceId)
      .select("owner members.user")
      .lean();

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found.",
      });
    }

    if (String(workspace.owner) !== String(actorId)) {
      return res.status(403).json({
        success: false,
        message: "Only the workspace owner can invite collaborators.",
      });
    }

    const existingMemberIds = (workspace.members || [])
      .map((member) => {
        const memberUser = member.user;
        return String(memberUser?._id || memberUser || "");
      })
      .filter(Boolean);

    existingMemberIds.push(String(workspace.owner));

    // Escape regex characters so the search input is treated literally.
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedQuery, "i");

    const users = await User.find({
      _id: { $nin: existingMemberIds },
      $or: [
        { username: searchRegex },
        { email: searchRegex },
      ],
    })
      .select("_id username email avatar")
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      users: users.map((user) => ({
        id: String(user._id),
        username: user.username,
        email: user.email,
        avatar: user.avatar || "",
      })),
    });
  } catch (error) {
    console.error("Search workspace members error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search for collaborators.",
    });
  }
};

module.exports = {
  searchWorkspaceMembers,
};
