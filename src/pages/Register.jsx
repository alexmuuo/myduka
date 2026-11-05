import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const passwordsMatch =
    Boolean(form.password) &&
    Boolean(form.confirmPassword) &&
    form.password === form.confirmPassword;

  const passwordsDoNotMatch =
    Boolean(form.password) &&
    Boolean(form.confirmPassword) &&
    form.password !== form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.password
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/customers/register", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        password: form.password,
      });

      const customer = response.data.customer;

      if (response.data.status !== "success" || !customer) {
        setError(
          response.data.message ||
            "Registration could not be completed. Please try again."
        );
        return;
      }

      localStorage.setItem("customer", JSON.stringify(customer));

      // Notify the existing Navbar that the customer session changed.
      window.dispatchEvent(new Event("customerLogin"));

      navigate("/");
    } catch (err) {
      console.error("Customer registration error:", err);

      setError(
        err.response?.data?.message ||
          "Could not create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = `
    .hm-register {
      min-height: 100vh;
      display: flex;
      align-items: center;
      padding: 48px 18px 65px;
      color: #f1f5f9;
      background:
        radial-gradient(ellipse at 10% 10%, rgba(35, 91, 57, 0.22), transparent 42%),
        radial-gradient(ellipse at 95% 90%, rgba(183, 146, 65, 0.07), transparent 35%),
        #101310;
    }

    .hm-register * {
      box-sizing: border-box;
    }

    .hm-register .hm-register-layout {
      width: 100%;
      max-width: 1030px;
      margin: 0 auto;
    }

    .hm-register .hm-register-card {
      overflow: hidden;
      border: 1px solid #343b32;
      border-radius: 22px;
      background: #191e19;
      box-shadow: 0 25px 75px rgba(0, 0, 0, 0.3);
    }

    .hm-register .hm-register-aside {
      position: relative;
      display: flex;
      height: 100%;
      min-height: 620px;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      padding: 42px 32px;
      background: linear-gradient(155deg, #163523, #111b14 90%);
    }

    .hm-register .hm-register-aside::before,
    .hm-register .hm-register-aside::after {
      position: absolute;
      right: -100px;
      bottom: -100px;
      border: 1px solid rgba(251, 191, 36, 0.16);
      border-radius: 50%;
      content: "";
      pointer-events: none;
    }

    .hm-register .hm-register-aside::before {
      width: 300px;
      height: 300px;
    }

    .hm-register .hm-register-aside::after {
      right: -45px;
      bottom: -45px;
      width: 190px;
      height: 190px;
    }

    .hm-register .hm-brand-icon {
      display: flex;
      width: 58px;
      height: 58px;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(251, 191, 36, 0.5);
      border-radius: 16px;
      background: rgba(251, 191, 36, 0.08);
      color: #fbbf24;
      font-size: 1.7rem;
    }

    .hm-register .hm-eyebrow {
      margin-bottom: 10px;
      color: #fbbf24;
      font-size: 0.74rem;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }

    .hm-register .hm-brand-heading {
      margin: 17px 0 12px;
      color: #f7f3e8;
      font-size: clamp(1.8rem, 3vw, 2.4rem);
      font-weight: 850;
      letter-spacing: -0.05em;
      line-height: 1.15;
    }

    .hm-register .hm-gold {
      color: #fbbf24;
    }

    .hm-register .hm-aside-copy {
      max-width: 320px;
      margin-top: 18px;
      color: #c1c8bd;
      font-size: 0.94rem;
      line-height: 1.8;
    }

    .hm-register .hm-benefits {
      display: grid;
      gap: 17px;
      margin-top: 36px;
    }

    .hm-register .hm-benefit {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #e5e7df;
      font-size: 0.88rem;
    }

    .hm-register .hm-benefit-icon {
      display: flex;
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      border: 1px solid #3e5944;
      border-radius: 10px;
      background: rgba(44, 95, 58, 0.22);
      color: #fbbf24;
    }

    .hm-register .hm-aside-footer {
      position: relative;
      z-index: 1;
      margin-top: 40px;
      color: #9ca99a;
      font-size: 0.8rem;
      line-height: 1.7;
    }

    .hm-register .hm-form-side {
      padding: 38px;
    }

    .hm-register .hm-form-heading {
      margin-bottom: 10px;
      color: #f7f4eb;
      font-size: clamp(1.75rem, 4vw, 2.2rem);
      font-weight: 850;
      letter-spacing: -0.045em;
    }

    .hm-register .hm-form-subtitle {
      margin-bottom: 27px;
      color: #aeb5aa;
      font-size: 0.92rem;
      line-height: 1.7;
    }

    .hm-register .hm-field {
      margin-bottom: 19px;
    }

    .hm-register .hm-label {
      display: block;
      margin-bottom: 8px;
      color: #e8e9df;
      font-size: 0.85rem;
      font-weight: 650;
    }

    .hm-register .hm-optional {
      color: #8e988b;
      font-size: 0.78rem;
      font-weight: 400;
    }

    .hm-register .hm-input-wrap {
      position: relative;
    }

    .hm-register .hm-input-icon {
      position: absolute;
      top: 50%;
      left: 14px;
      z-index: 2;
      color: #899587;
      transform: translateY(-50%);
      pointer-events: none;
    }

    .hm-register .hm-input {
      width: 100%;
      min-height: 48px;
      padding: 12px 43px 12px 42px;
      border: 1px solid #3a4238;
      border-radius: 10px;
      outline: none;
      background: #121612;
      color: #f1f5f9;
      font-size: 0.91rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .hm-register .hm-input::placeholder {
      color: #6f786c;
    }

    .hm-register .hm-input:focus {
      border-color: #b89a53;
      box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
    }

    .hm-register .hm-input.is-valid {
      border-color: #4f9b69;
    }

    .hm-register .hm-input.is-invalid {
      border-color: #cb6464;
    }

    .hm-register .hm-toggle-password {
      position: absolute;
      top: 50%;
      right: 11px;
      display: flex;
      width: 30px;
      height: 30px;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 7px;
      background: transparent;
      color: #fbbf24;
      transform: translateY(-50%);
    }

    .hm-register .hm-toggle-password:hover {
      background: rgba(251, 191, 36, 0.08);
      color: #f0d99b;
    }

    .hm-register .hm-help {
      display: block;
      margin-top: 7px;
      color: #929b8e;
      font-size: 0.77rem;
    }

    .hm-register .hm-match {
      margin-top: 8px;
      font-size: 0.8rem;
    }

    .hm-register .hm-match-good {
      color: #91dba4;
    }

    .hm-register .hm-match-bad {
      color: #ff9e9e;
    }

    .hm-register .hm-alert {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 22px;
      padding: 13px 14px;
      border: 1px solid #713c3c;
      border-radius: 10px;
      background: rgba(130, 45, 45, 0.17);
      color: #ffb0b0;
      font-size: 0.87rem;
      line-height: 1.6;
      overflow-wrap: anywhere;
    }

    .hm-register .hm-submit {
      display: flex;
      width: 100%;
      min-height: 51px;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 8px;
      padding: 13px 18px;
      border: 1px solid #fbbf24;
      border-radius: 10px;
      background: #fbbf24;
      color: #171a14;
      font-size: 0.93rem;
      font-weight: 800;
      transition: background 0.2s, transform 0.2s;
    }

    .hm-register .hm-submit:hover:not(:disabled) {
      transform: translateY(-1px);
      background: #e8cd8b;
    }

    .hm-register .hm-submit:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }

    .hm-register .hm-login-prompt {
      margin-top: 24px;
      color: #aeb5aa;
      font-size: 0.89rem;
      text-align: center;
    }

    .hm-register .hm-login-link {
      margin-left: 5px;
      color: #fbbf24;
      font-weight: 750;
      text-decoration: none;
    }

    .hm-register .hm-login-link:hover {
      color: #f0d99b;
      text-decoration: underline;
    }

    .hm-register .hm-legal-note {
      margin-top: 22px;
      color: #879083;
      font-size: 0.75rem;
      line-height: 1.7;
      text-align: center;
    }

    @media (max-width: 767px) {
      .hm-register {
        padding: 25px 13px 40px;
      }

      .hm-register .hm-register-card {
        border-radius: 17px;
      }

      .hm-register .hm-register-aside {
        min-height: auto;
        padding: 25px;
      }

      .hm-register .hm-brand-icon {
        width: 48px;
        height: 48px;
        border-radius: 13px;
        font-size: 1.4rem;
      }

      .hm-register .hm-brand-heading {
        margin-top: 13px;
        font-size: 1.75rem;
      }

      .hm-register .hm-aside-copy {
        margin-top: 10px;
        font-size: 0.86rem;
      }

      .hm-register .hm-benefits {
        gap: 10px;
        margin-top: 20px;
      }

      .hm-register .hm-benefit {
        font-size: 0.82rem;
      }

      .hm-register .hm-benefit-icon {
        width: 31px;
        height: 31px;
      }

      .hm-register .hm-aside-footer {
        margin-top: 22px;
      }

      .hm-register .hm-form-side {
        padding: 27px 21px;
      }

      .hm-register .hm-form-subtitle {
        margin-bottom: 23px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hm-register *,
      .hm-register *::before,
      .hm-register *::after {
        transition: none !important;
      }
    }
  `;

  return (
    <div className="hm-register">
      <style>{styles}</style>

      <div className="hm-register-layout">
        <div className="hm-register-card">
          <div className="row g-0">
            {/* Branding panel */}
            <div className="col-md-5">
              <aside className="hm-register-aside">
                <div>
                  <div className="hm-brand-icon">
                    <i className="bi bi-gem" aria-hidden="true"></i>
                  </div>

                  <p className="hm-eyebrow mt-4 mb-0">
                    Become a member
                  </p>

                  <h2 className="hm-brand-heading">
                    My<span className="hm-gold">Duka.</span>
                  </h2>

                  <p className="hm-aside-copy">
                    Create your account and enjoy a more convenient
                    shopping experience from the very first order.
                  </p>

                  <div className="hm-benefits">
                    <div className="hm-benefit">
                      <span className="hm-benefit-icon">
                        <i className="bi bi-bag-check" aria-hidden="true"></i>
                      </span>
                      <span>Convenient ordering</span>
                    </div>

                    <div className="hm-benefit">
                      <span className="hm-benefit-icon">
                        <i className="bi bi-person-check" aria-hidden="true"></i>
                      </span>
                      <span>Your own customer account</span>
                    </div>

                    <div className="hm-benefit">
                      <span className="hm-benefit-icon">
                        <i className="bi bi-credit-card" aria-hidden="true"></i>
                      </span>
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

            {/* Registration form */}
            <div className="col-md-7">
              <div className="hm-form-side">
                <p className="hm-eyebrow">
                  Get started
                </p>

                <h1 className="hm-form-heading">
                  Create your account
                </h1>

                <p className="hm-form-subtitle">
                  Fill in your details below to get started.
                  Fields marked as optional can be left blank.
                </p>

                {error && (
                  <div className="hm-alert" role="alert">
                    <i
                      className="bi bi-exclamation-circle-fill mt-1"
                      aria-hidden="true"
                    ></i>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Full name */}
                  <div className="hm-field">
                    <label htmlFor="register-name" className="hm-label">
                      Full name
                    </label>

                    <div className="hm-input-wrap">
                      <i
                        className="bi bi-person hm-input-icon"
                        aria-hidden="true"
                      ></i>

                      <input
                        id="register-name"
                        type="text"
                        name="name"
                        className="hm-input"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="hm-field">
                    <label htmlFor="register-phone" className="hm-label">
                      Phone number
                    </label>

                    <div className="hm-input-wrap">
                      <i
                        className="bi bi-telephone hm-input-icon"
                        aria-hidden="true"
                      ></i>

                      <input
                        id="register-phone"
                        type="tel"
                        name="phone"
                        className="hm-input"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                        autoComplete="tel"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="hm-field">
                    <label htmlFor="register-email" className="hm-label">
                      Email address{" "}
                      <span className="hm-optional">(Optional)</span>
                    </label>

                    <div className="hm-input-wrap">
                      <i
                        className="bi bi-envelope hm-input-icon"
                        aria-hidden="true"
                      ></i>

                      <input
                        id="register-email"
                        type="email"
                        name="email"
                        className="hm-input"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="hm-field">
                    <label htmlFor="register-password" className="hm-label">
                      Password
                    </label>

                    <div className="hm-input-wrap">
                      <i
                        className="bi bi-lock hm-input-icon"
                        aria-hidden="true"
                      ></i>

                      <input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        className="hm-input"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />

                      <button
                        type="button"
                        className="hm-toggle-password"
                        onClick={() =>
                          setShowPassword((previous) => !previous)
                        }
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        <i
                          className={`bi ${
                            showPassword ? "bi-eye-slash" : "bi-eye"
                          }`}
                          aria-hidden="true"
                        ></i>
                      </button>
                    </div>

                    {form.password && form.password.length < 6 && (
                      <small className="hm-help" style={{ color: "#ff9e9e" }}>
                        Password must be at least 6 characters.
                      </small>
                    )}

                    {form.password.length >= 6 && (
                      <small className="hm-help">
                        <i
                          className="bi bi-check-circle me-1"
                          aria-hidden="true"
                        ></i>
                        Password length requirement met.
                      </small>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="hm-field">
                    <label
                      htmlFor="register-confirm-password"
                      className="hm-label"
                    >
                      Confirm password
                    </label>

                    <div className="hm-input-wrap">
                      <i
                        className="bi bi-shield-lock hm-input-icon"
                        aria-hidden="true"
                      ></i>

                      <input
                        id="register-confirm-password"
                        type={
                          showConfirmPassword ? "text" : "password"
                        }
                        name="confirmPassword"
                        className={`hm-input ${
                          passwordsMatch
                            ? "is-valid"
                            : passwordsDoNotMatch
                              ? "is-invalid"
                              : ""
                        }`}
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Enter your password again"
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />

                      <button
                        type="button"
                        className="hm-toggle-password"
                        onClick={() =>
                          setShowConfirmPassword((previous) => !previous)
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirmation password"
                            : "Show confirmation password"
                        }
                      >
                        <i
                          className={`bi ${
                            showConfirmPassword
                              ? "bi-eye-slash"
                              : "bi-eye"
                          }`}
                          aria-hidden="true"
                        ></i>
                      </button>
                    </div>

                    {passwordsMatch && (
                      <div className="hm-match hm-match-good">
                        <i
                          className="bi bi-check-circle me-1"
                          aria-hidden="true"
                        ></i>
                        Passwords match
                      </div>
                    )}

                    {passwordsDoNotMatch && (
                      <div className="hm-match hm-match-bad">
                        <i
                          className="bi bi-x-circle me-1"
                          aria-hidden="true"
                        ></i>
                        Passwords do not match
                      </div>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="hm-submit"
                    disabled={loading || !passwordsMatch}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Creating account...
                      </>
                    ) : (
                      <>
                        <i
                          className="bi bi-person-plus"
                          aria-hidden="true"
                        ></i>
                        Create Account
                      </>
                    )}
                  </button>
                </form>

                <div className="hm-login-prompt">
                  Already have an account?

                  <Link to="/login" className="hm-login-link">
                    Sign in
                  </Link>
                </div>

                <p className="hm-legal-note">
                  By creating an account, you agree to shop responsibly
                  and comply with applicable age requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
