import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ChevronLeft } from "lucide-react";

type Mode = "login" | "register" | "forgot";

// VITAL wordmark SVG as a component
function VitalLogo({ size = 200 }: { size?: number }) {
  const h = size * 0.28;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 280 78"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      {/* V */}
      <path
        d="M8 12 L28 66 L48 12"
        stroke="#111"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* heartbeat line threading through the V */}
      <path
        d="M4 39 L20 39 L28 18 L36 60 L44 39 L54 39"
        stroke="#888"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* I */}
      <line
        x1="62"
        y1="12"
        x2="62"
        y2="66"
        stroke="#111"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* T */}
      <line
        x1="75"
        y1="12"
        x2="105"
        y2="12"
        stroke="#111"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <line
        x1="90"
        y1="12"
        x2="90"
        y2="66"
        stroke="#111"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* A */}
      <path
        d="M120 66 L140 12 L160 66"
        stroke="#111"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="127"
        y1="44"
        x2="153"
        y2="44"
        stroke="#111"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* L */}
      <path
        d="M174 12 L174 66 L204 66"
        stroke="#111"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setPassword("");
    setConfirm("");
  };

  const handlePrimary = async () => {
    setError("");
    if (mode === "forgot") {
      if (!username.trim()) {
        setError("Please enter your username.");
        return;
      }
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setError("Instructions sent if user exists.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!username.trim() || !password.trim() || (mode === "register" && !confirm.trim())) {
      setError("Please fill in all fields.");
      return;
    }

    if (mode === "register") {
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="auth-wrap">
      {/* Top Nav */}
      <nav className="top-nav">
        {mode !== "login" && (
          <button
            className="top-nav-back"
            onClick={() => switchMode("login")}
            aria-label="Back">
            <ChevronLeft size={22} />
          </button>
        )}
        <span className="top-nav-title">
          {mode === "login" ? "Login" : mode === "register" ? "Create Account" : "Reset Password"}
        </span>
      </nav>

      <div className="auth-body">
        {/* Logo */}
        <div className="auth-logo-row">
          <VitalLogo size={220} />
        </div>

        {/* Heading */}
        <h1 className="auth-heading">
          {mode === "login" ? "Welcome back" : mode === "register" ? "Create account" : "Reset password"}
        </h1>

        {/* Fields */}
        <div className="field-group">
          <label className="field-label" htmlFor="auth-username">
            Username
          </label>
          <input
            id="auth-username"
            className="field-input-line"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>

        {mode !== "forgot" && (
          <div className="field-group">
            <label className="field-label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              className="field-input-line"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        {mode === "register" && (
          <div className="field-group">
            <label className="field-label" htmlFor="auth-confirm">
              Confirm Password
            </label>
            <input
              id="auth-confirm"
              className="field-input-line"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        {error && <div className="msg-error">{error}</div>}

        {/* Actions */}
        <div className="auth-actions">
          {mode === "login" && (
            <>
              <button
                id="auth-primary-btn"
                className="btn-primary"
                onClick={handlePrimary}
                disabled={loading}
                type="submit">
                {loading ? "Signing in…" : "Sign In"}
              </button>

              <button
                id="auth-switch-register"
                className="btn-outline"
                onClick={() => switchMode("register")}
                disabled={loading}
                type="button">
                Sign up
              </button>

              <button
                id="auth-switch-forgot"
                className="btn-link"
                onClick={() => switchMode("forgot")}
                disabled={loading}
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer", textDecoration: "underline", color: "inherit", marginTop: "10px" }}>
                Forgot password?
              </button>
            </>
          )}

          {mode === "register" && (
            <>
              <button
                id="auth-primary-btn"
                className="btn-primary"
                onClick={handlePrimary}
                disabled={loading}
                type="submit">
                {loading ? "Creating account…" : "Create Account"}
              </button>

              <button
                id="auth-switch-login"
                className="btn-outline"
                onClick={() => switchMode("login")}
                disabled={loading}
                type="button">
                Back to sign in
              </button>
            </>
          )}

          {mode === "forgot" && (
            <>
              <button
                id="auth-primary-btn"
                className="btn-primary"
                onClick={handlePrimary}
                disabled={loading}
                type="submit">
                Send Reset Instructions
              </button>

              <button
                id="auth-switch-login"
                className="btn-outline"
                onClick={() => switchMode("login")}
                disabled={loading}
                type="button">
                Back to sign in
              </button>
            </>
          )}
        </div>

        {/* Footer toggle */}
        {mode !== "forgot" && (
          <div className="auth-footer">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button onClick={() => switchMode("register")} type="button">Create one</button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => switchMode("login")} type="button">Log in</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
