import { useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";

import { STORE_NAME } from "../config/store";
import ThemeSwitcher from "./ThemeSwitcher";

const links = [
  {
    label: "POS",
    path: "/cashier/pos",
    icon: "bi-cart3",
    primary: true,
  },
  {
    label: "Sales History",
    path: "/cashier/sales-history",
    icon: "bi-receipt",
  },
  {
    label: "Held Sales",
    path: "/cashier/held-sales",
    icon: "bi-pause-circle",
  },
  {
    label: "Orders",
    path: "/cashier/orders",
    icon: "bi-box-seam",
  },
  {
    label: "Deliveries",
    path: "/cashier/deliveries",
    icon: "bi-truck",
  },
  {
    label: "Stock",
    path: "/cashier/stock",
    icon: "bi-boxes",
  },
  {
    label: "Stock History",
    path: "/cashier/stock-history",
    icon: "bi-clock-history",
  },
  {
    label: "My Shift",
    path: "/cashier/shift",
    icon: "bi-clock",
  },
];

function CashierNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // CLOSE MOBILE NAVIGATION AFTER ROUTE CHANGE
  // =========================================================

  useEffect(() => {
    const navbar = document.getElementById("cashierNavbar");

    if (!navbar?.classList.contains("show")) return;

    if (window.bootstrap?.Collapse) {
      window.bootstrap.Collapse
        .getOrCreateInstance(navbar, { toggle: false })
        .hide();
    } else {
      navbar.classList.remove("show");
    }
  }, [location.pathname]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out?"
    );

    if (!confirmed) return;

    localStorage.removeItem("cashierToken");
    localStorage.removeItem("cashier");

    navigate("/cashier-login", { replace: true });
  };

  // =========================================================
  // NAVBAR
  // =========================================================

  return (
    <>
      <nav className="navbar navbar-expand-xl sticky-top md-cashier-navbar">
        <div className="container-fluid px-3 px-lg-4">

          {/* BRAND */}

          <Link
            className="navbar-brand md-cashier-brand"
            to="/cashier/pos"
            aria-label={`${STORE_NAME} Cashier Home`}
          >
            <span className="md-cashier-brand-icon">
              <i className="bi bi-shop" />
            </span>

            <span className="md-cashier-brand-text">
              <span className="md-cashier-brand-name">
                {STORE_NAME}
              </span>

              <span className="md-cashier-brand-label">
                CASHIER WORKSPACE
              </span>
            </span>
          </Link>

          {/* MOBILE TOGGLE */}

          <button
            className="navbar-toggler md-cashier-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#cashierNavbar"
            aria-controls="cashierNavbar"
            aria-expanded="false"
            aria-label="Toggle cashier navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          {/* NAVIGATION */}

          <div
            className="collapse navbar-collapse"
            id="cashierNavbar"
          >
            <ul className="navbar-nav mx-auto mb-2 mb-xl-0 md-cashier-nav">

              {links.map((link) => (
                <li className="nav-item" key={link.path}>
                  <NavLink
                    to={link.path}
                    end
                    className={({ isActive }) =>
                      `md-cashier-nav-link ${
                        isActive ? "active" : ""
                      } ${link.primary ? "md-cashier-pos-link" : ""}`
                    }
                  >
                    <i className={`bi ${link.icon}`} />
                    <span>{link.label}</span>
                  </NavLink>
                </li>
              ))}

            </ul>

            {/* RIGHT SIDE */}

            <div className="md-cashier-account-area">

              {/* THEME */}

              <div className="md-cashier-theme">
                <ThemeSwitcher />
              </div>

              {/* CASHIER PROFILE */}

              <div className="md-cashier-profile">
                <span className="md-cashier-avatar">
                  <i className="bi bi-person-fill" />
                </span>

                <span className="md-cashier-profile-text">
                  <strong>Cashier</strong>
                  <small>Active Workspace</small>
                </span>
              </div>

              {/* LOGOUT */}

              <button
                type="button"
                className="md-cashier-logout"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right" />
                <span>Logout</span>
              </button>

            </div>
          </div>
        </div>
      </nav>

      {/* STYLES */}

      <style>{`
        .md-cashier-navbar {
          min-height: 70px;
          padding: 9px 0;
          background: var(--surface);
          color: var(--text-primary);
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          z-index: 1030;
        }

        .md-cashier-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-right: 22px;
          color: var(--text-primary);
          text-decoration: none;
        }

        .md-cashier-brand:hover {
          color: var(--text-primary);
        }

        .md-cashier-brand-icon {
          width: 41px;
          height: 41px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: #fff;
          background: var(--primary);
          font-size: 18px;
        }

        .md-cashier-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .md-cashier-brand-name {
          font-size: 14px;
          font-weight: 750;
        }

        .md-cashier-brand-label {
          margin-top: 4px;
          color: var(--text-muted);
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.1px;
        }

        .md-cashier-toggler {
          border-color: var(--border) !important;
          padding: 7px 10px;
          box-shadow: none !important;
        }

        .md-cashier-nav {
          align-items: center;
          gap: 3px;
        }

        .md-cashier-nav-link {
          min-height: 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 9px 10px;
          border-radius: 9px;
          color: var(--text-secondary, var(--text-muted));
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.18s ease;
        }

        .md-cashier-nav-link > i {
          font-size: 14px;
        }

        .md-cashier-nav-link:hover,
        .md-cashier-nav-link.active {
          color: var(--primary);
          background: var(--primary-light);
        }

        .md-cashier-nav-link.md-cashier-pos-link {
          color: #fff;
          background: var(--primary);
          padding-left: 15px;
          padding-right: 15px;
          box-shadow: 0 3px 10px rgba(79, 70, 229, 0.18);
        }

        .md-cashier-nav-link.md-cashier-pos-link:hover,
        .md-cashier-nav-link.md-cashier-pos-link.active {
          color: #fff;
          background: var(--primary-hover);
        }

        .md-cashier-account-area {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-left: 15px;
          border-left: 1px solid var(--border);
        }

        .md-cashier-profile {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .md-cashier-avatar {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--primary-light);
          color: var(--primary);
          font-size: 16px;
        }

        .md-cashier-profile-text {
          display: flex;
          flex-direction: column;
          line-height: 1.3;
        }

        .md-cashier-profile-text strong {
          color: var(--text-primary);
          font-size: 11px;
        }

        .md-cashier-profile-text small {
          margin-top: 3px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .md-cashier-logout {
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 11px;
          border: 1px solid var(--border);
          border-radius: 9px;
          background: var(--surface);
          color: var(--text-secondary, var(--text-muted));
          font-size: 12px;
          font-weight: 650;
          transition: all 0.2s ease;
        }

        .md-cashier-logout:hover {
          color: var(--danger);
          border-color: var(--danger);
          background: var(--danger-light, var(--surface-secondary));
        }

        @media (max-width: 1199px) {
          .md-cashier-nav {
            align-items: stretch;
            padding-top: 12px;
          }

          .md-cashier-nav-link {
            justify-content: flex-start;
            width: 100%;
          }

          .md-cashier-account-area {
            flex-direction: column;
            align-items: stretch;
            gap: 13px;
            margin-top: 12px;
            padding: 15px 0 5px;
            border-left: 0;
            border-top: 1px solid var(--border);
          }

          .md-cashier-logout {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .md-cashier-brand {
            margin-right: 5px;
          }

          .md-cashier-brand-name {
            font-size: 12px;
          }

          .md-cashier-brand-icon {
            width: 37px;
            height: 37px;
          }
        }
      `}</style>
    </>
  );
}

export default CashierNavbar;
