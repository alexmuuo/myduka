import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

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

const initialLogs = [
  {
    id: "LOG-2081",
    actor: "Alex Muuo",
    email: "admin@myduka.com",
    role: "Super Admin",
    action: "Updated platform settings",
    category: "Settings",
    description:
      "Changed the platform notification preferences and saved the updated configuration.",
    target: "Platform settings",
    severity: "Medium",
    ip: "192.168.1.20",
    date: "Nov 13, 2026",
    time: "10:45 AM",
  },
  {
    id: "LOG-2080",
    actor: "Alex Muuo",
    email: "admin@myduka.com",
    role: "Super Admin",
    action: "Viewed business details",
    category: "Businesses",
    description:
      "Opened the business profile and reviewed its registration information.",
    target: "Beauty Haven",
    severity: "Low",
    ip: "192.168.1.20",
    date: "Nov 13, 2026",
    time: "10:20 AM",
  },
  {
    id: "LOG-2079",
    actor: "System",
    email: "system@myduka.com",
    role: "System",
    action: "Subscription expired",
    category: "Subscriptions",
    description:
      "A business subscription reached its expiry date.",
    target: "Agro Supplies",
    severity: "High",
    ip: "System",
    date: "Nov 13, 2026",
    time: "09:30 AM",
  },
  {
    id: "LOG-2078",
    actor: "Alex Muuo",
    email: "admin@myduka.com",
    role: "Super Admin",
    action: "Reviewed support ticket",
    category: "Support",
    description:
      "Opened a support request and reviewed the conversation history.",
    target: "TKT-1048",
    severity: "Low",
    ip: "192.168.1.20",
    date: "Nov 12, 2026",
    time: "04:15 PM",
  },
  {
    id: "LOG-2077",
    actor: "System",
    email: "system@myduka.com",
    role: "System",
    action: "New business registered",
    category: "Businesses",
    description:
      "A new business completed the registration process.",
    target: "City Mart",
    severity: "Low",
    ip: "System",
    date: "Nov 12, 2026",
    time: "02:05 PM",
  },
  {
    id: "LOG-2076",
    actor: "Alex Muuo",
    email: "admin@myduka.com",
    role: "Super Admin",
    action: "Changed subscription plan",
    category: "Subscriptions",
    description:
      "Updated a business subscription from Starter to Professional.",
    target: "Beauty Haven",
    severity: "Medium",
    ip: "192.168.1.20",
    date: "Nov 11, 2026",
    time: "11:40 AM",
  },
  {
    id: "LOG-2075",
    actor: "System",
    email: "system@myduka.com",
    role: "System",
    action: "Failed login attempt",
    category: "Security",
    description:
      "An unsuccessful login attempt was recorded for a platform account.",
    target: "Platform authentication",
    severity: "Critical",
    ip: "41.90.12.45",
    date: "Nov 11, 2026",
    time: "08:25 AM",
  },
  {
    id: "LOG-2074",
    actor: "Alex Muuo",
    email: "admin@myduka.com",
    role: "Super Admin",
    action: "Viewed platform analytics",
    category: "Analytics",
    description:
      "Accessed platform-wide business growth and revenue analytics.",
    target: "Platform analytics",
    severity: "Low",
    ip: "192.168.1.20",
    date: "Nov 10, 2026",
    time: "03:10 PM",
  },
];

const severityClass = {
  Critical: "audit-critical",
  High: "audit-high",
  Medium: "audit-medium",
  Low: "audit-low",
};

function SuperAdminAuditLogs() {
  const [logs] = useState(initialLogs);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [severity, setSeverity] = useState("All");
  const [selectedLog, setSelectedLog] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredLogs = useMemo(() => {
    const term = search.toLowerCase();

    return logs.filter((log) => {
      const matchesSearch =
        log.id.toLowerCase().includes(term) ||
        log.actor.toLowerCase().includes(term) ||
        log.email.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.target.toLowerCase().includes(term);

      const matchesCategory =
        category === "All" || log.category === category;

      const matchesSeverity =
        severity === "All" || log.severity === severity;

      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [logs, search, category, severity]);

  const criticalCount = logs.filter(
    (log) => log.severity === "Critical"
  ).length;

  const securityCount = logs.filter(
    (log) => log.category === "Security"
  ).length;

  const adminCount = logs.filter(
    (log) => log.role === "Super Admin"
  ).length;

  return (
    <div className="super-audit-layout">
      <style>{`
        .super-audit-layout {
          min-height: 100vh;
          display: flex;
          background: var(--background);
          color: var(--text-primary);
          font-family: var(--font-family, Inter, sans-serif);
        }

        .audit-sidebar {
          width: 250px;
          flex-shrink: 0;
          min-height: 100vh;
          padding: 25px 16px;
          display: flex;
          flex-direction: column;
          background: var(--sidebar-bg, #111827);
          color: #f8fafc;
        }

        .audit-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px 30px;
          margin-bottom: 25px;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .audit-brand-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #2563eb;
          font-size: 19px;
          font-weight: 800;
        }

        .audit-brand strong {
          display: block;
          font-size: 17px;
        }

        .audit-brand small {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
          letter-spacing: 1.2px;
        }

        .audit-nav-label {
          padding: 0 12px;
          margin-bottom: 12px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .audit-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .audit-nav a {
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

        .audit-nav a:hover,
        .audit-nav a.active {
          color: #fff;
          background: rgba(59,130,246,.19);
        }

        .audit-nav a.active {
          box-shadow: inset 3px 0 #60a5fa;
        }

        .audit-nav-icon {
          width: 20px;
          text-align: center;
          font-size: 17px;
        }

        .audit-sidebar-bottom {
          margin-top: auto;
          padding: 18px 11px 0;
          border-top: 1px solid rgba(255,255,255,.1);
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.7;
        }

        .audit-main {
          flex: 1;
          min-width: 0;
        }

        .audit-topbar {
          min-height: 70px;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }

        .audit-topbar h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
        }

        .audit-topbar p {
          margin: 3px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .audit-admin {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .audit-avatar {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          font-weight: 800;
        }

        .audit-content {
          max-width: 1500px;
          padding: 32px;
          margin: 0 auto;
        }

        .audit-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 25px;
        }

        .audit-heading h1 {
          margin: 0;
          font-size: clamp(23px, 3vw, 29px);
          font-weight: 800;
          letter-spacing: -1px;
        }

        .audit-heading p {
          margin: 8px 0 0;
          color: var(--text-muted);
          font-size: 13px;
        }

        .audit-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .audit-stat {
          padding: 19px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 14px);
          background: var(--surface);
        }

        .audit-stat-label {
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 600;
        }

        .audit-stat-value {
          margin-top: 12px;
          font-size: 26px;
          font-weight: 850;
        }

        .audit-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
        }

        .audit-search {
          flex: 1;
          min-width: 200px;
          min-height: 39px;
          padding: 9px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--background);
          color: var(--text-primary);
          outline: none;
          font-size: 12px;
        }

        .audit-filter {
          min-height: 39px;
          padding: 8px 11px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--background);
          color: var(--text-primary);
          font-size: 11px;
          outline: none;
        }

        .audit-search:focus,
        .audit-filter:focus {
          border-color: var(--primary);
        }

        .audit-table-card {
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: var(--surface);
        }

        .audit-table-scroll {
          overflow-x: auto;
        }

        .audit-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        .audit-table th {
          padding: 14px 15px;
          background: var(--surface-secondary);
          color: var(--text-muted);
          text-align: left;
          font-size: 9px;
          letter-spacing: .7px;
          text-transform: uppercase;
        }

        .audit-table td {
          padding: 15px;
          border-top: 1px solid var(--border);
          font-size: 11px;
        }

        .audit-table tbody tr:hover {
          background: var(--surface-hover);
        }

        .audit-id {
          color: var(--primary);
          font-weight: 800;
        }

        .audit-action {
          display: block;
          font-size: 11px;
          font-weight: 800;
        }

        .audit-subtext {
          display: block;
          margin-top: 4px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .audit-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .audit-critical {
          color: #dc2626;
          background: rgba(239,68,68,.13);
        }

        .audit-high {
          color: #ea580c;
          background: rgba(249,115,22,.13);
        }

        .audit-medium {
          color: #b45309;
          background: rgba(245,158,11,.13);
        }

        .audit-low {
          color: #15803d;
          background: rgba(34,197,94,.13);
        }

        .audit-view-button {
          padding: 7px 11px;
          border: 1px solid var(--border);
          border-radius: 7px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
        }

        .audit-view-button:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .audit-empty {
          padding: 45px 20px;
          color: var(--text-muted);
          text-align: center;
          font-size: 12px;
        }

        .audit-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(15,23,42,.62);
        }

        .audit-modal {
          width: 100%;
          max-width: 570px;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid var(--border);
          border-radius: 15px;
          background: var(--surface);
          box-shadow: 0 25px 80px rgba(0,0,0,.25);
        }

        .audit-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          padding: 21px;
          border-bottom: 1px solid var(--border);
        }

        .audit-modal-header h2 {
          margin: 0;
          font-size: 17px;
        }

        .audit-modal-header p {
          margin: 6px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .audit-close {
          width: 31px;
          height: 31px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 17px;
        }

        .audit-modal-body {
          padding: 21px;
        }

        .audit-detail-row {
          display: grid;
          grid-template-columns: 130px 1fr;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
          font-size: 11px;
        }

        .audit-detail-row:last-child {
          border-bottom: none;
        }

        .audit-detail-label {
          color: var(--text-muted);
        }

        .audit-detail-value {
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .audit-description {
          margin-top: 18px;
          padding: 15px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface-secondary);
          font-size: 12px;
          line-height: 1.7;
        }

        .audit-mobile-menu {
          display: none;
          padding: 7px 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
        }

        @media (max-width: 1000px) {
          .audit-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .audit-sidebar {
            position: fixed;
            z-index: 100;
            top: 0;
            bottom: 0;
            left: 0;
            width: 260px;
            transform: translateX(-100%);
            transition: transform .25s ease;
          }

          .audit-sidebar.open {
            transform: translateX(0);
          }

          .audit-sidebar-overlay.visible {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 90;
            background: rgba(15,23,42,.55);
          }

          .audit-mobile-menu {
            display: inline-flex;
          }

          .audit-topbar {
            padding: 0 16px;
          }

          .audit-content {
            padding: 22px 15px;
          }
        }

        @media (max-width: 480px) {
          .audit-stats {
            gap: 10px;
          }

          .audit-stat {
            padding: 14px;
          }

          .audit-stat-value {
            font-size: 22px;
          }

          .audit-admin span:last-child {
            display: none;
          }

          .audit-detail-row {
            grid-template-columns: 105px 1fr;
          }
        }
      `}</style>

      <aside className={`audit-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="audit-brand">
          <div className="audit-brand-icon">M</div>
          <div>
            <strong>MyDuka</strong>
            <small>PLATFORM ADMIN</small>
          </div>
        </div>

        <div className="audit-nav-label">Platform</div>

        <nav className="audit-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="audit-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="audit-sidebar-bottom">
          <strong>MyDuka Platform</strong>
          <br />
          Super Administration
          <br />
          © 2026 MyDuka
        </div>
      </aside>

      <div
        className={`audit-sidebar-overlay ${
          sidebarOpen ? "visible" : ""
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="audit-main">
        <header className="audit-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <button
              className="audit-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <h2>Audit Logs</h2>
              <p>Platform activity and security records</p>
            </div>
          </div>

          <div className="audit-admin">
            <div className="audit-avatar">SA</div>
            <span>Super Administrator</span>
          </div>
        </header>

        <section className="audit-content">
          <div className="audit-heading">
            <div>
              <h1>Audit Logs</h1>
              <p>
                Review administrative actions, system events and security
                activity.
              </p>
            </div>
          </div>

          <div className="audit-stats">
            <div className="audit-stat">
              <div className="audit-stat-label">Total activities</div>
              <div className="audit-stat-value">{logs.length}</div>
            </div>

            <div className="audit-stat">
              <div className="audit-stat-label">Admin activities</div>
              <div className="audit-stat-value">{adminCount}</div>
            </div>

            <div className="audit-stat">
              <div className="audit-stat-label">Security events</div>
              <div className="audit-stat-value">{securityCount}</div>
            </div>

            <div className="audit-stat">
              <div className="audit-stat-label">Critical events</div>
              <div className="audit-stat-value">{criticalCount}</div>
            </div>
          </div>

          <div className="audit-toolbar">
            <input
              className="audit-search"
              type="search"
              placeholder="Search by ID, user, action or target..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="audit-filter"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="All">All categories</option>
              <option value="Businesses">Businesses</option>
              <option value="Subscriptions">Subscriptions</option>
              <option value="Settings">Settings</option>
              <option value="Support">Support</option>
              <option value="Security">Security</option>
              <option value="Analytics">Analytics</option>
            </select>

            <select
              className="audit-filter"
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
            >
              <option value="All">All severity levels</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="audit-table-card">
            <div className="audit-table-scroll">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>Date & Time</th>
                    <th>Details</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className="audit-id">{log.id}</span>
                      </td>

                      <td>
                        <strong>{log.actor}</strong>
                        <span className="audit-subtext">{log.role}</span>
                      </td>

                      <td>
                        <span className="audit-action">{log.action}</span>
                        <span className="audit-subtext">{log.target}</span>
                      </td>

                      <td>{log.category}</td>

                      <td>
                        <span
                          className={`audit-badge ${
                            severityClass[log.severity]
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>

                      <td>
                        {log.date}
                        <span className="audit-subtext">{log.time}</span>
                      </td>

                      <td>
                        <button
                          className="audit-view-button"
                          onClick={() => setSelectedLog(log)}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredLogs.length === 0 && (
                <div className="audit-empty">
                  No activity records match your filters.
                </div>
              )}
            </div>
          </div>

          <p
            style={{
              marginTop: 15,
              color: "var(--text-muted)",
              fontSize: 10,
              textAlign: "center",
            }}
          >
            Frontend preview — these are illustrative records, not actual
            platform audit events.
          </p>
        </section>
      </main>

      {selectedLog && (
        <div
          className="audit-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedLog(null);
            }
          }}
        >
          <section className="audit-modal">
            <div className="audit-modal-header">
              <div>
                <h2>Activity details</h2>
                <p>{selectedLog.id}</p>
              </div>

              <button
                className="audit-close"
                onClick={() => setSelectedLog(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            <div className="audit-modal-body">
              {[
                ["Actor", selectedLog.actor],
                ["Email", selectedLog.email],
                ["Role", selectedLog.role],
                ["Action", selectedLog.action],
                ["Category", selectedLog.category],
                ["Target", selectedLog.target],
                ["Severity", selectedLog.severity],
                ["IP address", selectedLog.ip],
                ["Date", selectedLog.date],
                ["Time", selectedLog.time],
              ].map(([label, value]) => (
                <div className="audit-detail-row" key={label}>
                  <span className="audit-detail-label">{label}</span>
                  <span className="audit-detail-value">{value}</span>
                </div>
              ))}

              <div className="audit-description">
                <strong>Description</strong>
                <br />
                {selectedLog.description}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default SuperAdminAuditLogs;
