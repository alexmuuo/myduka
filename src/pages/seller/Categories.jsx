import { useMemo, useState } from "react";

const COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#ea580c",
  "#db2777",
  "#0891b2",
  "#ca8a04",
  "#64748b",
];

const EMPTY_FORM = {
  name: "",
  description: "",
  color: "#2563eb",
  is_active: true,
};

export default function Categories() {
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState(null);

  const activeCount = categories.filter(
    (category) => category.is_active
  ).length;

  const inactiveCount = categories.length - activeCount;

  const filteredCategories = useMemo(() => {
    let result = [...categories];

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((category) =>
        `${category.name} ${category.description}`
          .toLowerCase()
          .includes(query)
      );
    }

    if (statusFilter === "active") {
      result = result.filter((category) => category.is_active);
    }

    if (statusFilter === "inactive") {
      result = result.filter((category) => !category.is_active);
    }

    switch (sortBy) {
      case "name":
        result.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        break;

      case "products-high":
        result.sort(
          (a, b) => b.product_count - a.product_count
        );
        break;

      case "oldest":
        result.sort((a, b) => a.id - b.id);
        break;

      default:
        result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [categories, search, statusFilter, sortBy]);

  const openCreateModal = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setForm({
      name: category.name,
      description: category.description || "",
      color: category.color,
      is_active: category.is_active,
    });

    setEditingId(category.id);
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
  };

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveCategory = (event) => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setError("Category name is required.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.name.toLowerCase() === name.toLowerCase() &&
        category.id !== editingId
    );

    if (duplicate) {
      setError("A category with this name already exists.");
      return;
    }

    if (editingId) {
      setCategories((previous) =>
        previous.map((category) =>
          category.id === editingId
            ? {
                ...category,
                name,
                description: form.description.trim(),
                color: form.color,
                is_active: form.is_active,
              }
            : category
        )
      );
    } else {
      setCategories((previous) => [
        {
          id: Date.now(),
          name,
          description: form.description.trim(),
          color: form.color,
          is_active: form.is_active,
          product_count: 0,
          created_at: new Date().toISOString(),
        },
        ...previous,
      ]);
    }

    closeModal();
  };

  const toggleStatus = (category) => {
    setCategories((previous) =>
      previous.map((item) =>
        item.id === category.id
          ? {
              ...item,
              is_active: !item.is_active,
            }
          : item
      )
    );
  };

  const deleteCategory = (category) => {
    if (category.product_count > 0) {
      alert(
        "This category contains products. Reassign those products before deleting the category."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete the category "${category.name}"?`
    );

    if (!confirmed) return;

    setCategories((previous) =>
      previous.filter((item) => item.id !== category.id)
    );

    if (selectedCategory?.id === category.id) {
      setSelectedCategory(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("newest");
  };

  const hasFilters =
    search || statusFilter !== "all";

  const inputStyle = {
    width: "100%",
    padding: "11px 13px",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: 9,
    background: "var(--input-bg, var(--card-bg, #fff))",
    color: "var(--text-primary, #0f172a)",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 650,
    marginBottom: 7,
    color: "var(--text-secondary, #475569)",
  };

  return (
    <div className="md-categories">
      <style>{`
        .md-categories {
          width: 100%;
          min-width: 0;
          color: var(--text-primary, #0f172a);
        }

        .md-categories * {
          box-sizing: border-box;
        }

        .md-categories button,
        .md-categories input,
        .md-categories textarea,
        .md-categories select {
          font: inherit;
        }

        .md-categories button {
          cursor: pointer;
        }

        .md-categories .md-card {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 13px;
        }

        .md-categories .md-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 15px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 650;
          transition: .18s ease;
        }

        .md-categories .md-primary {
          color: white;
          background: var(--primary-color, #2563eb);
          border: 1px solid var(--primary-color, #2563eb);
        }

        .md-categories .md-secondary {
          color: var(--text-primary, #0f172a);
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
        }

        .md-categories .md-button:hover {
          transform: translateY(-1px);
          filter: brightness(.97);
        }

        .md-categories .md-stat {
          padding: 17px;
        }

        .md-categories .md-stat-label {
          color: var(--text-secondary, #64748b);
          font-size: 12px;
          font-weight: 600;
        }

        .md-categories .md-stat-value {
          margin-top: 9px;
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -1px;
        }

        .md-categories input:focus,
        .md-categories textarea:focus,
        .md-categories select:focus {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(37,99,235,.09);
          outline: none;
        }

        .md-categories .md-category-card {
          padding: 17px;
          transition: .18s ease;
        }

        .md-categories .md-category-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(15,23,42,.06);
        }

        .md-categories .md-action {
          border: 1px solid var(--border-color, #e2e8f0);
          background: var(--card-bg, #fff);
          color: var(--text-primary, #0f172a);
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 600;
        }

        .md-categories .md-action:hover {
          background: var(--hover-bg, #f1f5f9);
        }

        .md-categories .md-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(15,23,42,.58);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 16px;
          overflow-y: auto;
        }

        .md-categories .md-modal {
          width: 100%;
          max-width: 520px;
          max-height: 94vh;
          overflow-y: auto;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 16px;
          box-shadow: 0 25px 80px rgba(0,0,0,.22);
        }

        .md-categories .md-modal-header {
          padding: 19px 22px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .md-categories .md-modal-body {
          padding: 22px;
        }

        .md-categories .md-modal-footer {
          padding: 16px 22px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .md-categories .md-empty {
          padding: 55px 20px;
          text-align: center;
        }

        .md-categories .md-color {
          width: 31px;
          height: 31px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
        }

        .md-categories .md-color.selected {
          outline: 2px solid var(--text-primary, #0f172a);
          outline-offset: 3px;
        }

        .md-categories .md-preview-banner {
          padding: 12px 14px;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          background: #eff6ff;
          color: #1e40af;
          font-size: 12px;
          line-height: 1.5;
        }

        @media (max-width: 850px) {
          .md-categories .md-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .md-categories .md-toolbar {
            flex-wrap: wrap;
          }

          .md-categories .md-category-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 560px) {
          .md-categories .md-heading {
            align-items: flex-start !important;
            flex-direction: column;
          }

          .md-categories .md-heading button {
            width: 100%;
          }

          .md-categories .md-category-grid {
            grid-template-columns: 1fr !important;
          }

          .md-categories .md-modal-body,
          .md-categories .md-modal-header,
          .md-categories .md-modal-footer {
            padding: 16px;
          }

          .md-categories .md-overlay {
            padding: 8px;
            align-items: flex-start;
          }
        }
      `}</style>

      {/* HEADER */}
      <div
        className="md-heading"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 15,
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 23,
              fontWeight: 750,
              letterSpacing: "-.6px",
              margin: 0,
            }}
          >
            Categories
          </h1>

          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary, #64748b)",
              margin: "6px 0 0",
            }}
          >
            Organise your products into meaningful categories.
          </p>
        </div>

        <button
          className="md-button md-primary"
          onClick={openCreateModal}
        >
          <span style={{ fontSize: 17 }}>＋</span>
          Create category
        </button>
      </div>

      {/* PREVIEW NOTICE */}
      <div className="md-preview-banner" style={{ marginBottom: 19 }}>
        <strong>Frontend preview mode.</strong>{" "}
        Categories created here are temporary. Business-specific
        database storage and product relationships will be connected
        during backend integration.
      </div>

      {/* STATISTICS */}
      <div
        className="md-stats"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 13,
          marginBottom: 21,
        }}
      >
        <div className="md-card md-stat">
          <div className="md-stat-label">
            Total categories
          </div>
          <div className="md-stat-value">
            {categories.length}
          </div>
        </div>

        <div className="md-card md-stat">
          <div className="md-stat-label">
            Active categories
          </div>
          <div className="md-stat-value" style={{ color: "#059669" }}>
            {activeCount}
          </div>
        </div>

        <div className="md-card md-stat">
          <div className="md-stat-label">
            Inactive categories
          </div>
          <div className="md-stat-value" style={{ color: "#64748b" }}>
            {inactiveCount}
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div
        className="md-card"
        style={{ padding: 15, marginBottom: 18 }}
      >
        <div
          className="md-toolbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 180 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              style={inputStyle}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              ...inputStyle,
              width: "auto",
              minWidth: 135,
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              ...inputStyle,
              width: "auto",
              minWidth: 145,
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
            <option value="products-high">Most products</option>
          </select>
        </div>

        {hasFilters && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 12,
              fontSize: 12,
              color: "var(--text-secondary, #64748b)",
            }}
          >
            <span>
              Showing {filteredCategories.length} of {categories.length} categories
            </span>

            <button
              onClick={clearFilters}
              style={{
                border: 0,
                background: "transparent",
                color: "var(--primary-color, #2563eb)",
                fontWeight: 650,
                fontSize: 12,
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* CATEGORY GRID */}
      {filteredCategories.length === 0 ? (
        <div className="md-card md-empty">
          <div
            style={{
              width: 65,
              height: 65,
              borderRadius: 18,
              display: "grid",
              placeItems: "center",
              background: "var(--hover-bg, #f1f5f9)",
              margin: "0 auto 16px",
              fontSize: 27,
            }}
          >
            ▦
          </div>

          <h3 style={{ fontSize: 16, margin: "0 0 7px" }}>
            {categories.length === 0
              ? "No categories yet"
              : "No matching categories"}
          </h3>

          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary, #64748b)",
              maxWidth: 350,
              lineHeight: 1.6,
              margin: "0 auto 18px",
            }}
          >
            {categories.length === 0
              ? "Create your first category to start organising your product catalogue."
              : "Try another search term or change your filters."}
          </p>

          {categories.length === 0 ? (
            <button
              className="md-button md-primary"
              onClick={openCreateModal}
            >
              ＋ Create first category
            </button>
          ) : (
            <button
              className="md-button md-secondary"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div
          className="md-category-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          {filteredCategories.map((category) => (
            <div
              className="md-card md-category-card"
              key={category.id}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 45,
                    height: 45,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 11,
                    background: `${category.color}18`,
                    color: category.color,
                    fontSize: 21,
                    fontWeight: 750,
                  }}
                >
                  ▦
                </div>

                <span
                  style={{
                    borderRadius: 20,
                    padding: "5px 9px",
                    fontSize: 10,
                    fontWeight: 750,
                    background: category.is_active
                      ? "#ecfdf5"
                      : "#f1f5f9",
                    color: category.is_active
                      ? "#047857"
                      : "#64748b",
                  }}
                >
                  {category.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 750,
                  margin: "15px 0 6px",
                  overflowWrap: "anywhere",
                }}
              >
                {category.name}
              </h3>

              <p
                style={{
                  minHeight: 38,
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: "var(--text-secondary, #64748b)",
                  margin: "0 0 15px",
                }}
              >
                {category.description || "No description provided."}
              </p>

              <div
                style={{
                  padding: "11px 0",
                  borderTop: "1px solid var(--border-color, #e2e8f0)",
                  borderBottom: "1px solid var(--border-color, #e2e8f0)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary, #64748b)",
                  }}
                >
                  Products
                </span>

                <strong style={{ fontSize: 14 }}>
                  {category.product_count}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 7,
                  marginTop: 13,
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="md-action"
                  onClick={() => setSelectedCategory(category)}
                >
                  View
                </button>

                <button
                  className="md-action"
                  onClick={() => openEditModal(category)}
                >
                  Edit
                </button>

                <button
                  className="md-action"
                  onClick={() => toggleStatus(category)}
                >
                  {category.is_active ? "Disable" : "Enable"}
                </button>

                <button
                  className="md-action"
                  onClick={() => deleteCategory(category)}
                  style={{ color: "#dc2626" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div
          className="md-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="md-modal">
            <div className="md-modal-header">
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 750,
                  }}
                >
                  {editingId ? "Edit category" : "Create category"}
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: 12,
                    color: "var(--text-secondary, #64748b)",
                  }}
                >
                  Organise products in your business.
                </p>
              </div>

              <button
                onClick={closeModal}
                style={{
                  border: 0,
                  background: "var(--hover-bg, #f1f5f9)",
                  color: "var(--text-primary, #0f172a)",
                  borderRadius: 8,
                  width: 33,
                  height: 33,
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveCategory}>
              <div className="md-modal-body">
                {error && (
                  <div
                    style={{
                      padding: 11,
                      borderRadius: 9,
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#b91c1c",
                      fontSize: 12,
                      marginBottom: 16,
                    }}
                  >
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: 17 }}>
                  <label style={labelStyle}>
                    Category name *
                  </label>

                  <input
                    value={form.name}
                    onChange={(e) =>
                      updateField("name", e.target.value)
                    }
                    placeholder="e.g. Beverages"
                    style={inputStyle}
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: 17 }}>
                  <label style={labelStyle}>
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      updateField("description", e.target.value)
                    }
                    placeholder="Describe the products in this category..."
                    rows={3}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>
                    Category colour
                  </label>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                      alignItems: "center",
                      padding: "7px 3px",
                    }}
                  >
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateField("color", color)}
                        className={`md-color ${
                          form.color === color ? "selected" : ""
                        }`}
                        style={{ background: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid var(--border-color, #e2e8f0)",
                    borderRadius: 10,
                    padding: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13 }}>
                      Category status
                    </strong>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 11,
                        color: "var(--text-secondary, #64748b)",
                      }}
                    >
                      Inactive categories should not be available
                      for new product assignments.
                    </p>
                  </div>

                  <select
                    value={form.is_active ? "active" : "inactive"}
                    onChange={(e) =>
                      updateField(
                        "is_active",
                        e.target.value === "active"
                      )
                    }
                    style={{
                      ...inputStyle,
                      width: 115,
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* LIVE PREVIEW */}
                <div
                  style={{
                    marginTop: 17,
                    padding: 14,
                    borderRadius: 10,
                    background: "var(--hover-bg, #f8fafc)",
                    border: "1px solid var(--border-color, #e2e8f0)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 750,
                      color: "var(--text-secondary, #64748b)",
                      marginBottom: 10,
                      textTransform: "uppercase",
                      letterSpacing: ".5px",
                    }}
                  >
                    Preview
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: `${form.color}18`,
                        color: form.color,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 18,
                      }}
                    >
                      ▦
                    </div>

                    <div>
                      <strong style={{ fontSize: 13 }}>
                        {form.name || "Category name"}
                      </strong>

                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-secondary, #64748b)",
                          marginTop: 3,
                        }}
                      >
                        {form.description || "Category description"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md-modal-footer">
                <button
                  type="button"
                  className="md-button md-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="md-button md-primary"
                >
                  {editingId ? "Save changes" : "Create category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY DETAILS */}
      {selectedCategory && (
        <div
          className="md-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCategory(null);
            }
          }}
        >
          <div className="md-modal" style={{ maxWidth: 440 }}>
            <div className="md-modal-header">
              <h2 style={{ margin: 0, fontSize: 16 }}>
                Category details
              </h2>

              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  border: 0,
                  background: "var(--hover-bg, #f1f5f9)",
                  color: "var(--text-primary, #0f172a)",
                  borderRadius: 8,
                  width: 33,
                  height: 33,
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>

            <div className="md-modal-body">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 13,
                    background: `${selectedCategory.color}18`,
                    color: selectedCategory.color,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 24,
                  }}
                >
                  ▦
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>
                    {selectedCategory.name}
                  </h3>

                  <span
                    style={{
                      fontSize: 11,
                      color: selectedCategory.is_active
                        ? "#059669"
                        : "#64748b",
                    }}
                  >
                    {selectedCategory.is_active
                      ? "Active category"
                      : "Inactive category"}
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: 13,
                  background: "var(--hover-bg, #f8fafc)",
                  borderRadius: 9,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary, #64748b)",
                    marginBottom: 5,
                  }}
                >
                  Description
                </div>

                <div style={{ fontSize: 13 }}>
                  {selectedCategory.description || "No description provided."}
                </div>
              </div>

              <div
                style={{
                  padding: 13,
                  background: "var(--hover-bg, #f8fafc)",
                  borderRadius: 9,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary, #64748b)",
                    marginBottom: 5,
                  }}
                >
                  Products assigned
                </div>

                <strong style={{ fontSize: 20 }}>
                  {selectedCategory.product_count}
                </strong>
              </div>
            </div>

            <div className="md-modal-footer">
              <button
                className="md-button md-secondary"
                onClick={() => setSelectedCategory(null)}
              >
                Close
              </button>

              <button
                className="md-button md-primary"
                onClick={() => {
                  const category = selectedCategory;
                  setSelectedCategory(null);
                  openEditModal(category);
                }}
              >
                Edit category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
