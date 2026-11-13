import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeSwitcher from "../components/ThemeSwitcher";

const initialSettings = {
  platformName: "MyDuka",
  supportEmail: "support@myduka.com",
  contactEmail: "hello@myduka.com",
  allowRegistration: true,
  requireEmailVerification: true,
  requireApproval: false,
  defaultTrialDays: 14,
  defaultCurrency: "KES",
  defaultPlan: "Starter",
  allowPlanChanges: true,
  allowOnlinePayments: true,
  enforceStrongPasswords: true,
  sessionTimeout: "60",
  maxLoginAttempts: 5,
  notifyNewBusiness: true,
  notifyNewSubscription: true,
  notifyFailedPayments: true,
  notifySupportTickets: true,
  maintenanceMode: false,
  maintenanceMessage:
    "MyDuka is temporarily undergoing maintenance. Please check back shortly.",
};

const sections = [
  { id: "general", label: "General", icon: "⚙" },
  { id: "registration", label: "Registration", icon: "▣" },
  { id: "subscriptions", label: "Subscriptions", icon: "◇" },
  { id: "security", label: "Security", icon: "♢" },
  { id: "notifications", label: "Notifications", icon: "♧" },
  { id: "maintenance", label: "Maintenance", icon: "◷" },
];

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`settings-toggle ${checked ? "active" : ""}`}
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
    <div className="setting-row">
      <div className="setting-row-copy">
        <div className="setting-row-title">{title}</div>
        <div className="setting-row-description">{description}</div>
      </div>

      <Toggle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  options,
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>

      {options ? (
        <select value={value} onChange={onChange}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />
      )}
    </label>
  );
}

export default function SuperAdminSettings() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  };

  const saveSettings = () => {
    // Frontend demonstration only. Database persistence will be added
    // during the backend integration phase.
    setSaved(true);
  };

  const resetSettings = () => {
    if (
      window.confirm(
        "Reset all settings on this page to their original demo values?"
      )
    ) {
      setSettings(initialSettings);
      setSaved(false);
    }
  };

  const activeLabel =
    sections.find((section) => section.id === activeSection)?.label ||
    "Settings";

  const renderGeneral = () => (
    <>
      <div className="settings-section-heading">
        <div>
          <h2>Platform identity</h2>
          <p>Manage the basic identity and contact details of MyDuka.</p>
        </div>
      </div>

      <div className="settings-form-grid">
        <Field
          label="Platform name"
          value={settings.platformName}
          onChange={(e) => updateSetting("platformName", e.target.value)}
        />

        <Field
          label="Support email"
          type="email"
          value={settings.supportEmail}
          onChange={(e) => updateSetting("supportEmail", e.target.value)}
        />

        <Field
          label="General contact email"
          type="email"
          value={settings.contactEmail}
          onChange={(e) => updateSetting("contactEmail", e.target.value)}
        />

        <Field
          label="Default currency"
          value={settings.defaultCurrency}
          onChange={(e) => updateSetting("defaultCurrency", e.target.value)}
          options={[
            { value: "KES", label: "KES — Kenyan Shilling" },
            { value: "USD", label: "USD — US Dollar" },
            { value: "UGX", label: "UGX — Ugandan Shilling" },
            { value: "TZS", label: "TZS — Tanzanian Shilling" },
            { value: "RWF", label: "RWF — Rwandan Franc" },
          ]}
        />
      </div>

      <div className="settings-info-box">
        <span className="info-icon">ⓘ</span>
        <div>
          <strong>Platform-wide identity</strong>
          <p>
            These details represent the MyDuka SaaS platform. Individual
            businesses will continue to manage their own storefront names,
            logos and branding separately.
          </p>
        </div>
      </div>
    </>
  );

  const renderRegistration = () => (
    <>
      <div className="settings-section-heading">
        <div>
          <h2>Business registration</h2>
          <p>Control how new businesses join the MyDuka platform.</p>
        </div>
      </div>

      <div className="settings-card-list">
        <SettingRow
          title="Allow business registration"
          description="Allow new business owners to create MyDuka accounts."
          checked={settings.allowRegistration}
          onChange={(value) => updateSetting("allowRegistration", value)}
        />

        <SettingRow
          title="Require email verification"
          description="Require new users to verify their email addresses."
          checked={settings.requireEmailVerification}
          onChange={(value) =>
            updateSetting("requireEmailVerification", value)
          }
        />

        <SettingRow
          title="Require business approval"
          description="Require platform administrator approval before a new business becomes active."
          checked={settings.requireApproval}
          onChange={(value) => updateSetting("requireApproval", value)}
        />
      </div>

      <div className="settings-form-grid settings-form-grid-small">
        <Field
          label="Default free trial (days)"
          type="number"
          value={settings.defaultTrialDays}
          onChange={(e) =>
            updateSetting(
              "defaultTrialDays",
              Math.max(0, Number(e.target.value))
            )
          }
        />
      </div>
    </>
  );

  const renderSubscriptions = () => (
    <>
      <div className="settings-section-heading">
        <div>
          <h2>Subscription defaults</h2>
          <p>Configure default subscription behaviour for new businesses.</p>
        </div>
      </div>

      <div className="settings-form-grid settings-form-grid-small">
        <Field
          label="Default subscription plan"
          value={settings.defaultPlan}
          onChange={(e) => updateSetting("defaultPlan", e.target.value)}
          options={[
            { value: "Starter", label: "Starter" },
            { value: "Growth", label: "Growth" },
            { value: "Business", label: "Business" },
            { value: "Enterprise", label: "Enterprise" },
          ]}
        />
      </div>

      <div className="settings-card-list">
        <SettingRow
          title="Allow plan changes"
          description="Allow businesses to upgrade or downgrade their subscriptions."
          checked={settings.allowPlanChanges}
          onChange={(value) => updateSetting("allowPlanChanges", value)}
        />

        <SettingRow
          title="Allow online payments"
          description="Enable online subscription payment options."
          checked={settings.allowOnlinePayments}
          onChange={(value) => updateSetting("allowOnlinePayments", value)}
        />
      </div>

      <div className="settings-info-box">
        <span className="info-icon">ⓘ</span>
        <div>
          <strong>Subscription plans</strong>
          <p>
            Plan prices, feature limits and billing cycles will be managed
            separately in the Plans section.
          </p>
          <button
            className="settings-text-button"
            onClick={() => navigate("/superadmin/plans")}
          >
            View subscription plans →
          </button>
        </div>
      </div>
    </>
  );

  const renderSecurity = () => (
    <>
      <div className="settings-section-heading">
        <div>
          <h2>Security and access</h2>
          <p>Set platform-wide account security preferences.</p>
        </div>
      </div>

      <div className="settings-card-list">
        <SettingRow
          title="Enforce strong passwords"
          description="Require users to create passwords that meet stronger security requirements."
          checked={settings.enforceStrongPasswords}
          onChange={(value) =>
            updateSetting("enforceStrongPasswords", value)
          }
        />
      </div>

      <div className="settings-form-grid settings-form-grid-small">
        <Field
          label="Session timeout"
          value={settings.sessionTimeout}
          onChange={(e) => updateSetting("sessionTimeout", e.target.value)}
          options={[
            { value: "15", label: "15 minutes" },
            { value: "30", label: "30 minutes" },
            { value: "60", label: "1 hour" },
            { value: "120", label: "2 hours" },
            { value: "480", label: "8 hours" },
          ]}
        />

        <Field
          label="Maximum login attempts"
          type="number"
          value={settings.maxLoginAttempts}
          onChange={(e) =>
            updateSetting(
              "maxLoginAttempts",
              Math.max(1, Number(e.target.value))
            )
          }
        />
      </div>

      <div className="settings-info-box">
        <span className="info-icon">ⓘ</span>
        <div>
          <strong>Security enforcement</strong>
          <p>
            These are planned platform settings. Actual password rules,
            session expiry and login protection must also be enforced by
            the backend.
          </p>
        </div>
      </div>
    </>
  );

  const renderNotifications = () => (
    <>
      <div className="settings-section-heading">
        <div>
          <h2>Platform notifications</h2>
          <p>Choose which platform events administrators should be notified about.</p>
        </div>
      </div>

      <div className="settings-card-list">
        <SettingRow
          title="New business registrations"
          description="Receive notifications when a business registers."
          checked={settings.notifyNewBusiness}
          onChange={(value) => updateSetting("notifyNewBusiness", value)}
        />

        <SettingRow
          title="New subscriptions"
          description="Receive notifications when a business subscribes to a plan."
          checked={settings.notifyNewSubscription}
          onChange={(value) =>
            updateSetting("notifyNewSubscription", value)
          }
        />

        <SettingRow
          title="Failed payments"
          description="Receive notifications when subscription payments fail."
          checked={settings.notifyFailedPayments}
          onChange={(value) => updateSetting("notifyFailedPayments", value)}
        />

        <SettingRow
          title="Support tickets"
          description="Receive notifications when customers submit support tickets."
          checked={settings.notifySupportTickets}
          onChange={(value) => updateSetting("notifySupportTickets", value)}
        />
      </div>
    </>
  );

  const renderMaintenance = () => (
    <>
      <div className="settings-section-heading">
        <div>
          <h2>Maintenance mode</h2>
          <p>Control the planned maintenance state of the MyDuka platform.</p>
        </div>
      </div>

      <div className={`maintenance-status ${settings.maintenanceMode ? "maintenance-on" : ""}`}>
        <div className="maintenance-status-icon">
          {settings.maintenanceMode ? "⚠" : "✓"}
        </div>

        <div>
          <strong>
            {settings.maintenanceMode
              ? "Maintenance mode is enabled"
              : "Platform is operating normally"}
          </strong>
          <p>
            {settings.maintenanceMode
              ? "The platform is marked for maintenance in this frontend preview."
              : "Maintenance mode is currently switched off."}
          </p>
        </div>
      </div>

      <div className="settings-card-list">
        <SettingRow
          title="Enable maintenance mode"
          description="Mark the platform as temporarily unavailable for maintenance."
          checked={settings.maintenanceMode}
          onChange={(value) => updateSetting("maintenanceMode", value)}
        />
      </div>

      <label className="settings-field settings-message-field">
        <span>Maintenance message</span>
        <textarea
          rows={4}
          value={settings.maintenanceMessage}
          onChange={(e) =>
            updateSetting("maintenanceMessage", e.target.value)
          }
        />
      </label>

      <div className="settings-info-box warning-info">
        <span className="info-icon">!</span>
        <div>
          <strong>Important</strong>
          <p>
            This switch does not currently block customer or business access.
            Backend enforcement and an appropriate maintenance page will be
            implemented during the integration phase.
          </p>
        </div>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "registration":
        return renderRegistration();
      case "subscriptions":
        return renderSubscriptions();
      case "security":
        return renderSecurity();
      case "notifications":
        return renderNotifications();
      case "maintenance":
        return renderMaintenance();
      default:
        return renderGeneral();
    }
  };

  return (
    <div className="super-settings-page">
      <style>{`
        .super-settings-page {
          min-height: 100vh;
          padding: 28px;
          background: var(--background);
          color: var(--text-primary);
        }

        .settings-page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 26px;
        }

        .settings-page-header h1 {
          margin: 0 0 7px;
          font-size: clamp(24px, 3vw, 30px);
          font-weight: 800;
          letter-spacing: -0.8px;
        }

        .settings-page-header p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .settings-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .settings-layout {
          display: grid;
          grid-template-columns: 245px minmax(0, 1fr);
          gap: 22px;
          align-items: start;
        }

        .settings-sidebar,
        .settings-content {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: var(--shadow-sm);
        }

        .settings-sidebar {
          padding: 12px;
          position: sticky;
          top: 20px;
        }

        .settings-sidebar-heading {
          padding: 12px 12px 16px;
          font-size: 11px;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .settings-nav-button {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
          margin-bottom: 4px;
          border: 0;
          border-radius: 10px;
          color: var(--text-secondary);
          background: transparent;
          text-align: left;
          cursor: pointer;
          font-size: 13px;
          font-weight: 650;
          transition: background .2s, color .2s;
        }

        .settings-nav-button:hover {
          background: var(--surface-hover);
          color: var(--text-primary);
        }

        .settings-nav-button.active {
          color: var(--primary);
          background: var(--primary-light);
        }

        .settings-nav-icon {
          width: 22px;
          text-align: center;
          font-size: 17px;
        }

        .settings-content {
          min-width: 0;
          overflow: hidden;
        }

        .settings-content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 21px 25px;
          border-bottom: 1px solid var(--border);
          background: var(--surface-secondary);
        }

        .settings-content-header h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
        }

        .settings-preview-label {
          padding: 6px 10px;
          border-radius: 20px;
          background: var(--warning-bg);
          color: var(--warning);
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .5px;
        }

        .settings-content-body {
          padding: 26px;
        }

        .settings-section-heading {
          margin-bottom: 23px;
        }

        .settings-section-heading h2 {
          margin: 0 0 7px;
          font-size: 18px;
          font-weight: 800;
        }

        .settings-section-heading p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.6;
        }

        .settings-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .settings-form-grid-small {
          max-width: 520px;
          margin-top: 24px;
        }

        .settings-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .settings-field > span {
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 750;
        }

        .settings-field input,
        .settings-field select,
        .settings-field textarea {
          width: 100%;
          min-height: 43px;
          padding: 10px 12px;
          border: 1px solid var(--input-border);
          border-radius: 9px;
          outline: none;
          color: var(--text-primary);
          background: var(--input-bg);
          font: inherit;
          font-size: 13px;
          transition: border-color .2s, box-shadow .2s;
        }

        .settings-field textarea {
          resize: vertical;
          line-height: 1.6;
        }

        .settings-field input:focus,
        .settings-field select:focus,
        .settings-field textarea:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .settings-card-list {
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 17px 18px;
          border-bottom: 1px solid var(--border);
        }

        .setting-row:last-child {
          border-bottom: 0;
        }

        .setting-row-copy {
          min-width: 0;
        }

        .setting-row-title {
          margin-bottom: 5px;
          font-size: 13px;
          font-weight: 750;
        }

        .setting-row-description {
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.5;
        }

        .settings-toggle {
          flex-shrink: 0;
          width: 43px;
          height: 24px;
          padding: 3px;
          border: 0;
          border-radius: 20px;
          background: var(--border-strong);
          cursor: pointer;
          transition: background .2s;
        }

        .settings-toggle span {
          display: block;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,.2);
          transition: transform .2s;
        }

        .settings-toggle.active {
          background: var(--primary);
        }

        .settings-toggle.active span {
          transform: translateX(19px);
        }

        .settings-toggle:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .settings-info-box {
          display: flex;
          gap: 12px;
          padding: 15px;
          margin-top: 22px;
          border: 1px solid var(--info-border);
          border-radius: 11px;
          background: var(--info-bg);
        }

        .settings-info-box strong {
          display: block;
          margin-bottom: 5px;
          font-size: 12px;
        }

        .settings-info-box p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.6;
        }

        .info-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          color: var(--info);
          background: var(--surface);
          font-weight: 800;
        }

        .settings-text-button {
          margin-top: 10px;
          padding: 0;
          border: 0;
          background: transparent;
          color: var(--primary);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .maintenance-status {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 17px;
          margin-bottom: 20px;
          border: 1px solid var(--success-border);
          border-radius: 12px;
          background: var(--success-bg);
        }

        .maintenance-status.maintenance-on {
          border-color: var(--warning-border);
          background: var(--warning-bg);
        }

        .maintenance-status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 12px;
          background: var(--surface);
          color: var(--success);
          font-size: 20px;
          font-weight: 800;
        }

        .maintenance-on .maintenance-status-icon {
          color: var(--warning);
        }

        .maintenance-status strong {
          display: block;
          margin-bottom: 5px;
          font-size: 13px;
        }

        .maintenance-status p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.5;
        }

        .settings-message-field {
          margin-top: 22px;
        }

        .warning-info {
          border-color: var(--warning-border);
          background: var(--warning-bg);
        }

        .warning-info .info-icon {
          color: var(--warning);
        }

        .settings-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 18px 25px;
          border-top: 1px solid var(--border);
          background: var(--surface-secondary);
        }

        .settings-save-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .settings-button {
          min-height: 39px;
          padding: 9px 15px;
          border: 1px solid var(--border);
          border-radius: 9px;
          background: var(--surface);
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          transition: .2s;
        }

        .settings-button:hover {
          background: var(--surface-hover);
        }

        .settings-button.primary {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
        }

        .settings-button.primary:hover {
          background: var(--primary-hover);
        }

        .settings-saved-message {
          color: var(--success);
          font-size: 12px;
          font-weight: 750;
        }

        .settings-demo-note {
          margin-top: 17px;
          color: var(--text-muted);
          font-size: 11px;
          line-height: 1.6;
        }

        @media (max-width: 850px) {
          .settings-layout {
            grid-template-columns: 1fr;
          }

          .settings-sidebar {
            position: static;
            display: flex;
            gap: 5px;
            overflow-x: auto;
            padding: 9px;
          }

          .settings-sidebar-heading {
            display: none;
          }

          .settings-nav-button {
            flex: 0 0 auto;
            width: auto;
            margin: 0;
            white-space: nowrap;
          }
        }

        @media (max-width: 600px) {
          .super-settings-page {
            padding: 17px 12px;
          }

          .settings-page-header {
            flex-direction: column;
          }

          .settings-header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .settings-content-header,
          .settings-content-body {
            padding: 17px;
          }

          .settings-form-grid {
            grid-template-columns: 1fr;
          }

          .setting-row {
            padding: 15px 12px;
          }

          .settings-footer {
            align-items: flex-start;
            flex-direction: column;
            padding: 16px;
          }

          .settings-save-actions {
            width: 100%;
          }

          .settings-save-actions button {
            flex: 1;
          }

          .settings-nav-button {
            padding: 10px;
            font-size: 12px;
          }
        }
      `}</style>

      <div className="settings-page-header">
        <div>
          <h1>Platform Settings</h1>
          <p>Manage global configuration and preferences for MyDuka.</p>
        </div>

        <div className="settings-header-actions">
          <ThemeSwitcher />
          <button
            className="settings-button"
            onClick={() => navigate("/superadmin/dashboard")}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <div className="settings-sidebar-heading">Settings menu</div>

          {sections.map((section) => (
            <button
              key={section.id}
              className={`settings-nav-button ${
                activeSection === section.id ? "active" : ""
              }`}
              onClick={() => {
                setActiveSection(section.id);
                setSaved(false);
              }}
            >
              <span className="settings-nav-icon">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </aside>

        <main className="settings-content">
          <div className="settings-content-header">
            <h2>{activeLabel} settings</h2>
            <span className="settings-preview-label">Frontend preview</span>
          </div>

          <div className="settings-content-body">
            {renderContent()}

            <div className="settings-demo-note">
              Changes currently exist only in this page's temporary state.
              Permanent saving and platform-wide enforcement will be connected
              during the backend integration phase.
            </div>
          </div>

          <div className="settings-footer">
            <div>
              {saved && (
                <span className="settings-saved-message">
                  ✓ Changes applied in this preview
                </span>
              )}
            </div>

            <div className="settings-save-actions">
              <button className="settings-button" onClick={resetSettings}>
                Reset
              </button>

              <button
                className="settings-button primary"
                onClick={saveSettings}
              >
                Save changes
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
