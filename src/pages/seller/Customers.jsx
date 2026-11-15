import React, { useMemo, useState } from "react";

const INITIAL_CUSTOMERS = [];

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  location: "",
  customerType: "individual",
  status: "active",
  notes: "",
};

const money = (value) =>
  `KSh ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const makeCustomerCode = () =>
  `CUS-${Date.now().toString().slice(-7)}`;

export default function Customers() {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const stats = useMemo(() => {
    const active = customers.filter(
      (customer) => customer.status === "active"
    ).length;

    const inactive = customers.length - active;

    return {
      total: customers.length,
      active,
      inactive,
      business: customers.filter(
        (customer) => customer.customerType === "business"
      ).length,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers
      .filter((customer) => {
        const matchesSearch =
          !query ||
          [
            customer.code,
            customer.name,
            customer.phone,
            customer.email,
            customer.location,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(query)
            );

        const matchesStatus =
          statusFilter === "all" ||
          customer.status === statusFilter;

        const matchesType =
          typeFilter === "all" ||
          customer.customerType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, search, statusFilter, typeFilter]);

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingCustomer(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      location: customer.location || "",
      customerType: customer.customerType || "individual",
      status: customer.status || "active",
      notes: customer.notes || "",
    });
    setFormError("");
    setSelectedCustomer(null);
    setShowForm(true);
  };

  const saveCustomer = (event) => {
    event.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();

    if (!name || !phone) {
      setFormError("Customer name and phone number are required.");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    const duplicatePhone = customers.some(
      (customer) =>
        customer.phone.replace(/\s+/g, "") ===
          phone.replace(/\s+/g, "") &&
        customer.id !== editingCustomer?.id
    );

    if (duplicatePhone) {
      setFormError(
        "A customer with this phone number already exists."
      );
      return;
    }

    const now = new Date().toISOString();

    if (editingCustomer) {
      const updatedCustomer = {
        ...editingCustomer,
        ...form,
        name,
        phone,
        email,
        updatedAt: now,
      };

      setCustomers((previous) =>
        previous.map((customer) =>
          customer.id === editingCustomer.id
            ? updatedCustomer
            : customer
        )
      );

      setNotice("Customer details updated in preview mode.");
    } else {
      const newCustomer = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        code: makeCustomerCode(),
        ...form,
        name,
        phone,
        email,
        totalOrders: 0,
        totalSpent: 0,
        createdAt: now,
        updatedAt: now,
      };

      setCustomers((previous) => [
        newCustomer,
        ...previous,
      ]);

      setNotice("Customer added in preview mode.");
    }

    setForm(EMPTY_FORM);
    setEditingCustomer(null);
    setShowForm(false);
  };

  const toggleCustomerStatus = (customer) => {
    const nextStatus =
      customer.status === "active" ? "inactive" : "active";

    const updatedAt = new Date().toISOString();

    setCustomers((previous) =>
      previous.map((item) =>
        item.id === customer.id
          ? { ...item, status: nextStatus, updatedAt }
          : item
      )
    );

    setSelectedCustomer((previous) =>
      previous?.id === customer.id
        ? { ...previous, status: nextStatus, updatedAt }
        : previous
    );

    setNotice(
      `Customer marked as ${nextStatus} in preview mode.`
    );
  };

  const deleteCustomer = (customer) => {
    const confirmed = window.confirm(
      `Delete ${customer.name} from this preview?`
    );

    if (!confirmed) return;

    setCustomers((previous) =>
      previous.filter((item) => item.id !== customer.id)
    );

    setSelectedCustomer(null);
    setNotice("Customer removed from preview.");
  };

  const exportCSV = () => {
    const headers = [
      "Customer Code",
      "Name",
      "Phone",
      "Email",
      "Location",
      "Customer Type",
      "Status",
      "Total Orders",
      "Total Spent",
      "Date Added",
      "Notes",
    ];

    const rows = filteredCustomers.map((customer) => [
      customer.code,
      customer.name,
      customer.phone,
      customer.email,
      customer.location,
      customer.customerType,
      customer.status,
      customer.totalOrders,
      customer.totalSpent,
      customer.createdAt,
      customer.notes,
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
    link.download = "myduka-customers.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="md-customers">
      <style>{`
        .md-customers {
          width: 100%;
          min-width: 0;
          padding: 4px 0 28px;
          color: var(--text-primary, #172033);
          font-family: inherit;
        }

        .md-customers * {
          box-sizing: border-box;
        }

        .md-customers button,
        .md-customers input,
        .md-customers select,
        .md-customers textarea {
          font: inherit;
        }

        .md-customers button {
          cursor: pointer;
        }

        .md-customers-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .md-customers-title {
          margin: 0;
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -.7px;
        }

        .md-customers-subtitle {
          margin: 7px 0 0;
          color: var(--text-secondary, #64748b);
          font-size: 13px;
          line-height: 1.6;
        }

        .md-customers-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .md-customers-btn {
          padding: 10px 14px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 9px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          font-size: 12px;
          font-weight: 700;
        }

        .md-customers-btn.primary {
          border-color: #2563eb;
          background: #2563eb;
          color: #fff;
        }

        .md-customers-btn.danger {
          border-color: #fecaca;
          color: #dc2626;
          background: #fff;
        }

        .md-customers-btn:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .md-customers-preview {
          padding: 12px 14px;
          margin-bottom: 18px;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          background: #eff6ff;
          color: #1e40af;
          font-size: 12px;
          line-height: 1.6;
        }

        .md-customers-notice {
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

        .md-customers-notice button {
          border: 0;
          background: transparent;
          color: inherit;
          font-weight: 800;
        }

        .md-customers-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 20px;
        }

        .md-customers-stat {
          min-width: 0;
          padding: 16px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          background: var(--card-bg, #fff);
        }

        .md-customers-stat-label {
          color: var(--text-secondary, #64748b);
          font-size: 11px;
          font-weight: 600;
        }

        .md-customers-stat-value {
          margin-top: 9px;
          font-size: 24px;
          font-weight: 800;
        }

        .md-customers-stat-hint {
          margin-top: 4px;
          color: var(--text-secondary, #64748b);
          font-size: 10px;
        }

        .md-customers-toolbar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 14px;
        }

        .md-customers-search {
          flex: 1 1 250px;
        }

        .md-customers-input,
        .md-customers-select,
        .md-customers-textarea {
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

        .md-customers-input:focus,
        .md-customers-select:focus,
        .md-customers-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,.1);
        }

        .md-customers-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          background: var(--card-bg, #fff);
        }

        .md-customers-table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
          text-align: left;
        }

        .md-customers-table th {
          padding: 13px 14px;
          background: var(--surface-secondary, #f8fafc);
          color: var(--text-secondary, #64748b);
          font-size: 10px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: .4px;
          white-space: nowrap;
        }

        .md-customers-table td {
          padding: 14px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          font-size: 12px;
          vertical-align: middle;
        }

        .md-customers-table tbody tr:hover {
          background: var(--surface-secondary, #f8fafc);
        }

        .md-customers-code {
          padding: 0;
          border: 0;
          background: transparent;
          color: #2563eb;
          font-size: 12px;
          font-weight: 750;
        }

        .md-customers-secondary {
          margin-top: 4px;
          color: var(--text-secondary, #64748b);
          font-size: 10px;
        }

        .md-customers-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 750;
          white-space: nowrap;
        }

        .md-customers-empty {
          padding: 55px 20px;
          text-align: center;
          color: var(--text-secondary, #64748b);
        }

        .md-customers-empty-icon {
          display: grid;
          place-items: center;
          width: 52px;
          height: 52px;
          margin: 0 auto 14px;
          border-radius: 15px;
          background: var(--surface-secondary, #f1f5f9);
          font-size: 23px;
        }

        .md-customers-empty h3 {
          margin: 0 0 7px;
          color: var(--text-primary, #172033);
          font-size: 15px;
        }

        .md-customers-empty p {
          max-width: 390px;
          margin: 0 auto 17px;
          font-size: 12px;
          line-height: 1.7;
        }

        .md-customers-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
          background: rgba(15,23,42,.48);
        }

        .md-customers-panel {
          width: min(600px, 100%);
          height: 100%;
          overflow-y: auto;
          padding: 24px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          box-shadow: -10px 0 35px rgba(0,0,0,.12);
        }

        .md-customers-panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 22px;
        }

        .md-customers-panel-header h2 {
          margin: 0;
          font-size: 19px;
        }

        .md-customers-close {
          width: 34px;
          height: 34px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          background: transparent;
          color: inherit;
          font-size: 18px;
        }

        .md-customers-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .md-customers-field {
          min-width: 0;
        }

        .md-customers-field.full {
          grid-column: 1 / -1;
        }

        .md-customers-field label {
          display: block;
          margin-bottom: 7px;
          font-size: 11px;
          font-weight: 700;
        }

        .md-customers-required {
          color: #dc2626;
        }

        .md-customers-textarea {
          min-height: 100px;
          resize: vertical;
        }

        .md-customers-error {
          grid-column: 1 / -1;
          color: #dc2626;
          font-size: 12px;
        }

        .md-customers-form-actions {
          grid-column: 1 / -1;
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding-top: 8px;
        }

        .md-customers-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .md-customers-detail-item {
          min-width: 0;
          padding: 13px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 9px;
        }

        .md-customers-detail-item span {
          display: block;
          margin-bottom: 6px;
          color: var(--text-secondary, #64748b);
          font-size: 10px;
        }

        .md-customers-detail-item strong {
          display: block;
          overflow-wrap: anywhere;
          font-size: 12px;
        }

        .md-customers-section-title {
          margin: 22px 0 12px;
          font-size: 13px;
          font-weight: 800;
        }

        .md-customers-notes {
          padding: 14px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 9px;
          font-size: 12px;
          line-height: 1.7;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .md-customers-detail-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 20px;
        }

        @media (max-width: 900px) {
          .md-customers-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .md-customers-header {
            flex-direction: column;
          }

          .md-customers-actions {
            width: 100%;
          }

          .md-customers-actions button {
            flex: 1;
          }

          .md-customers-toolbar > * {
            flex: 1 1 100%;
          }

          .md-customers-panel {
            padding: 18px;
          }

          .md-customers-form,
          .md-customers-detail-grid {
            grid-template-columns: 1fr;
          }

          .md-customers-field.full,
          .md-customers-error,
          .md-customers-form-actions {
            grid-column: 1;
          }
        }
      `}</style>

      <div className="md-customers-header">
        <div>
          <h1 className="md-customers-title">Customers</h1>
          <p className="md-customers-subtitle">
            Manage customer profiles, contact information and relationships.
          </p>
        </div>

        <div className="md-customers-actions">
          <button
            className="md-customers-btn"
            onClick={exportCSV}
          >
            Export CSV
          </button>

          <button
            className="md-customers-btn primary"
            onClick={openCreateForm}
          >
            + Add customer
          </button>
        </div>
      </div>

      <div className="md-customers-preview">
        <strong>Frontend preview:</strong> Customer records created here
        are temporary and remain only in this browser session. Backend
        integration will connect customers to their orders, sales history
        and customer accounts.
      </div>

      {notice && (
        <div className="md-customers-notice">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>✕</button>
        </div>
      )}

      <div className="md-customers-stats">
        <div className="md-customers-stat">
          <div className="md-customers-stat-label">Total customers</div>
          <div className="md-customers-stat-value">{stats.total}</div>
          <div className="md-customers-stat-hint">
            All registered customers
          </div>
        </div>

        <div className="md-customers-stat">
          <div className="md-customers-stat-label">Active customers</div>
          <div className="md-customers-stat-value">{stats.active}</div>
          <div className="md-customers-stat-hint">
            Currently active profiles
          </div>
        </div>

        <div className="md-customers-stat">
          <div className="md-customers-stat-label">Inactive customers</div>
          <div className="md-customers-stat-value">{stats.inactive}</div>
          <div className="md-customers-stat-hint">
            Deactivated profiles
          </div>
        </div>

        <div className="md-customers-stat">
          <div className="md-customers-stat-label">Business customers</div>
          <div className="md-customers-stat-value">{stats.business}</div>
          <div className="md-customers-stat-hint">
            Registered business accounts
          </div>
        </div>
      </div>

      <div className="md-customers-toolbar">
        <div className="md-customers-search">
          <input
            className="md-customers-input"
            placeholder="Search name, customer code, phone, email or location..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div style={{ minWidth: 145 }}>
          <select
            className="md-customers-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div style={{ minWidth: 155 }}>
          <select
            className="md-customers-select"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="all">All customer types</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>

      <div className="md-customers-table-wrap">
        {filteredCustomers.length === 0 ? (
          <div className="md-customers-empty">
            <div className="md-customers-empty-icon">👥</div>

            <h3>
              {customers.length === 0
                ? "No customers yet"
                : "No matching customers"}
            </h3>

            <p>
              {customers.length === 0
                ? "Your customer directory will appear here as customers register or are added. You can add a customer manually to preview the page."
                : "Try changing your search or filters to find the customer you need."}
            </p>

            {customers.length === 0 && (
              <button
                className="md-customers-btn primary"
                onClick={openCreateForm}
              >
                + Add your first customer
              </button>
            )}
          </div>
        ) : (
          <table className="md-customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Orders</th>
                <th>Total spent</th>
                <th>Status</th>
                <th>Date added</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <button
                      className="md-customers-code"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      {customer.name}
                    </button>
                    <div className="md-customers-secondary">
                      {customer.code}
                    </div>
                  </td>

                  <td>
                    <strong>{customer.phone}</strong>
                    <div className="md-customers-secondary">
                      {customer.email || "No email"}
                    </div>
                  </td>

                  <td>
                    {customer.customerType === "business"
                      ? "Business"
                      : "Individual"}
                  </td>

                  <td>{customer.totalOrders || 0}</td>

                  <td>{money(customer.totalSpent)}</td>

                  <td>
                    <span
                      className="md-customers-badge"
                      style={{
                        background:
                          customer.status === "active"
                            ? "#dcfce7"
                            : "#f1f5f9",
                        color:
                          customer.status === "active"
                            ? "#15803d"
                            : "#64748b",
                      }}
                    >
                      {customer.status === "active"
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  <td>{formatDate(customer.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div
          className="md-customers-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div className="md-customers-panel">
            <div className="md-customers-panel-header">
              <div>
                <h2>
                  {editingCustomer ? "Edit customer" : "Add customer"}
                </h2>
                <p className="md-customers-subtitle">
                  {editingCustomer
                    ? "Update the customer's profile information."
                    : "Create a customer profile for your business."}
                </p>
              </div>

              <button
                className="md-customers-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form
              className="md-customers-form"
              onSubmit={saveCustomer}
            >
              <div className="md-customers-field">
                <label>
                  Customer name{" "}
                  <span className="md-customers-required">*</span>
                </label>
                <input
                  className="md-customers-input"
                  value={form.name}
                  onChange={(event) =>
                    updateForm("name", event.target.value)
                  }
                  placeholder="Full name or business name"
                  autoFocus
                />
              </div>

              <div className="md-customers-field">
                <label>
                  Phone number{" "}
                  <span className="md-customers-required">*</span>
                </label>
                <input
                  className="md-customers-input"
                  value={form.phone}
                  onChange={(event) =>
                    updateForm("phone", event.target.value)
                  }
                  placeholder="07XX XXX XXX"
                />
              </div>

              <div className="md-customers-field">
                <label>Email address</label>
                <input
                  className="md-customers-input"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateForm("email", event.target.value)
                  }
                  placeholder="customer@example.com"
                />
              </div>

              <div className="md-customers-field">
                <label>Customer type</label>
                <select
                  className="md-customers-select"
                  value={form.customerType}
                  onChange={(event) =>
                    updateForm("customerType", event.target.value)
                  }
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </div>

              <div className="md-customers-field full">
                <label>Location / Address</label>
                <input
                  className="md-customers-input"
                  value={form.location}
                  onChange={(event) =>
                    updateForm("location", event.target.value)
                  }
                  placeholder="Town, estate or physical address"
                />
              </div>

              <div className="md-customers-field">
                <label>Account status</label>
                <select
                  className="md-customers-select"
                  value={form.status}
                  onChange={(event) =>
                    updateForm("status", event.target.value)
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="md-customers-field full">
                <label>Customer notes</label>
                <textarea
                  className="md-customers-textarea"
                  value={form.notes}
                  onChange={(event) =>
                    updateForm("notes", event.target.value)
                  }
                  placeholder="Additional customer information..."
                />
              </div>

              {formError && (
                <div className="md-customers-error">
                  {formError}
                </div>
              )}

              <div className="md-customers-form-actions">
                <button
                  type="button"
                  className="md-customers-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="md-customers-btn primary"
                >
                  {editingCustomer ? "Save changes" : "Add customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div
          className="md-customers-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCustomer(null);
            }
          }}
        >
          <div className="md-customers-panel">
            <div className="md-customers-panel-header">
              <div>
                <h2>{selectedCustomer.name}</h2>
                <p className="md-customers-subtitle">
                  {selectedCustomer.code}
                </p>
              </div>

              <button
                className="md-customers-close"
                onClick={() => setSelectedCustomer(null)}
              >
                ×
              </button>
            </div>

            <span
              className="md-customers-badge"
              style={{
                background:
                  selectedCustomer.status === "active"
                    ? "#dcfce7"
                    : "#f1f5f9",
                color:
                  selectedCustomer.status === "active"
                    ? "#15803d"
                    : "#64748b",
              }}
            >
              {selectedCustomer.status === "active"
                ? "Active customer"
                : "Inactive customer"}
            </span>

            <h3 className="md-customers-section-title">
              Customer information
            </h3>

            <div className="md-customers-detail-grid">
              <div className="md-customers-detail-item">
                <span>Phone number</span>
                <strong>{selectedCustomer.phone}</strong>
              </div>

              <div className="md-customers-detail-item">
                <span>Email address</span>
                <strong>{selectedCustomer.email || "—"}</strong>
              </div>

              <div className="md-customers-detail-item">
                <span>Customer type</span>
                <strong>
                  {selectedCustomer.customerType === "business"
                    ? "Business"
                    : "Individual"}
                </strong>
              </div>

              <div className="md-customers-detail-item">
                <span>Location</span>
                <strong>{selectedCustomer.location || "—"}</strong>
              </div>

              <div className="md-customers-detail-item">
                <span>Date added</span>
                <strong>{formatDate(selectedCustomer.createdAt)}</strong>
              </div>

              <div className="md-customers-detail-item">
                <span>Last updated</span>
                <strong>{formatDate(selectedCustomer.updatedAt)}</strong>
              </div>

              <div className="md-customers-detail-item">
                <span>Total orders</span>
                <strong>{selectedCustomer.totalOrders || 0}</strong>
              </div>

              <div className="md-customers-detail-item">
                <span>Total spent</span>
                <strong>{money(selectedCustomer.totalSpent)}</strong>
              </div>
            </div>

            <h3 className="md-customers-section-title">
              Customer notes
            </h3>

            <div className="md-customers-notes">
              {selectedCustomer.notes || "No notes have been added."}
            </div>

            <div className="md-customers-detail-actions">
              <button
                className="md-customers-btn primary"
                onClick={() => openEditForm(selectedCustomer)}
              >
                Edit customer
              </button>

              <button
                className="md-customers-btn"
                onClick={() =>
                  toggleCustomerStatus(selectedCustomer)
                }
              >
                {selectedCustomer.status === "active"
                  ? "Deactivate"
                  : "Activate"}
              </button>

              <button
                className="md-customers-btn danger"
                onClick={() => deleteCustomer(selectedCustomer)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
