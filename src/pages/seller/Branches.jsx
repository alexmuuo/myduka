import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/api";

const styles = {
  page: { padding: 24, maxWidth: 1500, margin: "0 auto", color: "#212529" },
  title: { marginBottom: 6, fontWeight: 700 },
  subtitle: { color: "#6c757d", marginBottom: 24 },
  card: { background: "#fff", border: "1px solid #dee2e6", borderRadius: 10, padding: 20, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.04)" },
  label: { display: "block", fontWeight: 600, marginBottom: 8 },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #ced4da", borderRadius: 6, boxSizing: "border-box", background: "#fff" },
  button: { padding: "9px 14px", border: 0, borderRadius: 6, cursor: "pointer", fontWeight: 600 },
  primary: { background: "#4f46e5", color: "#fff" },
  secondary: { background: "#e9ecef", color: "#212529" },
  danger: { background: "#dc3545", color: "#fff" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 700 },
  th: { padding: 12, textAlign: "left", background: "#f8f9fa", borderBottom: "1px solid #dee2e6", whiteSpace: "nowrap" },
  td: { padding: 12, borderBottom: "1px solid #e9ecef", verticalAlign: "middle" },
  error: { background: "#f8d7da", color: "#842029", border: "1px solid #f5c2c7", padding: 12, borderRadius: 6, marginBottom: 16 },
  success: { background: "#d1e7dd", color: "#0f5132", border: "1px solid #badbcc", padding: 12, borderRadius: 6, marginBottom: 16 },
  tabs: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16, marginBottom: 20 },
  info: { background: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: 8, padding: 15 },
  summary: { background: "#e8f5e9", border: "1px solid #badbcc", borderRadius: 8, padding: 16, marginTop: 18 },
  badge: { display: "inline-block", padding: "5px 10px", borderRadius: 20, background: "#d1e7dd", color: "#0f5132", fontSize: 12, fontWeight: 700 },
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatQuantity = (value) =>
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

const quantityPattern = /^(\d+(\.\d{1,3})?|\.\d{1,3})$/;

function getErrorMessage(error) {
  const message = error?.response?.data?.message || error?.response?.data?.error;
  if (message) return message;
  if (error?.response) return `Server returned HTTP ${error.response.status}${error.response.statusText ? ` (${error.response.statusText})` : ""}.`;
  if (error?.request) return "No response received from the server. Check the API URL, routing and network connection.";
  return error?.message || "Something went wrong. Please try again.";
}

const emptyTransferItem = () => ({
  product_id: "",
  destination_product_id: "",
  quantity: "",
});

const getList = (response, key) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  return [];
};

function Branches() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [activeTab, setActiveTab] = useState("stock");

  const [stock, setStock] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingSection, setLoadingSection] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [stockEdits, setStockEdits] = useState({});
  const [savingProductId, setSavingProductId] = useState(null);
  const [assigningCashierId, setAssigningCashierId] = useState(null);

  // Interbranch transfer state: source and destination catalogues are separate.
  const [transferSourceId, setTransferSourceId] = useState("");
  const [transferDestinationId, setTransferDestinationId] = useState("");
  const [sourceProducts, setSourceProducts] = useState([]);
  const [destinationProducts, setDestinationProducts] = useState([]);
  const [transferItems, setTransferItems] = useState([emptyTransferItem()]);
  const [transferNotes, setTransferNotes] = useState("");
  const [transferHistory, setTransferHistory] = useState([]);
  const [loadingSourceProducts, setLoadingSourceProducts] = useState(false);
  const [loadingDestinationProducts, setLoadingDestinationProducts] = useState(false);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const loadBranches = useCallback(async () => {
    setLoadingBranches(true);
    setError("");
    try {
      const response = await api.get("/admin/branches");
      const list = getList(response, "branches");
      setBranches(list);

      setSelectedBranchId((current) => {
        if (current && list.some((b) => String(b.id) === String(current))) return current;
        const first = list.find((b) => b.is_active !== false);
        return first ? String(first.id) : "";
      });

      setTransferSourceId((current) => {
        if (current && list.some((b) => String(b.id) === String(current) && b.is_active !== false)) return current;
        const first = list.find((b) => b.is_active !== false);
        return first ? String(first.id) : "";
      });

      setTransferDestinationId((current) => {
        if (current && list.some((b) => String(b.id) === String(current) && b.is_active !== false)) return current;
        const source = list.find((b) => b.is_active !== false);
        const destination = list.find((b) => b.is_active !== false && String(b.id) !== String(source?.id));
        return destination ? String(destination.id) : "";
      });
    } catch (err) {
      setError(`Unable to load branches: ${getErrorMessage(err)}`);
    } finally {
      setLoadingBranches(false);
    }
  }, []);

  const loadSection = useCallback(async () => {
    if (!selectedBranchId) {
      setStock([]);
      setCashiers([]);
      setSales([]);
      return;
    }
    if (activeTab === "transfers") return;

    setLoadingSection(true);
    setError("");
    setSuccess("");
    try {
      if (activeTab === "stock") {
        const response = await api.get(`/admin/branches/${selectedBranchId}/stock`);
        setStock(getList(response, "stock"));
        setStockEdits({});
      } else if (activeTab === "cashiers") {
        const response = await api.get(`/admin/branches/${selectedBranchId}/cashiers`);
        setCashiers(getList(response, "cashiers"));
      } else if (activeTab === "sales") {
        const response = await api.get(`/admin/branches/${selectedBranchId}/sales`);
        setSales(getList(response, "sales"));
      }
    } catch (err) {
      setError(`Unable to load ${activeTab}: ${getErrorMessage(err)}`);
    } finally {
      setLoadingSection(false);
    }
  }, [selectedBranchId, activeTab]);

  useEffect(() => { loadBranches(); }, [loadBranches]);
  useEffect(() => { loadSection(); }, [loadSection]);

  const saveStock = async (product) => {
    const productId = product.product_id ?? product.id;
    const raw = stockEdits[productId] !== undefined ? stockEdits[productId] : product.quantity ?? 0;
    const text = String(raw).trim();

    if (!quantityPattern.test(text) && text !== "0") {
      setError("Stock quantity must be zero or more, with up to 3 decimal places.");
      return;
    }

    setSavingProductId(productId);
    setError("");
    setSuccess("");
    try {
      if (!selectedBranchId || !productId) throw new Error("A branch and product must be selected.");
      const quantity = Number(text);
      if (!Number.isFinite(quantity) || quantity < 0) throw new Error("Enter a valid stock quantity.");
      await api.put(`/admin/branches/${selectedBranchId}/stock/${productId}`, { quantity });

      setStockEdits((previous) => {
        const next = { ...previous };
        delete next[productId];
        return next;
      });
      setSuccess(`Stock updated for ${product.name}.`);

      const response = await api.get(`/admin/branches/${selectedBranchId}/stock`);
      setStock(getList(response, "stock"));
    } catch (err) {
      setError(`Unable to update stock: ${getErrorMessage(err)}`);
    } finally {
      setSavingProductId(null);
    }
  };

  const assignCashier = async (cashierId, branchId) => {
    setAssigningCashierId(cashierId);
    setError("");
    setSuccess("");
    try {
      await api.put(`/admin/cashiers/${cashierId}/branch`, {
        branch_id: branchId ? Number(branchId) : null,
      });
      setSuccess("Cashier assignment updated.");
      await loadSection();
    } catch (err) {
      setError(`Unable to update cashier assignment: ${getErrorMessage(err)}`);
    } finally {
      setAssigningCashierId(null);
    }
  };

  const loadSourceProducts = useCallback(async () => {
    if (!transferSourceId) {
      setSourceProducts([]);
      return;
    }
    setLoadingSourceProducts(true);
    try {
      const response = await api.get(`/admin/branches/${transferSourceId}/stock`);
      setSourceProducts(getList(response, "stock"));
    } catch (err) {
      setSourceProducts([]);
      setError(`Unable to load source branch products: ${getErrorMessage(err)}`);
    } finally {
      setLoadingSourceProducts(false);
    }
  }, [transferSourceId]);

  const loadDestinationProducts = useCallback(async () => {
    if (!transferDestinationId) {
      setDestinationProducts([]);
      return;
    }
    setLoadingDestinationProducts(true);
    try {
      // This endpoint deliberately includes active products with zero branch stock.
      const response = await api.get(`/admin/branches/${transferDestinationId}/transfer-products`);
      setDestinationProducts(getList(response, "products"));
    } catch (err) {
      setDestinationProducts([]);
      setError(`Unable to load destination products: ${getErrorMessage(err)}`);
    } finally {
      setLoadingDestinationProducts(false);
    }
  }, [transferDestinationId]);

  const loadTransferHistory = useCallback(async () => {
    setLoadingTransfers(true);
    try {
      const response = await api.get("/admin/stock-transfers");
      setTransferHistory(getList(response, "transfers"));
    } catch (err) {
      setTransferHistory([]);
      setError(`Unable to load transfer history: ${getErrorMessage(err)}`);
    } finally {
      setLoadingTransfers(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "transfers") loadSourceProducts();
  }, [activeTab, loadSourceProducts]);

  useEffect(() => {
    if (activeTab === "transfers") loadDestinationProducts();
  }, [activeTab, loadDestinationProducts]);

  useEffect(() => {
    if (activeTab === "transfers") loadTransferHistory();
  }, [activeTab, loadTransferHistory]);

  const updateTransferItem = (index, field, value) => {
    setTransferItems((items) => items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addTransferItem = () => setTransferItems((items) => [...items, emptyTransferItem()]);

  const removeTransferItem = (index) => {
    setTransferItems((items) => items.length === 1 ? [emptyTransferItem()] : items.filter((_, i) => i !== index));
  };

  const activeBranches = branches.filter((branch) => branch.is_active !== false);
  const availableDestinationBranches = activeBranches.filter((branch) => String(branch.id) !== String(transferSourceId));
  const selectedSourceBranch = branches.find((branch) => String(branch.id) === String(transferSourceId));
  const selectedDestinationBranch = branches.find((branch) => String(branch.id) === String(transferDestinationId));

  const transferPreview = useMemo(() => transferItems.map((item) => {
    const source = sourceProducts.find((p) => String(p.product_id ?? p.id) === String(item.product_id));
    const destination = destinationProducts.find((p) => String(p.product_id ?? p.id) === String(item.destination_product_id));
    return {
      ...item,
      source,
      destination,
      quantityNumber: Number(item.quantity) || 0,
      available: Number(source?.quantity ?? source?.branch_stock ?? 0),
      destinationStock: Number(destination?.quantity ?? destination?.branch_stock ?? 0),
    };
  }), [transferItems, sourceProducts, destinationProducts]);

  const validPreviewCount = transferPreview.filter((item) => item.source && item.destination && item.quantityNumber > 0).length;

  const submitTransfer = async () => {
    setError("");
    setSuccess("");

    if (!transferSourceId || !transferDestinationId) {
      setError("Select both source and destination branches.");
      return;
    }
    if (String(transferSourceId) === String(transferDestinationId)) {
      setError("Source and destination branches must be different.");
      return;
    }
    if (!transferItems.length) {
      setError("Add at least one product to the transfer.");
      return;
    }

    const validatedItems = [];
    for (let index = 0; index < transferItems.length; index += 1) {
      const item = transferItems[index];
      if (!item.product_id || !item.destination_product_id) {
        setError(`Select both source and destination products for transfer item ${index + 1}.`);
        return;
      }

      const quantityText = String(item.quantity).trim();
      if (!quantityPattern.test(quantityText)) {
        setError(`Enter a valid quantity for item ${index + 1}, using up to 3 decimal places.`);
        return;
      }
      const quantity = Number(quantityText);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError(`Quantity for item ${index + 1} must be greater than zero.`);
        return;
      }

      const source = sourceProducts.find((p) => String(p.product_id ?? p.id) === String(item.product_id));
      const destination = destinationProducts.find((p) => String(p.product_id ?? p.id) === String(item.destination_product_id));
      if (!source) {
        setError(`The source product in item ${index + 1} is no longer available.`);
        return;
      }
      if (!destination) {
        setError(`The destination product in item ${index + 1} is no longer available.`);
        return;
      }

      const available = Number(source.quantity ?? source.branch_stock ?? 0);
      if (quantity > available) {
        setError(`Insufficient source stock for ${source.name}. Available: ${formatQuantity(available)}; requested: ${formatQuantity(quantity)}.`);
        return;
      }

      validatedItems.push({
        product_id: Number(item.product_id),
        destination_product_id: Number(item.destination_product_id),
        quantity: quantityText,
      });
    }

    // The current database constraint allows each source product only once
    // per transfer. Keep the form aligned with that constraint.
    const sourceProductIds = validatedItems.map((item) => item.product_id);
    if (new Set(sourceProductIds).size !== sourceProductIds.length) {
      setError("A source product can only appear once in a transfer. Combine its quantity into one line and choose one destination product.");
      return;
    }

    const confirmationLines = validatedItems.map((item, index) => {
      const source = sourceProducts.find((p) => String(p.product_id ?? p.id) === String(item.product_id));
      const destination = destinationProducts.find((p) => String(p.product_id ?? p.id) === String(item.destination_product_id));
      return `${index + 1}. ${source?.name || "Source product"} → ${destination?.name || "Destination product"}: ${formatQuantity(item.quantity)}`;
    });

    const confirmed = window.confirm(
      `Complete this stock transfer?\n\nFrom: ${selectedSourceBranch?.name}\nTo: ${selectedDestinationBranch?.name}\n\n${confirmationLines.join("\n")}\n\nStock will be updated immediately in both branches.`
    );
    if (!confirmed) return;

    setSubmittingTransfer(true);
    try {
      const response = await api.post("/admin/stock-transfers", {
        source_branch_id: Number(transferSourceId),
        destination_branch_id: Number(transferDestinationId),
        items: validatedItems,
        notes: transferNotes.trim() || null,
      });

      const transfer = response.data?.transfer || response.data;
      const reference = transfer?.reference || transfer?.transfer_number || transfer?.transfer_reference || "Transfer completed";

      setSuccess(`Stock transfer completed successfully. Reference: ${reference}`);
      setTransferItems([emptyTransferItem()]);
      setTransferNotes("");

      await Promise.all([loadSourceProducts(), loadDestinationProducts(), loadTransferHistory()]);
    } catch (err) {
      setError(`Unable to complete transfer: ${getErrorMessage(err)}`);
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const filteredStock = stock.filter((product) => {
    const search = stockSearch.trim().toLowerCase();
    if (!search) return true;
    return String(product.name || "").toLowerCase().includes(search) ||
      String(product.category || "").toLowerCase().includes(search);
  });

  const tabButton = (tab, label) => (
    <button
      key={tab}
      type="button"
      onClick={() => { setActiveTab(tab); setError(""); setSuccess(""); }}
      style={{ ...styles.button, ...(activeTab === tab ? styles.primary : styles.secondary) }}
    >
      {label}
    </button>
  );

  if (loadingBranches) {
    return <div style={styles.page}><h2>Branch Management</h2><p>Loading branches...</p></div>;
  }

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Branch Management</h1>
      <p style={styles.subtitle}>Manage branch inventory, cashier assignments, POS sales and interbranch stock transfers.</p>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <section style={styles.card}>
        <label htmlFor="branch-selector" style={styles.label}>Select branch</label>
        {branches.length === 0 ? (
          <p>No branches were returned by the server. Confirm that your branches exist in the database.</p>
        ) : (
          <select id="branch-selector" value={selectedBranchId} onChange={(event) => setSelectedBranchId(event.target.value)} style={{ ...styles.input, maxWidth: 500 }}>
            {branches.map((branch) => (
              <option key={branch.id} value={String(branch.id)}>
                {branch.name} ({branch.code}){branch.is_active === false ? " — Inactive" : ""}
              </option>
            ))}
          </select>
        )}
        {selectedBranchId && (
          <div style={{ marginTop: 14, color: "#6c757d" }}>
            <strong>Selected branch:</strong> {branches.find((b) => String(b.id) === String(selectedBranchId))?.name}
          </div>
        )}
      </section>

      <nav style={styles.tabs} aria-label="Branch sections">
        {tabButton("stock", "Branch Stock")}
        {tabButton("cashiers", "Assigned Cashiers")}
        {tabButton("sales", "POS Sales")}
        {tabButton("transfers", "Interbranch Transfers")}
      </nav>

      {activeTab === "transfers" ? (
        <>
          <section style={styles.card}>
            <h2 style={{ marginTop: 0 }}>Create Stock Transfer</h2>
            <p style={styles.subtitle}>Choose the exact product in each branch. The source and destination products can have different names and product IDs.</p>

            <div style={styles.grid}>
              <div>
                <label htmlFor="transfer-source" style={styles.label}>Source Branch</label>
                <select
                  id="transfer-source"
                  value={transferSourceId}
                  disabled={submittingTransfer}
                  onChange={(event) => {
                    const nextSource = event.target.value;
                    setTransferSourceId(nextSource);
                    if (String(nextSource) === String(transferDestinationId)) {
                      const nextDestination = activeBranches.find((b) => String(b.id) !== String(nextSource));
                      setTransferDestinationId(nextDestination ? String(nextDestination.id) : "");
                    }
                    setTransferItems([emptyTransferItem()]);
                  }}
                  style={styles.input}
                >
                  <option value="">Select source branch</option>
                  {activeBranches.map((branch) => <option key={branch.id} value={String(branch.id)}>{branch.name} ({branch.code})</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="transfer-destination" style={styles.label}>Destination Branch</label>
                <select
                  id="transfer-destination"
                  value={transferDestinationId}
                  disabled={submittingTransfer}
                  onChange={(event) => {
                    setTransferDestinationId(event.target.value);
                    setTransferItems((items) => items.map((item) => ({ ...item, destination_product_id: "" })));
                  }}
                  style={styles.input}
                >
                  <option value="">Select destination branch</option>
                  {availableDestinationBranches.map((branch) => <option key={branch.id} value={String(branch.id)}>{branch.name} ({branch.code})</option>)}
                </select>
              </div>
            </div>

            {selectedSourceBranch && selectedDestinationBranch && (
              <div style={styles.summary}>
                <strong>{selectedSourceBranch.name}</strong>
                <span style={{ margin: "0 15px", fontSize: 20 }}>→</span>
                <strong>{selectedDestinationBranch.name}</strong>
                <div style={{ marginTop: 8, fontSize: 13, color: "#0f5132" }}>
                  Each line transfers stock from one selected source product to one independently selected destination product.
                </div>
              </div>
            )}

            <div style={{ marginTop: 28, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ margin: 0 }}>Products to Transfer</h3>
              <button
                type="button"
                onClick={addTransferItem}
                disabled={!transferSourceId || !transferDestinationId || loadingSourceProducts || loadingDestinationProducts || submittingTransfer}
                style={{ ...styles.button, ...styles.secondary }}
              >
                + Add Product Pair
              </button>
            </div>

            {(loadingSourceProducts || loadingDestinationProducts) ? (
              <p>Loading source and destination product lists...</p>
            ) : !transferSourceId || !transferDestinationId ? (
              <div style={styles.info}>Select both branches to load their product lists.</div>
            ) : sourceProducts.length === 0 ? (
              <div style={styles.info}>The selected source branch has no stock products available to transfer.</div>
            ) : destinationProducts.length === 0 ? (
              <div style={styles.info}>No active destination products were returned. Check the destination product catalogue.</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={{ ...styles.table, minWidth: 1050 }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Source Product</th>
                      <th style={styles.th}>Available Stock</th>
                      <th style={styles.th}>Destination Product</th>
                      <th style={styles.th}>Destination Stock</th>
                      <th style={styles.th}>Transfer Quantity</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferPreview.map((item, index) => (
                      <tr key={index}>
                        <td style={styles.td}>
                          <select
                            value={item.product_id}
                            onChange={(event) => updateTransferItem(index, "product_id", event.target.value)}
                            disabled={submittingTransfer}
                            style={{ ...styles.input, minWidth: 220 }}
                            aria-label={`Source product for transfer item ${index + 1}`}
                          >
                            <option value="">Select source product</option>
                            {sourceProducts.map((product) => {
                              const id = product.product_id ?? product.id;
                              const quantity = Number(product.quantity ?? product.branch_stock ?? 0);
                              return <option key={id} value={String(id)}>{product.name} — {formatQuantity(quantity)} available</option>;
                            })}
                          </select>
                        </td>
                        <td style={styles.td}><strong>{item.source ? formatQuantity(item.available) : "—"}</strong></td>
                        <td style={styles.td}>
                          <select
                            value={item.destination_product_id}
                            onChange={(event) => updateTransferItem(index, "destination_product_id", event.target.value)}
                            disabled={submittingTransfer}
                            style={{ ...styles.input, minWidth: 240 }}
                            aria-label={`Destination product for transfer item ${index + 1}`}
                          >
                            <option value="">Select destination product</option>
                            {destinationProducts.map((product) => {
                              const id = product.product_id ?? product.id;
                              const quantity = Number(product.quantity ?? product.branch_stock ?? 0);
                              return <option key={id} value={String(id)}>{product.name} — current stock {formatQuantity(quantity)}</option>;
                            })}
                          </select>
                        </td>
                        <td style={styles.td}><strong>{item.destination ? formatQuantity(item.destinationStock) : "—"}</strong></td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            placeholder="0.000"
                            value={item.quantity}
                            onChange={(event) => updateTransferItem(index, "quantity", event.target.value)}
                            disabled={submittingTransfer}
                            style={{ ...styles.input, maxWidth: 130 }}
                            aria-label={`Transfer quantity for item ${index + 1}`}
                          />
                        </td>
                        <td style={styles.td}>
                          <button type="button" onClick={() => removeTransferItem(index)} disabled={submittingTransfer} style={{ ...styles.button, ...styles.danger }}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <label htmlFor="transfer-notes" style={styles.label}>Transfer Notes (Optional)</label>
              <textarea
                id="transfer-notes"
                value={transferNotes}
                onChange={(event) => setTransferNotes(event.target.value)}
                placeholder="Reason for transfer or additional information..."
                rows={3}
                disabled={submittingTransfer}
                style={{ ...styles.input, resize: "vertical" }}
              />
            </div>

            <div style={styles.summary}>
              <h3 style={{ marginTop: 0 }}>Transfer Summary</h3>
              <p><strong>Product pairs:</strong> {validPreviewCount}</p>
              <p><strong>Source:</strong> {selectedSourceBranch?.name || "Not selected"}</p>
              <p><strong>Destination:</strong> {selectedDestinationBranch?.name || "Not selected"}</p>
              {transferPreview.filter((item) => item.source && item.destination && item.quantityNumber > 0).map((item, index) => (
                <p key={`${item.product_id}-${item.destination_product_id}-${index}`} style={{ margin: "7px 0" }}>
                  {item.source.name} → {item.destination.name}: <strong>{formatQuantity(item.quantityNumber)}</strong>
                </p>
              ))}
              <p style={{ fontSize: 13, marginBottom: 0 }}>Quantities support up to three decimal places. Transfers complete immediately without a receiving confirmation.</p>
            </div>

            <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={submitTransfer}
                disabled={submittingTransfer || loadingSourceProducts || loadingDestinationProducts || !sourceProducts.length || !destinationProducts.length}
                style={{ ...styles.button, ...styles.primary, padding: "12px 24px", opacity: submittingTransfer ? 0.65 : 1 }}
              >
                {submittingTransfer ? "Completing Transfer..." : "Complete Stock Transfer"}
              </button>
            </div>
          </section>

          <section style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: 0 }}>Transfer History</h2>
                <p style={{ ...styles.subtitle, margin: "6px 0 0" }}>Completed interbranch stock transfers, including both selected product names.</p>
              </div>
              <button type="button" onClick={loadTransferHistory} disabled={loadingTransfers} style={{ ...styles.button, ...styles.secondary }}>
                {loadingTransfers ? "Refreshing..." : "Refresh History"}
              </button>
            </div>

            {loadingTransfers ? <p>Loading transfer history...</p> : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Reference</th>
                      <th style={styles.th}>Source Branch</th>
                      <th style={styles.th}>Destination Branch</th>
                      <th style={styles.th}>Product Transfer</th>
                      <th style={styles.th}>Initiated By</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferHistory.length === 0 ? (
                      <tr><td style={styles.td} colSpan={7}>No stock transfers found.</td></tr>
                    ) : transferHistory.map((transfer) => (
                      <tr key={transfer.id}>
                        <td style={styles.td}><strong>{transfer.reference || transfer.transfer_number || `#${transfer.id}`}</strong></td>
                        <td style={styles.td}>{transfer.source_branch_name || transfer.source_branch?.name || "—"}</td>
                        <td style={styles.td}>{transfer.destination_branch_name || transfer.destination_branch?.name || "—"}</td>
                        <td style={styles.td}>
                          {Array.isArray(transfer.items) && transfer.items.length ? transfer.items.map((item, index) => (
                            <div key={item.id || `${item.product_id}-${index}`} style={{ marginBottom: 8 }}>
                              <div><strong>{item.source_product_name || item.product_name || "Unknown source product"}</strong></div>
                              <div style={{ color: "#6c757d", fontSize: 13 }}>→ {item.destination_product_name || "Destination product unavailable"}</div>
                              <div>{formatQuantity(item.quantity)}</div>
                            </div>
                          )) : "No product details"}
                        </td>
                        <td style={styles.td}>{transfer.admin_username || "—"}</td>
                        <td style={styles.td}><span style={styles.badge}>{transfer.status || "Completed"}</span></td>
                        <td style={styles.td}>{transfer.created_at ? new Date(transfer.created_at).toLocaleString("en-KE") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : loadingSection ? (
        <section style={styles.card}>Loading {activeTab}...</section>
      ) : (
        <>
          {activeTab === "stock" && (
            <section style={styles.card}>
              <h2>Branch Inventory</h2>
              <p style={styles.subtitle}>Stock quantities here belong to this branch only. Changes do not automatically alter another branch's stock.</p>
              <div style={{ marginBottom: 18, maxWidth: 420 }}>
                <label htmlFor="stock-search" style={styles.label}>Search products</label>
                <input id="stock-search" type="search" placeholder="Search by product name or category..." value={stockSearch} onChange={(event) => setStockSearch(event.target.value)} style={styles.input} />
              </div>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>Product</th><th style={styles.th}>Category</th><th style={styles.th}>Selling Price</th><th style={styles.th}>Branch Stock</th><th style={styles.th}>Action</th></tr></thead>
                  <tbody>
                    {filteredStock.length === 0 ? <tr><td style={styles.td} colSpan={5}>No products found for this branch.</td></tr> : filteredStock.map((product) => {
                      const id = product.product_id ?? product.id;
                      return (
                        <tr key={id}>
                          <td style={styles.td}>{product.name}</td>
                          <td style={styles.td}>{product.category || "—"}</td>
                          <td style={styles.td}>{formatMoney(product.price)}</td>
                          <td style={styles.td}>
                            <input type="number" min="0" step="0.001" value={stockEdits[id] !== undefined ? stockEdits[id] : product.quantity ?? 0} onChange={(event) => setStockEdits((previous) => ({ ...previous, [id]: event.target.value }))} aria-label={`Stock quantity for ${product.name}`} style={{ ...styles.input, maxWidth: 120 }} />
                          </td>
                          <td style={styles.td}>
                            <button type="button" onClick={() => saveStock(product)} disabled={savingProductId === id} style={{ ...styles.button, ...styles.primary, opacity: savingProductId === id ? 0.65 : 1 }}>
                              {savingProductId === id ? "Saving..." : "Save"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "cashiers" && (
            <section style={styles.card}>
              <h2>Cashier Assignments</h2>
              <p style={styles.subtitle}>Assign cashiers to a branch. A cashier should work under the branch assigned to their account.</p>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>Username</th><th style={styles.th}>Full Name</th><th style={styles.th}>Status</th><th style={styles.th}>Assignment</th></tr></thead>
                  <tbody>
                    {cashiers.length === 0 ? <tr><td style={styles.td} colSpan={4}>No cashiers were returned by this endpoint.</td></tr> : cashiers.map((cashier) => (
                      <tr key={cashier.id}>
                        <td style={styles.td}>{cashier.username}</td>
                        <td style={styles.td}>{cashier.full_name || cashier.fullname || "—"}</td>
                        <td style={styles.td}>{cashier.is_active === false || cashier.isactive === false ? "Inactive" : "Active"}</td>
                        <td style={styles.td}>
                          <select value={cashier.branch_id == null ? "" : String(cashier.branch_id)} onChange={(event) => assignCashier(cashier.id, event.target.value)} disabled={assigningCashierId === cashier.id} style={{ ...styles.input, minWidth: 220 }} aria-label={`Assign ${cashier.username} to a branch`}>
                            <option value="">Unassigned</option>
                            {branches.map((branch) => <option key={branch.id} value={String(branch.id)} disabled={branch.is_active === false}>{branch.name}</option>)}
                          </select>
                          {assigningCashierId === cashier.id && <small> Saving...</small>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "sales" && (
            <section style={styles.card}>
              <h2>POS Sales</h2>
              <p style={styles.subtitle}>These are cashier POS sales for the selected branch, not website customer orders.</p>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>Sale Number</th><th style={styles.th}>Cashier</th><th style={styles.th}>Total</th><th style={styles.th}>Payment Method</th><th style={styles.th}>Payment Status</th><th style={styles.th}>Sale Status</th><th style={styles.th}>Date</th></tr></thead>
                  <tbody>
                    {sales.length === 0 ? <tr><td style={styles.td} colSpan={7}>No POS sales found for this branch.</td></tr> : sales.map((sale) => (
                      <tr key={sale.id}>
                        <td style={styles.td}>{sale.sale_number || `#${sale.id}`}</td>
                        <td style={styles.td}>{sale.cashier_name || sale.cashier?.full_name || sale.cashier?.username || "—"}</td>
                        <td style={styles.td}>{formatMoney(sale.total)}</td>
                        <td style={styles.td}>{sale.payment_method || "—"}</td>
                        <td style={styles.td}>{sale.payment_status || "—"}</td>
                        <td style={styles.td}>{sale.status || "—"}</td>
                        <td style={styles.td}>{sale.created_at ? new Date(sale.created_at).toLocaleString("en-KE") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default Branches;
