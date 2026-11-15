import React, { useMemo, useState } from "react";

const INITIAL_CONVERSATIONS = [];

const EMPTY_MESSAGE = {
  customerName: "",
  customerPhone: "",
  subject: "",
  channel: "website",
  message: "",
};

const CHANNELS = [
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "open", label: "Open", color: "#2563eb" },
  { value: "pending", label: "Pending", color: "#d97706" },
  { value: "resolved", label: "Resolved", color: "#059669" },
  { value: "archived", label: "Archived", color: "#64748b" },
];

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getStatus = (value) =>
  STATUSES.find((status) => status.value === value) || STATUSES[0];

const getChannel = (value) =>
  CHANNELS.find((channel) => channel.value === value)?.label || "Other";

const makeReference = () =>
  `MSG-${Date.now().toString().slice(-8)}`;

export default function Messages() {
  const [conversations, setConversations] = useState(
    INITIAL_CONVERSATIONS
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessage, setNewMessage] = useState(EMPTY_MESSAGE);
  const [replyText, setReplyText] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId
  );

  const stats = useMemo(() => ({
    total: conversations.length,
    unread: conversations.filter(
      (conversation) => conversation.unread
    ).length,
    open: conversations.filter(
      (conversation) => conversation.status === "open"
    ).length,
    pending: conversations.filter(
      (conversation) => conversation.status === "pending"
    ).length,
    resolved: conversations.filter(
      (conversation) => conversation.status === "resolved"
    ).length,
  }), [conversations]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return conversations
      .filter((conversation) => {
        const matchesSearch =
          !query ||
          [
            conversation.reference,
            conversation.customerName,
            conversation.customerPhone,
            conversation.subject,
            conversation.lastMessage,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(query)
            );

        const matchesStatus =
          statusFilter === "all" ||
          conversation.status === statusFilter;

        const matchesChannel =
          channelFilter === "all" ||
          conversation.channel === channelFilter;

        return matchesSearch && matchesStatus && matchesChannel;
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime()
      );
  }, [conversations, search, statusFilter, channelFilter]);

  const updateNewMessage = (field, value) => {
    setNewMessage((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const createConversation = (event) => {
    event.preventDefault();
    setFormError("");

    const customerName = newMessage.customerName.trim();
    const customerPhone = newMessage.customerPhone.trim();
    const subject = newMessage.subject.trim();
    const message = newMessage.message.trim();

    if (!customerName || !subject || !message) {
      setFormError(
        "Customer name, subject and message are required."
      );
      return;
    }

    const now = new Date().toISOString();

    const conversation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      reference: makeReference(),
      customerName,
      customerPhone,
      subject,
      channel: newMessage.channel,
      status: "open",
      unread: false,
      createdAt: now,
      updatedAt: now,
      lastMessage: message,
      messages: [
        {
          id: `${Date.now()}-initial`,
          sender: "customer",
          text: message,
          timestamp: now,
        },
      ],
    };

    setConversations((previous) => [
      conversation,
      ...previous,
    ]);

    setSelectedId(conversation.id);
    setNewMessage(EMPTY_MESSAGE);
    setShowNewMessage(false);
    setNotice("Conversation created in preview mode.");
  };

  const sendReply = (event) => {
    event.preventDefault();

    if (!selectedConversation || !replyText.trim()) return;

    const now = new Date().toISOString();
    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender: "business",
      text: replyText.trim(),
      timestamp: now,
    };

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === selectedId
          ? {
              ...conversation,
              messages: [
                ...(conversation.messages || []),
                message,
              ],
              lastMessage: message.text,
              updatedAt: now,
              unread: false,
              status:
                conversation.status === "resolved"
                  ? "open"
                  : conversation.status,
            }
          : conversation
      )
    );

    setReplyText("");
    setNotice("Reply added in preview mode.");
  };

  const updateConversation = (id, updates) => {
    const now = new Date().toISOString();

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === id
          ? {
              ...conversation,
              ...updates,
              updatedAt: now,
            }
          : conversation
      )
    );
  };

  const openConversation = (conversation) => {
    setSelectedId(conversation.id);

    if (conversation.unread) {
      updateConversation(conversation.id, {
        unread: false,
      });
    }
  };

  const exportCSV = () => {
    const headers = [
      "Reference",
      "Customer",
      "Phone",
      "Subject",
      "Channel",
      "Status",
      "Last Message",
      "Date Created",
      "Last Updated",
    ];

    const rows = filteredConversations.map((conversation) => [
      conversation.reference,
      conversation.customerName,
      conversation.customerPhone,
      conversation.subject,
      getChannel(conversation.channel),
      getStatus(conversation.status).label,
      conversation.lastMessage,
      conversation.createdAt,
      conversation.updatedAt,
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) =>
        row.map(escapeCSV).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "myduka-messages.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="md-messages">
      <style>{`
        .md-messages {
          width: 100%;
          min-width: 0;
          padding: 4px 0 28px;
          color: var(--text-primary, #172033);
          font-family: inherit;
        }

        .md-messages * {
          box-sizing: border-box;
        }

        .md-messages button,
        .md-messages input,
        .md-messages select,
        .md-messages textarea {
          font: inherit;
        }

        .md-messages button {
          cursor: pointer;
        }

        .md-messages-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .md-messages-title {
          margin: 0;
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -.7px;
        }

        .md-messages-subtitle {
          margin: 7px 0 0;
          color: var(--text-secondary, #64748b);
          font-size: 13px;
          line-height: 1.6;
        }

        .md-messages-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .md-messages-btn {
          padding: 10px 14px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 9px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          font-size: 12px;
          font-weight: 700;
        }

        .md-messages-btn.primary {
          border-color: #2563eb;
          background: #2563eb;
          color: #fff;
        }

        .md-messages-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .md-messages-preview {
          padding: 12px 14px;
          margin-bottom: 18px;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          background: #eff6ff;
          color: #1e40af;
          font-size: 12px;
          line-height: 1.6;
        }

        .md-messages-notice {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 11px 14px;
          margin-bottom: 15px;
          border: 1px solid #a7f3d0;
          border-radius: 9px;
          background: #ecfdf5;
          color: #047857;
          font-size: 12px;
        }

        .md-messages-notice button {
          border: 0;
          background: transparent;
          color: inherit;
          font-weight: 800;
        }

        .md-messages-stats {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 20px;
        }

        .md-messages-stat {
          min-width: 0;
          padding: 16px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          background: var(--card-bg, #fff);
        }

        .md-messages-stat-label {
          color: var(--text-secondary, #64748b);
          font-size: 11px;
          font-weight: 600;
        }

        .md-messages-stat-value {
          margin-top: 9px;
          font-size: 24px;
          font-weight: 800;
        }

        .md-messages-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 14px;
        }

        .md-messages-search {
          flex: 1 1 250px;
        }

        .md-messages-input,
        .md-messages-select,
        .md-messages-textarea {
          width: 100%;
          min-width: 0;
          padding: 10px 12px;
          border: 1px solid var(--border-color, #cbd5e1);
          border-radius: 8px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          outline: none;
          font-size: 12px;
        }

        .md-messages-input:focus,
        .md-messages-select:focus,
        .md-messages-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,.1);
        }

        .md-messages-layout {
          display: grid;
          grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
          gap: 14px;
          min-height: 500px;
        }

        .md-messages-inbox,
        .md-messages-conversation {
          min-width: 0;
          overflow: hidden;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          background: var(--card-bg, #fff);
        }

        .md-messages-inbox-heading {
          padding: 15px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          font-size: 12px;
          font-weight: 800;
        }

        .md-messages-inbox-list {
          max-height: 570px;
          overflow-y: auto;
        }

        .md-messages-conversation-item {
          display: block;
          width: 100%;
          padding: 15px;
          border: 0;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          background: transparent;
          color: inherit;
          text-align: left;
        }

        .md-messages-conversation-item:hover,
        .md-messages-conversation-item.active {
          background: var(--surface-secondary, #f8fafc);
        }

        .md-messages-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .md-messages-item-name {
          font-size: 12px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .md-messages-item-date {
          flex-shrink: 0;
          color: var(--text-secondary, #64748b);
          font-size: 9px;
        }

        .md-messages-item-subject {
          margin-top: 7px;
          font-size: 11px;
          font-weight: 700;
        }

        .md-messages-item-preview {
          margin-top: 5px;
          color: var(--text-secondary, #64748b);
          font-size: 10px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .md-messages-item-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 10px;
        }

        .md-messages-badge {
          display: inline-flex;
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 750;
          white-space: nowrap;
        }

        .md-messages-unread {
          width: 8px;
          height: 8px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #2563eb;
        }

        .md-messages-empty {
          padding: 45px 18px;
          text-align: center;
          color: var(--text-secondary, #64748b);
        }

        .md-messages-empty-icon {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          margin: 0 auto 13px;
          border-radius: 14px;
          background: var(--surface-secondary, #f1f5f9);
          font-size: 22px;
        }

        .md-messages-empty h3 {
          margin: 0 0 7px;
          color: var(--text-primary, #172033);
          font-size: 14px;
        }

        .md-messages-empty p {
          margin: 0 auto 15px;
          max-width: 320px;
          font-size: 11px;
          line-height: 1.7;
        }

        .md-messages-conversation-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 17px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .md-messages-conversation-header h2 {
          margin: 0;
          font-size: 15px;
          overflow-wrap: anywhere;
        }

        .md-messages-conversation-meta {
          margin-top: 5px;
          color: var(--text-secondary, #64748b);
          font-size: 10px;
          line-height: 1.6;
        }

        .md-messages-conversation-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .md-messages-small-btn {
          padding: 7px 9px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 7px;
          background: var(--card-bg, #fff);
          color: inherit;
          font-size: 10px;
          font-weight: 700;
        }

        .md-messages-thread {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 300px;
          max-height: 430px;
          overflow-y: auto;
          padding: 18px;
          background: var(--surface-secondary, #f8fafc);
        }

        .md-messages-bubble-row {
          display: flex;
        }

        .md-messages-bubble-row.business {
          justify-content: flex-end;
        }

        .md-messages-bubble {
          max-width: 80%;
          padding: 11px 13px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          background: var(--card-bg, #fff);
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }

        .md-messages-bubble-row.business .md-messages-bubble {
          border-color: #bfdbfe;
          background: #eff6ff;
          color: #1e3a8a;
        }

        .md-messages-bubble-sender {
          margin-bottom: 5px;
          font-size: 9px;
          font-weight: 800;
          opacity: .7;
        }

        .md-messages-bubble-time {
          margin-top: 7px;
          font-size: 9px;
          opacity: .65;
        }

        .md-messages-reply {
          display: flex;
          align-items: flex-end;
          gap: 9px;
          padding: 14px;
          border-top: 1px solid var(--border-color, #e2e8f0);
        }

        .md-messages-reply textarea {
          min-height: 42px;
          max-height: 110px;
          resize: vertical;
        }

        .md-messages-reply button {
          flex-shrink: 0;
        }

        .md-messages-no-selection {
          display: grid;
          min-height: 500px;
          place-items: center;
          padding: 25px;
          text-align: center;
          color: var(--text-secondary, #64748b);
        }

        .md-messages-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
          background: rgba(15,23,42,.48);
        }

        .md-messages-panel {
          width: min(560px, 100%);
          height: 100%;
          overflow-y: auto;
          padding: 24px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
        }

        .md-messages-panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 22px;
        }

        .md-messages-panel-header h2 {
          margin: 0;
          font-size: 19px;
        }

        .md-messages-close {
          width: 34px;
          height: 34px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          background: transparent;
          color: inherit;
          font-size: 18px;
        }

        .md-messages-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .md-messages-field {
          min-width: 0;
        }

        .md-messages-field.full {
          grid-column: 1 / -1;
        }

        .md-messages-field label {
          display: block;
          margin-bottom: 7px;
          font-size: 11px;
          font-weight: 700;
        }

        .md-messages-required {
          color: #dc2626;
        }

        .md-messages-textarea {
          min-height: 120px;
          resize: vertical;
        }

        .md-messages-error {
          grid-column: 1 / -1;
          color: #dc2626;
          font-size: 12px;
        }

        .md-messages-form-actions {
          grid-column: 1 / -1;
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding-top: 8px;
        }

        @media (max-width: 1000px) {
          .md-messages-stats {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .md-messages-layout {
            grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
          }
        }

        @media (max-width: 720px) {
          .md-messages-header {
            flex-direction: column;
          }

          .md-messages-actions {
            width: 100%;
          }

          .md-messages-actions button {
            flex: 1;
          }

          .md-messages-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .md-messages-toolbar > * {
            flex: 1 1 100%;
          }

          .md-messages-layout {
            grid-template-columns: 1fr;
          }

          .md-messages-inbox-list {
            max-height: 330px;
          }

          .md-messages-conversation-header {
            flex-direction: column;
          }

          .md-messages-conversation-controls {
            width: 100%;
          }

          .md-messages-panel {
            padding: 18px;
          }

          .md-messages-form {
            grid-template-columns: 1fr;
          }

          .md-messages-field.full,
          .md-messages-error,
          .md-messages-form-actions {
            grid-column: 1;
          }
        }
      `}</style>

      <div className="md-messages-header">
        <div>
          <h1 className="md-messages-title">Messages</h1>
          <p className="md-messages-subtitle">
            Manage customer enquiries and conversations in one place.
          </p>
        </div>

        <div className="md-messages-actions">
          <button
            className="md-messages-btn"
            onClick={exportCSV}
          >
            Export CSV
          </button>

          <button
            className="md-messages-btn primary"
            onClick={() => {
              setFormError("");
              setShowNewMessage(true);
            }}
          >
            + New conversation
          </button>
        </div>
      </div>

      <div className="md-messages-preview">
        <strong>Frontend preview:</strong> Conversations created here
        are temporary and are not sent to customers. Backend integration
        will connect the inbox to website enquiries and supported messaging
        channels. Actual WhatsApp and email delivery will require their
        respective integrations.
      </div>

      {notice && (
        <div className="md-messages-notice">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>✕</button>
        </div>
      )}

      <div className="md-messages-stats">
        <div className="md-messages-stat">
          <div className="md-messages-stat-label">Conversations</div>
          <div className="md-messages-stat-value">{stats.total}</div>
        </div>

        <div className="md-messages-stat">
          <div className="md-messages-stat-label">Unread</div>
          <div className="md-messages-stat-value">{stats.unread}</div>
        </div>

        <div className="md-messages-stat">
          <div className="md-messages-stat-label">Open</div>
          <div className="md-messages-stat-value">{stats.open}</div>
        </div>

        <div className="md-messages-stat">
          <div className="md-messages-stat-label">Pending</div>
          <div className="md-messages-stat-value">{stats.pending}</div>
        </div>

        <div className="md-messages-stat">
          <div className="md-messages-stat-label">Resolved</div>
          <div className="md-messages-stat-value">{stats.resolved}</div>
        </div>
      </div>

      <div className="md-messages-toolbar">
        <div className="md-messages-search">
          <input
            className="md-messages-input"
            placeholder="Search customer, subject or message..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div style={{ minWidth: 145 }}>
          <select
            className="md-messages-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: 145 }}>
          <select
            className="md-messages-select"
            value={channelFilter}
            onChange={(event) => setChannelFilter(event.target.value)}
          >
            <option value="all">All channels</option>
            {CHANNELS.map((channel) => (
              <option key={channel.value} value={channel.value}>
                {channel.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="md-messages-layout">
        <section className="md-messages-inbox">
          <div className="md-messages-inbox-heading">
            Inbox ({filteredConversations.length})
          </div>

          <div className="md-messages-inbox-list">
            {filteredConversations.length === 0 ? (
              <div className="md-messages-empty">
                <div className="md-messages-empty-icon">✉️</div>
                <h3>
                  {conversations.length === 0
                    ? "Your inbox is empty"
                    : "No matching conversations"}
                </h3>
                <p>
                  {conversations.length === 0
                    ? "Customer messages and enquiries will appear here when connected. You can create a temporary conversation to preview the interface."
                    : "Try adjusting your search or filters."}
                </p>
                {conversations.length === 0 && (
                  <button
                    className="md-messages-btn primary"
                    onClick={() => setShowNewMessage(true)}
                  >
                    + New conversation
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const status = getStatus(conversation.status);

                return (
                  <button
                    key={conversation.id}
                    className={`md-messages-conversation-item ${
                      selectedId === conversation.id ? "active" : ""
                    }`}
                    onClick={() => openConversation(conversation)}
                  >
                    <div className="md-messages-item-top">
                      <span className="md-messages-item-name">
                        {conversation.customerName}
                      </span>

                      <span className="md-messages-item-date">
                        {formatDate(conversation.updatedAt)}
                      </span>
                    </div>

                    <div className="md-messages-item-subject">
                      {conversation.subject}
                    </div>

                    <div className="md-messages-item-preview">
                      {conversation.lastMessage}
                    </div>

                    <div className="md-messages-item-bottom">
                      <span
                        className="md-messages-badge"
                        style={{
                          background: `${status.color}18`,
                          color: status.color,
                        }}
                      >
                        {status.label}
                      </span>

                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                      }}>
                        <span className="md-messages-item-date">
                          {getChannel(conversation.channel)}
                        </span>
                        {conversation.unread && (
                          <span className="md-messages-unread" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="md-messages-conversation">
          {!selectedConversation ? (
            <div className="md-messages-no-selection">
              <div>
                <div className="md-messages-empty-icon">💬</div>
                <h3 style={{
                  color: "var(--text-primary, #172033)",
                  fontSize: 15,
                  margin: "0 0 7px",
                }}>
                  Select a conversation
                </h3>
                <p style={{
                  fontSize: 11,
                  lineHeight: 1.7,
                  margin: 0,
                }}>
                  Choose a conversation from your inbox to view messages
                  and manage its status.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="md-messages-conversation-header">
                <div>
                  <h2>{selectedConversation.subject}</h2>
                  <div className="md-messages-conversation-meta">
                    {selectedConversation.customerName}
                    {selectedConversation.customerPhone
                      ? ` · ${selectedConversation.customerPhone}`
                      : ""}
                    <br />
                    {selectedConversation.reference} ·{" "}
                    {getChannel(selectedConversation.channel)}
                  </div>
                </div>

                <div className="md-messages-conversation-controls">
                  <select
                    className="md-messages-select"
                    style={{ width: 125 }}
                    value={selectedConversation.status}
                    onChange={(event) =>
                      updateConversation(selectedId, {
                        status: event.target.value,
                      })
                    }
                  >
                    {STATUSES.map((status) => (
                      <option
                        key={status.value}
                        value={status.value}
                      >
                        {status.label}
                      </option>
                    ))}
                  </select>

                  <button
                    className="md-messages-small-btn"
                    onClick={() =>
                      updateConversation(selectedId, {
                        unread: !selectedConversation.unread,
                      })
                    }
                  >
                    {selectedConversation.unread
                      ? "Mark read"
                      : "Mark unread"}
                  </button>
                </div>
              </div>

              <div className="md-messages-thread">
                {(selectedConversation.messages || []).map(
                  (message) => (
                    <div
                      key={message.id}
                      className={`md-messages-bubble-row ${
                        message.sender === "business"
                          ? "business"
                          : ""
                      }`}
                    >
                      <div className="md-messages-bubble">
                        <div className="md-messages-bubble-sender">
                          {message.sender === "business"
                            ? "Your business"
                            : selectedConversation.customerName}
                        </div>

                        {message.text}

                        <div className="md-messages-bubble-time">
                          {formatDate(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              <form
                className="md-messages-reply"
                onSubmit={sendReply}
              >
                <textarea
                  className="md-messages-textarea"
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(event) =>
                    setReplyText(event.target.value)
                  }
                />

                <button
                  type="submit"
                  className="md-messages-btn primary"
                  disabled={!replyText.trim()}
                >
                  Reply
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {showNewMessage && (
        <div
          className="md-messages-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowNewMessage(false);
            }
          }}
        >
          <div className="md-messages-panel">
            <div className="md-messages-panel-header">
              <div>
                <h2>New conversation</h2>
                <p className="md-messages-subtitle">
                  Create a temporary customer conversation.
                </p>
              </div>

              <button
                className="md-messages-close"
                onClick={() => setShowNewMessage(false)}
              >
                ×
              </button>
            </div>

            <form
              className="md-messages-form"
              onSubmit={createConversation}
            >
              <div className="md-messages-field">
                <label>
                  Customer name{" "}
                  <span className="md-messages-required">*</span>
                </label>
                <input
                  className="md-messages-input"
                  value={newMessage.customerName}
                  onChange={(event) =>
                    updateNewMessage(
                      "customerName",
                      event.target.value
                    )
                  }
                  placeholder="Customer name"
                />
              </div>

              <div className="md-messages-field">
                <label>Customer phone</label>
                <input
                  className="md-messages-input"
                  value={newMessage.customerPhone}
                  onChange={(event) =>
                    updateNewMessage(
                      "customerPhone",
                      event.target.value
                    )
                  }
                  placeholder="07XX XXX XXX"
                />
              </div>

              <div className="md-messages-field">
                <label>Channel</label>
                <select
                  className="md-messages-select"
                  value={newMessage.channel}
                  onChange={(event) =>
                    updateNewMessage("channel", event.target.value)
                  }
                >
                  {CHANNELS.map((channel) => (
                    <option
                      key={channel.value}
                      value={channel.value}
                    >
                      {channel.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md-messages-field">
                <label>
                  Subject{" "}
                  <span className="md-messages-required">*</span>
                </label>
                <input
                  className="md-messages-input"
                  value={newMessage.subject}
                  onChange={(event) =>
                    updateNewMessage("subject", event.target.value)
                  }
                  placeholder="Conversation subject"
                />
              </div>

              <div className="md-messages-field full">
                <label>
                  Initial message{" "}
                  <span className="md-messages-required">*</span>
                </label>
                <textarea
                  className="md-messages-textarea"
                  value={newMessage.message}
                  onChange={(event) =>
                    updateNewMessage("message", event.target.value)
                  }
                  placeholder="Enter the first message..."
                />
              </div>

              {formError && (
                <div className="md-messages-error">
                  {formError}
                </div>
              )}

              <div className="md-messages-form-actions">
                <button
                  type="button"
                  className="md-messages-btn"
                  onClick={() => setShowNewMessage(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="md-messages-btn primary"
                >
                  Create conversation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
