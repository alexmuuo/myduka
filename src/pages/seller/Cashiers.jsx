import React, { useMemo, useState } from "react";

const INITIAL_EMPLOYEES = [];

const ROLES = [
  { value: "cashier", label: "Cashier" },
  { value: "branch_manager", label: "Branch Manager" },
  { value: "inventory_manager", label: "Inventory Manager" },
  { value: "staff", label: "General Staff" },
];

const STATUSES = [
  { value: "invited", label: "Invitation Pending" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  username: "",
  role: "cashier",
  branch: "",
  status: "invited",
  notes: "",
};

const styles = `
.md-employees {
  color: var(--text-primary, #172033);
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 24px;
}
.md-employees * { box-sizing: border-box; }
.md-employees button,
.md-employees input,
.md-employees select,
.md-employees textarea { font: inherit; }
.md-employees button { cursor: pointer; }
.md-employees .me-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 16px; flex-wrap: wrap; margin-bottom: 22px;
}
.md-employees h1 { font-size: 26px; margin: 0 0 7px; font-weight: 750; }
.md-employees .me-subtitle { color: var(--text-secondary, #64748b); margin: 0; font-size: 14px; }
.md-employees .me-btn {
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 9px; padding: 10px 15px; font-weight: 650;
  background: var(--card-bg, #fff); color: var(--text-primary, #172033);
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
}
.md-employees .me-btn-primary {
  background: var(--primary-color, #2563eb); border-color: var(--primary-color, #2563eb);
  color: white;
}
.md-employees .me-btn-danger { color: #dc2626; }
.md-employees .me-btn:disabled { opacity: .5; cursor: not-allowed; }
.md-employees .me-preview {
  border: 1px solid #bfdbfe; background: #eff6ff; color: #1e40af;
  padding: 12px 15px; border-radius: 10px; font-size: 13px;
  margin-bottom: 20px; line-height: 1.5;
}
.md-employees .me-stats {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px; margin-bottom: 22px;
}
.md-employees .me-stat {
  background: var(--card-bg, #fff); border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px; padding: 17px;
}
.md-employees .me-stat-label { font-size: 13px; color: var(--text-secondary, #64748b); }
.md-employees .me-stat-value { font-size: 26px; font-weight: 750; margin-top: 8px; }
.md-employees .me-toolbar {
  display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;
}
.md-employees .me-input,
.md-employees .me-select,
.md-employees .me-textarea {
  width: 100%; min-width: 0; border: 1px solid var(--border-color, #cbd5e1);
  background: var(--input-bg, var(--card-bg, #fff));
  color: var(--text-primary, #172033); border-radius: 8px;
  padding: 10px 11px; outline: none;
}
.md-employees .me-input:focus,
.md-employees .me-select:focus,
.md-employees .me-textarea:focus { border-color: var(--primary-color, #2563eb); }
.md-employees .me-search { flex: 1 1 250px; }
.md-employees .me-filter { flex: 0 1 190px; }
.md-employees .me-table-wrap {
  overflow-x: auto; border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px; background: var(--card-bg, #fff);
}
.md-employees table { border-collapse: collapse; width: 100%; min-width: 850px; }
.md-employees th, .md-employees td {
  padding: 14px 15px; text-align: left;
  border-bottom: 1px solid var(--border-color, #e2e8f0); font-size: 13px;
}
.md-employees th {
  color: var(--text-secondary, #64748b); font-weight: 650;
  background: var(--surface-bg, #f8fafc); white-space: nowrap;
}
.md-employees tr:last-child td { border-bottom: 0; }
.md-employees .me-person { display: flex; align-items: center; gap: 10px; }
.md-employees .me-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: grid; place-items: center; flex-shrink: 0;
  background: var(--surface-bg, #eff6ff); color: var(--primary-color, #2563eb);
  font-weight: 750;
}
.md-employees .me-person-name { font-weight: 700; }
.md-employees .me-muted { color: var(--text-secondary, #64748b); font-size: 12px; margin-top: 3px; }
.md-employees .me-badge {
  display: inline-flex; border-radius: 20px; padding: 5px 9px;
  font-size: 11px; font-weight: 700; white-space: nowrap;
}
.md-employees .me-active { background: #dcfce7; color: #166534; }
.md-employees .me-invited { background: #fef3c7; color: #92400e; }
.md-employees .me-suspended { background: #fee2e2; color: #991b1b; }
.md-employees .me-actions { display: flex; gap: 7px; }
.md-employees .me-icon-btn {
  border: 1px solid var(--border-color, #e2e8f0); border-radius: 7px;
  background: transparent; color: var(--text-primary, #172033);
  padding: 6px 9px;
}
.md-employees .me-empty { padding: 55px 20px; text-align: center; }
.md-employees .me-empty-icon { font-size: 34px; margin-bottom: 10px; }
.md-employees .me-empty h3 { margin: 0 0 7px; font-size: 17px; }
.md-employees .me-empty p {
  margin: 0 auto 17px; max-width: 420px; line-height: 1.5;
  font-size: 13px; color: var(--text-secondary, #64748b);
}
.md-employees .me-modal-backdrop {
  position: fixed; inset: 0; z-index: 1000; background: rgba(15,23,42,.55);
  display: flex; align-items: center; justify-content: center;
  padding: 18px; overflow-y: auto;
}
.md-employees .me-modal {
  width: 100%; max-width: 620px; max-height: 92vh; overflow-y: auto;
  background: var(--card-bg, #fff); color: var(--text-primary, #172033);
  border-radius: 14px; padding: 22px;
  box-shadow: 0 20px 60px rgba(0,0,0,.2);
}
.md-employees .me-modal-header {
  display: flex; justify-content: space-between; gap: 12px; align-items: center;
  margin-bottom: 20px;
}
.md-employees .me-modal-header h2 { font-size: 19px; margin: 0; }
.md-employees .me-close {
  border: 0; background: transparent; color: inherit; font-size: 24px;
}
.md-employees .me-form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
}
.md-employees .me-field { display: flex; flex-direction: column; gap: 6px; }
.md-employees .me-field label { font-size: 12px; font-weight: 700; }
.md-employees .me-field small { color: var(--text-secondary, #64748b); font-size: 11px; }
.md-employees .me-full { grid-column: 1 / -1; }
.md-employees .me-modal-footer {
  display: flex; justify-content: flex-end; gap: 9px;
  margin-top: 22px; flex-wrap: wrap;
}
.md-employees .me-detail-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 15px;
}
.md-employees .me-detail-label {
  font-size: 11px; color: var(--text-secondary, #64748b); margin-bottom: 5px;
}
.md-employees .me-detail-value { font-size: 14px; font-weight: 650; overflow-wrap: anywhere; }
.md-employees .me-notice {
  padding: 11px; border-radius: 8px; background: var(--surface-bg, #f8fafc);
  font-size: 12px; line-height: 1.5; margin-top: 17px;
}
@media (max-width: 850px) {
  .md-employees .me-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .md-employees { padding: 16px; }
  .md-employees h1 { font-size: 22px; }
  .md-employees .me-form-grid, .md-employees .me-detail-grid { grid-template-columns: 1fr; }
  .md-employees .me-full { grid-column: auto; }
  .md-employees .me-modal { padding: 17px; }
}
`;

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function roleLabel(value) {
  return ROLES.find((role) => role.value === value)?.label || value || "—";
}

function statusLabel(value) {
  return STATUSES.find((status) => status.value === value)?.label || value;
}

function downloadCSV(employees) {
  const headers = [
    "Name", "Username", "Email", "Phone", "Role", "Branch",
    "Status", "Date Added",
  ];

  const rows = employees.map((employee) => [
    employee.name,
    employee.username,
    employee.email,
    employee.phone,
    roleLabel(employee.role),
    employee.branch,
    statusLabel(employee.status),
    formatDate(employee.createdAt),
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
  link.download = "myduka-employees.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Cashiers() {
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((item) => item.status === "active").length,
    invited: employees.filter((item) => item.status === "invited").length,
    suspended: employees.filter((item) => item.status === "suspended").length,
  }), [employees]);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch = !term || [
        employee.name,
        employee.username,
        employee.email,
        employee.phone,
        employee.branch,
      ].some((value) => String(value || "").toLowerCase().includes(term));

      const matchesRole =
        roleFilter === "all" || employee.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" || employee.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees, search, roleFilter, statusFilter]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError("");
    setSelectedEmployee(null);
    setModal("form");
  }

  function openEdit(employee) {
    setForm({
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      username: employee.username || "",
      role: employee.role || "cashier",
      branch: employee.branch || "",
      status: employee.status || "invited",
      notes: employee.notes || "",
    });
    setError("");
    setSelectedEmployee(employee);
    setModal("form");
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function saveEmployee(event) {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const username = form.username.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!name || !username || !phone) {
      setError("Name, username and phone number are required.");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    const duplicateUsername = employees.some(
      (employee) =>
        employee.username.toLowerCase() === username.toLowerCase() &&
        employee.id !== selectedEmployee?.id
    );

    if (duplicateUsername) {
      setError("That username is already in use.");
      return;
    }

    if (email) {
      const duplicateEmail = employees.some(
        (employee) =>
          employee.email?.toLowerCase() === email &&
          employee.id !== selectedEmployee?.id
      );

      if (duplicateEmail) {
        setError("That email address is already assigned to another employee.");
        return;
      }
    }

    const now = new Date().toISOString();

    if (selectedEmployee) {
      setEmployees((current) =>
        current.map((employee) =>
          employee.id === selectedEmployee.id
            ? { ...employee, ...form, name, username, email, phone, updatedAt: now }
            : employee
        )
      );
    } else {
      setEmployees((current) => [
        {
          id: `EMP-${Date.now()}`,
          ...form,
          name,
          username,
          email,
          phone,
          createdAt: now,
          updatedAt: now,
          lastActiveAt: null,
        },
        ...current,
      ]);
    }

    setModal(null);
  }

  function changeStatus(employee, status) {
    setEmployees((current) =>
      current.map((item) =>
        item.id === employee.id
          ? { ...item, status, updatedAt: new Date().toISOString() }
          : item
      )
    );

    setSelectedEmployee((current) =>
      current?.id === employee.id ? { ...current, status } : current
    );
  }

  function removeEmployee(employee) {
    const confirmed = window.confirm(
      `Remove ${employee.name} from this employee list?`
    );

    if (!confirmed) return;

    setEmployees((current) =>
      current.filter((item) => item.id !== employee.id)
    );
    setModal(null);
  }

  return (
    <div className="md-employees">
      <style>{styles}</style>

      <div className="me-header">
        <div>
          <h1>Cashiers & Employees</h1>
          <p className="me-subtitle">
            Manage your team, assign roles and control employee access.
          </p>
        </div>

        <button className="me-btn me-btn-primary" onClick={openCreate}>
          + Add Employee
        </button>
      </div>

      <div className="me-preview">
        <strong>Frontend preview:</strong> Employee records created here are
        temporary and will disappear when the page is refreshed. Invitations,
        authentication, permissions and branch assignments will be connected
        to the MyDuka backend later. No passwords are collected or stored here.
      </div>

      <div className="me-stats">
        <div className="me-stat">
          <div className="me-stat-label">Total employees</div>
          <div className="me-stat-value">{stats.total}</div>
        </div>
        <div className="me-stat">
          <div className="me-stat-label">Active accounts</div>
          <div className="me-stat-value">{stats.active}</div>
        </div>
        <div className="me-stat">
          <div className="me-stat-label">Pending invitations</div>
          <div className="me-stat-value">{stats.invited}</div>
        </div>
        <div className="me-stat">
          <div className="me-stat-label">Suspended accounts</div>
          <div className="me-stat-value">{stats.suspended}</div>
        </div>
      </div>

      <div className="me-toolbar">
        <input
          className="me-input me-search"
          placeholder="Search name, username, email, phone or branch..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="me-select me-filter"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="all">All roles</option>
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>

        <select
          className="me-select me-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All account statuses</option>
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        <button
          className="me-btn"
          onClick={() => downloadCSV(filteredEmployees)}
          disabled={!filteredEmployees.length}
        >
          ↓ Export CSV
        </button>
      </div>

      <div className="me-table-wrap">
        {filteredEmployees.length === 0 ? (
          <div className="me-empty">
            <div className="me-empty-icon">👥</div>
            <h3>
              {employees.length === 0
                ? "No employees added yet"
                : "No matching employees"}
            </h3>
            <p>
              {employees.length === 0
                ? "Add your first employee or cashier to start organising your team."
                : "Try changing your search or filters."}
            </p>
            {employees.length === 0 && (
              <button className="me-btn me-btn-primary" onClick={openCreate}>
                + Add your first employee
              </button>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>USERNAME</th>
                <th>ROLE</th>
                <th>BRANCH</th>
                <th>ACCOUNT STATUS</th>
                <th>DATE ADDED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="me-person">
                      <div className="me-avatar">
                        {employee.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="me-person-name">{employee.name}</div>
                        <div className="me-muted">{employee.email || employee.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>{employee.username}</td>
                  <td>{roleLabel(employee.role)}</td>
                  <td>{employee.branch || "Not assigned"}</td>
                  <td>
                    <span className={`me-badge me-${employee.status}`}>
                      {statusLabel(employee.status)}
                    </span>
                  </td>
                  <td>{formatDate(employee.createdAt)}</td>
                  <td>
                    <div className="me-actions">
                      <button
                        className="me-icon-btn"
                        title="View employee"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setModal("details");
                        }}
                      >
                        View
                      </button>
                      <button
                        className="me-icon-btn"
                        title="Edit employee"
                        onClick={() => openEdit(employee)}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal === "form" && (
        <div className="me-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModal(null);
        }}>
          <form className="me-modal" onSubmit={saveEmployee}>
            <div className="me-modal-header">
              <h2>{selectedEmployee ? "Edit Employee" : "Add Employee"}</h2>
              <button type="button" className="me-close" onClick={() => setModal(null)}>
                ×
              </button>
            </div>

            <div className="me-form-grid">
              <div className="me-field">
                <label>Full name *</label>
                <input
                  className="me-input"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="Employee's full name"
                  required
                />
              </div>

              <div className="me-field">
                <label>Username *</label>
                <input
                  className="me-input"
                  value={form.username}
                  onChange={(event) => updateForm("username", event.target.value)}
                  placeholder="e.g. john.cashier"
                  required
                />
              </div>

              <div className="me-field">
                <label>Email address</label>
                <input
                  className="me-input"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  placeholder="employee@example.com"
                />
              </div>

              <div className="me-field">
                <label>Phone number *</label>
                <input
                  className="me-input"
                  value={form.phone}
                  onChange={(event) => updateForm("phone", event.target.value)}
                  placeholder="e.g. 07XXXXXXXX"
                  required
                />
              </div>

              <div className="me-field">
                <label>Employee role *</label>
                <select
                  className="me-select"
                  value={form.role}
                  onChange={(event) => updateForm("role", event.target.value)}
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="me-field">
                <label>Assigned branch</label>
                <input
                  className="me-input"
                  value={form.branch}
                  onChange={(event) => updateForm("branch", event.target.value)}
                  placeholder="e.g. Nairobi Branch"
                />
                <small>Branch selection will connect to the Branches module.</small>
              </div>

              <div className="me-field me-full">
                <label>Account status</label>
                <select
                  className="me-select"
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value)}
                >
                  {STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="me-field me-full">
                <label>Internal notes</label>
                <textarea
                  className="me-textarea"
                  rows="3"
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  placeholder="Optional notes about this employee..."
                />
              </div>
            </div>

            {error && (
              <div style={{ color: "#dc2626", fontSize: 13, marginTop: 14 }}>
                {error}
              </div>
            )}

            <div className="me-modal-footer">
              <button type="button" className="me-btn" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button type="submit" className="me-btn me-btn-primary">
                {selectedEmployee ? "Save Changes" : "Add Employee"}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === "details" && selectedEmployee && (
        <div className="me-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModal(null);
        }}>
          <div className="me-modal">
            <div className="me-modal-header">
              <h2>Employee Details</h2>
              <button type="button" className="me-close" onClick={() => setModal(null)}>
                ×
              </button>
            </div>

            <div className="me-person" style={{ marginBottom: 22 }}>
              <div className="me-avatar" style={{ width: 50, height: 50, fontSize: 19 }}>
                {selectedEmployee.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <div className="me-person-name" style={{ fontSize: 17 }}>
                  {selectedEmployee.name}
                </div>
                <div className="me-muted">{selectedEmployee.username}</div>
              </div>
            </div>

            <div className="me-detail-grid">
              <div>
                <div className="me-detail-label">Email address</div>
                <div className="me-detail-value">{selectedEmployee.email || "Not provided"}</div>
              </div>
              <div>
                <div className="me-detail-label">Phone number</div>
                <div className="me-detail-value">{selectedEmployee.phone}</div>
              </div>
              <div>
                <div className="me-detail-label">Role</div>
                <div className="me-detail-value">{roleLabel(selectedEmployee.role)}</div>
              </div>
              <div>
                <div className="me-detail-label">Assigned branch</div>
                <div className="me-detail-value">{selectedEmployee.branch || "Not assigned"}</div>
              </div>
              <div>
                <div className="me-detail-label">Account status</div>
                <div className="me-detail-value">
                  <span className={`me-badge me-${selectedEmployee.status}`}>
                    {statusLabel(selectedEmployee.status)}
                  </span>
                </div>
              </div>
              <div>
                <div className="me-detail-label">Date added</div>
                <div className="me-detail-value">{formatDate(selectedEmployee.createdAt)}</div>
              </div>
              <div className="me-full">
                <div className="me-detail-label">Internal notes</div>
                <div className="me-detail-value" style={{ fontWeight: 400 }}>
                  {selectedEmployee.notes || "No notes"}
                </div>
              </div>
            </div>

            <div className="me-notice">
              Account invitations and permissions are not active in this frontend
              preview. The backend will enforce role permissions and branch access.
            </div>

            <div className="me-modal-footer" style={{ justifyContent: "space-between" }}>
              <button
                className="me-btn me-btn-danger"
                onClick={() => removeEmployee(selectedEmployee)}
              >
                Remove
              </button>

              <div className="me-actions">
                {selectedEmployee.status !== "active" && (
                  <button
                    className="me-btn"
                    onClick={() => changeStatus(selectedEmployee, "active")}
                  >
                    Activate
                  </button>
                )}
                {selectedEmployee.status !== "suspended" && (
                  <button
                    className="me-btn"
                    onClick={() => changeStatus(selectedEmployee, "suspended")}
                  >
                    Suspend
                  </button>
                )}
                <button
                  className="me-btn me-btn-primary"
                  onClick={() => openEdit(selectedEmployee)}
                >
                  Edit Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
