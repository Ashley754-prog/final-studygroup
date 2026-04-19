import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

export default function JoinRequestRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        
        // Check if user is authenticated by trying to get user info
        const token = localStorage.getItem("token");
        
        if (!token) {
          // No token found, redirect to login
          const groupId = searchParams.get("groupId");
          const loginUrl = groupId 
            ? `/login?redirect=/inbox&groupId=${groupId}`
            : "/login?redirect=/inbox";
          navigate(loginUrl);
          return;
        }

        // Verify token is valid
        const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data) {
          // User is authenticated, redirect to inbox
          navigate("/inbox");
        } else {
          // Invalid token, redirect to login
          const groupId = searchParams.get("groupId");
          const loginUrl = groupId 
            ? `/login?redirect=/inbox&groupId=${groupId}`
            : "/login?redirect=/inbox";
          navigate(loginUrl);
        }
      } catch (err) {
        // Error checking auth, redirect to login
        console.error("Auth check failed:", err);
        const groupId = searchParams.get("groupId");
        const loginUrl = groupId 
          ? `/login?redirect=/inbox&groupId=${groupId}`
          : "/login?redirect=/inbox";
        navigate(loginUrl);
      } finally {
        setChecking(false);
      }
    };

    checkAuthAndRedirect();
  }, [navigate, searchParams]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">Authentication check failed</p>
          <button 
            onClick={() => window.location.href = "/login"}
            className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return null; // Will redirect immediately
}
