import { useMemo, useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";

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

const demoBusinesses = [
  {
    id: "1",
    name: "FreshMart Supermarket",
    owner: "James Mwangi",
    email: "james@freshmart.example",
    phone: "+254 712 345 678",
    category: "Supermarket",
    location: "Nairobi, Kenya",
    slug: "freshmart",
    plan: "Professional",
    status: "Active",
    joined: "2026-08-12",
    renewal: "2026-12-12",
    monthlyPrice: 2500,
    users: 8,
    products: 1240,
    orders: 356,
    revenue: 485000,
    description:
      "A retail supermarket offering groceries, household products and everyday essentials.",
  },
  {
    id: "2",
    name: "Urban Styles Boutique",
    owner: "Mary Wanjiku",
    email: "mary@urbanstyles.example",
    phone: "+254 723 456 789",
    category: "Boutique",
    location: "Kisumu, Kenya",
    slug: "urban-styles",
    plan: "Starter",
    status: "Active",
    joined: "2026-09-05",
    renewal: "2026-12-05",
    monthlyPrice: 1200,
    users: 3,
    products: 215,
    orders: 89,
    revenue: 126000,
    description:
      "A fashion boutique selling clothing, footwear and accessories.",
  },
  {
    id: "3",
    name: "Green Valley Agrovet",
    owner: "Peter Otieno",
    email: "peter@greenvalley.example",
    phone: "+254 734 567 890",
    category: "Agrovet",
    location: "Eldoret, Kenya",
    slug: "green-valley",
    plan: "Professional",
    status: "Suspended",
    joined: "2026-07-21",
    renewal: "2026-11-21",
    monthlyPrice: 2500,
    users: 5,
    products: 680,
    orders: 142,
    revenue: 218000,
    description:
      "An agricultural supplies business serving farmers and local communities.",
  },
];

const demoUsers = [
  {
    id: 1,
    name: "James Mwangi",
    email: "james@freshmart.example",
    role: "Owner",
    status: "Active",
  },
  {
    id: 2,
    name: "Grace Njeri",
    email: "grace@freshmart.example",
    role: "Cashier",
    status: "Active",
  },
  {
    id: 3,
    name: "Brian Kamau",
    email: "brian@freshmart.example",
    role: "Manager",
    status: "Active",
  },
  {
    id: 4,
    name: "Lucy Achieng",
    email: "lucy@freshmart.example",
    role: "Cashier",
    status: "Inactive",
  },
];

const demoActivity = [
  {
    id: 1,
    title: "Business registered",
    description: "Business account created on MyDuka.",
    date: "2026-08-12T09:30:00",
    type: "Registration",
  },
  {
    id: 2,
    title: "Subscription activated",
    description: "Professional subscription activated.",
    date: "2026-08-12T10:15:00",
    type: "Subscription",
  },
  {
    id: 3,
    title: "New cashier added",
    description: "A cashier account was added to the business.",
    date: "2026-09-02T14:20:00",
    type: "User",
  },
  {
    id: 4,
    title: "Business profile updated",
    description: "Business contact information was updated.",
    date: "2026-10-18T11:45:00",
    type: "Profile",
  },
];

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function StatusBadge({ status }) {
  const normalized = status.toLowerCase();

  return (
    <span className={`business-status ${normalized}`}>
      <span />
      {status}
    </span>
  );
}

function SuperAdminBusinessDetails() {
  const { id } = useParams();

  const initialBusiness = useMemo(
    () => demoBusinesses.find((business) => business.id === id),
    [id]
  );

  const [business, setBusiness] = useState(initialBusiness);
  const [activeTab, setActiveTab] = useState("overview");
  const [users] = useState(demoUsers);
  const [activity] = useState(demoActivity);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [actionReason, setActionReason] = useState("");

  if (!business) {
    return (
      <div className="business-details-not-found">
        <style>{`
          .business-details-not-found {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 25px;
            background: var(--background);
            color: var(--text-primary);
            text-align: center;
          }
          .business-details-not-found h1 { font-size: 25px; }
          .business-details-not-found p {
            color: var(--text-muted);
            font-size: 13px;
          }
          .business-details-not-found a {
            display: inline-block;
            margin-top: 12px;
            padding: 11px 18px;
            border-radius: 8px;
            background: var(--primary);
            color: white;
            text-decoration: none;
            font-size: 12px;
          }
        `}</style>
        <div>
          <h1>Business not found</h1>
          <p>The requested business could not be found in the preview data.</p>
          <Link to="/superadmin/businesses">Return to businesses</Link>
        </div>
      </div>
    );
  }

  function openAction(type) {
    setActionType(type);
    setActionReason("");
    setShowActionModal(true);
  }

  function confirmAction(event) {
    event.preventDefault();

    if (!actionReason.trim()) {
      alert("Please provide a reason for this action.");
      return;
    }

    if (actionType === "Suspend") {
      setBusiness((current) => ({
        ...current,
        status: "Suspended",
      }));
    } else if (actionType === "Reactivate") {
      setBusiness((current) => ({
        ...current,
        status: "Active",
      }));
    }

    setShowActionModal(false);
    setActionReason("");
    alert(
      `${actionType} action completed in the frontend preview. No live business account was changed.`
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "◫" },
    { id: "users", label: "Users", icon: "♙" },
    { id: "subscription", label: "Subscription", icon: "▤" },
    { id: "activity", label: "Activity", icon: "◷" },
  ];

  return (
    <div className="business-details-layout">
      <style>{`
        .business-details-layout {
          min-height: 100vh;
          display: flex;
          background: var(--background);
          color: var(--text-primary);
          font-family: var(--font-family, Inter, sans-serif);
        }

        .business-details-sidebar {
          width: 250px;
          flex-shrink: 0;
          min-height: 100vh;
          padding: 25px 16px;
          display: flex;
          flex-direction: column;
          background: var(--sidebar-bg, #111827);
          color: white;
        }

        .business-details-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px 28px;
          margin-bottom: 25px;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .business-details-brand-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #2563eb;
          font-size: 19px;
          font-weight: 800;
        }

        .business-details-brand strong {
          display: block;
          font-size: 17px;
        }

        .business-details-brand small {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
          letter-spacing: 1.2px;
        }

        .business-details-nav-label {
          padding: 0 12px;
          margin-bottom: 12px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .business-details-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .business-details-nav a {
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

        .business-details-nav a:hover,
        .business-details-nav a.active {
          color: white;
          background: rgba(59,130,246,.19);
        }

        .business-details-nav a.active {
          box-shadow: inset 3px 0 #60a5fa;
        }

        .business-details-nav-icon {
          width: 20px;
          text-align: center;
          font-size: 17px;
        }

        .business-details-sidebar-footer {
          margin-top: auto;
          padding: 18px 11px 0;
          border-top: 1px solid rgba(255,255,255,.1);
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.7;
        }

        .business-details-main {
          flex: 1;
          min-width: 0;
        }

        .business-details-topbar {
          min-height: 70px;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }

        .business-details-topbar h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 750;
        }

        .business-details-topbar p {
          margin: 4px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .business-details-admin {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .business-details-admin-avatar {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          font-weight: 800;
        }

        .business-details-content {
          max-width: 1350px;
          padding: 30px;
          margin: 0 auto;
        }

        .business-back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 21px;
          color: var(--text-muted);
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
        }

        .business-back-link:hover {
          color: var(--primary);
        }

        .business-profile-card {
          padding: 23px;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: var(--surface);
        }

        .business-profile-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .business-profile-identity {
          display: flex;
          align-items: center;
          gap: 17px;
          min-width: 0;
        }

        .business-profile-logo {
          width: 66px;
          height: 66px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 17px;
          background: var(--primary-light);
          color: var(--primary);
          font-size: 25px;
          font-weight: 850;
        }

        .business-profile-identity h1 {
          margin: 0;
          font-size: clamp(20px, 3vw, 26px);
          font-weight: 850;
          letter-spacing: -.7px;
        }

        .business-profile-identity p {
          margin: 6px 0 10px;
          color: var(--text-muted);
          font-size: 11px;
        }

        .business-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
        }

        .business-status span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .business-status.active {
          background: rgba(34,197,94,.12);
          color: #16a34a;
        }

        .business-status.suspended {
          background: rgba(239,68,68,.12);
          color: #ef4444;
        }

        .business-status.pending {
          background: rgba(234,179,8,.12);
          color: #ca8a04;
        }

        .business-profile-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .business-action-button {
          min-height: 37px;
          padding: 9px 13px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 10px;
          font-weight: 750;
        }

        .business-action-button:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .business-action-button.danger {
          border-color: rgba(239,68,68,.3);
          color: #ef4444;
        }

        .business-action-button.danger:hover {
          background: rgba(239,68,68,.08);
        }

        .business-action-button.success {
          border-color: rgba(34,197,94,.3);
          color: #16a34a;
        }

        .business-profile-divider {
          height: 1px;
          margin: 21px 0;
          background: var(--border);
        }

        .business-quick-info {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 17px;
        }

        .business-quick-info span {
          display: block;
          margin-bottom: 6px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .business-quick-info strong {
          font-size: 11px;
          font-weight: 750;
          overflow-wrap: anywhere;
        }

        .business-details-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin: 19px 0;
        }

        .business-details-stat {
          padding: 17px;
          border: 1px solid var(--border);
          border-radius: 11px;
          background: var(--surface);
        }

        .business-details-stat-label {
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 700;
        }

        .business-details-stat-value {
          margin-top: 9px;
          font-size: 22px;
          font-weight: 850;
        }

        .business-details-stat-note {
          margin-top: 5px;
          color: var(--text-muted);
          font-size: 9px;
        }

        .business-details-tabs {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px;
          margin-bottom: 17px;
          overflow-x: auto;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface);
        }

        .business-details-tab {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: max-content;
          padding: 10px 15px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 11px;
          font-weight: 750;
        }

        .business-details-tab.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .business-details-panel {
          padding: 22px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
        }

        .business-details-panel-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding-bottom: 17px;
          margin-bottom: 18px;
          border-bottom: 1px solid var(--border);
        }

        .business-details-panel-heading h2 {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
        }

        .business-details-panel-heading p {
          margin: 5px 0 0;
          color: var(--text-muted);
          font-size: 10px;
        }

        .business-overview-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .business-info-box {
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: 9px;
        }

        .business-info-box h3 {
          margin: 0 0 15px;
          font-size: 12px;
          font-weight: 800;
        }

        .business-info-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
          font-size: 10px;
        }

        .business-info-row:last-child {
          border-bottom: 0;
        }

        .business-info-row span:first-child {
          color: var(--text-muted);
        }

        .business-info-row span:last-child {
          font-weight: 700;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .business-description {
          color: var(--text-secondary);
          font-size: 11px;
          line-height: 1.8;
        }

        .business-details-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .business-details-table {
          width: 100%;
          border-collapse: collapse;
          white-space: nowrap;
          text-align: left;
        }

        .business-details-table th {
          padding: 12px;
          background: var(--surface-secondary);
          color: var(--text-muted);
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .business-details-table td {
          padding: 14px 12px;
          border-bottom: 1px solid var(--border);
          font-size: 10px;
        }

        .business-user-name {
          font-weight: 800;
        }

        .business-user-email {
          margin-top: 4px;
          color: var(--text-muted);
          font-size: 9px;
        }

        .business-role {
          padding: 5px 8px;
          border-radius: 6px;
          background: var(--surface-secondary);
          color: var(--text-secondary);
          font-size: 9px;
          font-weight: 750;
        }

        .business-subscription-card {
          padding: 20px;
          border: 1px solid var(--border);
          border-radius: 11px;
          background: var(--background);
        }

        .business-subscription-top {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .business-subscription-top h3 {
          margin: 0;
          font-size: 19px;
          font-weight: 850;
        }

        .business-subscription-price {
          margin-top: 9px;
          color: var(--text-muted);
          font-size: 11px;
        }

        .business-subscription-price strong {
          color: var(--text-primary);
          font-size: 23px;
        }

        .business-subscription-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 23px;
        }

        .business-subscription-grid div {
          padding: 13px;
          border-radius: 8px;
          background: var(--surface);
        }

        .business-subscription-grid span {
          display: block;
          margin-bottom: 7px;
          color: var(--text-muted);
          font-size: 9px;
        }

        .business-subscription-grid strong {
          font-size: 11px;
        }

        .business-activity-item {
          position: relative;
          display: flex;
          gap: 13px;
          padding: 0 0 22px;
        }

        .business-activity-item:not(:last-child)::before {
          position: absolute;
          top: 23px;
          bottom: 0;
          left: 11px;
          width: 1px;
          background: var(--border);
          content: "";
        }

        .business-activity-dot {
          z-index: 1;
          width: 23px;
          height: 23px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: var(--primary-light);
          color: var(--primary);
          font-size: 10px;
        }

        .business-activity-content strong {
          display: block;
          font-size: 11px;
        }

        .business-activity-content p {
          margin: 5px 0;
          color: var(--text-secondary);
          font-size: 10px;
        }

        .business-activity-content small {
          color: var(--text-muted);
          font-size: 9px;
        }

        .business-modal-overlay {
          position: fixed;
          z-index: 200;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(15,23,42,.65);
        }

        .business-action-modal {
          width: min(100%, 440px);
          padding: 23px;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: var(--surface);
          box-shadow: 0 20px 70px rgba(0,0,0,.2);
        }

        .business-action-modal h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 850;
        }

        .business-action-modal p {
          margin: 8px 0 18px;
          color: var(--text-muted);
          font-size: 11px;
          line-height: 1.7;
        }

        .business-action-modal label {
          display: block;
          margin-bottom: 7px;
          font-size: 11px;
          font-weight: 750;
        }

        .business-action-modal textarea {
          width: 100%;
          min-height: 100px;
          padding: 11px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--background);
          color: var(--text-primary);
          font: inherit;
          font-size: 11px;
          resize: vertical;
        }

        .business-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 17px;
        }

        .business-details-mobile-menu {
          display: none;
          padding: 7px 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
        }

        @media (max-width: 1050px) {
          .business-details-stats,
          .business-quick-info {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .business-details-sidebar {
            position: fixed;
            z-index: 100;
            top: 0;
            bottom: 0;
            left: 0;
            width: 260px;
            transform: translateX(-100%);
            transition: transform .25s ease;
          }

          .business-details-sidebar.open {
            transform: translateX(0);
          }

          .business-details-sidebar-overlay.visible {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 90;
            background: rgba(15,23,42,.55);
          }

          .business-details-mobile-menu {
            display: inline-flex;
          }

          .business-details-topbar {
            padding: 0 16px;
          }

          .business-details-content {
            padding: 22px 15px;
          }

          .business-overview-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .business-details-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 9px;
          }

          .business-details-stat {
            padding: 13px;
          }

          .business-details-stat-value {
            font-size: 19px;
          }

          .business-profile-card {
            padding: 16px;
          }

          .business-profile-identity {
            gap: 11px;
          }

          .business-profile-logo {
            width: 52px;
            height: 52px;
            border-radius: 13px;
            font-size: 20px;
          }

          .business-profile-actions {
            width: 100%;
          }

          .business-profile-actions button {
            flex: 1;
          }

          .business-quick-info {
            gap: 13px;
          }

          .business-details-panel {
            padding: 15px;
          }

          .business-subscription-grid {
            grid-template-columns: 1fr;
          }

          .business-details-admin span:last-child {
            display: none;
          }
        }
      `}</style>

      <aside className={`business-details-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="business-details-brand">
          <div className="business-details-brand-icon">M</div>
          <div>
            <strong>MyDuka</strong>
            <small>PLATFORM ADMIN</small>
          </div>
        </div>

        <div className="business-details-nav-label">Platform</div>

        <nav className="business-details-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="business-details-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="business-details-sidebar-footer">
          <strong>MyDuka Platform</strong>
          <br />
          Super Administration
          <br />
          © 2026 MyDuka
        </div>
      </aside>

      <div
        className={`business-details-sidebar-overlay ${
          sidebarOpen ? "visible" : ""
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="business-details-main">
        <header className="business-details-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <button
              className="business-details-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <h2>Business Management</h2>
              <p>Platform administration</p>
            </div>
          </div>

          <div className="business-details-admin">
            <div className="business-details-admin-avatar">SA</div>
            <span>Super Administrator</span>
          </div>
        </header>

        <section className="business-details-content">
          <Link to="/superadmin/businesses" className="business-back-link">
            ← Back to businesses
          </Link>

          <div className="business-profile-card">
            <div className="business-profile-top">
              <div className="business-profile-identity">
                <div className="business-profile-logo">
                  {business.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h1>{business.name}</h1>
                  <p>
                    {business.category} · {business.location}
                  </p>
                  <StatusBadge status={business.status} />
                </div>
              </div>

              <div className="business-profile-actions">
                {business.status === "Active" ? (
                  <button
                    className="business-action-button danger"
                    onClick={() => openAction("Suspend")}
                  >
                    Suspend business
                  </button>
                ) : (
                  <button
                    className="business-action-button success"
                    onClick={() => openAction("Reactivate")}
                  >
                    Reactivate business
                  </button>
                )}

                <button
                  className="business-action-button"
                  onClick={() =>
                    alert("Business editing will be connected during backend integration.")
                  }
                >
                  Edit details
                </button>
              </div>
            </div>

            <div className="business-profile-divider" />

            <div className="business-quick-info">
              <div>
                <span>Business owner</span>
                <strong>{business.owner}</strong>
              </div>
              <div>
                <span>Email address</span>
                <strong>{business.email}</strong>
              </div>
              <div>
                <span>Phone number</span>
                <strong>{business.phone}</strong>
              </div>
              <div>
                <span>Registration date</span>
                <strong>{formatDate(business.joined)}</strong>
              </div>
            </div>
          </div>

          <div className="business-details-stats">
            <div className="business-details-stat">
              <div className="business-details-stat-label">BUSINESS USERS</div>
              <div className="business-details-stat-value">{business.users}</div>
              <div className="business-details-stat-note">
                Registered team members
              </div>
            </div>

            <div className="business-details-stat">
              <div className="business-details-stat-label">PRODUCTS</div>
              <div className="business-details-stat-value">
                {business.products.toLocaleString("en-KE")}
              </div>
              <div className="business-details-stat-note">
                Products in inventory
              </div>
            </div>

            <div className="business-details-stat">
              <div className="business-details-stat-label">ORDERS</div>
              <div className="business-details-stat-value">
                {business.orders.toLocaleString("en-KE")}
              </div>
              <div className="business-details-stat-note">
                Recorded orders
              </div>
            </div>

            <div className="business-details-stat">
              <div className="business-details-stat-label">RECORDED REVENUE</div>
              <div className="business-details-stat-value">
                {formatCurrency(business.revenue)}
              </div>
              <div className="business-details-stat-note">
                Illustrative business figure
              </div>
            </div>
          </div>

          <nav className="business-details-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`business-details-tab ${
                  activeTab === tab.id ? "active" : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <section className="business-details-panel">
            {activeTab === "overview" && (
              <>
                <div className="business-details-panel-heading">
                  <div>
                    <h2>Business overview</h2>
                    <p>General information and account summary.</p>
                  </div>
                </div>

                <div className="business-overview-grid">
                  <div className="business-info-box">
                    <h3>Business information</h3>

                    <div className="business-info-row">
                      <span>Business name</span>
                      <span>{business.name}</span>
                    </div>

                    <div className="business-info-row">
                      <span>Business category</span>
                      <span>{business.category}</span>
                    </div>

                    <div className="business-info-row">
                      <span>Store URL slug</span>
                      <span>{business.slug}</span>
                    </div>

                    <div className="business-info-row">
                      <span>Location</span>
                      <span>{business.location}</span>
                    </div>

                    <div className="business-info-row">
                      <span>Registration date</span>
                      <span>{formatDate(business.joined)}</span>
                    </div>
                  </div>

                  <div className="business-info-box">
                    <h3>Account information</h3>

                    <div className="business-info-row">
                      <span>Business owner</span>
                      <span>{business.owner}</span>
                    </div>

                    <div className="business-info-row">
                      <span>Subscription</span>
                      <span>{business.plan}</span>
                    </div>

                    <div className="business-info-row">
                      <span>Account status</span>
                      <StatusBadge status={business.status} />
                    </div>

                    <div className="business-info-row">
                      <span>Renewal date</span>
                      <span>{formatDate(business.renewal)}</span>
                    </div>

                    <div className="business-info-row">
                      <span>Team members</span>
                      <span>{business.users}</span>
                    </div>
                  </div>

                  <div className="business-info-box" style={{ gridColumn: "1 / -1" }}>
                    <h3>Business description</h3>
                    <p className="business-description">
                      {business.description}
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeTab === "users" && (
              <>
                <div className="business-details-panel-heading">
                  <div>
                    <h2>Business users</h2>
                    <p>Accounts associated with this business.</p>
                  </div>
                  <span className="business-role">{users.length} sample users</span>
                </div>

                <div className="business-details-table-wrap">
                  <table className="business-details-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="business-user-name">
                              {user.name}
                            </div>
                            <div className="business-user-email">
                              {user.email}
                            </div>
                          </td>
                          <td>
                            <span className="business-role">{user.role}</span>
                          </td>
                          <td>
                            <StatusBadge status={user.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === "subscription" && (
              <>
                <div className="business-details-panel-heading">
                  <div>
                    <h2>Subscription details</h2>
                    <p>Current business subscription and billing summary.</p>
                  </div>
                </div>

                <div className="business-subscription-card">
                  <div className="business-subscription-top">
                    <div>
                      <span className="business-role">CURRENT PLAN</span>
                      <h3 style={{ marginTop: 12 }}>{business.plan}</h3>
                      <p className="business-subscription-price">
                        <strong>{formatCurrency(business.monthlyPrice)}</strong>
                        {" "} / month
                      </p>
                    </div>

                    <StatusBadge
                      status={
                        business.status === "Active" ? "Active" : "Suspended"
                      }
                    />
                  </div>

                  <div className="business-subscription-grid">
                    <div>
                      <span>Subscription start</span>
                      <strong>{formatDate(business.joined)}</strong>
                    </div>
                    <div>
                      <span>Next renewal</span>
                      <strong>{formatDate(business.renewal)}</strong>
                    </div>
                    <div>
                      <span>Billing frequency</span>
                      <strong>Monthly</strong>
                    </div>
                  </div>
                </div>

                <div className="business-details-panel-heading" style={{ marginTop: 25 }}>
                  <div>
                    <h2>Subscription management</h2>
                    <p>Administrative subscription actions.</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                  <button
                    className="business-action-button"
                    onClick={() =>
                      alert("Plan changes will be connected during backend integration.")
                    }
                  >
                    Change plan
                  </button>

                  <button
                    className="business-action-button"
                    onClick={() =>
                      alert("Billing history will be connected during backend integration.")
                    }
                  >
                    View billing history
                  </button>
                </div>
              </>
            )}

            {activeTab === "activity" && (
              <>
                <div className="business-details-panel-heading">
                  <div>
                    <h2>Business activity</h2>
                    <p>Illustrative timeline of business account events.</p>
                  </div>
                </div>

                {activity.map((item) => (
                  <div className="business-activity-item" key={item.id}>
                    <div className="business-activity-dot">✓</div>
                    <div className="business-activity-content">
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                      <small>
                        {formatDate(item.date)} · {item.type}
                      </small>
                    </div>
                  </div>
                ))}
              </>
            )}
          </section>

          <p
            style={{
              marginTop: 17,
              color: "var(--text-muted)",
              fontSize: 10,
              textAlign: "center",
            }}
          >
            Frontend preview — business details and actions use sample data.
            Live business records will be connected during backend integration.
          </p>
        </section>
      </main>

      {showActionModal && (
        <div
          className="business-modal-overlay"
          onClick={() => setShowActionModal(false)}
        >
          <form
            className="business-action-modal"
            onSubmit={confirmAction}
            onClick={(event) => event.stopPropagation()}
          >
            <h2>{actionType} business</h2>
            <p>
              You are about to {actionType.toLowerCase()}{" "}
              <strong>{business.name}</strong>. Provide a reason for this
              administrative action.
            </p>

            <label htmlFor="business-action-reason">Reason</label>
            <textarea
              id="business-action-reason"
              value={actionReason}
              onChange={(event) => setActionReason(event.target.value)}
              placeholder="Enter the reason for this action..."
              required
            />

            <div className="business-modal-actions">
              <button
                type="button"
                className="business-action-button"
                onClick={() => setShowActionModal(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={`business-action-button ${
                  actionType === "Suspend" ? "danger" : "success"
                }`}
              >
                Confirm {actionType.toLowerCase()}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SuperAdminBusinessDetails;
