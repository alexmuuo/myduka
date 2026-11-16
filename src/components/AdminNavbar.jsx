import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { STORE_NAME } from "../config/store";
import api from "../api/api";
import ThemeSwitcher from "./ThemeSwitcher";

const NAV_GROUPS = [
  {
    label: "Inventory",
    icon: "bi-box-seam",
    paths: [
      "/admin/products",
      "/admin/categories",
      "/admin/inventory",
      "/admin/stock-history",
      "/admin/stock-transfers",
      "/admin/branches",
    ],
    items: [
      { label: "Products", path: "/admin/products", icon: "bi-box" },
      { label: "Categories", path: "/admin/categories", icon: "bi-tags" },
      {
        label: "Stock Management",
        path: "/admin/inventory",
        icon: "bi-clipboard-data",
      },
      {
        label: "Stock History",
        path: "/admin/stock-history",
        icon: "bi-clock-history",
      },
      {
        label: "Stock Transfers",
        path: "/admin/stock-transfers",
        icon: "bi-arrow-left-right",
      },
      { divider: true },
      { label: "Branches", path: "/admin/branches", icon: "bi-shop" },
    ],
  },
  {
    label: "Transactions",
    icon: "bi-receipt",
    paths: [
      "/admin/orders",
      "/admin/sales",
      "/admin/pos-sales",
      "/admin/deliveries",
      "/admin/payments",
    ],
    items: [
      {
        label: "Website Orders",
        path: "/admin/orders",
        icon: "bi-cart3",
      },
      {
        label: "Website Sales",
        path: "/admin/sales",
        icon: "bi-globe",
      },
      {
        label: "POS Sales",
        path: "/admin/pos-sales",
        icon: "bi-cash-register",
        badge: "POS",
      },
      { divider: true },
      {
        label: "Deliveries",
        path: "/admin/deliveries",
        icon: "bi-truck",
      },
      {
        label: "Payments",
        path: "/admin/payments",
        icon: "bi-credit-card",
      },
    ],
  },
  {
    label: "Business",
    icon: "bi-grid",
    paths: [
      "/admin/reports",
      "/admin/customers",
      "/admin/cashiers",
      "/admin/messages",
      "/admin/subscription",
    ],
    items: [
      {
        label: "Reports & Analytics",
        path: "/admin/reports",
        icon: "bi-graph-up-arrow",
      },
      {
        label: "Customers",
        path: "/admin/customers",
        icon: "bi-people",
      },
      {
        label: "Cashiers",
        path: "/admin/cashiers",
        icon: "bi-person-workspace",
      },
      {
        label: "Messages",
        path: "/admin/messages",
        icon: "bi-chat-dots",
        unread: true,
      },
      { divider: true },
      {
        label: "Subscription & Billing",
        path: "/admin/subscription",
        icon: "bi-credit-card-2-front",
      },
    ],
  },
];

function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("admin") || "null");
    } catch {
      return null;
    }
  });

  // ---------------------------------------------------------
  // ADMIN DETAILS
  // ---------------------------------------------------------

  useEffect(() => {
    const loadAdmin = () => {
      try {
        setAdmin(JSON.parse(localStorage.getItem("admin") || "null"));
      } catch {
        setAdmin(null);
      }
    };

    loadAdmin();
    window.addEventListener("storage", loadAdmin);

    return () => window.removeEventListener("storage", loadAdmin);
  }, []);

  const adminName =
    admin?.full_name ||
    admin?.name ||
    admin?.username ||
    admin?.first_name ||
    "Administrator";

  const businessName =
    admin?.business?.name ||
    admin?.business_name ||
    admin?.store_name ||
    STORE_NAME ||
    "MyDuka";

  const adminRole =
    admin?.role === "owner" || admin?.role === "business_owner"
      ? "Business Owner"
      : admin?.role
        ? admin.role.replace(/_/g, " ")
        : "Business Owner";

  // ---------------------------------------------------------
  // ACTIVE ROUTES
  // ---------------------------------------------------------

  const isActive = (path) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const isGroupActive = (group) =>
    group.paths.some((path) => isActive(path));

  // ---------------------------------------------------------
  // UNREAD MESSAGES
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // CLOSE MOBILE NAVIGATION AFTER ROUTE CHANGE
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    setAdmin(null);
    setUnreadMessageCount(0);

    navigate("/admin-login", { replace: true });
  };

  // ---------------------------------------------------------
  // NAVIGATION CLASSES
  // ---------------------------------------------------------

  const normalLinkClass = (path) =>
    `nav-link md-admin-nav-link ${
      isActive(path) ? "active" : ""
    }`;

  const dropdownClass = (group) =>
    `nav-link md-admin-nav-link md-admin-dropdown-toggle ${
      isGroupActive(group) ? "active" : ""
    }`;

  const linkClass = (path) =>
    `dropdown-item md-admin-dropdown-item ${
      isActive(path) ? "active" : ""
    }`;

  // ---------------------------------------------------------
  // NAVBAR
  // ---------------------------------------------------------

  return (
    <>
      <nav className="navbar navbar-expand-xl sticky-top md-admin-navbar">
        <div className="container-fluid px-3 px-lg-4">

          {/* BRAND */}

          <Link to="/admin" className="navbar-brand md-admin-brand">
            <span className="md-admin-brand-icon">
              <i className="bi bi-grid-1x2-fill" />
            </span>

            <span className="md-admin-brand-text">
              <span className="md-admin-brand-name">
                {businessName}
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

          <div className="collapse navbar-collapse" id="adminNavbar">

            <ul className="navbar-nav me-auto mb-2 mb-xl-0 md-admin-nav-list">

              {/* DASHBOARD */}

              <li className="nav-item">
                <Link
                  to="/admin"
                  className={normalLinkClass("/admin")}
                >
                  <i className="bi bi-speedometer2" />
                  <span>Dashboard</span>
                </Link>
              </li>

              {/* DROPDOWN GROUPS */}

              {NAV_GROUPS.map((group) => (
                <li
                  className="nav-item dropdown md-admin-nav-dropdown"
                  key={group.label}
                >
                  <button
                    type="button"
                    className={dropdownClass(group)}
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className={`bi ${group.icon}`} />

                    <span>{group.label}</span>

                    <i className="bi bi-chevron-down md-admin-chevron" />
                  </button>

                  <ul className="dropdown-menu md-admin-dropdown">

                    {group.items.map((item, index) => {
                      if (item.divider) {
                        return (
                          <li key={`${group.label}-divider-${index}`}>
                            <hr className="dropdown-divider" />
                          </li>
                        );
                      }

                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            className={linkClass(item.path)}
                          >
                            <i className={`bi ${item.icon}`} />

                            <span>{item.label}</span>

                            {item.badge && (
                              <span className="md-admin-pos-badge">
                                {item.badge}
                              </span>
                            )}

                            {item.unread && unreadMessageCount > 0 && (
                              <span className="md-admin-unread-badge">
                                {unreadMessageCount > 99
                                  ? "99+"
                                  : unreadMessageCount}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}

                  </ul>
                </li>
              ))}

            </ul>

            {/* ACCOUNT AREA */}

            <div className="md-admin-account-area">

              <div className="md-admin-theme">
                <ThemeSwitcher />
              </div>

              <div className="md-admin-account-divider" />

              <Link
                to="/admin/profile"
                className={`md-admin-profile ${
                  isActive("/admin/profile") ? "active" : ""
                }`}
              >
                <div className="md-admin-avatar">
                  <i className="bi bi-person-fill" />
                </div>

                <div className="md-admin-profile-details">
                  <span className="md-admin-profile-name">
                    {adminName}
                  </span>

                  <span className="md-admin-profile-role">
                    {adminRole}
                  </span>
                </div>
              </Link>

              <Link
                to="/admin/settings"
                className={`md-admin-icon-button ${
                  isActive("/admin/settings") ? "active" : ""
                }`}
                title="Settings"
                aria-label="Settings"
              >
                <i className="bi bi-gear" />
              </Link>

              <button
                type="button"
                className="md-admin-logout"
                onClick={handleLogout}
                title="Logout"
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

        /* =========================================
           MAIN NAVBAR
        ========================================= */

        .md-admin-navbar {
          min-height: 68px;
          padding: 8px 0;

          background: var(--surface);
          color: var(--text-primary);

          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-sm);

          z-index: 1030;
        }

        /* =========================================
           BRAND
        ========================================= */

        .md-admin-brand {
          display: flex;
          align-items: center;
          gap: 10px;

          margin-right: 30px;

          color: var(--text-primary);
          text-decoration: none;
        }

        .md-admin-brand:hover {
          color: var(--text-primary);
        }

        .md-admin-brand-icon {
          width: 39px;
          height: 39px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          background: var(--primary);
          color: #fff;

          font-size: 17px;
        }

        .md-admin-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .md-admin-brand-name {
          color: var(--text-primary);

          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.3px;
        }

        .md-admin-brand-label {
          margin-top: 4px;

          color: var(--text-muted);

          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.2px;
        }

        /* =========================================
           MOBILE TOGGLER
        ========================================= */

        .md-admin-toggler {
          padding: 6px 9px;

          border: 1px solid var(--border) !important;
          border-radius: 9px;

          box-shadow: none !important;
        }

        /* =========================================
           NAVIGATION
        ========================================= */

        .md-admin-nav-list {
          align-items: center;
          gap: 4px;
        }

        .md-admin-nav-link {
          min-height: 39px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          padding: 9px 11px !important;

          border: 0;
          border-radius: 9px;

          background: transparent;

          color: var(--text-secondary, var(--text-muted)) !important;

          font-size: 12.5px;
          font-weight: 650;

          white-space: nowrap;

          transition:
            background 0.18s ease,
            color 0.18s ease;
        }

        .md-admin-nav-link > i:first-child {
          font-size: 15px;
        }

        .md-admin-nav-link:hover,
        .md-admin-nav-link.active,
        .md-admin-nav-link.show {
          background: var(--primary-light);
          color: var(--primary) !important;
        }

        .md-admin-chevron {
          margin-left: 2px;
          font-size: 9px;
          transition: transform 0.2s ease;
        }

        .md-admin-nav-dropdown:hover .md-admin-chevron,
        .md-admin-nav-dropdown:focus-within .md-admin-chevron,
        .md-admin-nav-dropdown .show + .md-admin-chevron {
          transform: rotate(180deg);
        }

        /* =========================================
           DROPDOWN MENUS
        ========================================= */

        .md-admin-dropdown {
          min-width: 235px;

          margin-top: 10px !important;
          padding: 7px;

          background: var(--surface);

          border: 1px solid var(--border);
          border-radius: 12px;

          box-shadow: var(--shadow-lg);

          opacity: 0;
          transform: translateY(5px);

          transition:
            opacity 0.16s ease,
            transform 0.16s ease;
        }

        /* Desktop: open automatically on hover */

        @media (min-width: 1200px) and (hover: hover) and (pointer: fine) {

          .md-admin-nav-dropdown:hover > .md-admin-dropdown,
          .md-admin-nav-dropdown:focus-within > .md-admin-dropdown {
            display: block;
            opacity: 1;
            transform: translateY(0);
          }

          .md-admin-nav-dropdown:hover > .md-admin-dropdown,
          .md-admin-nav-dropdown:focus-within > .md-admin-dropdown {
            animation: mdDropdownEnter 0.17s ease both;
          }

          .md-admin-nav-dropdown > .md-admin-dropdown.show {
            display: block;
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes mdDropdownEnter {
          from {
            opacity: 0;
            transform: translateY(7px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .md-admin-dropdown-item {
          min-height: 39px;

          display: flex;
          align-items: center;
          gap: 10px;

          padding: 9px 11px;

          border-radius: 8px;

          color: var(--text-primary);

          font-size: 12.5px;
          font-weight: 550;

          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .md-admin-dropdown-item > i {
          width: 17px;

          color: var(--text-muted);

          font-size: 15px;
        }

        .md-admin-dropdown-item:hover,
        .md-admin-dropdown-item.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .md-admin-dropdown-item.active > i,
        .md-admin-dropdown-item:hover > i {
          color: var(--primary);
        }

        .md-admin-dropdown .dropdown-divider {
          margin: 5px 3px;
          border-color: var(--border);
          opacity: 1;
        }

        .md-admin-pos-badge {
          margin-left: auto;

          padding: 3px 7px;

          border-radius: 5px;

          background: rgba(34, 197, 94, 0.12);
          color: #16a34a;

          font-size: 9px;
          font-weight: 800;
        }

        .md-admin-unread-badge {
          margin-left: auto;

          min-width: 20px;
          height: 20px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          padding: 0 5px;

          border-radius: 20px;

          background: var(--danger);
          color: #fff;

          font-size: 10px;
          font-weight: 800;
        }

        /* =========================================
           ACCOUNT AREA
        ========================================= */

        .md-admin-account-area {
          display: flex;
          align-items: center;
          gap: 10px;

          padding-left: 15px;
        }

        .md-admin-theme {
          display: flex;
          align-items: center;
        }

        .md-admin-account-divider {
          width: 1px;
          height: 30px;

          background: var(--border);
        }

        .md-admin-profile {
          display: flex;
          align-items: center;
          gap: 9px;

          padding: 4px 7px;

          border-radius: 9px;

          color: inherit;
          text-decoration: none;

          transition: background 0.18s ease;
        }

        .md-admin-profile:hover,
        .md-admin-profile.active {
          background: var(--primary-light);
        }

        .md-admin-avatar {
          width: 34px;
          height: 34px;
          min-width: 34px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: var(--primary-light);
          color: var(--primary);

          font-size: 16px;
        }

        .md-admin-profile-details {
          display: flex;
          flex-direction: column;
          line-height: 1.3;
        }

        .md-admin-profile-name {
          color: var(--text-primary);

          font-size: 11.5px;
          font-weight: 750;
        }

        .md-admin-profile-role {
          margin-top: 3px;

          color: var(--text-muted);

          font-size: 10px;
          text-transform: capitalize;
        }

        /* =========================================
           SETTINGS
        ========================================= */

        .md-admin-icon-button {
          width: 36px;
          height: 36px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          border: 1px solid var(--border);
          border-radius: 9px;

          background: var(--surface);

          color: var(--text-secondary, var(--text-muted));

          text-decoration: none;
          font-size: 15px;

          transition: all 0.18s ease;
        }

        .md-admin-icon-button:hover,
        .md-admin-icon-button.active {
          border-color: var(--primary);
          background: var(--primary-light);
          color: var(--primary);
        }

        /* =========================================
           LOGOUT
        ========================================= */

        .md-admin-logout {
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

          font-size: 11.5px;
          font-weight: 650;

          transition: all 0.18s ease;
        }

        .md-admin-logout:hover {
          border-color: var(--danger);
          background: var(--danger-light, var(--surface-secondary));
          color: var(--danger);
        }

        /* =========================================
           RESPONSIVE NAVIGATION
        ========================================= */

        @media (max-width: 1199px) {

          .md-admin-navbar {
            padding: 10px 0;
          }

          .md-admin-nav-list {
            align-items: stretch;
            gap: 3px;
            padding-top: 12px;
          }

          .md-admin-nav-link {
            width: 100%;
            justify-content: flex-start;
          }

          .md-admin-dropdown {
            margin-top: 3px !important;

            border: 1px solid var(--border);
            box-shadow: none;
          }

          .md-admin-account-area {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;

            margin-top: 12px;
            padding: 15px 0 5px;

            border-top: 1px solid var(--border);
          }

          .md-admin-account-divider {
            display: none;
          }
        }

        @media (max-width: 575px) {

          .md-admin-brand {
            margin-right: 8px;
          }

          .md-admin-brand-name {
            font-size: 13px;
          }

          .md-admin-brand-icon {
            width: 36px;
            height: 36px;
          }

          .md-admin-account-area {
            align-items: stretch;
            flex-direction: column;
          }

          .md-admin-theme {
            padding: 5px 0;
          }

          .md-admin-profile {
            padding: 7px;
          }

          .md-admin-icon-button,
          .md-admin-logout {
            width: 100%;
          }
        }

        /* =========================================
           ACCESSIBILITY
        ========================================= */

        .md-admin-navbar a:focus-visible,
        .md-admin-navbar button:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 3px;
        }

        @media (prefers-reduced-motion: reduce) {
          .md-admin-navbar *,
          .md-admin-dropdown {
            animation: none !important;
            transition: none !important;
          }
        }

      `}</style>
    </>
  );
}

export default AdminNavbar;
