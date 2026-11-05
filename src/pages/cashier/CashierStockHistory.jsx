import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { API_BASE } from "../../api/api";
const LIMIT = 50;

function formatDate(value) {
if (!value) return "—";

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
return String(value);
}

return date.toLocaleString("en-KE", {
dateStyle: "medium",
timeStyle: "short",
});
}

function getAuthHeaders() {
const token = localStorage.getItem("cashierToken");

return {
Authorization: `Bearer ${token}`,
};
}

function getRecords(data) {
// Some APIs return the records directly as an array.
if (Array.isArray(data)) {
return data;
}

if (!data || typeof data !== "object") {
return null;
}

// Support common response property names, including "history".
const possibleRecords = [
data.history,
data.movements,
data.stock_movements,
data.stockMovements,
data.records,
data.items,
data.results,
];

for (const records of possibleRecords) {
if (Array.isArray(records)) {
return records;
}
}

return null;
}

export default function CashierStockHistory() {
const [movements, setMovements] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [offset, setOffset] = useState(0);
const [total, setTotal] = useState(0);

const fetchHistory = useCallback(async () => {
const token = localStorage.getItem("cashierToken");


if (!token) {
  setMovements([]);
  setTotal(0);
  setError(
    "Your cashier session has expired. Please log in again."
  );
  setLoading(false);
  return;
}

setLoading(true);
setError("");

try {
  const response = await axios.get(
    `${API_BASE}/cashier/stock/history`,
    {
      headers: getAuthHeaders(),
      params: {
        limit: LIMIT,
        offset,
      },
    }
  );

  const data = response.data;
  const records = getRecords(data);

  // Don't silently display an empty history if the API
  // returns an unexpected response structure.
  if (records === null) {
    console.error(
      "Unexpected cashier stock history response:",
      data
    );

    setMovements([]);
    setTotal(0);
    setError(
      "The server returned an unexpected stock history response. Please check the backend response format."
    );

    return;
  }

  setMovements(records);

  const reportedTotal =
    data && !Array.isArray(data)
      ? Number(data.total ?? data.count)
      : records.length;

  setTotal(
    Number.isFinite(reportedTotal) && reportedTotal >= 0
      ? reportedTotal
      : records.length
  );
} catch (err) {
  console.error(
    "Failed to load cashier stock history:",
    err
  );

  setMovements([]);
  setTotal(0);

  if (
    err.response?.status === 401 ||
    err.response?.status === 403
  ) {
    setError(
      "Your cashier session is invalid or expired. Please log in again."
    );
  } else {
    setError(
      err.response?.data?.message ||
        err.response?.data?.error ||
        "Could not load stock history. Please check your connection and try again."
    );
  }
} finally {
  setLoading(false);
}


}, [offset]);

useEffect(() => {
fetchHistory();
}, [fetchHistory]);

const currentPage = Math.floor(offset / LIMIT) + 1;
const totalPages = Math.max(1, Math.ceil(total / LIMIT));

const totalUnitsAdded = movements.reduce(
(sum, movement) =>
sum + (Number(movement.quantity_added) || 0),
0
);

return ( <main className="container py-4"> <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4"> <div> <h1 className="h2 mb-1">My Stock History</h1>


      <p className="text-muted mb-0">
        Review the stock you have added to the inventory.
      </p>
    </div>

    <div className="d-flex flex-wrap gap-2">
      <Link
        to="/cashier/stock"
        className="btn btn-outline-success"
      >
        <i className="bi bi-plus-circle me-1" />
        Add Stock
      </Link>

      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={fetchHistory}
        disabled={loading}
      >
        <i
          className={`bi ${
            loading
              ? "bi-arrow-repeat"
              : "bi-arrow-clockwise"
          } me-1`}
        />

        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  </div>

  {error && (
    <div className="alert alert-danger" role="alert">
      <strong>Unable to load history.</strong>
      <div className="mt-1">{error}</div>

      <button
        type="button"
        className="btn btn-sm btn-outline-danger mt-3"
        onClick={fetchHistory}
        disabled={loading}
      >
        Try Again
      </button>
    </div>
  )}

  <div className="row g-3 mb-4">
    <div className="col-12 col-md-6">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted small">
            Recorded Restock Entries
          </div>

          <div className="fs-3 fw-bold">
            {total}
          </div>
        </div>
      </div>
    </div>

    <div className="col-12 col-md-6">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted small">
            Units Added on This Page
          </div>

          <div className="fs-3 fw-bold">
            {totalUnitsAdded}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div className="card border-0 shadow-sm">
    <div className="card-header bg-white py-3">
      <h2 className="h5 mb-0">
        Stock Movement Records
      </h2>
    </div>

    <div className="card-body p-0">
      {loading ? (
        <div className="text-center py-5">
          <div
            className="spinner-border text-success"
            role="status"
            aria-label="Loading stock history"
          />

          <p className="text-muted mt-3 mb-0">
            Loading your stock history...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-5 px-3">
          <i className="bi bi-exclamation-circle fs-2 text-danger" />

          <p className="text-muted mt-2 mb-0">
            Stock history could not be loaded.
          </p>
        </div>
      ) : movements.length === 0 ? (
        <div className="text-center py-5 px-3">
          <i className="bi bi-inbox fs-1 text-secondary" />

          <h3 className="h5 mt-3">
            No stock entries yet
          </h3>

          <p className="text-muted">
            When you add stock, your recorded movements
            will appear here.
          </p>

          <Link
            to="/cashier/stock"
            className="btn btn-success"
          >
            Add Stock
          </Link>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Previous Stock</th>
                <th>Quantity Added</th>
                <th>New Stock</th>
                <th>Reference</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {movements.map((movement, index) => (
                <tr
                  key={
                    movement.id ??
                    `${movement.product_id}-${movement.created_at}-${index}`
                  }
                >
                  <td className="text-nowrap">
                    {formatDate(
                      movement.created_at ??
                        movement.timestamp ??
                        movement.date
                    )}
                  </td>

                  <td>
                    <div className="fw-semibold">
                      {movement.product_name ||
                        movement.product?.name ||
                        "Unknown product"}
                    </div>

                    <small className="text-muted">
                      Product ID:{" "}
                      {movement.product_id ??
                        movement.product?.id ??
                        "—"}
                    </small>
                  </td>

                  <td>
                    {movement.previous_stock ?? "—"}
                  </td>

                  <td>
                    <span className="badge text-bg-success">
                      +
                      {movement.quantity_added ??
                        movement.quantity ??
                        0}
                    </span>
                  </td>

                  <td className="fw-semibold">
                    {movement.new_stock ?? "—"}
                  </td>

                  <td>
                    {movement.reference || "—"}
                  </td>

                  <td
                    style={{
                      minWidth: "180px",
                      maxWidth: "280px",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {movement.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {!loading &&
      !error &&
      movements.length > 0 && (
        <div className="card-footer bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
          <small className="text-muted">
            Showing {offset + 1}–
            {offset + movements.length} of {total} entries
          </small>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={offset === 0 || loading}
              onClick={() =>
                setOffset((previous) =>
                  Math.max(0, previous - LIMIT)
                )
              }
            >
              Previous
            </button>

            <span className="small text-muted">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={
                loading ||
                movements.length < LIMIT ||
                offset + movements.length >= total
              }
              onClick={() =>
                setOffset((previous) => previous + LIMIT)
              }
            >
              Next
            </button>
          </div>
        </div>
      )}
  </div>

  <div className="alert alert-info mt-4 mb-0">
    <strong>Accountability note:</strong> This page displays
    stock movements recorded for your cashier account.
    These records provide an audit trail and cannot be edited
    from this page.
  </div>
</main>


);
}
