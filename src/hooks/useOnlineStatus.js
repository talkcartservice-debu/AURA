import { useEffect, useState, useCallback } from "react";
import { useSocket } from "./useSocket";

// Store for tracking online users
const onlineUsersCache = new Set();

export function useOnlineStatus(email) {
  const { on, off } = useSocket();
  const [isOnline, setIsOnline] = useState(onlineUsersCache.has(email));

  // Check if user is in cache
  const checkOnline = useCallback(() => {
    return onlineUsersCache.has(email);
  }, [email]);

  useEffect(() => {
    if (!email) return;

    // Handler for user coming online
    const handleUserOnline = (userEmail) => {
      if (userEmail === email) {
        onlineUsersCache.add(userEmail);
        setIsOnline(true);
      }
    };

    // Handler for user going offline
    const handleUserOffline = (userEmail) => {
      if (userEmail === email) {
        onlineUsersCache.delete(userEmail);
        setIsOnline(false);
      }
    };

    // Register listeners
    on("user_online", handleUserOnline);
    on("user_offline", handleUserOffline);

    // Initial check
    setIsOnline(onlineUsersCache.has(email));

    // Cleanup
    return () => {
      off("user_online", handleUserOnline);
      off("user_offline", handleUserOffline);
    };
  }, [email, on, off]);

  return {
    isOnline,
    checkOnline,
  };
}

// Hook to get all online users
export function useAllOnlineUsers() {
  const { on, off } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState(new Set(onlineUsersCache));

  useEffect(() => {
    const handleUserOnline = (email) => {
      onlineUsersCache.add(email);
      setOnlineUsers(new Set(onlineUsersCache));
    };

    const handleUserOffline = (email) => {
      onlineUsersCache.delete(email);
      setOnlineUsers(new Set(onlineUsersCache));
    };

    on("user_online", handleUserOnline);
    on("user_offline", handleUserOffline);

    return () => {
      off("user_online", handleUserOnline);
      off("user_offline", handleUserOffline);
    };
  }, [on, off]);

  return {
    onlineUsers,
    isUserOnline: (email) => onlineUsers.has(email),
  };
}
