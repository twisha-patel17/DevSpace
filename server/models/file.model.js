
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    path: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["file", "folder"],
      default: "file",
      required: true,
    },

    language: {
      type: String,
      default: null,
    },

    content: {
      type: String,
      default: "",
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

fileSchema.index(
  { workspace: 1, path: 1 },
  { unique: true }
);

fileSchema.pre("validate", function (next) {
  if (typeof this.name !== "string" || !this.name.trim()) {
    this.invalidate("name", "File or folder name is required");
  }

  if (
    typeof this.name === "string" &&
    (/[\\/]/.test(this.name) ||
      this.name === "." ||
      this.name === "..")
  ) {
    this.invalidate(
      "name",
      "Name cannot contain path separators or be . or .."
    );
  }

  if (typeof this.path === "string") {
    this.path = this.path
      .trim()
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, "")
      .replace(/\/+/g, "/");

    if (
      !this.path ||
      this.path.split("/").some(
        (segment) =>
          !segment ||
          segment === "." ||
          segment === ".."
      )
    ) {
      this.invalidate("path", "Invalid file path");
    }

    if (
      typeof this.name === "string" &&
      this.path.split("/").pop() !== this.name.trim()
    ) {
      this.invalidate(
        "path",
        "Path must end with the file or folder name"
      );
    }
  }

  if (this.type === "folder") {
    this.content = "";
    this.language = null;
  }

  next();
});

module.exports = mongoose.model("File", fileSchema);