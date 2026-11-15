import React, { useMemo, useState } from "react";

const money = (value) =>
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const qty = (value) =>
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

const transactionTypes = [
  { value: "all", label: "All transactions" },
  { value: "stock_in", label: "Stock received" },
  { value: "sale", label: "Sales" },
  { value: "return", label: "Returns" },
  { value: "transfer_in", label: "Transfer received" },
  { value: "transfer_out", label: "Transfer sent" },
  { value: "adjustment_in", label: "Stock increase" },
  { value: "adjustment_out", label: "Stock decrease" },
  { value: "damaged", label: "Damaged stock" },
  { value: "expired", label: "Expired stock" },
];

const typeDetails = {
  stock_in: {
    label: "Stock received",
    color: "blue",
    direction: "in",
  },
  sale: {
    label: "Sale",
    color: "red",
    direction: "out",
  },
  return: {
    label: "Customer return",
    color: "green",
    direction: "in",
  },
  transfer_in: {
    label: "Transfer received",
    color: "green",
    direction: "in",
  },
  transfer_out: {
    label: "Transfer sent",
    color: "orange",
    direction: "out",
  },
  adjustment_in: {
    label: "Stock increase",
    color: "green",
    direction: "in",
  },
  adjustment_out: {
    label: "Stock decrease",
    color: "orange",
    direction: "out",
  },
  damaged: {
    label: "Damaged stock",
    color: "red",
    direction: "out",
  },
  expired: {
    label: "Expired stock",
    color: "red",
    direction: "out",
  },
};

export default function StockHistory() {
  const [transactions] = useState([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const branches = useMemo(
    () =>
      [...new Set(transactions.map((item) => item.branch).filter(Boolean))],
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const term = search.trim().toLowerCase();

    return transactions
      .filter((item) => {
        const matchesSearch =
          !term ||
          [
            item.product,
            item.branch,
            item.reference,
            item.recordedBy,
            item.reason,
            item.notes,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(term));

        const matchesType =
          typeFilter === "all" || item.type === typeFilter;

        const matchesBranch =
          branchFilter === "all" || item.branch === branchFilter;

        const transactionDate = item.createdAt
          ? new Date(item.createdAt).toISOString().slice(0, 10)
          : "";

        const matchesStart =
          !startDate || transactionDate >= startDate;

        const matchesEnd =
          !endDate || transactionDate <= endDate;

        return (
          matchesSearch &&
          matchesType &&
          matchesBranch &&
          matchesStart &&
          matchesEnd
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  }, [
    transactions,
    search,
    typeFilter,
    branchFilter,
    startDate,
    endDate,
  ]);

  const summary = useMemo(() => {
    const stockIn = transactions
      .filter((item) => typeDetails[item.type]?.direction === "in")
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    const stockOut = transactions
      .filter((item) => typeDetails[item.type]?.direction === "out")
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    const receiptCount = transactions.filter(
      (item) => item.type === "stock_in"
    ).length;

    const adjustmentCount = transactions.filter((item) =>
      ["adjustment_in", "adjustment_out"].includes(item.type)
    ).length;

    return {
      total: transactions.length,
      stockIn,
      stockOut,
      receiptCount,
      adjustmentCount,
    };
  }, [transactions]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setBranchFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const exportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      "Transaction ID",
      "Date and Time",
      "Product",
      "Branch",
      "Transaction Type",
      "Previous Quantity",
      "Quantity Changed",
      "New Quantity",
      "Buying Price",
      "Selling Price",
      "Reference",
      "Reason",
      "Recorded By",
      "Notes",
    ];

    const rows = filteredTransactions.map((item) => [
      item.id,
      formatDateTime(item.createdAt),
      item.product,
      item.branch,
      typeDetails[item.type]?.label || item.type,
      item.previousQuantity,
      item.quantity,
      item.newQuantity,
      item.buyingPrice ?? "",
      item.sellingPrice ?? "",
      item.reference || "",
      item.reason || "",
      item.recordedBy || "",
      item.notes || "",
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

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
    link.download = `MyDuka_Stock_History_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const getMovement = (item) => {
    const direction = typeDetails[item.type]?.direction;

    if (direction === "in") return `+${qty(item.quantity)}`;
    if (direction === "out") return `-${qty(item.quantity)}`;

    return qty(item.quantity);
  };

  return (
    <div className="md-stock-history">
      <style>{`
        .md-stock-history {
          --sh-primary: var(--primary, #2563eb);
          --sh-text: var(--text-primary, #172033);
          --sh-muted: var(--text-secondary, #64748b);
          --sh-border: var(--border-color, #e2e8f0);
          --sh-card: var(--card-bg, #ffffff);
          --sh-bg: var(--background, #f8fafc);
          color: var(--sh-text);
          width: 100%;
          min-width: 0;
          padding: 4px 0 35px;
        }

        .md-stock-history * {
          box-sizing: border-box;
        }

        .md-stock-history button,
        .md-stock-history input,
        .md-stock-history select {
          font: inherit;
        }

        .sh-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 22px;
        }

        .sh-title {
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -0.7px;
          margin: 0 0 6px;
        }

        .sh-subtitle {
          color: var(--sh-muted);
          font-size: 13px;
          line-height: 1.6;
          margin: 0;
        }

        .sh-button {
          border: 1px solid var(--sh-border);
          background: var(--sh-card);
          color: var(--sh-text);
          padding: 10px 14px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 650;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
        }

        .sh-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .sh-button-primary {
          background: var(--sh-primary);
          border-color: var(--sh-primary);
          color: white;
        }

        .sh-preview {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding: 13px 15px;
          border-radius: 10px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1e40af;
          font-size: 12px;
          line-height: 1.6;
          margin-bottom: 21px;
        }

        .sh-preview strong {
          display: block;
          margin-bottom: 2px;
        }

        .sh-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .sh-stat {
          background: var(--sh-card);
          border: 1px solid var(--sh-border);
          border-radius: 12px;
          padding: 17px;
          min-width: 0;
        }

        .sh-stat-label {
          font-size: 12px;
          color: var(--sh-muted);
          margin-bottom: 10px;
        }

        .sh-stat-value {
          font-size: 23px;
          font-weight: 750;
          letter-spacing: -0.5px;
          overflow-wrap: anywhere;
        }

        .sh-stat-note {
          font-size: 11px;
          color: var(--sh-muted);
          margin-top: 6px;
        }

        .sh-panel {
          background: var(--sh-card);
          border: 1px solid var(--sh-border);
          border-radius: 12px;
          overflow: hidden;
        }

        .sh-panel-heading {
          padding: 17px 18px;
          border-bottom: 1px solid var(--sh-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .sh-panel-heading h3 {
          font-size: 14px;
          font-weight: 750;
          margin: 0 0 4px;
        }

        .sh-panel-heading p {
          font-size: 11px;
          color: var(--sh-muted);
          margin: 0;
        }

        .sh-filters {
          display: grid;
          grid-template-columns: minmax(200px, 1.5fr) repeat(4, minmax(125px, 1fr));
          gap: 9px;
          padding: 14px 17px;
          border-bottom: 1px solid var(--sh-border);
        }

        .sh-input,
        .sh-select {
          width: 100%;
          min-width: 0;
          padding: 10px 11px;
          background: var(--sh-card);
          color: var(--sh-text);
          border: 1px solid var(--sh-border);
          border-radius: 8px;
          outline: none;
          font-size: 12px;
        }

        .sh-input:focus,
        .sh-select:focus {
          border-color: var(--sh-primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.09);
        }

        .sh-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .sh-table {
          width: 100%;
          min-width: 1050px;
          border-collapse: collapse;
          text-align: left;
        }

        .sh-table th {
          background: var(--sh-bg);
          color: var(--sh-muted);
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          padding: 12px 14px;
          white-space: nowrap;
        }

        .sh-table td {
          border-top: 1px solid var(--sh-border);
          padding: 13px 14px;
          font-size: 12px;
          white-space: nowrap;
        }

        .sh-table tbody tr:hover {
          background: var(--sh-bg);
        }

        .sh-product {
          font-weight: 700;
        }

        .sh-muted {
          color: var(--sh-muted);
          font-size: 11px;
          margin-top: 4px;
        }

        .sh-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 750;
        }

        .sh-blue {
          color: #1e40af;
          background: #dbeafe;
        }

        .sh-green {
          color: #166534;
          background: #dcfce7;
        }

        .sh-red {
          color: #991b1b;
          background: #fee2e2;
        }

        .sh-orange {
          color: #9a3412;
          background: #ffedd5;
        }

        .sh-in {
          color: #15803d;
          font-weight: 750;
        }

        .sh-out {
          color: #dc2626;
          font-weight: 750;
        }

        .sh-detail-button {
          border: none;
          padding: 0;
          background: transparent;
          color: var(--sh-primary);
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
        }

        .sh-empty {
          text-align: center;
          padding: 55px 20px;
        }

        .sh-empty-icon {
          width: 54px;
          height: 54px;
          border-radius: 15px;
          background: var(--sh-bg);
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          font-size: 24px;
        }

        .sh-empty h3 {
          font-size: 14px;
          margin: 0 0 7px;
        }

        .sh-empty p {
          color: var(--sh-muted);
          font-size: 12px;
          line-height: 1.7;
          max-width: 440px;
          margin: 0 auto;
        }

        .sh-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          overflow-y: auto;
        }

        .sh-modal {
          width: 100%;
          max-width: 650px;
          max-height: calc(100vh - 36px);
          overflow-y: auto;
          border-radius: 14px;
          border: 1px solid var(--sh-border);
          background: var(--sh-card);
          color: var(--sh-text);
          box-shadow: 0 20px 60px rgba(0,0,0,.2);
        }

        .sh-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          padding: 18px 20px;
          border-bottom: 1px solid var(--sh-border);
        }

        .sh-modal-header h2 {
          font-size: 17px;
          margin: 0 0 5px;
        }

        .sh-modal-header p {
          color: var(--sh-muted);
          font-size: 11px;
          line-height: 1.6;
          margin: 0;
        }

        .sh-close {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          background: var(--sh-bg);
          color: var(--sh-text);
          font-size: 19px;
          cursor: pointer;
        }

        .sh-modal-body {
          padding: 20px;
        }

        .sh-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .sh-detail {
          background: var(--sh-bg);
          border-radius: 9px;
          padding: 12px;
          min-width: 0;
        }

        .sh-detail.full {
          grid-column: 1 / -1;
        }

        .sh-detail-label {
          font-size: 10px;
          color: var(--sh-muted);
          margin-bottom: 6px;
        }

        .sh-detail-value {
          font-size: 13px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .sh-modal-footer {
          padding: 14px 20px;
          border-top: 1px solid var(--sh-border);
          display: flex;
          justify-content: flex-end;
        }

        @media (max-width: 1050px) {
          .sh-filters {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 850px) {
          .sh-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .sh-header {
            flex-direction: column;
          }

          .sh-header .sh-button {
            width: 100%;
          }

          .sh-title {
            font-size: 22px;
          }

          .sh-stats {
            gap: 9px;
          }

          .sh-stat {
            padding: 13px;
          }

          .sh-stat-value {
            font-size: 19px;
          }

          .sh-filters {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .sh-search {
            grid-column: 1 / -1;
          }

          .sh-panel-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .sh-detail-grid {
            grid-template-columns: 1fr;
          }

          .sh-detail.full {
            grid-column: auto;
          }

          .sh-modal-backdrop {
            padding: 9px;
          }

          .sh-modal {
            max-height: calc(100vh - 18px);
          }
        }
      `}</style>

      <div className="sh-header">
        <div>
          <h1 className="sh-title">Stock History</h1>
          <p className="sh-subtitle">
            Review every stock movement across your business and branches.
          </p>
        </div>

        <button
          className="sh-button sh-button-primary"
          onClick={exportCSV}
          disabled={filteredTransactions.length === 0}
        >
          ↓ Export CSV
        </button>
      </div>

      <div className="sh-preview">
        <span>ⓘ</span>
        <div>
          <strong>Audit history preview</strong>
          This page is currently a frontend preview and contains no seeded
          transactions. Once backend integration is complete, it will read
          actual stock movements recorded by Inventory, POS sales, returns,
          transfers and other stock operations.
        </div>
      </div>

      <div className="sh-stats">
        <div className="sh-stat">
          <div className="sh-stat-label">Total transactions</div>
          <div className="sh-stat-value">{summary.total}</div>
          <div className="sh-stat-note">Recorded stock movements</div>
        </div>

        <div className="sh-stat">
          <div className="sh-stat-label">Stock received / added</div>
          <div className="sh-stat-value">{qty(summary.stockIn)}</div>
          <div className="sh-stat-note">Total incoming quantity</div>
        </div>

        <div className="sh-stat">
          <div className="sh-stat-label">Stock deducted</div>
          <div className="sh-stat-value">{qty(summary.stockOut)}</div>
          <div className="sh-stat-note">Total outgoing quantity</div>
        </div>

        <div className="sh-stat">
          <div className="sh-stat-label">Adjustments</div>
          <div className="sh-stat-value">{summary.adjustmentCount}</div>
          <div className="sh-stat-note">
            {summary.receiptCount} stock receipts
          </div>
        </div>
      </div>

      <div className="sh-panel">
        <div className="sh-panel-heading">
          <div>
            <h3>Stock movement ledger</h3>
            <p>
              A record of stock quantities before and after every transaction.
            </p>
          </div>
        </div>

        <div className="sh-filters">
          <input
            className="sh-input sh-search"
            placeholder="Search product, reference or user..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="sh-select"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            {transactionTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            className="sh-select"
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

          <input
            className="sh-input"
            type="date"
            aria-label="Start date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />

          <input
            className="sh-input"
            type="date"
            aria-label="End date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>

        {(search || typeFilter !== "all" || branchFilter !== "all" ||
          startDate || endDate) && (
          <div style={{ padding: "10px 17px" }}>
            <button className="sh-detail-button" onClick={clearFilters}>
              Clear all filters
            </button>
          </div>
        )}

        {filteredTransactions.length === 0 ? (
          <div className="sh-empty">
            <div className="sh-empty-icon">◷</div>

            <h3>
              {transactions.length === 0
                ? "No stock movements recorded yet"
                : "No matching transactions"}
            </h3>

            <p>
              {transactions.length === 0
                ? "When stock is received, sold, returned, transferred or adjusted, the resulting movement will be recorded here. Each entry will preserve the previous quantity, quantity changed and new quantity."
                : "Try changing your search terms, transaction type, branch or date range."}
            </p>
          </div>
        ) : (
          <div className="sh-table-wrap">
            <table className="sh-table">
              <thead>
                <tr>
                  <th>Date / time</th>
                  <th>Product</th>
                  <th>Branch</th>
                  <th>Transaction</th>
                  <th>Previous stock</th>
                  <th>Change</th>
                  <th>New stock</th>
                  <th>Reference</th>
                  <th>Recorded by</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((item) => {
                  const type = typeDetails[item.type] || {
                    label: item.type,
                    color: "blue",
                    direction: "",
                  };

                  return (
                    <tr key={item.id}>
                      <td>{formatDateTime(item.createdAt)}</td>

                      <td>
                        <div className="sh-product">{item.product}</div>
                        <div className="sh-muted">{item.id}</div>
                      </td>

                      <td>{item.branch}</td>

                      <td>
                        <span className={`sh-badge sh-${type.color}`}>
                          {type.label}
                        </span>
                      </td>

                      <td>{qty(item.previousQuantity)}</td>

                      <td
                        className={
                          type.direction === "in" ? "sh-in" : "sh-out"
                        }
                      >
                        {getMovement(item)}
                      </td>

                      <td>{qty(item.newQuantity)}</td>

                      <td>{item.reference || "—"}</td>

                      <td>{item.recordedBy || "—"}</td>

                      <td>
                        <button
                          className="sh-detail-button"
                          onClick={() => setSelectedTransaction(item)}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTransaction && (
        <div
          className="sh-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedTransaction(null);
            }
          }}
        >
          <div className="sh-modal">
            <div className="sh-modal-header">
              <div>
                <h2>Transaction details</h2>
                <p>
                  Complete audit record for this stock movement.
                </p>
              </div>

              <button
                className="sh-close"
                onClick={() => setSelectedTransaction(null)}
              >
                ×
              </button>
            </div>

            <div className="sh-modal-body">
              <div className="sh-detail-grid">
                <div className="sh-detail">
                  <div className="sh-detail-label">Transaction ID</div>
                  <div className="sh-detail-value">
                    {selectedTransaction.id}
                  </div>
                </div>

                <div className="sh-detail">
                  <div className="sh-detail-label">Transaction type</div>
                  <div className="sh-detail-value">
                    {typeDetails[selectedTransaction.type]?.label ||
                      selectedTransaction.type}
                  </div>
                </div>

                <div className="sh-detail">
                  <div className="sh-detail-label">Product</div>
                  <div className="sh-detail-value">
                    {selectedTransaction.product}
                  </div>
                </div>

                <div className="sh-detail">
                  <div className="sh-detail-label">Branch</div>
                  <div className="sh-detail-value">
                    {selectedTransaction.branch}
                  </div>
                </div>

                <div className="sh-detail">
                  <div className="sh-detail-label">Previous quantity</div>
                  <div className="sh-detail-value">
                    {qty(selectedTransaction.previousQuantity)}
                  </div>
                </div>

                <div className="sh-detail">
                  <div className="sh-detail-label">Quantity changed</div>
                  <div className="sh-detail-value">
                    {getMovement(selectedTransaction)}
                  </div>
                </div>

                <div className="sh-detail">
                  <div className="sh-detail-label">New quantity</div>
                  <div className="sh-detail-value">
                    {qty(selectedTransaction.newQuantity)}
                  </div>
                </div>

                <div className="sh-detail">
                  <div className="sh-detail-label">Date and time</div>
                  <div className="sh-detail-value">
                    {formatDateTime(selectedTransaction.createdAt)}
                  </div>
                </div>

                <div className="sh-detail">
                  <div className="sh-detail-label">Buying price</div>
                  <div className="sh-detail-value">
                    {selectedTransaction.buyingPrice != null
                      ? `KSh ${money(selectedTransaction.buyingPrice)}`
                      : "—"}
                  </div>
                </div>

                <div className="sh-detail">
                  <div className="sh-detail-label">Selling price</div>
                  <div className="sh-detail-value">
                    {selectedTransaction.sellingPrice != null
                      ? `KSh ${money(selectedTransaction.sellingPrice)}`
                      : "—"}
                  </div>
                </div>

                <div className="sh-detail">
                  <div className="sh-detail-label">Reference</div>
                  <div className="sh-detail-value">
                    {selectedTransaction.reference || "—"}
                  </div>
                </div>

                <div className="sh-detail">
                  <div className="sh-detail-label">Recorded by</div>
                  <div className="sh-detail-value">
                    {selectedTransaction.recordedBy || "—"}
                  </div>
                </div>

                <div className="sh-detail full">
                  <div className="sh-detail-label">Reason</div>
                  <div className="sh-detail-value">
                    {selectedTransaction.reason || "—"}
                  </div>
                </div>

                <div className="sh-detail full">
                  <div className="sh-detail-label">Notes</div>
                  <div className="sh-detail-value">
                    {selectedTransaction.notes || "No additional notes."}
                  </div>
                </div>
              </div>
            </div>

            <div className="sh-modal-footer">
              <button
                className="sh-button"
                onClick={() => setSelectedTransaction(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
