import { useMemo, useState } from "react";

const EMPTY_FORM = {
  name: "",
  sku: "",
  barcode: "",
  category: "",
  description: "",
  image: "",
  buying_price: "",
  price: "",
  unit: "piece",
  allow_portion_sales: false,
  portions_per_unit: "",
  portion_price: "",
  is_active: true,
};

const money = (value) =>
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [portionFilter, setPortionFilter] = useState("all");
  const [profitFilter, setProfitFilter] = useState("all");

  const categories = useMemo(() => {
    return [
      ...new Set(
        products
          .map((product) => product.category?.trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((product) =>
        [
          product.name,
          product.sku,
          product.barcode,
          product.category,
          product.description,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter(
        (product) => product.category === categoryFilter
      );
    }

    if (statusFilter === "active") {
      result = result.filter((product) => product.is_active);
    }

    if (statusFilter === "inactive") {
      result = result.filter((product) => !product.is_active);
    }

    if (portionFilter === "enabled") {
      result = result.filter((product) => product.allow_portion_sales);
    }

    if (portionFilter === "disabled") {
      result = result.filter((product) => !product.allow_portion_sales);
    }

    if (profitFilter === "profitable") {
      result = result.filter(
        (product) =>
          Number(product.price) > Number(product.buying_price)
      );
    }

    if (profitFilter === "loss") {
      result = result.filter(
        (product) =>
          Number(product.price) <= Number(product.buying_price)
      );
    }

    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;

      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;

      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;

      case "profit-high":
        result.sort(
          (a, b) =>
            b.price -
            b.buying_price -
            (a.price - a.buying_price)
        );
        break;

      case "oldest":
        result.sort((a, b) => a.id - b.id);
        break;

      default:
        result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [
    products,
    search,
    categoryFilter,
    statusFilter,
    sortBy,
    portionFilter,
    profitFilter,
  ]);

  const activeCount = products.filter((p) => p.is_active).length;
  const inactiveCount = products.length - activeCount;
  const portionCount = products.filter(
    (p) => p.allow_portion_sales
  ).length;

  const averageProfit =
    products.length > 0
      ? products.reduce(
          (total, product) =>
            total +
            (Number(product.price) -
              Number(product.buying_price)),
          0
        ) / products.length
      : 0;

  const openCreateModal = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setImagePreview("");
    setError("");
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setForm({
      ...product,
      buying_price: String(product.buying_price),
      price: String(product.price),
      portions_per_unit: String(
        product.portions_per_unit || ""
      ),
      portion_price: String(product.portion_price || ""),
    });

    setEditingId(product.id);
    setImagePreview(product.image || "");
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setImagePreview("");
    setError("");
  };

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must not exceed 5MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(reader.result);
      updateField("image", reader.result);
      setError("");
    };

    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Product name is required.";
    }

    if (!form.category.trim()) {
      return "Please enter a product category.";
    }

    if (
      form.buying_price === "" ||
      !Number.isFinite(Number(form.buying_price)) ||
      Number(form.buying_price) < 0
    ) {
      return "Enter a valid buying price.";
    }

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      return "Enter a valid selling price.";
    }

    if (
      form.allow_portion_sales &&
      (!Number.isFinite(Number(form.portions_per_unit)) ||
        Number(form.portions_per_unit) <= 0)
    ) {
      return "Enter a valid number of portions per unit.";
    }

    if (
      form.allow_portion_sales &&
      (!Number.isFinite(Number(form.portion_price)) ||
        Number(form.portion_price) <= 0)
    ) {
      return "Enter a valid portion selling price.";
    }

    const duplicateSku = products.some(
      (product) =>
        product.sku?.trim().toLowerCase() ===
          form.sku.trim().toLowerCase() &&
        form.sku.trim() &&
        product.id !== editingId
    );

    if (duplicateSku) {
      return "This SKU is already assigned to another product.";
    }

    const duplicateBarcode = products.some(
      (product) =>
        product.barcode?.trim() === form.barcode.trim() &&
        form.barcode.trim() &&
        product.id !== editingId
    );

    if (duplicateBarcode) {
      return "This barcode is already assigned to another product.";
    }

    return "";
  };

  const saveProduct = (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const productData = {
      ...form,
      id: editingId || Date.now(),
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      buying_price: Number(form.buying_price),
      price: Number(form.price),
      portions_per_unit: form.allow_portion_sales
        ? Number(form.portions_per_unit)
        : 0,
      portion_price: form.allow_portion_sales
        ? Number(form.portion_price)
        : 0,
      is_active: Boolean(form.is_active),
    };

    if (editingId) {
      setProducts((previous) =>
        previous.map((product) =>
          product.id === editingId ? productData : product
        )
      );
    } else {
      setProducts((previous) => [
        productData,
        ...previous,
      ]);
    }

    closeModal();
  };

  const toggleStatus = (product) => {
    setProducts((previous) =>
      previous.map((item) =>
        item.id === product.id
          ? { ...item, is_active: !item.is_active }
          : item
      )
    );
  };

  const removeProduct = (product) => {
    const confirmed = window.confirm(
      `Remove "${product.name}" from this preview catalogue?`
    );

    if (!confirmed) return;

    setProducts((previous) =>
      previous.filter((item) => item.id !== product.id)
    );
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setSortBy("newest");
    setPortionFilter("all");
    setProfitFilter("all");
  };

  const hasFilters =
    search ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    portionFilter !== "all" ||
    profitFilter !== "all";

  const inputStyle = {
    width: "100%",
    padding: "11px 13px",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "9px",
    background: "var(--input-bg, var(--card-bg, #fff))",
    color: "var(--text-primary, #0f172a)",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 650,
    marginBottom: "7px",
    color: "var(--text-secondary, #475569)",
  };

  const profit = Number(form.price || 0) -
    Number(form.buying_price || 0);

  const margin =
    Number(form.price || 0) > 0
      ? (profit / Number(form.price)) * 100
      : 0;

  return (
    <div className="md-products">
      <style>{`
        .md-products {
          color: var(--text-primary, #0f172a);
          width: 100%;
          min-width: 0;
        }

        .md-products * {
          box-sizing: border-box;
        }

        .md-products button,
        .md-products input,
        .md-products select,
        .md-products textarea {
          font: inherit;
        }

        .md-products button {
          cursor: pointer;
        }

        .md-products .md-card {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 13px;
        }

        .md-products .md-primary {
          background: var(--primary-color, #2563eb);
          color: white;
          border: 1px solid var(--primary-color, #2563eb);
        }

        .md-products .md-secondary {
          background: var(--card-bg, #fff);
          color: var(--text-primary, #0f172a);
          border: 1px solid var(--border-color, #e2e8f0);
        }

        .md-products .md-button {
          padding: 10px 15px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 650;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: .18s ease;
        }

        .md-products .md-button:hover {
          filter: brightness(.96);
          transform: translateY(-1px);
        }

        .md-products .md-stat {
          padding: 17px;
          min-width: 0;
        }

        .md-products .md-stat-label {
          color: var(--text-secondary, #64748b);
          font-size: 12px;
          font-weight: 600;
        }

        .md-products .md-stat-value {
          font-size: 25px;
          font-weight: 750;
          margin-top: 9px;
          letter-spacing: -1px;
        }

        .md-products .md-stat-icon {
          width: 37px;
          height: 37px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          font-size: 17px;
        }

        .md-products .md-field {
          margin-bottom: 17px;
          min-width: 0;
        }

        .md-products .md-field input:focus,
        .md-products .md-field select:focus,
        .md-products .md-field textarea:focus {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(37,99,235,.09);
        }

        .md-products .md-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .md-products table {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px;
        }

        .md-products th {
          text-align: left;
          padding: 13px 16px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .45px;
          color: var(--text-secondary, #64748b);
          background: var(--table-header-bg, #f8fafc);
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          white-space: nowrap;
        }

        .md-products td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          font-size: 13px;
          vertical-align: middle;
        }

        .md-products tbody tr:last-child td {
          border-bottom: none;
        }

        .md-products tbody tr:hover {
          background: var(--hover-bg, #f8fafc);
        }

        .md-products .md-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 30px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .md-products .md-action {
          border: 1px solid var(--border-color, #e2e8f0);
          background: var(--card-bg, #fff);
          color: var(--text-primary, #0f172a);
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 600;
        }

        .md-products .md-action:hover {
          background: var(--hover-bg, #f1f5f9);
        }

        .md-products .md-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(15,23,42,.58);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 18px;
          overflow-y: auto;
        }

        .md-products .md-modal {
          width: 100%;
          max-width: 760px;
          max-height: 94vh;
          overflow-y: auto;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 16px;
          box-shadow: 0 25px 80px rgba(0,0,0,.22);
        }

        .md-products .md-modal-header {
          padding: 20px 23px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          position: sticky;
          top: 0;
          background: var(--card-bg, #fff);
          z-index: 2;
        }

        .md-products .md-modal-body {
          padding: 22px 23px;
        }

        .md-products .md-modal-footer {
          padding: 16px 23px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          position: sticky;
          bottom: 0;
          background: var(--card-bg, #fff);
        }

        .md-products .md-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .md-products .md-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 15px;
        }

        .md-products .md-empty {
          padding: 55px 20px;
          text-align: center;
        }

        .md-products .md-empty-icon {
          width: 65px;
          height: 65px;
          border-radius: 18px;
          background: var(--hover-bg, #f1f5f9);
          display: grid;
          place-items: center;
          margin: 0 auto 16px;
          font-size: 27px;
        }

        .md-products .md-upload {
          width: 100%;
          min-height: 125px;
          border: 1.5px dashed var(--border-color, #cbd5e1);
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 7px;
          cursor: pointer;
          color: var(--text-secondary, #64748b);
          background: var(--hover-bg, #f8fafc);
          overflow: hidden;
        }

        .md-products .md-upload img {
          max-width: 100%;
          max-height: 145px;
          object-fit: contain;
        }

        .md-products .md-alert {
          padding: 11px 13px;
          border-radius: 9px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          font-size: 12px;
          margin-bottom: 16px;
        }

        .md-products .md-preview-banner {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 12px 14px;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          background: #eff6ff;
          color: #1e40af;
          font-size: 12px;
          line-height: 1.5;
        }

        @media (max-width: 850px) {
          .md-products .md-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .md-products .md-toolbar {
            flex-wrap: wrap;
          }
        }

        @media (max-width: 600px) {
          .md-products .md-grid-2,
          .md-products .md-grid-3 {
            grid-template-columns: 1fr;
          }

          .md-products .md-modal-body {
            padding: 17px;
          }

          .md-products .md-modal-header,
          .md-products .md-modal-footer {
            padding: 15px 17px;
          }

          .md-products .md-overlay {
            padding: 8px;
            align-items: flex-start;
          }

          .md-products .md-modal {
            max-height: 98vh;
          }

          .md-products .md-page-heading {
            align-items: flex-start !important;
            flex-direction: column;
          }

          .md-products .md-page-heading button {
            width: 100%;
          }
        }
      `}</style>

      {/* PAGE HEADER */}
      <div
        className="md-page-heading"
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
            Products
          </h1>

          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary, #64748b)",
              margin: "6px 0 0",
            }}
          >
            Manage your business product catalogue, pricing and product details.
          </p>
        </div>

        <button
          className="md-button md-primary"
          onClick={openCreateModal}
        >
          <span style={{ fontSize: 17 }}>＋</span>
          Add product
        </button>
      </div>

      {/* PREVIEW NOTICE */}
      <div className="md-preview-banner" style={{ marginBottom: 19 }}>
        <span style={{ fontSize: 17 }}>ⓘ</span>
        <div>
          <strong>Frontend preview mode.</strong>{" "}
          Products added here are temporary and exist only in this page
          session. Database saving and business-specific product storage
          will be connected during backend integration.
        </div>
      </div>

      {/* STATISTICS */}
      <div
        className="md-stats"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 13,
          marginBottom: 21,
        }}
      >
        <div className="md-card md-stat">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span className="md-stat-label">Total products</span>
            <span
              className="md-stat-icon"
              style={{ background: "#eff6ff", color: "#2563eb" }}
            >
              ◈
            </span>
          </div>
          <div className="md-stat-value">{products.length}</div>
        </div>

        <div className="md-card md-stat">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span className="md-stat-label">Active products</span>
            <span
              className="md-stat-icon"
              style={{ background: "#ecfdf5", color: "#059669" }}
            >
              ✓
            </span>
          </div>
          <div className="md-stat-value">{activeCount}</div>
        </div>

        <div className="md-card md-stat">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span className="md-stat-label">Portion selling</span>
            <span
              className="md-stat-icon"
              style={{ background: "#f5f3ff", color: "#7c3aed" }}
            >
              ◫
            </span>
          </div>
          <div className="md-stat-value">{portionCount}</div>
        </div>

        <div className="md-card md-stat">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span className="md-stat-label">Average gross profit</span>
            <span
              className="md-stat-icon"
              style={{ background: "#fff7ed", color: "#ea580c" }}
            >
              ↗
            </span>
          </div>
          <div className="md-stat-value" style={{ fontSize: 21 }}>
            KSh {money(averageProfit)}
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div
        className="md-card"
        style={{ padding: 15, marginBottom: 17 }}
      >
        <div
          className="md-toolbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: 10,
                color: "var(--text-secondary, #64748b)",
              }}
            >
              ⌕
            </span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, SKU, barcode..."
              style={{
                ...inputStyle,
                paddingLeft: 35,
              }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ ...inputStyle, width: "auto", minWidth: 135 }}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ ...inputStyle, width: "auto", minWidth: 140 }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
            <option value="price-high">Price: high to low</option>
            <option value="price-low">Price: low to high</option>
            <option value="profit-high">Highest gross profit</option>
          </select>

          <button
            className="md-button md-secondary"
            onClick={() => setShowFilters((previous) => !previous)}
          >
            ⚙ Filters
          </button>
        </div>

        {showFilters && (
          <div
            className="md-grid-3"
            style={{
              marginTop: 15,
              paddingTop: 15,
              borderTop: "1px solid var(--border-color, #e2e8f0)",
            }}
          >
            <div>
              <label style={labelStyle}>Product status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={inputStyle}
              >
                <option value="all">All products</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Portion selling</label>
              <select
                value={portionFilter}
                onChange={(e) => setPortionFilter(e.target.value)}
                style={inputStyle}
              >
                <option value="all">All products</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Profitability</label>
              <select
                value={profitFilter}
                onChange={(e) => setProfitFilter(e.target.value)}
                style={inputStyle}
              >
                <option value="all">All products</option>
                <option value="profitable">Positive gross profit</option>
                <option value="loss">No gross profit / loss</option>
              </select>
            </div>
          </div>
        )}

        {hasFilters && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
              fontSize: 12,
              color: "var(--text-secondary, #64748b)",
            }}
          >
            <span>
              Showing {filteredProducts.length} of {products.length} products
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

      {/* PRODUCT TABLE */}
      <div className="md-card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid var(--border-color, #e2e8f0)",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 750 }}>
              Product catalogue
            </h3>
            <p
              style={{
                margin: "5px 0 0",
                fontSize: 12,
                color: "var(--text-secondary, #64748b)",
              }}
            >
              {filteredProducts.length} products displayed
            </p>
          </div>

          <span
            style={{
              fontSize: 11,
              color: "var(--text-secondary, #64748b)",
            }}
          >
            {inactiveCount} inactive
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="md-empty">
            <div className="md-empty-icon">◈</div>

            <h3 style={{ margin: "0 0 7px", fontSize: 16 }}>
              {products.length === 0
                ? "Your catalogue is empty"
                : "No matching products"}
            </h3>

            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary, #64748b)",
                maxWidth: 360,
                lineHeight: 1.6,
                margin: "0 auto 18px",
              }}
            >
              {products.length === 0
                ? "Start building your catalogue by adding your first product. Stock quantities and branch inventory will be managed separately."
                : "Try changing your search or filters to find the products you are looking for."}
            </p>

            {products.length === 0 ? (
              <button
                className="md-button md-primary"
                onClick={openCreateModal}
              >
                ＋ Add your first product
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
          <div className="md-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Buying price</th>
                  <th>Selling price</th>
                  <th>Gross profit</th>
                  <th>Unit</th>
                  <th>Portions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const grossProfit =
                    Number(product.price) -
                    Number(product.buying_price);

                  return (
                    <tr key={product.id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            minWidth: 180,
                          }}
                        >
                          <div
                            style={{
                              width: 43,
                              height: 43,
                              flexShrink: 0,
                              borderRadius: 9,
                              background: "var(--hover-bg, #f1f5f9)",
                              overflow: "hidden",
                              display: "grid",
                              placeItems: "center",
                              color: "var(--text-secondary, #64748b)",
                            }}
                          >
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: 20 }}>◈</span>
                            )}
                          </div>

                          <div>
                            <div style={{ fontWeight: 700 }}>
                              {product.name}
                            </div>

                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--text-secondary, #64748b)",
                                marginTop: 4,
                              }}
                            >
                              {product.sku || "No SKU"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>{product.category || "—"}</td>

                      <td>KSh {money(product.buying_price)}</td>

                      <td style={{ fontWeight: 650 }}>
                        KSh {money(product.price)}
                      </td>

                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              grossProfit > 0
                                ? "#059669"
                                : grossProfit < 0
                                  ? "#dc2626"
                                  : "var(--text-secondary, #64748b)",
                          }}
                        >
                          KSh {money(grossProfit)}
                        </span>
                      </td>

                      <td>{product.unit}</td>

                      <td>
                        {product.allow_portion_sales ? (
                          <span
                            className="md-badge"
                            style={{
                              background: "#f5f3ff",
                              color: "#7c3aed",
                            }}
                          >
                            {product.portions_per_unit} portions
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>

                      <td>
                        <span
                          className="md-badge"
                          style={{
                            background: product.is_active
                              ? "#ecfdf5"
                              : "#f1f5f9",
                            color: product.is_active
                              ? "#047857"
                              : "#64748b",
                          }}
                        >
                          <span>
                            {product.is_active ? "●" : "○"}
                          </span>
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="md-action"
                            onClick={() => openEditModal(product)}
                          >
                            Edit
                          </button>

                          <button
                            className="md-action"
                            onClick={() => toggleStatus(product)}
                            title={
                              product.is_active
                                ? "Deactivate product"
                                : "Activate product"
                            }
                          >
                            {product.is_active ? "Disable" : "Enable"}
                          </button>

                          <button
                            className="md-action"
                            onClick={() => removeProduct(product)}
                            style={{ color: "#dc2626" }}
                            title="Remove product"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
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
                  {editingId ? "Edit product" : "Add new product"}
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "var(--text-secondary, #64748b)",
                    fontSize: 12,
                  }}
                >
                  Enter the product catalogue information.
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

            <form onSubmit={saveProduct}>
              <div className="md-modal-body">
                {error && (
                  <div className="md-alert">
                    {error}
                  </div>
                )}

                {/* BASIC INFORMATION */}
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 750,
                    margin: "0 0 15px",
                  }}
                >
                  Basic information
                </h3>

                <div className="md-grid-2">
                  <div className="md-field">
                    <label style={labelStyle}>
                      Product name *
                    </label>

                    <input
                      value={form.name}
                      onChange={(e) =>
                        updateField("name", e.target.value)
                      }
                      placeholder="e.g. Tusker Lager"
                      style={inputStyle}
                      autoFocus
                    />
                  </div>

                  <div className="md-field">
                    <label style={labelStyle}>
                      Category *
                    </label>

                    <input
                      value={form.category}
                      onChange={(e) =>
                        updateField("category", e.target.value)
                      }
                      placeholder="e.g. Beverages"
                      list="md-product-categories"
                      style={inputStyle}
                    />

                    <datalist id="md-product-categories">
                      {categories.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                  </div>

                  <div className="md-field">
                    <label style={labelStyle}>
                      SKU
                    </label>

                    <input
                      value={form.sku}
                      onChange={(e) =>
                        updateField("sku", e.target.value)
                      }
                      placeholder="e.g. BEV-001"
                      style={inputStyle}
                    />
                  </div>

                  <div className="md-field">
                    <label style={labelStyle}>
                      Barcode
                    </label>

                    <input
                      value={form.barcode}
                      onChange={(e) =>
                        updateField("barcode", e.target.value)
                      }
                      placeholder="Enter or scan barcode"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="md-field">
                  <label style={labelStyle}>
                    Product description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      updateField("description", e.target.value)
                    }
                    placeholder="Describe this product..."
                    rows={3}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* IMAGE */}
                <div className="md-field">
                  <label style={labelStyle}>
                    Product image
                  </label>

                  <label className="md-upload">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Product preview"
                      />
                    ) : (
                      <>
                        <span style={{ fontSize: 25 }}>▧</span>
                        <strong style={{ fontSize: 12 }}>
                          Click to upload an image
                        </strong>
                        <span style={{ fontSize: 11 }}>
                          PNG, JPG or WEBP · Maximum 5MB
                        </span>
                      </>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />
                  </label>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview("");
                        updateField("image", "");
                      }}
                      style={{
                        marginTop: 7,
                        background: "transparent",
                        border: 0,
                        color: "#dc2626",
                        fontSize: 12,
                        fontWeight: 650,
                      }}
                    >
                      Remove image
                    </button>
                  )}
                </div>

                {/* PRICING */}
                <div
                  style={{
                    borderTop: "1px solid var(--border-color, #e2e8f0)",
                    paddingTop: 19,
                    marginTop: 20,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 13,
                      fontWeight: 750,
                      margin: "0 0 15px",
                    }}
                  >
                    Pricing information
                  </h3>

                  <div className="md-grid-3">
                    <div className="md-field">
                      <label style={labelStyle}>
                        Buying price (KSh) *
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.buying_price}
                        onChange={(e) =>
                          updateField(
                            "buying_price",
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                        style={inputStyle}
                      />
                    </div>

                    <div className="md-field">
                      <label style={labelStyle}>
                        Selling price (KSh) *
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={(e) =>
                          updateField("price", e.target.value)
                        }
                        placeholder="0.00"
                        style={inputStyle}
                      />
                    </div>

                    <div className="md-field">
                      <label style={labelStyle}>
                        Selling unit *
                      </label>

                      <select
                        value={form.unit}
                        onChange={(e) =>
                          updateField("unit", e.target.value)
                        }
                        style={inputStyle}
                      >
                        <option value="piece">Piece</option>
                        <option value="bottle">Bottle</option>
                        <option value="carton">Carton</option>
                        <option value="crate">Crate</option>
                        <option value="packet">Packet</option>
                        <option value="box">Box</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="g">Gram (g)</option>
                        <option value="litre">Litre</option>
                        <option value="ml">Millilitre (ml)</option>
                        <option value="metre">Metre</option>
                        <option value="dozen">Dozen</option>
                        <option value="pair">Pair</option>
                        <option value="service">Service</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 13,
                      borderRadius: 10,
                      background: "var(--hover-bg, #f8fafc)",
                      border: "1px solid var(--border-color, #e2e8f0)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-secondary, #64748b)",
                        }}
                      >
                        Gross profit per unit
                      </div>

                      <strong
                        style={{
                          display: "block",
                          marginTop: 5,
                          fontSize: 17,
                          color:
                            profit > 0
                              ? "#059669"
                              : profit < 0
                                ? "#dc2626"
                                : "var(--text-primary, #0f172a)",
                        }}
                      >
                        KSh {money(profit)}
                      </strong>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-secondary, #64748b)",
                        }}
                      >
                        Gross profit margin
                      </div>

                      <strong
                        style={{
                          display: "block",
                          marginTop: 5,
                          fontSize: 17,
                        }}
                      >
                        {margin.toFixed(2)}%
                      </strong>
                    </div>
                  </div>
                </div>

                {/* PORTION SELLING */}
                <div
                  style={{
                    borderTop: "1px solid var(--border-color, #e2e8f0)",
                    paddingTop: 19,
                    marginTop: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 13,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: 13,
                          fontWeight: 750,
                          margin: 0,
                        }}
                      >
                        Portion selling
                      </h3>

                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--text-secondary, #64748b)",
                          margin: "5px 0 0",
                        }}
                      >
                        Allow this product to be sold in smaller portions.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          "allow_portion_sales",
                          !form.allow_portion_sales
                        )
                      }
                      style={{
                        border: 0,
                        borderRadius: 20,
                        padding: "7px 12px",
                        background: form.allow_portion_sales
                          ? "#dcfce7"
                          : "var(--hover-bg, #f1f5f9)",
                        color: form.allow_portion_sales
                          ? "#15803d"
                          : "var(--text-secondary, #64748b)",
                        fontSize: 11,
                        fontWeight: 750,
                      }}
                    >
                      {form.allow_portion_sales ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  {form.allow_portion_sales && (
                    <>
                      <div className="md-grid-2">
                        <div className="md-field">
                          <label style={labelStyle}>
                            Portions per full unit *
                          </label>

                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={form.portions_per_unit}
                            onChange={(e) =>
                              updateField(
                                "portions_per_unit",
                                e.target.value
                              )
                            }
                            placeholder="e.g. 4"
                            style={inputStyle}
                          />
                        </div>

                        <div className="md-field">
                          <label style={labelStyle}>
                            Selling price per portion (KSh) *
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.portion_price}
                            onChange={(e) =>
                              updateField(
                                "portion_price",
                                e.target.value
                              )
                            }
                            placeholder="e.g. 90"
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      {Number(form.portions_per_unit) > 0 &&
                        Number(form.portion_price) > 0 && (
                          <div
                            style={{
                              background: "#f5f3ff",
                              color: "#6d28d9",
                              borderRadius: 9,
                              padding: 12,
                              fontSize: 12,
                              lineHeight: 1.6,
                            }}
                          >
                            <strong>Portion pricing preview</strong>
                            <br />
                            {form.portions_per_unit} portions × KSh{" "}
                            {money(form.portion_price)} ={" "}
                            <strong>
                              KSh{" "}
                              {money(
                                Number(form.portions_per_unit) *
                                  Number(form.portion_price)
                              )}
                            </strong>{" "}
                            total portion revenue per full unit.
                          </div>
                        )}
                    </>
                  )}
                </div>

                {/* STATUS */}
                <div
                  style={{
                    borderTop: "1px solid var(--border-color, #e2e8f0)",
                    paddingTop: 18,
                    marginTop: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13 }}>
                      Product status
                    </strong>

                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--text-secondary, #64748b)",
                        margin: "4px 0 0",
                      }}
                    >
                      Inactive products can be hidden from selling interfaces.
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
                      width: 130,
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
                  {editingId ? "Save changes" : "Create product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
