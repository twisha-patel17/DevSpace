import api from "./axios";

export const getWorkspaces = async () => {
  const response = await api.get("/workspaces");

  return response.data.workspaces;
};

export const getWorkspace = async (workspaceId) => {
  const response = await api.get(
    `/workspaces/${workspaceId}`
  );

  return response.data.workspace;
};

export const createWorkspace = async (workspaceData) => {
  const response = await api.post(
    "/workspaces",
    workspaceData
  );

  return response.data.workspace;
};

export const updateWorkspace = async ({
  workspaceId,
  workspaceData,
}) => {
  const response = await api.patch(
    `/workspaces/${workspaceId}`,
    workspaceData
  );

  return response.data.workspace;
};

export const deleteWorkspace = async (workspaceId) => {
  const response = await api.delete(
    `/workspaces/${workspaceId}`
  );

  return response.data;
};