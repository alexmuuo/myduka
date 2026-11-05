import { useCallback, useEffect, useState } from "react";

import { API_BASE } from "../../api/api";

const DELIVERY_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "dispatched", label: "Dispatched" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
];

const styles = {
  page: {
    maxWidth: "1500px",
    margin: "0 auto",
    padding: "24px",
    color: "#1f2937",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
  },
  subtitle: {
    color: "#6b7280",
    marginTop: "6px",
    marginBottom: 0,
    lineHeight: 1.5,
  },
  button: {
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    cursor: "pointer",
    fontWeight: 600,
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    minWidth: 0,
    padding: "11px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#fff",
    boxSizing: "border-box",
    fontSize: "14px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },
  summaryCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "18px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  summaryLabel: {
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "8px",
  },
  summaryValue: {
    fontSize: "25px",
    fontWeight: 700,
    overflowWrap: "anywhere",
  },
  tableContainer: {
    overflowX: "auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1500px",
  },
  th: {
    textAlign: "left",
    padding: "14px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "top",
    fontSize: "14px",
  },
  badge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
    textTransform: "capitalize",
  },
  error: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "16px",
  },
  success: {
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "16px",
  },
  empty: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#6b7280",
  },
  riderForm: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "190px",
  },
  riderLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#4b5563",
  },
  mutedText: {
    color: "#6b7280",
    fontSize: "12px",
    lineHeight: 1.5,
  },
};

function getBadgeStyle(value) {
  const normalized = String(value || "").toLowerCase();

  if (
    normalized === "delivered" ||
    normalized === "paid" ||
    normalized === "completed"
  ) {
    return { background: "#dcfce7", color: "#166534" };
  }

  if (
    normalized === "dispatched" ||
    normalized === "in_transit" ||
    normalized === "assigned" ||
    normalized === "pending"
  ) {
    return { background: "#fef3c7", color: "#92400e" };
  }

  if (
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "failed"
  ) {
    return { background: "#fee2e2", color: "#991b1b" };
  }

  if (normalized === "unpaid") {
    return { background: "#fee2e2", color: "#991b1b" };
  }

  return { background: "#e5e7eb", color: "#374151" };
}

function Badge({ value }) {
  const label = value
    ? String(value).replaceAll("_", " ")
    : "Not specified";

  return (
    <span style={{ ...styles.badge, ...getBadgeStyle(value) }}>
      {label}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatMoney(value) {
  const amount = Number(value);

  return `KSh ${
    Number.isFinite(amount)
      ? amount.toLocaleString("en-KE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00"
  }`;
}

function getCustomer(order) {
  const customer = order?.customer;

  if (!customer || typeof customer !== "object") {
    return {};
  }

  return customer;
}

function getOrderStatus(order) {
  return String(order?.status || "").toLowerCase();
}

function isCancelledOrder(order) {
  return ["cancelled", "canceled"].includes(getOrderStatus(order));
}

export default function CashierDeliveries() {
  const [deliveries, setDeliveries] = useState([]);

  const [deliveryStatus, setDeliveryStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [pendingStatuses, setPendingStatuses] = useState({});
  const [riderForms, setRiderForms] = useState({});
  const [savingOrderId, setSavingOrderId] = useState(null);

  const loadDeliveries = useCallback(
    async (showInitialLoading = true) => {
      const token = localStorage.getItem("cashierToken");

      if (!token) {
        setError("Your cashier session is missing. Please log in again.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showInitialLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      try {
        const params = new URLSearchParams();

        if (deliveryStatus !== "all") {
          params.set("delivery_status", deliveryStatus);
        }

        if (paymentStatus !== "all") {
          params.set("payment_status", paymentStatus);
        }

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const query = params.toString();

        const response = await fetch(
          `${API_BASE}/cashier/deliveries${query ? `?${query}` : ""}`,
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
          throw new Error(
            data.message ||
              "Your cashier session has expired. Please log in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            data.message ||
              "You are not authorized to access these deliveries."
          );
        }

        if (!response.ok || data.status !== "success") {
          throw new Error(data.message || "Unable to load deliveries.");
        }

        if (!Array.isArray(data.deliveries)) {
          throw new Error(
            "The server returned an unexpected deliveries response."
          );
        }

        setDeliveries(data.deliveries);

        setPendingStatuses((previous) => {
          const next = { ...previous };

          data.deliveries.forEach((order) => {
            const serverStatus = String(
              order.delivery_status || "pending"
            ).toLowerCase();

            if (
              next[order.id] === undefined ||
              next[order.id] === serverStatus
            ) {
              next[order.id] = serverStatus;
            }
          });

          return next;
        });

        setRiderForms((previous) => {
          const next = { ...previous };

          data.deliveries.forEach((order) => {
            const existingForm = next[order.id];

            // Populate from the server on first load. When the saved
            // rider changes on the server, refresh the form accordingly.
            if (
              !existingForm ||
              (existingForm.delivery_person ===
                String(order.delivery_person || "") &&
                existingForm.delivery_phone ===
                  String(order.delivery_phone || ""))
            ) {
              next[order.id] = {
                delivery_person: String(order.delivery_person || ""),
                delivery_phone: String(order.delivery_phone || ""),
              };
            }
          });

          return next;
        });

        setLastUpdated(new Date());
      } catch (err) {
        console.error("Cashier deliveries error:", err);
        setError(err.message || "Unable to load deliveries.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [deliveryStatus, paymentStatus, search]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadDeliveries(true);
    }, search ? 300 : 0);

    return () => clearTimeout(timeout);
  }, [loadDeliveries, search]);

  const handleRiderChange = (orderId, field, value) => {
    setRiderForms((previous) => ({
      ...previous,
      [orderId]: {
        delivery_person:
          previous[orderId]?.delivery_person || "",
        delivery_phone:
          previous[orderId]?.delivery_phone || "",
        [field]: value,
      },
    }));

    setError("");
    setNotice("");
  };

  const assignRider = async (order) => {
    if (isCancelledOrder(order)) {
      setError("A rider cannot be assigned to a cancelled order.");
      return;
    }

    const form = riderForms[order.id] || {
      delivery_person: String(order.delivery_person || ""),
      delivery_phone: String(order.delivery_phone || ""),
    };

    const deliveryPerson = String(form.delivery_person || "").trim();
    const deliveryPhone = String(form.delivery_phone || "").trim();

    if (!deliveryPerson) {
      setError("Enter the delivery person's name before assigning the rider.");
      return;
    }

    if (!deliveryPhone) {
      setError("Enter the delivery person's phone number before assigning the rider.");
      return;
    }

    const existingPerson = String(order.delivery_person || "").trim();
    const existingPhone = String(order.delivery_phone || "").trim();

    if (
      deliveryPerson === existingPerson &&
      deliveryPhone === existingPhone
    ) {
      setNotice("The assigned rider details have not changed.");
      setError("");
      return;
    }

    const confirmed = window.confirm(
      `Assign ${deliveryPerson} (${deliveryPhone}) to delivery ${
        order.order_number || `#${order.id}`
      }?`
    );

    if (!confirmed) return;

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
        `${API_BASE}/cashier/orders/${order.id}/delivery/assign`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            delivery_person: deliveryPerson,
            delivery_phone: deliveryPhone,
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
          data.message ||
            "You are not authorized to assign this delivery."
        );
      }

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Unable to assign the delivery person.");
      }

      setNotice(
        `Delivery person ${deliveryPerson} assigned successfully to ${
          order.order_number || `#${order.id}`
        }.`
      );

      await loadDeliveries(false);
    } catch (err) {
      console.error("Delivery rider assignment error:", err);
      setError(err.message || "Unable to assign the delivery person.");
    } finally {
      setSavingOrderId(null);
    }
  };

  const updateDeliveryStatus = async (order) => {
    const selectedStatus = pendingStatuses[order.id];

    const currentStatus = String(
      order.delivery_status || "pending"
    ).toLowerCase();

    if (!selectedStatus || selectedStatus === currentStatus) {
      return;
    }

    if (isCancelledOrder(order)) {
      setError("Delivery status cannot be changed for a cancelled order.");
      return;
    }

    if (
      ["dispatched", "in_transit", "delivered"].includes(selectedStatus) &&
      !String(order.delivery_person || "").trim()
    ) {
      setError(
        "Assign a delivery person before moving this delivery to dispatched, in transit, or delivered."
      );
      return;
    }

    const confirmed = window.confirm(
      `Update delivery ${
        order.order_number || `#${order.id}`
      } from "${currentStatus.replaceAll("_", " ")}" to "${selectedStatus.replaceAll(
        "_",
        " "
      )}"?`
    );

    if (!confirmed) {
      setPendingStatuses((previous) => ({
        ...previous,
        [order.id]: currentStatus,
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
        `${API_BASE}/cashier/orders/${order.id}/delivery/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            delivery_status: selectedStatus,
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
          data.message ||
            "You are not authorized to update this delivery."
        );
      }

      if (!response.ok || data.status !== "success") {
        throw new Error(
          data.message || "Unable to update delivery status."
        );
      }

      setNotice(
        `Delivery ${order.order_number || `#${order.id}`} updated successfully.`
      );

      await loadDeliveries(false);
    } catch (err) {
      console.error("Delivery status update error:", err);

      setError(err.message || "Unable to update delivery status.");

      setPendingStatuses((previous) => ({
        ...previous,
        [order.id]: currentStatus,
      }));
    } finally {
      setSavingOrderId(null);
    }
  };

  const totalValue = deliveries.reduce(
    (sum, order) => sum + (Number(order.total) || 0),
    0
  );

  const pendingCount = deliveries.filter(
    (order) =>
      String(order.delivery_status || "pending").toLowerCase() === "pending"
  ).length;

  const deliveredCount = deliveries.filter(
    (order) =>
      String(order.delivery_status || "").toLowerCase() === "delivered"
  ).length;

  const assignedCount = deliveries.filter(
    (order) => String(order.delivery_person || "").trim() !== ""
  ).length;

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Delivery Records</h1>

          <p style={styles.subtitle}>
            View delivery orders, assign riders, and update delivery progress.
            Changes are shared with the admin dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDeliveries(false)}
          disabled={refreshing || savingOrderId !== null}
          style={{
            ...styles.button,
            background: "#166534",
            color: "#fff",
            opacity: refreshing ? 0.7 : 1,
            cursor:
              refreshing || savingOrderId !== null
                ? "not-allowed"
                : "pointer",
          }}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </header>

      {error && (
        <div style={styles.error} role="alert">
          <strong>Delivery operation failed.</strong>

          <div style={{ marginTop: "6px" }}>{error}</div>

          <button
            type="button"
            onClick={() => setError("")}
            style={{
              ...styles.button,
              marginTop: "8px",
              background: "transparent",
              border: "1px solid currentColor",
              color: "inherit",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {notice && (
        <div style={styles.success} role="status">
          {notice}

          <button
            type="button"
            onClick={() => setNotice("")}
            style={{
              ...styles.button,
              marginLeft: "12px",
              background: "transparent",
              border: "1px solid currentColor",
              color: "inherit",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <section style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Matching Deliveries</div>
          <div style={styles.summaryValue}>{deliveries.length}</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Pending Deliveries</div>
          <div style={styles.summaryValue}>{pendingCount}</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Riders Assigned</div>
          <div style={styles.summaryValue}>{assignedCount}</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Delivered</div>
          <div style={styles.summaryValue}>{deliveredCount}</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Value of Matching Orders</div>
          <div style={{ ...styles.summaryValue, fontSize: "22px" }}>
            {formatMoney(totalValue)}
          </div>
        </div>
      </section>

      <section style={styles.filters}>
        <input
          type="search"
          placeholder="Search order, customer, phone, location..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={styles.input}
          aria-label="Search delivery records"
        />

        <select
          value={deliveryStatus}
          onChange={(event) => setDeliveryStatus(event.target.value)}
          style={styles.input}
          aria-label="Filter by delivery status"
        >
          <option value="all">All delivery statuses</option>

          {DELIVERY_STATUSES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={paymentStatus}
          onChange={(event) => setPaymentStatus(event.target.value)}
          style={styles.input}
          aria-label="Filter by payment status"
        >
          <option value="all">All payment statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="pending">Pending payment</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
      </section>

      <div
        style={{
          color: "#6b7280",
          fontSize: "13px",
          marginBottom: "12px",
        }}
      >
        {lastUpdated
          ? `Last updated: ${lastUpdated.toLocaleTimeString("en-KE")}`
          : "Delivery information has not been loaded yet."}
      </div>

      <section style={styles.tableContainer}>
        {loading && deliveries.length === 0 ? (
          <div style={styles.empty}>Loading delivery records...</div>
        ) : deliveries.length === 0 ? (
          <div style={styles.empty}>
            <h3 style={{ marginTop: 0, color: "#374151" }}>
              No delivery records found
            </h3>

            <p>
              Try changing the filters, or refresh after a delivery order has
              been created.
            </p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {[
                  "Order",
                  "Customer",
                  "Delivery Location",
                  "Assign Delivery Person",
                  "Order Total",
                  "Payment",
                  "Current Delivery Status",
                  "Update Delivery",
                  "Created",
                ].map((heading) => (
                  <th key={heading} style={styles.th}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {deliveries.map((order) => {
                const customer = getCustomer(order);

                const currentStatus = String(
                  order.delivery_status || "pending"
                ).toLowerCase();

                const isCancelled = isCancelledOrder(order);
                const isSaving = savingOrderId === order.id;

                const selectedStatus =
                  pendingStatuses[order.id] ?? currentStatus;

                const riderForm = riderForms[order.id] || {
                  delivery_person: String(order.delivery_person || ""),
                  delivery_phone: String(order.delivery_phone || ""),
                };

                const riderAssigned =
                  String(order.delivery_person || "").trim() !== "";

                return (
                  <tr key={order.id}>
                    <td style={styles.td}>
                      <strong>
                        {order.order_number || `Order #${order.id}`}
                      </strong>

                      <div
                        style={{
                          color: "#6b7280",
                          fontSize: "12px",
                          marginTop: "5px",
                        }}
                      >
                        ID: {order.id}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <strong>
                        {customer.name ||
                          customer.full_name ||
                          "Walk-in / Unknown"}
                      </strong>

                      <div style={{ marginTop: "5px", color: "#6b7280" }}>
                        {customer.phone || "No phone recorded"}
                      </div>

                      {customer.email && (
                        <div
                          style={{
                            marginTop: "3px",
                            color: "#6b7280",
                            fontSize: "12px",
                          }}
                        >
                          {customer.email}
                        </div>
                      )}
                    </td>

                    <td style={styles.td}>
                      {order.delivery_location || "Not specified"}

                      {order.delivery_notes && (
                        <div
                          style={{
                            color: "#6b7280",
                            marginTop: "5px",
                            maxWidth: "220px",
                          }}
                        >
                          {order.delivery_notes}
                        </div>
                      )}
                    </td>

                    <td style={styles.td}>
                      <div style={styles.riderForm}>
                        <label
                          style={styles.riderLabel}
                          htmlFor={`rider-name-${order.id}`}
                        >
                          Rider name
                        </label>

                        <input
                          id={`rider-name-${order.id}`}
                          type="text"
                          autoComplete="name"
                          placeholder="Enter rider name"
                          value={riderForm.delivery_person}
                          disabled={isSaving || isCancelled}
                          maxLength={150}
                          onChange={(event) =>
                            handleRiderChange(
                              order.id,
                              "delivery_person",
                              event.target.value
                            )
                          }
                          style={styles.input}
                        />

                        <label
                          style={styles.riderLabel}
                          htmlFor={`rider-phone-${order.id}`}
                        >
                          Rider phone
                        </label>

                        <input
                          id={`rider-phone-${order.id}`}
                          type="tel"
                          autoComplete="tel"
                          placeholder="e.g. 07XXXXXXXX"
                          value={riderForm.delivery_phone}
                          disabled={isSaving || isCancelled}
                          maxLength={50}
                          onChange={(event) =>
                            handleRiderChange(
                              order.id,
                              "delivery_phone",
                              event.target.value
                            )
                          }
                          style={styles.input}
                        />

                        {riderAssigned && (
                          <div style={styles.mutedText}>
                            Currently assigned: {order.delivery_person}
                            {order.delivery_phone
                              ? ` · ${order.delivery_phone}`
                              : ""}
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={isSaving || isCancelled}
                          onClick={() => assignRider(order)}
                          style={{
                            ...styles.button,
                            background: "#1d4ed8",
                            color: "#fff",
                            opacity:
                              isSaving || isCancelled ? 0.5 : 1,
                            cursor:
                              isSaving || isCancelled
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {isSaving
                            ? "Saving..."
                            : riderAssigned
                            ? "Save rider"
                            : "Assign rider"}
                        </button>

                        {isCancelled && (
                          <small style={{ color: "#b91c1c" }}>
                            Cannot assign a rider to a cancelled order.
                          </small>
                        )}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <strong>{formatMoney(order.total)}</strong>
                    </td>

                    <td style={styles.td}>
                      <Badge value={order.payment_status} />

                      <div style={{ marginTop: "7px" }}>
                        {order.payment_method || "Not specified"}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <Badge value={currentStatus} />
                    </td>

                    <td style={styles.td}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          minWidth: "165px",
                        }}
                      >
                        <select
                          value={selectedStatus}
                          aria-label={`New delivery status for order ${
                            order.order_number || order.id
                          }`}
                          disabled={isSaving || isCancelled}
                          onChange={(event) => {
                            setPendingStatuses((previous) => ({
                              ...previous,
                              [order.id]: event.target.value,
                            }));

                            setError("");
                            setNotice("");
                          }}
                          style={styles.input}
                        >
                          {DELIVERY_STATUSES.map((item) => (
                            <option
                              key={item.value}
                              value={item.value}
                              disabled={
                                currentStatus === "delivered" &&
                                item.value !== "delivered"
                              }
                            >
                              {item.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={
                            isSaving ||
                            isCancelled ||
                            selectedStatus === currentStatus ||
                            currentStatus === "delivered"
                          }
                          onClick={() => updateDeliveryStatus(order)}
                          style={{
                            ...styles.button,
                            background: "#166534",
                            color: "#fff",
                            opacity:
                              isSaving ||
                              isCancelled ||
                              selectedStatus === currentStatus ||
                              currentStatus === "delivered"
                                ? 0.5
                                : 1,
                            cursor:
                              isSaving ||
                              isCancelled ||
                              currentStatus === "delivered"
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {isSaving ? "Saving..." : "Save status"}
                        </button>

                        {isCancelled && (
                          <small style={{ color: "#b91c1c" }}>
                            Order cancelled.
                          </small>
                        )}

                        {currentStatus === "delivered" && (
                          <small style={{ color: "#166534" }}>
                            Delivery completed.
                          </small>
                        )}
                      </div>
                    </td>

                    <td style={styles.td}>{formatDate(order.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <p
        style={{
          color: "#6b7280",
          fontSize: "13px",
          lineHeight: 1.6,
          marginTop: "14px",
        }}
      >
        Rider assignments and delivery status changes are saved through the
        hosted backend. Assigning a rider does not mark an order as paid.
        Payment status remains controlled by the payment workflow.
      </p>
    </main>
  );
}

