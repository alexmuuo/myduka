import { useState } from "react";
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

const revenueData = [
  { month: "May", value: 18000 },
  { month: "Jun", value: 24500 },
  { month: "Jul", value: 22000 },
  { month: "Aug", value: 31000 },
  { month: "Sep", value: 38500 },
  { month: "Oct", value: 46000 },
  { month: "Nov", value: 52500 },
];

const businessGrowth = [
  { month: "May", businesses: 12, users: 45 },
  { month: "Jun", businesses: 18, users: 68 },
  { month: "Jul", businesses: 25, users: 94 },
  { month: "Aug", businesses: 32, users: 125 },
  { month: "Sep", businesses: 43, users: 168 },
  { month: "Oct", businesses: 56, users: 215 },
  { month: "Nov", businesses: 68, users: 264 },
];

const categories = [
  { name: "Supermarkets", count: 18, percentage: 26 },
  { name: "Fashion & Boutique", count: 14, percentage: 21 },
  { name: "Pharmacies", count: 11, percentage: 16 },
  { name: "Liquor Stores", count: 9, percentage: 13 },
  { name: "Electronics", count: 8, percentage: 12 },
  { name: "Other businesses", count: 8, percentage: 12 },
];

const plans = [
  { name: "Starter", count: 29, percentage: 43 },
  { name: "Professional", count: 30, percentage: 44 },
  { name: "Enterprise", count: 9, percentage: 13 },
];

const activities = [
  {
    title: "New business registered",
    detail: "Beauty Haven joined MyDuka",
    time: "Today, 10:42 AM",
    icon: "▦",
  },
  {
    title: "Subscription upgraded",
    detail: "HealthPlus Pharmacy moved to Enterprise",
    time: "Today, 9:15 AM",
    icon: "↗",
  },
  {
    title: "New users registered",
    detail: "12 new user accounts were created",
    time: "Yesterday",
    icon: "♙",
  },
  {
    title: "Subscription expired",
    detail: "Agro Supplies subscription expired",
    time: "Yesterday",
    icon: "◷",
  },
];

function formatMoney(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function RevenueChart({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data
    .map((item, index) => {
      const x = 45 + (index * 610) / (data.length - 1);
      const y = 190 - (item.value / max) * 155;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `45,190 ${points} 655,190`;

  return (
    <div className="analytics-chart">
      <svg
        viewBox="0 0 700 235"
        role="img"
        aria-label="Illustrative monthly revenue trend"
        preserveAspectRatio="none"
      >
        {[35, 75, 115, 155, 190].map((y) => (
          <line
            key={y}
            x1="45"
            y1={y}
            x2="655"
            y2={y}
            className="chart-grid-line"
          />
        ))}

        <polygon points={areaPoints} className="chart-area" />

        <polyline
          points={points}
          className="chart-line"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((item, index) => {
          const x = 45 + (index * 610) / (data.length - 1);
          const y = 190 - (item.value / max) * 155;

          return (
            <g key={item.month}>
              <circle
                cx={x}
                cy={y}
                r="5"
                className="chart-point"
              />
              <text
                x={x}
                y="220"
                textAnchor="middle"
                className="chart-label"
              >
                {item.month}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SuperAdminAnalytics() {
  const [period, setPeriod] = useState("7 months");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const totalRevenue = revenueData.reduce(
    (total, item) => total + item.value,
    0
  );

  return (
    <div className="super-analytics-layout">
      <style>{`
        .super-analytics-layout {
          min-height: 100vh;
          display: flex;
          background: var(--background);
          color: var(--text-primary);
          font-family: var(--font-family, Inter, sans-serif);
        }

        .analytics-sidebar {
          width: 250px;
          flex-shrink: 0;
          min-height: 100vh;
          padding: 25px 16px;
          display: flex;
          flex-direction: column;
          background: var(--sidebar-bg, #111827);
          color: #f8fafc;
        }

        .analytics-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px 30px;
          margin-bottom: 25px;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .analytics-brand-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #2563eb;
          font-size: 19px;
          font-weight: 800;
        }

        .analytics-brand strong {
          display: block;
          font-size: 17px;
        }

        .analytics-brand small {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
          letter-spacing: 1.2px;
        }

        .analytics-nav-label {
          padding: 0 12px;
          margin-bottom: 12px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .analytics-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .analytics-nav a {
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

        .analytics-nav a:hover,
        .analytics-nav a.active {
          color: #fff;
          background: rgba(59,130,246,.19);
        }

        .analytics-nav a.active {
          box-shadow: inset 3px 0 #60a5fa;
        }

        .analytics-nav-icon {
          width: 20px;
          text-align: center;
          font-size: 17px;
        }

        .analytics-sidebar-bottom {
          margin-top: auto;
          padding: 18px 11px 0;
          border-top: 1px solid rgba(255,255,255,.1);
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.7;
        }

        .analytics-main {
          flex: 1;
          min-width: 0;
        }

        .analytics-topbar {
          min-height: 70px;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }

        .analytics-topbar h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
        }

        .analytics-topbar p {
          margin: 3px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .analytics-admin {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .analytics-avatar {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          font-weight: 800;
        }

        .analytics-content {
          max-width: 1500px;
          padding: 32px;
          margin: 0 auto;
        }

        .analytics-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 25px;
        }

        .analytics-heading h1 {
          margin: 0;
          font-size: clamp(23px, 3vw, 29px);
          font-weight: 800;
          letter-spacing: -1px;
        }

        .analytics-heading p {
          margin: 8px 0 0;
          color: var(--text-muted);
          font-size: 13px;
        }

        .analytics-period {
          min-height: 39px;
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          font-size: 12px;
          outline: none;
        }

        .analytics-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .analytics-stat-card {
          min-width: 0;
          padding: 20px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 14px);
          background: var(--surface);
          box-shadow: var(--shadow-sm, none);
        }

        .analytics-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .analytics-stat-label {
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
        }

        .analytics-stat-icon {
          width: 37px;
          height: 37px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: var(--surface-secondary);
          font-size: 17px;
        }

        .analytics-stat-value {
          margin-top: 15px;
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .analytics-stat-note {
          margin-top: 6px;
          color: var(--text-muted);
          font-size: 11px;
        }

        .analytics-positive {
          color: var(--success);
          font-weight: 800;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(270px, 1fr);
          gap: 18px;
          margin-bottom: 18px;
        }

        .analytics-card {
          min-width: 0;
          padding: 21px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 14px);
          background: var(--surface);
          box-shadow: var(--shadow-sm, none);
        }

        .analytics-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
        }

        .analytics-card-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
        }

        .analytics-card-header p {
          margin: 5px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .analytics-chart {
          width: 100%;
          height: 235px;
        }

        .analytics-chart svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .chart-grid-line {
          stroke: var(--border);
          stroke-width: 1;
          stroke-dasharray: 4 5;
        }

        .chart-area {
          fill: var(--primary);
          opacity: .10;
        }

        .chart-line {
          stroke: var(--primary);
        }

        .chart-point {
          fill: var(--surface);
          stroke: var(--primary);
          stroke-width: 3;
        }

        .chart-label {
          fill: var(--text-muted);
          font-size: 11px;
        }

        .analytics-revenue-total {
          margin-bottom: 12px;
          font-size: 23px;
          font-weight: 850;
        }

        .analytics-legend {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 10px;
        }

        .analytics-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
        }

        .analytics-breakdown {
          display: flex;
          flex-direction: column;
          gap: 19px;
        }

        .analytics-breakdown-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .analytics-breakdown-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 11px;
        }

        .analytics-breakdown-top span:first-child {
          color: var(--text-muted);
        }

        .analytics-breakdown-top strong {
          font-weight: 800;
        }

        .analytics-progress {
          height: 8px;
          overflow: hidden;
          border-radius: 20px;
          background: var(--surface-secondary);
        }

        .analytics-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: var(--primary);
        }

        .analytics-plan-list {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .analytics-plan-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
        }

        .analytics-plan-left {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .analytics-plan-dot {
          width: 9px;
          height: 9px;
          border-radius: 3px;
          background: var(--primary);
        }

        .analytics-plan-row span {
          color: var(--text-muted);
        }

        .analytics-plan-row strong {
          font-weight: 800;
        }

        .analytics-activity {
          display: flex;
          flex-direction: column;
        }

        .analytics-activity-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
        }

        .analytics-activity-item:last-child {
          border-bottom: none;
        }

        .analytics-activity-icon {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: var(--surface-secondary);
          font-size: 15px;
        }

        .analytics-activity-detail {
          min-width: 0;
          flex: 1;
        }

        .analytics-activity-detail strong {
          display: block;
          font-size: 11px;
        }

        .analytics-activity-detail p {
          margin: 4px 0;
          color: var(--text-muted);
          font-size: 10px;
        }

        .analytics-activity-detail small {
          color: var(--text-muted);
          font-size: 9px;
        }

        .analytics-growth-table {
          width: 100%;
          border-collapse: collapse;
        }

        .analytics-growth-table th,
        .analytics-growth-table td {
          padding: 12px 10px;
          border-bottom: 1px solid var(--border);
          text-align: left;
          font-size: 11px;
        }

        .analytics-growth-table th {
          color: var(--text-muted);
          font-size: 9px;
          letter-spacing: .6px;
          text-transform: uppercase;
        }

        .analytics-growth-table tr:last-child td {
          border-bottom: none;
        }

        .analytics-growth-table td strong {
          font-weight: 800;
        }

        .analytics-mobile-menu {
          display: none;
          padding: 7px 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
        }

        .analytics-sidebar-overlay {
          display: none;
        }

        @media (max-width: 1100px) {
          .analytics-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .analytics-sidebar {
            position: fixed;
            z-index: 100;
            top: 0;
            bottom: 0;
            left: 0;
            width: 260px;
            transform: translateX(-100%);
            transition: transform .25s ease;
          }

          .analytics-sidebar.open {
            transform: translateX(0);
          }

          .analytics-sidebar-overlay.visible {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 90;
            background: rgba(15,23,42,.55);
          }

          .analytics-mobile-menu {
            display: inline-flex;
          }

          .analytics-topbar {
            padding: 0 17px;
          }

          .analytics-content {
            padding: 23px 16px;
          }

          .analytics-heading {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .analytics-stats {
            gap: 10px;
          }

          .analytics-stat-card {
            padding: 14px;
          }

          .analytics-stat-value {
            font-size: 20px;
          }

          .analytics-stat-label {
            font-size: 10px;
          }

          .analytics-stat-icon {
            width: 30px;
            height: 30px;
          }

          .analytics-admin span:last-child {
            display: none;
          }

          .analytics-card {
            padding: 16px;
          }

          .analytics-growth-table th,
          .analytics-growth-table td {
            padding: 10px 6px;
          }
        }
      `}</style>

      <aside className={`analytics-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="analytics-brand">
          <div className="analytics-brand-icon">M</div>
          <div>
            <strong>MyDuka</strong>
            <small>PLATFORM ADMIN</small>
          </div>
        </div>

        <div className="analytics-nav-label">Platform</div>

        <nav className="analytics-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="analytics-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="analytics-sidebar-bottom">
          <strong>MyDuka Platform</strong>
          <br />
          Super Administration
          <br />
          © 2026 MyDuka
        </div>
      </aside>

      <div
        className={`analytics-sidebar-overlay ${
          sidebarOpen ? "visible" : ""
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="analytics-main">
        <header className="analytics-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <button
              className="analytics-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <h2>Platform Analytics</h2>
              <p>Business performance and platform insights</p>
            </div>
          </div>

          <div className="analytics-admin">
            <div className="analytics-avatar">SA</div>
            <span>Super Administrator</span>
          </div>
        </header>

        <section className="analytics-content">
          <div className="analytics-heading">
            <div>
              <h1>Analytics Overview</h1>
              <p>
                Understand MyDuka's growth, revenue and platform activity.
              </p>
            </div>

            <select
              className="analytics-period"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              aria-label="Analytics period"
            >
              <option value="7 months">Last 7 months</option>
              <option value="30 days">Last 30 days</option>
              <option value="90 days">Last 90 days</option>
              <option value="12 months">Last 12 months</option>
            </select>
          </div>

          <div className="analytics-stats">
            <div className="analytics-stat-card">
              <div className="analytics-stat-top">
                <span className="analytics-stat-label">Total businesses</span>
                <span className="analytics-stat-icon">▦</span>
              </div>
              <div className="analytics-stat-value">68</div>
              <div className="analytics-stat-note">
                <span className="analytics-positive">+14.2%</span> compared
                with previous period
              </div>
            </div>

            <div className="analytics-stat-card">
              <div className="analytics-stat-top">
                <span className="analytics-stat-label">Platform users</span>
                <span className="analytics-stat-icon">♙</span>
              </div>
              <div className="analytics-stat-value">264</div>
              <div className="analytics-stat-note">
                <span className="analytics-positive">+18.6%</span> compared
                with previous period
              </div>
            </div>

            <div className="analytics-stat-card">
              <div className="analytics-stat-top">
                <span className="analytics-stat-label">Subscription revenue</span>
                <span className="analytics-stat-icon">KSh</span>
              </div>
              <div className="analytics-stat-value">
                {formatMoney(52500)}
              </div>
              <div className="analytics-stat-note">
                <span className="analytics-positive">+12.8%</span> compared
                with previous period
              </div>
            </div>

            <div className="analytics-stat-card">
              <div className="analytics-stat-top">
                <span className="analytics-stat-label">Active subscriptions</span>
                <span className="analytics-stat-icon">✓</span>
              </div>
              <div className="analytics-stat-value">59</div>
              <div className="analytics-stat-note">
                <span className="analytics-positive">86.8%</span> of all
                subscriptions
              </div>
            </div>
          </div>

          <div className="analytics-grid">
            <section className="analytics-card">
              <div className="analytics-card-header">
                <div>
                  <h3>Revenue performance</h3>
                  <p>Illustrative subscription revenue trend</p>
                </div>
                <span className="analytics-legend">
                  <span className="analytics-legend-dot" />
                  Revenue
                </span>
              </div>

              <div className="analytics-revenue-total">
                {formatMoney(revenueData[revenueData.length - 1].value)}
              </div>

              <RevenueChart data={revenueData} />

              <div className="analytics-stat-note">
                Total revenue across displayed sample months:{" "}
                <strong>{formatMoney(totalRevenue)}</strong>
              </div>
            </section>

            <section className="analytics-card">
              <div className="analytics-card-header">
                <div>
                  <h3>Business categories</h3>
                  <p>Businesses by industry</p>
                </div>
              </div>

              <div className="analytics-breakdown">
                {categories.map((category) => (
                  <div
                    className="analytics-breakdown-item"
                    key={category.name}
                  >
                    <div className="analytics-breakdown-top">
                      <span>{category.name}</span>
                      <strong>{category.count}</strong>
                    </div>

                    <div className="analytics-progress">
                      <div
                        className="analytics-progress-fill"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="analytics-grid">
            <section className="analytics-card">
              <div className="analytics-card-header">
                <div>
                  <h3>Subscription distribution</h3>
                  <p>Businesses grouped by subscription plan</p>
                </div>
              </div>

              <div className="analytics-plan-list">
                {plans.map((plan) => (
                  <div className="analytics-plan-row" key={plan.name}>
                    <div className="analytics-plan-left">
                      <span className="analytics-plan-dot" />
                      <span>{plan.name}</span>
                    </div>
                    <strong>
                      {plan.count} <span>({plan.percentage}%)</span>
                    </strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="analytics-card">
              <div className="analytics-card-header">
                <div>
                  <h3>Recent platform activity</h3>
                  <p>Latest sample events</p>
                </div>
              </div>

              <div className="analytics-activity">
                {activities.map((activity) => (
                  <div className="analytics-activity-item" key={activity.title}>
                    <div className="analytics-activity-icon">
                      {activity.icon}
                    </div>

                    <div className="analytics-activity-detail">
                      <strong>{activity.title}</strong>
                      <p>{activity.detail}</p>
                      <small>{activity.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="analytics-card">
            <div className="analytics-card-header">
              <div>
                <h3>Platform growth</h3>
                <p>Monthly business and user registrations</p>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="analytics-growth-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total businesses</th>
                    <th>Total users</th>
                    <th>New businesses</th>
                    <th>New users</th>
                  </tr>
                </thead>

                <tbody>
                  {businessGrowth.map((item, index) => {
                    const previous = businessGrowth[index - 1];

                    return (
                      <tr key={item.month}>
                        <td>
                          <strong>{item.month} 2026</strong>
                        </td>
                        <td>{item.businesses}</td>
                        <td>{item.users}</td>
                        <td>
                          {previous
                            ? `+${item.businesses - previous.businesses}`
                            : item.businesses}
                        </td>
                        <td>
                          {previous
                            ? `+${item.users - previous.users}`
                            : item.users}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <p
            style={{
              marginTop: 18,
              color: "var(--text-muted)",
              fontSize: 10,
              textAlign: "center",
            }}
          >
            Frontend preview — all analytics figures and activity records are
            illustrative sample data.
          </p>
        </section>
      </main>
    </div>
  );
}

export default SuperAdminAnalytics;
