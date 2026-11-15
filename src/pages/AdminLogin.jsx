import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import api from "../api/api";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [selectingBusiness, setSelectingBusiness] = useState(false);

  const finishLogin = async () => {
    const pendingBusiness = sessionStorage.getItem(
      "mydukaPendingBusiness"
    );

    if (pendingBusiness) {
      let businessDetails;

      try {
        businessDetails = JSON.parse(pendingBusiness);
      } catch {
        sessionStorage.removeItem("mydukaPendingBusiness");
        throw new Error(
          "Your pending business registration is invalid. Please register again."
        );
      }

      const response = await api.post("/businesses", {
        name: businessDetails.name,
        slug: businessDetails.slug,
        phone: businessDetails.phone || "",
        address: businessDetails.address || "",
      });

      const businessId =
        response.data?.business?.id ||
        response.data?.business_id ||
        response.data?.id;

      if (!businessId) {
        throw new Error(
          "Business creation did not return a business ID."
        );
      }

      localStorage.setItem("mydukaBusinessId", String(businessId));
      sessionStorage.removeItem("mydukaPendingBusiness");

      navigate("/admin", { replace: true });
      return;
    }

    const response = await api.get("/businesses");
    const userBusinesses = response.data?.businesses || [];

    if (!userBusinesses.length) {
      setError(
        "Your account has no business yet. Please register your business."
      );
      return;
    }

    if (userBusinesses.length === 1) {
      localStorage.setItem(
        "mydukaBusinessId",
        String(userBusinesses[0].id)
      );

      navigate("/admin", { replace: true });
      return;
    }

    setBusinesses(userBusinesses);
    setSelectedBusiness(String(userBusinesses[0].id));
    setSelectingBusiness(true);
  };

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

      if (loginError) throw loginError;

      if (!data.session) {
        throw new Error("Unable to establish your session.");
      }

      await finishLogin();
    } catch (err) {
      console.error("Admin login error:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSelection = () => {
    if (!selectedBusiness) {
      setError("Please select a business.");
      return;
    }

    localStorage.setItem("mydukaBusinessId", selectedBusiness);
    navigate("/admin", { replace: true });
  };

  return (
    <main className="md-admin-login">
      <style>{`
        .md-admin-login {
          --login-primary: var(--md-primary, var(--primary, #4f46e5));
          --login-primary-hover: var(--md-primary-hover, var(--primary-hover, #4338ca));
          --login-primary-light: var(--md-primary-light, var(--primary-light, #eef2ff));
          --login-bg: var(--md-background, var(--background, #f8fafc));
          --login-surface: var(--md-surface, var(--surface, #ffffff));
          --login-secondary: var(--md-surface-secondary, var(--surface-secondary, #f1f5f9));
          --login-text: var(--md-text, var(--text-primary, #0f172a));
          --login-muted: var(--md-text-secondary, var(--text-muted, #64748b));
          --login-border: var(--md-border, var(--border, #e2e8f0));
          --login-radius: var(--md-radius, var(--radius-md, 14px));
          --login-shadow: var(--md-shadow, var(--shadow-md, 0 4px 18px rgba(15,23,42,.05)));

          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 35px 20px;
          background: var(--login-bg);
          color: var(--login-text);
          font-family: inherit;
        }

        .md-admin-login *,
        .md-admin-login *::before,
        .md-admin-login *::after {
          box-sizing: border-box;
        }

        .md-login-container {
          width: 100%;
          max-width: 1040px;
          min-height: 620px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
          border: 1px solid var(--login-border);
          border-radius: 20px;
          background: var(--login-surface);
          box-shadow: var(--login-shadow);
        }

        .md-login-brand {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          padding: 45px;
          background: var(--login-secondary);
          border-right: 1px solid var(--login-border);
        }

        .md-login-brand::before {
          content: "";
          position: absolute;
          width: 380px;
          height: 380px;
          right: -190px;
          top: -170px;
          border-radius: 50%;
          background: var(--login-primary-light);
          opacity: .85;
        }

        .md-login-brand::after {
          content: "";
          position: absolute;
          width: 280px;
          height: 280px;
          left: -170px;
          bottom: -170px;
          border-radius: 50%;
          border: 45px solid var(--login-primary-light);
          opacity: .6;
        }

        .md-login-logo,
        .md-login-brand-content,
        .md-login-brand-footer {
          position: relative;
          z-index: 1;
        }

        .md-login-logo {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          width: fit-content;
          color: var(--login-text);
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -1px;
          text-decoration: none;
        }

        .md-login-logo-icon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: var(--login-primary);
          color: white;
          font-size: 22px;
        }

        .md-login-brand-content {
          margin: auto 0;
          padding: 55px 0;
        }

        .md-login-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid var(--login-border);
          border-radius: 30px;
          background: var(--login-surface);
          color: var(--login-primary);
          font-size: 11px;
          font-weight: 750;
          letter-spacing: .7px;
          text-transform: uppercase;
        }

        .md-login-brand h1 {
          max-width: 390px;
          margin: 25px 0 18px;
          color: var(--login-text);
          font-size: clamp(35px, 4vw, 48px);
          line-height: 1.13;
          font-weight: 800;
          letter-spacing: -2px;
        }

        .md-login-brand-description {
          max-width: 385px;
          margin: 0;
          color: var(--login-muted);
          font-size: 14px;
          line-height: 1.85;
        }

        .md-login-benefits {
          display: grid;
          gap: 17px;
          margin-top: 35px;
        }

        .md-login-benefit {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--login-text);
          font-size: 13px;
          font-weight: 550;
        }

        .md-login-benefit-icon {
          width: 29px;
          height: 29px;
          display: grid;
          flex-shrink: 0;
          place-items: center;
          border-radius: 9px;
          background: var(--login-primary-light);
          color: var(--login-primary);
          font-weight: 800;
        }

        .md-login-brand-footer {
          color: var(--login-muted);
          font-size: 11px;
        }

        .md-login-form-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 50px;
          background: var(--login-surface);
        }

        .md-login-form-content {
          width: 100%;
          max-width: 370px;
        }

        .md-login-mobile-logo {
          display: none;
          margin-bottom: 35px;
          color: var(--login-primary);
          font-size: 22px;
          font-weight: 800;
          text-decoration: none;
        }

        .md-login-heading {
          margin: 0 0 9px;
          color: var(--login-text);
          font-size: 29px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .md-login-subheading {
          margin: 0 0 34px;
          color: var(--login-muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .md-login-field {
          margin-bottom: 21px;
        }

        .md-login-field label {
          display: block;
          margin-bottom: 9px;
          color: var(--login-text);
          font-size: 13px;
          font-weight: 700;
        }

        .md-login-input-wrap {
          position: relative;
        }

        .md-login-input {
          width: 100%;
          height: 49px;
          padding: 0 14px;
          border: 1px solid var(--login-border);
          border-radius: 10px;
          outline: none;
          background: #ffffff;
          color: #0f172a;
          font-family: inherit;
          font-size: 13px;
          transition: border-color .2s, box-shadow .2s;
        }

        .md-login-input::placeholder {
          color: #94a3b8;
        }

        .md-login-input:focus {
          border-color: var(--login-primary);
          box-shadow: 0 0 0 3px var(--login-primary-light);
        }

        .md-login-password {
          padding-right: 65px;
        }

        .md-login-password-toggle {
          position: absolute;
          top: 50%;
          right: 13px;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          color: var(--login-primary);
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
        }

        .md-login-forgot {
          display: block;
          margin-top: -8px;
          margin-bottom: 23px;
          color: var(--login-primary);
          text-align: right;
          font-size: 12px;
          font-weight: 650;
          text-decoration: none;
        }

        .md-login-forgot:hover,
        .md-login-register a:hover,
        .md-login-back:hover {
          text-decoration: underline;
        }

        .md-login-button {
          width: 100%;
          min-height: 49px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1px solid var(--login-primary);
          border-radius: 10px;
          background: var(--login-primary);
          color: #ffffff;
          font-family: inherit;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition: background .2s, transform .2s, box-shadow .2s;
        }

        .md-login-button:hover:not(:disabled) {
          background: var(--login-primary-hover);
          border-color: var(--login-primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 5px 14px rgba(79,70,229,.2);
        }

        .md-login-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .md-login-button-secondary {
          margin-top: 12px;
          background: var(--login-surface);
          border-color: var(--login-border);
          color: var(--login-text);
        }

        .md-login-button-secondary:hover:not(:disabled) {
          background: var(--login-secondary);
          border-color: var(--login-border);
          color: var(--login-text);
          box-shadow: none;
        }

        .md-login-error {
          margin-bottom: 22px;
          padding: 13px 14px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          background: #fff1f2;
          color: #b42332;
          font-size: 12px;
          line-height: 1.6;
        }

        .md-login-error a {
          display: inline-block;
          margin-top: 5px;
          color: #9f1239;
          font-weight: 750;
        }

        .md-login-divider {
          display: flex;
          align-items: center;
          gap: 13px;
          margin: 27px 0;
          color: var(--login-muted);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .7px;
          text-transform: uppercase;
        }

        .md-login-divider::before,
        .md-login-divider::after {
          content: "";
          height: 1px;
          flex: 1;
          background: var(--login-border);
        }

        .md-login-register {
          margin: 0;
          color: var(--login-muted);
          text-align: center;
          font-size: 12px;
          line-height: 1.8;
        }

        .md-login-register a {
          color: var(--login-primary);
          font-weight: 750;
          text-decoration: none;
        }

        .md-login-back {
          display: block;
          margin-top: 25px;
          color: var(--login-muted);
          text-align: center;
          font-size: 11px;
          text-decoration: none;
        }

        .md-login-select-intro {
          margin-bottom: 24px;
          padding: 14px;
          border: 1px solid var(--login-border);
          border-radius: 10px;
          background: var(--login-secondary);
          color: var(--login-muted);
          font-size: 12px;
          line-height: 1.7;
        }

        .md-login-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,.4);
          border-top-color: white;
          border-radius: 50%;
          animation: md-login-spin .7s linear infinite;
        }

        @keyframes md-login-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 800px) {
          .md-login-container {
            max-width: 490px;
            min-height: auto;
            grid-template-columns: 1fr;
          }

          .md-login-brand {
            display: none;
          }

          .md-login-form-panel {
            padding: 45px 35px;
          }

          .md-login-mobile-logo {
            display: inline-block;
          }
        }

        @media (max-width: 480px) {
          .md-admin-login {
            padding: 15px;
          }

          .md-login-container {
            border-radius: 16px;
          }

          .md-login-form-panel {
            padding: 34px 22px;
          }

          .md-login-heading {
            font-size: 26px;
          }
        }
      `}</style>

      <div className="md-login-container">
        <section className="md-login-brand">
          <Link to="/" className="md-login-logo">
            <span className="md-login-logo-icon">✦</span>
            <span>MyDuka</span>
          </Link>

          <div className="md-login-brand-content">
            <span className="md-login-eyebrow">
              ✦ Business management platform
            </span>

            <h1>
              Run your business.
              <br />
              Smarter.
            </h1>

            <p className="md-login-brand-description">
              Your business operations, team, inventory and
              performance come together in one organised workspace.
            </p>

            <div className="md-login-benefits">
              <div className="md-login-benefit">
                <span className="md-login-benefit-icon">✓</span>
                Manage products and inventory
              </div>

              <div className="md-login-benefit">
                <span className="md-login-benefit-icon">✓</span>
                Monitor sales and business performance
              </div>

              <div className="md-login-benefit">
                <span className="md-login-benefit-icon">✓</span>
                Manage branches and your team
              </div>
            </div>
          </div>

          <div className="md-login-brand-footer">
            © {new Date().getFullYear()} MyDuka. All rights reserved.
          </div>
        </section>

        <section className="md-login-form-panel">
          <div className="md-login-form-content">
            <Link to="/" className="md-login-mobile-logo">
              ✦ MyDuka
            </Link>

            <h2 className="md-login-heading">
              {selectingBusiness
                ? "Choose your business"
                : "Welcome back"}
            </h2>

            <p className="md-login-subheading">
              {selectingBusiness
                ? "Select the business workspace you want to access."
                : "Sign in to your business management account."}
            </p>

            {error && (
              <div className="md-login-error" role="alert">
                {error}

                {error.toLowerCase().includes("no business") && (
                  <div>
                    <Link to="/business-register">
                      Register your business
                    </Link>
                  </div>
                )}
              </div>
            )}

            {!selectingBusiness ? (
              <form onSubmit={handleLogin}>
                <div className="md-login-field">
                  <label htmlFor="adminEmail">
                    Email address
                  </label>

                  <input
                    id="adminEmail"
                    type="email"
                    className="md-login-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="md-login-field">
                  <label htmlFor="adminPassword">
                    Password
                  </label>

                  <div className="md-login-input-wrap">
                    <input
                      id="adminPassword"
                      type={showPassword ? "text" : "password"}
                      className="md-login-input md-login-password"
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
                      className="md-login-password-toggle"
                      onClick={() =>
                        setShowPassword((previous) => !previous)
                      }
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <Link
                  to="/forgot-password"
                  className="md-login-forgot"
                >
                  Forgot password?
                </Link>

                <button
                  type="submit"
                  className="md-login-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="md-login-spinner" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in to your account
                      <span>→</span>
                    </>
                  )}
                </button>

                <div className="md-login-divider">
                  New to MyDuka?
                </div>

                <p className="md-login-register">
                  Start managing your business{" "}
                  <Link to="/business-register">
                    Create a business account
                  </Link>
                </p>
              </form>
            ) : (
              <div>
                <div className="md-login-select-intro">
                  Your account is connected to multiple businesses.
                  Choose which workspace you want to manage.
                </div>

                <div className="md-login-field">
                  <label htmlFor="businessSelect">
                    Your businesses
                  </label>

                  <select
                    id="businessSelect"
                    className="md-login-input"
                    value={selectedBusiness}
                    onChange={(event) => {
                      setSelectedBusiness(event.target.value);
                      setError("");
                    }}
                  >
                    {businesses.map((business) => (
                      <option
                        key={business.id}
                        value={String(business.id)}
                      >
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="md-login-button"
                  onClick={handleBusinessSelection}
                  disabled={!selectedBusiness}
                >
                  Continue to workspace →
                </button>

                <button
                  type="button"
                  className="md-login-button md-login-button-secondary"
                  onClick={() => {
                    setSelectingBusiness(false);
                    setError("");
                  }}
                >
                  Back to login
                </button>
              </div>
            )}

            <Link to="/" className="md-login-back">
              ← Back to MyDuka homepage
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminLogin;
