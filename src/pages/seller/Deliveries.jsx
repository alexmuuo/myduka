import React, { useMemo, useState } from "react";

const INITIAL_DELIVERIES = [];

const DELIVERY_STATUSES = [
  { value: "pending", label: "Pending", color: "#d97706" },
  { value: "assigned", label: "Assigned", color: "#2563eb" },
  { value: "picked_up", label: "Picked up", color: "#7c3aed" },
  { value: "in_transit", label: "In transit", color: "#0891b2" },
  { value: "delivered", label: "Delivered", color: "#059669" },
  { value: "failed", label: "Failed", color: "#dc2626" },
  { value: "cancelled", label: "Cancelled", color: "#64748b" },
];

const EMPTY_FORM = {
  orderNumber: "",
  customerName: "",
  customerPhone: "",
  destination: "",
  deliveryPerson: "",
  trackingNumber: "",
  scheduledDate: "",
  deliveryFee: "",
  notes: "",
};

const money = (value) =>
  `KSh ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getStatus = (value) =>
  DELIVERY_STATUSES.find((status) => status.value === value) ||
  DELIVERY_STATUSES[0];

const getNextStatus = (status) => {
  const transitions = {
    pending: ["assigned", "cancelled"],
    assigned: ["picked_up", "cancelled"],
    picked_up: ["in_transit", "failed"],
    in_transit: ["delivered", "failed"],
    failed: ["assigned", "cancelled"],
    delivered: [],
    cancelled: [],
  };

  return transitions[status] || [];
};

const createReference = () =>
  `DLV-${Date.now().toString().slice(-8)}`;

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState(INITIAL_DELIVERIES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const stats = useMemo(() => {
    const count = (status) =>
      deliveries.filter((item) => item.status === status).length;

    return {
      total: deliveries.length,
      pending: count("pending"),
      inTransit: count("in_transit"),
      delivered: count("delivered"),
      failed: count("failed"),
    };
  }, [deliveries]);

  const filteredDeliveries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return deliveries.filter((delivery) => {
      const matchesSearch =
        !query ||
        [
          delivery.reference,
          delivery.orderNumber,
          delivery.customerName,
          delivery.customerPhone,
          delivery.destination,
          delivery.deliveryPerson,
          delivery.trackingNumber,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "all" || delivery.status === statusFilter;

      const matchesDate =
        !dateFilter ||
        (delivery.scheduledDate &&
          delivery.scheduledDate.slice(0, 10) === dateFilter);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [deliveries, search, statusFilter, dateFilter]);

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const createDelivery = (event) => {
    event.preventDefault();
    setFormError("");

    if (
      !form.orderNumber.trim() ||
      !form.customerName.trim() ||
      !form.customerPhone.trim() ||
      !form.destination.trim()
    ) {
      setFormError(
        "Enter the order number, customer name, phone number and destination."
      );
      return;
    }

    if (
      form.deliveryFee !== "" &&
      (!Number.isFinite(Number(form.deliveryFee)) ||
        Number(form.deliveryFee) < 0)
    ) {
      setFormError("Enter a valid delivery fee.");
      return;
    }

    const duplicate = deliveries.some(
      (item) =>
        item.orderNumber.toLowerCase() ===
        form.orderNumber.trim().toLowerCase()
    );

    if (duplicate) {
      setFormError("A delivery for this order already exists.");
      return;
    }

    const now = new Date().toISOString();

    const delivery = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      reference: createReference(),
      orderNumber: form.orderNumber.trim(),
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      destination: form.destination.trim(),
      deliveryPerson: form.deliveryPerson.trim(),
      trackingNumber: form.trackingNumber.trim(),
      scheduledDate: form.scheduledDate,
      deliveryFee: Number(form.deliveryFee || 0),
      notes: form.notes.trim(),
      status: form.deliveryPerson.trim() ? "assigned" : "pending",
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          status: form.deliveryPerson.trim() ? "assigned" : "pending",
          label: form.deliveryPerson.trim()
            ? "Delivery created and assigned"
            : "Delivery created",
          timestamp: now,
        },
      ],
    };

    setDeliveries((previous) => [delivery, ...previous]);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setNotice("Delivery task created in preview mode.");
  };

  const updateStatus = (deliveryId, nextStatus) => {
    const statusInfo = getStatus(nextStatus);
    const now = new Date().toISOString();

    setDeliveries((previous) =>
      previous.map((delivery) => {
        if (delivery.id !== deliveryId) return delivery;

        const updated = {
          ...delivery,
          status: nextStatus,
          updatedAt: now,
          timeline: [
            ...(delivery.timeline || []),
            {
              status: nextStatus,
              label: `Status changed to ${statusInfo.label}`,
              timestamp: now,
            },
          ],
        };

        if (nextStatus === "delivered") {
          updated.deliveredAt = now;
        }

        return updated;
      })
    );

    setSelectedDelivery((previous) =>
      previous?.id === deliveryId
        ? {
            ...previous,
            status: nextStatus,
            updatedAt: now,
            deliveredAt:
              nextStatus === "delivered"
                ? now
                : previous.deliveredAt,
            timeline: [
              ...(previous.timeline || []),
              {
                status: nextStatus,
                label: `Status changed to ${statusInfo.label}`,
                timestamp: now,
              },
            ],
          }
        : previous
    );

    setNotice(`Delivery status updated to ${statusInfo.label}.`);
  };

  const updateDeliveryDetails = (deliveryId, updates) => {
    const now = new Date().toISOString();

    setDeliveries((previous) =>
      previous.map((delivery) =>
        delivery.id === deliveryId
          ? { ...delivery, ...updates, updatedAt: now }
          : delivery
      )
    );

    setSelectedDelivery((previous) =>
      previous?.id === deliveryId
        ? { ...previous, ...updates, updatedAt: now }
        : previous
    );

    setNotice("Delivery details updated.");
  };

  const exportCSV = () => {
    const headers = [
      "Reference",
      "Order Number",
      "Customer",
      "Phone",
      "Destination",
      "Delivery Person",
      "Tracking Number",
      "Status",
      "Scheduled Date",
      "Delivery Fee",
      "Delivered At",
      "Notes",
    ];

    const rows = filteredDeliveries.map((item) => [
      item.reference,
      item.orderNumber,
      item.customerName,
      item.customerPhone,
      item.destination,
      item.deliveryPerson,
      item.trackingNumber,
      getStatus(item.status).label,
      item.scheduledDate,
      item.deliveryFee,
      item.deliveredAt || "",
      item.notes,
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "myduka-deliveries.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const dismissNotice = () => setNotice("");

  return (
    <div className="md-deliveries">
      <style>{`
        .md-deliveries {
          color: var(--text-primary, #172033);
          width: 100%;
          min-width: 0;
          padding: 4px 0 28px;
          font-family: inherit;
        }

        .md-deliveries * {
          box-sizing: border-box;
        }

        .md-deliveries button,
        .md-deliveries input,
        .md-deliveries select,
        .md-deliveries textarea {
          font: inherit;
        }

        .md-deliveries button {
          cursor: pointer;
        }

        .md-deliveries-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .md-deliveries-title {
          margin: 0;
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -0.7px;
        }

        .md-deliveries-subtitle {
          margin: 7px 0 0;
          color: var(--text-secondary, #64748b);
          font-size: 13px;
          line-height: 1.6;
        }

        .md-deliveries-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .md-deliveries-btn {
          border: 1px solid var(--border-color, #e2e8f0);
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          border-radius: 9px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 700;
        }

        .md-deliveries-btn.primary {
          color: #fff;
          background: #2563eb;
          border-color: #2563eb;
        }

        .md-deliveries-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .md-deliveries-preview {
          padding: 12px 14px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1e40af;
          border-radius: 10px;
          font-size: 12px;
          line-height: 1.6;
          margin-bottom: 18px;
        }

        .md-deliveries-notice {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 11px 14px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
          border-radius: 9px;
          font-size: 12px;
          margin-bottom: 15px;
        }

        .md-deliveries-notice button {
          border: 0;
          background: transparent;
          color: inherit;
          font-weight: 800;
        }

        .md-deliveries-stats {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 20px;
        }

        .md-deliveries-stat {
          min-width: 0;
          padding: 16px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
        }

        .md-deliveries-stat-label {
          color: var(--text-secondary, #64748b);
          font-size: 11px;
          font-weight: 600;
        }

        .md-deliveries-stat-value {
          margin-top: 9px;
          font-size: 24px;
          font-weight: 800;
        }

        .md-deliveries-stat-hint {
          margin-top: 4px;
          color: var(--text-secondary, #64748b);
          font-size: 10px;
        }

        .md-deliveries-toolbar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 14px;
        }

        .md-deliveries-search {
          flex: 1 1 240px;
        }

        .md-deliveries-input,
        .md-deliveries-select,
        .md-deliveries-textarea {
          width: 100%;
          min-width: 0;
          padding: 10px 12px;
          border: 1px solid var(--border-color, #cbd5e1);
          border-radius: 8px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          outline: none;
          font-size: 12px;
        }

        .md-deliveries-input:focus,
        .md-deliveries-select:focus,
        .md-deliveries-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, .1);
        }

        .md-deliveries-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          background: var(--card-bg, #fff);
        }

        .md-deliveries-table {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
          text-align: left;
        }

        .md-deliveries-table th {
          padding: 13px 14px;
          background: var(--surface-secondary, #f8fafc);
          color: var(--text-secondary, #64748b);
          font-size: 10px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: .4px;
          white-space: nowrap;
        }

        .md-deliveries-table td {
          padding: 14px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          font-size: 12px;
          vertical-align: middle;
        }

        .md-deliveries-table tbody tr:hover {
          background: var(--surface-secondary, #f8fafc);
        }

        .md-deliveries-reference {
          color: #2563eb;
          font-weight: 750;
          background: none;
          border: 0;
          padding: 0;
        }

        .md-deliveries-secondary {
          color: var(--text-secondary, #64748b);
          font-size: 10px;
          margin-top: 4px;
        }

        .md-deliveries-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 750;
          white-space: nowrap;
        }

        .md-deliveries-empty {
          text-align: center;
          padding: 55px 20px;
          color: var(--text-secondary, #64748b);
        }

        .md-deliveries-empty-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          background: var(--surface-secondary, #f1f5f9);
          border-radius: 15px;
          font-size: 23px;
        }

        .md-deliveries-empty h3 {
          color: var(--text-primary, #172033);
          margin: 0 0 7px;
          font-size: 15px;
        }

        .md-deliveries-empty p {
          margin: 0 auto 17px;
          max-width: 390px;
          font-size: 12px;
          line-height: 1.7;
        }

        .md-deliveries-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
          background: rgba(15, 23, 42, .48);
        }

        .md-deliveries-panel {
          width: min(620px, 100%);
          height: 100%;
          overflow-y: auto;
          padding: 24px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          box-shadow: -10px 0 35px rgba(0,0,0,.12);
        }

        .md-deliveries-panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 22px;
        }

        .md-deliveries-panel-header h2 {
          margin: 0;
          font-size: 19px;
        }

        .md-deliveries-close {
          width: 34px;
          height: 34px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          background: transparent;
          color: inherit;
          font-size: 18px;
        }

        .md-deliveries-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .md-deliveries-field {
          min-width: 0;
        }

        .md-deliveries-field.full {
          grid-column: 1 / -1;
        }

        .md-deliveries-field label {
          display: block;
          margin-bottom: 7px;
          font-size: 11px;
          font-weight: 700;
        }

        .md-deliveries-required {
          color: #dc2626;
        }

        .md-deliveries-textarea {
          min-height: 90px;
          resize: vertical;
        }

        .md-deliveries-error {
          grid-column: 1 / -1;
          color: #dc2626;
          font-size: 12px;
        }

        .md-deliveries-form-actions {
          grid-column: 1 / -1;
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding-top: 8px;
        }

        .md-deliveries-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 22px;
        }

        .md-deliveries-detail-item {
          padding: 13px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 9px;
          min-width: 0;
        }

        .md-deliveries-detail-item span {
          display: block;
          color: var(--text-secondary, #64748b);
          font-size: 10px;
          margin-bottom: 6px;
        }

        .md-deliveries-detail-item strong {
          display: block;
          overflow-wrap: anywhere;
          font-size: 12px;
        }

        .md-deliveries-section-title {
          font-size: 13px;
          font-weight: 800;
          margin: 22px 0 12px;
        }

        .md-deliveries-timeline {
          border-left: 2px solid var(--border-color, #e2e8f0);
          margin-left: 6px;
          padding-left: 17px;
        }

        .md-deliveries-timeline-item {
          position: relative;
          padding-bottom: 17px;
        }

        .md-deliveries-timeline-item::before {
          content: "";
          position: absolute;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #2563eb;
          left: -23px;
          top: 3px;
        }

        .md-deliveries-timeline-item strong {
          font-size: 11px;
        }

        .md-deliveries-timeline-item p {
          margin: 4px 0 0;
          color: var(--text-secondary, #64748b);
          font-size: 10px;
        }

        .md-deliveries-detail-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 17px;
        }

        .md-deliveries-edit-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 1050px) {
          .md-deliveries-stats {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .md-deliveries-header {
            flex-direction: column;
          }

          .md-deliveries-actions {
            width: 100%;
          }

          .md-deliveries-actions button {
            flex: 1;
          }

          .md-deliveries-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 9px;
          }

          .md-deliveries-stat {
            padding: 13px;
          }

          .md-deliveries-stat-value {
            font-size: 21px;
          }

          .md-deliveries-toolbar > * {
            flex: 1 1 100%;
          }

          .md-deliveries-panel {
            padding: 18px;
          }

          .md-deliveries-form,
          .md-deliveries-detail-grid,
          .md-deliveries-edit-grid {
            grid-template-columns: 1fr;
          }

          .md-deliveries-field.full,
          .md-deliveries-error,
          .md-deliveries-form-actions {
            grid-column: 1;
          }
        }
      `}</style>

      <div className="md-deliveries-header">
        <div>
          <h1 className="md-deliveries-title">Deliveries</h1>
          <p className="md-deliveries-subtitle">
            Manage delivery assignments, dispatches and proof of delivery.
          </p>
        </div>

        <div className="md-deliveries-actions">
          <button className="md-deliveries-btn" onClick={exportCSV}>
            Export CSV
          </button>
          <button
            className="md-deliveries-btn primary"
            onClick={() => {
              setFormError("");
              setShowForm(true);
            }}
          >
            + Create delivery
          </button>
        </div>
      </div>

      <div className="md-deliveries-preview">
        <strong>Frontend preview:</strong> Delivery tasks created here are
        temporary and exist only in this browser session. Later, deliveries
        will be generated from eligible customer orders and synchronised with
        the backend. Pickup orders will not appear in the delivery queue.
      </div>

      {notice && (
        <div className="md-deliveries-notice">
          <span>{notice}</span>
          <button onClick={dismissNotice}>✕</button>
        </div>
      )}

      <div className="md-deliveries-stats">
        <div className="md-deliveries-stat">
          <div className="md-deliveries-stat-label">Total deliveries</div>
          <div className="md-deliveries-stat-value">{stats.total}</div>
          <div className="md-deliveries-stat-hint">All delivery tasks</div>
        </div>

        <div className="md-deliveries-stat">
          <div className="md-deliveries-stat-label">Pending</div>
          <div className="md-deliveries-stat-value">{stats.pending}</div>
          <div className="md-deliveries-stat-hint">Awaiting assignment</div>
        </div>

        <div className="md-deliveries-stat">
          <div className="md-deliveries-stat-label">In transit</div>
          <div className="md-deliveries-stat-value">{stats.inTransit}</div>
          <div className="md-deliveries-stat-hint">Currently on the way</div>
        </div>

        <div className="md-deliveries-stat">
          <div className="md-deliveries-stat-label">Delivered</div>
          <div className="md-deliveries-stat-value">{stats.delivered}</div>
          <div className="md-deliveries-stat-hint">Successfully completed</div>
        </div>

        <div className="md-deliveries-stat">
          <div className="md-deliveries-stat-label">Failed</div>
          <div className="md-deliveries-stat-value">{stats.failed}</div>
          <div className="md-deliveries-stat-hint">Require attention</div>
        </div>
      </div>

      <div className="md-deliveries-toolbar">
        <div className="md-deliveries-search">
          <input
            className="md-deliveries-input"
            placeholder="Search reference, order, customer, phone or destination..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div style={{ minWidth: 150 }}>
          <select
            className="md-deliveries-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            {DELIVERY_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: 150 }}>
          <input
            className="md-deliveries-input"
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            aria-label="Filter by scheduled date"
          />
        </div>
      </div>

      <div className="md-deliveries-table-wrap">
        {filteredDeliveries.length === 0 ? (
          <div className="md-deliveries-empty">
            <div className="md-deliveries-empty-icon">🚚</div>
            <h3>
              {deliveries.length === 0
                ? "No deliveries yet"
                : "No matching deliveries"}
            </h3>
            <p>
              {deliveries.length === 0
                ? "When customer orders require delivery, their delivery tasks will appear here. You can create a temporary task to preview the workflow."
                : "Try changing your search or filters to find the delivery you need."}
            </p>
            {deliveries.length === 0 && (
              <button
                className="md-deliveries-btn primary"
                onClick={() => setShowForm(true)}
              >
                + Create delivery
              </button>
            )}
          </div>
        ) : (
          <table className="md-deliveries-table">
            <thead>
              <tr>
                <th>Delivery</th>
                <th>Customer</th>
                <th>Destination</th>
                <th>Delivery person</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Fee</th>
              </tr>
            </thead>

            <tbody>
              {filteredDeliveries.map((delivery) => {
                const status = getStatus(delivery.status);

                return (
                  <tr key={delivery.id}>
                    <td>
                      <button
                        className="md-deliveries-reference"
                        onClick={() => setSelectedDelivery(delivery)}
                      >
                        {delivery.reference}
                      </button>
                      <div className="md-deliveries-secondary">
                        {delivery.orderNumber}
                      </div>
                    </td>

                    <td>
                      <strong>{delivery.customerName}</strong>
                      <div className="md-deliveries-secondary">
                        {delivery.customerPhone}
                      </div>
                    </td>

                    <td style={{ maxWidth: 190 }}>
                      {delivery.destination}
                    </td>

                    <td>{delivery.deliveryPerson || "Unassigned"}</td>

                    <td>{dateTime(delivery.scheduledDate)}</td>

                    <td>
                      <span
                        className="md-deliveries-badge"
                        style={{
                          background: `${status.color}18`,
                          color: status.color,
                        }}
                      >
                        {status.label}
                      </span>
                    </td>

                    <td>{money(delivery.deliveryFee)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div
          className="md-deliveries-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div className="md-deliveries-panel">
            <div className="md-deliveries-panel-header">
              <div>
                <h2>Create delivery</h2>
                <p className="md-deliveries-subtitle">
                  Create a temporary delivery task for preview.
                </p>
              </div>
              <button
                className="md-deliveries-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form className="md-deliveries-form" onSubmit={createDelivery}>
              <div className="md-deliveries-field">
                <label>
                  Order number <span className="md-deliveries-required">*</span>
                </label>
                <input
                  className="md-deliveries-input"
                  value={form.orderNumber}
                  onChange={(event) =>
                    updateForm("orderNumber", event.target.value)
                  }
                  placeholder="e.g. ORD-1001"
                />
              </div>

              <div className="md-deliveries-field">
                <label>
                  Customer name <span className="md-deliveries-required">*</span>
                </label>
                <input
                  className="md-deliveries-input"
                  value={form.customerName}
                  onChange={(event) =>
                    updateForm("customerName", event.target.value)
                  }
                  placeholder="Customer name"
                />
              </div>

              <div className="md-deliveries-field">
                <label>
                  Customer phone <span className="md-deliveries-required">*</span>
                </label>
                <input
                  className="md-deliveries-input"
                  value={form.customerPhone}
                  onChange={(event) =>
                    updateForm("customerPhone", event.target.value)
                  }
                  placeholder="07XX XXX XXX"
                />
              </div>

              <div className="md-deliveries-field">
                <label>Delivery person</label>
                <input
                  className="md-deliveries-input"
                  value={form.deliveryPerson}
                  onChange={(event) =>
                    updateForm("deliveryPerson", event.target.value)
                  }
                  placeholder="Assign delivery person"
                />
              </div>

              <div className="md-deliveries-field full">
                <label>
                  Delivery destination{" "}
                  <span className="md-deliveries-required">*</span>
                </label>
                <input
                  className="md-deliveries-input"
                  value={form.destination}
                  onChange={(event) =>
                    updateForm("destination", event.target.value)
                  }
                  placeholder="Full delivery address or location"
                />
              </div>

              <div className="md-deliveries-field">
                <label>Tracking number</label>
                <input
                  className="md-deliveries-input"
                  value={form.trackingNumber}
                  onChange={(event) =>
                    updateForm("trackingNumber", event.target.value)
                  }
                  placeholder="Optional tracking reference"
                />
              </div>

              <div className="md-deliveries-field">
                <label>Scheduled delivery</label>
                <input
                  className="md-deliveries-input"
                  type="datetime-local"
                  value={form.scheduledDate}
                  onChange={(event) =>
                    updateForm("scheduledDate", event.target.value)
                  }
                />
              </div>

              <div className="md-deliveries-field">
                <label>Delivery fee (KSh)</label>
                <input
                  className="md-deliveries-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deliveryFee}
                  onChange={(event) =>
                    updateForm("deliveryFee", event.target.value)
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="md-deliveries-field full">
                <label>Delivery notes</label>
                <textarea
                  className="md-deliveries-textarea"
                  value={form.notes}
                  onChange={(event) =>
                    updateForm("notes", event.target.value)
                  }
                  placeholder="Instructions, landmarks or other details..."
                />
              </div>

              {formError && (
                <div className="md-deliveries-error">{formError}</div>
              )}

              <div className="md-deliveries-form-actions">
                <button
                  type="button"
                  className="md-deliveries-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="md-deliveries-btn primary"
                >
                  Create delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDelivery && (
        <div
          className="md-deliveries-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedDelivery(null);
            }
          }}
        >
          <div className="md-deliveries-panel">
            <div className="md-deliveries-panel-header">
              <div>
                <h2>{selectedDelivery.reference}</h2>
                <p className="md-deliveries-subtitle">
                  Order {selectedDelivery.orderNumber}
                </p>
              </div>
              <button
                className="md-deliveries-close"
                onClick={() => setSelectedDelivery(null)}
              >
                ×
              </button>
            </div>

            <span
              className="md-deliveries-badge"
              style={{
                background: `${getStatus(selectedDelivery.status).color}18`,
                color: getStatus(selectedDelivery.status).color,
              }}
            >
              {getStatus(selectedDelivery.status).label}
            </span>

            <h3 className="md-deliveries-section-title">
              Delivery information
            </h3>

            <div className="md-deliveries-detail-grid">
              <div className="md-deliveries-detail-item">
                <span>Customer</span>
                <strong>{selectedDelivery.customerName}</strong>
              </div>

              <div className="md-deliveries-detail-item">
                <span>Phone</span>
                <strong>{selectedDelivery.customerPhone}</strong>
              </div>

              <div className="md-deliveries-detail-item">
                <span>Destination</span>
                <strong>{selectedDelivery.destination}</strong>
              </div>

              <div className="md-deliveries-detail-item">
                <span>Delivery person</span>
                <strong>{selectedDelivery.deliveryPerson || "Unassigned"}</strong>
              </div>

              <div className="md-deliveries-detail-item">
                <span>Tracking number</span>
                <strong>{selectedDelivery.trackingNumber || "—"}</strong>
              </div>

              <div className="md-deliveries-detail-item">
                <span>Scheduled delivery</span>
                <strong>{dateTime(selectedDelivery.scheduledDate)}</strong>
              </div>

              <div className="md-deliveries-detail-item">
                <span>Delivery fee</span>
                <strong>{money(selectedDelivery.deliveryFee)}</strong>
              </div>

              <div className="md-deliveries-detail-item">
                <span>Delivered at</span>
                <strong>{dateTime(selectedDelivery.deliveredAt)}</strong>
              </div>
            </div>

            <h3 className="md-deliveries-section-title">
              Update assignment and tracking
            </h3>

            <div className="md-deliveries-edit-grid">
              <div className="md-deliveries-field">
                <label>Delivery person</label>
                <input
                  className="md-deliveries-input"
                  value={selectedDelivery.deliveryPerson || ""}
                  onChange={(event) =>
                    updateDeliveryDetails(selectedDelivery.id, {
                      deliveryPerson: event.target.value,
                    })
                  }
                  placeholder="Delivery person"
                />
              </div>

              <div className="md-deliveries-field">
                <label>Tracking number</label>
                <input
                  className="md-deliveries-input"
                  value={selectedDelivery.trackingNumber || ""}
                  onChange={(event) =>
                    updateDeliveryDetails(selectedDelivery.id, {
                      trackingNumber: event.target.value,
                    })
                  }
                  placeholder="Tracking number"
                />
              </div>
            </div>

            <h3 className="md-deliveries-section-title">
              Delivery notes / proof of delivery
            </h3>

            <textarea
              className="md-deliveries-textarea"
              value={selectedDelivery.notes || ""}
              onChange={(event) =>
                updateDeliveryDetails(selectedDelivery.id, {
                  notes: event.target.value,
                })
              }
              placeholder="Record delivery instructions, recipient details or proof-of-delivery notes..."
            />

            <h3 className="md-deliveries-section-title">
              Delivery timeline
            </h3>

            <div className="md-deliveries-timeline">
              {(selectedDelivery.timeline || [])
                .slice()
                .reverse()
                .map((item, index) => (
                  <div
                    className="md-deliveries-timeline-item"
                    key={`${item.timestamp}-${index}`}
                  >
                    <strong>{item.label}</strong>
                    <p>{dateTime(item.timestamp)}</p>
                  </div>
                ))}
            </div>

            <h3 className="md-deliveries-section-title">
              Update delivery status
            </h3>

            <div className="md-deliveries-detail-actions">
              {getNextStatus(selectedDelivery.status).map((nextStatus) => {
                const status = getStatus(nextStatus);

                return (
                  <button
                    key={nextStatus}
                    className={`md-deliveries-btn ${
                      nextStatus === "delivered" ? "primary" : ""
                    }`}
                    onClick={() =>
                      updateStatus(selectedDelivery.id, nextStatus)
                    }
                  >
                    Mark {status.label}
                  </button>
                );
              })}
            </div>

            {getNextStatus(selectedDelivery.status).length === 0 && (
              <p className="md-deliveries-subtitle" style={{ marginTop: 14 }}>
                This delivery is in a final status. No further status changes
                are available.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
