// src/context/RealtimeContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const RealtimeContext = createContext();

export const RealtimeProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    if (!user) return;

    setCurrentUser(user);

    // Connect to Socket.IO
    const sock = io(import.meta.env.VITE_API_URL || "http://localhost:5000", { 
      transports: ["websocket", "polling"] 
    });

    sock.on("connect", () => {
      console.log("Connected to real-time server");
      if (user && user.id) {
        sock.emit("join", user.id);
      }
    });

    sock.on("disconnect", () => {
      console.log("Disconnected from real-time server");
    });

    sock.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    sock.on("error", (error) => {
      console.error("Socket error:", error);
    });

    setSocket(sock);

    return () => sock.disconnect();
  }, []);

  // Safe socket event listener wrapper
  const safeSocketOn = (event, callback) => {
    if (!socket) return;
    socket.on(event, callback);
  };

  // Real-time event listeners
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Group updates
    safeSocketOn("group_created", (data) => {
      toast.success(`New group "${data.group_name}" created!`);
      // Trigger refresh in components that listen for this event
      window.dispatchEvent(new CustomEvent('group_created', { detail: data }));
    });

    safeSocketOn("group_updated", (data) => {
      toast.info(`Group "${data.group_name}" updated!`);
      window.dispatchEvent(new CustomEvent('group_updated', { detail: data }));
    });

    safeSocketOn("group_deleted", (data) => {
      toast.warning(`Group "${data.group_name}" deleted!`);
      window.dispatchEvent(new CustomEvent('group_deleted', { detail: data }));
    });

    // Join request updates
    safeSocketOn("join_request_sent", (data) => {
      if (currentUser && data.requester_id === currentUser.id) {
        toast.success("Join request sent! Waiting for approval.");
      } else {
        toast.info(`${data.requester_name} wants to join "${data.group_name}"`);
      }
      window.dispatchEvent(new CustomEvent('join_request_sent', { detail: data }));
    });

    safeSocketOn("join_request_approved", (data) => {
      if (currentUser && data.user_id === currentUser.id) {
        toast.success(`Your request to join "${data.group_name}" was approved!`);
      } else {
        toast.info(`${data.user_name} joined "${data.group_name}"`);
      }
      window.dispatchEvent(new CustomEvent('join_request_approved', { detail: data }));
    });

    safeSocketOn("join_request_declined", (data) => {
      if (currentUser && data.user_id === currentUser.id) {
        toast.error(`Your request to join "${data.group_name}" was declined.`);
      }
      window.dispatchEvent(new CustomEvent('join_request_declined', { detail: data }));
    });

    safeSocketOn("user_left_group", (data) => {
      if (data.user_id === currentUser.id) {
        toast.info(`You left "${data.group_name}"`);
      } else {
        toast.info(`${data.user_name} left "${data.group_name}"`);
      }
      window.dispatchEvent(new CustomEvent('user_left_group', { detail: data }));
    });

    // Profile updates
    safeSocketOn("profile_updated", (data) => {
      if (data.user_id === currentUser.id) {
        toast.success("Profile updated successfully!");
      } else {
        toast.info(`${data.username} updated their profile`);
      }
      window.dispatchEvent(new CustomEvent('profile_updated', { detail: data }));
    });

    // New messages
    safeSocketOn("new_message", (data) => {
      if (data.sender_id !== currentUser.id) {
        toast.info(`New message from ${data.sender_name} in "${data.group_name}"`);
      }
      window.dispatchEvent(new CustomEvent('new_message', { detail: data }));
    });

    // Schedule updates
    socket.on("schedule_created", (data) => {
      toast.success(`New study date scheduled for "${data.group_name}"`);
      window.dispatchEvent(new CustomEvent('schedule_created', { detail: data }));
    });

    // Announcement updates
    socket.on("announcement_created", (data) => {
      toast.info(`New announcement in "${data.group_name}"`);
      window.dispatchEvent(new CustomEvent('announcement_created', { detail: data }));
    });

    return () => {
      // Clean up all listeners
      const events = [
        'group_created', 'group_updated', 'group_deleted',
        'join_request_sent', 'join_request_approved', 'join_request_declined',
        'user_left_group', 'profile_updated', 'new_message',
        'schedule_created', 'announcement_created'
      ];
      
      events.forEach(event => {
        socket.off(event);
      });
    };
  }, [socket, currentUser]);

  return (
    <RealtimeContext.Provider value={{ socket, currentUser }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
