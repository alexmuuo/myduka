import { useCallback, useEffect, useState } from "react";
import api from "../../api/api";

const styles = `
.md-settings{width:100%;padding-bottom:30px;color:var(--text-primary,#172033)}
.md-settings *{box-sizing:border-box}
.md-settings .settings-header{margin-bottom:24px}
.md-settings .settings-header h1{font-size:25px;font-weight:750;margin:0 0 7px}
.md-settings .settings-header p{color:var(--text-secondary,#64748b);font-size:14px;margin:0}
.md-settings .settings-layout{display:grid;grid-template-columns:220px minmax(0,1fr);gap:20px;align-items:start}
.md-settings .settings-nav{background:var(--surface-color,#fff);border:1px solid var(--border-color,#e2e8f0);border-radius:13px;padding:8px;position:sticky;top:15px}
.md-settings .settings-nav button{width:100%;display:flex;align-items:center;gap:11px;text-align:left;padding:12px;border:0;border-radius:9px;background:transparent;color:var(--text-secondary,#64748b);cursor:pointer;font-size:12px;font-weight:650}
.md-settings .settings-nav button.active{background:var(--surface-secondary,#f1f5f9);color:var(--text-primary,#172033)}
.md-settings .settings-nav button:hover{background:var(--surface-secondary,#f8fafc)}
.md-settings .nav-icon{font-size:16px;width:20px;text-align:center}
.md-settings .settings-content{min-width:0}
.md-settings .settings-panel{background:var(--surface-color,#fff);border:1px solid var(--border-color,#e2e8f0);border-radius:14px;margin-bottom:18px;overflow:hidden}
.md-settings .panel-heading{padding:19px 20px;border-bottom:1px solid var(--border-color,#e2e8f0)}
.md-settings .panel-heading h2{font-size:15px;font-weight:750;margin:0 0 5px}
.md-settings .panel-heading p{color:var(--text-secondary,#64748b);font-size:12px;margin:0;line-height:1.5}
.md-settings .panel-body{padding:20px}
.md-settings .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px}
.md-settings .field{min-width:0}
.md-settings .field.full{grid-column:1/-1}
.md-settings label{display:block;color:var(--text-primary,#334155);font-size:12px;font-weight:650;margin-bottom:7px}
.md-settings input,.md-settings select,.md-settings textarea{width:100%;border:1px solid var(--border-color,#cbd5e1);background:var(--surface-color,#fff);color:var(--text-primary,#172033);border-radius:9px;padding:11px 12px;font-size:13px;outline:none}
.md-settings input:focus,.md-settings select:focus,.md-settings textarea:focus{border-color:var(--accent-color,#6366f1);box-shadow:0 0 0 3px rgba(99,102,241,.10)}
.md-settings input:disabled{opacity:.65;cursor:not-allowed}
.md-settings .field-hint{font-size:11px;color:var(--text-secondary,#64748b);margin-top:6px;line-height:1.5}
.md-settings .panel-footer{padding:15px 20px;border-top:1px solid var(--border-color,#e2e8f0);display:flex;justify-content:flex-end;align-items:center;gap:10px;flex-wrap:wrap}
.md-settings .btn{border:1px solid var(--border-color,#cbd5e1);background:var(--surface-color,#fff);color:var(--text-primary,#172033);border-radius:9px;padding:10px 15px;font-size:12px;font-weight:650;cursor:pointer}
.md-settings .btn-primary{border-color:var(--accent-color,#4f46e5);background:var(--accent-color,#4f46e5);color:white}
.md-settings .btn:disabled{opacity:.5;cursor:not-allowed}
.md-settings .message{padding:12px 15px;border-radius:9px;font-size:13px;line-height:1.5;margin-bottom:16px}
.md-settings .message.error{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}
.md-settings .message.success{background:#dcfce7;color:#166534;border:1px solid #bbf7d0}
.md-settings .loading{padding:45px 20px;text-align:center;color:var(--text-secondary,#64748b)}
.md-settings .status-label{font-size:11px;color:var(--text-secondary,#64748b);margin-top:5px}
.md-settings .setting-row{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:15px 0;border-bottom:1px solid var(--border-color,#e2e8f0)}
.md-settings .setting-row:last-child{border-bottom:0}
.md-settings .setting-row strong{display:block;font-size:13px;font-weight:650;margin-bottom:4px}
.md-settings .setting-row small{display:block;font-size:11px;color:var(--text-secondary,#64748b);line-height:1.5}
.md-settings .switch{position:relative;width:43px;height:24px;flex-shrink:0}
.md-settings .switch input{opacity:0;width:0;height:0}
.md-settings .switch span{position:absolute;inset:0;border-radius:30px;background:#cbd5e1;cursor:pointer;transition:.2s}
.md-settings .switch span:before{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;background:white;border-radius:50%;transition:.2s}
.md-settings .switch input:checked+span{background:#4f46e5}
.md-settings .switch input:checked+span:before{transform:translateX(19px)}
.md-settings .empty-note{padding:15px;border:1px dashed var(--border-color,#cbd5e1);border-radius:10px;color:var(--text-secondary,#64748b);font-size:12px;line-height:1.6}
@media(max-width:760px){.md-settings .settings-layout{grid-template-columns:1fr}.md-settings .settings-nav{position:static;display:flex;overflow-x:auto;gap:4px}.md-settings .settings-nav button{width:auto;flex-shrink:0;white-space:nowrap}}
@media(max-width:520px){.md-settings .form-grid{grid-template-columns:1fr}.md-settings .field.full{grid-column:auto}.md-settings .panel-body{padding:15px}.md-settings .panel-heading{padding:16px}.md-settings .settings-header h1{font-size:22px}}
`;

const SECTIONS = [
  { id: "business", label: "Business information", icon: "▦" },
  { id: "store", label: "Store preferences", icon: "▣" },
  { id: "orders", label: "Orders & checkout", icon: "🛒" },
  { id: "notifications", label: "Notifications", icon: "♧" },
  { id: "security", label: "Security", icon: "♙" },
];

const EMPTY_PROFILE = {
  name: "",
  slug: "",
  email: "",
  phone: "",
  address: "",
  logo_url: "",
};

const DEFAULT_SETTINGS = {
  store: {
    currency: "KES",
    timezone: "Africa/Nairobi",
    dateFormat: "DD/MM/YYYY",
    language: "en",
    storeName: "",
    storeSlug: "",
    storeEmail: "",
    storePhone: "",
    storeDescription: "",
    primaryColor: "#4f46e5",
    secondaryColor: "#0f172a",
  },
  orders: {
    orderPrefix: "ORD",
    taxEnabled: false,
    taxRate: 16,
    requireCustomerPhone: true,
    allowGuestCheckout: true,
    orderConfirmation: true,
  },
  notifications: {
    newOrderNotification: true,
    lowStockNotification: true,
    paymentNotification: true,
    emailNotifications: true,
    smsNotifications: false,
  },
};

function getBusinessId() {
  return localStorage.getItem("mydukaBusinessId");
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function mergeSettings(saved) {
  return {
    store: {
      ...DEFAULT_SETTINGS.store,
      ...(saved?.store || {}),
    },
    orders: {
      ...DEFAULT_SETTINGS.orders,
      ...(saved?.orders || {}),
    },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(saved?.notifications || {}),
    },
  };
}

function Panel({ title, description, children }) {
  return (
    <section className="settings-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, type = "text", hint, ...props }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ title, description, checked, onChange }) {
  return (
    <div className="setting-row">
      <div>
        <strong>{title}</strong>
        <small>{description}</small>
      </div>
      <label className="switch">
        <input
          type="checkbox"
          checked={Boolean(checked)}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span />
      </label>
    </div>
  );
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState("business");
  const [businessId] = useState(getBusinessId);

  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [originalProfile, setOriginalProfile] = useState(EMPTY_PROFILE);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    if (!businessId) {
      setError("No active business was found. Select or create a business first.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [businessResponse, settingsResponse] = await Promise.all([
        api.get("/businesses"),
        api.get(`/businesses/${businessId}/settings`),
      ]);

      const businesses = businessResponse.data?.businesses || [];

      const business = businesses.find(
        (item) => String(item.id) === String(businessId)
      );

      if (!business) {
        throw new Error("The selected business could not be found.");
      }

      const loadedProfile = {
        name: business.name || "",
        slug: business.slug || "",
        email: business.email || "",
        phone: business.phone || "",
        address: business.address || "",
        logo_url: business.logo_url || "",
      };

      const loadedSettings = mergeSettings(
        settingsResponse.data?.settings
      );

      setProfile(loadedProfile);
      setOriginalProfile(loadedProfile);
      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateProfile(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
    setSuccess("");
  }

  function updateSetting(group, field, value) {
    setSettings((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [field]: value,
      },
    }));
    setError("");
    setSuccess("");
  }

  async function saveBusiness(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!profile.name.trim()) {
      setError("Business name is required.");
      return;
    }

    if (!profile.slug.trim()) {
      setError("Business URL slug is required.");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(profile.slug.trim())) {
      setError("The business URL slug can only contain letters, numbers and hyphens.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: profile.name.trim(),
        slug: profile.slug.trim().toLowerCase(),
        email: profile.email.trim() || null,
        phone: profile.phone.trim() || null,
        address: profile.address.trim() || null,
        logo_url: profile.logo_url.trim() || null,
      };

      await api.put(`/businesses/${businessId}`, payload);

      const updatedProfile = {
        ...profile,
        ...payload,
        email: payload.email || "",
        phone: payload.phone || "",
        address: payload.address || "",
        logo_url: payload.logo_url || "",
      };

      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setSuccess("Business information saved successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings(group) {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = {
        settings: {
          [group]: settings[group],
        },
      };

      const response = await api.put(
        `/businesses/${businessId}/settings`,
        payload
      );

      const savedSettings = mergeSettings(response.data?.settings);

      setSettings(savedSettings);
      setOriginalSettings(savedSettings);

      const labels = {
        store: "Store preferences",
        orders: "Order and checkout preferences",
        notifications: "Notification preferences",
      };

      setSuccess(`${labels[group]} saved successfully.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function discardProfile() {
    setProfile(originalProfile);
    setError("");
    setSuccess("");
  }

  function discardSettings(group) {
    setSettings((current) => ({
      ...current,
      [group]: originalSettings[group],
    }));
    setError("");
    setSuccess("");
  }

  function hasProfileChanges() {
    return Object.keys(profile).some(
      (key) => profile[key] !== originalProfile[key]
    );
  }

  function hasSettingsChanges(group) {
    return Object.keys(settings[group]).some(
      (key) => settings[group][key] !== originalSettings[group][key]
    );
  }

  function renderBusinessInformation() {
    return (
      <Panel
        title="Business information"
        description="Manage the official information associated with your MyDuka business."
      >
        <form onSubmit={saveBusiness}>
          <div className="form-grid">
            <Field
              label="Business name *"
              value={profile.name}
              onChange={(value) => updateProfile("name", value)}
              placeholder="Your business name"
              required
            />

            <Field
              label="Business URL slug *"
              value={profile.slug}
              onChange={(value) => updateProfile("slug", value)}
              placeholder="your-business"
              hint="Lowercase letters, numbers and hyphens only."
              required
            />

            <Field
              label="Business email"
              type="email"
              value={profile.email}
              onChange={(value) => updateProfile("email", value)}
              placeholder="business@example.com"
            />

            <Field
              label="Business phone"
              value={profile.phone}
              onChange={(value) => updateProfile("phone", value)}
              placeholder="+254..."
            />

            <div className="field full">
              <Field
                label="Business address"
                value={profile.address}
                onChange={(value) => updateProfile("address", value)}
                placeholder="Town, county or physical address"
              />
            </div>

            <div className="field full">
              <Field
                label="Business logo URL"
                type="url"
                value={profile.logo_url}
                onChange={(value) => updateProfile("logo_url", value)}
                placeholder="https://example.com/logo.png"
                hint="This stores the logo URL. Upload and storage management will be connected separately."
              />
            </div>
          </div>

          <div className="panel-footer">
            <button
              type="button"
              className="btn"
              onClick={discardProfile}
              disabled={!hasProfileChanges() || saving}
            >
              Discard changes
            </button>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={saving || !hasProfileChanges()}
            >
              {saving ? "Saving..." : "Save business information"}
            </button>
          </div>
        </form>
      </Panel>
    );
  }

  function renderStorePreferences() {
    const store = settings.store;

    return (
      <Panel
        title="Store preferences"
        description="Configure your store identity, regional settings and storefront appearance."
      >
        <div className="form-grid">
          <Field
            label="Store display name"
            value={store.storeName}
            onChange={(value) => updateSetting("store", "storeName", value)}
            placeholder="Your store name"
          />

          <Field
            label="Store URL slug"
            value={store.storeSlug}
            onChange={(value) => updateSetting("store", "storeSlug", value)}
            placeholder="your-store"
          />

          <Field
            label="Store email"
            type="email"
            value={store.storeEmail}
            onChange={(value) => updateSetting("store", "storeEmail", value)}
            placeholder="store@example.com"
          />

          <Field
            label="Store phone"
            value={store.storePhone}
            onChange={(value) => updateSetting("store", "storePhone", value)}
            placeholder="+254..."
          />

          <SelectField
            label="Currency"
            value={store.currency}
            onChange={(value) => updateSetting("store", "currency", value)}
            options={[
              { value: "KES", label: "KES - Kenyan Shilling" },
              { value: "USD", label: "USD - US Dollar" },
              { value: "UGX", label: "UGX - Ugandan Shilling" },
              { value: "TZS", label: "TZS - Tanzanian Shilling" },
              { value: "EUR", label: "EUR - Euro" },
              { value: "GBP", label: "GBP - British Pound" },
            ]}
          />

          <SelectField
            label="Timezone"
            value={store.timezone}
            onChange={(value) => updateSetting("store", "timezone", value)}
            options={[
              { value: "Africa/Nairobi", label: "East Africa - Nairobi" },
              { value: "Africa/Kampala", label: "East Africa - Kampala" },
              { value: "Africa/Dar_es_Salaam", label: "East Africa - Dar es Salaam" },
              { value: "UTC", label: "UTC" },
              { value: "Europe/London", label: "Europe - London" },
            ]}
          />

          <SelectField
            label="Date format"
            value={store.dateFormat}
            onChange={(value) => updateSetting("store", "dateFormat", value)}
            options={[
              { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
              { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
              { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
            ]}
          />

          <SelectField
            label="Language"
            value={store.language}
            onChange={(value) => updateSetting("store", "language", value)}
            options={[
              { value: "en", label: "English" },
              { value: "sw", label: "Kiswahili" },
            ]}
          />

          <Field
            label="Primary brand colour"
            type="text"
            value={store.primaryColor}
            onChange={(value) => updateSetting("store", "primaryColor", value)}
            placeholder="#4f46e5"
          />

          <Field
            label="Secondary brand colour"
            type="text"
            value={store.secondaryColor}
            onChange={(value) => updateSetting("store", "secondaryColor", value)}
            placeholder="#0f172a"
          />

          <div className="field full">
            <label>Store description</label>
            <textarea
              rows="4"
              value={store.storeDescription}
              onChange={(event) =>
                updateSetting("store", "storeDescription", event.target.value)
              }
              placeholder="Briefly describe your store..."
            />
          </div>
        </div>

        <div className="panel-footer">
          <button
            className="btn"
            type="button"
            onClick={() => discardSettings("store")}
            disabled={!hasSettingsChanges("store") || saving}
          >
            Discard changes
          </button>

          <button
            className="btn btn-primary"
            type="button"
            onClick={() => saveSettings("store")}
            disabled={saving || !hasSettingsChanges("store")}
          >
            {saving ? "Saving..." : "Save store preferences"}
          </button>
        </div>
      </Panel>
    );
  }

  function renderOrderPreferences() {
    const orders = settings.orders;

    return (
      <Panel
        title="Orders & checkout"
        description="Control order numbering, tax configuration and customer checkout behaviour."
      >
        <div className="form-grid">
          <Field
            label="Order number prefix"
            value={orders.orderPrefix}
            onChange={(value) => updateSetting("orders", "orderPrefix", value)}
            placeholder="ORD"
            hint="For example, ORD-00001."
          />

          <Field
            label="Tax rate (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={orders.taxRate}
            onChange={(value) =>
              updateSetting("orders", "taxRate", value === "" ? "" : Number(value))
            }
          />
        </div>

        <div style={{ marginTop: 18 }}>
          <Toggle
            title="Enable tax"
            description="Apply the configured tax rate to applicable orders."
            checked={orders.taxEnabled}
            onChange={(value) => updateSetting("orders", "taxEnabled", value)}
          />

          <Toggle
            title="Require customer phone"
            description="Require customers to provide a phone number during checkout."
            checked={orders.requireCustomerPhone}
            onChange={(value) =>
              updateSetting("orders", "requireCustomerPhone", value)
            }
          />

          <Toggle
            title="Allow guest checkout"
            description="Allow customers to place orders without creating an account."
            checked={orders.allowGuestCheckout}
            onChange={(value) =>
              updateSetting("orders", "allowGuestCheckout", value)
            }
          />

          <Toggle
            title="Order confirmation"
            description="Enable order confirmation for newly placed orders."
            checked={orders.orderConfirmation}
            onChange={(value) =>
              updateSetting("orders", "orderConfirmation", value)
            }
          />
        </div>

        <div className="panel-footer">
          <button
            className="btn"
            type="button"
            onClick={() => discardSettings("orders")}
            disabled={!hasSettingsChanges("orders") || saving}
          >
            Discard changes
          </button>

          <button
            className="btn btn-primary"
            type="button"
            onClick={() => saveSettings("orders")}
            disabled={saving || !hasSettingsChanges("orders")}
          >
            {saving ? "Saving..." : "Save order preferences"}
          </button>
        </div>
      </Panel>
    );
  }

  function renderNotificationPreferences() {
    const notifications = settings.notifications;

    return (
      <Panel
        title="Notification preferences"
        description="Choose which business events should trigger notifications."
      >
        <Toggle
          title="New order notifications"
          description="Receive a notification when a customer places a new order."
          checked={notifications.newOrderNotification}
          onChange={(value) =>
            updateSetting("notifications", "newOrderNotification", value)
          }
        />

        <Toggle
          title="Low stock alerts"
          description="Receive alerts when products reach low stock levels."
          checked={notifications.lowStockNotification}
          onChange={(value) =>
            updateSetting("notifications", "lowStockNotification", value)
          }
        />

        <Toggle
          title="Payment notifications"
          description="Receive notifications about payment events."
          checked={notifications.paymentNotification}
          onChange={(value) =>
            updateSetting("notifications", "paymentNotification", value)
          }
        />

        <Toggle
          title="Email notifications"
          description="Allow business notifications to be sent through email."
          checked={notifications.emailNotifications}
          onChange={(value) =>
            updateSetting("notifications", "emailNotifications", value)
          }
        />

        <Toggle
          title="SMS notifications"
          description="Allow business notifications to be sent through SMS."
          checked={notifications.smsNotifications}
          onChange={(value) =>
            updateSetting("notifications", "smsNotifications", value)
          }
        />

        <div className="panel-footer">
          <button
            className="btn"
            type="button"
            onClick={() => discardSettings("notifications")}
            disabled={!hasSettingsChanges("notifications") || saving}
          >
            Discard changes
          </button>

          <button
            className="btn btn-primary"
            type="button"
            onClick={() => saveSettings("notifications")}
            disabled={saving || !hasSettingsChanges("notifications")}
          >
            {saving ? "Saving..." : "Save notification preferences"}
          </button>
        </div>
      </Panel>
    );
  }

  function renderSecurity() {
    return (
      <Panel
        title="Account security"
        description="Manage authentication and account protection."
      >
        <div className="empty-note">
          <strong>Account security controls are not connected yet.</strong>
          <br />
          Password changes, two-factor authentication, active session
          management and account recovery will be implemented through the
          authentication module. No unsupported security settings are saved
          here.
        </div>
      </Panel>
    );
  }

  function renderSection() {
    switch (activeSection) {
      case "business":
        return renderBusinessInformation();
      case "store":
        return renderStorePreferences();
      case "orders":
        return renderOrderPreferences();
      case "notifications":
        return renderNotificationPreferences();
      case "security":
        return renderSecurity();
      default:
        return null;
    }
  }

  return (
    <div className="md-settings">
      <style>{styles}</style>

      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your business profile and application preferences.</p>
      </div>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <div className="settings-layout">
        <nav className="settings-nav">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={activeSection === section.id ? "active" : ""}
              onClick={() => {
                setActiveSection(section.id);
                setError("");
                setSuccess("");
              }}
            >
              <span className="nav-icon">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>

        <main className="settings-content">
          {loading ? (
            <div className="loading">Loading business settings...</div>
          ) : (
            renderSection()
          )}

          {!loading && (
            <div className="status-label">
              Business ID: {businessId}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
