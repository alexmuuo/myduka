import React, { useMemo, useState } from "react";

const quantity = (value) =>
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusDetails = {
  pending: {
    label: "Pending",
    color: "orange",
  },
  dispatched: {
    label: "In transit",
    color: "blue",
  },
  completed: {
    label: "Completed",
    color: "green",
  },
  cancelled: {
    label: "Cancelled",
    color: "red",
  },
};

const emptyForm = {
  product: "",
  sourceBranch: "",
  destinationBranch: "",
  quantity: "",
  reference: "",
  transferDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

export default function StockTransfers() {
  const [transfers, setTransfers] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const [activeTab, setActiveTab] = useState("all");

  const branches = useMemo(() => {
    return [
      ...new Set(
        transfers.flatMap((item) => [
          item.sourceBranch,
          item.destinationBranch,
        ])
      ),
    ].sort();
  }, [transfers]);

  const summary = useMemo(() => {
    return {
      total: transfers.length,

      pending: transfers.filter(
        (item) => item.status === "pending"
      ).length,

      dispatched: transfers.filter(
        (item) => item.status === "dispatched"
      ).length,

      completed: transfers.filter(
        (item) => item.status === "completed"
      ).length,
    };
  }, [transfers]);

  const filteredTransfers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...transfers]
      .filter((item) => {
        const matchesSearch =
          !term ||
          [
            item.reference,
            item.product,
            item.sourceBranch,
            item.destinationBranch,
            item.notes,
            item.id,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(term)
            );

        const matchesStatus =
          statusFilter === "all" ||
          item.status === statusFilter;

        const matchesBranch =
          branchFilter === "all" ||
          item.sourceBranch === branchFilter ||
          item.destinationBranch === branchFilter;

        const matchesTab =
          activeTab === "all" ||
          item.status === activeTab;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesBranch &&
          matchesTab
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  }, [
    transfers,
    search,
    statusFilter,
    branchFilter,
    activeTab,
  ]);

  const showSuccess = (message) => {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);
  };

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const closeCreateModal = () => {
    setShowModal(false);
    setFormError("");
  };

  const createTransfer = (event) => {
    event.preventDefault();
    setFormError("");

    const product = form.product.trim();
    const sourceBranch = form.sourceBranch.trim();
    const destinationBranch = form.destinationBranch.trim();
    const transferQuantity = Number(form.quantity);

    if (!product) {
      setFormError("Enter the product name.");
      return;
    }

    if (!sourceBranch || !destinationBranch) {
      setFormError("Select both source and destination branches.");
      return;
    }

    if (
      sourceBranch.toLowerCase() ===
      destinationBranch.toLowerCase()
    ) {
      setFormError(
        "The source and destination branches must be different."
      );
      return;
    }

    if (
      !Number.isFinite(transferQuantity) ||
      transferQuantity <= 0
    ) {
      setFormError("Enter a valid transfer quantity.");
      return;
    }

    if (!form.transferDate) {
      setFormError("Select the transfer date.");
      return;
    }

    const timestamp = Date.now();

    const newTransfer = {
      id: `TRF-${timestamp}`,
      reference:
        form.reference.trim() || `TRF-${timestamp}`,
      product,
      sourceBranch,
      destinationBranch,
      quantity: transferQuantity,
      transferDate: form.transferDate,
      notes: form.notes.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
      dispatchedAt: null,
      completedAt: null,
      cancelledAt: null,
      dispatchNotes: "",
      receivingNotes: "",
    };

    setTransfers((previous) => [
      newTransfer,
      ...previous,
    ]);

    setForm(emptyForm);
    setShowModal(false);

    showSuccess("Stock transfer created successfully.");
  };

  const updateTransferStatus = (
    transferId,
    newStatus,
    notes = ""
  ) => {
    const timestamp = new Date().toISOString();

    setTransfers((previous) =>
      previous.map((item) => {
        if (item.id !== transferId) return item;

        const updated = {
          ...item,
          status: newStatus,
        };

        if (newStatus === "dispatched") {
          updated.dispatchedAt = timestamp;
          updated.dispatchNotes = notes;
        }

        if (newStatus === "completed") {
          updated.completedAt = timestamp;
          updated.receivingNotes = notes;
        }

        if (newStatus === "cancelled") {
          updated.cancelledAt = timestamp;
        }

        return updated;
      })
    );

    setSelectedTransfer(null);

    const messages = {
      dispatched: "Transfer marked as dispatched.",
      completed: "Transfer marked as received.",
      cancelled: "Transfer cancelled.",
    };

    showSuccess(messages[newStatus] || "Transfer updated.");
  };

  const exportCSV = () => {
    if (filteredTransfers.length === 0) return;

    const headers = [
      "Transfer ID",
      "Reference",
      "Product",
      "Source Branch",
      "Destination Branch",
      "Quantity",
      "Transfer Date",
      "Status",
      "Created At",
      "Dispatched At",
      "Received At",
      "Notes",
    ];

    const rows = filteredTransfers.map((item) => [
      item.id,
      item.reference,
      item.product,
      item.sourceBranch,
      item.destinationBranch,
      item.quantity,
      item.transferDate,
      statusDetails[item.status]?.label || item.status,
      formatDateTime(item.createdAt),
      formatDateTime(item.dispatchedAt),
      formatDateTime(item.completedAt),
      item.notes,
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) =>
        row.map(escapeCSV).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `MyDuka_Stock_Transfers_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const renderStatus = (status) => {
    const details = statusDetails[status] || {
      label: status,
      color: "blue",
    };

    return (
      <span className={`st-badge st-${details.color}`}>
        {details.label}
      </span>
    );
  };

  return (
    <div className="md-stock-transfers">
      <style>{`
        .md-stock-transfers {
          --st-primary: var(--primary, #2563eb);
          --st-text: var(--text-primary, #172033);
          --st-muted: var(--text-secondary, #64748b);
          --st-border: var(--border-color, #e2e8f0);
          --st-card: var(--card-bg, #ffffff);
          --st-bg: var(--background, #f8fafc);
          width: 100%;
          min-width: 0;
          color: var(--st-text);
          padding: 4px 0 35px;
        }

        .md-stock-transfers * {
          box-sizing: border-box;
        }

        .md-stock-transfers button,
        .md-stock-transfers input,
        .md-stock-transfers select,
        .md-stock-transfers textarea {
          font: inherit;
        }

        .st-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 22px;
        }

        .st-title {
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -0.7px;
          margin: 0 0 6px;
        }

        .st-subtitle {
          color: var(--st-muted);
          font-size: 13px;
          line-height: 1.6;
          margin: 0;
        }

        .st-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px 14px;
          border: 1px solid var(--st-border);
          background: var(--st-card);
          color: var(--st-text);
          border-radius: 9px;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
        }

        .st-button:hover {
          border-color: var(--st-primary);
        }

        .st-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .st-primary {
          background: var(--st-primary);
          color: white;
          border-color: var(--st-primary);
        }

        .st-danger {
          color: #dc2626;
          border-color: #fecaca;
        }

        .st-preview {
          display: flex;
          gap: 11px;
          align-items: flex-start;
          padding: 13px 15px;
          border-radius: 10px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1e40af;
          font-size: 12px;
          line-height: 1.6;
          margin-bottom: 21px;
        }

        .st-preview strong {
          display: block;
          margin-bottom: 2px;
        }

        .st-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 23px;
        }

        .st-stat {
          background: var(--st-card);
          border: 1px solid var(--st-border);
          border-radius: 12px;
          padding: 17px;
          min-width: 0;
        }

        .st-stat-label {
          color: var(--st-muted);
          font-size: 12px;
          margin-bottom: 10px;
        }

        .st-stat-value {
          font-size: 24px;
          font-weight: 750;
        }

        .st-stat-note {
          color: var(--st-muted);
          font-size: 11px;
          margin-top: 6px;
        }

        .st-panel {
          background: var(--st-card);
          border: 1px solid var(--st-border);
          border-radius: 12px;
          overflow: hidden;
        }

        .st-panel-heading {
          padding: 17px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          border-bottom: 1px solid var(--st-border);
        }

        .st-panel-heading h3 {
          font-size: 14px;
          font-weight: 750;
          margin: 0 0 4px;
        }

        .st-panel-heading p {
          color: var(--st-muted);
          font-size: 11px;
          margin: 0;
        }

        .st-tabs {
          display: flex;
          gap: 22px;
          padding: 0 18px;
          border-bottom: 1px solid var(--st-border);
          overflow-x: auto;
        }

        .st-tab {
          border: none;
          background: transparent;
          color: var(--st-muted);
          font-size: 12px;
          font-weight: 650;
          padding: 14px 2px;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
          cursor: pointer;
        }

        .st-tab.active {
          color: var(--st-primary);
          border-bottom-color: var(--st-primary);
        }

        .st-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          padding: 14px 17px;
          border-bottom: 1px solid var(--st-border);
        }

        .st-input,
        .st-select,
        .st-textarea {
          width: 100%;
          min-width: 0;
          padding: 10px 11px;
          background: var(--st-card);
          color: var(--st-text);
          border: 1px solid var(--st-border);
          border-radius: 8px;
          font-size: 12px;
          outline: none;
        }

        .st-input:focus,
        .st-select:focus,
        .st-textarea:focus {
          border-color: var(--st-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,.09);
        }

        .st-search {
          flex: 1 1 220px;
          max-width: 350px;
        }

        .st-filter {
          flex: 0 1 180px;
        }

        .st-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .st-table {
          width: 100%;
          min-width: 950px;
          border-collapse: collapse;
          text-align: left;
        }

        .st-table th {
          padding: 12px 14px;
          background: var(--st-bg);
          color: var(--st-muted);
          font-size: 10px;
          font-weight: 750;
          letter-spacing: .5px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .st-table td {
          padding: 14px;
          border-top: 1px solid var(--st-border);
          font-size: 12px;
          white-space: nowrap;
        }

        .st-table tbody tr:hover {
          background: var(--st-bg);
        }

        .st-product {
          font-weight: 700;
        }

        .st-muted {
          color: var(--st-muted);
          font-size: 11px;
          margin-top: 4px;
        }

        .st-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 750;
        }

        .st-orange {
          color: #9a3412;
          background: #ffedd5;
        }

        .st-blue {
          color: #1e40af;
          background: #dbeafe;
        }

        .st-green {
          color: #166534;
          background: #dcfce7;
        }

        .st-red {
          color: #991b1b;
          background: #fee2e2;
        }

        .st-empty {
          text-align: center;
          padding: 55px 20px;
        }

        .st-empty-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          border-radius: 15px;
          background: var(--st-bg);
          font-size: 24px;
        }

        .st-empty h3 {
          font-size: 14px;
          margin: 0 0 7px;
        }

        .st-empty p {
          color: var(--st-muted);
          font-size: 12px;
          line-height: 1.7;
          max-width: 420px;
          margin: 0 auto 17px;
        }

        .st-link {
          border: none;
          padding: 0;
          background: transparent;
          color: var(--st-primary);
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
        }

        .st-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(15,23,42,.55);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 18px;
          overflow-y: auto;
        }

        .st-modal {
          width: 100%;
          max-width: 620px;
          max-height: calc(100vh - 36px);
          overflow-y: auto;
          background: var(--st-card);
          color: var(--st-text);
          border: 1px solid var(--st-border);
          border-radius: 15px;
          box-shadow: 0 20px 60px rgba(0,0,0,.2);
        }

        .st-modal-header {
          padding: 19px 21px;
          border-bottom: 1px solid var(--st-border);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .st-modal-header h2 {
          font-size: 17px;
          margin: 0 0 5px;
        }

        .st-modal-header p {
          font-size: 11px;
          color: var(--st-muted);
          line-height: 1.6;
          margin: 0;
        }

        .st-close {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          background: var(--st-bg);
          color: var(--st-text);
          font-size: 19px;
          cursor: pointer;
        }

        .st-modal-body {
          padding: 20px;
        }

        .st-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .st-field {
          min-width: 0;
        }

        .st-field.full {
          grid-column: 1 / -1;
        }

        .st-field label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 7px;
        }

        .st-field label span {
          color: #dc2626;
        }

        .st-field small {
          display: block;
          font-size: 10px;
          color: var(--st-muted);
          margin-top: 5px;
          line-height: 1.5;
        }

        .st-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .st-error {
          background: #fee2e2;
          color: #991b1b;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 11px;
          margin-bottom: 15px;
        }

        .st-info {
          grid-column: 1 / -1;
          padding: 12px;
          border-radius: 9px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1e40af;
          font-size: 11px;
          line-height: 1.6;
        }

        .st-modal-footer {
          padding: 15px 20px;
          border-top: 1px solid var(--st-border);
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          flex-wrap: wrap;
        }

        .st-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .st-detail {
          padding: 12px;
          background: var(--st-bg);
          border-radius: 9px;
          min-width: 0;
        }

        .st-detail.full {
          grid-column: 1 / -1;
        }

        .st-detail-label {
          font-size: 10px;
          color: var(--st-muted);
          margin-bottom: 6px;
        }

        .st-detail-value {
          font-size: 13px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .st-timeline {
          border-left: 2px solid var(--st-border);
          margin: 17px 0 0 7px;
          padding-left: 18px;
        }

        .st-timeline-item {
          position: relative;
          padding-bottom: 17px;
        }

        .st-timeline-item::before {
          content: "";
          position: absolute;
          left: -24px;
          top: 3px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--st-primary);
        }

        .st-timeline-item strong {
          display: block;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .st-timeline-item span {
          color: var(--st-muted);
          font-size: 10px;
        }

        .st-success {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 10001;
          background: #166534;
          color: white;
          padding: 13px 17px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 650;
          box-shadow: 0 8px 25px rgba(0,0,0,.18);
        }

        @media (max-width: 900px) {
          .st-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .st-header {
            flex-direction: column;
          }

          .st-header .st-button {
            width: 100%;
          }

          .st-title {
            font-size: 22px;
          }

          .st-stats {
            gap: 9px;
          }

          .st-stat {
            padding: 13px;
          }

          .st-stat-value {
            font-size: 20px;
          }

          .st-panel-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .st-form-grid {
            grid-template-columns: 1fr;
          }

          .st-field.full,
          .st-info {
            grid-column: auto;
          }

          .st-detail-grid {
            grid-template-columns: 1fr;
          }

          .st-detail.full {
            grid-column: auto;
          }

          .st-modal-backdrop {
            padding: 9px;
          }

          .st-modal {
            max-height: calc(100vh - 18px);
          }
        }
      `}</style>

      <div className="st-header">
        <div>
          <h1 className="st-title">Stock Transfers</h1>
          <p className="st-subtitle">
            Move inventory between branches and track every transfer
            from dispatch to receipt.
          </p>
        </div>

        <button
          className="st-button st-primary"
          onClick={openCreateModal}
        >
          + New Transfer
        </button>
      </div>

      <div className="st-preview">
        <span>ⓘ</span>
        <div>
          <strong>Stock transfer preview mode</strong>
          This page currently uses temporary frontend data. Branches and
          products will be connected to your business catalogue during
          backend integration. Creating a preview transfer does not
          physically deduct or add stock.
        </div>
      </div>

      <div className="st-stats">
        <div className="st-stat">
          <div className="st-stat-label">Total transfers</div>
          <div className="st-stat-value">{summary.total}</div>
          <div className="st-stat-note">All recorded transfers</div>
        </div>

        <div className="st-stat">
          <div className="st-stat-label">Pending</div>
          <div className="st-stat-value">{summary.pending}</div>
          <div className="st-stat-note">Awaiting dispatch</div>
        </div>

        <div className="st-stat">
          <div className="st-stat-label">In transit</div>
          <div className="st-stat-value">{summary.dispatched}</div>
          <div className="st-stat-note">Dispatched to destination</div>
        </div>

        <div className="st-stat">
          <div className="st-stat-label">Completed</div>
          <div className="st-stat-value">{summary.completed}</div>
          <div className="st-stat-note">Received by destination</div>
        </div>
      </div>

      <div className="st-panel">
        <div className="st-panel-heading">
          <div>
            <h3>Transfer records</h3>
            <p>
              Monitor transfers between your business branches.
            </p>
          </div>

          <button
            className="st-button"
            onClick={exportCSV}
            disabled={filteredTransfers.length === 0}
          >
            ↓ Export CSV
          </button>
        </div>

        <div className="st-tabs">
          {[
            { id: "all", label: "All transfers" },
            { id: "pending", label: "Pending" },
            { id: "dispatched", label: "In transit" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`st-tab ${
                activeTab === tab.id ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="st-filters">
          <input
            className="st-input st-search"
            placeholder="Search product, reference or branch..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="st-select st-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="dispatched">In transit</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="st-select st-filter"
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
          >
            <option value="all">All branches</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>

        {filteredTransfers.length === 0 ? (
          <div className="st-empty">
            <div className="st-empty-icon">⇄</div>

            <h3>
              {transfers.length === 0
                ? "No stock transfers yet"
                : "No matching transfers"}
            </h3>

            <p>
              {transfers.length === 0
                ? "Create your first transfer to move products between branches. Every transfer will have its own reference and status history."
                : "Try changing your search or filters."}
            </p>

            {transfers.length === 0 && (
              <button
                className="st-button st-primary"
                onClick={openCreateModal}
              >
                + Create First Transfer
              </button>
            )}
          </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Transfer reference</th>
                  <th>Product</th>
                  <th>Source branch</th>
                  <th>Destination branch</th>
                  <th>Quantity</th>
                  <th>Transfer date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransfers.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="st-product">
                        {item.reference}
                      </div>
                      <div className="st-muted">{item.id}</div>
                    </td>

                    <td className="st-product">{item.product}</td>
                    <td>{item.sourceBranch}</td>
                    <td>{item.destinationBranch}</td>
                    <td>{quantity(item.quantity)}</td>
                    <td>{formatDate(item.transferDate)}</td>
                    <td>{renderStatus(item.status)}</td>

                    <td>
                      <button
                        className="st-link"
                        onClick={() => setSelectedTransfer(item)}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE TRANSFER */}

      {showModal && (
        <div
          className="st-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <form className="st-modal" onSubmit={createTransfer}>
            <div className="st-modal-header">
              <div>
                <h2>Create stock transfer</h2>
                <p>
                  Specify the product, source branch, destination and
                  quantity to transfer.
                </p>
              </div>

              <button
                type="button"
                className="st-close"
                onClick={closeCreateModal}
              >
                ×
              </button>
            </div>

            <div className="st-modal-body">
              {formError && (
                <div className="st-error">{formError}</div>
              )}

              <div className="st-form-grid">
                <div className="st-field full">
                  <label>
                    Product <span>*</span>
                  </label>
                  <input
                    className="st-input"
                    value={form.product}
                    onChange={(event) =>
                      updateForm("product", event.target.value)
                    }
                    placeholder="Enter product name"
                    required
                  />
                  <small>
                    In the connected system, select an existing product
                    from your Products catalogue.
                  </small>
                </div>

                <div className="st-field">
                  <label>
                    Source branch <span>*</span>
                  </label>
                  <input
                    className="st-input"
                    value={form.sourceBranch}
                    onChange={(event) =>
                      updateForm("sourceBranch", event.target.value)
                    }
                    placeholder="Branch sending stock"
                    required
                  />
                </div>

                <div className="st-field">
                  <label>
                    Destination branch <span>*</span>
                  </label>
                  <input
                    className="st-input"
                    value={form.destinationBranch}
                    onChange={(event) =>
                      updateForm("destinationBranch", event.target.value)
                    }
                    placeholder="Branch receiving stock"
                    required
                  />
                </div>

                <div className="st-field">
                  <label>
                    Quantity to transfer <span>*</span>
                  </label>
                  <input
                    className="st-input"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={form.quantity}
                    onChange={(event) =>
                      updateForm("quantity", event.target.value)
                    }
                    placeholder="0.000"
                    required
                  />
                </div>

                <div className="st-field">
                  <label>
                    Transfer date <span>*</span>
                  </label>
                  <input
                    className="st-input"
                    type="date"
                    value={form.transferDate}
                    onChange={(event) =>
                      updateForm("transferDate", event.target.value)
                    }
                    required
                  />
                </div>

                <div className="st-field full">
                  <label>Transfer reference</label>
                  <input
                    className="st-input"
                    value={form.reference}
                    onChange={(event) =>
                      updateForm("reference", event.target.value)
                    }
                    placeholder="Optional reference number"
                  />
                  <small>
                    If left blank, the system generates a transfer
                    reference.
                  </small>
                </div>

                <div className="st-field full">
                  <label>Notes</label>
                  <textarea
                    className="st-textarea"
                    value={form.notes}
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                    placeholder="Additional transfer instructions..."
                  />
                </div>

                <div className="st-info">
                  <strong>Transfer workflow</strong>
                  <br />
                  A newly created transfer starts as Pending. It must
                  be dispatched and then confirmed as received by the
                  destination branch. Actual stock movements will be
                  handled by the backend.
                </div>
              </div>
            </div>

            <div className="st-modal-footer">
              <button
                type="button"
                className="st-button"
                onClick={closeCreateModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="st-button st-primary"
              >
                Create Transfer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TRANSFER DETAILS */}

      {selectedTransfer && (
        <div
          className="st-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedTransfer(null);
            }
          }}
        >
          <div className="st-modal">
            <div className="st-modal-header">
              <div>
                <h2>Transfer details</h2>
                <p>
                  Review this transfer and update its progress.
                </p>
              </div>

              <button
                className="st-close"
                onClick={() => setSelectedTransfer(null)}
              >
                ×
              </button>
            </div>

            <div className="st-modal-body">
              <div style={{ marginBottom: 17 }}>
                {renderStatus(selectedTransfer.status)}
              </div>

              <div className="st-detail-grid">
                <div className="st-detail">
                  <div className="st-detail-label">
                    Transfer reference
                  </div>
                  <div className="st-detail-value">
                    {selectedTransfer.reference}
                  </div>
                </div>

                <div className="st-detail">
                  <div className="st-detail-label">Transfer ID</div>
                  <div className="st-detail-value">
                    {selectedTransfer.id}
                  </div>
                </div>

                <div className="st-detail">
                  <div className="st-detail-label">Product</div>
                  <div className="st-detail-value">
                    {selectedTransfer.product}
                  </div>
                </div>

                <div className="st-detail">
                  <div className="st-detail-label">Quantity</div>
                  <div className="st-detail-value">
                    {quantity(selectedTransfer.quantity)}
                  </div>
                </div>

                <div className="st-detail">
                  <div className="st-detail-label">
                    Source branch
                  </div>
                  <div className="st-detail-value">
                    {selectedTransfer.sourceBranch}
                  </div>
                </div>

                <div className="st-detail">
                  <div className="st-detail-label">
                    Destination branch
                  </div>
                  <div className="st-detail-value">
                    {selectedTransfer.destinationBranch}
                  </div>
                </div>

                <div className="st-detail">
                  <div className="st-detail-label">
                    Transfer date
                  </div>
                  <div className="st-detail-value">
                    {formatDate(selectedTransfer.transferDate)}
                  </div>
                </div>

                <div className="st-detail">
                  <div className="st-detail-label">
                    Created on
                  </div>
                  <div className="st-detail-value">
                    {formatDateTime(selectedTransfer.createdAt)}
                  </div>
                </div>

                <div className="st-detail full">
                  <div className="st-detail-label">Notes</div>
                  <div className="st-detail-value">
                    {selectedTransfer.notes || "No additional notes."}
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: 13, margin: "22px 0 0" }}>
                Transfer timeline
              </h3>

              <div className="st-timeline">
                <div className="st-timeline-item">
                  <strong>Transfer created</strong>
                  <span>
                    {formatDateTime(selectedTransfer.createdAt)}
                  </span>
                </div>

                {selectedTransfer.dispatchedAt && (
                  <div className="st-timeline-item">
                    <strong>Stock dispatched</strong>
                    <span>
                      {formatDateTime(selectedTransfer.dispatchedAt)}
                    </span>

                    {selectedTransfer.dispatchNotes && (
                      <div className="st-muted">
                        {selectedTransfer.dispatchNotes}
                      </div>
                    )}
                  </div>
                )}

                {selectedTransfer.completedAt && (
                  <div className="st-timeline-item">
                    <strong>Stock received</strong>
                    <span>
                      {formatDateTime(selectedTransfer.completedAt)}
                    </span>

                    {selectedTransfer.receivingNotes && (
                      <div className="st-muted">
                        {selectedTransfer.receivingNotes}
                      </div>
                    )}
                  </div>
                )}

                {selectedTransfer.cancelledAt && (
                  <div className="st-timeline-item">
                    <strong>Transfer cancelled</strong>
                    <span>
                      {formatDateTime(selectedTransfer.cancelledAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="st-modal-footer">
              {selectedTransfer.status === "pending" && (
                <>
                  <button
                    className="st-button st-danger"
                    onClick={() =>
                      updateTransferStatus(
                        selectedTransfer.id,
                        "cancelled"
                      )
                    }
                  >
                    Cancel Transfer
                  </button>

                  <button
                    className="st-button st-primary"
                    onClick={() =>
                      updateTransferStatus(
                        selectedTransfer.id,
                        "dispatched"
                      )
                    }
                  >
                    Mark as Dispatched
                  </button>
                </>
              )}

              {selectedTransfer.status === "dispatched" && (
                <button
                  className="st-button st-primary"
                  onClick={() =>
                    updateTransferStatus(
                      selectedTransfer.id,
                      "completed"
                    )
                  }
                >
                  Confirm Stock Received
                </button>
              )}

              <button
                className="st-button"
                onClick={() => setSelectedTransfer(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="st-success">{successMessage}</div>
      )}
    </div>
  );
}
