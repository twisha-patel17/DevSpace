
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: false,
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const connectSocket = (token) => {
  if (!token) {
    console.warn("Socket connection skipped: no access token");
    return socket;
  }

  socket.auth = { token };

  if (!socket.connected && !socket.active) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket.connected || socket.active) {
    socket.disconnect();
  }
};

export default socket;