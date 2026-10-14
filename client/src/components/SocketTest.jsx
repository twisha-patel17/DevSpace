import { useEffect } from "react";
import { connectSocket } from "../socket";

function SocketTest({ accessToken }) {
  useEffect(() => {
    if (!accessToken) return;

    const socket = connectSocket(accessToken);

    const handleConnect = () => {
      console.log("Connected to DevSpace server:", socket.id);
    };

    const handleDisconnect = (reason) => {
      console.log("Disconnected from DevSpace server:", reason);
    };

    const handleConnectError = (error) => {
      console.error("DevSpace socket connection error:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [accessToken]);

  return null;
}

export default SocketTest;
