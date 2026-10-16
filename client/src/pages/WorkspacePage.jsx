
/* eslint-disable react-hooks/refs */
import { useEffect, useMemo, useRef, useState } from "react";
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
  UserPlus,
  LoaderCircle,
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

  const languageMap = {
    js: "javascript",
    javascript: "javascript",
    jsx: "javascript",
    ts: "typescript",
    typescript: "typescript",
    tsx: "typescript",
    py: "python",
    python: "python",
    cpp: "cpp",
    "c++": "cpp",
    java: "java",
    c: "c",
    go: "go",
    rust: "rust",
    html: "html",
    css: "css",
    json: "json",
    markdown: "markdown",
    md: "markdown",
  };

  return languageMap[language] || language;
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

const getFilePath = (name, parentValue, files) => {
  const parentId =
    parentValue && typeof parentValue === "object"
      ? parentValue._id || parentValue.id || parentValue.fileId
      : parentValue;

  const cleanName = String(name || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");

  if (!cleanName) {
    throw new Error("Enter a valid file or folder name.");
  }

  if (!parentId) return `/${cleanName}`;

  const parent = files.find(
    (file) => String(file._id) === String(parentId)
  );

  if (!parent) {
    throw new Error(
      "The selected parent folder could not be found. Refresh the workspace and try again."
    );
  }

  if (parent.type !== "folder") {
    throw new Error("You can only create items inside a folder.");
  }

  const parentPath = String(parent.path || "").replace(/^\/+|\/+$/g, "");

  return `/${[parentPath, cleanName].filter(Boolean).join("/")}`;
};

const getCollaboratorInitials = (username = "") => {
  if (!username) return "?";

  const parts = username.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getIdString = (value) => {
  if (value == null) return "";

  if (typeof value === "object") {
    return String(value._id || value.id || value.userId || "");
  }

  return String(value);
};

const WorkspacePage = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const authState = useAuthStore();
  const { accessToken } = authState;

  const currentUser =
    authState.user ||
    authState.currentUser ||
    authState.profile;

  const currentUserId = getIdString(
    currentUser?._id ||
      currentUser?.id ||
      currentUser?.userId ||
      currentUser
  );

  const [workspace, setWorkspace] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [showCollaborators, setShowCollaborators] = useState(false);

  // Share and member management.
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSearch, setShareSearch] = useState("");
  const [shareRole, setShareRole] = useState("editor");
  const [selectedShareUser, setSelectedShareUser] = useState(null);
  const [shareResults, setShareResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [shareSuccess, setShareSuccess] = useState("");
  const [memberActionLoading, setMemberActionLoading] = useState("");

  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(true);
  const [error, setError] = useState("");

  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [stdin, setStdin] = useState("");

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const isRemoteUpdate = useRef(false);
  const filesRef = useRef(files);
  const activeFileIdRef = useRef(activeFileId);
  const codeRef = useRef(code);
  const stdinRef = useRef(stdin);
  const isDirtyRef = useRef(isDirty);

  // Keep refs synchronized with the latest React state.
  filesRef.current = files;
  activeFileIdRef.current = activeFileId;
  codeRef.current = code;
  stdinRef.current = stdin;
  isDirtyRef.current = isDirty;

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

  // Resolve the current user's workspace role.
  const ownerId = getIdString(
    workspace?.owner || workspace?.createdBy
  );

  const currentMember = (workspace?.members || []).find((member) => {
    const memberUserId = getIdString(
      member.user || member.userId || member
    );

    return memberUserId && memberUserId === currentUserId;
  });

  const currentRole = String(
    workspace?.role ||
      workspace?.memberRole ||
      currentMember?.role ||
      (ownerId && currentUserId === ownerId ? "owner" : "")
  ).toLowerCase();

  const isWorkspaceOwner =
    Boolean(currentUserId && ownerId && currentUserId === ownerId) ||
    currentRole === "owner";

  const isReadOnly = currentRole === "viewer";

  // Search for eligible users when the share modal is open.
  useEffect(() => {
    if (!showShareModal || !isWorkspaceOwner) return undefined;

    const query = shareSearch.trim();

    if (query.length < 2 || selectedShareUser) {
      setShareResults([]);
      setIsSearchingUsers(false);
      return undefined;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearchingUsers(true);
        setShareError("");

        const response = await api.get(
          `/workspaces/${workspaceId}/members/search`,
          { params: { q: query } }
        );

        if (!cancelled) {
          setShareResults(response.data?.users || []);
        }
      } catch (err) {
        if (!cancelled) {
          setShareResults([]);
          setShareError(
            err.response?.data?.message ||
              "Unable to search for users. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setIsSearchingUsers(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    showShareModal,
    isWorkspaceOwner,
    workspaceId,
    shareSearch,
    selectedShareUser,
  ]);

  const refreshWorkspaceDetails = async () => {
    const response = await api.get(`/workspaces/${workspaceId}`);

    if (response.data?.workspace) {
      setWorkspace(response.data.workspace);
    }
  };

  const openShareModal = () => {
    setShareError("");
    setShareSuccess("");
    setShareSearch("");
    setSelectedShareUser(null);
    setShareResults([]);
    setShareRole("editor");
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    if (isSharing || memberActionLoading) return;

    setShowShareModal(false);
    setShareError("");
    setShareSuccess("");
    setShareSearch("");
    setSelectedShareUser(null);
    setShareResults([]);
    setShareRole("editor");
  };

  const handleShareWorkspace = async (event) => {
    event.preventDefault();

    if (!isWorkspaceOwner) {
      setShareError("Only the workspace owner can invite collaborators.");
      return;
    }

    if (!selectedShareUser?.id) {
      setShareError("Search for and select a user first.");
      return;
    }

    if (selectedShareUser.id === currentUserId) {
      setShareError("You cannot invite yourself.");
      return;
    }

    if (!["editor", "viewer"].includes(shareRole)) {
      setShareError("Choose a valid workspace role.");
      return;
    }

    setIsSharing(true);
    setShareError("");
    setShareSuccess("");

    try {
      await api.post(`/workspaces/${workspaceId}/members`, {
        userId: selectedShareUser.id,
        role: shareRole,
      });

      const invitedUsername = selectedShareUser.username || "User";

      setShareSuccess(`${invitedUsername} was added as ${shareRole}.`);

      setSelectedShareUser(null);
      setShareSearch("");
      setShareResults([]);
      setShareRole("editor");

      try {
        await refreshWorkspaceDetails();
      } catch (refreshError) {
        console.error(
          "Member added, but workspace refresh failed:",
          refreshError
        );
      }
    } catch (err) {
      console.error("Failed to share workspace:", err);

      setShareError(
        err.response?.data?.message ||
          "Failed to add the collaborator. Please try again."
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleMemberRoleChange = async (memberUserId, role) => {
    if (!isWorkspaceOwner) return;
    if (!memberUserId || !["editor", "viewer"].includes(role)) return;

    setMemberActionLoading(memberUserId);
    setShareError("");
    setShareSuccess("");

    try {
      const response = await api.patch(
        `/workspaces/${workspaceId}/members/${memberUserId}`,
        { role }
      );

      if (response.data?.workspace) {
        setWorkspace(response.data.workspace);
      } else {
        await refreshWorkspaceDetails();
      }

      setShareSuccess(`Member role updated to ${role}.`);
    } catch (err) {
      console.error("Failed to update member role:", err);

      setShareError(
        err.response?.data?.message ||
          "Failed to update the member's role."
      );
    } finally {
      setMemberActionLoading("");
    }
  };

  const handleRemoveMember = async (memberUserId, username) => {
    if (!isWorkspaceOwner || !memberUserId) return;

    const confirmed = window.confirm(
      `Remove ${username || "this collaborator"} from this workspace?`
    );

    if (!confirmed) return;

    setMemberActionLoading(memberUserId);
    setShareError("");
    setShareSuccess("");

    try {
      await api.delete(
        `/workspaces/${workspaceId}/members/${memberUserId}`
      );

      await refreshWorkspaceDetails();

      setShareSuccess(
        `${username || "Collaborator"} was removed from the workspace.`
      );
    } catch (err) {
      console.error("Failed to remove member:", err);

      setShareError(
        err.response?.data?.message ||
          "Failed to remove the collaborator."
      );
    } finally {
      setMemberActionLoading("");
    }
  };

  // Real-time workspace collaboration.
  useEffect(() => {
    if (!workspaceId || !accessToken) return undefined;

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
            ? { ...collaborator, activeFileId: remoteFileId }
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
      socket.off("workspace:user-file-changed", handleUserFileChanged);
    };
  }, [workspaceId, accessToken]);

  // Listen for file changes made by other collaborators.
  useEffect(() => {
    if (!workspaceId) return undefined;

    let refreshInProgress = false;
    let refreshQueued = false;

    const handleRemoteFileChange = ({ fileId, content } = {}) => {
      if (!fileId) return;

      setFiles((current) =>
        current.map((file) =>
          file._id === fileId ? { ...file, content } : file
        )
      );

      if (fileId === activeFileIdRef.current) {
        isRemoteUpdate.current = true;
        codeRef.current = content || "";
        setCode(content || "");
        isDirtyRef.current = false;
        setIsDirty(false);
      }
    };

    const refreshWorkspaceFiles = async () => {
      if (refreshInProgress) {
        refreshQueued = true;
        return;
      }

      refreshInProgress = true;

      try {
        do {
          refreshQueued = false;

          const updatedFiles = await getWorkspaceFiles(workspaceId);

          if (!updatedFiles) continue;

          setFiles(updatedFiles);

          const currentActiveId = activeFileIdRef.current;

          const activeStillExists = updatedFiles.some(
            (file) =>
              file._id === currentActiveId && file.type === "file"
          );

          if (activeStillExists) continue;

          const nextFile =
            updatedFiles.find((file) => file.type === "file") || null;

          activeFileIdRef.current = nextFile?._id || null;
          codeRef.current = nextFile?.content || "";
          setActiveFileId(nextFile?._id || null);
          setCode(nextFile?.content || "");
          setIsDirty(false);
          setOutput("");

          if (nextFile && socket.connected) {
            socket.emit("file:open", {
              workspaceId,
              fileId: nextFile._id,
            });
          }
        } while (refreshQueued);
      } catch (err) {
        console.error("Failed to refresh workspace files:", err);
      } finally {
        refreshInProgress = false;
      }
    };

    const handleWorkspaceFilesChanged = (event = {}) => {
      if (String(event.workspaceId) !== String(workspaceId)) return;
      refreshWorkspaceFiles();
    };

    const handleFileError = ({ message } = {}) => {
      setOutput(message || "File operation failed.");
      setIsSaving(false);
    };

    socket.on("file:changed", handleRemoteFileChange);
    socket.on("workspace:files-changed", handleWorkspaceFilesChanged);
    socket.on("file:error", handleFileError);

    return () => {
      socket.off("file:changed", handleRemoteFileChange);
      socket.off("workspace:files-changed", handleWorkspaceFilesChanged);
      socket.off("file:error", handleFileError);
    };
  }, [workspaceId]);

  // Load workspace details and files.
  useEffect(() => {
    let cancelled = false;

    const loadWorkspace = async () => {
      if (!workspaceId) return;

      try {
        setLoading(true);
        setFilesLoading(true);
        setError("");

        const workspaceResponse = await api.get(
          `/workspaces/${workspaceId}`
        );

        if (cancelled) return;

        const loadedWorkspace = workspaceResponse.data.workspace;
        setWorkspace(loadedWorkspace);

        try {
          await api.patch(`/workspaces/${workspaceId}/opened`);
        } catch {
          // Opening the workspace should not block the editor.
        }

        let loadedFiles = await getWorkspaceFiles(workspaceId);

        if (cancelled) return;

        if (!loadedFiles || loadedFiles.length === 0) {
          const loadedOwnerId = getIdString(
            loadedWorkspace?.owner || loadedWorkspace?.createdBy
          );

          const loadedMember = (loadedWorkspace?.members || []).find(
            (member) => {
              const memberUserId = getIdString(
                member?.user || member?.userId || member
              );

              return memberUserId && memberUserId === currentUserId;
            }
          );

          const loadedRole = String(
            loadedWorkspace?.role ||
              loadedWorkspace?.memberRole ||
              loadedMember?.role ||
              (loadedOwnerId && loadedOwnerId === currentUserId
                ? "owner"
                : "")
          ).toLowerCase();

          const canCreateDefaultFile =
            loadedRole === "owner" || loadedRole === "editor";

          if (canCreateDefaultFile) {
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
          } else {
            loadedFiles = [];
          }
        }

        if (cancelled) return;

        setFiles(loadedFiles);

        const firstFile =
          loadedFiles.find((file) => file.type === "file") || null;

        activeFileIdRef.current = firstFile?._id || null;
        codeRef.current = firstFile?.content || "";
        setActiveFileId(firstFile?._id || null);
        setCode(firstFile?.content || "");

        if (firstFile && socket.connected) {
          socket.emit("file:open", {
            workspaceId,
            fileId: firstFile._id,
          });
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load workspace:", err);

        setError(
          err.response?.data?.message || "Failed to load workspace."
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
  }, [workspaceId, currentUserId]);

  const handleFileSelect = (fileId) => {
    const file = filesRef.current.find((item) => item._id === fileId);

    if (!file || file.type === "folder") return;
    if (file._id === activeFileIdRef.current) return;

    if (isDirtyRef.current) {
      const shouldSwitch = window.confirm(
        "You have unsaved changes. Switch files anyway?"
      );

      if (!shouldSwitch) return;
    }

    isRemoteUpdate.current = false;

    activeFileIdRef.current = file._id;
    codeRef.current = file.content || "";
    setActiveFileId(file._id);
    setCode(file.content || "");
    isDirtyRef.current = false;
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
    if (isReadOnly) return;

    setFileModal({
      open: true,
      mode: "file",
      parent,
      file: null,
      value: "",
    });
  };

  const openCreateFolderModal = (parent = null) => {
    if (isReadOnly) return;

    setFileModal({
      open: true,
      mode: "folder",
      parent,
      file: null,
      value: "",
    });
  };

  const openRenameModal = (file) => {
    if (isReadOnly) return;

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
    if (isReadOnly) return;

    const name = fileModal.value.trim();
    if (!name) return;

    try {
      const type = fileModal.mode;

      if (type !== "file" && type !== "folder") {
        throw new Error("Choose whether to create a file or folder.");
      }

      const parentId =
        fileModal.parent && typeof fileModal.parent === "object"
          ? fileModal.parent._id ||
            fileModal.parent.id ||
            fileModal.parent.fileId ||
            null
          : fileModal.parent || null;

      const fileData = {
        name: name.replace(/^\/+|\/+$/g, ""),
        path: getFilePath(name, parentId, filesRef.current),
        type,
        parent: parentId,
      };

      if (type === "file") {
        fileData.language = getLanguageFromFileName(name);
        fileData.content = "";
      }

      const file = await createWorkspaceFile({ workspaceId, fileData });

      setFiles((current) => {
        if (current.some((item) => item._id === file._id)) {
          return current;
        }

        return [...current, file];
      });

      closeFileModal();

      if (type === "file") {
        activeFileIdRef.current = file._id;
        codeRef.current = file.content || "";
        setActiveFileId(file._id);
        setCode(file.content || "");
        isDirtyRef.current = false;
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
          err.message ||
          "Failed to create file."
      );
    }
  };

  const handleRename = async () => {
    if (isReadOnly) return;

    const name = fileModal.value.trim();
    if (!name || !fileModal.file) return;

    try {
      const file = fileModal.file;

      const parentId =
        file.parent && typeof file.parent === "object"
          ? file.parent._id || file.parent.id || file.parent.fileId
          : file.parent;

      const parentPath = parentId
        ? filesRef.current.find(
            (item) => String(item._id) === String(parentId)
          )?.path || ""
        : "";

      const cleanParentPath = String(parentPath).replace(/^\/+|\/+$/g, "");
      const cleanName = name.replace(/^\/+|\/+$/g, "");
      const newPath = `/${[cleanParentPath, cleanName].filter(Boolean).join("/")}`;

      await updateWorkspaceFile({
        workspaceId,
        fileId: file._id,
        fileData: {
          name,
          path: newPath,
        },
      });

      const updatedFiles = await getWorkspaceFiles(workspaceId);

      setFiles(updatedFiles);
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
    if (isReadOnly) return;

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

      const deletedIds =
        result.fileIds || result.deletedFileIds || [file._id];

      setFiles((current) =>
        current.filter((item) => !deletedIds.includes(item._id))
      );

      if (deletedIds.includes(activeFileIdRef.current)) {
        const nextFile =
          filesRef.current.find(
            (item) =>
              item.type === "file" && !deletedIds.includes(item._id)
          ) || null;

        activeFileIdRef.current = nextFile?._id || null;
        codeRef.current = nextFile?.content || "";
        setActiveFileId(nextFile?._id || null);
        setCode(nextFile?.content || "");
        isDirtyRef.current = false;
        setIsDirty(false);
        setOutput("");

        if (nextFile && socket.connected) {
          socket.emit("file:open", {
            workspaceId,
            fileId: nextFile._id,
          });
        }
      }
    } catch (err) {
      console.error("Failed to delete file:", err);

      setOutput(
        err.response?.data?.message || "Failed to delete file."
      );
    }
  };

  const handleEditorChange = (value) => {
    if (isReadOnly) return;

    const newContent = value ?? "";
    codeRef.current = newContent;

    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      setCode(newContent);
      return;
    }

    setCode(newContent);
    isDirtyRef.current = true;
    setIsDirty(true);
    setOutput("");

    const currentFileId = activeFileIdRef.current;

    if (!socket.connected || !workspaceId || !currentFileId) return;

    socket.emit("file:change", {
      workspaceId,
      fileId: currentFileId,
      content: newContent,
    });
  };

  const handleSave = async () => {
    if (isReadOnly) {
      setOutput("Viewers cannot save changes.");
      return;
    }

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
        fileData: { content: codeRef.current },
      });

      setFiles((current) =>
        current.map((file) =>
          file._id === updatedFile._id
            ? { ...file, ...updatedFile }
            : file
        )
      );

      codeRef.current = updatedFile.content || "";
      setCode(updatedFile.content || "");
      isDirtyRef.current = false;
      setIsDirty(false);
    } catch (err) {
      console.error("Failed to save file:", err);

      setOutput(
        err.response?.data?.message || "Failed to save file."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Execute the active file with the latest editor code and stdin.
  const handleRun = async () => {
    if (isRunning) return;

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
        "This file type is not supported for execution yet. " +
          "Supported languages: JavaScript, Python, and C++."
      );
      return;
    }

    const codeToRun = codeRef.current;
    const inputToSend = stdinRef.current;

    if (typeof codeToRun !== "string" || !codeToRun.trim()) {
      setOutput("Your file is empty. Add some code before running it.");
      return;
    }

    try {
      setIsRunning(true);
      setOutput(`Running ${currentFile.name}...\n`);

      console.log("=== DEVSPACE EXECUTION REQUEST ===");
      console.log("File:", currentFile.name);
      console.log("Language:", executionLanguage);
      console.log("Stdin:", JSON.stringify(inputToSend));
      console.log("Code length:", codeToRun.length);
      console.log("==================================");

      const response = await api.post("/execution/run", {
        language: executionLanguage,
        code: codeToRun,
        stdin: inputToSend,
      });

      const result = response.data?.result;

      if (!result) {
        setOutput("Execution failed: the server returned no result.");
        return;
      }

      const outputParts = [];

      if (result.compileError?.trim()) {
        outputParts.push(
          `COMPILE ERROR\n\n${result.compileError.trim()}`
        );
      }

      if (result.compileOutput?.trim()) {
        outputParts.push(
          `COMPILE OUTPUT\n\n${result.compileOutput.trim()}`
        );
      }

      if (result.stdout) {
        outputParts.push(`OUTPUT\n\n${result.stdout.trimEnd()}`);
      }

      if (result.stderr) {
        outputParts.push(`ERROR\n\n${result.stderr.trimEnd()}`);
      }

      if (
        !result.stdout &&
        !result.stderr &&
        !result.compileError &&
        !result.compileOutput &&
        result.output
      ) {
        outputParts.push(result.output.trimEnd());
      }

      if (result.compileSignal) {
        outputParts.push(
          `Compilation terminated by signal: ${result.compileSignal}`
        );
      }

      if (
        result.compileExitCode !== null &&
        result.compileExitCode !== undefined &&
        result.compileExitCode !== 0
      ) {
        outputParts.push(
          `Compilation exited with code ${result.compileExitCode}`
        );
      }

      if (result.signal) {
        outputParts.push(
          `Process terminated by signal: ${result.signal}`
        );
      }

      if (result.exitCode !== null && result.exitCode !== undefined) {
        outputParts.push(`Process exited with code ${result.exitCode}`);
      }

      if (result.timedOut) {
        outputParts.push(
          "Execution was terminated by a time or resource limit."
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
          err.response?.data?.error ||
          err.message ||
          "Code execution failed."
      );
    } finally {
      setIsRunning(false);
    }
  };

  // Keyboard shortcuts.
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d0f] text-white">
        <div className="text-sm text-zinc-400">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d0f] text-white">
        <div className="text-center">
          <p className="mb-4 text-red-400">
            {error || "Workspace not found."}
          </p>

          <button
            onClick={() => navigate("/workspaces")}
            className="rounded-lg bg-[#dc9458] px-4 py-2 font-medium text-black transition hover:bg-[#e5a46c]"
          >
            Back to Workspaces
          </button>
        </div>
      </div>
    );
  }

  const workspaceMembers = (workspace.members || []).filter((member) => {
    const memberUser = member.user || member;
    const memberId = getIdString(
      memberUser?._id ||
        memberUser?.id ||
        member.userId ||
        memberUser
    );

    return memberId && memberId !== ownerId;
  });

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0b0d0f] text-white">
      {/* Workspace header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#101214] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => navigate("/workspaces")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/5 hover:text-white"
            title="Back to workspaces"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="h-5 w-px bg-white/10" />

          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">
              {workspace.name}
            </h1>
            <p className="text-[11px] text-zinc-500">
              {editorLanguage}
              {isReadOnly ? " · Read-only access" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="mr-2 hidden items-center sm:flex">
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

          {isWorkspaceOwner && (
            <button
              type="button"
              onClick={openShareModal}
              className="flex h-9 items-center gap-2 rounded-lg bg-[#dc9458] px-3 text-black transition hover:bg-[#e5a46c]"
              title="Share workspace"
            >
              <UserPlus size={15} />
              <span className="text-xs font-semibold">Share</span>
            </button>
          )}

          {/* Online collaborators */}
          <div className="relative">
            <button
              onClick={() => setShowCollaborators((current) => !current)}
              className={`flex h-9 items-center gap-2 rounded-lg border px-3 transition ${
                showCollaborators
                  ? "border-[#dc9458]/30 bg-[#dc9458]/10 text-[#dc9458]"
                  : "border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white"
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
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[#dc9458]" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        Collaborators
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {collaborators.length === 0
                          ? "No other collaborators online"
                          : `${collaborators.length} online`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCollaborators(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/5 hover:text-white"
                    aria-label="Close collaborators"
                  >
                    <X size={15} />
                  </button>
                </div>

                {collaborators.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                      <Users size={18} className="text-zinc-500" />
                    </div>
                    <p className="text-sm text-zinc-300">
                      You’re working alone
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Share this workspace to collaborate in real time.
                    </p>

                    {isWorkspaceOwner && (
                      <button
                        onClick={() => {
                          setShowCollaborators(false);
                          openShareModal();
                        }}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#dc9458] px-3 py-2 text-xs font-semibold text-black transition hover:bg-[#e5a46c]"
                      >
                        <UserPlus size={13} />
                        Share workspace
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {collaborators.map((collaborator) => {
                      const collaboratorFile = collaborator.activeFileId
                        ? files.find(
                            (file) =>
                              file._id === collaborator.activeFileId
                          )
                        : null;

                      return (
                        <div
                          key={collaborator.userId}
                          className="flex items-center gap-3 border-b border-white/5 px-4 py-3 transition last:border-b-0 hover:bg-white/[0.025]"
                        >
                          <div className="relative shrink-0">
                            {collaborator.avatar ? (
                              <img
                                src={collaborator.avatar}
                                alt={collaborator.username || "User"}
                                className="h-9 w-9 rounded-full border border-white/10 object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dc9458]/20 bg-[#dc9458]/15 text-xs font-semibold text-[#dc9458]">
                                {getCollaboratorInitials(
                                  collaborator.username
                                )}
                              </div>
                            )}
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#111416] bg-emerald-400" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate text-sm text-zinc-200">
                                {collaborator.username}
                              </p>
                              {collaborator.role && (
                                <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-zinc-500">
                                  {collaborator.role}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                              {collaboratorFile
                                ? `Editing ${collaboratorFile.name}`
                                : "Online"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="border-t border-white/10 bg-white/[0.02] px-4 py-2.5">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Real-time collaboration
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={
              isReadOnly ||
              !activeFile ||
              activeFile.type !== "file" ||
              !isDirty ||
              isSaving
            }
            className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={15} />
            <span className="hidden text-xs font-medium sm:inline">
              Save
            </span>
          </button>

          <button
            onClick={handleRun}
            disabled={!activeFile || activeFile.type !== "file" || isRunning}
            className="flex h-9 items-center gap-2 rounded-lg bg-[#dc9458] px-3 text-black transition hover:bg-[#e5a46c] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play size={15} fill="currentColor" />
            <span className="hidden text-xs font-semibold sm:inline">
              {isRunning ? "Running..." : "Run"}
            </span>
          </button>

          <button
            onClick={() =>
              navigate(`/workspaces/${workspaceId}/settings`)
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/5 hover:text-white"
            title="Workspace settings"
          >
            <Settings size={17} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* File explorer */}
        <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#0f1113]">
          <div className="flex h-11 items-center justify-between border-b border-white/10 px-3">
            <div className="flex items-center gap-2">
              <Folder size={15} className="text-[#dc9458]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Explorer
              </span>
            </div>

            {!isReadOnly && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openCreateFileModal()}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/5 hover:text-white"
                  title="New file"
                >
                  <FileCode2 size={15} />
                </button>

                <button
                  onClick={() => openCreateFolderModal()}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/5 hover:text-white"
                  title="New folder"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
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
                readOnly={isReadOnly}
              />
            )}
          </div>
        </aside>

        {/* Editor */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0b0d0f]">
          <div className="flex h-10 shrink-0 items-center border-b border-white/10 bg-[#0f1113]">
            {activeFile ? (
              <div className="flex h-full min-w-0 items-center gap-2 border-r border-white/10 px-4">
                <FileCode2
                  size={14}
                  className="shrink-0 text-[#dc9458]"
                />
                <span className="truncate text-xs text-zinc-300">
                  {fileName}
                </span>
                {isDirty && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#dc9458]"
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

          <div className="min-h-0 flex-1">
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
                  readOnly: isReadOnly,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
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

          {/* Output panel */}
          <div className="flex h-52 shrink-0 flex-col border-t border-white/10 bg-[#0e1012]">
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/10 px-3">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-[#dc9458]" />
                <span className="text-xs font-medium text-zinc-400">
                  Run &amp; Output
                </span>
                {isRunning && (
                  <span className="text-[10px] text-[#dc9458]">
                    Running...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    stdinRef.current = "";
                    setStdin("");
                  }}
                  disabled={!stdin || isRunning}
                  className="text-[11px] text-zinc-600 transition hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear input
                </button>

                <button
                  type="button"
                  onClick={() => setOutput("")}
                  disabled={!output || isRunning}
                  className="text-[11px] text-zinc-600 transition hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear output
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 gap-3 overflow-hidden p-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <label
                  htmlFor="program-stdin"
                  className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
                >
                  Input (stdin)
                </label>

                <textarea
                  id="program-stdin"
                  value={stdin}
                  onChange={(event) => {
                    const value = event.target.value;
                    stdinRef.current = value;
                    setStdin(value);
                  }}
                  placeholder={"Enter program input...\nExample: 10 20"}
                  disabled={isRunning}
                  spellCheck={false}
                  className="min-h-0 flex-1 resize-none rounded-md border border-white/10 bg-[#090b0d] p-2 font-mono text-xs leading-5 text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-[#dc9458]/50 disabled:opacity-50"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <span className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Output
                </span>

                <div className="min-h-0 flex-1 overflow-auto rounded-md border border-white/5 bg-[#090b0d] p-2">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <LoaderCircle
                        size={13}
                        className="animate-spin text-[#dc9458]"
                      />
                      Executing your code...
                    </div>
                  ) : output ? (
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-5 text-zinc-300">
                      {output}
                    </pre>
                  ) : (
                    <p className="text-xs leading-5 text-zinc-600">
                      Your program output and errors will appear here.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Share workspace modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeShareModal();
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111416] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dc9458]/10 text-[#dc9458]">
                  <UserPlus size={19} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Share workspace
                  </h2>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Find people and collaborate on code.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeShareModal}
                disabled={Boolean(isSharing || memberActionLoading)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                aria-label="Close share dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto">
              <form onSubmit={handleShareWorkspace} className="p-5">
                <label
                  htmlFor="share-search"
                  className="mb-2 block text-xs font-medium text-zinc-300"
                >
                  Search by username or email
                </label>

                <input
                  id="share-search"
                  type="text"
                  value={shareSearch}
                  onChange={(event) => {
                    setShareSearch(event.target.value);
                    setSelectedShareUser(null);
                    setShareResults([]);
                    setShareError("");
                    setShareSuccess("");
                  }}
                  placeholder="Start typing a username or email..."
                  disabled={isSharing}
                  autoFocus
                  autoComplete="off"
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#0b0d0f] px-3 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-[#dc9458]/50 disabled:opacity-50"
                />

                {!selectedShareUser && shareSearch.trim().length < 2 && (
                  <p className="mt-2 text-[10px] text-zinc-600">
                    Enter at least 2 characters to search registered users.
                  </p>
                )}

                {isSearchingUsers && (
                  <div className="flex items-center gap-2 py-4 text-xs text-zinc-500">
                    <LoaderCircle size={14} className="animate-spin" />
                    Searching users...
                  </div>
                )}

                {!isSearchingUsers &&
                  !selectedShareUser &&
                  shareSearch.trim().length >= 2 &&
                  shareResults.length === 0 &&
                  !shareError && (
                    <p className="py-4 text-xs text-zinc-500">
                      No available users found. Try another username or email.
                    </p>
                  )}

                {!selectedShareUser && shareResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-white/10">
                    {shareResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedShareUser(user);
                          setShareSearch("");
                          setShareResults([]);
                          setShareError("");
                        }}
                        className="flex w-full items-center gap-3 border-b border-white/5 px-3 py-3 text-left transition last:border-b-0 hover:bg-white/[0.04]"
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dc9458]/15 text-xs font-semibold text-[#dc9458]">
                            {getCollaboratorInitials(user.username)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-zinc-200">
                            {user.username}
                          </p>
                          <p className="mt-1 truncate text-[10px] text-zinc-500">
                            {user.email}
                          </p>
                        </div>

                        <UserPlus
                          size={15}
                          className="shrink-0 text-[#dc9458]"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {selectedShareUser && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#dc9458]/25 bg-[#dc9458]/[0.06] p-3">
                    {selectedShareUser.avatar ? (
                      <img
                        src={selectedShareUser.avatar}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dc9458]/15 text-xs font-semibold text-[#dc9458]">
                        {getCollaboratorInitials(
                          selectedShareUser.username
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white">
                        {selectedShareUser.username}
                      </p>
                      <p className="truncate text-[10px] text-zinc-500">
                        {selectedShareUser.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedShareUser(null)}
                      disabled={isSharing}
                      className="rounded-md p-1 text-zinc-500 transition hover:bg-white/5 hover:text-white"
                      aria-label="Choose a different user"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                <label
                  htmlFor="share-role"
                  className="mb-2 mt-5 block text-xs font-medium text-zinc-300"
                >
                  Access level
                </label>

                <select
                  id="share-role"
                  value={shareRole}
                  onChange={(event) => setShareRole(event.target.value)}
                  disabled={isSharing}
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#0b0d0f] px-3 text-xs text-zinc-200 outline-none focus:border-[#dc9458]/50 disabled:opacity-50"
                >
                  <option value="editor">Editor — can modify files</option>
                  <option value="viewer">Viewer — read-only access</option>
                </select>

                <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex items-start gap-2">
                    <Users
                      size={14}
                      className="mt-0.5 shrink-0 text-[#dc9458]"
                    />
                    <p className="text-[10px] leading-4 text-zinc-500">
                      {shareRole === "editor"
                        ? "Editors can modify workspace files, subject to backend permissions."
                        : "Viewers should have read-only access. The backend must reject write operations."}
                    </p>
                  </div>
                </div>

                {shareError && (
                  <div
                    role="alert"
                    className="mt-4 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2.5 text-xs text-red-400"
                  >
                    {shareError}
                  </div>
                )}

                {shareSuccess && (
                  <div
                    role="status"
                    className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5 text-xs text-emerald-400"
                  >
                    {shareSuccess}
                  </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeShareModal}
                    disabled={Boolean(isSharing || memberActionLoading)}
                    className="h-9 rounded-lg border border-white/10 px-4 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    disabled={isSharing || !selectedShareUser}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#dc9458] px-4 text-xs font-semibold text-black transition hover:bg-[#e5a46c] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSharing ? (
                      <>
                        <LoaderCircle
                          size={14}
                          className="animate-spin"
                        />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} />
                        Add collaborator
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Existing workspace members */}
              <div className="border-t border-white/10 px-5 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Workspace members
                  </p>
                  <span className="text-[10px] text-zinc-600">
                    {workspaceMembers.length + (ownerId ? 1 : 0)} members
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {workspace.owner?.avatar ? (
                      <img
                        src={workspace.owner.avatar}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dc9458]/15 text-[10px] font-semibold text-[#dc9458]">
                        {getCollaboratorInitials(
                          workspace.owner?.username ||
                            workspace.owner?.name ||
                            (ownerId === currentUserId
                              ? currentUser?.username
                              : "Owner") ||
                            "Owner"
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-zinc-200">
                        {workspace.owner?.username ||
                          workspace.owner?.name ||
                          (ownerId === currentUserId
                            ? currentUser?.username || "You"
                            : "Workspace owner")}
                      </p>
                      <p className="text-[10px] text-zinc-500">Owner</p>
                    </div>

                    <span className="rounded-md border border-[#dc9458]/20 bg-[#dc9458]/[0.06] px-2 py-1 text-[9px] text-[#dc9458]">
                      Owner
                    </span>
                  </div>

                  {workspaceMembers.map((member, index) => {
                    const memberUser = member.user || member;
                    const memberId = getIdString(
                      memberUser?._id ||
                        memberUser?.id ||
                        member.userId ||
                        memberUser
                    );

                    const username =
                      memberUser?.username ||
                      memberUser?.name ||
                      memberUser?.email ||
                      "Workspace member";

                    const actionLoading =
                      memberActionLoading === memberId;

                    return (
                      <div
                        key={memberId || index}
                        className="flex items-center gap-3"
                      >
                        {memberUser?.avatar ? (
                          <img
                            src={memberUser.avatar}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-semibold text-zinc-300">
                            {getCollaboratorInitials(username)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-zinc-200">
                            {username}
                          </p>
                          <p className="truncate text-[10px] text-zinc-500">
                            {memberUser?.email || ""}
                          </p>
                        </div>

                        <select
                          aria-label={`Role for ${username}`}
                          value={member.role || "viewer"}
                          disabled={Boolean(memberActionLoading)}
                          onChange={(event) =>
                            handleMemberRoleChange(
                              memberId,
                              event.target.value
                            )
                          }
                          className="max-w-[100px] rounded-md border border-white/10 bg-[#0b0d0f] px-2 py-1.5 text-[10px] capitalize text-zinc-300 outline-none focus:border-[#dc9458]/50 disabled:opacity-50"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>

                        <button
                          type="button"
                          title={`Remove ${username}`}
                          aria-label={`Remove ${username}`}
                          disabled={Boolean(memberActionLoading)}
                          onClick={() =>
                            handleRemoveMember(memberId, username)
                          }
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                        >
                          {actionLoading ? (
                            <LoaderCircle
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <X size={14} />
                          )}
                        </button>
                      </div>
                    );
                  })}

                  {workspaceMembers.length === 0 && (
                    <p className="py-2 text-xs text-zinc-600">
                      No collaborators have been added yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / rename file or folder modal */}
      {fileModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#111416] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
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
                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/5 hover:text-white"
                aria-label="Close file dialog"
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
                  fileModal.mode === "folder" ? "components" : "App.js"
                }
                className="h-10 w-full rounded-lg border border-white/10 bg-[#0b0d0f] px-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#dc9458]/50"
              />

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={closeFileModal}
                  className="h-9 rounded-lg border border-white/10 px-4 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    fileModal.mode === "rename"
                      ? handleRename
                      : handleCreateFile
                  }
                  className="h-9 rounded-lg bg-[#dc9458] px-4 text-xs font-semibold text-black transition hover:bg-[#e5a46c]"
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
