import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/api";

function AskSupport() {
  const [customer, setCustomer] = useState(null);
  const [messages, setMessages] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const messagesEndRef = useRef(null);
  const customerRef = useRef(null);
  const requestVersionRef = useRef(0);
  const mountedRef = useRef(false);

  // ============================================================
  // GET THE CURRENT AUTHENTICATED CUSTOMER
  // ============================================================

  const getStoredCustomer = useCallback(() => {
    const token = localStorage.getItem("customerToken");
    const storedCustomer = localStorage.getItem("customer");

    if (!token || !storedCustomer) {
      return null;
    }

    try {
      const parsedCustomer = JSON.parse(storedCustomer);

      if (!parsedCustomer?.id) {
        return null;
      }

      return parsedCustomer;
    } catch {
      return null;
    }
  }, []);

  // ============================================================
  // LOAD A CUSTOMER'S CONVERSATION
  // ============================================================

  const loadMessages = useCallback(
    async (customerId, requestVersion) => {
      try {
        const response = await api.get(
          `/messages/customer/${customerId}`
        );

        const loadedMessages = Array.isArray(response.data)
          ? response.data
          : response.data?.data;

        if (!Array.isArray(loadedMessages)) {
          throw new Error(
            "The server returned an unexpected messages format."
          );
        }

        const activeCustomer = getStoredCustomer();

        // Ignore responses from an old customer session.
        if (
          !mountedRef.current ||
          requestVersion !== requestVersionRef.current ||
          !activeCustomer ||
          String(activeCustomer.id) !== String(customerId)
        ) {
          return;
        }

        setMessages(loadedMessages);
        setError("");
      } catch (err) {
        const activeCustomer = getStoredCustomer();

        // Ignore errors from requests belonging to previous sessions.
        if (
          !mountedRef.current ||
          requestVersion !== requestVersionRef.current ||
          !activeCustomer ||
          String(activeCustomer.id) !== String(customerId)
        ) {
          return;
        }

        console.error(
          "Could not load messages:",
          err.response?.status,
          err.response?.data || err.message
        );

        setMessages([]);

        setError(
          err.response?.data?.message ||
            "Could not load your conversation. Please try again."
        );
      } finally {
        if (
          mountedRef.current &&
          requestVersion === requestVersionRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [getStoredCustomer]
  );

  // ============================================================
  // SYNCHRONIZE CUSTOMER SESSION
  // ============================================================

  const syncCustomer = useCallback(() => {
    const storedCustomer = getStoredCustomer();
    const previousCustomer = customerRef.current;

    const previousId = previousCustomer?.id
      ? String(previousCustomer.id)
      : null;

    const nextId = storedCustomer?.id
      ? String(storedCustomer.id)
      : null;

    const token = localStorage.getItem("customerToken");
    const previousToken = previousCustomer
      ? previousCustomer.__sessionToken
      : null;

    // Do nothing when the same customer session is already active.
    if (
      previousId === nextId &&
      previousToken === token
    ) {
      return;
    }

    // Invalidate all outstanding requests for the old session.
    requestVersionRef.current += 1;

    const requestVersion = requestVersionRef.current;

    const nextCustomer = storedCustomer
      ? {
          ...storedCustomer,
          __sessionToken: token,
        }
      : null;

    customerRef.current = nextCustomer;

    setCustomer(nextCustomer);
    setMessages([]);
    setMessage("");
    setError("");
    setSuccess("");
    setLoading(Boolean(nextCustomer?.id));

    if (nextCustomer) {
      setFormData({
        name: nextCustomer.name || "",
        phone: nextCustomer.phone || "",
        email: nextCustomer.email || "",
      });

      loadMessages(nextCustomer.id, requestVersion);
    } else {
      setLoading(false);

      setFormData({
        name: "",
        phone: "",
        email: "",
      });
    }
  }, [getStoredCustomer, loadMessages]);

  // ============================================================
  // INITIALIZE AND LISTEN FOR ACCOUNT CHANGES
  // ============================================================

  useEffect(() => {
    mountedRef.current = true;

    syncCustomer();

    const handleStorage = () => {
      syncCustomer();
    };

    window.addEventListener("customerLogin", handleStorage);
    window.addEventListener("customerLogout", handleStorage);
    window.addEventListener("storage", handleStorage);

    // Also check periodically in case another component updates
    // localStorage without dispatching a customer event.
    const sessionInterval = setInterval(() => {
      syncCustomer();
    }, 1000);

    return () => {
      mountedRef.current = false;
      requestVersionRef.current += 1;

      window.removeEventListener("customerLogin", handleStorage);
      window.removeEventListener("customerLogout", handleStorage);
      window.removeEventListener("storage", handleStorage);

      clearInterval(sessionInterval);
    };
  }, [syncCustomer]);

  // ============================================================
  // AUTO-REFRESH THE ACTIVE CONVERSATION
  // ============================================================

  useEffect(() => {
    if (!customer?.id) {
      return;
    }

    const customerId = customer.id;

    const interval = setInterval(() => {
      const activeCustomer = getStoredCustomer();

      if (
        !activeCustomer ||
        String(activeCustomer.id) !== String(customerId)
      ) {
        syncCustomer();
        return;
      }

      loadMessages(
        customerId,
        requestVersionRef.current
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [customer, getStoredCustomer, loadMessages, syncCustomer]);

  // ============================================================
  // SCROLL TO THE LATEST MESSAGE
  // ============================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ============================================================
  // HANDLE CUSTOMER DETAILS
  // ============================================================

  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const handleSend = async (e) => {
    e.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || sending) {
      return;
    }

    setError("");
    setSuccess("");

    let currentCustomer = getStoredCustomer();

    // ==========================================================
    // LEGACY GUEST FLOW
    // ==========================================================
    // If the visitor is not logged in, retain the existing
    // guest/customer creation flow. Authenticated customers
    // always use the customer token instead.

    if (!currentCustomer) {
      if (!formData.name.trim()) {
        setError("Please enter your name.");
        return;
      }

      if (!formData.phone.trim()) {
        setError("Please enter your phone number.");
        return;
      }
    }

    setSending(true);

    try {
      if (!currentCustomer) {
        const customerResponse = await api.post(
          "/customers",
          {
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim() || null,
          }
        );

        currentCustomer = customerResponse.data.customer;

        if (!currentCustomer?.id) {
          throw new Error(
            "Could not identify the customer account."
          );
        }

        // This legacy flow is for guests only. Do not overwrite
        // the authenticated customer's session.
        localStorage.setItem(
          "myduka_customer",
          JSON.stringify(currentCustomer)
        );

        customerRef.current = currentCustomer;

        setCustomer(currentCustomer);
        setMessages([]);
      }

      const activeCustomer = getStoredCustomer();

      // Authenticated users must still match the active session.
      if (
        activeCustomer &&
        String(activeCustomer.id) !==
          String(currentCustomer.id)
      ) {
        syncCustomer();

        setError(
          "Your account changed. Please send your message again."
        );

        return;
      }

      // If an account token exists, the backend determines
      // the sender from that token, not from the request body.
      const response = await api.post("/messages", {
        message: trimmedMessage,
      });

      const sentMessage =
        response.data?.data ||
        response.data?.message_data;

      if (!sentMessage) {
        throw new Error(
          "The server did not return the sent message."
        );
      }

      // Do not append a message to a different account.
      const latestCustomer = getStoredCustomer();

      if (
        latestCustomer &&
        String(latestCustomer.id) !==
          String(currentCustomer.id)
      ) {
        syncCustomer();
        return;
      }

      setMessages((previous) => [
        ...previous,
        sentMessage,
      ]);

      setMessage("");
      setSuccess("Message sent");

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(
        "Could not send message:",
        err.response?.status,
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not send your message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    const messageDate = new Date(date);

    if (Number.isNaN(messageDate.getTime())) {
      return "";
    }

    return messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    const messageDate = new Date(date);

    if (Number.isNaN(messageDate.getTime())) {
      return "";
    }

    return messageDate.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // RENDER — MYDUKA SUPPORT EXPERIENCE
  // ============================================================

  return (
    <main className="hm-support-page">
      <section className="hm-support-hero">
        <div className="hm-support-hero-copy">
          <span className="hm-support-eyebrow"><span className="hm-support-live-dot" /> MYDUKA CUSTOMER CARE</span>
          <h1>We’re here to <em>help.</em></h1>
          <p>Questions about an order, a product, or your shopping experience? Send our team a message and we’ll take it from there.</p>
          <div className="hm-support-pills">
            <span>Order assistance</span><span>Product enquiries</span><span>Shopping support</span>
          </div>
        </div>
        <div className="hm-support-hero-mark" aria-hidden="true">
          <div className="hm-support-mark-ring"><span>H</span></div>
          <div className="hm-support-mark-caption">MY<b>DUKA</b></div>
        </div>
      </section>

      <section className="hm-support-layout">
        <aside className="hm-support-sidebar">
          <div className="hm-support-side-card hm-support-side-dark">
            <div className="hm-support-side-icon">✦</div>
            <h2>Good service is part of the experience.</h2>
            <p>Tell us what you need. Our team can help with questions and follow up on your conversation here.</p>
            <div className="hm-support-side-rule" />
            <div className="hm-support-side-status"><span className="hm-support-live-dot" /> Support inbox is open</div>
          </div>
          <div className="hm-support-side-card hm-support-side-light">
            <span className="hm-support-card-kicker">BEFORE YOU MESSAGE</span>
            <h3>A little detail goes a long way.</h3>
            <p>For order questions, include your order number in the message. Please don’t send payment PINs, passwords, or other sensitive account details.</p>
          </div>
        </aside>

        <section className="hm-support-chat-card" aria-label="Customer support conversation">
          <header className="hm-support-chat-header">
            <div className="hm-support-agent-avatar">H</div>
            <div className="hm-support-agent-details">
              <h2>MyDuka Support</h2>
              <p><span className="hm-support-live-dot" /> Customer care</p>
            </div>
            {customer && (
              <div className="hm-support-chat-customer">
                <span>CHATTING AS</span>
                <strong>{customer.name}</strong>
              </div>
            )}
          </header>

          <div className="hm-support-messages" aria-live="polite">
            {loading && (
              <div className="hm-support-state">
                <span className="hm-support-spinner" />
                <strong>Opening your conversation</strong>
                <span>Just a moment…</span>
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="hm-support-empty">
                <div className="hm-support-empty-icon">✉</div>
                <span className="hm-support-card-kicker">YOUR SUPPORT CONVERSATION</span>
                <h3>How can we help today?</h3>
                <p>Start the conversation below. Our team will reply here, and your messages will stay in this chat.</p>
                <div className="hm-support-topic-list">
                  <span>Order status</span><span>Product questions</span><span>Delivery enquiries</span><span>Other assistance</span>
                </div>
              </div>
            )}

            {!loading && messages.length > 0 && (
              <>
                <div className="hm-support-conversation-label"><span /> Conversation <span /></div>
                {messages.map((item, index) => {
                  const isCustomer = item.sender === "customer";
                  const currentDate = formatDate(item.created_at);
                  const previousDate = formatDate(messages[index - 1]?.created_at);
                  const showDate = index === 0 || currentDate !== previousDate;

                  return (
                    <div key={item.id || index}>
                      {showDate && currentDate && (
                        <div className="hm-support-date"><span>{currentDate}</span></div>
                      )}
                      <div className={`hm-support-message-row ${isCustomer ? "is-customer" : "is-support"}`}>
                        <div className="hm-support-message-wrap">
                          <div className="hm-support-message-sender">{isCustomer ? "You" : "MyDuka Support"}</div>
                          <div className="hm-support-bubble">
                            <div className="hm-support-message-text">{item.message}</div>
                            <time>{formatTime(item.created_at)}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {(error || success) && (
            <div className="hm-support-feedback">
              {error && <div className="hm-support-alert is-error" role="alert">{error}</div>}
              {success && <div className="hm-support-alert is-success" role="status">{success}</div>}
            </div>
          )}

          {!customer && (
            <div className="hm-support-guest-details">
              <div className="hm-support-guest-heading">
                <strong>First time here?</strong>
                <span>Share your details so we can follow up.</span>
              </div>
              <div className="hm-support-guest-fields">
                <label><span>Your name</span><input type="text" name="name" placeholder="Full name" autoComplete="name" value={formData.name} onChange={handleChange} /></label>
                <label><span>Phone number</span><input type="tel" name="phone" placeholder="e.g. 07…" autoComplete="tel" value={formData.phone} onChange={handleChange} /></label>
                <label><span>Email <small>(optional)</small></span><input type="email" name="email" placeholder="you@example.com" autoComplete="email" value={formData.email} onChange={handleChange} /></label>
              </div>
            </div>
          )}

          <form className="hm-support-composer" onSubmit={handleSend}>
            <div className="hm-support-composer-box">
              <textarea
                rows="2"
                aria-label="Your message"
                placeholder={customer ? "Write your message…" : "Write your question…"}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending || loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!sending && !loading) handleSend(e);
                  }
                }}
              />
              <div className="hm-support-composer-footer">
                <span>Enter to send <i>·</i> Shift + Enter for a new line</span>
                <button type="submit" disabled={sending || loading || !message.trim()} aria-label="Send message">
                  {sending ? <span className="hm-support-button-spinner" /> : <span aria-hidden="true">➤</span>}
                  <span>{sending ? "Sending" : "Send message"}</span>
                </button>
              </div>
            </div>
            <p className="hm-support-privacy-note">Your conversation is handled by the MyDuka customer care team.</p>
          </form>
        </section>
      </section>
    </main>
  );
}

export default AskSupport;
