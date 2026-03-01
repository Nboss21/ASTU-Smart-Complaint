import { Server } from "socket.io";

let io: Server;

export const initSocket = (server: Server) => {
  io = server;
  io.on("connection", (socket) => {
    socket.on("join", (userId: string) => {
      socket.join(userId);
    });
  });
};

export const sendNotification = (userId: string, notification: any) => {
  if (!io) return;
  io.to(userId).emit("notification", notification);
};
