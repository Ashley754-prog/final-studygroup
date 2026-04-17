import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNotifications } from "../../context/NotificationContext";
import { useNavigate } from "react-router-dom";

import {
  StarIcon,
  ArchiveBoxIcon,
  BellIcon,
  Squares2X2Icon,
  UserPlusIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function InboxPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const { setUnreadCount } = useNotifications();
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?.id ? parseInt(user.id) : null;

  const fetchNotifications = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/notifs/${userId}`);
      const data = res.data || [];
      setMessages(data);
      setUnreadCount(data.filter(n => !n.is_read && !n.is_archived && !n.is_deleted).length);
    } catch (err) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!userId) return;
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", { transports: ["websocket", "polling"] });

    socket.on("connect", () => socket.emit("join", userId));

    socket.on("notification", (notif) => {
      setMessages(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
      new Audio("/notification.mp3").play().catch(() => {});
      toast.success("New notification!", { autoClose: 4000 });
    });

    return () => socket.disconnect();
  }, [userId]);

  const markRead = async (notif) => {
    if (!notif || notif.is_read) return;
    try {
      await axios.patch(`http://localhost:5000/api/notifs/${notif.id}/read`);
      setMessages(prev => prev.map(m => m.id === notif.id ? { ...m, is_read: 1 } : m));
      setUnreadCount(prev => prev - 1);
    } catch (err) { console.error(err); }
  };

  const toggleStar = async (id, current) => {
    try {
      await axios.patch(`http://localhost:5000/api/notifs/${id}/star`);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_starred: !current } : m));
    } catch (err) { toast.error("Failed"); }
  };

  const toggleArchive = async (id, current) => {
    try {
      await axios.patch(`http://localhost:5000/api/notifs/${id}/archive`);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_archived: !current } : m));
      if (selected?.id === id) setSelected(null);
    } catch (err) { toast.error("Failed"); }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/notifs/${id}`);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) { toast.error("Failed"); }
  };

  // ✅ Approve join request
  const approveRequest = async (notif) => {
    try {
      await axios.post("http://localhost:5000/api/group/approve", {
        groupId: notif.related_id,
        userId: notif.requester_id
      });

      toast.success("Member approved!");

      // Mark creator's notification as read & archived
      await axios.patch(`http://localhost:5000/api/notifs/${notif.id}/read`);
      await axios.patch(`http://localhost:5000/api/notifs/${notif.id}/archive`);
      setMessages(prev => prev.map(m => m.id === notif.id ? { ...m, is_read: 1, is_archived: 1 } : m));

    } catch (err) {
      console.error(err);
      toast.error("Failed to approve");
    }
  };

  // ✅ Decline join request
  const declineRequest = async (notif) => {
    try {
      await axios.post("http://localhost:5000/api/group/decline", {
        groupId: notif.related_id,
        userId: notif.requester_id
      });

      toast.success("Request declined!");

      await axios.patch(`http://localhost:5000/api/notifs/${notif.id}/read`);
      await axios.patch(`http://localhost:5000/api/notifs/${notif.id}/archive`);
      setMessages(prev => prev.map(m => m.id === notif.id ? { ...m, is_read: 1, is_archived: 1 } : m));
    } catch (err) {
      console.error(err);
      toast.error("Failed to decline");
    }
  };

  // Filter messages properly: join requests for creators only
  const filteredMessages = messages.filter(m => {
    if (m.is_deleted || (m.is_archived && filter !== "archived")) return false;

    if (filter === "requests") return m.type === "join_request";
    if (filter === "general") return m.type !== "join_request";
    if (filter === "starred") return m.is_starred;
    if (filter === "unread") return !m.is_read;
    if (filter === "archived") return m.is_archived;

    return true;
  });

  const joinRequests = messages.filter(m => m.type === "join_request" && !m.is_archived && m.user_id === userId).length;

  return (
    <div className="flex h-[calc(100vh-200px)] max-w-7xl mx-auto bg-white shadow-xl rounded-xl border border-gray-300 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#800000] text-white p-4 flex flex-col">
        <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
          <BellIcon className="w-6 h-6" /> Inbox
        </h2>

        <div className="space-y-2 text-sm">
          <button onClick={() => setFilter("all")} className={`w-full text-left p-3 rounded flex items-center gap-3 ${filter === "all" ? "bg-white text-[#800000]" : "hover:bg-white/20"}`}>
            <Squares2X2Icon className="w-5 h-5" /> All
          </button>

          <button onClick={() => setFilter("requests")} className={`w-full text-left p-3 rounded flex items-center justify-between ${filter === "requests" ? "bg-white text-[#800000]" : "hover:bg-white/20"}`}>
            <div className="flex items-center gap-3">
              <UserPlusIcon className="w-5 h-5" /> Join Requests
            </div>
            {joinRequests > 0 && <span className="bg-yellow-400 text-[#800000] px-3 py-1 rounded-full text-xs font-bold">{joinRequests}</span>}
          </button>

          <button onClick={() => setFilter("general")} className={`w-full text-left p-3 rounded flex items-center gap-3 ${filter === "general" ? "bg-white text-[#800000]" : "hover:bg-white/20"}`}>
            <BellIcon className="w-5 h-5" /> General
          </button>

          <button onClick={() => setFilter("unread")} className={`w-full text-left p-3 rounded flex items-center gap-3 ${filter === "unread" ? "bg-white text-[#800000]" : "hover:bg-white/20"}`}>
            Unread ({messages.filter(m => !m.is_read && !m.is_archived).length})
          </button>

          <button onClick={() => setFilter("starred")} className={`w-full text-left p-3 rounded flex items-center gap-3 ${filter === "starred" ? "bg-white text-[#800000]" : "hover:bg-white/20"}`}>
            <StarIcon className="w-5 h-5 fill-yellow-400 text-yellow-400" /> Starred
          </button>

          <button onClick={() => setFilter("archived")} className={`w-full text-left p-3 rounded flex items-center gap-3 ${filter === "archived" ? "bg-white text-[#800000]" : "hover:bg-white/20"}`}>
            <ArchiveBoxIcon className="w-5 h-5" /> Archived
          </button>
        </div>
      </aside>

      {/* MAIN LIST */}
      <main className="flex-1 flex">
        <section className="flex-1 overflow-y-auto">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-lg text-[#800000]">
              {filter === "requests" ? "Join Requests" :
               filter === "general" ? "General Notifications" :
               filter === "starred" ? "Starred" :
               filter === "archived" ? "Archived" :
               filter === "unread" ? "Unread" : "All Messages"}
            </h3>
            <button onClick={fetchNotifications} className="p-2 hover:bg-gray-200 rounded">
              <Squares2X2Icon className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No notifications here</div>
          ) : (
            <div className="divide-y">
              {filteredMessages.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => { markRead(msg); setSelected(msg); }}
                  className={`p-6 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-all ${!msg.is_read ? "bg-blue-50" : ""} ${selected?.id === msg.id ? "bg-gray-100" : ""}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 items-center rounded-full flex-center ${msg.type === "join_request" ? "bg-yellow-100" : "bg-gray-100"}`}>
                      {msg.type === "join_request" ? (
                        <UserPlusIcon className="w-7 h-7 text-yellow-600" />
                      ) : (
                        <BellIcon className="w-7 h-7 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-[#800000] text-lg">{msg.title}</div>
                      <div className="text-gray-700">{msg.message}</div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(msg.created_at).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                      {msg.type === "join_request" && !msg.is_archived && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); approveRequest(msg); }}
                            className="bg-green-600 text-white px-1 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-1 shadow"
                          >
                            <CheckIcon className="w-4 h-4" /> Approve
                          </button>

                          <button
                            onClick={(e) => { e.stopPropagation(); declineRequest(msg); }}
                            className="bg-red-600 text-white px-1 py-2 rounded-lg font-bold hover:bg-red-700 flex items-center gap-1 shadow"
                          >
                            <XMarkIcon className="w-4 h-4" /> Decline
                          </button>
                        </div>
                      )}
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); toggleStar(msg.id, msg.is_starred); }} className="p-2 hover:bg-gray-200 rounded">
                        <StarIcon className={`w-5 h-5 ${msg.is_starred ? "text-yellow-500 fill-current" : "text-gray-400"}`} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toggleArchive(msg.id, msg.is_archived); }} className="p-2 hover:bg-gray-200 rounded">
                        <ArchiveBoxIcon className="w-5 h-5 text-gray-500" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteNotification(msg.id); }} className="p-2 hover:bg-gray-200 rounded">
                        <TrashIcon className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* DETAIL PANEL */}
        <aside className="w-96 border-l bg-gray-50 p-6">
          {selected ? (
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-[#800000]">{selected.title}</h3>
                <div className="flex gap-2">
                  <button onClick={() => toggleStar(selected.id, selected.is_starred)}>
                    <StarIcon className={`w-6 h-6 ${selected.is_starred ? "text-yellow-500 fill-current" : "text-gray-400"}`} />
                  </button>
                  <button onClick={() => toggleArchive(selected.id, selected.is_archived)}>
                    <ArchiveBoxIcon className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500">{new Date(selected.created_at).toLocaleString()}</p>
              <div className="mt-6 text-gray-800 text-lg leading-relaxed">{selected.message}</div>
            </div>
          ) : (
            <p className="text-center text-gray-500 mt-20">Select a notification to view details</p>
          )}
        </aside>
      </main>
    </div>
  );
}
