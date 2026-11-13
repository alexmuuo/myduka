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

const defaultSettings = {
  platformName: "MyDuka",
  supportEmail: "support@myduka.com",
  contactEmail: "info@myduka.com",
  website: "https://myduka.com",
  allowRegistration: true,
  requireEmailVerification: true,
  requireBusinessApproval: false,
  defaultPlan: "Starter",
  trialDays: "14",
  maxBusinesses: "Unlimited",
  enforceStrongPasswords: true,
  requireAdminTwoFactor: false,
  sessionTimeout: "60",
  loginAttempts: "5",
  emailNotifications: true,
  newBusinessNotifications: true,
  subscriptionNotifications: true,
  securityNotifications: true,
  maintenanceMode: false,
  maintenanceMessage:
    "MyDuka is temporarily undergoing scheduled maintenance. Please check back shortly.",
};

function SettingToggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`platform-toggle ${checked ? "enabled" : ""}`}
    >
      <span />
    </button>
  );
}

function SettingRow({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <div className="platform-setting-row">
      <div className="platform-setting-copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <SettingToggle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

function SuperAdminSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
    setSaved(false);
  }

  function saveSettings(event) {
    event.preventDefault();
    setSaved(true);
  }

  function resetSettings() {
    setSettings(defaultSettings);
    setSaved(false);
  }

  const tabs = [
    { id: "general", label: "General", icon: "⚙" },
    { id: "registration", label: "Registration", icon: "▦" },
    { id: "subscriptions", label: "Subscriptions", icon: "▤" },
    { id: "security", label: "Security", icon: "♢" },
    { id: "notifications", label: "Notifications", icon: "♧" },
    { id: "maintenance", label: "Maintenance", icon: "⚒" },
  ];

  return (
    <div className="super-settings-layout">
      <style>{`
        .super-settings-layout {
          min-height: 100vh;
          display: flex;
          background: var(--background);
          color: var(--text-primary);
          font-family: var(--font-family, Inter, sans-serif);
        }

        .settings-sidebar {
          width: 250px;
          flex-shrink: 0;
          min-height: 100vh;
          padding: 25px 16px;
          display: flex;
          flex-direction: column;
          background: var(--sidebar-bg, #111827);
          color: #f8fafc;
        }

        .settings-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px 30px;
          margin-bottom: 25px;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .settings-brand-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #2563eb;
          font-size: 19px;
          font-weight: 800;
        }

        .settings-brand strong {
          display: block;
          font-size: 17px;
        }

        .settings-brand small {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
          letter-spacing: 1.2px;
        }

        .settings-nav-label {
          padding: 0 12px;
          margin-bottom: 12px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .settings-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .settings-nav a {
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

        .settings-nav a:hover,
        .settings-nav a.active {
          color: #fff;
          background: rgba(59,130,246,.19);
        }

        .settings-nav a.active {
          box-shadow: inset 3px 0 #60a5fa;
        }

        .settings-nav-icon {
          width: 20px;
          text-align: center;
          font-size: 17px;
        }

        .settings-sidebar-bottom {
          margin-top: auto;
          padding: 18px 11px 0;
          border-top: 1px solid rgba(255,255,255,.1);
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.7;
        }

        .settings-main {
          flex: 1;
          min-width: 0;
        }

        .settings-topbar {
          min-height: 70px;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }

        .settings-topbar h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
        }

        .settings-topbar p {
          margin: 3px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .settings-admin {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .settings-avatar {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          font-weight: 800;
        }

        .settings-content {
          max-width: 1250px;
          padding: 32px;
          margin: 0 auto;
        }

        .settings-heading {
          margin-bottom: 25px;
        }

        .settings-heading h1 {
          margin: 0;
          font-size: clamp(23px, 3vw, 29px);
          font-weight: 800;
          letter-spacing: -1px;
        }

        .settings-heading p {
          margin: 8px 0 0;
          color: var(--text-muted);
          font-size: 13px;
        }

        .settings-workspace {
          display: grid;
          grid-template-columns: 225px minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }

        .settings-tabs {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
        }

        .settings-tab {
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
          transition: .2s ease;
        }

        .settings-tab:hover {
          background: var(--surface-hover);
          color: var(--text-primary);
        }

        .settings-tab.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .settings-tab-icon {
          width: 20px;
          text-align: center;
          font-size: 16px;
        }

        .settings-panel {
          min-width: 0;
          padding: 23px;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: var(--surface);
        }

        .settings-panel-heading {
          padding-bottom: 19px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }

        .settings-panel-heading h2 {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
        }

        .settings-panel-heading p {
          margin: 6px 0 0;
          color: var(--text-muted);
          font-size: 11px;
          line-height: 1.6;
        }

        .settings-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .settings-field {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .settings-field.full {
          grid-column: 1 / -1;
        }

        .settings-field label {
          font-size: 11px;
          font-weight: 750;
        }

        .settings-field input,
        .settings-field select,
        .settings-field textarea {
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

        .settings-field textarea {
          min-height: 100px;
          resize: vertical;
          line-height: 1.6;
        }

        .settings-field input:focus,
        .settings-field select:focus,
        .settings-field textarea:focus {
          border-color: var(--primary);
        }

        .settings-field small {
          color: var(--text-muted);
          font-size: 10px;
          line-height: 1.5;
        }

        .platform-setting-list {
          display: flex;
          flex-direction: column;
        }

        .platform-setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 17px 0;
          border-bottom: 1px solid var(--border);
        }

        .platform-setting-row:last-child {
          border-bottom: none;
        }

        .platform-setting-copy strong {
          display: block;
          font-size: 12px;
        }

        .platform-setting-copy p {
          margin: 5px 0 0;
          color: var(--text-muted);
          font-size: 10px;
          line-height: 1.5;
        }

        .platform-toggle {
          position: relative;
          width: 42px;
          height: 24px;
          flex-shrink: 0;
          padding: 0;
          border: 0;
          border-radius: 30px;
          background: var(--border);
          cursor: pointer;
          transition: .2s ease;
        }

        .platform-toggle span {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 4px rgba(0,0,0,.2);
          transition: .2s ease;
        }

        .platform-toggle.enabled {
          background: var(--primary);
        }

        .platform-toggle.enabled span {
          left: 21px;
        }

        .platform-toggle:disabled {
          cursor: not-allowed;
          opacity: .5;
        }

        .settings-section-label {
          margin: 22px 0 5px;
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .settings-notice {
          padding: 13px 15px;
          margin-bottom: 18px;
          border: 1px solid rgba(59,130,246,.25);
          border-radius: 9px;
          background: rgba(59,130,246,.08);
          color: var(--text-primary);
          font-size: 11px;
          line-height: 1.6;
        }

        .settings-warning {
          padding: 14px 15px;
          margin-bottom: 18px;
          border: 1px solid rgba(239,68,68,.25);
          border-radius: 9px;
          background: rgba(239,68,68,.08);
          color: var(--text-primary);
          font-size: 11px;
          line-height: 1.6;
        }

        .settings-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 20px;
          margin-top: 22px;
          border-top: 1px solid var(--border);
        }

        .settings-save {
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

        .settings-save:hover {
          background: var(--primary-hover);
        }

        .settings-reset {
          min-height: 40px;
          padding: 9px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .settings-reset:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .settings-saved {
          color: var(--success);
          font-size: 11px;
          font-weight: 700;
        }

        .settings-mobile-menu {
          display: none;
          padding: 7px 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
        }

        @media (max-width: 950px) {
          .settings-workspace {
            grid-template-columns: 1fr;
          }

          .settings-tabs {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .settings-tab {
            justify-content: center;
          }
        }

        @media (max-width: 760px) {
          .settings-sidebar {
            position: fixed;
            z-index: 100;
            top: 0;
            bottom: 0;
            left: 0;
            width: 260px;
            transform: translateX(-100%);
            transition: transform .25s ease;
          }

          .settings-sidebar.open {
            transform: translateX(0);
          }

          .settings-sidebar-overlay.visible {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 90;
            background: rgba(15,23,42,.55);
          }

          .settings-mobile-menu {
            display: inline-flex;
          }

          .settings-topbar {
            padding: 0 16px;
          }

          .settings-content {
            padding: 22px 15px;
          }
        }

        @media (max-width: 520px) {
          .settings-form-grid {
            grid-template-columns: 1fr;
          }

          .settings-field.full {
            grid-column: auto;
          }

          .settings-tabs {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .settings-tab {
            justify-content: flex-start;
            padding: 10px 8px;
            font-size: 10px;
          }

          .settings-panel {
            padding: 17px;
          }

          .settings-admin span:last-child {
            display: none;
          }

          .settings-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .settings-save,
          .settings-reset {
            width: 100%;
          }
        }
      `}</style>

      <aside className={`settings-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="settings-brand">
          <div className="settings-brand-icon">M</div>
          <div>
            <strong>MyDuka</strong>
            <small>PLATFORM ADMIN</small>
          </div>
        </div>

        <div className="settings-nav-label">Platform</div>

        <nav className="settings-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="settings-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="settings-sidebar-bottom">
          <strong>MyDuka Platform</strong>
          <br />
          Super Administration
          <br />
          © 2026 MyDuka
        </div>
      </aside>

      <div
        className={`settings-sidebar-overlay ${
          sidebarOpen ? "visible" : ""
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="settings-main">
        <header className="settings-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <button
              className="settings-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <h2>Platform Settings</h2>
              <p>Configure your MyDuka platform</p>
            </div>
          </div>

          <div className="settings-admin">
            <div className="settings-avatar">SA</div>
            <span>Super Administrator</span>
          </div>
        </header>

        <section className="settings-content">
          <div className="settings-heading">
            <h1>Platform Settings</h1>
            <p>
              Manage global configuration, access rules and platform behaviour.
            </p>
          </div>

          <form onSubmit={saveSettings}>
            <div className="settings-workspace">
              <nav className="settings-tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`settings-tab ${
                      activeTab === tab.id ? "active" : ""
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="settings-tab-icon">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="settings-panel">
                {activeTab === "general" && (
                  <>
                    <div className="settings-panel-heading">
                      <h2>General configuration</h2>
                      <p>
                        Set the identity and contact information used across
                        the MyDuka platform.
                      </p>
                    </div>

                    <div className="settings-form-grid">
                      <div className="settings-field">
                        <label>Platform name</label>
                        <input
                          value={settings.platformName}
                          onChange={(e) =>
                            updateSetting("platformName", e.target.value)
                          }
                        />
                      </div>

                      <div className="settings-field">
                        <label>Support email</label>
                        <input
                          type="email"
                          value={settings.supportEmail}
                          onChange={(e) =>
                            updateSetting("supportEmail", e.target.value)
                          }
                        />
                      </div>

                      <div className="settings-field">
                        <label>Contact email</label>
                        <input
                          type="email"
                          value={settings.contactEmail}
                          onChange={(e) =>
                            updateSetting("contactEmail", e.target.value)
                          }
                        />
                      </div>

                      <div className="settings-field">
                        <label>Platform website</label>
                        <input
                          value={settings.website}
                          onChange={(e) =>
                            updateSetting("website", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="settings-notice" style={{ marginTop: 20 }}>
                      These details represent the platform itself. Individual
                      business storefront names, logos and colours remain
                      independently controlled by each business.
                    </div>
                  </>
                )}

                {activeTab === "registration" && (
                  <>
                    <div className="settings-panel-heading">
                      <h2>Business registration</h2>
                      <p>
                        Control how new businesses register and gain access to
                        MyDuka.
                      </p>
                    </div>

                    <div className="platform-setting-list">
                      <SettingRow
                        title="Allow new registrations"
                        description="Allow new business owners to create accounts and register businesses."
                        checked={settings.allowRegistration}
                        onChange={(v) =>
                          updateSetting("allowRegistration", v)
                        }
                      />

                      <SettingRow
                        title="Require email verification"
                        description="Require users to verify their email address before accessing their accounts."
                        checked={settings.requireEmailVerification}
                        onChange={(v) =>
                          updateSetting("requireEmailVerification", v)
                        }
                      />

                      <SettingRow
                        title="Require business approval"
                        description="Require platform administrator approval before a newly registered business becomes active."
                        checked={settings.requireBusinessApproval}
                        onChange={(v) =>
                          updateSetting("requireBusinessApproval", v)
                        }
                      />
                    </div>
                  </>
                )}

                {activeTab === "subscriptions" && (
                  <>
                    <div className="settings-panel-heading">
                      <h2>Default subscription settings</h2>
                      <p>
                        Configure default subscription behaviour for newly
                        registered businesses.
                      </p>
                    </div>

                    <div className="settings-form-grid">
                      <div className="settings-field">
                        <label>Default subscription plan</label>
                        <select
                          value={settings.defaultPlan}
                          onChange={(e) =>
                            updateSetting("defaultPlan", e.target.value)
                          }
                        >
                          <option>Starter</option>
                          <option>Professional</option>
                          <option>Enterprise</option>
                        </select>
                      </div>

                      <div className="settings-field">
                        <label>Free trial duration (days)</label>
                        <input
                          type="number"
                          min="0"
                          max="365"
                          value={settings.trialDays}
                          onChange={(e) =>
                            updateSetting("trialDays", e.target.value)
                          }
                        />
                      </div>

                      <div className="settings-field">
                        <label>Maximum businesses per account</label>
                        <select
                          value={settings.maxBusinesses}
                          onChange={(e) =>
                            updateSetting("maxBusinesses", e.target.value)
                          }
                        >
                          <option>1</option>
                          <option>3</option>
                          <option>5</option>
                          <option>10</option>
                          <option>Unlimited</option>
                        </select>
                      </div>
                    </div>

                    <div className="settings-notice" style={{ marginTop: 20 }}>
                      These are preview controls. Actual plan prices, feature
                      limits and billing rules will be managed through the
                      subscription system.
                    </div>
                  </>
                )}

                {activeTab === "security" && (
                  <>
                    <div className="settings-panel-heading">
                      <h2>Security and access</h2>
                      <p>
                        Configure account protection and administrative
                        session preferences.
                      </p>
                    </div>

                    <div className="platform-setting-list">
                      <SettingRow
                        title="Enforce strong passwords"
                        description="Require users to meet the platform's password strength requirements."
                        checked={settings.enforceStrongPasswords}
                        onChange={(v) =>
                          updateSetting("enforceStrongPasswords", v)
                        }
                      />

                      <SettingRow
                        title="Require two-factor authentication for platform admins"
                        description="Require an additional authentication factor for super administrator accounts."
                        checked={settings.requireAdminTwoFactor}
                        onChange={(v) =>
                          updateSetting("requireAdminTwoFactor", v)
                        }
                      />
                    </div>

                    <div className="settings-section-label">
                      Session and login limits
                    </div>

                    <div className="settings-form-grid">
                      <div className="settings-field">
                        <label>Session timeout (minutes)</label>
                        <input
                          type="number"
                          min="5"
                          max="1440"
                          value={settings.sessionTimeout}
                          onChange={(e) =>
                            updateSetting("sessionTimeout", e.target.value)
                          }
                        />
                      </div>

                      <div className="settings-field">
                        <label>Maximum failed login attempts</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={settings.loginAttempts}
                          onChange={(e) =>
                            updateSetting("loginAttempts", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "notifications" && (
                  <>
                    <div className="settings-panel-heading">
                      <h2>Platform notifications</h2>
                      <p>
                        Choose which platform events should trigger
                        administrative notifications.
                      </p>
                    </div>

                    <div className="platform-setting-list">
                      <SettingRow
                        title="Email notifications"
                        description="Enable platform-wide administrative email notifications."
                        checked={settings.emailNotifications}
                        onChange={(v) =>
                          updateSetting("emailNotifications", v)
                        }
                      />

                      <SettingRow
                        title="New business registrations"
                        description="Notify platform administrators when a new business registers."
                        checked={settings.newBusinessNotifications}
                        onChange={(v) =>
                          updateSetting("newBusinessNotifications", v)
                        }
                        disabled={!settings.emailNotifications}
                      />

                      <SettingRow
                        title="Subscription events"
                        description="Notify administrators about new, upgraded, expiring and expired subscriptions."
                        checked={settings.subscriptionNotifications}
                        onChange={(v) =>
                          updateSetting("subscriptionNotifications", v)
                        }
                        disabled={!settings.emailNotifications}
                      />

                      <SettingRow
                        title="Security alerts"
                        description="Notify administrators about suspicious activity and important security events."
                        checked={settings.securityNotifications}
                        onChange={(v) =>
                          updateSetting("securityNotifications", v)
                        }
                        disabled={!settings.emailNotifications}
                      />
                    </div>
                  </>
                )}

                {activeTab === "maintenance" && (
                  <>
                    <div className="settings-panel-heading">
                      <h2>Maintenance mode</h2>
                      <p>
                        Control the platform maintenance state and the message
                        displayed to users.
                      </p>
                    </div>

                    <div className="settings-warning">
                      Enabling maintenance mode in a live system can prevent
                      customers and business owners from accessing their
                      storefronts and dashboards. This preview does not change
                      the live platform.
                    </div>

                    <div className="platform-setting-list">
                      <SettingRow
                        title="Enable maintenance mode"
                        description="Temporarily restrict normal platform access while maintenance is being performed."
                        checked={settings.maintenanceMode}
                        onChange={(v) =>
                          updateSetting("maintenanceMode", v)
                        }
                      />
                    </div>

                    <div className="settings-field" style={{ marginTop: 20 }}>
                      <label>Maintenance message</label>
                      <textarea
                        value={settings.maintenanceMessage}
                        onChange={(e) =>
                          updateSetting("maintenanceMessage", e.target.value)
                        }
                      />
                      <small>
                        This message will be shown to users when maintenance
                        mode is active.
                      </small>
                    </div>
                  </>
                )}

                <div className="settings-actions">
                  <div>
                    {saved && (
                      <span className="settings-saved">
                        ✓ Settings saved in this preview.
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 9 }}>
                    <button
                      type="button"
                      className="settings-reset"
                      onClick={resetSettings}
                    >
                      Reset defaults
                    </button>

                    <button type="submit" className="settings-save">
                      Save settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>

          <p
            style={{
              marginTop: 18,
              color: "var(--text-muted)",
              fontSize: 10,
              textAlign: "center",
            }}
          >
            Frontend preview — settings are held in page state only. They do
            not modify live platform configuration.
          </p>
        </section>
      </main>
    </div>
  );
}

export default SuperAdminSettings;
