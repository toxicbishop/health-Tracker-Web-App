import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Activity } from "lucide-react";

type AuthMode = "login" | "register" | "forgot";

const NAV_TITLE: Record<AuthMode, string> = {
  login: "Login",
  register: "Create Account",
  forgot: "Reset Password",
};

const HEADINGS: Record<AuthMode, string> = {
  login: "Welcome back",
  register: "Create account",
  forgot: "Reset password",
};

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      } else {
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
    setShowPassword(false);
    setShowConfirm(false);
  };

  return (
    <div className="auth-page-v2">
      {/* Nav bar */}
      <nav className="auth-v2-nav">
        {mode !== "login" && (
          <button
            type="button"
            className="auth-v2-nav-back"
            onClick={() => switchMode("login")}>
            <ArrowLeft size={18} />
            <span>Back to sign in</span>
          </button>
        )}
        <span className="auth-v2-nav-title">{NAV_TITLE[mode]}</span>
      </nav>

      <div className="auth-v2-body">
        {/* Wordmark */}
        <div className="auth-v2-wordmark">
          <Activity size={36} strokeWidth={1.5} className="auth-v2-wordmark-icon" />
          <span className="auth-v2-wordmark-text">HealthTracker</span>
        </div>

        <div className="auth-v2-inner">
          <h1 className="auth-v2-heading">{HEADINGS[mode]}</h1>

          {error && (
            <div className="auth-v2-error" role="alert">
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          {resetSent ? (
            <div className="auth-v2-success">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={16} />
                <strong>Instructions sent.</strong>
              </div>
              <p>
                If the username <strong>{resetEmail}</strong> exists, reset
                instructions have been dispatched.
              </p>
              <button
                type="button"
                className="auth-v2-link"
                style={{ marginTop: 12 }}
                onClick={() => switchMode("login")}>
                Return to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {(mode === "login" || mode === "register") && (
                <div className="auth-v2-field">
                  <label className="auth-v2-field-label" htmlFor="username">
                    Username
                  </label>
                  <input
                    id="username"
                    className="auth-v2-input"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>
              )}

              {mode === "forgot" && (
                <div className="auth-v2-field">
                  <label className="auth-v2-field-label" htmlFor="reset-email">
                    Username
                  </label>
                  <input
                    id="reset-email"
                    className="auth-v2-input"
                    type="text"
                    placeholder="Enter your username"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              {(mode === "login" || mode === "register") && (
                <div className="auth-v2-field">
                  <label className="auth-v2-field-label" htmlFor="password">
                    Password
                  </label>
                  <div className="auth-v2-password-wrap">
                    <input
                      id="password"
                      className="auth-v2-input auth-v2-input-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="auth-v2-eye"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide" : "Show"}
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "register" && (
                <div className="auth-v2-field">
                  <label className="auth-v2-field-label" htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <div className="auth-v2-password-wrap">
                    <input
                      id="confirm-password"
                      className="auth-v2-input auth-v2-input-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="auth-v2-eye"
                      tabIndex={-1}
                      aria-label={showConfirm ? "Hide" : "Show"}
                      onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="auth-v2-buttons">
                {/* Primary action */}
                <button
                  id="auth-submit-btn"
                  type="submit"
                  className="auth-v2-submit"
                  disabled={loading}
                  data-loading={loading ? "true" : undefined}>
                  <span
                    className="btn-spinner"
                    style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "currentColor" }}
                  />
                  {loading
                    ? mode === "login" ? "Signing in..." : mode === "register" ? "Creating account..." : "Sending..."
                    : mode === "login" ? "Sign In"
                    : mode === "register" ? "Create Account"
                    : "Send Reset Instructions"}
                </button>

                {/* Secondary mode switch */}
                {mode === "login" && (
                  <button
                    type="button"
                    id="switch-to-register"
                    className="auth-v2-submit-outline"
                    onClick={() => switchMode("register")}>
                    Sign up
                  </button>
                )}
                {mode === "register" && (
                  <button
                    type="button"
                    id="switch-to-login"
                    className="auth-v2-submit-outline"
                    onClick={() => switchMode("login")}>
                    Sign in
                  </button>
                )}
              </div>

              {mode === "login" && (
                <div className="auth-v2-links">
                  <button
                    type="button"
                    id="forgot-password-link"
                    className="auth-v2-link"
                    onClick={() => switchMode("forgot")}>
                    Forgot password?
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
