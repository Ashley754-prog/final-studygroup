import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserGroupIcon } from "@heroicons/react/24/outline";

export default function MyStudyGroupsPage() {
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        // Fetch groups the user joined
        const joinedRes = await axios.get(
          `http://localhost:5000/api/group/my-joined/${user.id}`
        );
        const joinedGroups = joinedRes.data.data || [];

        // Fetch groups the user created
        const createdRes = await axios.get(
          `http://localhost:5000/api/group/my-groups/${user.id}`
        );
        const createdGroups = createdRes.data.data || [];

        // Merge, avoid duplicates
        const allGroups = [...joinedGroups];
        createdGroups.forEach((g) => {
          if (!allGroups.find((grp) => grp.id === g.id)) {
            allGroups.push(g);
          }
        });

        setGroups(allGroups);
      } catch (err) {
        console.error(err);
      }
    };

    if (user.id) fetchGroups();
  }, [user.id]);

  return (
    <div className="flex h-[calc(100vh-200px)] max-w-7xl mx-auto bg-white border border-gray-300 shadow-xl rounded-xl overflow-hidden">
      <div className="flex-1 flex flex-col p-12 overflow-y-auto scrollbar-hide">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-maroon flex items-center gap-2">
            <UserGroupIcon className="w-7 h-7 text-gold" />
            My Study Groups
          </h1>
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-gray-100 rounded-full p-8 mb-6">
              <UserGroupIcon className="w-16 h-16 text-gray-400" />
            </div>
            <p className="text-xl text-gray-600 font-medium">
              You haven't joined or created any groups yet.
            </p>
            <p className="text-gray-500 mt-2">
              Explore and join study groups to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map((group, index) => {
              const accentColors = [
                "border-l-amber-400",
                "border-l-sky-400",
                "border-l-purple-400",
                "border-l-emerald-400",
                "border-l-rose-400",
                "border-l-indigo-400",
              ];
              const accentColor = accentColors[index % accentColors.length];

              return (
                <div
                  key={group.id}
                  className={`
                    bg-white rounded-xl border-2 border-gray-200 
                    ${accentColor} border-l-8 
                    shadow-lg hover:shadow-2xl 
                    transition-all duration-300 hover:-translate-y-1 
                    p-6 flex flex-col justify-between cursor-pointer
                  `}
                  onClick={() => navigate(`/group/${group.id}`)}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-maroon line-clamp-2 pr-4">
                        {group.group_name}
                      </h2>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-800">Course:</span>{" "}
                        {group.course}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-800">Topic:</span>{" "}
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {group.topic}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex -space-x-3">
                      {[...Array(Math.min(group.current_members, 5))].map((_, i) => (
                        <div
                          key={i}
                          className="w-9 h-9 rounded-full bg-gradient-to-br from-maroon to-red-600 border-2 border-white shadow"
                        />
                      ))}
                      {group.current_members > 5 && (
                        <div className="w-9 h-9 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-700">
                            +{group.current_members - 5}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-maroon">{group.current_members}</p>
                      <p className="text-xs uppercase tracking-wider text-gray-500">
                        Members
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
