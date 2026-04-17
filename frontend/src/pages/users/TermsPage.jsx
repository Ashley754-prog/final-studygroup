export default function TermsPage() {
  return (
      <div className="flex h-[calc(100vh-200px)] max-w-7xl mx-auto bg-white shadow-xl rounded-xl border border-gray-300 overflow-hidden">
        <div className="flex-1 bg-white shadow-xl rounded-xl border border-gray-300 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-hide p-8 lg:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
              <header className="border-b border-gray-200 pb-6">
                <h1 className="text-3xl font-bold text-maroon">Terms of Service</h1>
                <p className="text-sm text-gray-600 mt-2">Last updated: November 11, 2025</p>
              </header>

              <section className="space-y-6 text-gray-700 leading-relaxed">
                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">1. Acceptance of Terms</h2>
                  <p>
                    By accessing or using <strong>Crimsons Study Squad</strong> ("the Platform"), you agree to comply with and be bound by these Terms of Service. These terms apply to all users, including students, group creators, and visitors.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">2. Eligibility</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>You must be a currently enrolled student at <strong>Western Mindanao State University (WMSU)</strong>.</li>
                    <li>Registration is allowed only with an official <strong>@wmsu.edu.ph</strong> email address.</li>
                    <li>Users under 18 must have parental/guardian consent to use the Platform.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">3. Account Responsibilities</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                    <li>Notify us immediately of any unauthorized use of your account.</li>
                    <li>You must provide accurate and complete information during registration and keep it updated.</li>
                    <li>Impersonating another student or using false information will result in immediate suspension.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">4. Acceptable Use</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>The Platform is for <strong>academic collaboration only</strong> — study groups, notes sharing, and scheduling.</li>
                    <li>Prohibited: harassment, bullying, hate speech, spam, or sharing of illegal/offensive content.</li>
                    <li>Respectful, inclusive, and constructive communication is required in all group interactions.</li>
                    <li>No commercial use, advertising, or solicitation is permitted.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">5. Group Management</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Group creators are responsible for moderating their group’s content and members.</li>
                    <li>Groups must have clear, course-related purposes (e.g., "Math 146 Study Group").</li>
                    <li>Maximum group size is 10 members unless approved by admin.</li>
                    <li>Inactive groups (no activity for 60 days) may be archived.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">6. Intellectual Property</h2>
                  <p>
                    You retain ownership of content you upload (notes, schedules, etc.), but grant the Platform a non-exclusive, royalty-free license to display and distribute it within study groups.
                  </p>
                  <p className="mt-2">
                    Do not upload copyrighted material without permission.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">7. Termination & Enforcement</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>We reserve the right to suspend or terminate accounts for violations of these terms.</li>
                    <li>Repeated offenses may lead to permanent bans from the Platform.</li>
                    <li>Admins may remove any content or group deemed harmful or inappropriate.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">8. Limitation of Liability</h2>
                  <p>
                    The Platform is provided "as is". We do not guarantee uninterrupted access or accuracy of user-generated content. WMSU and the development team are not liable for any academic outcomes resulting from use of the Platform.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">9. Changes to Terms</h2>
                  <p>
                    We may update these terms periodically. Continued use of the Platform after changes constitutes acceptance of the new terms.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-maroon mb-3">10. Contact Us</h2>
                  <p>
                    For questions about these terms, email: <a href="mailto:support@studysquad.wmsu.edu.ph" className="font-medium hover:underline">support@studysquad.wmsu.edu.ph</a>
                  </p>
                </div>
              </section>

              <footer className="mt-12 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                  By continuing to use Crimsons Study Squad, you acknowledge that you have read, understood, and agree to these Terms of Service.
                </p>
              </footer>
            </div>
          </div>
        </div>
      </div>
  );
}