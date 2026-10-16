
const axios = require("axios");

const PISTON_URL = `${process.env.PISTON_URL}/api/v2/execute`;

const LANGUAGE_CONFIG = {
  javascript: {
    language: "javascript",
    version: "20.11.1",
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

const executeCode = async ({ language, code, stdin = "" }) => {
  const config = LANGUAGE_CONFIG[language];

  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  if (typeof code !== "string" || !code.trim()) {
    throw new Error("Code is required");
  }

  let response;

  try {
    response = await axios.post(
      PISTON_URL,
      {
        language: config.language,
        version: config.version,
        files: [{ content: code }],
        stdin,
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_memory_limit: 256000000,
        run_memory_limit: 128000000,
      },
      {
        timeout: 30000,
      }
    );
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error(
        "Code execution timed out while waiting for Piston."
      );
    }

    if (error.response) {
      console.error("Piston API error:", {
        status: error.response.status,
        data: error.response.data,
      });

      throw new Error(
        error.response.data?.message ||
          `Piston returned HTTP ${error.response.status}`
      );
    }

    throw new Error(
      `Could not connect to Piston: ${error.message}`
    );
  }

  const result = response.data;
  const compile = result.compile || null;
  const run = result.run || null;

  return {
    language: config.language,
    version: config.version,

    stdout: run?.stdout || "",
    stderr: run?.stderr || "",
    output: run?.output || "",

    exitCode: run?.code ?? null,
    signal: run?.signal || null,

    compileError: compile?.stderr || "",
    compileOutput: compile?.output || "",
    compileExitCode: compile?.code ?? null,
    compileSignal: compile?.signal || null,

    timedOut:
      run?.signal === "SIGKILL" ||
      compile?.signal === "SIGKILL",

    status: run?.code === 0 ? "success" : "completed",
  };
};

module.exports = {
  executeCode,
};
