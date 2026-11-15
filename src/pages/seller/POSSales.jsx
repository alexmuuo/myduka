import React, { useMemo, useState } from "react";

const INITIAL_POS_SALES = [];

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
    receipt: (
      <>
        <path d="M4 3h16v18l-3-2-3 2-2-2-3 2-2-2-3 2z" />
        <path d="M8 8h8M8 12h8M8 16h4" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="2" />
        <path d="M3 9h18M16 14h2" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
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

function Badge({ value, type = "status" }) {
  const normalized = String(value || "unknown").toLowerCase();

  const labels = {
    paid: "Paid",
    pending: "Pending",
    partially_paid: "Partially paid",
    refunded: "Refunded",
    completed: "Completed",
    voided: "Voided",
    cancelled: "Cancelled",
    cash: "Cash",
    mpesa: "M-Pesa",
    card: "Card",
    bank: "Bank",
  };

  return (
    <span className={`md-pos-badge md-pos-${type}-${normalized}`}>
      {labels[normalized] || normalized.replaceAll("_", " ")}
    </span>
  );
}

export default function POSSales() {
  const [sales] = useState(INITIAL_POS_SALES);

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [cashierFilter, setCashierFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const branches = useMemo(
    () => [
      ...new Set(sales.map((sale) => sale.branch_name).filter(Boolean)),
    ],
    [sales]
  );

  const cashiers = useMemo(
    () => [
      ...new Set(sales.map((sale) => sale.cashier_name).filter(Boolean)),
    ],
    [sales]
  );

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        [
          sale.sale_number,
          sale.cashier_name,
          sale.branch_name,
          sale.customer_name,
          sale.customer_phone,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesBranch =
        branchFilter === "all" || sale.branch_name === branchFilter;

      const matchesCashier =
        cashierFilter === "all" || sale.cashier_name === cashierFilter;

      const matchesPayment =
        paymentFilter === "all" ||
        String(sale.payment_method || "").toLowerCase() === paymentFilter;

      const matchesStatus =
        statusFilter === "all" ||
        String(sale.status || "").toLowerCase() === statusFilter;

      const saleDate = sale.created_at
        ? new Date(sale.created_at).toISOString().slice(0, 10)
        : "";

      const matchesFrom = !dateFrom || saleDate >= dateFrom;
      const matchesTo = !dateTo || saleDate <= dateTo;

      return (
        matchesSearch &&
        matchesBranch &&
        matchesCashier &&
        matchesPayment &&
        matchesStatus &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    sales,
    search,
    branchFilter,
    cashierFilter,
    paymentFilter,
    statusFilter,
    dateFrom,
    dateTo,
  ]);

  const summary = useMemo(() => {
    const completed = filteredSales.filter(
      (sale) => String(sale.status).toLowerCase() === "completed"
    );

    const paid = completed.filter(
      (sale) => String(sale.payment_status).toLowerCase() === "paid"
    );

    return {
      transactions: filteredSales.length,
      completed: completed.length,
      revenue: completed.reduce(
        (total, sale) => total + Number(sale.total_amount || 0),
        0
      ),
      cashiers: new Set(
        filteredSales.map((sale) => sale.cashier_name).filter(Boolean)
      ).size,
      paidAmount: paid.reduce(
        (total, sale) => total + Number(sale.total_amount || 0),
        0
      ),
    };
  }, [filteredSales]);

  const clearFilters = () => {
    setSearch("");
    setBranchFilter("all");
    setCashierFilter("all");
    setPaymentFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const exportCSV = () => {
    if (!filteredSales.length) return;

    const headers = [
      "Sale Number",
      "Date",
      "Branch",
      "Cashier",
      "Customer",
      "Payment Method",
      "Payment Status",
      "Subtotal",
      "Discount",
      "Total",
      "Sale Status",
    ];

    const rows = filteredSales.map((sale) => [
      sale.sale_number,
      formatDate(sale.created_at),
      sale.branch_name,
      sale.cashier_name,
      sale.customer_name,
      sale.payment_method,
      sale.payment_status,
      sale.subtotal,
      sale.discount,
      sale.total_amount,
      sale.status,
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
    link.download = `MyDuka_POS_Sales_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="md-pos-sales">
      <style>{`
        .md-pos-sales {
          width: 100%;
          min-width: 0;
          color: var(--text-primary, #172033);
          padding: 4px 0 30px;
        }

        .md-pos-sales * {
          box-sizing: border-box;
        }

        .md-pos-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 23px;
        }

        .md-pos-title {
          margin: 0;
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -0.7px;
        }

        .md-pos-subtitle {
          margin: 7px 0 0;
          color: var(--text-secondary, #64748b);
          font-size: 13px;
          line-height: 1.6;
        }

        .md-pos-actions {
          display: flex;
          gap: 9px;
        }

        .md-pos-btn {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 9px 14px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 9px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
        }

        .md-pos-btn:hover:not(:disabled) {
          border-color: var(--primary-color, #4f46e5);
          color: var(--primary-color, #4f46e5);
        }

        .md-pos-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .md-pos-btn-primary {
          background: var(--primary-color, #4f46e5);
          color: white;
          border-color: var(--primary-color, #4f46e5);
        }

        .md-pos-btn-primary:hover:not(:disabled) {
          background: var(--primary-hover, #4338ca);
          color: white;
        }

        .md-pos-preview {
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

        .md-pos-preview strong {
          display: block;
          margin-bottom: 3px;
        }

        .md-pos-preview p {
          margin: 0;
          color: #1d4ed8;
        }

        .md-pos-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .md-pos-stat {
          min-width: 0;
          padding: 17px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 13px;
        }

        .md-pos-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 17px;
        }

        .md-pos-stat-label {
          color: var(--text-secondary, #64748b);
          font-size: 12px;
          font-weight: 550;
        }

        .md-pos-stat-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: var(--hover-bg, #f1f5f9);
          color: var(--primary-color, #4f46e5);
        }

        .md-pos-stat-value {
          font-size: 21px;
          font-weight: 750;
          letter-spacing: -0.5px;
          overflow-wrap: anywhere;
        }

        .md-pos-stat-note {
          color: var(--text-secondary, #94a3b8);
          font-size: 11px;
          margin-top: 5px;
        }

        .md-pos-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 13px;
          flex-wrap: wrap;
        }

        .md-pos-search {
          position: relative;
          flex: 1;
          max-width: 420px;
          min-width: 220px;
        }

        .md-pos-search svg {
          position: absolute;
          top: 50%;
          left: 12px;
          transform: translateY(-50%);
          color: var(--text-secondary, #94a3b8);
        }

        .md-pos-input,
        .md-pos-select {
          width: 100%;
          min-height: 41px;
          padding: 9px 11px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 9px;
          background: var(--input-bg, var(--card-bg, #fff));
          color: var(--text-primary, #172033);
          outline: none;
          font-size: 12px;
        }

        .md-pos-search .md-pos-input {
          padding-left: 39px;
        }

        .md-pos-input:focus,
        .md-pos-select:focus {
          border-color: var(--primary-color, #4f46e5);
          box-shadow: 0 0 0 3px rgba(79,70,229,0.09);
        }

        .md-pos-filter-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .md-pos-filter-actions .md-pos-select {
          width: auto;
          min-width: 130px;
        }

        .md-pos-filter-panel {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          padding: 15px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 11px;
          background: var(--card-bg, #fff);
          margin-bottom: 14px;
        }

        .md-pos-filter-field label {
          display: block;
          margin-bottom: 6px;
          color: var(--text-secondary, #64748b);
          font-size: 11px;
          font-weight: 650;
        }

        .md-pos-table-card {
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 13px;
          overflow: hidden;
          background: var(--card-bg, #fff);
        }

        .md-pos-table-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 17px 18px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .md-pos-table-heading h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
        }

        .md-pos-table-heading span {
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }

        .md-pos-table-wrap {
          overflow-x: auto;
          width: 100%;
        }

        .md-pos-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
          text-align: left;
        }

        .md-pos-table th {
          padding: 12px 15px;
          background: var(--table-header-bg, var(--hover-bg, #f8fafc));
          color: var(--text-secondary, #64748b);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .5px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .md-pos-table td {
          padding: 14px 15px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          font-size: 12px;
          white-space: nowrap;
        }

        .md-pos-table tbody tr:hover {
          background: var(--hover-bg, #f8fafc);
        }

        .md-pos-sale-number {
          color: var(--primary-color, #4f46e5);
          font-weight: 700;
        }

        .md-pos-main-text {
          font-weight: 650;
        }

        .md-pos-muted {
          margin-top: 4px;
          color: var(--text-secondary, #64748b);
          font-size: 11px;
        }

        .md-pos-amount {
          font-weight: 700;
        }

        .md-pos-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          text-transform: capitalize;
          white-space: nowrap;
        }

        .md-pos-status-completed,
        .md-pos-status-paid {
          background: #dcfce7;
          color: #15803d;
        }

        .md-pos-status-pending,
        .md-pos-status-partially_paid {
          background: #fef3c7;
          color: #a16207;
        }

        .md-pos-status-voided,
        .md-pos-status-cancelled {
          background: #fee2e2;
          color: #b91c1c;
        }

        .md-pos-status-refunded {
          background: #f3e8ff;
          color: #7e22ce;
        }

        .md-pos-payment-cash {
          background: #dcfce7;
          color: #15803d;
        }

        .md-pos-payment-mpesa {
          background: #d1fae5;
          color: #047857;
        }

        .md-pos-payment-card,
        .md-pos-payment-bank {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .md-pos-icon-btn {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          background: transparent;
          color: var(--text-secondary, #64748b);
          cursor: pointer;
        }

        .md-pos-icon-btn:hover {
          color: var(--primary-color, #4f46e5);
          border-color: var(--primary-color, #4f46e5);
        }

        .md-pos-empty {
          padding: 55px 20px;
          text-align: center;
        }

        .md-pos-empty-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          border-radius: 15px;
          background: var(--hover-bg, #f1f5f9);
          color: var(--text-secondary, #64748b);
        }

        .md-pos-empty h3 {
          margin: 0 0 7px;
          font-size: 14px;
        }

        .md-pos-empty p {
          max-width: 370px;
          margin: 0 auto;
          color: var(--text-secondary, #64748b);
          font-size: 12px;
          line-height: 1.6;
        }

        .md-pos-pagination {
          display: flex;
          justify-content: space-between;
          padding: 13px 17px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          color: var(--text-secondary, #64748b);
          font-size: 11px;
        }

        .md-pos-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(15,23,42,.55);
        }

        .md-pos-modal {
          width: 100%;
          max-width: 610px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 15px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          box-shadow: 0 20px 60px rgba(0,0,0,.2);
        }

        .md-pos-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 19px 21px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .md-pos-modal-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .md-pos-modal-header p {
          margin: 5px 0 0;
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }

        .md-pos-modal-body {
          padding: 20px;
        }

        .md-pos-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .md-pos-detail-label {
          margin-bottom: 5px;
          color: var(--text-secondary, #64748b);
          font-size: 10px;
        }

        .md-pos-detail-value {
          font-size: 12px;
          font-weight: 650;
          overflow-wrap: anywhere;
        }

        .md-pos-modal-section {
          margin-top: 20px;
          padding-top: 17px;
          border-top: 1px solid var(--border-color, #e2e8f0);
        }

        .md-pos-modal-section h4 {
          margin: 0 0 12px;
          font-size: 12px;
        }

        .md-pos-line {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 8px 0;
          font-size: 12px;
        }

        .md-pos-line-total {
          margin-top: 7px;
          padding-top: 13px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          font-size: 14px;
          font-weight: 750;
        }

        @media (max-width: 1000px) {
          .md-pos-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .md-pos-header {
            flex-direction: column;
          }

          .md-pos-actions {
            width: 100%;
          }

          .md-pos-actions .md-pos-btn {
            flex: 1;
          }

          .md-pos-toolbar {
            align-items: stretch;
          }

          .md-pos-search {
            max-width: none;
            min-width: 100%;
          }

          .md-pos-filter-actions {
            width: 100%;
          }

          .md-pos-filter-actions .md-pos-select {
            flex: 1;
            min-width: 0;
          }

          .md-pos-filter-panel {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 380px) {
          .md-pos-stats {
            grid-template-columns: 1fr;
          }

          .md-pos-detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="md-pos-header">
        <div>
          <h1 className="md-pos-title">POS Sales</h1>
          <p className="md-pos-subtitle">
            Review cashier transactions, branch sales and payment records.
          </p>
        </div>

        <div className="md-pos-actions">
          <button
            type="button"
            className="md-pos-btn"
            onClick={clearFilters}
          >
            <Icon name="refresh" size={15} />
            Reset
          </button>

          <button
            type="button"
            className="md-pos-btn md-pos-btn-primary"
            onClick={exportCSV}
            disabled={!filteredSales.length}
          >
            <Icon name="download" size={15} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="md-pos-preview">
        <Icon name="receipt" size={19} />
        <div>
          <strong>Frontend preview mode</strong>
          <p>
            This page will display actual cashier POS transactions after
            backend integration. It currently contains no sample transactions
            and does not create or modify sales.
          </p>
        </div>
      </div>

      <div className="md-pos-stats">
        <div className="md-pos-stat">
          <div className="md-pos-stat-top">
            <span className="md-pos-stat-label">Transactions</span>
            <span className="md-pos-stat-icon">
              <Icon name="receipt" />
            </span>
          </div>
          <div className="md-pos-stat-value">
            {summary.transactions.toLocaleString("en-KE")}
          </div>
          <div className="md-pos-stat-note">Selected records</div>
        </div>

        <div className="md-pos-stat">
          <div className="md-pos-stat-top">
            <span className="md-pos-stat-label">Completed sales</span>
            <span className="md-pos-stat-icon">
              <Icon name="chart" />
            </span>
          </div>
          <div className="md-pos-stat-value">
            {summary.completed.toLocaleString("en-KE")}
          </div>
          <div className="md-pos-stat-note">Completed POS transactions</div>
        </div>

        <div className="md-pos-stat">
          <div className="md-pos-stat-top">
            <span className="md-pos-stat-label">POS revenue</span>
            <span className="md-pos-stat-icon">
              <Icon name="wallet" />
            </span>
          </div>
          <div className="md-pos-stat-value">
            {money(summary.revenue)}
          </div>
          <div className="md-pos-stat-note">Completed transaction value</div>
        </div>

        <div className="md-pos-stat">
          <div className="md-pos-stat-top">
            <span className="md-pos-stat-label">Active cashiers</span>
            <span className="md-pos-stat-icon">
              <Icon name="users" />
            </span>
          </div>
          <div className="md-pos-stat-value">
            {summary.cashiers.toLocaleString("en-KE")}
          </div>
          <div className="md-pos-stat-note">Cashiers in selected records</div>
        </div>
      </div>

      <div className="md-pos-toolbar">
        <div className="md-pos-search">
          <Icon name="search" size={17} />
          <input
            className="md-pos-input"
            placeholder="Search receipt, cashier, customer or branch..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="md-pos-filter-actions">
          <select
            className="md-pos-select"
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
            aria-label="Filter by branch"
          >
            <option value="all">All branches</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>

          <select
            className="md-pos-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by sale status"
          >
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="voided">Voided</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            className="md-pos-btn"
            type="button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Icon name="filter" size={15} />
            More filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="md-pos-filter-panel">
          <div className="md-pos-filter-field">
            <label htmlFor="pos-cashier">Cashier</label>
            <select
              id="pos-cashier"
              className="md-pos-select"
              value={cashierFilter}
              onChange={(event) => setCashierFilter(event.target.value)}
            >
              <option value="all">All cashiers</option>
              {cashiers.map((cashier) => (
                <option key={cashier} value={cashier}>
                  {cashier}
                </option>
              ))}
            </select>
          </div>

          <div className="md-pos-filter-field">
            <label htmlFor="pos-payment">Payment method</label>
            <select
              id="pos-payment"
              className="md-pos-select"
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
            >
              <option value="all">All methods</option>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
              <option value="bank">Bank</option>
            </select>
          </div>

          <div className="md-pos-filter-field">
            <label htmlFor="pos-date-from">From date</label>
            <input
              id="pos-date-from"
              className="md-pos-input"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>

          <div className="md-pos-filter-field">
            <label htmlFor="pos-date-to">To date</label>
            <input
              id="pos-date-to"
              className="md-pos-input"
              type="date"
              min={dateFrom || undefined}
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </div>
      )}

      <div className="md-pos-table-card">
        <div className="md-pos-table-heading">
          <h3>POS transaction records</h3>
          <span>
            {filteredSales.length}{" "}
            {filteredSales.length === 1 ? "transaction" : "transactions"}
          </span>
        </div>

        {filteredSales.length === 0 ? (
          <div className="md-pos-empty">
            <div className="md-pos-empty-icon">
              <Icon name="receipt" size={25} />
            </div>

            <h3>
              {sales.length === 0
                ? "No POS transactions yet"
                : "No matching transactions"}
            </h3>

            <p>
              {sales.length === 0
                ? "Cashier transactions will appear here when the POS module is connected to the backend."
                : "Try changing your filters or search terms."}
            </p>
          </div>
        ) : (
          <div className="md-pos-table-wrap">
            <table className="md-pos-table">
              <thead>
                <tr>
                  <th>Receipt number</th>
                  <th>Date</th>
                  <th>Branch</th>
                  <th>Cashier</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <span className="md-pos-sale-number">
                        {sale.sale_number || `POS-${sale.id}`}
                      </span>
                    </td>

                    <td>{formatDate(sale.created_at)}</td>

                    <td>{sale.branch_name || "—"}</td>

                    <td>
                      <span className="md-pos-main-text">
                        {sale.cashier_name || "—"}
                      </span>
                    </td>

                    <td>
                      {sale.customer_name || "Walk-in customer"}
                    </td>

                    <td>
                      <Badge value={sale.payment_method} type="payment" />
                    </td>

                    <td className="md-pos-amount">
                      {money(sale.total_amount)}
                    </td>

                    <td>
                      <Badge value={sale.status} />
                    </td>

                    <td>
                      <button
                        type="button"
                        className="md-pos-icon-btn"
                        title="View transaction"
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

        <div className="md-pos-pagination">
          <span>
            Showing {filteredSales.length} of {sales.length} transactions
          </span>
          <span>All records</span>
        </div>
      </div>

      {selectedSale && (
        <div
          className="md-pos-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedSale(null);
            }
          }}
        >
          <div
            className="md-pos-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-detail-title"
          >
            <div className="md-pos-modal-header">
              <div>
                <h3 id="pos-detail-title">POS transaction details</h3>
                <p>
                  {selectedSale.sale_number || `POS-${selectedSale.id}`}
                </p>
              </div>

              <button
                className="md-pos-icon-btn"
                type="button"
                onClick={() => setSelectedSale(null)}
                aria-label="Close transaction details"
              >
                <Icon name="close" size={17} />
              </button>
            </div>

            <div className="md-pos-modal-body">
              <div className="md-pos-detail-grid">
                <div>
                  <div className="md-pos-detail-label">Date</div>
                  <div className="md-pos-detail-value">
                    {formatDate(selectedSale.created_at)}
                  </div>
                </div>

                <div>
                  <div className="md-pos-detail-label">Branch</div>
                  <div className="md-pos-detail-value">
                    {selectedSale.branch_name || "—"}
                  </div>
                </div>

                <div>
                  <div className="md-pos-detail-label">Cashier</div>
                  <div className="md-pos-detail-value">
                    {selectedSale.cashier_name || "—"}
                  </div>
                </div>

                <div>
                  <div className="md-pos-detail-label">Customer</div>
                  <div className="md-pos-detail-value">
                    {selectedSale.customer_name || "Walk-in customer"}
                  </div>
                </div>

                <div>
                  <div className="md-pos-detail-label">Payment method</div>
                  <div className="md-pos-detail-value">
                    <Badge
                      value={selectedSale.payment_method}
                      type="payment"
                    />
                  </div>
                </div>

                <div>
                  <div className="md-pos-detail-label">Payment status</div>
                  <div className="md-pos-detail-value">
                    <Badge value={selectedSale.payment_status} />
                  </div>
                </div>

                <div>
                  <div className="md-pos-detail-label">Sale status</div>
                  <div className="md-pos-detail-value">
                    <Badge value={selectedSale.status} />
                  </div>
                </div>

                <div>
                  <div className="md-pos-detail-label">Reference</div>
                  <div className="md-pos-detail-value">
                    {selectedSale.payment_reference || "—"}
                  </div>
                </div>
              </div>

              {Array.isArray(selectedSale.items) &&
                selectedSale.items.length > 0 && (
                  <div className="md-pos-modal-section">
                    <h4>Items sold</h4>

                    {selectedSale.items.map((item, index) => (
                      <div className="md-pos-line" key={item.id || index}>
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

              <div className="md-pos-modal-section">
                <h4>Payment summary</h4>

                <div className="md-pos-line">
                  <span>Subtotal</span>
                  <span>{money(selectedSale.subtotal)}</span>
                </div>

                <div className="md-pos-line">
                  <span>Discount</span>
                  <span>{money(selectedSale.discount)}</span>
                </div>

                <div className="md-pos-line">
                  <span>Tax</span>
                  <span>{money(selectedSale.tax)}</span>
                </div>

                <div className="md-pos-line md-pos-line-total">
                  <span>Total</span>
                  <span>{money(selectedSale.total_amount)}</span>
                </div>

                <div className="md-pos-line">
                  <span>Amount paid</span>
                  <span>{money(selectedSale.amount_paid)}</span>
                </div>

                <div className="md-pos-line">
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

              {selectedSale.notes && (
                <div className="md-pos-modal-section">
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
