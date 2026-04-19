import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { loginUser } from "../../utils/auth";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import API_BASE_URL from "../../config/api.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const emailFromURL = searchParams.get("email");
    if (emailFromURL) {
      setEmail(emailFromURL);

      (async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/check-google?email=${encodeURIComponent(emailFromURL)}`);
          const data = await res.json();
          if (data.isGoogleOnly) {
            toast.error("This account was created using Google Sign-In. You cannot log in with a password. Please use Google login.");
          }
        } catch (err) {
          console.error("Error checking Google account:", err);
        }
      })();
    }
  }, [searchParams]);


const handleLogin = async () => {
  if (!email.endsWith("@wmsu.edu.ph")) {
    toast.error("Please use your WMSU email (@wmsu.edu.ph).");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Login failed");

const userData = {
  id: data.user.id || data.user._id, // always capture correct id
  username: data.user.username,
  email: data.user.email,
  first_name: data.user.first_name,
  last_name: data.user.last_name,
  is_admin: data.user.is_admin,
  is_verified: data.user.is_verified,
  status: data.user.status
};
localStorage.setItem("user", JSON.stringify(userData));

    console.log("Login userData:", userData);
    console.log("userData.is_admin:", userData.is_admin);
    console.log("Type of is_admin:", typeof userData.is_admin);

    loginUser(userData, data.token);

    // Redirect to admin dashboard if admin, otherwise user dashboard
    if (userData.is_admin === 1 || userData.is_admin === true) {
      console.log("Redirecting to admin dashboard");
      navigate("/admin/dashboard");
    } else {
      console.log("Redirecting to user dashboard");
      navigate("/user-dashboard");
    }

  } catch (err) {
    console.error(err);
    
    // Check if error is about banned/inactive account
    if (err.message && (
      err.message.toLowerCase().includes('banned') || 
      err.message.toLowerCase().includes('inactive') ||
      err.message.toLowerCase().includes('deleted')
    )) {
      toast.error("Your account has been banned or deactivated. Please contact the administrator for assistance.");
    } else {
      toast.error(err.message || "Login failed. Please check your credentials.");
    }
  } finally {
    setLoading(false);
  }
};

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      const data = await res.json();
      
      // Check if response indicates no account found
      if (!res.ok || !data.success) {
        // Show specific error for no account found
        if (data.message && data.message.includes("No account found")) {
          toast.error("User not found. Please create an account first using your WMSU email.");
          // Redirect to create account page after a short delay
          setTimeout(() => {
            navigate("/register");
          }, 2000);
        } else {
          toast.error(data.message || "Google Login failed");
        }
        return;
      }

const userData = {
  id: data.user.id || data.user._id, // ensure id is stored
  username: data.user.username,
  email: data.user.email,
  first_name: data.user.first_name,
  last_name: data.user.last_name,
  is_admin: data.user.is_admin,
  is_verified: data.user.is_verified,
  status: data.user.status
};

localStorage.setItem("user", JSON.stringify(userData));

console.log("Google Login userData:", userData);
console.log("userData.is_admin:", userData.is_admin);
console.log("Type of is_admin:", typeof userData.is_admin);

loginUser(userData, data.token);

// Redirect to admin dashboard if admin, otherwise user dashboard
if (userData.is_admin === 1 || userData.is_admin === true) {
  console.log("Redirecting to admin dashboard from Google login");
  navigate("/admin/dashboard");
} else {
  console.log("Redirecting to user dashboard from Google login");
  navigate("/user-dashboard");
}
    } catch (err) {
      console.error("Google Login Error:", err);
      toast.error("Google Sign-In failed. Please try again.");
    }
  };

  return (
    <div
      className="flex items-center justify-center h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/wmsu-bg-img.jpg')" }}
    >
      <div className="flex w-[900px] h-[600px] bg-white bg-opacity-95 shadow-2xl rounded-2xl overflow-hidden">
        <div className="w-1/2 bg-maroon flex flex-col justify-center items-center text-white">
          <div className="flex gap-6 mb-4 relative -top-4">
            <img src="/wmsu-logo.jpg" alt="WMSU Logo" className="w-40 h-40 rounded-full object-cover" />
            <img src="/study-squad-logo.png" alt="Study Squad Logo" className="w-40 h-40 rounded-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white">Crimsons Study Squad</h1>
        </div>

        <div className="w-1/2 flex flex-col justify-center items-center p-10">
          <h2 className="text-3xl font-semibold mb-6 text-maroon">Log in to your account</h2>

          <div className="w-72 flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-2 rounded bg-gray-200 focus:ring-1 focus:ring-maroon"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-2 pr-10 rounded bg-gray-200 focus:ring-1 focus:ring-maroon"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-maroon"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>

            <p className="text-right text-sm">
              <Link to="/forgot-password" className="text-maroon font-semibold hover:underline">
                Forgot Password?
              </Link>
            </p>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full mt-5 bg-maroon text-white font-medium py-2 rounded hover:brightness-90"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="text-gray-900 text-sm font-normal text-center mt-3">or</p>

            <div className="flex justify-center mt-3">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => toast.error("Google Login Failed")}
              />
            </div>

            <p className="mt-4 text-sm text-gray-600 text-center">
              Don’t have an account?{" "}
              <Link to="/register" className="text-maroon font-semibold hover:underline">
                Create account here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
