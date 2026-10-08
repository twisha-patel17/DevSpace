import api from "./axios";

export const executeCode = async ({
  language,
  code,
  stdin = "",
}) => {
  const response = await api.post("/api/execution/run", {
    language,
    code,
    stdin,
  });

  return response.data.result;
};