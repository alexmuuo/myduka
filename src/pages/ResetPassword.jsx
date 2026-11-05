import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

const styles = `
  .hm-reset-page {
    min-height: 85vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 56px 20px;
    background:
      radial-gradient(ellipse at top left, rgba(34, 91, 61, 0.24), transparent 45%),
      linear-gradient(145deg, #101713 0%, #171e19 55%, #101411 100%);
    color: #f4f2e9;
  }

  .hm-reset-wrapper {
    width: 100%;
    max-width: 460px;
  }

  .hm-reset-brand {
    text-align: center;
    margin-bottom: 28px;
  }

  .hm-reset-brand-mark {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(210, 174, 91, 0.55);
    border-radius: 20px;
    background: rgba(210, 174, 91, 0.08);
    color: #fbbf24;
    font-size: 30px;
  }

  .hm-reset-brand h1 {
    margin: 0;
    color: #f5f0e4;
    font-size: clamp(23px, 5vw, 30px);
    font-weight: 800;
    letter-spacing: -0.8px;
  }

  .hm-reset-brand h1 span {
    color: #fbbf24;
  }

  .hm-reset-brand p {
    margin: 8px 0 0;
    color: #9ba69e;
    font-size: 13px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }

  .hm-reset-card {
    padding: 34px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 22px;
    background: rgba(26, 34, 29, 0.94);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.3);
  }

  .hm-reset-heading {
    margin-bottom: 9px;
    color: #f6f3eb;
    font-size: 25px;
    font-weight: 750;
    letter-spacing: -0.6px;
  }

  .hm-reset-description {
    margin-bottom: 26px;
    color: #aab4ac;
    font-size: 14px;
    line-height: 1.7;
  }

  .hm-reset-label {
    display: block;
    margin-bottom: 9px;
    color: #e9e9df;
    font-size: 13px;
    font-weight: 650;
  }

  .hm-reset-input-wrap {
    position: relative;
  }

  .hm-reset-input {
    width: 100%;
    min-height: 49px;
    padding: 12px 14px;
    border: 1px solid #3b4940;
    border-radius: 10px;
    outline: none;
    background: #141b16;
    color: #f5f5ed;
    font: inherit;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .hm-reset-input:focus {
    border-color: #d0ae61;
    box-shadow: 0 0 0 3px rgba(208, 174, 97, 0.12);
  }

  .hm-reset-input::placeholder {
    color: #758178;
  }

  .hm-reset-input.has-toggle {
    padding-right: 76px;
  }

  .hm-reset-input.match {
    border-color: #5eaa7c;
  }

  .hm-reset-input.no-match {
    border-color: #d86c6c;
  }

  .hm-reset-toggle {
    position: absolute;
    top: 50%;
    right: 12px;
    transform: translateY(-50%);
    border: none;
    background: transparent;
    color: #fbbf24;
    font-size: 12px;
    font-weight: 650;
    cursor: pointer;
  }

  .hm-reset-hint {
    display: block;
    margin-top: 8px;
    color: #929e95;
    font-size: 12px;
  }

  .hm-reset-match {
    margin-top: 7px;
    font-size: 12px;
  }

  .hm-reset-match.success {
    color: #83d3a0;
  }

  .hm-reset-match.error {
    color: #ff9292;
  }

  .hm-reset-field {
    margin-bottom: 21px;
  }

  .hm-reset-checkbox-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 2px 0 23px;
    color: #b8c0b9;
    font-size: 13px;
    cursor: pointer;
  }

  .hm-reset-checkbox {
    width: 16px;
    height: 16px;
    accent-color: #fbbf24;
    cursor: pointer;
  }

  .hm-reset-button {
    width: 100%;
    min-height: 49px;
    padding: 13px 18px;
    border: 1px solid #fbbf24;
    border-radius: 10px;
    background: linear-gradient(135deg, #fbbf24, #c9a653);
    color: #172018;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    transition: transform 0.2s, filter 0.2s;
  }

  .hm-reset-button:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.07);
  }

  .hm-reset-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .hm-reset-alert {
    margin-bottom: 21px;
    padding: 13px 15px;
    border-radius: 10px;
    font-size: 13px;
    line-height: 1.6;
  }

  .hm-reset-alert.error {
    border: 1px solid rgba(229, 102, 102, 0.35);
    background: rgba(155, 43, 43, 0.13);
    color: #ffaaaa;
  }

  .hm-reset-alert.success {
    border: 1px solid rgba(91, 185, 123, 0.35);
    background: rgba(36, 128, 70, 0.13);
    color: #a0e5b4;
  }

  .hm-reset-invalid {
    padding: 19px;
    border: 1px solid rgba(251, 191, 36, 0.2);
    border-radius: 12px;
    background: rgba(251, 191, 36, 0.05);
    text-align: center;
  }

  .hm-reset-invalid-icon {
    margin-bottom: 10px;
    color: #fbbf24;
    font-size: 30px;
  }

  .hm-reset-invalid p {
    margin-bottom: 17px;
    color: #b7c0b8;
    font-size: 13px;
    line-height: 1.7;
  }

  .hm-reset-secondary {
    display: block;
    margin-top: 24px;
    color: #b7c0b8;
    font-size: 13px;
    text-align: center;
    text-decoration: none;
    transition: color 0.2s;
  }

  .hm-reset-secondary:hover {
    color: #fbbf24;
  }

  .hm-reset-footer {
    margin-top: 22px;
    color: #748078;
    font-size: 11px;
    text-align: center;
  }

  @media (max-width: 520px) {
    .hm-reset-page {
      min-height: 80vh;
      padding: 35px 15px;
    }

    .hm-reset-card {
      padding: 25px 21px;
      border-radius: 17px;
    }

    .hm-reset-brand {
      margin-bottom: 22px;
    }

    .hm-reset-heading {
      font-size: 23px;
    }
  }
`;

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const passwordsDoNotMatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError(
        "Your password-reset link is missing its token. Please request a new link."
      );
      return;
    }

    if (password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/customers/reset-password", {
        token,
        password,
        confirm_password: confirmPassword,
      });

      if (response.data.status !== "success") {
        setError(
          response.data.message ||
            "We couldn't reset your password. Please try again."
        );
        return;
      }

      setSuccess(
        "Your password has been reset successfully. Redirecting to login..."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "The reset link may have expired or become invalid. Please request a new one."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>

      <main className="hm-reset-page">
        <div className="hm-reset-wrapper">
          <header className="hm-reset-brand">
            <div className="hm-reset-brand-mark" aria-hidden="true">
              <i className="bi bi-shield-lock" />
            </div>

            <h1>
              MY<span>DUKA</span>
            </h1>

            <p>Your account, secured</p>
          </header>

          <section className="hm-reset-card">
            <h2 className="hm-reset-heading">Create a new password</h2>

            <p className="hm-reset-description">
              Choose a strong password to get back into your MyDuka account.
            </p>

            {error && (
              <div className="hm-reset-alert error" role="alert">
                <i className="bi bi-exclamation-circle me-2" />
                {error}
              </div>
            )}

            {success && (
              <div className="hm-reset-alert success" role="status">
                <i className="bi bi-check-circle me-2" />
                {success}
              </div>
            )}

            {!token ? (
              <div className="hm-reset-invalid">
                <div className="hm-reset-invalid-icon">
                  <i className="bi bi-link-45deg" />
                </div>

                <p>
                  This password-reset link is missing its security token.
                  Request a new link to continue.
                </p>

                <Link
                  to="/forgot-password"
                  className="hm-reset-button d-flex align-items-center justify-content-center text-decoration-none"
                >
                  Request a new reset link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="hm-reset-field">
                  <label htmlFor="new-password" className="hm-reset-label">
                    New password
                  </label>

                  <div className="hm-reset-input-wrap">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      className="hm-reset-input has-toggle"
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      minLength={6}
                      required
                      disabled={loading || Boolean(success)}
                    />

                    <button
                      type="button"
                      className="hm-reset-toggle"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <small className="hm-reset-hint">
                    Use at least 6 characters.
                  </small>
                </div>

                <div className="hm-reset-field">
                  <label
                    htmlFor="confirm-password"
                    className="hm-reset-label"
                  >
                    Confirm new password
                  </label>

                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    className={`hm-reset-input ${
                      passwordsMatch
                        ? "match"
                        : passwordsDoNotMatch
                        ? "no-match"
                        : ""
                    }`}
                    placeholder="Enter your new password again"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={loading || Boolean(success)}
                    aria-invalid={passwordsDoNotMatch}
                  />

                  {passwordsMatch && (
                    <div className="hm-reset-match success">
                      <i className="bi bi-check-circle me-1" />
                      Passwords match.
                    </div>
                  )}

                  {passwordsDoNotMatch && (
                    <div className="hm-reset-match error">
                      <i className="bi bi-exclamation-circle me-1" />
                      Passwords do not match.
                    </div>
                  )}
                </div>

                <label className="hm-reset-checkbox-row">
                  <input
                    type="checkbox"
                    className="hm-reset-checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    disabled={loading || Boolean(success)}
                  />

                  Show passwords
                </label>

                <button
                  type="submit"
                  className="hm-reset-button"
                  disabled={
                    loading ||
                    Boolean(success) ||
                    !password ||
                    !confirmPassword ||
                    passwordsDoNotMatch
                  }
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                      />
                      Resetting password...
                    </>
                  ) : success ? (
                    "Password reset successful"
                  ) : (
                    <>
                      <i className="bi bi-shield-check me-2" />
                      Reset password
                    </>
                  )}
                </button>
              </form>
            )}

            <Link to="/login" className="hm-reset-secondary">
              <i className="bi bi-arrow-left me-2" />
              Back to login
            </Link>
          </section>

          <footer className="hm-reset-footer">
            &copy; {new Date().getFullYear()} MyDuka. Secure
            account access.
          </footer>
        </div>
      </main>
    </>
  );
}

export default ResetPassword;



