import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getWorkspaces,
  getRecentWorkspaces,
  getWorkspace,
  getSharedWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceFiles,
  createWorkspaceFile,
  updateWorkspaceFile,
  deleteWorkspaceFile,
} from "../api/workspace.api";

export const workspaceKeys = {
  all: ["workspaces"],

  lists: () => [...workspaceKeys.all, "list"],

  list: () => [...workspaceKeys.lists()],

  recent: () => [...workspaceKeys.all, "recent"],

  shared: () => [...workspaceKeys.all, "shared"],

  details: () => [...workspaceKeys.all, "detail"],

  detail: (workspaceId) => [
    ...workspaceKeys.details(),
    workspaceId,
  ],

  files: (workspaceId) => [
    ...workspaceKeys.detail(workspaceId),
    "files",
  ],
};

export const useWorkspaces = () => {
  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: getWorkspaces,
  });
};

export const useRecentWorkspaces = () => {
  return useQuery({
    queryKey: workspaceKeys.recent(),
    queryFn: getRecentWorkspaces,
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

export const useWorkspaceFiles = (workspaceId) => {
  return useQuery({
    queryKey: workspaceKeys.files(workspaceId),
    queryFn: () => getWorkspaceFiles(workspaceId),
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
        queryKey: workspaceKeys.recent(),
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
        queryKey: workspaceKeys.detail(workspaceId),
      });

      queryClient.invalidateQueries({
        queryKey: workspaceKeys.list(),
      });

      queryClient.invalidateQueries({
        queryKey: workspaceKeys.recent(),
      });

      queryClient.invalidateQueries({
        queryKey: workspaceKeys.shared(),
      });
    },
  });
};

export const useCreateWorkspaceFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkspaceFile,

    onSuccess: (file, variables) => {
      const workspaceId = variables.workspaceId;

      queryClient.setQueryData(
        workspaceKeys.files(workspaceId),
        (oldFiles = []) => {
          const exists = oldFiles.some(
            (item) => item._id === file._id
          );

          if (exists) {
            return oldFiles;
          }

          return [...oldFiles, file];
        }
      );
    },
  });
};

export const useUpdateWorkspaceFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkspaceFile,

    onSuccess: (updatedFile, variables) => {
      const workspaceId = variables.workspaceId;

      queryClient.setQueryData(
        workspaceKeys.files(workspaceId),
        (oldFiles = []) => {
          return oldFiles.map((file) =>
            file._id === updatedFile._id
              ? updatedFile
              : file
          );
        }
      );
    },
  });
};

export const useDeleteWorkspaceFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkspaceFile,

    onSuccess: (_, variables) => {
      const workspaceId = variables.workspaceId;
      const deletedFileId = variables.fileId;

      queryClient.setQueryData(
        workspaceKeys.files(workspaceId),
        (oldFiles = []) => {
          return oldFiles.filter(
            (file) => file._id !== deletedFileId
          );
        }
      );
    },
  });
};