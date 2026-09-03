const { executeCode } = require("../services/execution.service");

const runCodeController = async (req, res) => {
  try {
    const { language, code, stdin } = req.body;

    if (!language) {
      return res.status(400).json({
        message: "Language is required",
      });
    }

    if (!code) {
      return res.status(400).json({
        message: "Code is required",
      });
    }

    const result = await executeCode({
      language,
      code,
      stdin,
    });

    return res.status(200).json({
      message: "Code executed successfully",
      result,
    });
  } catch (error) {
    console.error(
      "Code execution error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Code execution failed",
      error:
        error.response?.data?.message ||
        error.message,
    });
  }
};

module.exports = {
  runCodeController,
};