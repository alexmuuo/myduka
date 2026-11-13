import { useState } from "react";
import { NavLink } from "react-router-dom";

const navigation = [
  { label: "Overview", path: "/superadmin/dashboard", icon: "◫" },
  { label: "Businesses", path: "/superadmin/businesses", icon: "▦" },
  { label: "Users", path: "/superadmin/users", icon: "♙" },
  { label: "Subscriptions", path: "/superadmin/subscriptions", icon: "▤" },
  { label: "Analytics", path: "/superadmin/analytics", icon: "▥" },
  { label: "Support", path: "/superadmin/support", icon: "✉" },
  { label: "Audit Logs", path: "/superadmin/audit-logs", icon: "◷" },
  { label: "Settings", path: "/superadmin/settings", icon: "⚙" },
];

function SuperAdminProfile() {
  const [tab, setTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const [profile, setProfile] = useState({
    fullName: "Platform Administrator",
    email: "admin@myduka.com",
    phone: "",
    position: "Super Administrator",
    timezone: "Africa/Nairobi",
    language: "English",
  });

  const [password, setPassword] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    securityAlerts: true,
    loginNotifications: true,
  });

  function updateProfile(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function updatePreference(key, value) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function saveProfile(event) {
    event.preventDefault();
    setSaved(true);
  }

  function changePassword(event) {
    event.preventDefault();
    setPasswordMessage("");

    if (!password.current || !password.next || !password.confirm) {
      setPasswordMessage("Please complete all password fields.");
      return;
    }

    if (password.next.length < 8) {
      setPasswordMessage("Your new password must contain at least 8 characters.");
      return;
    }

    if (password.next !== password.confirm) {
      setPasswordMessage("The new passwords do not match.");
      return;
    }

    setPasswordMessage(
      "Preview validation successful. Password changes will be connected to authentication later."
    );

    setPassword({ current: "", next: "", confirm: "" });
  }

  return (
    <div className="sa-profile-layout">
      <style>{`
        .sa-profile-layout {
          min-height: 100vh;
          display: flex;
          background: var(--background);
          color: var(--text-primary);
          font-family: var(--font-family, Inter, sans-serif);
        }

        .sa-profile-sidebar {
          width: 250px;
          flex-shrink: 0;
          min-height: 100vh;
          padding: 25px 16px;
          display: flex;
          flex-direction: column;
          background: var(--sidebar-bg, #111827);
          color: white;
        }

        .sa-profile-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px 28px;
          margin-bottom: 25px;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .sa-profile-brand-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #2563eb;
          font-size: 19px;
          font-weight: 800;
        }

        .sa-profile-brand strong {
          display: block;
          font-size: 17px;
        }

        .sa-profile-brand small {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
          letter-spacing: 1.2px;
        }

        .sa-profile-nav-label {
          padding: 0 12px;
          margin-bottom: 12px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .sa-profile-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .sa-profile-nav a {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 12px;
          border-radius: 9px;
          color: #aebaca;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: .2s ease;
        }

        .sa-profile-nav a:hover,
        .sa-profile-nav a.active {
          color: white;
          background: rgba(59,130,246,.19);
        }

        .sa-profile-nav a.active {
          box-shadow: inset 3px 0 #60a5fa;
        }

        .sa-profile-nav-icon {
          width: 20px;
          text-align: center;
          font-size: 17px;
        }

        .sa-profile-sidebar-footer {
          margin-top: auto;
          padding: 18px 11px 0;
          border-top: 1px solid rgba(255,255,255,.1);
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.7;
        }

        .sa-profile-main {
          flex: 1;
          min-width: 0;
        }

        .sa-profile-topbar {
          min-height: 70px;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }

        .sa-profile-topbar h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 750;
        }

        .sa-profile-topbar p {
          margin: 4px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .sa-profile-admin {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .sa-profile-avatar-small {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          font-weight: 800;
        }

        .sa-profile-content {
          max-width: 1150px;
          padding: 32px;
          margin: 0 auto;
        }

        .sa-profile-heading {
          margin-bottom: 25px;
        }

        .sa-profile-heading h1 {
          margin: 0;
          font-size: clamp(23px, 3vw, 29px);
          font-weight: 800;
          letter-spacing: -1px;
        }

        .sa-profile-heading p {
          margin: 8px 0 0;
          color: var(--text-muted);
          font-size: 13px;
        }

        .sa-profile-banner {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 23px;
          margin-bottom: 22px;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: var(--surface);
        }

        .sa-profile-avatar-large {
          width: 76px;
          height: 76px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 20px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          font-size: 25px;
          font-weight: 850;
        }

        .sa-profile-banner-info {
          flex: 1;
          min-width: 0;
        }

        .sa-profile-banner-info h2 {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
        }

        .sa-profile-banner-info p {
          margin: 5px 0 10px;
          color: var(--text-muted);
          font-size: 12px;
        }

        .sa-profile-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 20px;
          background: rgba(34,197,94,.12);
          color: #16a34a;
          font-size: 10px;
          font-weight: 800;
        }

        .sa-profile-badge span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #16a34a;
        }

        .sa-profile-workspace {
          display: grid;
          grid-template-columns: 215px minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }

        .sa-profile-tabs {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
        }

        .sa-profile-tab {
          display: flex;
          align-items: center;
          gap: 11px;
          width: 100%;
          padding: 12px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: var(--text-secondary);
          text-align: left;
          cursor: pointer;
          font-size: 12px;
          font-weight: 650;
        }

        .sa-profile-tab.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .sa-profile-tab:hover {
          background: var(--surface-hover);
        }

        .sa-profile-panel {
          min-width: 0;
          padding: 23px;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: var(--surface);
        }

        .sa-profile-panel-heading {
          padding-bottom: 18px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }

        .sa-profile-panel-heading h2 {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
        }

        .sa-profile-panel-heading p {
          margin: 6px 0 0;
          color: var(--text-muted);
          font-size: 11px;
          line-height: 1.6;
        }

        .sa-profile-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .sa-profile-field {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .sa-profile-field.full {
          grid-column: 1 / -1;
        }

        .sa-profile-field label {
          font-size: 11px;
          font-weight: 750;
        }

        .sa-profile-field input,
        .sa-profile-field select {
          width: 100%;
          min-height: 41px;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--background);
          color: var(--text-primary);
          outline: none;
          font: inherit;
          font-size: 12px;
        }

        .sa-profile-field input:focus,
        .sa-profile-field select:focus {
          border-color: var(--primary);
        }

        .sa-profile-field input:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .sa-profile-field small {
          color: var(--text-muted);
          font-size: 10px;
        }

        .sa-profile-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 20px;
          margin-top: 22px;
          border-top: 1px solid var(--border);
        }

        .sa-profile-save {
          min-height: 40px;
          padding: 10px 19px;
          border: 0;
          border-radius: 8px;
          background: var(--primary);
          color: white;
          cursor: pointer;
          font-size: 11px;
          font-weight: 800;
        }

        .sa-profile-save:hover {
          background: var(--primary-hover);
        }

        .sa-profile-message {
          padding: 11px 13px;
          margin-top: 16px;
          border-radius: 8px;
          background: rgba(34,197,94,.1);
          color: #16a34a;
          font-size: 11px;
          line-height: 1.5;
        }

        .sa-profile-message.error {
          background: rgba(239,68,68,.1);
          color: #dc2626;
        }

        .sa-profile-security-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 15px;
          margin-bottom: 12px;
          border: 1px solid var(--border);
          border-radius: 9px;
        }

        .sa-profile-security-card strong {
          display: block;
          font-size: 12px;
        }

        .sa-profile-security-card p {
          margin: 5px 0 0;
          color: var(--text-muted);
          font-size: 10px;
        }

        .sa-profile-security-status {
          padding: 5px 9px;
          border-radius: 20px;
          background: rgba(234,179,8,.12);
          color: #ca8a04;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .sa-profile-toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 16px 0;
          border-bottom: 1px solid var(--border);
        }

        .sa-profile-toggle-row:last-child {
          border-bottom: 0;
        }

        .sa-profile-toggle-row strong {
          display: block;
          font-size: 12px;
        }

        .sa-profile-toggle-row p {
          margin: 5px 0 0;
          color: var(--text-muted);
          font-size: 10px;
        }

        .sa-profile-switch {
          position: relative;
          width: 42px;
          height: 24px;
          flex-shrink: 0;
          border: 0;
          border-radius: 30px;
          background: var(--border);
          cursor: pointer;
        }

        .sa-profile-switch span {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 4px rgba(0,0,0,.2);
          transition: .2s;
        }

        .sa-profile-switch.enabled {
          background: var(--primary);
        }

        .sa-profile-switch.enabled span {
          left: 21px;
        }

        .sa-profile-mobile-menu {
          display: none;
          padding: 7px 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
        }

        @media (max-width: 950px) {
          .sa-profile-workspace {
            grid-template-columns: 1fr;
          }

          .sa-profile-tabs {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .sa-profile-tab {
            justify-content: center;
          }
        }

        @media (max-width: 760px) {
          .sa-profile-sidebar {
            position: fixed;
            z-index: 100;
            top: 0;
            bottom: 0;
            left: 0;
            width: 260px;
            transform: translateX(-100%);
            transition: transform .25s ease;
          }

          .sa-profile-sidebar.open {
            transform: translateX(0);
          }

          .sa-profile-sidebar-overlay.visible {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 90;
            background: rgba(15,23,42,.55);
          }

          .sa-profile-mobile-menu {
            display: inline-flex;
          }

          .sa-profile-topbar {
            padding: 0 16px;
          }

          .sa-profile-content {
            padding: 22px 15px;
          }
        }

        @media (max-width: 520px) {
          .sa-profile-form {
            grid-template-columns: 1fr;
          }

          .sa-profile-field.full {
            grid-column: auto;
          }

          .sa-profile-tabs {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .sa-profile-tab {
            justify-content: flex-start;
            padding: 10px 8px;
            font-size: 10px;
          }

          .sa-profile-panel {
            padding: 17px;
          }

          .sa-profile-banner {
            align-items: flex-start;
            padding: 17px;
          }

          .sa-profile-avatar-large {
            width: 58px;
            height: 58px;
            border-radius: 15px;
            font-size: 20px;
          }

          .sa-profile-banner-info h2 {
            font-size: 15px;
          }

          .sa-profile-admin span:last-child {
            display: none;
          }
        }
      `}</style>

      <aside className={`sa-profile-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sa-profile-brand">
          <div className="sa-profile-brand-icon">M</div>
          <div>
            <strong>MyDuka</strong>
            <small>PLATFORM ADMIN</small>
          </div>
        </div>

        <div className="sa-profile-nav-label">Platform</div>

        <nav className="sa-profile-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="sa-profile-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sa-profile-sidebar-footer">
          <strong>MyDuka Platform</strong>
          <br />
          Super Administration
          <br />
          © 2026 MyDuka
        </div>
      </aside>

      <div
        className={`sa-profile-sidebar-overlay ${
          sidebarOpen ? "visible" : ""
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="sa-profile-main">
        <header className="sa-profile-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <button
              className="sa-profile-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <h2>Administrator Profile</h2>
              <p>Manage your platform administrator account</p>
            </div>
          </div>

          <div className="sa-profile-admin">
            <div className="sa-profile-avatar-small">SA</div>
            <span>Super Administrator</span>
          </div>
        </header>

        <section className="sa-profile-content">
          <div className="sa-profile-heading">
            <h1>My Profile</h1>
            <p>Manage your personal information and account security.</p>
          </div>

          <div className="sa-profile-banner">
            <div className="sa-profile-avatar-large">
              {profile.fullName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0].toUpperCase())
                .join("") || "SA"}
            </div>

            <div className="sa-profile-banner-info">
              <h2>{profile.fullName || "Administrator"}</h2>
              <p>{profile.email}</p>
              <span className="sa-profile-badge">
                <span />
                Platform administrator
              </span>
            </div>
          </div>

          <div className="sa-profile-workspace">
            <nav className="sa-profile-tabs">
              <button
                type="button"
                className={`sa-profile-tab ${
                  tab === "profile" ? "active" : ""
                }`}
                onClick={() => setTab("profile")}
              >
                ♙ Personal information
              </button>

              <button
                type="button"
                className={`sa-profile-tab ${
                  tab === "security" ? "active" : ""
                }`}
                onClick={() => setTab("security")}
              >
                ♢ Security
              </button>

              <button
                type="button"
                className={`sa-profile-tab ${
                  tab === "preferences" ? "active" : ""
                }`}
                onClick={() => setTab("preferences")}
              >
                ⚙ Preferences
              </button>
            </nav>

            <div className="sa-profile-panel">
              {tab === "profile" && (
                <>
                  <div className="sa-profile-panel-heading">
                    <h2>Personal information</h2>
                    <p>
                      Update the information associated with your platform
                      administrator account.
                    </p>
                  </div>

                  <form onSubmit={saveProfile}>
                    <div className="sa-profile-form">
                      <div className="sa-profile-field">
                        <label>Full name</label>
                        <input
                          value={profile.fullName}
                          onChange={(e) =>
                            updateProfile("fullName", e.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="sa-profile-field">
                        <label>Position</label>
                        <input value={profile.position} disabled />
                        <small>Platform role is managed by system permissions.</small>
                      </div>

                      <div className="sa-profile-field">
                        <label>Email address</label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) =>
                            updateProfile("email", e.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="sa-profile-field">
                        <label>Phone number</label>
                        <input
                          type="tel"
                          placeholder="+254..."
                          value={profile.phone}
                          onChange={(e) =>
                            updateProfile("phone", e.target.value)
                          }
                        />
                      </div>

                      <div className="sa-profile-field">
                        <label>Timezone</label>
                        <select
                          value={profile.timezone}
                          onChange={(e) =>
                            updateProfile("timezone", e.target.value)
                          }
                        >
                          <option value="Africa/Nairobi">
                            Africa/Nairobi (EAT)
                          </option>
                          <option value="UTC">UTC</option>
                          <option value="Europe/London">
                            Europe/London
                          </option>
                          <option value="America/New_York">
                            America/New York
                          </option>
                        </select>
                      </div>

                      <div className="sa-profile-field">
                        <label>Language</label>
                        <select
                          value={profile.language}
                          onChange={(e) =>
                            updateProfile("language", e.target.value)
                          }
                        >
                          <option>English</option>
                          <option>Swahili</option>
                        </select>
                      </div>
                    </div>

                    {saved && (
                      <div className="sa-profile-message">
                        ✓ Profile information saved in this preview.
                      </div>
                    )}

                    <div className="sa-profile-actions">
                      <button className="sa-profile-save" type="submit">
                        Save profile
                      </button>
                    </div>
                  </form>
                </>
              )}

              {tab === "security" && (
                <>
                  <div className="sa-profile-panel-heading">
                    <h2>Account security</h2>
                    <p>
                      Protect your platform administrator account and manage
                      your authentication details.
                    </p>
                  </div>

                  <div className="sa-profile-security-card">
                    <div>
                      <strong>Password</strong>
                      <p>Change your account password regularly.</p>
                    </div>
                    <span className="sa-profile-security-status">
                      Authentication pending
                    </span>
                  </div>

                  <form onSubmit={changePassword}>
                    <div className="sa-profile-form">
                      <div className="sa-profile-field full">
                        <label>Current password</label>
                        <input
                          type="password"
                          autoComplete="current-password"
                          value={password.current}
                          onChange={(e) =>
                            setPassword({
                              ...password,
                              current: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="sa-profile-field">
                        <label>New password</label>
                        <input
                          type="password"
                          autoComplete="new-password"
                          value={password.next}
                          onChange={(e) =>
                            setPassword({
                              ...password,
                              next: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="sa-profile-field">
                        <label>Confirm new password</label>
                        <input
                          type="password"
                          autoComplete="new-password"
                          value={password.confirm}
                          onChange={(e) =>
                            setPassword({
                              ...password,
                              confirm: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {passwordMessage && (
                      <div
                        className={`sa-profile-message ${
                          passwordMessage.includes("successful") ? "" : "error"
                        }`}
                      >
                        {passwordMessage}
                      </div>
                    )}

                    <div className="sa-profile-actions">
                      <button className="sa-profile-save" type="submit">
                        Update password
                      </button>
                    </div>
                  </form>
                </>
              )}

              {tab === "preferences" && (
                <>
                  <div className="sa-profile-panel-heading">
                    <h2>Account preferences</h2>
                    <p>
                      Choose which account-related notifications you want to
                      receive.
                    </p>
                  </div>

                  {[
                    {
                      key: "emailAlerts",
                      title: "Email notifications",
                      description:
                        "Receive important platform updates through email.",
                    },
                    {
                      key: "securityAlerts",
                      title: "Security alerts",
                      description:
                        "Receive alerts about important account security events.",
                    },
                    {
                      key: "loginNotifications",
                      title: "Login notifications",
                      description:
                        "Receive notifications when your account is accessed.",
                    },
                  ].map((item) => (
                    <div className="sa-profile-toggle-row" key={item.key}>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={preferences[item.key]}
                        className={`sa-profile-switch ${
                          preferences[item.key] ? "enabled" : ""
                        }`}
                        onClick={() =>
                          updatePreference(
                            item.key,
                            !preferences[item.key]
                          )
                        }
                      >
                        <span />
                      </button>
                    </div>
                  ))}

                  <div className="sa-profile-actions">
                    <button
                      className="sa-profile-save"
                      type="button"
                      onClick={() =>
                        alert("Preferences saved in this preview.")
                      }
                    >
                      Save preferences
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <p
            style={{
              marginTop: 18,
              color: "var(--text-muted)",
              fontSize: 10,
              textAlign: "center",
            }}
          >
            Frontend preview — account changes are not yet connected to
            authentication or permanent storage.
          </p>
        </section>
      </main>
    </div>
  );
}

export default SuperAdminProfile;
