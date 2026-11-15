import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../api/api";

const POLL_INTERVAL = 3000;
const MAX_POLL_ATTEMPTS = 60;

const formatPrice = (amount, currency = "KES") => {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  } catch {
    return `${currency} ${Number(amount || 0).toLocaleString("en-KE")}`;
  }
};

const readableSlug = (slug = "") =>
  slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const styles = `
.md-checkout {
  --checkout-primary: #635bff;
  --checkout-bg: #f6f7fb;
  --checkout-surface: #ffffff;
  --checkout-text: #172033;
  --checkout-muted: #778397;
  --checkout-border: #e7eaf0;
  min-height: 80vh;
  padding: 38px 18px 75px;
  background: var(--checkout-bg);
  color: var(--checkout-text);
}

.md-checkout * { box-sizing: border-box; }

.md-checkout button,
.md-checkout input,
.md-checkout textarea {
  font: inherit;
}

.md-checkout-inner {
  width: min(1160px, 100%);
  margin: auto;
}

.md-checkout-header { margin-bottom: 30px; }

.md-checkout-eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--checkout-primary);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 1.4px;
  text-transform: uppercase;
}

.md-checkout-title {
  margin: 12px 0 9px;
  font-size: clamp(30px, 5vw, 42px);
  font-weight: 850;
  letter-spacing: -1.5px;
  line-height: 1.15;
}

.md-checkout-subtitle {
  max-width: 650px;
  margin: 0;
  color: var(--checkout-muted);
  font-size: 14px;
  line-height: 1.7;
}

.md-checkout-store {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 8px 12px;
  border: 1px solid var(--checkout-border);
  border-radius: 8px;
  background: white;
  color: #526071;
  font-size: 12px;
  font-weight: 750;
  text-decoration: none;
}

.md-checkout-steps {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 25px;
}

.md-checkout-step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--checkout-muted);
  font-size: 12px;
  font-weight: 750;
}

.md-checkout-step-number {
  display: grid;
  width: 29px;
  height: 29px;
  place-items: center;
  border: 1px solid var(--checkout-border);
  border-radius: 50%;
  background: white;
  font-size: 12px;
}

.md-checkout-step-active { color: var(--checkout-primary); }

.md-checkout-step-active .md-checkout-step-number {
  border-color: var(--checkout-primary);
  background: #eeedff;
  color: var(--checkout-primary);
}

.md-checkout-step-line {
  width: 35px;
  height: 1px;
  background: var(--checkout-border);
}

.md-checkout-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, .8fr);
  align-items: start;
  gap: 24px;
}

.md-checkout-section {
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid var(--checkout-border);
  border-radius: 14px;
  background: white;
}

.md-checkout-section-header {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 19px 22px;
  border-bottom: 1px solid var(--checkout-border);
}

.md-checkout-section-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border-radius: 10px;
  background: #f0efff;
  color: var(--checkout-primary);
  font-size: 17px;
}

.md-checkout-section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 850;
}

.md-checkout-section-description {
  margin: 4px 0 0;
  color: var(--checkout-muted);
  font-size: 12px;
  line-height: 1.5;
}

.md-checkout-section-body { padding: 22px; }

.md-checkout-field { margin-bottom: 19px; }
.md-checkout-field:last-child { margin-bottom: 0; }

.md-checkout-label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 800;
}

.md-checkout-optional {
  color: var(--checkout-muted);
  font-weight: 450;
}

.md-checkout-input,
.md-checkout-textarea {
  display: block;
  width: 100%;
  min-height: 47px;
  padding: 12px 13px;
  border: 1px solid var(--checkout-border);
  border-radius: 9px;
  outline: none;
  background: white;
  color: var(--checkout-text);
  font-size: 13px;
  transition: border-color .2s, box-shadow .2s;
}

.md-checkout-input::placeholder,
.md-checkout-textarea::placeholder {
  color: #a2abba;
}

.md-checkout-input:focus,
.md-checkout-textarea:focus {
  border-color: var(--checkout-primary);
  box-shadow: 0 0 0 3px rgba(99,91,255,.09);
}

.md-checkout-input:disabled,
.md-checkout-textarea:disabled {
  background: #f5f6f9;
  cursor: not-allowed;
}

.md-checkout-textarea {
  min-height: 100px;
  resize: vertical;
  line-height: 1.6;
}

.md-checkout-help {
  margin: 7px 0 0;
  color: var(--checkout-muted);
  font-size: 11px;
  line-height: 1.6;
}

.md-checkout-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.md-checkout-option {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  min-width: 0;
  padding: 15px;
  border: 1px solid var(--checkout-border);
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: border-color .2s, background .2s;
}

.md-checkout-option:hover {
  border-color: #aaa5ff;
}

.md-checkout-option-selected {
  border-color: var(--checkout-primary);
  background: #f7f6ff;
}

.md-checkout-option input {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  margin: 2px 0 0;
  accent-color: var(--checkout-primary);
}

.md-checkout-option-content { min-width: 0; }

.md-checkout-option-title {
  display: block;
  margin-bottom: 5px;
  font-size: 13px;
  font-weight: 850;
}

.md-checkout-option-description {
  display: block;
  color: var(--checkout-muted);
  font-size: 11px;
  line-height: 1.6;
}

.md-checkout-alert {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin-bottom: 17px;
  padding: 14px 16px;
  border: 1px solid;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.md-checkout-alert-error {
  border-color: #f3c8cf;
  background: #fff4f5;
  color: #a52e42;
}

.md-checkout-alert-info {
  border-color: #c9dcf5;
  background: #f2f7ff;
  color: #28588d;
}

.md-checkout-alert-warning {
  border-color: #f1dfaa;
  background: #fffbeb;
  color: #805b12;
}

.md-checkout-alert strong { color: inherit; }
.md-checkout-alert p { margin: 6px 0 0; }

.md-checkout-summary {
  position: sticky;
  top: 24px;
  overflow: hidden;
  border: 1px solid var(--checkout-border);
  border-radius: 14px;
  background: white;
}

.md-checkout-summary-header {
  padding: 20px;
  border-bottom: 1px solid var(--checkout-border);
}

.md-checkout-summary-title {
  margin: 0;
  font-size: 17px;
  font-weight: 850;
}

.md-checkout-summary-subtitle {
  margin: 6px 0 0;
  color: var(--checkout-muted);
  font-size: 11px;
  line-height: 1.6;
}

.md-checkout-summary-body { padding: 20px; }

.md-checkout-products {
  display: grid;
  gap: 16px;
}

.md-checkout-product {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
}

.md-checkout-product-name {
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.md-checkout-product-meta {
  margin-top: 4px;
  color: var(--checkout-muted);
  font-size: 11px;
  line-height: 1.6;
}

.md-checkout-product-price {
  font-size: 12px;
  font-weight: 800;
  text-align: right;
  white-space: nowrap;
}

.md-checkout-divider {
  height: 1px;
  margin: 20px 0;
  border: 0;
  background: var(--checkout-border);
}

.md-checkout-summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 15px;
  color: var(--checkout-muted);
  font-size: 12px;
}

.md-checkout-summary-row strong {
  color: var(--checkout-text);
  font-weight: 800;
  text-align: right;
}

.md-checkout-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 21px;
}

.md-checkout-total-label {
  font-size: 14px;
  font-weight: 850;
}

.md-checkout-total-value {
  color: var(--checkout-primary);
  font-size: 21px;
  font-weight: 900;
  text-align: right;
}

.md-checkout-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  min-height: 51px;
  padding: 13px 16px;
  border: 0;
  border-radius: 9px;
  background: var(--checkout-primary);
  color: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 850;
  transition: filter .2s, transform .2s;
}

.md-checkout-submit:hover:not(:disabled) {
  filter: brightness(.94);
  transform: translateY(-1px);
}

.md-checkout-submit:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.md-checkout-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  margin-top: 10px;
  padding: 11px;
  border: 1px solid var(--checkout-border);
  border-radius: 9px;
  background: white;
  color: var(--checkout-text);
  cursor: pointer;
  font-size: 12px;
  font-weight: 750;
  text-decoration: none;
}

.md-checkout-secondary:hover {
  border-color: var(--checkout-primary);
  color: var(--checkout-primary);
}

.md-checkout-secondary:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.md-checkout-secure {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 17px;
  padding: 12px;
  border-radius: 9px;
  background: #f7f8fc;
  color: var(--checkout-muted);
  font-size: 10px;
  line-height: 1.7;
}

.md-checkout-empty {
  max-width: 600px;
  margin: 30px auto;
  padding: 45px 24px;
  border: 1px solid var(--checkout-border);
  border-radius: 15px;
  background: white;
  text-align: center;
}

.md-checkout-empty-icon {
  display: grid;
  width: 72px;
  height: 72px;
  margin: 0 auto 18px;
  place-items: center;
  border-radius: 19px;
  background: #f0efff;
  color: var(--checkout-primary);
  font-size: 30px;
}

.md-checkout-empty h2 {
  margin: 0 0 9px;
  font-size: 22px;
  font-weight: 850;
}

.md-checkout-empty p {
  margin: 0 auto 22px;
  color: var(--checkout-muted);
  font-size: 13px;
  line-height: 1.8;
}

.md-checkout-empty-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 17px;
  border-radius: 9px;
  background: var(--checkout-primary);
  color: white;
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
}

.md-checkout-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,.35);
  border-top-color: white;
  border-radius: 50%;
  animation: md-checkout-spin .7s linear infinite;
}

@keyframes md-checkout-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 850px) {
  .md-checkout-layout { grid-template-columns: 1fr; }
  .md-checkout-summary { position: static; }
}

@media (max-width: 560px) {
  .md-checkout { padding: 25px 13px 48px; }
  .md-checkout-title { font-size: 31px; }
  .md-checkout-steps { gap: 7px; }
  .md-checkout-step { gap: 5px; font-size: 10px; }
  .md-checkout-step-number { width: 25px; height: 25px; }
  .md-checkout-step-line { width: 16px; }
  .md-checkout-section-header,
  .md-checkout-section-body,
  .md-checkout-summary-header,
  .md-checkout-summary-body { padding: 16px; }
  .md-checkout-options { grid-template-columns: 1fr; }
  .md-checkout-total-value { font-size: 18px; }
}

@media (prefers-reduced-motion: reduce) {
  .md-checkout *,
  .md-checkout *::before,
  .md-checkout *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}
`;

export default function Checkout() {
  const {
    cartItems,
    cartTotal,
    clearCart,
    activeStoreSlug,
  } = useCart();

  const navigate = useNavigate();
  const pollingRef = useRef(false);

  const [loggedInCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("customer") || "null");
    } catch {
      return null;
    }
  });

  const [formData, setFormData] = useState({
    name: loggedInCustomer?.name || "",
    phone: loggedInCustomer?.phone || "",
    email: loggedInCustomer?.email || "",
    orderType: "pickup",
    location: "",
    notes: "",
    paymentMethod: "mpesa",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [pendingOrder, setPendingOrder] = useState(null);

  const currency =
    cartItems.find((item) => item.currency)?.currency || "KES";

  const storePath = activeStoreSlug
    ? `/store/${encodeURIComponent(activeStoreSlug)}`
    : "/";

  const storeName =
    readableSlug(activeStoreSlug) || "Online Store";

  const sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const checkPaymentStatus = async (order) => {
    if (!order?.id) {
      throw new Error("The order ID is missing.");
    }

    const response = await api.get(`/payments/status/${order.id}`);
    return response.data;
  };

  const waitForPaymentConfirmation = async (order) => {
    if (pollingRef.current) return;

    pollingRef.current = true;
    setSubmitting(true);
    setError("");
    setStatusMessage(
      "Waiting for M-Pesa confirmation. Complete the prompt on your phone."
    );

    let consecutiveErrors = 0;

    try {
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        if (attempt > 0) await sleep(POLL_INTERVAL);

        let payment;

        try {
          payment = await checkPaymentStatus(order);
          consecutiveErrors = 0;
        } catch (err) {
          console.error("Payment status check failed:", err);
          consecutiveErrors++;

          if (consecutiveErrors < 5) {
            setStatusMessage(
              "Reconnecting to the payment service. Your order is retained."
            );
            continue;
          }

          setStatusMessage("");
          setError(
            "We couldn't verify your payment. Your order has been retained. Please check again."
          );
          return;
        }

        const paymentStatus = String(
          payment.payment_status || ""
        ).toLowerCase();

        const transactionStatus = String(
          payment.transaction_status || ""
        ).toLowerCase();

        if (
          paymentStatus === "paid" &&
          transactionStatus === "paid"
        ) {
          clearCart();
          setPendingOrder(null);

          navigate("/order-confirmation", {
            replace: true,
            state: {
              order: {
                ...order,
                payment_status: "paid",
              },
              payment: {
                method: "mpesa",
                status: "paid",
                receipt: payment.receipt || null,
                message:
                  payment.message ||
                  "Your M-Pesa payment has been confirmed.",
              },
            },
          });

          return;
        }

        if (
          paymentStatus === "failed" ||
          transactionStatus === "failed"
        ) {
          setStatusMessage("");
          setError(
            payment.message ||
              "M-Pesa payment failed. Your cart has been retained. You can retry payment."
          );
          return;
        }

        if (transactionStatus === "not_initiated") {
          setStatusMessage(
            "No active payment request was found. You can retry payment."
          );
          return;
        }

        setStatusMessage(
          `Waiting for payment confirmation... (${attempt + 1}/${MAX_POLL_ATTEMPTS})`
        );
      }

      setStatusMessage("");
      setError(
        "Payment confirmation is taking longer than expected. Do not place another order. Your cart has been retained."
      );
    } finally {
      pollingRef.current = false;
      setSubmitting(false);
    }
  };

  const initiateMpesaPayment = async (order) => {
    if (!order?.id) {
      setError("The order ID is missing. Please contact support.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setStatusMessage("Connecting to M-Pesa...");

      await api.post("/payments/stk-push", {
        order_id: order.id,
        phone: formData.phone.trim(),
      });

      setStatusMessage(
        "Payment prompt requested. Check your phone and enter your M-Pesa PIN."
      );
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data || {};

      if (
        status === 409 &&
        String(data.payment_status || "").toLowerCase() === "pending"
      ) {
        setStatusMessage(
          "A payment request may already be active. Checking its status..."
        );
      } else {
        setStatusMessage("");
        setError(
          `${data.error || data.message || "Could not initiate M-Pesa payment."} Your order has been retained.`
        );
        return;
      }
    } finally {
      setSubmitting(false);
    }

    await waitForPaymentConfirmation(order);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatusMessage("");

    if (submitting || pollingRef.current) return;

    if (!pendingOrder && cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("Please provide your name and phone number.");
      return;
    }

    if (
      formData.orderType === "delivery" &&
      !formData.location.trim() &&
      !pendingOrder
    ) {
      setError("Please enter your delivery location.");
      return;
    }

    if (pendingOrder) {
      await initiateMpesaPayment(pendingOrder);
      return;
    }

    try {
      setSubmitting(true);

      const orderData = {
        business_slug: activeStoreSlug || null,
        customer: {
          id: loggedInCustomer?.id || null,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
        },
        order_type: formData.orderType,
        delivery_location:
          formData.orderType === "delivery"
            ? formData.location.trim()
            : null,
        payment_method: formData.paymentMethod,
        notes: formData.notes.trim() || null,
        items: cartItems.map((item) => ({
          product_id: item.product_id || item.id,
          quantity: Number(item.quantity || 1),
          purchase_type: item.purchase_type || "whole",
          unit_price: Number(item.price || 0),
          product_name: item.name || "",
          unit: item.unit || null,
          portions_per_unit:
            item.purchase_type === "portion"
              ? Number(item.portions_per_unit || 1)
              : null,
        })),
      };

      const orderResponse = await api.post("/orders", orderData);
      const order = orderResponse.data?.order;

      if (!order?.id) {
        throw new Error(
          "The server response did not contain an order ID."
        );
      }

      if (formData.paymentMethod === "mpesa") {
        setPendingOrder(order);
        setSubmitting(false);
        await initiateMpesaPayment(order);
        return;
      }

      clearCart();

      navigate("/order-confirmation", {
        replace: true,
        state: {
          order,
          payment: {
            method: "cash",
            status: "pending",
            message:
              "Your order has been placed. Payment is due on pickup or delivery.",
          },
        },
      });
    } catch (err) {
      console.error("Order creation failed:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Could not place your order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isEmpty = cartItems.length === 0 && !pendingOrder;

  if (isEmpty) {
    return (
      <main className="md-checkout">
        <style>{styles}</style>

        <div className="md-checkout-inner">
          <section className="md-checkout-empty">
            <div className="md-checkout-empty-icon">
              <i className="bi bi-bag" />
            </div>

            <h2>Your cart is empty</h2>

            <p>
              Add products from this store before proceeding to checkout.
            </p>

            <Link to={storePath} className="md-checkout-empty-link">
              <i className="bi bi-shop" />
              Browse this store
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const displayedTotal = Number(
    pendingOrder ? pendingOrder.total : cartTotal
  ) || 0;

  return (
    <main className="md-checkout">
      <style>{styles}</style>

      <div className="md-checkout-inner">
        <header className="md-checkout-header">
          <div className="md-checkout-eyebrow">
            <i className="bi bi-shield-check" />
            Secure checkout
          </div>

          <h1 className="md-checkout-title">Complete your order</h1>

          <p className="md-checkout-subtitle">
            Confirm your details, choose how to receive your order and select
            your preferred payment method.
          </p>

          {activeStoreSlug && (
            <Link to={storePath} className="md-checkout-store">
              <i className="bi bi-shop" />
              Ordering from {storeName}
            </Link>
          )}

          <div className="md-checkout-steps">
            <div className="md-checkout-step">
              <span className="md-checkout-step-number">1</span>
              Cart
            </div>

            <span className="md-checkout-step-line" />

            <div className="md-checkout-step md-checkout-step-active">
              <span className="md-checkout-step-number">2</span>
              Checkout
            </div>

            <span className="md-checkout-step-line" />

            <div className="md-checkout-step">
              <span className="md-checkout-step-number">3</span>
              Confirmation
            </div>
          </div>
        </header>

        {error && (
          <div className="md-checkout-alert md-checkout-alert-error" role="alert">
            <i className="bi bi-exclamation-circle" />
            <div>{error}</div>
          </div>
        )}

        {statusMessage && (
          <div
            className="md-checkout-alert md-checkout-alert-info"
            role="status"
            aria-live="polite"
          >
            {submitting && <span className="md-checkout-spinner" />}
            <div>{statusMessage}</div>
          </div>
        )}

        {pendingOrder && (
          <div className="md-checkout-alert md-checkout-alert-warning">
            <i className="bi bi-clock-history" />
            <div>
              <strong>Order created — payment not yet confirmed.</strong>
              <p>
                Order number: {pendingOrder.order_number || pendingOrder.id}
              </p>
              <p>
                Your order is being retained. Please don't create another
                order for the same purchase.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="md-checkout-layout">
            <div>
              <section className="md-checkout-section">
                <div className="md-checkout-section-header">
                  <div className="md-checkout-section-icon">
                    <i className="bi bi-person" />
                  </div>
                  <div>
                    <h2 className="md-checkout-section-title">
                      Customer details
                    </h2>
                    <p className="md-checkout-section-description">
                      Who should we prepare this order for?
                    </p>
                  </div>
                </div>

                <div className="md-checkout-section-body">
                  <div className="md-checkout-field">
                    <label className="md-checkout-label" htmlFor="checkout-name">
                      Full name
                    </label>
                    <input
                      id="checkout-name"
                      name="name"
                      className="md-checkout-input"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={!!pendingOrder || submitting}
                    />
                  </div>

                  <div className="md-checkout-field">
                    <label className="md-checkout-label" htmlFor="checkout-phone">
                      Contact / M-Pesa phone number
                    </label>
                    <input
                      id="checkout-phone"
                      name="phone"
                      type="tel"
                      className="md-checkout-input"
                      autoComplete="tel"
                      placeholder="07XXXXXXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={submitting}
                    />
                    <p className="md-checkout-help">
                      Use the number that should receive the M-Pesa payment
                      prompt.
                    </p>
                  </div>

                  <div className="md-checkout-field">
                    <label className="md-checkout-label" htmlFor="checkout-email">
                      Email address <span className="md-checkout-optional">(optional)</span>
                    </label>
                    <input
                      id="checkout-email"
                      name="email"
                      type="email"
                      className="md-checkout-input"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!!pendingOrder || submitting}
                    />
                  </div>
                </div>
              </section>

              <section className="md-checkout-section">
                <div className="md-checkout-section-header">
                  <div className="md-checkout-section-icon">
                    <i className="bi bi-truck" />
                  </div>
                  <div>
                    <h2 className="md-checkout-section-title">
                      Order fulfilment
                    </h2>
                    <p className="md-checkout-section-description">
                      Choose pickup or delivery.
                    </p>
                  </div>
                </div>

                <div className="md-checkout-section-body">
                  <div className="md-checkout-options">
                    <label
                      className={`md-checkout-option ${
                        formData.orderType === "pickup"
                          ? "md-checkout-option-selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="orderType"
                        value="pickup"
                        checked={formData.orderType === "pickup"}
                        onChange={handleChange}
                        disabled={!!pendingOrder || submitting}
                      />
                      <span className="md-checkout-option-content">
                        <span className="md-checkout-option-title">Pickup</span>
                        <span className="md-checkout-option-description">
                          Collect your order from the business.
                        </span>
                      </span>
                    </label>

                    <label
                      className={`md-checkout-option ${
                        formData.orderType === "delivery"
                          ? "md-checkout-option-selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="orderType"
                        value="delivery"
                        checked={formData.orderType === "delivery"}
                        onChange={handleChange}
                        disabled={!!pendingOrder || submitting}
                      />
                      <span className="md-checkout-option-content">
                        <span className="md-checkout-option-title">Delivery</span>
                        <span className="md-checkout-option-description">
                          Have your order delivered to your location.
                        </span>
                      </span>
                    </label>
                  </div>

                  {formData.orderType === "delivery" && (
                    <div className="md-checkout-field" style={{ marginTop: 20 }}>
                      <label
                        className="md-checkout-label"
                        htmlFor="checkout-location"
                      >
                        Delivery location
                      </label>
                      <textarea
                        id="checkout-location"
                        name="location"
                        className="md-checkout-textarea"
                        placeholder="Enter your area, estate, building and delivery directions..."
                        value={formData.location}
                        onChange={handleChange}
                        required
                        disabled={!!pendingOrder || submitting}
                      />
                    </div>
                  )}
                </div>
              </section>

              <section className="md-checkout-section">
                <div className="md-checkout-section-header">
                  <div className="md-checkout-section-icon">
                    <i className="bi bi-wallet2" />
                  </div>
                  <div>
                    <h2 className="md-checkout-section-title">
                      Payment method
                    </h2>
                    <p className="md-checkout-section-description">
                      Choose how you want to pay.
                    </p>
                  </div>
                </div>

                <div className="md-checkout-section-body">
                  <div className="md-checkout-options">
                    <label
                      className={`md-checkout-option ${
                        formData.paymentMethod === "mpesa"
                          ? "md-checkout-option-selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mpesa"
                        checked={formData.paymentMethod === "mpesa"}
                        onChange={handleChange}
                        disabled={!!pendingOrder || submitting}
                      />
                      <span className="md-checkout-option-content">
                        <span className="md-checkout-option-title">M-Pesa</span>
                        <span className="md-checkout-option-description">
                          Receive a payment prompt on your phone.
                        </span>
                      </span>
                    </label>

                    <label
                      className={`md-checkout-option ${
                        formData.paymentMethod === "cash"
                          ? "md-checkout-option-selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={formData.paymentMethod === "cash"}
                        onChange={handleChange}
                        disabled={!!pendingOrder || submitting}
                      />
                      <span className="md-checkout-option-content">
                        <span className="md-checkout-option-title">
                          Pay on receipt
                        </span>
                        <span className="md-checkout-option-description">
                          Pay when collecting or receiving your order.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              <section className="md-checkout-section">
                <div className="md-checkout-section-header">
                  <div className="md-checkout-section-icon">
                    <i className="bi bi-chat-left-text" />
                  </div>
                  <div>
                    <h2 className="md-checkout-section-title">
                      Order notes
                    </h2>
                    <p className="md-checkout-section-description">
                      Add any additional instructions.
                    </p>
                  </div>
                </div>

                <div className="md-checkout-section-body">
                  <textarea
                    name="notes"
                    className="md-checkout-textarea"
                    placeholder="Additional instructions (optional)"
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={!!pendingOrder || submitting}
                  />
                </div>
              </section>
            </div>

            <aside className="md-checkout-summary">
              <div className="md-checkout-summary-header">
                <h2 className="md-checkout-summary-title">
                  Order summary
                </h2>
                <p className="md-checkout-summary-subtitle">
                  {pendingOrder
                    ? "Payment details for your existing order."
                    : `Your order from ${storeName}.`}
                </p>
              </div>

              <div className="md-checkout-summary-body">
                {pendingOrder ? (
                  <>
                    <div className="md-checkout-summary-row">
                      <span>Order number</span>
                      <strong>
                        {pendingOrder.order_number || pendingOrder.id}
                      </strong>
                    </div>
                    <div className="md-checkout-summary-row">
                      <span>Payment status</span>
                      <strong>Not confirmed</strong>
                    </div>
                  </>
                ) : (
                  <div className="md-checkout-products">
                    {cartItems.map((item, index) => (
                      <div
                        className="md-checkout-product"
                        key={`${item.id}-${item.purchase_type || "whole"}-${index}`}
                      >
                        <div>
                          <h3 className="md-checkout-product-name">
                            {item.name}
                          </h3>
                          <div className="md-checkout-product-meta">
                            {item.purchase_type === "portion"
                              ? "Portion"
                              : "Whole unit"}
                            {" · "}
                            {item.quantity} × {formatPrice(item.price, currency)}
                          </div>
                        </div>
                        <div className="md-checkout-product-price">
                          {formatPrice(
                            Number(item.price || 0) *
                              Number(item.quantity || 0),
                            currency
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <hr className="md-checkout-divider" />

                <div className="md-checkout-summary-row">
                  <span>Subtotal</span>
                  <strong>{formatPrice(displayedTotal, currency)}</strong>
                </div>

                <div className="md-checkout-summary-row">
                  <span>Delivery</span>
                  <span>To be confirmed</span>
                </div>

                <hr className="md-checkout-divider" />

                <div className="md-checkout-total">
                  <span className="md-checkout-total-label">Total</span>
                  <span className="md-checkout-total-value">
                    {formatPrice(displayedTotal, currency)}
                  </span>
                </div>

                <button
                  type="submit"
                  className="md-checkout-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="md-checkout-spinner" />
                      Processing...
                    </>
                  ) : pendingOrder ? (
                    "Retry M-Pesa payment"
                  ) : formData.paymentMethod === "mpesa" ? (
                    "Place order & pay"
                  ) : (
                    "Place order"
                  )}
                  {!submitting && <i className="bi bi-arrow-right" />}
                </button>

                {pendingOrder && (
                  <button
                    type="button"
                    className="md-checkout-secondary"
                    onClick={() => waitForPaymentConfirmation(pendingOrder)}
                    disabled={submitting}
                  >
                    <i className="bi bi-arrow-clockwise" />
                    Check payment status
                  </button>
                )}

                {!pendingOrder && (
                  <Link to="/cart" className="md-checkout-secondary">
                    <i className="bi bi-arrow-left" />
                    Back to cart
                  </Link>
                )}

                <div className="md-checkout-secure">
                  <i className="bi bi-shield-lock" />
                  <span>
                    M-Pesa orders are only marked as paid after payment
                    confirmation. Keep your order number if confirmation
                    takes longer than expected.
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </main>
  );
}
