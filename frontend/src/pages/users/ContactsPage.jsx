export default function ContactsPage() {
  return (
      <div className="flex h-[calc(100vh-200px)] max-w-7xl mx-auto bg-white shadow-xl rounded-xl border border-gray-300 overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row gap-0">
          <main className="flex-1 bg-white shadow-xl rounded-l-xl border border-gray-300 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto scrollbar-hide p-8 lg:p-10">
              <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-maroon mb-6">Contact Us</h1>

                <section className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    We're here to support you every step of the way. Whether you have a question about
                    <span className="font-medium"> creating a study group</span>, need help with
                    <span className="font-medium"> joining one</span>, or want to report an issue — reach out!
                  </p>

                  <p>
                    Our team at <span className="font-semibold text-maroon">Crimsons Study Squad</span> is
                    committed to making your study experience seamless and productive.
                  </p>
                </section>

                <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h2 className="text-xl font-semibold text-maroon mb-4">Get in Touch</h2>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="text-gold">Email:</span>
                      <a href="mailto:studysquad@wmsu.edu.ph" className="font-medium hover:underline">
                        studysquad@wmsu.edu.ph
                      </a>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gold">Location:</span>
                      <span>Western Mindanao State University, Normal Road, Baliwasan, Zamboanga City</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gold">Office:</span>
                      <span>IT Building, Room 312 (Systems Integration Lab)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gold">Office Hours:</span>
                      <span>Monday – Friday • 8:00 AM – 5:00 PM</span>
                    </li>
                  </ul>
                </section>
              </div>
            </div>
          </main>

          <aside className="w-full lg:w-80 bg-white rounded-r-xl shadow-xl border border-l-0 border-gray-300 p-8 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
            <div className="bg-gradient-to-br from-maroon/10 to-gold/10 p-6 rounded-xl border border-maroon/20">
              <h3 className="font-bold text-maroon text-lg mb-4">Common Questions</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li>
                  <strong>How do I create a group?</strong>
                  <p className="text-xs mt-1">Go to Dashboard → Click "+ Create Group"</p>
                </li>
                <li>
                  <strong>Can I join multiple groups?</strong>
                  <p className="text-xs mt-1">Yes! Join as many as you need.</p>
                </li>
                <li>
                  <strong>Is this free?</strong>
                  <p className="text-xs mt-1">100% free for all WMSU students.</p>
                </li>
              </ul>
            </div>

            <div className="bg-gray-100 p-6 rounded-xl border border-gray-300">
              <h3 className="font-semibold text-maroon text-lg mb-3">Emergency Support</h3>
              <p className="text-sm text-gray-700 mb-4">
                For urgent technical issues (e.g., login problems during exams):
              </p>
              <div className="space-y-2">
                <p className="text-xs">
                  <strong>Call:</strong> (062) 991-1234
                </p>
                <p className="text-xs">
                  <strong>SMS:</strong> 0917-555-0192
                </p>
              </div>
            </div>

            <div className="bg-gold/10 p-6 rounded-xl border border-gold/30 text-center">
              <p className="text-xs text-gray-600 mt-1">
                Your success is our priority.
              </p>
            </div>
          </aside>
        </div>
      </div>
  );
}