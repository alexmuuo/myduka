import React, { useMemo, useState } from "react";

const INITIAL_BRANCHES = [];

const EMPTY_FORM = {
  name: "",
  code: "",
  phone: "",
  email: "",
  county: "",
  town: "",
  address: "",
  manager: "",
  status: "active",
  notes: "",
};

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const styles = `
.md-branches {
  max-width: 1500px;
  margin: 0 auto;
  padding: 24px;
  color: var(--text-primary, #172033);
}
.md-branches * { box-sizing: border-box; }
.md-branches button,
.md-branches input,
.md-branches select,
.md-branches textarea { font: inherit; }
.md-branches button { cursor: pointer; }
.md-branches .mb-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
.md-branches h1 { margin: 0 0 7px; font-size: 26px; font-weight: 750; }
.md-branches .mb-subtitle {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 14px;
}
.md-branches .mb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 9px;
  padding: 10px 14px;
  background: var(--card-bg, #fff);
  color: var(--text-primary, #172033);
  font-weight: 650;
}
.md-branches .mb-primary {
  background: var(--primary-color, #2563eb);
  border-color: var(--primary-color, #2563eb);
  color: white;
}
.md-branches .mb-danger { color: #dc2626; }
.md-branches .mb-preview {
  padding: 12px 15px;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #eff6ff;
  color: #1e40af;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 20px;
}
.md-branches .mb-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}
.md-branches .mb-stat {
  padding: 17px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  background: var(--card-bg, #fff);
}
.md-branches .mb-stat-label {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}
.md-branches .mb-stat-value {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 750;
}
.md-branches .mb-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}
.md-branches .mb-input,
.md-branches .mb-select,
.md-branches .mb-textarea {
  width: 100%;
  min-width: 0;
  padding: 10px 11px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  outline: none;
  background: var(--input-bg, var(--card-bg, #fff));
  color: var(--text-primary, #172033);
}
.md-branches .mb-input:focus,
.md-branches .mb-select:focus,
.md-branches .mb-textarea:focus {
  border-color: var(--primary-color, #2563eb);
}
.md-branches .mb-search { flex: 1 1 260px; }
.md-branches .mb-filter { flex: 0 1 190px; }
.md-branches .mb-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.md-branches .mb-card {
  padding: 19px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 13px;
  background: var(--card-bg, #fff);
  min-width: 0;
}
.md-branches .mb-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}
.md-branches .mb-card-icon {
  display: grid;
  place-items: center;
  width: 43px;
  height: 43px;
  border-radius: 11px;
  background: var(--surface-bg, #eff6ff);
  font-size: 21px;
}
.md-branches .mb-card h3 {
  margin: 13px 0 5px;
  font-size: 17px;
}
.md-branches .mb-code {
  color: var(--text-secondary, #64748b);
  font-size: 12px;
}
.md-branches .mb-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 20px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 700;
}
.md-branches .mb-active { background: #dcfce7; color: #166534; }
.md-branches .mb-inactive { background: #fee2e2; color: #991b1b; }
.md-branches .mb-info {
  display: grid;
  gap: 11px;
  margin: 18px 0;
}
.md-branches .mb-info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}
.md-branches .mb-info-label {
  color: var(--text-secondary, #64748b);
  flex-shrink: 0;
}
.md-branches .mb-info-value {
  text-align: right;
  overflow-wrap: anywhere;
  font-weight: 600;
}
.md-branches .mb-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--border-color, #e2e8f0);
}
.md-branches .mb-card-actions button { flex: 1; }
.md-branches .mb-empty {
  padding: 60px 20px;
  text-align: center;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  background: var(--card-bg, #fff);
}
.md-branches .mb-empty-icon { font-size: 36px; margin-bottom: 12px; }
.md-branches .mb-empty h3 { margin: 0 0 7px; }
.md-branches .mb-empty p {
  max-width: 430px;
  margin: 0 auto 18px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary, #64748b);
}
.md-branches .mb-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px;
  overflow-y: auto;
  background: rgba(15,23,42,.55);
}
.md-branches .mb-modal {
  width: 100%;
  max-width: 650px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 22px;
  border-radius: 14px;
  background: var(--card-bg, #fff);
  color: var(--text-primary, #172033);
  box-shadow: 0 20px 60px rgba(0,0,0,.2);
}
.md-branches .mb-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.md-branches .mb-modal-header h2 { margin: 0; font-size: 19px; }
.md-branches .mb-close {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 25px;
}
.md-branches .mb-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.md-branches .mb-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.md-branches .mb-field label {
  font-size: 12px;
  font-weight: 700;
}
.md-branches .mb-field small {
  color: var(--text-secondary, #64748b);
  font-size: 11px;
}
.md-branches .mb-full { grid-column: 1 / -1; }
.md-branches .mb-modal-footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 22px;
}
.md-branches .mb-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 17px;
}
.md-branches .mb-detail-label {
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  margin-bottom: 5px;
}
.md-branches .mb-detail-value {
  font-size: 14px;
  font-weight: 650;
  overflow-wrap: anywhere;
}
@media (max-width: 1050px) {
  .md-branches .mb-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 700px) {
  .md-branches { padding: 16px; }
  .md-branches h1 { font-size: 22px; }
  .md-branches .mb-grid { grid-template-columns: 1fr; }
  .md-branches .mb-stats { grid-template-columns: 1fr 1fr; }
  .md-branches .mb-form-grid,
  .md-branches .mb-detail-grid { grid-template-columns: 1fr; }
  .md-branches .mb-full { grid-column: auto; }
  .md-branches .mb-modal { padding: 17px; }
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

function downloadCSV(branches) {
  const headers = [
    "Branch Name",
    "Branch Code",
    "Phone",
    "Email",
    "County",
    "Town",
    "Address",
    "Manager",
    "Status",
    "Date Created",
  ];

  const rows = branches.map((branch) => [
    branch.name,
    branch.code,
    branch.phone,
    branch.email,
    branch.county,
    branch.town,
    branch.address,
    branch.manager,
    branch.status,
    formatDate(branch.createdAt),
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
  link.download = "myduka-branches.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Branches() {
  const [branches, setBranches] = useState(INITIAL_BRANCHES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const stats = useMemo(() => ({
    total: branches.length,
    active: branches.filter((branch) => branch.status === "active").length,
    inactive: branches.filter((branch) => branch.status === "inactive").length,
  }), [branches]);

  const filteredBranches = useMemo(() => {
    const term = search.trim().toLowerCase();

    return branches.filter((branch) => {
      const matchesSearch = !term || [
        branch.name,
        branch.code,
        branch.town,
        branch.county,
        branch.phone,
        branch.manager,
      ].some((value) => String(value || "").toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === "all" || branch.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [branches, search, statusFilter]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setSelectedBranch(null);
    setError("");
    setModal("form");
  }

  function openEdit(branch) {
    setForm({
      name: branch.name || "",
      code: branch.code || "",
      phone: branch.phone || "",
      email: branch.email || "",
      county: branch.county || "",
      town: branch.town || "",
      address: branch.address || "",
      manager: branch.manager || "",
      status: branch.status || "active",
      notes: branch.notes || "",
    });
    setSelectedBranch(branch);
    setError("");
    setModal("form");
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function saveBranch(event) {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();

    if (!name || !code) {
      setError("Branch name and branch code are required.");
      return;
    }

    const duplicateCode = branches.some(
      (branch) =>
        branch.code.toLowerCase() === code.toLowerCase() &&
        branch.id !== selectedBranch?.id
    );

    if (duplicateCode) {
      setError("This branch code is already in use.");
      return;
    }

    const now = new Date().toISOString();

    if (selectedBranch) {
      setBranches((current) =>
        current.map((branch) =>
          branch.id === selectedBranch.id
            ? { ...branch, ...form, name, code, updatedAt: now }
            : branch
        )
      );
    } else {
      setBranches((current) => [
        {
          id: `BR-${Date.now()}`,
          ...form,
          name,
          code,
          createdAt: now,
          updatedAt: now,
        },
        ...current,
      ]);
    }

    setModal(null);
  }

  function toggleStatus(branch) {
    const nextStatus = branch.status === "active" ? "inactive" : "active";

    setBranches((current) =>
      current.map((item) =>
        item.id === branch.id
          ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() }
          : item
      )
    );

    setSelectedBranch((current) =>
      current?.id === branch.id
        ? { ...current, status: nextStatus }
        : current
    );
  }

  function removeBranch(branch) {
    const confirmed = window.confirm(
      `Remove ${branch.name} from this preview?`
    );

    if (!confirmed) return;

    setBranches((current) =>
      current.filter((item) => item.id !== branch.id)
    );
    setModal(null);
  }

  return (
    <div className="md-branches">
      <style>{styles}</style>

      <div className="mb-header">
        <div>
          <h1>Branches</h1>
          <p className="mb-subtitle">
            Manage your business locations and their details.
          </p>
        </div>

        <button className="mb-btn mb-primary" onClick={openCreate}>
          + Add Branch
        </button>
      </div>

      <div className="mb-preview">
        <strong>Frontend preview:</strong> Branch records are temporary and
        will disappear when you refresh this page. The backend will later
        connect branches to inventory, employees, transfers, POS sales and
        reports. No stock or financial records are changed here.
      </div>

      <div className="mb-stats">
        <div className="mb-stat">
          <div className="mb-stat-label">Total branches</div>
          <div className="mb-stat-value">{stats.total}</div>
        </div>
        <div className="mb-stat">
          <div className="mb-stat-label">Active branches</div>
          <div className="mb-stat-value">{stats.active}</div>
        </div>
        <div className="mb-stat">
          <div className="mb-stat-label">Inactive branches</div>
          <div className="mb-stat-value">{stats.inactive}</div>
        </div>
      </div>

      <div className="mb-toolbar">
        <input
          className="mb-input mb-search"
          placeholder="Search branch name, code, town, county or manager..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="mb-select mb-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          className="mb-btn"
          onClick={() => downloadCSV(filteredBranches)}
          disabled={!filteredBranches.length}
        >
          ↓ Export CSV
        </button>
      </div>

      {filteredBranches.length === 0 ? (
        <div className="mb-empty">
          <div className="mb-empty-icon">🏬</div>
          <h3>
            {branches.length === 0
              ? "No branches added yet"
              : "No matching branches"}
          </h3>
          <p>
            {branches.length === 0
              ? "Add your first business location. You can manage its inventory, staff and sales separately once the backend is connected."
              : "Try another search term or change the status filter."}
          </p>
          {branches.length === 0 && (
            <button className="mb-btn mb-primary" onClick={openCreate}>
              + Add Your First Branch
            </button>
          )}
        </div>
      ) : (
        <div className="mb-grid">
          {filteredBranches.map((branch) => (
            <div className="mb-card" key={branch.id}>
              <div className="mb-card-top">
                <div className="mb-card-icon">🏬</div>
                <span className={`mb-badge mb-${branch.status}`}>
                  {branch.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>

              <h3>{branch.name}</h3>
              <div className="mb-code">Branch code: {branch.code}</div>

              <div className="mb-info">
                <div className="mb-info-row">
                  <span className="mb-info-label">Location</span>
                  <span className="mb-info-value">
                    {[branch.town, branch.county].filter(Boolean).join(", ") || "Not provided"}
                  </span>
                </div>

                <div className="mb-info-row">
                  <span className="mb-info-label">Phone</span>
                  <span className="mb-info-value">{branch.phone || "—"}</span>
                </div>

                <div className="mb-info-row">
                  <span className="mb-info-label">Branch manager</span>
                  <span className="mb-info-value">{branch.manager || "Not assigned"}</span>
                </div>
              </div>

              <div className="mb-card-actions">
                <button
                  className="mb-btn"
                  onClick={() => {
                    setSelectedBranch(branch);
                    setModal("details");
                  }}
                >
                  View
                </button>
                <button
                  className="mb-btn"
                  onClick={() => openEdit(branch)}
                >
                  Edit
                </button>
                <button
                  className="mb-btn"
                  onClick={() => toggleStatus(branch)}
                >
                  {branch.status === "active" ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "form" && (
        <div
          className="mb-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
        >
          <form className="mb-modal" onSubmit={saveBranch}>
            <div className="mb-modal-header">
              <h2>{selectedBranch ? "Edit Branch" : "Add Branch"}</h2>
              <button
                type="button"
                className="mb-close"
                onClick={() => setModal(null)}
              >
                ×
              </button>
            </div>

            <div className="mb-form-grid">
              <div className="mb-field">
                <label>Branch name *</label>
                <input
                  className="mb-input"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="e.g. Kisii Main Branch"
                  required
                />
              </div>

              <div className="mb-field">
                <label>Branch code *</label>
                <input
                  className="mb-input"
                  value={form.code}
                  onChange={(event) => updateForm("code", event.target.value)}
                  placeholder="e.g. KSI-001"
                  required
                />
                <small>Use a unique code for each branch.</small>
              </div>

              <div className="mb-field">
                <label>Phone number</label>
                <input
                  className="mb-input"
                  value={form.phone}
                  onChange={(event) => updateForm("phone", event.target.value)}
                  placeholder="Branch contact number"
                />
              </div>

              <div className="mb-field">
                <label>Email address</label>
                <input
                  className="mb-input"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  placeholder="branch@example.com"
                />
              </div>

              <div className="mb-field">
                <label>County</label>
                <input
                  className="mb-input"
                  value={form.county}
                  onChange={(event) => updateForm("county", event.target.value)}
                  placeholder="e.g. Kisii"
                />
              </div>

              <div className="mb-field">
                <label>Town</label>
                <input
                  className="mb-input"
                  value={form.town}
                  onChange={(event) => updateForm("town", event.target.value)}
                  placeholder="e.g. Kisii Town"
                />
              </div>

              <div className="mb-field mb-full">
                <label>Physical address</label>
                <input
                  className="mb-input"
                  value={form.address}
                  onChange={(event) => updateForm("address", event.target.value)}
                  placeholder="Building, street or estate"
                />
              </div>

              <div className="mb-field">
                <label>Branch manager</label>
                <input
                  className="mb-input"
                  value={form.manager}
                  onChange={(event) => updateForm("manager", event.target.value)}
                  placeholder="Manager's name"
                />
                <small>Employee selection will be connected later.</small>
              </div>

              <div className="mb-field">
                <label>Branch status</label>
                <select
                  className="mb-select"
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-field mb-full">
                <label>Internal notes</label>
                <textarea
                  className="mb-textarea"
                  rows="3"
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  placeholder="Optional branch notes..."
                />
              </div>
            </div>

            {error && (
              <div style={{ color: "#dc2626", fontSize: 13, marginTop: 14 }}>
                {error}
              </div>
            )}

            <div className="mb-modal-footer">
              <button
                type="button"
                className="mb-btn"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button type="submit" className="mb-btn mb-primary">
                {selectedBranch ? "Save Changes" : "Create Branch"}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === "details" && selectedBranch && (
        <div
          className="mb-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
        >
          <div className="mb-modal">
            <div className="mb-modal-header">
              <h2>Branch Details</h2>
              <button
                type="button"
                className="mb-close"
                onClick={() => setModal(null)}
              >
                ×
              </button>
            </div>

            <div className="mb-card-top" style={{ marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 750 }}>
                  {selectedBranch.name}
                </div>
                <div className="mb-code">{selectedBranch.code}</div>
              </div>
              <span className={`mb-badge mb-${selectedBranch.status}`}>
                {selectedBranch.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mb-detail-grid">
              {[
                ["Phone", selectedBranch.phone],
                ["Email", selectedBranch.email],
                ["County", selectedBranch.county],
                ["Town", selectedBranch.town],
                ["Address", selectedBranch.address],
                ["Branch manager", selectedBranch.manager],
                ["Date created", formatDate(selectedBranch.createdAt)],
                ["Last updated", formatDate(selectedBranch.updatedAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-detail-label">{label}</div>
                  <div className="mb-detail-value">{value || "Not provided"}</div>
                </div>
              ))}

              <div className="mb-full">
                <div className="mb-detail-label">Internal notes</div>
                <div className="mb-detail-value" style={{ fontWeight: 400 }}>
                  {selectedBranch.notes || "No notes"}
                </div>
              </div>
            </div>

            <div className="mb-modal-footer">
              <button
                className="mb-btn mb-danger"
                onClick={() => removeBranch(selectedBranch)}
              >
                Remove
              </button>
              <button
                className="mb-btn"
                onClick={() => toggleStatus(selectedBranch)}
              >
                {selectedBranch.status === "active" ? "Deactivate" : "Activate"}
              </button>
              <button
                className="mb-btn mb-primary"
                onClick={() => openEdit(selectedBranch)}
              >
                Edit Branch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
