import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { STORE_NAME } from "../config/store";
import api from "../api/api";
import ThemeSwitcher from "./ThemeSwitcher";

const NAV_GROUPS = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        path: "/admin",
        icon: "bi-speedometer2",
      },
    ],
  },
  {
    title: "Inventory",
    icon: "bi-box-seam",
    items: [
      {
        label: "Products",
        path: "/admin/products",
        icon: "bi-box",
      },
      {
        label: "Categories",
        path: "/admin/categories",
        icon: "bi-tags",
      },
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
      {
        label: "Branches",
        path: "/admin/branches",
        icon: "bi-shop",
      },
    ],
  },
  {
    title: "Transactions",
    icon: "bi-receipt",
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
    title: "Business",
    icon: "bi-grid",
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

  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("admin") || "null");
    } catch {
      return null;
    }
  });

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});

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

    return () => {
      window.removeEventListener("storage", loadAdmin);
    };
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
  // ACTIVE ROUTE
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
    group.items.some((item) => isActive(item.path));

  // Automatically open the group containing the current page.
  useEffect(() => {
    const activeGroup = NAV_GROUPS.find(
      (group) => group.items.length > 1 && isGroupActive(group)
    );

    if (activeGroup) {
      setOpenGroups((previous) => ({
        ...previous,
        [activeGroup.title]: true,
      }));
    }
  }, [location.pathname]);

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
  // DESKTOP SIDEBAR SPACE
  // ---------------------------------------------------------

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px)");

    const updateBodySpacing = () => {
      document.body.classList.toggle(
        "md-admin-sidebar-active",
        desktopQuery.matches
      );
    };

    updateBodySpacing();

    desktopQuery.addEventListener("change", updateBodySpacing);

    return () => {
      desktopQuery.removeEventListener("change", updateBodySpacing);
      document.body.classList.remove("md-admin-sidebar-active");
    };
  }, []);

  // ---------------------------------------------------------
  // ROUTE CHANGE
  // ---------------------------------------------------------

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // ---------------------------------------------------------
  // MOBILE ESCAPE KEY
  // ---------------------------------------------------------

  useEffect(() => {
    if (!mobileOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  // ---------------------------------------------------------
  // GROUP TOGGLE
  // ---------------------------------------------------------

  const toggleGroup = (title) => {
    setOpenGroups((previous) => ({
      ...previous,
      [title]: !previous[title],
    }));
  };

  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    setAdmin(null);
    setUnreadMessageCount(0);
    setMobileOpen(false);

    navigate("/admin-login", { replace: true });
  };

  // ---------------------------------------------------------
  // NAVIGATION ITEM
  // ---------------------------------------------------------

  const renderNavigationItem = (item) => {
    const active = isActive(item.path);

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`md-sidebar-link ${active ? "active" : ""}`}
        title={!expanded && !mobileOpen ? item.label : undefined}
        aria-current={active ? "page" : undefined}
      >
        <span className="md-sidebar-icon">
          <i className={`bi ${item.icon}`} />
        </span>

        <span className="md-sidebar-link-label">
          {item.label}
        </span>

        {item.badge && (
          <span className="md-sidebar-pos-badge">
            {item.badge}
          </span>
        )}

        {item.unread && unreadMessageCount > 0 && (
          <span className="md-sidebar-unread">
            {unreadMessageCount > 99
              ? "99+"
              : unreadMessageCount}
          </span>
        )}

        {active && <span className="md-sidebar-active-dot" />}
      </Link>
    );
  };

  // ---------------------------------------------------------
  // SIDEBAR
  // ---------------------------------------------------------

  return (
    <>
      {/* MOBILE TOP BAR */}

      <div className="md-mobile-topbar">
        <button
          type="button"
          className="md-mobile-menu-button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
        >
          <i className="bi bi-list" />
        </button>

        <Link to="/admin" className="md-mobile-brand">
          <span className="md-mobile-brand-icon">
            <i className="bi bi-grid-1x2-fill" />
          </span>

          <span>{businessName}</span>
        </Link>

        <span className="md-mobile-topbar-label">
          ADMIN
        </span>
      </div>

      {/* MOBILE BACKDROP */}

      <div
        className={`md-sidebar-backdrop ${
          mobileOpen ? "visible" : ""
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* SIDEBAR */}

      <aside
        className={`md-admin-sidebar ${
          expanded ? "expanded" : ""
        } ${mobileOpen ? "mobile-open" : ""}`}
        onMouseEnter={() => {
          if (window.matchMedia("(min-width: 768px)").matches) {
            setExpanded(true);
          }
        }}
        onMouseLeave={() => {
          if (window.matchMedia("(min-width: 768px)").matches) {
            setExpanded(false);
          }
        }}
      >
        {/* BRAND */}

        <div className="md-sidebar-header">
          <Link
            to="/admin"
            className="md-sidebar-brand"
            title={businessName}
          >
            <span className="md-sidebar-brand-icon">
              <i className="bi bi-grid-1x2-fill" />
            </span>

            <span className="md-sidebar-brand-details">
              <span className="md-sidebar-brand-name">
                {businessName}
              </span>

              <span className="md-sidebar-brand-caption">
                ADMIN CONSOLE
              </span>
            </span>
          </Link>

          <button
            type="button"
            className="md-sidebar-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* NAVIGATION */}

        <div className="md-sidebar-scroll">
          <div className="md-sidebar-section-caption">
            WORKSPACE
          </div>

          <nav className="md-sidebar-navigation">
            {NAV_GROUPS.map((group) => {
              const hasMultipleItems = group.items.length > 1;
              const groupOpen = !!openGroups[group.title];
              const groupActive = isGroupActive(group);

              if (!hasMultipleItems) {
                return (
                  <div
                    className="md-sidebar-group"
                    key={group.title}
                  >
                    {renderNavigationItem(group.items[0])}
                  </div>
                );
              }

              return (
                <div
                  className={`md-sidebar-group ${
                    groupActive ? "group-active" : ""
                  }`}
                  key={group.title}
                >
                  <button
                    type="button"
                    className={`md-sidebar-group-button ${
                      groupActive ? "active" : ""
                    }`}
                    onClick={() => {
                      if (!expanded && !mobileOpen) {
                        setExpanded(true);
                        setOpenGroups((previous) => ({
                          ...previous,
                          [group.title]: true,
                        }));
                      } else {
                        toggleGroup(group.title);
                      }
                    }}
                    title={!expanded && !mobileOpen ? group.title : undefined}
                    aria-expanded={groupOpen}
                  >
                    <span className="md-sidebar-icon">
                      <i className={`bi ${group.icon}`} />
                    </span>

                    <span className="md-sidebar-link-label">
                      {group.title}
                    </span>

                    <i
                      className={`bi bi-chevron-down md-sidebar-chevron ${
                        groupOpen ? "rotated" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`md-sidebar-submenu ${
                      groupOpen ? "open" : ""
                    }`}
                  >
                    {group.items.map((item) =>
                      renderNavigationItem(item)
                    )}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* ACCOUNT SECTION */}

          <div className="md-sidebar-section-caption md-sidebar-account-caption">
            ACCOUNT
          </div>

          <nav className="md-sidebar-navigation">
            <Link
              to="/admin/profile"
              className={`md-sidebar-link ${
                isActive("/admin/profile") ? "active" : ""
              }`}
              title={!expanded && !mobileOpen ? "My Profile" : undefined}
            >
              <span className="md-sidebar-icon">
                <i className="bi bi-person-circle" />
              </span>

              <span className="md-sidebar-link-label">
                My Profile
              </span>
            </Link>

            <Link
              to="/admin/settings"
              className={`md-sidebar-link ${
                isActive("/admin/settings") ? "active" : ""
              }`}
              title={!expanded && !mobileOpen ? "Settings" : undefined}
            >
              <span className="md-sidebar-icon">
                <i className="bi bi-gear" />
              </span>

              <span className="md-sidebar-link-label">
                Settings
              </span>
            </Link>
          </nav>
        </div>

        {/* SIDEBAR FOOTER */}

        <div className="md-sidebar-footer">
          <div className="md-sidebar-theme">
            <span className="md-sidebar-theme-icon">
              <i className="bi bi-circle-half" />
            </span>

            <div className="md-sidebar-theme-control">
              <ThemeSwitcher />
            </div>
          </div>

          <Link
            to="/admin/profile"
            className={`md-sidebar-user ${
              isActive("/admin/profile") ? "active" : ""
            }`}
            title={!expanded && !mobileOpen ? adminName : undefined}
          >
            <span className="md-sidebar-user-avatar">
              <i className="bi bi-person-fill" />
            </span>

            <span className="md-sidebar-user-details">
              <span className="md-sidebar-user-name">
                {adminName}
              </span>

              <span className="md-sidebar-user-role">
                {adminRole}
              </span>
            </span>

            <i className="bi bi-three-dots-vertical md-sidebar-user-more" />
          </Link>

          <button
            type="button"
            className="md-sidebar-logout"
            onClick={handleLogout}
            title={!expanded && !mobileOpen ? "Logout" : undefined}
          >
            <span className="md-sidebar-icon">
              <i className="bi bi-box-arrow-right" />
            </span>

            <span className="md-sidebar-link-label">
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* STYLES */}

      <style>{`
        /* --------------------------------------------------
           LAYOUT
        -------------------------------------------------- */

        body.md-admin-sidebar-active {
          padding-left: 76px;
          transition: padding-left 0.25s ease;
        }

        .md-admin-sidebar,
        .md-admin-sidebar * {
          box-sizing: border-box;
        }

        .md-admin-sidebar {
          position: fixed;
          top: 14px;
          left: 14px;
          bottom: 14px;
          width: 62px;
          z-index: 1040;

          display: flex;
          flex-direction: column;

          overflow: hidden;

          background: var(--surface);
          color: var(--text-primary);

          border: 1px solid var(--border);
          border-radius: 17px;

          box-shadow: var(--shadow-lg);

          transition:
            width 0.25s ease,
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .md-admin-sidebar.expanded {
          width: 260px;
        }

        /* --------------------------------------------------
           HEADER / BRAND
        -------------------------------------------------- */

        .md-sidebar-header {
          height: 76px;
          min-height: 76px;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 0 10px;

          border-bottom: 1px solid var(--border);
        }

        .md-admin-sidebar.expanded .md-sidebar-header {
          justify-content: flex-start;
          padding: 0 15px;
        }

        .md-sidebar-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;

          min-width: 0;

          color: var(--text-primary);
          text-decoration: none;
        }

        .md-sidebar-brand:hover {
          color: var(--text-primary);
        }

        .md-sidebar-brand-icon {
          width: 40px;
          height: 40px;
          min-width: 40px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 12px;

          background: var(--primary);
          color: #fff;

          font-size: 18px;

          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }

        .md-sidebar-brand-details {
          display: none;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
        }

        .md-admin-sidebar.expanded .md-sidebar-brand-details {
          display: flex;
        }

        .md-sidebar-brand-name {
          overflow: hidden;
          text-overflow: ellipsis;

          color: var(--text-primary);

          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.3px;
        }

        .md-sidebar-brand-caption {
          margin-top: 4px;

          color: var(--text-muted);

          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.3px;
        }

        .md-sidebar-mobile-close {
          display: none;

          width: 34px;
          height: 34px;

          align-items: center;
          justify-content: center;

          border: 0;
          border-radius: 9px;

          background: var(--surface-secondary);
          color: var(--text-secondary);

          font-size: 15px;
        }

        /* --------------------------------------------------
           SCROLL AREA
        -------------------------------------------------- */

        .md-sidebar-scroll {
          flex: 1;
          min-height: 0;

          overflow-x: hidden;
          overflow-y: auto;

          padding: 16px 8px;

          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }

        .md-sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .md-sidebar-scroll::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 10px;
        }

        .md-sidebar-section-caption {
          display: none;

          padding: 7px 11px 10px;

          color: var(--text-muted);

          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
          white-space: nowrap;
        }

        .md-admin-sidebar.expanded .md-sidebar-section-caption {
          display: block;
        }

        .md-sidebar-account-caption {
          margin-top: 20px;
        }

        /* --------------------------------------------------
           NAVIGATION
        -------------------------------------------------- */

        .md-sidebar-navigation {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .md-sidebar-group {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-bottom: 3px;
        }

        .md-sidebar-link,
        .md-sidebar-group-button,
        .md-sidebar-logout {
          position: relative;

          width: 100%;
          min-height: 43px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;

          padding: 0 9px;

          border: 0;
          border-radius: 10px;

          background: transparent;
          color: var(--text-secondary, var(--text-muted));

          text-decoration: none;
          text-align: left;

          font-size: 12px;
          font-weight: 650;

          cursor: pointer;

          transition:
            background 0.18s ease,
            color 0.18s ease,
            transform 0.18s ease;
        }

        .md-admin-sidebar.expanded .md-sidebar-link,
        .md-admin-sidebar.expanded .md-sidebar-group-button,
        .md-admin-sidebar.expanded .md-sidebar-logout {
          justify-content: flex-start;
          padding: 0 11px;
        }

        .md-sidebar-link:hover,
        .md-sidebar-group-button:hover,
        .md-sidebar-logout:hover {
          background: var(--surface-secondary);
          color: var(--primary);
        }

        .md-sidebar-link.active,
        .md-sidebar-group-button.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .md-sidebar-icon {
          width: 25px;
          min-width: 25px;
          height: 25px;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 17px;
        }

        .md-sidebar-link-label {
          display: none;

          flex: 1;
          min-width: 0;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .md-admin-sidebar.expanded .md-sidebar-link-label {
          display: block;
        }

        .md-sidebar-active-dot {
          display: none;

          width: 6px;
          height: 6px;
          min-width: 6px;

          border-radius: 50%;
          background: var(--primary);
        }

        .md-admin-sidebar.expanded .md-sidebar-active-dot {
          display: block;
        }

        .md-sidebar-chevron {
          display: none;
          font-size: 10px;
          transition: transform 0.2s ease;
        }

        .md-admin-sidebar.expanded .md-sidebar-chevron {
          display: block;
        }

        .md-sidebar-chevron.rotated {
          transform: rotate(180deg);
        }

        /* --------------------------------------------------
           SUBMENUS
        -------------------------------------------------- */

        .md-sidebar-submenu {
          display: none;
          flex-direction: column;
          gap: 3px;

          padding: 3px 0 5px 11px;
          margin-left: 12px;

          border-left: 1px solid var(--border);
        }

        .md-admin-sidebar.expanded .md-sidebar-submenu.open {
          display: flex;
        }

        .md-sidebar-submenu .md-sidebar-link {
          min-height: 38px;
          padding-left: 10px;
          font-size: 11.5px;
        }

        .md-sidebar-submenu .md-sidebar-icon {
          font-size: 14px;
        }

        .md-sidebar-pos-badge {
          padding: 3px 6px;

          border-radius: 5px;

          background: rgba(34, 197, 94, 0.12);
          color: #16a34a;

          font-size: 9px;
          font-weight: 800;
        }

        .md-sidebar-unread {
          min-width: 19px;
          height: 19px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          padding: 0 5px;

          border-radius: 20px;

          background: var(--danger);
          color: #fff;

          font-size: 9px;
          font-weight: 800;
        }

        /* --------------------------------------------------
           FOOTER
        -------------------------------------------------- */

        .md-sidebar-footer {
          display: flex;
          flex-direction: column;
          gap: 7px;

          padding: 10px 8px 12px;

          border-top: 1px solid var(--border);
        }

        .md-sidebar-theme {
          min-height: 43px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;

          padding: 0 9px;

          border-radius: 10px;
        }

        .md-admin-sidebar.expanded .md-sidebar-theme {
          justify-content: flex-start;
          padding: 0 11px;
        }

        .md-sidebar-theme-icon {
          width: 25px;
          min-width: 25px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--text-secondary);
          font-size: 17px;
        }

        .md-sidebar-theme-control {
          display: none;
          flex: 1;
          min-width: 0;
        }

        .md-admin-sidebar.expanded .md-sidebar-theme-control {
          display: block;
        }

        .md-sidebar-user {
          min-height: 49px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;

          padding: 5px 7px;

          border-radius: 10px;

          color: var(--text-primary);
          text-decoration: none;

          transition: background 0.2s ease;
        }

        .md-admin-sidebar.expanded .md-sidebar-user {
          justify-content: flex-start;
          padding: 5px 8px;
        }

        .md-sidebar-user:hover,
        .md-sidebar-user.active {
          background: var(--surface-secondary);
        }

        .md-sidebar-user-avatar {
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

        .md-sidebar-user-details {
          display: none;
          flex: 1;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }

        .md-admin-sidebar.expanded .md-sidebar-user-details {
          display: flex;
        }

        .md-sidebar-user-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          color: var(--text-primary);

          font-size: 11px;
          font-weight: 750;
        }

        .md-sidebar-user-role {
          margin-top: 3px;

          color: var(--text-muted);

          font-size: 10px;
          text-transform: capitalize;
        }

        .md-sidebar-user-more {
          display: none;
          color: var(--text-muted);
          font-size: 13px;
        }

        .md-admin-sidebar.expanded .md-sidebar-user-more {
          display: block;
        }

        .md-sidebar-logout {
          color: var(--danger);
        }

        .md-sidebar-logout:hover {
          background: var(--danger-light, var(--surface-secondary));
          color: var(--danger);
        }

        /* --------------------------------------------------
           MOBILE TOP BAR
        -------------------------------------------------- */

        .md-mobile-topbar {
          display: none;
        }

        .md-sidebar-backdrop {
          display: none;
        }

        /* --------------------------------------------------
           TABLET AND MOBILE
        -------------------------------------------------- */

        @media (max-width: 767px) {
          body.md-admin-sidebar-active {
            padding-left: 0;
          }

          .md-mobile-topbar {
            position: sticky;
            top: 0;
            z-index: 1030;

            min-height: 58px;

            display: flex;
            align-items: center;
            gap: 12px;

            padding: 0 15px;

            background: var(--surface);
            border-bottom: 1px solid var(--border);

            box-shadow: var(--shadow-sm);
          }

          .md-mobile-menu-button {
            width: 38px;
            height: 38px;

            display: flex;
            align-items: center;
            justify-content: center;

            border: 1px solid var(--border);
            border-radius: 10px;

            background: var(--surface);
            color: var(--text-primary);

            font-size: 22px;
          }

          .md-mobile-brand {
            display: flex;
            align-items: center;
            gap: 9px;

            min-width: 0;
            flex: 1;

            overflow: hidden;

            color: var(--text-primary);
            text-decoration: none;

            font-size: 13px;
            font-weight: 800;
          }

          .md-mobile-brand-icon {
            width: 31px;
            height: 31px;
            min-width: 31px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 9px;

            background: var(--primary);
            color: #fff;

            font-size: 14px;
          }

          .md-mobile-brand span:last-child {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .md-mobile-topbar-label {
            color: var(--text-muted);
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1px;
          }

          .md-admin-sidebar {
            top: 0;
            left: 0;
            bottom: 0;

            width: 285px;
            max-width: 86vw;

            border-radius: 0 17px 17px 0;

            transform: translateX(-110%);
            transition: transform 0.28s ease;

            z-index: 1050;
          }

          .md-admin-sidebar.expanded {
            width: 285px;
          }

          .md-admin-sidebar.mobile-open {
            transform: translateX(0);
          }

          .md-sidebar-header {
            justify-content: flex-start;
            padding: 0 15px;
          }

          .md-sidebar-brand-details {
            display: flex;
          }

          .md-sidebar-mobile-close {
            display: flex;
            margin-left: auto;
          }

          .md-sidebar-scroll {
            padding: 16px 12px;
          }

          .md-sidebar-section-caption {
            display: block;
          }

          .md-sidebar-link,
          .md-sidebar-group-button,
          .md-sidebar-logout {
            justify-content: flex-start;
            padding: 0 11px;
          }

          .md-sidebar-link-label {
            display: block;
          }

          .md-sidebar-chevron {
            display: block;
          }

          .md-sidebar-submenu.open {
            display: flex;
          }

          .md-sidebar-active-dot {
            display: block;
          }

          .md-sidebar-theme {
            justify-content: flex-start;
            padding: 0 11px;
          }

          .md-sidebar-theme-control {
            display: block;
          }

          .md-sidebar-user {
            justify-content: flex-start;
            padding: 5px 8px;
          }

          .md-sidebar-user-details {
            display: flex;
          }

          .md-sidebar-user-more {
            display: block;
          }

          .md-sidebar-backdrop {
            position: fixed;
            inset: 0;

            display: block;

            background: rgba(15, 23, 42, 0.48);
            backdrop-filter: blur(2px);

            opacity: 0;
            visibility: hidden;

            transition:
              opacity 0.25s ease,
              visibility 0.25s ease;

            z-index: 1045;
          }

          .md-sidebar-backdrop.visible {
            opacity: 1;
            visibility: visible;
          }
        }

        /* --------------------------------------------------
           SMALL PHONES
        -------------------------------------------------- */

        @media (max-width: 380px) {
          .md-mobile-topbar {
            padding: 0 10px;
            gap: 8px;
          }

          .md-mobile-topbar-label {
            font-size: 8px;
          }
        }

        /* --------------------------------------------------
           ACCESSIBILITY
        -------------------------------------------------- */

        .md-admin-sidebar button:focus-visible,
        .md-admin-sidebar a:focus-visible,
        .md-mobile-topbar button:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 3px;
        }

        @media (prefers-reduced-motion: reduce) {
          .md-admin-sidebar,
          .md-sidebar-link,
          .md-sidebar-group-button,
          .md-sidebar-backdrop {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}

export default AdminNavbar;
