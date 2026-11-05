import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

const styles = `
  .hm-messages-page {
    min-height: 85vh;
    padding: 48px 20px 65px;
    color: #f4f2e9;
    background:
      radial-gradient(ellipse at top left, rgba(37, 91, 60, 0.18), transparent 45%),
      #111713;
  }

  .hm-messages-container {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
  }

  .hm-messages-heading {
    margin-bottom: 30px;
    text-align: center;
  }

  .hm-messages-icon {
    width: 66px;
    height: 66px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 17px;
    border: 1px solid rgba(251, 191, 36, 0.4);
    border-radius: 20px;
    background: rgba(251, 191, 36, 0.08);
    color: #fbbf24;
    font-size: 29px;
  }

  .hm-messages-heading h1 {
    margin: 0 0 10px;
    color: #f5f0e4;
    font-size: clamp(27px, 5vw, 36px);
    font-weight: 800;
    letter-spacing: -1px;
  }

  .hm-messages-heading p {
    max-width: 480px;
    margin: 0 auto;
    color: #9eaaa1;
    font-size: 14px;
    line-height: 1.7;
  }

  .hm-messages-card {
    overflow: hidden;
    border: 1px solid #303b33;
    border-radius: 19px;
    background: #19211b;
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.24);
  }

  .hm-messages-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    padding: 19px 23px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    background: linear-gradient(110deg, #203c2c, #1a2b20);
  }

  .hm-messages-profile {
    display: flex;
    align-items: center;
    gap: 13px;
    min-width: 0;
  }

  .hm-messages-avatar {
    width: 46px;
    height: 46px;
    flex: 0 0 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(251, 191, 36, 0.4);
    border-radius: 50%;
    background: rgba(251, 191, 36, 0.12);
    color: #fbbf24;
    font-size: 21px;
  }

  .hm-messages-profile h2 {
    margin: 0 0 5px;
    color: #f7f3e8;
    font-size: 15px;
    font-weight: 750;
    overflow-wrap: anywhere;
  }

  .hm-messages-profile p {
    margin: 0;
    color: #b7c7ba;
    font-size: 12px;
  }

  .hm-messages-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #c3d6c7;
    font-size: 11px;
    white-space: nowrap;
  }

  .hm-messages-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #83ce99;
  }

  .hm-messages-body {
    height: 450px;
    overflow-y: auto;
    padding: 25px 22px;
    background:
      radial-gradient(ellipse at center, rgba(42, 65, 48, 0.13), transparent 75%),
      #151c17;
    scrollbar-color: #405448 #151c17;
    scrollbar-width: thin;
  }

  .hm-messages-body::-webkit-scrollbar {
    width: 6px;
  }

  .hm-messages-body::-webkit-scrollbar-track {
    background: #151c17;
  }

  .hm-messages-body::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background: #405448;
  }

  .hm-messages-date-label {
    width: fit-content;
    margin: 0 auto 24px;
    padding: 6px 11px;
    border: 1px solid #303b33;
    border-radius: 20px;
    background: #1b241d;
    color: #98a69b;
    font-size: 10px;
  }

  .hm-message-row {
    display: flex;
    margin-bottom: 19px;
  }

  .hm-message-row.customer {
    justify-content: flex-end;
  }

  .hm-message-row.support {
    justify-content: flex-start;
  }

  .hm-message-bubble {
    max-width: 76%;
    padding: 13px 15px 10px;
    border: 1px solid #344139;
    border-radius: 15px 15px 15px 4px;
    background: #202a23;
    color: #e9eee8;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .hm-message-row.customer .hm-message-bubble {
    border-color: #356d49;
    border-radius: 15px 15px 4px 15px;
    background: linear-gradient(135deg, #28623e, #214d32);
    color: #fffdf5;
  }

  .hm-message-sender {
    margin-bottom: 7px;
    color: #fbbf24;
    font-size: 11px;
    font-weight: 750;
  }

  .hm-message-row.customer .hm-message-sender {
    color: #e6d29d;
  }

  .hm-message-text {
    font-size: 13px;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .hm-message-time {
    margin-top: 9px;
    color: #9ba99e;
    font-size: 10px;
    line-height: 1.5;
  }

  .hm-message-row.customer .hm-message-time {
    color: #c4ddc9;
    text-align: right;
  }

  .hm-messages-empty {
    display: flex;
    min-height: 320px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 15px;
    text-align: center;
  }

  .hm-messages-empty-icon {
    width: 57px;
    height: 57px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 17px;
    border: 1px solid #39463c;
    border-radius: 18px;
    background: #202a22;
    color: #fbbf24;
    font-size: 24px;
  }

  .hm-messages-empty h3 {
    margin-bottom: 9px;
    color: #f0eee5;
    font-size: 17px;
    font-weight: 750;
  }

  .hm-messages-empty p {
    max-width: 300px;
    margin: 0;
    color: #9eaaa1;
    font-size: 13px;
    line-height: 1.7;
  }

  .hm-messages-loading {
    display: flex;
    min-height: 320px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #a6b1a8;
    font-size: 13px;
  }

  .hm-messages-spinner {
    width: 31px;
    height: 31px;
    margin-bottom: 15px;
    border: 3px solid #35443a;
    border-top-color: #fbbf24;
    border-radius: 50%;
    animation: hm-message-spin 0.8s linear infinite;
  }

  @keyframes hm-message-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .hm-messages-error {
    margin: 18px 20px 0;
    padding: 12px 14px;
    border: 1px solid rgba(226, 102, 102, 0.35);
    border-radius: 10px;
    background: rgba(148, 38, 38, 0.13);
    color: #ffaaaa;
    font-size: 12px;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  .hm-messages-retry {
    display: inline-block;
    margin-top: 9px;
    border: none;
    background: transparent;
    color: #e4c77f;
    font-size: 12px;
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
  }

  .hm-messages-composer {
    padding: 19px 21px;
    border-top: 1px solid #303b33;
    background: #1a221c;
  }

  .hm-messages-form {
    display: flex;
    align-items: flex-end;
    gap: 11px;
  }

  .hm-messages-input-wrap {
    flex: 1;
    min-width: 0;
  }

  .hm-messages-input {
    width: 100%;
    min-height: 47px;
    padding: 13px 15px;
    border: 1px solid #3b4940;
    border-radius: 11px;
    outline: none;
    background: #121914;
    color: #f3f2e9;
    font: inherit;
    font-size: 13px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .hm-messages-input:focus {
    border-color: #bda05e;
    box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
  }

  .hm-messages-input::placeholder {
    color: #78847b;
  }

  .hm-messages-input:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .hm-messages-send {
    width: 48px;
    height: 47px;
    flex: 0 0 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #fbbf24;
    border-radius: 11px;
    background: linear-gradient(135deg, #fbbf24, #c9a653);
    color: #172018;
    font-size: 18px;
    cursor: pointer;
    transition: transform 0.2s, filter 0.2s;
  }

  .hm-messages-send:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.08);
  }

  .hm-messages-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .hm-messages-composer-hint {
    margin: 10px 0 0;
    color: #77847a;
    font-size: 10px;
    line-height: 1.6;
  }

  .hm-messages-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 22px;
    color: #b5c0b7;
    font-size: 13px;
    text-decoration: none;
    transition: color 0.2s;
  }

  .hm-messages-back:hover {
    color: #fbbf24;
  }

  .hm-messages-guest-card {
    padding: 38px 28px;
    border: 1px solid #303b33;
    border-radius: 19px;
    background: #19211b;
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.24);
    text-align: center;
  }

  .hm-messages-guest-card h2 {
    margin-bottom: 12px;
    color: #f5f0e4;
    font-size: 24px;
    font-weight: 800;
  }

  .hm-messages-guest-card p {
    max-width: 380px;
    margin: 0 auto 24px;
    color: #a4afa6;
    font-size: 14px;
    line-height: 1.8;
  }

  .hm-messages-login {
    display: inline-flex;
    min-height: 45px;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 12px 23px;
    border: 1px solid #fbbf24;
    border-radius: 10px;
    background: linear-gradient(135deg, #fbbf24, #c9a653);
    color: #172018;
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
    transition: filter 0.2s;
  }

  .hm-messages-login:hover {
    color: #172018;
    filter: brightness(1.08);
  }

  .hm-messages-guest-link {
    display: block;
    margin-top: 19px;
    color: #b5c0b7;
    font-size: 13px;
    text-decoration: none;
  }

  .hm-messages-guest-link:hover {
    color: #fbbf24;
  }

  @media (max-width: 600px) {
    .hm-messages-page {
      padding: 30px 12px 45px;
    }

    .hm-messages-heading {
      margin-bottom: 23px;
    }

    .hm-messages-card {
      border-radius: 15px;
    }

    .hm-messages-header {
      padding: 15px;
    }

    .hm-messages-body {
      height: 55vh;
      min-height: 320px;
      max-height: 480px;
      padding: 20px 13px;
    }

    .hm-message-bubble {
      max-width: 88%;
      padding: 11px 12px 9px;
    }

    .hm-messages-composer {
      padding: 13px;
    }

    .hm-messages-form {
      gap: 8px;
    }

    .hm-messages-status {
      font-size: 10px;
    }

    .hm-messages-profile {
      gap: 10px;
    }

    .hm-messages-avatar {
      width: 40px;
      height: 40px;
      flex-basis: 40px;
    }

    .hm-messages-guest-card {
      padding: 30px 19px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hm-messages-spinner {
      animation-duration: 2s;
    }

    .hm-messages-send,
    .hm-messages-login,
    .hm-messages-back {
      transition: none;
    }
  }
`;

function MyMessages() {
  const [customer, setCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  const getStoredCustomer = () => {
    const token = localStorage.getItem("customerToken");
    const storedCustomer = localStorage.getItem("customer");

    if (!token || !storedCustomer) {
      return null;
    }

    try {
      const parsedCustomer = JSON.parse(storedCustomer);
      return parsedCustomer?.id ? parsedCustomer : null;
    } catch {
      return null;
    }
  };

  const loadMessages = useCallback(async (customerId) => {
    setLoading(true);
    setError("");
    setMessages([]);

    try {
      const response = await api.get(`/messages/customer/${customerId}`);

      const loadedMessages = Array.isArray(response.data)
        ? response.data
        : response.data?.data;

      if (!Array.isArray(loadedMessages)) {
        throw new Error("The server returned an unexpected messages format.");
      }

      const activeCustomer = getStoredCustomer();

      if (
        !activeCustomer ||
        String(activeCustomer.id) !== String(customerId)
      ) {
        return;
      }

      setMessages(loadedMessages);
      setError("");
    } catch (err) {
      console.error(
        "Could not load conversation:",
        err.response?.data || err
      );

      const activeCustomer = getStoredCustomer();

      if (
        activeCustomer &&
        String(activeCustomer.id) === String(customerId)
      ) {
        setMessages([]);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not load your conversation. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncCustomer = async () => {
      const storedCustomer = getStoredCustomer();

      setCustomer(storedCustomer);
      setMessages([]);
      setMessage("");
      setError("");

      if (storedCustomer?.id) {
        setLoading(true);

        try {
          const response = await api.get(
            `/messages/customer/${storedCustomer.id}`
          );

          const loadedMessages = Array.isArray(response.data)
            ? response.data
            : response.data?.data;

          if (!Array.isArray(loadedMessages)) {
            throw new Error(
              "The server returned an unexpected messages format."
            );
          }

          if (cancelled) return;

          const activeCustomer = getStoredCustomer();

          if (
            activeCustomer &&
            String(activeCustomer.id) === String(storedCustomer.id)
          ) {
            setMessages(loadedMessages);
            setError("");
          }
        } catch (err) {
          console.error(
            "Could not load conversation:",
            err.response?.data || err
          );

          if (cancelled) return;

          const activeCustomer = getStoredCustomer();

          if (
            activeCustomer &&
            String(activeCustomer.id) === String(storedCustomer.id)
          ) {
            setMessages([]);
            setError(
              err.response?.data?.message ||
                err.message ||
                "Could not load your conversation. Please try again."
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      } else {
        setLoading(false);
      }
    };

    syncCustomer();

    window.addEventListener("customerLogin", syncCustomer);
    window.addEventListener("customerLogout", syncCustomer);
    window.addEventListener("storage", syncCustomer);

    return () => {
      cancelled = true;
      window.removeEventListener("customerLogin", syncCustomer);
      window.removeEventListener("customerLogout", syncCustomer);
      window.removeEventListener("storage", syncCustomer);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim() || !customer || sending) {
      return;
    }

    const activeCustomer = getStoredCustomer();

    if (
      !activeCustomer ||
      String(activeCustomer.id) !== String(customer.id)
    ) {
      setCustomer(null);
      setMessages([]);
      setError("Your session has changed. Please log in again.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await api.post("/messages", {
        message: message.trim(),
      });

      const sentMessage = response.data?.data;

      if (!sentMessage) {
        throw new Error("The server did not return the sent message.");
      }

      const currentCustomer = getStoredCustomer();

      if (
        currentCustomer &&
        String(currentCustomer.id) === String(customer.id)
      ) {
        setMessages((previous) => [...previous, sentMessage]);
        setMessage("");
      }
    } catch (err) {
      console.error(
        "Could not send message:",
        err.response?.data || err
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

  const formatMessageTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (!customer) {
    return (
      <>
        <style>{styles}</style>

        <main className="hm-messages-page">
          <div className="hm-messages-container">
            <header className="hm-messages-heading">
              <div className="hm-messages-icon">
                <i className="bi bi-chat-square-text" />
              </div>

              <h1>Customer Support</h1>

              <p>
                Have a question? Sign in to contact our team and view your
                previous conversations.
              </p>
            </header>

            <section className="hm-messages-guest-card">
              <div className="hm-messages-icon">
                <i className="bi bi-person-lock" />
              </div>

              <h2>Your conversations, all in one place.</h2>

              <p>
                Log in to your MyDuka account to send messages,
                get assistance with orders, and keep track of your
                conversations with our team.
              </p>

              <Link to="/login" className="hm-messages-login">
                <i className="bi bi-box-arrow-in-right" />
                Log in to continue
              </Link>

              <Link to="/register" className="hm-messages-guest-link">
                New customer? Create an account
              </Link>
            </section>

            <div className="text-center">
              <Link to="/" className="hm-messages-back">
                <i className="bi bi-arrow-left" />
                Back to home
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <main className="hm-messages-page">
        <div className="hm-messages-container">
          <header className="hm-messages-heading">
            <div className="hm-messages-icon">
              <i className="bi bi-chat-square-text" />
            </div>

            <h1>My Messages</h1>

            <p>
              Need help with an order or product? Send our team a message
              and keep the conversation right here.
            </p>
          </header>

          <section className="hm-messages-card">
            <header className="hm-messages-header">
              <div className="hm-messages-profile">
                <div className="hm-messages-avatar">
                  <i className="bi bi-headset" />
                </div>

                <div>
                  <h2>MyDuka Customer Support</h2>
                  <p>
                    Signed in as {customer.name || "Customer"}
                    {customer.phone ? ` · ${customer.phone}` : ""}
                  </p>
                </div>
              </div>

              <div className="hm-messages-status">
                <span className="hm-messages-status-dot" />
                Support inbox
              </div>
            </header>

            {error && (
              <div className="hm-messages-error" role="alert">
                <i className="bi bi-exclamation-circle me-2" />
                {error}

                {!loading && (
                  <div>
                    <button
                      type="button"
                      className="hm-messages-retry"
                      onClick={() => loadMessages(customer.id)}
                    >
                      Try loading messages again
                    </button>
                  </div>
                )}
              </div>
            )}

            <div
              className="hm-messages-body"
              role="log"
              aria-label="Your message conversation"
              aria-live="polite"
              aria-relevant="additions text"
            >
              {loading ? (
                <div className="hm-messages-loading">
                  <div className="hm-messages-spinner" />
                  Loading your conversation...
                </div>
              ) : messages.length === 0 ? (
                <div className="hm-messages-empty">
                  <div className="hm-messages-empty-icon">
                    <i className="bi bi-chat-heart" />
                  </div>

                  <h3>Start a conversation</h3>

                  <p>
                    Your inbox is ready. Send your first message below
                    and our team can assist you.
                  </p>
                </div>
              ) : (
                <>
                  <div className="hm-messages-date-label">
                    YOUR CONVERSATION
                  </div>

                  {messages.map((item) => {
                    const isCustomer = item.sender === "customer";

                    return (
                      <div
                        key={item.id}
                        className={`hm-message-row ${
                          isCustomer ? "customer" : "support"
                        }`}
                      >
                        <div className="hm-message-bubble">
                          <div className="hm-message-sender">
                            {isCustomer ? "You" : "MyDuka Support"}
                          </div>

                          <div className="hm-message-text">
                            {item.message}
                          </div>

                          <div className="hm-message-time">
                            {formatMessageTime(item.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <footer className="hm-messages-composer">
              <form onSubmit={sendMessage} className="hm-messages-form">
                <div className="hm-messages-input-wrap">
                  <input
                    type="text"
                    className="hm-messages-input"
                    placeholder="Write your message..."
                    aria-label="Write your message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading || sending}
                    maxLength={5000}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="hm-messages-send"
                  aria-label="Send message"
                  title="Send message"
                  disabled={loading || sending || !message.trim()}
                >
                  {sending ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-label="Sending message"
                    />
                  ) : (
                    <i className="bi bi-send-fill" />
                  )}
                </button>
              </form>

              <p className="hm-messages-composer-hint">
                Please avoid sharing passwords or other sensitive account
                information in messages.
              </p>
            </footer>
          </section>

          <Link to="/" className="hm-messages-back">
            <i className="bi bi-arrow-left" />
            Continue shopping
          </Link>
        </div>
      </main>
    </>
  );
}

export default MyMessages;
