import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import CreateWorkspaceModal from "../../components/CreateWorkspaceModal";

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [createWorkspaceOpen, setCreateWorkspaceOpen] =
    useState(false);

  const handleCreateWorkspace = (workspaceData) => {
    console.log("New workspace:", workspaceData);

    setCreateWorkspaceOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#090a0b] text-zinc-100">

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCreateWorkspace={() =>
          setCreateWorkspaceOpen(true)
        }
      />

      <div className="lg:pl-[250px]">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main>
          <Outlet
            context={{
              openCreateWorkspace: () =>
                setCreateWorkspaceOpen(true),
            }}
          />
        </main>

      </div>

      <CreateWorkspaceModal
        isOpen={createWorkspaceOpen}
        onClose={() => setCreateWorkspaceOpen(false)}
        onCreate={handleCreateWorkspace}
      />

    </div>
  );
};

export default AppLayout;