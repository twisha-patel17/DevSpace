import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getWorkspaces,
  getWorkspace,
  getSharedWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from "../api/workspace.api";

export const workspaceKeys = {
  all: ["workspaces"],

  lists: () => [...workspaceKeys.all, "list"],

  list: () => [...workspaceKeys.lists()],

  shared: () => [...workspaceKeys.all, "shared"],

  details: () => [...workspaceKeys.all, "detail"],

  detail: (workspaceId) => [
    ...workspaceKeys.details(),
    workspaceId,
  ],
};

export const useWorkspaces = () => {
  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: getWorkspaces,
  });
};

export const useSharedWorkspaces = () => {
  return useQuery({
    queryKey: workspaceKeys.shared(),
    queryFn: getSharedWorkspaces,
  });
};

export const useWorkspace = (workspaceId) => {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: () => getWorkspace(workspaceId),
    enabled: !!workspaceId,
  });
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkspace,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.all,
      });
    },
  });
};

export const useUpdateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkspace,

    onSuccess: (workspace) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.list(),
      });

      queryClient.invalidateQueries({
        queryKey: workspaceKeys.shared(),
      });

      if (workspace?._id) {
        queryClient.setQueryData(
          workspaceKeys.detail(workspace._id),
          workspace
        );
      }
    },
  });
};

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkspace,

    onSuccess: (_, workspaceId) => {
      queryClient.removeQueries({
        queryKey:
          workspaceKeys.detail(workspaceId),
      });

      queryClient.invalidateQueries({
        queryKey: workspaceKeys.list(),
      });

      queryClient.invalidateQueries({
        queryKey: workspaceKeys.shared(),
      });
    },
  });
};