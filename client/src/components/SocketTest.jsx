import { useEffect } from "react";
import socket from "../socket";

function SocketTest() {
  useEffect(() => {
    socket.connect();

    const handleConnect = () => {
      console.log("Connected to DevSpace server:", socket.id);
    };

    const handleDisconnect = () => {
      console.log("Disconnected from DevSpace server");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, []);

  return null;
}

export default SocketTest;