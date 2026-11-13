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
  // LOAD ADMIN UNREAD MESSAGE COUNT
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadUnreadMessageCount = async () => {
      const adminToken = localStorage.getItem("adminToken");

      if (!adminToken) {
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
            "Could not load admin unread message count:",
            error.response?.data || error.message
          );
        }
      }
    };

    loadUnreadMessageCount();

    const interval = setInterval(loadUnreadMessageCount, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // =========================================================
  // CLOSE MOBILE NAVIGATION AFTER NAVIGATION
  // =========================================================

  useEffect(() => {
    const navbar = document.getElementById("adminNavbar");

    if (navbar?.classList.contains("show")) {
      if (window.bootstrap?.Collapse) {
        window.bootstrap.Collapse
          .getOrCreateInstance(navbar, { toggle: false })
          .hide();
      } else {
        navbar.classList.remove("show");
      }
    }
  }, [location.pathname]);

  // =========================================================
  // ADMIN LOGOUT
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
    `dropdown-item d-flex align-items-center gap-2 ${
      isActive(path) ? "active" : ""
    }`;

  const dropdownClass = (paths) =>
    `nav-link dropdown-toggle ${
      paths.some((path) => isActive(path)) ? "active" : ""
    }`;

  // =========================================================
  // ADMIN NAVBAR
  // =========================================================

  return (
    <nav
      className="navbar navbar-expand-xl sticky-top shadow-sm"
      style={{
        backgroundColor: "var(--md-surface)",
        color: "var(--md-text)",
        borderBottom: "1px solid var(--md-border)",
      }}
    >
      <div className="container-fluid px-3 px-lg-4">

        {/* BRAND */}

        <Link
          className="navbar-brand fw-bold d-flex align-items-center gap-2 me-4"
          to="/admin"
          style={{ color: "var(--md-text)" }}
        >
          <i className="bi bi-shield-lock-fill text-warning fs-5" />

          <span>
            {STORE_NAME}
            <span className="text-warning ms-2">Admin</span>
          </span>
        </Link>

        {/* MOBILE TOGGLE */}

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#adminNavbar"
          aria-controls="adminNavbar"
          aria-expanded="false"
          aria-label="Toggle administrator navigation"
          style={{ borderColor: "var(--md-border)" }}
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* NAVIGATION */}

        <div
          className="collapse navbar-collapse"
          id="adminNavbar"
        >
          <ul className="navbar-nav me-auto mb-2 mb-xl-0 gap-xl-1">

            {/* DASHBOARD */}

            <li className="nav-item">
              <Link
                className={`nav-link ${
                  isActive("/admin") ? "active" : ""
                }`}
                to="/admin"
              >
                <i className="bi bi-speedometer2 me-1" />
                Dashboard
              </Link>
            </li>

            {/* INVENTORY DROPDOWN */}

            <li className="nav-item dropdown">
              <button
                className={dropdownClass([
                  "/admin/products",
                  "/admin/inventory",
                  "/admin/stock-history",
                  "/admin/branches",
                ])}
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-box-seam me-1" />
                Inventory
              </button>

              <ul className="dropdown-menu shadow border-0">

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
                  <hr className="dropdown-divider" />
                </li>

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

            {/* TRANSACTIONS DROPDOWN */}

            <li className="nav-item dropdown">
              <button
                className={dropdownClass([
                  "/admin/orders",
                  "/admin/sales",
                  "/admin/pos-sales",
                  "/admin/deliveries",
                ])}
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-receipt me-1" />
                Transactions
              </button>

              <ul className="dropdown-menu shadow border-0">

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
                    <span className="badge bg-success ms-auto">
                      POS
                    </span>
                  </Link>
                </li>

                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li>
                  <Link
                    className={linkClass("/admin/deliveries")}
                    to="/admin/deliveries"
                  >
                    <i className="bi bi-truck" />
                    Deliveries
                  </Link>
                </li>

              </ul>
            </li>

            {/* BUSINESS DROPDOWN */}

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
                <i className="bi bi-grid me-1" />
                Business
              </button>

              <ul className="dropdown-menu shadow border-0">

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

                <li>
                  <hr className="dropdown-divider" />
                </li>

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

          {/* ADMIN ACCOUNT AND APPEARANCE */}

          <div className="d-flex flex-column flex-xl-row align-items-stretch align-items-xl-center gap-3 py-3 py-xl-0">

            {/* THEME SWITCHER */}

            <ThemeSwitcher />

            {/* ADMIN DETAILS */}

            <div
              className="small d-flex align-items-center gap-2"
              style={{ color: "var(--md-text)" }}
            >
              <i className="bi bi-person-circle fs-5 text-warning" />

              <div>
                <div className="fw-semibold">
                  Administrator
                </div>

                <div
                  className="small"
                  style={{ color: "var(--md-muted)" }}
                >
                  Management Console
                </div>
              </div>
            </div>

            {/* LOGOUT */}

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-3"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2" />
              Logout
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
}

export default AdminNavbar;
