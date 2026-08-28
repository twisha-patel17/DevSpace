import { useState } from "react";
import {
  X,
  Lock,
  Globe,
  Square,
  FileCode2,
  Atom,
  Terminal,
} from "lucide-react";

const templates = [
  {
    id: "blank",
    name: "Blank",
    shortName: "Blank",
    language: "Blank",
    languageName: "Blank",
    languageColor: "bg-[#252629] text-zinc-300",
    icon: Square,
  },
  {
    id: "javascript",
    name: "JavaScript",
    shortName: "JS",
    language: "JS",
    languageName: "JavaScript",
    languageColor: "bg-[#302f1c] text-[#e5c82d]",
    icon: FileCode2,
  },
  {
    id: "react",
    name: "React",
    shortName: "React",
    language: "React",
    languageName: "React",
    languageColor: "bg-[#1c2638] text-[#72a4e2]",
    icon: Atom,
  },
  {
    id: "python",
    name: "Python",
    shortName: "PY",
    language: "PY",
    languageName: "Python",
    languageColor: "bg-[#1c3029] text-[#65bc8d]",
    icon: Terminal,
  },
  {
    id: "cpp",
    name: "C++",
    shortName: "C++",
    language: "C++",
    languageName: "C++",
    languageColor: "bg-[#25203a] text-[#a67adb]",
    icon: Terminal,
  },
];

const CreateWorkspaceModal = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [workspaceName, setWorkspaceName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState("blank");
  const [visibility, setVisibility] = useState("private");

  if (!isOpen) return null;

  const resetForm = () => {
    setWorkspaceName("");
    setDescription("");
    setTemplate("blank");
    setVisibility("private");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const name = workspaceName.trim();

    if (!name) return;

    const selectedTemplate = templates.find(
      (item) => item.id === template
    );

    const workspaceData = {
      title: name,
      description:
        description.trim() || "No description",
      template,
      visibility,

      language:
        selectedTemplate?.language || "Blank",

      languageName:
        selectedTemplate?.languageName || "Blank",

      languageColor:
        selectedTemplate?.languageColor ||
        "bg-[#252629] text-zinc-300",
    };

    onCreate(workspaceData);

    resetForm();
  };

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/70
        px-3 py-4
        backdrop-blur-sm
        sm:px-4
      "
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="
          flex w-full max-w-[480px]
          max-h-[calc(100vh-32px)]
          flex-col
          overflow-hidden
          rounded-2xl
          border border-white/[0.08]
          bg-[#17181b]
          shadow-2xl shadow-black/50
        "
        onMouseDown={(e) => e.stopPropagation()}
      >

        {/* ================= HEADER ================= */}

        <div
          className="
            flex shrink-0
            items-start justify-between
            border-b border-white/[0.06]
            px-4 py-4
            sm:px-5
          "
        >
          <div className="min-w-0 pr-4">
            <h2
              className="
                text-[15px]
                font-semibold
                text-zinc-100
              "
            >
              Create a new workspace
            </h2>

            <p
              className="
                mt-1
                text-[10px]
                leading-4
                text-zinc-600
              "
            >
              Start a new collaborative coding environment
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="
              flex h-8 w-8 shrink-0
              items-center justify-center
              rounded-lg
              text-zinc-500
              transition-colors
              hover:bg-white/[0.06]
              hover:text-zinc-200
            "
          >
            <X size={17} />
          </button>
        </div>

        {/* ================= FORM ================= */}

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div
            className="
              flex-1
              overflow-y-auto
              px-4 py-5
              sm:px-5
            "
          >
            <div className="space-y-5">

              {/* Workspace Name */}

              <div>
                <label
                  htmlFor="workspace-name"
                  className="
                    mb-2 block
                    text-[11px]
                    font-medium
                    text-zinc-400
                  "
                >
                  Workspace name
                </label>

                <input
                  id="workspace-name"
                  type="text"
                  value={workspaceName}
                  onChange={(e) =>
                    setWorkspaceName(e.target.value)
                  }
                  placeholder="e.g. Portfolio, Hackathon Sprint"
                  autoFocus
                  maxLength={60}
                  className="
                    h-10 w-full
                    rounded-lg
                    border border-white/[0.08]
                    bg-[#101113]
                    px-3
                    text-[12px]
                    text-zinc-200
                    outline-none
                    placeholder:text-zinc-700
                    transition-all
                    focus:border-[#dc9458]/50
                    focus:ring-1
                    focus:ring-[#dc9458]/20
                  "
                />
              </div>

              {/* Description */}

              <div>
                <label
                  htmlFor="workspace-description"
                  className="
                    mb-2 block
                    text-[11px]
                    font-medium
                    text-zinc-400
                  "
                >
                  Description

                  <span className="ml-1 text-zinc-700">
                    (optional)
                  </span>
                </label>

                <textarea
                  id="workspace-description"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="What is this workspace for?"
                  rows={3}
                  maxLength={200}
                  className="
                    w-full
                    resize-none
                    rounded-lg
                    border border-white/[0.08]
                    bg-[#101113]
                    px-3 py-2.5
                    text-[12px]
                    leading-5
                    text-zinc-200
                    outline-none
                    placeholder:text-zinc-700
                    transition-all
                    focus:border-[#dc9458]/50
                    focus:ring-1
                    focus:ring-[#dc9458]/20
                  "
                />
              </div>

              {/* Template */}

              <div>
                <label
                  className="
                    mb-2 block
                    text-[11px]
                    font-medium
                    text-zinc-400
                  "
                >
                  Template
                </label>

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-2
                    sm:grid-cols-5
                  "
                >
                  {templates.map((item) => {
                    const Icon = item.icon;
                    const selected =
                      template === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setTemplate(item.id)
                        }
                        className={`
                          flex min-h-[62px]
                          items-center
                          justify-center
                          gap-1.5
                          rounded-lg
                          border
                          px-2 py-2
                          transition-all duration-150

                          ${
                            selected
                              ? `
                                border-[#dc9458]
                                bg-[#2c231d]
                                text-[#df9758]
                              `
                              : `
                                border-white/[0.07]
                                bg-[#111214]
                                text-zinc-500
                                hover:border-white/[0.13]
                                hover:bg-[#151618]
                                hover:text-zinc-300
                              `
                          }

                          max-[360px]:min-h-[56px]
                        `}
                      >
                        <Icon
                          size={14}
                          strokeWidth={1.8}
                        />

                        <span
                          className="
                            text-[9px]
                            font-medium
                          "
                        >
                          {item.shortName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visibility */}

              <div>
                <label
                  className="
                    mb-2 block
                    text-[11px]
                    font-medium
                    text-zinc-400
                  "
                >
                  Visibility
                </label>

                <div className="grid gap-2 sm:grid-cols-2">

                  {/* PRIVATE */}

                  <button
                    type="button"
                    onClick={() =>
                      setVisibility("private")
                    }
                    className={`
                      flex min-h-[58px]
                      items-center gap-3
                      rounded-lg
                      border
                      px-3
                      text-left
                      transition-all

                      ${
                        visibility === "private"
                          ? `
                            border-[#dc9458]
                            bg-[#2c231d]
                          `
                          : `
                            border-white/[0.07]
                            bg-[#111214]
                            hover:border-white/[0.13]
                          `
                      }
                    `}
                  >
                    <div
                      className={`
                        flex h-8 w-8 shrink-0
                        items-center justify-center
                        rounded-md

                        ${
                          visibility === "private"
                            ? `
                              bg-[#dc9458]/10
                              text-[#df9758]
                            `
                            : `
                              bg-white/[0.04]
                              text-zinc-500
                            `
                        }
                      `}
                    >
                      <Lock size={14} />
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`
                          text-[11px]
                          font-medium
                          ${
                            visibility === "private"
                              ? "text-zinc-200"
                              : "text-zinc-400"
                          }
                        `}
                      >
                        Private
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-[9px]
                          leading-4
                          text-zinc-600
                        "
                      >
                        Only you and invited users
                      </p>
                    </div>
                  </button>

                  {/* PUBLIC */}

                  <button
                    type="button"
                    onClick={() =>
                      setVisibility("public")
                    }
                    className={`
                      flex min-h-[58px]
                      items-center gap-3
                      rounded-lg
                      border
                      px-3
                      text-left
                      transition-all

                      ${
                        visibility === "public"
                          ? `
                            border-[#dc9458]
                            bg-[#2c231d]
                          `
                          : `
                            border-white/[0.07]
                            bg-[#111214]
                            hover:border-white/[0.13]
                          `
                      }
                    `}
                  >
                    <div
                      className={`
                        flex h-8 w-8 shrink-0
                        items-center justify-center
                        rounded-md

                        ${
                          visibility === "public"
                            ? `
                              bg-[#dc9458]/10
                              text-[#df9758]
                            `
                            : `
                              bg-white/[0.04]
                              text-zinc-500
                            `
                        }
                      `}
                    >
                      <Globe size={14} />
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`
                          text-[11px]
                          font-medium
                          ${
                            visibility === "public"
                              ? "text-zinc-200"
                              : "text-zinc-400"
                          }
                        `}
                      >
                        Public
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-[9px]
                          leading-4
                          text-zinc-600
                        "
                      >
                        Anyone with the link
                      </p>
                    </div>
                  </button>

                </div>
              </div>

            </div>
          </div>

          {/* ================= FOOTER ================= */}

          <div
            className="
              flex shrink-0
              flex-col-reverse
              gap-2
              border-t border-white/[0.06]
              px-4 py-4
              sm:flex-row
              sm:justify-end
              sm:px-5
            "
          >
            <button
              type="button"
              onClick={handleClose}
              className="
                h-9
                w-full
                rounded-lg
                border border-white/[0.08]
                bg-[#111214]
                px-4
                text-[11px]
                font-medium
                text-zinc-400
                transition-colors
                hover:bg-white/[0.04]
                hover:text-zinc-200
                sm:w-auto
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!workspaceName.trim()}
              className="
                h-9
                w-full
                rounded-lg
                bg-[#dc9458]
                px-4
                text-[11px]
                font-semibold
                text-[#17110d]
                transition-all
                hover:bg-[#e5a067]
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-40
                sm:w-auto
              "
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;