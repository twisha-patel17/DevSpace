const { executeCode } = require("../services/execution.service");

const runCodeController = async (req, res) => {
  try {
    const { language, code, stdin = "" } = req.body;

    if (!language) {
      return res.status(400).json({
        message: "Language is required",
      });
    }

    if (typeof code !== "string" || !code.trim()) {
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

    if (error.response?.status === 400) {
      return res.status(400).json({
        message: "Invalid code execution request",
        error:
          error.response?.data?.message ||
          error.response?.data ||
          error.message,
      });
    }

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        message: "Code execution timed out",
      });
    }

    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ENOTFOUND"
    ) {
      return res.status(503).json({
        message: "Code execution service is unavailable",
      });
    }

    return res.status(500).json({
      message: "Code execution failed",
      error: error.message,
    });
  }
};

module.exports = {
  runCodeController,
};