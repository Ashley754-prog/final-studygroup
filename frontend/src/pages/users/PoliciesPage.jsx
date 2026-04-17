export default function PoliciesPage() {
  return (
      <div className="flex h-[calc(100vh-200px)] max-w-7xl mx-auto bg-white shadow-xl rounded-xl border border-gray-300 overflow-hidden">
        <div className="flex-1 bg-white shadow-xl rounded-xl border border-gray-300 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-hide p-8 lg:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
              <header className="border-b border-gray-200 pb-6">
                <h1 className="text-3xl font-bold text-maroon">Privacy & Data Policies</h1>
                <p className="text-sm text-gray-600 mt-2">Effective: November 11, 2025</p>
              </header>

              <section className="space-y-6 text-gray-700 leading-relaxed">
                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">1. Our Commitment to Privacy</h2>
                  <p>
                    At <strong>Crimsons Study Squad</strong>, we prioritize your privacy. This policy explains how we collect, use, store, and protect your personal information within the Western Mindanao State University ecosystem.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">2. Information We Collect</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Account Data:</strong> Full name, WMSU student ID, official email (@wmsu.edu.ph), enrolled courses.</li>
                    <li><strong>Usage Data:</strong> Groups joined/created, messages sent, login times, device type.</li>
                    <li><strong>Content Data:</strong> Study notes, schedules, group descriptions you upload.</li>
                    <li><strong>Technical Data:</strong> IP address, browser type, access logs (for security).</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">3. How We Use Your Data</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>To verify your identity and WMSU enrollment status.</li>
                    <li>To enable group creation, joining, and collaboration features.</li>
                    <li>To send important notifications (e.g., group updates, policy changes).</li>
                    <li>To improve platform performance and user experience.</li>
                    <li>To detect and prevent abuse, spam, or security threats.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">4. Data Storage & Security</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All data is stored on <strong>secure WMSU-managed servers</strong> located in the Philippines.</li>
                    <li>Passwords are hashed using industry-standard encryption (bcrypt).</li>
                    <li>Access is restricted to authorized IT personnel and developers only.</li>
                    <li>Regular security audits and penetration testing are conducted.</li>
                    <li>HTTPS encryption is enforced on all connections.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">5. Data Sharing & Disclosure</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>We do not sell, trade, or share</strong> your data with third parties.</li>
                    <li>Data may be accessed by WMSU faculty advisors for academic oversight.</li>
                    <li>Group members can see your name and enrolled courses within shared groups.</li>
                    <li>We may disclose data if required by law or university policy.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">6. Your Rights</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Access and download a copy of your data at any time.</li>
                    <li>Request correction of inaccurate information.</li>
                    <li>Request deletion of your account and all associated data (subject to retention policies).</li>
                    <li>Opt out of non-essential notifications.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">7. Data Retention</h2>
                  <p>
                    Your data is retained for the duration of your enrollment at WMSU. After graduation or withdrawal:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                    <li>Account data is anonymized after <strong>1 year</strong> of inactivity.</li>
                    <li>Academic collaboration content may be archived for research purposes (with identifiers removed).</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">8. Cookies & Tracking</h2>
                  <p>
                    We use essential cookies for login sessions and security. No third-party analytics or advertising trackers are used.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">9. Children's Privacy</h2>
                  <p>
                    The Platform is not intended for users under 13. We do not knowingly collect data from children.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">10. Contact Us</h2>
                  <p>
                    For privacy concerns or data requests, email: <a href="mailto:privacy@studysquad.wmsu.edu.ph" className="font-medium hover:underline">privacy@studysquad.wmsu.edu.ph</a>
                  </p>
                </div>
              </section>

              <footer className="mt-12 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                  Your trust matters. We are committed to protecting your privacy within the WMSU community.
                </p>
              </footer>
            </div>
          </div>
        </div>
      </div>
  );
}