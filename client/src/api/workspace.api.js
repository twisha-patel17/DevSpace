import api from "./axios";

export const getWorkspaces = async () => {
  const response = await api.get(
    "/api/workspaces"
  );

  return response.data.workspaces;
};

export const getSharedWorkspaces = async () => {
  const response = await api.get(
    "/api/workspaces/shared"
  );

  return response.data.workspaces;
};

export const getWorkspace = async (
  workspaceId
) => {
  const response = await api.get(
    `/api/workspaces/${workspaceId}`
  );

  return response.data.workspace;
};

export const createWorkspace = async (
  workspaceData
) => {
  const response = await api.post(
    "/api/workspaces",
    workspaceData
  );

  return response.data.workspace;
};

export const updateWorkspace = async ({
  workspaceId,
  workspaceData,
}) => {
  const response = await api.patch(
    `/api/workspaces/${workspaceId}`,
    workspaceData
  );

  return response.data.workspace;
};

export const deleteWorkspace = async (
  workspaceId
) => {
  const response = await api.delete(
    `/api/workspaces/${workspaceId}`
  );

  return response.data;
};