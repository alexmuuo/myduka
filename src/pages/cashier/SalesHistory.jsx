import { useCallback, useEffect, useState } from "react";
import api from "../../api/api";

function SalesHistory() {
const [sales, setSales] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
const [page, setPage] = useState(1);
const [pagination, setPagination] = useState({
page: 1,
per_page: 20,
total_sales: 0,
total_pages: 0,
});
const [selectedSale, setSelectedSale] = useState(null);

const fetchSales = useCallback(
async (requestedPage = 1, filters = {}) => {
try {
setLoading(true);
setError("");


    const response = await api.get("/cashier/sales", {
      params: {
        page: requestedPage,
        per_page: 20,
        ...(filters.startDate
          ? { start_date: filters.startDate }
          : {}),
        ...(filters.endDate ? { end_date: filters.endDate } : {}),
      },
    });

    const responseSales = Array.isArray(response.data.sales)
      ? response.data.sales
      : [];

    setSales(responseSales);
    setPagination(
      response.data.pagination || {
        page: requestedPage,
        per_page: 20,
        total_sales: responseSales.length,
        total_pages: responseSales.length > 0 ? 1 : 0,
      }
    );
    setPage(requestedPage);
  } catch (err) {
    console.error("Failed to load sales history:", err);

    setError(
      err.response?.data?.message ||
        "Unable to load sales history. Please try again."
    );
  } finally {
    setLoading(false);
  }
},
[]


);

useEffect(() => {
fetchSales(1);
}, [fetchSales]);

const handleFilter = (event) => {
event.preventDefault();

```
if (startDate && endDate && startDate > endDate) {
  setError("The start date cannot be after the end date.");
  return;
}

fetchSales(1, { startDate, endDate });
```

};

const clearFilters = () => {
setStartDate("");
setEndDate("");
fetchSales(1, {});
};

const changePage = (requestedPage) => {
fetchSales(requestedPage, { startDate, endDate });
};

const formatMoney = (amount) =>
`KSh ${Number(amount || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

const formatDate = (value) => {
if (!value) return "—";


const date = new Date(value);

if (Number.isNaN(date.getTime())) return value;

return date.toLocaleString("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
});


};

const getPaymentStatus = (sale) => {
const status = (sale.payment_status || "unpaid").toLowerCase();


if (status === "paid") return "Paid";
if (status === "pending") return "Pending";
if (status === "failed") return "Failed";

return "Unpaid";


};

const getPaymentClass = (sale) => {
const status = (sale.payment_status || "unpaid").toLowerCase();


if (status === "paid") return "paid";
if (status === "pending") return "pending";
if (status === "failed") return "failed";

return "unpaid";


};

const getSaleNumber = (sale) =>
sale.sale_number || `POS-${String(sale.id).padStart(6, "0")}`;

const printReceipt = (sale) => {
setSelectedSale(sale);


window.setTimeout(() => {
  window.print();
}, 300);


};

return ( <div className="sales-history-page"> <style>{`
.sales-history-page {
padding: 24px;
max-width: 1400px;
margin: 0 auto;
color: #1f2937;
}


    .sales-history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }

    .sales-history-header h1 {
      margin: 0 0 6px;
      font-size: 28px;
    }

    .sales-history-header p {
      margin: 0;
      color: #6b7280;
    }

    .sales-history-count {
      background: #ecfdf5;
      color: #047857;
      padding: 12px 18px;
      border-radius: 10px;
      font-weight: 700;
    }

    .sales-history-filters {
      display: flex;
      align-items: end;
      gap: 14px;
      flex-wrap: wrap;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 22px;
    }

    .sales-history-field {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .sales-history-field label {
      font-size: 13px;
      font-weight: 700;
    }

    .sales-history-field input {
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 7px;
      font: inherit;
    }

    .sales-history-button {
      border: none;
      border-radius: 7px;
      padding: 11px 16px;
      font-weight: 700;
      cursor: pointer;
    }

    .sales-history-button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .sales-history-search {
      background: #047857;
      color: white;
    }

    .sales-history-clear {
      background: #f3f4f6;
      color: #374151;
    }

    .sales-history-table-wrap {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow-x: auto;
    }

    .sales-history-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 850px;
    }

    .sales-history-table th,
    .sales-history-table td {
      padding: 14px 16px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: middle;
    }

    .sales-history-table th {
      background: #f9fafb;
      color: #4b5563;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .sales-history-table tbody tr:hover {
      background: #f9fafb;
    }

    .sales-history-sale-number {
      font-weight: 700;
      color: #047857;
      white-space: nowrap;
    }

    .sales-history-badge {
      display: inline-block;
      padding: 5px 9px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }

    .sales-history-badge.paid {
      background: #d1fae5;
      color: #065f46;
    }

    .sales-history-badge.unpaid {
      background: #fee2e2;
      color: #991b1b;
    }

    .sales-history-badge.pending {
      background: #fef3c7;
      color: #92400e;
    }

    .sales-history-badge.failed {
      background: #fee2e2;
      color: #991b1b;
    }

    .sales-history-actions {
      display: flex;
      gap: 8px;
    }

    .sales-history-view {
      background: #e0f2fe;
      color: #075985;
    }

    .sales-history-print {
      background: #ecfdf5;
      color: #047857;
    }

    .sales-history-message {
      padding: 16px;
      margin-bottom: 16px;
      border-radius: 8px;
      background: #fef2f2;
      color: #991b1b;
    }

    .sales-history-empty {
      padding: 45px 20px;
      text-align: center;
      color: #6b7280;
    }

    .sales-history-pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin: 22px 0;
    }

    .sales-history-pagination button {
      background: #047857;
      color: white;
    }

    .sales-history-pagination button:disabled {
      background: #d1d5db;
      color: #6b7280;
      cursor: not-allowed;
    }

    .sales-receipt-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      overflow-y: auto;
    }

    .sales-receipt {
      width: 100%;
      max-width: 440px;
      background: white;
      padding: 24px;
      border-radius: 10px;
      color: #111827;
      box-sizing: border-box;
    }

    .sales-receipt h2,
    .sales-receipt h3 {
      text-align: center;
      margin-top: 0;
    }

    .sales-receipt h2 {
      margin-bottom: 4px;
    }

    .sales-receipt-subtitle {
      text-align: center;
      color: #6b7280;
      margin-bottom: 20px;
    }

    .sales-receipt-meta {
      font-size: 13px;
      line-height: 1.8;
      border-top: 1px dashed #9ca3af;
      border-bottom: 1px dashed #9ca3af;
      padding: 12px 0;
      margin: 14px 0;
      overflow-wrap: anywhere;
    }

    .sales-receipt table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .sales-receipt th,
    .sales-receipt td {
      text-align: left;
      padding: 8px 3px;
      border-bottom: 1px solid #e5e7eb;
      overflow-wrap: anywhere;
    }

    .sales-receipt-total {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 18px;
      font-weight: 800;
      padding-top: 14px;
    }

    .sales-receipt-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .sales-receipt-actions button {
      flex: 1;
    }

    .sales-receipt-close {
      background: #e5e7eb;
      color: #374151;
    }

    .sales-receipt-warning {
      margin-top: 14px;
      padding: 10px;
      border-radius: 7px;
      background: #fef3c7;
      color: #92400e;
      font-size: 13px;
    }

    @media (max-width: 600px) {
      .sales-history-page {
        padding: 14px;
      }

      .sales-history-header h1 {
        font-size: 23px;
      }

      .sales-history-filters {
        align-items: stretch;
      }

      .sales-history-field,
      .sales-history-field input {
        width: 100%;
        box-sizing: border-box;
      }

      .sales-history-filters button {
        width: 100%;
      }

      .sales-history-pagination {
        gap: 8px;
        flex-wrap: wrap;
      }
    }

    @media print {
      body * {
        visibility: hidden !important;
      }

      .sales-receipt-overlay,
      .sales-receipt-overlay * {
        visibility: visible !important;
      }

      .sales-receipt-overlay {
        position: absolute !important;
        inset: 0 !important;
        display: block !important;
        overflow: visible !important;
        background: white !important;
        padding: 0 !important;
      }

      .sales-receipt {
        max-width: none !important;
        width: 100% !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
      }

      .sales-receipt-actions {
        display: none !important;
      }

      @page {
        margin: 10mm;
      }
    }
  `}</style>

  <div className="sales-history-header">
    <div>
      <h1>Sales History</h1>
      <p>Review previous POS transactions and reprint receipts.</p>
    </div>

    <div className="sales-history-count">
      Total matching sales: {pagination.total_sales}
    </div>
  </div>

  <form className="sales-history-filters" onSubmit={handleFilter}>
    <div className="sales-history-field">
      <label htmlFor="sales-start-date">Start date</label>
      <input
        id="sales-start-date"
        type="date"
        value={startDate}
        onChange={(event) => setStartDate(event.target.value)}
      />
    </div>

    <div className="sales-history-field">
      <label htmlFor="sales-end-date">End date</label>
      <input
        id="sales-end-date"
        type="date"
        value={endDate}
        onChange={(event) => setEndDate(event.target.value)}
      />
    </div>

    <button
      className="sales-history-button sales-history-search"
      type="submit"
      disabled={loading}
    >
      Search
    </button>

    <button
      className="sales-history-button sales-history-clear"
      type="button"
      onClick={clearFilters}
      disabled={loading}
    >
      Clear filters
    </button>
  </form>

  {error && <div className="sales-history-message">{error}</div>}

  {loading ? (
    <div className="sales-history-empty">Loading sales history...</div>
  ) : sales.length === 0 ? (
    <div className="sales-history-empty">
      <h3>No sales found</h3>
      <p>Your POS transactions will appear here after sales are recorded.</p>
    </div>
  ) : (
    <div className="sales-history-table-wrap">
      <table className="sales-history-table">
        <thead>
          <tr>
            <th>Sale number</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Payment status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td className="sales-history-sale-number">
                {getSaleNumber(sale)}
              </td>

              <td>{formatDate(sale.created_at)}</td>

              <td>
                {(sale.items || []).reduce(
                  (total, item) =>
                    total + Number(item.quantity || 0),
                  0
                )}
              </td>

              <td>{formatMoney(sale.total)}</td>

              <td>
                {(sale.payment_method || "—").toUpperCase()}
              </td>

              <td>
                <span
                  className={`sales-history-badge ${getPaymentClass(
                    sale
                  )}`}
                >
                  {getPaymentStatus(sale)}
                </span>
              </td>

              <td>
                <div className="sales-history-actions">
                  <button
                    type="button"
                    className="sales-history-button sales-history-view"
                    onClick={() => setSelectedSale(sale)}
                  >
                    View
                  </button>

                  <button
                    type="button"
                    className="sales-history-button sales-history-print"
                    onClick={() => printReceipt(sale)}
                  >
                    Print
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}

  {!loading && pagination.total_pages > 1 && (
    <div className="sales-history-pagination">
      <button
        className="sales-history-button"
        type="button"
        disabled={loading || page <= 1}
        onClick={() => changePage(page - 1)}
      >
        Previous
      </button>

      <span>
        Page {page} of {pagination.total_pages}
      </span>

      <button
        className="sales-history-button"
        type="button"
        disabled={loading || page >= pagination.total_pages}
        onClick={() => changePage(page + 1)}
      >
        Next
      </button>
    </div>
  )}

  {selectedSale && (
    <div
      className="sales-receipt-overlay"
      onClick={() => setSelectedSale(null)}
    >
      <div
        className="sales-receipt"
        onClick={(event) => event.stopPropagation()}
      >
        <h2>MYDUKA</h2>

        <div className="sales-receipt-subtitle">
          POS Sales Receipt
        </div>

        <div className="sales-receipt-meta">
          <div>
            <strong>Sale number:</strong>{" "}
            {getSaleNumber(selectedSale)}
          </div>

          <div>
            <strong>Date:</strong>{" "}
            {formatDate(selectedSale.created_at)}
          </div>

          {selectedSale.branch_name && (
            <div>
              <strong>Branch:</strong>{" "}
              {selectedSale.branch_name}
            </div>
          )}

          {selectedSale.cashier_name && (
            <div>
              <strong>Cashier:</strong>{" "}
              {selectedSale.cashier_name}
            </div>
          )}

          <div>
            <strong>Payment method:</strong>{" "}
            {(selectedSale.payment_method || "—").toUpperCase()}
          </div>

          <div>
            <strong>Payment status:</strong>{" "}
            {getPaymentStatus(selectedSale)}
          </div>

          <div>
            <strong>Sale status:</strong>{" "}
            {selectedSale.status || "—"}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {(selectedSale.items || []).map((item, index) => (
              <tr key={item.id || `${item.product_id}-${index}`}>
                <td>{item.product_name || "Product"}</td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.price)}</td>
                <td>
                  {formatMoney(
                    item.subtotal ??
                      Number(item.price || 0) *
                        Number(item.quantity || 0)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="sales-receipt-total">
          <span>Total</span>
          <span>{formatMoney(selectedSale.total)}</span>
        </div>

        {selectedSale.payment_method?.toLowerCase() === "mpesa" &&
          selectedSale.payment_status?.toLowerCase() !== "paid" && (
            <div className="sales-receipt-warning">
              M-Pesa payment has not been confirmed. This receipt
              does not confirm successful payment.
            </div>
          )}

        <div className="sales-receipt-actions">
          <button
            type="button"
            className="sales-history-button sales-history-print"
            onClick={() => window.print()}
          >
            Print receipt
          </button>

          <button
            type="button"
            className="sales-history-button sales-receipt-close"
            onClick={() => setSelectedSale(null)}
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

export default SalesHistory;
