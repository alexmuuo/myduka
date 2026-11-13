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

const initialTickets = [
  {
    id: "TKT-1048",
    subject: "Unable to add products to inventory",
    requester: "James Mwangi",
    email: "james@example.com",
    business: "Agro Supplies",
    category: "Inventory",
    priority: "High",
    status: "Open",
    date: "Nov 13, 2026",
    description:
      "I am trying to add new products to my inventory, but the system keeps showing an error after I submit the product form. This is affecting our daily stock updates.",
    replies: [
      {
        sender: "James Mwangi",
        message:
          "The problem started this morning. I have tried refreshing the page but it is still happening.",
        date: "10:20 AM",
      },
    ],
  },
  {
    id: "TKT-1047",
    subject: "How do I upgrade my subscription?",
    requester: "Mary Wanjiku",
    email: "mary@example.com",
    business: "Beauty Haven",
    category: "Billing",
    priority: "Medium",
    status: "In Progress",
    date: "Nov 12, 2026",
    description:
      "I would like to upgrade from the Starter plan to the Professional plan. Please guide me through the process.",
    replies: [
      {
        sender: "Support Team",
        message:
          "Thank you for reaching out. We are checking your subscription options.",
        date: "Yesterday",
      },
    ],
  },
  {
    id: "TKT-1046",
    subject: "Cashier cannot log in",
    requester: "Peter Otieno",
    email: "peter@example.com",
    business: "City Mart",
    category: "Account Access",
    priority: "Urgent",
    status: "Open",
    date: "Nov 12, 2026",
    description:
      "One of our cashiers cannot access the POS after entering the correct login credentials. We need assistance because the shop is currently operating.",
    replies: [],
  },
  {
    id: "TKT-1045",
    subject: "Request for business profile update",
    requester: "Grace Njeri",
    email: "grace@example.com",
    business: "Grace Fashion",
    category: "Account",
    priority: "Low",
    status: "Resolved",
    date: "Nov 11, 2026",
    description:
      "I need help updating the business contact information displayed on my storefront.",
    replies: [
      {
        sender: "Support Team",
        message: "Your business profile information has been updated.",
        date: "Nov 11, 2026",
      },
    ],
  },
  {
    id: "TKT-1044",
    subject: "Payment confirmation not appearing",
    requester: "David Kamau",
    email: "david@example.com",
    business: "Tech World",
    category: "Payments",
    priority: "High",
    status: "In Progress",
    date: "Nov 10, 2026",
    description:
      "A customer completed a payment, but the transaction is not appearing in our business dashboard.",
    replies: [],
  },
];

const statusClass = {
  Open: "support-status-open",
  "In Progress": "support-status-progress",
  Resolved: "support-status-resolved",
  Closed: "support-status-closed",
};

const priorityClass = {
  Urgent: "support-priority-urgent",
  High: "support-priority-high",
  Medium: "support-priority-medium",
  Low: "support-priority-low",
};

function SuperAdminSupport() {
  const [tickets, setTickets] = useState(initialTickets);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const term = search.toLowerCase();

      const matchesSearch =
        ticket.id.toLowerCase().includes(term) ||
        ticket.subject.toLowerCase().includes(term) ||
        ticket.requester.toLowerCase().includes(term) ||
        ticket.business.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "All" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const stats = {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "Open").length,
    progress: tickets.filter((ticket) => ticket.status === "In Progress").length,
    resolved: tickets.filter((ticket) => ticket.status === "Resolved").length,
  };

  function updateTicketStatus(ticketId, status) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status } : ticket
      )
    );

    setSelectedTicket((current) =>
      current?.id === ticketId ? { ...current, status } : current
    );
  }

  function sendReply() {
    if (!reply.trim() || !selectedTicket) return;

    const newReply = {
      sender: "Support Team",
      message: reply.trim(),
      date: new Date().toLocaleString("en-KE", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    };

    const updatedTicket = {
      ...selectedTicket,
      replies: [...selectedTicket.replies, newReply],
      status:
        selectedTicket.status === "Open"
          ? "In Progress"
          : selectedTicket.status,
    };

    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === selectedTicket.id ? updatedTicket : ticket
      )
    );

    setSelectedTicket(updatedTicket);
    setReply("");
  }

  return (
    <div className="super-support-layout">
      <style>{`
        .super-support-layout {
          min-height: 100vh;
          display: flex;
          background: var(--background);
          color: var(--text-primary);
          font-family: var(--font-family, Inter, sans-serif);
        }

        .support-sidebar {
          width: 250px;
          flex-shrink: 0;
          min-height: 100vh;
          padding: 25px 16px;
          display: flex;
          flex-direction: column;
          background: var(--sidebar-bg, #111827);
          color: #f8fafc;
        }

        .support-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px 30px;
          margin-bottom: 25px;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .support-brand-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #2563eb;
          font-size: 19px;
          font-weight: 800;
        }

        .support-brand strong {
          display: block;
          font-size: 17px;
        }

        .support-brand small {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
          letter-spacing: 1.2px;
        }

        .support-nav-label {
          padding: 0 12px;
          margin-bottom: 12px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .support-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .support-nav a {
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

        .support-nav a:hover,
        .support-nav a.active {
          color: #fff;
          background: rgba(59,130,246,.19);
        }

        .support-nav a.active {
          box-shadow: inset 3px 0 #60a5fa;
        }

        .support-nav-icon {
          width: 20px;
          text-align: center;
          font-size: 17px;
        }

        .support-sidebar-bottom {
          margin-top: auto;
          padding: 18px 11px 0;
          border-top: 1px solid rgba(255,255,255,.1);
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.7;
        }

        .support-main {
          flex: 1;
          min-width: 0;
        }

        .support-topbar {
          min-height: 70px;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }

        .support-topbar h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
        }

        .support-topbar p {
          margin: 3px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .support-admin {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .support-avatar {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          font-weight: 800;
        }

        .support-content {
          max-width: 1500px;
          padding: 32px;
          margin: 0 auto;
        }

        .support-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 25px;
        }

        .support-heading h1 {
          margin: 0;
          font-size: clamp(23px, 3vw, 29px);
          font-weight: 800;
          letter-spacing: -1px;
        }

        .support-heading p {
          margin: 8px 0 0;
          color: var(--text-muted);
          font-size: 13px;
        }

        .support-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .support-stat {
          padding: 19px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 14px);
          background: var(--surface);
        }

        .support-stat-label {
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 600;
        }

        .support-stat-value {
          margin-top: 12px;
          font-size: 26px;
          font-weight: 850;
        }

        .support-toolbar {
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

        .support-search {
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

        .support-search:focus,
        .support-filter:focus,
        .support-reply-input:focus {
          border-color: var(--primary);
        }

        .support-filter {
          min-height: 39px;
          padding: 8px 11px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--background);
          color: var(--text-primary);
          font-size: 11px;
          outline: none;
        }

        .support-table-card {
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: var(--surface);
        }

        .support-table-scroll {
          overflow-x: auto;
        }

        .support-table {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
        }

        .support-table th {
          padding: 14px 15px;
          background: var(--surface-secondary);
          color: var(--text-muted);
          text-align: left;
          font-size: 9px;
          letter-spacing: .7px;
          text-transform: uppercase;
        }

        .support-table td {
          padding: 15px;
          border-top: 1px solid var(--border);
          font-size: 11px;
        }

        .support-table tbody tr:hover {
          background: var(--surface-hover);
        }

        .support-ticket-id {
          color: var(--primary);
          font-weight: 800;
        }

        .support-ticket-subject {
          display: block;
          font-size: 11px;
          font-weight: 800;
        }

        .support-ticket-meta {
          display: block;
          margin-top: 4px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .support-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .support-status-open {
          color: #2563eb;
          background: rgba(59,130,246,.12);
        }

        .support-status-progress {
          color: #b45309;
          background: rgba(245,158,11,.14);
        }

        .support-status-resolved {
          color: #15803d;
          background: rgba(34,197,94,.13);
        }

        .support-status-closed {
          color: var(--text-muted);
          background: var(--surface-secondary);
        }

        .support-priority-urgent {
          color: #dc2626;
          background: rgba(239,68,68,.12);
        }

        .support-priority-high {
          color: #ea580c;
          background: rgba(249,115,22,.12);
        }

        .support-priority-medium {
          color: #b45309;
          background: rgba(245,158,11,.13);
        }

        .support-priority-low {
          color: #15803d;
          background: rgba(34,197,94,.12);
        }

        .support-view-button {
          padding: 7px 11px;
          border: 1px solid var(--border);
          border-radius: 7px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
        }

        .support-view-button:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .support-empty {
          padding: 45px 20px;
          color: var(--text-muted);
          text-align: center;
          font-size: 12px;
        }

        .support-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(15,23,42,.62);
        }

        .support-modal {
          width: 100%;
          max-width: 690px;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid var(--border);
          border-radius: 15px;
          background: var(--surface);
          box-shadow: 0 25px 80px rgba(0,0,0,.25);
        }

        .support-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          padding: 21px;
          border-bottom: 1px solid var(--border);
        }

        .support-modal-header h2 {
          margin: 0;
          font-size: 17px;
        }

        .support-modal-header p {
          margin: 6px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .support-close {
          width: 31px;
          height: 31px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 17px;
        }

        .support-modal-body {
          padding: 21px;
        }

        .support-details-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .support-detail-label {
          display: block;
          margin-bottom: 5px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .support-detail-value {
          font-size: 12px;
          font-weight: 700;
        }

        .support-description {
          padding: 15px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface-secondary);
          font-size: 12px;
          line-height: 1.7;
        }

        .support-modal-section-title {
          margin: 23px 0 12px;
          font-size: 12px;
          font-weight: 800;
        }

        .support-reply {
          padding: 12px;
          margin-bottom: 9px;
          border: 1px solid var(--border);
          border-radius: 9px;
          font-size: 11px;
          line-height: 1.6;
        }

        .support-reply strong {
          display: block;
          margin-bottom: 4px;
        }

        .support-reply small {
          display: block;
          margin-top: 6px;
          color: var(--text-muted);
        }

        .support-reply-input {
          width: 100%;
          min-height: 95px;
          padding: 12px;
          resize: vertical;
          border: 1px solid var(--border);
          border-radius: 9px;
          background: var(--background);
          color: var(--text-primary);
          outline: none;
          font: inherit;
          font-size: 12px;
        }

        .support-modal-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 15px;
        }

        .support-status-select {
          min-height: 38px;
          padding: 8px 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          font-size: 11px;
        }

        .support-send-button {
          min-height: 38px;
          padding: 9px 16px;
          border: 0;
          border-radius: 8px;
          background: var(--primary);
          color: white;
          cursor: pointer;
          font-size: 11px;
          font-weight: 800;
        }

        .support-send-button:disabled {
          cursor: not-allowed;
          opacity: .5;
        }

        .support-mobile-menu {
          display: none;
          padding: 7px 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
        }

        @media (max-width: 1000px) {
          .support-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .support-sidebar {
            position: fixed;
            z-index: 100;
            top: 0;
            bottom: 0;
            left: 0;
            width: 260px;
            transform: translateX(-100%);
            transition: transform .25s ease;
          }

          .support-sidebar.open {
            transform: translateX(0);
          }

          .support-sidebar-overlay.visible {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 90;
            background: rgba(15,23,42,.55);
          }

          .support-mobile-menu {
            display: inline-flex;
          }

          .support-topbar {
            padding: 0 16px;
          }

          .support-content {
            padding: 22px 15px;
          }
        }

        @media (max-width: 480px) {
          .support-stats {
            gap: 10px;
          }

          .support-stat {
            padding: 14px;
          }

          .support-stat-value {
            font-size: 22px;
          }

          .support-admin span:last-child {
            display: none;
          }

          .support-details-grid {
            grid-template-columns: 1fr;
          }

          .support-modal-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .support-status-select,
          .support-send-button {
            width: 100%;
          }
        }
      `}</style>

      <aside className={`support-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="support-brand">
          <div className="support-brand-icon">M</div>
          <div>
            <strong>MyDuka</strong>
            <small>PLATFORM ADMIN</small>
          </div>
        </div>

        <div className="support-nav-label">Platform</div>

        <nav className="support-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="support-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="support-sidebar-bottom">
          <strong>MyDuka Platform</strong>
          <br />
          Super Administration
          <br />
          © 2026 MyDuka
        </div>
      </aside>

      <div
        className={`support-sidebar-overlay ${
          sidebarOpen ? "visible" : ""
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="support-main">
        <header className="support-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <button
              className="support-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <h2>Support Management</h2>
              <p>Manage platform support requests</p>
            </div>
          </div>

          <div className="support-admin">
            <div className="support-avatar">SA</div>
            <span>Super Administrator</span>
          </div>
        </header>

        <section className="support-content">
          <div className="support-heading">
            <div>
              <h1>Support Centre</h1>
              <p>
                Review requests, respond to users and track support resolution.
              </p>
            </div>
          </div>

          <div className="support-stats">
            <div className="support-stat">
              <div className="support-stat-label">Total tickets</div>
              <div className="support-stat-value">{stats.total}</div>
            </div>

            <div className="support-stat">
              <div className="support-stat-label">Open tickets</div>
              <div className="support-stat-value">{stats.open}</div>
            </div>

            <div className="support-stat">
              <div className="support-stat-label">In progress</div>
              <div className="support-stat-value">{stats.progress}</div>
            </div>

            <div className="support-stat">
              <div className="support-stat-label">Resolved tickets</div>
              <div className="support-stat-value">{stats.resolved}</div>
            </div>
          </div>

          <div className="support-toolbar">
            <input
              className="support-search"
              type="search"
              placeholder="Search tickets, users or businesses..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="support-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              className="support-filter"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="All">All priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="support-table-card">
            <div className="support-table-scroll">
              <table className="support-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Subject</th>
                    <th>Requester</th>
                    <th>Business</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <span className="support-ticket-id">
                          {ticket.id}
                        </span>
                      </td>

                      <td>
                        <span className="support-ticket-subject">
                          {ticket.subject}
                        </span>
                        <span className="support-ticket-meta">
                          {ticket.category}
                        </span>
                      </td>

                      <td>{ticket.requester}</td>
                      <td>{ticket.business}</td>

                      <td>
                        <span
                          className={`support-badge ${
                            priorityClass[ticket.priority]
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`support-badge ${
                            statusClass[ticket.status]
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>

                      <td>{ticket.date}</td>

                      <td>
                        <button
                          className="support-view-button"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setReply("");
                          }}
                        >
                          View ticket
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredTickets.length === 0 && (
                <div className="support-empty">
                  No support tickets match your search.
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
            Frontend preview — ticket records and replies are sample data.
            Changes are temporary and will reset when the page reloads.
          </p>
        </section>
      </main>

      {selectedTicket && (
        <div
          className="support-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedTicket(null);
            }
          }}
        >
          <section className="support-modal">
            <div className="support-modal-header">
              <div>
                <h2>{selectedTicket.subject}</h2>
                <p>
                  {selectedTicket.id} · Submitted {selectedTicket.date}
                </p>
              </div>

              <button
                className="support-close"
                onClick={() => setSelectedTicket(null)}
                aria-label="Close ticket"
              >
                ×
              </button>
            </div>

            <div className="support-modal-body">
              <div className="support-details-grid">
                <div>
                  <span className="support-detail-label">Requester</span>
                  <span className="support-detail-value">
                    {selectedTicket.requester}
                  </span>
                </div>

                <div>
                  <span className="support-detail-label">Email</span>
                  <span className="support-detail-value">
                    {selectedTicket.email}
                  </span>
                </div>

                <div>
                  <span className="support-detail-label">Business</span>
                  <span className="support-detail-value">
                    {selectedTicket.business}
                  </span>
                </div>

                <div>
                  <span className="support-detail-label">Category</span>
                  <span className="support-detail-value">
                    {selectedTicket.category}
                  </span>
                </div>

                <div>
                  <span className="support-detail-label">Priority</span>
                  <span
                    className={`support-badge ${
                      priorityClass[selectedTicket.priority]
                    }`}
                  >
                    {selectedTicket.priority}
                  </span>
                </div>

                <div>
                  <span className="support-detail-label">Status</span>
                  <span
                    className={`support-badge ${
                      statusClass[selectedTicket.status]
                    }`}
                  >
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              <span className="support-detail-label">
                Ticket description
              </span>

              <div className="support-description">
                {selectedTicket.description}
              </div>

              <h3 className="support-modal-section-title">
                Conversation ({selectedTicket.replies.length})
              </h3>

              {selectedTicket.replies.length === 0 && (
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 11,
                  }}
                >
                  No replies yet. Send the first response below.
                </p>
              )}

              {selectedTicket.replies.map((item, index) => (
                <div className="support-reply" key={index}>
                  <strong>{item.sender}</strong>
                  {item.message}
                  <small>{item.date}</small>
                </div>
              ))}

              <h3 className="support-modal-section-title">
                Send a response
              </h3>

              <textarea
                className="support-reply-input"
                placeholder="Write your response..."
                value={reply}
                onChange={(event) => setReply(event.target.value)}
              />

              <div className="support-modal-actions">
                <select
                  className="support-status-select"
                  value={selectedTicket.status}
                  onChange={(event) =>
                    updateTicketStatus(
                      selectedTicket.id,
                      event.target.value
                    )
                  }
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>

                <button
                  className="support-send-button"
                  onClick={sendReply}
                  disabled={!reply.trim()}
                >
                  Send response
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default SuperAdminSupport;
