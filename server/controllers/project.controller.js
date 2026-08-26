const Project = require("../models/Project");

const createProject = async (req, res) => {
  try {
    const { name, description, language, visibility } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }
    const project = await Project.create({
      name,
      description,
      language,
      visibility,
      owner: req.user.userId,
    });
    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    res.status(500).json({
      message: "Failed to create project",
    });
  }
};
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      owner: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
};
const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.status(200).json({
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    res.status(500).json({
      message: "Failed to fetch project",
    });
  }
};
const updateProject = async (req, res) => {
  try {
    const { name, description, language, visibility } = req.body;

    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.userId,
      },
      {
        name,
        description,
        language,
        visibility,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }
    res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      message: "Failed to update project",
    });
  }
};
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.userId,
    });
    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }
    res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);

    res.status(500).json({
      message: "Failed to delete project",
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
};