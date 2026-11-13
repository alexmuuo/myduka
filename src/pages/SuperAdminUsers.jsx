import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

const initialUsers = [
  {
    id: "USR-001",
    name: "John Mwangi",
    email: "john@freshmart.co.ke",
    role: "Business Owner",
    business: "FreshMart Supermarket",
    status: "Active",
    joined: "2026-10-12",
    lastActive: "Today",
  },
  {
    id: "USR-002",
    name: "Mary Wanjiku",
    email: "mary@urbanfashion.co.ke",
    role: "Business Owner",
    business: "Urban Fashion",
    status: "Active",
    joined: "2026-10-18",
    lastActive: "Today",
  },
  {
    id: "USR-003",
    name: "Peter Otieno",
    email: "peter@healthplus.co.ke",
    role: "Business Owner",
    business: "HealthPlus Pharmacy",
    status: "Active",
    joined: "2026-10-21",
    lastActive: "Yesterday",
  },
  {
    id: "USR-004",
    name: "David Kamau",
    email: "david@bottlestore.co.ke",
    role: "Business Owner",
    business: "The Bottle Store",
    status: "Suspended",
    joined: "2026-10-25",
    lastActive: "Oct 30",
  },
  {
    id: "USR-005",
    name: "Grace Achieng",
    email: "grace@techzone.co.ke",
    role: "Business Owner",
    business: "TechZone Electronics",
    status: "Active",
    joined: "2026-11-01",
    lastActive: "Today",
  },
  {
    id: "USR-006",
    name: "Brian Kiptoo",
    email: "brian@freshmart.co.ke",
    role: "Cashier",
    business: "FreshMart Supermarket",
    status: "Active",
    joined: "2026-10-14",
    lastActive: "Today",
  },
  {
    id: "USR-007",
    name: "Susan Njeri",
    email: "susan@freshmart.co.ke",
    role: "Manager",
    business: "FreshMart Supermarket",
    status: "Active",
    joined: "2026-10-15",
    lastActive: "Yesterday",
  },
  {
    id: "USR-008",
    name: "Kevin Ouma",
    email: "kevin@example.com",
    role: "Customer",
    business: "—",
    status: "Active",
    joined: "2026-11-05",
    lastActive: "Today",
  },
  {
    id: "USR-009",
    name: "Lucy Muthoni",
    email: "lucy@example.com",
    role: "Customer",
    business: "—",
    status: "Pending",
    joined: "2026-11-10",
    lastActive: "Never",
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

function StatusBadge({ status }) {
  const colors = {
    Active: "var(--success)",
    Suspended: "var(--danger)",
    Pending: "var(--warning)",
  };

  return (
    <span
      className="user-status"
      style={{
        color: colors[status] || "var(--text-muted)",
        background: `color-mix(in srgb, ${colors[status] || "var(--text-muted)"} 12%, transparent)`,
      }}
    >
      <span className="user-status-dot" />
      {status}
    </span>
  );
}

function UserDetails({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="user-modal-overlay" onClick={onClose}>
      <div
        className="user-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="user-modal-header">
          <div className="user-modal-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="user-modal-heading">
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>

          <button
            className="user-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="user-modal-body">
          <div className="user-detail-row">
            <span>User ID</span>
            <strong>{user.id}</strong>
          </div>

          <div className="user-detail-row">
            <span>Role</span>
            <strong>{user.role}</strong>
          </div>

          <div className="user-detail-row">
            <span>Business</span>
            <strong>{user.business}</strong>
          </div>

          <div className="user-detail-row">
            <span>Account status</span>
            <StatusBadge status={user.status} />
          </div>

          <div className="user-detail-row">
            <span>Date registered</span>
            <strong>{user.joined}</strong>
          </div>

          <div className="user-detail-row">
            <span>Last active</span>
            <strong>{user.lastActive}</strong>
          </div>
        </div>

        <div className="user-modal-footer">
          <button className="user-secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SuperAdminUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.business.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "All" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const activeUsers = users.filter((user) => user.status === "Active").length;
  const suspendedUsers = users.filter(
    (user) => user.status === "Suspended"
  ).length;
  const pendingUsers = users.filter(
    (user) => user.status === "Pending"
  ).length;

  const ownerCount = users.filter(
    (user) => user.role === "Business Owner"
  ).length;

  function toggleUserStatus(userId) {
    setUsers((currentUsers) =>
      currentUsers.map((user) => {
        if (user.id !== userId) return user;

        const nextStatus =
          user.status === "Suspended" ? "Active" : "Suspended";

        return { ...user, status: nextStatus };
      })
    );

    setSelectedUser((current) => {
      if (!current || current.id !== userId) return current;

      return {
        ...current,
        status:
          current.status === "Suspended" ? "Active" : "Suspended",
      };
    });
  }

  return (
    <div className="super-users-layout">
      <style>{`
        .super-users-layout {
          min-height: 100vh;
          display: flex;
          background: var(--background);
          color: var(--text-primary);
          font-family: var(--font-family, Inter, sans-serif);
        }

        .super-users-sidebar {
          width: 250px;
          flex-shrink: 0;
          min-height: 100vh;
          padding: 25px 16px;
          display: flex;
          flex-direction: column;
          background: var(--sidebar-bg, #111827);
          color: #f8fafc;
        }

        .super-users-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px 30px;
          margin-bottom: 25px;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .super-users-brand-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #2563eb;
          font-size: 19px;
          font-weight: 800;
        }

        .super-users-brand strong {
          display: block;
          font-size: 17px;
        }

        .super-users-brand small {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
          letter-spacing: 1.2px;
        }

        .super-users-nav-label {
          padding: 0 12px;
          margin-bottom: 12px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .super-users-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .super-users-nav a {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 12px;
          border-radius: 9px;
          color: #aebaca;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: .2s ease;
        }

        .super-users-nav a:hover,
        .super-users-nav a.active {
          color: #fff;
          background: rgba(59,130,246,.19);
        }

        .super-users-nav a.active {
          box-shadow: inset 3px 0 #60a5fa;
        }

        .super-users-nav-icon {
          width: 20px;
          text-align: center;
          font-size: 17px;
        }

        .super-users-sidebar-bottom {
          margin-top: auto;
          padding: 18px 11px 0;
          border-top: 1px solid rgba(255,255,255,.1);
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.7;
        }

        .super-users-main {
          flex: 1;
          min-width: 0;
        }

        .super-users-topbar {
          min-height: 70px;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }

        .super-users-topbar h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
        }

        .super-users-topbar p {
          margin: 3px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .super-users-admin {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .super-users-admin-avatar {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          font-weight: 800;
        }

        .super-users-content {
          max-width: 1500px;
          padding: 32px;
          margin: 0 auto;
        }

        .super-users-heading {
          margin-bottom: 25px;
        }

        .super-users-heading h1 {
          margin: 0;
          font-size: clamp(23px, 3vw, 29px);
          font-weight: 800;
          letter-spacing: -1px;
        }

        .super-users-heading p {
          margin: 8px 0 0;
          color: var(--text-muted);
          font-size: 13px;
        }

        .users-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 25px;
        }

        .users-stat-card {
          min-width: 0;
          padding: 20px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 14px);
          background: var(--surface);
          box-shadow: var(--shadow-sm, none);
        }

        .users-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .users-stat-label {
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
        }

        .users-stat-icon {
          width: 37px;
          height: 37px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: var(--surface-secondary);
          font-size: 17px;
        }

        .users-stat-value {
          margin-top: 15px;
          font-size: 27px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .users-stat-note {
          margin-top: 5px;
          color: var(--text-muted);
          font-size: 11px;
        }

        .users-panel {
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 14px);
          background: var(--surface);
          box-shadow: var(--shadow-sm, none);
        }

        .users-panel-header {
          padding: 21px 22px;
          border-bottom: 1px solid var(--border);
        }

        .users-panel-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
        }

        .users-panel-header p {
          margin: 5px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .users-filters {
          padding: 17px 22px;
          display: flex;
          flex-wrap: wrap;
          gap: 11px;
          border-bottom: 1px solid var(--border);
        }

        .users-search {
          position: relative;
          flex: 1;
          min-width: 220px;
        }

        .users-search span {
          position: absolute;
          top: 50%;
          left: 13px;
          transform: translateY(-50%);
          color: var(--text-muted);
          font-size: 15px;
        }

        .users-search input,
        .users-filter-select {
          width: 100%;
          min-height: 41px;
          padding: 9px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          outline: none;
          background: var(--input-bg, var(--surface));
          color: var(--text-primary);
          font-size: 12px;
        }

        .users-search input {
          padding-left: 37px;
        }

        .users-search input:focus,
        .users-filter-select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--focus-ring, rgba(37,99,235,.12));
        }

        .users-filter-select {
          width: auto;
          min-width: 150px;
        }

        .users-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .users-table {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
        }

        .users-table th {
          padding: 13px 17px;
          background: var(--surface-secondary);
          color: var(--text-muted);
          text-align: left;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .7px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .users-table td {
          padding: 15px 17px;
          border-bottom: 1px solid var(--border);
          font-size: 12px;
          white-space: nowrap;
        }

        .users-table tbody tr:hover {
          background: var(--surface-hover);
        }

        .users-table tbody tr:last-child td {
          border-bottom: none;
        }

        .users-person {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .users-person-avatar {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: var(--primary-light);
          color: var(--primary);
          font-weight: 800;
        }

        .users-person-name {
          font-weight: 750;
        }

        .users-subtext {
          display: block;
          margin-top: 4px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .users-role {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 6px;
          background: var(--surface-secondary);
          font-size: 10px;
          font-weight: 700;
        }

        .user-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 750;
        }

        .user-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .users-action-button {
          padding: 7px 11px;
          border: 1px solid var(--border);
          border-radius: 7px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .users-action-button:hover {
          color: var(--primary);
          border-color: var(--primary);
        }

        .users-empty {
          padding: 45px 20px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }

        .users-table-footer {
          padding: 15px 20px;
          border-top: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 11px;
        }

        .user-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(15,23,42,.58);
        }

        .user-modal {
          width: min(100%, 520px);
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--surface);
          box-shadow: 0 25px 70px rgba(0,0,0,.25);
        }

        .user-modal-header {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 22px;
          border-bottom: 1px solid var(--border);
        }

        .user-modal-avatar {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: var(--primary-light);
          color: var(--primary);
          font-size: 18px;
          font-weight: 800;
        }

        .user-modal-heading {
          flex: 1;
          min-width: 0;
        }

        .user-modal-heading h2 {
          margin: 0;
          font-size: 17px;
        }

        .user-modal-heading p {
          margin: 5px 0 0;
          color: var(--text-muted);
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        .user-close-button {
          width: 32px;
          height: 32px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 22px;
        }

        .user-modal-body {
          padding: 12px 22px;
        }

        .user-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 13px 0;
          border-bottom: 1px solid var(--border);
          font-size: 12px;
        }

        .user-detail-row:last-child {
          border-bottom: none;
        }

        .user-detail-row > span:first-child {
          color: var(--text-muted);
        }

        .user-detail-row strong {
          text-align: right;
          overflow-wrap: anywhere;
        }

        .user-modal-footer {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 16px 22px;
          border-top: 1px solid var(--border);
        }

        .user-secondary-button,
        .user-suspend-button {
          padding: 9px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .user-suspend-button {
          border-color: var(--danger);
          color: var(--danger);
        }

        .user-mobile-menu {
          display: none;
          padding: 7px 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
        }

        .users-sidebar-overlay {
          display: none;
        }

        @media (max-width: 1050px) {
          .users-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .super-users-sidebar {
            position: fixed;
            z-index: 100;
            top: 0;
            bottom: 0;
            left: 0;
            width: 260px;
            transform: translateX(-100%);
            transition: transform .25s ease;
          }

          .super-users-sidebar.open {
            transform: translateX(0);
          }

          .users-sidebar-overlay.visible {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 90;
            background: rgba(15,23,42,.55);
          }

          .user-mobile-menu {
            display: inline-flex;
          }

          .super-users-topbar {
            padding: 0 17px;
          }

          .super-users-content {
            padding: 23px 16px;
          }

          .users-panel-header,
          .users-filters {
            padding-left: 17px;
            padding-right: 17px;
          }
        }

        @media (max-width: 480px) {
          .users-stats-grid {
            gap: 10px;
          }

          .users-stat-card {
            padding: 14px;
          }

          .users-stat-value {
            font-size: 22px;
          }

          .users-stat-label {
            font-size: 10px;
          }

          .users-stat-icon {
            width: 30px;
            height: 30px;
          }

          .users-search {
            min-width: 100%;
          }

          .users-filter-select {
            flex: 1;
            min-width: 0;
          }

          .super-users-admin span:last-child {
            display: none;
          }

          .user-modal-footer {
            flex-wrap: wrap;
          }
        }
      `}</style>

      <aside className={`super-users-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="super-users-brand">
          <div className="super-users-brand-icon">M</div>
          <div>
            <strong>MyDuka</strong>
            <small>PLATFORM ADMIN</small>
          </div>
        </div>

        <div className="super-users-nav-label">Platform</div>

        <nav className="super-users-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="super-users-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="super-users-sidebar-bottom">
          <strong>MyDuka Platform</strong>
          <br />
          Super Administration
          <br />
          © 2026 MyDuka
        </div>
      </aside>

      <div
        className={`users-sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="super-users-main">
        <header className="super-users-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <button
              className="user-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <h2>User Management</h2>
              <p>Manage platform users and account access</p>
            </div>
          </div>

          <div className="super-users-admin">
            <div className="super-users-admin-avatar">SA</div>
            <span>Super Administrator</span>
          </div>
        </header>

        <section className="super-users-content">
          <div className="super-users-heading">
            <h1>Platform Users</h1>
            <p>
              View and manage user accounts across all registered businesses.
            </p>
          </div>

          <div className="users-stats-grid">
            <div className="users-stat-card">
              <div className="users-stat-top">
                <span className="users-stat-label">Total users</span>
                <span className="users-stat-icon">♙</span>
              </div>
              <div className="users-stat-value">{users.length}</div>
              <div className="users-stat-note">All registered accounts</div>
            </div>

            <div className="users-stat-card">
              <div className="users-stat-top">
                <span className="users-stat-label">Active users</span>
                <span className="users-stat-icon">✓</span>
              </div>
              <div className="users-stat-value">{activeUsers}</div>
              <div className="users-stat-note">Accounts currently active</div>
            </div>

            <div className="users-stat-card">
              <div className="users-stat-top">
                <span className="users-stat-label">Business owners</span>
                <span className="users-stat-icon">▦</span>
              </div>
              <div className="users-stat-value">{ownerCount}</div>
              <div className="users-stat-note">Registered business owners</div>
            </div>

            <div className="users-stat-card">
              <div className="users-stat-top">
                <span className="users-stat-label">Restricted accounts</span>
                <span className="users-stat-icon">⚑</span>
              </div>
              <div className="users-stat-value">
                {suspendedUsers + pendingUsers}
              </div>
              <div className="users-stat-note">
                {suspendedUsers} suspended · {pendingUsers} pending
              </div>
            </div>
          </div>

          <section className="users-panel">
            <div className="users-panel-header">
              <h3>Registered users</h3>
              <p>
                {filteredUsers.length} matching user
                {filteredUsers.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="users-filters">
              <div className="users-search">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Search name, email, business or ID..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <select
                className="users-filter-select"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                aria-label="Filter by role"
              >
                <option value="All">All roles</option>
                <option value="Business Owner">Business Owner</option>
                <option value="Manager">Manager</option>
                <option value="Cashier">Cashier</option>
                <option value="Customer">Customer</option>
              </select>

              <select
                className="users-filter-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by status"
              >
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Business</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Last active</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="users-person">
                          <div className="users-person-avatar">
                            {user.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <span className="users-person-name">
                              {user.name}
                            </span>
                            <span className="users-subtext">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="users-role">{user.role}</span>
                      </td>

                      <td>{user.business}</td>

                      <td>
                        <StatusBadge status={user.status} />
                      </td>

                      <td>{user.joined}</td>

                      <td>{user.lastActive}</td>

                      <td>
                        <button
                          className="users-action-button"
                          onClick={() => setSelectedUser(user)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="users-empty">
                  <div style={{ fontSize: 28, marginBottom: 10 }}>⌕</div>
                  <strong>No users found</strong>
                  <p>Try changing your search or filters.</p>
                </div>
              )}
            </div>

            <div className="users-table-footer">
              Showing {filteredUsers.length} of {users.length} demo users
            </div>
          </section>
        </section>
      </main>

      {selectedUser && (
        <div className="user-modal-overlay">
          <UserDetails
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
          <div
            style={{
              display: "none",
            }}
          />
        </div>
      )}

      {selectedUser && (
        <div className="user-modal-overlay" style={{ display: "none" }}>
          {/* Modal is rendered by the UserDetails component above. */}
        </div>
      )}
    </div>
  );
}

export default SuperAdminUsers;
