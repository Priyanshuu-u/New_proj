import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const next = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket"],
    });

    setSocket(next);
    return () => next.disconnect();
  }, []);

  return socket;
}
