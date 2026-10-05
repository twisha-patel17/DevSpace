import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: false,
  withCredentials: true,
});

export const connectSocket = (token) => {
  if (!token) {
    console.warn("Socket connection skipped: no access token");
    return;
  }

  socket.auth = {
    token,
  };

  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;