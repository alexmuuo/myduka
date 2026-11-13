import { useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";

import { STORE_NAME } from "../config/store";
import ThemeSwitcher from "./ThemeSwitcher";

const links = [
  {
    label: "POS",
    path: "/cashier/pos",
    icon: "bi-cart3",
  },
  {
    label: "Sales History",
    path: "/cashier/sales-history",
    icon: "bi-receipt",
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
    label: "Stock Management",
    path: "/cashier/stock",
    icon: "bi-boxes",
  },
  {
    label: "My Stock History",
    path: "/cashier/stock-history",
    icon: "bi-clock-history",
  },
];

function CashierNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile navigation after selecting a page.
  useEffect(() => {
    const navbar = document.getElementById("cashierNavbar");

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

  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out?"
    );

    if (!confirmed) return;

    localStorage.removeItem("cashierToken");
    localStorage.removeItem("cashier");

    navigate("/cashier-login", { replace: true });
  };

  return (
    <nav
      className="navbar navbar-expand-lg sticky-top"
      style={{
        backgroundColor: "var(--md-surface)",
        color: "var(--md-text)",
        borderBottom: "1px solid var(--md-border)",
      }}
    >
      <div className="container">

        {/* BRAND */}

        <Link
          className="navbar-brand fw-bold d-flex align-items-center"
          to="/cashier/pos"
          aria-label={`${STORE_NAME} Cashier Home`}
          style={{ color: "var(--md-primary)" }}
        >
          <i className="bi bi-shop me-2" />

          {STORE_NAME}

          <span
            className="badge ms-2"
            style={{
              backgroundColor: "var(--md-primary-light)",
              color: "var(--md-primary)",
            }}
          >
            Cashier
          </span>
        </Link>

        {/* MOBILE TOGGLE */}

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#cashierNavbar"
          aria-controls="cashierNavbar"
          aria-expanded="false"
          aria-label="Toggle cashier navigation"
          style={{ borderColor: "var(--md-border)" }}
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* NAVIGATION */}

        <div
          className="collapse navbar-collapse"
          id="cashierNavbar"
        >
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">

            {links.map((link) => (
              <li className="nav-item" key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "fw-bold" : ""}`
                  }
                  style={({ isActive }) => ({
                    color: isActive
                      ? "var(--md-primary)"
                      : "var(--md-text)",
                  })}
                  end
                >
                  <i className={`bi ${link.icon} me-1`} />
                  {link.label}
                </NavLink>
              </li>
            ))}

          </ul>

          {/* RIGHT SIDE */}

          <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-3 py-3 py-lg-0">

            {/* THEME SWITCHER */}

            <ThemeSwitcher />

            {/* CASHIER WORKSPACE */}

            <span
              className="small d-none d-xl-inline"
              style={{ color: "var(--md-muted)" }}
            >
              <i className="bi bi-person-badge me-1" />
              Cashier Workspace
            </span>

            {/* LOGOUT */}

            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-1" />
              Logout
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
}

export default CashierNavbar;
