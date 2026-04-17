import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

export default function VerificationPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const emailFromURL = searchParams.get("email");
    if (emailFromURL) setEmail(emailFromURL);
  }, [searchParams]);

  const handleAccountVerification = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Verification code must be 6 digits.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }), 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");

      setSuccess(true);
      setTimeout(() => navigate(`/login?email=${encodeURIComponent(email)}`), 3000);
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
      <div className="flex w-[900px] h-[600px] bg-white bg-opacity-95 shadow-2xl rounded-2xl overflow-hidden">
        <div className="w-1/2 bg-maroon flex flex-col justify-center items-center text-white">
          <div className="flex gap-6 mb-4 relative -top-4">
            <img src="/wmsu-logo.jpg" alt="WMSU Logo" className="w-40 h-40 rounded-full object-cover" />
            <img src="/study-squad-logo.png" alt="Study Squad Logo" className="w-40 h-40 rounded-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white">Crimsons Study Squad</h1>
        </div>
        <div className="w-1/2 flex flex-col justify-center items-center px-8">
          <h2 className="text-2xl font-bold text-maroon mb-3">Paste your verification code</h2>
          {!success ? (
            <form onSubmit={handleAccountVerification} className="w-72 flex flex-col">
              <input
                type="email"
                value={email}
                readOnly
                className="mb-3 p-2 rounded bg-gray-200 focus:ring-1 focus:ring-maroon"
              />
              <input
                type="text"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mb-3 p-2 rounded bg-gray-200 focus:ring-1 focus:ring-maroon"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-maroon text-white py-2 rounded hover:brightness-90"
              >
                {loading ? "Verifying..." : "Verify Account"}
              </button>
            </form>
          ) : (
            <p className="text-green-800 font-semibold text-center mt-6">
              Verification successful! Redirecting to login...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
