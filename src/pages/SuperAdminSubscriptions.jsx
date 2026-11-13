import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

const initialSubscriptions = [
  {
    id: "SUB-001",
    business: "FreshMart Supermarket",
    owner: "John Mwangi",
    plan: "Professional",
    amount: 2500,
    billing: "Monthly",
    status: "Active",
    start: "2026-10-12",
    renewal: "2026-11-12",
  },
  {
    id: "SUB-002",
    business: "Urban Fashion",
    owner: "Mary Wanjiku",
    plan: "Starter",
    amount: 900,
    billing: "Monthly",
    status: "Active",
    start: "2026-10-18",
    renewal: "2026-11-18",
  },
  {
    id: "SUB-003",
    business: "HealthPlus Pharmacy",
    owner: "Peter Otieno",
    plan: "Enterprise",
    amount: 5000,
    billing: "Monthly",
    status: "Active",
    start: "2026-10-21",
    renewal: "2026-11-21",
  },
  {
    id: "SUB-004",
    business: "The Bottle Store",
    owner: "David Kamau",
    plan: "Professional",
    amount: 2500,
    billing: "Monthly",
    status: "Suspended",
    start: "2026-10-25",
    renewal: "2026-11-25",
  },
  {
    id: "SUB-005",
    business: "TechZone Electronics",
    owner: "Grace Achieng",
    plan: "Starter",
    amount: 900,
    billing: "Monthly",
    status: "Active",
    start: "2026-11-01",
    renewal: "2026-12-01",
  },
  {
    id: "SUB-006",
    business: "Mama's Kitchen",
    owner: "Faith Njeri",
    plan: "Professional",
    amount: 2500,
    billing: "Monthly",
    status: "Trial",
    start: "2026-11-05",
    renewal: "2026-11-19",
  },
  {
    id: "SUB-007",
    business: "Agro Supplies",
    owner: "Samuel Kiptoo",
    plan: "Starter",
    amount: 900,
    billing: "Monthly",
    status: "Expired",
    start: "2026-10-08",
    renewal: "2026-11-08",
  },
];

const initialPlans = [
  {
    name: "Starter",
    price: 900,
    period: "month",
    description: "For small businesses getting started.",
    features: [
      "1 business",
      "1 branch",
      "Basic inventory",
      "Sales and order management",
      "Basic reports",
      "Customer storefront",
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: 2500,
    period: "month",
    description: "For growing businesses with active teams.",
    features: [
      "Everything in Starter",
      "Multiple staff accounts",
      "Multiple branches",
      "Advanced reports",
      "Stock transfers",
      "Cashier POS",
      "Business analytics",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: 5000,
    period: "month",
    description: "For larger businesses with advanced needs.",
    features: [
      "Everything in Professional",
      "Advanced user management",
      "Priority support",
      "Advanced business analytics",
      "Expanded branch capacity",
      "Premium integrations",
      "Priority feature access",
    ],
    popular: false,
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

function money(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatusBadge({ status }) {
  const colors = {
    Active: "var(--success)",
    Suspended: "var(--danger)",
    Trial: "var(--info)",
    Expired: "var(--warning)",
  };

  const color = colors[status] || "var(--text-muted)";

  return (
    <span
      className="subscription-status"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      <span className="subscription-status-dot" />
      {status}
    </span>
  );
}

function SubscriptionDetails({ subscription, onClose }) {
  if (!subscription) return null;

  return (
    <div className="subscription-modal-overlay" onClick={onClose}>
      <div
        className="subscription-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="subscription-modal-header">
          <div>
            <span className="subscription-eyebrow">SUBSCRIPTION DETAILS</span>
            <h2>{subscription.business}</h2>
            <p>{subscription.id}</p>
          </div>
          <button className="subscription-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="subscription-modal-body">
          {[
            ["Business owner", subscription.owner],
            ["Subscription plan", subscription.plan],
            ["Subscription amount", money(subscription.amount)],
            ["Billing cycle", subscription.billing],
            ["Subscription status", subscription.status],
            ["Start date", subscription.start],
            ["Next renewal / expiry", subscription.renewal],
          ].map(([label, value]) => (
            <div className="subscription-detail-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className="subscription-modal-footer">
          <button className="subscription-secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SuperAdminSubscriptions() {
  const [subscriptions] = useState(initialSubscriptions);
  const [plans] = useState(initialPlans);
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredSubscriptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return subscriptions.filter((subscription) => {
      const matchesSearch =
        !query ||
        subscription.business.toLowerCase().includes(query) ||
        subscription.owner.toLowerCase().includes(query) ||
        subscription.id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || subscription.status === statusFilter;

      const matchesPlan =
        planFilter === "All" || subscription.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [subscriptions, search, statusFilter, planFilter]);

  const activeCount = subscriptions.filter(
    (item) => item.status === "Active"
  ).length;

  const trialCount = subscriptions.filter(
    (item) => item.status === "Trial"
  ).length;

  const expiredCount = subscriptions.filter(
    (item) => item.status === "Expired"
  ).length;

  const monthlyRevenue = subscriptions
    .filter((item) => item.status === "Active" && item.billing === "Monthly")
    .reduce((total, item) => total + item.amount, 0);

  return (
    <div className="super-subscriptions-layout">
      <style>{`
        .super-subscriptions-layout {
          min-height: 100vh;
          display: flex;
          background: var(--background);
          color: var(--text-primary);
          font-family: var(--font-family, Inter, sans-serif);
        }

        .subscription-sidebar {
          width: 250px;
          flex-shrink: 0;
          min-height: 100vh;
          padding: 25px 16px;
          display: flex;
          flex-direction: column;
          background: var(--sidebar-bg, #111827);
          color: #f8fafc;
        }

        .subscription-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px 30px;
          margin-bottom: 25px;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .subscription-brand-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #2563eb;
          font-size: 19px;
          font-weight: 800;
        }

        .subscription-brand strong {
          display: block;
          font-size: 17px;
        }

        .subscription-brand small {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
          letter-spacing: 1.2px;
        }

        .subscription-nav-label {
          padding: 0 12px;
          margin-bottom: 12px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .subscription-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .subscription-nav a {
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

        .subscription-nav a:hover,
        .subscription-nav a.active {
          color: #fff;
          background: rgba(59,130,246,.19);
        }

        .subscription-nav a.active {
          box-shadow: inset 3px 0 #60a5fa;
        }

        .subscription-nav-icon {
          width: 20px;
          text-align: center;
          font-size: 17px;
        }

        .subscription-sidebar-bottom {
          margin-top: auto;
          padding: 18px 11px 0;
          border-top: 1px solid rgba(255,255,255,.1);
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.7;
        }

        .subscription-main {
          flex: 1;
          min-width: 0;
        }

        .subscription-topbar {
          min-height: 70px;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }

        .subscription-topbar h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
        }

        .subscription-topbar p {
          margin: 3px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .subscription-admin {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .subscription-avatar {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          font-weight: 800;
        }

        .subscription-content {
          max-width: 1500px;
          padding: 32px;
          margin: 0 auto;
        }

        .subscription-heading {
          margin-bottom: 25px;
        }

        .subscription-heading h1 {
          margin: 0;
          font-size: clamp(23px, 3vw, 29px);
          font-weight: 800;
          letter-spacing: -1px;
        }

        .subscription-heading p {
          margin: 8px 0 0;
          color: var(--text-muted);
          font-size: 13px;
        }

        .subscription-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 25px;
        }

        .subscription-stat {
          min-width: 0;
          padding: 20px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 14px);
          background: var(--surface);
          box-shadow: var(--shadow-sm, none);
        }

        .subscription-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .subscription-stat-label {
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
        }

        .subscription-stat-icon {
          width: 37px;
          height: 37px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: var(--surface-secondary);
          font-size: 17px;
        }

        .subscription-stat-value {
          margin-top: 15px;
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .subscription-stat-note {
          margin-top: 5px;
          color: var(--text-muted);
          font-size: 11px;
        }

        .subscription-panel {
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 14px);
          background: var(--surface);
          box-shadow: var(--shadow-sm, none);
        }

        .subscription-tabs {
          display: flex;
          gap: 22px;
          padding: 0 22px;
          border-bottom: 1px solid var(--border);
        }

        .subscription-tab {
          position: relative;
          padding: 17px 2px;
          border: 0;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .subscription-tab.active {
          color: var(--primary);
        }

        .subscription-tab.active::after {
          position: absolute;
          right: 0;
          bottom: -1px;
          left: 0;
          height: 2px;
          background: var(--primary);
          content: "";
        }

        .subscription-panel-heading {
          padding: 20px 22px;
          border-bottom: 1px solid var(--border);
        }

        .subscription-panel-heading h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
        }

        .subscription-panel-heading p {
          margin: 5px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .subscription-filters {
          padding: 17px 22px;
          display: flex;
          flex-wrap: wrap;
          gap: 11px;
          border-bottom: 1px solid var(--border);
        }

        .subscription-search {
          position: relative;
          flex: 1;
          min-width: 220px;
        }

        .subscription-search span {
          position: absolute;
          top: 50%;
          left: 13px;
          transform: translateY(-50%);
          color: var(--text-muted);
          font-size: 15px;
        }

        .subscription-search input,
        .subscription-filter {
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

        .subscription-search input {
          padding-left: 37px;
        }

        .subscription-search input:focus,
        .subscription-filter:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--focus-ring, rgba(37,99,235,.12));
        }

        .subscription-filter {
          width: auto;
          min-width: 145px;
        }

        .subscription-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .subscription-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        .subscription-table th {
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

        .subscription-table td {
          padding: 15px 17px;
          border-bottom: 1px solid var(--border);
          font-size: 12px;
          white-space: nowrap;
        }

        .subscription-table tbody tr:hover {
          background: var(--surface-hover);
        }

        .subscription-table tbody tr:last-child td {
          border-bottom: none;
        }

        .subscription-business-name {
          font-weight: 750;
        }

        .subscription-subtext {
          display: block;
          margin-top: 4px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .subscription-plan-tag {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 6px;
          background: var(--surface-secondary);
          font-size: 10px;
          font-weight: 700;
        }

        .subscription-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 750;
        }

        .subscription-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .subscription-view-button {
          padding: 7px 11px;
          border: 1px solid var(--border);
          border-radius: 7px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .subscription-view-button:hover {
          color: var(--primary);
          border-color: var(--primary);
        }

        .subscription-empty {
          padding: 45px 20px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }

        .subscription-table-footer {
          padding: 15px 20px;
          border-top: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 11px;
        }

        .subscription-plans-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 17px;
          padding: 22px;
        }

        .subscription-plan-card {
          position: relative;
          padding: 23px;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: var(--surface);
        }

        .subscription-plan-card.popular {
          border: 2px solid var(--primary);
        }

        .subscription-popular-label {
          position: absolute;
          top: -11px;
          right: 17px;
          padding: 5px 10px;
          border-radius: 20px;
          background: var(--primary);
          color: white;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .5px;
        }

        .subscription-plan-card h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
        }

        .subscription-plan-description {
          min-height: 36px;
          margin: 8px 0 18px;
          color: var(--text-muted);
          font-size: 11px;
          line-height: 1.6;
        }

        .subscription-plan-price {
          font-size: 27px;
          font-weight: 850;
          letter-spacing: -1px;
        }

        .subscription-plan-price small {
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0;
        }

        .subscription-plan-divider {
          height: 1px;
          margin: 20px 0;
          background: var(--border);
        }

        .subscription-plan-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .subscription-plan-features li {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          font-size: 11px;
          line-height: 1.5;
        }

        .subscription-plan-features li span {
          color: var(--success);
          font-weight: 900;
        }

        .subscription-plan-note {
          margin-top: 20px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .subscription-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(15,23,42,.58);
        }

        .subscription-modal {
          width: min(100%, 530px);
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--surface);
          box-shadow: 0 25px 70px rgba(0,0,0,.25);
        }

        .subscription-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 22px;
          border-bottom: 1px solid var(--border);
        }

        .subscription-eyebrow {
          color: var(--primary);
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 1.3px;
        }

        .subscription-modal-header h2 {
          margin: 8px 0 4px;
          font-size: 18px;
        }

        .subscription-modal-header p {
          margin: 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .subscription-close {
          width: 32px;
          height: 32px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 22px;
        }

        .subscription-modal-body {
          padding: 12px 22px;
        }

        .subscription-detail-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 13px 0;
          border-bottom: 1px solid var(--border);
          font-size: 12px;
        }

        .subscription-detail-row:last-child {
          border-bottom: none;
        }

        .subscription-detail-row span {
          color: var(--text-muted);
        }

        .subscription-detail-row strong {
          text-align: right;
        }

        .subscription-modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 22px;
          border-top: 1px solid var(--border);
        }

        .subscription-secondary-button {
          padding: 9px 16px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .subscription-mobile-menu {
          display: none;
          padding: 7px 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
        }

        .subscription-sidebar-overlay {
          display: none;
        }

        @media (max-width: 1100px) {
          .subscription-plans-grid {
            grid-template-columns: 1fr 1fr;
          }

          .subscription-plan-card:last-child {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 1050px) {
          .subscription-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .subscription-sidebar {
            position: fixed;
            z-index: 100;
            top: 0;
            bottom: 0;
            left: 0;
            width: 260px;
            transform: translateX(-100%);
            transition: transform .25s ease;
          }

          .subscription-sidebar.open {
            transform: translateX(0);
          }

          .subscription-sidebar-overlay.visible {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 90;
            background: rgba(15,23,42,.55);
          }

          .subscription-mobile-menu {
            display: inline-flex;
          }

          .subscription-topbar {
            padding: 0 17px;
          }

          .subscription-content {
            padding: 23px 16px;
          }

          .subscription-plans-grid {
            grid-template-columns: 1fr;
          }

          .subscription-plan-card:last-child {
            grid-column: auto;
          }
        }

        @media (max-width: 480px) {
          .subscription-stats {
            gap: 10px;
          }

          .subscription-stat {
            padding: 14px;
          }

          .subscription-stat-value {
            font-size: 21px;
          }

          .subscription-stat-label {
            font-size: 10px;
          }

          .subscription-stat-icon {
            width: 30px;
            height: 30px;
          }

          .subscription-search {
            min-width: 100%;
          }

          .subscription-filter {
            flex: 1;
            min-width: 0;
          }

          .subscription-admin span:last-child {
            display: none;
          }
        }
      `}</style>

      <aside className={`subscription-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="subscription-brand">
          <div className="subscription-brand-icon">M</div>
          <div>
            <strong>MyDuka</strong>
            <small>PLATFORM ADMIN</small>
          </div>
        </div>

        <div className="subscription-nav-label">Platform</div>

        <nav className="subscription-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="subscription-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="subscription-sidebar-bottom">
          <strong>MyDuka Platform</strong>
          <br />
          Super Administration
          <br />
          © 2026 MyDuka
        </div>
      </aside>

      <div
        className={`subscription-sidebar-overlay ${
          sidebarOpen ? "visible" : ""
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="subscription-main">
        <header className="subscription-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <button
              className="subscription-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <h2>Subscription Management</h2>
              <p>Plans, billing and business subscriptions</p>
            </div>
          </div>

          <div className="subscription-admin">
            <div className="subscription-avatar">SA</div>
            <span>Super Administrator</span>
          </div>
        </header>

        <section className="subscription-content">
          <div className="subscription-heading">
            <h1>Subscriptions</h1>
            <p>
              Monitor platform plans, recurring revenue and business
              subscriptions.
            </p>
          </div>

          <div className="subscription-stats">
            <div className="subscription-stat">
              <div className="subscription-stat-top">
                <span className="subscription-stat-label">
                  Monthly recurring revenue
                </span>
                <span className="subscription-stat-icon">KSh</span>
              </div>
              <div className="subscription-stat-value">
                {money(monthlyRevenue)}
              </div>
              <div className="subscription-stat-note">
                From active monthly subscriptions
              </div>
            </div>

            <div className="subscription-stat">
              <div className="subscription-stat-top">
                <span className="subscription-stat-label">
                  Active subscriptions
                </span>
                <span className="subscription-stat-icon">✓</span>
              </div>
              <div className="subscription-stat-value">{activeCount}</div>
              <div className="subscription-stat-note">
                Currently paid and active
              </div>
            </div>

            <div className="subscription-stat">
              <div className="subscription-stat-top">
                <span className="subscription-stat-label">
                  Trial subscriptions
                </span>
                <span className="subscription-stat-icon">◷</span>
              </div>
              <div className="subscription-stat-value">{trialCount}</div>
              <div className="subscription-stat-note">
                Businesses using trial access
              </div>
            </div>

            <div className="subscription-stat">
              <div className="subscription-stat-top">
                <span className="subscription-stat-label">
                  Expired subscriptions
                </span>
                <span className="subscription-stat-icon">!</span>
              </div>
              <div className="subscription-stat-value">{expiredCount}</div>
              <div className="subscription-stat-note">
                Subscriptions past their expiry date
              </div>
            </div>
          </div>

          <section className="subscription-panel">
            <div className="subscription-tabs">
              <button
                className={`subscription-tab ${
                  activeTab === "subscriptions" ? "active" : ""
                }`}
                onClick={() => setActiveTab("subscriptions")}
              >
                Business subscriptions
              </button>

              <button
                className={`subscription-tab ${
                  activeTab === "plans" ? "active" : ""
                }`}
                onClick={() => setActiveTab("plans")}
              >
                Subscription plans
              </button>
            </div>

            {activeTab === "subscriptions" ? (
              <>
                <div className="subscription-panel-heading">
                  <h3>Registered subscriptions</h3>
                  <p>
                    {filteredSubscriptions.length} matching subscription
                    {filteredSubscriptions.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="subscription-filters">
                  <div className="subscription-search">
                    <span>⌕</span>
                    <input
                      type="search"
                      placeholder="Search business, owner or subscription ID..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>

                  <select
                    className="subscription-filter"
                    value={planFilter}
                    onChange={(event) => setPlanFilter(event.target.value)}
                    aria-label="Filter by plan"
                  >
                    <option value="All">All plans</option>
                    <option value="Starter">Starter</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>

                  <select
                    className="subscription-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    aria-label="Filter by status"
                  >
                    <option value="All">All statuses</option>
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                <div className="subscription-table-wrap">
                  <table className="subscription-table">
                    <thead>
                      <tr>
                        <th>Business</th>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Billing</th>
                        <th>Status</th>
                        <th>Renewal date</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredSubscriptions.map((subscription) => (
                        <tr key={subscription.id}>
                          <td>
                            <span className="subscription-business-name">
                              {subscription.business}
                            </span>
                            <span className="subscription-subtext">
                              {subscription.owner} · {subscription.id}
                            </span>
                          </td>

                          <td>
                            <span className="subscription-plan-tag">
                              {subscription.plan}
                            </span>
                          </td>

                          <td>{money(subscription.amount)}</td>
                          <td>{subscription.billing}</td>

                          <td>
                            <StatusBadge status={subscription.status} />
                          </td>

                          <td>{subscription.renewal}</td>

                          <td>
                            <button
                              className="subscription-view-button"
                              onClick={() =>
                                setSelectedSubscription(subscription)
                              }
                            >
                              View details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredSubscriptions.length === 0 && (
                    <div className="subscription-empty">
                      <div style={{ fontSize: 28, marginBottom: 10 }}>⌕</div>
                      <strong>No subscriptions found</strong>
                      <p>Try changing your search or filters.</p>
                    </div>
                  )}
                </div>

                <div className="subscription-table-footer">
                  Showing {filteredSubscriptions.length} of{" "}
                  {subscriptions.length} demo subscriptions
                </div>
              </>
            ) : (
              <>
                <div className="subscription-panel-heading">
                  <h3>Available subscription plans</h3>
                  <p>
                    Preview of the plans offered to businesses on MyDuka.
                  </p>
                </div>

                <div className="subscription-plans-grid">
                  {plans.map((plan) => (
                    <article
                      className={`subscription-plan-card ${
                        plan.popular ? "popular" : ""
                      }`}
                      key={plan.name}
                    >
                      {plan.popular && (
                        <span className="subscription-popular-label">
                          MOST POPULAR
                        </span>
                      )}

                      <h3>{plan.name}</h3>
                      <p className="subscription-plan-description">
                        {plan.description}
                      </p>

                      <div className="subscription-plan-price">
                        {money(plan.price)}
                        <small> / {plan.period}</small>
                      </div>

                      <div className="subscription-plan-divider" />

                      <ul className="subscription-plan-features">
                        {plan.features.map((feature) => (
                          <li key={feature}>
                            <span>✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <p className="subscription-plan-note">
                        Plan configuration preview. Changes will be connected
                        to platform settings later.
                      </p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </section>
      </main>

      {selectedSubscription && (
        <SubscriptionDetails
          subscription={selectedSubscription}
          onClose={() => setSelectedSubscription(null)}
        />
      )}
    </div>
  );
}

export default SuperAdminSubscriptions;
