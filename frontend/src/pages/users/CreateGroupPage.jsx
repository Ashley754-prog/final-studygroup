import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CreateGroupPage() {
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [course, setCourse] = useState("");
  const [topic, setTopic] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to create a group");
      return;
    }

    const payload = {
      group_name: groupName.trim(),
      description: description.trim(),
      created_by: user.id,
      course: course.trim(),
      topic: topic.trim(),
      location: location.trim(),
      size: parseInt(size) || 1,
    };

    if (
      !payload.group_name ||
      !payload.description ||
      !payload.course ||
      !payload.topic ||
      !payload.location
    ) {
      toast.error("All fields are required!");
      return;
    }

    console.log("Payload being sent:", payload);

    try {
      const response = await api.post("http://localhost:5000/api/group/create", payload);
      toast.success(response.data.message || "Group created successfully!");

      // Reset form
      setGroupName("");
      setDescription("");
      setCourse("");
      setTopic("");
      setLocation("");
      setSize("");

      navigate("/group-creator", { state: { currentUserId: user.id } });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

return (
  <div className="flex h-[calc(100vh-180px)] max-w-3xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 shadow-2xl rounded-2xl border border-gray-200 overflow-hidden">
    <div className="flex-1 p-10 flex flex-col overflow-y-auto scrollbar-hide">
      {/* Page Title */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-[#800000] tracking-tight">
          Create a Study Group
        </h1>
        <p className="text-gray-600 mt-2 text-sm">
          Fill in the details below to start your new study group.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <form className="space-y-6" onSubmit={handleSubmit}>

          {/* Group Name */}
          <div>
            <label className="text-gray-700 font-medium text-sm">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-[#FFD700] focus:bg-white transition-all"
              placeholder="e.g., Calculus Review Group"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-gray-700 font-medium text-sm">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-[#FFD700] focus:bg-white transition-all h-28 resize-none"
              placeholder="Describe what this study group is about..."
            />
          </div>

          {/* Course */}
          <div>
            <label className="text-gray-700 font-medium text-sm">Course</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-[#FFD700] focus:bg-white transition-all"
              placeholder="e.g., Math 143"
            />
          </div>

          {/* Topic */}
          <div>
            <label className="text-gray-700 font-medium text-sm">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-[#FFD700] focus:bg-white transition-all"
              placeholder="e.g., Chapter 5: Algebraic Expressions"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-gray-700 font-medium text-sm">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-[#FFD700] focus:bg-white transition-all"
              placeholder="e.g., Library Room 2"
            />
          </div>

          {/* Group Size */}
          <div>
            <label className="text-gray-700 font-medium text-sm">Group Size</label>
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-[#FFD700] focus:bg-white transition-all"
              placeholder="e.g., 8"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-[#800000] to-[#6b0000] text-white text-lg rounded-xl font-bold shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Create Group
          </button>

        </form>
      </div>
    </div>
  </div>
);

}
