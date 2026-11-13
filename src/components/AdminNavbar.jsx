import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { STORE_NAME } from "../config/store";
import api from "../api/api";
import ThemeSwitcher from "./ThemeSwitcher";

function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // =========================================================
  // LOAD UNREAD MESSAGE COUNT
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadUnreadMessageCount = async () => {
      if (!localStorage.getItem("adminToken")) {
        setUnreadMessageCount(0);
        return;
      }

      try {
        const response = await api.get("/admin/messages/unread-count");

        if (cancelled) return;

        if (!localStorage.getItem("adminToken")) {
          setUnreadMessageCount(0);
          return;
        }

        setUnreadMessageCount(
          Number(response.data?.unread_count) || 0
        );
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Could not load unread messages:",
            error.response?.data || error.message
          );
        }
      }
    };

    loadUnreadMessageCount();

    const interval = setInterval(loadUnreadMessageCount, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // =========================================================
  // CLOSE MOBILE NAVIGATION AFTER ROUTE CHANGE
  // =========================================================

  useEffect(() => {
    const navbar = document.getElementById("adminNavbar");

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
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    setUnreadMessageCount(0);

    navigate("/admin-login", { replace: true });
  };

  // =========================================================
  // NAVIGATION HELPERS
  // =========================================================

  const isActive = (path) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const linkClass = (path) =>
    `dropdown-item md-admin-dropdown-item ${
      isActive(path) ? "active" : ""
    }`;

  const dropdownClass = (paths) =>
    `nav-link md-admin-nav-link dropdown-toggle ${
      paths.some((path) => isActive(path)) ? "active" : ""
    }`;

  const normalLinkClass = (path) =>
    `nav-link md-admin-nav-link ${
      isActive(path) ? "active" : ""
    }`;

  // =========================================================
  // NAVBAR
  // =========================================================

  return (
    <>
      <nav className="navbar navbar-expand-xl sticky-top md-admin-navbar">
        <div className="container-fluid px-3 px-lg-4">

          {/* BRAND */}

          <Link
            className="navbar-brand md-admin-brand"
            to="/admin"
          >
            <span className="md-admin-brand-icon">
              <i className="bi bi-grid-1x2-fill" />
            </span>

            <span className="md-admin-brand-text">
              <span className="md-admin-brand-name">
                {STORE_NAME}
              </span>

              <span className="md-admin-brand-label">
                ADMIN CONSOLE
              </span>
            </span>
          </Link>

          {/* MOBILE TOGGLE */}

          <button
            className="navbar-toggler md-admin-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#adminNavbar"
            aria-controls="adminNavbar"
            aria-expanded="false"
            aria-label="Toggle administrator navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          {/* NAVIGATION */}

          <div
            className="collapse navbar-collapse"
            id="adminNavbar"
          >
            <ul className="navbar-nav me-auto mb-2 mb-xl-0 md-admin-nav-list">

              {/* DASHBOARD */}

              <li className="nav-item">
                <Link
                  className={normalLinkClass("/admin")}
                  to="/admin"
                >
                  <i className="bi bi-speedometer2" />
                  <span>Dashboard</span>
                </Link>
              </li>

              {/* INVENTORY */}

              <li className="nav-item dropdown">
                <button
                  className={dropdownClass([
                    "/admin/products",
                    "/admin/categories",
                    "/admin/inventory",
                    "/admin/stock-history",
                    "/admin/stock-transfers",
                    "/admin/branches",
                  ])}
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-box-seam" />
                  <span>Inventory</span>
                </button>

                <ul className="dropdown-menu md-admin-dropdown">

                  <li>
                    <Link
                      className={linkClass("/admin/products")}
                      to="/admin/products"
                    >
                      <i className="bi bi-box" />
                      Products
                    </Link>
                  </li>

                  <li>
                    <Link
                      className={linkClass("/admin/categories")}
                      to="/admin/categories"
                    >
                      <i className="bi bi-tags" />
                      Categories
                    </Link>
                  </li>

                  <li>
                    <Link
                      className={linkClass("/admin/inventory")}
                      to="/admin/inventory"
                    >
                      <i className="bi bi-clipboard-data" />
                      Stock Management
                    </Link>
                  </li>

                  <li>
                    <Link
                      className={linkClass("/admin/stock-history")}
                      to="/admin/stock-history"
                    >
                      <i className="bi bi-clock-history" />
                      Stock History
                    </Link>
                  </li>

                  <li>
                    <Link
                      className={linkClass("/admin/stock-transfers")}
                      to="/admin/stock-transfers"
                    >
                      <i className="bi bi-arrow-left-right" />
                      Stock Transfers
                    </Link>
                  </li>

                  <li><hr className="dropdown-divider" /></li>

                  <li>
                    <Link
                      className={linkClass("/admin/branches")}
                      to="/admin/branches"
                    >
                      <i className="bi bi-shop" />
                      Branches
                    </Link>
                  </li>

                </ul>
              </li>

              {/* TRANSACTIONS */}

              <li className="nav-item dropdown">
                <button
                  className={dropdownClass([
                    "/admin/orders",
                    "/admin/sales",
                    "/admin/pos-sales",
                    "/admin/deliveries",
                    "/admin/payments",
                  ])}
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-receipt" />
                  <span>Transactions</span>
                </button>

                <ul className="dropdown-menu md-admin-dropdown">

                  <li>
                    <Link
                      className={linkClass("/admin/orders")}
                      to="/admin/orders"
                    >
                      <i className="bi bi-cart3" />
                      Website Orders
                    </Link>
                  </li>

                  <li>
                    <Link
                      className={linkClass("/admin/sales")}
                      to="/admin/sales"
                    >
                      <i className="bi bi-globe" />
                      Website Sales
                    </Link>
                  </li>

                  <li>
                    <Link
                      className={linkClass("/admin/pos-sales")}
                      to="/admin/pos-sales"
                    >
                      <i className="bi bi-cash-register" />
                      POS Sales
                      <span className="badge rounded-pill bg-success ms-auto">
                        POS
                      </span>
                    </Link>
                  </li>

                  <li><hr className="dropdown-divider" /></li>

                  <li>
                    <Link
                      className={linkClass("/admin/deliveries")}
                      to="/admin/deliveries"
                    >
                      <i className="bi bi-truck" />
                      Deliveries
                    </Link>
                  </li>

                  <li>
                    <Link
                      className={linkClass("/admin/payments")}
                      to="/admin/payments"
                    >
                      <i className="bi bi-credit-card" />
                      Payments
                    </Link>
                  </li>

                </ul>
              </li>

              {/* BUSINESS */}

              <li className="nav-item dropdown">
                <button
                  className={dropdownClass([
                    "/admin/customers",
                    "/admin/reports",
                    "/admin/messages",
                    "/admin/cashiers",
                  ])}
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-grid" />
                  <span>Business</span>
                </button>

                <ul className="dropdown-menu md-admin-dropdown">

                  <li>
                    <Link
                      className={linkClass("/admin/reports")}
                      to="/admin/reports"
                    >
                      <i className="bi bi-graph-up-arrow" />
                      Reports & Analytics
                    </Link>
                  </li>

                  <li>
                    <Link
                      className={linkClass("/admin/customers")}
                      to="/admin/customers"
                    >
                      <i className="bi bi-people" />
                      Customers
                    </Link>
                  </li>

                  <li>
                    <Link
                      className={linkClass("/admin/cashiers")}
                      to="/admin/cashiers"
                    >
                      <i className="bi bi-person-workspace" />
                      Cashiers
                    </Link>
                  </li>

                  <li><hr className="dropdown-divider" /></li>

                  <li>
                    <Link
                      className={linkClass("/admin/messages")}
                      to="/admin/messages"
                    >
                      <i className="bi bi-chat-dots" />
                      Messages

                      {unreadMessageCount > 0 && (
                        <span className="badge rounded-pill bg-danger ms-auto">
                          {unreadMessageCount > 99
                            ? "99+"
                            : unreadMessageCount}
                        </span>
                      )}
                    </Link>
                  </li>

                </ul>
              </li>

            </ul>

            {/* ACCOUNT AREA */}

            <div className="md-admin-account-area">

              <div className="md-admin-theme">
                <ThemeSwitcher />
              </div>

              <div className="md-admin-profile">
                <div className="md-admin-avatar">
                  <i className="bi bi-person-fill" />
                </div>

                <div className="md-admin-profile-details">
                  <span className="md-admin-profile-name">
                    Administrator
                  </span>

                  <span className="md-admin-profile-role">
                    Business Owner
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="md-admin-logout"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right" />
                <span>Logout</span>
              </button>

            </div>
          </div>
        </div>
      </nav>

      {/* NAVBAR STYLES */}

      <style>{`
        .md-admin-navbar {
          min-height: 72px;
          padding: 9px 0;
          background: var(--surface);
          color: var(--text-primary);
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          z-index: 1030;
        }

        .md-admin-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-right: 28px;
          color: var(--text-primary);
          text-decoration: none;
        }

        .md-admin-brand:hover {
          color: var(--text-primary);
        }

        .md-admin-brand-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: var(--primary);
          color: #fff;
          font-size: 19px;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }

        .md-admin-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .md-admin-brand-name {
          font-size: 15px;
          font-weight: 750;
          letter-spacing: -0.3px;
        }

        .md-admin-brand-label {
          margin-top: 4px;
          color: var(--text-muted);
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.3px;
        }

        .md-admin-toggler {
          border-color: var(--border) !important;
          padding: 7px 10px;
          box-shadow: none !important;
        }

        .md-admin-nav-list {
          align-items: center;
          gap: 3px;
        }

        .md-admin-nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          padding: 9px 12px !important;
          border-radius: 9px;
          color: var(--text-secondary, var(--text-muted)) !important;
          background: transparent;
          border: 0;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.18s ease;
        }

        .md-admin-nav-link > i {
          font-size: 15px;
        }

        .md-admin-nav-link:hover,
        .md-admin-nav-link.active,
        .md-admin-nav-link.show {
          color: var(--primary) !important;
          background: var(--primary-light);
        }

        .md-admin-dropdown {
          min-width: 225px;
          margin-top: 10px !important;
          padding: 7px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 13px;
          box-shadow: var(--shadow-lg);
        }

        .md-admin-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 11px;
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 550;
        }

        .md-admin-dropdown-item > i {
          width: 17px;
          color: var(--text-muted);
          font-size: 15px;
        }

        .md-admin-dropdown-item:hover,
        .md-admin-dropdown-item.active {
          color: var(--primary);
          background: var(--primary-light);
        }

        .md-admin-dropdown-item.active > i {
          color: var(--primary);
        }

        .md-admin-dropdown .dropdown-divider {
          border-color: var(--border);
          opacity: 1;
        }

        .md-admin-account-area {
          display: flex;
          align-items: center;
          gap: 17px;
          padding-left: 17px;
          border-left: 1px solid var(--border);
        }

        .md-admin-theme {
          min-width: 0;
        }

        .md-admin-profile {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 4px 8px;
        }

        .md-admin-avatar {
          width: 37px;
          height: 37px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--primary-light);
          color: var(--primary);
          font-size: 17px;
        }

        .md-admin-profile-details {
          display: flex;
          flex-direction: column;
          line-height: 1.35;
        }

        .md-admin-profile-name {
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 700;
        }

        .md-admin-profile-role {
          margin-top: 3px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .md-admin-logout {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 37px;
          padding: 0 12px;
          border: 1px solid var(--border);
          border-radius: 9px;
          background: var(--surface);
          color: var(--text-secondary, var(--text-muted));
          font-size: 12px;
          font-weight: 650;
          transition: all 0.2s ease;
        }

        .md-admin-logout:hover {
          color: var(--danger);
          background: var(--danger-light, var(--surface-secondary));
          border-color: var(--danger);
        }

        @media (max-width: 1199px) {
          .md-admin-navbar {
            padding: 10px 0;
          }

          .md-admin-nav-list {
            align-items: stretch;
            padding-top: 12px;
          }

          .md-admin-nav-link {
            width: 100%;
            justify-content: flex-start;
          }

          .md-admin-account-area {
            align-items: stretch;
            flex-direction: column;
            gap: 13px;
            margin-top: 12px;
            padding: 15px 0 5px;
            border-left: 0;
            border-top: 1px solid var(--border);
          }

          .md-admin-theme {
            width: 100%;
          }

          .md-admin-profile {
            padding-left: 0;
          }

          .md-admin-logout {
            width: 100%;
          }

          .md-admin-dropdown {
            margin-top: 3px !important;
            box-shadow: none;
          }
        }

        @media (max-width: 480px) {
          .md-admin-brand {
            margin-right: 8px;
          }

          .md-admin-brand-name {
            font-size: 13px;
          }

          .md-admin-brand-icon {
            width: 38px;
            height: 38px;
          }
        }
      `}</style>
    </>
  );
}

export default AdminNavbar;
