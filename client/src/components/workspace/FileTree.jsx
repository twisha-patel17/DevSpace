import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

const getChildren = (files, parentId) => {
  return files
    .filter((file) => {
      const fileParent = file.parent
        ? file.parent.toString()
        : null;

      return fileParent === parentId;
    })
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });
};

const FileTreeItem = ({
  item,
  files,
  activeFileId,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  level = 0,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const children = useMemo(
    () => getChildren(files, item._id),
    [files, item._id]
  );

  const isFolder = item.type === "folder";
  const isActive = item._id === activeFileId;

  const handleClick = () => {
    if (isFolder) {
      setExpanded((value) => !value);
      return;
    }

    onFileSelect(item._id);
  };

  const handleCreateFile = (event) => {
    event.stopPropagation();
    setShowMenu(false);
    onCreateFile(item);
    setExpanded(true);
  };

  const handleCreateFolder = (event) => {
    event.stopPropagation();
    setShowMenu(false);
    onCreateFolder(item);
    setExpanded(true);
  };

  const handleRename = (event) => {
    event.stopPropagation();
    setShowMenu(false);
    onRename(item);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    setShowMenu(false);
    onDelete(item);
  };

  return (
    <div>
      <div
        className={`group relative flex items-center rounded-md text-sm transition ${
          isActive
            ? "bg-violet-500/15 text-violet-300"
            : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
        }`}
        style={{
          paddingLeft: `${level * 14 + 6}px`,
        }}
      >
        <button
          type="button"
          onClick={handleClick}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 pr-1 text-left"
        >
          {isFolder ? (
            expanded ? (
              <ChevronDown
                size={14}
                className="shrink-0"
              />
            ) : (
              <ChevronRight
                size={14}
                className="shrink-0"
              />
            )
          ) : (
            <span className="w-[14px]" />
          )}

          {isFolder ? (
            expanded ? (
              <FolderOpen
                size={15}
                className="shrink-0 text-violet-400"
              />
            ) : (
              <Folder
                size={15}
                className="shrink-0 text-violet-400"
              />
            )
          ) : (
            <FileCode2
              size={15}
              className="shrink-0 text-zinc-500"
            />
          )}

          <span className="truncate">
            {item.name}
          </span>
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setShowMenu((value) => !value);
          }}
          className="mr-1 rounded p-1 text-zinc-600 opacity-0 transition hover:bg-zinc-700 hover:text-zinc-300 group-hover:opacity-100"
        >
          <MoreHorizontal size={15} />
        </button>

        {showMenu && (
          <div className="absolute right-1 top-8 z-50 w-40 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-xl">
            {isFolder && (
              <>
                <button
                  type="button"
                  onClick={handleCreateFile}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  <Plus size={14} />
                  New File
                </button>

                <button
                  type="button"
                  onClick={handleCreateFolder}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  <Folder size={14} />
                  New Folder
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleRename}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800"
            >
              <Pencil size={14} />
              Rename
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </div>

      {isFolder &&
        expanded &&
        children.length > 0 && (
          <div>
            {children.map((child) => (
              <FileTreeItem
                key={child._id}
                item={child}
                files={files}
                activeFileId={activeFileId}
                onFileSelect={onFileSelect}
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onRename={onRename}
                onDelete={onDelete}
                level={level + 1}
              />
            ))}
          </div>
        )}
    </div>
  );
};

const FileTree = ({
  files,
  activeFileId,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
}) => {
  const rootItems = useMemo(
    () => getChildren(files, null),
    [files]
  );

  return (
    <div className="space-y-0.5">
      {rootItems.length === 0 ? (
        <div className="px-2 py-6 text-center text-xs text-zinc-600">
          No files yet
        </div>
      ) : (
        rootItems.map((item) => (
          <FileTreeItem
            key={item._id}
            item={item}
            files={files}
            activeFileId={activeFileId}
            onFileSelect={onFileSelect}
            onCreateFile={onCreateFile}
            onCreateFolder={onCreateFolder}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
};

export default FileTree;