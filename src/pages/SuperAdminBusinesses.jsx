import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

const initialBusinesses = [
  {
    id: "MD-001",
    name: "FreshMart Supermarket",
    owner: "John Mwangi",
    email: "john@freshmart.co.ke",
    category: "Supermarket",
    plan: "Professional",
    status: "Active",
    branches: 3,
    users: 12,
    joined: "2026-10-12",
    revenue: "KSh 12,500",
  },
  {
    id: "MD-002",
    name: "Urban Fashion",
    owner: "Mary Wanjiku",
    email: "mary@urbanfashion.co.ke",
    category: "Fashion",
    plan: "Starter",
    status: "Active",
    branches: 1,
    users: 4,
    joined: "2026-10-18",
    revenue: "KSh 4,500",
  },
  {
    id: "MD-003",
    name: "HealthPlus Pharmacy",
    owner: "Peter Otieno",
    email: "peter@healthplus.co.ke",
    category: "Pharmacy",
    plan: "Enterprise",
    status: "Active",
    branches: 5,
    users: 21,
    joined: "2026-10-21",
    revenue: "KSh 25,000",
  },
  {
    id: "MD-004",
    name: "The Bottle Store",
    owner: "David Kamau",
    email: "david@bottlestore.co.ke",
    category: "Liquor Store",
    plan: "Professional",
    status: "Suspended",
    branches: 2,
    users: 7,
    joined: "2026-10-25",
    revenue: "KSh 12,500",
  },
  {
    id: "MD-005",
    name: "TechZone Electronics",
    owner: "Grace Achieng",
    email: "grace@techzone.co.ke",
    category: "Electronics",
    plan: "Starter",
    status: "Active",
    branches: 1,
    users: 3,
    joined: "2026-11-01",
    revenue: "KSh 4,500",
  },
  {
    id: "MD-006",
    name: "Mama's Kitchen",
    owner: "Faith Njeri",
    email: "faith@mamaskitchen.co.ke",
    category: "Restaurant",
    plan: "Professional",
    status: "Pending",
    branches: 1,
    users: 5,
    joined: "2026-11-05",
    revenue: "KSh 12,500",
  },
  {
    id: "MD-007",
    name: "Agro Supplies",
    owner: "Samuel Kiptoo",
    email: "samuel@agrosupplies.co.ke",
    category: "Agrovet",
    plan: "Starter",
    status: "Active",
    branches: 2,
    users: 6,
    joined: "2026-11-08",
    revenue: "KSh 4,500",
  },
  {
    id: "MD-008",
    name: "Beauty Haven",
    owner: "Ann Muthoni",
    email: "ann@beautyhaven.co.ke",
    category: "Beauty",
    plan: "Professional",
    status: "Pending",
    branches: 1,
    users: 2,
    joined: "2026-11-11",
    revenue: "KSh 12,500",
  },
];

const navigation = [
  { label: "Overview", path: "/superadmin/dashboard", icon: "◫" },
  { label: "Businesses", path: "/superadmin/businesses", icon: "▦" },
  { label: "Users", path: "/superadmin/users", icon: "♙" },
  { label: "Subscriptions", path: "/superadmin/subscriptions", icon: "▤" },
  { label: "Analytics", path: "/superadmin/analytics", icon: "▥" },
  { label: "Support", path: "/superadmin/support", icon: "✉" },
  { label: "Audit Logs", path: "/superadmin/audit-logs", icon: "◷" },
  { label: "Settings", path: "/superadmin/settings", icon: "⚙" },
];

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const styles = {
    Active: {
      color: "var(--success)",
      background: "var(--success-bg, rgba(22,163,74,0.10))",
    },
    Suspended: {
      color: "var(--danger)",
      background: "var(--danger-bg, rgba(220,38,38,0.10))",
    },
    Pending: {
      color: "var(--warning)",
      background: "var(--warning-bg, rgba(217,119,6,0.10))",
    },
  };

  return (
    <span
      className="business-status"
      style={styles[status] || styles.Pending}
    >
      <span className="status-dot" />
      {status}
    </span>
  );
}

function BusinessDetails({ business, onClose }) {
  if (!business) return null;

  return (
    <div className="business-modal-overlay" onClick={onClose}>
      <div
        className="business-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="business-modal-header">
          <div>
            <span className="business-modal-eyebrow">BUSINESS DETAILS</span>
            <h2>{business.name}</h2>
            <p>{business.id}</p>
          </div>

          <button
            className="business-close-button"
            onClick={onClose}
            aria-label="Close details"
          >
            ×
          </button>
        </div>

        <div className="business-modal-body">
          <div className="business-detail-status">
            <span>Account status</span>
            <StatusBadge status={business.status} />
          </div>

          <div className="business-detail-grid">
            <div>
              <span>Business owner</span>
              <strong>{business.owner}</strong>
            </div>

            <div>
              <span>Business ID</span>
              <strong>{business.id}</strong>
            </div>

            <div>
              <span>Email address</span>
              <strong>{business.email}</strong>
            </div>

            <div>
              <span>Business category</span>
              <strong>{business.category}</strong>
            </div>

            <div>
              <span>Subscription plan</span>
              <strong>{business.plan}</strong>
            </div>

            <div>
              <span>Registration date</span>
              <strong>{formatDate(business.joined)}</strong>
            </div>

            <div>
              <span>Branches</span>
              <strong>{business.branches}</strong>
            </div>

            <div>
              <span>Staff accounts</span>
              <strong>{business.users}</strong>
            </div>

            <div>
              <span>Monthly plan value</span>
              <strong>{business.revenue}</strong>
            </div>
          </div>
        </div>

        <div className="business-modal-footer">
          <button className="business-secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SuperAdminBusinesses() {
  const [businesses] = useState(initialBusinesses);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const categories = useMemo(
    () => ["All", ...new Set(businesses.map((business) => business.category))],
    [businesses]
  );

  const filteredBusinesses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return businesses.filter((business) => {
      const matchesSearch =
        !query ||
        business.name.toLowerCase().includes(query) ||
        business.owner.toLowerCase().includes(query) ||
        business.email.toLowerCase().includes(query) ||
        business.id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || business.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" || business.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [businesses, search, statusFilter, categoryFilter]);

  const activeCount = businesses.filter(
    (business) => business.status === "Active"
  ).length;

  const pendingCount = businesses.filter(
    (business) => business.status === "Pending"
  ).length;

  const suspendedCount = businesses.filter(
    (business) => business.status === "Suspended"
  ).length;

  const totalBranches = businesses.reduce(
    (total, business) => total + business.branches,
    0
  );

  return (
    <div className="super-business-layout">
      <style>{`
        .super-business-layout {
          min-height: 100vh;
          display: flex;
          background: var(--background);
          color: var(--text-primary);
          font-family: var(--font-family, Inter, sans-serif);
        }

        .super-business-sidebar {
          width: 250px;
          flex-shrink: 0;
          background: var(--sidebar-bg, #111827);
          color: #f8fafc;
          display: flex;
          flex-direction: column;
          padding: 25px 16px;
          min-height: 100vh;
        }

        .super-business-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px 30px;
          border-bottom: 1px solid rgba(255,255,255,0.10);
          margin-bottom: 25px;
        }

        .super-business-brand-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #2563eb;
          font-size: 19px;
          font-weight: 800;
        }

        .super-business-brand strong {
          display: block;
          font-size: 17px;
          letter-spacing: -0.5px;
        }

        .super-business-brand small {
          display: block;
          color: #94a3b8;
          font-size: 10px;
          margin-top: 3px;
          letter-spacing: 1.2px;
        }

        .super-business-nav-label {
          padding: 0 12px;
          margin-bottom: 12px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .super-business-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .super-business-nav a {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 12px;
          border-radius: 9px;
          text-decoration: none;
          color: #aebaca;
          font-size: 13px;
          font-weight: 600;
          transition: 0.2s ease;
        }

        .super-business-nav a:hover,
        .super-business-nav a.active {
          color: #fff;
          background: rgba(59,130,246,0.19);
        }

        .super-business-nav a.active {
          box-shadow: inset 3px 0 #60a5fa;
        }

        .super-business-nav-icon {
          width: 20px;
          text-align: center;
          font-size: 17px;
        }

        .super-business-sidebar-bottom {
          margin-top: auto;
          padding: 18px 11px 0;
          border-top: 1px solid rgba(255,255,255,0.10);
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.7;
        }

        .super-business-main {
          min-width: 0;
          flex: 1;
        }

        .super-business-topbar {
          min-height: 70px;
          padding: 0 32px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .super-business-topbar-left {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .super-business-topbar h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .super-business-topbar p {
          margin: 3px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .super-business-admin {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .super-business-avatar {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: white;
          background: #2563eb;
          font-weight: 800;
        }

        .super-business-content {
          max-width: 1500px;
          padding: 32px;
          margin: 0 auto;
        }

        .super-business-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .super-business-heading h1 {
          margin: 0;
          color: var(--text-primary);
          font-size: clamp(23px, 3vw, 29px);
          font-weight: 800;
          letter-spacing: -1px;
        }

        .super-business-heading p {
          margin: 8px 0 0;
          color: var(--text-muted);
          font-size: 13px;
        }

        .business-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 25px;
        }

        .business-stat-card {
          min-width: 0;
          padding: 20px;
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: var(--radius-lg, 14px);
          box-shadow: var(--shadow-sm, none);
        }

        .business-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .business-stat-label {
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
        }

        .business-stat-icon {
          width: 37px;
          height: 37px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: var(--surface-secondary);
          font-size: 17px;
        }

        .business-stat-value {
          margin-top: 15px;
          color: var(--text-primary);
          font-size: 27px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .business-stat-note {
          margin-top: 5px;
          color: var(--text-muted);
          font-size: 11px;
        }

        .business-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 14px);
          overflow: hidden;
          box-shadow: var(--shadow-sm, none);
        }

        .business-panel-header {
          padding: 21px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          border-bottom: 1px solid var(--border);
        }

        .business-panel-header h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: 15px;
          font-weight: 800;
        }

        .business-panel-header p {
          margin: 5px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .business-filters {
          padding: 17px 22px;
          display: flex;
          flex-wrap: wrap;
          gap: 11px;
          border-bottom: 1px solid var(--border);
        }

        .business-search {
          position: relative;
          flex: 1;
          min-width: 220px;
        }

        .business-search span {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          font-size: 15px;
        }

        .business-search input,
        .business-filter-select {
          width: 100%;
          min-height: 41px;
          padding: 9px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--input-bg, var(--surface));
          color: var(--text-primary);
          outline: none;
          font-size: 12px;
        }

        .business-search input {
          padding-left: 37px;
        }

        .business-search input:focus,
        .business-filter-select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--focus-ring, rgba(37,99,235,0.12));
        }

        .business-filter-select {
          width: auto;
          min-width: 145px;
        }

        .business-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .business-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px;
        }

        .business-table th {
          padding: 13px 17px;
          background: var(--surface-secondary);
          color: var(--text-muted);
          text-align: left;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          font-weight: 800;
          white-space: nowrap;
        }

        .business-table td {
          padding: 15px 17px;
          border-bottom: 1px solid var(--border);
          color: var(--text-primary);
          font-size: 12px;
          white-space: nowrap;
        }

        .business-table tbody tr:hover {
          background: var(--surface-hover);
        }

        .business-table tbody tr:last-child td {
          border-bottom: none;
        }

        .business-name {
          font-weight: 750;
          font-size: 12px;
        }

        .business-subtext {
          display: block;
          margin-top: 4px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .business-plan {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 6px;
          background: var(--surface-secondary);
          color: var(--text-primary);
          font-size: 10px;
          font-weight: 700;
        }

        .business-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 750;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .business-view-button {
          border: 1px solid var(--border);
          color: var(--text-primary);
          background: var(--surface);
          border-radius: 7px;
          padding: 7px 11px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .business-view-button:hover {
          color: var(--primary);
          border-color: var(--primary);
          background: var(--surface-hover);
        }

        .business-empty {
          padding: 45px 20px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }

        .business-table-footer {
          padding: 15px 20px;
          border-top: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 11px;
        }

        .business-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(15,23,42,0.58);
          display: grid;
          place-items: center;
          padding: 18px;
        }

        .business-modal {
          width: min(100%, 590px);
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          box-shadow: 0 25px 70px rgba(0,0,0,0.25);
        }

        .business-modal-header {
          padding: 23px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
        }

        .business-modal-eyebrow {
          color: var(--primary);
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 1.3px;
        }

        .business-modal-header h2 {
          margin: 8px 0 4px;
          color: var(--text-primary);
          font-size: 20px;
        }

        .business-modal-header p {
          margin: 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .business-close-button {
          width: 32px;
          height: 32px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 22px;
        }

        .business-modal-body {
          padding: 22px;
        }

        .business-detail-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 18px;
          margin-bottom: 18px;
          border-bottom: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 12px;
        }

        .business-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px 18px;
        }

        .business-detail-grid span {
          display: block;
          margin-bottom: 6px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .business-detail-grid strong {
          display: block;
          color: var(--text-primary);
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .business-modal-footer {
          padding: 16px 22px;
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid var(--border);
        }

        .business-secondary-button {
          padding: 9px 17px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .business-mobile-menu {
          display: none;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 7px 10px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
        }

        .business-sidebar-overlay {
          display: none;
        }

        @media (max-width: 1050px) {
          .business-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .super-business-sidebar {
            position: fixed;
            z-index: 100;
            top: 0;
            bottom: 0;
            left: 0;
            width: 260px;
            min-height: 100%;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }

          .super-business-sidebar.open {
            transform: translateX(0);
          }

          .business-sidebar-overlay.visible {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 90;
            background: rgba(15,23,42,0.55);
          }

          .business-mobile-menu {
            display: inline-flex;
          }

          .super-business-topbar {
            padding: 0 17px;
          }

          .super-business-content {
            padding: 23px 16px;
          }

          .super-business-heading {
            flex-direction: column;
          }

          .business-panel-header {
            padding: 18px;
          }

          .business-filters {
            padding: 15px 18px;
          }
        }

        @media (max-width: 480px) {
          .business-stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .business-stat-card {
            padding: 14px;
          }

          .business-stat-value {
            font-size: 22px;
          }

          .business-stat-label {
            font-size: 10px;
          }

          .business-stat-icon {
            width: 30px;
            height: 30px;
            font-size: 14px;
          }

          .business-search {
            min-width: 100%;
          }

          .business-filter-select {
            flex: 1;
            min-width: 0;
          }

          .business-detail-grid {
            grid-template-columns: 1fr;
            gap: 17px;
          }

          .super-business-admin span:last-child {
            display: none;
          }
        }
      `}</style>

      <aside
        className={`super-business-sidebar ${sidebarOpen ? "open" : ""}`}
      >
        <div className="super-business-brand">
          <div className="super-business-brand-icon">M</div>
          <div>
            <strong>MyDuka</strong>
            <small>PLATFORM ADMIN</small>
          </div>
        </div>

        <div className="super-business-nav-label">Platform</div>

        <nav className="super-business-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="super-business-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="super-business-sidebar-bottom">
          <strong>MyDuka Platform</strong>
          <br />
          Super Administration
          <br />
          © 2026 MyDuka
        </div>
      </aside>

      <div
        className={`business-sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="super-business-main">
        <header className="super-business-topbar">
          <div className="super-business-topbar-left">
            <button
              className="business-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <h2>Business Management</h2>
              <p>Manage all businesses registered on MyDuka</p>
            </div>
          </div>

          <div className="super-business-admin">
            <div className="super-business-avatar">SA</div>
            <span>Super Administrator</span>
          </div>
        </header>

        <section className="super-business-content">
          <div className="super-business-heading">
            <div>
              <h1>Businesses</h1>
              <p>
                Monitor registrations, business accounts, subscriptions and
                platform activity.
              </p>
            </div>
          </div>

          <div className="business-stats-grid">
            <div className="business-stat-card">
              <div className="business-stat-top">
                <span className="business-stat-label">Total businesses</span>
                <span className="business-stat-icon">▦</span>
              </div>
              <div className="business-stat-value">{businesses.length}</div>
              <div className="business-stat-note">
                Registered platform accounts
              </div>
            </div>

            <div className="business-stat-card">
              <div className="business-stat-top">
                <span className="business-stat-label">Active businesses</span>
                <span className="business-stat-icon">✓</span>
              </div>
              <div className="business-stat-value">{activeCount}</div>
              <div className="business-stat-note">
                Currently active accounts
              </div>
            </div>

            <div className="business-stat-card">
              <div className="business-stat-top">
                <span className="business-stat-label">Pending approval</span>
                <span className="business-stat-icon">◷</span>
              </div>
              <div className="business-stat-value">{pendingCount}</div>
              <div className="business-stat-note">
                Awaiting account review
              </div>
            </div>

            <div className="business-stat-card">
              <div className="business-stat-top">
                <span className="business-stat-label">Total branches</span>
                <span className="business-stat-icon">⌂</span>
              </div>
              <div className="business-stat-value">{totalBranches}</div>
              <div className="business-stat-note">
                Across registered businesses
              </div>
            </div>
          </div>

          <section className="business-panel">
            <div className="business-panel-header">
              <div>
                <h3>Registered businesses</h3>
                <p>
                  {filteredBusinesses.length} matching business
                  {filteredBusinesses.length === 1 ? "" : "es"}
                  {suspendedCount > 0
                    ? ` · ${suspendedCount} suspended`
                    : ""}
                </p>
              </div>
            </div>

            <div className="business-filters">
              <div className="business-search">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Search business, owner, email or ID..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <select
                className="business-filter-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by status"
              >
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>

              <select
                className="business-filter-select"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter by category"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "All" ? "All categories" : category}
                  </option>
                ))}
              </select>
            </div>

            <div className="business-table-wrap">
              <table className="business-table">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Owner</th>
                    <th>Category</th>
                    <th>Plan</th>
                    <th>Branches</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBusinesses.map((business) => (
                    <tr key={business.id}>
                      <td>
                        <span className="business-name">
                          {business.name}
                        </span>
                        <span className="business-subtext">
                          {business.id}
                        </span>
                      </td>

                      <td>
                        <span className="business-name">
                          {business.owner}
                        </span>
                        <span className="business-subtext">
                          {business.email}
                        </span>
                      </td>

                      <td>{business.category}</td>

                      <td>
                        <span className="business-plan">
                          {business.plan}
                        </span>
                      </td>

                      <td>{business.branches}</td>

                      <td>
                        <StatusBadge status={business.status} />
                      </td>

                      <td>{formatDate(business.joined)}</td>

                      <td>
                        <button
                          className="business-view-button"
                          onClick={() => setSelectedBusiness(business)}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredBusinesses.length === 0 && (
                <div className="business-empty">
                  <div style={{ fontSize: 28, marginBottom: 10 }}>⌕</div>
                  <strong>No businesses found</strong>
                  <p>Try changing your search or filters.</p>
                </div>
              )}
            </div>

            <div className="business-table-footer">
              Showing {filteredBusinesses.length} of {businesses.length} demo
              businesses
            </div>
          </section>
        </section>
      </main>

      <BusinessDetails
        business={selectedBusiness}
        onClose={() => setSelectedBusiness(null)}
      />
    </div>
  );
}

export default SuperAdminBusinesses;
