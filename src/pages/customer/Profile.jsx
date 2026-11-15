import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const styles = `
.md-customer-profile {
  min-height: 75vh;
  padding: 32px 18px 60px;
  color: var(--text-primary, #172033);
  background: var(--background-color, transparent);
}

.md-customer-profile * {
  box-sizing: border-box;
}

.md-profile-inner {
  width: min(1000px, 100%);
  margin: 0 auto;
}

.md-profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 25px;
}

.md-profile-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--accent-color, #635bff);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 1.2px;
  text-transform: uppercase;
}

.md-profile-header h1 {
  margin: 0 0 8px;
  font-size: clamp(26px, 4vw, 35px);
  font-weight: 850;
  letter-spacing: -1px;
}

.md-profile-header p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
  line-height: 1.7;
}

.md-profile-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 10px 14px;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 10px;
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
  text-decoration: none;
  font-size: 12px;
  font-weight: 750;
}

.md-profile-back:hover {
  border-color: var(--accent-color, #635bff);
  color: var(--accent-color, #635bff);
}

.md-profile-layout {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  align-items: start;
  gap: 18px;
}

.md-profile-card {
  overflow: hidden;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 16px;
  background: var(--surface-color, #fff);
}

.md-profile-identity {
  padding: 27px 20px;
  text-align: center;
}

.md-profile-avatar {
  display: grid;
  width: 76px;
  height: 76px;
  place-items: center;
  margin: 0 auto 15px;
  border-radius: 23px;
  background: var(--accent-color, #635bff);
  color: #fff;
  font-size: 25px;
  font-weight: 850;
}

.md-profile-identity h2 {
  margin: 0 0 5px;
  font-size: 16px;
  font-weight: 850;
  overflow-wrap: anywhere;
}

.md-profile-identity p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  overflow-wrap: anywhere;
}

.md-profile-side-links {
  padding: 12px;
  border-top: 1px solid var(--border-color, #e7eaf0);
}

.md-profile-side-links a {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px;
  border-radius: 9px;
  color: var(--text-secondary, #64748b);
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
}

.md-profile-side-links a:hover,
.md-profile-side-links a.active {
  background: var(--surface-secondary, #f1f5f9);
  color: var(--accent-color, #635bff);
}

.md-profile-side-links i {
  font-size: 16px;
}

.md-profile-form-card {
  padding: 24px;
}

.md-profile-section-heading {
  padding-bottom: 18px;
  margin-bottom: 21px;
  border-bottom: 1px solid var(--border-color, #e7eaf0);
}

.md-profile-section-heading h2 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 850;
}

.md-profile-section-heading p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  line-height: 1.6;
}

.md-profile-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 19px 15px;
}

.md-profile-field.full {
  grid-column: 1 / -1;
}

.md-profile-field label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-primary, #172033);
  font-size: 11px;
  font-weight: 800;
}

.md-profile-field input {
  width: 100%;
  min-height: 46px;
  padding: 11px 13px;
  border: 1px solid var(--border-color, #dfe4ec);
  border-radius: 9px;
  outline: none;
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
  font: inherit;
  font-size: 12px;
  transition: border-color .2s, box-shadow .2s;
}

.md-profile-field input:focus {
  border-color: var(--accent-color, #635bff);
  box-shadow: 0 0 0 3px rgba(99, 91, 255, .1);
}

.md-profile-field input:disabled {
  background: var(--surface-secondary, #f1f5f9);
  color: var(--text-secondary, #64748b);
  cursor: not-allowed;
}

.md-profile-field small {
  display: block;
  margin-top: 7px;
  color: var(--text-secondary, #64748b);
  font-size: 10px;
  line-height: 1.5;
}

.md-profile-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 23px;
  margin-top: 23px;
  border-top: 1px solid var(--border-color, #e7eaf0);
}

.md-profile-button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 9px;
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  text-decoration: none;
}

.md-profile-button.primary {
  border-color: var(--accent-color, #635bff);
  background: var(--accent-color, #635bff);
  color: #fff;
}

.md-profile-button:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.md-profile-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 18px;
  padding: 12px 14px;
  border: 1px solid #b9e4ca;
  border-radius: 9px;
  background: #effaf3;
  color: #176b37;
  font-size: 11px;
  line-height: 1.6;
}

.md-profile-error {
  border-color: #f0c2c2;
  background: #fff4f4;
  color: #b42318;
}

.md-profile-notice {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin-top: 18px;
  padding: 14px 15px;
  border: 1px solid #d8e5fa;
  border-radius: 10px;
  background: #f5f8ff;
  color: #365b91;
  font-size: 11px;
  line-height: 1.7;
}

.md-profile-notice i {
  margin-top: 2px;
  font-size: 15px;
}

.md-profile-notice strong {
  display: block;
  margin-bottom: 3px;
}

.md-profile-security {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-top: 18px;
  padding: 18px;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 13px;
  background: var(--surface-color, #fff);
}

.md-profile-security h3 {
  margin: 0 0 5px;
  font-size: 12px;
  font-weight: 850;
}

.md-profile-security p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 10px;
  line-height: 1.6;
}

.md-profile-security a {
  flex-shrink: 0;
  color: var(--accent-color, #635bff);
  font-size: 11px;
  font-weight: 800;
  text-decoration: none;
}

.md-profile-signin {
  max-width: 500px;
  margin: 45px auto;
  padding: 38px 25px;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 16px;
  background: var(--surface-color, #fff);
  text-align: center;
}

.md-profile-signin i {
  display: block;
  margin-bottom: 15px;
  color: var(--accent-color, #635bff);
  font-size: 34px;
}

.md-profile-signin h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 850;
}

.md-profile-signin p {
  margin: 0 0 20px;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.7;
}

@media (max-width: 760px) {
  .md-profile-layout {
    grid-template-columns: 1fr;
  }

  .md-profile-identity {
    padding: 22px 18px;
  }

  .md-profile-avatar {
    width: 65px;
    height: 65px;
    border-radius: 19px;
  }

  .md-profile-side-links {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
  }

  .md-profile-side-links a {
    justify-content: center;
    flex-direction: column;
    gap: 5px;
    padding: 10px 5px;
    text-align: center;
    font-size: 10px;
  }
}

@media (max-width: 580px) {
  .md-customer-profile {
    padding: 23px 14px 45px;
  }

  .md-profile-header {
    flex-direction: column;
  }

  .md-profile-back {
    width: 100%;
    justify-content: center;
  }

  .md-profile-form-card {
    padding: 18px 15px;
  }

  .md-profile-fields {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .md-profile-field.full {
    grid-column: auto;
  }

  .md-profile-actions {
    flex-direction: column-reverse;
  }

  .md-profile-button {
    width: 100%;
  }

  .md-profile-security {
    align-items: flex-start;
    flex-direction: column;
  }
}
`;

function readCustomer() {
  try {
    const customer = JSON.parse(
      localStorage.getItem("customer") || "null"
    );
    const token = localStorage.getItem("customerToken");

    return token && customer?.id ? customer : null;
  } catch {
    return null;
  }
}

function initials(name) {
  return String(name || "Customer")
    .trim()
    .split(/\\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "C";
}

export default function Profile() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(readCustomer);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || customer.full_name || "",
        phone: customer.phone || "",
        email: customer.email || "",
      });
    }
  }, [customer]);

  useEffect(() => {
    const refresh = () => setCustomer(readCustomer());

    window.addEventListener("customerLogin", refresh);
    window.addEventListener("customerLogout", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("customerLogin", refresh);
      window.removeEventListener("customerLogout", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleSave = (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (
      form.email.trim() &&
      !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(form.email.trim())
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      const updatedCustomer = {
        ...customer,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
      };

      localStorage.setItem(
        "customer",
        JSON.stringify(updatedCustomer)
      );

      setCustomer(updatedCustomer);
      window.dispatchEvent(new Event("customerProfileUpdated"));

      setMessage(
        "Your changes have been saved on this device. They have not yet been synchronised with your MyDuka account on the server."
      );
    } catch {
      setError("Unable to save your changes in this browser.");
    }
  };

  if (!customer) {
    return (
      <>
        <style>{styles}</style>
        <main className="md-customer-profile">
          <section className="md-profile-signin">
            <i className="bi bi-person-lock" />
            <h2>Sign in to manage your profile</h2>
            <p>
              Sign in to access your customer details and account settings.
            </p>
            <Link
              to="/login"
              className="md-profile-button primary"
            >
              <i className="bi bi-box-arrow-in-right" />
              Sign in
            </Link>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <main className="md-customer-profile">
        <div className="md-profile-inner">
          <header className="md-profile-header">
            <div>
              <span className="md-profile-eyebrow">
                <i className="bi bi-person-gear" />
                Account settings
              </span>

              <h1>My Profile</h1>

              <p>
                View and manage the personal details associated with
                your customer account.
              </p>
            </div>

            <Link to="/account" className="md-profile-back">
              <i className="bi bi-arrow-left" />
              My account
            </Link>
          </header>

          <div className="md-profile-layout">
            <aside className="md-profile-card">
              <div className="md-profile-identity">
                <div className="md-profile-avatar">
                  {initials(form.name)}
                </div>

                <h2>{form.name || "Customer"}</h2>

                <p>{form.email || form.phone}</p>
              </div>

              <nav className="md-profile-side-links">
                <Link to="/account">
                  <i className="bi bi-grid" />
                  Overview
                </Link>

                <Link to="/account/orders">
                  <i className="bi bi-bag-check" />
                  My Orders
                </Link>

                <Link to="/wishlist">
                  <i className="bi bi-heart" />
                  Wishlist
                </Link>
              </nav>
            </aside>

            <div>
              <section className="md-profile-card md-profile-form-card">
                <div className="md-profile-section-heading">
                  <h2>Personal information</h2>
                  <p>
                    These are the details collected when you created
                    your customer account.
                  </p>
                </div>

                {message && (
                  <div className="md-profile-message" role="status">
                    <i className="bi bi-check-circle-fill" />
                    <span>{message}</span>
                  </div>
                )}

                {error && (
                  <div className="md-profile-message md-profile-error" role="alert">
                    <i className="bi bi-exclamation-circle-fill" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSave}>
                  <div className="md-profile-fields">
                    <div className="md-profile-field full">
                      <label htmlFor="profile-name">Full name</label>
                      <input
                        id="profile-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        required
                      />
                    </div>

                    <div className="md-profile-field">
                      <label htmlFor="profile-phone">Phone number</label>
                      <input
                        id="profile-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Your phone number"
                        required
                      />
                    </div>

                    <div className="md-profile-field">
                      <label htmlFor="profile-email">Email address</label>
                      <input
                        id="profile-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                      />
                      <small>
                        Email address is optional.
                      </small>
                    </div>

                    <div className="md-profile-field full">
                      <label>Customer ID</label>
                      <input
                        type="text"
                        value={String(customer.id)}
                        disabled
                        readOnly
                      />
                      <small>
                        Your customer ID is assigned by the system and
                        cannot be edited here.
                      </small>
                    </div>
                  </div>

                  <div className="md-profile-actions">
                    <button
                      type="button"
                      className="md-profile-button"
                      onClick={() => {
                        setForm({
                          name: customer.name || customer.full_name || "",
                          phone: customer.phone || "",
                          email: customer.email || "",
                        });
                        setMessage("");
                        setError("");
                      }}
                    >
                      Reset changes
                    </button>

                    <button
                      type="submit"
                      className="md-profile-button primary"
                    >
                      <i className="bi bi-check2-circle" />
                      Save changes
                    </button>
                  </div>
                </form>
              </section>

              <div className="md-profile-notice">
                <i className="bi bi-info-circle" />
                <div>
                  <strong>Server synchronisation is not connected yet.</strong>
                  This frontend preview saves edited details in the current
                  browser only. It does not update the customer record in
                  the database. We will connect profile updates through a
                  verified customer-authenticated backend endpoint later.
                </div>
              </div>

              <section className="md-profile-security">
                <div>
                  <h3>Password and account security</h3>
                  <p>
                    Password management will be connected through the
                    customer authentication workflow.
                  </p>
                </div>

                <Link to="/forgot-password">
                  Password help
                  <i className="bi bi-arrow-up-right ms-1" />
                </Link>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
