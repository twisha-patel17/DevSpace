
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  Plus,
  X,
} from "lucide-react";

import Editor from "@monaco-editor/react";

import api from "../api/axios";
import useAuthStore from "../store/authStore";

import {
  createWorkspaceFile,
  updateWorkspaceFile,
  deleteWorkspaceFile,
  getWorkspaceFiles,
} from "../api/workspace.api";

import FileTree from "../components/workspace/FileTree";

import socket, { connectSocket } from "../socket";

const getEditorLanguage = (workspace) => {
  const language = workspace?.language?.toLowerCase();

  if (!language) return "javascript";

  if (language === "js" || language === "javascript") {
    return "javascript";
  }

  if (language === "jsx") return "javascript";
  if (language === "ts" || language === "typescript") return "typescript";
  if (language === "tsx") return "typescript";
  if (language === "py" || language === "python") return "python";
  if (language === "java") return "java";
  if (language === "cpp" || language === "c++") return "cpp";
  if (language === "c") return "c";
  if (language === "go") return "go";
  if (language === "rust") return "rust";
  if (language === "html") return "html";
  if (language === "css") return "css";
  if (language === "json") return "json";
  if (language === "markdown" || language === "md") return "markdown";

  return language;
};

const getDefaultFileName = (workspace) => {
  const language = workspace?.language?.toLowerCase();

  if (language === "python" || language === "py") return "main.py";
  if (language === "cpp" || language === "c++") return "main.cpp";
  if (language === "java") return "Main.java";
  if (language === "c") return "main.c";

  return "App.js";
};

const getLanguageFromFileName = (name) => {
  const extension = name.split(".").pop()?.toLowerCase();

  const languageMap = {
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    c: "c",
    go: "go",
    rs: "rust",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
  };

  return languageMap[extension] || "plaintext";
};

const getFilePath = (name, parentId, files) => {
  if (!parentId) return `/${name}`;

  const parent = files.find((file) => file._id === parentId);

  if (!parent) return `/${name}`;

  return `${parent.path}/${name}`;
};

const getCollaboratorInitials = (username = "") => {
  if (!username) return "?";

  const parts = username.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const WorkspacePage = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { accessToken } = useAuthStore();

  const [workspace, setWorkspace] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [showCollaborators, setShowCollaborators] = useState(false);

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

  const isRemoteUpdate = useRef(false);
  const filesRef = useRef(files);
  const activeFileIdRef = useRef(activeFileId);

  // Keep refs synchronized with the latest render.
  // eslint-disable-next-line react-hooks/refs
  filesRef.current = files;
  // eslint-disable-next-line react-hooks/refs
  activeFileIdRef.current = activeFileId;

  const [fileModal, setFileModal] = useState({
    open: false,
    mode: null,
    parent: null,
    file: null,
    value: "",
  });

  const activeFile = useMemo(
    () => files.find((file) => file._id === activeFileId) || null,
    [files, activeFileId]
  );

  const editorLanguage = useMemo(() => {
    if (activeFile?.language) return activeFile.language;
    return getEditorLanguage(workspace);
  }, [activeFile, workspace]);

  const fileName = useMemo(() => {
    if (activeFile?.name) return activeFile.name;
    return getDefaultFileName(workspace);
  }, [activeFile, workspace]);

  useEffect(() => {
    if (!workspaceId || !accessToken) return;

    let joined = false;

    const joinWorkspace = () => {
      if (joined) return;

      joined = true;
      socket.emit("workspace:join", { workspaceId });
    };

    const handleWorkspaceJoined = (data) => {
      setCollaborators(data?.users || []);

      const currentFileId = activeFileIdRef.current;

      if (currentFileId) {
        socket.emit("file:open", {
          workspaceId,
          fileId: currentFileId,
        });
      }
    };

    const handleUserJoined = (user) => {
      if (!user?.userId) return;

      setCollaborators((current) => {
        const exists = current.some(
          (item) => item.userId === user.userId
        );

        if (exists) {
          return current.map((item) =>
            item.userId === user.userId
              ? { ...item, ...user }
              : item
          );
        }

        return [...current, user];
      });
    };

    const handleUserLeft = ({ userId } = {}) => {
      if (!userId) return;

      setCollaborators((current) =>
        current.filter(
          (collaborator) => collaborator.userId !== userId
        )
      );
    };

    const handleUserFileChanged = ({
      userId,
      activeFileId: remoteFileId,
    } = {}) => {
      if (!userId) return;

      setCollaborators((current) =>
        current.map((collaborator) =>
          collaborator.userId === userId
            ? {
                ...collaborator,
                activeFileId: remoteFileId,
              }
            : collaborator
        )
      );
    };

    socket.on("connect", joinWorkspace);
    socket.on("workspace:joined", handleWorkspaceJoined);
    socket.on("workspace:user-joined", handleUserJoined);
    socket.on("workspace:user-left", handleUserLeft);
    socket.on("workspace:user-file-changed", handleUserFileChanged);

    connectSocket(accessToken);

    // If already connected, the connect event won't fire again.
    if (socket.connected) {
      joinWorkspace();
    }

    return () => {
      if (socket.connected && joined) {
        socket.emit("workspace:leave", { workspaceId });
      }

      socket.off("connect", joinWorkspace);
      socket.off("workspace:joined", handleWorkspaceJoined);
      socket.off("workspace:user-joined", handleUserJoined);
      socket.off("workspace:user-left", handleUserLeft);
      socket.off(
        "workspace:user-file-changed",
        handleUserFileChanged
      );

    };
  }, [workspaceId, accessToken]);

  useEffect(() => {
    const handleRemoteFileChange = ({ fileId, content } = {}) => {
      if (!fileId) return;

      setFiles((current) =>
        current.map((file) =>
          file._id === fileId
            ? { ...file, content }
            : file
        )
      );

      if (fileId === activeFileIdRef.current) {
        isRemoteUpdate.current = true;
        setCode(content || "");
        setIsDirty(false);
      }
    };

    const handleRemoteFileCreated = (file) => {
      if (!file?._id) return;

      setFiles((current) => {
        if (current.some((item) => item._id === file._id)) {
          return current;
        }

        return [...current, file];
      });
    };

    const handleRemoteFileUpdated = (file) => {
      if (!file?._id) return;

      const previousFile = filesRef.current.find(
        (item) => item._id === file._id
      );

      setFiles((current) =>
        current.map((item) =>
          item._id === file._id
            ? { ...item, ...file }
            : item
        )
      );

      const pathChanged =
        previousFile && previousFile.path !== file.path;

      if (file.type === "folder" || pathChanged) {
        getWorkspaceFiles(workspaceId)
          .then((updatedFiles) => {
            setFiles(updatedFiles);
          })
          .catch((err) => {
            console.error(
              "Failed to refresh workspace files:",
              err
            );
          });
      }

      if (file._id === activeFileIdRef.current) {
        setCode(file.content || "");
      }
    };

    const handleRemoteFileDeleted = ({
      fileId,
      fileIds,
    } = {}) => {
      const idsToDelete = fileIds || (fileId ? [fileId] : []);

      if (idsToDelete.length === 0) return;

      setFiles((current) =>
        current.filter(
          (file) => !idsToDelete.includes(file._id)
        )
      );

      if (idsToDelete.includes(activeFileIdRef.current)) {
        setActiveFileId(null);
        setCode("");
        setIsDirty(false);
        setOutput("");
      }
    };

    const handleFileError = ({ message } = {}) => {
      setOutput(message || "File operation failed.");
      setIsSaving(false);
    };

    socket.on("file:changed", handleRemoteFileChange);
    socket.on("workspace:file-created", handleRemoteFileCreated);
    socket.on("workspace:file-updated", handleRemoteFileUpdated);
    socket.on("workspace:file-deleted", handleRemoteFileDeleted);
    socket.on("file:error", handleFileError);

    return () => {
      socket.off("file:changed", handleRemoteFileChange);
      socket.off("workspace:file-created", handleRemoteFileCreated);
      socket.off("workspace:file-updated", handleRemoteFileUpdated);
      socket.off("workspace:file-deleted", handleRemoteFileDeleted);
      socket.off("file:error", handleFileError);
    };
  }, [workspaceId]);

  useEffect(() => {
    let cancelled = false;

    const loadWorkspace = async () => {
      if (!workspaceId) return;

      try {
        setLoading(true);
        setFilesLoading(true);
        setError("");

        const workspaceResponse = await api.get(
          `/api/workspaces/${workspaceId}`
        );

        if (cancelled) return;

        const loadedWorkspace = workspaceResponse.data.workspace;
        setWorkspace(loadedWorkspace);

        try {
          await api.patch(`/api/workspaces/${workspaceId}/opened`);
        } catch {
          // Opening the workspace should not block the editor.
        }

        let loadedFiles = await getWorkspaceFiles(workspaceId);

        if (cancelled) return;

        if (!loadedFiles || loadedFiles.length === 0) {
          const defaultName = getDefaultFileName(loadedWorkspace);

          const defaultFile = await createWorkspaceFile({
            workspaceId,
            fileData: {
              name: defaultName,
              path: `/${defaultName}`,
              type: "file",
              language: getLanguageFromFileName(defaultName),
              content: "",
              parent: null,
            },
          });

          if (cancelled) return;

          loadedFiles = [defaultFile];

          if (socket.connected) {
            socket.emit("file:created", {
              workspaceId,
              file: defaultFile,
            });
          }
        }

        setFiles(loadedFiles);

        const firstFile =
          loadedFiles.find((file) => file.type === "file") || null;

        if (firstFile) {
          setActiveFileId(firstFile._id);
          setCode(firstFile.content || "");

          if (socket.connected) {
            socket.emit("file:open", {
              workspaceId,
              fileId: firstFile._id,
            });
          }
        } else {
          setActiveFileId(null);
          setCode("");
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load workspace:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load workspace."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
          setFilesLoading(false);
        }
      }
    };

    loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const handleFileSelect = (fileId) => {
    const file = filesRef.current.find(
      (item) => item._id === fileId
    );

    if (!file || file.type === "folder") return;
    if (file._id === activeFileIdRef.current) return;

    if (isDirty) {
      const shouldSwitch = window.confirm(
        "You have unsaved changes. Switch files anyway?"
      );

      if (!shouldSwitch) return;
    }

    isRemoteUpdate.current = false;

    setActiveFileId(file._id);
    setCode(file.content || "");
    setIsDirty(false);
    setOutput("");

    if (socket.connected) {
      socket.emit("file:open", {
        workspaceId,
        fileId: file._id,
      });
    }
  };

  const openCreateFileModal = (parent = null) => {
    setFileModal({
      open: true,
      mode: "file",
      parent,
      file: null,
      value: "",
    });
  };

  const openCreateFolderModal = (parent = null) => {
    setFileModal({
      open: true,
      mode: "folder",
      parent,
      file: null,
      value: "",
    });
  };

  const openRenameModal = (file) => {
    setFileModal({
      open: true,
      mode: "rename",
      parent: null,
      file,
      value: file.name,
    });
  };

  const closeFileModal = () => {
    setFileModal({
      open: false,
      mode: null,
      parent: null,
      file: null,
      value: "",
    });
  };

  const handleCreateFile = async () => {
    const name = fileModal.value.trim();

    if (!name) return;

    try {
      const type = fileModal.mode;

      const file = await createWorkspaceFile({
        workspaceId,
        fileData: {
          name,
          path: getFilePath(name, fileModal.parent, filesRef.current),
          type,
          parent: fileModal.parent || null,
          language:
            type === "file"
              ? getLanguageFromFileName(name)
              : null,
          content: "",
        },
      });

      setFiles((current) => {
        if (current.some((item) => item._id === file._id)) {
          return current;
        }

        return [...current, file];
      });

      if (socket.connected) {
        socket.emit("file:created", {
          workspaceId,
          file,
        });
      }

      closeFileModal();

      if (type === "file") {
        setActiveFileId(file._id);
        setCode(file.content || "");
        setIsDirty(false);
        setOutput("");

        if (socket.connected) {
          socket.emit("file:open", {
            workspaceId,
            fileId: file._id,
          });
        }
      }
    } catch (err) {
      console.error("Failed to create file:", err);

      setOutput(
        err.response?.data?.message ||
          "Failed to create file."
      );
    }
  };

  const handleRename = async () => {
    const name = fileModal.value.trim();

    if (!name || !fileModal.file) return;

    try {
      const file = fileModal.file;
      const oldPath = file.path;

      const parentPath = file.parent
        ? filesRef.current.find(
            (item) => item._id === file.parent
          )?.path || ""
        : "";

      const newPath = parentPath
        ? `${parentPath}/${name}`
        : `/${name}`;

      const updatedFile = await updateWorkspaceFile({
        workspaceId,
        fileId: file._id,
        fileData: {
          name,
          path: newPath,
        },
      });

      let updatedFiles = filesRef.current.map((item) =>
        item._id === updatedFile._id
          ? { ...item, ...updatedFile }
          : item
      );

      if (file.type === "folder") {
        const oldPrefix = oldPath.endsWith("/")
          ? oldPath
          : `${oldPath}/`;

        const newPrefix = newPath.endsWith("/")
          ? newPath
          : `${newPath}/`;

        updatedFiles = updatedFiles.map((item) => {
          if (item.path.startsWith(oldPrefix)) {
            return {
              ...item,
              path:
                newPrefix +
                item.path.slice(oldPrefix.length),
            };
          }

          return item;
        });

        try {
          updatedFiles = await getWorkspaceFiles(workspaceId);
        } catch {
          // Keep the optimistic state if refreshing fails.
        }
      }

      setFiles(updatedFiles);

      if (socket.connected) {
        socket.emit("file:updated", {
          workspaceId,
          file: updatedFile,
        });
      }

      closeFileModal();
    } catch (err) {
      console.error("Failed to rename file:", err);

      setOutput(
        err.response?.data?.message ||
          "Failed to rename file."
      );
    }
  };

  const handleDelete = async (file) => {
    const message =
      file.type === "folder"
        ? `Delete folder "${file.name}" and everything inside it?`
        : `Delete "${file.name}"?`;

    if (!window.confirm(message)) return;

    try {
      const result = await deleteWorkspaceFile({
        workspaceId,
        fileId: file._id,
      });

      const deletedIds = result.deletedFileIds || [file._id];

      setFiles((current) =>
        current.filter(
          (item) => !deletedIds.includes(item._id)
        )
      );

      if (deletedIds.includes(activeFileIdRef.current)) {
        const nextFile =
          filesRef.current.find(
            (item) =>
              item.type === "file" &&
              !deletedIds.includes(item._id)
          ) || null;

        if (nextFile) {
          setActiveFileId(nextFile._id);
          setCode(nextFile.content || "");

          if (socket.connected) {
            socket.emit("file:open", {
              workspaceId,
              fileId: nextFile._id,
            });
          }
        } else {
          setActiveFileId(null);
          setCode("");
        }

        setIsDirty(false);
        setOutput("");
      }

      if (socket.connected) {
        socket.emit("file:deleted", {
          workspaceId,
          fileId: file._id,
          fileIds: deletedIds,
        });
      }
    } catch (err) {
      console.error("Failed to delete file:", err);

      setOutput(
        err.response?.data?.message ||
          "Failed to delete file."
      );
    }
  };

  /* ------------------------------------------------------------------------ */
  /* EDITOR                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleEditorChange = (value) => {
    const newContent = value ?? "";

    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      setCode(newContent);
      return;
    }

    setCode(newContent);
    setIsDirty(true);
    setOutput("");

    const currentFileId = activeFileIdRef.current;

    if (!socket.connected || !workspaceId || !currentFileId) {
      return;
    }

    socket.emit("file:change", {
      workspaceId,
      fileId: currentFileId,
      content: newContent,
    });
  };

  /* ------------------------------------------------------------------------ */
  /* SAVE                                                                      */
  /* ------------------------------------------------------------------------ */

  const handleSave = async () => {
    const currentFileId = activeFileIdRef.current;

    const currentFile = filesRef.current.find(
      (file) => file._id === currentFileId
    );

    if (!currentFile || currentFile.type !== "file") return;

    try {
      setIsSaving(true);

      const updatedFile = await updateWorkspaceFile({
        workspaceId,
        fileId: currentFileId,
        fileData: { content: code },
      });

      setFiles((current) =>
        current.map((file) =>
          file._id === updatedFile._id
            ? { ...file, ...updatedFile }
            : file
        )
      );

      setCode(updatedFile.content || "");
      setIsDirty(false);

      if (socket.connected) {
        socket.emit("file:updated", {
          workspaceId,
          file: updatedFile,
        });
      }
    } catch (err) {
      console.error("Failed to save file:", err);

      setOutput(
        err.response?.data?.message ||
          "Failed to save file."
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* RUN                                                                       */
  /* ------------------------------------------------------------------------ */

  const handleRun = async () => {
    const currentFile = filesRef.current.find(
      (file) => file._id === activeFileIdRef.current
    );

    if (!currentFile || currentFile.type !== "file") {
      setOutput("Select a file to run.");
      return;
    }

    const extension = currentFile.name
      .split(".")
      .pop()
      ?.toLowerCase();

    const executionLanguages = {
      js: "javascript",
      mjs: "javascript",
      cjs: "javascript",
      py: "python",
      cpp: "cpp",
      cc: "cpp",
      cxx: "cpp",
    };

    const executionLanguage = executionLanguages[extension];

    if (!executionLanguage) {
      setOutput(
        `Running "${currentFile.name}" is not supported yet.\n\nSupported files:\n• JavaScript (.js)\n• Python (.py)\n• C++ (.cpp)`
      );
      return;
    }

    try {
      setIsRunning(true);
      setOutput(`Running ${currentFile.name}...\n`);

      const response = await api.post("/api/execution/run", {
        language: executionLanguage,
        code,
        stdin: "",
      });

      const result = response.data.result;
      const outputParts = [];

      if (result.compileError) {
        outputParts.push(
          `COMPILE ERROR\n\n${result.compileError}`
        );
      }

      if (result.compileOutput) {
        outputParts.push(
          `COMPILE OUTPUT\n\n${result.compileOutput}`
        );
      }

      if (result.stdout) {
        outputParts.push(`OUTPUT\n\n${result.stdout}`);
      }

      if (result.stderr) {
        outputParts.push(`ERROR\n\n${result.stderr}`);
      }

      if (
        !result.stdout &&
        !result.stderr &&
        !result.compileError &&
        !result.compileOutput &&
        result.output
      ) {
        outputParts.push(result.output);
      }

      if (result.exitCode !== null && result.exitCode !== undefined) {
        outputParts.push(
          `\nProcess exited with code ${result.exitCode}`
        );
      }

      if (result.signal) {
        outputParts.push(
          `\nProcess terminated by signal: ${result.signal}`
        );
      }

      setOutput(
        outputParts.length
          ? outputParts.join("\n\n")
          : "Program finished with no output."
      );
    } catch (err) {
      console.error("Code execution failed:", err);

      setOutput(
        err.response?.data?.message ||
          "Code execution failed."
      );
    } finally {
      setIsRunning(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* KEYBOARD SHORTCUTS                                                       */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
        handleSave();
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "Enter"
      ) {
        event.preventDefault();
        handleRun();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  /* ------------------------------------------------------------------------ */
  /* LOADING / ERROR                                                          */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d0f] text-white flex items-center justify-center">
        <div className="text-sm text-zinc-400">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-[#0b0d0f] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            {error || "Workspace not found."}
          </p>

          <button
            onClick={() => navigate("/workspaces")}
            className="px-4 py-2 rounded-lg bg-[#dc9458] text-black font-medium hover:bg-[#e5a46c] transition"
          >
            Back to Workspaces
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                        */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="h-screen w-full overflow-hidden bg-[#0b0d0f] text-white flex flex-col">
      <header className="h-14 shrink-0 border-b border-white/10 bg-[#101214] flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/workspaces")}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition"
            title="Back to workspaces"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="h-5 w-px bg-white/10" />

          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">
              {workspace.name}
            </h1>

            <p className="text-[11px] text-zinc-500">
              {editorLanguage}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center mr-2">
            {isSaving ? (
              <span className="text-xs text-zinc-500">Saving...</span>
            ) : isDirty ? (
              <span className="text-xs text-amber-400">
                Unsaved changes
              </span>
            ) : (
              <span className="text-xs text-emerald-400">Saved</span>
            )}
          </div>

          {/* COLLABORATORS */}
          <div className="relative">
            <button
              onClick={() =>
                setShowCollaborators((current) => !current)
              }
              className={`h-9 px-3 rounded-lg flex items-center gap-2 border transition ${
                showCollaborators
                  ? "bg-[#dc9458]/10 border-[#dc9458]/30 text-[#dc9458]"
                  : "border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
              title="Collaborators"
            >
              <Users size={16} />
              <span className="text-xs font-medium">
                {collaborators.length}
              </span>
            </button>

            {showCollaborators && (
              <div className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#111416] shadow-2xl shadow-black/50">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[#dc9458]" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        Collaborators
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {collaborators.length === 0
                          ? "Just you"
                          : `${collaborators.length} online`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCollaborators(false)}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition"
                  >
                    <X size={15} />
                  </button>
                </div>

                {collaborators.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                      <Users size={18} className="text-zinc-500" />
                    </div>
                    <p className="text-sm text-zinc-300">
                      You’re working alone
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Invite someone to this workspace to collaborate in real time.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {collaborators.map((collaborator) => {
                      const collaboratorFile =
                        collaborator.activeFileId
                          ? files.find(
                              (file) =>
                                file._id === collaborator.activeFileId
                            )
                          : null;

                      return (
                        <div
                          key={collaborator.userId}
                          className="px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/[0.025] transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              {collaborator.avatar ? (
                                <img
                                  src={collaborator.avatar}
                                  alt={collaborator.username}
                                  className="h-9 w-9 rounded-full object-cover border border-white/10"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-[#dc9458]/15 border border-[#dc9458]/20 flex items-center justify-center text-xs font-semibold text-[#dc9458]">
                                  {getCollaboratorInitials(
                                    collaborator.username
                                  )}
                                </div>
                              )}

                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#111416]" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="text-sm text-zinc-200 truncate">
                                  {collaborator.username}
                                </p>

                                {collaborator.role && (
                                  <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-zinc-500">
                                    {collaborator.role}
                                  </span>
                                )}
                              </div>

                              <p className="mt-0.5 text-[11px] text-zinc-500 truncate">
                                {collaboratorFile
                                  ? `Editing ${collaboratorFile.name}`
                                  : "Online"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/10">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Real-time collaboration is active
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SAVE */}
          <button
            onClick={handleSave}
            disabled={
              !activeFile ||
              activeFile.type !== "file" ||
              !isDirty ||
              isSaving
            }
            className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition"
          >
            <Save size={15} />
            <span className="hidden sm:inline text-xs font-medium">
              Save
            </span>
          </button>

          {/* RUN */}
          <button
            onClick={handleRun}
            disabled={
              !activeFile ||
              activeFile.type !== "file" ||
              isRunning
            }
            className="h-9 px-3 rounded-lg bg-[#dc9458] text-black hover:bg-[#e5a46c] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition"
          >
            <Play size={15} fill="currentColor" />
            <span className="hidden sm:inline text-xs font-semibold">
              {isRunning ? "Running..." : "Run"}
            </span>
          </button>

          <button
            className="h-9 w-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition"
            title="Workspace settings"
          >
            <Settings size={17} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* FILE EXPLORER */}
        <aside className="w-64 shrink-0 border-r border-white/10 bg-[#0f1113] flex flex-col">
          <div className="h-11 px-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder size={15} className="text-[#dc9458]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Explorer
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => openCreateFileModal()}
                className="h-7 w-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition"
                title="New file"
              >
                <FileCode2 size={15} />
              </button>

              <button
                onClick={() => openCreateFolderModal()}
                className="h-7 w-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition"
                title="New folder"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2">
            {filesLoading ? (
              <div className="px-3 py-4 text-xs text-zinc-500">
                Loading files...
              </div>
            ) : (
              <FileTree
                files={files}
                activeFileId={activeFileId}
                onFileSelect={handleFileSelect}
                onCreateFile={openCreateFileModal}
                onCreateFolder={openCreateFolderModal}
                onRename={openRenameModal}
                onDelete={handleDelete}
              />
            )}
          </div>
        </aside>

        {/* EDITOR AREA */}
        <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#0b0d0f]">
          <div className="h-10 shrink-0 border-b border-white/10 bg-[#0f1113] flex items-center">
            {activeFile ? (
              <div className="h-full px-4 border-r border-white/10 flex items-center gap-2 min-w-0">
                <FileCode2 size={14} className="text-[#dc9458] shrink-0" />
                <span className="text-xs text-zinc-300 truncate">
                  {fileName}
                </span>

                {isDirty && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#dc9458] shrink-0"
                    title="Unsaved changes"
                  />
                )}
              </div>
            ) : (
              <div className="px-4 text-xs text-zinc-600">
                No file selected
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0">
            {activeFile ? (
              <Editor
                height="100%"
                language={editorLanguage}
                value={code}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  automaticLayout: true,
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineHeight: 22,
                  padding: { top: 14 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  renderWhitespace: "selection",
                  tabSize: 2,
                  wordWrap: "on",
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FileCode2
                    size={30}
                    className="mx-auto mb-3 text-zinc-700"
                  />
                  <p className="text-sm text-zinc-500">
                    Select a file to start coding
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* OUTPUT */}
          <div className="h-36 shrink-0 border-t border-white/10 bg-[#0e1012] flex flex-col">
            <div className="h-9 shrink-0 px-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-[#dc9458]" />
                <span className="text-xs font-medium text-zinc-400">
                  Output
                </span>
              </div>

              {output && (
                <button
                  onClick={() => setOutput("")}
                  className="text-[11px] text-zinc-600 hover:text-zinc-300 transition"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-auto px-4 py-3">
              {isRunning ? (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="h-2 w-2 rounded-full bg-[#dc9458] animate-pulse" />
                  Running code...
                </div>
              ) : output ? (
                <pre className="font-mono text-xs leading-5 text-zinc-300 whitespace-pre-wrap break-words">
                  {output}
                </pre>
              ) : (
                <div className="text-xs text-zinc-600">
                  Run your code to see the output here.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* FILE MODAL */}
      {fileModal.open && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#111416] shadow-2xl">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  {fileModal.mode === "rename"
                    ? "Rename"
                    : fileModal.mode === "folder"
                    ? "New Folder"
                    : "New File"}
                </h2>

                <p className="mt-1 text-[11px] text-zinc-500">
                  {fileModal.mode === "rename"
                    ? "Choose a new name."
                    : "Add an item to your workspace."}
                </p>
              </div>

              <button
                onClick={closeFileModal}
                className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5">
              <input
                autoFocus
                value={fileModal.value}
                onChange={(event) =>
                  setFileModal((current) => ({
                    ...current,
                    value: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    if (fileModal.mode === "rename") {
                      handleRename();
                    } else {
                      handleCreateFile();
                    }
                  }

                  if (event.key === "Escape") {
                    closeFileModal();
                  }
                }}
                placeholder={
                  fileModal.mode === "folder"
                    ? "components"
                    : "App.js"
                }
                className="w-full h-10 rounded-lg border border-white/10 bg-[#0b0d0f] px-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#dc9458]/50"
              />

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={closeFileModal}
                  className="h-9 px-4 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    fileModal.mode === "rename"
                      ? handleRename
                      : handleCreateFile
                  }
                  className="h-9 px-4 rounded-lg bg-[#dc9458] text-black text-xs font-semibold hover:bg-[#e5a46c] transition"
                >
                  {fileModal.mode === "rename" ? "Rename" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;