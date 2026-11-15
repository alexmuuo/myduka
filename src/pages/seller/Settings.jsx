import { useState } from "react";

const styles = `
.md-settings {
  color: var(--text-primary, #172033);
  width: 100%;
  padding-bottom: 30px;
}

.md-settings * {
  box-sizing: border-box;
}

.md-settings .settings-header {
  margin-bottom: 24px;
}

.md-settings .settings-header h1 {
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -.6px;
  margin: 0 0 7px;
}

.md-settings .settings-header p {
  color: var(--text-secondary, #64748b);
  font-size: 14px;
  margin: 0;
}

.md-settings .settings-notice {
  display: flex;
  gap: 12px;
  padding: 15px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1e40af;
  border-radius: 12px;
  margin-bottom: 22px;
}

.md-settings .notice-icon {
  font-size: 18px;
}

.md-settings .settings-notice strong {
  display: block;
  font-size: 13px;
  margin-bottom: 4px;
}

.md-settings .settings-notice p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
}

.md-settings .settings-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.md-settings .settings-nav {
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 13px;
  padding: 8px;
  position: sticky;
  top: 15px;
}

.md-settings .settings-nav button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  text-align: left;
  padding: 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
  font-size: 12px;
  font-weight: 650;
}

.md-settings .settings-nav button.active {
  background: var(--surface-secondary, #f1f5f9);
  color: var(--text-primary, #172033);
}

.md-settings .settings-nav button:hover {
  background: var(--surface-secondary, #f8fafc);
}

.md-settings .nav-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.md-settings .settings-content {
  min-width: 0;
}

.md-settings .settings-panel {
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  margin-bottom: 18px;
  overflow: hidden;
}

.md-settings .panel-heading {
  padding: 19px 20px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.md-settings .panel-heading h2 {
  font-size: 15px;
  font-weight: 750;
  margin: 0 0 5px;
}

.md-settings .panel-heading p {
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  margin: 0;
  line-height: 1.5;
}

.md-settings .panel-body {
  padding: 20px;
}

.md-settings .form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 17px;
}

.md-settings .field {
  min-width: 0;
}

.md-settings .field.full {
  grid-column: 1 / -1;
}

.md-settings label {
  display: block;
  color: var(--text-primary, #334155);
  font-size: 12px;
  font-weight: 650;
  margin-bottom: 7px;
}

.md-settings input,
.md-settings select,
.md-settings textarea {
  width: 100%;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
  border-radius: 9px;
  padding: 11px 12px;
  font-size: 13px;
  outline: none;
}

.md-settings input:focus,
.md-settings select:focus,
.md-settings textarea:focus {
  border-color: var(--accent-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99,102,241,.10);
}

.md-settings textarea {
  min-height: 95px;
  resize: vertical;
}

.md-settings .field-hint {
  font-size: 11px;
  color: var(--text-secondary, #64748b);
  margin-top: 6px;
  line-height: 1.5;
}

.md-settings .setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.md-settings .setting-row:first-child {
  padding-top: 0;
}

.md-settings .setting-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.md-settings .setting-info {
  min-width: 0;
}

.md-settings .setting-info strong {
  display: block;
  font-size: 13px;
  margin-bottom: 5px;
}

.md-settings .setting-info p {
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  line-height: 1.5;
  margin: 0;
}

.md-settings .switch {
  position: relative;
  width: 42px;
  height: 23px;
  flex-shrink: 0;
}

.md-settings .switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.md-settings .switch-slider {
  position: absolute;
  inset: 0;
  background: #cbd5e1;
  border-radius: 30px;
  cursor: pointer;
  transition: .2s;
}

.md-settings .switch-slider:before {
  content: "";
  position: absolute;
  width: 17px;
  height: 17px;
  left: 3px;
  top: 3px;
  border-radius: 50%;
  background: white;
  transition: .2s;
}

.md-settings .switch input:checked + .switch-slider {
  background: #6366f1;
}

.md-settings .switch input:checked + .switch-slider:before {
  transform: translateX(19px);
}

.md-settings .panel-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--border-color, #e2e8f0);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.md-settings .btn {
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
  border-radius: 9px;
  padding: 10px 15px;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.md-settings .btn-primary {
  border-color: var(--accent-color, #4f46e5);
  background: var(--accent-color, #4f46e5);
  color: white;
}

.md-settings .btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.md-settings .save-message {
  color: #15803d;
  font-size: 12px;
  font-weight: 650;
  margin-right: auto;
  align-self: center;
}

.md-settings .empty-note {
  border: 1px dashed var(--border-color, #cbd5e1);
  background: var(--surface-secondary, #f8fafc);
  border-radius: 10px;
  padding: 17px;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.6;
}

.md-settings .danger-box {
  border: 1px solid #fecaca;
  background: #fff7f7;
  border-radius: 11px;
  padding: 16px;
}

.md-settings .danger-box strong {
  display: block;
  color: #b91c1c;
  font-size: 13px;
  margin-bottom: 5px;
}

.md-settings .danger-box p {
  color: #991b1b;
  font-size: 11px;
  line-height: 1.6;
  margin: 0;
}

.md-settings .color-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.md-settings input[type="color"] {
  width: 43px;
  height: 39px;
  padding: 3px;
  cursor: pointer;
}

@media (max-width: 760px) {
  .md-settings .settings-layout {
    grid-template-columns: 1fr;
  }

  .md-settings .settings-nav {
    position: static;
    display: flex;
    overflow-x: auto;
    gap: 4px;
  }

  .md-settings .settings-nav button {
    width: auto;
    flex-shrink: 0;
    white-space: nowrap;
  }
}

@media (max-width: 520px) {
  .md-settings .form-grid {
    grid-template-columns: 1fr;
  }

  .md-settings .field.full {
    grid-column: auto;
  }

  .md-settings .panel-body {
    padding: 15px;
  }

  .md-settings .panel-heading {
    padding: 16px;
  }

  .md-settings .settings-header h1 {
    font-size: 22px;
  }
}
`;

const sections = [
  { id: "business", label: "Business information", icon: "▦" },
  { id: "store", label: "Store preferences", icon: "▣" },
  { id: "orders", label: "Orders & checkout", icon: "🛒" },
  { id: "notifications", label: "Notifications", icon: "♧" },
  { id: "security", label: "Security", icon: "♙" },
];

const initialSettings = {
  businessName: "",
  businessEmail: "",
  businessPhone: "",
  businessAddress: "",
  businessWebsite: "",
  businessDescription: "",
  currency: "KES",
  timezone: "Africa/Nairobi",
  dateFormat: "DD/MM/YYYY",
  language: "English",
  storeName: "",
  storeSlug: "",
  storeEmail: "",
  storePhone: "",
  storeDescription: "",
  primaryColor: "#4f46e5",
  secondaryColor: "#0f172a",
  orderPrefix: "ORD",
  taxEnabled: false,
  taxRate: "",
  requireCustomerPhone: true,
  allowGuestCheckout: true,
  orderConfirmation: true,
  newOrderNotification: true,
  lowStockNotification: true,
  paymentNotification: true,
  emailNotifications: true,
  smsNotifications: false,
  twoFactorEnabled: false,
};

export default function Settings() {
  const [activeSection, setActiveSection] = useState("business");
  const [settings, setSettings] = useState(initialSettings);
  const [savedMessage, setSavedMessage] = useState("");

  const update = (field, value) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
    setSavedMessage("");
  };

  const savePreview = (event) => {
    event.preventDefault();
    setSavedMessage(
      "Preview updated. These changes are not saved to the database."
    );
  };

  const resetSection = () => {
    setSettings((current) => {
      const updated = { ...current };
      Object.keys(initialSettings).forEach((key) => {
        updated[key] = initialSettings[key];
      });
      return updated;
    });
    setSavedMessage("Preview fields have been reset.");
  };

  const Toggle = ({ label, description, field }) => (
    <div className="setting-row">
      <div className="setting-info">
        <strong>{label}</strong>
        <p>{description}</p>
      </div>

      <label className="switch">
        <input
          type="checkbox"
          checked={Boolean(settings[field])}
          onChange={(event) => update(field, event.target.checked)}
        />
        <span className="switch-slider" />
      </label>
    </div>
  );

  const Field = ({
    label,
    field,
    placeholder = "",
    type = "text",
    hint = "",
  }) => (
    <div className="field">
      <label htmlFor={`setting-${field}`}>{label}</label>
      <input
        id={`setting-${field}`}
        type={type}
        value={settings[field]}
        placeholder={placeholder}
        onChange={(event) => update(field, event.target.value)}
      />
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );

  const SelectField = ({ label, field, options }) => (
    <div className="field">
      <label htmlFor={`setting-${field}`}>{label}</label>
      <select
        id={`setting-${field}`}
        value={settings[field]}
        onChange={(event) => update(field, event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const sectionContent = () => {
    switch (activeSection) {
      case "business":
        return (
          <section className="settings-panel">
            <div className="panel-heading">
              <h2>Business information</h2>
              <p>
                Manage the general information associated with your business
                account.
              </p>
            </div>

            <form onSubmit={savePreview}>
              <div className="panel-body">
                <div className="form-grid">
                  <Field
                    label="Business name"
                    field="businessName"
                    placeholder="Enter your registered business name"
                  />

                  <Field
                    label="Business email"
                    field="businessEmail"
                    type="email"
                    placeholder="business@example.com"
                  />

                  <Field
                    label="Business phone"
                    field="businessPhone"
                    placeholder="+254..."
                  />

                  <Field
                    label="Business website"
                    field="businessWebsite"
                    placeholder="https://example.com"
                  />

                  <Field
                    label="Business address"
                    field="businessAddress"
                    placeholder="Town, county or physical address"
                  />

                  <SelectField
                    label="Business currency"
                    field="currency"
                    options={[
                      { value: "KES", label: "KES — Kenyan Shilling" },
                      { value: "USD", label: "USD — US Dollar" },
                      { value: "UGX", label: "UGX — Ugandan Shilling" },
                      { value: "TZS", label: "TZS — Tanzanian Shilling" },
                    ]}
                  />

                  <SelectField
                    label="Timezone"
                    field="timezone"
                    options={[
                      {
                        value: "Africa/Nairobi",
                        label: "East Africa Time — Nairobi",
                      },
                      { value: "UTC", label: "UTC" },
                    ]}
                  />

                  <SelectField
                    label="Date format"
                    field="dateFormat"
                    options={[
                      { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                      { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                      { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                    ]}
                  />

                  <SelectField
                    label="Language"
                    field="language"
                    options={[
                      { value: "English", label: "English" },
                      { value: "Kiswahili", label: "Kiswahili" },
                    ]}
                  />

                  <div className="field full">
                    <label htmlFor="setting-businessDescription">
                      Business description
                    </label>
                    <textarea
                      id="setting-businessDescription"
                      value={settings.businessDescription}
                      onChange={(event) =>
                        update("businessDescription", event.target.value)
                      }
                      placeholder="Describe your business..."
                    />
                  </div>
                </div>
              </div>

              <div className="panel-footer">
                {savedMessage && (
                  <span className="save-message">{savedMessage}</span>
                )}
                <button className="btn btn-primary" type="submit">
                  Save changes
                </button>
              </div>
            </form>
          </section>
        );

      case "store":
        return (
          <>
            <section className="settings-panel">
              <div className="panel-heading">
                <h2>Store preferences</h2>
                <p>
                  Configure how your public storefront identifies your
                  business.
                </p>
              </div>

              <form onSubmit={savePreview}>
                <div className="panel-body">
                  <div className="form-grid">
                    <Field
                      label="Store display name"
                      field="storeName"
                      placeholder="Name customers see"
                    />

                    <Field
                      label="Store URL slug"
                      field="storeSlug"
                      placeholder="your-store-name"
                      hint="Your public storefront will use this identifier."
                    />

                    <Field
                      label="Store contact email"
                      field="storeEmail"
                      type="email"
                      placeholder="store@example.com"
                    />

                    <Field
                      label="Store contact phone"
                      field="storePhone"
                      placeholder="+254..."
                    />

                    <div className="field full">
                      <label htmlFor="setting-storeDescription">
                        Store description
                      </label>
                      <textarea
                        id="setting-storeDescription"
                        value={settings.storeDescription}
                        onChange={(event) =>
                          update("storeDescription", event.target.value)
                        }
                        placeholder="Introduce your store to customers..."
                      />
                    </div>

                    <div className="field">
                      <label>Primary brand colour</label>
                      <div className="color-row">
                        <input
                          type="color"
                          value={settings.primaryColor}
                          onChange={(event) =>
                            update("primaryColor", event.target.value)
                          }
                        />
                        <span className="field-hint">
                          {settings.primaryColor}
                        </span>
                      </div>
                    </div>

                    <div className="field">
                      <label>Secondary brand colour</label>
                      <div className="color-row">
                        <input
                          type="color"
                          value={settings.secondaryColor}
                          onChange={(event) =>
                            update("secondaryColor", event.target.value)
                          }
                        />
                        <span className="field-hint">
                          {settings.secondaryColor}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="empty-note" style={{ marginTop: 18 }}>
                    Store logo, banner image, storefront theme and additional
                    branding controls will be connected to the dedicated
                    storefront customisation settings.
                  </div>
                </div>

                <div className="panel-footer">
                  {savedMessage && (
                    <span className="save-message">{savedMessage}</span>
                  )}
                  <button className="btn btn-primary" type="submit">
                    Save changes
                  </button>
                </div>
              </form>
            </section>
          </>
        );

      case "orders":
        return (
          <>
            <section className="settings-panel">
              <div className="panel-heading">
                <h2>Order preferences</h2>
                <p>Configure basic order handling preferences.</p>
              </div>

              <form onSubmit={savePreview}>
                <div className="panel-body">
                  <div className="form-grid">
                    <Field
                      label="Order number prefix"
                      field="orderPrefix"
                      placeholder="ORD"
                      hint="Example: ORD-000001"
                    />

                    <Field
                      label="Tax rate (%)"
                      field="taxRate"
                      type="number"
                      placeholder="Enter tax percentage"
                    />
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <Toggle
                      label="Enable tax"
                      description="Apply tax calculations to applicable orders."
                      field="taxEnabled"
                    />

                    <Toggle
                      label="Require customer phone number"
                      description="Require customers to provide a phone number when ordering."
                      field="requireCustomerPhone"
                    />

                    <Toggle
                      label="Allow guest checkout"
                      description="Allow customers to place orders without creating an account."
                      field="allowGuestCheckout"
                    />

                    <Toggle
                      label="Order confirmation"
                      description="Enable order confirmation after successful order placement."
                      field="orderConfirmation"
                    />
                  </div>
                </div>

                <div className="panel-footer">
                  {savedMessage && (
                    <span className="save-message">{savedMessage}</span>
                  )}
                  <button className="btn btn-primary" type="submit">
                    Save changes
                  </button>
                </div>
              </form>
            </section>

            <section className="settings-panel">
              <div className="panel-heading">
                <h2>Checkout information</h2>
                <p>
                  Payment and delivery configuration will be managed through
                  their dedicated modules.
                </p>
              </div>

              <div className="panel-body">
                <div className="empty-note">
                  Payment provider credentials, delivery zones, shipping
                  charges and checkout integrations are not configured here.
                  They will be connected to the Payments and Deliveries
                  modules.
                </div>
              </div>
            </section>
          </>
        );

      case "notifications":
        return (
          <section className="settings-panel">
            <div className="panel-heading">
              <h2>Notification preferences</h2>
              <p>
                Choose which business events should generate notifications.
              </p>
            </div>

            <form onSubmit={savePreview}>
              <div className="panel-body">
                <Toggle
                  label="New order notifications"
                  description="Get notified when a new customer order is placed."
                  field="newOrderNotification"
                />

                <Toggle
                  label="Low stock alerts"
                  description="Get notified when products reach their configured stock thresholds."
                  field="lowStockNotification"
                />

                <Toggle
                  label="Payment notifications"
                  description="Get notified when a payment is received or its status changes."
                  field="paymentNotification"
                />

                <Toggle
                  label="Email notifications"
                  description="Allow business notifications to be delivered through email."
                  field="emailNotifications"
                />

                <Toggle
                  label="SMS notifications"
                  description="Allow business notifications to be delivered through SMS."
                  field="smsNotifications"
                />
              </div>

              <div className="panel-footer">
                {savedMessage && (
                  <span className="save-message">{savedMessage}</span>
                )}
                <button className="btn btn-primary" type="submit">
                  Save preferences
                </button>
              </div>
            </form>
          </section>
        );

      case "security":
        return (
          <>
            <section className="settings-panel">
              <div className="panel-heading">
                <h2>Account security</h2>
                <p>Manage security preferences for your business account.</p>
              </div>

              <div className="panel-body">
                <Toggle
                  label="Two-factor authentication"
                  description="Add an additional verification step when signing in."
                  field="twoFactorEnabled"
                />

                <div className="setting-row">
                  <div className="setting-info">
                    <strong>Password management</strong>
                    <p>
                      Change your account password through the secure
                      authentication system.
                    </p>
                  </div>

                  <button className="btn" type="button" disabled>
                    Coming soon
                  </button>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <strong>Active sessions</strong>
                    <p>
                      Review devices and sessions currently signed into
                      your account.
                    </p>
                  </div>

                  <button className="btn" type="button" disabled>
                    Coming soon
                  </button>
                </div>
              </div>
            </section>

            <section className="settings-panel">
              <div className="panel-heading">
                <h2>Business account actions</h2>
                <p>
                  Important account-level operations.
                </p>
              </div>

              <div className="panel-body">
                <div className="danger-box">
                  <strong>Business account deletion</strong>
                  <p>
                    Permanent business deletion will require owner
                    verification and a secure backend process. This action
                    is not available in the frontend preview.
                  </p>
                </div>
              </div>
            </section>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="md-settings">
      <style>{styles}</style>

      <div className="settings-header">
        <h1>Settings</h1>
        <p>Configure your business account and store preferences.</p>
      </div>

      <div className="settings-notice">
        <div className="notice-icon">ⓘ</div>
        <div>
          <strong>Frontend preview mode</strong>
          <p>
            Settings currently update temporary page state only. They are
            not saved to your business account. Persistent settings,
            permissions and security controls will be connected during
            backend integration.
          </p>
        </div>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={
                activeSection === section.id ? "active" : ""
              }
              onClick={() => {
                setActiveSection(section.id);
                setSavedMessage("");
              }}
            >
              <span className="nav-icon">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>

        <main className="settings-content">
          {sectionContent()}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 8,
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={resetSection}
            >
              Reset preview fields
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
