import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/lib/AuthContext";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export function useSocket() {
  const socketRef = useRef(null);
  const { user, getToken } = useAuth();
  const listenersRef = useRef({});

  // Initialize socket connection
  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      return;
    }

    // Get token safely
    const token = getToken ? getToken() : localStorage.getItem("aura_token");
    
    if (!token) {
      console.warn('No auth token found for Socket.IO connection');
      return;
    }

    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Authenticate with server
    socketRef.current.emit("authenticate", token, (response) => {
      if (response.success) {
        console.log("✅ Authenticated with Socket.IO as:", response.email);
      } else {
        console.error("❌ Socket.IO authentication failed:", response.error);
      }
    });

    // Connection events
    socketRef.current.on("connect", () => {
      console.log("✅ Socket.IO connected:", socketRef.current.id);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("❌ Socket.IO disconnected:", reason);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error.message);
    });

    // User online/offline events
    socketRef.current.on("user_online", ({ email }) => {
      console.log("🟢 User online:", email);
      if (listenersRef.current.user_online) {
        listenersRef.current.user_online(email);
      }
    });

    socketRef.current.on("user_offline", ({ email }) => {
      console.log("🔴 User offline:", email);
      if (listenersRef.current.user_offline) {
        listenersRef.current.user_offline(email);
      }
    });

    // Call events
    socketRef.current.on("call_received", (data) => {
      console.log("📞 Incoming call:", data);
      if (listenersRef.current.call_received) {
        listenersRef.current.call_received(data);
      }
    });

    socketRef.current.on("call_accepted", (data) => {
      console.log("✅ Call accepted:", data);
      if (listenersRef.current.call_accepted) {
        listenersRef.current.call_accepted(data);
      }
    });

    socketRef.current.on("call_rejected", (data) => {
      console.log("❌ Call rejected:", data);
      if (listenersRef.current.call_rejected) {
        listenersRef.current.call_rejected(data);
      }
    });

    socketRef.current.on("call_ended", (data) => {
      console.log("📞 Call ended:", data);
      if (listenersRef.current.call_ended) {
        listenersRef.current.call_ended(data);
      }
    });

    socketRef.current.on("ice_candidate", (data) => {
      console.log("❄️ ICE candidate received:", data);
      if (listenersRef.current.ice_candidate) {
        listenersRef.current.ice_candidate(data);
      }
    });

    // Cleanup on disconnect
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log("Socket.IO connection closed");
      }
    };
  }, [user]);

  // Register event listeners
  const on = useCallback((event, callback) => {
    listenersRef.current[event] = callback;
  }, []);

  // Remove event listeners
  const off = useCallback((event) => {
    delete listenersRef.current[event];
  }, []);

  // Send events
  const emit = useCallback((event, data, callback) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data, callback);
    }
  }, []);

  // Check if user is online
  const isUserOnline = useCallback((email) => {
    // This would need server implementation or local tracking
    // For now, return false - will be implemented with presence system
    return false;
  }, []);

  return {
    socket: socketRef.current,
    connected: socketRef.current?.connected || false,
    on,
    off,
    emit,
    isUserOnline,
  };
}
