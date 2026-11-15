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

    // Complete a business registration that was interrupted
    // before the user authenticated.
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

    // Retrieve businesses belonging to the authenticated user.
    const response = await api.get("/businesses");
    const userBusinesses = response.data?.businesses || [];

    if (!userBusinesses.length) {
      setError(
        "Your account has no business yet. Register a business to continue."
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
    <div className="md-login">
      <style>{`
        .md-login {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 36px 20px;
          background:
            radial-gradient(circle at 12% 15%, rgba(34, 197, 94, .09), transparent 30%),
            radial-gradient(circle at 90% 85%, rgba(16, 185, 129, .08), transparent 28%),
            var(--background-color, #f5f7f6);
          color: var(--text-color, #17231d);
          font-family: inherit;
        }

        .md-login *,
        .md-login *::before,
        .md-login *::after {
          box-sizing: border-box;
        }

        .md-login-shell {
          width: 100%;
          max-width: 1050px;
          min-height: 620px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
          border: 1px solid var(--border-color, #e5ebe7);
          border-radius: 24px;
          background: var(--surface-color, #ffffff);
          box-shadow: 0 24px 75px rgba(20, 45, 31, .10);
        }

        .md-login-brand {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          overflow: hidden;
          color: #ffffff;
          background: linear-gradient(145deg, #123d2a 0%, #116b43 55%, #15945b 100%);
        }

        .md-login-brand::before,
        .md-login-brand::after {
          content: "";
          position: absolute;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 50%;
          pointer-events: none;
        }

        .md-login-brand::before {
          width: 420px;
          height: 420px;
          right: -190px;
          top: -130px;
        }

        .md-login-brand::after {
          width: 330px;
          height: 330px;
          right: -120px;
          bottom: -150px;
        }

        .md-login-brand-content,
        .md-login-brand-footer,
        .md-login-logo {
          position: relative;
          z-index: 1;
        }

        .md-login-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -.8px;
          color: #ffffff;
          text-decoration: none;
        }

        .md-login-logo-icon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: rgba(255,255,255,.17);
          border: 1px solid rgba(255,255,255,.2);
          font-size: 23px;
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
          border: 1px solid rgba(255,255,255,.2);
          border-radius: 30px;
          background: rgba(255,255,255,.10);
          color: #e4ffed;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .md-login-brand h1 {
          max-width: 410px;
          margin: 25px 0 17px;
          color: #ffffff;
          font-size: clamp(34px, 4vw, 49px);
          line-height: 1.12;
          font-weight: 800;
          letter-spacing: -1.8px;
        }

        .md-login-brand-content > p {
          max-width: 390px;
          margin: 0;
          color: rgba(255,255,255,.78);
          font-size: 15px;
          line-height: 1.8;
        }

        .md-login-benefits {
          display: grid;
          gap: 17px;
          margin-top: 36px;
        }

        .md-login-benefit {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,.92);
          font-size: 14px;
        }

        .md-login-benefit-icon {
          width: 29px;
          height: 29px;
          display: grid;
          flex-shrink: 0;
          place-items: center;
          border-radius: 9px;
          background: rgba(255,255,255,.15);
          font-size: 14px;
        }

        .md-login-brand-footer {
          color: rgba(255,255,255,.62);
          font-size: 12px;
        }

        .md-login-form-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 55px 50px;
        }

        .md-login-form-content {
          width: 100%;
          max-width: 370px;
        }

        .md-login-mobile-logo {
          display: none;
          margin-bottom: 35px;
          color: #147548;
          font-size: 22px;
          font-weight: 800;
          text-decoration: none;
        }

        .md-login-heading {
          margin: 0 0 9px;
          color: var(--text-color, #17231d);
          font-size: 29px;
          font-weight: 800;
          letter-spacing: -.9px;
        }

        .md-login-subheading {
          margin: 0 0 34px;
          color: var(--muted-color, #748078);
          font-size: 14px;
          line-height: 1.7;
        }

        .md-login-field {
          margin-bottom: 21px;
        }

        .md-login-field label {
          display: block;
          margin-bottom: 9px;
          color: var(--text-color, #26352c);
          font-size: 13px;
          font-weight: 700;
        }

        .md-login-input-wrap {
          position: relative;
        }

        .md-login-input {
          width: 100%;
          height: 51px;
          padding: 0 15px;
          border: 1px solid var(--border-color, #dfe7e1);
          border-radius: 10px;
          outline: none;
          background: var(--input-background, var(--surface-color, #ffffff));
          color: var(--text-color, #17231d);
          font: inherit;
          font-size: 14px;
          transition: border-color .2s, box-shadow .2s;
        }

        .md-login-input:focus {
          border-color: #16945b;
          box-shadow: 0 0 0 4px rgba(22,148,91,.10);
        }

        .md-login-password {
          padding-right: 67px;
        }

        .md-login-password-toggle {
          position: absolute;
          top: 50%;
          right: 13px;
          transform: translateY(-50%);
          padding: 5px;
          border: 0;
          background: transparent;
          color: #168451;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .md-login-button {
          width: 100%;
          min-height: 51px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(135deg, #16834f, #0c9b5b);
          color: #ffffff;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
          box-shadow: 0 7px 17px rgba(18, 131, 78, .18);
          transition: transform .2s, box-shadow .2s, opacity .2s;
        }

        .md-login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 22px rgba(18, 131, 78, .25);
        }

        .md-login-button:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .md-login-error {
          margin-bottom: 22px;
          padding: 13px 15px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          background: #fff1f2;
          color: #b42332;
          font-size: 13px;
          line-height: 1.6;
        }

        .md-login-error a {
          display: inline-block;
          margin-top: 6px;
          color: #a31628;
          font-weight: 750;
        }

        .md-login-divider {
          display: flex;
          align-items: center;
          gap: 13px;
          margin: 27px 0;
          color: var(--muted-color, #929b95);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .7px;
        }

        .md-login-divider::before,
        .md-login-divider::after {
          content: "";
          height: 1px;
          flex: 1;
          background: var(--border-color, #e5ebe7);
        }

        .md-login-register {
          margin: 0;
          color: var(--muted-color, #748078);
          text-align: center;
          font-size: 13px;
        }

        .md-login-register a {
          color: #168451;
          font-weight: 750;
          text-decoration: none;
        }

        .md-login-register a:hover {
          text-decoration: underline;
        }

        .md-login-back {
          display: block;
          margin-top: 24px;
          color: var(--muted-color, #87928a);
          text-align: center;
          font-size: 12px;
          text-decoration: none;
        }

        .md-login-back:hover {
          color: #168451;
        }

        .md-login-select-intro {
          margin-bottom: 25px;
          padding: 15px;
          border: 1px solid #d9eee1;
          border-radius: 11px;
          background: #f0faf3;
          color: #24613e;
          font-size: 13px;
          line-height: 1.6;
        }

        .md-login-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,.45);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: md-login-spin .7s linear infinite;
        }

        @keyframes md-login-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 800px) {
          .md-login-shell {
            max-width: 490px;
            min-height: auto;
            grid-template-columns: 1fr;
          }

          .md-login-brand {
            display: none;
          }

          .md-login-form-panel {
            padding: 48px 35px;
          }

          .md-login-mobile-logo {
            display: inline-block;
          }
        }

        @media (max-width: 480px) {
          .md-login {
            min-height: 100vh;
            padding: 15px;
          }

          .md-login-shell {
            border-radius: 18px;
          }

          .md-login-form-panel {
            padding: 35px 23px;
          }

          .md-login-heading {
            font-size: 26px;
          }

          .md-login-subheading {
            margin-bottom: 27px;
          }
        }
      `}</style>

      <div className="md-login-shell">
        {/* LEFT BRAND PANEL */}
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
              Your business.
              <br />
              Your control.
            </h1>

            <p>
              Everything you need to manage your business,
              monitor performance and serve your customers
              from one place.
            </p>

            <div className="md-login-benefits">
              <div className="md-login-benefit">
                <span className="md-login-benefit-icon">✓</span>
                Manage products and inventory
              </div>

              <div className="md-login-benefit">
                <span className="md-login-benefit-icon">✓</span>
                Track sales and business performance
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

        {/* RIGHT LOGIN PANEL */}
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
                    autoFocus
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

                <div style={{ textAlign: "right", marginTop: "-8px", marginBottom: "24px" }}>
                  <Link
                    to="/forgot-password"
                    style={{
                      color: "#168451",
                      fontSize: "12px",
                      fontWeight: 650,
                      textDecoration: "none",
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>

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
                      <span aria-hidden="true">→</span>
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
                  Continue to workspace
                  <span aria-hidden="true">→</span>
                </button>

                <button
                  type="button"
                  className="md-login-button"
                  onClick={() => {
                    setSelectingBusiness(false);
                    setError("");
                  }}
                  style={{
                    marginTop: "12px",
                    background: "transparent",
                    color: "var(--text-color, #26352c)",
                    border: "1px solid var(--border-color, #dfe7e1)",
                    boxShadow: "none",
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
    </div>
  );
}

export default AdminLogin;
