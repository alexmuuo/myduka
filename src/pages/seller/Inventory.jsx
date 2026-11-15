import React, { useMemo, useState } from "react";

/*
  MYDUKA — INVENTORY MANAGEMENT

  FRONTEND PREVIEW:
  - Data is stored in component state only.
  - Refreshing the page clears preview records.
  - No backend/API calls are made yet.

  IMPORTANT:
  Every stock receipt records its own:
  - Quantity
  - Buying price
  - Selling price
  - Supplier
  - Receiving branch
  - Date received
  - Invoice/reference
  - Notes

  Historical receipt prices are never overwritten.

  Quantities support up to 3 decimal places.
*/

const money = (value) =>
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const quantity = (value) =>
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

const today = () => new Date().toISOString().slice(0, 10);

const initialReceiptForm = {
  product: "",
  branch: "",
  quantity: "",
  buyingPrice: "",
  sellingPrice: "",
  supplier: "",
  receivedDate: today(),
  reference: "",
  notes: "",
};

const initialAdjustmentForm = {
  product: "",
  branch: "",
  type: "increase",
  quantity: "",
  reason: "",
  reference: "",
  notes: "",
};

export default function Inventory() {
  const [receipts, setReceipts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showReceiptDetails, setShowReceiptDetails] = useState(null);

  const [receiptForm, setReceiptForm] = useState(initialReceiptForm);
  const [adjustmentForm, setAdjustmentForm] = useState(
    initialAdjustmentForm
  );

  const [receiptError, setReceiptError] = useState("");
  const [adjustmentError, setAdjustmentError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const stockRecords = useMemo(() => {
    const records = {};

    const getKey = (product, branch) =>
      `${product.trim().toLowerCase()}__${branch.trim().toLowerCase()}`;

    receipts.forEach((receipt) => {
      const key = getKey(receipt.product, receipt.branch);

      if (!records[key]) {
        records[key] = {
          product: receipt.product,
          branch: receipt.branch,
          stock: 0,
          totalBuyingValue: 0,
          lastBuyingPrice: receipt.buyingPrice,
          lastSellingPrice: receipt.sellingPrice,
          lastReceived: receipt.receivedDate,
          receipts: 0,
        };
      }

      records[key].stock += receipt.quantity;
      records[key].totalBuyingValue +=
        receipt.quantity * receipt.buyingPrice;
      records[key].lastBuyingPrice = receipt.buyingPrice;
      records[key].lastSellingPrice = receipt.sellingPrice;
      records[key].lastReceived = receipt.receivedDate;
      records[key].receipts += 1;
    });

    adjustments.forEach((adjustment) => {
      const key = getKey(adjustment.product, adjustment.branch);

      if (!records[key]) {
        records[key] = {
          product: adjustment.product,
          branch: adjustment.branch,
          stock: 0,
          totalBuyingValue: 0,
          lastBuyingPrice: 0,
          lastSellingPrice: 0,
          lastReceived: "",
          receipts: 0,
        };
      }

      if (adjustment.type === "increase") {
        records[key].stock += adjustment.quantity;
      } else {
        records[key].stock -= adjustment.quantity;
      }
    });

    return Object.values(records).map((record) => ({
      ...record,
      stock: Math.max(0, record.stock),
      averageBuyingPrice:
        record.stock > 0
          ? record.totalBuyingValue / record.stock
          : 0,
    }));
  }, [receipts, adjustments]);

  const branches = useMemo(() => {
    return [
      ...new Set([
        ...receipts.map((item) => item.branch),
        ...adjustments.map((item) => item.branch),
      ]),
    ].sort();
  }, [receipts, adjustments]);

  const filteredStock = useMemo(() => {
    return stockRecords.filter((item) => {
      const matchesSearch =
        item.product.toLowerCase().includes(search.toLowerCase()) ||
        item.branch.toLowerCase().includes(search.toLowerCase());

      const matchesBranch =
        branchFilter === "all" || item.branch === branchFilter;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "available" && item.stock > 0) ||
        (stockFilter === "out" && item.stock <= 0);

      return matchesSearch && matchesBranch && matchesStock;
    });
  }, [stockRecords, search, branchFilter, stockFilter]);

  const totalProducts = stockRecords.length;

  const totalUnits = stockRecords.reduce(
    (sum, item) => sum + item.stock,
    0
  );

  const totalStockValue = stockRecords.reduce(
    (sum, item) => sum + item.totalBuyingValue,
    0
  );

  const totalReceipts = receipts.length;

  const totalAdjustments = adjustments.length;

  const ledger = useMemo(() => {
    const receiptEntries = receipts.map((item) => ({
      ...item,
      entryType: "receipt",
      sortDate: item.createdAt,
    }));

    const adjustmentEntries = adjustments.map((item) => ({
      ...item,
      entryType: "adjustment",
      sortDate: item.createdAt,
    }));

    return [...receiptEntries, ...adjustmentEntries].sort(
      (a, b) => new Date(b.sortDate) - new Date(a.sortDate)
    );
  }, [receipts, adjustments]);

  const filteredLedger = ledger.filter((item) => {
    const term = search.toLowerCase();

    return (
      item.product.toLowerCase().includes(term) ||
      item.branch.toLowerCase().includes(term) ||
      (item.reference || "").toLowerCase().includes(term) ||
      (item.supplier || "").toLowerCase().includes(term)
    );
  });

  const showSuccess = (message) => {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);
  };

  const updateReceiptForm = (field, value) => {
    setReceiptForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateAdjustmentForm = (field, value) => {
    setAdjustmentForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const submitReceipt = (event) => {
    event.preventDefault();
    setReceiptError("");

    const product = receiptForm.product.trim();
    const branch = receiptForm.branch.trim();

    const qty = Number(receiptForm.quantity);
    const bp = Number(receiptForm.buyingPrice);
    const sp = Number(receiptForm.sellingPrice);

    if (!product || !branch) {
      setReceiptError("Enter both the product and receiving branch.");
      return;
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      setReceiptError("Enter a valid quantity greater than zero.");
      return;
    }

    if (!Number.isFinite(bp) || bp < 0) {
      setReceiptError("Enter a valid buying price.");
      return;
    }

    if (!Number.isFinite(sp) || sp < 0) {
      setReceiptError("Enter a valid selling price.");
      return;
    }

    if (!receiptForm.receivedDate) {
      setReceiptError("Select the date stock was received.");
      return;
    }

    const newReceipt = {
      id: `REC-${Date.now()}`,
      product,
      branch,
      quantity: qty,
      buyingPrice: bp,
      sellingPrice: sp,
      supplier: receiptForm.supplier.trim(),
      receivedDate: receiptForm.receivedDate,
      reference: receiptForm.reference.trim(),
      notes: receiptForm.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setReceipts((previous) => [...previous, newReceipt]);

    setReceiptForm(initialReceiptForm);
    setShowReceiptModal(false);

    showSuccess("Stock received and receipt recorded successfully.");
  };

  const submitAdjustment = (event) => {
    event.preventDefault();
    setAdjustmentError("");

    const product = adjustmentForm.product.trim();
    const branch = adjustmentForm.branch.trim();
    const qty = Number(adjustmentForm.quantity);

    if (!product || !branch) {
      setAdjustmentError("Enter the product and branch.");
      return;
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      setAdjustmentError("Enter a valid adjustment quantity.");
      return;
    }

    if (!adjustmentForm.reason.trim()) {
      setAdjustmentError("Please provide a reason for this adjustment.");
      return;
    }

    const existingStock = stockRecords.find(
      (item) =>
        item.product.toLowerCase() === product.toLowerCase() &&
        item.branch.toLowerCase() === branch.toLowerCase()
    );

    if (
      adjustmentForm.type === "decrease" &&
      (!existingStock || existingStock.stock < qty)
    ) {
      setAdjustmentError(
        "The adjustment quantity cannot exceed available stock."
      );
      return;
    }

    const newAdjustment = {
      id: `ADJ-${Date.now()}`,
      product,
      branch,
      type: adjustmentForm.type,
      quantity: qty,
      reason: adjustmentForm.reason.trim(),
      reference: adjustmentForm.reference.trim(),
      notes: adjustmentForm.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setAdjustments((previous) => [...previous, newAdjustment]);

    setAdjustmentForm(initialAdjustmentForm);
    setShowAdjustmentModal(false);

    showSuccess("Stock adjustment recorded successfully.");
  };

  const openReceiptModal = () => {
    setReceiptError("");
    setReceiptForm(initialReceiptForm);
    setShowReceiptModal(true);
  };

  const openAdjustmentModal = () => {
    setAdjustmentError("");
    setAdjustmentForm(initialAdjustmentForm);
    setShowAdjustmentModal(true);
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const tabs = [
    { id: "overview", label: "Stock Overview" },
    { id: "receipts", label: "Stock Receipts" },
    { id: "history", label: "Stock History" },
  ];

  return (
    <div className="md-inventory">
      <style>{`
        .md-inventory {
          --inv-primary: var(--primary, #2563eb);
          --inv-text: var(--text-primary, #172033);
          --inv-muted: var(--text-secondary, #64748b);
          --inv-border: var(--border-color, #e2e8f0);
          --inv-card: var(--card-bg, #ffffff);
          --inv-bg: var(--background, #f8fafc);
          color: var(--inv-text);
          width: 100%;
          min-width: 0;
          padding: 4px 0 35px;
        }

        .md-inventory * {
          box-sizing: border-box;
        }

        .md-inventory button,
        .md-inventory input,
        .md-inventory select,
        .md-inventory textarea {
          font: inherit;
        }

        .md-inventory button {
          cursor: pointer;
        }

        .inv-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 22px;
        }

        .inv-title {
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -0.7px;
          margin: 0 0 6px;
        }

        .inv-subtitle {
          color: var(--inv-muted);
          font-size: 13px;
          margin: 0;
          line-height: 1.6;
        }

        .inv-actions {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
        }

        .inv-btn {
          border: 1px solid var(--inv-border);
          background: var(--inv-card);
          color: var(--inv-text);
          padding: 10px 14px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 650;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          transition: 0.15s ease;
        }

        .inv-btn:hover {
          transform: translateY(-1px);
          border-color: var(--inv-primary);
        }

        .inv-btn-primary {
          background: var(--inv-primary);
          border-color: var(--inv-primary);
          color: white;
        }

        .inv-btn-primary:hover {
          opacity: 0.92;
        }

        .inv-btn-danger {
          color: #dc2626;
        }

        .inv-preview {
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

        .inv-preview strong {
          display: block;
          margin-bottom: 2px;
        }

        .inv-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 23px;
        }

        .inv-stat {
          background: var(--inv-card);
          border: 1px solid var(--inv-border);
          border-radius: 12px;
          padding: 17px;
          min-width: 0;
        }

        .inv-stat-label {
          color: var(--inv-muted);
          font-size: 12px;
          margin-bottom: 10px;
        }

        .inv-stat-value {
          font-size: 23px;
          font-weight: 750;
          letter-spacing: -0.5px;
          overflow-wrap: anywhere;
        }

        .inv-stat-note {
          color: var(--inv-muted);
          font-size: 11px;
          margin-top: 6px;
        }

        .inv-tabs {
          display: flex;
          gap: 23px;
          border-bottom: 1px solid var(--inv-border);
          margin-bottom: 19px;
          overflow-x: auto;
        }

        .inv-tab {
          border: none;
          background: transparent;
          color: var(--inv-muted);
          padding: 0 2px 13px;
          font-size: 13px;
          font-weight: 650;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
        }

        .inv-tab.active {
          color: var(--inv-primary);
          border-bottom-color: var(--inv-primary);
        }

        .inv-panel {
          background: var(--inv-card);
          border: 1px solid var(--inv-border);
          border-radius: 12px;
          overflow: hidden;
        }

        .inv-panel-heading {
          padding: 17px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          border-bottom: 1px solid var(--inv-border);
        }

        .inv-panel-heading h3 {
          font-size: 14px;
          font-weight: 750;
          margin: 0 0 4px;
        }

        .inv-panel-heading p {
          font-size: 11px;
          color: var(--inv-muted);
          margin: 0;
        }

        .inv-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          padding: 14px 17px;
          border-bottom: 1px solid var(--inv-border);
        }

        .inv-input,
        .inv-select,
        .inv-textarea {
          width: 100%;
          min-width: 0;
          padding: 10px 11px;
          background: var(--inv-card);
          color: var(--inv-text);
          border: 1px solid var(--inv-border);
          border-radius: 8px;
          outline: none;
          font-size: 12px;
        }

        .inv-input:focus,
        .inv-select:focus,
        .inv-textarea:focus {
          border-color: var(--inv-primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.09);
        }

        .inv-search {
          flex: 1 1 220px;
          max-width: 340px;
        }

        .inv-filter-select {
          flex: 0 1 175px;
        }

        .inv-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .inv-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 780px;
        }

        .inv-table th {
          background: var(--inv-bg);
          color: var(--inv-muted);
          font-size: 10px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 15px;
          white-space: nowrap;
        }

        .inv-table td {
          padding: 14px 15px;
          font-size: 12px;
          border-top: 1px solid var(--inv-border);
          white-space: nowrap;
        }

        .inv-table tbody tr:hover {
          background: var(--inv-bg);
        }

        .inv-main-cell {
          font-weight: 700;
          color: var(--inv-text);
        }

        .inv-secondary-cell {
          color: var(--inv-muted);
          font-size: 11px;
          margin-top: 4px;
        }

        .inv-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 750;
        }

        .inv-badge-green {
          background: #dcfce7;
          color: #166534;
        }

        .inv-badge-red {
          background: #fee2e2;
          color: #991b1b;
        }

        .inv-badge-blue {
          background: #dbeafe;
          color: #1e40af;
        }

        .inv-empty {
          text-align: center;
          padding: 54px 20px;
        }

        .inv-empty-icon {
          width: 53px;
          height: 53px;
          border-radius: 14px;
          background: var(--inv-bg);
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          font-size: 23px;
        }

        .inv-empty h3 {
          font-size: 14px;
          margin: 0 0 7px;
        }

        .inv-empty p {
          font-size: 12px;
          color: var(--inv-muted);
          line-height: 1.6;
          max-width: 390px;
          margin: 0 auto 17px;
        }

        .inv-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          overflow-y: auto;
        }

        .inv-modal {
          background: var(--inv-card);
          color: var(--inv-text);
          width: 100%;
          max-width: 650px;
          border-radius: 15px;
          border: 1px solid var(--inv-border);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          max-height: calc(100vh - 36px);
          overflow-y: auto;
        }

        .inv-modal-header {
          padding: 19px 21px;
          border-bottom: 1px solid var(--inv-border);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .inv-modal-header h2 {
          font-size: 17px;
          margin: 0 0 5px;
        }

        .inv-modal-header p {
          font-size: 11px;
          color: var(--inv-muted);
          margin: 0;
          line-height: 1.5;
        }

        .inv-close {
          border: none;
          background: var(--inv-bg);
          color: var(--inv-text);
          border-radius: 8px;
          width: 32px;
          height: 32px;
          font-size: 19px;
        }

        .inv-modal-body {
          padding: 20px;
        }

        .inv-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .inv-field {
          min-width: 0;
        }

        .inv-field.full {
          grid-column: 1 / -1;
        }

        .inv-field label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 7px;
        }

        .inv-field label span {
          color: #dc2626;
        }

        .inv-field small {
          display: block;
          font-size: 10px;
          color: var(--inv-muted);
          margin-top: 5px;
          line-height: 1.5;
        }

        .inv-textarea {
          resize: vertical;
          min-height: 75px;
        }

        .inv-price-note {
          grid-column: 1 / -1;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1e40af;
          border-radius: 9px;
          padding: 12px;
          font-size: 11px;
          line-height: 1.6;
        }

        .inv-error {
          padding: 10px 12px;
          border-radius: 8px;
          background: #fee2e2;
          color: #991b1b;
          font-size: 11px;
          margin-bottom: 14px;
        }

        .inv-modal-footer {
          padding: 15px 20px;
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          border-top: 1px solid var(--inv-border);
        }

        .inv-success {
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
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.18);
        }

        .inv-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 13px;
        }

        .inv-detail {
          background: var(--inv-bg);
          border-radius: 9px;
          padding: 12px;
          min-width: 0;
        }

        .inv-detail-label {
          font-size: 10px;
          color: var(--inv-muted);
          margin-bottom: 6px;
        }

        .inv-detail-value {
          font-size: 13px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        @media (max-width: 900px) {
          .inv-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .inv-header {
            flex-direction: column;
          }

          .inv-actions {
            width: 100%;
          }

          .inv-actions .inv-btn {
            flex: 1;
          }

          .inv-title {
            font-size: 22px;
          }

          .inv-stats {
            gap: 9px;
          }

          .inv-stat {
            padding: 13px;
          }

          .inv-stat-value {
            font-size: 19px;
          }

          .inv-panel-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .inv-form-grid {
            grid-template-columns: 1fr;
          }

          .inv-field.full,
          .inv-price-note {
            grid-column: auto;
          }

          .inv-modal-backdrop {
            padding: 9px;
            align-items: flex-start;
          }

          .inv-modal {
            margin: auto 0;
            max-height: calc(100vh - 18px);
          }

          .inv-modal-body {
            padding: 15px;
          }

          .inv-detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="inv-header">
        <div>
          <h1 className="inv-title">Inventory</h1>
          <p className="inv-subtitle">
            Manage stock across your branches, receive new stock and track
            every stock movement.
          </p>
        </div>

        <div className="inv-actions">
          <button className="inv-btn" onClick={openAdjustmentModal}>
            ± Adjust Stock
          </button>

          <button
            className="inv-btn inv-btn-primary"
            onClick={openReceiptModal}
          >
            + Receive Stock
          </button>
        </div>
      </div>

      <div className="inv-preview">
        <span>ⓘ</span>
        <div>
          <strong>Inventory preview mode</strong>
          This page currently uses temporary frontend data. Products and
          branches will be loaded from your business catalogue when backend
          integration is implemented. Stock receipts and adjustments are
          cleared when you refresh the page.
        </div>
      </div>

      <div className="inv-stats">
        <div className="inv-stat">
          <div className="inv-stat-label">Product / branch records</div>
          <div className="inv-stat-value">{totalProducts}</div>
          <div className="inv-stat-note">Inventory records created</div>
        </div>

        <div className="inv-stat">
          <div className="inv-stat-label">Total units in stock</div>
          <div className="inv-stat-value">{quantity(totalUnits)}</div>
          <div className="inv-stat-note">Across recorded branches</div>
        </div>

        <div className="inv-stat">
          <div className="inv-stat-label">Stock value at purchase</div>
          <div className="inv-stat-value">KSh {money(totalStockValue)}</div>
          <div className="inv-stat-note">Based on recorded receipts</div>
        </div>

        <div className="inv-stat">
          <div className="inv-stat-label">Stock transactions</div>
          <div className="inv-stat-value">
            {totalReceipts + totalAdjustments}
          </div>
          <div className="inv-stat-note">
            {totalReceipts} receipts · {totalAdjustments} adjustments
          </div>
        </div>
      </div>

      <div className="inv-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`inv-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="inv-panel">
          <div className="inv-panel-heading">
            <div>
              <h3>Current stock levels</h3>
              <p>
                Stock is tracked separately for each product and branch.
              </p>
            </div>

            <button
              className="inv-btn inv-btn-primary"
              onClick={openReceiptModal}
            >
              + Receive Stock
            </button>
          </div>

          <div className="inv-filters">
            <input
              className="inv-input inv-search"
              placeholder="Search product or branch..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="inv-select inv-filter-select"
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

            <select
              className="inv-select inv-filter-select"
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
            >
              <option value="all">All stock levels</option>
              <option value="available">Available stock</option>
              <option value="out">Out of stock</option>
            </select>
          </div>

          {filteredStock.length === 0 ? (
            <div className="inv-empty">
              <div className="inv-empty-icon">▤</div>
              <h3>
                {stockRecords.length === 0
                  ? "Your inventory is empty"
                  : "No matching stock records"}
              </h3>
              <p>
                {stockRecords.length === 0
                  ? "Receive your first stock delivery to start tracking product quantities, buying prices and selling prices."
                  : "Try changing your search or filters."}
              </p>

              {stockRecords.length === 0 && (
                <button
                  className="inv-btn inv-btn-primary"
                  onClick={openReceiptModal}
                >
                  + Receive Your First Stock
                </button>
              )}
            </div>
          ) : (
            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Branch</th>
                    <th>Quantity available</th>
                    <th>Average buying price</th>
                    <th>Latest selling price</th>
                    <th>Stock value</th>
                    <th>Last received</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStock.map((item, index) => (
                    <tr key={`${item.product}-${item.branch}-${index}`}>
                      <td>
                        <div className="inv-main-cell">{item.product}</div>
                        <div className="inv-secondary-cell">
                          {item.receipts} stock receipt
                          {item.receipts === 1 ? "" : "s"}
                        </div>
                      </td>

                      <td>{item.branch}</td>

                      <td>
                        <span
                          className={`inv-badge ${
                            item.stock > 0
                              ? "inv-badge-green"
                              : "inv-badge-red"
                          }`}
                        >
                          {quantity(item.stock)}
                        </span>
                      </td>

                      <td>KSh {money(item.averageBuyingPrice)}</td>

                      <td>KSh {money(item.lastSellingPrice)}</td>

                      <td>
                        KSh {money(item.totalBuyingValue)}
                      </td>

                      <td>{formatDate(item.lastReceived)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "receipts" && (
        <div className="inv-panel">
          <div className="inv-panel-heading">
            <div>
              <h3>Stock receipts</h3>
              <p>
                Each delivery has its own buying and selling price records.
              </p>
            </div>

            <button
              className="inv-btn inv-btn-primary"
              onClick={openReceiptModal}
            >
              + Record Stock Receipt
            </button>
          </div>

          {receipts.length === 0 ? (
            <div className="inv-empty">
              <div className="inv-empty-icon">↓</div>
              <h3>No stock receipts yet</h3>
              <p>
                Every new delivery will appear here with its own BP, SP,
                quantity, supplier and reference details.
              </p>
              <button
                className="inv-btn inv-btn-primary"
                onClick={openReceiptModal}
              >
                + Record First Receipt
              </button>
            </div>
          ) : (
            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Receipt reference</th>
                    <th>Product</th>
                    <th>Branch</th>
                    <th>Quantity</th>
                    <th>Buying price</th>
                    <th>Selling price</th>
                    <th>Supplier</th>
                    <th>Date received</th>
                  </tr>
                </thead>

                <tbody>
                  {[...receipts]
                    .reverse()
                    .map((item) => (
                      <tr key={item.id}>
                        <td>
                          <button
                            className="inv-btn"
                            onClick={() => setShowReceiptDetails(item)}
                          >
                            {item.reference || item.id}
                          </button>
                        </td>

                        <td className="inv-main-cell">{item.product}</td>
                        <td>{item.branch}</td>
                        <td>{quantity(item.quantity)}</td>
                        <td>KSh {money(item.buyingPrice)}</td>
                        <td>KSh {money(item.sellingPrice)}</td>
                        <td>{item.supplier || "—"}</td>
                        <td>{formatDate(item.receivedDate)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="inv-panel">
          <div className="inv-panel-heading">
            <div>
              <h3>Stock movement history</h3>
              <p>
                A chronological record of receipts and manual adjustments.
              </p>
            </div>
          </div>

          <div className="inv-filters">
            <input
              className="inv-input inv-search"
              placeholder="Search transactions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {filteredLedger.length === 0 ? (
            <div className="inv-empty">
              <div className="inv-empty-icon">◷</div>
              <h3>No stock movements recorded</h3>
              <p>
                Stock receipts and adjustments will appear here as you
                record inventory transactions.
              </p>
            </div>
          ) : (
            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Product</th>
                    <th>Branch</th>
                    <th>Movement</th>
                    <th>Quantity</th>
                    <th>BP</th>
                    <th>SP</th>
                    <th>Reference / reason</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLedger.map((item) => {
                    const isReceipt = item.entryType === "receipt";

                    return (
                      <tr key={item.id}>
                        <td>
                          <span
                            className={`inv-badge ${
                              isReceipt
                                ? "inv-badge-blue"
                                : "inv-badge-green"
                            }`}
                          >
                            {isReceipt ? "Stock in" : "Adjustment"}
                          </span>
                        </td>

                        <td className="inv-main-cell">{item.product}</td>
                        <td>{item.branch}</td>

                        <td>
                          {isReceipt
                            ? "Received"
                            : item.type === "increase"
                            ? "Increase"
                            : "Decrease"}
                        </td>

                        <td>
                          {isReceipt
                            ? `+${quantity(item.quantity)}`
                            : item.type === "increase"
                            ? `+${quantity(item.quantity)}`
                            : `-${quantity(item.quantity)}`}
                        </td>

                        <td>
                          {isReceipt
                            ? `KSh ${money(item.buyingPrice)}`
                            : "—"}
                        </td>

                        <td>
                          {isReceipt
                            ? `KSh ${money(item.sellingPrice)}`
                            : "—"}
                        </td>

                        <td>
                          {isReceipt
                            ? item.reference || item.supplier || "—"
                            : item.reason}
                        </td>

                        <td>
                          {formatDate(
                            isReceipt ? item.receivedDate : item.createdAt
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* RECEIVE STOCK MODAL */}

      {showReceiptModal && (
        <div
          className="inv-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowReceiptModal(false);
            }
          }}
        >
          <form className="inv-modal" onSubmit={submitReceipt}>
            <div className="inv-modal-header">
              <div>
                <h2>Receive new stock</h2>
                <p>
                  Record the delivery and the prices applicable to this
                  specific stock batch.
                </p>
              </div>

              <button
                type="button"
                className="inv-close"
                onClick={() => setShowReceiptModal(false)}
              >
                ×
              </button>
            </div>

            <div className="inv-modal-body">
              {receiptError && (
                <div className="inv-error">{receiptError}</div>
              )}

              <div className="inv-form-grid">
                <div className="inv-field">
                  <label>
                    Product name <span>*</span>
                  </label>
                  <input
                    className="inv-input"
                    value={receiptForm.product}
                    onChange={(event) =>
                      updateReceiptForm("product", event.target.value)
                    }
                    placeholder="e.g. Tusker Lager"
                    required
                  />
                  <small>
                    Will eventually be selected from your Products catalogue.
                  </small>
                </div>

                <div className="inv-field">
                  <label>
                    Receiving branch <span>*</span>
                  </label>
                  <input
                    className="inv-input"
                    value={receiptForm.branch}
                    onChange={(event) =>
                      updateReceiptForm("branch", event.target.value)
                    }
                    placeholder="e.g. Kisii Branch"
                    required
                  />
                  <small>
                    Stock is recorded against the receiving branch.
                  </small>
                </div>

                <div className="inv-field">
                  <label>
                    Quantity received <span>*</span>
                  </label>
                  <input
                    className="inv-input"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={receiptForm.quantity}
                    onChange={(event) =>
                      updateReceiptForm("quantity", event.target.value)
                    }
                    placeholder="0.000"
                    required
                  />
                </div>

                <div className="inv-field">
                  <label>
                    Date received <span>*</span>
                  </label>
                  <input
                    className="inv-input"
                    type="date"
                    value={receiptForm.receivedDate}
                    onChange={(event) =>
                      updateReceiptForm("receivedDate", event.target.value)
                    }
                    required
                  />
                </div>

                <div className="inv-field">
                  <label>
                    Buying price per unit (BP) <span>*</span>
                  </label>
                  <input
                    className="inv-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={receiptForm.buyingPrice}
                    onChange={(event) =>
                      updateReceiptForm("buyingPrice", event.target.value)
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="inv-field">
                  <label>
                    Selling price per unit (SP) <span>*</span>
                  </label>
                  <input
                    className="inv-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={receiptForm.sellingPrice}
                    onChange={(event) =>
                      updateReceiptForm("sellingPrice", event.target.value)
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="inv-price-note">
                  <strong>Important: historical price tracking</strong>
                  <br />
                  BP and SP are saved against this individual receipt.
                  Changing prices on future receipts will not change the
                  prices recorded here.
                </div>

                <div className="inv-field">
                  <label>Supplier</label>
                  <input
                    className="inv-input"
                    value={receiptForm.supplier}
                    onChange={(event) =>
                      updateReceiptForm("supplier", event.target.value)
                    }
                    placeholder="Supplier name"
                  />
                </div>

                <div className="inv-field">
                  <label>Invoice / reference number</label>
                  <input
                    className="inv-input"
                    value={receiptForm.reference}
                    onChange={(event) =>
                      updateReceiptForm("reference", event.target.value)
                    }
                    placeholder="e.g. INV-00125"
                  />
                </div>

                <div className="inv-field full">
                  <label>Notes</label>
                  <textarea
                    className="inv-textarea"
                    value={receiptForm.notes}
                    onChange={(event) =>
                      updateReceiptForm("notes", event.target.value)
                    }
                    placeholder="Additional information about this delivery..."
                  />
                </div>
              </div>
            </div>

            <div className="inv-modal-footer">
              <button
                type="button"
                className="inv-btn"
                onClick={() => setShowReceiptModal(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inv-btn inv-btn-primary"
              >
                Save Stock Receipt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}

      {showAdjustmentModal && (
        <div
          className="inv-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAdjustmentModal(false);
            }
          }}
        >
          <form className="inv-modal" onSubmit={submitAdjustment}>
            <div className="inv-modal-header">
              <div>
                <h2>Adjust stock</h2>
                <p>
                  Record a stock correction with a reason. Every adjustment
                  is added to the stock movement history.
                </p>
              </div>

              <button
                type="button"
                className="inv-close"
                onClick={() => setShowAdjustmentModal(false)}
              >
                ×
              </button>
            </div>

            <div className="inv-modal-body">
              {adjustmentError && (
                <div className="inv-error">{adjustmentError}</div>
              )}

              <div className="inv-form-grid">
                <div className="inv-field">
                  <label>
                    Product name <span>*</span>
                  </label>
                  <input
                    className="inv-input"
                    value={adjustmentForm.product}
                    onChange={(event) =>
                      updateAdjustmentForm("product", event.target.value)
                    }
                    placeholder="Product name"
                    required
                  />
                </div>

                <div className="inv-field">
                  <label>
                    Branch <span>*</span>
                  </label>
                  <input
                    className="inv-input"
                    value={adjustmentForm.branch}
                    onChange={(event) =>
                      updateAdjustmentForm("branch", event.target.value)
                    }
                    placeholder="Branch name"
                    required
                  />
                </div>

                <div className="inv-field">
                  <label>
                    Adjustment type <span>*</span>
                  </label>
                  <select
                    className="inv-select"
                    value={adjustmentForm.type}
                    onChange={(event) =>
                      updateAdjustmentForm("type", event.target.value)
                    }
                  >
                    <option value="increase">Increase stock</option>
                    <option value="decrease">Decrease stock</option>
                  </select>
                </div>

                <div className="inv-field">
                  <label>
                    Quantity <span>*</span>
                  </label>
                  <input
                    className="inv-input"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={adjustmentForm.quantity}
                    onChange={(event) =>
                      updateAdjustmentForm("quantity", event.target.value)
                    }
                    placeholder="0.000"
                    required
                  />
                </div>

                <div className="inv-field full">
                  <label>
                    Reason for adjustment <span>*</span>
                  </label>
                  <select
                    className="inv-select"
                    value={adjustmentForm.reason}
                    onChange={(event) =>
                      updateAdjustmentForm("reason", event.target.value)
                    }
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="Physical stock count correction">
                      Physical stock count correction
                    </option>
                    <option value="Damaged goods">Damaged goods</option>
                    <option value="Expired goods">Expired goods</option>
                    <option value="Lost or missing stock">
                      Lost or missing stock
                    </option>
                    <option value="Found stock">Found stock</option>
                    <option value="Data entry correction">
                      Data entry correction
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="inv-field">
                  <label>Reference number</label>
                  <input
                    className="inv-input"
                    value={adjustmentForm.reference}
                    onChange={(event) =>
                      updateAdjustmentForm("reference", event.target.value)
                    }
                    placeholder="Optional reference"
                  />
                </div>

                <div className="inv-field">
                  <label>Additional notes</label>
                  <input
                    className="inv-input"
                    value={adjustmentForm.notes}
                    onChange={(event) =>
                      updateAdjustmentForm("notes", event.target.value)
                    }
                    placeholder="Optional notes"
                  />
                </div>
              </div>
            </div>

            <div className="inv-modal-footer">
              <button
                type="button"
                className="inv-btn"
                onClick={() => setShowAdjustmentModal(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inv-btn inv-btn-primary"
              >
                Save Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RECEIPT DETAILS MODAL */}

      {showReceiptDetails && (
        <div
          className="inv-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowReceiptDetails(null);
            }
          }}
        >
          <div className="inv-modal">
            <div className="inv-modal-header">
              <div>
                <h2>Stock receipt details</h2>
                <p>
                  Complete record of this individual stock delivery.
                </p>
              </div>

              <button
                className="inv-close"
                onClick={() => setShowReceiptDetails(null)}
              >
                ×
              </button>
            </div>

            <div className="inv-modal-body">
              <div className="inv-detail-grid">
                <div className="inv-detail">
                  <div className="inv-detail-label">Receipt ID</div>
                  <div className="inv-detail-value">
                    {showReceiptDetails.id}
                  </div>
                </div>

                <div className="inv-detail">
                  <div className="inv-detail-label">Reference</div>
                  <div className="inv-detail-value">
                    {showReceiptDetails.reference || "—"}
                  </div>
                </div>

                <div className="inv-detail">
                  <div className="inv-detail-label">Product</div>
                  <div className="inv-detail-value">
                    {showReceiptDetails.product}
                  </div>
                </div>

                <div className="inv-detail">
                  <div className="inv-detail-label">Receiving branch</div>
                  <div className="inv-detail-value">
                    {showReceiptDetails.branch}
                  </div>
                </div>

                <div className="inv-detail">
                  <div className="inv-detail-label">Quantity received</div>
                  <div className="inv-detail-value">
                    {quantity(showReceiptDetails.quantity)}
                  </div>
                </div>

                <div className="inv-detail">
                  <div className="inv-detail-label">Date received</div>
                  <div className="inv-detail-value">
                    {formatDate(showReceiptDetails.receivedDate)}
                  </div>
                </div>

                <div className="inv-detail">
                  <div className="inv-detail-label">
                    Buying price per unit
                  </div>
                  <div className="inv-detail-value">
                    KSh {money(showReceiptDetails.buyingPrice)}
                  </div>
                </div>

                <div className="inv-detail">
                  <div className="inv-detail-label">
                    Selling price per unit
                  </div>
                  <div className="inv-detail-value">
                    KSh {money(showReceiptDetails.sellingPrice)}
                  </div>
                </div>

                <div className="inv-detail">
                  <div className="inv-detail-label">Total buying value</div>
                  <div className="inv-detail-value">
                    KSh{" "}
                    {money(
                      showReceiptDetails.quantity *
                        showReceiptDetails.buyingPrice
                    )}
                  </div>
                </div>

                <div className="inv-detail">
                  <div className="inv-detail-label">Supplier</div>
                  <div className="inv-detail-value">
                    {showReceiptDetails.supplier || "—"}
                  </div>
                </div>

                <div className="inv-detail" style={{ gridColumn: "1 / -1" }}>
                  <div className="inv-detail-label">Notes</div>
                  <div className="inv-detail-value">
                    {showReceiptDetails.notes || "No additional notes."}
                  </div>
                </div>
              </div>
            </div>

            <div className="inv-modal-footer">
              <button
                className="inv-btn"
                onClick={() => setShowReceiptDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="inv-success">{successMessage}</div>
      )}
    </div>
  );
}
