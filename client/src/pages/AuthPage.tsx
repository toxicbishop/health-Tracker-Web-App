import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Lock, HeartPulse, AlertCircle } from "lucide-react";

interface AuthPageProps {
  initialMode?: "login" | "register";
}

export default function AuthPage({ initialMode = "login" }: AuthPageProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow auth-bg-glow-1" />
      <div className="auth-bg-glow auth-bg-glow-2" />

      <div className="auth-card fade-in-up">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <HeartPulse size={24} color="#fff" />
          </div>
          <div>
            <div className="auth-logo-label">
              Health<span>Tracker</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              Wellness • Monitoring • Insights
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="auth-heading">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="auth-subheading">
          {mode === "login"
            ? "Sign in to access your health dashboard."
            : "Start tracking your health metrics today."}
        </p>

        {/* Error alert */}
        {error && (
          <div className="alert alert-error fade-in">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <div className="form-input-with-icon">
              <span className="form-input-icon">
                <User size={16} />
              </span>
              <input
                id="username"
                className="form-input"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="form-input-with-icon">
              <span className="form-input-icon">
                <Lock size={16} />
              </span>
              <input
                id="password"
                className="form-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                disabled={loading}
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: "8px" }}
            disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />{" "}
                {mode === "login" ? "Signing in…" : "Creating account…"}
              </>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="auth-footer">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <a
                id="switch-to-register"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}>
                Sign up
              </a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a
                id="switch-to-login"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}>
                Sign in
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
