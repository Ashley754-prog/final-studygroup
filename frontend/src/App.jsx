import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RealtimeProvider } from "./context/RealtimeContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { validateUserSession, refreshSession } from "./utils/auth.js";
import { useEffect } from "react";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage.jsx";
import CreateAccount from "./pages/auth/CreateAccount.jsx";
import VerificationPage from "./pages/auth/VerificationPage.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";

// User Pages
import Dashboard from "./pages/users/UserDashboard.jsx";
import InboxPage from "./pages/users/InboxPage.jsx";
import CreateGroupPage from "./pages/users/CreateGroupPage.jsx";
import GroupCreator from "./pages/users/GroupCreator.jsx";
import EditGroupPage from "./pages/users/EditGroupPage.jsx";
import JoinViewPage from "./pages/users/JoinViewPage.jsx";
import MyStudyGroupsPage from "./pages/users/MyStudyGroupsPage.jsx";
import ProfilePage from "./pages/users/ProfilePage.jsx";
import AboutPage from "./pages/users/AboutPage.jsx";
import ContactsPage from "./pages/users/ContactsPage.jsx";
import TermsPage from "./pages/users/TermsPage.jsx";
import PoliciesPage from "./pages/users/PoliciesPage.jsx";
import JoinRequestRedirect from "./pages/JoinRequestRedirect.jsx";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import ManageGroups from "./pages/admin/ManageGroups.jsx";
import AdminSettings from "./pages/admin/Settings.jsx";

// Layouts & Routes
import AdminLayout from "./layouts/AdminLayout.jsx";
import PageLayout from "./layouts/PageLayout.jsx";
import AdminPrivateRoute from "./routes/AdminPrivateRoute.jsx";

function App() {
  return (
    <RealtimeProvider>
      <NotificationProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        <Router>
          <Routes>
            {/* PUBLIC AUTH ROUTES */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<CreateAccount />} />
            <Route path="/verify" element={<VerificationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/join-request-redirect" element={<JoinRequestRedirect />} />

          {/* USER PROTECTED ROUTES (with PageLayout) */}
          <Route element={<PageLayout />}>
            <Route path="/user-dashboard" element={<Dashboard />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/create-group" element={<CreateGroupPage />} />
            <Route path="/group-creator" element={<GroupCreator />} />
            <Route path="/edit-group/:groupId" element={<EditGroupPage />} />
            <Route path="/my-study-groups" element={<MyStudyGroupsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/policies" element={<PoliciesPage />} />
            

            {/* Dynamic Group View */}
            <Route path="/group/:groupId" element={<JoinViewPage />} />
          </Route>

          {/* ADMIN PROTECTED ROUTES */}
          <Route
            path="/admin"
            element={
              <AdminPrivateRoute>
                <AdminLayout />
              </AdminPrivateRoute>
            }
          >
            <Route index element={<AdminDashboard />} /> {/* ← FIX #1: /admin → dashboard */}
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="manage-users" element={<ManageUsers />} />
            <Route path="manage-groups" element={<ManageGroups />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* 404 Fallback (Optional but PRO) */}
          <Route path="*" element={
            <div className="flex items-center justify-center h-screen bg-gray-100">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-[#800000]">404</h1>
                <p className="text-xl text-gray-600 mt-4">Page Not Found</p>
                <button 
                  onClick={() => window.history.back()} 
                  className="mt-6 px-6 py-3 bg-[#800000] text-white rounded-lg hover:bg-[#600000]"
                >
                  Go Back
                </button>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </NotificationProvider>
  </RealtimeProvider>
  );
}

export default App;