const axios = require("axios");

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

const LANGUAGE_CONFIG = {
  javascript: {
    language: "javascript",
    version: "18.15.0",
  },

  python: {
    language: "python",
    version: "3.10.0",
  },

  cpp: {
    language: "c++",
    version: "10.2.0",
  },
};

const executeCode = async ({
  language,
  code,
  stdin = "",
}) => {
  const config = LANGUAGE_CONFIG[language];

  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  if (!code || typeof code !== "string") {
    throw new Error("Code is required");
  }

  const response = await axios.post(
    PISTON_URL,
    {
      language: config.language,
      version: config.version,
      files: [
        {
          content: code,
        },
      ],
      stdin,
    },
    {
      timeout: 15000,
    }
  );

  const result = response.data;

  return {
    language: config.language,
    version: config.version,
    stdout: result.run?.stdout || "",
    stderr: result.run?.stderr || "",
    output: result.run?.output || "",
    exitCode: result.run?.code ?? null,
    signal: result.run?.signal || null,
  };
};

module.exports = {
  executeCode,
};