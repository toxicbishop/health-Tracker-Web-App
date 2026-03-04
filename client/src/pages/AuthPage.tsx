import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Lock, HeartPulse, AlertCircle, Mail, ArrowLeft, CheckCircle } from "lucide-react";

type AuthMode = "login" | "register" | "forgot";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        if (!username.trim() || !password.trim()) throw new Error("Please fill in all fields.");
        await login(username, password);
      } else if (mode === "register") {
        if (!username.trim() || !password.trim()) throw new Error("Please fill in all fields.");
        if (password !== confirmPass) throw new Error("Passwords do not match.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        await register(username, password);
      } else if (mode === "forgot") {
        if (!resetEmail.trim()) throw new Error("Please enter your username.");
        await new Promise((r) => setTimeout(r, 1200));
        setResetSent(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setResetSent(false);
    setPassword("");
    setConfirmPass("");
  };

  const headings: Record<AuthMode, { title: string; sub: string }> = {
    login: { title: "Welcome back", sub: "Sign in to access your health dashboard." },
    register: { title: "Create account", sub: "Start tracking your health metrics today." },
    forgot: { title: "Reset password", sub: "Enter your username and we will send reset instructions." },
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow auth-bg-glow-1" />
      <div className="auth-bg-glow auth-bg-glow-2" />

      <div className="auth-card fade-in-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <HeartPulse size={24} color="#fff" />
          </div>
          <div>
            <div className="auth-logo-label">Health<span>Tracker</span></div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              Wellness - Monitoring - Insights
            </div>
          </div>
        </div>

        {mode === "forgot" && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 16, padding: "4px 0", gap: 6, justifyContent: "flex-start" }}
            onClick={() => switchMode("login")}>
            <ArrowLeft size={14} /> Back to sign in
          </button>
        )}

        <h1 className="auth-heading">{headings[mode].title}</h1>
        <p className="auth-subheading">{headings[mode].sub}</p>

        {error && (
          <div className="alert alert-error fade-in">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {resetSent ? (
          <div className="alert alert-success fade-in" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={16} />
              <strong>Instructions sent!</strong>
            </div>
            <p style={{ fontSize: 13, marginLeft: 24 }}>
              If the username <strong>{resetEmail}</strong> exists, password reset instructions have been dispatched.
            </p>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 4, marginLeft: 16 }} onClick={() => switchMode("login")}>
              Return to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {(mode === "login" || mode === "register") && (
              <div className="form-group">
                <label className="form-label" htmlFor="username">Username</label>
                <div className="form-input-with-icon">
                  <span className="form-input-icon"><User size={16} /></span>
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
            )}

            {mode === "forgot" && (
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">Username</label>
                <div className="form-input-with-icon">
                  <span className="form-input-icon"><Mail size={16} /></span>
                  <input
                    id="reset-email"
                    className="form-input"
                    type="text"
                    placeholder="Enter your username"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {(mode === "login" || mode === "register") && (
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      id="forgot-password-link"
                      style={{ padding: "0 2px", fontSize: 12, color: "var(--accent-blue)" }}
                      onClick={() => switchMode("forgot")}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="form-input-with-icon">
                  <span className="form-input-icon"><Lock size={16} /></span>
                  <input
                    id="password"
                    className="form-input"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {mode === "register" && (
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
                <div className="form-input-with-icon">
                  <span className="form-input-icon"><Lock size={16} /></span>
                  <input
                    id="confirm-password"
                    className="form-input"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: "8px" }}
              disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />{" "}
                  {mode === "login" ? "Signing in..." : mode === "register" ? "Creating account..." : "Sending..."}
                </>
              ) : mode === "login" ? (
                "Sign In"
              ) : mode === "register" ? (
                "Create Account"
              ) : (
                "Send Reset Instructions"
              )}
            </button>
          </form>
        )}

        {!resetSent && (
          <div className="auth-footer">
            {mode === "login" ? (
              <>
                Don''t have an account?{" "}
                <a id="switch-to-register" onClick={() => switchMode("register")}>
                  Sign up
                </a>
              </>
            ) : mode === "register" ? (
              <>
                Already have an account?{" "}
                <a id="switch-to-login" onClick={() => switchMode("login")}>
                  Sign in
                </a>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
