const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    template: {
      type: String,
      enum: [
        "blank",
        "javascript",
        "react",
        "python",
        "cpp",
      ],
      default: "blank",
    },

    language: {
      type: String,
      required: true,
      default: "Blank",
    },

    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        role: {
          type: String,
          enum: ["owner", "editor", "viewer"],
          default: "viewer",
        },

        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    lastOpenedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Workspace = mongoose.model(
  "Workspace",
  workspaceSchema
);

module.exports = Workspace;