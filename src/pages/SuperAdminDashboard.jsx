import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const menuItems = [
  { label: "Overview", icon: "⌂", path: "/superadmin/dashboard" },
  { label: "Businesses", icon: "▦", path: "/superadmin/businesses" },
  { label: "Users", icon: "♙", path: "/superadmin/users" },
  { label: "Subscriptions", icon: "▤", path: "/superadmin/subscriptions" },
  { label: "Plans", icon: "◇", path: "/superadmin/plans" },
  { label: "Analytics", icon: "▥", path: "/superadmin/analytics" },
  { label: "Support", icon: "✉", path: "/superadmin/support" },
  { label: "Notifications", icon: "♧", path: "/superadmin/notifications" },
  { label: "Audit Logs", icon: "☷", path: "/superadmin/audit-logs" },
];

const stats = [
  {
    label: "Total Businesses",
    value: "1,284",
    change: "+12.8%",
    positive: true,
    icon: "▦",
    description: "Compared with last month",
  },
  {
    label: "Registered Users",
    value: "8,492",
    change: "+18.4%",
    positive: true,
    icon: "♙",
    description: "Compared with last month",
  },
  {
    label: "Active Subscriptions",
    value: "1,106",
    change: "+9.2%",
    positive: true,
    icon: "◇",
    description: "Compared with last month",
  },
  {
    label: "Monthly Revenue",
    value: "KES 842,500",
    change: "+14.6%",
    positive: true,
    icon: "↗",
    description: "Compared with last month",
  },
];

const registrations = [
  { month: "May", businesses: 42, users: 180 },
  { month: "Jun", businesses: 55, users: 220 },
  { month: "Jul", businesses: 48, users: 245 },
  { month: "Aug", businesses: 73, users: 290 },
  { month: "Sep", businesses: 65, users: 330 },
  { month: "Oct", businesses: 88, users: 380 },
  { month: "Nov", businesses: 96, users: 425 },
];

const recentBusinesses = [
  {
    name: "Nairobi Fashion House",
    owner: "James Mwangi",
    category: "Fashion",
    date: "Nov 14, 2026",
    status: "Active",
    initials: "NF",
  },
  {
    name: "FreshMart Groceries",
    owner: "Mary Wanjiku",
    category: "Supermarket",
    date: "Nov 13, 2026",
    status: "Active",
    initials: "FM",
  },
  {
    name: "TechPoint Electronics",
    owner: "David Ochieng",
    category: "Electronics",
    date: "Nov 12, 2026",
    status: "Pending",
    initials: "TP",
  },
  {
    name: "Urban Beauty Store",
    owner: "Grace Akinyi",
    category: "Beauty",
    date: "Nov 11, 2026",
    status: "Active",
    initials: "UB",
  },
  {
    name: "Green Valley Agrovet",
    owner: "Peter Kamau",
    category: "Agriculture",
    date: "Nov 10, 2026",
    status: "Suspended",
    initials: "GV",
  },
];

const activities = [
  {
    title: "New business registered",
    description: "Nairobi Fashion House joined MyDuka.",
    time: "12 minutes ago",
    icon: "▦",
    color: "blue",
  },
  {
    title: "New subscription activated",
    description: "FreshMart Groceries subscribed to Professional.",
    time: "38 minutes ago",
    icon: "◇",
    color: "green",
  },
  {
    title: "Support ticket received",
    description: "A business owner submitted a support request.",
    time: "1 hour ago",
    icon: "✉",
    color: "orange",
  },
  {
    title: "Platform user registered",
    description: "A new customer created an account.",
    time: "2 hours ago",
    icon: "♙",
    color: "purple",
  },
];

const subscriptionData = [
  { name: "Starter", percentage: 38, color: "#64748b", count: 420 },
  { name: "Professional", percentage: 43, color: "#6366f1", count: 475 },
  { name: "Enterprise", percentage: 19, color: "#10b981", count: 211 },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [period, setPeriod] = useState("7 months");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("myduka_superadmin_theme") === "dark";
  });

  const [showWelcome, setShowWelcome] = useState(true);

  const filteredBusinesses = useMemo(() => {
    return recentBusinesses.filter((business) =>
      `${business.name} ${business.owner} ${business.category}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search]);

  const visibleRegistrations = useMemo(() => {
    if (period === "3 months") {
      return registrations.slice(-3);
    }

    if (period === "6 months") {
      return registrations.slice(-6);
    }

    return registrations;
  }, [period]);

  function toggleTheme() {
    const nextTheme = !darkMode;

    setDarkMode(nextTheme);

    localStorage.setItem(
      "myduka_superadmin_theme",
      nextTheme ? "dark" : "light"
    );

    document.documentElement.setAttribute(
      "data-theme",
      nextTheme ? "dark" : "light"
    );
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }

    localStorage.removeItem("superAdminToken");

    navigate("/superadmin-login");
  }

  const maxBusinesses = Math.max(
    ...visibleRegistrations.map((item) => item.businesses)
  );

  const maxUsers = Math.max(
    ...visibleRegistrations.map((item) => item.users)
  );

  return (
    <div className={`sa-dashboard ${darkMode ? "dark" : ""}`}>
      <style>{`
        .sa-dashboard {
          --sa-bg: #f5f7fb;
          --sa-card: #ffffff;
          --sa-sidebar: #ffffff;
          --sa-text: #172033;
          --sa-muted: #788397;
          --sa-border: #e9edf3;
          --sa-primary: #635bdb;
          --sa-primary-light: #efedff;
          --sa-green: #159b69;
          --sa-red: #e05252;
          --sa-shadow: 0 3px 15px rgba(30, 41, 59, .035);

          display: flex;
          min-height: 100vh;
          background: var(--sa-bg);
          color: var(--sa-text);
          font-family: Inter, "Segoe UI", sans-serif;
          font-size: 14px;
        }

        .sa-dashboard.dark {
          --sa-bg: #101522;
          --sa-card: #192131;
          --sa-sidebar: #151d2c;
          --sa-text: #edf1f8;
          --sa-muted: #9ba8ba;
          --sa-border: #293448;
          --sa-primary: #9991ff;
          --sa-primary-light: #302c52;
          --sa-shadow: 0 3px 15px rgba(0, 0, 0, .15);
        }

        .sa-dashboard * {
          box-sizing: border-box;
        }

        .sa-sidebar {
          width: 255px;
          min-width: 255px;
          background: var(--sa-sidebar);
          border-right: 1px solid var(--sa-border);
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 30;
          transition: transform .25s ease;
        }

        .sa-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 9px 29px;
          border-bottom: 1px solid var(--sa-border);
        }

        .sa-brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #7769f6, #5045c8);
          color: white;
          display: grid;
          place-items: center;
          font-size: 23px;
          font-weight: 800;
        }

        .sa-brand-name {
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .sa-brand-name span {
          color: var(--sa-primary);
        }

        .sa-brand-caption {
          color: var(--sa-muted);
          font-size: 10px;
          letter-spacing: 1.2px;
          margin-top: 3px;
          font-weight: 700;
        }

        .sa-nav-label {
          color: var(--sa-muted);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.3px;
          padding: 26px 12px 12px;
        }

        .sa-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .sa-nav a {
          display: flex;
          align-items: center;
          gap: 13px;
          min-height: 43px;
          padding: 10px 13px;
          border-radius: 9px;
          text-decoration: none;
          color: var(--sa-muted);
          font-size: 13px;
          font-weight: 600;
          transition: .2s;
        }

        .sa-nav a:hover {
          background: var(--sa-primary-light);
          color: var(--sa-primary);
        }

        .sa-nav a.active {
          background: var(--sa-primary-light);
          color: var(--sa-primary);
          font-weight: 750;
        }

        .sa-nav-icon {
          width: 20px;
          text-align: center;
          font-size: 18px;
        }

        .sa-sidebar-bottom {
          margin-top: auto;
          border-top: 1px solid var(--sa-border);
          padding-top: 15px;
        }

        .sa-admin-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 7px;
        }

        .sa-avatar {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #786af4, #4d43ba);
          color: white;
          display: grid;
          place-items: center;
          font-weight: 800;
        }

        .sa-admin-name {
          font-size: 12px;
          font-weight: 750;
        }

        .sa-admin-role {
          color: var(--sa-muted);
          font-size: 11px;
          margin-top: 4px;
        }

        .sa-main {
          margin-left: 255px;
          width: calc(100% - 255px);
          min-width: 0;
        }

        .sa-topbar {
          height: 75px;
          background: var(--sa-card);
          border-bottom: 1px solid var(--sa-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .sa-top-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .sa-breadcrumb {
          color: var(--sa-muted);
          font-size: 12px;
        }

        .sa-breadcrumb strong {
          color: var(--sa-text);
        }

        .sa-top-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sa-icon-button {
          position: relative;
          border: 1px solid var(--sa-border);
          background: var(--sa-card);
          color: var(--sa-text);
          border-radius: 9px;
          width: 39px;
          height: 39px;
          cursor: pointer;
          font-size: 17px;
        }

        .sa-notification-dot {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ed5757;
          top: 7px;
          right: 7px;
        }

        .sa-notification-wrap {
          position: relative;
        }

        .sa-notification-dropdown {
          position: absolute;
          right: 0;
          top: 49px;
          width: 290px;
          background: var(--sa-card);
          border: 1px solid var(--sa-border);
          border-radius: 12px;
          box-shadow: var(--sa-shadow);
          padding: 17px;
          z-index: 50;
        }

        .sa-notification-dropdown p {
          color: var(--sa-muted);
          font-size: 12px;
          line-height: 1.6;
        }

        .sa-content {
          max-width: 1550px;
          padding: 30px 32px 45px;
          margin: auto;
        }

        .sa-page-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 24px;
        }

        .sa-page-heading h1 {
          font-size: 25px;
          letter-spacing: -.8px;
          margin: 0;
          font-weight: 800;
        }

        .sa-page-heading p {
          color: var(--sa-muted);
          margin: 8px 0 0;
          font-size: 12px;
        }

        .sa-date-select {
          border: 1px solid var(--sa-border);
          background: var(--sa-card);
          color: var(--sa-text);
          border-radius: 8px;
          padding: 10px 13px;
          outline: none;
          font-size: 12px;
        }

        .sa-welcome {
          background: linear-gradient(110deg, #655be0, #8178f7);
          color: white;
          border-radius: 13px;
          padding: 23px 25px;
          margin-bottom: 23px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          position: relative;
          overflow: hidden;
        }

        .sa-welcome h2 {
          font-size: 19px;
          margin: 0 0 7px;
        }

        .sa-welcome p {
          font-size: 12px;
          opacity: .88;
          margin: 0;
        }

        .sa-welcome-close {
          background: rgba(255,255,255,.15);
          border: 0;
          color: white;
          border-radius: 7px;
          padding: 6px 10px;
          cursor: pointer;
        }

        .sa-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 17px;
          margin-bottom: 22px;
        }

        .sa-card {
          background: var(--sa-card);
          border: 1px solid var(--sa-border);
          border-radius: 12px;
          box-shadow: var(--sa-shadow);
        }

        .sa-stat {
          padding: 19px;
        }

        .sa-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .sa-stat-label {
          color: var(--sa-muted);
          font-size: 12px;
          font-weight: 650;
        }

        .sa-stat-icon {
          width: 37px;
          height: 37px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: var(--sa-primary-light);
          color: var(--sa-primary);
          font-size: 19px;
        }

        .sa-stat-value {
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -.7px;
          white-space: nowrap;
        }

        .sa-stat-footer {
          display: flex;
          gap: 7px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 11px;
          font-size: 10px;
          color: var(--sa-muted);
        }

        .sa-positive {
          color: var(--sa-green);
          font-weight: 800;
        }

        .sa-negative {
          color: var(--sa-red);
          font-weight: 800;
        }

        .sa-charts-grid {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 18px;
          margin-bottom: 22px;
        }

        .sa-panel {
          padding: 20px;
          min-width: 0;
        }

        .sa-panel-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }

        .sa-panel-heading h3 {
          font-size: 14px;
          font-weight: 800;
          margin: 0;
        }

        .sa-panel-heading p {
          color: var(--sa-muted);
          font-size: 11px;
          margin: 6px 0 0;
        }

        .sa-legend {
          display: flex;
          gap: 15px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .sa-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          color: var(--sa-muted);
        }

        .sa-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .sa-chart {
          width: 100%;
          height: 220px;
          overflow: visible;
        }

        .sa-chart-gridline {
          stroke: var(--sa-border);
          stroke-dasharray: 4 5;
          stroke-width: 1;
        }

        .sa-chart-label {
          fill: var(--sa-muted);
          font-size: 10px;
        }

        .sa-chart-line {
          fill: none;
          stroke: #6d63e9;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .sa-chart-line-users {
          fill: none;
          stroke: #16a57b;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .sa-chart-point {
          fill: var(--sa-card);
          stroke-width: 2.5;
        }

        .sa-donut-area {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 22px;
          padding: 8px 0 18px;
        }

        .sa-donut {
          width: 155px;
          height: 155px;
          min-width: 155px;
          border-radius: 50%;
          background: conic-gradient(
            #64748b 0% 38%,
            #6366f1 38% 81%,
            #10b981 81% 100%
          );
          display: grid;
          place-items: center;
          position: relative;
        }

        .sa-donut::before {
          content: "";
          position: absolute;
          width: 105px;
          height: 105px;
          border-radius: 50%;
          background: var(--sa-card);
        }

        .sa-donut-center {
          position: relative;
          text-align: center;
        }

        .sa-donut-center strong {
          font-size: 23px;
          display: block;
        }

        .sa-donut-center span {
          color: var(--sa-muted);
          font-size: 10px;
        }

        .sa-subscription-legend {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }

        .sa-sub-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 11px;
        }

        .sa-sub-name {
          display: flex;
          align-items: center;
          gap: 7px;
          color: var(--sa-muted);
        }

        .sa-sub-row strong {
          font-size: 11px;
        }

        .sa-lower-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 18px;
        }

        .sa-search {
          border: 1px solid var(--sa-border);
          border-radius: 8px;
          background: var(--sa-bg);
          color: var(--sa-text);
          padding: 9px 11px;
          width: 190px;
          outline: none;
          font-size: 11px;
        }

        .sa-table-wrap {
          overflow-x: auto;
        }

        .sa-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 520px;
        }

        .sa-table th {
          color: var(--sa-muted);
          font-size: 10px;
          text-align: left;
          font-weight: 700;
          padding: 12px 9px;
          border-bottom: 1px solid var(--sa-border);
          white-space: nowrap;
        }

        .sa-table td {
          padding: 13px 9px;
          border-bottom: 1px solid var(--sa-border);
          font-size: 11px;
          white-space: nowrap;
        }

        .sa-business-cell {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .sa-business-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: var(--sa-primary-light);
          color: var(--sa-primary);
          font-weight: 800;
          font-size: 10px;
        }

        .sa-business-name {
          font-weight: 750;
        }

        .sa-business-category {
          color: var(--sa-muted);
          font-size: 10px;
          margin-top: 4px;
        }

        .sa-status {
          display: inline-block;
          border-radius: 20px;
          padding: 5px 9px;
          font-size: 9px;
          font-weight: 750;
        }

        .sa-status-active {
          background: #e4f7ee;
          color: #138354;
        }

        .sa-status-pending {
          background: #fff3db;
          color: #a36b13;
        }

        .sa-status-suspended {
          background: #fee9e9;
          color: #c43c3c;
        }

        .sa-view-link {
          color: var(--sa-primary);
          text-decoration: none;
          font-weight: 750;
        }

        .sa-activity-list {
          display: flex;
          flex-direction: column;
        }

        .sa-activity {
          display: flex;
          gap: 11px;
          padding: 14px 0;
          border-bottom: 1px solid var(--sa-border);
        }

        .sa-activity-icon {
          width: 35px;
          height: 35px;
          min-width: 35px;
          border-radius: 9px;
          display: grid;
          place-items: center;
          font-size: 16px;
        }

        .sa-activity-icon.blue {
          background: #e9efff;
          color: #4665d5;
        }

        .sa-activity-icon.green {
          background: #e1f6ed;
          color: #169568;
        }

        .sa-activity-icon.orange {
          background: #fff0df;
          color: #d78328;
        }

        .sa-activity-icon.purple {
          background: #f0eaff;
          color: #8658d5;
        }

        .sa-activity-title {
          font-size: 11px;
          font-weight: 750;
        }

        .sa-activity-description {
          color: var(--sa-muted);
          font-size: 10px;
          margin-top: 5px;
          line-height: 1.5;
        }

        .sa-activity-time {
          color: var(--sa-muted);
          font-size: 9px;
          margin-top: 5px;
        }

        .sa-quick-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 18px;
        }

        .sa-quick-action {
          text-decoration: none;
          background: var(--sa-bg);
          border: 1px solid var(--sa-border);
          border-radius: 9px;
          padding: 12px 8px;
          text-align: center;
          color: var(--sa-text);
          font-size: 10px;
          font-weight: 700;
          transition: .2s;
        }

        .sa-quick-action:hover {
          border-color: var(--sa-primary);
          color: var(--sa-primary);
          transform: translateY(-2px);
        }

        .sa-quick-action span {
          display: block;
          font-size: 19px;
          margin-bottom: 7px;
        }

        .sa-footer {
          padding: 25px 0 0;
          color: var(--sa-muted);
          font-size: 10px;
          text-align: center;
        }

        .sa-menu-toggle {
          display: none;
        }

        .sa-overlay {
          display: none;
        }

        @media(max-width: 1150px) {
          .sa-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .sa-charts-grid {
            grid-template-columns: 1fr;
          }

          .sa-lower-grid {
            grid-template-columns: 1fr;
          }
        }

        @media(max-width: 760px) {
          .sa-sidebar {
            transform: translateX(-100%);
          }

          .sa-sidebar.mobile-open {
            transform: translateX(0);
          }

          .sa-overlay.visible {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,.45);
            z-index: 25;
          }

          .sa-main {
            margin-left: 0;
            width: 100%;
          }

          .sa-topbar {
            height: 65px;
            padding: 0 15px;
          }

          .sa-menu-toggle {
            display: block;
          }

          .sa-content {
            padding: 22px 15px 35px;
          }

          .sa-page-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .sa-page-heading h1 {
            font-size: 22px;
          }

          .sa-welcome {
            padding: 19px;
          }

          .sa-welcome h2 {
            font-size: 16px;
          }

          .sa-stats-grid {
            gap: 11px;
          }

          .sa-stat {
            padding: 14px;
          }

          .sa-stat-value {
            font-size: 19px;
          }

          .sa-stat-label {
            font-size: 10px;
          }

          .sa-stat-icon {
            width: 31px;
            height: 31px;
          }

          .sa-panel {
            padding: 15px;
          }

          .sa-donut-area {
            flex-direction: column;
          }

          .sa-panel-heading {
            flex-wrap: wrap;
          }

          .sa-search {
            width: 100%;
          }
        }

        @media(max-width: 390px) {
          .sa-stats-grid {
            grid-template-columns: 1fr;
          }

          .sa-stat {
            padding: 17px;
          }

          .sa-stat-value {
            font-size: 23px;
          }

          .sa-quick-actions {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div
        className={`sa-overlay ${mobileMenu ? "visible" : ""}`}
        onClick={() => setMobileMenu(false)}
      />

      {/* SIDEBAR */}

      <aside className={`sa-sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <div className="sa-brand">
          <div className="sa-brand-icon">M</div>

          <div>
            <div className="sa-brand-name">
              My<span>Duka</span>
            </div>

            <div className="sa-brand-caption">
              PLATFORM ADMINISTRATION
            </div>
          </div>
        </div>

        <div className="sa-nav-label">MAIN MENU</div>

        <nav className="sa-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenu(false)}
              className={
                location.pathname === item.path ? "active" : ""
              }
            >
              <span className="sa-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sa-nav-label">ACCOUNT</div>

        <nav className="sa-nav">
          <Link
            to="/superadmin/profile"
            onClick={() => setMobileMenu(false)}
            className={
              location.pathname === "/superadmin/profile"
                ? "active"
                : ""
            }
          >
            <span className="sa-nav-icon">♙</span>
            My Profile
          </Link>

          <Link
            to="/superadmin/settings"
            onClick={() => setMobileMenu(false)}
            className={
              location.pathname === "/superadmin/settings"
                ? "active"
                : ""
            }
          >
            <span className="sa-nav-icon">⚙</span>
            Settings
          </Link>
        </nav>

        <div className="sa-sidebar-bottom">
          <div className="sa-admin-card">
            <div className="sa-avatar">SA</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sa-admin-name">Super Administrator</div>
              <div className="sa-admin-role">Platform Owner</div>
            </div>

            <button
              className="sa-icon-button"
              title="Logout"
              onClick={handleLogout}
              style={{
                width: 32,
                height: 32,
                border: "none",
              }}
            >
              ⇥
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="sa-main">
        <header className="sa-topbar">
          <div className="sa-top-left">
            <button
              className="sa-icon-button sa-menu-toggle"
              onClick={() => setMobileMenu(true)}
            >
              ☰
            </button>

            <div className="sa-breadcrumb">
              Super Admin / <strong>Overview</strong>
            </div>
          </div>

          <div className="sa-top-actions">
            <button
              className="sa-icon-button"
              title="Toggle theme"
              onClick={toggleTheme}
            >
              {darkMode ? "☀" : "☾"}
            </button>

            <div className="sa-notification-wrap">
              <button
                className="sa-icon-button"
                title="Notifications"
                onClick={() =>
                  setNotificationsOpen(!notificationsOpen)
                }
              >
                ♧
                <span className="sa-notification-dot" />
              </button>

              {notificationsOpen && (
                <div className="sa-notification-dropdown">
                  <strong>Notifications</strong>

                  <p>
                    You have new platform activities to review.
                  </p>

                  <Link
                    to="/superadmin/notifications"
                    className="sa-view-link"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    View all notifications →
                  </Link>
                </div>
              )}
            </div>

            <div className="sa-avatar">SA</div>
          </div>
        </header>

        <div className="sa-content">
          {/* PAGE HEADING */}

          <div className="sa-page-heading">
            <div>
              <h1>Platform Overview</h1>

              <p>
                Welcome back! Here's what's happening across MyDuka.
              </p>
            </div>

            <select
              className="sa-date-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>3 months</option>
              <option>6 months</option>
              <option>7 months</option>
            </select>
          </div>

          {/* WELCOME BANNER */}

          {showWelcome && (
            <div className="sa-welcome">
              <div>
                <h2>Welcome to MyDuka Administration 👋</h2>

                <p>
                  Manage businesses, subscriptions, users and your
                  entire SaaS platform from one place.
                </p>
              </div>

              <button
                className="sa-welcome-close"
                onClick={() => setShowWelcome(false)}
              >
                ✕
              </button>
            </div>
          )}

          {/* STATISTICS */}

          <div className="sa-stats-grid">
            {stats.map((stat) => (
              <div className="sa-card sa-stat" key={stat.label}>
                <div className="sa-stat-top">
                  <span className="sa-stat-label">
                    {stat.label}
                  </span>

                  <div className="sa-stat-icon">
                    {stat.icon}
                  </div>
                </div>

                <div className="sa-stat-value">
                  {stat.value}
                </div>

                <div className="sa-stat-footer">
                  <span className="sa-positive">
                    ↗ {stat.change}
                  </span>

                  <span>{stat.description}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CHARTS */}

          <div className="sa-charts-grid">
            {/* REGISTRATION CHART */}

            <section className="sa-card sa-panel">
              <div className="sa-panel-heading">
                <div>
                  <h3>Platform Growth</h3>

                  <p>
                    Business and user registration trends
                  </p>
                </div>
              </div>

              <div className="sa-legend">
                <div className="sa-legend-item">
                  <span
                    className="sa-legend-dot"
                    style={{ background: "#6d63e9" }}
                  />
                  Businesses
                </div>

                <div className="sa-legend-item">
                  <span
                    className="sa-legend-dot"
                    style={{ background: "#16a57b" }}
                  />
                  Users
                </div>
              </div>

              <svg
                className="sa-chart"
                viewBox="0 0 620 220"
                preserveAspectRatio="none"
              >
                {[35, 75, 115, 155, 195].map((y) => (
                  <line
                    key={y}
                    x1="40"
                    y1={y}
                    x2="605"
                    y2={y}
                    className="sa-chart-gridline"
                  />
                ))}

                {visibleRegistrations.map((item, index) => {
                  const x =
                    65 +
                    index *
                      (520 / Math.max(visibleRegistrations.length - 1, 1));

                  return (
                    <text
                      key={item.month}
                      x={x}
                      y="215"
                      textAnchor="middle"
                      className="sa-chart-label"
                    >
                      {item.month}
                    </text>
                  );
                })}

                <polyline
                  className="sa-chart-line"
                  points={visibleRegistrations
                    .map((item, index) => {
                      const x =
                        65 +
                        index *
                          (520 /
                            Math.max(visibleRegistrations.length - 1, 1));

                      const y =
                        190 - (item.businesses / maxBusinesses) * 145;

                      return `${x},${y}`;
                    })
                    .join(" ")}
                />

                <polyline
                  className="sa-chart-line-users"
                  points={visibleRegistrations
                    .map((item, index) => {
                      const x =
                        65 +
                        index *
                          (520 /
                            Math.max(visibleRegistrations.length - 1, 1));

                      const y =
                        190 - (item.users / maxUsers) * 145;

                      return `${x},${y}`;
                    })
                    .join(" ")}
                />

                {visibleRegistrations.map((item, index) => {
                  const x =
                    65 +
                    index *
                      (520 / Math.max(visibleRegistrations.length - 1, 1));

                  const businessY =
                    190 - (item.businesses / maxBusinesses) * 145;

                  const userY =
                    190 - (item.users / maxUsers) * 145;

                  return (
                    <g key={item.month}>
                      <circle
                        cx={x}
                        cy={businessY}
                        r="4"
                        className="sa-chart-point"
                        stroke="#6d63e9"
                      />

                      <circle
                        cx={x}
                        cy={userY}
                        r="4"
                        className="sa-chart-point"
                        stroke="#16a57b"
                      />
                    </g>
                  );
                })}
              </svg>
            </section>

            {/* SUBSCRIPTIONS */}

            <section className="sa-card sa-panel">
              <div className="sa-panel-heading">
                <div>
                  <h3>Subscription Distribution</h3>

                  <p>
                    Active subscriptions by plan
                  </p>
                </div>
              </div>

              <div className="sa-donut-area">
                <div className="sa-donut">
                  <div className="sa-donut-center">
                    <strong>1,106</strong>
                    <span>Subscribers</span>
                  </div>
                </div>
              </div>

              <div className="sa-subscription-legend">
                {subscriptionData.map((item) => (
                  <div className="sa-sub-row" key={item.name}>
                    <span className="sa-sub-name">
                      <span
                        className="sa-legend-dot"
                        style={{ background: item.color }}
                      />

                      {item.name}
                    </span>

                    <strong>
                      {item.count} ({item.percentage}%)
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RECENT BUSINESSES AND ACTIVITIES */}

          <div className="sa-lower-grid">
            <section className="sa-card sa-panel">
              <div className="sa-panel-heading">
                <div>
                  <h3>Recently Registered Businesses</h3>

                  <p>
                    Latest businesses joining the platform
                  </p>
                </div>

                <Link
                  to="/superadmin/businesses"
                  className="sa-view-link"
                >
                  View all →
                </Link>
              </div>

              <input
                className="sa-search"
                placeholder="Search businesses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: 12 }}
              />

              <div className="sa-table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>BUSINESS</th>
                      <th>OWNER</th>
                      <th>DATE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBusinesses.map((business) => (
                      <tr key={business.name}>
                        <td>
                          <div className="sa-business-cell">
                            <div className="sa-business-avatar">
                              {business.initials}
                            </div>

                            <div>
                              <div className="sa-business-name">
                                {business.name}
                              </div>

                              <div className="sa-business-category">
                                {business.category}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>{business.owner}</td>

                        <td>{business.date}</td>

                        <td>
                          <span
                            className={`sa-status sa-status-${business.status.toLowerCase()}`}
                          >
                            {business.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {filteredBusinesses.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: "center" }}>
                          No businesses found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ACTIVITY */}

            <section className="sa-card sa-panel">
              <div className="sa-panel-heading">
                <div>
                  <h3>Recent Activity</h3>

                  <p>
                    Latest events across MyDuka
                  </p>
                </div>

                <Link
                  to="/superadmin/audit-logs"
                  className="sa-view-link"
                >
                  View all →
                </Link>
              </div>

              <div className="sa-activity-list">
                {activities.map((activity, index) => (
                  <div className="sa-activity" key={index}>
                    <div
                      className={`sa-activity-icon ${activity.color}`}
                    >
                      {activity.icon}
                    </div>

                    <div>
                      <div className="sa-activity-title">
                        {activity.title}
                      </div>

                      <div className="sa-activity-description">
                        {activity.description}
                      </div>

                      <div className="sa-activity-time">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sa-quick-actions">
                <Link
                  to="/superadmin/businesses"
                  className="sa-quick-action"
                >
                  <span>＋</span>
                  Businesses
                </Link>

                <Link
                  to="/superadmin/plans"
                  className="sa-quick-action"
                >
                  <span>◇</span>
                  Plans
                </Link>

                <Link
                  to="/superadmin/users"
                  className="sa-quick-action"
                >
                  <span>♙</span>
                  Users
                </Link>
              </div>
            </section>
          </div>

          <div className="sa-footer">
            © 2026 MyDuka. All rights reserved. Platform Administration.
          </div>
        </div>
      </main>
    </div>
  );
}

export default SuperAdminDashboard;
