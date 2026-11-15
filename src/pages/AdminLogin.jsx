import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import api from "../api/api";
import ThemeSwitcher from "../components/ThemeSwitcher";

const readPendingBusiness = () => {
  try {
    const saved =
      localStorage.getItem("mydukaPendingBusiness") ||
      sessionStorage.getItem("mydukaPendingBusiness");

    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const clearPendingBusiness = () => {
  localStorage.removeItem("mydukaPendingBusiness");
  sessionStorage.removeItem("mydukaPendingBusiness");
};

const getBusinessDetails = (user, pending) => {
  const metadata = user?.user_metadata || {};

  return {
    name: pending?.name || metadata.business_name || "",
    slug:
      pending?.slug ||
      metadata.business_slug ||
      "",
    phone:
      pending?.phone ||
      metadata.business_phone ||
      "",
    address:
      pending?.address ||
      metadata.business_address ||
      "",
  };
};

function AdminLogin() {
  const navigate = useNavigate();
  const processingRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");

  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  const [setupDetails, setSetupDetails] = useState({
    name: "",
    slug: "",
    phone: "",
    address: "",
  });

  const [needsBusinessDetails, setNeedsBusinessDetails] =
    useState(false);

  const [showLogin, setShowLogin] = useState(true);

  const updateSetupField = (field, value) => {
    setSetupDetails((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const goToDashboard = (businessId) => {
    localStorage.setItem("mydukaBusinessId", businessId);
    navigate("/admin", { replace: true });
  };

  const finishAuthenticatedLogin = useCallback(
    async (user) => {
      if (!user?.id) {
        throw new Error("Your authenticated account could not be verified.");
      }

      setAuthenticatedUser(user);
      setError("");
      setSuccess("");

      const pending = readPendingBusiness();
      const details = getBusinessDetails(user, pending);

      // Always check existing memberships first.
      // This prevents duplicate businesses if a previous request
      // created the business but the browser lost its response.
      const response = await api.get("/businesses");

      const availableBusinesses =
        response.data?.businesses || [];

      if (!Array.isArray(availableBusinesses)) {
        throw new Error("Unable to retrieve your business workspaces.");
      }

      // If the pending business already exists, reuse it.
      if (details.slug) {
        const existingBusiness = availableBusinesses.find(
          (business) =>
            business.slug?.toLowerCase() ===
            details.slug.toLowerCase()
        );

        if (existingBusiness) {
          clearPendingBusiness();
          setNeedsBusinessDetails(false);
          goToDashboard(existingBusiness.id);
          return;
        }
      }

      // Recover missing business information after email confirmation.
      if (pending || details.name || availableBusinesses.length === 0) {
        if (details.name && details.slug) {
          try {
            const createResponse = await api.post("/businesses", {
              name: details.name,
              slug: details.slug,
              phone: details.phone || null,
              address: details.address || null,
            });

            const business = createResponse.data?.business;

            if (!business?.id) {
              throw new Error(
                "The server did not return the newly created business."
              );
            }

            clearPendingBusiness();
            setNeedsBusinessDetails(false);
            goToDashboard(business.id);
            return;
          } catch (creationError) {
            // The request may have succeeded even if the response
            // was interrupted. Check memberships again before failing.
            try {
              const retryResponse = await api.get("/businesses");

              const retryBusinesses =
                retryResponse.data?.businesses || [];

              const createdBusiness = retryBusinesses.find(
                (business) =>
                  business.slug?.toLowerCase() ===
                  details.slug.toLowerCase()
              );

              if (createdBusiness) {
                clearPendingBusiness();
                setNeedsBusinessDetails(false);
                goToDashboard(createdBusiness.id);
                return;
              }
            } catch {
              // Preserve the original registration error below.
            }

            throw creationError;
          }
        }

        // No complete business details survived the confirmation
        // redirect. Ask the authenticated user to complete them.
        if (details.name || pending) {
          setSetupDetails({
            name: details.name,
            slug: details.slug,
            phone: details.phone,
            address: details.address,
          });

          setNeedsBusinessDetails(true);
          setShowLogin(false);
          return;
        }
      }

      if (availableBusinesses.length === 0) {
        setError(
          "Your account is confirmed, but it does not belong to a business yet. Complete your business details below."
        );

        setSetupDetails({
          name: user.user_metadata?.business_name || "",
          slug: "",
          phone: "",
          address: "",
        });

        setNeedsBusinessDetails(true);
        setShowLogin(false);
        return;
      }

      if (availableBusinesses.length === 1) {
        goToDashboard(availableBusinesses[0].id);
        return;
      }

      setBusinesses(availableBusinesses);
      setSelectedBusiness(availableBusinesses[0].id);
      setShowLogin(false);
    },
    [navigate]
  );

  const processAuthenticatedUser = useCallback(
    async (user) => {
      // Prevent simultaneous business creation requests.
      if (processingRef.current) {
        return processingRef.current;
      }

      const task = (async () => {
        setLoading(true);
        setError("");
        setSuccess("Verifying your account and business...");

        try {
          await finishAuthenticatedLogin(user);
        } catch (err) {
          console.error("MyDuka onboarding error:", err);

          setSuccess("");
          setError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              err.message ||
              "Unable to complete your business setup."
          );
        } finally {
          setLoading(false);
        }
      })();

      processingRef.current = task;

      try {
        await task;
      } finally {
        processingRef.current = null;
      }
    },
    [finishAuthenticatedLogin]
  );

  // Recover a Supabase session after email confirmation.
  useEffect(() => {
    let active = true;

    const recoverSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (active && session?.user) {
          setEmail(session.user.email || "");
          await processAuthenticatedUser(session.user);
        }
      } catch (err) {
        if (active) {
          console.error("Session recovery error:", err);
          setError(
            "We couldn't restore your login session. Please sign in again."
          );
        }
      }
    };

    recoverSession();

    return () => {
      active = false;
    };
  }, [processAuthenticatedUser]);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (loginError) throw loginError;

      if (!data.user) {
        throw new Error("Supabase did not return an authenticated user.");
      }

      setSuccess("Login successful. Preparing your workspace...");

      await processAuthenticatedUser(data.user);
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message ||
          "Unable to sign in. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteBusiness = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const details = {
      name: setupDetails.name.trim(),
      slug: setupDetails.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      phone: setupDetails.phone.trim(),
      address: setupDetails.address.trim(),
    };

    if (!details.name || !details.slug) {
      setError("Business name and store URL are required.");
      return;
    }

    if (details.name.length > 150) {
      setError("Business name cannot exceed 150 characters.");
      return;
    }

    if (details.slug.length > 60) {
      setError("Store URL cannot exceed 60 characters.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      // Check again before creating to avoid duplicates.
      const existingResponse = await api.get("/businesses");

      const existingBusinesses =
        existingResponse.data?.businesses || [];

      const existing = existingBusinesses.find(
        (business) =>
          business.slug?.toLowerCase() ===
          details.slug.toLowerCase()
      );

      if (existing) {
        clearPendingBusiness();
        goToDashboard(existing.id);
        return;
      }

      const response = await api.post("/businesses", {
        name: details.name,
        slug: details.slug,
        phone: details.phone || null,
        address: details.address || null,
      });

      const business = response.data?.business;

      if (!business?.id) {
        throw new Error(
          "Business creation did not return a valid business ID."
        );
      }

      clearPendingBusiness();
      setNeedsBusinessDetails(false);

      goToDashboard(business.id);
    } catch (err) {
      console.error("Business setup error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to complete business registration."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSelection = () => {
    if (!selectedBusiness) {
      setError("Please select a business workspace.");
      return;
    }

    const exists = businesses.some(
      (business) => business.id === selectedBusiness
    );

    if (!exists) {
      setError("The selected business is invalid.");
      return;
    }

    goToDashboard(selectedBusiness);
  };

  const handleLogout = async () => {
    setLoading(true);

    try {
      await supabase.auth.signOut();
      localStorage.removeItem("mydukaBusinessId");

      setAuthenticatedUser(null);
      setBusinesses([]);
      setNeedsBusinessDetails(false);
      setShowLogin(true);
      setPassword("");
      setSuccess("");
      setError("");
    } catch (err) {
      setError(err.message || "Unable to sign out.");
    } finally {
      setLoading(false);
    }
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
          text-decoration: none;
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
          padding: 65px 30px 45px;
          background: var(--background);
        }

        .md-login-switcher {
          position: absolute;
          top: 24px;
          right: 25px;
        }

        .md-login-form-wrapper {
          width: 100%;
          max-width: 450px;
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
          margin-bottom: 30px;
          font-size: 14px;
          line-height: 1.7;
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
          margin-bottom: 20px;
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
          font: inherit;
          font-size: 14px;
        }

        .md-login-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px var(--focus-ring);
        }

        .md-login-input:disabled {
          opacity: .7;
          cursor: not-allowed;
        }

        .md-login-password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 16px;
        }

        .md-login-submit {
          width: 100%;
          min-height: 49px;
          border: 0;
          border-radius: var(--radius-md);
          background: var(--primary);
          color: #fff;
          font-weight: 750;
          margin-top: 8px;
          transition: .2s ease;
          cursor: pointer;
        }

        .md-login-submit:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
        }

        .md-login-submit:disabled {
          opacity: .65;
          cursor: not-allowed;
          transform: none;
        }

        .md-login-error,
        .md-login-success {
          padding: 12px 14px;
          margin-bottom: 20px;
          border-radius: var(--radius-md);
          font-size: 13px;
          line-height: 1.6;
        }

        .md-login-error {
          color: var(--danger);
          background: var(--danger-bg);
        }

        .md-login-success {
          color: var(--success);
          background: var(--success-bg);
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
          line-height: 1.8;
        }

        .md-login-register a {
          color: var(--primary);
          font-weight: 700;
        }

        .md-login-business-select {
          margin-bottom: 18px;
        }

        .md-login-setup-note {
          margin-bottom: 22px;
          padding: 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--surface);
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.7;
        }

        .md-login-setup-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 14px;
        }

        .md-login-setup-grid .full {
          grid-column: 1 / -1;
        }

        .md-login-logout {
          width: 100%;
          margin-top: 15px;
          padding: 10px;
          border: 0;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 13px;
        }

        .md-login-logout:hover {
          color: var(--primary);
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

        @media(max-width: 520px) {
          .md-login-main {
            padding: 85px 20px 35px;
          }

          .md-login-heading {
            font-size: 26px;
          }

          .md-login-setup-grid {
            grid-template-columns: 1fr;
          }

          .md-login-setup-grid .full {
            grid-column: auto;
          }
        }
      `}</style>

      <section className="md-login-brand">
        <Link to="/" className="md-login-logo">
          <span className="md-login-logo-icon">
            <i className="bi bi-shop-window" />
          </span>
          MyDuka
        </Link>

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
            <span
              className="md-login-logo-icon"
              style={{
                background: "var(--primary)",
                color: "#fff",
              }}
            >
              <i className="bi bi-shop-window" />
            </span>

            <span style={{ color: "var(--text-primary)" }}>
              MyDuka
            </span>
          </div>

          <h2 className="md-login-heading">
            {needsBusinessDetails
              ? "Complete your business setup"
              : businesses.length
                ? "Choose your business"
                : authenticatedUser
                  ? "Preparing your workspace"
                  : "Welcome back"}
          </h2>

          <p className="md-login-subtitle">
            {needsBusinessDetails
              ? "Your account is authenticated. Complete the remaining business information to create your workspace."
              : businesses.length
                ? "Select the business workspace you want to access."
                : authenticatedUser
                  ? "We're checking your account and restoring your business workspace."
                  : "Sign in to access your business workspace."}
          </p>

          {error && (
            <div className="md-login-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="md-login-success" role="status">
              {success}
            </div>
          )}

          {needsBusinessDetails ? (
            <form onSubmit={handleCompleteBusiness}>
              <div className="md-login-setup-note">
                Your email account is confirmed. We just need your business
                details to finish registration. Your business will be linked
                to your authenticated account.
              </div>

              <div className="md-login-setup-grid">
                <div className="md-login-field full">
                  <label className="md-login-label">
                    Business name *
                  </label>

                  <input
                    className="md-login-input"
                    value={setupDetails.name}
                    onChange={(event) =>
                      updateSetupField("name", event.target.value)
                    }
                    placeholder="e.g. My Retail Store"
                    required
                  />
                </div>

                <div className="md-login-field full">
                  <label className="md-login-label">
                    Store URL slug *
                  </label>

                  <input
                    className="md-login-input"
                    value={setupDetails.slug}
                    onChange={(event) =>
                      updateSetupField("slug", event.target.value)
                    }
                    placeholder="my-retail-store"
                    required
                  />
                </div>

                <div className="md-login-field">
                  <label className="md-login-label">
                    Business phone
                  </label>

                  <input
                    className="md-login-input"
                    type="tel"
                    value={setupDetails.phone}
                    onChange={(event) =>
                      updateSetupField("phone", event.target.value)
                    }
                    placeholder="Phone number"
                  />
                </div>

                <div className="md-login-field">
                  <label className="md-login-label">
                    Business address
                  </label>

                  <input
                    className="md-login-input"
                    value={setupDetails.address}
                    onChange={(event) =>
                      updateSetupField("address", event.target.value)
                    }
                    placeholder="Town or location"
                  />
                </div>
              </div>

              <button
                className="md-login-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Creating your business..."
                  : "Complete business registration"}
              </button>

              <button
                className="md-login-logout"
                type="button"
                onClick={handleLogout}
                disabled={loading}
              >
                Sign out
              </button>
            </form>
          ) : businesses.length > 0 ? (
            <>
              <label className="md-login-label">
                Business workspace
              </label>

              <select
                className="md-login-input md-login-business-select"
                value={selectedBusiness}
                onChange={(event) =>
                  setSelectedBusiness(event.target.value)
                }
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
                type="button"
                onClick={handleBusinessSelection}
                disabled={loading}
              >
                Continue to dashboard
              </button>

              <button
                className="md-login-logout"
                type="button"
                onClick={handleLogout}
                disabled={loading}
              >
                Sign out
              </button>
            </>
          ) : authenticatedUser ? (
            <button
              className="md-login-submit"
              type="button"
              onClick={handleLogout}
              disabled={loading}
            >
              Sign out
            </button>
          ) : showLogin ? (
            <form onSubmit={handleLogin}>
              <div className="md-login-field">
                <label className="md-login-label">
                  Email address
                </label>

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
                <label className="md-login-label">
                  Password
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    className="md-login-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{ paddingRight: 48 }}
                    required
                  />

                  <button
                    type="button"
                    className="md-login-password-toggle"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <i
                      className={`bi ${
                        showPassword ? "bi-eye-slash" : "bi-eye"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <button
                className="md-login-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in to MyDuka"}
              </button>
            </form>
          ) : null}

          <div className="md-login-divider" />

          {!authenticatedUser && (
            <div className="md-login-register">
              Don't have an account?{" "}
              <Link to="/business-register">
                Create your business account
              </Link>
            </div>
          )}

          {authenticatedUser && !needsBusinessDetails && (
            <div className="md-login-register">
              Signed in as {authenticatedUser.email}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminLogin;
