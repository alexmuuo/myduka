import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import api from "../api/api";
import ThemeSwitcher from "../components/ThemeSwitcher";

function SuperAdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data.session?.access_token) {
        throw new Error("Unable to establish your session.");
      }

      // Verify that the authenticated user is a registered
      // and active platform administrator.
      try {
        await api.get("/superadmin/me", {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        });
      } catch (verificationError) {
        console.error(
          "Super Admin verification failed:",
          verificationError.response?.data ||
            verificationError.message
        );

        await supabase.auth.signOut();

        const status = verificationError.response?.status;
        const serverMessage =
          verificationError.response?.data?.error ||
          verificationError.response?.data?.message;

        if (status === 401 || status === 403) {
          throw new Error(
            serverMessage ||
              "This account is not authorised to access Super Admin."
          );
        }

        throw new Error(
          serverMessage ||
            "Unable to verify Super Admin access. Please check that the MyDuka backend is running."
        );
      }

      // Successful authentication and platform-admin verification.
      navigate("/superadmin/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error("Super Admin login error:", err);

      setError(
        err.message || "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="superadmin-login">
      <style>{`
        .superadmin-login {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 25px;
          background: var(--background, #f5f7fb);
          color: var(--text-primary, #172033);
          position: relative;
          overflow: hidden;
        }

        .superadmin-login *,
        .superadmin-login *::before,
        .superadmin-login *::after {
          box-sizing: border-box;
        }

        .login-decoration {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: rgba(99, 91, 219, 0.07);
          filter: blur(2px);
          pointer-events: none;
        }

        .login-decoration.one {
          top: -210px;
          right: -120px;
        }

        .login-decoration.two {
          bottom: -260px;
          left: -150px;
          width: 500px;
          height: 500px;
        }

        .login-theme {
          position: absolute;
          top: 25px;
          right: 28px;
          z-index: 2;
        }

        .login-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 460px;
        }

        .login-card {
          background: var(--surface, #ffffff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 20px;
          padding: 38px;
          box-shadow: var(--shadow-lg, 0 18px 55px rgba(20, 25, 50, 0.08));
        }

        .login-brand {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo {
          width: 58px;
          height: 58px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 17px;
          background: linear-gradient(135deg, #7168ed, #5148c7);
          color: white;
          font-size: 27px;
          font-weight: 900;
          box-shadow: 0 8px 20px rgba(99, 91, 219, 0.25);
        }

        .login-brand h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 850;
          letter-spacing: -0.8px;
        }

        .login-brand p {
          margin: 6px 0 0;
          color: var(--text-secondary, #7b8495);
          font-size: 12px;
        }

        .login-heading {
          margin-bottom: 25px;
        }

        .login-heading h2 {
          margin: 0 0 8px;
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -0.7px;
        }

        .login-heading p {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary, #7b8495);
        }

        .login-field {
          margin-bottom: 19px;
        }

        .login-field label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 750;
        }

        .login-field input {
          width: 100%;
          min-height: 49px;
          padding: 12px 14px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 9px;
          background: var(--input-bg, var(--surface, #ffffff));
          color: var(--text-primary, #172033);
          font-family: inherit;
          font-size: 13px;
          outline: none;
          transition: 0.2s;
        }

        .login-field input:focus {
          border-color: #635bdb;
          box-shadow: 0 0 0 3px rgba(99, 91, 219, 0.12);
        }

        .login-field input::placeholder {
          color: var(--text-secondary, #9ca3af);
        }

        .password-wrapper {
          position: relative;
        }

        .password-wrapper input {
          padding-right: 65px;
        }

        .password-toggle {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          color: var(--text-secondary, #7b8495);
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
        }

        .login-error {
          padding: 12px 14px;
          margin-bottom: 19px;
          border: 1px solid rgba(220, 53, 69, 0.2);
          border-radius: 9px;
          background: rgba(220, 53, 69, 0.08);
          color: #dc4545;
          font-size: 12px;
          line-height: 1.5;
        }

        .login-submit {
          width: 100%;
          min-height: 49px;
          border: none;
          border-radius: 9px;
          background: linear-gradient(135deg, #7168ed, #5148c7);
          color: white;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s;
          box-shadow: 0 5px 15px rgba(99, 91, 219, 0.2);
        }

        .login-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(99, 91, 219, 0.3);
        }

        .login-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .login-security {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 23px;
          color: var(--text-secondary, #7b8495);
          font-size: 11px;
        }

        .login-security span {
          color: #16a36a;
        }

        .login-footer {
          text-align: center;
          margin-top: 23px;
          padding-top: 19px;
          border-top: 1px solid var(--border, #e5e7eb);
        }

        .login-footer a {
          color: var(--text-secondary, #7b8495);
          font-size: 12px;
          text-decoration: none;
          transition: 0.2s;
        }

        .login-footer a:hover {
          color: #635bdb;
        }

        @media (max-width: 520px) {
          .superadmin-login {
            padding: 18px;
          }

          .login-card {
            padding: 27px 21px;
          }

          .login-theme {
            top: 15px;
            right: 15px;
          }
        }
      `}</style>

      <div className="login-decoration one" />
      <div className="login-decoration two" />

      <div className="login-theme">
        <ThemeSwitcher />
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-logo">M</div>
            <h1>MyDuka</h1>
            <p>Platform Administration</p>
          </div>

          <div className="login-heading">
            <h2>Welcome back</h2>
            <p>
              Sign in to access your platform administration
              dashboard and manage MyDuka.
            </p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label htmlFor="superadmin-email">
                Email address
              </label>

              <input
                id="superadmin-email"
                type="email"
                placeholder="Enter your administrator email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="superadmin-password">
                Password
              </label>

              <div className="password-wrapper">
                <input
                  id="superadmin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading
                ? "Verifying administrator..."
                : "Sign In to Dashboard"}
            </button>
          </form>

          <div className="login-security">
            <span>●</span>
            Restricted access · Authorised administrators only
          </div>

          <div className="login-footer">
            <Link to="/">← Return to MyDuka storefront</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminLogin;
