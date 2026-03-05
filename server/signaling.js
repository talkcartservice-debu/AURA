import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

// Map to store online users and their socket IDs
const onlineUsers = new Map(); // email -> Set of socket IDs

// Map to store socket ID to user email mapping
const socketToUser = new Map(); // socketId -> email

export function initializeSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User authenticates with JWT
    socket.on("authenticate", async (token, callback) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;

        // Store user mapping
        if (!onlineUsers.has(email)) {
          onlineUsers.set(email, new Set());
        }
        onlineUsers.get(email).add(socket.id);
        socketToUser.set(socket.id, email);

        console.log(`User ${email} authenticated on socket ${socket.id}`);

        // Notify contacts that user is online
        socket.broadcast.emit("user_online", { email });

        callback?.({ success: true, email });
      } catch (error) {
        console.error("Authentication error:", error);
        callback?.({ success: false, error: "Invalid token" });
      }
    });

    // Handle call initiation
    socket.on("call_initiate", (data, callback) => {
      const { receiver_email, call_type, offer } = data;
      const sender_email = socketToUser.get(socket.id);

      if (!sender_email) {
        return callback?.({ success: false, error: "Not authenticated" });
      }

      console.log(`Call from ${sender_email} to ${receiver_email}`);

      // Find receiver's sockets
      const receiverSockets = onlineUsers.get(receiver_email);
      if (!receiverSockets || receiverSockets.size === 0) {
        return callback?.({ success: false, error: "User offline" });
      }

      // Send call signal to all receiver's devices
      receiverSockets.forEach((socketId) => {
        io.to(socketId).emit("call_received", {
          from_email: sender_email,
          call_type,
          offer,
          timestamp: new Date().toISOString(),
        });
      });

      callback?.({ success: true });
    });

    // Handle call acceptance
    socket.on("call_accept", (data, callback) => {
      const { initiator_email, answer } = data;
      const receiver_email = socketToUser.get(socket.id);

      if (!receiver_email) {
        return callback?.({ success: false, error: "Not authenticated" });
      }

      // Find initiator's sockets
      const initiatorSockets = onlineUsers.get(initiator_email);
      if (!initiatorSockets) {
        return callback?.({ success: false, error: "Initiator offline" });
      }

      initiatorSockets.forEach((socketId) => {
        io.to(socketId).emit("call_accepted", {
          from_email: receiver_email,
          answer,
        });
      });

      callback?.({ success: true });
    });

    // Handle ICE candidates (network information exchange)
    socket.on("ice_candidate", (data) => {
      const { target_email, candidate } = data;
      const sender_email = socketToUser.get(socket.id);

      const targetSockets = onlineUsers.get(target_email);
      if (!targetSockets) return;

      targetSockets.forEach((socketId) => {
        io.to(socketId).emit("ice_candidate", {
          from_email: sender_email,
          candidate,
        });
      });
    });

    // Handle call rejection
    socket.on("call_reject", (data) => {
      const { initiator_email } = data;
      const receiver_email = socketToUser.get(socket.id);

      const initiatorSockets = onlineUsers.get(initiator_email);
      if (!initiatorSockets) return;

      initiatorSockets.forEach((socketId) => {
        io.to(socketId).emit("call_rejected", {
          from_email: receiver_email,
        });
      });
    });

    // Handle call end
    socket.on("call_end", (data) => {
      const { target_email } = data;
      const from_email = socketToUser.get(socket.id);

      const targetSockets = onlineUsers.get(target_email);
      if (!targetSockets) return;

      targetSockets.forEach((socketId) => {
        io.to(socketId).emit("call_ended", {
          from_email,
        });
      });
    });

    // Typing indicators
    socket.on("typing", (data) => {
      const from_email = socketToUser.get(socket.id);
      if (!from_email) return;
      const { target_email, match_id } = data || {};
      const targetSockets = onlineUsers.get(target_email);
      if (!targetSockets) return;
      targetSockets.forEach((socketId) => {
        io.to(socketId).emit("typing", {
          from_email,
          match_id,
        });
      });
    });

    socket.on("stop_typing", (data) => {
      const from_email = socketToUser.get(socket.id);
      if (!from_email) return;
      const { target_email, match_id } = data || {};
      const targetSockets = onlineUsers.get(target_email);
      if (!targetSockets) return;
      targetSockets.forEach((socketId) => {
        io.to(socketId).emit("stop_typing", {
          from_email,
          match_id,
        });
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const email = socketToUser.get(socket.id);
      if (email) {
        const userSockets = onlineUsers.get(email);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            onlineUsers.delete(email);
            // Notify others that user went offline
            socket.broadcast.emit("user_offline", { email });
          }
        }
        socketToUser.delete(socket.id);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  console.log("Socket.IO initialized");
  return io;
}

// Emit an event to all sockets for a given user email
export function emitToUser(email, event, payload) {
  if (!io) return;
  const userSockets = onlineUsers.get(email);
  if (!userSockets || userSockets.size === 0) return;
  userSockets.forEach((socketId) => {
    io.to(socketId).emit(event, payload);
  });
}

// Helper function to get online status
export function isUserOnline(email) {
  const userSockets = onlineUsers.get(email);
  return userSockets && userSockets.size > 0;
}

// Get all online users
export function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}
