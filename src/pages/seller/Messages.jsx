import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api/api";

// =========================================================
// MESSAGE STATUS HELPERS
// =========================================================

const isRead = (value) =>
  value === true ||
  value === 1 ||
  (typeof value === "string" &&
    value.trim().toLowerCase() === "true");

const normalizeMessage = (message) => ({
  ...message,
  is_read: isRead(message.is_read),
});

const isUnreadCustomerMessage = (message) =>
  message.sender === "customer" && !isRead(message.is_read);

const getCustomerId = (customer) => Number(customer?.id);

const getMessageStatus = (message) => {
  if (isRead(message.is_read)) {
    return "read";
  }

  if (message.delivered_at) {
    return "delivered";
  }

  return "sent";
};

// =========================================================
// WHATSAPP-STYLE MESSAGE TICKS
// =========================================================

function MessageTicks({ message }) {
  const status = getMessageStatus(message);

  const tickColor =
    status === "read" ? "#53bdeb" : "inherit";

  return (
    <span
      title={
        status === "read"
          ? "Read"
          : status === "delivered"
          ? "Delivered"
          : "Sent"
      }
      aria-label={`Message ${status}`}
      style={{
        display: "inline-block",
        marginLeft: "6px",
        fontSize: "15px",
        fontWeight: "700",
        letterSpacing: "-3px",
        paddingRight: "3px",
        color: tickColor,
        verticalAlign: "middle",
        whiteSpace: "nowrap",
      }}
    >
      {status === "sent" ? "✓" : "✓✓"}
    </span>
  );
}

// =========================================================
// MAIN MESSAGES COMPONENT
// =========================================================

function Messages() {
  const [messages, setMessages] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerMessages, setCustomerMessages] = useState([]);
  const [reply, setReply] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Message selection and deletion.
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState(
    new Set()
  );
  const [deletingMessageIds, setDeletingMessageIds] = useState(
    new Set()
  );
  const [deletingSelected, setDeletingSelected] = useState(false);

  const chatContainerRef = useRef(null);
  const selectedCustomerRef = useRef(null);

  const conversationRequestRef = useRef(0);
  const messagesRequestRef = useRef(0);
  const markingReadRef = useRef(new Set());
  const pollingRef = useRef(false);

  // =========================================================
  // LOAD ALL MESSAGES
  // =========================================================

  const loadMessages = useCallback(async (showLoading = false) => {
    const requestId = ++messagesRequestRef.current;

    try {
      if (showLoading) {
        setLoading(true);
      }

      const response = await api.get("/admin/messages");

      if (requestId !== messagesRequestRef.current) {
        return null;
      }

      const allMessages = Array.isArray(response.data)
        ? response.data.map(normalizeMessage)
        : [];

      setMessages(allMessages);
      setError("");

      return allMessages;
    } catch (err) {
      console.error("Could not load messages:", err);

      if (requestId === messagesRequestRef.current && showLoading) {
        setError("Could not load messages. Please try again.");
      }

      return null;
    } finally {
      if (
        requestId === messagesRequestRef.current &&
        showLoading
      ) {
        setLoading(false);
      }
    }
  }, []);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadMessages(true);
  }, [loadMessages]);

  // =========================================================
  // MARK CUSTOMER MESSAGES AS READ
  // =========================================================

  const markCustomerMessagesAsRead = useCallback(
    async (customerId) => {
      const id = Number(customerId);

      if (!Number.isFinite(id)) {
        return false;
      }

      if (markingReadRef.current.has(id)) {
        return false;
      }

      markingReadRef.current.add(id);

      try {
        const response = await api.put(
          `/admin/messages/customer/${id}/read`
        );

        if (response.data?.status !== "success") {
          throw new Error(
            "The server did not confirm the read status."
          );
        }

        setMessages((currentMessages) =>
          currentMessages.map((message) => {
            if (
              Number(message.customer_id) === id &&
              message.sender === "customer"
            ) {
              return {
                ...message,
                is_read: true,
              };
            }

            return message;
          })
        );

        setCustomerMessages((currentMessages) =>
          currentMessages.map((message) => {
            if (
              Number(message.customer_id) === id &&
              message.sender === "customer"
            ) {
              return {
                ...message,
                is_read: true,
              };
            }

            return message;
          })
        );

        return true;
      } catch (err) {
        console.error(
          "Could not mark messages as read:",
          err
        );

        return false;
      } finally {
        markingReadRef.current.delete(id);
      }
    },
    []
  );

  // =========================================================
  // RESET MESSAGE SELECTION
  // =========================================================

  const clearMessageSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedMessageIds(new Set());
  }, []);

  // =========================================================
  // LOAD ONE CUSTOMER'S CONVERSATION
  // =========================================================

  const loadCustomerConversation = useCallback(
    async (customer) => {
      const customerId = getCustomerId(customer);
      const requestId = ++conversationRequestRef.current;

      selectedCustomerRef.current = customer;

      setSelectedCustomer(customer);
      setCustomerMessages([]);
      setLoadingConversation(true);
      setError("");
      clearMessageSelection();

      try {
        const markedRead =
          await markCustomerMessagesAsRead(customerId);

        if (requestId !== conversationRequestRef.current) {
          return;
        }

        if (!markedRead) {
          setError(
            "Could not update read status. Please try again."
          );
        }

        const response = await api.get(
          `/admin/messages/customer/${customerId}`
        );

        if (requestId !== conversationRequestRef.current) {
          return;
        }

        const conversation = Array.isArray(response.data)
          ? response.data.map(normalizeMessage)
          : [];

        setCustomerMessages(conversation);

        await loadMessages(false);
      } catch (err) {
        console.error("Could not load conversation:", err);

        if (requestId === conversationRequestRef.current) {
          setError("Could not load this conversation.");
        }
      } finally {
        if (requestId === conversationRequestRef.current) {
          setLoadingConversation(false);
        }
      }
    },
    [
      loadMessages,
      markCustomerMessagesAsRead,
      clearMessageSelection,
    ]
  );

  // =========================================================
  // TOGGLE SELECTION MODE
  // =========================================================

  const toggleSelectionMode = () => {
    if (deletingSelected) {
      return;
    }

    if (selectionMode) {
      clearMessageSelection();
      return;
    }

    setSelectedMessageIds(new Set());
    setSelectionMode(true);
    setError("");
  };

  // =========================================================
  // SELECT / DESELECT ONE MESSAGE
  // =========================================================

  const toggleMessageSelection = (messageId) => {
    const id = Number(messageId);

    if (
      !selectionMode ||
      deletingSelected ||
      deletingMessageIds.has(id)
    ) {
      return;
    }

    setSelectedMessageIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  // =========================================================
  // SELECT ALL / DESELECT ALL
  // =========================================================

  const selectableMessageIds = customerMessages
    .filter(
      (message) =>
        message.id != null &&
        !deletingMessageIds.has(Number(message.id))
    )
    .map((message) => Number(message.id));

  const allMessagesSelected =
    selectableMessageIds.length > 0 &&
    selectableMessageIds.every((id) =>
      selectedMessageIds.has(id)
    );

  const toggleSelectAll = () => {
    if (!selectionMode || deletingSelected) {
      return;
    }

    if (allMessagesSelected) {
      setSelectedMessageIds(new Set());
      return;
    }

    setSelectedMessageIds(new Set(selectableMessageIds));
  };

  // =========================================================
  // DELETE SELECTED MESSAGES
  // =========================================================

  const handleDeleteSelected = async () => {
    if (deletingSelected || selectedMessageIds.size === 0) {
      return;
    }

    const idsToDelete = Array.from(selectedMessageIds).filter(
      (id) =>
        customerMessages.some(
          (message) => Number(message.id) === id
        ) && !deletingMessageIds.has(id)
    );

    if (idsToDelete.length === 0) {
      clearMessageSelection();
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete ${idsToDelete.length} selected message${
        idsToDelete.length === 1 ? "" : "s"
      }?\n\n` +
        "These messages will be removed from both the admin and customer views. This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    const customerId = getCustomerId(selectedCustomer);

    setDeletingSelected(true);
    setError("");

    setDeletingMessageIds((current) => {
      const next = new Set(current);

      idsToDelete.forEach((id) => next.add(id));

      return next;
    });

    let deletedCount = 0;
    const failedIds = [];

    try {
      // Delete messages individually using the existing backend route.
      // A failed deletion does not prevent the remaining messages
      // from being attempted.
      const results = await Promise.allSettled(
        idsToDelete.map(async (messageId) => {
          const response = await api.delete(
            `/admin/messages/${messageId}`
          );

          if (response.data?.status !== "success") {
            throw new Error(
              response.data?.message ||
                `Could not delete message ${messageId}.`
            );
          }

          return messageId;
        })
      );

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          deletedCount += 1;
        } else {
          failedIds.push(idsToDelete[index]);

          console.error(
            `Failed to delete message ${idsToDelete[index]}:`,
            result.reason
          );
        }
      });

      // Remove successfully deleted messages from local state.
      const successfullyDeletedIds = new Set(
        idsToDelete.filter((id) => !failedIds.includes(id))
      );

      setMessages((currentMessages) =>
        currentMessages.filter(
          (message) =>
            !successfullyDeletedIds.has(Number(message.id))
        )
      );

      setCustomerMessages((currentMessages) =>
        currentMessages.filter(
          (message) =>
            !successfullyDeletedIds.has(Number(message.id))
        )
      );

      // Invalidate any pending conversation response that could
      // otherwise restore deleted messages.
      conversationRequestRef.current += 1;

      // Exit selection mode after the deletion attempt.
      clearMessageSelection();

      // Refresh sidebar and unread counts from the server.
      await loadMessages(false);

      if (failedIds.length > 0) {
        setError(
          `${deletedCount} message${
            deletedCount === 1 ? "" : "s"
          } deleted successfully. ${failedIds.length} could not be deleted. Please try again.`
        );

        // Refresh the active conversation so failed messages
        // remain visible if they still exist on the server.
        if (
          Number(selectedCustomerRef.current?.id) === customerId
        ) {
          try {
            const response = await api.get(
              `/admin/messages/customer/${customerId}`
            );

            if (
              Number(selectedCustomerRef.current?.id) ===
              customerId
            ) {
              setCustomerMessages(
                Array.isArray(response.data)
                  ? response.data.map(normalizeMessage)
                  : []
              );
            }
          } catch (refreshError) {
            console.error(
              "Could not refresh conversation after deletion:",
              refreshError
            );
          }
        }
      } else {
        setError("");
      }
    } catch (err) {
      console.error("Could not delete selected messages:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not delete the selected messages."
      );
    } finally {
      setDeletingMessageIds((current) => {
        const next = new Set(current);

        idsToDelete.forEach((id) => next.delete(id));

        return next;
      });

      setDeletingSelected(false);
    }
  };

  // =========================================================
  // POLLING — REFRESH MESSAGES EVERY 3 SECONDS
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const pollMessages = async () => {
      if (pollingRef.current || cancelled) {
        return;
      }

      pollingRef.current = true;

      try {
        const allMessages = await loadMessages(false);

        if (cancelled || !allMessages) {
          return;
        }

        const activeCustomer = selectedCustomerRef.current;
        const activeCustomerId = getCustomerId(activeCustomer);

        if (!Number.isFinite(activeCustomerId)) {
          return;
        }

        const activeMessages = allMessages.filter(
          (message) =>
            Number(message.customer_id) === activeCustomerId
        );

        const hasUnreadIncoming = activeMessages.some(
          isUnreadCustomerMessage
        );

        if (hasUnreadIncoming) {
          const markedRead =
            await markCustomerMessagesAsRead(activeCustomerId);

          if (cancelled || !markedRead) {
            return;
          }

          await loadMessages(false);

          if (
            cancelled ||
            Number(selectedCustomerRef.current?.id) !==
              activeCustomerId
          ) {
            return;
          }
        }

        // Do not replace the conversation while bulk deletion
        // is running.
        if (deletingSelected) {
          return;
        }

        const requestId = conversationRequestRef.current;

        const response = await api.get(
          `/admin/messages/customer/${activeCustomerId}`
        );

        if (
          cancelled ||
          requestId !== conversationRequestRef.current ||
          Number(selectedCustomerRef.current?.id) !==
            activeCustomerId
        ) {
          return;
        }

        const conversation = Array.isArray(response.data)
          ? response.data.map(normalizeMessage)
          : [];

        // Preserve the current conversation while a deletion
        // request is in progress.
        if (deletingMessageIds.size === 0) {
          setCustomerMessages(conversation);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Message polling failed:", err);
        }
      } finally {
        pollingRef.current = false;
      }
    };

    const interval = setInterval(pollMessages, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    loadMessages,
    markCustomerMessagesAsRead,
    deletingSelected,
    deletingMessageIds,
  ]);

  // =========================================================
  // SCROLL CHAT TO BOTTOM
  // =========================================================

  useEffect(() => {
    const container = chatContainerRef.current;

    if (!container) {
      return;
    }

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [customerMessages]);

  // =========================================================
  // SEND SELLER REPLY
  // =========================================================

  const handleReply = async (e) => {
    e.preventDefault();

    const trimmedReply = reply.trim();

    if (
      !trimmedReply ||
      !selectedCustomer ||
      sending ||
      selectionMode
    ) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await api.post("/admin/messages", {
        customer_id: selectedCustomer.id,
        message: trimmedReply,
      });

      const newMessage = response.data?.data;

      if (newMessage) {
        setCustomerMessages((currentMessages) => [
          ...currentMessages,
          normalizeMessage(newMessage),
        ]);
      }

      setReply("");

      await loadMessages(false);
    } catch (err) {
      console.error("Could not send reply:", err);

      setError(
        err.response?.data?.message ||
          "Could not send reply. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  // =========================================================
  // CLOSE CONVERSATION
  // =========================================================

  const closeConversation = () => {
    if (deletingSelected) {
      return;
    }

    conversationRequestRef.current += 1;
    selectedCustomerRef.current = null;

    setSelectedCustomer(null);
    setCustomerMessages([]);
    setReply("");
    setError("");
    setLoadingConversation(false);

    clearMessageSelection();
  };

  // =========================================================
  // BUILD CUSTOMER LIST
  // =========================================================

  const customerMap = new Map();

  messages.forEach((message) => {
    if (message.customer) {
      customerMap.set(
        Number(message.customer.id),
        message.customer
      );
    }
  });

  const customers = Array.from(customerMap.values());

  const latestMessageByCustomer = new Map();

  messages.forEach((message) => {
    const customerId = Number(message.customer_id);
    const previous = latestMessageByCustomer.get(customerId);

    if (
      !previous ||
      new Date(message.created_at) >
        new Date(previous.created_at) ||
      (
        new Date(message.created_at).getTime() ===
          new Date(previous.created_at).getTime() &&
        message.id > previous.id
      )
    ) {
      latestMessageByCustomer.set(customerId, message);
    }
  });

  customers.sort((a, b) => {
    const latestA = latestMessageByCustomer.get(Number(a.id));
    const latestB = latestMessageByCustomer.get(Number(b.id));

    return (
      new Date(latestB?.created_at || 0) -
      new Date(latestA?.created_at || 0)
    );
  });

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "";
    }

    return value.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Messages</h2>

        <p className="text-muted mb-0">
          Manage customer conversations
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div
        className="card border-0 shadow-sm overflow-hidden"
        style={{
          borderRadius: "16px",
          minHeight: "650px",
        }}
      >
        <div className="row g-0 h-100">
          {/* ============================================= */}
          {/* CONVERSATION LIST */}
          {/* ============================================= */}

          <div
            className="col-md-4 col-lg-3 border-end"
            style={{ minHeight: "650px" }}
          >
            <div className="p-3 border-bottom">
              <h6 className="fw-bold mb-0">
                Conversations
              </h6>
            </div>

            <div
              style={{
                maxHeight: "590px",
                overflowY: "auto",
              }}
            >
              {loading && (
                <div className="text-center p-4">
                  <div
                    className="spinner-border spinner-border-sm"
                    role="status"
                  />

                  <div className="small text-muted mt-2">
                    Loading...
                  </div>
                </div>
              )}

              {!loading && customers.length === 0 && (
                <div className="text-center p-4 text-muted">
                  <div style={{ fontSize: "35px" }}>
                    💬
                  </div>

                  <div className="mt-2">
                    No conversations yet.
                  </div>
                </div>
              )}

              {customers.map((customer) => {
                const customerId = Number(customer.id);

                const conversationMessages = messages.filter(
                  (message) =>
                    Number(message.customer_id) === customerId
                );

                const lastMessage =
                  latestMessageByCustomer.get(customerId);

                const unreadCount = conversationMessages.filter(
                  isUnreadCustomerMessage
                ).length;

                const isSelected =
                  Number(selectedCustomer?.id) === customerId;

                return (
                  <button
                    key={customerId}
                    type="button"
                    onClick={() =>
                      loadCustomerConversation(customer)
                    }
                    className="w-100 text-start border-0 border-bottom"
                    style={{
                      padding: "15px",
                      backgroundColor: isSelected
                        ? "#e8f5e9"
                        : "white",
                    }}
                  >
                    <div className="d-flex gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: "42px",
                          height: "42px",
                          backgroundColor: isSelected
                            ? "#4f46e5"
                            : "#e9ecef",
                          color: isSelected
                            ? "white"
                            : "#495057",
                          fontWeight: "600",
                        }}
                      >
                        {customer.name?.charAt(0)?.toUpperCase() ||
                          "C"}
                      </div>

                      <div
                        className="flex-grow-1"
                        style={{ minWidth: 0 }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div
                            className={
                              unreadCount > 0
                                ? "fw-bold"
                                : "fw-semibold"
                            }
                          >
                            {customer.name}
                          </div>

                          {unreadCount > 0 && (
                            <span
                              className="badge bg-danger rounded-pill ms-2"
                              style={{ minWidth: "22px" }}
                            >
                              {unreadCount}
                            </span>
                          )}
                        </div>

                        <div className="small text-muted text-truncate">
                          {lastMessage?.sender === "seller"
                            ? "You: "
                            : ""}
                          {lastMessage?.message || "No messages"}
                        </div>

                        {lastMessage && (
                          <div className="small text-muted mt-1">
                            {formatTime(lastMessage.created_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================= */}
          {/* CHAT AREA */}
          {/* ============================================= */}

          <div className="col-md-8 col-lg-9 d-flex flex-column">
            {!selectedCustomer && (
              <div className="h-100 d-flex align-items-center justify-content-center">
                <div
                  className="text-center text-muted"
                  style={{ maxWidth: "400px" }}
                >
                  <div style={{ fontSize: "60px" }}>
                    💬
                  </div>

                  <h5 className="fw-bold mt-3">
                    Select a conversation
                  </h5>

                  <p>
                    Choose a customer from the list to view and
                    reply to their messages.
                  </p>
                </div>
              </div>
            )}

            {selectedCustomer && (
              <>
                {/* ======================================= */}
                {/* CHAT HEADER */}
                {/* ======================================= */}

                <div className="p-3 border-bottom bg-white">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: "42px",
                          height: "42px",
                          backgroundColor: "#4f46e5",
                          color: "white",
                          fontWeight: "600",
                        }}
                      >
                        {selectedCustomer.name
                          ?.charAt(0)
                          ?.toUpperCase() || "C"}
                      </div>

                      <div>
                        <div className="fw-bold">
                          {selectedCustomer.name}
                        </div>

                        <div className="small text-muted">
                          {selectedCustomer.phone}

                          {selectedCustomer.email &&
                            ` · ${selectedCustomer.email}`}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {!selectionMode && (
                        <span className="badge bg-success-subtle text-success">
                          Customer
                        </span>
                      )}

                      {!selectionMode ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={toggleSelectionMode}
                          disabled={
                            customerMessages.length === 0 ||
                            loadingConversation ||
                            deletingSelected
                          }
                        >
                          ☑ Select
                        </button>
                      ) : (
                        <>
                          <span className="small fw-semibold text-muted">
                            {selectedMessageIds.size} selected
                          </span>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={toggleSelectAll}
                            disabled={
                              selectableMessageIds.length === 0 ||
                              deletingSelected
                            }
                          >
                            {allMessagesSelected
                              ? "Deselect all"
                              : "Select all"}
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={handleDeleteSelected}
                            disabled={
                              selectedMessageIds.size === 0 ||
                              deletingSelected
                            }
                          >
                            {deletingSelected ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-1"
                                  role="status"
                                />
                                Deleting...
                              </>
                            ) : (
                              <>
                                🗑 Delete selected
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={toggleSelectionMode}
                            disabled={deletingSelected}
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {!selectionMode && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={closeConversation}
                          disabled={deletingSelected}
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ======================================= */}
                {/* CHAT MESSAGES */}
                {/* ======================================= */}

                <div
                  ref={chatContainerRef}
                  className="flex-grow-1 p-3 p-md-4"
                  style={{
                    height: "470px",
                    overflowY: "auto",
                    backgroundColor: "#f7f9f7",
                  }}
                >
                  {loadingConversation && (
                    <div className="text-center text-muted">
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      />

                      <div className="small mt-2">
                        Loading conversation...
                      </div>
                    </div>
                  )}

                  {!loadingConversation &&
                    customerMessages.length === 0 && (
                      <div className="text-center text-muted mt-5">
                        <div style={{ fontSize: "40px" }}>
                          💬
                        </div>

                        <div className="mt-2">
                          No messages yet.
                        </div>
                      </div>
                    )}

                  {customerMessages.map((item) => {
                    const isSeller = item.sender === "seller";
                    const messageId = Number(item.id);

                    const isDeleting = deletingMessageIds.has(
                      messageId
                    );

                    const isChecked =
                      selectedMessageIds.has(messageId);

                    return (
                      <div
                        key={item.id}
                        className={`d-flex align-items-center gap-2 mb-3 ${
                          isSeller
                            ? "justify-content-end"
                            : "justify-content-start"
                        }`}
                      >
                        {/* SELECT CHECKBOX */}

                        {selectionMode && (
                          <div
                            className="d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: "30px",
                              alignSelf: "center",
                            }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={isChecked}
                              onChange={() =>
                                toggleMessageSelection(messageId)
                              }
                              disabled={
                                isDeleting || deletingSelected
                              }
                              aria-label={`Select message ${messageId}`}
                              style={{
                                width: "19px",
                                height: "19px",
                                cursor: isDeleting
                                  ? "not-allowed"
                                  : "pointer",
                              }}
                            />
                          </div>
                        )}

                        {/* MESSAGE BUBBLE */}

                        <div
                          style={{
                            maxWidth: "85%",
                            minWidth: "120px",
                            opacity: isDeleting ? 0.6 : 1,
                          }}
                        >
                          <div
                            className="small text-muted mb-1"
                            style={{
                              textAlign: isSeller
                                ? "right"
                                : "left",
                            }}
                          >
                            {isSeller
                              ? "You"
                              : selectedCustomer.name}
                          </div>

                          <div
                            className="px-3 py-2"
                            onClick={() => {
                              if (selectionMode) {
                                toggleMessageSelection(messageId);
                              }
                            }}
                            style={{
                              backgroundColor: isChecked
                                ? "#d9eadf"
                                : isSeller
                                ? "#4f46e5"
                                : "white",
                              color: isChecked
                                ? "#212529"
                                : isSeller
                                ? "white"
                                : "#212529",
                              borderRadius: isSeller
                                ? "16px 16px 4px 16px"
                                : "16px 16px 16px 4px",
                              boxShadow:
                                "0 1px 3px rgba(0,0,0,0.08)",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              cursor: selectionMode
                                ? "pointer"
                                : "default",
                              outline: isChecked
                                ? "2px solid #4f46e5"
                                : "none",
                              outlineOffset: "-2px",
                            }}
                          >
                            <div>{item.message}</div>

                            {/* TIME AND MESSAGE TICKS */}

                            <div
                              className="mt-1 d-flex align-items-center justify-content-end"
                              style={{
                                fontSize: "11px",
                                opacity:
                                  isChecked || !isSeller ? 0.65 : 0.9,
                              }}
                            >
                              <span>
                                {formatTime(item.created_at)}
                              </span>

                              {isSeller && (
                                <MessageTicks message={item} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ======================================= */}
                {/* REPLY BOX */}
                {/* ======================================= */}

                {!selectionMode && (
                  <div className="p-3 border-top bg-white">
                    <form onSubmit={handleReply}>
                      <div className="d-flex gap-2 align-items-end">
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder="Type your reply..."
                          value={reply}
                          onChange={(e) =>
                            setReply(e.target.value)
                          }
                          disabled={sending}
                          style={{
                            resize: "none",
                            borderRadius: "12px",
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              !e.shiftKey
                            ) {
                              e.preventDefault();
                              handleReply(e);
                            }
                          }}
                        />

                        <button
                          type="submit"
                          className="btn btn-success d-flex align-items-center justify-content-center"
                          disabled={sending || !reply.trim()}
                          style={{
                            height: "48px",
                            minWidth: "55px",
                            borderRadius: "12px",
                          }}
                        >
                          {sending ? (
                            <span
                              className="spinner-border spinner-border-sm"
                              role="status"
                            />
                          ) : (
                            "➤"
                          )}
                        </button>
                      </div>

                      <div className="small text-muted mt-1">
                        Enter to send · Shift + Enter for a new line
                      </div>
                    </form>
                  </div>
                )}

                {selectionMode && (
                  <div className="p-3 border-top bg-white">
                    <div className="small text-muted text-center">
                      Select messages using the checkboxes, then
                      choose an action above.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages;