import { useNavigate } from "react-router-dom";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
      <div className="flex h-[calc(100vh-200px)] max-w-7xl mx-auto bg-white shadow-xl rounded-xl border border-gray-300 overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row gap-0">
          <main className="flex-1 bg-white shadow-xl rounded-l-xl border border-gray-300 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto scrollbar-hide p-8 lg:p-10">
              <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-maroon mb-6">About Crimsons Study Squad</h1>

                <section className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    Crimsons Study Squad is a dedicated platform built exclusively for
                    <span className="font-semibold text-maroon"> WMSU students</span> to connect,
                    collaborate, and excel academically through structured study groups.
                  </p>

                  <p>
                    Whether you're preparing for midterms, tackling complex projects, or mastering
                    challenging subjects, our platform makes it easy to
                    <span className="font-medium"> find, join, or create</span> the perfect study group.
                  </p>

                  <p>
                    We believe in the power of
                    <span className="font-semibold text-gold"> peer-to-peer learning</span> — when
                    students work together, everyone wins.
                  </p>
                </section>

                <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h2 className="text-xl font-semibold text-maroon mb-3">Our Mission</h2>
                  <p className="text-gray-700">
                    To foster a supportive, collaborative, and academically thriving community at
                    Western Mindanao State University by empowering students with tools to study
                    smarter, not harder.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-maroon">Key Features</h2>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-gold mt-1">•</span>
                      <span>Search and filter study groups by course, subject, location, or availability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold mt-1">•</span>
                      <span>Create your own study group with custom size, schedule, and location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold mt-1">•</span>
                      <span>Real-time group capacity tracking and instant join/leave functionality</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold mt-1">•</span>
                      <span>Personal dashboard showing your courses and created groups</span>
                    </li>
                  </ul>
                </section>

                <section className="bg-maroon/5 p-6 rounded-xl border border-maroon/20">
                  <h2 className="text-xl font-semibold text-maroon mb-3">Academic Project</h2>
                  <p className="text-gray-700">
                    This platform was developed as a capstone project for
                    <span className="font-medium"> IT 312 – Systems Integration & Architecture</span>
                    at Western Mindanao State University.
                  </p>
                  <p className="text-sm text-gray-600 mt-3">
                    It demonstrates full-stack web development, responsive design, real-time data handling,
                    and seamless integration of modern frontend and backend technologies.
                  </p>
                </section>

                <section className="text-center py-6">
                  <p className="text-lg font-medium text-maroon">
                    Study together. Succeed together.
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Proudly built for and by Crimsons.
                  </p>
                </section>
              </div>
            </div>
          </main>

          <aside className="w-full lg:w-80 bg-white rounded-r-xl shadow-xl border border-l-0 border-gray-300 p-8 flex flex-col gap-6 overflow-y-auto">
            <div className="bg-gradient-to-br from-maroon/10 to-gold/10 p-6 rounded-xl border border-maroon/20">
              <h3 className="font-bold text-maroon text-lg mb-3">Quick Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Groups</span>
                  <span className="font-semibold text-maroon">127</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Students Connected</span>
                  <span className="font-semibold text-maroon">890+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Courses Covered</span>
                  <span className="font-semibold text-maroon">42</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-xl border border-gray-300">
              <h3 className="font-semibold text-maroon text-lg mb-3">Need Help?</h3>
              <p className="text-sm text-gray-700 mb-4">
                Having trouble finding a group or creating one?
              </p>
              <button
                className="w-full bg-maroon text-white py-2.5 rounded-lg hover:brightness-110 transition text-sm font-medium"
                onClick={() => navigate("/contacts")}
              >
                Contact Support
              </button>
            </div>
          </aside>
        </div>
      </div>
  );
}