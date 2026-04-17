import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams(); 
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState(""); 
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const emailFromURL = searchParams.get("email");
    if (emailFromURL) setEmail(emailFromURL);
  }, [searchParams]);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/password/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reset failed");

      setSuccess(true);

      setTimeout(() => {
        navigate(`/login?email=${encodeURIComponent(email)}`);
      }, 3000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/wmsu-bg-img.jpg')" }}
    >
      <div className="flex w-[900px] h-[550px] bg-white bg-opacity-95 shadow-2xl rounded-2xl overflow-hidden">
        <div className="w-1/2 bg-maroon flex flex-col justify-center items-center text-white">
          <div className="flex gap-6 mb-4 relative -top-4">
            <img
              src="/wmsu-logo.jpg"
              alt="WMSU Logo"
              className="w-40 h-40 rounded-full object-cover"
            />
            <img
              src="/study-squad-logo.png"
              alt="Study Squad Logo"
              className="w-40 h-40 rounded-full object-cover"
            />
          </div>

          <h1 className="text-3xl font-bold text-white">Crimsons Study Squad</h1>
        </div>

        <div className="w-1/2 flex flex-col justify-center items-center px-8">
          <h2 className="text-2xl font-bold text-maroon mb-3">Reset your password</h2>

          {!success ? (
            <form onSubmit={handleResetPassword} className="w-72 flex flex-col">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mb-3 p-2 pr-10 rounded bg-gray-200 focus:ring-1 focus:ring-maroon"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-5 -translate-y-1/2 text-maroon"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full mb-4 p-2 pr-10 rounded bg-gray-200 focus:ring-1 focus:ring-maroon"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-5 -translate-y-1/2 text-maroon"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-maroon text-white py-2 rounded hover:brightness-90"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <p className="text-sm mt-4 text-gray-600 text-center">
                Back to{" "}
                <Link to="/login" className="text-maroon font-medium hover:underline">
                  Login
                </Link>
              </p>
            </form>
          ) : (
            <p className="text-green-800 font-semibold text-center mt-6">
              Password reset successful!<br />Redirecting to login...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
