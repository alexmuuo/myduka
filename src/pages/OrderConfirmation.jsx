import { Link, useLocation } from "react-router-dom";

function OrderConfirmation() {
  const location = useLocation();
  const order = location.state?.order;

  const styles = `
    .hm-confirmation {
      min-height: 100vh;
      padding: 56px 20px 80px;
      color: #f1f5f9;
      background:
        radial-gradient(ellipse at top, rgba(29, 82, 56, 0.25), transparent 55%),
        #101310;
    }

    .hm-confirmation * {
      box-sizing: border-box;
    }

    .hm-confirmation .hm-container {
      width: 100%;
      max-width: 850px;
      margin: 0 auto;
    }

    .hm-confirmation .hm-muted {
      color: #aaaFA8;
    }

    .hm-confirmation .hm-gold {
      color: #fbbf24;
    }

    .hm-confirmation .hm-success-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 84px;
      height: 84px;
      margin: 0 auto;
      border: 1px solid rgba(251, 191, 36, 0.55);
      border-radius: 50%;
      background: rgba(27, 75, 49, 0.45);
      color: #fbbf24;
      font-size: 2.6rem;
      box-shadow: 0 0 35px rgba(251, 191, 36, 0.08);
    }

    .hm-confirmation .hm-eyebrow {
      color: #fbbf24;
      font-size: 0.76rem;
      font-weight: 800;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    .hm-confirmation .hm-heading {
      margin: 20px 0 12px;
      color: #f8f5eb;
      font-size: clamp(2rem, 5vw, 3.1rem);
      font-weight: 800;
      letter-spacing: -0.045em;
      line-height: 1.12;
    }

    .hm-confirmation .hm-subheading {
      max-width: 540px;
      margin: 0 auto;
      color: #b7bcb4;
      font-size: 1rem;
      line-height: 1.8;
    }

    .hm-confirmation .hm-panel {
      overflow: hidden;
      margin-bottom: 22px;
      border: 1px solid #30372f;
      border-radius: 18px;
      background: #191e19;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
    }

    .hm-confirmation .hm-panel-header {
      padding: 22px 26px;
      border-bottom: 1px solid #30372f;
      background: rgba(255, 255, 255, 0.015);
    }

    .hm-confirmation .hm-panel-body {
      padding: 26px;
    }

    .hm-confirmation .hm-section-title {
      margin: 0;
      color: #f1f5f9;
      font-size: 1.05rem;
      font-weight: 750;
    }

    .hm-confirmation .hm-label {
      display: block;
      margin-bottom: 7px;
      color: #9fa69c;
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }

    .hm-confirmation .hm-value {
      color: #f1f0e9;
      font-size: 0.96rem;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .hm-confirmation .hm-order-number {
      margin-top: 5px;
      color: #fbbf24;
      font-size: 1.25rem;
      font-weight: 800;
      overflow-wrap: anywhere;
    }

    .hm-confirmation .hm-divider {
      height: 1px;
      margin: 22px 0;
      border: 0;
      background: #343b33;
      opacity: 1;
    }

    .hm-confirmation .hm-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 12px;
      border: 1px solid transparent;
      border-radius: 999px;
      font-size: 0.76rem;
      font-weight: 750;
      text-transform: capitalize;
    }

    .hm-confirmation .hm-badge-success {
      border-color: rgba(99, 190, 127, 0.3);
      background: rgba(40, 120, 67, 0.2);
      color: #8ee0a5;
    }

    .hm-confirmation .hm-badge-warning {
      border-color: rgba(251, 191, 36, 0.3);
      background: rgba(251, 191, 36, 0.1);
      color: #e5c879;
    }

    .hm-confirmation .hm-badge-danger {
      border-color: rgba(235, 100, 100, 0.3);
      background: rgba(150, 45, 45, 0.18);
      color: #ff9c9c;
    }

    .hm-confirmation .hm-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      padding: 15px 0;
      border-bottom: 1px solid #2d342c;
    }

    .hm-confirmation .hm-item:last-child {
      border-bottom: 0;
    }

    .hm-confirmation .hm-item-name {
      color: #f1f0e9;
      font-weight: 650;
      overflow-wrap: anywhere;
    }

    .hm-confirmation .hm-item-detail {
      margin-top: 6px;
      color: #a7ada4;
      font-size: 0.86rem;
    }

    .hm-confirmation .hm-item-total {
      color: #f0eee5;
      font-weight: 750;
      white-space: nowrap;
    }

    .hm-confirmation .hm-total-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
    }

    .hm-confirmation .hm-grand-total {
      color: #fbbf24;
      font-size: clamp(1.35rem, 4vw, 1.8rem);
      font-weight: 850;
      text-align: right;
    }

    .hm-confirmation .hm-info {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 22px;
      border: 1px solid #344c39;
      border-radius: 15px;
      background: rgba(28, 74, 47, 0.2);
    }

    .hm-confirmation .hm-info-icon {
      flex-shrink: 0;
      color: #fbbf24;
      font-size: 1.35rem;
    }

    .hm-confirmation .hm-info-title {
      margin: 0 0 8px;
      color: #f1e8cc;
      font-size: 1rem;
      font-weight: 750;
    }

    .hm-confirmation .hm-info-text {
      margin: 0;
      color: #c0c6bb;
      font-size: 0.92rem;
      line-height: 1.75;
    }

    .hm-confirmation .hm-actions {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 28px;
    }

    .hm-confirmation .hm-btn {
      display: inline-flex;
      min-height: 48px;
      align-items: center;
      justify-content: center;
      gap: 9px;
      padding: 12px 22px;
      border: 1px solid transparent;
      border-radius: 10px;
      font-size: 0.92rem;
      font-weight: 750;
      text-decoration: none;
      transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
    }

    .hm-confirmation .hm-btn:hover {
      transform: translateY(-2px);
    }

    .hm-confirmation .hm-btn-primary {
      border-color: #fbbf24;
      background: #fbbf24;
      color: #171911;
    }

    .hm-confirmation .hm-btn-primary:hover {
      border-color: #e7cd8d;
      background: #e7cd8d;
      color: #171911;
    }

    .hm-confirmation .hm-btn-secondary {
      border-color: #465046;
      background: transparent;
      color: #e9e9df;
    }

    .hm-confirmation .hm-btn-secondary:hover {
      border-color: #fbbf24;
      background: rgba(251, 191, 36, 0.06);
      color: #e7cd8d;
    }

    .hm-confirmation .hm-empty-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 92px;
      height: 92px;
      margin: 0 auto 24px;
      border: 1px solid #41483e;
      border-radius: 50%;
      background: #1a201a;
      color: #fbbf24;
      font-size: 2.5rem;
    }

    .hm-confirmation .hm-empty-panel {
      padding: 60px 25px;
      border: 1px solid #30372f;
      border-radius: 20px;
      background: #191e19;
      text-align: center;
    }

    @media (max-width: 600px) {
      .hm-confirmation {
        padding: 35px 14px 55px;
      }

      .hm-confirmation .hm-panel-header {
        padding: 19px;
      }

      .hm-confirmation .hm-panel-body {
        padding: 20px;
      }

      .hm-confirmation .hm-item {
        gap: 12px;
      }

      .hm-confirmation .hm-info {
        padding: 18px;
      }

      .hm-confirmation .hm-actions {
        flex-direction: column;
      }

      .hm-confirmation .hm-btn {
        width: 100%;
      }
    }

    @media print {
      .hm-confirmation {
        padding: 0;
        background: #fff;
        color: #111;
      }

      .hm-confirmation .hm-panel,
      .hm-confirmation .hm-empty-panel {
        border: 1px solid #ddd;
        background: #fff;
        box-shadow: none;
      }

      .hm-confirmation .hm-heading,
      .hm-confirmation .hm-section-title,
      .hm-confirmation .hm-value,
      .hm-confirmation .hm-item-name,
      .hm-confirmation .hm-item-total {
        color: #111;
      }

      .hm-confirmation .hm-muted,
      .hm-confirmation .hm-label,
      .hm-confirmation .hm-item-detail {
        color: #555;
      }

      .hm-confirmation .hm-actions {
        display: none;
      }
    }
  `;

  if (!order) {
    return (
      <div className="hm-confirmation">
        <style>{styles}</style>

        <div className="hm-container">
          <div className="hm-empty-panel">
            <div className="hm-empty-icon">
              <i className="bi bi-receipt" aria-hidden="true"></i>
            </div>

            <p className="hm-eyebrow">MyDuka</p>

            <h1 className="hm-heading">
              No order found
            </h1>

            <p className="hm-subheading">
              We couldn't find the order details for this page.
              If you recently placed an order, check your order confirmation
              page or return to the shop to continue browsing.
            </p>

            <div className="hm-actions">
              <Link to="/products" className="hm-btn hm-btn-primary">
                <i className="bi bi-shop" aria-hidden="true"></i>
                Browse Products
              </Link>

              <Link to="/" className="hm-btn hm-btn-secondary">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const customer = order.customer || {};

  const paymentMethod = String(
    customer.paymentMethod ||
      order.payment_method ||
      order.paymentMethod ||
      ""
  ).toLowerCase();

  const isMpesa = paymentMethod === "mpesa";

  const paymentStatus = String(
    order.payment_status ||
      order.paymentStatus ||
      order.payment?.status ||
      ""
  ).toLowerCase();

  const isPaid = paymentStatus === "paid";

  const displayedPaymentStatus = isPaid
    ? "Paid"
    : paymentStatus === "failed"
      ? "Failed"
      : paymentStatus === "pending"
        ? "Payment Pending"
        : "Unpaid";

  const paymentBadgeClass = isPaid
    ? "hm-badge-success"
    : paymentStatus === "failed"
      ? "hm-badge-danger"
      : "hm-badge-warning";

  const orderStatus = String(order.status || "pending");
  const normalizedOrderStatus = orderStatus.toLowerCase();

  const orderBadgeClass =
    normalizedOrderStatus === "completed" ||
    normalizedOrderStatus === "delivered"
      ? "hm-badge-success"
      : normalizedOrderStatus === "cancelled"
        ? "hm-badge-danger"
        : "hm-badge-warning";

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  const total = Number(
    order.total ?? order.total_amount ?? 0
  );

  const formatMoney = (amount) =>
    Number(amount || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const paymentMethodLabel = isMpesa
    ? "M-Pesa"
    : paymentMethod === "cash" ||
        paymentMethod === "cod" ||
        paymentMethod === "cash_on_delivery" ||
        paymentMethod === "pay_on_delivery"
      ? "Cash on Delivery"
      : paymentMethod === "pickup" ||
          paymentMethod === "pay_on_pickup"
        ? "Pay on Pickup"
        : paymentMethod
          ? paymentMethod.replace(/_/g, " ")
          : "Not specified";

  const receiptNumber =
    order.mpesa_receipt_number ||
    order.mpesaReceiptNumber ||
    order.payment?.mpesa_receipt_number ||
    order.payment?.receipt ||
    null;

  const fulfilment = String(
    customer.orderType ||
      order.order_type ||
      "N/A"
  ).replace(/_/g, " ");

  const deliveryLocation =
    customer.location ||
    order.delivery_location ||
    order.deliveryLocation ||
    null;

  return (
    <div className="hm-confirmation">
      <style>{styles}</style>

      <div className="hm-container">
        {/* Confirmation heading */}
        <header className="text-center mb-5">
          <div className="hm-success-icon">
            <i className="bi bi-check-lg" aria-hidden="true"></i>
          </div>

          <p className="hm-eyebrow mt-4 mb-0">
            MyDuka
          </p>

          <h1 className="hm-heading">
            Order Received!
          </h1>

          <p className="hm-subheading">
            Thank you, {customer.name || "Customer"}.
            Your order has been received successfully.
            Here's your order summary for reference.
          </p>
        </header>

        {/* Order summary */}
        <section className="hm-panel">
          <div className="hm-panel-header">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <span className="hm-label">Order Number</span>

                <div className="hm-order-number">
                  {order.orderNumber || order.order_number || order.id || "N/A"}
                </div>
              </div>

              <span className={`hm-badge ${orderBadgeClass}`}>
                <i
                  className={
                    normalizedOrderStatus === "cancelled"
                      ? "bi bi-x-circle"
                      : normalizedOrderStatus === "completed" ||
                          normalizedOrderStatus === "delivered"
                        ? "bi bi-check-circle"
                        : "bi bi-clock"
                  }
                  aria-hidden="true"
                ></i>

                {orderStatus.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div className="hm-panel-body">
            <h2 className="hm-section-title mb-3">
              <i className="bi bi-receipt hm-gold me-2" aria-hidden="true"></i>
              Order Items
            </h2>

            {items.length > 0 ? (
              items.map((item, index) => {
                const itemPrice = Number(item.price) || 0;
                const itemQuantity = Number(item.quantity) || 0;

                return (
                  <div
                    key={item.id ?? index}
                    className="hm-item"
                  >
                    <div>
                      <div className="hm-item-name">
                        {item.name || item.product_name || "Product"}
                      </div>

                      <div className="hm-item-detail">
                        {itemQuantity} × KSh {formatMoney(itemPrice)}
                      </div>
                    </div>

                    <div className="hm-item-total">
                      KSh {formatMoney(itemPrice * itemQuantity)}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="hm-muted mb-0">
                No item details are available for this order.
              </p>
            )}

            <hr className="hm-divider" />

            <div className="hm-total-row">
              <div>
                <div className="hm-label mb-1">Order Total</div>
                <span className="hm-muted small">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="hm-grand-total">
                KSh {formatMoney(total)}
              </div>
            </div>
          </div>
        </section>

        {/* Order and payment information */}
        <section className="hm-panel">
          <div className="hm-panel-header">
            <h2 className="hm-section-title">
              <i className="bi bi-clipboard-check hm-gold me-2" aria-hidden="true"></i>
              Order Information
            </h2>
          </div>

          <div className="hm-panel-body">
            <div className="row g-4">
              <div className="col-sm-6">
                <span className="hm-label">Customer</span>
                <div className="hm-value">
                  {customer.name || "N/A"}
                </div>
              </div>

              <div className="col-sm-6">
                <span className="hm-label">Phone</span>
                <div className="hm-value">
                  {customer.phone || order.phone || "N/A"}
                </div>
              </div>

              <div className="col-sm-6">
                <span className="hm-label">Fulfilment</span>
                <div className="hm-value text-capitalize">
                  {fulfilment}
                </div>
              </div>

              <div className="col-sm-6">
                <span className="hm-label">Payment Method</span>
                <div className="hm-value">
                  {paymentMethodLabel}
                </div>
              </div>

              <div className="col-sm-6">
                <span className="hm-label">Payment Status</span>

                <span className={`hm-badge ${paymentBadgeClass}`}>
                  <i
                    className={
                      isPaid
                        ? "bi bi-check-circle"
                        : paymentStatus === "failed"
                          ? "bi bi-x-circle"
                          : "bi bi-clock"
                    }
                    aria-hidden="true"
                  ></i>

                  {displayedPaymentStatus}
                </span>
              </div>

              {receiptNumber && (
                <div className="col-sm-6">
                  <span className="hm-label">M-Pesa Receipt</span>
                  <div className="hm-value">
                    {receiptNumber}
                  </div>
                </div>
              )}

              {deliveryLocation && (
                <div className="col-12">
                  <span className="hm-label">Delivery Location</span>
                  <div className="hm-value">
                    {deliveryLocation}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Next steps */}
        <section className="hm-info">
          <i
            className="bi bi-info-circle hm-info-icon"
            aria-hidden="true"
          ></i>

          <div>
            <h2 className="hm-info-title">
              {isPaid
                ? "Payment confirmed"
                : isMpesa && paymentStatus === "failed"
                  ? "Payment was not successful"
                  : isMpesa
                    ? "Payment confirmation pending"
                    : "What's next?"}
            </h2>

            <p className="hm-info-text">
              {isPaid
                ? "Your payment has been confirmed. Our team will review your order and contact you about collection or delivery."
                : isMpesa && paymentStatus === "failed"
                  ? "Your M-Pesa payment was not confirmed as successful. Please check your payment status before attempting another payment."
                  : isMpesa
                    ? "Your M-Pesa payment has not yet been confirmed. Please wait for verification before assuming your order is paid."
                    : "Your order has been received. Payment is due when you collect your order or receive your delivery, as applicable."}
            </p>
          </div>
        </section>

        {/* Navigation */}
        <div className="hm-actions">
          <Link
            to="/products"
            className="hm-btn hm-btn-primary"
          >
            <i className="bi bi-shop" aria-hidden="true"></i>
            Continue Shopping
          </Link>

          <Link
            to="/"
            className="hm-btn hm-btn-secondary"
          >
            <i className="bi bi-house" aria-hidden="true"></i>
            Back to Home
          </Link>

          <button
            type="button"
            className="hm-btn hm-btn-secondary"
            onClick={() => window.print()}
          >
            <i className="bi bi-printer" aria-hidden="true"></i>
            Print Receipt
          </button>
        </div>

        <p className="text-center hm-muted small mt-4 mb-0">
          Thank you for shopping with MyDuka.
          Please enjoy responsibly.
        </p>
      </div>
    </div>
  );
}

export default OrderConfirmation;
