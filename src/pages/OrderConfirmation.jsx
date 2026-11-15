import { Link, useLocation } from "react-router-dom";

function OrderConfirmation() {
  const location = useLocation();
  const order = location.state?.order || null;
  const storeSlug =
    location.state?.storeSlug ||
    order?.business_slug ||
    order?.store_slug ||
    "";

  const storePath = storeSlug ? `/store/${storeSlug}` : "/";

  const styles = `
    .md-confirmation {
      min-height: 100vh;
      padding: 48px 18px 70px;
      background: #f6f7fb;
      color: #172033;
      font-family: inherit;
    }

    .md-confirmation *,
    .md-confirmation *::before,
    .md-confirmation *::after {
      box-sizing: border-box;
    }

    .md-confirmation .md-container {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
    }

    .md-confirmation .md-header {
      text-align: center;
      margin-bottom: 34px;
    }

    .md-confirmation .md-success-icon {
      width: 76px;
      height: 76px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      border-radius: 50%;
      background: #e7f8ef;
      color: #159957;
      font-size: 2.3rem;
    }

    .md-confirmation .md-eyebrow {
      margin: 0 0 9px;
      color: #635bff;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .md-confirmation .md-heading {
      margin: 0 0 12px;
      color: #172033;
      font-size: clamp(2rem, 5vw, 2.8rem);
      font-weight: 850;
      letter-spacing: -0.045em;
      line-height: 1.12;
    }

    .md-confirmation .md-subheading {
      max-width: 540px;
      margin: 0 auto;
      color: #697386;
      font-size: 0.98rem;
      line-height: 1.75;
    }

    .md-confirmation .md-panel {
      overflow: hidden;
      margin-bottom: 18px;
      border: 1px solid #e7eaf0;
      border-radius: 17px;
      background: #fff;
      box-shadow: 0 8px 28px rgba(23, 32, 51, 0.045);
    }

    .md-confirmation .md-panel-header {
      padding: 20px 24px;
      border-bottom: 1px solid #edf0f5;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px;
    }

    .md-confirmation .md-panel-body {
      padding: 24px;
    }

    .md-confirmation .md-section-title {
      margin: 0;
      color: #172033;
      font-size: 1rem;
      font-weight: 800;
    }

    .md-confirmation .md-label {
      display: block;
      margin-bottom: 7px;
      color: #8992a3;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }

    .md-confirmation .md-value {
      color: #172033;
      font-size: 0.94rem;
      font-weight: 650;
      overflow-wrap: anywhere;
    }

    .md-confirmation .md-order-number {
      margin-top: 4px;
      color: #635bff;
      font-size: 1.2rem;
      font-weight: 850;
      overflow-wrap: anywhere;
    }

    .md-confirmation .md-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: capitalize;
    }

    .md-confirmation .md-success {
      background: #e7f8ef;
      color: #13834c;
    }

    .md-confirmation .md-warning {
      background: #fff5dc;
      color: #9b6b00;
    }

    .md-confirmation .md-danger {
      background: #fff0f0;
      color: #c43e3e;
    }

    .md-confirmation .md-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding: 15px 0;
      border-bottom: 1px solid #edf0f5;
    }

    .md-confirmation .md-item:last-child {
      border-bottom: 0;
    }

    .md-confirmation .md-item-name {
      color: #172033;
      font-size: 0.93rem;
      font-weight: 750;
      overflow-wrap: anywhere;
    }

    .md-confirmation .md-item-detail {
      margin-top: 5px;
      color: #8790a0;
      font-size: 0.83rem;
    }

    .md-confirmation .md-item-total {
      color: #172033;
      font-size: 0.9rem;
      font-weight: 800;
      white-space: nowrap;
    }

    .md-confirmation .md-divider {
      height: 1px;
      margin: 20px 0;
      border: 0;
      background: #e9edf3;
    }

    .md-confirmation .md-total-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }

    .md-confirmation .md-grand-total {
      color: #635bff;
      font-size: 1.55rem;
      font-weight: 900;
      text-align: right;
    }

    .md-confirmation .md-info {
      display: flex;
      align-items: flex-start;
      gap: 13px;
      padding: 20px;
      margin-bottom: 22px;
      border: 1px solid #e2e6ff;
      border-radius: 15px;
      background: #f0f1ff;
    }

    .md-confirmation .md-info-icon {
      flex-shrink: 0;
      color: #635bff;
      font-size: 1.3rem;
    }

    .md-confirmation .md-info-title {
      margin: 0 0 7px;
      color: #27245c;
      font-size: 0.95rem;
      font-weight: 800;
    }

    .md-confirmation .md-info-text {
      margin: 0;
      color: #555b7b;
      font-size: 0.88rem;
      line-height: 1.7;
    }

    .md-confirmation .md-actions {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 11px;
      margin-top: 25px;
    }

    .md-confirmation .md-btn {
      min-height: 47px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      padding: 12px 21px;
      border: 1px solid transparent;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
      transition: 0.2s ease;
    }

    .md-confirmation .md-btn:hover {
      transform: translateY(-2px);
    }

    .md-confirmation .md-btn-primary {
      background: #635bff;
      border-color: #635bff;
      color: #fff;
    }

    .md-confirmation .md-btn-primary:hover {
      background: #5148e5;
      border-color: #5148e5;
      color: #fff;
    }

    .md-confirmation .md-btn-secondary {
      background: #fff;
      border-color: #e0e4ec;
      color: #344054;
    }

    .md-confirmation .md-btn-secondary:hover {
      border-color: #635bff;
      color: #635bff;
    }

    .md-confirmation .md-empty {
      padding: 55px 24px;
      border: 1px solid #e7eaf0;
      border-radius: 18px;
      background: #fff;
      text-align: center;
      box-shadow: 0 8px 28px rgba(23, 32, 51, 0.045);
    }

    .md-confirmation .md-empty-icon {
      width: 78px;
      height: 78px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      border-radius: 50%;
      background: #f0f1ff;
      color: #635bff;
      font-size: 2rem;
    }

    .md-confirmation .md-muted {
      color: #8790a0;
    }

    @media (max-width: 600px) {
      .md-confirmation {
        padding: 30px 13px 48px;
      }

      .md-confirmation .md-panel-header,
      .md-confirmation .md-panel-body {
        padding: 19px;
      }

      .md-confirmation .md-item {
        gap: 10px;
      }

      .md-confirmation .md-actions {
        flex-direction: column;
      }

      .md-confirmation .md-btn {
        width: 100%;
      }
    }

    @media print {
      .md-confirmation {
        padding: 0;
        background: #fff;
      }

      .md-confirmation .md-panel,
      .md-confirmation .md-empty {
        box-shadow: none;
        border: 1px solid #ddd;
      }

      .md-confirmation .md-actions {
        display: none;
      }
    }
  `;

  const formatMoney = (amount) =>
    Number(amount || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (!order) {
    return (
      <div className="md-confirmation">
        <style>{styles}</style>

        <div className="md-container">
          <div className="md-empty">
            <div className="md-empty-icon">
              <i className="bi bi-receipt" aria-hidden="true"></i>
            </div>

            <p className="md-eyebrow">MyDuka</p>
            <h1 className="md-heading">No order found</h1>

            <p className="md-subheading">
              We couldn't find order details for this page. If you recently
              placed an order, return to the shop and check your order
              confirmation details.
            </p>

            <div className="md-actions">
              <Link to={storePath} className="md-btn md-btn-primary">
                <i className="bi bi-shop"></i>
                Return to Shop
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const customer = order.customer || {};

  const paymentMethod = String(
    order.payment_method ||
      order.paymentMethod ||
      customer.paymentMethod ||
      ""
  ).toLowerCase();

  const paymentStatus = String(
    order.payment_status ||
      order.paymentStatus ||
      order.payment?.status ||
      ""
  ).toLowerCase();

  const isPaid = paymentStatus === "paid";
  const isFailed = paymentStatus === "failed";
  const isMpesa = paymentMethod === "mpesa";

  const paymentLabel = isPaid
    ? "Paid"
    : isFailed
      ? "Payment Failed"
      : paymentStatus === "pending"
        ? "Payment Pending"
        : "Unpaid";

  const paymentBadge = isPaid
    ? "md-success"
    : isFailed
      ? "md-danger"
      : "md-warning";

  const orderStatus = String(order.status || "pending");
  const normalizedOrderStatus = orderStatus.toLowerCase();

  const orderBadge =
    ["completed", "delivered"].includes(normalizedOrderStatus)
      ? "md-success"
      : normalizedOrderStatus === "cancelled"
        ? "md-danger"
        : "md-warning";

  const items = Array.isArray(order.items) ? order.items : [];

  const total = Number(
    order.total ??
      order.total_amount ??
      order.grand_total ??
      0
  );

  const paymentMethodLabel =
    paymentMethod === "mpesa"
      ? "M-Pesa"
      : ["cash", "cod", "cash_on_delivery", "pay_on_delivery"].includes(
            paymentMethod
          )
        ? "Cash"
        : paymentMethod
          ? paymentMethod.replace(/_/g, " ")
          : "Not specified";

  const fulfilment = String(
    order.fulfilment ||
      order.fulfillment ||
      order.order_type ||
      order.orderType ||
      customer.orderType ||
      "Not specified"
  ).replace(/_/g, " ");

  const deliveryLocation =
    order.delivery_location ||
    order.deliveryLocation ||
    order.location ||
    customer.location ||
    "";

  const customerName =
    order.customer_name ||
    customer.name ||
    "Customer";

  const customerPhone =
    order.customer_phone ||
    order.phone ||
    customer.phone ||
    "Not provided";

  const orderNumber =
    order.order_number ||
    order.orderNumber ||
    order.reference ||
    order.id ||
    "Pending";

  const receiptNumber =
    order.mpesa_receipt_number ||
    order.mpesaReceiptNumber ||
    order.payment?.mpesa_receipt_number ||
    order.payment?.receipt ||
    null;

  const itemPrice = (item) =>
    Number(
      item.unit_price ??
        item.price ??
        item.selling_price ??
        0
    );

  const itemName = (item) =>
    item.product_name ||
    item.name ||
    "Product";

  const itemQuantity = (item) =>
    Number(item.quantity || 0);

  return (
    <div className="md-confirmation">
      <style>{styles}</style>

      <div className="md-container">
        <header className="md-header">
          <div className="md-success-icon">
            <i className="bi bi-check-lg" aria-hidden="true"></i>
          </div>

          <p className="md-eyebrow">MyDuka Order Confirmation</p>

          <h1 className="md-heading">Order received!</h1>

          <p className="md-subheading">
            Thank you, {customerName}. Your order has been submitted.
            Here is your order summary for reference.
          </p>
        </header>

        <section className="md-panel">
          <div className="md-panel-header">
            <div>
              <span className="md-label">Order number</span>
              <div className="md-order-number">{orderNumber}</div>
            </div>

            <span className={`md-badge ${orderBadge}`}>
              <i className="bi bi-clock" aria-hidden="true"></i>
              {orderStatus.replace(/_/g, " ")}
            </span>
          </div>

          <div className="md-panel-body">
            <h2 className="md-section-title mb-3">
              <i className="bi bi-bag-check me-2"></i>
              Order items
            </h2>

            {items.length > 0 ? (
              items.map((item, index) => {
                const quantity = itemQuantity(item);
                const price = itemPrice(item);
                const purchaseType = item.purchase_type || item.purchaseType;

                return (
                  <div
                    key={`${item.product_id || item.id || index}-${purchaseType || "unit"}-${index}`}
                    className="md-item"
                  >
                    <div>
                      <div className="md-item-name">
                        {itemName(item)}
                      </div>

                      <div className="md-item-detail">
                        {quantity} × KSh {formatMoney(price)}
                        {purchaseType === "portion" ? " · Portion" : ""}
                        {item.unit ? ` · ${item.unit}` : ""}
                      </div>
                    </div>

                    <div className="md-item-total">
                      KSh {formatMoney(quantity * price)}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="md-muted mb-0">
                Item details are not available for this order.
              </p>
            )}

            <hr className="md-divider" />

            <div className="md-total-row">
              <div>
                <span className="md-label mb-1">Order total</span>
                <span className="md-muted small">
                  {items.length} {items.length === 1 ? "line item" : "line items"}
                </span>
              </div>

              <div className="md-grand-total">
                KSh {formatMoney(total)}
              </div>
            </div>
          </div>
        </section>

        <section className="md-panel">
          <div className="md-panel-header">
            <h2 className="md-section-title">
              <i className="bi bi-clipboard-check me-2"></i>
              Order information
            </h2>
          </div>

          <div className="md-panel-body">
            <div className="row g-4">
              <div className="col-sm-6">
                <span className="md-label">Customer</span>
                <div className="md-value">{customerName}</div>
              </div>

              <div className="col-sm-6">
                <span className="md-label">Phone number</span>
                <div className="md-value">{customerPhone}</div>
              </div>

              <div className="col-sm-6">
                <span className="md-label">Fulfilment</span>
                <div className="md-value text-capitalize">
                  {fulfilment}
                </div>
              </div>

              <div className="col-sm-6">
                <span className="md-label">Payment method</span>
                <div className="md-value text-capitalize">
                  {paymentMethodLabel}
                </div>
              </div>

              <div className="col-sm-6">
                <span className="md-label">Payment status</span>
                <span className={`md-badge ${paymentBadge}`}>
                  {isPaid ? (
                    <i className="bi bi-check-circle"></i>
                  ) : isFailed ? (
                    <i className="bi bi-x-circle"></i>
                  ) : (
                    <i className="bi bi-clock"></i>
                  )}
                  {paymentLabel}
                </span>
              </div>

              {receiptNumber && (
                <div className="col-sm-6">
                  <span className="md-label">M-Pesa receipt</span>
                  <div className="md-value">{receiptNumber}</div>
                </div>
              )}

              {deliveryLocation && (
                <div className="col-12">
                  <span className="md-label">Delivery location</span>
                  <div className="md-value">{deliveryLocation}</div>
                </div>
              )}

              {(order.customer_email || customer.email) && (
                <div className="col-12">
                  <span className="md-label">Email</span>
                  <div className="md-value">
                    {order.customer_email || customer.email}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="md-info">
          <i className="bi bi-info-circle md-info-icon" aria-hidden="true"></i>

          <div>
            <h2 className="md-info-title">
              {isPaid
                ? "Payment confirmed"
                : isMpesa && isFailed
                  ? "Payment was not successful"
                  : isMpesa
                    ? "Payment confirmation pending"
                    : "What happens next?"}
            </h2>

            <p className="md-info-text">
              {isPaid
                ? "Your payment has been confirmed. The shop will process your order and contact you about collection or delivery."
                : isMpesa && isFailed
                  ? "Your M-Pesa payment was not confirmed. Check your M-Pesa messages and payment status before trying again."
                  : isMpesa
                    ? "Your M-Pesa payment is awaiting confirmation. Please wait for verification before assuming the order has been paid."
                    : "Your order has been received. Payment will be due according to the shop's collection or delivery arrangements."}
            </p>
          </div>
        </section>

        <div className="md-actions">
          <Link to={storePath} className="md-btn md-btn-primary">
            <i className="bi bi-shop"></i>
            Continue shopping
          </Link>

          <button
            type="button"
            className="md-btn md-btn-secondary"
            onClick={() => window.print()}
          >
            <i className="bi bi-printer"></i>
            Print receipt
          </button>
        </div>

        <p className="text-center md-muted small mt-4 mb-0">
          Thank you for shopping with MyDuka.
        </p>
      </div>
    </div>
  );
}

export default OrderConfirmation;
