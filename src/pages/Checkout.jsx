import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../api/api";

const POLL_INTERVAL = 3000;
const MAX_POLL_ATTEMPTS = 60;

const styles = `
  .hm-checkout {
    --hm-bg: #171d19;
    --hm-panel: #202923;
    --hm-panel-light: #28342b;
    --hm-green: #326747;
    --hm-gold: #d6b36a;
    --hm-cream: #f7f5ef;
    --hm-muted: #a8b2a9;
    --hm-border: rgba(255,255,255,.10);
    min-height: 75vh;
    padding: 42px 0 76px;
    background: var(--hm-bg);
    color: var(--hm-cream);
  }

  .hm-checkout *,
  .hm-checkout *::before,
  .hm-checkout *::after {
    box-sizing: border-box;
  }

  .hm-checkout button,
  .hm-checkout input,
  .hm-checkout textarea {
    font: inherit;
  }

  .hm-checkout-container {
    width: min(1160px, calc(100% - 40px));
    margin: 0 auto;
  }

  .hm-checkout-header {
    margin-bottom: 35px;
  }

  .hm-checkout-eyebrow {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--hm-gold);
    font-size: .75rem;
    font-weight: 800;
    letter-spacing: 2.5px;
    text-transform: uppercase;
  }

  .hm-checkout-eyebrow::before {
    content: "";
    width: 28px;
    height: 1px;
    background: var(--hm-gold);
  }

  .hm-checkout-title {
    margin: 14px 0 12px;
    color: var(--hm-cream);
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(2.4rem, 5vw, 3.5rem);
    font-weight: 600;
    line-height: 1.1;
  }

  .hm-checkout-subtitle {
    max-width: 650px;
    margin: 0;
    color: var(--hm-muted);
    font-size: .97rem;
    line-height: 1.8;
  }

  .hm-checkout-steps {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 25px;
  }

  .hm-checkout-step {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--hm-muted);
    font-size: .8rem;
    font-weight: 650;
  }

  .hm-checkout-step-number {
    display: grid;
    width: 29px;
    height: 29px;
    place-items: center;
    border: 1px solid var(--hm-border);
    border-radius: 50%;
    background: var(--hm-panel);
    color: var(--hm-muted);
    font-size: .78rem;
  }

  .hm-checkout-step-active {
    color: var(--hm-gold);
  }

  .hm-checkout-step-active .hm-checkout-step-number {
    border-color: var(--hm-gold);
    background: rgba(251, 191, 36,.10);
    color: var(--hm-gold);
  }

  .hm-checkout-step-line {
    width: 35px;
    height: 1px;
    background: var(--hm-border);
  }

  .hm-checkout-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(320px, .85fr);
    align-items: start;
    gap: 28px;
  }

  .hm-checkout-section {
    margin-bottom: 19px;
    overflow: hidden;
    border: 1px solid var(--hm-border);
    border-radius: 15px;
    background: var(--hm-panel);
  }

  .hm-checkout-section-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 21px 24px;
    border-bottom: 1px solid var(--hm-border);
    background: linear-gradient(120deg, rgba(251, 191, 36,.045), transparent);
  }

  .hm-checkout-section-icon {
    display: grid;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    place-items: center;
    border: 1px solid rgba(251, 191, 36,.23);
    border-radius: 11px;
    background: rgba(251, 191, 36,.07);
    color: var(--hm-gold);
    font-size: 1.15rem;
  }

  .hm-checkout-section-title {
    margin: 0;
    color: var(--hm-cream);
    font-size: 1.05rem;
    font-weight: 800;
  }

  .hm-checkout-section-description {
    margin: 5px 0 0;
    color: var(--hm-muted);
    font-size: .8rem;
    line-height: 1.5;
  }

  .hm-checkout-section-body {
    padding: 24px;
  }

  .hm-checkout-field {
    margin-bottom: 21px;
  }

  .hm-checkout-field:last-child {
    margin-bottom: 0;
  }

  .hm-checkout-label {
    display: block;
    margin-bottom: 9px;
    color: var(--hm-cream);
    font-size: .86rem;
    font-weight: 750;
  }

  .hm-checkout-optional {
    color: var(--hm-muted);
    font-size: .78rem;
    font-weight: 450;
  }

  .hm-checkout-input,
  .hm-checkout-textarea {
    display: block;
    width: 100%;
    min-height: 49px;
    padding: 13px 14px;
    border: 1px solid rgba(255,255,255,.13);
    border-radius: 9px;
    outline: none;
    background: #1a211c;
    color: var(--hm-cream);
    font-size: .91rem;
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .hm-checkout-input::placeholder,
  .hm-checkout-textarea::placeholder {
    color: #7f8b81;
  }

  .hm-checkout-input:focus,
  .hm-checkout-textarea:focus {
    border-color: var(--hm-gold);
    box-shadow: 0 0 0 3px rgba(251, 191, 36,.09);
  }

  .hm-checkout-input:disabled,
  .hm-checkout-textarea:disabled {
    opacity: .6;
    cursor: not-allowed;
  }

  .hm-checkout-textarea {
    min-height: 112px;
    resize: vertical;
    line-height: 1.65;
  }

  .hm-checkout-help {
    margin: 8px 0 0;
    color: var(--hm-muted);
    font-size: .77rem;
    line-height: 1.6;
  }

  .hm-checkout-options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 13px;
  }

  .hm-checkout-option {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
    padding: 17px 15px;
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 11px;
    background: #1b231d;
    cursor: pointer;
    transition: border-color .2s ease, background .2s ease;
  }

  .hm-checkout-option:hover {
    border-color: rgba(251, 191, 36,.45);
  }

  .hm-checkout-option-selected {
    border-color: var(--hm-gold);
    background: rgba(251, 191, 36,.065);
  }

  .hm-checkout-option input {
    width: 17px;
    height: 17px;
    flex: 0 0 17px;
    margin: 2px 0 0;
    accent-color: var(--hm-gold);
    cursor: pointer;
  }

  .hm-checkout-option-content {
    min-width: 0;
  }

  .hm-checkout-option-title {
    display: block;
    margin: 0 0 5px;
    color: var(--hm-cream);
    font-size: .88rem;
    font-weight: 800;
  }

  .hm-checkout-option-description {
    display: block;
    color: var(--hm-muted);
    font-size: .77rem;
    line-height: 1.65;
  }

  .hm-checkout-option-icon {
    display: grid;
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    place-items: center;
    border: 1px solid rgba(251, 191, 36,.2);
    border-radius: 9px;
    background: rgba(251, 191, 36,.07);
    color: var(--hm-gold);
    font-size: 1rem;
  }

  .hm-checkout-alert {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 19px;
    padding: 16px 18px;
    border: 1px solid;
    border-radius: 11px;
    font-size: .88rem;
    line-height: 1.7;
    overflow-wrap: anywhere;
  }

  .hm-checkout-alert-error {
    border-color: rgba(255,125,125,.3);
    background: rgba(255,100,100,.075);
    color: #ffb6b6;
  }

  .hm-checkout-alert-info {
    border-color: rgba(110,175,232,.3);
    background: rgba(65,125,190,.09);
    color: #c0e1ff;
  }

  .hm-checkout-alert-warning {
    border-color: rgba(251, 191, 36,.35);
    background: rgba(251, 191, 36,.075);
    color: var(--hm-cream);
  }

  .hm-checkout-alert-icon {
    flex: 0 0 auto;
    font-size: 1.15rem;
  }

  .hm-checkout-alert strong {
    color: var(--hm-cream);
  }

  .hm-checkout-alert p {
    margin: 7px 0 0;
  }

  .hm-checkout-alert p:last-child {
    margin-bottom: 0;
  }

  .hm-checkout-summary {
    position: sticky;
    top: 24px;
    overflow: hidden;
    border: 1px solid rgba(251, 191, 36,.25);
    border-radius: 15px;
    background: var(--hm-panel);
  }

  .hm-checkout-summary-header {
    padding: 24px;
    border-bottom: 1px solid var(--hm-border);
    background: linear-gradient(135deg, rgba(251, 191, 36,.09), transparent);
  }

  .hm-checkout-summary-title {
    margin: 0;
    color: var(--hm-cream);
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1.6rem;
    font-weight: 600;
  }

  .hm-checkout-summary-subtitle {
    margin: 7px 0 0;
    color: var(--hm-muted);
    font-size: .82rem;
    line-height: 1.6;
  }

  .hm-checkout-summary-body {
    padding: 24px;
  }

  .hm-checkout-products {
    display: grid;
    gap: 17px;
  }

  .hm-checkout-product {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    align-items: start;
  }

  .hm-checkout-product-name {
    margin: 0;
    color: var(--hm-cream);
    font-size: .88rem;
    font-weight: 750;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }

  .hm-checkout-product-meta {
    margin-top: 4px;
    color: var(--hm-muted);
    font-size: .77rem;
    line-height: 1.5;
  }

  .hm-checkout-product-price {
    color: var(--hm-cream);
    font-size: .87rem;
    font-weight: 750;
    text-align: right;
    white-space: nowrap;
  }

  .hm-checkout-divider {
    height: 1px;
    margin: 22px 0;
    border: 0;
    background: var(--hm-border);
  }

  .hm-checkout-summary-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 17px;
    color: var(--hm-muted);
    font-size: .86rem;
  }

  .hm-checkout-summary-row strong {
    color: var(--hm-cream);
    font-weight: 750;
    text-align: right;
  }

  .hm-checkout-total-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 14px;
    margin-bottom: 24px;
  }

  .hm-checkout-total-label {
    color: var(--hm-cream);
    font-size: 1rem;
    font-weight: 800;
  }

  .hm-checkout-total-value {
    color: var(--hm-gold);
    font-size: 1.65rem;
    font-weight: 850;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .hm-checkout-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    min-height: 54px;
    padding: 14px 18px;
    border: 1px solid var(--hm-gold);
    border-radius: 9px;
    background: var(--hm-gold);
    color: #1b241e;
    cursor: pointer;
    font-size: .91rem;
    font-weight: 850;
    transition: transform .2s ease, background .2s ease;
  }

  .hm-checkout-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    background: #ecd39a;
  }

  .hm-checkout-submit:disabled {
    opacity: .65;
    cursor: not-allowed;
  }

  .hm-checkout-secondary-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    width: 100%;
    min-height: 46px;
    margin-top: 10px;
    padding: 12px 15px;
    border: 1px solid rgba(255,255,255,.16);
    border-radius: 9px;
    background: transparent;
    color: var(--hm-cream);
    cursor: pointer;
    font-size: .85rem;
    font-weight: 700;
    text-decoration: none;
    transition: border-color .2s ease, background .2s ease;
  }

  .hm-checkout-secondary-button:hover:not(:disabled) {
    border-color: var(--hm-gold);
    background: rgba(251, 191, 36,.05);
    color: var(--hm-gold);
  }

  .hm-checkout-secondary-button:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .hm-checkout-back-link {
    display: block;
    margin-top: 19px;
    color: var(--hm-muted);
    font-size: .84rem;
    font-weight: 650;
    text-align: center;
    text-decoration: none;
  }

  .hm-checkout-back-link:hover {
    color: var(--hm-gold);
  }

  .hm-checkout-secure-note {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 20px;
    padding: 14px;
    border: 1px solid var(--hm-border);
    border-radius: 10px;
    background: rgba(255,255,255,.02);
    color: var(--hm-muted);
    font-size: .76rem;
    line-height: 1.7;
  }

  .hm-checkout-secure-icon {
    color: var(--hm-gold);
    font-size: 1rem;
  }

  .hm-checkout-spinner {
    display: inline-block;
    width: 17px;
    height: 17px;
    flex: 0 0 17px;
    border: 2px solid rgba(255,255,255,.25);
    border-top-color: currentColor;
    border-radius: 50%;
    animation: hm-checkout-spin .75s linear infinite;
  }

  @keyframes hm-checkout-spin {
    to { transform: rotate(360deg); }
  }

  .hm-checkout-empty {
    max-width: 650px;
    margin: 0 auto;
    padding: 45px 25px;
    border: 1px solid var(--hm-border);
    border-radius: 18px;
    background: var(--hm-panel);
    text-align: center;
  }

  .hm-checkout-empty-icon {
    display: grid;
    width: 85px;
    height: 85px;
    margin: 0 auto 23px;
    place-items: center;
    border: 1px solid rgba(251, 191, 36,.25);
    border-radius: 50%;
    background: rgba(251, 191, 36,.07);
    color: var(--hm-gold);
    font-size: 2.4rem;
  }

  .hm-checkout-empty h2 {
    margin: 0 0 12px;
    color: var(--hm-cream);
    font-family: Georgia, "Times New Roman", serif;
    font-size: 2rem;
  }

  .hm-checkout-empty p {
    margin: 0 0 25px;
    color: var(--hm-muted);
    line-height: 1.8;
  }

  .hm-checkout-empty-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 48px;
    padding: 13px 22px;
    border: 1px solid var(--hm-gold);
    border-radius: 9px;
    background: var(--hm-gold);
    color: #1b241e;
    font-size: .9rem;
    font-weight: 800;
    text-decoration: none;
  }

  @media (max-width: 900px) {
    .hm-checkout-layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .hm-checkout-summary {
      position: static;
    }
  }

  @media (max-width: 560px) {
    .hm-checkout {
      padding: 28px 0 48px;
    }

    .hm-checkout-container {
      width: calc(100% - 28px);
    }

    .hm-checkout-header {
      margin-bottom: 27px;
    }

    .hm-checkout-title {
      font-size: 2.55rem;
    }

    .hm-checkout-subtitle {
      font-size: .9rem;
    }

    .hm-checkout-steps {
      gap: 7px;
    }

    .hm-checkout-step {
      gap: 6px;
      font-size: .72rem;
    }

    .hm-checkout-step-number {
      width: 26px;
      height: 26px;
    }

    .hm-checkout-step-line {
      width: 17px;
    }

    .hm-checkout-section-header {
      padding: 17px;
      gap: 11px;
    }

    .hm-checkout-section-icon {
      width: 37px;
      height: 37px;
      flex-basis: 37px;
    }

    .hm-checkout-section-body {
      padding: 18px;
    }

    .hm-checkout-options {
      grid-template-columns: minmax(0, 1fr);
    }

    .hm-checkout-option {
      padding: 14px;
    }

    .hm-checkout-summary-header,
    .hm-checkout-summary-body {
      padding: 20px;
    }

    .hm-checkout-total-value {
      font-size: 1.4rem;
    }

    .hm-checkout-empty {
      padding: 35px 18px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hm-checkout *,
    .hm-checkout *::before,
    .hm-checkout *::after {
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: .01ms !important;
    }
  }
`;

function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const loggedInCustomer = (() => {
    try {
      return JSON.parse(localStorage.getItem("customer") || "null");
    } catch {
      return null;
    }
  })();

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

  const pollingRef = useRef(false);

  const sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

  const formatPrice = (amount) =>
    `KSh ${Number(amount || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  // Verify payment status through the backend.
  const checkPaymentStatus = async (order) => {
    if (!order?.id) {
      throw new Error("The order ID is missing.");
    }

    const response = await api.get(`/payments/status/${order.id}`);
    return response.data;
  };

  // Poll until payment is confirmed, failed, or times out.
  const waitForPaymentConfirmation = async (order) => {
    if (pollingRef.current) {
      return;
    }

    pollingRef.current = true;
    setSubmitting(true);
    setError("");
    setStatusMessage(
      "Waiting for M-Pesa confirmation. Complete the prompt on your phone."
    );

    let consecutiveErrors = 0;

    try {
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        if (attempt > 0) {
          await sleep(POLL_INTERVAL);
        }

        let payment;

        try {
          payment = await checkPaymentStatus(order);
          consecutiveErrors = 0;
        } catch (err) {
          console.error("Could not check payment status:", err);
          consecutiveErrors++;

          if (consecutiveErrors < 5) {
            setStatusMessage(
              "Reconnecting to the payment service. Your order is being retained."
            );
            continue;
          }

          setError(
            "We couldn't verify your payment because the payment service is unavailable. Your cart has been retained. Please try checking again."
          );
          setStatusMessage("");
          return;
        }

        const paymentStatus = String(
          payment.payment_status || ""
        ).toLowerCase();

        const transactionStatus = String(
          payment.transaction_status || ""
        ).toLowerCase();

        // Success requires the backend to report both statuses as paid.
        if (
          paymentStatus === "paid" &&
          transactionStatus === "paid"
        ) {
          const confirmedOrder = {
            ...order,
            payment_status: "paid",
          };

          setStatusMessage("Payment confirmed successfully!");
          clearCart();
          setPendingOrder(null);

          navigate("/order-confirmation", {
            replace: true,
            state: {
              order: confirmedOrder,
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
              "M-Pesa payment failed. Your cart has been retained. You can retry payment for the same order."
          );
          return;
        }

        if (transactionStatus === "not_initiated") {
          setStatusMessage(
            "No active payment request was found. You can retry payment for this order."
          );
          return;
        }

        setStatusMessage(
          `Waiting for payment confirmation... (${attempt + 1}/${MAX_POLL_ATTEMPTS})`
        );
      }

      setStatusMessage("");
      setError(
        "Payment confirmation is taking longer than expected. Do not place another order. Your cart has been retained; check your M-Pesa messages and try checking payment again."
      );
    } finally {
      pollingRef.current = false;
      setSubmitting(false);
    }
  };

  // Initiate M-Pesa for an existing order.
  const initiateMpesaPayment = async (order) => {
    if (!order?.id) {
      setError(
        "The order ID is missing. Please contact support before retrying."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setStatusMessage("Connecting to M-Pesa...");

      const response = await api.post("/payments/stk-push", {
        order_id: order.id,
        phone: formData.phone.trim(),
      });

      console.log("M-Pesa STK Push initiated:", response.data);

      setStatusMessage(
        "Payment prompt requested. Check your phone and enter your M-Pesa PIN."
      );
    } catch (err) {
      console.error("M-Pesa payment initiation response:", err);

      const status = err.response?.status;
      const data = err.response?.data || {};

      if (
        status === 409 &&
        String(data.payment_status || "").toLowerCase() === "pending"
      ) {
        setStatusMessage(
          "An M-Pesa payment request may already be active. Checking its status..."
        );
      } else {
        setStatusMessage("");
        setError(
          `${data.error || data.message || "Could not initiate M-Pesa payment."} Your order has been retained. You can retry using the same order.`
        );
        return;
      }
    } finally {
      setSubmitting(false);
    }

    await waitForPaymentConfirmation(order);
  };

  const resumePaymentCheck = async () => {
    if (!pendingOrder || submitting) {
      return;
    }

    await waitForPaymentConfirmation(pendingOrder);
  };

  // Submit checkout.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatusMessage("");

    if (submitting || pollingRef.current) {
      return;
    }

    if (cartItems.length === 0 && !pendingOrder) {
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

    // Do not create another order while an order awaits payment.
    if (pendingOrder) {
      await initiateMpesaPayment(pendingOrder);
      return;
    }

    try {
      setSubmitting(true);

      const orderData = {
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
          product_id: item.id,
          quantity: item.quantity,
        })),
      };

      // Step 1: create the order.
      const orderResponse = await api.post("/orders", orderData);
      const order = orderResponse.data?.order;

      if (!order?.id) {
        throw new Error(
          "The server response did not contain an order ID."
        );
      }

      console.log("Order created:", order);

      // Step 2a: M-Pesa payment.
      if (formData.paymentMethod === "mpesa") {
        setPendingOrder(order);
        setSubmitting(false);
        await initiateMpesaPayment(order);
        return;
      }

      // Step 2b: cash on pickup/delivery.
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

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Could not place your order. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isEmpty = cartItems.length === 0 && !pendingOrder;

  if (isEmpty) {
    return (
      <div className="hm-checkout">
        <style>{styles}</style>

        <div className="hm-checkout-container">
          <div className="hm-checkout-header">
            <div className="hm-checkout-eyebrow">Almost there</div>
            <h1 className="hm-checkout-title">Checkout</h1>
            <p className="hm-checkout-subtitle">
              Your order starts with your selection.
            </p>
          </div>

          <section className="hm-checkout-empty">
            <div className="hm-checkout-empty-icon" aria-hidden="true">
              ♧
            </div>

            <h2>Your cart is empty</h2>

            <p>
              Add a few products to your cart before proceeding to checkout.
              Your next selection is just around the corner.
            </p>

            <Link
              to="/products"
              className="hm-checkout-empty-link"
            >
              Browse the collection <span aria-hidden="true">→</span>
            </Link>
          </section>
        </div>
      </div>
    );
  }

  const displayedTotal = Number(
    pendingOrder ? pendingOrder.total : cartTotal
  ) || 0;

  return (
    <div className="hm-checkout">
      <style>{styles}</style>

      <div className="hm-checkout-container">
        <header className="hm-checkout-header">
          <div className="hm-checkout-eyebrow">
            MyDuka
          </div>

          <h1 className="hm-checkout-title">
            Complete your order
          </h1>

          <p className="hm-checkout-subtitle">
            Just a few details and you're all set. Review your order,
            choose how to receive it, and select your payment method.
          </p>

          <div className="hm-checkout-steps" aria-label="Checkout progress">
            <div className="hm-checkout-step">
              <span className="hm-checkout-step-number">1</span>
              <span>Cart</span>
            </div>

            <span className="hm-checkout-step-line" aria-hidden="true" />

            <div className="hm-checkout-step hm-checkout-step-active">
              <span className="hm-checkout-step-number">2</span>
              <span>Checkout</span>
            </div>

            <span className="hm-checkout-step-line" aria-hidden="true" />

            <div className="hm-checkout-step">
              <span className="hm-checkout-step-number">3</span>
              <span>Confirmation</span>
            </div>
          </div>
        </header>

        {error && (
          <div
            className="hm-checkout-alert hm-checkout-alert-error"
            role="alert"
          >
            <span className="hm-checkout-alert-icon" aria-hidden="true">
              !
            </span>
            <div>{error}</div>
          </div>
        )}

        {statusMessage && (
          <div
            className="hm-checkout-alert hm-checkout-alert-info"
            role="status"
            aria-live="polite"
          >
            {submitting ? (
              <span
                className="hm-checkout-spinner"
                aria-hidden="true"
              />
            ) : (
              <span className="hm-checkout-alert-icon" aria-hidden="true">
                ◈
              </span>
            )}

            <div>{statusMessage}</div>
          </div>
        )}

        {pendingOrder && (
          <div className="hm-checkout-alert hm-checkout-alert-warning">
            <span className="hm-checkout-alert-icon" aria-hidden="true">
              !
            </span>

            <div>
              <strong>Order created — payment not yet confirmed</strong>

              <p>
                Order number:{" "}
                <strong>
                  {pendingOrder.order_number || pendingOrder.id}
                </strong>
              </p>

              <p>
                We're retaining this order while we check payment. Please
                don't create another order for the same purchase.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="hm-checkout-layout">
            <div>
              {/* Customer details */}
              <section className="hm-checkout-section">
                <div className="hm-checkout-section-header">
                  <div className="hm-checkout-section-icon" aria-hidden="true">
                    ♙
                  </div>

                  <div>
                    <h2 className="hm-checkout-section-title">
                      Customer details
                    </h2>
                    <p className="hm-checkout-section-description">
                      Tell us who we're preparing this order for.
                    </p>
                  </div>
                </div>

                <div className="hm-checkout-section-body">
                  <div className="hm-checkout-field">
                    <label
                      className="hm-checkout-label"
                      htmlFor="customer-name"
                    >
                      Full name
                    </label>

                    <input
                      id="customer-name"
                      type="text"
                      name="name"
                      className="hm-checkout-input"
                      placeholder="Enter your full name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={!!pendingOrder || submitting}
                    />
                  </div>

                  <div className="hm-checkout-field">
                    <label
                      className="hm-checkout-label"
                      htmlFor="customer-phone"
                    >
                      M-Pesa / contact phone number
                    </label>

                    <input
                      id="customer-phone"
                      type="tel"
                      name="phone"
                      className="hm-checkout-input"
                      placeholder="07XXXXXXXX"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={submitting}
                    />

                    <p className="hm-checkout-help">
                      For M-Pesa, use the number that should receive the
                      payment prompt.
                    </p>
                  </div>

                  <div className="hm-checkout-field">
                    <label
                      className="hm-checkout-label"
                      htmlFor="customer-email"
                    >
                      Email address{" "}
                      <span className="hm-checkout-optional">
                        (optional)
                      </span>
                    </label>

                    <input
                      id="customer-email"
                      type="email"
                      name="email"
                      className="hm-checkout-input"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!!pendingOrder || submitting}
                    />
                  </div>
                </div>
              </section>

              {/* Fulfilment */}
              <section className="hm-checkout-section">
                <div className="hm-checkout-section-header">
                  <div className="hm-checkout-section-icon" aria-hidden="true">
                    ⇄
                  </div>

                  <div>
                    <h2 className="hm-checkout-section-title">
                      How would you like to receive your order?
                    </h2>
                    <p className="hm-checkout-section-description">
                      Choose pickup or delivery.
                    </p>
                  </div>
                </div>

                <div className="hm-checkout-section-body">
                  <div className="hm-checkout-options">
                    <label
                      className={`hm-checkout-option ${
                        formData.orderType === "pickup"
                          ? "hm-checkout-option-selected"
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

                      <span className="hm-checkout-option-content">
                        <span className="hm-checkout-option-title">
                          Pickup
                        </span>
                        <span className="hm-checkout-option-description">
                          Collect your order in person.
                        </span>
                      </span>
                    </label>

                    <label
                      className={`hm-checkout-option ${
                        formData.orderType === "delivery"
                          ? "hm-checkout-option-selected"
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

                      <span className="hm-checkout-option-content">
                        <span className="hm-checkout-option-title">
                          Delivery
                        </span>
                        <span className="hm-checkout-option-description">
                          Have your order delivered to you.
                        </span>
                      </span>
                    </label>
                  </div>

                  {formData.orderType === "delivery" && (
                    <div className="hm-checkout-field" style={{ marginTop: 22 }}>
                      <label
                        className="hm-checkout-label"
                        htmlFor="delivery-location"
                      >
                        Delivery location
                      </label>

                      <textarea
                        id="delivery-location"
                        name="location"
                        className="hm-checkout-textarea"
                        placeholder="Enter your area, estate, building, or other delivery directions..."
                        value={formData.location}
                        onChange={handleChange}
                        required
                        disabled={!!pendingOrder || submitting}
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Payment method */}
              <section className="hm-checkout-section">
                <div className="hm-checkout-section-header">
                  <div className="hm-checkout-section-icon" aria-hidden="true">
                    ◈
                  </div>

                  <div>
                    <h2 className="hm-checkout-section-title">
                      Payment method
                    </h2>
                    <p className="hm-checkout-section-description">
                      Choose how you want to pay for your order.
                    </p>
                  </div>
                </div>

                <div className="hm-checkout-section-body">
                  <div className="hm-checkout-options">
                    <label
                      className={`hm-checkout-option ${
                        formData.paymentMethod === "mpesa"
                          ? "hm-checkout-option-selected"
                          : ""
                      }`}
                    >
                      <span className="hm-checkout-option-icon" aria-hidden="true">
                        M
                      </span>

                      <span className="hm-checkout-option-content">
                        <span className="hm-checkout-option-title">
                          M-Pesa
                        </span>
                        <span className="hm-checkout-option-description">
                          Receive a payment prompt on your phone.
                        </span>
                      </span>

                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mpesa"
                        checked={formData.paymentMethod === "mpesa"}
                        onChange={handleChange}
                        disabled={!!pendingOrder || submitting}
                      />
                    </label>

                    <label
                      className={`hm-checkout-option ${
                        formData.paymentMethod === "cash"
                          ? "hm-checkout-option-selected"
                          : ""
                      }`}
                    >
                      <span className="hm-checkout-option-icon" aria-hidden="true">
                        KSh
                      </span>

                      <span className="hm-checkout-option-content">
                        <span className="hm-checkout-option-title">
                          Pay on receipt
                        </span>
                        <span className="hm-checkout-option-description">
                          Pay when collecting or receiving your order.
                        </span>
                      </span>

                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={formData.paymentMethod === "cash"}
                        onChange={handleChange}
                        disabled={!!pendingOrder || submitting}
                      />
                    </label>
                  </div>
                </div>
              </section>

              {/* Order notes */}
              <section className="hm-checkout-section">
                <div className="hm-checkout-section-header">
                  <div className="hm-checkout-section-icon" aria-hidden="true">
                    ✎
                  </div>

                  <div>
                    <h2 className="hm-checkout-section-title">
                      Order notes
                    </h2>
                    <p className="hm-checkout-section-description">
                      Add any extra information about your order.
                    </p>
                  </div>
                </div>

                <div className="hm-checkout-section-body">
                  <textarea
                    name="notes"
                    className="hm-checkout-textarea"
                    rows="3"
                    placeholder="Additional instructions (optional)"
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={!!pendingOrder || submitting}
                  />
                </div>
              </section>
            </div>

            {/* Order summary */}
            <aside
              className="hm-checkout-summary"
              aria-label="Order summary"
            >
              <div className="hm-checkout-summary-header">
                <h2 className="hm-checkout-summary-title">
                  Order summary
                </h2>

                <p className="hm-checkout-summary-subtitle">
                  {pendingOrder
                    ? "Payment details for your existing order."
                    : "A final look at what's in your selection."}
                </p>
              </div>

              <div className="hm-checkout-summary-body">
                {pendingOrder ? (
                  <>
                    <div className="hm-checkout-summary-row">
                      <span>Order number</span>
                      <strong>
                        {pendingOrder.order_number || pendingOrder.id}
                      </strong>
                    </div>

                    <div className="hm-checkout-summary-row">
                      <span>Payment status</span>
                      <strong style={{ color: "#e8c77f" }}>
                        Not confirmed
                      </strong>
                    </div>
                  </>
                ) : (
                  <div className="hm-checkout-products">
                    {cartItems.map((item) => (
                      <div className="hm-checkout-product" key={item.id}>
                        <div>
                          <h3 className="hm-checkout-product-name">
                            {item.name}
                          </h3>

                          <div className="hm-checkout-product-meta">
                            {item.quantity} × {formatPrice(item.price)}
                          </div>
                        </div>

                        <div className="hm-checkout-product-price">
                          {formatPrice(
                            Number(item.price) * Number(item.quantity)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <hr className="hm-checkout-divider" />

                <div className="hm-checkout-summary-row">
                  <span>Subtotal</span>
                  <strong>{formatPrice(displayedTotal)}</strong>
                </div>

                <div className="hm-checkout-summary-row">
                  <span>Delivery</span>
                  <span style={{ textAlign: "right" }}>
                    To be confirmed
                  </span>
                </div>

                <hr className="hm-checkout-divider" />

                <div className="hm-checkout-total-row">
                  <span className="hm-checkout-total-label">Total</span>
                  <span className="hm-checkout-total-value">
                    {formatPrice(displayedTotal)}
                  </span>
                </div>

                <button
                  type="submit"
                  className="hm-checkout-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span
                        className="hm-checkout-spinner"
                        aria-hidden="true"
                      />
                      {pendingOrder
                        ? "Checking payment..."
                        : "Processing order..."}
                    </>
                  ) : pendingOrder ? (
                    <>
                      Retry M-Pesa payment
                      <span aria-hidden="true">→</span>
                    </>
                  ) : formData.paymentMethod === "mpesa" ? (
                    <>
                      Place order & pay
                      <span aria-hidden="true">→</span>
                    </>
                  ) : (
                    <>
                      Place order
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>

                {pendingOrder && (
                  <button
                    type="button"
                    className="hm-checkout-secondary-button"
                    onClick={resumePaymentCheck}
                    disabled={submitting}
                  >
                    ↻ Check payment status
                  </button>
                )}

                {!pendingOrder && (
                  <Link
                    to="/cart"
                    className="hm-checkout-secondary-button"
                  >
                    <span aria-hidden="true">←</span>
                    Back to cart
                  </Link>
                )}

                <div className="hm-checkout-secure-note">
                  <span className="hm-checkout-secure-icon" aria-hidden="true">
                    ◈
                  </span>

                  <span>
                    Your M-Pesa order is not marked as paid until the backend
                    confirms the payment. If confirmation takes time, keep
                    your order number and check the payment status again.
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Checkout;

