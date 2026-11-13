import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function SuperAdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data.session) {
        throw new Error("Unable to establish your session.");
      }

      // The protected route and backend will verify
      // whether this account is a registered Super Admin.
      navigate("/superadmin", { replace: true });

    } catch (err) {
      setError(
        err.message || "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background: "var(--md-bg, #f1f5f9)",
        color: "var(--md-text, #0f172a)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "var(--md-card-bg, #ffffff)",
          border: "1px solid var(--md-border, #e2e8f0)",
          borderRadius: "20px",
          padding: "36px",
          boxShadow: "var(--md-card-shadow, 0 15px 40px rgba(0,0,0,0.08))",
        }}
      >
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "18px",
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "27px",
              fontWeight: "800",
            }}
          >
            M
          </div>

          <h3 className="fw-bold mb-1">
            MyDuka
          </h3>

          <p
            className="mb-0"
            style={{
              color: "var(--md-text-muted, #64748b)",
              fontSize: "14px",
            }}
          >
            Platform Administration
          </p>
        </div>

        <div className="mb-4">
          <h4 className="fw-bold mb-2">
            Super Admin Login
          </h4>

          <p
            style={{
              color: "var(--md-text-muted, #64748b)",
              fontSize: "14px",
            }}
          >
            Sign in to manage the MyDuka platform.
          </p>
        </div>

        {error && (
          <div
            className="alert alert-danger"
            role="alert"
            style={{ fontSize: "14px" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label
              className="form-label fw-semibold"
              htmlFor="superadmin-email"
            >
              Email address
            </label>

            <input
              id="superadmin-email"
              type="email"
              className="form-control"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              style={{
                minHeight: "46px",
                background: "var(--md-input-bg, #ffffff)",
                color: "var(--md-text, #0f172a)",
                borderColor: "var(--md-border, #cbd5e1)",
              }}
            />
          </div>

          <div className="mb-4">
            <label
              className="form-label fw-semibold"
              htmlFor="superadmin-password"
            >
              Password
            </label>

            <input
              id="superadmin-password"
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{
                minHeight: "46px",
                background: "var(--md-input-bg, #ffffff)",
                color: "var(--md-text, #0f172a)",
                borderColor: "var(--md-border, #cbd5e1)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn w-100 fw-semibold text-white"
            style={{
              minHeight: "47px",
              background: "#2563eb",
              borderRadius: "10px",
              border: "none",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div
          className="text-center mt-4"
          style={{
            fontSize: "13px",
            color: "var(--md-text-muted, #64748b)",
          }}
        >
          Authorised platform administrators only.
        </div>

        <div className="text-center mt-3">
          <Link
            to="/"
            style={{
              color: "#2563eb",
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Return to MyDuka
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminLogin;
