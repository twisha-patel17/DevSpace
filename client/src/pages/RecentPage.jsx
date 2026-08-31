import { useEffect, useState } from "react";
import { Clock3, FolderKanban, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";

const RecentPage = () => {
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecentWorkspaces = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/api/workspaces/recent");

        setWorkspaces(response.data.workspaces || []);
      } catch (error) {
        console.error(
          "Failed to fetch recent workspaces:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load recent workspaces"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecentWorkspaces();
  }, []);

  const formatDate = (date) => {
    if (!date) return "Recently";

    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-full bg-[#0d0e10] px-4 py-6 text-zinc-200 sm:px-6 lg:px-8">
      {/* Header */}

      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-xl
                border border-[#dc9458]/20
                bg-[#dc9458]/10
                text-[#dc9458]
              "
            >
              <Clock3 size={19} />
            </div>

            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
                Recent
              </h1>

              <p className="mt-1 text-xs text-zinc-500">
                Quickly access your recently updated workspaces.
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}

        {loading && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="
                  h-32
                  animate-pulse
                  rounded-xl
                  border border-white/[0.06]
                  bg-white/[0.02]
                "
              />
            ))}
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <div
            className="
              rounded-xl
              border border-red-400/10
              bg-red-400/[0.04]
              px-5 py-4
              text-sm
              text-red-400
            "
          >
            {error}
          </div>
        )}

        {/* Empty */}

        {!loading &&
          !error &&
          workspaces.length === 0 && (
            <div
              className="
                flex
                min-h-[320px]
                flex-col
                items-center
                justify-center
                rounded-2xl
                border border-dashed
                border-white/[0.08]
                bg-white/[0.015]
                text-center
              "
            >
              <div
                className="
                  mb-4
                  flex h-12 w-12
                  items-center justify-center
                  rounded-xl
                  bg-white/[0.04]
                  text-zinc-600
                "
              >
                <Clock3 size={21} />
              </div>

              <h2 className="text-sm font-semibold text-zinc-300">
                No recent workspaces
              </h2>

              <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-600">
                Workspaces you access or update will appear
                here.
              </p>

              <button
                type="button"
                onClick={() => navigate("/workspaces")}
                className="
                  mt-5
                  rounded-lg
                  border border-[#dc9458]/20
                  bg-[#dc9458]/10
                  px-4 py-2
                  text-xs font-semibold
                  text-[#dc9458]
                  transition
                  hover:border-[#dc9458]/40
                  hover:bg-[#dc9458]/15
                "
              >
                Browse Workspaces
              </button>
            </div>
          )}

        {/* Workspace Grid */}

        {!loading &&
          !error &&
          workspaces.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((workspace) => (
                <button
                  key={workspace._id}
                  type="button"
                  onClick={() =>
                    navigate(`/workspaces/${workspace._id}`)
                  }
                  className="
                    group
                    text-left
                    rounded-xl
                    border border-white/[0.06]
                    bg-white/[0.02]
                    p-4
                    transition-all
                    duration-200
                    hover:border-[#dc9458]/20
                    hover:bg-white/[0.035]
                  "
                >
                  {/* Top */}

                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="
                        flex h-9 w-9
                        shrink-0
                        items-center justify-center
                        rounded-lg
                        bg-[#dc9458]/10
                        text-[#dc9458]
                      "
                    >
                      <FolderKanban size={17} />
                    </div>

                    <ArrowRight
                      size={15}
                      className="
                        text-zinc-700
                        transition
                        group-hover:translate-x-0.5
                        group-hover:text-[#dc9458]
                      "
                    />
                  </div>

                  {/* Name */}

                  <h2
                    className="
                      mt-4
                      truncate
                      text-sm
                      font-semibold
                      text-zinc-200
                      group-hover:text-white
                    "
                  >
                    {workspace.name}
                  </h2>

                  {/* Description */}

                  <p
                    className="
                      mt-1
                      min-h-[32px]
                      line-clamp-2
                      text-[11px]
                      leading-4
                      text-zinc-600
                    "
                  >
                    {workspace.description ||
                      "No description"}
                  </p>

                  {/* Footer */}

                  <div
                    className="
                      mt-4
                      flex
                      items-center
                      justify-between
                      border-t
                      border-white/[0.05]
                      pt-3
                    "
                  >
                    <span className="text-[10px] text-zinc-600">
                      {workspace.language || "Blank"}
                    </span>

                    <span className="text-[10px] text-zinc-600">
                      {formatDate(workspace.updatedAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default RecentPage;