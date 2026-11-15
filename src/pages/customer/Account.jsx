import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const styles = `
.md-customer-account {
  width: 100%;
  min-height: 70vh;
  padding: 30px 20px 55px;
  color: var(--text-primary, #172033);
  background: var(--background-color, transparent);
}

.md-customer-account * {
  box-sizing: border-box;
}

.md-customer-account .account-container {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
}

.md-customer-account .account-heading {
  margin-bottom: 27px;
}

.md-customer-account .eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--accent-color, #635bff);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.md-customer-account .account-heading h1 {
  margin: 0 0 8px;
  font-size: clamp(25px, 4vw, 34px);
  font-weight: 800;
  letter-spacing: -1px;
}

.md-customer-account .account-heading p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 14px;
  line-height: 1.6;
}

.md-customer-account .welcome-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 27px 29px;
  margin-bottom: 25px;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 18px;
  background:
    radial-gradient(circle at 95% 10%, rgba(99, 91, 255, .13), transparent 35%),
    var(--surface-color, #fff);
}

.md-customer-account .welcome-content {
  display: flex;
  align-items: center;
  gap: 17px;
  min-width: 0;
}

.md-customer-account .welcome-avatar {
  flex: 0 0 62px;
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: var(--accent-color, #635bff);
  color: #fff;
  font-size: 23px;
  font-weight: 800;
}

.md-customer-account .welcome-text {
  min-width: 0;
}

.md-customer-account .welcome-text span {
  display: block;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  margin-bottom: 5px;
}

.md-customer-account .welcome-text h2 {
  margin: 0 0 5px;
  font-size: 19px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.md-customer-account .welcome-text p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.md-customer-account .edit-profile-button {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 16px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
  text-decoration: none;
  font-size: 12px;
  font-weight: 750;
  transition: .2s ease;
}

.md-customer-account .edit-profile-button:hover {
  border-color: var(--accent-color, #635bff);
  color: var(--accent-color, #635bff);
}

.md-customer-account .section-title {
  margin: 29px 0 15px;
}

.md-customer-account .section-title h2 {
  margin: 0 0 5px;
  font-size: 17px;
  font-weight: 800;
}

.md-customer-account .section-title p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.5;
}

.md-customer-account .account-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
}

.md-customer-account .account-link-card {
  display: flex;
  align-items: center;
  gap: 15px;
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 15px;
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
  text-decoration: none;
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
}

.md-customer-account .account-link-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent-color, #635bff);
  box-shadow: 0 9px 25px rgba(15, 23, 42, .06);
}

.md-customer-account .link-icon {
  flex: 0 0 47px;
  width: 47px;
  height: 47px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: var(--surface-secondary, #f1f5f9);
  color: var(--accent-color, #635bff);
  font-size: 20px;
}

.md-customer-account .link-copy {
  flex: 1;
  min-width: 0;
}

.md-customer-account .link-copy h3 {
  margin: 0 0 5px;
  font-size: 14px;
  font-weight: 800;
}

.md-customer-account .link-copy p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  line-height: 1.55;
}

.md-customer-account .link-arrow {
  flex-shrink: 0;
  color: var(--text-secondary, #94a3b8);
  font-size: 19px;
}

.md-customer-account .account-help {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 25px;
  padding: 20px 22px;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 15px;
  background: var(--surface-color, #fff);
}

.md-customer-account .help-copy h3 {
  margin: 0 0 5px;
  font-size: 14px;
  font-weight: 800;
}

.md-customer-account .help-copy p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.5;
}

.md-customer-account .help-button {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 15px;
  border-radius: 9px;
  background: var(--accent-color, #635bff);
  color: #fff;
  text-decoration: none;
  font-size: 12px;
  font-weight: 750;
}

.md-customer-account .help-button:hover {
  filter: brightness(.95);
}

.md-customer-account .signed-out-card {
  max-width: 540px;
  margin: 55px auto;
  padding: 38px 30px;
  text-align: center;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 18px;
  background: var(--surface-color, #fff);
}

.md-customer-account .signed-out-icon {
  width: 65px;
  height: 65px;
  display: grid;
  place-items: center;
  margin: 0 auto 19px;
  border-radius: 19px;
  background: var(--surface-secondary, #f1f5f9);
  color: var(--accent-color, #635bff);
  font-size: 27px;
}

.md-customer-account .signed-out-card h1 {
  margin: 0 0 9px;
  font-size: 23px;
  font-weight: 800;
}

.md-customer-account .signed-out-card p {
  margin: 0 auto 22px;
  max-width: 390px;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
  line-height: 1.7;
}

.md-customer-account .auth-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.md-customer-account .primary-button,
.md-customer-account .secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 19px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 750;
}

.md-customer-account .primary-button {
  background: var(--accent-color, #635bff);
  color: #fff;
}

.md-customer-account .secondary-button {
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
}

@media (max-width: 650px) {
  .md-customer-account {
    padding: 23px 14px 40px;
  }

  .md-customer-account .welcome-card {
    align-items: flex-start;
    flex-direction: column;
    padding: 21px;
  }

  .md-customer-account .welcome-content {
    width: 100%;
  }

  .md-customer-account .edit-profile-button {
    width: 100%;
  }

  .md-customer-account .account-grid {
    grid-template-columns: 1fr;
    gap: 11px;
  }

  .md-customer-account .account-link-card {
    padding: 16px;
  }

  .md-customer-account .account-help {
    align-items: flex-start;
    flex-direction: column;
  }

  .md-customer-account .help-button {
    width: 100%;
  }
}

@media (max-width: 380px) {
  .md-customer-account .welcome-avatar {
    flex-basis: 52px;
    width: 52px;
    height: 52px;
  }

  .md-customer-account .welcome-text h2 {
    font-size: 16px;
  }

  .md-customer-account .signed-out-card {
    padding: 30px 19px;
  }
}
`;

const accountLinks = [
  {
    title: "My Orders",
    description: "View your purchases and check their progress.",
    icon: "bi-bag-check",
    path: "/account/orders",
  },
  {
    title: "My Profile",
    description: "Manage your name, contact details and account.",
    icon: "bi-person-gear",
    path: "/account/profile",
  },
  {
    title: "My Wishlist",
    description: "Keep track of products you would like to buy.",
    icon: "bi-heart",
    path: "/wishlist",
  },
  {
    title: "Track an Order",
    description: "Check the progress of an order using its details.",
    icon: "bi-geo-alt",
    path: "/track-order",
  },
];

function getCustomer() {
  try {
    const token = localStorage.getItem("customerToken");
    const savedCustomer = localStorage.getItem("customer");

    if (!token || !savedCustomer) return null;

    const parsed = JSON.parse(savedCustomer);

    if (!parsed || !parsed.id) return null;

    return parsed;
  } catch {
    return null;
  }
}

function getInitials(name) {
  const words = String(name || "Customer")
    .trim()
    .split(/\\s+/)
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || "C";
}

function Account() {
  const [customer, setCustomer] = useState(getCustomer);
  const navigate = useNavigate();

  useEffect(() => {
    const refreshCustomer = () => {
      setCustomer(getCustomer());
    };

    window.addEventListener("customerLogin", refreshCustomer);
    window.addEventListener("customerLogout", refreshCustomer);
    window.addEventListener("storage", refreshCustomer);

    return () => {
      window.removeEventListener("customerLogin", refreshCustomer);
      window.removeEventListener("customerLogout", refreshCustomer);
      window.removeEventListener("storage", refreshCustomer);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("customer");
    localStorage.removeItem("customerToken");

    setCustomer(null);
    window.dispatchEvent(new Event("customerLogout"));
    navigate("/login");
  };

  const customerName =
    customer?.name ||
    customer?.full_name ||
    "Customer";

  const customerPhone = customer?.phone || "";
  const customerEmail = customer?.email || "";

  return (
    <>
      <style>{styles}</style>

      <main className="md-customer-account">
        <div className="account-container">
          {!customer ? (
            <section className="signed-out-card">
              <div className="signed-out-icon">
                <i className="bi bi-person-circle" />
              </div>

              <h1>Your MyDuka account</h1>

              <p>
                Sign in to manage your account, view your orders,
                update your details and keep track of your purchases.
              </p>

              <div className="auth-actions">
                <Link to="/login" className="primary-button">
                  Sign in
                </Link>

                <Link to="/register" className="secondary-button">
                  Create account
                </Link>
              </div>
            </section>
          ) : (
            <>
              <header className="account-heading">
                <span className="eyebrow">
                  <i className="bi bi-person-check" />
                  Customer account
                </span>

                <h1>My Account</h1>

                <p>
                  Manage your personal details, orders and shopping
                  preferences.
                </p>
              </header>

              <section className="welcome-card">
                <div className="welcome-content">
                  <div className="welcome-avatar">
                    {getInitials(customerName)}
                  </div>

                  <div className="welcome-text">
                    <span>Welcome back</span>
                    <h2>{customerName}</h2>
                    <p>
                      {customerPhone || customerEmail ||
                        "Manage your MyDuka customer account"}
                    </p>
                  </div>
                </div>

                <Link
                  to="/account/profile"
                  className="edit-profile-button"
                >
                  <i className="bi bi-pencil-square" />
                  Edit profile
                </Link>
              </section>

              <div className="section-title">
                <h2>Your account</h2>
                <p>
                  Everything you need to manage your shopping
                  experience.
                </p>
              </div>

              <section className="account-grid">
                {accountLinks.map((item) => (
                  <Link
                    to={item.path}
                    className="account-link-card"
                    key={item.path}
                  >
                    <div className="link-icon">
                      <i className={`bi ${item.icon}`} />
                    </div>

                    <div className="link-copy">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>

                    <i className="bi bi-chevron-right link-arrow" />
                  </Link>
                ))}
              </section>

              <section className="account-help">
                <div className="help-copy">
                  <h3>Need a hand?</h3>
                  <p>
                    Have a question about an order or need assistance
                    with your account?
                  </p>
                </div>

                <Link to="/ask-support" className="help-button">
                  Contact support
                  <i className="bi bi-arrow-right ms-2" />
                </Link>
              </section>

              <div style={{ marginTop: 22, textAlign: "right" }}>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#dc2626",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: "9px 0",
                  }}
                >
                  <i className="bi bi-box-arrow-right me-2" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default Account;
