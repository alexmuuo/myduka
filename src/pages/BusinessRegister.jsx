import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import ThemeSwitcher from "../components/ThemeSwitcher";

function BusinessRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ownerName: "",
    businessName: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const createSlug = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleBusinessName = (value) => {
    setForm((previous) => ({
      ...previous,
      businessName: value,
      slug: createSlug(value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (!form.businessName.trim() || !form.slug.trim()) {
      setError("Please enter a valid business name.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            full_name: form.ownerName.trim(),
            business_name: form.businessName.trim(),
          },
        },
      });

      if (signupError) throw signupError;

      sessionStorage.setItem(
        "mydukaPendingBusiness",
        JSON.stringify({
          name: form.businessName.trim(),
          slug: form.slug.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        })
      );

      if (data.session) {
        setSuccess("Your account has been created. Taking you to sign in...");
        setTimeout(() => navigate("/admin-login"), 1200);
      } else {
        setSuccess(
          "Your account has been created. Check your email for the confirmation link, then sign in to finish setting up your business."
        );
      }
    } catch (err) {
      setError(
        err.message ||
        "We could not create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="md-register-page">
      <style>{`
        .md-register-page {
          min-height: 100vh;
          padding: 35px 20px 55px;
          background: var(--background);
          color: var(--text-primary);
          font-family: var(--font-family);
        }

        .md-register-topbar {
          max-width: 1100px;
          margin: 0 auto 35px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .md-register-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .md-register-logo-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          color: #fff;
          background: var(--primary);
          font-size: 22px;
        }

        .md-register-card {
          width: 100%;
          max-width: 760px;
          margin: auto;
          padding: 36px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
        }

        .md-register-heading {
          font-size: 29px;
          font-weight: 800;
          letter-spacing: -.8px;
          margin: 0 0 7px;
        }

        .md-register-description {
          color: var(--text-secondary);
          font-size: 14px;
          margin-bottom: 28px;
        }

        .md-register-section {
          margin: 27px 0 17px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border);
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 750;
        }

        .md-register-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .md-register-field label {
          display: block;
          margin-bottom: 7px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .md-register-input {
          width: 100%;
          min-height: 46px;
          padding: 11px 13px;
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          background: var(--input-background);
          color: var(--input-text);
          outline: none;
        }

        .md-register-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px var(--focus-ring);
        }

        .md-register-input:disabled {
          opacity: .7;
        }

        .md-register-hint {
          margin-top: 5px;
          font-size: 11px;
          color: var(--text-muted);
        }

        .md-register-password {
          position: relative;
        }

        .md-register-password button {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          color: var(--text-secondary);
        }

        .md-register-alert {
          padding: 12px 14px;
          border-radius: var(--radius-md);
          margin-bottom: 18px;
          font-size: 13px;
        }

        .md-register-error {
          color: var(--danger);
          background: var(--danger-bg);
        }

        .md-register-success {
          color: var(--success);
          background: var(--success-bg);
        }

        .md-register-submit {
          width: 100%;
          min-height: 49px;
          margin-top: 27px;
          border: 0;
          border-radius: var(--radius-md);
          background: var(--primary);
          color: white;
          font-weight: 750;
        }

        .md-register-submit:hover {
          background: var(--primary-hover);
        }

        .md-register-submit:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .md-register-footer {
          margin-top: 22px;
          text-align: center;
          color: var(--text-secondary);
          font-size: 13px;
        }

        .md-register-footer a {
          color: var(--primary);
          font-weight: 750;
        }

        @media(max-width: 600px) {
          .md-register-card {
            padding: 23px 18px;
          }

          .md-register-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .md-register-heading {
            font-size: 25px;
          }

          .md-register-page {
            padding: 22px 13px 35px;
          }
        }
      `}</style>

      <header className="md-register-topbar">
        <Link to="/" className="md-register-logo">
          <span className="md-register-logo-icon">
            <i className="bi bi-shop-window" />
          </span>
          MyDuka
        </Link>

        <ThemeSwitcher />
      </header>

      <main className="md-register-card">
        <h1 className="md-register-heading">Create your business account</h1>
        <p className="md-register-description">
          Set up your MyDuka account and register your business workspace.
        </p>

        {error && (
          <div className="md-register-alert md-register-error">{error}</div>
        )}

        {success && (
          <div className="md-register-alert md-register-success">{success}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="md-register-section">Account information</div>

          <div className="md-register-grid">
            <div className="md-register-field">
              <label>Your full name *</label>
              <input
                className="md-register-input"
                value={form.ownerName}
                onChange={(e) => updateField("ownerName", e.target.value)}
                placeholder="Full name"
                autoComplete="name"
                required
              />
            </div>

            <div className="md-register-field">
              <label>Email address *</label>
              <input
                className="md-register-input"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="md-register-field">
              <label>Password *</label>
              <div className="md-register-password">
                <input
                  className="md-register-input"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label="Toggle password visibility"
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} />
                </button>
              </div>
            </div>

            <div className="md-register-field">
              <label>Confirm password *</label>
              <input
                className="md-register-input"
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                placeholder="Confirm password"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="md-register-section">Business information</div>

          <div className="md-register-grid">
            <div className="md-register-field">
              <label>Business name *</label>
              <input
                className="md-register-input"
                value={form.businessName}
                onChange={(e) => handleBusinessName(e.target.value)}
                placeholder="e.g. xxxx Retail Store"
                required
              />
            </div>

            <div className="md-register-field">
              <label>Store URL slug *</label>
              <input
                className="md-register-input"
                value={form.slug}
                onChange={(e) => updateField("slug", createSlug(e.target.value))}
                placeholder="xxxx-retail-store"
                required
              />
              <div className="md-register-hint">
                Used to identify your store. You can customise it later.
              </div>
            </div>

            <div className="md-register-field">
              <label>Business phone *</label>
              <input
                className="md-register-input"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="Business phone number"
                required
              />
            </div>

            <div className="md-register-field">
              <label>Business address</label>
              <input
                className="md-register-input"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Town, location or address"
              />
            </div>
          </div>

          <button className="md-register-submit" disabled={loading}>
            {loading ? "Creating your account..." : "Create business account"}
          </button>
        </form>

        <div className="md-register-footer">
          Already have an account? <Link to="/admin-login">Sign in</Link>
        </div>
      </main>
    </div>
  );
}

export default BusinessRegister;
