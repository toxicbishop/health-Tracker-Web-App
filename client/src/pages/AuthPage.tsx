import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ChevronLeft } from "lucide-react";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!email.trim() || !password.trim())
        throw new Error("Please fill in all fields.");
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!email.trim() || !password.trim())
        throw new Error("Please fill in all fields.");
      await register(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <nav className="top-nav">
        <ChevronLeft className="top-nav-left" size={24} />
        <span className="top-nav-title">Login</span>
      </nav>

      <div className="auth-body">
        {/* WITAL Logo */}
        <div className="wital-logo-container" style={{ marginBottom: "2rem" }}>
          <svg
            width="240"
            height="60"
            viewBox="0 0 240 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            {/* W */}
            <path
              d="M40 10 L50 45 L60 25 L70 45 L80 10"
              stroke="#000"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M40 10 L45 27" stroke="#000" strokeWidth="5" />
            <path
              d="M50 45 L60 25 L70 45 L80 10"
              stroke="#000"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            {/* Base Heartbeat line crossing W and I */}
            <path
              d="M20 30 L45 30 L55 5 L65 55 L75 30 L100 30"
              stroke="#000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* I */}
            <rect x="95" y="10" width="5" height="35" fill="#000" />
            {/* T */}
            <path
              d="M125 10 L145 10 M135 10 L135 45"
              stroke="#000"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* A */}
            <path
              d="M170 10 L155 45 M170 10 L185 45 M160 30 L180 30"
              stroke="#000"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* L */}
            <path
              d="M205 10 L205 45 L225 45"
              stroke="#000"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="auth-header">Welcome back</h1>

        <form>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input-line"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input-line"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="error-text">{error}</div>}

          <div className="auth-actions">
            <button
              onClick={handleSignup}
              className="btn-primary-black"
              disabled={loading}
              type="button">
              {loading ? "Processing..." : "Sign up"}
            </button>
            <button
              onClick={handleLogin}
              className="btn-secondary-white"
              disabled={loading}
              type="button">
              {loading ? "Processing..." : "Log In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
