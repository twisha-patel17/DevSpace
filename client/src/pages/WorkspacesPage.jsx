import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Play,
  Save,
  Users,
  Terminal,
  Folder,
  FileCode2,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";

import Editor from "@monaco-editor/react";

import api from "../api/axios";
import useAuthStore from "../store/authStore";

import socket, {
  connectSocket,
  disconnectSocket,
} from "../socket";

const WorkspacePage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const accessToken = useAuthStore(
    (state) => state.accessToken
  );

  const [workspace, setWorkspace] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(true);

  const [error, setError] = useState("");

  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!accessToken || !workspaceId) {
      return;
    }

    connectSocket(accessToken);

    const handleConnect = () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      socket.emit("workspace:join", {
        workspaceId,
      });
    };

    const handleWorkspaceJoined = (data) => {
      console.log(
        "Joined workspace:",
        data.workspaceId
      );
    };

    const handleWorkspaceError = (data) => {
      console.error(
        "Workspace socket error:",
        data.message
      );
    };

    socket.on("connect", handleConnect);

    socket.on(
      "workspace:joined",
      handleWorkspaceJoined
    );

    socket.on(
      "workspace:error",
      handleWorkspaceError
    );

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.emit("workspace:leave", {
        workspaceId,
      });

      socket.off("connect", handleConnect);

      socket.off(
        "workspace:joined",
        handleWorkspaceJoined
      );

      socket.off(
        "workspace:error",
        handleWorkspaceError
      );

      disconnectSocket();
    };
  }, [accessToken, workspaceId]);


  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        setError("");

        const workspaceResponse = await api.get(
          `/workspaces/${workspaceId}`
        );

        setWorkspace(workspaceResponse.data.workspace);

        try {
          await api.patch(
            `/workspaces/${workspaceId}/opened`
          );
        } catch (openedError) {
          console.error(
            "Failed to mark workspace as opened:",
            openedError
          );
        }

        setFilesLoading(true);

        const filesResponse = await api.get(
          `/workspaces/${workspaceId}/files`
        );

        let workspaceFiles =
          filesResponse.data.files || [];

        if (workspaceFiles.length === 0) {
          try {
            const createResponse = await api.post(
              `/workspaces/${workspaceId}/files`,
              {
                name: "App.jsx",
                path: "App.jsx",
                type: "file",
                language: "javascript",
                content:
                  'export default function App() {\n  return <h1>Hello DevSpace</h1>;\n}',
              }
            );

            workspaceFiles = [
              createResponse.data.file,
            ];
          } catch (createError) {
            console.error(
              "Failed to create default file:",
              createError
            );
          }
        }

        setFiles(workspaceFiles);

        if (workspaceFiles.length > 0) {
          const firstFile = workspaceFiles.find(
            (file) => file.type === "file"
          );

          if (firstFile) {
            setActiveFileId(firstFile._id);
            setCode(firstFile.content || "");
            setIsDirty(false);
          }
        }
      } catch (err) {
        console.error(
          "Failed to load workspace:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to load workspace"
        );
      } finally {
        setLoading(false);
        setFilesLoading(false);
      }
    };

    if (workspaceId) {
      fetchWorkspace();
    }
  }, [workspaceId]);


  const activeFile = useMemo(() => {
    return (
      files.find(
        (file) => file._id === activeFileId
      ) || null
    );
  }, [files, activeFileId]);

  const editorLanguage = useMemo(() => {
    if (!activeFile) {
      return "javascript";
    }

    if (activeFile.language) {
      return activeFile.language;
    }

    const extension =
      activeFile.name
        ?.split(".")
        .pop()
        ?.toLowerCase();

    const languageMap = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      json: "json",
      html: "html",
      css: "css",
      scss: "scss",
      md: "markdown",
      py: "python",
      cpp: "cpp",
      c: "c",
      java: "java",
    };

    return (
      languageMap[extension] ||
      "plaintext"
    );
  }, [activeFile]);

  const fileName = activeFile?.name || "No file selected";

  const handleFileSelect = (file) => {
    if (file.type === "folder") {
      return;
    }

    if (isDirty) {
      const shouldSwitch = window.confirm(
        "You have unsaved changes. Switch files anyway?"
      );

      if (!shouldSwitch) {
        return;
      }
    }

    setActiveFileId(file._id);
    setCode(file.content || "");
    setIsDirty(false);
  };

  const handleEditorChange = (value) => {
    setCode(value || "");
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!activeFile) {
      return;
    }

    try {
      setIsSaving(true);

      const response = await api.patch(
        `/workspaces/${workspaceId}/files/${activeFile._id}`,
        {
          content: code,
        }
      );

      const updatedFile =
        response.data.file;

      setFiles((currentFiles) =>
        currentFiles.map((file) =>
          file._id === updatedFile._id
            ? updatedFile
            : file
        )
      );

      setIsDirty(false);

      console.log("File saved successfully");
    } catch (err) {
      console.error(
        "Failed to save file:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save file"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    if (!activeFile) {
      return;
    }

    try {
      setIsRunning(true);
      setOutput("");

      const response = await api.post(
        "/execution/run",
        {
          language: editorLanguage,
          code,
          stdin: "",
        }
      );

      setOutput(
        response.data.output ||
          response.data.stdout ||
          "Program finished successfully."
      );
    } catch (err) {
      console.error(
        "Failed to run code:",
        err
      );

      setOutput(
        err.response?.data?.message ||
          "Failed to execute code."
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      const shouldLeave = window.confirm(
        "You have unsaved changes. Leave workspace anyway?"
      );

      if (!shouldLeave) {
        return;
      }
    }

    navigate("/recent");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b] text-zinc-400">
        Loading workspace...
      </div>
    );
  }


  if (error && !workspace) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#09090b] text-zinc-400">
        <p>{error}</p>

        <button
          onClick={handleBack}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#09090b] text-zinc-200">
     
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-[#0d0d0f] px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="h-5 w-px bg-zinc-800" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-white">
                {workspace?.name}
              </h1>

              <ChevronDown
                size={14}
                className="text-zinc-500"
              />
            </div>

            <p className="text-xs text-zinc-500">
              {workspace?.language ||
                "Blank"}{" "}
              · {workspace?.visibility}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Collaborators */}
          <button
            className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
          >
            <Users size={15} />

            <span>Collaborators</span>
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={
              !activeFile ||
              !isDirty ||
              isSaving
            }
            className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={15} />

            {isSaving ? "Saving..." : "Save"}
          </button>

          {/* Run */}
          <button
            onClick={handleRun}
            disabled={
              !activeFile || isRunning
            }
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play size={15} />

            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
       
        <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-[#0d0d0f]">
          {/* Explorer Header */}
          <div className="flex h-11 items-center justify-between border-b border-zinc-800 px-4">
            <div className="flex items-center gap-2">
              <Folder
                size={15}
                className="text-zinc-500"
              />

              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Explorer
              </span>
            </div>

            <button
              className="rounded p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
              title="More"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* Files */}
          <div className="flex-1 overflow-y-auto p-2">
            {filesLoading ? (
              <div className="px-2 py-4 text-xs text-zinc-600">
                Loading files...
              </div>
            ) : files.length === 0 ? (
              <div className="px-2 py-4 text-xs text-zinc-600">
                No files
              </div>
            ) : (
              <div className="space-y-1">
                {files.map((file) => {
                  const isActive =
                    file._id === activeFileId;

                  if (file.type === "folder") {
                    return (
                      <div
                        key={file._id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-500"
                      >
                        <Folder size={14} />

                        <span>
                          {file.name}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={file._id}
                      onClick={() =>
                        handleFileSelect(file)
                      }
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${
                        isActive
                          ? "bg-violet-500/10 text-violet-300"
                          : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
                      }`}
                    >
                      <FileCode2
                        size={14}
                        className={
                          isActive
                            ? "text-violet-400"
                            : "text-zinc-500"
                        }
                      />

                      <span className="truncate">
                        {file.name}
                      </span>

                      {isActive &&
                        isDirty && (
                          <span className="ml-auto text-violet-400">
                            •
                          </span>
                        )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          {/* Editor Header */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-800 bg-[#0d0d0f] px-4">
            <div className="flex items-center gap-2">
              <FileCode2
                size={15}
                className="text-violet-400"
              />

              <span className="text-xs text-zinc-300">
                {fileName}
              </span>

              {isDirty && (
                <span className="text-xs text-zinc-600">
                  Unsaved
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <span>
                {editorLanguage}
              </span>
            </div>
          </div>

          {/* Monaco */}
          <div className="min-h-0 flex-1">
            {activeFile ? (
              <Editor
                height="100%"
                width="100%"
                language={editorLanguage}
                value={code}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: {
                    enabled: false,
                  },
                  fontSize: 14,
                  lineNumbers: "on",
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: {
                    top: 12,
                  },
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-600">
                Select a file to start coding
              </div>
            )}
          </div>

          <div className="flex h-52 shrink-0 flex-col border-t border-zinc-800 bg-[#0d0d0f]">
            <div className="flex h-10 items-center gap-2 border-b border-zinc-800 px-4">
              <Terminal
                size={15}
                className="text-zinc-500"
              />

              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Output
              </span>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {output ? (
                <pre className="whitespace-pre-wrap font-mono text-xs leading-5 text-zinc-300">
                  {output}
                </pre>
              ) : (
                <p className="font-mono text-xs text-zinc-600">
                  Run your code to see output here.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WorkspacePage;