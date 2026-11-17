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
.md-settings .notice{padding:15px;border:1px solid #bfdbfe;background:#eff6ff;color:#1e40af;border-radius:12px;margin-bottom:20px;font-size:12px;line-height:1.6}
.md-settings .notice strong{display:block;margin-bottom:4px}
.md-settings .empty-note{border:1px dashed var(--border-color,#cbd5e1);background:var(--surface-secondary,#f8fafc);border-radius:10px;padding:17px;color:var(--text-secondary,#64748b);font-size:12px;line-height:1.6}
.md-settings .loading{padding:45px 20px;text-align:center;color:var(--text-secondary,#64748b)}
.md-settings .status-label{font-size:11px;color:var(--text-secondary,#64748b);margin-top:5px}
@media(max-width:760px){.md-settings .settings-layout{grid-template-columns:1fr}.md-settings .settings-nav{position:static;display:flex;overflow-x:auto;gap:4px}.md-settings .settings-nav button{width:auto;flex-shrink:0;white-space:nowrap}}
@media(max-width:520px){.md-settings .form-grid{grid-template-columns:1fr}.md-settings .field.full{grid-column:auto}.md-settings .panel-body{padding:15px}.md-settings .panel-heading{padding:16px}.md-settings .settings-header h1{font-size:22px}}
`;

const sections = [
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

export default function Settings() {
  const [activeSection, setActiveSection] = useState("business");
  const [businessId] = useState(getBusinessId);

  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [originalProfile, setOriginalProfile] = useState(EMPTY_PROFILE);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBusiness = useCallback(async () => {
    if (!businessId) {
      setError("No active business was found. Select or create a business first.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get("/businesses");

      const businesses = response.data?.businesses || [];

      const business = businesses.find(
        (item) => String(item.id) === String(businessId)
      );

      if (!business) {
        throw new Error(
          "The selected business could not be found in your account."
        );
      }

      const loadedProfile = {
        name: business.name || "",
        slug: business.slug || "",
        email: business.email || "",
        phone: business.phone || "",
        address: business.address || "",
        logo_url: business.logo_url || "",
      };

      setProfile(loadedProfile);
      setOriginalProfile(loadedProfile);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadBusiness();
  }, [loadBusiness]);

  function update(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
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

    setSaving(true);

    try {
      await api.put(`/businesses/${businessId}`, {
        name: profile.name.trim(),
        slug: profile.slug.trim().toLowerCase(),
        email: profile.email.trim() || null,
        phone: profile.phone.trim() || null,
        address: profile.address.trim() || null,
        logo_url: profile.logo_url.trim() || null,
      });

      const updatedProfile = {
        ...profile,
        name: profile.name.trim(),
        slug: profile.slug.trim().toLowerCase(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        address: profile.address.trim(),
        logo_url: profile.logo_url.trim(),
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

  function resetProfile() {
    setProfile(originalProfile);
    setError("");
    setSuccess("");
  }

  const hasChanges = Object.keys(profile).some(
    (key) => profile[key] !== originalProfile[key]
  );

  const renderBusinessInformation = () => (
    <section className="settings-panel">
      <div className="panel-heading">
        <h2>Business information</h2>
        <p>
          Manage the official information associated with your MyDuka business.
        </p>
      </div>

      <form onSubmit={saveBusiness}>
        <div className="panel-body">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="business-name">Business name *</label>
              <input
                id="business-name"
                value={profile.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Your business name"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="business-slug">Business URL slug *</label>
              <input
                id="business-slug"
                value={profile.slug}
                onChange={(event) => update("slug", event.target.value)}
                placeholder="your-business"
                required
              />
              <div className="field-hint">
                Lowercase letters, numbers and hyphens only.
              </div>
            </div>

            <div className="field">
              <label htmlFor="business-email">Business email</label>
              <input
                id="business-email"
                type="email"
                value={profile.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="business@example.com"
              />
            </div>

            <div className="field">
              <label htmlFor="business-phone">Business phone</label>
              <input
                id="business-phone"
                value={profile.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="+254..."
              />
            </div>

            <div className="field full">
              <label htmlFor="business-address">Business address</label>
              <input
                id="business-address"
                value={profile.address}
                onChange={(event) => update("address", event.target.value)}
                placeholder="Town, county or physical address"
              />
            </div>

            <div className="field full">
              <label htmlFor="business-logo">Business logo URL</label>
              <input
                id="business-logo"
                type="url"
                value={profile.logo_url}
                onChange={(event) => update("logo_url", event.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <div className="field-hint">
                This stores the logo URL. Upload and storage management will be connected separately.
              </div>
            </div>
          </div>
        </div>

        <div className="panel-footer">
          <button
            type="button"
            className="btn"
            onClick={resetProfile}
            disabled={!hasChanges || saving}
          >
            Discard changes
          </button>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={saving || !hasChanges}
          >
            {saving ? "Saving..." : "Save business information"}
          </button>
        </div>
      </form>
    </section>
  );

  const renderComingSoon = (title, description, details) => (
    <section className="settings-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="panel-body">
        <div className="empty-note">
          <strong>{details}</strong>
          <br />
          These preferences are not yet connected to persistent business
          settings. They will be implemented with their dedicated backend
          storage instead of being saved temporarily in the browser.
        </div>
      </div>
    </section>
  );

  function renderSection() {
    switch (activeSection) {
      case "business":
        return renderBusinessInformation();

      case "store":
        return renderComingSoon(
          "Store preferences",
          "Configure the identity and appearance of your public storefront.",
          "Store branding and storefront preferences"
        );

      case "orders":
        return renderComingSoon(
          "Orders & checkout",
          "Configure order processing and customer checkout behaviour.",
          "Order numbering, tax and checkout preferences"
        );

      case "notifications":
        return renderComingSoon(
          "Notification preferences",
          "Choose which business events generate notifications.",
          "Email, SMS, order and inventory notifications"
        );

      case "security":
        return renderComingSoon(
          "Account security",
          "Manage security preferences for your business account.",
          "Two-factor authentication, password management and active sessions"
        );

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

      {error && (
        <div className="message error">{error}</div>
      )}

      {success && (
        <div className="message success">{success}</div>
      )}

      <div className="settings-layout">
        <nav className="settings-nav">
          {sections.map((section) => (
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

          {activeSection === "business" && !loading && (
            <div className="status-label">
              Business ID: {businessId}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
