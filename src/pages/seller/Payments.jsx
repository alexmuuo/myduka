import React, { useMemo, useState } from "react";

const INITIAL_TRANSACTIONS = [];

const INITIAL_METHODS = [
  {
    id: "cash",
    name: "Cash",
    description: "Accept cash payments at your business locations.",
    enabled: true,
    details: "",
  },
  {
    id: "mpesa",
    name: "M-Pesa",
    description: "Accept mobile money payments through M-Pesa.",
    enabled: false,
    details: "",
  },
  {
    id: "card",
    name: "Card Payments",
    description: "Accept debit and credit card payments.",
    enabled: false,
    details: "",
  },
  {
    id: "bank",
    name: "Bank Transfer",
    description: "Accept direct payments to your business bank account.",
    enabled: false,
    details: "",
  },
  {
    id: "other",
    name: "Other",
    description: "Record payments received through other methods.",
    enabled: false,
    details: "",
  },
];

const STATUS_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const EMPTY_METHOD = {
  id: "",
  name: "",
  description: "",
  enabled: true,
  details: "",
};

const styles = `
.md-payments {
  max-width: 1500px;
  margin: 0 auto;
  padding: 24px;
  color: var(--text-primary, #172033);
}
.md-payments * { box-sizing: border-box; }
.md-payments button,
.md-payments input,
.md-payments select,
.md-payments textarea { font: inherit; }
.md-payments button { cursor: pointer; }

.md-payments .mp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
.md-payments h1 {
  margin: 0 0 7px;
  font-size: 26px;
  font-weight: 750;
}
.md-payments .mp-subtitle {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 14px;
}
.md-payments .mp-preview {
  padding: 12px 15px;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #eff6ff;
  color: #1e40af;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 20px;
}
.md-payments .mp-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 9px;
  background: var(--card-bg, #fff);
  color: var(--text-primary, #172033);
  font-weight: 650;
}
.md-payments .mp-primary {
  background: var(--primary-color, #2563eb);
  border-color: var(--primary-color, #2563eb);
  color: white;
}
.md-payments .mp-danger { color: #dc2626; }
.md-payments .mp-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.md-payments .mp-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}
.md-payments .mp-stat {
  padding: 17px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  background: var(--card-bg, #fff);
  min-width: 0;
}
.md-payments .mp-stat-label {
  color: var(--text-secondary, #64748b);
  font-size: 13px;
}
.md-payments .mp-stat-value {
  margin-top: 8px;
  font-size: 23px;
  font-weight: 750;
  overflow-wrap: anywhere;
}
.md-payments .mp-stat-note {
  margin-top: 5px;
  color: var(--text-secondary, #64748b);
  font-size: 11px;
}

.md-payments .mp-tabs {
  display: flex;
  gap: 7px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  margin-bottom: 20px;
  overflow-x: auto;
}
.md-payments .mp-tab {
  border: 0;
  border-bottom: 2px solid transparent;
  padding: 12px 16px;
  background: transparent;
  color: var(--text-secondary, #64748b);
  white-space: nowrap;
  font-weight: 650;
}
.md-payments .mp-tab.active {
  color: var(--primary-color, #2563eb);
  border-bottom-color: var(--primary-color, #2563eb);
}

.md-payments .mp-toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.md-payments .mp-input,
.md-payments .mp-select,
.md-payments .mp-textarea {
  width: 100%;
  min-width: 0;
  padding: 10px 11px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  outline: none;
  background: var(--input-bg, var(--card-bg, #fff));
  color: var(--text-primary, #172033);
}
.md-payments .mp-input:focus,
.md-payments .mp-select:focus,
.md-payments .mp-textarea:focus {
  border-color: var(--primary-color, #2563eb);
}
.md-payments .mp-search { flex: 1 1 260px; }
.md-payments .mp-filter { flex: 0 1 180px; }

.md-payments .mp-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  background: var(--card-bg, #fff);
}
.md-payments table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
}
.md-payments th,
.md-payments td {
  padding: 14px 15px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  text-align: left;
  font-size: 13px;
}
.md-payments th {
  background: var(--surface-bg, #f8fafc);
  color: var(--text-secondary, #64748b);
  font-weight: 650;
  white-space: nowrap;
}
.md-payments tr:last-child td { border-bottom: 0; }
.md-payments .mp-reference { font-weight: 700; }
.md-payments .mp-muted {
  margin-top: 3px;
  color: var(--text-secondary, #64748b);
  font-size: 11px;
}
.md-payments .mp-amount { font-weight: 750; white-space: nowrap; }

.md-payments .mp-badge {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.md-payments .mp-completed { background: #dcfce7; color: #166534; }
.md-payments .mp-pending { background: #fef3c7; color: #92400e; }
.md-payments .mp-failed { background: #fee2e2; color: #991b1b; }
.md-payments .mp-refunded { background: #e0e7ff; color: #3730a3; }

.md-payments .mp-empty {
  padding: 55px 20px;
  text-align: center;
}
.md-payments .mp-empty-icon { font-size: 36px; margin-bottom: 10px; }
.md-payments .mp-empty h3 { margin: 0 0 7px; font-size: 17px; }
.md-payments .mp-empty p {
  max-width: 430px;
  margin: 0 auto 17px;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
  line-height: 1.5;
}

.md-payments .mp-method-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
}
.md-payments .mp-method-card {
  padding: 19px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  background: var(--card-bg, #fff);
}
.md-payments .mp-method-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.md-payments .mp-method-icon {
  display: grid;
  place-items: center;
  width: 43px;
  height: 43px;
  border-radius: 11px;
  background: var(--surface-bg, #eff6ff);
  font-size: 21px;
}
.md-payments .mp-method-card h3 {
  margin: 14px 0 5px;
  font-size: 16px;
}
.md-payments .mp-method-card p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.5;
}
.md-payments .mp-method-details {
  margin-top: 15px;
  padding: 11px;
  border-radius: 8px;
  background: var(--surface-bg, #f8fafc);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.md-payments .mp-method-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 15px;
}
.md-payments .mp-switch {
  position: relative;
  display: inline-block;
  width: 43px;
  height: 24px;
  flex-shrink: 0;
}
.md-payments .mp-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.md-payments .mp-slider {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: #cbd5e1;
  transition: .2s;
}
.md-payments .mp-slider::before {
  content: "";
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  border-radius: 50%;
  background: white;
  transition: .2s;
}
.md-payments .mp-switch input:checked + .mp-slider {
  background: #16a34a;
}
.md-payments .mp-switch input:checked + .mp-slider::before {
  transform: translateX(19px);
}

.md-payments .mp-modal-backdrop {
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
.md-payments .mp-modal {
  width: 100%;
  max-width: 570px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 22px;
  border-radius: 14px;
  background: var(--card-bg, #fff);
  color: var(--text-primary, #172033);
  box-shadow: 0 20px 60px rgba(0,0,0,.2);
}
.md-payments .mp-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.md-payments .mp-modal-header h2 { margin: 0; font-size: 19px; }
.md-payments .mp-close {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 25px;
}
.md-payments .mp-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.md-payments .mp-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.md-payments .mp-field label {
  font-size: 12px;
  font-weight: 700;
}
.md-payments .mp-field small {
  color: var(--text-secondary, #64748b);
  font-size: 11px;
}
.md-payments .mp-full { grid-column: 1 / -1; }
.md-payments .mp-modal-footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 22px;
}
.md-payments .mp-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
.md-payments .mp-detail-label {
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  margin-bottom: 5px;
}
.md-payments .mp-detail-value {
  font-size: 14px;
  font-weight: 650;
  overflow-wrap: anywhere;
}
.md-payments .mp-notice {
  margin-top: 16px;
  padding: 11px;
  border-radius: 8px;
  background: var(--surface-bg, #f8fafc);
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .md-payments .mp-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 650px) {
  .md-payments { padding: 16px; }
  .md-payments h1 { font-size: 22px; }
  .md-payments .mp-method-grid { grid-template-columns: 1fr; }
  .md-payments .mp-form-grid,
  .md-payments .mp-detail-grid { grid-template-columns: 1fr; }
  .md-payments .mp-full { grid-column: auto; }
  .md-payments .mp-modal { padding: 17px; }
}
`;

function money(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label || status;
}

function methodLabel(method) {
  const labels = {
    cash: "Cash",
    mpesa: "M-Pesa",
    card: "Card",
    bank: "Bank Transfer",
    other: "Other",
  };

  return labels[method] || method || "—";
}

function downloadCSV(transactions) {
  const headers = [
    "Reference",
    "Date",
    "Customer",
    "Source",
    "Payment Method",
    "Transaction Reference",
    "Amount",
    "Status",
  ];

  const rows = transactions.map((item) => [
    item.reference,
    formatDate(item.date),
    item.customer,
    item.source,
    methodLabel(item.method),
    item.transactionReference,
    item.amount,
    statusLabel(item.status),
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
  link.download = "myduka-payment-transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Payments() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [methods, setMethods] = useState(INITIAL_METHODS);
  const [activeTab, setActiveTab] = useState("transactions");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const [modal, setModal] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [methodForm, setMethodForm] = useState(EMPTY_METHOD);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const completed = transactions.filter(
      (item) => item.status === "completed"
    );

    const pending = transactions.filter(
      (item) => item.status === "pending"
    );

    const refunded = transactions.filter(
      (item) => item.status === "refunded"
    );

    return {
      received: completed.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
      pending: pending.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
      refunded: refunded.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
      count: transactions.length,
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const term = search.trim().toLowerCase();

    return transactions.filter((item) => {
      const matchesSearch = !term || [
        item.reference,
        item.customer,
        item.transactionReference,
        methodLabel(item.method),
        item.source,
      ].some((value) => String(value || "").toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const matchesMethod =
        methodFilter === "all" || item.method === methodFilter;

      const matchesSource =
        sourceFilter === "all" || item.source === sourceFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod &&
        matchesSource
      );
    });
  }, [transactions, search, statusFilter, methodFilter, sourceFilter]);

  function updateMethod(field, value) {
    setMethodForm((current) => ({ ...current, [field]: value }));
  }

  function openEditMethod(method) {
    setSelectedMethod(method);
    setMethodForm({ ...method });
    setError("");
    setModal("method");
  }

  function saveMethod(event) {
    event.preventDefault();
    setError("");

    const name = methodForm.name.trim();

    if (!name) {
      setError("Enter a payment method name.");
      return;
    }

    if (selectedMethod) {
      setMethods((current) =>
        current.map((item) =>
          item.id === selectedMethod.id
            ? { ...item, ...methodForm, name }
            : item
        )
      );
    }

    setModal(null);
  }

  function toggleMethod(methodId) {
    setMethods((current) =>
      current.map((method) =>
        method.id === methodId
          ? { ...method, enabled: !method.enabled }
          : method
      )
    );
  }

  function changeTransactionStatus(transaction, status) {
    if (
      status === "refunded" &&
      transaction.status !== "completed"
    ) {
      window.alert("Only completed payments can be marked as refunded.");
      return;
    }

    setTransactions((current) =>
      current.map((item) =>
        item.id === transaction.id
          ? { ...item, status, updatedAt: new Date().toISOString() }
          : item
      )
    );

    setSelectedTransaction((current) =>
      current?.id === transaction.id
        ? { ...current, status }
        : current
    );
  }

  return (
    <div className="md-payments">
      <style>{styles}</style>

      <div className="mp-header">
        <div>
          <h1>Payments</h1>
          <p className="mp-subtitle">
            Manage payment transactions and the payment methods your business accepts.
          </p>
        </div>
      </div>

      <div className="mp-preview">
        <strong>Frontend preview:</strong> Payment transactions will eventually
        come from online orders and POS sales. No real payments are processed
        or recorded here yet. Payment method settings are temporary and will
        not be saved after refreshing this page.
      </div>

      <div className="mp-stats">
        <div className="mp-stat">
          <div className="mp-stat-label">Payments received</div>
          <div className="mp-stat-value">{money(stats.received)}</div>
          <div className="mp-stat-note">Completed transactions</div>
        </div>

        <div className="mp-stat">
          <div className="mp-stat-label">Pending payments</div>
          <div className="mp-stat-value">{money(stats.pending)}</div>
          <div className="mp-stat-note">Awaiting confirmation</div>
        </div>

        <div className="mp-stat">
          <div className="mp-stat-label">Refunded payments</div>
          <div className="mp-stat-value">{money(stats.refunded)}</div>
          <div className="mp-stat-note">Marked as refunded</div>
        </div>

        <div className="mp-stat">
          <div className="mp-stat-label">Total transactions</div>
          <div className="mp-stat-value">{stats.count}</div>
          <div className="mp-stat-note">All payment statuses</div>
        </div>
      </div>

      <div className="mp-tabs">
        <button
          className={`mp-tab ${activeTab === "transactions" ? "active" : ""}`}
          onClick={() => setActiveTab("transactions")}
        >
          Transactions
        </button>

        <button
          className={`mp-tab ${activeTab === "methods" ? "active" : ""}`}
          onClick={() => setActiveTab("methods")}
        >
          Payment Methods
        </button>
      </div>

      {activeTab === "transactions" && (
        <>
          <div className="mp-toolbar">
            <input
              className="mp-input mp-search"
              placeholder="Search reference, customer or transaction..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="mp-select mp-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              className="mp-select mp-filter"
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
            >
              <option value="all">All methods</option>
              {methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>

            <select
              className="mp-select mp-filter"
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
            >
              <option value="all">All sources</option>
              <option value="Online Order">Online Orders</option>
              <option value="POS Sale">POS Sales</option>
              <option value="Manual">Manual Records</option>
            </select>

            <button
              className="mp-btn"
              onClick={() => downloadCSV(filteredTransactions)}
              disabled={!filteredTransactions.length}
            >
              ↓ Export CSV
            </button>
          </div>

          <div className="mp-table-wrap">
            {filteredTransactions.length === 0 ? (
              <div className="mp-empty">
                <div className="mp-empty-icon">💳</div>
                <h3>
                  {transactions.length === 0
                    ? "No payment transactions yet"
                    : "No matching transactions"}
                </h3>
                <p>
                  {transactions.length === 0
                    ? "Payment records from online orders and POS sales will appear here once the backend is connected."
                    : "Try changing your search or filters."}
                </p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>REFERENCE</th>
                    <th>DATE</th>
                    <th>CUSTOMER</th>
                    <th>SOURCE</th>
                    <th>METHOD</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <div className="mp-reference">
                          {transaction.reference}
                        </div>
                        <div className="mp-muted">
                          {transaction.transactionReference || "No transaction reference"}
                        </div>
                      </td>

                      <td>{formatDate(transaction.date)}</td>
                      <td>{transaction.customer || "Walk-in customer"}</td>
                      <td>{transaction.source || "—"}</td>
                      <td>{methodLabel(transaction.method)}</td>
                      <td className="mp-amount">
                        {money(transaction.amount)}
                      </td>
                      <td>
                        <span className={`mp-badge mp-${transaction.status}`}>
                          {statusLabel(transaction.status)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="mp-btn"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setModal("transaction");
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === "methods" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>
              Accepted Payment Methods
            </h2>
            <p className="mp-subtitle">
              Enable the methods your business accepts and configure their details.
            </p>
          </div>

          <div className="mp-method-grid">
            {methods.map((method) => {
              const icons = {
                cash: "💵",
                mpesa: "📱",
                card: "💳",
                bank: "🏦",
                other: "💰",
              };

              return (
                <div className="mp-method-card" key={method.id}>
                  <div className="mp-method-top">
                    <div className="mp-method-icon">
                      {icons[method.id] || "💰"}
                    </div>

                    <label className="mp-switch">
                      <input
                        type="checkbox"
                        checked={method.enabled}
                        onChange={() => toggleMethod(method.id)}
                      />
                      <span className="mp-slider" />
                    </label>
                  </div>

                  <h3>{method.name}</h3>
                  <p>{method.description}</p>

                  <div className="mp-method-details">
                    <strong>Status:</strong>{" "}
                    {method.enabled ? "Enabled" : "Disabled"}
                    {method.details && (
                      <>
                        <br />
                        <strong>Configuration:</strong> {method.details}
                      </>
                    )}
                  </div>

                  <div className="mp-method-actions">
                    <button
                      className="mp-btn"
                      onClick={() => openEditMethod(method)}
                    >
                      Configure
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mp-notice">
            <strong>Payment integration:</strong> Enabling a method here only
            changes its preview setting. M-Pesa Daraja, card gateways and bank
            payment verification will require secure backend integrations.
            Never enter API secrets or passwords into this page.
          </div>
        </>
      )}

      {modal === "method" && selectedMethod && (
        <div
          className="mp-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
        >
          <form className="mp-modal" onSubmit={saveMethod}>
            <div className="mp-modal-header">
              <h2>Configure {selectedMethod.name}</h2>
              <button
                type="button"
                className="mp-close"
                onClick={() => setModal(null)}
              >
                ×
              </button>
            </div>

            <div className="mp-form-grid">
              <div className="mp-field mp-full">
                <label>Payment method name</label>
                <input
                  className="mp-input"
                  value={methodForm.name}
                  onChange={(event) => updateMethod("name", event.target.value)}
                  required
                />
              </div>

              <div className="mp-field mp-full">
                <label>Description</label>
                <textarea
                  className="mp-textarea"
                  rows="3"
                  value={methodForm.description}
                  onChange={(event) =>
                    updateMethod("description", event.target.value)
                  }
                />
              </div>

              <div className="mp-field mp-full">
                <label>Public payment details</label>
                <input
                  className="mp-input"
                  value={methodForm.details}
                  onChange={(event) =>
                    updateMethod("details", event.target.value)
                  }
                  placeholder="e.g. Till number or account name"
                />
                <small>
                  Only enter details intended to be displayed to customers.
                  Do not enter passwords, API keys or secret credentials.
                </small>
              </div>

              <div className="mp-field mp-full">
                <label>Method status</label>
                <select
                  className="mp-select"
                  value={methodForm.enabled ? "enabled" : "disabled"}
                  onChange={(event) =>
                    updateMethod("enabled", event.target.value === "enabled")
                  }
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            {error && (
              <div style={{ color: "#dc2626", fontSize: 13, marginTop: 14 }}>
                {error}
              </div>
            )}

            <div className="mp-modal-footer">
              <button
                type="button"
                className="mp-btn"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>

              <button type="submit" className="mp-btn mp-primary">
                Save Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === "transaction" && selectedTransaction && (
        <div
          className="mp-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
        >
          <div className="mp-modal">
            <div className="mp-modal-header">
              <h2>Payment Details</h2>
              <button
                type="button"
                className="mp-close"
                onClick={() => setModal(null)}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary, #64748b)" }}>
                Payment amount
              </div>
              <div style={{ fontSize: 27, fontWeight: 800, marginTop: 5 }}>
                {money(selectedTransaction.amount)}
              </div>
              <span className={`mp-badge mp-${selectedTransaction.status}`}>
                {statusLabel(selectedTransaction.status)}
              </span>
            </div>

            <div className="mp-detail-grid">
              {[
                ["Payment reference", selectedTransaction.reference],
                ["Transaction reference", selectedTransaction.transactionReference],
                ["Customer", selectedTransaction.customer],
                ["Payment method", methodLabel(selectedTransaction.method)],
                ["Source", selectedTransaction.source],
                ["Date", formatDate(selectedTransaction.date)],
                ["Branch", selectedTransaction.branch],
                ["Recorded by", selectedTransaction.recordedBy],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mp-detail-label">{label}</div>
                  <div className="mp-detail-value">{value || "—"}</div>
                </div>
              ))}

              <div className="mp-full">
                <div className="mp-detail-label">Notes</div>
                <div className="mp-detail-value" style={{ fontWeight: 400 }}>
                  {selectedTransaction.notes || "No additional notes"}
                </div>
              </div>
            </div>

            <div className="mp-notice">
              Changing a payment status here is only a preview action.
              Actual payment verification and refunds must be handled through
              the payment provider and backend.
            </div>

            <div className="mp-modal-footer">
              {selectedTransaction.status === "pending" && (
                <button
                  className="mp-btn"
                  onClick={() =>
                    changeTransactionStatus(selectedTransaction, "completed")
                  }
                >
                  Mark Completed
                </button>
              )}

              {selectedTransaction.status === "completed" && (
                <button
                  className="mp-btn mp-danger"
                  onClick={() =>
                    changeTransactionStatus(selectedTransaction, "refunded")
                  }
                >
                  Mark Refunded
                </button>
              )}

              <button
                className="mp-btn mp-primary"
                onClick={() => setModal(null)}
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
