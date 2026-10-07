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

import socket, {
  connectSocket,
  disconnectSocket,
} from "../socket";

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
  const template =
    workspace?.template?.toLowerCase();

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

  const language =
    workspace?.language?.toLowerCase();

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
  const template =
    workspace?.template?.toLowerCase();

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
  const template =
    workspace?.template?.toLowerCase();

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
    workspace?.template?.toLowerCase() ||
    "blank";

  return (
    DEFAULT_CODE[template] ||
    DEFAULT_CODE.blank
  );
};

const getLanguageFromFileName = (fileName) => {
  const extension =
    fileName
      .split(".")
      .pop()
      ?.toLowerCase();

  switch (extension) {
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";

    case "jsx":
      return "javascript";

    case "ts":
    case "tsx":
      return "typescript";

    case "py":
      return "python";

    case "cpp":
    case "cc":
    case "cxx":
      return "cpp";

    case "c":
      return "c";

    case "java":
      return "java";

    case "json":
      return "json";

    case "html":
      return "html";

    case "css":
      return "css";

    case "md":
      return "markdown";

    case "sql":
      return "sql";

    default:
      return "plaintext";
  }
};

const WorkspacePage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const accessToken = useAuthStore(
    (state) => state.accessToken
  );

  const [workspace, setWorkspace] =
    useState(null);

  const [collaborators, setCollaborators] =
    useState([]);

  const [showCollaborators, setShowCollaborators] =
    useState(false);

  const [files, setFiles] = useState([]);

  const [activeFileId, setActiveFileId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [filesLoading, setFilesLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [code, setCode] =
    useState("");

  const [output, setOutput] =
    useState("");

  const [isDirty, setIsDirty] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isRunning, setIsRunning] =
    useState(false);

  const isRemoteUpdate =
    useRef(false);

  const activeFile = useMemo(() => {
    return (
      files.find(
        (file) =>
          file._id === activeFileId
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

  /*
   * Socket connection + workspace presence
   */
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

      socket.emit(
        "workspace:join",
        {
          workspaceId,
        }
      );
    };

    const handleWorkspaceJoined = (data) => {
      console.log(
        "Joined workspace:",
        data.workspaceId
      );

      console.log(
        "Workspace role:",
        data.role
      );

      console.log(
        "Existing collaborators:",
        data.users
      );

      setCollaborators(
        data.users || []
      );
    };

    const handleWorkspaceError = (data) => {
      console.error(
        "Workspace socket error:",
        data?.message
      );
    };

    const handleUserJoined = (data) => {
      if (!data?.userId) {
        return;
      }

      console.log(
        "User joined workspace:",
        data
      );

      setCollaborators((current) => {
        const alreadyExists =
          current.some(
            (collaborator) =>
              collaborator.userId ===
              data.userId
          );

        if (alreadyExists) {
          return current.map(
            (collaborator) =>
              collaborator.userId ===
              data.userId
                ? data
                : collaborator
          );
        }

        return [
          ...current,
          data,
        ];
      });
    };

    const handleUserLeft = (data) => {
      if (!data?.userId) {
        return;
      }

      console.log(
        "User left workspace:",
        data.userId
      );

      setCollaborators((current) =>
        current.filter(
          (collaborator) =>
            collaborator.userId !==
            data.userId
        )
      );
    };

    const handleUserFileChanged = (data) => {
      if (!data?.userId) {
        return;
      }

      console.log(
        "Collaborator changed file:",
        data
      );

      setCollaborators((current) =>
        current.map(
          (collaborator) =>
            collaborator.userId ===
            data.userId
              ? {
                  ...collaborator,
                  activeFileId:
                    data.fileId ||
                    null,
                }
              : collaborator
        )
      );
    };

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "workspace:joined",
      handleWorkspaceJoined
    );

    socket.on(
      "workspace:error",
      handleWorkspaceError
    );

    socket.on(
      "workspace:user-joined",
      handleUserJoined
    );

    socket.on(
      "workspace:user-left",
      handleUserLeft
    );

    socket.on(
      "workspace:user-file-changed",
      handleUserFileChanged
    );

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.emit(
        "workspace:leave",
        {
          workspaceId,
        }
      );

      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "workspace:joined",
        handleWorkspaceJoined
      );

      socket.off(
        "workspace:error",
        handleWorkspaceError
      );

      socket.off(
        "workspace:user-joined",
        handleUserJoined
      );

      socket.off(
        "workspace:user-left",
        handleUserLeft
      );

      socket.off(
        "workspace:user-file-changed",
        handleUserFileChanged
      );

      disconnectSocket();

      setCollaborators([]);
    };
  }, [accessToken, workspaceId]);

  /*
   * Receive remote file changes
   */
  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    const handleFileChanged = (data) => {
      const {
        fileId,
        content,
        userId,
      } = data;

      if (!fileId) {
        return;
      }

      console.log(
        "Received file change:",
        fileId,
        "from user:",
        userId
      );

      setFiles((currentFiles) =>
        currentFiles.map((file) =>
          file._id === fileId
            ? {
                ...file,
                content,
              }
            : file
        )
      );

      if (fileId === activeFileId) {
        isRemoteUpdate.current = true;

        setCode(content);
        setIsDirty(false);
      }
    };

    const handleFileCreated = (data) => {
      if (
        !data?.file ||
        data.workspaceId?.toString() !==
          workspaceId.toString()
      ) {
        return;
      }

      console.log(
        "Remote file created:",
        data.file
      );

      setFiles((currentFiles) => {
        const exists =
          currentFiles.some(
            (file) =>
              file._id ===
              data.file._id
          );

        if (exists) {
          return currentFiles;
        }

        return [
          ...currentFiles,
          data.file,
        ];
      });
    };

    const handleFileUpdated = async (
      data
    ) => {
      if (
        !data?.file ||
        data.workspaceId?.toString() !==
          workspaceId.toString()
      ) {
        return;
      }

      console.log(
        "Remote file updated:",
        data.file
      );

      /*
       * Folder rename changes the paths of
       * all children in the database.
       *
       * The socket event contains only the
       * renamed folder, so refresh the full
       * tree to keep every child path correct.
       */
      if (
        data.file.type ===
        "folder"
      ) {
        try {
          const latestFiles =
            await getWorkspaceFiles(
              workspaceId
            );

          setFiles(latestFiles);

          if (
            activeFileId ===
            data.file._id
          ) {
            const latestFolder =
              latestFiles.find(
                (file) =>
                  file._id ===
                  data.file._id
              );

            if (!latestFolder) {
              setActiveFileId(null);
              setCode("");
              setIsDirty(false);
            }
          }
        } catch (error) {
          console.error(
            "Failed to refresh files after folder update:",
            error
          );
        }

        return;
      }

      setFiles((currentFiles) =>
        currentFiles.map((file) =>
          file._id ===
          data.file._id
            ? data.file
            : file
        )
      );

      if (
        activeFileId ===
        data.file._id &&
        typeof data.file.content ===
          "string"
      ) {
        isRemoteUpdate.current =
          true;

        setCode(
          data.file.content
        );

        setIsDirty(false);
      }
    };

    const handleFileDeleted = (
      data
    ) => {
      if (
        !data?.fileId ||
        data.workspaceId?.toString() !==
          workspaceId.toString()
      ) {
        return;
      }

      console.log(
        "Remote file deleted:",
        data.fileId
      );

      setFiles((currentFiles) => {
        const deletedFile =
          currentFiles.find(
            (file) =>
              file._id ===
              data.fileId
          );

        if (!deletedFile) {
          return currentFiles;
        }

        const deletedPath =
          deletedFile.path;

        return currentFiles.filter(
          (file) => {
            if (
              file._id ===
              data.fileId
            ) {
              return false;
            }

            if (
              deletedFile.type ===
              "folder"
            ) {
              return !file.path.startsWith(
                `${deletedPath}/`
              );
            }

            return true;
          }
        );
      });

      if (
        activeFileId ===
        data.fileId
      ) {
        setFiles((currentFiles) => {
          const nextFile =
            currentFiles.find(
              (file) =>
                file.type === "file" &&
                file._id !==
                  data.fileId
            );

          setActiveFileId(
            nextFile?._id ||
              null
          );

          setCode(
            nextFile?.content ||
              ""
          );

          setIsDirty(false);
          setOutput("");

          return currentFiles;
        });
      }
    };

    const handleFileError = (
      data
    ) => {
      console.error(
        "File socket error:",
        data?.message
      );

      setIsSaving(false);

      setOutput(
        data?.message ||
          "File operation failed."
      );
    };

    socket.on(
      "file:changed",
      handleFileChanged
    );

    socket.on(
      "workspace:file-created",
      handleFileCreated
    );

    socket.on(
      "workspace:file-updated",
      handleFileUpdated
    );

    socket.on(
      "workspace:file-deleted",
      handleFileDeleted
    );

    socket.on(
      "file:error",
      handleFileError
    );

    return () => {
      socket.off(
        "file:changed",
        handleFileChanged
      );

      socket.off(
        "workspace:file-created",
        handleFileCreated
      );

      socket.off(
        "workspace:file-updated",
        handleFileUpdated
      );

      socket.off(
        "workspace:file-deleted",
        handleFileDeleted
      );

      socket.off(
        "file:error",
        handleFileError
      );
    };
  }, [
    workspaceId,
    activeFileId,
  ]);

  /*
   * Fetch workspace + files
   */
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        setFilesLoading(true);
        setError("");

        const workspaceResponse =
          await api.get(
            `/api/workspaces/${workspaceId}`
          );

        const fetchedWorkspace =
          workspaceResponse.data.workspace;

        setWorkspace(
          fetchedWorkspace
        );

        try {
          const openedResponse =
            await api.patch(
              `/api/workspaces/${workspaceId}/opened`
            );

          if (
            openedResponse.data
              .workspace
          ) {
            setWorkspace(
              openedResponse.data
                .workspace
            );
          }
        } catch (
          openedError
        ) {
          console.error(
            "Failed to mark workspace as opened:",
            openedError
          );
        }

        let fetchedFiles =
          await getWorkspaceFiles(
            workspaceId
          );

        if (
          fetchedFiles.length === 0
        ) {
          try {
            const defaultFileResponse =
              await api.post(
                `/api/workspaces/${workspaceId}/files`,
                {
                  name:
                    getDefaultFileName(
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

                  type: "file",

                  parent: null,
                }
              );

            const createdFile =
              defaultFileResponse
                .data.file;

            fetchedFiles = [
              createdFile,
            ];

            /*
             * Notify collaborators if
             * the default file was created.
             */
            if (socket.connected) {
              socket.emit(
                "file:created",
                {
                  workspaceId,
                  fileId:
                    createdFile._id,
                }
              );
            }
          } catch (
            createError
          ) {
            /*
             * Another collaborator may have
             * created the default file at the
             * same time.
             *
             * Refresh once before failing.
             */
            console.error(
              "Default file creation failed:",
              createError
            );

            fetchedFiles =
              await getWorkspaceFiles(
                workspaceId
              );
          }
        }

        setFiles(
          fetchedFiles
        );

        const firstFile =
          fetchedFiles.find(
            (file) =>
              file.type === "file"
          );

        if (firstFile) {
          setActiveFileId(
            firstFile._id
          );

          setCode(
            firstFile.content || ""
          );

          if (socket.connected) {
            socket.emit(
              "file:open",
              {
                workspaceId,
                fileId:
                  firstFile._id,
              }
            );
          }
        }

        setIsDirty(false);
      } catch (error) {
        console.error(
          "Failed to fetch workspace:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
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

  /*
   * File selection
   */
  const handleFileSelect = (
    file
  ) => {
    if (
      !file ||
      file.type === "folder"
    ) {
      return;
    }

    if (
      file._id === activeFileId
    ) {
      return;
    }

    if (isDirty) {
      const shouldSwitch =
        window.confirm(
          "You have unsaved changes. Switch files anyway?"
        );

      if (!shouldSwitch) {
        return;
      }
    }

    isRemoteUpdate.current =
      false;

    setActiveFileId(
      file._id
    );

    setCode(
      file.content || ""
    );

    setIsDirty(false);
    setOutput("");

    if (socket.connected) {
      socket.emit(
        "file:open",
        {
          workspaceId,
          fileId: file._id,
        }
      );
    }
  };

  /*
   * Build file path
   */
  const getFilePath = (
    name,
    parentId
  ) => {
    if (!parentId) {
      return name;
    }

    const parent =
      files.find(
        (file) =>
          file._id ===
          parentId
      );

    if (!parent) {
      return name;
    }

    return `${parent.path}/${name}`;
  };

  /*
   * Create file
   */
  const handleCreateFile = async (
    parent = null
  ) => {
    const name =
      window.prompt(
        "File name"
      );

    if (
      !name ||
      !name.trim()
    ) {
      return;
    }

    const trimmedName =
      name.trim();

    try {
      const newFile =
        await createWorkspaceFile({
          workspaceId,

          fileData: {
            name: trimmedName,

            path: getFilePath(
              trimmedName,
              parent?._id ||
                null
            ),

            type: "file",

            language:
              getLanguageFromFileName(
                trimmedName
              ),

            content: "",

            parent:
              parent?._id ||
              null,
          },
        });

      setFiles((current) => {
        const exists =
          current.some(
            (file) =>
              file._id ===
              newFile._id
          );

        if (exists) {
          return current;
        }

        return [
          ...current,
          newFile,
        ];
      });

      setActiveFileId(
        newFile._id
      );

      setCode(
        newFile.content || ""
      );

      setOutput("");
      setIsDirty(false);

      if (socket.connected) {
        socket.emit(
          "file:created",
          {
            workspaceId,
            fileId:
              newFile._id,
          }
        );

        socket.emit(
          "file:open",
          {
            workspaceId,
            fileId:
              newFile._id,
          }
        );
      }
    } catch (error) {
      console.error(
        "Failed to create file:",
        error
      );

      window.alert(
        error.response?.data
          ?.message ||
          "Failed to create file"
      );
    }
  };

  /*
   * Create folder
   */
  const handleCreateFolder =
    async (
      parent = null
    ) => {
      const name =
        window.prompt(
          "Folder name"
        );

      if (
        !name ||
        !name.trim()
      ) {
        return;
      }

      const trimmedName =
        name.trim();

      try {
        const newFolder =
          await createWorkspaceFile({
            workspaceId,

            fileData: {
              name: trimmedName,

              path: getFilePath(
                trimmedName,
                parent?._id ||
                  null
              ),

              type: "folder",

              language: null,

              content: "",

              parent:
                parent?._id ||
                null,
            },
          });

        setFiles((current) => {
          const exists =
            current.some(
              (file) =>
                file._id ===
                newFolder._id
            );

          if (exists) {
            return current;
          }

          return [
            ...current,
            newFolder,
          ];
        });

        if (socket.connected) {
          socket.emit(
            "file:created",
            {
              workspaceId,
              fileId:
                newFolder._id,
            }
          );
        }
      } catch (error) {
        console.error(
          "Failed to create folder:",
          error
        );

        window.alert(
          error.response?.data
            ?.message ||
            "Failed to create folder"
        );
      }
    };

  /*
   * Rename file / folder
   */
  const handleRename = async (
    file
  ) => {
    const name =
      window.prompt(
        "New name",
        file.name
      );

    if (
      !name ||
      !name.trim()
    ) {
      return;
    }

    const trimmedName =
      name.trim();

    if (
      trimmedName ===
      file.name
    ) {
      return;
    }

    try {
      const updatedFile =
        await updateWorkspaceFile({
          workspaceId,
          fileId: file._id,

          fileData: {
            name: trimmedName,
          },
        });

      setFiles((current) =>
        current.map((item) => {
          if (
            item._id ===
            updatedFile._id
          ) {
            return updatedFile;
          }

          if (
            file.type === "folder" &&
            item.path.startsWith(
              `${file.path}/`
            )
          ) {
            return {
              ...item,

              path:
                updatedFile.path +
                item.path.substring(
                  file.path.length
                ),
            };
          }

          return item;
        })
      );

      if (socket.connected) {
        socket.emit(
          "file:updated",
          {
            workspaceId,
            fileId:
              file._id,
          }
        );
      }
    } catch (error) {
      console.error(
        "Failed to rename:",
        error
      );

      window.alert(
        error.response?.data
          ?.message ||
          "Failed to rename"
      );
    }
  };

  /*
   * Delete file / folder
   */
  const handleDelete = async (
    file
  ) => {
    const message =
      file.type === "folder"
        ? `Delete folder "${file.name}" and everything inside it?`
        : `Delete "${file.name}"?`;

    const confirmed =
      window.confirm(message);

    if (!confirmed) {
      return;
    }

    try {
      await deleteWorkspaceFile({
        workspaceId,
        fileId: file._id,
      });

      const deletedPath =
        file.path;

      const activeFileWasDeleted =
        activeFileId ===
          file._id ||
        (
          file.type ===
            "folder" &&
          activeFileId &&
          files
            .find(
              (item) =>
                item._id ===
                activeFileId
            )
            ?.path.startsWith(
              `${deletedPath}/`
            )
        );

      const remainingFiles =
        files.filter(
          (item) => {
            if (
              item._id ===
              file._id
            ) {
              return false;
            }

            if (
              file.type ===
              "folder"
            ) {
              return !item.path.startsWith(
                `${deletedPath}/`
              );
            }

            return true;
          }
        );

      setFiles(
        remainingFiles
      );

      if (activeFileWasDeleted) {
        const nextFile =
          remainingFiles.find(
            (item) =>
              item.type ===
              "file"
          );

        setActiveFileId(
          nextFile?._id ||
            null
        );

        setCode(
          nextFile?.content ||
            ""
        );

        setIsDirty(false);
        setOutput("");

        if (
          nextFile &&
          socket.connected
        ) {
          socket.emit(
            "file:open",
            {
              workspaceId,
              fileId:
                nextFile._id,
            }
          );
        }
      }

      if (socket.connected) {
        socket.emit(
          "file:deleted",
          {
            workspaceId,
            fileId:
              file._id,
          }
        );
      }
    } catch (error) {
      console.error(
        "Failed to delete:",
        error
      );

      window.alert(
        error.response?.data
          ?.message ||
          "Failed to delete"
      );
    }
  };

  /*
   * Editor changes
   */
  const handleEditorChange = (
    value
  ) => {
    const newContent =
      value ?? "";

    if (
      isRemoteUpdate.current
    ) {
      isRemoteUpdate.current =
        false;

      setCode(newContent);

      return;
    }

    setCode(newContent);
    setIsDirty(true);
    setOutput("");

    if (
      !socket.connected ||
      !workspaceId ||
      !activeFileId
    ) {
      return;
    }

    socket.emit(
      "file:change",
      {
        workspaceId,
        fileId:
          activeFileId,
        content:
          newContent,
      }
    );
  };

  /*
   * Manual save
   *
   * The current backend does not expose
   * a file:save Socket.IO event.
   *
   * Therefore manual Save uses the existing
   * REST file update endpoint.
   */
  const handleSave = async () => {
    if (
      !activeFile ||
      isSaving
    ) {
      return;
    }

    try {
      setIsSaving(true);
      setOutput("");

      const updatedFile =
        await updateWorkspaceFile({
          workspaceId,
          fileId:
            activeFile._id,

          fileData: {
            content: code,
          },
        });

      setFiles((currentFiles) =>
        currentFiles.map(
          (file) =>
            file._id ===
            updatedFile._id
              ? updatedFile
              : file
        )
      );

      setCode(
        updatedFile.content ||
          ""
      );

      setIsDirty(false);

      /*
       * REST save is not automatically
       * broadcast to collaborators by
       * the current backend controller.
       *
       * Broadcast the update through the
       * existing socket event.
       */
      if (socket.connected) {
        socket.emit(
          "file:updated",
          {
            workspaceId,
            fileId:
              updatedFile._id,
          }
        );
      }
    } catch (error) {
      console.error(
        "Failed to save file:",
        error
      );

      setOutput(
        error.response?.data
          ?.message ||
          "Failed to save file."
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * Run code
   */
  const handleRun = async () => {
    if (
      !activeFile ||
      isRunning
    ) {
      return;
    }

    try {
      setIsRunning(true);

      setOutput(
        "Running code...\n"
      );

      const response =
        await api.post(
          "/api/execution/run",
          {
            language:
              editorLanguage,

            code,

            stdin: "",
          }
        );

      const result =
        response.data.result;

      let executionOutput =
        "";

      if (result?.stdout) {
        executionOutput +=
          result.stdout;
      }

      if (result?.stderr) {
        if (executionOutput) {
          executionOutput +=
            "\n";
        }

        executionOutput +=
          result.stderr;
      }

      if (!executionOutput) {
        executionOutput =
          result?.output ||
          "Program finished with no output.";
      }

      if (
        result?.exitCode !==
          null &&
        result?.exitCode !==
          undefined &&
        result.exitCode !== 0
      ) {
        executionOutput +=
          `\n\nProcess exited with code: ${result.exitCode}`;
      }

      setOutput(
        executionOutput
      );
    } catch (error) {
      console.error(
        "Code execution failed:",
        error
      );

      const serverMessage =
        error.response?.data
          ?.error ||
        error.response?.data
          ?.message;

      setOutput(
        serverMessage ||
          "Code execution failed. Please try again."
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleBack = () => {
    navigate("/recent");
  };

  /*
   * Loading state
   */
  if (loading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-[#0d0e10] text-zinc-500">
        <div className="text-sm">
          Loading workspace...
        </div>
      </div>
    );
  }

  /*
   * Error state
   */
  if (
    error ||
    !workspace
  ) {
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
        relative
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
            {workspace.language ||
              "JavaScript"}
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
                isSaving
                  ? "border-blue-400/10 bg-blue-400/[0.04] text-blue-400/70"
                  : isDirty
                    ? "border-amber-400/10 bg-amber-400/[0.04] text-amber-400/70"
                    : "border-emerald-400/10 bg-emerald-400/[0.04] text-emerald-400/70"
              }
            `}
          >
            <span
              className={`
                h-1.5 w-1.5 rounded-full

                ${
                  isSaving
                    ? "bg-blue-400"
                    : isDirty
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
            onClick={() =>
              setShowCollaborators(
                (current) =>
                  !current
              )
            }
            className={`
              relative
              flex h-8 w-8
              items-center
              justify-center
              rounded-md
              transition

              ${
                showCollaborators
                  ? "bg-white/[0.06] text-zinc-200"
                  : "text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-300"
              }
            `}
          >
            <Users size={15} />

            {collaborators.length >
              0 && (
              <span
                className="
                  absolute
                  -right-0.5
                  -top-0.5
                  flex
                  h-3.5
                  min-w-3.5
                  items-center
                  justify-center
                  rounded-full
                  bg-[#dc9458]
                  px-1
                  text-[8px]
                  font-semibold
                  text-[#17110d]
                "
              >
                {collaborators.length}
              </span>
            )}
          </button>

          {/* Save */}

          <button
            type="button"
            onClick={handleSave}
            disabled={
              !isDirty ||
              isSaving
            }
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

            {isSaving
              ? "Saving"
              : "Save"}
          </button>

          {/* Run */}

          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
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
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <Play
              size={12}
              fill="currentColor"
            />

            {isRunning
              ? "Running..."
              : "Run"}
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

      {/* Collaborators panel */}

      {showCollaborators && (
        <div
          className="
            absolute
            right-3
            top-[4.5rem]
            z-50
            w-64
            overflow-hidden
            rounded-lg
            border border-white/[0.08]
            bg-[#111214]
            shadow-2xl
            shadow-black/40
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              border-b border-white/[0.06]
              px-4
              py-3
            "
          >
            <div>
              <div className="text-xs font-semibold text-zinc-200">
                Collaborators
              </div>

              <div className="mt-0.5 text-[9px] text-zinc-600">
                {collaborators.length}{" "}
                {collaborators.length ===
                1
                  ? "person"
                  : "people"}{" "}
                online
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowCollaborators(
                  false
                )
              }
              className="
                flex h-6 w-6
                items-center
                justify-center
                rounded
                text-zinc-600
                hover:bg-white/[0.05]
                hover:text-zinc-300
              "
            >
              ×
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {collaborators.length ===
            0 ? (
              <div
                className="
                  px-3
                  py-6
                  text-center
                  text-[10px]
                  text-zinc-700
                "
              >
                No other collaborators
                online.
              </div>
            ) : (
              collaborators.map(
                (collaborator) => (
                  <div
                    key={
                      collaborator.userId
                    }
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-md
                      px-3
                      py-2.5
                      transition
                      hover:bg-white/[0.03]
                    "
                  >
                    <div
                      className="
                        relative
                        flex h-8 w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-[#dc9458]/10
                        text-[10px]
                        font-semibold
                        text-[#dc9458]
                      "
                    >
                      {(
                        collaborator.username ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase()}

                      <span
                        className="
                          absolute
                          bottom-0
                          right-0
                          h-2
                          w-2
                          rounded-full
                          border-2
                          border-[#111214]
                          bg-emerald-400
                        "
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[10px] font-medium text-zinc-300">
                        {collaborator.username ||
                          `User ${String(
                            collaborator.userId
                          ).slice(-5)}`}
                      </div>

                      <div className="mt-0.5 text-[9px] text-zinc-700">
                        {collaborator.activeFileId
                          ? "Editing a file"
                          : collaborator.role ||
                            "Collaborator"}
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      )}

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

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  handleCreateFile()
                }
                title="New File"
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
                <Plus size={14} />
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCreateFolder()
                }
                title="New Folder"
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
                <Folder size={14} />
              </button>
            </div>
          </div>

          {/* File tree */}

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {filesLoading ? (
              <div className="px-2 py-3 text-[10px] text-zinc-700">
                Loading files...
              </div>
            ) : (
              <>
                <div className="mb-1 flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium text-zinc-400">
                  <Folder
                    size={13}
                    className="text-[#dc9458]"
                  />

                  <span>
                    Workspace
                  </span>
                </div>

                <FileTree
                  files={files}
                  activeFileId={
                    activeFileId
                  }
                  onFileSelect={
                    handleFileSelect
                  }
                  onCreateFile={
                    handleCreateFile
                  }
                  onCreateFolder={
                    handleCreateFolder
                  }
                  onRename={
                    handleRename
                  }
                  onDelete={
                    handleDelete
                  }
                />
              </>
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
            {activeFile && (
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
            )}
          </div>

          {/* Editor */}

          <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0b0c0e]">
            {activeFile ? (
              <Editor
                height="100%"
                width="100%"
                language={
                  editorLanguage
                }
                value={code}
                onChange={
                  handleEditorChange
                }
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

                  scrollBeyondLastLine:
                    false,

                  smoothScrolling: true,

                  cursorSmoothCaretAnimation:
                    "on",

                  renderWhitespace:
                    "selection",

                  roundedSelection:
                    false,

                  folding: true,

                  wordWrap: "on",

                  tabSize: 2,

                  insertSpaces: true,

                  suggestOnTriggerCharacters:
                    true,

                  quickSuggestions:
                    true,

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

                  overviewRulerBorder:
                    false,

                  hideCursorInOverviewRuler:
                    true,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-700">
                Select a file to start coding.
              </div>
            )}
          </div>

          {/* Output */}

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
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-5 text-zinc-500">
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