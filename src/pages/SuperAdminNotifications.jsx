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

const initialNotifications = [
  {
    id: 1,
    title: "New business registration",
    message:
      "FreshMart Supermarket has registered on MyDuka and is awaiting platform review.",
    category: "Business",
    priority: "Normal",
    date: "2026-11-13T09:45:00",
    read: false,
    icon: "▦",
  },
  {
    id: 2,
    title: "Subscription activated",
    message:
      "A new Professional subscription has been activated for Urban Styles Boutique.",
    category: "Subscription",
    priority: "Normal",
    date: "2026-11-13T08:30:00",
    read: false,
    icon: "▤",
  },
  {
    id: 3,
    title: "Security alert",
    message:
      "Multiple unsuccessful login attempts were detected on a platform administrator account.",
    category: "Security",
    priority: "High",
    date: "2026-11-12T16:20:00",
    read: false,
    icon: "♢",
  },
  {
    id: 4,
    title: "Subscription expiring soon",
    message:
      "The Starter subscription for Green Valley Agrovet is approaching its renewal date.",
    category: "Subscription",
    priority: "Normal",
    date: "2026-11-12T11:15:00",
    read: true,
    icon: "▤",
  },
  {
    id: 5,
    title: "New support ticket",
    message:
      "A business owner has submitted a support request regarding inventory management.",
    category: "Support",
    priority: "Normal",
    date: "2026-11-11T14:10:00",
    read: true,
    icon: "✉",
  },
  {
    id: 6,
    title: "Platform maintenance notice",
    message:
      "A scheduled platform maintenance window has been added to the system calendar.",
    category: "System",
    priority: "Low",
    date: "2026-11-10T10:00:00",
    read: true,
    icon: "⚙",
  },
  {
    id: 7,
    title: "Business suspended",
    message:
      "A business account has been suspended following a platform policy review.",
    category: "Business",
    priority: "High",
    date: "2026-11-09T13:40:00",
    read: true,
    icon: "▦",
  },
];

const categoryColors = {
  Business: "blue",
  Subscription: "purple",
  Security: "red",
  Support: "orange",
  System: "gray",
};

function formatDate(date) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function SuperAdminNotifications() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState("All");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const highPriorityCount = notifications.filter(
    (item) => item.priority === "High" && !item.read
  ).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchesStatus =
        filter === "All" ||
        (filter === "Unread" && !item.read) ||
        (filter === "Read" && item.read);

      const matchesCategory =
        category === "All" || item.category === category;

      const searchText =
        `${item.title} ${item.message} ${item.category}`.toLowerCase();

      return (
        matchesStatus &&
        matchesCategory &&
        searchText.includes(search.toLowerCase())
      );
    });
  }, [notifications, filter, category, search]);

  function markAsRead(id) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );

    setSelected((current) =>
      current?.id === id ? { ...current, read: true } : current
    );
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true }))
    );

    setSelected((current) =>
      current ? { ...current, read: true } : null
    );
  }

  function deleteNotification(id) {
    setNotifications((current) =>
      current.filter((item) => item.id !== id)
    );
    setSelected(null);
  }

  function clearAll() {
    if (!window.confirm("Clear all notifications? This cannot be undone.")) {
      return;
    }

    setNotifications([]);
    setSelected(null);
  }

  function openNotification(item) {
    setSelected(item);
    markAsRead(item.id);
  }

  return (
    <div className="sa-notifications-layout">
      <style>{`
        .sa-notifications-layout {
          min-height: 100vh;
          display: flex;
          background: var(--background);
          color: var(--text-primary);
          font-family: var(--font-family, Inter, sans-serif);
        }

        .sa-notifications-sidebar {
          width: 250px;
          flex-shrink: 0;
          min-height: 100vh;
          padding: 25px 16px;
          display: flex;
          flex-direction: column;
          background: var(--sidebar-bg, #111827);
          color: white;
        }

        .sa-notifications-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px 28px;
          margin-bottom: 25px;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .sa-notifications-brand-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #2563eb;
          font-size: 19px;
          font-weight: 800;
        }

        .sa-notifications-brand strong {
          display: block;
          font-size: 17px;
        }

        .sa-notifications-brand small {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
          letter-spacing: 1.2px;
        }

        .sa-notifications-nav-label {
          padding: 0 12px;
          margin-bottom: 12px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .sa-notifications-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .sa-notifications-nav a {
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

        .sa-notifications-nav a:hover,
        .sa-notifications-nav a.active {
          color: white;
          background: rgba(59,130,246,.19);
        }

        .sa-notifications-nav a.active {
          box-shadow: inset 3px 0 #60a5fa;
        }

        .sa-notifications-nav-icon {
          width: 20px;
          text-align: center;
          font-size: 17px;
        }

        .sa-notifications-sidebar-footer {
          margin-top: auto;
          padding: 18px 11px 0;
          border-top: 1px solid rgba(255,255,255,.1);
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.7;
        }

        .sa-notifications-main {
          flex: 1;
          min-width: 0;
        }

        .sa-notifications-topbar {
          min-height: 70px;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }

        .sa-notifications-topbar h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 750;
        }

        .sa-notifications-topbar p {
          margin: 4px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .sa-notifications-admin {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .sa-notifications-avatar {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          font-weight: 800;
        }

        .sa-notifications-content {
          max-width: 1250px;
          padding: 32px;
          margin: 0 auto;
        }

        .sa-notifications-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 24px;
        }

        .sa-notifications-heading h1 {
          margin: 0;
          font-size: clamp(23px, 3vw, 29px);
          font-weight: 800;
          letter-spacing: -1px;
        }

        .sa-notifications-heading p {
          margin: 8px 0 0;
          color: var(--text-muted);
          font-size: 13px;
        }

        .sa-notifications-heading-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .sa-notifications-button {
          min-height: 38px;
          padding: 9px 13px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 10px;
          font-weight: 750;
        }

        .sa-notifications-button:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .sa-notifications-button.danger:hover {
          border-color: #ef4444;
          color: #ef4444;
        }

        .sa-notifications-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 23px;
        }

        .sa-notifications-stat {
          padding: 18px;
          border: 1px solid var(--border);
          border-radius: 11px;
          background: var(--surface);
        }

        .sa-notifications-stat-label {
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 700;
        }

        .sa-notifications-stat-value {
          margin-top: 9px;
          font-size: 25px;
          font-weight: 850;
        }

        .sa-notifications-stat-note {
          margin-top: 5px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .sa-notifications-workspace {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 18px;
          align-items: start;
        }

        .sa-notifications-list-panel,
        .sa-notifications-detail {
          min-width: 0;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
        }

        .sa-notifications-list-header {
          padding: 18px;
          border-bottom: 1px solid var(--border);
        }

        .sa-notifications-list-header h2 {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
        }

        .sa-notifications-list-header p {
          margin: 5px 0 15px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .sa-notifications-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .sa-notifications-search {
          flex: 1;
          min-width: 160px;
          min-height: 37px;
          padding: 8px 11px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--background);
          color: var(--text-primary);
          outline: none;
          font-size: 11px;
        }

        .sa-notifications-select {
          min-height: 37px;
          padding: 7px 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--background);
          color: var(--text-primary);
          font-size: 10px;
          outline: none;
        }

        .sa-notifications-filter-tabs {
          display: flex;
          gap: 5px;
          margin-top: 13px;
        }

        .sa-notifications-filter-tab {
          padding: 7px 12px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 10px;
          font-weight: 750;
        }

        .sa-notifications-filter-tab.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .sa-notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background .2s;
        }

        .sa-notification-item:last-child {
          border-bottom: 0;
        }

        .sa-notification-item:hover {
          background: var(--surface-hover);
        }

        .sa-notification-item.selected {
          background: var(--primary-light);
        }

        .sa-notification-item.unread {
          background: color-mix(in srgb, var(--primary-light) 35%, var(--surface));
        }

        .sa-notification-icon {
          width: 39px;
          height: 39px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: var(--surface-secondary);
          color: var(--primary);
          font-size: 17px;
        }

        .sa-notification-body {
          flex: 1;
          min-width: 0;
        }

        .sa-notification-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
        }

        .sa-notification-title {
          font-size: 11px;
          font-weight: 800;
        }

        .sa-notification-unread-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--primary);
        }

        .sa-notification-message {
          margin: 6px 0 8px;
          color: var(--text-secondary);
          font-size: 10px;
          line-height: 1.55;
        }

        .sa-notification-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          color: var(--text-muted);
          font-size: 9px;
        }

        .sa-notification-tag {
          padding: 4px 7px;
          border-radius: 5px;
          font-size: 9px;
          font-weight: 800;
        }

        .sa-notification-tag.blue {
          background: rgba(59,130,246,.12);
          color: #3b82f6;
        }

        .sa-notification-tag.purple {
          background: rgba(139,92,246,.12);
          color: #8b5cf6;
        }

        .sa-notification-tag.red {
          background: rgba(239,68,68,.12);
          color: #ef4444;
        }

        .sa-notification-tag.orange {
          background: rgba(249,115,22,.12);
          color: #f97316;
        }

        .sa-notification-tag.gray {
          background: var(--surface-secondary);
          color: var(--text-secondary);
        }

        .sa-notification-empty {
          padding: 45px 20px;
          color: var(--text-muted);
          text-align: center;
          font-size: 12px;
        }

        .sa-notification-empty-icon {
          margin-bottom: 12px;
          font-size: 30px;
        }

        .sa-notifications-detail {
          position: sticky;
          top: 20px;
          padding: 19px;
        }

        .sa-notifications-detail h2 {
          margin: 0 0 13px;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.5;
        }

        .sa-notifications-detail-message {
          margin: 18px 0;
          color: var(--text-secondary);
          font-size: 11px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .sa-notifications-detail-meta {
          display: flex;
          flex-direction: column;
          gap: 13px;
          padding: 15px 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .sa-notifications-detail-meta div {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 10px;
        }

        .sa-notifications-detail-meta span:first-child {
          color: var(--text-muted);
        }

        .sa-notifications-detail-meta span:last-child {
          font-weight: 700;
          text-align: right;
        }

        .sa-notifications-detail-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 17px;
        }

        .sa-notifications-detail-actions button {
          width: 100%;
        }

        .sa-notifications-mobile-menu {
          display: none;
          padding: 7px 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
        }

        @media (max-width: 1100px) {
          .sa-notifications-workspace {
            grid-template-columns: minmax(0, 1fr);
          }

          .sa-notifications-detail {
            position: static;
          }
        }

        @media (max-width: 760px) {
          .sa-notifications-sidebar {
            position: fixed;
            z-index: 100;
            top: 0;
            bottom: 0;
            left: 0;
            width: 260px;
            transform: translateX(-100%);
            transition: transform .25s ease;
          }

          .sa-notifications-sidebar.open {
            transform: translateX(0);
          }

          .sa-notifications-sidebar-overlay.visible {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 90;
            background: rgba(15,23,42,.55);
          }

          .sa-notifications-mobile-menu {
            display: inline-flex;
          }

          .sa-notifications-topbar {
            padding: 0 16px;
          }

          .sa-notifications-content {
            padding: 22px 15px;
          }

          .sa-notifications-stats {
            gap: 9px;
          }

          .sa-notifications-stat {
            padding: 13px;
          }

          .sa-notifications-stat-value {
            font-size: 21px;
          }
        }

        @media (max-width: 520px) {
          .sa-notifications-stats {
            grid-template-columns: 1fr;
          }

          .sa-notifications-heading-actions {
            width: 100%;
          }

          .sa-notifications-heading-actions button {
            flex: 1;
          }

          .sa-notifications-list-header {
            padding: 14px;
          }

          .sa-notifications-filters {
            flex-direction: column;
          }

          .sa-notifications-search,
          .sa-notifications-select {
            width: 100%;
          }

          .sa-notification-item {
            padding: 14px;
          }

          .sa-notifications-admin span:last-child {
            display: none;
          }
        }
      `}</style>

      <aside className={`sa-notifications-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sa-notifications-brand">
          <div className="sa-notifications-brand-icon">M</div>
          <div>
            <strong>MyDuka</strong>
            <small>PLATFORM ADMIN</small>
          </div>
        </div>

        <div className="sa-notifications-nav-label">Platform</div>

        <nav className="sa-notifications-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="sa-notifications-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sa-notifications-sidebar-footer">
          <strong>MyDuka Platform</strong>
          <br />
          Super Administration
          <br />
          © 2026 MyDuka
        </div>
      </aside>

      <div
        className={`sa-notifications-sidebar-overlay ${
          sidebarOpen ? "visible" : ""
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="sa-notifications-main">
        <header className="sa-notifications-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <button
              className="sa-notifications-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <h2>Notifications</h2>
              <p>Platform alerts and administrative updates</p>
            </div>
          </div>

          <div className="sa-notifications-admin">
            <div className="sa-notifications-avatar">SA</div>
            <span>Super Administrator</span>
          </div>
        </header>

        <section className="sa-notifications-content">
          <div className="sa-notifications-heading">
            <div>
              <h1>Notifications</h1>
              <p>Stay informed about activity across the MyDuka platform.</p>
            </div>

            <div className="sa-notifications-heading-actions">
              <button
                className="sa-notifications-button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                ✓ Mark all as read
              </button>

              <button
                className="sa-notifications-button danger"
                onClick={clearAll}
                disabled={notifications.length === 0}
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="sa-notifications-stats">
            <div className="sa-notifications-stat">
              <div className="sa-notifications-stat-label">
                TOTAL NOTIFICATIONS
              </div>
              <div className="sa-notifications-stat-value">
                {notifications.length}
              </div>
              <div className="sa-notifications-stat-note">
                All platform notifications
              </div>
            </div>

            <div className="sa-notifications-stat">
              <div className="sa-notifications-stat-label">
                UNREAD NOTIFICATIONS
              </div>
              <div className="sa-notifications-stat-value">
                {unreadCount}
              </div>
              <div className="sa-notifications-stat-note">
                Awaiting your attention
              </div>
            </div>

            <div className="sa-notifications-stat">
              <div className="sa-notifications-stat-label">
                HIGH PRIORITY UNREAD
              </div>
              <div className="sa-notifications-stat-value">
                {highPriorityCount}
              </div>
              <div className="sa-notifications-stat-note">
                Important alerts requiring review
              </div>
            </div>
          </div>

          <div className="sa-notifications-workspace">
            <section className="sa-notifications-list-panel">
              <div className="sa-notifications-list-header">
                <h2>All activity</h2>
                <p>
                  {filteredNotifications.length} notification
                  {filteredNotifications.length === 1 ? "" : "s"} displayed
                </p>

                <div className="sa-notifications-filters">
                  <input
                    className="sa-notifications-search"
                    placeholder="Search notifications..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  <select
                    className="sa-notifications-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="All">All categories</option>
                    <option value="Business">Business</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Security">Security</option>
                    <option value="Support">Support</option>
                    <option value="System">System</option>
                  </select>
                </div>

                <div className="sa-notifications-filter-tabs">
                  {["All", "Unread", "Read"].map((item) => (
                    <button
                      key={item}
                      className={`sa-notifications-filter-tab ${
                        filter === item ? "active" : ""
                      }`}
                      onClick={() => setFilter(item)}
                    >
                      {item}
                      {item === "Unread" ? ` (${unreadCount})` : ""}
                    </button>
                  ))}
                </div>
              </div>

              {filteredNotifications.length === 0 ? (
                <div className="sa-notification-empty">
                  <div className="sa-notification-empty-icon">♧</div>
                  <strong>No notifications found</strong>
                  <p>Try changing your filters or search term.</p>
                </div>
              ) : (
                filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    className={`sa-notification-item ${
                      !item.read ? "unread" : ""
                    } ${selected?.id === item.id ? "selected" : ""}`}
                    onClick={() => openNotification(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openNotification(item);
                      }
                    }}
                  >
                    <div className="sa-notification-icon">{item.icon}</div>

                    <div className="sa-notification-body">
                      <div className="sa-notification-title-row">
                        <span className="sa-notification-title">
                          {item.title}
                        </span>

                        {!item.read && (
                          <span className="sa-notification-unread-dot" />
                        )}
                      </div>

                      <p className="sa-notification-message">
                        {item.message}
                      </p>

                      <div className="sa-notification-meta">
                        <span
                          className={`sa-notification-tag ${
                            categoryColors[item.category]
                          }`}
                        >
                          {item.category}
                        </span>
                        <span>{formatDate(item.date)}</span>
                        <span>{item.priority} priority</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>

            <aside className="sa-notifications-detail">
              {selected ? (
                <>
                  <div
                    className="sa-notification-icon"
                    style={{ marginBottom: 15 }}
                  >
                    {selected.icon}
                  </div>

                  <h2>{selected.title}</h2>

                  <span
                    className={`sa-notification-tag ${
                      categoryColors[selected.category]
                    }`}
                  >
                    {selected.category}
                  </span>

                  <p className="sa-notifications-detail-message">
                    {selected.message}
                  </p>

                  <div className="sa-notifications-detail-meta">
                    <div>
                      <span>Date</span>
                      <span>{formatDate(selected.date)}</span>
                    </div>

                    <div>
                      <span>Category</span>
                      <span>{selected.category}</span>
                    </div>

                    <div>
                      <span>Priority</span>
                      <span>{selected.priority}</span>
                    </div>

                    <div>
                      <span>Status</span>
                      <span>{selected.read ? "Read" : "Unread"}</span>
                    </div>
                  </div>

                  <div className="sa-notifications-detail-actions">
                    {!selected.read && (
                      <button
                        className="sa-notifications-button"
                        onClick={() => markAsRead(selected.id)}
                      >
                        ✓ Mark as read
                      </button>
                    )}

                    <button
                      className="sa-notifications-button danger"
                      onClick={() => deleteNotification(selected.id)}
                    >
                      Delete notification
                    </button>

                    <button
                      className="sa-notifications-button"
                      onClick={() => setSelected(null)}
                    >
                      Close details
                    </button>
                  </div>
                </>
              ) : (
                <div className="sa-notification-empty">
                  <div className="sa-notification-empty-icon">♧</div>
                  <strong>Notification details</strong>
                  <p>Select a notification to view its full details.</p>
                </div>
              )}
            </aside>
          </div>

          <p
            style={{
              marginTop: 18,
              color: "var(--text-muted)",
              fontSize: 10,
              textAlign: "center",
            }}
          >
            Frontend preview — notifications currently use sample data.
            Live platform alerts will be connected during backend integration.
          </p>
        </section>
      </main>
    </div>
  );
}

export default SuperAdminNotifications;
