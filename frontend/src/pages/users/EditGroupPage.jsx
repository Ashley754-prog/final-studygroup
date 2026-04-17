import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function EditGroupPage() {
  const { groupId } = useParams(); // Now grabs :groupId from route
  const navigate = useNavigate();
  const location = useLocation();
  const adminRemarks = location.state?.remarks || null;

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?.id;

  const [group, setGroup] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [course, setCourse] = useState("");
  const [topic, setTopic] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [size, setSize] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch group data on mount
  useEffect(() => {
    if (!userId || !groupId) return;

    const fetchGroup = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/group/${groupId}`);
        const data = res.data.data;

        if (!data) {
          toast.error("Group not found");
          navigate("/group-creator");
          return;
        }

        if (data.created_by !== userId) {
          toast.error("You are not authorized to edit this group");
          navigate("/group-creator");
          return;
        }

        setGroup(data);
        setGroupName(data.group_name);
        setDescription(data.description);
        setCourse(data.course);
        setTopic(data.topic);
        setLocationInput(data.location);
        setSize(data.size);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load group info");
        navigate("/group-creator");
      }
    };

    fetchGroup();
  }, [groupId, userId, navigate]);

  // Submit updated group
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!groupName || !description || !course || !topic || !locationInput || !size) {
    toast.error("All fields are required");
    return;
  }

  try {
    const payload = {
      group_name: groupName.trim(),
      description: description.trim(),
      course: course.trim(),
      topic: topic.trim(),
      location: locationInput.trim(),
      size: parseInt(size) || 1,
      userId: userId, // needed for backend authorization
    };

    // PUT request to update group
    const res = await axios.put(`http://localhost:5000/api/group/${groupId}`, payload);

    if (res.data.success) {
      toast.success("Group updated! Waiting for admin approval.");
      navigate("/group-creator"); // redirect to Group Creator page
    } else {
      toast.error(res.data.message || "Update failed");
    }
  } catch (err) {
    console.error(err);
    // Handles 404 or other errors from backend
    if (err.response && err.response.status === 404) {
      toast.error("Group not found");
      navigate("/group-creator");
    } else if (err.response && err.response.data?.message) {
      toast.error(err.response.data.message);
    } else {
      toast.error("Failed to update group");
    }
  }
};


  if (loading) return <div className="flex-center min-h-screen">Loading group info...</div>;

  return (
    <div className="flex h-[calc(100vh-180px)] max-w-3xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 shadow-2xl rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex-1 p-10 flex flex-col overflow-y-auto scrollbar-hide">
        {/* Page Title */}
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold text-[#800000] tracking-tight">
              Edit Declined Study Group
            </h1>
            <p className="text-gray-600 mt-2 text-sm">
              Update the details based on admin remarks and submit for approval.
            </p>
          </div>
        </div>

        {/* Admin Remarks */}
        {adminRemarks && (
          <div className="mb-6 bg-red-50 border border-red-300 text-red-700 rounded-xl p-4 italic">
            <strong>Admin Remarks:</strong> "{adminRemarks}"
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input label="Group Name" value={groupName} onChange={setGroupName} placeholder="Calculus Review Group" />
            <Textarea label="Description" value={description} onChange={setDescription} placeholder="Describe the study group..." />
            <Input label="Course" value={course} onChange={setCourse} placeholder="Math 143" />
            <Input label="Topic" value={topic} onChange={setTopic} placeholder="Chapter 5: Algebraic Expressions" />
            <Input label="Location" value={locationInput} onChange={setLocationInput} placeholder="Library Room 2" />
            <Input label="Group Size" value={size} onChange={setSize} type="number" placeholder="8" />

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-[#800000] to-[#6b0000] text-white text-lg rounded-xl font-bold shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Submit for Approval
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Reusable Input Component
function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="text-gray-700 font-medium text-sm">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 p-3 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-[#FFD700] focus:bg-white transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}

// Reusable Textarea Component
function Textarea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-gray-700 font-medium text-sm">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 p-3 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-[#FFD700] focus:bg-white transition-all h-28 resize-none"
        placeholder={placeholder}
      />
    </div>
  );
}
