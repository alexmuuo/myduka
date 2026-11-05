import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { API_BASE } from "../../api/api";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ value }) {
  const normalized = String(value || "unknown").toLowerCase();

  const colors = {
    pending: "#fff3cd",
    confirmed: "#cfe2ff",
    processing: "#cfe2ff",
    ready: "#d1e7dd",
    completed: "#d1e7dd",
    delivered: "#d1e7dd",
    paid: "#d1e7dd",
    unpaid: "#f8d7da",
    failed: "#f8d7da",
    cancelled: "#f8d7da",
    refunded: "#e2e3e5",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: "20px",
        background: colors[normalized] || "#e9ecef",
        color: "#343a40",
        fontSize: "12px",
        fontWeight: 600,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {String(value || "Unknown").replaceAll("_", " ")}
    </span>
  );
}

function CashierOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [savingOrderId, setSavingOrderId] = useState(null);
  const [pendingStatuses, setPendingStatuses] = useState({});
  const [notice, setNotice] = useState("");

  const fetchOrders = useCallback(
    async (showLoading = true) => {
      const token = localStorage.getItem("cashierToken");

      if (!token) {
        setError("Your cashier session is missing. Please log in again.");
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      try {
        const params = new URLSearchParams();

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (status !== "all") {
          params.set("status", status);
        }

        if (paymentStatus !== "all") {
          params.set("payment_status", paymentStatus);
        }

        const query = params.toString();

        const response = await fetch(
          `${API_BASE}/cashier/orders${query ? `?${query}` : ""}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          setError(
            data.message ||
              "Your cashier session has expired. Please log in again."
          );
          setOrders([]);
          return;
        }

        if (response.status === 403) {
          throw new Error(
            data.message || "You are not authorized to view these orders."
          );
        }

        if (!response.ok || data.status !== "success") {
          throw new Error(data.message || "Unable to load orders.");
        }

        const fetchedOrders = Array.isArray(data.orders)
          ? data.orders
          : [];

        setOrders(fetchedOrders);

        setPendingStatuses((previous) => {
          const next = { ...previous };

          fetchedOrders.forEach((order) => {
            if (
              next[order.id] === undefined ||
              next[order.id] === order.status
            ) {
              next[order.id] = order.status || "pending";
            }
          });

          return next;
        });
      } catch (err) {
        console.error("Cashier orders error:", err);
        setError(
          err.message ||
            "Unable to load orders. Check that the backend is running."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, status, paymentStatus]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const updateOrderStatus = async (order) => {
    const selectedStatus = pendingStatuses[order.id];

    if (!selectedStatus || selectedStatus === order.status) {
      return;
    }

    if (
      String(order.status).toLowerCase() === "cancelled" &&
      selectedStatus !== "cancelled"
    ) {
      setError("Cancelled orders cannot be reopened.");
      return;
    }

    if (
      selectedStatus === "cancelled" &&
      String(order.payment_status).toLowerCase() === "paid"
    ) {
      setError(
        "This order is already paid. Paid orders cannot be cancelled here."
      );
      return;
    }

    const confirmed = window.confirm(
      `Change order ${order.order_number || `#${order.id}`} from "${
        order.status || "unknown"
      }" to "${selectedStatus}"?`
    );

    if (!confirmed) {
      setPendingStatuses((previous) => ({
        ...previous,
        [order.id]: order.status || "pending",
      }));
      return;
    }

    const token = localStorage.getItem("cashierToken");

    if (!token) {
      setError("Your cashier session is missing. Please log in again.");
      return;
    }

    setSavingOrderId(order.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_BASE}/cashier/orders/${order.id}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedStatus,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error(
          data.message ||
            "Your cashier session has expired. Please log in again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          data.message || "You are not authorized to update this order."
        );
      }

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Unable to update order status.");
      }

      setNotice(
        `Order ${order.order_number || `#${order.id}`} updated successfully.`
      );

      // Refresh the server's authoritative data after a successful update.
      await fetchOrders(false);
    } catch (err) {
      console.error("Order status update error:", err);
      setError(err.message || "Unable to update order status.");

      setPendingStatuses((previous) => ({
        ...previous,
        [order.id]: order.status || "pending",
      }));
    } finally {
      setSavingOrderId(null);
    }
  };

  const totalValue = orders.reduce(
    (sum, order) => sum + (Number(order.total) || 0),
    0
  );

  const paidCount = orders.filter(
    (order) => String(order.payment_status).toLowerCase() === "paid"
  ).length;

  return (
    <main
      style={{
        maxWidth: "1500px",
        margin: "0 auto",
        padding: "24px",
        color: "#212529",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "28px" }}>Orders</h1>
          <p style={{ color: "#6c757d", margin: "8px 0 0" }}>
            View orders and update order progress.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link to="/cashier/pos" style={secondaryButton}>
            Back to POS
          </Link>

          <Link to="/cashier/deliveries" style={primaryButton}>
            Deliveries
          </Link>

          <button
            type="button"
            onClick={() => fetchOrders(false)}
            disabled={refreshing || savingOrderId !== null}
            style={{
              ...secondaryButton,
              opacity: refreshing ? 0.65 : 1,
            }}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div style={errorBox} role="alert">
          <strong>Order operation failed.</strong>
          <div style={{ marginTop: "6px" }}>{error}</div>
          <button
            type="button"
            onClick={() => setError("")}
            style={dismissButton}
          >
            Dismiss
          </button>
        </div>
      )}

      {notice && (
        <div style={successBox} role="status">
          {notice}
          <button
            type="button"
            onClick={() => setNotice("")}
            style={dismissButton}
          >
            Dismiss
          </button>
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <SummaryCard
          title="Orders shown"
          value={orders.length}
          detail="Matching current filters"
        />

        <SummaryCard
          title="Paid orders"
          value={paidCount}
          detail="Payment status confirmed as paid"
        />

        <SummaryCard
          title="Value shown"
          value={formatCurrency(totalValue)}
          detail="Combined value of displayed orders"
        />
      </section>

      <section style={panelStyle}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
          }}
        >
          <label style={labelStyle}>
            Search orders
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Order number or customer..."
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Order status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              style={inputStyle}
            >
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Payment status
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
              style={inputStyle}
            >
              <option value="all">All payment statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </label>
        </div>
      </section>

      <section style={{ ...panelStyle, marginTop: "20px" }}>
        {loading ? (
          <div style={emptyState}>Loading orders…</div>
        ) : orders.length === 0 ? (
          <div style={emptyState}>
            <h3 style={{ marginTop: 0 }}>No orders found</h3>
            <p style={{ marginBottom: 0, color: "#6c757d" }}>
              Try changing your filters or search terms.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1250px",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Order",
                    "Customer",
                    "Type",
                    "Items",
                    "Total",
                    "Payment",
                    "Current status",
                    "Update status",
                    "Date",
                  ].map((heading) => (
                    <th key={heading} style={thStyle}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => {
                  const customer = order.customer || {};
                  const items = Array.isArray(order.items)
                    ? order.items
                    : [];

                  const itemCount = items.reduce(
                    (sum, item) => sum + (Number(item.quantity) || 0),
                    0
                  );

                  const currentStatus = String(
                    order.status || "pending"
                  ).toLowerCase();

                  const isCancelled = currentStatus === "cancelled";
                  const isSaving = savingOrderId === order.id;

                  return (
                    <tr key={order.id}>
                      <td style={tdStyle}>
                        <strong>
                          {order.order_number || `#${order.id}`}
                        </strong>
                        <div style={mutedText}>ID: {order.id}</div>
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {customer.name || customer.full_name || "Customer"}
                        </strong>

                        {customer.phone && (
                          <div style={mutedText}>{customer.phone}</div>
                        )}

                        {customer.email && (
                          <div style={mutedText}>{customer.email}</div>
                        )}
                      </td>

                      <td style={tdStyle}>
                        <span style={{ textTransform: "capitalize" }}>
                          {String(order.order_type || "—").replaceAll(
                            "_",
                            " "
                          )}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <strong>{itemCount}</strong>
                        <div style={mutedText}>
                          {items.length} product type
                          {items.length === 1 ? "" : "s"}
                        </div>

                        {items.length > 0 && (
                          <details style={{ marginTop: "6px" }}>
                            <summary
                              style={{
                                cursor: "pointer",
                                color: "#0d6efd",
                              }}
                            >
                              View items
                            </summary>

                            <ul
                              style={{
                                paddingLeft: "18px",
                                marginBottom: 0,
                              }}
                            >
                              {items.map((item, index) => (
                                <li key={item.id || index}>
                                  {item.product_name || "Product"} ×{" "}
                                  {item.quantity} (
                                  {formatCurrency(item.subtotal)})
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </td>

                      <td style={tdStyle}>
                        <strong>{formatCurrency(order.total)}</strong>
                      </td>

                      <td style={tdStyle}>
                        <StatusBadge value={order.payment_status} />
                        <div style={mutedText}>
                          {order.payment_method || "—"}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <StatusBadge value={order.status} />
                      </td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            minWidth: "155px",
                          }}
                        >
                          <select
                            aria-label={`New status for order ${
                              order.order_number || order.id
                            }`}
                            value={
                              pendingStatuses[order.id] ?? currentStatus
                            }
                            onChange={(event) => {
                              setPendingStatuses((previous) => ({
                                ...previous,
                                [order.id]: event.target.value,
                              }));
                              setError("");
                              setNotice("");
                            }}
                            disabled={isSaving || isCancelled}
                            style={inputStyle}
                          >
                            {ORDER_STATUSES.map((item) => (
                              <option
                                key={item.value}
                                value={item.value}
                                disabled={
                                  isCancelled && item.value !== "cancelled"
                                }
                              >
                                {item.label}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order)}
                            disabled={
                              isSaving ||
                              isCancelled ||
                              (pendingStatuses[order.id] ?? currentStatus) ===
                                currentStatus
                            }
                            style={{
                              ...primaryButton,
                              opacity:
                                isSaving ||
                                isCancelled ||
                                (pendingStatuses[order.id] ??
                                  currentStatus) === currentStatus
                                  ? 0.55
                                  : 1,
                              cursor:
                                isSaving || isCancelled
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {isSaving ? "Saving…" : "Save status"}
                          </button>

                          {isCancelled && (
                            <small style={{ color: "#842029" }}>
                              Cancelled orders cannot be reopened.
                            </small>
                          )}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p style={{ color: "#6c757d", fontSize: "13px", marginTop: "16px" }}>
        Status updates are validated by the backend. Cashiers cannot use this
        page to confirm electronic payments, and paid orders cannot be
        cancelled.
      </p>
    </main>
  );
}

function SummaryCard({ title, value, detail }) {
  return (
    <div
      style={{
        padding: "20px",
        background: "#fff",
        border: "1px solid #dee2e6",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}
    >
      <div style={{ color: "#6c757d", fontSize: "14px" }}>{title}</div>

      <div
        style={{
          fontSize: "25px",
          fontWeight: 700,
          margin: "8px 0",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>

      <div style={{ color: "#6c757d", fontSize: "12px" }}>{detail}</div>
    </div>
  );
}

const panelStyle = {
  background: "#fff",
  border: "1px solid #dee2e6",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  fontSize: "14px",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #ced4da",
  borderRadius: "8px",
  background: "#fff",
  fontSize: "14px",
};

const primaryButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #0d6efd",
  background: "#0d6efd",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
};

const secondaryButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #ced4da",
  background: "#fff",
  color: "#212529",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
};

const errorBox = {
  padding: "14px 16px",
  border: "1px solid #f5c2c7",
  borderRadius: "8px",
  background: "#f8d7da",
  color: "#842029",
  marginBottom: "20px",
};

const successBox = {
  padding: "14px 16px",
  border: "1px solid #a3cfbb",
  borderRadius: "8px",
  background: "#d1e7dd",
  color: "#0f5132",
  marginBottom: "20px",
};

const dismissButton = {
  display: "block",
  marginTop: "8px",
  padding: "5px 9px",
  border: "1px solid currentColor",
  borderRadius: "6px",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};

const emptyState = {
  padding: "50px 20px",
  textAlign: "center",
  color: "#495057",
};

const thStyle = {
  padding: "13px 12px",
  textAlign: "left",
  background: "#f8f9fa",
  borderBottom: "1px solid #dee2e6",
  fontSize: "13px",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid #edf0f2",
  fontSize: "13px",
  verticalAlign: "top",
};

const mutedText = {
  color: "#6c757d",
  fontSize: "12px",
  marginTop: "4px",
  overflowWrap: "anywhere",
};

export default CashierOrders;

