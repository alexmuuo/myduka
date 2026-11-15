import React, { useMemo, useState } from "react";

const INITIAL_SALES = [];

const money = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const dateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const dateOnly = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const escapeCSV = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

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
        <path d="m7 10 5 5 5-5" />
        <path d="M12 15V3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    receipt: (
      <>
        <path d="M4 3h16v18l-3-2-3 2-2-2-3 2-2-2-3 2z" />
        <path d="M8 8h8M8 12h8M8 16h4" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="2" />
        <path d="M3 9h18" />
        <path d="M16 14h2" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 4 3 6-7" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    close: (
      <>
        <path d="m18 6-12 12M6 6l12 12" />
      </>
    ),
    filter: (
      <>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M5.5 9A7 7 0 0 1 18 6l2 6" />
        <path d="M18.5 15A7 7 0 0 1 6 18l-2-6" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || null}</svg>;
}

function StatusBadge({ status }) {
  const normalized = String(status || "unknown").toLowerCase();

  const labels = {
    paid: "Paid",
    pending: "Pending",
    partially_paid: "Partially paid",
    refunded: "Refunded",
    completed: "Completed",
    processing: "Processing",
    cancelled: "Cancelled",
  };

  return (
    <span className={`md-sales-status md-sales-status-${normalized}`}>
      <span className="md-sales-status-dot" />
      {labels[normalized] || normalized.replaceAll("_", " ")}
    </span>
  );
}

function ChannelBadge({ channel }) {
  const normalized = String(channel || "").toLowerCase();

  return (
    <span className={`md-sales-channel md-sales-channel-${normalized}`}>
      {normalized === "pos" ? "POS" : normalized === "online" ? "Online" : channel || "—"}
    </span>
  );
}

export default function Sales() {
  const [sales] = useState(INITIAL_SALES);

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        [
          sale.sale_number,
          sale.customer_name,
          sale.customer_phone,
          sale.branch_name,
          sale.channel,
          sale.payment_method,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchValue));

      const matchesPayment =
        paymentFilter === "all" ||
        String(sale.payment_status || "").toLowerCase() === paymentFilter;

      const matchesChannel =
        channelFilter === "all" ||
        String(sale.channel || "").toLowerCase() === channelFilter;

      const saleDate = dateOnly(sale.created_at);

      const matchesFrom = !dateFrom || saleDate >= dateFrom;
      const matchesTo = !dateTo || saleDate <= dateTo;

      return (
        matchesSearch &&
        matchesPayment &&
        matchesChannel &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [sales, search, paymentFilter, channelFilter, dateFrom, dateTo]);

  const summary = useMemo(() => {
    const totalSales = filteredSales.length;

    const revenue = filteredSales.reduce(
      (total, sale) => total + Number(sale.total_amount || 0),
      0
    );

    const paid = filteredSales.reduce(
      (total, sale) =>
        total +
        (String(sale.payment_status).toLowerCase() === "paid"
          ? Number(sale.total_amount || 0)
          : Number(sale.amount_paid || 0)),
      0
    );

    const outstanding = filteredSales.reduce(
      (total, sale) =>
        total +
        Math.max(
          0,
          Number(sale.total_amount || 0) - Number(sale.amount_paid || 0)
        ),
      0
    );

    return {
      totalSales,
      revenue,
      paid,
      outstanding,
    };
  }, [filteredSales]);

  const activeFilters =
    paymentFilter !== "all" ||
    channelFilter !== "all" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const clearFilters = () => {
    setPaymentFilter("all");
    setChannelFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  const exportCSV = () => {
    if (!filteredSales.length) return;

    const headers = [
      "Sale Number",
      "Date",
      "Channel",
      "Customer",
      "Phone",
      "Branch",
      "Subtotal",
      "Discount",
      "Tax",
      "Total",
      "Amount Paid",
      "Payment Status",
      "Payment Method",
    ];

    const rows = filteredSales.map((sale) => [
      sale.sale_number,
      dateTime(sale.created_at),
      sale.channel,
      sale.customer_name,
      sale.customer_phone,
      sale.branch_name,
      sale.subtotal,
      sale.discount,
      sale.tax,
      sale.total_amount,
      sale.amount_paid,
      sale.payment_status,
      sale.payment_method,
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `MyDuka_Sales_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="md-sales-page">
      <style>{`
        .md-sales-page {
          color: var(--text-primary, #172033);
          width: 100%;
          min-width: 0;
          padding: 4px 0 30px;
        }

        .md-sales-page * {
          box-sizing: border-box;
        }

        .md-sales-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 24px;
        }

        .md-sales-title {
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -0.7px;
          margin: 0;
        }

        .md-sales-subtitle {
          color: var(--text-secondary, #64748b);
          font-size: 13px;
          margin: 7px 0 0;
          line-height: 1.6;
        }

        .md-sales-actions {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
        }

        .md-sales-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 9px;
          padding: 10px 14px;
          min-height: 40px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .md-sales-btn:hover:not(:disabled) {
          border-color: var(--primary-color, #4f46e5);
          color: var(--primary-color, #4f46e5);
        }

        .md-sales-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .md-sales-btn-primary {
          background: var(--primary-color, #4f46e5);
          color: #fff;
          border-color: var(--primary-color, #4f46e5);
        }

        .md-sales-btn-primary:hover:not(:disabled) {
          background: var(--primary-hover, #4338ca);
          color: #fff;
        }

        .md-sales-preview {
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

        .md-sales-preview strong {
          display: block;
          margin-bottom: 2px;
          font-size: 12px;
        }

        .md-sales-preview p {
          margin: 0;
          color: #1d4ed8;
        }

        .md-sales-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .md-sales-stat {
          padding: 17px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 13px;
          min-width: 0;
        }

        .md-sales-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 17px;
        }

        .md-sales-stat-label {
          font-size: 12px;
          color: var(--text-secondary, #64748b);
          font-weight: 550;
        }

        .md-sales-stat-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: var(--hover-bg, #f1f5f9);
          color: var(--primary-color, #4f46e5);
        }

        .md-sales-stat-value {
          font-size: 22px;
          font-weight: 750;
          letter-spacing: -0.5px;
          overflow-wrap: anywhere;
        }

        .md-sales-stat-note {
          color: var(--text-secondary, #94a3b8);
          font-size: 11px;
          margin-top: 5px;
        }

        .md-sales-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 13px;
          flex-wrap: wrap;
        }

        .md-sales-search {
          position: relative;
          flex: 1;
          min-width: 220px;
          max-width: 430px;
        }

        .md-sales-search svg {
          position: absolute;
          top: 50%;
          left: 12px;
          transform: translateY(-50%);
          color: var(--text-secondary, #94a3b8);
        }

        .md-sales-input,
        .md-sales-select {
          width: 100%;
          min-height: 41px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 9px;
          padding: 9px 11px;
          background: var(--input-bg, var(--card-bg, #fff));
          color: var(--text-primary, #172033);
          font-size: 12px;
          outline: none;
        }

        .md-sales-search .md-sales-input {
          padding-left: 39px;
        }

        .md-sales-input:focus,
        .md-sales-select:focus {
          border-color: var(--primary-color, #4f46e5);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.09);
        }

        .md-sales-filter-row {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
        }

        .md-sales-filter-row .md-sales-select {
          width: auto;
          min-width: 135px;
        }

        .md-sales-filter-panel {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          padding: 15px;
          margin-bottom: 14px;
          border: 1px solid var(--border-color, #e2e8f0);
          background: var(--card-bg, #fff);
          border-radius: 11px;
        }

        .md-sales-filter-field {
          flex: 1;
          min-width: 160px;
        }

        .md-sales-filter-field label {
          display: block;
          font-size: 11px;
          font-weight: 650;
          color: var(--text-secondary, #64748b);
          margin-bottom: 6px;
        }

        .md-sales-table-card {
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 13px;
          overflow: hidden;
          background: var(--card-bg, #fff);
        }

        .md-sales-table-heading {
          padding: 17px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .md-sales-table-heading h3 {
          font-size: 14px;
          margin: 0;
          font-weight: 700;
        }

        .md-sales-table-heading span {
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }

        .md-sales-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .md-sales-table {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
          text-align: left;
        }

        .md-sales-table th {
          background: var(--table-header-bg, var(--hover-bg, #f8fafc));
          color: var(--text-secondary, #64748b);
          padding: 12px 15px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.55px;
          font-weight: 700;
          white-space: nowrap;
        }

        .md-sales-table td {
          padding: 14px 15px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          font-size: 12px;
          white-space: nowrap;
        }

        .md-sales-table tbody tr:hover {
          background: var(--hover-bg, #f8fafc);
        }

        .md-sales-sale-number {
          font-weight: 700;
          color: var(--primary-color, #4f46e5);
        }

        .md-sales-customer {
          font-weight: 650;
        }

        .md-sales-muted {
          color: var(--text-secondary, #64748b);
          font-size: 11px;
          margin-top: 4px;
        }

        .md-sales-amount {
          font-weight: 700;
        }

        .md-sales-status,
        .md-sales-channel {
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

        .md-sales-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .md-sales-status-paid,
        .md-sales-status-completed {
          color: #15803d;
          background: #dcfce7;
        }

        .md-sales-status-pending,
        .md-sales-status-processing {
          color: #a16207;
          background: #fef3c7;
        }

        .md-sales-status-partially_paid {
          color: #1d4ed8;
          background: #dbeafe;
        }

        .md-sales-status-refunded {
          color: #7e22ce;
          background: #f3e8ff;
        }

        .md-sales-status-cancelled {
          color: #b91c1c;
          background: #fee2e2;
        }

        .md-sales-channel-online {
          background: #e0e7ff;
          color: #4338ca;
        }

        .md-sales-channel-pos {
          background: #ccfbf1;
          color: #0f766e;
        }

        .md-sales-icon-btn {
          border: 1px solid var(--border-color, #e2e8f0);
          background: transparent;
          color: var(--text-secondary, #64748b);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .md-sales-icon-btn:hover {
          color: var(--primary-color, #4f46e5);
          border-color: var(--primary-color, #4f46e5);
        }

        .md-sales-empty {
          text-align: center;
          padding: 55px 20px;
        }

        .md-sales-empty-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          border-radius: 15px;
          color: var(--text-secondary, #64748b);
          background: var(--hover-bg, #f1f5f9);
        }

        .md-sales-empty h3 {
          margin: 0 0 7px;
          font-size: 14px;
        }

        .md-sales-empty p {
          margin: 0 auto;
          max-width: 360px;
          font-size: 12px;
          line-height: 1.6;
          color: var(--text-secondary, #64748b);
        }

        .md-sales-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px 17px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          color: var(--text-secondary, #64748b);
          font-size: 11px;
        }

        .md-sales-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .md-sales-modal {
          width: 100%;
          max-width: 610px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 15px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .md-sales-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 19px 21px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .md-sales-modal-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .md-sales-modal-header p {
          margin: 5px 0 0;
          color: var(--text-secondary, #64748b);
          font-size: 11px;
        }

        .md-sales-modal-body {
          padding: 20px;
        }

        .md-sales-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
          margin-bottom: 22px;
        }

        .md-sales-detail-label {
          color: var(--text-secondary, #64748b);
          font-size: 10px;
          margin-bottom: 5px;
        }

        .md-sales-detail-value {
          font-size: 12px;
          font-weight: 650;
          overflow-wrap: anywhere;
        }

        .md-sales-modal-section {
          border-top: 1px solid var(--border-color, #e2e8f0);
          padding-top: 17px;
          margin-top: 17px;
        }

        .md-sales-modal-section h4 {
          font-size: 12px;
          margin: 0 0 13px;
        }

        .md-sales-line {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 8px 0;
          font-size: 12px;
        }

        .md-sales-line-total {
          border-top: 1px solid var(--border-color, #e2e8f0);
          padding-top: 13px;
          margin-top: 7px;
          font-weight: 750;
          font-size: 14px;
        }

        @media (max-width: 1000px) {
          .md-sales-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .md-sales-header {
            flex-direction: column;
          }

          .md-sales-actions {
            width: 100%;
          }

          .md-sales-actions .md-sales-btn {
            flex: 1;
          }

          .md-sales-stats {
            gap: 9px;
          }

          .md-sales-stat {
            padding: 13px;
          }

          .md-sales-stat-value {
            font-size: 18px;
          }

          .md-sales-stat-top {
            margin-bottom: 12px;
          }

          .md-sales-toolbar {
            align-items: stretch;
          }

          .md-sales-search {
            max-width: none;
            min-width: 100%;
          }

          .md-sales-filter-row {
            width: 100%;
          }

          .md-sales-filter-row .md-sales-select {
            flex: 1;
            min-width: 0;
          }

          .md-sales-filter-panel {
            align-items: stretch;
          }

          .md-sales-filter-field {
            min-width: 100%;
          }

          .md-sales-detail-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 380px) {
          .md-sales-stats {
            grid-template-columns: 1fr;
          }

          .md-sales-detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="md-sales-header">
        <div>
          <h1 className="md-sales-title">Sales</h1>
          <p className="md-sales-subtitle">
            Monitor your business sales, revenue and payment records.
          </p>
        </div>

        <div className="md-sales-actions">
          <button
            className="md-sales-btn"
            onClick={clearFilters}
            type="button"
          >
            <Icon name="refresh" size={15} />
            Reset
          </button>

          <button
            className="md-sales-btn md-sales-btn-primary"
            onClick={exportCSV}
            disabled={!filteredSales.length}
            type="button"
          >
            <Icon name="download" size={15} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="md-sales-preview">
        <Icon name="receipt" size={19} />
        <div>
          <strong>Frontend preview mode</strong>
          <p>
            Sales records will appear here once the backend is connected.
            This page currently uses no sample or fabricated transactions.
            Filters and exports will work with real records after integration.
          </p>
        </div>
      </div>

      <div className="md-sales-stats">
        <div className="md-sales-stat">
          <div className="md-sales-stat-top">
            <span className="md-sales-stat-label">Total sales</span>
            <span className="md-sales-stat-icon">
              <Icon name="receipt" />
            </span>
          </div>
          <div className="md-sales-stat-value">
            {summary.totalSales.toLocaleString("en-KE")}
          </div>
          <div className="md-sales-stat-note">
            Transactions in selected period
          </div>
        </div>

        <div className="md-sales-stat">
          <div className="md-sales-stat-top">
            <span className="md-sales-stat-label">Total revenue</span>
            <span className="md-sales-stat-icon">
              <Icon name="chart" />
            </span>
          </div>
          <div className="md-sales-stat-value">
            {money(summary.revenue)}
          </div>
          <div className="md-sales-stat-note">
            Total value of recorded sales
          </div>
        </div>

        <div className="md-sales-stat">
          <div className="md-sales-stat-top">
            <span className="md-sales-stat-label">Amount paid</span>
            <span className="md-sales-stat-icon">
              <Icon name="wallet" />
            </span>
          </div>
          <div className="md-sales-stat-value">
            {money(summary.paid)}
          </div>
          <div className="md-sales-stat-note">
            Payments received
          </div>
        </div>

        <div className="md-sales-stat">
          <div className="md-sales-stat-top">
            <span className="md-sales-stat-label">Outstanding</span>
            <span className="md-sales-stat-icon">
              <Icon name="calendar" />
            </span>
          </div>
          <div className="md-sales-stat-value">
            {money(summary.outstanding)}
          </div>
          <div className="md-sales-stat-note">
            Remaining customer balances
          </div>
        </div>
      </div>

      <div className="md-sales-toolbar">
        <div className="md-sales-search">
          <Icon name="search" size={17} />
          <input
            className="md-sales-input"
            type="text"
            placeholder="Search sale number, customer, phone or branch..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="md-sales-filter-row">
          <select
            className="md-sales-select"
            value={channelFilter}
            onChange={(event) => setChannelFilter(event.target.value)}
            aria-label="Filter by sales channel"
          >
            <option value="all">All channels</option>
            <option value="online">Online</option>
            <option value="pos">POS</option>
          </select>

          <select
            className="md-sales-select"
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            aria-label="Filter by payment status"
          >
            <option value="all">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partially_paid">Partially paid</option>
            <option value="refunded">Refunded</option>
          </select>

          <button
            className="md-sales-btn"
            type="button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Icon name="filter" size={15} />
            Dates
            {activeFilters && (
              <span style={{ color: "var(--primary-color, #4f46e5)" }}>
                •
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="md-sales-filter-panel">
          <div className="md-sales-filter-field">
            <label htmlFor="sales-date-from">From date</label>
            <input
              id="sales-date-from"
              className="md-sales-input"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>

          <div className="md-sales-filter-field">
            <label htmlFor="sales-date-to">To date</label>
            <input
              id="sales-date-to"
              className="md-sales-input"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>

          <button
            className="md-sales-btn"
            type="button"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear dates
          </button>
        </div>
      )}

      <div className="md-sales-table-card">
        <div className="md-sales-table-heading">
          <h3>Sales records</h3>
          <span>
            {filteredSales.length}{" "}
            {filteredSales.length === 1 ? "record" : "records"}
          </span>
        </div>

        {filteredSales.length === 0 ? (
          <div className="md-sales-empty">
            <div className="md-sales-empty-icon">
              <Icon name="receipt" size={25} />
            </div>

            <h3>
              {sales.length === 0
                ? "No sales recorded yet"
                : "No matching sales"}
            </h3>

            <p>
              {sales.length === 0
                ? "Your business sales will appear here when transactions are connected to MyDuka. Online and POS sales will be available in this register."
                : "Try changing your search or filters to find the sales records you are looking for."}
            </p>
          </div>
        ) : (
          <div className="md-sales-table-wrap">
            <table className="md-sales-table">
              <thead>
                <tr>
                  <th>Sale number</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Channel</th>
                  <th>Branch</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <span className="md-sales-sale-number">
                        {sale.sale_number || `SALE-${sale.id}`}
                      </span>
                    </td>

                    <td>{dateTime(sale.created_at)}</td>

                    <td>
                      <div className="md-sales-customer">
                        {sale.customer_name || "Walk-in customer"}
                      </div>
                      {sale.customer_phone && (
                        <div className="md-sales-muted">
                          {sale.customer_phone}
                        </div>
                      )}
                    </td>

                    <td>
                      <ChannelBadge channel={sale.channel} />
                    </td>

                    <td>{sale.branch_name || "—"}</td>

                    <td className="md-sales-amount">
                      {money(sale.total_amount)}
                    </td>

                    <td>
                      <StatusBadge status={sale.payment_status} />
                    </td>

                    <td>
                      <button
                        className="md-sales-icon-btn"
                        type="button"
                        title="View sale"
                        onClick={() => setSelectedSale(sale)}
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

        <div className="md-sales-pagination">
          <span>
            Showing {filteredSales.length} of {sales.length} records
          </span>
          <span>All records</span>
        </div>
      </div>

      {selectedSale && (
        <div
          className="md-sales-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedSale(null);
            }
          }}
        >
          <div
            className="md-sales-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sales-detail-title"
          >
            <div className="md-sales-modal-header">
              <div>
                <h3 id="sales-detail-title">Sale details</h3>
                <p>
                  {selectedSale.sale_number || `SALE-${selectedSale.id}`}
                </p>
              </div>

              <button
                className="md-sales-icon-btn"
                type="button"
                onClick={() => setSelectedSale(null)}
                aria-label="Close sale details"
              >
                <Icon name="close" size={17} />
              </button>
            </div>

            <div className="md-sales-modal-body">
              <div className="md-sales-detail-grid">
                <div>
                  <div className="md-sales-detail-label">Sale date</div>
                  <div className="md-sales-detail-value">
                    {dateTime(selectedSale.created_at)}
                  </div>
                </div>

                <div>
                  <div className="md-sales-detail-label">Sales channel</div>
                  <div className="md-sales-detail-value">
                    <ChannelBadge channel={selectedSale.channel} />
                  </div>
                </div>

                <div>
                  <div className="md-sales-detail-label">Customer</div>
                  <div className="md-sales-detail-value">
                    {selectedSale.customer_name || "Walk-in customer"}
                  </div>
                </div>

                <div>
                  <div className="md-sales-detail-label">Phone</div>
                  <div className="md-sales-detail-value">
                    {selectedSale.customer_phone || "—"}
                  </div>
                </div>

                <div>
                  <div className="md-sales-detail-label">Branch</div>
                  <div className="md-sales-detail-value">
                    {selectedSale.branch_name || "—"}
                  </div>
                </div>

                <div>
                  <div className="md-sales-detail-label">Payment status</div>
                  <div className="md-sales-detail-value">
                    <StatusBadge status={selectedSale.payment_status} />
                  </div>
                </div>

                <div>
                  <div className="md-sales-detail-label">Payment method</div>
                  <div className="md-sales-detail-value">
                    {selectedSale.payment_method || "—"}
                  </div>
                </div>

                <div>
                  <div className="md-sales-detail-label">Fulfilment status</div>
                  <div className="md-sales-detail-value">
                    {selectedSale.fulfillment_status || "—"}
                  </div>
                </div>
              </div>

              <div className="md-sales-modal-section">
                <h4>Sale summary</h4>

                <div className="md-sales-line">
                  <span>Subtotal</span>
                  <span>{money(selectedSale.subtotal)}</span>
                </div>

                <div className="md-sales-line">
                  <span>Discount</span>
                  <span>{money(selectedSale.discount)}</span>
                </div>

                <div className="md-sales-line">
                  <span>Tax</span>
                  <span>{money(selectedSale.tax)}</span>
                </div>

                <div className="md-sales-line md-sales-line-total">
                  <span>Total amount</span>
                  <span>{money(selectedSale.total_amount)}</span>
                </div>

                <div className="md-sales-line">
                  <span>Amount paid</span>
                  <span>{money(selectedSale.amount_paid)}</span>
                </div>

                <div className="md-sales-line">
                  <span>Balance</span>
                  <span>
                    {money(
                      Math.max(
                        0,
                        Number(selectedSale.total_amount || 0) -
                          Number(selectedSale.amount_paid || 0)
                      )
                    )}
                  </span>
                </div>
              </div>

              {Array.isArray(selectedSale.items) &&
                selectedSale.items.length > 0 && (
                  <div className="md-sales-modal-section">
                    <h4>Items sold</h4>

                    {selectedSale.items.map((item, index) => (
                      <div className="md-sales-line" key={item.id || index}>
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

              {selectedSale.notes && (
                <div className="md-sales-modal-section">
                  <h4>Notes</h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: "var(--text-secondary, #64748b)",
                    }}
                  >
                    {selectedSale.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
