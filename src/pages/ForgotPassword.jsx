import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

const styles = `
  .hm-forgot-page {
    min-height: 82vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 55px 18px;
    color: #f5f0e4;
    background:
      radial-gradient(ellipse at top left, rgba(37, 91, 60, 0.2), transparent 45%),
      #111713;
  }

  .hm-forgot-container {
    width: 100%;
    max-width: 460px;
    margin: 0 auto;
  }

  .hm-forgot-card {
    overflow: hidden;
    border: 1px solid #303b33;
    border-radius: 22px;
    background: #19211b;
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.3);
  }

  .hm-forgot-top {
    padding: 34px 30px 26px;
    text-align: center;
    background: linear-gradient(145deg, #203c2c, #19291f);
    border-bottom: 1px solid rgba(251, 191, 36, 0.2);
  }

  .hm-forgot-icon {
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 19px;
    border: 1px solid rgba(251, 191, 36, 0.45);
    border-radius: 21px;
    background: rgba(251, 191, 36, 0.1);
    color: #fbbf24;
    font-size: 30px;
  }

  .hm-forgot-eyebrow {
    margin-bottom: 9px;
    color: #fbbf24;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .hm-forgot-title {
    margin: 0 0 11px;
    color: #fffaf0;
    font-size: clamp(25px, 5vw, 31px);
    font-weight: 850;
    letter-spacing: -0.8px;
  }

  .hm-forgot-description {
    max-width: 340px;
    margin: 0 auto;
    color: #bdc9bf;
    font-size: 13px;
    line-height: 1.8;
  }

  .hm-forgot-body {
    padding: 30px;
  }

  .hm-forgot-label {
    display: block;
    margin-bottom: 9px;
    color: #e7e8df;
    font-size: 12px;
    font-weight: 750;
  }

  .hm-forgot-input-wrap {
    position: relative;
  }

  .hm-forgot-input-icon {
    position: absolute;
    top: 50%;
    left: 15px;
    color: #a8b3a9;
    font-size: 15px;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .hm-forgot-input {
    width: 100%;
    min-height: 49px;
    padding: 13px 15px 13px 43px;
    border: 1px solid #3b4940;
    border-radius: 11px;
    outline: none;
    background: #121914;
    color: #f5f0e4;
    font: inherit;
    font-size: 13px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .hm-forgot-input:focus {
    border-color: #c9a653;
    box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
  }

  .hm-forgot-input::placeholder {
    color: #78847b;
  }

  .hm-forgot-input:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .hm-forgot-alert {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 20px;
    padding: 13px 14px;
    border: 1px solid;
    border-radius: 11px;
    font-size: 12px;
    line-height: 1.7;
    overflow-wrap: anywhere;
  }

  .hm-forgot-alert.success {
    border-color: rgba(91, 177, 115, 0.35);
    background: rgba(45, 120, 68, 0.13);
    color: #b8e5c1;
  }

  .hm-forgot-alert.error {
    border-color: rgba(226, 102, 102, 0.35);
    background: rgba(148, 38, 38, 0.13);
    color: #ffaaaa;
  }

  .hm-forgot-alert i {
    margin-top: 2px;
    font-size: 15px;
  }

  .hm-forgot-submit {
    width: 100%;
    min-height: 49px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 23px;
    padding: 13px 18px;
    border: 1px solid #fbbf24;
    border-radius: 11px;
    background: linear-gradient(135deg, #fbbf24, #c9a653);
    color: #172018;
    font-size: 13px;
    font-weight: 850;
    cursor: pointer;
    transition: transform 0.2s, filter 0.2s;
  }

  .hm-forgot-submit:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.07);
  }

  .hm-forgot-submit:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .hm-forgot-divider {
    height: 1px;
    margin: 25px 0 20px;
    background: #303b33;
  }

  .hm-forgot-back {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    color: #c8d1c8;
    font-size: 13px;
    font-weight: 650;
    text-decoration: none;
    transition: color 0.2s;
  }

  .hm-forgot-back:hover {
    color: #fbbf24;
  }

  .hm-forgot-footnote {
    margin: 23px 0 0;
    color: #77847a;
    font-size: 10px;
    line-height: 1.7;
    text-align: center;
  }

  @media (max-width: 480px) {
    .hm-forgot-page {
      min-height: 75vh;
      padding: 35px 13px;
    }

    .hm-forgot-card {
      border-radius: 17px;
    }

    .hm-forgot-top {
      padding: 28px 20px 23px;
    }

    .hm-forgot-body {
      padding: 23px 19px;
    }

    .hm-forgot-icon {
      width: 61px;
      height: 61px;
      border-radius: 18px;
      font-size: 26px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hm-forgot-input,
    .hm-forgot-submit,
    .hm-forgot-back {
      transition: none;
    }
  }
`;

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/customers/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      setMessage(
        response.data.message ||
          "If an eligible account exists for that email, a password-reset link will be sent."
      );

      setEmail("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "We couldn't process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>

      <main className="hm-forgot-page">
        <div className="hm-forgot-container">
          <section className="hm-forgot-card">
            <header className="hm-forgot-top">
              <div className="hm-forgot-icon">
                <i className="bi bi-shield-lock" />
              </div>

              <div className="hm-forgot-eyebrow">
                Account Recovery
              </div>

              <h1 className="hm-forgot-title">
                Forgot Password?
              </h1>

              <p className="hm-forgot-description">
                It happens. Enter the email address linked to your
                MyDuka account and we'll help you get back in.
              </p>
            </header>

            <div className="hm-forgot-body">
              {message && (
                <div
                  className="hm-forgot-alert success"
                  role="status"
                  aria-live="polite"
                >
                  <i className="bi bi-check-circle-fill" />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div
                  className="hm-forgot-alert error"
                  role="alert"
                >
                  <i className="bi bi-exclamation-circle-fill" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="reset-email"
                    className="hm-forgot-label"
                  >
                    Email Address
                  </label>

                  <div className="hm-forgot-input-wrap">
                    <i
                      className="bi bi-envelope hm-forgot-input-icon"
                      aria-hidden="true"
                    />

                    <input
                      id="reset-email"
                      type="email"
                      className="hm-forgot-input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck="false"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="hm-forgot-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-label="Sending"
                      />
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              <div className="hm-forgot-divider" />

              <Link to="/login" className="hm-forgot-back">
                <i className="bi bi-arrow-left" />
                Back to Login
              </Link>

              <p className="hm-forgot-footnote">
                For your security, never share your password or password-reset
                link with anyone.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default ForgotPassword;

