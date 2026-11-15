import { Link, useLocation, useParams } from "react-router-dom";

const styles = `
.md-order-details {
  min-height: 75vh;
  padding: 32px 18px 60px;
  color: var(--text-primary, #172033);
  background: var(--background-color, transparent);
}

.md-order-details * { box-sizing: border-box; }

.md-order-details-inner {
  width: min(1050px, 100%);
  margin: 0 auto;
}

.md-order-details-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 25px;
}

.md-order-details-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--accent-color, #635bff);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 1.2px;
  text-transform: uppercase;
}

.md-order-details-header h1 {
  margin: 0 0 8px;
  font-size: clamp(26px, 4vw, 35px);
  font-weight: 850;
  letter-spacing: -1px;
}

.md-order-details-header p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
  line-height: 1.7;
}

.md-order-details-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 10px 14px;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 10px;
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
  text-decoration: none;
  font-size: 12px;
  font-weight: 750;
}

.md-order-details-back:hover {
  border-color: var(--accent-color, #635bff);
  color: var(--accent-color, #635bff);
}

.md-order-details-card {
  overflow: hidden;
  margin-bottom: 17px;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 15px;
  background: var(--surface-color, #fff);
}

.md-order-details-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 19px 22px;
  border-bottom: 1px solid var(--border-color, #e7eaf0);
}

.md-order-details-card-header h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 850;
}

.md-order-details-card-body {
  padding: 22px;
}

.md-order-details-number {
  margin-top: 6px;
  color: var(--accent-color, #635bff);
  font-size: 20px;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.md-order-details-label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-secondary, #64748b);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .7px;
  text-transform: uppercase;
}

.md-order-details-value {
  font-size: 13px;
  font-weight: 750;
  overflow-wrap: anywhere;
}

.md-order-details-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.md-order-details-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
  text-transform: capitalize;
}

.md-order-details-badge.success {
  background: #eaf8ef;
  color: #16803d;
}

.md-order-details-badge.warning {
  background: #fff7e6;
  color: #996515;
}

.md-order-details-badge.danger {
  background: #fff0f0;
  color: #c53030;
}

.md-order-details-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 15px 0;
  border-bottom: 1px solid var(--border-color, #e7eaf0);
}

.md-order-details-item:last-child {
  border-bottom: 0;
}

.md-order-details-item-name {
  font-size: 13px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.md-order-details-item-meta {
  margin-top: 5px;
  color: var(--text-secondary, #64748b);
  font-size: 11px;
}

.md-order-details-item-total {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 850;
  text-align: right;
}

.md-order-details-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding-top: 18px;
  border-top: 1px solid var(--border-color, #e7eaf0);
}

.md-order-details-total span {
  font-size: 13px;
  font-weight: 850;
}

.md-order-details-total strong {
  color: var(--accent-color, #635bff);
  font-size: 21px;
  font-weight: 900;
}

.md-order-details-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.md-order-details-empty {
  max-width: 570px;
  margin: 45px auto;
  padding: 39px 25px;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 17px;
  background: var(--surface-color, #fff);
  text-align: center;
}

.md-order-details-empty-icon {
  display: grid;
  width: 70px;
  height: 70px;
  place-items: center;
  margin: 0 auto 19px;
  border-radius: 21px;
  background: var(--surface-secondary, #f1f5f9);
  color: var(--accent-color, #635bff);
  font-size: 27px;
}

.md-order-details-empty h2 {
  margin: 0 0 9px;
  font-size: 20px;
  font-weight: 850;
}

.md-order-details-empty p {
  margin: 0 auto 22px;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.8;
}

.md-order-details-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;
}

.md-order-details-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 9px;
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
  text-decoration: none;
  font-size: 12px;
  font-weight: 800;
}

.md-order-details-button.primary {
  border-color: var(--accent-color, #635bff);
  background: var(--accent-color, #635bff);
  color: #fff;
}

.md-order-details-button:hover {
  border-color: var(--accent-color, #635bff);
  color: var(--accent-color, #635bff);
}

.md-order-details-button.primary:hover {
  color: #fff;
  filter: brightness(.95);
}

.md-order-details-note {
  margin-top: 17px;
  padding: 14px 16px;
  border: 1px solid #cbdcf4;
  border-radius: 10px;
  background: #f4f8ff;
  color: #365b91;
  font-size: 11px;
  line-height: 1.7;
}

@media (max-width: 620px) {
  .md-order-details { padding: 23px 14px 45px; }

  .md-order-details-header {
    flex-direction: column;
  }

  .md-order-details-back { width: 100%; }

  .md-order-details-card-header,
  .md-order-details-card-body {
    padding: 17px;
  }

  .md-order-details-meta,
  .md-order-details-info-grid {
    grid-template-columns: 1fr;
    gap: 17px;
  }

  .md-order-details-item { gap: 12px; }

  .md-order-details-total strong { font-size: 18px; }
}
`;

const formatMoney = (value) =>
  `KSh ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const readable = (value) =>
  String(value || "Not provided").replace(/_/g, " ");

function statusClass(status) {
  const value = String(status || "").toLowerCase();

  if (["paid", "completed", "delivered"].includes(value)) return "success";
  if (["failed", "cancelled", "refunded"].includes(value)) return "danger";

  return "warning";
}

function getCustomer() {
  try {
    const token = localStorage.getItem("customerToken");
    const customer = JSON.parse(localStorage.getItem("customer") || "null");

    return token && customer?.id ? customer : null;
  } catch {
    return null;
  }
}

export default function OrderDetails() {
  const { id } = useParams();
  const location = useLocation();

  const customer = getCustomer();
  const order = location.state?.order || null;

  if (!customer) {
    return (
      <>
        <style>{styles}</style>
        <main className="md-order-details">
          <section className="md-order-details-empty">
            <div className="md-order-details-empty-icon">
              <i className="bi bi-person-lock" />
            </div>
            <h2>Sign in to view this order</h2>
            <p>
              Your order details are available through your customer account.
              Sign in to continue.
            </p>
            <Link
              to="/login"
              className="md-order-details-button primary"
            >
              Sign in
            </Link>
          </section>
        </main>
      </>
    );
  }

  if (!order || String(order.id) !== String(id)) {
    return (
      <>
        <style>{styles}</style>
        <main className="md-order-details">
          <div className="md-order-details-inner">
            <header className="md-order-details-header">
              <div>
                <span className="md-order-details-eyebrow">
                  <i className="bi bi-receipt" />
                  Order details
                </span>
                <h1>Order information</h1>
                <p>Reference: {id}</p>
              </div>
              <Link
                to="/account/orders"
                className="md-order-details-back"
              >
                <i className="bi bi-arrow-left" />
                My orders
              </Link>
            </header>

            <section className="md-order-details-empty">
              <div className="md-order-details-empty-icon">
                <i className="bi bi-file-earmark-excel" />
              </div>
              <h2>Order details unavailable</h2>
              <p>
                This page needs the saved order record to display its
                information. Open the order from your order history once
                customer order retrieval is connected.
              </p>
              <div className="md-order-details-actions">
                <Link
                  to="/account/orders"
                  className="md-order-details-button primary"
                >
                  <i className="bi bi-bag-check" />
                  Back to my orders
                </Link>
                <Link
                  to="/track-order"
                  className="md-order-details-button"
                >
                  Track an order
                </Link>
              </div>
            </section>
          </div>
        </main>
      </>
    );
  }

  const orderNumber =
    order.order_number || order.orderNumber || order.id;

  const orderStatus = order.status || "pending";
  const paymentStatus =
    order.payment_status || order.paymentStatus || "unpaid";

  const paymentMethod =
    order.payment_method || order.paymentMethod ||
    order.customer?.paymentMethod;

  const items = Array.isArray(order.items) ? order.items : [];

  const total = Number(order.total ?? order.total_amount ?? 0);

  const customerDetails = order.customer || {};

  const customerName =
    customerDetails.name || customer.name || "Customer";

  const customerPhone =
    customerDetails.phone || order.phone || "Not provided";

  const orderType =
    order.order_type || customerDetails.orderType;

  const deliveryLocation =
    order.delivery_location ||
    order.deliveryLocation ||
    customerDetails.location;

  const createdAt = order.created_at || order.createdAt;

  return (
    <>
      <style>{styles}</style>

      <main className="md-order-details">
        <div className="md-order-details-inner">
          <header className="md-order-details-header">
            <div>
              <span className="md-order-details-eyebrow">
                <i className="bi bi-receipt" />
                Order details
              </span>
              <h1>Your order</h1>
              <p>Review the items and information for this purchase.</p>
            </div>

            <Link
              to="/account/orders"
              className="md-order-details-back"
            >
              <i className="bi bi-arrow-left" />
              My orders
            </Link>
          </header>

          <section className="md-order-details-card">
            <div className="md-order-details-card-header">
              <div>
                <span className="md-order-details-label">
                  Order number
                </span>
                <div className="md-order-details-number">
                  {orderNumber}
                </div>
              </div>

              <span className={`md-order-details-badge ${statusClass(orderStatus)}`}>
                <i className="bi bi-circle-fill" />
                {readable(orderStatus)}
              </span>
            </div>

            <div className="md-order-details-card-body">
              <div className="md-order-details-meta">
                <div>
                  <span className="md-order-details-label">
                    Order date
                  </span>
                  <div className="md-order-details-value">
                    {createdAt
                      ? new Date(createdAt).toLocaleString("en-KE")
                      : "Not provided"}
                  </div>
                </div>

                <div>
                  <span className="md-order-details-label">
                    Payment status
                  </span>
                  <span className={`md-order-details-badge ${statusClass(paymentStatus)}`}>
                    {readable(paymentStatus)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="md-order-details-card">
            <div className="md-order-details-card-header">
              <h2>
                <i className="bi bi-bag-check me-2" />
                Items ordered
              </h2>
              <span className="md-order-details-label">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="md-order-details-card-body">
              {items.length ? (
                items.map((item, index) => {
                  const quantity = Number(item.quantity || 0);
                  const price = Number(
                    item.unit_price ?? item.price ?? 0
                  );

                  return (
                    <div
                      className="md-order-details-item"
                      key={item.id || item.product_id || index}
                    >
                      <div>
                        <div className="md-order-details-item-name">
                          {item.product_name || item.name || "Product"}
                        </div>
                        <div className="md-order-details-item-meta">
                          {quantity} × {formatMoney(price)}
                          {item.unit ? ` / ${item.unit}` : ""}
                          {item.purchase_type === "portion"
                            ? " · Portion"
                            : ""}
                        </div>
                      </div>

                      <div className="md-order-details-item-total">
                        {formatMoney(quantity * price)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-secondary small mb-0">
                  Item details were not supplied with this order record.
                </p>
              )}

              <div className="md-order-details-total">
                <span>Order total</span>
                <strong>{formatMoney(total)}</strong>
              </div>
            </div>
          </section>

          <section className="md-order-details-card">
            <div className="md-order-details-card-header">
              <h2>
                <i className="bi bi-person-vcard me-2" />
                Customer and fulfilment
              </h2>
            </div>

            <div className="md-order-details-card-body">
              <div className="md-order-details-info-grid">
                <div>
                  <span className="md-order-details-label">
                    Customer
                  </span>
                  <div className="md-order-details-value">
                    {customerName}
                  </div>
                </div>

                <div>
                  <span className="md-order-details-label">
                    Phone
                  </span>
                  <div className="md-order-details-value">
                    {customerPhone}
                  </div>
                </div>

                <div>
                  <span className="md-order-details-label">
                    Fulfilment method
                  </span>
                  <div className="md-order-details-value">
                    {readable(orderType)}
                  </div>
                </div>

                <div>
                  <span className="md-order-details-label">
                    Payment method
                  </span>
                  <div className="md-order-details-value">
                    {readable(paymentMethod)}
                  </div>
                </div>

                {deliveryLocation && (
                  <div>
                    <span className="md-order-details-label">
                      Delivery location
                    </span>
                    <div className="md-order-details-value">
                      {deliveryLocation}
                    </div>
                  </div>
                )}

                {order.notes && (
                  <div>
                    <span className="md-order-details-label">
                      Order notes
                    </span>
                    <div className="md-order-details-value">
                      {order.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="md-order-details-actions">
            <Link
              to="/track-order"
              className="md-order-details-button primary"
            >
              <i className="bi bi-geo-alt" />
              Track this order
            </Link>

            <Link
              to="/account/orders"
              className="md-order-details-button"
            >
              <i className="bi bi-list-ul" />
              All orders
            </Link>
          </div>

          <div className="md-order-details-note">
            <i className="bi bi-info-circle me-2" />
            This page currently displays order information supplied through
            navigation state. Persistent order retrieval will be connected
            when the customer order API is implemented.
          </div>
        </div>
      </main>
    </>
  );
}
