import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/api";

const styles = `
.md-branches {
  width: 100%;
  color: var(--text-primary, #172033);
}

.mb-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 25px;
}

.mb-header h1 {
  font-size: 26px;
  font-weight: 750;
  margin: 0;
  letter-spacing: -0.6px;
}

.mb-subtitle {
  color: #64748b;
  font-size: 14px;
  margin-top: 6px;
}

.mb-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  padding: 10px 15px;
  border: 1px solid #dbe2ea;
  border-radius: 9px;
  background: white;
  color: #334155;
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
  transition: .2s;
}

.mb-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.mb-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.mb-primary {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.mb-primary:hover {
  background: #1d4ed8;
  color: white;
}

.mb-danger {
  color: #dc2626;
  border-color: #fecaca;
}

.mb-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.mb-stat {
  background: white;
  border: 1px solid #e5eaf1;
  border-radius: 13px;
  padding: 19px;
}

.mb-stat-label {
  color: #64748b;
  font-size: 13px;
}

.mb-stat-value {
  font-size: 27px;
  font-weight: 750;
  margin-top: 8px;
}

.mb-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.mb-input, .mb-textarea {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #dbe2ea;
  border-radius: 9px;
  background: white;
  color: #172033;
  font-size: 14px;
  outline: none;
}

.mb-input:focus, .mb-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,.1);
}

.mb-search {
  flex: 1;
  min-width: 180px;
}

.mb-filter {
  width: auto;
  min-width: 130px;
}

.mb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 17px;
}

.mb-card {
  background: white;
  border: 1px solid #e5eaf1;
  border-radius: 14px;
  padding: 19px;
  min-width: 0;
}

.mb-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.mb-card-icon {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: #eff6ff;
  font-size: 21px;
}

.mb-badge {
  padding: 5px 10px;
  border-radius: 30px;
  font-size: 11px;
  font-weight: 700;
}

.mb-active {
  background: #dcfce7;
  color: #15803d;
}

.mb-inactive {
  background: #fee2e2;
  color: #b91c1c;
}

.mb-card h3 {
  font-size: 17px;
  font-weight: 750;
  margin: 0 0 5px;
  overflow-wrap: anywhere;
}

.mb-code {
  color: #64748b;
  font-size: 12px;
  margin-bottom: 18px;
}

.mb-info {
  display: grid;
  gap: 12px;
  margin-bottom: 19px;
}

.mb-info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.mb-info-label {
  color: #64748b;
  flex-shrink: 0;
}

.mb-info-value {
  color: #334155;
  text-align: right;
  overflow-wrap: anywhere;
}

.mb-card-actions {
  display: flex;
  gap: 7px;
  border-top: 1px solid #edf0f4;
  padding-top: 15px;
}

.mb-card-actions .mb-btn {
  flex: 1;
  padding: 8px 5px;
  font-size: 11px;
}

.mb-empty {
  text-align: center;
  padding: 55px 20px;
  background: white;
  border: 1px dashed #cbd5e1;
  border-radius: 13px;
}

.mb-empty-icon {
  font-size: 38px;
  margin-bottom: 12px;
}

.mb-empty h3 {
  font-size: 17px;
  margin-bottom: 7px;
}

.mb-empty p {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 18px;
}

.mb-alert {
  padding: 12px 15px;
  border-radius: 9px;
  margin-bottom: 15px;
  font-size: 13px;
}

.mb-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.mb-success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.mb-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,.55);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px;
  overflow-y: auto;
}

.mb-modal {
  width: 100%;
  max-width: 540px;
  background: white;
  border-radius: 16px;
  padding: 23px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 60px rgba(0,0,0,.2);
}

.mb-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.mb-modal-header h2 {
  font-size: 19px;
  font-weight: 750;
  margin: 0;
}

.mb-close {
  border: none;
  background: #f1f5f9;
  border-radius: 8px;
  width: 34px;
  height: 34px;
  font-size: 22px;
  cursor: pointer;
}

.mb-form-grid, .mb-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 17px;
}

.mb-field label {
  display: block;
  font-size: 13px;
  font-weight: 650;
  margin-bottom: 7px;
}

.mb-full {
  grid-column: 1 / -1;
}

.mb-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 23px;
}

.mb-detail-label {
  color: #64748b;
  font-size: 12px;
  margin-bottom: 6px;
}

.mb-detail-value {
  font-size: 14px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

@media(max-width: 650px) {
  .mb-header {
    align-items: flex-start;
  }

  .mb-header h1 {
    font-size: 22px;
  }

  .mb-stats {
    gap: 9px;
  }

  .mb-stat {
    padding: 12px;
  }

  .mb-stat-label {
    font-size: 11px;
  }

  .mb-stat-value {
    font-size: 22px;
  }

  .mb-toolbar > * {
    flex: 1;
  }

  .mb-search {
    flex-basis: 100%;
  }

  .mb-grid {
    grid-template-columns: 1fr;
  }
}

@media(max-width: 420px) {
  .mb-form-grid, .mb-detail-grid {
    grid-template-columns: 1fr;
  }

  .mb-full {
    grid-column: auto;
  }

  .mb-header {
    flex-direction: column;
  }
}
`;

const messageFromError = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function Branches() {
  const businessId = localStorage.getItem("mydukaBusinessId");

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyBranchId, setBusyBranchId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const loadBranches = useCallback(async () => {
    if (!businessId) {
      setError("No active business selected. Please select your business.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/businesses/${businessId}/branches`
      );

      setBranches(response.data?.branches || []);
    } catch (err) {
      setError(messageFromError(err, "Unable to load branches."));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const stats = useMemo(() => ({
    total: branches.length,
    active: branches.filter((branch) => branch.is_active).length,
    inactive: branches.filter((branch) => !branch.is_active).length,
  }), [branches]);

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        [branch.name, branch.phone, branch.address]
          .some((value) => String(value || "").toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && branch.is_active) ||
        (statusFilter === "inactive" && !branch.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [branches, search, statusFilter]);

  const openCreate = () => {
    setSelectedBranch(null);
    setForm({
      name: "",
      phone: "",
      address: "",
    });
    setError("");
    setModal("form");
  };

  const openEdit = (branch) => {
    setSelectedBranch(branch);
    setForm({
      name: branch.name || "",
      phone: branch.phone || "",
      address: branch.address || "",
    });
    setError("");
    setModal("form");
  };

  const saveBranch = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Branch name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      };

      if (selectedBranch) {
        await api.put(
          `/businesses/${businessId}/branches/${selectedBranch.id}`,
          payload
        );

        setNotice("Branch updated successfully.");
      } else {
        await api.post(
          `/businesses/${businessId}/branches`,
          payload
        );

        setNotice("Branch created successfully.");
      }

      setModal(null);
      await loadBranches();
    } catch (err) {
      setError(
        messageFromError(err, "Unable to save branch details.")
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (branch) => {
    if (branch.is_main) {
      setError("The Main Branch cannot be deactivated.");
      return;
    }

    const nextActive = !branch.is_active;

    if (
      !window.confirm(
        `Are you sure you want to ${nextActive ? "activate" : "deactivate"} ${branch.name}?`
      )
    ) {
      return;
    }

    try {
      setBusyBranchId(branch.id);
      setError("");
      setNotice("");

      await api.patch(
        `/businesses/${businessId}/branches/${branch.id}/status`,
        { is_active: nextActive }
      );

      setSelectedBranch((current) =>
        current
          ? { ...current, is_active: nextActive }
          : current
      );

      setNotice(
        `Branch ${nextActive ? "activated" : "deactivated"} successfully.`
      );

      await loadBranches();
    } catch (err) {
      setError(
        messageFromError(err, "Unable to update branch status.")
      );
    } finally {
      setBusyBranchId(null);
    }
  };

  const downloadCSV = (items) => {
    if (!items.length) return;

    const headers = [
      "Branch Name",
      "Phone",
      "Address",
      "Branch Type",
      "Status",
      "Created",
    ];

    const rows = items.map((branch) => [
      branch.name,
      branch.phone || "",
      branch.address || "",
      branch.is_main ? "Main Branch" : "Additional Branch",
      branch.is_active ? "Active" : "Inactive",
      formatDate(branch.created_at),
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers,
      ...rows,
    ].map((row) => row.map(escapeCSV).join(",")).join("\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "MyDuka_Branches.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

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

        <button
          className="mb-btn mb-primary"
          onClick={openCreate}
        >
          + Add Branch
        </button>
      </div>

      {error && (
        <div className="mb-alert mb-error" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="mb-alert mb-success" role="status">
          {notice}
        </div>
      )}

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
          placeholder="Search branch name, phone or address..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="mb-input mb-filter"
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

        <button
          className="mb-btn"
          onClick={loadBranches}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="mb-empty">
          <p>Loading your branches…</p>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="mb-empty">
          <div className="mb-empty-icon">🏬</div>

          <h3>
            {branches.length === 0
              ? "No branches found"
              : "No matching branches"}
          </h3>

          <p>
            {branches.length === 0
              ? "Your Main Branch is created during business registration. Add another location whenever your business expands."
              : "Try another search term or change the status filter."}
          </p>

          {branches.length === 0 && (
            <button
              className="mb-btn mb-primary"
              onClick={openCreate}
            >
              + Add Branch
            </button>
          )}
        </div>
      ) : (
        <div className="mb-grid">
          {filteredBranches.map((branch) => (
            <div className="mb-card" key={branch.id}>
              <div className="mb-card-top">
                <div className="mb-card-icon">🏬</div>

                <span
                  className={`mb-badge ${
                    branch.is_active ? "mb-active" : "mb-inactive"
                  }`}
                >
                  {branch.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <h3>{branch.name}</h3>

              <div className="mb-code">
                {branch.is_main ? "Main Branch" : "Business Branch"}
              </div>

              <div className="mb-info">
                <div className="mb-info-row">
                  <span className="mb-info-label">Address</span>
                  <span className="mb-info-value">
                    {branch.address || "Not provided"}
                  </span>
                </div>

                <div className="mb-info-row">
                  <span className="mb-info-label">Phone</span>
                  <span className="mb-info-value">
                    {branch.phone || "—"}
                  </span>
                </div>

                <div className="mb-info-row">
                  <span className="mb-info-label">Created</span>
                  <span className="mb-info-value">
                    {formatDate(branch.created_at)}
                  </span>
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
                  className={`mb-btn ${
                    branch.is_active ? "mb-danger" : ""
                  }`}
                  disabled={
                    busyBranchId === branch.id || branch.is_main
                  }
                  title={
                    branch.is_main
                      ? "The Main Branch cannot be deactivated"
                      : ""
                  }
                  onClick={() => toggleStatus(branch)}
                >
                  {busyBranchId === branch.id
                    ? "Saving…"
                    : branch.is_active
                      ? "Deactivate"
                      : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div
          className="mb-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setModal(null);
            }
          }}
        >
          <div
            className="mb-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-modal-header">
              <h2>
                {modal === "details"
                  ? "Branch details"
                  : selectedBranch
                    ? "Edit branch"
                    : "Add branch"}
              </h2>

              <button
                className="mb-close"
                onClick={() => setModal(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {modal === "details" && selectedBranch ? (
              <>
                <div className="mb-detail-grid">
                  <div>
                    <div className="mb-detail-label">Branch name</div>
                    <div className="mb-detail-value">
                      {selectedBranch.name}
                    </div>
                  </div>

                  <div>
                    <div className="mb-detail-label">Branch type</div>
                    <div className="mb-detail-value">
                      {selectedBranch.is_main
                        ? "Main Branch"
                        : "Additional Branch"}
                    </div>
                  </div>

                  <div>
                    <div className="mb-detail-label">Status</div>
                    <div className="mb-detail-value">
                      {selectedBranch.is_active
                        ? "Active"
                        : "Inactive"}
                    </div>
                  </div>

                  <div>
                    <div className="mb-detail-label">Phone</div>
                    <div className="mb-detail-value">
                      {selectedBranch.phone || "—"}
                    </div>
                  </div>

                  <div className="mb-full">
                    <div className="mb-detail-label">Address</div>
                    <div className="mb-detail-value">
                      {selectedBranch.address || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="mb-detail-label">Date created</div>
                    <div className="mb-detail-value">
                      {formatDate(selectedBranch.created_at)}
                    </div>
                  </div>
                </div>

                <div className="mb-modal-footer">
                  <button
                    className="mb-btn"
                    onClick={() => setModal(null)}
                  >
                    Close
                  </button>

                  <button
                    className="mb-btn mb-primary"
                    onClick={() => openEdit(selectedBranch)}
                  >
                    Edit branch
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={saveBranch}>
                <div className="mb-form-grid">
                  <div className="mb-field mb-full">
                    <label htmlFor="branch-name">
                      Branch name *
                    </label>

                    <input
                      id="branch-name"
                      className="mb-input"
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      maxLength={150}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="mb-field">
                    <label htmlFor="branch-phone">
                      Phone number
                    </label>

                    <input
                      id="branch-phone"
                      className="mb-input"
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      maxLength={30}
                    />
                  </div>

                  <div className="mb-field mb-full">
                    <label htmlFor="branch-address">
                      Address / Location
                    </label>

                    <textarea
                      id="branch-address"
                      className="mb-textarea"
                      rows={3}
                      value={form.address}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {error && (
                  <div
                    className="mb-alert mb-error"
                    style={{ marginTop: 16 }}
                  >
                    {error}
                  </div>
                )}

                <div className="mb-modal-footer">
                  <button
                    type="button"
                    className="mb-btn"
                    onClick={() => setModal(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="mb-btn mb-primary"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving…"
                      : selectedBranch
                        ? "Save changes"
                        : "Create branch"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
