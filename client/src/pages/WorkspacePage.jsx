import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Play,
  Save,
  Settings,
  Users,
  Terminal,
  Folder,
  FileCode2,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";

import Editor from "@monaco-editor/react";

import api from "../api/axios";

const DEFAULT_CODE = {
  javascript: `// Welcome to DevSpace

function hello() {
  console.log("Hello from DevSpace!");
}

hello();
`,

  react: `import React from "react";

function App() {
  return (
    <div>
      <h1>Hello from DevSpace!</h1>
    </div>
  );
}

export default App;
`,

  python: `# Welcome to DevSpace

def hello():
    print("Hello from DevSpace!")

hello()
`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from DevSpace!" << endl;

    return 0;
}
`,

  blank: `// Start coding in DevSpace...
`,
};

const getEditorLanguage = (workspace) => {
  const template = workspace?.template?.toLowerCase();

  if (template === "javascript") {
    return "javascript";
  }

  if (template === "react") {
    return "javascript";
  }

  if (template === "python") {
    return "python";
  }

  if (template === "cpp") {
    return "cpp";
  }

  const language = workspace?.language?.toLowerCase();

  if (language?.includes("python")) {
    return "python";
  }

  if (
    language?.includes("c++") ||
    language?.includes("cpp")
  ) {
    return "cpp";
  }

  if (language?.includes("javascript")) {
    return "javascript";
  }

  return "javascript";
};

const getDefaultFileName = (workspace) => {
  const template = workspace?.template?.toLowerCase();

  if (template === "python") {
    return "main.py";
  }

  if (template === "cpp") {
    return "main.cpp";
  }

  if (template === "react") {
    return "App.jsx";
  }

  return "main.js";
};

const getDefaultFileLanguage = (workspace) => {
  const template = workspace?.template?.toLowerCase();

  if (template === "python") {
    return "python";
  }

  if (template === "cpp") {
    return "cpp";
  }

  if (template === "react") {
    return "javascript";
  }

  if (template === "javascript") {
    return "javascript";
  }

  return "javascript";
};

const getDefaultFileContent = (workspace) => {
  const template =
    workspace?.template?.toLowerCase() || "blank";

  return (
    DEFAULT_CODE[template] ||
    DEFAULT_CODE.blank
  );
};

const WorkspacePage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);

  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeFile = useMemo(() => {
    return (
      files.find(
        (file) => file._id === activeFileId
      ) || null
    );
  }, [files, activeFileId]);

  const editorLanguage = useMemo(() => {
    if (activeFile?.language) {
      return activeFile.language;
    }

    return getEditorLanguage(workspace);
  }, [activeFile, workspace]);

  const fileName = useMemo(() => {
    if (activeFile?.name) {
      return activeFile.name;
    }

    return getDefaultFileName(workspace);
  }, [activeFile, workspace]);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        setFilesLoading(true);
        setError("");

        const workspaceResponse = await api.get(
          `/api/workspaces/${workspaceId}`
        );

        const fetchedWorkspace =
          workspaceResponse.data.workspace;

        setWorkspace(fetchedWorkspace);

        try {
          const openedResponse = await api.patch(
            `/api/workspaces/${workspaceId}/opened`
          );

          if (openedResponse.data.workspace) {
            setWorkspace(
              openedResponse.data.workspace
            );
          }
        } catch (openedError) {
          console.error(
            "Failed to mark workspace as opened:",
            openedError
          );
        }

        const filesResponse = await api.get(
          `/api/workspaces/${workspaceId}/files`
        );

        let fetchedFiles =
          filesResponse.data.files || [];

        if (fetchedFiles.length === 0) {
          const defaultFileResponse =
            await api.post(
              `/api/workspaces/${workspaceId}/files`,
              {
                name: getDefaultFileName(
                  fetchedWorkspace
                ),

                language:
                  getDefaultFileLanguage(
                    fetchedWorkspace
                  ),

                content:
                  getDefaultFileContent(
                    fetchedWorkspace
                  ),
              }
            );

          const createdFile =
            defaultFileResponse.data.file;

          fetchedFiles = [createdFile];
        }

        setFiles(fetchedFiles);

        const firstFile = fetchedFiles[0];

        setActiveFileId(firstFile._id);
        setCode(firstFile.content || "");
        setIsDirty(false);
      } catch (error) {
        console.error(
          "Failed to fetch workspace:",
          error
        );

        setError(
          error.response?.data?.message ||
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

  const handleFileSelect = (file) => {
    if (file._id === activeFileId) {
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
    setOutput("");
  };

  const handleEditorChange = (value) => {
    setCode(value ?? "");
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!activeFile || isSaving) {
      return;
    }

    try {
      setIsSaving(true);

      const response = await api.patch(
        `/api/workspaces/${workspaceId}/files/${activeFile._id}`,
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

      setCode(updatedFile.content || "");
      setIsDirty(false);
    } catch (error) {
      console.error(
        "Failed to save file:",
        error
      );

      setOutput(
        error.response?.data?.message ||
          "Failed to save file"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = () => {
    setOutput(
      "Code execution engine will be connected to DevSpace next."
    );
  };

  const handleBack = () => {
    navigate("/recent");
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-[#0d0e10] text-zinc-500">
        <div className="text-sm">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-[#0d0e10] px-6 text-center">
        <div className="mb-3 text-sm font-semibold text-zinc-300">
          Workspace unavailable
        </div>

        <p className="mb-5 max-w-md text-xs leading-5 text-zinc-600">
          {error ||
            "This workspace could not be found."}
        </p>

        <button
          type="button"
          onClick={handleBack}
          className="
            flex items-center gap-2
            rounded-lg
            border border-white/[0.08]
            bg-white/[0.03]
            px-4 py-2
            text-xs font-medium
            text-zinc-400
            transition
            hover:bg-white/[0.06]
            hover:text-zinc-200
          "
        >
          <ArrowLeft size={14} />

          Back to Recent
        </button>
      </div>
    );
  }

  return (
  
    <div
      className="
        flex
        h-[calc(100dvh-5rem)]
        min-h-0
        flex-col
        overflow-hidden
        bg-[#0d0e10]
        text-zinc-200
      "
    >
  
      <header
        className="
          flex
          h-14
          shrink-0
          items-center
          border-b border-white/[0.06]
          bg-[#101113]
          px-3
        "
      >
        {/* Back */}

        <button
          type="button"
          onClick={handleBack}
          title="Back"
          className="
            mr-3
            flex h-8 w-8
            items-center justify-center
            rounded-md
            text-zinc-600
            transition
            hover:bg-white/[0.05]
            hover:text-zinc-200
          "
        >
          <ArrowLeft size={16} />
        </button>

        {/* Workspace icon */}

        <div
          className="
            mr-2
            flex h-7 w-7
            items-center justify-center
            rounded-md
            bg-[#dc9458]/10
            text-[#dc9458]
          "
        >
          <Folder size={14} />
        </div>

        {/* Workspace info */}

        <div className="min-w-0">
          <h1 className="truncate text-xs font-semibold text-zinc-200">
            {workspace.name}
          </h1>

          <p className="text-[9px] text-zinc-600">
            {workspace.language || "JavaScript"}
          </p>
        </div>

        {/* Save state */}

        <div className="mx-auto hidden items-center gap-2 md:flex">
          <span
            className={`
              flex items-center gap-1.5
              rounded-md
              border
              px-2.5 py-1
              text-[9px]

              ${
                isDirty
                  ? "border-amber-400/10 bg-amber-400/[0.04] text-amber-400/70"
                  : "border-emerald-400/10 bg-emerald-400/[0.04] text-emerald-400/70"
              }
            `}
          >
            <span
              className={`
                h-1.5 w-1.5 rounded-full

                ${
                  isDirty
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }
              `}
            />

            {isSaving
              ? "Saving..."
              : isDirty
                ? "Unsaved"
                : "Saved"}
          </span>
        </div>

        {/* Actions */}

        <div className="ml-auto flex items-center gap-1.5">
          {/* Collaborators */}

          <button
            type="button"
            title="Collaborators"
            className="
              flex h-8 w-8
              items-center justify-center
              rounded-md
              text-zinc-600
              transition
              hover:bg-white/[0.05]
              hover:text-zinc-300
            "
          >
            <Users size={15} />
          </button>

          {/* Save */}

          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            title="Save"
            className="
              hidden h-8
              items-center
              gap-2
              rounded-md
              border border-white/[0.07]
              bg-white/[0.025]
              px-3
              text-[10px]
              font-medium
              text-zinc-500
              transition
              hover:bg-white/[0.05]
              hover:text-zinc-200
              disabled:cursor-not-allowed
              disabled:opacity-40
              sm:flex
            "
          >
            <Save size={13} />

            {isSaving ? "Saving" : "Save"}
          </button>

          {/* Run */}

          <button
            type="button"
            onClick={handleRun}
            className="
              flex h-8
              items-center
              gap-2
              rounded-md
              bg-[#dc9458]
              px-3
              text-[10px]
              font-semibold
              text-[#17110d]
              transition
              hover:bg-[#e3a06b]
              active:scale-[0.98]
            "
          >
            <Play
              size={12}
              fill="currentColor"
            />

            Run
          </button>

          {/* Settings */}

          <button
            type="button"
            title="Workspace settings"
            className="
              flex h-8 w-8
              items-center
              justify-center
              rounded-md
              text-zinc-600
              transition
              hover:bg-white/[0.05]
              hover:text-zinc-300
            "
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
      
        <aside
          className="
            hidden
            w-52
            shrink-0
            flex-col
            border-r border-white/[0.06]
            bg-[#0f1012]
            md:flex
          "
        >
          {/* Explorer header */}

          <div
            className="
              flex h-10
              shrink-0
              items-center
              justify-between
              border-b border-white/[0.05]
              px-3
            "
          >
            <span
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-zinc-600
              "
            >
              Explorer
            </span>

            <button
              type="button"
              className="
                flex h-6 w-6
                items-center
                justify-center
                rounded
                text-zinc-700
                hover:bg-white/[0.04]
                hover:text-zinc-300
              "
            >
              <MoreHorizontal size={14} />
            </button>
          </div>

          {/* Files */}

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {/* Root */}

            <div className="mb-1 flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium text-zinc-400">
              <ChevronDown size={12} />

              <Folder
                size={13}
                className="text-[#dc9458]"
              />

              <span>Workspace</span>
            </div>

            {/* Loading */}

            {filesLoading ? (
              <div className="px-7 py-3 text-[10px] text-zinc-700">
                Loading files...
              </div>
            ) : files.length === 0 ? (
              <div className="px-7 py-3 text-[10px] text-zinc-700">
                No files
              </div>
            ) : (
              files.map((file) => {
                const isActive =
                  file._id === activeFileId;

                return (
                  <button
                    key={file._id}
                    type="button"
                    onClick={() =>
                      handleFileSelect(file)
                    }
                    className={`
                      flex w-full
                      items-center
                      gap-2
                      rounded-md
                      px-7 py-2
                      text-left
                      text-[10px]
                      transition

                      ${
                        isActive
                          ? "bg-[#dc9458]/[0.08] text-zinc-200"
                          : "text-zinc-600 hover:bg-white/[0.03] hover:text-zinc-300"
                      }
                    `}
                  >
                    <FileCode2
                      size={13}
                      className={
                        isActive
                          ? "text-[#dc9458]"
                          : "text-zinc-600"
                      }
                    />

                    <span className="truncate">
                      {file.name}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Workspace info */}

          <div
            className="
              shrink-0
              border-t
              border-white/[0.05]
              p-3
            "
          >
            <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
              Visibility
            </div>

            <div className="mt-1 text-[10px] capitalize text-zinc-500">
              {workspace.visibility}
            </div>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* File tab */}

          <div
            className="
              flex
              h-10
              shrink-0
              items-center
              border-b border-white/[0.05]
              bg-[#111214]
            "
          >
            <div
              className="
                flex h-full
                items-center
                gap-2
                border-r border-white/[0.05]
                border-t-2
                border-t-[#dc9458]
                bg-[#0d0e10]
                px-4
                text-[10px]
                text-zinc-300
              "
            >
              <FileCode2
                size={13}
                className="text-[#dc9458]"
              />

              {fileName}

              {isDirty && (
                <span className="ml-1 text-[#dc9458]">
                  ●
                </span>
              )}
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0b0c0e]">
            <Editor
              height="100%"
              width="100%"
              language={editorLanguage}
              value={code}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                automaticLayout: true,

                minimap: {
                  enabled: false,
                },

                fontSize: 13,

                lineHeight: 22,

                fontFamily:
                  "'JetBrains Mono', 'Fira Code', Consolas, monospace",

                padding: {
                  top: 16,
                  bottom: 16,
                },

                scrollBeyondLastLine: false,

                smoothScrolling: true,

                cursorSmoothCaretAnimation: "on",

                renderWhitespace: "selection",

                roundedSelection: false,

                folding: true,

                wordWrap: "on",

                tabSize: 2,

                insertSpaces: true,

                suggestOnTriggerCharacters: true,

                quickSuggestions: true,

                parameterHints: {
                  enabled: true,
                },

                bracketPairColorization: {
                  enabled: true,
                },

                guides: {
                  indentation: true,
                  bracketPairs: true,
                },

                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },

                overviewRulerBorder: false,

                hideCursorInOverviewRuler: true,
              }}
            />
          </div>

          <div
            className="
              flex
              h-36
              shrink-0
              flex-col
              border-t border-white/[0.06]
              bg-[#0f1012]
            "
          >
            
            <div
              className="
                flex
                h-9
                shrink-0
                items-center
                gap-2
                border-b border-white/[0.05]
                px-3
              "
            >
              <Terminal
                size={13}
                className="text-zinc-600"
              />

              <span className="text-[10px] font-medium text-zinc-500">
                Output
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-3">
              {output ? (
                <pre className="font-mono text-[11px] leading-5 text-zinc-500">
                  {output}
                </pre>
              ) : (
                <div className="text-[10px] text-zinc-700">
                  Run your code to see the output here.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WorkspacePage;