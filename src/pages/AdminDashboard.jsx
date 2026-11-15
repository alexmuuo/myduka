import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/api";

const PREVIEW_MODE =
  import.meta.env.DEV ||
  import.meta.env.VITE_FRONTEND_DEMO_MODE === "true";

function AdminDashboard() {
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [branches, setBranches] = useState([]);
  const [staff, setStaff] = useState([]);

  const [selectedBranch, setSelectedBranch] = useState(
    localStorage.getItem("mydukaBranchId") || "all"
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = useCallback(async () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    navigate("/admin-login", { replace: true });
  }, [navigate]);

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  const loadDashboard = useCallback(async () => {
    // FRONTEND PREVIEW MODE
    // Sample business data is used only for frontend development.

    if (PREVIEW_MODE) {
      setLoading(true);
      setError("");

      setBusiness({
        id: 1,
        name: "MyDuka Demo Store",
        slug: "myduka-demo",
        phone: "+254 700 000 000",
        address: "Kisii, Kenya",
        role: "owner",
        is_active: true,
      });

      setBranches([
        {
          id: 1,
          name: "Main Branch",
          address: "Kisii Town",
          phone: "+254 700 000 000",
          is_main: true,
          is_active: true,
        },
        {
          id: 2,
          name: "Nairobi Branch",
          address: "Nairobi CBD",
          phone: "+254 711 000 000",
          is_main: false,
          is_active: true,
        },
      ]);

      setStaff([
        {
          user_id: "demo-employee-001",
          role: "cashier",
          is_active: true,
          branches: [{ id: 1, name: "Main Branch" }],
        },
        {
          user_id: "demo-employee-002",
          role: "manager",
          is_active: true,
          branches: [
            { id: 1, name: "Main Branch" },
            { id: 2, name: "Nairobi Branch" },
          ],
        },
      ]);

      setLoading(false);
      return;
    }

    // NORMAL BACKEND MODE

    const selectedBusinessId = localStorage.getItem("mydukaBusinessId");

    if (!selectedBusinessId) {
      navigate("/admin-login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [businessResponse, branchesResponse] = await Promise.all([
        api.get("/businesses"),
        api.get(`/businesses/${selectedBusinessId}/branches`),
      ]);

      const businesses = businessResponse.data?.businesses || [];

      const currentBusiness = businesses.find(
        (item) => String(item.id) === String(selectedBusinessId)
      );

      if (!currentBusiness) {
        localStorage.removeItem("mydukaBusinessId");

        throw new Error(
          "You no longer have access to this business. Please log in again."
        );
      }

      setBusiness(currentBusiness);

      const loadedBranches = branchesResponse.data?.branches || [];

      setBranches(loadedBranches);

      if (["owner", "admin", "manager"].includes(currentBusiness.role)) {
        const staffResponse = await api.get(
          `/businesses/${selectedBusinessId}/staff`
        );

        setStaff(staffResponse.data?.staff || []);
      } else {
        setStaff([]);
      }
    } catch (err) {
      console.error("Dashboard loading failed:", err);

      if (err.response?.status === 401) {
        await handleLogout();
        return;
      }

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Could not load your business dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate, handleLogout]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // =========================================================
  // BRANCH SELECTION
  // =========================================================

  const handleBranchChange = (event) => {
    const value = event.target.value;

    setSelectedBranch(value);
    localStorage.setItem("mydukaBranchId", value);
  };

  const visibleBranches = useMemo(() => {
    if (selectedBranch === "all") {
      return branches;
    }

    return branches.filter(
      (branch) => String(branch.id) === String(selectedBranch)
    );
  }, [branches, selectedBranch]);

  const visibleStaff = useMemo(() => {
    if (selectedBranch === "all") {
      return staff;
    }

    return staff.filter((member) =>
      (member.branches || []).some(
        (branch) => String(branch.id) === String(selectedBranch)
      )
    );
  }, [staff, selectedBranch]);

  // =========================================================
  // DASHBOARD STATISTICS
  // =========================================================

  const activeBranches = branches.filter(
    (branch) => branch.is_active !== false
  ).length;

  const activeStaff = visibleStaff.filter(
    (member) => member.is_active !== false
  ).length;

  const ownerRole = business?.role || "owner";

  const formatRole = (role) =>
    String(role || "staff")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const getInitials = (name) => {
    if (!name) return "MD";

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="md-dashboard-loading">
        <div className="md-dashboard-spinner" />

        <h5>Preparing your dashboard</h5>

        <p>Loading your business information...</p>

        <style>{dashboardStyles}</style>
      </div>
    );
  }

  // =========================================================
  // ERROR SCREEN
  // =========================================================

  if (error) {
    return (
      <div className="md-dashboard-page">
        <div className="md-dashboard-error">
          <div className="md-dashboard-error-icon">
            <i className="bi bi-exclamation-triangle" />
          </div>

          <h4>Unable to load dashboard</h4>

          <p>{error}</p>

          <div className="md-dashboard-error-actions">
            <button
              className="md-dashboard-primary-button"
              onClick={loadDashboard}
            >
              <i className="bi bi-arrow-clockwise" />
              Try again
            </button>

            <button
              className="md-dashboard-secondary-button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>

        <style>{dashboardStyles}</style>
      </div>
    );
  }

  if (!business) {
    return null;
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="md-dashboard-page">
      <style>{dashboardStyles}</style>

      {/* PREVIEW NOTICE */}

      {PREVIEW_MODE && (
        <div className="md-dashboard-preview-notice">
          <i className="bi bi-info-circle-fill" />

          <span>
            Frontend preview mode — business, branch and staff records shown
            here are demonstration data, not live business records.
          </span>
        </div>
      )}

      {/* PAGE HEADER */}

      <div className="md-dashboard-header">
        <div>
          <div className="md-dashboard-eyebrow">
            BUSINESS OVERVIEW
          </div>

          <h1>Dashboard</h1>

          <p>
            Welcome back. Here's an overview of your business.
          </p>
        </div>

        <div className="md-dashboard-header-actions">
          <button
            className="md-dashboard-refresh"
            onClick={loadDashboard}
            title="Refresh dashboard"
          >
            <i className="bi bi-arrow-clockwise" />
            <span>Refresh</span>
          </button>

          <Link
            to="/admin/settings"
            className="md-dashboard-settings-button"
          >
            <i className="bi bi-gear" />
            Settings
          </Link>
        </div>
      </div>

      {/* BUSINESS INFORMATION */}

      <section className="md-dashboard-business-card">
        <div className="md-dashboard-business-main">
          <div className="md-dashboard-business-logo">
            {getInitials(business.name)}
          </div>

          <div className="md-dashboard-business-details">
            <div className="md-dashboard-business-title-row">
              <h2>{business.name}</h2>

              <span
                className={`md-dashboard-status ${
                  business.is_active === false ? "inactive" : ""
                }`}
              >
                <span />

                {business.is_active === false ? "Inactive" : "Active"}
              </span>
            </div>

            <p>
              <i className="bi bi-geo-alt" />
              {business.address || "Business address not provided"}
            </p>

            <div className="md-dashboard-business-meta">
              {business.phone && (
                <span>
                  <i className="bi bi-telephone" />
                  {business.phone}
                </span>
              )}

              <span>
                <i className="bi bi-person-badge" />
                {formatRole(ownerRole)}
              </span>
            </div>
          </div>
        </div>

        <Link
          to="/admin/profile"
          className="md-dashboard-business-edit"
        >
          <i className="bi bi-pencil-square" />
          Edit profile
        </Link>
      </section>

      {/* BRANCH FILTER */}

      <div className="md-dashboard-toolbar">
        <div>
          <h3>Business snapshot</h3>

          <p>Manage and monitor your business operations.</p>
        </div>

        <div className="md-dashboard-branch-filter">
          <label htmlFor="dashboardBranch">
            <i className="bi bi-shop" />
            Branch
          </label>

          <select
            id="dashboardBranch"
            value={selectedBranch}
            onChange={handleBranchChange}
          >
            <option value="all">All branches</option>

            {branches.map((branch) => (
              <option key={branch.id} value={String(branch.id)}>
                {branch.name}
                {branch.is_main ? " (Main)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="md-dashboard-stats-grid">
        <div className="md-dashboard-stat-card">
          <div className="md-dashboard-stat-top">
            <span className="md-dashboard-stat-icon purple">
              <i className="bi bi-shop" />
            </span>

            <span className="md-dashboard-stat-label">
              Total branches
            </span>
          </div>

          <div className="md-dashboard-stat-value">
            {branches.length}
          </div>

          <div className="md-dashboard-stat-description">
            Registered business locations
          </div>
        </div>

        <div className="md-dashboard-stat-card">
          <div className="md-dashboard-stat-top">
            <span className="md-dashboard-stat-icon green">
              <i className="bi bi-check-circle" />
            </span>

            <span className="md-dashboard-stat-label">
              Active branches
            </span>
          </div>

          <div className="md-dashboard-stat-value">
            {activeBranches}
          </div>

          <div className="md-dashboard-stat-description">
            Currently active locations
          </div>
        </div>

        <div className="md-dashboard-stat-card">
          <div className="md-dashboard-stat-top">
            <span className="md-dashboard-stat-icon blue">
              <i className="bi bi-people" />
            </span>

            <span className="md-dashboard-stat-label">
              Team members
            </span>
          </div>

          <div className="md-dashboard-stat-value">
            {visibleStaff.length}
          </div>

          <div className="md-dashboard-stat-description">
            {selectedBranch === "all"
              ? "Across all branches"
              : "Assigned to selected branch"}
          </div>
        </div>

        <div className="md-dashboard-stat-card">
          <div className="md-dashboard-stat-top">
            <span className="md-dashboard-stat-icon orange">
              <i className="bi bi-person-check" />
            </span>

            <span className="md-dashboard-stat-label">
              Active team
            </span>
          </div>

          <div className="md-dashboard-stat-value">
            {activeStaff}
          </div>

          <div className="md-dashboard-stat-description">
            Currently active staff members
          </div>
        </div>
      </div>

      {/* MAIN DASHBOARD CONTENT */}

      <div className="md-dashboard-content-grid">

        {/* LEFT COLUMN */}

        <div className="md-dashboard-main-column">

          {/* OPERATIONS */}

          <section className="md-dashboard-panel">
            <div className="md-dashboard-panel-header">
              <div>
                <h3>Business operations</h3>

                <p>Access your main business tools.</p>
              </div>

              <i className="bi bi-grid" />
            </div>

            <div className="md-dashboard-operations-grid">
              <Link to="/admin/products" className="md-dashboard-operation">
                <span className="operation-icon purple">
                  <i className="bi bi-box-seam" />
                </span>

                <span>
                  <strong>Products</strong>
                  <small>Manage your products</small>
                </span>

                <i className="bi bi-chevron-right operation-arrow" />
              </Link>

              <Link to="/admin/inventory" className="md-dashboard-operation">
                <span className="operation-icon blue">
                  <i className="bi bi-boxes" />
                </span>

                <span>
                  <strong>Inventory</strong>
                  <small>Monitor stock levels</small>
                </span>

                <i className="bi bi-chevron-right operation-arrow" />
              </Link>

              <Link to="/admin/orders" className="md-dashboard-operation">
                <span className="operation-icon orange">
                  <i className="bi bi-cart3" />
                </span>

                <span>
                  <strong>Orders</strong>
                  <small>Manage customer orders</small>
                </span>

                <i className="bi bi-chevron-right operation-arrow" />
              </Link>

              <Link to="/admin/sales" className="md-dashboard-operation">
                <span className="operation-icon green">
                  <i className="bi bi-graph-up-arrow" />
                </span>

                <span>
                  <strong>Sales</strong>
                  <small>View sales records</small>
                </span>

                <i className="bi bi-chevron-right operation-arrow" />
              </Link>

              <Link to="/admin/customers" className="md-dashboard-operation">
                <span className="operation-icon pink">
                  <i className="bi bi-people" />
                </span>

                <span>
                  <strong>Customers</strong>
                  <small>Manage your customers</small>
                </span>

                <i className="bi bi-chevron-right operation-arrow" />
              </Link>

              <Link to="/admin/reports" className="md-dashboard-operation">
                <span className="operation-icon teal">
                  <i className="bi bi-bar-chart-line" />
                </span>

                <span>
                  <strong>Reports</strong>
                  <small>Business performance</small>
                </span>

                <i className="bi bi-chevron-right operation-arrow" />
              </Link>
            </div>
          </section>

          {/* BRANCHES */}

          <section className="md-dashboard-panel">
            <div className="md-dashboard-panel-header">
              <div>
                <h3>Branch locations</h3>

                <p>Your registered business locations.</p>
              </div>

              <Link to="/admin/branches">
                Manage branches
                <i className="bi bi-arrow-up-right" />
              </Link>
            </div>

            {visibleBranches.length === 0 ? (
              <div className="md-dashboard-empty">
                <i className="bi bi-shop" />
                <p>No branches found.</p>
              </div>
            ) : (
              <div className="md-dashboard-branch-list">
                {visibleBranches.map((branch) => (
                  <div className="md-dashboard-branch-item" key={branch.id}>
                    <div className="md-dashboard-branch-icon">
                      <i className="bi bi-shop-window" />
                    </div>

                    <div className="md-dashboard-branch-info">
                      <div className="md-dashboard-branch-name">
                        {branch.name}

                        {branch.is_main && (
                          <span className="md-dashboard-main-badge">
                            Main branch
                          </span>
                        )}
                      </div>

                      <small>
                        <i className="bi bi-geo-alt" />
                        {branch.address || "No address provided"}
                      </small>
                    </div>

                    <span
                      className={`md-dashboard-status ${
                        branch.is_active === false ? "inactive" : ""
                      }`}
                    >
                      <span />

                      {branch.is_active === false ? "Inactive" : "Active"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN */}

        <div className="md-dashboard-side-column">

          {/* TEAM */}

          <section className="md-dashboard-panel">
            <div className="md-dashboard-panel-header">
              <div>
                <h3>Your team</h3>

                <p>Staff assigned to your business.</p>
              </div>

              <Link to="/admin/cashiers" title="Manage staff">
                <i className="bi bi-arrow-up-right" />
              </Link>
            </div>

            {visibleStaff.length === 0 ? (
              <div className="md-dashboard-empty">
                <i className="bi bi-people" />
                <p>No team members found.</p>

                <Link to="/admin/cashiers">
                  Add team members
                </Link>
              </div>
            ) : (
              <div className="md-dashboard-team-list">
                {visibleStaff.slice(0, 5).map((member, index) => {
                  const name =
                    member.full_name ||
                    member.name ||
                    member.username ||
                    `Team member ${index + 1}`;

                  return (
                    <div
                      className="md-dashboard-team-member"
                      key={member.user_id || member.id || index}
                    >
                      <div className="md-dashboard-team-avatar">
                        {getInitials(name)}
                      </div>

                      <div className="md-dashboard-team-info">
                        <strong>{name}</strong>

                        <small>{formatRole(member.role)}</small>
                      </div>

                      <span
                        className={`md-dashboard-team-status ${
                          member.is_active === false ? "inactive" : ""
                        }`}
                        title={
                          member.is_active === false
                            ? "Inactive"
                            : "Active"
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {visibleStaff.length > 5 && (
              <Link
                to="/admin/cashiers"
                className="md-dashboard-view-all"
              >
                View all {visibleStaff.length} team members
                <i className="bi bi-arrow-right" />
              </Link>
            )}

            <Link
              to="/admin/cashiers"
              className="md-dashboard-add-staff"
            >
              <i className="bi bi-plus-lg" />
              Manage team members
            </Link>
          </section>

          {/* BUSINESS STATUS */}

          <section className="md-dashboard-panel md-dashboard-status-panel">
            <div className="md-dashboard-panel-header">
              <div>
                <h3>Business status</h3>
                <p>Account information.</p>
              </div>

              <i className="bi bi-shield-check" />
            </div>

            <div className="md-dashboard-status-row">
              <span>Business</span>

              <strong>
                {business.is_active === false ? "Inactive" : "Active"}
              </strong>
            </div>

            <div className="md-dashboard-status-row">
              <span>Account role</span>

              <strong>{formatRole(ownerRole)}</strong>
            </div>

            <div className="md-dashboard-status-row">
              <span>Branches</span>

              <strong>{branches.length}</strong>
            </div>

            <div className="md-dashboard-status-row">
              <span>Team members</span>

              <strong>{staff.length}</strong>
            </div>

            <Link
              to="/admin/subscription"
              className="md-dashboard-subscription-link"
            >
              View subscription
              <i className="bi bi-arrow-right" />
            </Link>
          </section>
        </div>
      </div>

      {/* ANALYTICS PLACEHOLDER */}

      <section className="md-dashboard-panel md-dashboard-analytics-notice">
        <div className="md-dashboard-analytics-icon">
          <i className="bi bi-bar-chart-line" />
        </div>

        <div>
          <h3>Sales analytics</h3>

          <p>
            Revenue trends, sales charts, recent transactions and inventory
            alerts will appear here when their respective backend data
            endpoints are connected.
          </p>

          <span>
            <i className="bi bi-info-circle" />
            No simulated sales figures are being displayed.
          </span>
        </div>

        <Link to="/admin/reports">
          Open reports
          <i className="bi bi-arrow-right" />
        </Link>
      </section>
    </div>
  );
}

// =============================================================
// DASHBOARD STYLES
// =============================================================

const dashboardStyles = `
.md-dashboard-page {
  --md-dash-bg: var(--background, #f5f7fb);
  --md-dash-card: var(--surface, #ffffff);
  --md-dash-text: var(--text-primary, #172033);
  --md-dash-muted: var(--text-muted, #8490a5);
  --md-dash-border: var(--border, #e7eaf0);
  --md-dash-primary: var(--primary, #4f46e5);
  --md-dash-primary-light: var(--primary-light, #eef2ff);

  min-height: calc(100vh - 72px);
  padding: 30px clamp(16px, 3vw, 38px) 45px;
  background: var(--md-dash-bg);
  color: var(--md-dash-text);
}

.md-dashboard-page * {
  box-sizing: border-box;
}

.md-dashboard-preview-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  margin-bottom: 24px;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
}

.md-dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 25px;
}

.md-dashboard-eyebrow {
  color: var(--md-dash-primary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  margin-bottom: 7px;
}

.md-dashboard-header h1 {
  margin: 0;
  color: var(--md-dash-text);
  font-size: clamp(25px, 3vw, 32px);
  font-weight: 800;
  letter-spacing: -1.1px;
}

.md-dashboard-header p {
  margin: 7px 0 0;
  color: var(--md-dash-muted);
  font-size: 13px;
}

.md-dashboard-header-actions {
  display: flex;
  align-items: center;
  gap: 9px;
}

.md-dashboard-refresh,
.md-dashboard-settings-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid var(--md-dash-border);
  border-radius: 9px;
  background: var(--md-dash-card);
  color: var(--md-dash-text);
  font-size: 12px;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
  transition: .2s ease;
}

.md-dashboard-refresh:hover,
.md-dashboard-settings-button:hover {
  border-color: var(--md-dash-primary);
  color: var(--md-dash-primary);
}

.md-dashboard-business-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 22px;
  margin-bottom: 27px;
  border: 1px solid var(--md-dash-border);
  border-radius: 15px;
  background: var(--md-dash-card);
  box-shadow: var(--shadow-sm, 0 3px 12px rgba(20,30,60,.035));
}

.md-dashboard-business-main {
  display: flex;
  align-items: center;
  gap: 17px;
  min-width: 0;
}

.md-dashboard-business-logo {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 15px;
  background: var(--md-dash-primary-light);
  color: var(--md-dash-primary);
  font-size: 20px;
  font-weight: 800;
}

.md-dashboard-business-details {
  min-width: 0;
}

.md-dashboard-business-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 11px;
}

.md-dashboard-business-title-row h2 {
  margin: 0;
  color: var(--md-dash-text);
  font-size: 18px;
  font-weight: 800;
}

.md-dashboard-business-details > p {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 7px 0;
  color: var(--md-dash-muted);
  font-size: 12px;
}

.md-dashboard-business-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.md-dashboard-business-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--md-dash-muted);
  font-size: 11px;
}

.md-dashboard-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border-radius: 20px;
  background: #ecfdf3;
  color: #15803d;
  font-size: 10px;
  font-weight: 750;
  white-space: nowrap;
}

.md-dashboard-status > span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16a34a;
}

.md-dashboard-status.inactive {
  background: #fff1f2;
  color: #be123c;
}

.md-dashboard-status.inactive > span {
  background: #e11d48;
}

.md-dashboard-business-edit {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 12px;
  border: 1px solid var(--md-dash-border);
  border-radius: 8px;
  color: var(--md-dash-text);
  font-size: 11px;
  font-weight: 650;
  text-decoration: none;
  white-space: nowrap;
}

.md-dashboard-business-edit:hover {
  border-color: var(--md-dash-primary);
  color: var(--md-dash-primary);
}

.md-dashboard-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 17px;
}

.md-dashboard-toolbar h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.md-dashboard-toolbar p {
  margin: 5px 0 0;
  color: var(--md-dash-muted);
  font-size: 11px;
}

.md-dashboard-branch-filter {
  display: flex;
  align-items: center;
  gap: 10px;
}

.md-dashboard-branch-filter label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--md-dash-muted);
  font-size: 11px;
  font-weight: 650;
}

.md-dashboard-branch-filter select {
  min-width: 165px;
  min-height: 38px;
  padding: 0 30px 0 11px;
  border: 1px solid var(--md-dash-border);
  border-radius: 8px;
  outline: none;
  background: var(--md-dash-card);
  color: var(--md-dash-text);
  font-size: 11px;
}

.md-dashboard-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 15px;
  margin-bottom: 23px;
}

.md-dashboard-stat-card {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--md-dash-border);
  border-radius: 13px;
  background: var(--md-dash-card);
  box-shadow: var(--shadow-sm, 0 3px 12px rgba(20,30,60,.025));
}

.md-dashboard-stat-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.md-dashboard-stat-icon {
  width: 35px;
  height: 35px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-size: 15px;
}

.md-dashboard-stat-icon.purple,
.operation-icon.purple {
  background: #eef2ff;
  color: #4f46e5;
}

.md-dashboard-stat-icon.green,
.operation-icon.green {
  background: #ecfdf3;
  color: #16a34a;
}

.md-dashboard-stat-icon.blue,
.operation-icon.blue {
  background: #eff6ff;
  color: #2563eb;
}

.md-dashboard-stat-icon.orange,
.operation-icon.orange {
  background: #fff7ed;
  color: #ea580c;
}

.md-dashboard-stat-label {
  color: var(--md-dash-muted);
  font-size: 11px;
  font-weight: 650;
}

.md-dashboard-stat-value {
  margin-top: 17px;
  color: var(--md-dash-text);
  font-size: 29px;
  font-weight: 800;
  letter-spacing: -1px;
}

.md-dashboard-stat-description {
  margin-top: 4px;
  color: var(--md-dash-muted);
  font-size: 10px;
}

.md-dashboard-content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(280px, .85fr);
  gap: 18px;
  align-items: start;
}

.md-dashboard-main-column,
.md-dashboard-side-column {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.md-dashboard-panel {
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--md-dash-border);
  border-radius: 13px;
  background: var(--md-dash-card);
  box-shadow: var(--shadow-sm, 0 3px 12px rgba(20,30,60,.025));
}

.md-dashboard-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 19px;
}

.md-dashboard-panel-header h3 {
  margin: 0;
  color: var(--md-dash-text);
  font-size: 14px;
  font-weight: 800;
}

.md-dashboard-panel-header p {
  margin: 5px 0 0;
  color: var(--md-dash-muted);
  font-size: 10px;
}

.md-dashboard-panel-header > i {
  color: var(--md-dash-muted);
  font-size: 17px;
}

.md-dashboard-panel-header > a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--md-dash-primary);
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.md-dashboard-operations-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.md-dashboard-operation {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  padding: 13px 11px;
  border: 1px solid var(--md-dash-border);
  border-radius: 10px;
  color: var(--md-dash-text);
  text-decoration: none;
  transition: .2s ease;
}

.md-dashboard-operation:hover {
  border-color: var(--md-dash-primary);
  background: var(--md-dash-primary-light);
  transform: translateY(-1px);
}

.operation-icon {
  width: 35px;
  height: 35px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 9px;
  font-size: 15px;
}

.operation-icon.pink {
  background: #fdf2f8;
  color: #db2777;
}

.operation-icon.teal {
  background: #f0fdfa;
  color: #0d9488;
}

.md-dashboard-operation > span:nth-child(2) {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.md-dashboard-operation strong {
  color: var(--md-dash-text);
  font-size: 11px;
  font-weight: 750;
}

.md-dashboard-operation small {
  overflow: hidden;
  color: var(--md-dash-muted);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.operation-arrow {
  margin-left: auto;
  color: var(--md-dash-muted);
  font-size: 11px;
}

.md-dashboard-branch-list {
  display: flex;
  flex-direction: column;
}

.md-dashboard-branch-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 0;
  border-top: 1px solid var(--md-dash-border);
}

.md-dashboard-branch-icon {
  width: 37px;
  height: 37px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--md-dash-primary-light);
  color: var(--md-dash-primary);
}

.md-dashboard-branch-info {
  flex: 1;
  min-width: 0;
}

.md-dashboard-branch-name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  color: var(--md-dash-text);
  font-size: 11px;
  font-weight: 750;
}

.md-dashboard-main-badge {
  padding: 3px 6px;
  border-radius: 5px;
  background: var(--md-dash-primary-light);
  color: var(--md-dash-primary);
  font-size: 8px;
}

.md-dashboard-branch-info small {
  display: block;
  margin-top: 5px;
  color: var(--md-dash-muted);
  font-size: 10px;
}

.md-dashboard-branch-info small i {
  margin-right: 5px;
}

.md-dashboard-team-list {
  display: flex;
  flex-direction: column;
}

.md-dashboard-team-member {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 0;
  border-top: 1px solid var(--md-dash-border);
}

.md-dashboard-team-avatar {
  width: 35px;
  height: 35px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--md-dash-primary-light);
  color: var(--md-dash-primary);
  font-size: 11px;
  font-weight: 800;
}

.md-dashboard-team-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.md-dashboard-team-info strong {
  overflow: hidden;
  color: var(--md-dash-text);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.md-dashboard-team-info small {
  color: var(--md-dash-muted);
  font-size: 9px;
}

.md-dashboard-team-status {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #16a34a;
}

.md-dashboard-team-status.inactive {
  background: #e11d48;
}

.md-dashboard-add-staff {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 37px;
  margin-top: 12px;
  border: 1px dashed var(--md-dash-border);
  border-radius: 8px;
  color: var(--md-dash-primary);
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
}

.md-dashboard-add-staff:hover {
  background: var(--md-dash-primary-light);
}

.md-dashboard-view-all {
  display: flex;
  justify-content: space-between;
  padding: 10px 0 0;
  color: var(--md-dash-primary);
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
}

.md-dashboard-status-panel {
  background: var(--md-dash-card);
}

.md-dashboard-status-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 0;
  border-top: 1px solid var(--md-dash-border);
  font-size: 10px;
}

.md-dashboard-status-row span {
  color: var(--md-dash-muted);
}

.md-dashboard-status-row strong {
  color: var(--md-dash-text);
  font-weight: 750;
}

.md-dashboard-subscription-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding: 11px 12px;
  border-radius: 8px;
  background: var(--md-dash-primary-light);
  color: var(--md-dash-primary);
  font-size: 10px;
  font-weight: 750;
  text-decoration: none;
}

.md-dashboard-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 10px;
  color: var(--md-dash-muted);
  text-align: center;
}

.md-dashboard-empty > i {
  margin-bottom: 9px;
  font-size: 25px;
}

.md-dashboard-empty p {
  margin: 0 0 8px;
  font-size: 11px;
}

.md-dashboard-empty a {
  color: var(--md-dash-primary);
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
}

.md-dashboard-analytics-notice {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 19px;
}

.md-dashboard-analytics-icon {
  width: 43px;
  height: 43px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--md-dash-primary-light);
  color: var(--md-dash-primary);
  font-size: 19px;
}

.md-dashboard-analytics-notice > div:nth-child(2) {
  flex: 1;
  min-width: 0;
}

.md-dashboard-analytics-notice h3 {
  margin: 0 0 5px;
  font-size: 12px;
  font-weight: 800;
}

.md-dashboard-analytics-notice p {
  margin: 0;
  color: var(--md-dash-muted);
  font-size: 10px;
  line-height: 1.6;
}

.md-dashboard-analytics-notice span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 7px;
  color: var(--md-dash-muted);
  font-size: 9px;
}

.md-dashboard-analytics-notice > a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--md-dash-primary);
  font-size: 10px;
  font-weight: 750;
  text-decoration: none;
  white-space: nowrap;
}

.md-dashboard-loading,
.md-dashboard-error {
  min-height: 65vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 25px;
  background: var(--background, #f5f7fb);
  color: var(--text-primary, #172033);
  text-align: center;
}

.md-dashboard-spinner {
  width: 36px;
  height: 36px;
  margin-bottom: 17px;
  border: 3px solid var(--border, #e7eaf0);
  border-top-color: var(--primary, #4f46e5);
  border-radius: 50%;
  animation: md-dashboard-spin .8s linear infinite;
}

@keyframes md-dashboard-spin {
  to { transform: rotate(360deg); }
}

.md-dashboard-loading h5,
.md-dashboard-error h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 750;
}

.md-dashboard-loading p,
.md-dashboard-error p {
  max-width: 440px;
  margin: 8px 0 0;
  color: var(--text-muted, #8490a5);
  font-size: 12px;
  line-height: 1.6;
}

.md-dashboard-error-icon {
  width: 55px;
  height: 55px;
  display: grid;
  place-items: center;
  margin-bottom: 16px;
  border-radius: 50%;
  background: #fff1f2;
  color: #e11d48;
  font-size: 23px;
}

.md-dashboard-error-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.md-dashboard-primary-button,
.md-dashboard-secondary-button {
  min-height: 39px;
  padding: 0 15px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.md-dashboard-primary-button {
  border: 1px solid var(--primary, #4f46e5);
  background: var(--primary, #4f46e5);
  color: white;
}

.md-dashboard-secondary-button {
  border: 1px solid var(--border, #e7eaf0);
  background: var(--surface, white);
  color: var(--text-primary, #172033);
}

@media (max-width: 1050px) {
  .md-dashboard-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .md-dashboard-content-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .md-dashboard-side-column {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}

@media (max-width: 650px) {
  .md-dashboard-page {
    padding: 20px 13px 35px;
  }

  .md-dashboard-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .md-dashboard-header-actions {
    width: 100%;
  }

  .md-dashboard-refresh,
  .md-dashboard-settings-button {
    flex: 1;
  }

  .md-dashboard-business-card {
    align-items: flex-start;
    flex-direction: column;
    padding: 16px;
  }

  .md-dashboard-business-main {
    gap: 12px;
  }

  .md-dashboard-business-logo {
    width: 48px;
    height: 48px;
    font-size: 16px;
  }

  .md-dashboard-business-title-row h2 {
    font-size: 15px;
  }

  .md-dashboard-business-edit {
    width: 100%;
    justify-content: center;
  }

  .md-dashboard-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .md-dashboard-branch-filter {
    width: 100%;
    justify-content: space-between;
  }

  .md-dashboard-branch-filter select {
    flex: 1;
    max-width: 220px;
  }

  .md-dashboard-stats-grid {
    gap: 10px;
  }

  .md-dashboard-stat-card {
    padding: 13px;
  }

  .md-dashboard-stat-value {
    font-size: 25px;
    margin-top: 12px;
  }

  .md-dashboard-stat-top {
    align-items: flex-start;
    flex-direction: column;
    gap: 7px;
  }

  .md-dashboard-side-column {
    display: flex;
  }

  .md-dashboard-panel {
    padding: 15px;
  }

  .md-dashboard-operations-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .md-dashboard-analytics-notice {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .md-dashboard-analytics-notice > a {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 380px) {
  .md-dashboard-stat-card {
    padding: 11px;
  }

  .md-dashboard-stat-label {
    font-size: 10px;
  }

  .md-dashboard-stat-value {
    font-size: 22px;
  }

  .md-dashboard-business-meta {
    flex-direction: column;
    gap: 5px;
  }
}
`;

export default AdminDashboard;
