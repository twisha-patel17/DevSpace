const File = require("../models/File");
const Project = require("../models/Project");

const createFile = async (req, res) => {
    try {
        const {name, type, content, language, projectId, parent} = req.body;

        if(!name || !type || !projectId) {
            return res.status(400).json({
                message: "Name, type and project id are required"
            });
        }

        if(!["file", "folder"].includes(type)) {
            return res.status(400).json({
                message: "Type must be file or folder",
            });
        }

        const project = await Project.findById({_id: projectId, owner: req.user.userId});

        if(!project) {
            return res.status(404).json({
                message: "Project not found",
            });
        }

        const file = await File.create({
            name,
            type,
            content: type === "file" ? content || "" : "",
            language: type === "file" ? language || "plaintext" : "plaintext",
            projectId: projectId,
            parent: parent || null,
            owner: req.user.userId,
        });

        res.status(201).json({
            message: `${type === "file" ? "File" : "Folder"} created successfully`,
            file,
        });
    } catch (error) {
        console.error("Create file error:", error);

        res.status(500).json({
            message: "Failed to create file",
        });
    }
};

const getProjectFiles = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const files = await File.find({
      project: projectId,
      owner: req.user.userId,
    }).sort({
      type: -1,
      name: 1,
    });

    res.status(200).json({
      files,
    });
  } catch (error) {
    console.error("Get files error:", error);

    res.status(500).json({
      message: "Failed to fetch project files",
    });
  }
};
const getFile = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    res.status(200).json({
      file,
    });
  } catch (error) {
    console.error("Get file error:", error);

    res.status(500).json({
      message: "Failed to fetch file",
    });
  }
};
const updateFile = async (req, res) => {
  try {
    const { name, content, language } = req.body;

    const file = await File.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.userId,
      },
      {
        ...(name !== undefined && { name }),
        ...(content !== undefined && { content }),
        ...(language !== undefined && { language }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    res.status(200).json({
      message: "File updated successfully",
      file,
    });
  } catch (error) {
    console.error("Update file error:", error);

    res.status(500).json({
      message: "Failed to update file",
    });
  }
};
const deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    await File.deleteMany({
      owner: req.user.userId,
      $or: [
        { _id: file._id },
        { parent: file._id },
      ],
    });

    res.status(200).json({
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete file error:", error);

    res.status(500).json({
      message: "Failed to delete file",
    });
  }
};

module.exports = {
  createFile,
  getProjectFiles,
  getFile,
  updateFile,
  deleteFile,
};