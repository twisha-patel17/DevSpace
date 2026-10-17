
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

const SOCKET_URL = API_URL
  ? API_URL.replace(/\/api\/?$/, "")
  : "http://localhost:5000";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ["websocket", "polling"],
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
