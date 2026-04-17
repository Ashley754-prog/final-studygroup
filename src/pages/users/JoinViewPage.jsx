import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  UserGroupIcon,
  PaperClipIcon,
  XMarkIcon,
  ChatBubbleLeftEllipsisIcon,
  PlusIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";

export default function JoinViewPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser?.id;
  const userName = currentUser?.username || "You";

  const [group, setGroup] = useState(null);
  const [userStatus, setUserStatus] = useState("none");
  const [messages, setMessages] = useState([]);
  const [events, setEvents] = useState([]);
  const [inputText, setInputText] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncements] = useState(false);
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [meetingType, setMeetingType] = useState("physical");
  const [meetingLink, setMeetingLink] = useState("");

  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceDesc, setAnnounceDesc] = useState("");

  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const closeModal = () => setSelectedAnnouncement(null);

  const lastMessageRef = useRef(null);

  const socketRef = useRef(null);

  // --- Load group, messages, schedules & setup socket ---
  useEffect(() => {
    if (!userId || !groupId) return;

    const loadGroup = async () => {
      try {
        const allGroupsRes = await axios.get("http://localhost:5000/api/group/all");
        const foundGroup = allGroupsRes.data.data.find(g => g.id === parseInt(groupId));

        if (!foundGroup) {
          toast.error("Group not found or not accessible");
          navigate("/dashboard");
          return;
        }
        setGroup(foundGroup);

        // Check if approved
        let status = "none";
        try {
          const joinedRes = await axios.get(`http://localhost:5000/api/group/my-joined/${userId}`);
          const joinedIds = joinedRes.data.data?.map(g => g.id) || [];
          if (joinedIds.includes(parseInt(groupId))) status = "approved";
        } catch {}

        if (status !== "approved") {
          try {
            const pendingRes = await axios.get(
              "http://localhost:5000/api/group/pending-members-for-user",
              { params: { userId } }
            );
            const pendingIds = pendingRes.data.data || [];
            if (pendingIds.includes(parseInt(groupId))) status = "pending";
          } catch {}
        }

        setUserStatus(status);

        // Load messages, events, announcements if approved or creator
        if (status === "approved" || foundGroup.created_by === userId) {
          // --- Messages ---
          try {
            const msgRes = await axios.get(`http://localhost:5000/api/messages/${groupId}/messages`);
            const mappedMsgs = msgRes.data.messages.map(m => ({
              ...m,
              senderName: m.sender_name || (m.sender_id === userId ? userName : "Unknown"),
            }));
            setMessages(mappedMsgs);
          } catch { setMessages([]); }

          // --- Events ---
          try {
            const schedRes = await axios.get(`http://localhost:5000/api/calendar/group/${groupId}`);
            const schedules = schedRes.data.schedules || [];
            setEvents(schedules.map(s => ({
              ...s,
              start: new Date(s.start),
              end: new Date(s.end),
              meetingType: (s.meetingType || "physical").toLowerCase(),
              meetingLink: s.meetingLink || null,
              color: "bg-yellow-100"
            })));
          } catch { setEvents([]); }

          // --- Announcements ---
          try {
            const annRes = await axios.get(`http://localhost:5000/api/announcements/group/${groupId}`);
            setAnnouncements(annRes.data.announcements || []);
          } catch (err) {
            console.error("Failed to load announcements:", err);
          }
        }

      } catch (err) {
        console.error("Failed to load group:", err);
        toast.error("Failed to load group");
        navigate("/user-dashboard");
      }
    };

    loadGroup();

    // --- Initialize socket ---
    const socket = io("http://localhost:5000", { 
      transports: ["websocket", "polling"],
      withCredentials: true 
    });
    socketRef.current = socket;
    socket.emit("join_group", parseInt(groupId));

    // --- Socket listeners ---
    socket.on("receive_message", (data) => {
      const { groupId: receivedGroupId, message } = data;
      if (parseInt(receivedGroupId) === parseInt(groupId)) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on("new_schedule", (newSchedule) => {
      if (newSchedule.groupId === parseInt(groupId)) {
        setEvents(prev => {
          if (prev.some(e => e.id === newSchedule.id)) return prev;
          return [...prev, {
            ...newSchedule,
            start: new Date(newSchedule.start),
            end: new Date(newSchedule.end),
            meetingType: (newSchedule.meetingType || "physical").toLowerCase(),
            meetingLink: newSchedule.meetingLink || null,
            color: "bg-yellow-100"
          }];
        });
      }
    });

    socket.on("newAnnouncement", (announcement) => {
      if (announcement.group_id === parseInt(groupId)) {
        setAnnouncements(prev => [announcement, ...prev]);
      }
    });

    socket.on("join_request_approved", ({ groupId: gid, userId: uid }) => {
      if (gid === parseInt(groupId) && uid === userId) {
        setUserStatus("approved");
      }
    });

    return () => {
      socket.emit("leave_group", parseInt(groupId));
      socket.disconnect();
    };
  }, [groupId, userId, userName, navigate]);


  const sendMessage = () => {
    if (!inputText.trim() && !fileInputRef.current?.files?.[0]) return;

    const msg = {
      groupId: parseInt(groupId),
      sender: userId,
      text: inputText.trim() || null,
      fileLink: null,
      time: new Date().toISOString()
    };

    socketRef.current.emit("send_message", msg);
    setInputText("");
  };

  // --- File upload ---
const handleFileUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await axios.post("http://localhost:5000/api/upload", formData);
    const msg = {
      groupId: parseInt(groupId),
      sender: userId,
      text: file.name,
      fileLink: res.data.fileUrl,
      time: new Date().toISOString()
    };
    socketRef.current.emit("send_message", msg);
    e.target.value = null;

    toast.success(`File "${file.name}" uploaded successfully!`);
  } catch {
    toast.error(`Failed to upload file "${file.name}".`);
  }
};

  // --- Join group ---
  const handleJoinGroup = async () => {
    try {
      await axios.post(`http://localhost:5000/api/group/join`, { groupId: parseInt(groupId), userId });
      setUserStatus("pending");
      toast.success("Join request sent! Waiting for creator approval.");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to send join request");
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();

    if (!title || !start || !end) return toast.error("Fill all required fields!");
    if (meetingType === "physical" && !location.trim()) {
      return toast.error("Please enter a location for physical meetings!");
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return toast.error("Invalid start or end date/time!");
    }
    if (startDate >= endDate) {
      return toast.error("End time must be after start time!");
    }

    try {
      const payload = {
        title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        location: meetingType === "physical" ? location : "Online",
        description,
        meetingType,
        meetingLink: meetingType === "online" ? meetingLink : null
      };

      const res = await axios.post(
        `http://localhost:5000/api/calendar/group/${groupId}`,
        payload
      );

      const newEvent = res.data.schedule;
      socketRef.current.emit("schedule_created", { ...newEvent, groupId: parseInt(groupId) });

      setTitle(""); setStart(""); setEnd(""); setLocation(""); setDescription(""); setMeetingType("physical"); setMeetingLink(newEvent.meetingLink || "");
      setShowModal(false);

      if (newEvent.meetingLink) {
        toast.success(`Study date created! Meeting link: ${newEvent.meetingLink}`);
      } else {
        toast.success("Study date created!");
      }

    } catch (err) {
      console.error("Schedule creation failed:", err);
      toast.error("Failed to create schedule. Check console for details.");
    }
  };

  const handlePostAnnouncement = async () => {
    try {
      await axios.post("http://localhost:5000/api/announcements/create", {
        groupId: group.id,
        userId: currentUser.id,
        title: announceTitle,
        description: announceDesc,
      });

      toast.success("Announcement posted successfully!");
      setShowAnnouncements(false);
      setAnnounceTitle("");
      setAnnounceDesc("");

    } catch (err) {
      console.error(err);
      toast.error("Failed to post announcement.");
    }
  };

useEffect(() => {
  setTimeout(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
  }, 0);
}, [messages]);

  if (!group) return <div className="flex items-center font-bold justify-center min-h-screen">Loading group...</div>;

return (
  <div className="flex h-[calc(100vh-12rem)] max-w-7xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-gray-300">
    {/* LEFT PANEL */}
    <div className="flex-1 flex flex-col">
      <div className="p-8 border-b">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-[#800000] leading-tight">{group.group_name}</h1>
            <p className="text-gray-700 mt-2 text-base leading-relaxed">{group.description}</p>
          </div>
          <span className="bg-yellow-400 text-[#800000] px-6 py-3 rounded-full font-semibold text-lg">{group.topic}</span>
        </div>

        {/* Members Section */}
        <div className="flex flex-col gap-2">
          {/* Member usernames */}
          <div className="flex flex-wrap gap-3 mb-3">
            {group.members?.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium"
              >
                {m.username}
              </div>
            ))}
          </div>

          {/* Leave Group Button */}
          <div className="flex gap-2 -mt-3 justify-end">
          <div className="flex items-center gap-2 text-sm text-gray-800 mb-2 mr-28">
            <UserGroupIcon className="w-7 h-7 text-[#800000]" />
            <span className="font-medium">Members ({group.current_members})</span>
          </div>
            <button
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700"
              onClick={() => {
                const LeaveConfirm = ({ closeToast }) => (
                  <div className="flex flex-col gap-2">
                    <span>Are you sure you want to leave this group?</span>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => closeToast()}
                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          closeToast();
                          try {
                            await axios.post("http://localhost:5000/api/group/leave", {
                              userId: currentUser.id,
                              groupId: group.id,
                            });
                            toast.success("You have left the group.");
                            navigate("/user-dashboard");
                          } catch (err) {
                            console.error("Leave group failed:", err);
                            toast.error("Failed to leave the group. Please try again.");
                          }
                        }}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-sm"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                );

                toast.info(<LeaveConfirm />, {
                  autoClose: false,
                  closeButton: false,
                  closeOnClick: false,
                });
              }}
            >
              Leave Group
            </button>
          <button 
            onClick={() => setShowAnnouncements(true)} 
            className="bg-[#b61818] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#600000] flex items-center gap-2"
          >
            <BellAlertIcon className="w-5 h-5" /> Post Announcements
          </button>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-[#800000] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#600000] flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" /> Schedule Meeting
          </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto scrollbar-hide">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-[#800000] tracking-wide">
            Study Dates and Announcements
          </h2>
        </div>

          <div className="space-y-4">
            {events.length === 0 && announcements.length === 0 ? (
              <p className="text-center text-gray-500 py-12 text-base">
                No upcoming study dates or announcements
              </p>
            ) : (
              (() => {
                const combinedEvents = [
                  // Real study meetings
                  ...events.map(e => ({
                    ...e,
                    isAnnouncement: false,
                    meetingType: (e.meetingType || "physical").toLowerCase(),
                    meetingLink: e.meetingLink || null,
                    color: "bg-green-100",
                  })),

                  // Announcements
                  ...announcements.map(a => ({
                    title: a.title,
                    start: new Date(a.created_at),
                    end: new Date(a.created_at),
                    color: "bg-blue-100",
                    description: a.description || "",
                    meetingType: null,
                    meetingLink: null,
                    location: "Announcement",
                    isAnnouncement: true,
                  }))
                ].sort((a, b) => a.start - b.start);

                console.log("Combined events for debugging:", combinedEvents); // Debug

                return combinedEvents.map((event, i) => (
                  <div
                    key={i}
                    className={`${event.color} p-3 rounded-lg border border-gray-500 flex flex-col gap-2 cursor-pointer hover:shadow-md`}
                    onClick={() => event.isAnnouncement && setSelectedAnnouncement(event)}
                  >
                    <h3 className="font-semibold text-[#800000] text-lg">{event.title}</h3>
                    <p className="text-sm text-gray-700 tracking-wide">
                      {event.start.toDateString()} •{" "}
                      {event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                      {event.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>

          {event.meetingType === "online" && event.meetingLink ? (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="font-medium">Online Meeting:</span>

              <button
                type="button"
                onClick={() => window.open(event.meetingLink, "_blank")}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-xs"
              >
                Join Meeting
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(event.meetingLink);
                  toast.success("Link copied to clipboard!");
                }}
                className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 text-xs"
              >
                Copy Link
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-600">{event.location}</p>
          )}
                    {/* Description */}
                    {event.description && !event.isAnnouncement && (
                      <p className="text-sm text-gray-700 leading-relaxed">
                        <strong>{event.description}</strong>
                      </p>
                    )}
                  </div>
                ));
              })()
            )}
          </div>

        {/* Announcement Modal */}
        {selectedAnnouncement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-11/12 md:w-1/2 p-6 relative max-h-[80vh] overflow-y-auto">
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                onClick={closeModal}
              >
                ✕
              </button>
              <h2 className="text-xl font-bold text-[#800000] mb-4">
                {selectedAnnouncement.title}
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedAnnouncement.description}</p>
              <p className="text-xs text-gray-400 mt-4">
                {selectedAnnouncement.start.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* RIGHT PANEL: Chat */}
    <aside className="w-96 border-l border-gray-300 bg-gray-50 flex flex-col">
      <div className="p-4 border-b bg-white flex items-center gap-3">
        <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-[#800000]" />
        <h3 className="font-semibold text-[#800000] text-base tracking-wide">Group Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === userId;
          const isLast = i === messages.length - 1;
          return (
            <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <span className="text-xs text-gray-500 mb-1 font-medium">{msg.sender_name}</span>
              <div className={`px-4 py-2 rounded-2xl max-w-xs ${isMe ? "bg-[#800000] text-white" : "bg-gray-200"} text-sm leading-snug`}>
                {msg.fileLink ? (
                  <a href={msg.fileLink} target="_blank" rel="noopener noreferrer" className="underline flex items-center gap-1">
                    <PaperClipIcon className="w-4 h-4" /> {msg.text}
                  </a>
                ) : (
                  msg.text
                )}
                <p className="text-xs opacity-70 mt-1">
                  {msg.time ? new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t flex gap-2">
        <button onClick={() => fileInputRef.current.click()} className="p-2 hover:bg-gray-200 rounded">
          <PaperClipIcon className="w-6 h-6 text-gray-600" />
        </button>
        <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#800000] outline-none text-sm"
        />
        <button onClick={sendMessage} className="bg-[#800000] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#600000] text-sm">Send</button>
      </div>
    </aside>

{/* Schedule Modal — Perfectly Centered */}
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-8 w-96 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[#800000] tracking-wide">Schedule Meeting</h2>
        <button onClick={() => setShowModal(false)}>
          <XMarkIcon className="w-6 h-6 text-gray-500 hover:text-red-600" />
        </button>
      </div>

      <form onSubmit={handleCreateSchedule} className="space-y-4 text-sm">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full p-3 border rounded-lg"
          required
        />

        <input
          type="datetime-local"
          value={start}
          onChange={e => setStart(e.target.value)}
          className="w-full p-3 border rounded-lg"
          required
        />

        <input
          type="datetime-local"
          value={end}
          onChange={e => setEnd(e.target.value)}
          className="w-full p-3 border rounded-lg"
          required
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full p-3 border rounded-lg h-24"
        ></textarea>

{/* Meeting Type Selector */}
<div className="flex items-center gap-4">
  <label className="text-gray-700 font-medium">Meeting Type:</label>
  <select
    value={meetingType}
    onChange={e => setMeetingType(e.target.value)}
    className="border p-2 rounded-lg text-sm flex-1"
  >
    <option value="physical">Physical / In-person</option>
    <option value="online">Online / Virtual</option>
  </select>
</div>

{/* Location (required if physical) */}
{meetingType === "physical" && (
  <input
    type="text"
    placeholder="Location (required if physical)"
    value={location}
    onChange={e => setLocation(e.target.value)}
    className="w-full p-3 border rounded-lg"
    required
  />
)}

{/* Meeting Link (display only if online) */}
{meetingType === "online" && (
  <div className="flex items-center gap-2 text-sm text-gray-700">
    <span className="font-medium">Online Meeting:</span>
    <input
      type="text"
      readOnly
      value={meetingLink || "Generating link..."}
      className="flex-1 border p-2 rounded text-xs"
    />
    {meetingLink && (
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(meetingLink)}
        className="bg-gray-300 px-2 py-1 rounded hover:bg-gray-400 text-xs"
      >
        Copy
      </button>
    )}
  </div>
)}
        <button
          type="submit"
          className="w-full bg-[#800000] text-white py-3 rounded-lg font-semibold hover:bg-[#600000] text-sm"
        >
          Create Study Date
        </button>
      </form>
    </div>
  </div>
)}

{/* Announcements Modal */}
{showAnnouncementsModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-8 w-96 shadow-2xl">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[#800000] tracking-wide">
          Post Announcement
        </h2>
        <button onClick={() => setShowAnnouncements(false)}>
          <XMarkIcon className="w-6 h-6 text-gray-500 hover:text-red-600" />
        </button>
      </div>

      {/* Form */}
      <input
        type="text"
        value={announceTitle}
        onChange={(e) => setAnnounceTitle(e.target.value)}
        placeholder="Announcement Title"
        className="w-full border px-4 py-2 rounded-lg mb-4"
      />
      <textarea
        value={announceDesc}
        onChange={(e) => setAnnounceDesc(e.target.value)}
        placeholder="Write your announcement..."
        className="w-full border px-4 py-2 rounded-lg mb-4 h-28"
      />

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-2">
        <button
          onClick={() => setShowAnnouncements(false)}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          Cancel
        </button>

        <button
          onClick={handlePostAnnouncement}
          className="px-4 py-2 rounded-lg bg-[#800000] text-white hover:bg-[#600000]"
        >
          Post
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}