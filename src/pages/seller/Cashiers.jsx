import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/api";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cashier" },
];

const styles = `
.md-employees {
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 24px;
  color: var(--text-primary, #172033);
}
.md-employees * { box-sizing: border-box; }
.md-employees button,
.md-employees input,
.md-employees select { font: inherit; }
.md-employees button { cursor: pointer; }
.md-employees button:disabled { opacity: .55; cursor: not-allowed; }

.md-employees .me-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
.md-employees h1 {
  font-size: 26px;
  margin: 0 0 7px;
  font-weight: 750;
}
.md-employees .me-subtitle {
  color: var(--text-secondary, #64748b);
  margin: 0;
  font-size: 14px;
}
.md-employees .me-btn {
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 9px;
  padding: 10px 15px;
  font-weight: 650;
  background: var(--card-bg, #fff);
  color: var(--text-primary, #172033);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}
.md-employees .me-btn-primary {
  background: var(--primary-color, #2563eb);
  border-color: var(--primary-color, #2563eb);
  color: white;
}
.md-employees .me-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}
.md-employees .me-stat {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 17px;
}
.md-employees .me-stat-label {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}
.md-employees .me-stat-value {
  font-size: 26px;
  font-weight: 750;
  margin-top: 8px;
}
.md-employees .me-toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}
.md-employees .me-input,
.md-employees .me-select {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--input-bg, var(--card-bg, #fff));
  color: var(--text-primary, #172033);
  border-radius: 8px;
  padding: 10px 11px;
  outline: none;
}
.md-employees .me-input:focus,
.md-employees .me-select:focus {
  border-color: var(--primary-color, #2563eb);
}
.md-employees .me-search { flex: 1 1 250px; }
.md-employees .me-filter { flex: 0 1 190px; }

.md-employees .me-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  background: var(--card-bg, #fff);
}
.md-employees table {
  border-collapse: collapse;
  width: 100%;
  min-width: 760px;
}
.md-employees th,
.md-employees td {
  padding: 14px 15px;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  font-size: 13px;
}
.md-employees th {
  color: var(--text-secondary, #64748b);
  font-weight: 650;
  background: var(--surface-bg, #f8fafc);
  white-space: nowrap;
}
.md-employees tr:last-child td { border-bottom: 0; }
.md-employees .me-person {
  display: flex;
  align-items: center;
  gap: 10px;
}
.md-employees .me-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: var(--surface-bg, #eff6ff);
  color: var(--primary-color, #2563eb);
  font-weight: 750;
}
.md-employees .me-person-name { font-weight: 700; }
.md-employees .me-muted {
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  margin-top: 3px;
  overflow-wrap: anywhere;
}
.md-employees .me-badge {
  display: inline-flex;
  border-radius: 20px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.md-employees .me-active {
  background: #dcfce7;
  color: #166534;
}
.md-employees .me-suspended {
  background: #fee2e2;
  color: #991b1b;
}
.md-employees .me-actions { display: flex; gap: 7px; }
.md-employees .me-icon-btn {
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 7px;
  background: transparent;
  color: var(--text-primary, #172033);
  padding: 6px 9px;
}
.md-employees .me-empty {
  padding: 55px 20px;
  text-align: center;
}
.md-employees .me-empty-icon {
  font-size: 34px;
  margin-bottom: 10px;
}
.md-employees .me-empty h3 {
  margin: 0 0 7px;
  font-size: 17px;
}
.md-employees .me-empty p {
  margin: 0 auto 17px;
  max-width: 440px;
  line-height: 1.5;
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}
.md-employees .me-message {
  padding: 12px 15px;
  border-radius: 9px;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 16px;
}
.md-employees .me-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.md-employees .me-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.md-employees .me-loading {
  padding: 45px 20px;
  text-align: center;
  color: var(--text-secondary, #64748b);
}
.md-employees .me-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15,23,42,.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  overflow-y: auto;
}
.md-employees .me-modal {
  width: 100%;
  max-width: 560px;
  max-height: 92vh;
  overflow-y: auto;
  background: var(--card-bg, #fff);
  color: var(--text-primary, #172033);
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 20px 60px rgba(0,0,0,.2);
}
.md-employees .me-modal-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}
.md-employees .me-modal-header h2 {
  font-size: 19px;
  margin: 0;
}
.md-employees .me-close {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 24px;
}
.md-employees .me-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 16px;
}
.md-employees .me-field label {
  font-size: 12px;
  font-weight: 700;
}
.md-employees .me-field small {
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  line-height: 1.5;
}
.md-employees .me-branches {
  display: grid;
  gap: 9px;
  margin-top: 4px;
}
.md-employees .me-branch-option {
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  padding: 11px;
  font-size: 13px;
}
.md-employees .me-branch-option input {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-color, #2563eb);
}
.md-employees .me-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 22px;
  flex-wrap: wrap;
}
.md-employees .me-notice {
  padding: 11px;
  border-radius: 8px;
  background: var(--surface-bg, #f8fafc);
  font-size: 12px;
  line-height: 1.5;
  margin-top: 15px;
}
@media (max-width: 700px) {
  .md-employees { padding: 16px; }
  .md-employees h1 { font-size: 22px; }
  .md-employees .me-stats { grid-template-columns: 1fr 1fr; }
  .md-employees .me-modal { padding: 17px; }
}
@media (max-width: 420px) {
  .md-employees .me-stats { grid-template-columns: 1fr; }
}
`;

function getBusinessId() {
  return localStorage.getItem("mydukaBusinessId");
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function roleLabel(role) {
  return ROLES.find((item) => item.value === role)?.label || role || "—";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getBranchNames(member) {
  if (!Array.isArray(member.branches) || member.branches.length === 0) {
    return "No branch assigned";
  }

  return member.branches
    .map((branch) => branch.name || `Branch ${branch.id}`)
    .join(", ");
}

function downloadCSV(employees) {
  const headers = [
    "User ID",
    "Email",
    "Role",
    "Branches",
    "Account Status",
    "Date Added",
  ];

  const rows = employees.map((employee) => [
    employee.user_id,
    employee.email || "",
    roleLabel(employee.role),
    getBranchNames(employee),
    employee.is_active ? "Active" : "Suspended",
    formatDate(employee.created_at),
  ]);

  const escape = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "myduka-staff.csv";
  link.click();

  URL.revokeObjectURL(url);
}

export default function Cashiers() {
  const businessId = getBusinessId();

  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("cashier");
  const [selectedBranches, setSelectedBranches] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    if (!businessId) {
      setError("No active business was found. Please select or create a business first.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [staffResponse, branchResponse] = await Promise.all([
        api.get(`/businesses/${businessId}/staff`),
        api.get(`/businesses/${businessId}/branches`),
      ]);

      const staffData = staffResponse.data?.staff;
      const branchData = branchResponse.data?.branches;

      setEmployees(Array.isArray(staffData) ? staffData : []);
      setBranches(Array.isArray(branchData) ? branchData : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((item) => item.is_active).length,
    suspended: employees.filter((item) => !item.is_active).length,
  }), [employees]);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const branchNames = getBranchNames(employee);

      const matchesSearch =
        !term ||
        [
          employee.email,
          employee.user_id,
          employee.role,
          branchNames,
        ].some((value) =>
          String(value || "").toLowerCase().includes(term)
        );

      const matchesRole =
        roleFilter === "all" || employee.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && employee.is_active) ||
        (statusFilter === "suspended" && !employee.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees, search, roleFilter, statusFilter]);

  function openInviteModal() {
    setEmail("");
    setRole("cashier");
    setSelectedBranches([]);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function toggleBranch(branchId) {
    setSelectedBranches((current) =>
      current.includes(branchId)
        ? current.filter((id) => id !== branchId)
        : [...current, branchId]
    );
  }

  async function sendInvitation(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter the employee's email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (selectedBranches.length === 0) {
      setError("Assign the employee to at least one branch.");
      return;
    }

    if (!businessId) {
      setError("No active business was found.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post(`/businesses/${businessId}/staff/invite`, {
        email: normalizedEmail,
        role,
        branch_ids: selectedBranches,
      });

      setModalOpen(false);
      setEmail("");
      setSelectedBranches([]);

      setSuccess(
        `Invitation sent to ${normalizedEmail}. The employee should check their email to accept it.`
      );

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="md-employees">
      <style>{styles}</style>

      <div className="me-header">
        <div>
          <h1>Staff & Cashier Management</h1>
          <p className="me-subtitle">
            Invite your team, assign roles and manage branch access.
          </p>
        </div>

        <button
          className="me-btn me-btn-primary"
          onClick={openInviteModal}
          disabled={!businessId || branches.length === 0}
        >
          + Invite Staff
        </button>
      </div>

      {error && !modalOpen && (
        <div className="me-message me-error">{error}</div>
      )}

      {success && (
        <div className="me-message me-success">{success}</div>
      )}

      <div className="me-stats">
        <div className="me-stat">
          <div className="me-stat-label">Total staff</div>
          <div className="me-stat-value">{stats.total}</div>
        </div>

        <div className="me-stat">
          <div className="me-stat-label">Active accounts</div>
          <div className="me-stat-value">{stats.active}</div>
        </div>

        <div className="me-stat">
          <div className="me-stat-label">Suspended accounts</div>
          <div className="me-stat-value">{stats.suspended}</div>
        </div>
      </div>

      <div className="me-toolbar">
        <input
          className="me-input me-search"
          placeholder="Search email, role, user ID or branch..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="me-select me-filter"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="all">All roles</option>
          {ROLES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          className="me-select me-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All account statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>

        <button
          className="me-btn"
          onClick={() => downloadCSV(filteredEmployees)}
          disabled={!filteredEmployees.length}
        >
          ↓ Export CSV
        </button>

        <button
          className="me-btn"
          onClick={loadData}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="me-table-wrap">
        {loading ? (
          <div className="me-loading">Loading staff records...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="me-empty">
            <div className="me-empty-icon">👥</div>

            <h3>
              {employees.length === 0
                ? "No staff members yet"
                : "No matching staff members"}
            </h3>

            <p>
              {employees.length === 0
                ? "Invite your first team member to give them access to this business."
                : "Try changing your search or filters."}
            </p>

            {employees.length === 0 && branches.length > 0 && (
              <button
                className="me-btn me-btn-primary"
                onClick={openInviteModal}
              >
                + Invite your first staff member
              </button>
            )}

            {branches.length === 0 && (
              <p>
                Create a branch before inviting staff members.
              </p>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>STAFF MEMBER</th>
                <th>ROLE</th>
                <th>ASSIGNED BRANCHES</th>
                <th>ACCOUNT STATUS</th>
                <th>DATE ADDED</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map((employee) => {
                const active = Boolean(employee.is_active);
                const userId = employee.user_id || employee.id;

                return (
                  <tr key={employee.membership_id || userId}>
                    <td>
                      <div className="me-person">
                        <div className="me-avatar">
                          {(employee.email || "U").charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="me-person-name">
                            {employee.email || "Staff member"}
                          </div>

                          <div className="me-muted">
                            ID: {userId || "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>{roleLabel(employee.role)}</td>

                    <td>{getBranchNames(employee)}</td>

                    <td>
                      <span
                        className={`me-badge ${
                          active ? "me-active" : "me-suspended"
                        }`}
                      >
                        {active ? "Active" : "Suspended"}
                      </span>
                    </td>

                    <td>{formatDate(employee.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div
          className="me-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              setModalOpen(false);
              setError("");
            }
          }}
        >
          <form className="me-modal" onSubmit={sendInvitation}>
            <div className="me-modal-header">
              <h2>Invite Staff Member</h2>

              <button
                type="button"
                className="me-close"
                onClick={() => {
                  setModalOpen(false);
                  setError("");
                }}
                disabled={submitting}
              >
                ×
              </button>
            </div>

            <div className="me-field">
              <label>Email address *</label>

              <input
                className="me-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="employee@example.com"
                required
                autoFocus
              />

              <small>
                MyDuka will send an invitation to this email address.
              </small>
            </div>

            <div className="me-field">
              <label>Staff role *</label>

              <select
                className="me-select"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                {ROLES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="me-field">
              <label>Assign branches *</label>

              <small>
                Select every branch this staff member should be able to access.
              </small>

              <div className="me-branches">
                {branches.map((branch) => (
                  <label
                    className="me-branch-option"
                    key={branch.id}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBranches.includes(branch.id)}
                      onChange={() => toggleBranch(branch.id)}
                    />

                    <span>
                      {branch.name}
                      {branch.is_main ? " (Main Branch)" : ""}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="me-message me-error">
                {error}
              </div>
            )}

            <div className="me-notice">
              An invitation will be sent to the employee's email. They must
              accept the invitation before accessing the business.
            </div>

            <div className="me-modal-footer">
              <button
                type="button"
                className="me-btn"
                onClick={() => {
                  setModalOpen(false);
                  setError("");
                }}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="me-btn me-btn-primary"
                disabled={submitting || branches.length === 0}
              >
                {submitting ? "Sending invitation..." : "Send Invitation"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
