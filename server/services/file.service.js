const File = require("../models/file.model");

const updateFileContent = async ({
  workspaceId,
  fileId,
  content,
  userId,
}) => {
  const file = await File.findOne({
    _id: fileId,
    workspace: workspaceId,
    type: "file",
  });

  if (!file) {
    throw new Error("File not found");
  }

  file.content = content;
  file.updatedBy = userId;

  await file.save();

  return file;
};

module.exports = {
  updateFileContent,
};