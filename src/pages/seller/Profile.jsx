import { useRef, useState } from "react";

const styles = `
.md-profile {
  width: 100%;
  color: var(--text-primary, #172033);
  padding-bottom: 30px;
}

.md-profile * {
  box-sizing: border-box;
}

.md-profile .profile-header {
  margin-bottom: 23px;
}

.md-profile .profile-header h1 {
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -.6px;
  margin: 0 0 7px;
}

.md-profile .profile-header p {
  color: var(--text-secondary, #64748b);
  font-size: 14px;
  margin: 0;
}

.md-profile .profile-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1e40af;
  border-radius: 12px;
  margin-bottom: 22px;
}

.md-profile .notice-icon {
  font-size: 18px;
}

.md-profile .profile-notice strong {
  display: block;
  font-size: 13px;
  margin-bottom: 4px;
}

.md-profile .profile-notice p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
}

.md-profile .profile-layout {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.md-profile .profile-card,
.md-profile .profile-section {
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  overflow: hidden;
}

.md-profile .profile-card {
  padding: 24px 20px;
  text-align: center;
}

.md-profile .avatar-wrap {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 15px;
}

.md-profile .avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--surface-secondary, #e2e8f0);
  color: var(--text-primary, #334155);
  font-size: 32px;
  font-weight: 750;
  overflow: hidden;
}

.md-profile .avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.md-profile .avatar-edit {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 31px;
  height: 31px;
  border: 2px solid var(--surface-color, #fff);
  border-radius: 50%;
  background: var(--accent-color, #4f46e5);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  font-size: 14px;
}

.md-profile .profile-card h2 {
  font-size: 17px;
  margin: 0 0 5px;
}

.md-profile .profile-card .profile-email {
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.md-profile .role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: 30px;
  background: var(--surface-secondary, #f1f5f9);
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  font-weight: 700;
  margin-top: 13px;
}

.md-profile .profile-card-divider {
  border: 0;
  border-top: 1px solid var(--border-color, #e2e8f0);
  margin: 20px 0;
}

.md-profile .profile-card-info {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  text-align: left;
  margin-bottom: 15px;
  font-size: 11px;
}

.md-profile .profile-card-info:last-child {
  margin-bottom: 0;
}

.md-profile .profile-card-info span:first-child {
  color: var(--text-secondary, #64748b);
}

.md-profile .profile-card-info span:last-child {
  font-weight: 650;
  text-align: right;
}

.md-profile .profile-main {
  min-width: 0;
}

.md-profile .profile-section {
  margin-bottom: 18px;
}

.md-profile .section-heading {
  padding: 19px 20px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.md-profile .section-heading h2 {
  font-size: 15px;
  font-weight: 750;
  margin: 0 0 5px;
}

.md-profile .section-heading p {
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  margin: 0;
  line-height: 1.5;
}

.md-profile .section-body {
  padding: 20px;
}

.md-profile .form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 17px;
}

.md-profile .field {
  min-width: 0;
}

.md-profile .field.full {
  grid-column: 1 / -1;
}

.md-profile .field label {
  display: block;
  color: var(--text-primary, #334155);
  font-size: 12px;
  font-weight: 650;
  margin-bottom: 7px;
}

.md-profile .field input,
.md-profile .field select {
  width: 100%;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
  border-radius: 9px;
  padding: 11px 12px;
  font-size: 13px;
  outline: none;
}

.md-profile .field input:focus,
.md-profile .field select:focus {
  border-color: var(--accent-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99,102,241,.10);
}

.md-profile .field input:disabled {
  background: var(--surface-secondary, #f8fafc);
  color: var(--text-secondary, #64748b);
  cursor: not-allowed;
}

.md-profile .field-hint {
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  margin-top: 6px;
  line-height: 1.5;
}

.md-profile .section-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  border-top: 1px solid var(--border-color, #e2e8f0);
}

.md-profile .save-message {
  color: #15803d;
  font-size: 12px;
  font-weight: 650;
  margin-right: auto;
}

.md-profile .btn {
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
  border-radius: 9px;
  padding: 10px 15px;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.md-profile .btn-primary {
  border-color: var(--accent-color, #4f46e5);
  background: var(--accent-color, #4f46e5);
  color: #fff;
}

.md-profile .btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.md-profile .security-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.md-profile .security-row:first-child {
  padding-top: 0;
}

.md-profile .security-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.md-profile .security-info strong {
  display: block;
  font-size: 13px;
  margin-bottom: 5px;
}

.md-profile .security-info p {
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  line-height: 1.5;
  margin: 0;
}

.md-profile .security-status {
  font-size: 11px;
  color: var(--text-secondary, #64748b);
  white-space: nowrap;
}

.md-profile .profile-danger {
  border: 1px solid #fecaca;
  background: #fff7f7;
  border-radius: 11px;
  padding: 16px;
}

.md-profile .profile-danger strong {
  display: block;
  color: #b91c1c;
  font-size: 13px;
  margin-bottom: 5px;
}

.md-profile .profile-danger p {
  color: #991b1b;
  font-size: 11px;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 850px) {
  .md-profile .profile-layout {
    grid-template-columns: 1fr;
  }

  .md-profile .profile-card {
    display: grid;
    grid-template-columns: auto 1fr;
    text-align: left;
    align-items: center;
    gap: 0 18px;
  }

  .md-profile .avatar-wrap {
    grid-row: span 3;
    margin: 0;
  }

  .md-profile .profile-card-divider,
  .md-profile .profile-card-info {
    display: none;
  }
}

@media (max-width: 540px) {
  .md-profile .form-grid {
    grid-template-columns: 1fr;
  }

  .md-profile .field.full {
    grid-column: auto;
  }

  .md-profile .section-body {
    padding: 15px;
  }

  .md-profile .section-heading {
    padding: 16px;
  }

  .md-profile .profile-header h1 {
    font-size: 22px;
  }

  .md-profile .profile-card {
    padding: 17px;
  }

  .md-profile .avatar-wrap,
  .md-profile .avatar {
    width: 75px;
    height: 75px;
  }

  .md-profile .avatar {
    font-size: 25px;
  }
}
`;

const initialProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  position: "",
  country: "Kenya",
  city: "",
  address: "",
};

export default function Profile() {
  const [profile, setProfile] = useState(initialProfile);
  const [photo, setPhoto] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const fileInputRef = useRef(null);

  const update = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
    setSavedMessage("");
  };

  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  const initials = fullName
    ? fullName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Profile image must be 5MB or smaller.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setPhoto(reader.result);
      setSavedMessage("");
    };

    reader.readAsDataURL(file);
  };

  const savePreview = (event) => {
    event.preventDefault();

    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      alert("Please enter your first and last name.");
      return;
    }

    if (
      profile.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
    ) {
      alert("Please enter a valid email address.");
      return;
    }

    setSavedMessage(
      "Profile preview updated. Changes have not been saved to the database."
    );
  };

  const resetPreview = () => {
    setProfile(initialProfile);
    setPhoto("");
    setSavedMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="md-profile">
      <style>{styles}</style>

      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your personal information and account details.</p>
      </div>

      <div className="profile-notice">
        <div className="notice-icon">ⓘ</div>
        <div>
          <strong>Frontend preview mode</strong>
          <p>
            Profile information and photo changes are temporary.
            They will be connected to your authenticated account
            during backend integration.
          </p>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-card">
          <div className="avatar-wrap">
            <div className="avatar">
              {photo ? (
                <img src={photo} alt="Profile preview" />
              ) : (
                initials
              )}
            </div>

            <button
              type="button"
              className="avatar-edit"
              title="Change profile photo"
              onClick={() => fileInputRef.current?.click()}
            >
              ✎
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoChange}
            />
          </div>

          <h2>{fullName || "Your name"}</h2>

          <div className="profile-email">
            {profile.email || "No email added"}
          </div>

          <div className="role-badge">
            ◈ Business Owner
          </div>

          <hr className="profile-card-divider" />

          <div className="profile-card-info">
            <span>Account type</span>
            <span>Business Owner</span>
          </div>

          <div className="profile-card-info">
            <span>Account status</span>
            <span>—</span>
          </div>

          <div className="profile-card-info">
            <span>Member since</span>
            <span>—</span>
          </div>
        </aside>

        <main className="profile-main">
          <section className="profile-section">
            <div className="section-heading">
              <h2>Personal information</h2>
              <p>
                Update the personal details associated with your
                MyDuka account.
              </p>
            </div>

            <form onSubmit={savePreview}>
              <div className="section-body">
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="profile-firstName">
                      First name
                    </label>
                    <input
                      id="profile-firstName"
                      value={profile.firstName}
                      onChange={(event) =>
                        update("firstName", event.target.value)
                      }
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="profile-lastName">
                      Last name
                    </label>
                    <input
                      id="profile-lastName"
                      value={profile.lastName}
                      onChange={(event) =>
                        update("lastName", event.target.value)
                      }
                      placeholder="Enter last name"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="profile-email">
                      Email address
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      value={profile.email}
                      onChange={(event) =>
                        update("email", event.target.value)
                      }
                      placeholder="you@example.com"
                    />
                    <div className="field-hint">
                      Your account email address.
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="profile-phone">
                      Phone number
                    </label>
                    <input
                      id="profile-phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(event) =>
                        update("phone", event.target.value)
                      }
                      placeholder="+254..."
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="profile-position">
                      Position / Job title
                    </label>
                    <input
                      id="profile-position"
                      value={profile.position}
                      onChange={(event) =>
                        update("position", event.target.value)
                      }
                      placeholder="e.g. Business Owner"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="profile-country">
                      Country
                    </label>
                    <select
                      id="profile-country"
                      value={profile.country}
                      onChange={(event) =>
                        update("country", event.target.value)
                      }
                    >
                      <option value="Kenya">Kenya</option>
                      <option value="Uganda">Uganda</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Rwanda">Rwanda</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="profile-city">
                      City / Town
                    </label>
                    <input
                      id="profile-city"
                      value={profile.city}
                      onChange={(event) =>
                        update("city", event.target.value)
                      }
                      placeholder="Enter city or town"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="profile-address">
                      Address
                    </label>
                    <input
                      id="profile-address"
                      value={profile.address}
                      onChange={(event) =>
                        update("address", event.target.value)
                      }
                      placeholder="Enter address"
                    />
                  </div>
                </div>
              </div>

              <div className="section-footer">
                {savedMessage && (
                  <span className="save-message">
                    {savedMessage}
                  </span>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save profile
                </button>
              </div>
            </form>
          </section>

          <section className="profile-section">
            <div className="section-heading">
              <h2>Account security</h2>
              <p>
                Manage access and security for your MyDuka account.
              </p>
            </div>

            <div className="section-body">
              <div className="security-row">
                <div className="security-info">
                  <strong>Password</strong>
                  <p>
                    Update your password to keep your account secure.
                  </p>
                </div>

                <span className="security-status">
                  Not connected
                </span>
              </div>

              <div className="security-row">
                <div className="security-info">
                  <strong>Two-factor authentication</strong>
                  <p>
                    Add another verification step when signing in.
                  </p>
                </div>

                <span className="security-status">
                  Not configured
                </span>
              </div>

              <div className="security-row">
                <div className="security-info">
                  <strong>Active sessions</strong>
                  <p>
                    Review devices currently signed into your account.
                  </p>
                </div>

                <span className="security-status">
                  Not connected
                </span>
              </div>
            </div>
          </section>

          <section className="profile-section">
            <div className="section-heading">
              <h2>Account actions</h2>
              <p>
                Important actions relating to your personal account.
              </p>
            </div>

            <div className="section-body">
              <div className="profile-danger">
                <strong>Delete personal account</strong>
                <p>
                  Account deletion requires identity verification
                  and a secure backend process. It is not available
                  in this frontend preview.
                </p>
              </div>
            </div>
          </section>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={resetPreview}
            >
              Reset preview
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
