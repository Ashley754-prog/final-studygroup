import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!email.endsWith("@wmsu.edu.ph")) {
      toast.error("Enter your WMSU email address only.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/password/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to send reset link");

      if (data.type === "google") {
        toast.info(data.message); 
        return;
      }

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
            <img src="/wmsu-logo.jpg" alt="WMSU Logo" className="w-40 h-40 rounded-full object-cover" />
            <img src="/study-squad-logo.png" alt="Study Squad Logo" className="w-40 h-40 rounded-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white">Crimsons Study Squad</h1>
        </div>

        <div className="w-1/2 flex flex-col justify-center items-center px-8">
          <h2 className="text-2xl font-bold text-maroon mb-3">Forgot your password?</h2>

          {!success ? (
            <>
              <p className="text-center text-gray-700 mb-6">
                Enter your registered <span className="font-semibold">WMSU email</span> and we’ll send a reset link.
              </p>

              <form onSubmit={handleReset} className="w-72 flex flex-col">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mb-4 p-2 rounded bg-gray-200 focus:ring-1 focus:ring-maroon"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-maroon text-white py-2 rounded hover:brightness-90"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>

                <p className="text-sm mt-4 text-gray-600 text-center">
                  Back to{" "}
                  <Link to="/login" className="text-maroon font-medium hover:underline">
                    Login
                  </Link>
                </p>
              </form>
            </>
          ) : (
            <p className="text-green-800 font-semibold text-center mt-6">
              Password reset link sent!<br />Check your email<br />
              Redirecting to login...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
