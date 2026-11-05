import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

function Login() {
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  // Save the authenticated customer session.
  const saveCustomerSession = (customer, token) => {
    if (!customer || !customer.id || !token) {
      throw new Error(
        "Authentication response is missing customer details."
      );
    }

    localStorage.removeItem("customer");
    localStorage.removeItem("customerToken");

    localStorage.setItem("customer", JSON.stringify(customer));
    localStorage.setItem("customerToken", token);

    window.dispatchEvent(new Event("customerLogin"));
  };

  // Customer login.
  const handleLogin = async (e) => {
    e.preventDefault();

    resetMessages();
    setLoading(true);

    try {
      const response = await api.post("/customers/login", {
        phone: phone.trim(),
        password,
      });

      const { customer, token } = response.data;

      saveCustomerSession(customer, token);

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Customer registration.
  const handleRegister = async (e) => {
    e.preventDefault();

    resetMessages();

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/customers/register", {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        password,
      });

      if (response.data.status !== "success") {
        setError(
          response.data.message ||
            "Registration failed. Please try again."
        );
        return;
      }

      // Sign the customer in after successful registration.
      const loginResponse = await api.post("/customers/login", {
        phone: phone.trim(),
        password,
      });

      const { customer, token } = loginResponse.data;

      saveCustomerSession(customer, token);

      setName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setIsRegister(false);

      navigate("/");
    } catch (err) {
      console.error("Authentication error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Switch between login and registration.
  const switchMode = () => {
    setIsRegister(!isRegister);

    setName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");

    setShowPassword(false);
    resetMessages();
  };

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const passwordsDoNotMatch =
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  const styles = `
    .hm-auth {
      min-height: 100vh;
      display: flex;
      align-items: center;
      padding: 55px 18px 70px;
      color: #f1f5f9;
      background:
        radial-gradient(ellipse at 15% 15%, rgba(35, 91, 57, 0.23), transparent 42%),
        radial-gradient(ellipse at 90% 85%, rgba(183, 146, 65, 0.08), transparent 35%),
        #101310;
    }

    .hm-auth * {
      box-sizing: border-box;
    }

    .hm-auth .hm-auth-layout {
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
    }

    .hm-auth .hm-auth-card {
      overflow: hidden;
      border: 1px solid #343b32;
      border-radius: 22px;
      background: #191e19;
      box-shadow: 0 25px 75px rgba(0, 0, 0, 0.3);
    }

    .hm-auth .hm-auth-aside {
      position: relative;
      display: flex;
      min-height: 100%;
      flex-direction: column;
      justify-content: space-between;
      padding: 42px 32px;
      overflow: hidden;
      background:
        linear-gradient(160deg, rgba(15, 43, 28, 0.94), rgba(20, 32, 23, 0.98)),
        #14251a;
    }

    .hm-auth .hm-auth-aside::before {
      position: absolute;
      right: -90px;
      bottom: -100px;
      width: 280px;
      height: 280px;
      border: 1px solid rgba(251, 191, 36, 0.18);
      border-radius: 50%;
      content: "";
    }

    .hm-auth .hm-auth-aside::after {
      position: absolute;
      right: -45px;
      bottom: -55px;
      width: 190px;
      height: 190px;
      border: 1px solid rgba(251, 191, 36, 0.15);
      border-radius: 50%;
      content: "";
    }

    .hm-auth .hm-brand-icon {
      display: flex;
      width: 58px;
      height: 58px;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(251, 191, 36, 0.55);
      border-radius: 16px;
      background: rgba(251, 191, 36, 0.08);
      color: #e1c47d;
      font-size: 1.7rem;
    }

    .hm-auth .hm-brand-name {
      margin: 20px 0 8px;
      color: #f7f3e8;
      font-size: clamp(1.8rem, 3vw, 2.35rem);
      font-weight: 850;
      letter-spacing: -0.05em;
      line-height: 1.15;
    }

    .hm-auth .hm-gold {
      color: #fbbf24;
    }

    .hm-auth .hm-aside-copy {
      max-width: 320px;
      margin-top: 18px;
      color: #c1c8bd;
      font-size: 0.95rem;
      line-height: 1.8;
    }

    .hm-auth .hm-feature-list {
      display: grid;
      gap: 17px;
      margin-top: 38px;
    }

    .hm-auth .hm-feature {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #e5e7df;
      font-size: 0.9rem;
    }

    .hm-auth .hm-feature i {
      display: flex;
      width: 34px;
      height: 34px;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      border: 1px solid #3e5944;
      border-radius: 10px;
      background: rgba(44, 95, 58, 0.22);
      color: #fbbf24;
    }

    .hm-auth .hm-aside-footer {
      position: relative;
      z-index: 1;
      margin-top: 45px;
      color: #9ca99a;
      font-size: 0.8rem;
      line-height: 1.7;
    }

    .hm-auth .hm-form-side {
      padding: 42px 38px;
    }

    .hm-auth .hm-eyebrow {
      margin-bottom: 10px;
      color: #fbbf24;
      font-size: 0.74rem;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }

    .hm-auth .hm-form-heading {
      margin-bottom: 10px;
      color: #f7f4eb;
      font-size: clamp(1.75rem, 4vw, 2.2rem);
      font-weight: 850;
      letter-spacing: -0.045em;
    }

    .hm-auth .hm-form-subtitle {
      margin-bottom: 30px;
      color: #aeb5aa;
      font-size: 0.93rem;
      line-height: 1.7;
    }

    .hm-auth .hm-field {
      margin-bottom: 20px;
    }

    .hm-auth .hm-label {
      display: block;
      margin-bottom: 9px;
      color: #e8e9df;
      font-size: 0.86rem;
      font-weight: 650;
    }

    .hm-auth .hm-optional {
      color: #8e988b;
      font-size: 0.78rem;
      font-weight: 400;
    }

    .hm-auth .hm-input-wrap {
      position: relative;
    }

    .hm-auth .hm-input-icon {
      position: absolute;
      top: 50%;
      left: 14px;
      z-index: 2;
      color: #899587;
      transform: translateY(-50%);
      pointer-events: none;
    }

    .hm-auth .hm-input {
      width: 100%;
      min-height: 49px;
      padding: 12px 14px 12px 42px;
      border: 1px solid #3a4238;
      border-radius: 10px;
      outline: none;
      background: #121612;
      color: #f1f5f9;
      font-size: 0.92rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .hm-auth .hm-input::placeholder {
      color: #6f786c;
    }

    .hm-auth .hm-input:focus {
      border-color: #b89a53;
      box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
    }

    .hm-auth .hm-input.is-valid {
      border-color: #4f9b69;
    }

    .hm-auth .hm-input.is-invalid {
      border-color: #cb6464;
    }

    .hm-auth .hm-password-input {
      padding-right: 72px;
    }

    .hm-auth .hm-toggle-password {
      position: absolute;
      top: 50%;
      right: 12px;
      padding: 5px;
      border: 0;
      background: transparent;
      color: #fbbf24;
      font-size: 0.8rem;
      font-weight: 700;
      transform: translateY(-50%);
    }

    .hm-auth .hm-toggle-password:hover {
      color: #f0d99b;
    }

    .hm-auth .hm-help {
      display: block;
      margin-top: 8px;
      color: #929b8e;
      font-size: 0.78rem;
    }

    .hm-auth .hm-forgot {
      display: inline-block;
      margin-top: -5px;
      color: #fbbf24;
      font-size: 0.84rem;
      text-decoration: none;
    }

    .hm-auth .hm-forgot:hover {
      color: #f0d99b;
      text-decoration: underline;
    }

    .hm-auth .hm-submit {
      display: flex;
      width: 100%;
      min-height: 51px;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 10px;
      padding: 13px 18px;
      border: 1px solid #fbbf24;
      border-radius: 10px;
      background: #fbbf24;
      color: #171a14;
      font-size: 0.94rem;
      font-weight: 800;
      transition: background 0.2s, transform 0.2s;
    }

    .hm-auth .hm-submit:hover:not(:disabled) {
      transform: translateY(-1px);
      background: #e8cd8b;
    }

    .hm-auth .hm-submit:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    .hm-auth .hm-switch {
      margin-top: 25px;
      color: #aeb5aa;
      font-size: 0.9rem;
      text-align: center;
    }

    .hm-auth .hm-switch-button {
      margin-left: 5px;
      padding: 0;
      border: 0;
      background: transparent;
      color: #fbbf24;
      font-weight: 750;
    }

    .hm-auth .hm-switch-button:hover {
      color: #f0d99b;
      text-decoration: underline;
    }

    .hm-auth .hm-alert {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 22px;
      padding: 13px 14px;
      border: 1px solid;
      border-radius: 10px;
      font-size: 0.87rem;
      line-height: 1.6;
      overflow-wrap: anywhere;
    }

    .hm-auth .hm-alert-error {
      border-color: #713c3c;
      background: rgba(130, 45, 45, 0.17);
      color: #ffb0b0;
    }

    .hm-auth .hm-alert-success {
      border-color: #365b3f;
      background: rgba(37, 104, 55, 0.16);
      color: #a0e1b0;
    }

    .hm-auth .hm-match {
      margin-top: 8px;
      font-size: 0.8rem;
    }

    .hm-auth .hm-match-good {
      color: #91dba4;
    }

    .hm-auth .hm-match-bad {
      color: #ff9e9e;
    }

    .hm-auth .hm-legal-note {
      margin-top: 25px;
      color: #879083;
      font-size: 0.76rem;
      line-height: 1.7;
      text-align: center;
    }

    @media (max-width: 767px) {
      .hm-auth {
        padding: 28px 14px 45px;
      }

      .hm-auth .hm-auth-card {
        border-radius: 17px;
      }

      .hm-auth .hm-auth-aside {
        min-height: auto;
        padding: 25px;
      }

      .hm-auth .hm-brand-icon {
        width: 48px;
        height: 48px;
        border-radius: 13px;
        font-size: 1.4rem;
      }

      .hm-auth .hm-brand-name {
        margin-top: 14px;
        font-size: 1.75rem;
      }

      .hm-auth .hm-aside-copy {
        margin-top: 10px;
        font-size: 0.87rem;
      }

      .hm-auth .hm-feature-list {
        grid-template-columns: 1fr;
        gap: 10px;
        margin-top: 20px;
      }

      .hm-auth .hm-feature {
        font-size: 0.83rem;
      }

      .hm-auth .hm-feature i {
        width: 30px;
        height: 30px;
      }

      .hm-auth .hm-aside-footer {
        margin-top: 24px;
      }

      .hm-auth .hm-form-side {
        padding: 28px 22px;
      }

      .hm-auth .hm-form-subtitle {
        margin-bottom: 25px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hm-auth *,
      .hm-auth *::before,
      .hm-auth *::after {
        transition: none !important;
      }
    }
  `;

  return (
    <div className="hm-auth">
      <style>{styles}</style>

      <div className="hm-auth-layout">
        <div className="hm-auth-card">
          <div className="row g-0">
            {/* Branding panel */}
            <div className="col-md-5">
              <aside className="hm-auth-aside">
                <div>
                  <div className="hm-brand-icon">
                    <i className="bi bi-gem" aria-hidden="true"></i>
                  </div>

                  <p className="hm-eyebrow mt-4 mb-0">
                    Welcome to
                  </p>

                  <h2 className="hm-brand-name">
                    My<span className="hm-gold">Duka.</span>
                  </h2>

                  <p className="hm-aside-copy">
                    Your next favourite bottle is just a few clicks away.
                    Sign in or create an account to make shopping easier.
                  </p>

                  <div className="hm-feature-list">
                    <div className="hm-feature">
                      <i className="bi bi-bag-check" aria-hidden="true"></i>
                      <span>Simple, convenient ordering</span>
                    </div>

                    <div className="hm-feature">
                      <i className="bi bi-shield-check" aria-hidden="true"></i>
                      <span>Secure customer account</span>
                    </div>

                    <div className="hm-feature">
                      <i className="bi bi-credit-card" aria-hidden="true"></i>
                      <span>Convenient payment options</span>
                    </div>
                  </div>
                </div>

                <div className="hm-aside-footer">
                  Quality service. Convenient shopping.
                  <br />
                  Please enjoy responsibly.
                </div>
              </aside>
            </div>

            {/* Authentication form */}
            <div className="col-md-7">
              <div className="hm-form-side">
                <p className="hm-eyebrow">
                  {isRegister ? "Join us" : "Your account"}
                </p>

                <h1 className="hm-form-heading">
                  {isRegister
                    ? "Create your account"
                    : "Welcome back"}
                </h1>

                <p className="hm-form-subtitle">
                  {isRegister
                    ? "Enter your details below to get started."
                    : "Sign in with your phone number to continue shopping."}
                </p>

                {error && (
                  <div
                    className="hm-alert hm-alert-error"
                    role="alert"
                  >
                    <i className="bi bi-exclamation-circle-fill mt-1" aria-hidden="true"></i>
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div
                    className="hm-alert hm-alert-success"
                    role="status"
                  >
                    <i className="bi bi-check-circle-fill mt-1" aria-hidden="true"></i>
                    <span>{success}</span>
                  </div>
                )}

                <form
                  onSubmit={isRegister ? handleRegister : handleLogin}
                >
                  {isRegister && (
                    <>
                      <div className="hm-field">
                        <label htmlFor="name" className="hm-label">
                          Full name
                        </label>

                        <div className="hm-input-wrap">
                          <i className="bi bi-person hm-input-icon" aria-hidden="true"></i>

                          <input
                            id="name"
                            type="text"
                            className="hm-input"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                            required
                          />
                        </div>
                      </div>

                      <div className="hm-field">
                        <label htmlFor="email" className="hm-label">
                          Email address{" "}
                          <span className="hm-optional">(Optional)</span>
                        </label>

                        <div className="hm-input-wrap">
                          <i className="bi bi-envelope hm-input-icon" aria-hidden="true"></i>

                          <input
                            id="email"
                            type="email"
                            className="hm-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="hm-field">
                    <label htmlFor="phone" className="hm-label">
                      Phone number
                    </label>

                    <div className="hm-input-wrap">
                      <i className="bi bi-telephone hm-input-icon" aria-hidden="true"></i>

                      <input
                        id="phone"
                        type="tel"
                        className="hm-input"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        required
                      />
                    </div>

                    {isRegister && (
                      <small className="hm-help">
                        Use the number you want associated with your account.
                      </small>
                    )}
                  </div>

                  <div className="hm-field">
                    <label htmlFor="password" className="hm-label">
                      Password
                    </label>

                    <div className="hm-input-wrap">
                      <i className="bi bi-lock hm-input-icon" aria-hidden="true"></i>

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="hm-input hm-password-input"
                        placeholder={
                          isRegister
                            ? "Create a password"
                            : "Enter your password"
                        }
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={
                          isRegister
                            ? "new-password"
                            : "current-password"
                        }
                        minLength={6}
                        required
                      />

                      <button
                        type="button"
                        className="hm-toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>

                    {isRegister && (
                      <small className="hm-help">
                        Use at least 6 characters.
                      </small>
                    )}
                  </div>

                  {!isRegister && (
                    <div className="text-end mb-4">
                      <Link
                        to="/forgot-password"
                        className="hm-forgot"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  )}

                  {isRegister && (
                    <div className="hm-field">
                      <label
                        htmlFor="confirmPassword"
                        className="hm-label"
                      >
                        Confirm password
                      </label>

                      <div className="hm-input-wrap">
                        <i className="bi bi-shield-lock hm-input-icon" aria-hidden="true"></i>

                        <input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          className={`hm-input ${
                            passwordsMatch
                              ? "is-valid"
                              : passwordsDoNotMatch
                                ? "is-invalid"
                                : ""
                          }`}
                          placeholder="Enter your password again"
                          value={confirmPassword}
                          onChange={(e) =>
                            setConfirmPassword(e.target.value)
                          }
                          autoComplete="new-password"
                          minLength={6}
                          required
                        />
                      </div>

                      {passwordsMatch && (
                        <div className="hm-match hm-match-good">
                          <i className="bi bi-check-circle me-1" aria-hidden="true"></i>
                          Passwords match
                        </div>
                      )}

                      {passwordsDoNotMatch && (
                        <div className="hm-match hm-match-bad">
                          <i className="bi bi-x-circle me-1" aria-hidden="true"></i>
                          Passwords do not match
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="hm-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          aria-hidden="true"
                        ></span>

                        {isRegister
                          ? "Creating account..."
                          : "Signing in..."}
                      </>
                    ) : (
                      <>
                        <i
                          className={
                            isRegister
                              ? "bi bi-person-plus"
                              : "bi bi-box-arrow-in-right"
                          }
                          aria-hidden="true"
                        ></i>

                        {isRegister
                          ? "Create Account"
                          : "Sign In"}
                      </>
                    )}
                  </button>
                </form>

                <div className="hm-switch">
                  {isRegister
                    ? "Already have an account?"
                    : "New to MyDuka?"}

                  <button
                    type="button"
                    className="hm-switch-button"
                    onClick={switchMode}
                    disabled={loading}
                  >
                    {isRegister ? "Sign in" : "Create account"}
                  </button>
                </div>

                <p className="hm-legal-note">
                  By using this store, you agree to shop responsibly and
                  comply with applicable age requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
