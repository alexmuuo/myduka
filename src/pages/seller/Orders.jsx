import React, { useMemo, useState } from "react";

const INITIAL_ORDERS = [];

const money = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-KE", {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

const csvValue = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

function Icon({ name, size = 18 }) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5M12 15V3" />
      </>
    ),
    package: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="M3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    truck: (
      <>
        <path d="M3 6h12v12H3zM15 10h4l3 4v4h-7z" />
        <circle cx="7.5" cy="18" r="1.5" />
        <circle cx="18" cy="18" r="1.5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
    filter: (
      <>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.5 9A7 7 0 0 1 18 6l2 6M18.5 15A7 7 0 0 1 6 18l-2-6" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || null}
    </svg>
  );
}

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "ready",
  "dispatched",
  "delivered",
  "cancelled",
];

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  ready: "Ready",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function StatusBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase();

  return (
    <span className={`md-orders-status md-orders-status-${normalized}`}>
      <span className="md-orders-status-dot" />
      {STATUS_LABELS[normalized] || normalized.replaceAll("_", " ")}
    </span>
  );
}

function PaymentBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase();

  return (
    <span className={`md-orders-payment md-orders-payment-${normalized}`}>
      {normalized.replaceAll("_", " ")}
    </span>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notice, setNotice] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        [
          order.order_number,
          order.customer_name,
          order.customer_phone,
          order.delivery_address,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "all" ||
        String(order.status).toLowerCase() === statusFilter;

      const matchesPayment =
        paymentFilter === "all" ||
        String(order.payment_status).toLowerCase() === paymentFilter;

      const orderDate = order.created_at
        ? new Date(order.created_at).toISOString().slice(0, 10)
        : "";

      const matchesFrom = !dateFrom || orderDate >= dateFrom;
      const matchesTo = !dateTo || orderDate <= dateTo;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [orders, search, statusFilter, paymentFilter, dateFrom, dateTo]);

  const summary = useMemo(() => {
    return {
      total: filteredOrders.length,
      pending: filteredOrders.filter(
        (order) => order.status === "pending"
      ).length,
      processing: filteredOrders.filter((order) =>
        ["confirmed", "processing", "ready"].includes(order.status)
      ).length,
      dispatched: filteredOrders.filter(
        (order) => order.status === "dispatched"
      ).length,
      delivered: filteredOrders.filter(
        (order) => order.status === "delivered"
      ).length,
    };
  }, [filteredOrders]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: newStatus,
              updated_at: new Date().toISOString(),
            }
          : order
      )
    );

    setSelectedOrder((current) =>
      current?.id === orderId
        ? {
            ...current,
            status: newStatus,
            updated_at: new Date().toISOString(),
          }
        : current
    );

    setNotice(
      `Order status changed to ${STATUS_LABELS[newStatus] || newStatus}. This preview change is temporary.`
    );
  };

  const exportCSV = () => {
    if (!filteredOrders.length) return;

    const headers = [
      "Order Number",
      "Date",
      "Customer",
      "Phone",
      "Delivery Address",
      "Subtotal",
      "Discount",
      "Delivery Fee",
      "Total",
      "Payment Status",
      "Order Status",
    ];

    const rows = filteredOrders.map((order) => [
      order.order_number,
      formatDate(order.created_at),
      order.customer_name,
      order.customer_phone,
      order.delivery_address,
      order.subtotal,
      order.discount,
      order.delivery_fee,
      order.total_amount,
      order.payment_status,
      order.status,
    ]);

    const csv = [
      headers.map(csvValue).join(","),
      ...rows.map((row) => row.map(csvValue).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `MyDuka_Orders_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const nextStatus = (status) => {
    const index = ORDER_STATUSES.indexOf(status);

    if (index < 0 || index >= ORDER_STATUSES.length - 2) return null;

    return ORDER_STATUSES[index + 1];
  };

  return (
    <div className="md-orders-page">
      <style>{`
        .md-orders-page {
          width: 100%;
          min-width: 0;
          color: var(--text-primary, #172033);
          padding: 4px 0 30px;
        }

        .md-orders-page * {
          box-sizing: border-box;
        }

        .md-orders-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 23px;
        }

        .md-orders-title {
          margin: 0;
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -0.7px;
        }

        .md-orders-subtitle {
          margin: 7px 0 0;
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary, #64748b);
        }

        .md-orders-actions {
          display: flex;
          gap: 9px;
        }

        .md-orders-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          padding: 9px 14px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 9px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
        }

        .md-orders-btn:hover:not(:disabled) {
          border-color: var(--primary-color, #4f46e5);
          color: var(--primary-color, #4f46e5);
        }

        .md-orders-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .md-orders-btn-primary {
          background: var(--primary-color, #4f46e5);
          border-color: var(--primary-color, #4f46e5);
          color: white;
        }

        .md-orders-btn-primary:hover:not(:disabled) {
          background: var(--primary-hover, #4338ca);
          color: white;
        }

        .md-orders-preview {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding: 13px 15px;
          border: 1px solid #bfdbfe;
          border-radius: 11px;
          background: #eff6ff;
          color: #1e40af;
          margin-bottom: 21px;
          font-size: 12px;
          line-height: 1.6;
        }

        .md-orders-preview strong {
          display: block;
          margin-bottom: 3px;
        }

        .md-orders-preview p {
          margin: 0;
          color: #1d4ed8;
        }

        .md-orders-notice {
          margin-bottom: 15px;
          padding: 11px 14px;
          border-radius: 9px;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          font-size: 12px;
        }

        .md-orders-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .md-orders-stat {
          min-width: 0;
          padding: 17px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 13px;
        }

        .md-orders-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 17px;
        }

        .md-orders-stat-label {
          color: var(--text-secondary, #64748b);
          font-size: 12px;
          font-weight: 550;
        }

        .md-orders-stat-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: var(--hover-bg, #f1f5f9);
          color: var(--primary-color, #4f46e5);
        }

        .md-orders-stat-value {
          font-size: 23px;
          font-weight: 750;
        }

        .md-orders-stat-note {
          margin-top: 5px;
          color: var(--text-secondary, #94a3b8);
          font-size: 11px;
        }

        .md-orders-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 13px;
        }

        .md-orders-search {
          position: relative;
          flex: 1;
          max-width: 430px;
          min-width: 220px;
        }

        .md-orders-search svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary, #94a3b8);
        }

        .md-orders-input,
        .md-orders-select {
          width: 100%;
          min-height: 41px;
          padding: 9px 11px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 9px;
          background: var(--input-bg, var(--card-bg, #fff));
          color: var(--text-primary, #172033);
          font-size: 12px;
          outline: none;
        }

        .md-orders-search .md-orders-input {
          padding-left: 39px;
        }

        .md-orders-input:focus,
        .md-orders-select:focus {
          border-color: var(--primary-color, #4f46e5);
          box-shadow: 0 0 0 3px rgba(79,70,229,.09);
        }

        .md-orders-filter-actions {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
        }

        .md-orders-filter-actions .md-orders-select {
          width: auto;
          min-width: 140px;
        }

        .md-orders-filter-panel {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          padding: 15px;
          margin-bottom: 14px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 11px;
          background: var(--card-bg, #fff);
        }

        .md-orders-filter-field label {
          display: block;
          margin-bottom: 6px;
          color: var(--text-secondary, #64748b);
          font-size: 11px;
          font-weight: 650;
        }

        .md-orders-table-card {
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 13px;
          overflow: hidden;
          background: var(--card-bg, #fff);
        }

        .md-orders-table-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 17px 18px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .md-orders-table-heading h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
        }

        .md-orders-table-heading span {
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }

        .md-orders-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .md-orders-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
          text-align: left;
        }

        .md-orders-table th {
          padding: 12px 15px;
          background: var(--table-header-bg, var(--hover-bg, #f8fafc));
          color: var(--text-secondary, #64748b);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .5px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .md-orders-table td {
          padding: 14px 15px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          font-size: 12px;
          white-space: nowrap;
        }

        .md-orders-table tbody tr:hover {
          background: var(--hover-bg, #f8fafc);
        }

        .md-orders-number {
          color: var(--primary-color, #4f46e5);
          font-weight: 700;
        }

        .md-orders-customer {
          font-weight: 650;
        }

        .md-orders-muted {
          margin-top: 4px;
          color: var(--text-secondary, #64748b);
          font-size: 11px;
        }

        .md-orders-amount {
          font-weight: 700;
        }

        .md-orders-status,
        .md-orders-payment {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          text-transform: capitalize;
          white-space: nowrap;
        }

        .md-orders-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .md-orders-status-pending,
        .md-orders-payment-pending {
          color: #a16207;
          background: #fef3c7;
        }

        .md-orders-status-confirmed,
        .md-orders-status-processing {
          color: #1d4ed8;
          background: #dbeafe;
        }

        .md-orders-status-ready {
          color: #7e22ce;
          background: #f3e8ff;
        }

        .md-orders-status-dispatched {
          color: #0369a1;
          background: #e0f2fe;
        }

        .md-orders-status-delivered,
        .md-orders-payment-paid {
          color: #15803d;
          background: #dcfce7;
        }

        .md-orders-status-cancelled,
        .md-orders-payment-refunded {
          color: #b91c1c;
          background: #fee2e2;
        }

        .md-orders-payment-partially_paid {
          color: #1d4ed8;
          background: #dbeafe;
        }

        .md-orders-icon-btn {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          background: transparent;
          color: var(--text-secondary, #64748b);
          cursor: pointer;
        }

        .md-orders-icon-btn:hover {
          color: var(--primary-color, #4f46e5);
          border-color: var(--primary-color, #4f46e5);
        }

        .md-orders-empty {
          padding: 55px 20px;
          text-align: center;
        }

        .md-orders-empty-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          border-radius: 15px;
          background: var(--hover-bg, #f1f5f9);
          color: var(--text-secondary, #64748b);
        }

        .md-orders-empty h3 {
          margin: 0 0 7px;
          font-size: 14px;
        }

        .md-orders-empty p {
          max-width: 370px;
          margin: 0 auto;
          color: var(--text-secondary, #64748b);
          font-size: 12px;
          line-height: 1.6;
        }

        .md-orders-pagination {
          display: flex;
          justify-content: space-between;
          padding: 13px 17px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          color: var(--text-secondary, #64748b);
          font-size: 11px;
        }

        .md-orders-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(15,23,42,.55);
        }

        .md-orders-modal {
          width: 100%;
          max-width: 650px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 15px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          box-shadow: 0 20px 60px rgba(0,0,0,.2);
        }

        .md-orders-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding: 19px 21px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .md-orders-modal-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .md-orders-modal-header p {
          margin: 5px 0 0;
          color: var(--text-secondary, #64748b);
          font-size: 11px;
        }

        .md-orders-modal-body {
          padding: 20px;
        }

        .md-orders-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .md-orders-detail-label {
          margin-bottom: 5px;
          color: var(--text-secondary, #64748b);
          font-size: 10px;
        }

        .md-orders-detail-value {
          font-size: 12px;
          font-weight: 650;
          overflow-wrap: anywhere;
        }

        .md-orders-modal-section {
          margin-top: 20px;
          padding-top: 17px;
          border-top: 1px solid var(--border-color, #e2e8f0);
        }

        .md-orders-modal-section h4 {
          margin: 0 0 12px;
          font-size: 12px;
        }

        .md-orders-line {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 8px 0;
          font-size: 12px;
        }

        .md-orders-line-total {
          margin-top: 7px;
          padding-top: 13px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          font-size: 14px;
          font-weight: 750;
        }

        .md-orders-status-actions {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        @media (max-width: 1000px) {
          .md-orders-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .md-orders-header {
            flex-direction: column;
          }

          .md-orders-actions {
            width: 100%;
          }

          .md-orders-actions .md-orders-btn {
            flex: 1;
          }

          .md-orders-toolbar {
            align-items: stretch;
          }

          .md-orders-search {
            max-width: none;
            min-width: 100%;
          }

          .md-orders-filter-actions {
            width: 100%;
          }

          .md-orders-filter-actions .md-orders-select {
            flex: 1;
            min-width: 0;
          }

          .md-orders-filter-panel {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 380px) {
          .md-orders-stats {
            grid-template-columns: 1fr;
          }

          .md-orders-detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="md-orders-header">
        <div>
          <h1 className="md-orders-title">Orders</h1>
          <p className="md-orders-subtitle">
            Manage customer orders from confirmation through delivery.
          </p>
        </div>

        <div className="md-orders-actions">
          <button
            className="md-orders-btn"
            type="button"
            onClick={clearFilters}
          >
            <Icon name="refresh" size={15} />
            Reset
          </button>

          <button
            className="md-orders-btn md-orders-btn-primary"
            type="button"
            disabled={!filteredOrders.length}
            onClick={exportCSV}
          >
            <Icon name="download" size={15} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="md-orders-preview">
        <Icon name="package" size={19} />
        <div>
          <strong>Frontend preview mode</strong>
          <p>
            Customer orders will appear here after backend integration.
            Order status changes currently exist only in temporary browser
            state and are not saved to a database.
          </p>
        </div>
      </div>

      {notice && (
        <div className="md-orders-notice">
          {notice}
          <button
            type="button"
            onClick={() => setNotice("")}
            style={{
              float: "right",
              border: 0,
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="md-orders-stats">
        <div className="md-orders-stat">
          <div className="md-orders-stat-top">
            <span className="md-orders-stat-label">Total orders</span>
            <span className="md-orders-stat-icon">
              <Icon name="package" />
            </span>
          </div>
          <div className="md-orders-stat-value">{summary.total}</div>
          <div className="md-orders-stat-note">Selected records</div>
        </div>

        <div className="md-orders-stat">
          <div className="md-orders-stat-top">
            <span className="md-orders-stat-label">Pending</span>
            <span className="md-orders-stat-icon">
              <Icon name="clock" />
            </span>
          </div>
          <div className="md-orders-stat-value">{summary.pending}</div>
          <div className="md-orders-stat-note">Awaiting confirmation</div>
        </div>

        <div className="md-orders-stat">
          <div className="md-orders-stat-top">
            <span className="md-orders-stat-label">Processing</span>
            <span className="md-orders-stat-icon">
              <Icon name="refresh" />
            </span>
          </div>
          <div className="md-orders-stat-value">{summary.processing}</div>
          <div className="md-orders-stat-note">Being prepared</div>
        </div>

        <div className="md-orders-stat">
          <div className="md-orders-stat-top">
            <span className="md-orders-stat-label">Dispatched</span>
            <span className="md-orders-stat-icon">
              <Icon name="truck" />
            </span>
          </div>
          <div className="md-orders-stat-value">{summary.dispatched}</div>
          <div className="md-orders-stat-note">Out for delivery</div>
        </div>
      </div>

      <div className="md-orders-toolbar">
        <div className="md-orders-search">
          <Icon name="search" size={17} />
          <input
            className="md-orders-input"
            placeholder="Search order number, customer or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="md-orders-filter-actions">
          <select
            className="md-orders-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by order status"
          >
            <option value="all">All order statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <select
            className="md-orders-select"
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            aria-label="Filter by payment status"
          >
            <option value="all">All payment statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partially_paid">Partially paid</option>
            <option value="refunded">Refunded</option>
          </select>

          <button
            className="md-orders-btn"
            type="button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Icon name="filter" size={15} />
            Dates
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="md-orders-filter-panel">
          <div className="md-orders-filter-field">
            <label htmlFor="orders-date-from">From date</label>
            <input
              id="orders-date-from"
              className="md-orders-input"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>

          <div className="md-orders-filter-field">
            <label htmlFor="orders-date-to">To date</label>
            <input
              id="orders-date-to"
              className="md-orders-input"
              type="date"
              min={dateFrom || undefined}
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </div>
      )}

      <div className="md-orders-table-card">
        <div className="md-orders-table-heading">
          <h3>Customer orders</h3>
          <span>
            {filteredOrders.length}{" "}
            {filteredOrders.length === 1 ? "order" : "orders"}
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="md-orders-empty">
            <div className="md-orders-empty-icon">
              <Icon name="package" size={25} />
            </div>

            <h3>
              {orders.length === 0
                ? "No orders yet"
                : "No matching orders"}
            </h3>

            <p>
              {orders.length === 0
                ? "Orders placed by customers through your storefront will appear here."
                : "Try changing your search or filters."}
            </p>
          </div>
        ) : (
          <div className="md-orders-table-wrap">
            <table className="md-orders-table">
              <thead>
                <tr>
                  <th>Order number</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Order status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="md-orders-number">
                        {order.order_number || `ORD-${order.id}`}
                      </span>
                    </td>

                    <td>{formatDate(order.created_at)}</td>

                    <td>
                      <div className="md-orders-customer">
                        {order.customer_name || "Customer"}
                      </div>
                      <div className="md-orders-muted">
                        {order.customer_phone || "No phone"}
                      </div>
                    </td>

                    <td className="md-orders-amount">
                      {money(order.total_amount)}
                    </td>

                    <td>
                      <PaymentBadge status={order.payment_status} />
                    </td>

                    <td>
                      <StatusBadge status={order.status} />
                    </td>

                    <td>
                      <button
                        type="button"
                        className="md-orders-icon-btn"
                        title="View order"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Icon name="eye" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="md-orders-pagination">
          <span>
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
          <span>All records</span>
        </div>
      </div>

      {selectedOrder && (
        <div
          className="md-orders-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <div
            className="md-orders-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="orders-detail-title"
          >
            <div className="md-orders-modal-header">
              <div>
                <h3 id="orders-detail-title">Order details</h3>
                <p>
                  {selectedOrder.order_number ||
                    `ORD-${selectedOrder.id}`}
                </p>
              </div>

              <button
                className="md-orders-icon-btn"
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
              >
                <Icon name="close" size={17} />
              </button>
            </div>

            <div className="md-orders-modal-body">
              <div className="md-orders-detail-grid">
                <div>
                  <div className="md-orders-detail-label">Order date</div>
                  <div className="md-orders-detail-value">
                    {formatDate(selectedOrder.created_at)}
                  </div>
                </div>

                <div>
                  <div className="md-orders-detail-label">Order status</div>
                  <div className="md-orders-detail-value">
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                </div>

                <div>
                  <div className="md-orders-detail-label">Customer</div>
                  <div className="md-orders-detail-value">
                    {selectedOrder.customer_name || "Customer"}
                  </div>
                </div>

                <div>
                  <div className="md-orders-detail-label">Phone</div>
                  <div className="md-orders-detail-value">
                    {selectedOrder.customer_phone || "—"}
                  </div>
                </div>

                <div>
                  <div className="md-orders-detail-label">Payment status</div>
                  <div className="md-orders-detail-value">
                    <PaymentBadge status={selectedOrder.payment_status} />
                  </div>
                </div>

                <div>
                  <div className="md-orders-detail-label">Payment method</div>
                  <div className="md-orders-detail-value">
                    {selectedOrder.payment_method || "—"}
                  </div>
                </div>
              </div>

              <div className="md-orders-modal-section">
                <h4>Delivery information</h4>

                <div className="md-orders-line">
                  <span>Delivery address</span>
                  <strong style={{ textAlign: "right" }}>
                    {selectedOrder.delivery_address || "—"}
                  </strong>
                </div>

                <div className="md-orders-line">
                  <span>Delivery method</span>
                  <strong>
                    {selectedOrder.delivery_method || "—"}
                  </strong>
                </div>

                <div className="md-orders-line">
                  <span>Delivery instructions</span>
                  <strong>
                    {selectedOrder.delivery_instructions || "—"}
                  </strong>
                </div>
              </div>

              {Array.isArray(selectedOrder.items) &&
                selectedOrder.items.length > 0 && (
                  <div className="md-orders-modal-section">
                    <h4>Ordered items</h4>

                    {selectedOrder.items.map((item, index) => (
                      <div
                        className="md-orders-line"
                        key={item.id || index}
                      >
                        <span>
                          {item.product_name || item.name || "Product"} ×{" "}
                          {item.quantity}
                        </span>
                        <strong>
                          {money(
                            item.total_price ??
                              Number(item.quantity || 0) *
                                Number(item.unit_price || 0)
                          )}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}

              <div className="md-orders-modal-section">
                <h4>Order summary</h4>

                <div className="md-orders-line">
                  <span>Subtotal</span>
                  <span>{money(selectedOrder.subtotal)}</span>
                </div>

                <div className="md-orders-line">
                  <span>Discount</span>
                  <span>{money(selectedOrder.discount)}</span>
                </div>

                <div className="md-orders-line">
                  <span>Delivery fee</span>
                  <span>{money(selectedOrder.delivery_fee)}</span>
                </div>

                <div className="md-orders-line">
                  <span>Tax</span>
                  <span>{money(selectedOrder.tax)}</span>
                </div>

                <div className="md-orders-line md-orders-line-total">
                  <span>Total</span>
                  <span>{money(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="md-orders-modal-section">
                  <h4>Order notes</h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: "var(--text-secondary, #64748b)",
                    }}
                  >
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              <div className="md-orders-modal-section">
                <h4>Update order status</h4>

                <div className="md-orders-status-actions">
                  {selectedOrder.status !== "cancelled" &&
                    selectedOrder.status !== "delivered" && (
                      <>
                        {nextStatus(selectedOrder.status) && (
                          <button
                            className="md-orders-btn md-orders-btn-primary"
                            type="button"
                            onClick={() =>
                              updateOrderStatus(
                                selectedOrder.id,
                                nextStatus(selectedOrder.status)
                              )
                            }
                          >
                            <Icon name="check" size={15} />
                            Mark as{" "}
                            {STATUS_LABELS[
                              nextStatus(selectedOrder.status)
                            ]}
                          </button>
                        )}

                        <button
                          className="md-orders-btn"
                          type="button"
                          onClick={() =>
                            updateOrderStatus(
                              selectedOrder.id,
                              "cancelled"
                            )
                          }
                        >
                          Cancel order
                        </button>
                      </>
                    )}

                  {(selectedOrder.status === "delivered" ||
                    selectedOrder.status === "cancelled") && (
                    <span className="md-orders-muted">
                      This order has reached a final status.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
