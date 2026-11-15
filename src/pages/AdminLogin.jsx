import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import api from "../api/api";
import ThemeSwitcher from "../components/ThemeSwitcher";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");

  const finishLogin = async () => {
    const pendingBusiness = sessionStorage.getItem("mydukaPendingBusiness");

    if (pendingBusiness) {
      const details = JSON.parse(pendingBusiness);
      const response = await api.post("/businesses", {
        name: details.name,
        slug: details.slug,
        phone: details.phone,
        address: details.address,
      });

      const business = response.data.business;

      if (!business?.id) {
        throw new Error("Your account was created, but the business could not be created.");
      }

      localStorage.setItem("mydukaBusinessId", business.id);
      sessionStorage.removeItem("mydukaPendingBusiness");
      navigate("/admin", { replace: true });
      return;
    }

    const response = await api.get("/businesses");
    const availableBusinesses = response.data.businesses || [];

    if (availableBusinesses.length === 0) {
      setError("Your account has no business yet. Please register your business.");
      return;
    }

    if (availableBusinesses.length === 1) {
      localStorage.setItem("mydukaBusinessId", availableBusinesses[0].id);
      navigate("/admin", { replace: true });
      return;
    }

    setBusinesses(availableBusinesses);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (loginError) throw loginError;

      await finishLogin();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        "Unable to sign in. Please check your details."
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
    <div className="md-login-page">
      <style>{`
        .md-login-page {
          min-height: 100vh;
          background: var(--background);
          color: var(--text-primary);
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: var(--font-family);
        }

        .md-login-brand {
          padding: 55px;
          background: linear-gradient(145deg, var(--primary), #3931b9);
          color: #fff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .md-login-logo {
          display: flex;
          align-items: center;
          gap: 11px;
          font-size: 25px;
          font-weight: 800;
          color: #fff;
        }

        .md-login-logo-icon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: rgba(255,255,255,.17);
          font-size: 23px;
        }

        .md-login-brand-content {
          max-width: 490px;
          margin: auto 0;
        }

        .md-login-brand-content h1 {
          color: #fff;
          font-size: clamp(34px, 4vw, 53px);
          line-height: 1.13;
          font-weight: 800;
          letter-spacing: -1.5px;
          margin-bottom: 22px;
        }

        .md-login-brand-content p {
          color: rgba(255,255,255,.82);
          font-size: 16px;
          line-height: 1.8;
        }

        .md-login-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 25px;
          color: rgba(255,255,255,.94);
          font-size: 14px;
        }

        .md-login-feature i {
          font-size: 19px;
        }

        .md-login-brand-footer {
          color: rgba(255,255,255,.7);
          font-size: 12px;
        }

        .md-login-main {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 45px 25px;
          background: var(--background);
        }

        .md-login-switcher {
          position: absolute;
          top: 24px;
          right: 25px;
        }

        .md-login-form-wrapper {
          width: 100%;
          max-width: 430px;
        }

        .md-login-mobile-logo {
          display: none;
          margin-bottom: 42px;
        }

        .md-login-heading {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -1px;
          margin-bottom: 8px;
          color: var(--text-primary);
        }

        .md-login-subtitle {
          color: var(--text-secondary);
          margin-bottom: 32px;
          font-size: 14px;
        }

        .md-login-label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 650;
        }

        .md-login-field {
          position: relative;
          margin-bottom: 21px;
        }

        .md-login-input {
          width: 100%;
          min-height: 49px;
          padding: 12px 15px;
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          background: var(--input-background);
          color: var(--input-text);
          outline: none;
        }

        .md-login-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px var(--focus-ring);
        }

        .md-login-password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          color: var(--text-secondary);
        }

        .md-login-submit {
          width: 100%;
          min-height: 49px;
          border: 0;
          border-radius: var(--radius-md);
          background: var(--primary);
          color: #fff;
          font-weight: 700;
          margin-top: 8px;
          transition: .2s ease;
        }

        .md-login-submit:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
        }

        .md-login-submit:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .md-login-error {
          padding: 12px 14px;
          margin-bottom: 20px;
          border-radius: var(--radius-md);
          color: var(--danger);
          background: var(--danger-bg);
          font-size: 13px;
        }

        .md-login-divider {
          height: 1px;
          background: var(--border);
          margin: 28px 0;
        }

        .md-login-register {
          text-align: center;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .md-login-register a {
          color: var(--primary);
          font-weight: 700;
        }

        .md-login-business-select {
          margin-bottom: 18px;
        }

        @media(max-width: 850px) {
          .md-login-page {
            grid-template-columns: 1fr;
          }

          .md-login-brand {
            display: none;
          }

          .md-login-main {
            min-height: 100vh;
          }

          .md-login-mobile-logo {
            display: flex;
          }
        }

        @media(max-width: 480px) {
          .md-login-main {
            padding: 85px 22px 35px;
          }

          .md-login-heading {
            font-size: 26px;
          }
        }
      `}</style>

      <section className="md-login-brand">
        <div className="md-login-logo">
          <span className="md-login-logo-icon">
            <i className="bi bi-shop-window" />
          </span>
          MyDuka
        </div>

        <div className="md-login-brand-content">
          <h1>Your business.<br />Your control.</h1>
          <p>
            Manage your products, inventory, sales, customers and branches
            from one intelligent business management platform.
          </p>

          <div className="md-login-feature">
            <i className="bi bi-check-circle-fill" />
            Complete business management
          </div>
          <div className="md-login-feature">
            <i className="bi bi-check-circle-fill" />
            Real-time inventory and sales visibility
          </div>
          <div className="md-login-feature">
            <i className="bi bi-check-circle-fill" />
            Manage your business from anywhere
          </div>
        </div>

        <div className="md-login-brand-footer">
          © {new Date().getFullYear()} MyDuka. All rights reserved.
        </div>
      </section>

      <main className="md-login-main">
        <div className="md-login-switcher">
          <ThemeSwitcher />
        </div>

        <div className="md-login-form-wrapper">
          <div className="md-login-mobile-logo md-login-logo">
            <span className="md-login-logo-icon" style={{ background: "var(--primary)", color: "#fff" }}>
              <i className="bi bi-shop-window" />
            </span>
            <span style={{ color: "var(--text-primary)" }}>MyDuka</span>
          </div>

          <h2 className="md-login-heading">
            {businesses.length ? "Choose your business" : "Welcome back"}
          </h2>

          <p className="md-login-subtitle">
            {businesses.length
              ? "Select the business workspace you want to access."
              : "Sign in to access your business workspace."}
          </p>

          {error && <div className="md-login-error">{error}</div>}

          {businesses.length ? (
            <>
              <label className="md-login-label">Business workspace</label>
              <select
                className="md-login-input md-login-business-select"
                value={selectedBusiness}
                onChange={(event) => setSelectedBusiness(event.target.value)}
              >
                <option value="">Select a business</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>

              <button
                className="md-login-submit"
                onClick={handleBusinessSelection}
              >
                Continue to dashboard
              </button>
            </>
          ) : (
            <form onSubmit={handleLogin}>
              <div className="md-login-field">
                <label className="md-login-label">Email address</label>
                <input
                  className="md-login-input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="md-login-field">
                <label className="md-login-label">Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="md-login-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{ paddingRight: 48 }}
                    required
                  />
                  <button
                    type="button"
                    className="md-login-password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} />
                  </button>
                </div>
              </div>

              <button className="md-login-submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in to MyDuka"}
              </button>
            </form>
          )}

          <div className="md-login-divider" />

          <div className="md-login-register">
            Don't have an account?{" "}
            <Link to="/business-register">Create your business account</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminLogin;
