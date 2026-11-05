import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const DECIMAL_PLACES = 3;

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundStock(value) {
  return Number(Number(value).toFixed(DECIMAL_PLACES));
}

function CashierPOS() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [receipt, setReceipt] = useState(null);

  const pollingRef = useRef(false);
  const pollingSaleRef = useRef(null);
  const mountedRef = useRef(false);

  const cashier = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("cashier") || "null");
    } catch {
      return null;
    }
  }, []);

  // ============================================================
  // LIFECYCLE
  // ============================================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      pollingRef.current = false;
    };
  }, []);

  // ============================================================
  // LOAD PRODUCTS FOR THE AUTHENTICATED CASHIER'S BRANCH
  // ============================================================

  const fetchProducts = useCallback(async () => {
    const response = await api.get("/cashier/stock/products");
    const data = response.data;

    const productList = Array.isArray(data)
      ? data
      : Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data?.items)
          ? data.items
          : null;

    if (!productList) {
      throw new Error(
        "The branch stock API returned an unexpected response."
      );
    }

    const normalizedProducts = productList.map((product) => {
      const branchQuantity =
        product.branch_stock ??
        product.quantity ??
        product.stock_quantity ??
        product.quantity_in_stock ??
        product.stock ??
        null;

      const rawPrice =
        product.price ??
        product.selling_price ??
        product.unit_price ??
        product.retail_price ??
        product.sale_price ??
        null;

      const price =
        rawPrice === null ||
        rawPrice === undefined ||
        rawPrice === ""
          ? null
          : Number(rawPrice);

      const rawPortionPrice = product.portion_price;

      const portionPrice =
        rawPortionPrice === null ||
        rawPortionPrice === undefined ||
        rawPortionPrice === ""
          ? null
          : Number(rawPortionPrice);

      const rawPortions = product.portions_per_unit;

      const portionsPerUnit =
        rawPortions === null ||
        rawPortions === undefined ||
        rawPortions === ""
          ? null
          : Number(rawPortions);

      const rawStock =
        branchQuantity === null ||
        branchQuantity === undefined ||
        branchQuantity === ""
          ? null
          : Number(branchQuantity);

      return {
        ...product,
        price:
          price !== null && Number.isFinite(price) && price >= 0
            ? price
            : null,
        portion_price:
          portionPrice !== null &&
          Number.isFinite(portionPrice) &&
          portionPrice >= 0
            ? portionPrice
            : null,
        portions_per_unit:
          portionsPerUnit !== null &&
          Number.isInteger(portionsPerUnit) &&
          portionsPerUnit > 0
            ? portionsPerUnit
            : null,
        // APIs and databases may serialize booleans differently.
        // Normalize common true values so portion sales are not hidden
        // merely because the API returns "True", "1", or "yes".
        allow_portion_sales: ["true", "1", "yes", "on"].includes(
          String(product.allow_portion_sales ?? "")
            .trim()
            .toLowerCase()
        ),
        stock_quantity:
          rawStock !== null &&
          Number.isFinite(rawStock) &&
          rawStock >= 0
            ? rawStock
            : null,
      };
    });

    if (mountedRef.current) {
      setProducts(normalizedProducts);
    }

    return normalizedProducts;
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");
        await fetchProducts();
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              err.message ||
              "Unable to load branch products."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [fetchProducts]);

  // ============================================================
  // PRODUCT HELPERS
  // ============================================================

  const getPrice = (product) => {
    const price =
      product.price ??
      product.selling_price ??
      product.unit_price ??
      product.retail_price ??
      product.sale_price;

    if (price === null || price === undefined || price === "") {
      return null;
    }

    const number = Number(price);

    return Number.isFinite(number) && number >= 0
      ? number
      : null;
  };

  const getPortionPrice = (product) => {
    const price = product.portion_price;

    if (price === null || price === undefined || price === "") {
      return null;
    }

    const number = Number(price);

    return Number.isFinite(number) && number >= 0
      ? number
      : null;
  };

  const canSellPortions = (product) => {
    if (!product) {
      return false;
    }

    const enabled = ["true", "1", "yes", "on"].includes(
      String(product.allow_portion_sales ?? "")
        .trim()
        .toLowerCase()
    );
    const portionsPerUnit = Number(product.portions_per_unit);
    const portionPrice = getPortionPrice(product);

    return (
      enabled &&
      Number.isInteger(portionsPerUnit) &&
      portionsPerUnit > 0 &&
      portionPrice !== null
    );
  };

  const getStock = (product) => {
    const value =
      product.stock_quantity ??
      product.quantity_in_stock ??
      product.branch_stock ??
      product.quantity ??
      product.stock;

    if (value === undefined || value === null || value === "") {
      return null;
    }

    const quantity = Number(value);

    return Number.isFinite(quantity) && quantity >= 0
      ? quantity
      : null;
  };

  const getSellingPrice = (item) =>
    item.selling_unit === "portion"
      ? getPortionPrice(item)
      : getPrice(item);

  // Convert the quantity sold into stock-unit equivalents.
  // Example: 2 portions from a bottle containing 4 portions
  // consume 2 / 4 = 0.500 bottles.
  const getStockConsumption = (item) => {
    const quantity = toNumber(item.sale_quantity);

    if (item.selling_unit === "portion") {
      const portions = Number(item.portions_per_unit);

      if (!Number.isInteger(portions) || portions <= 0) {
        return Infinity;
      }

      return roundStock(quantity / portions);
    }

    return roundStock(quantity);
  };

  const getCartKey = (productId, sellingUnit) =>
    `${productId}:${sellingUnit}`;

  const getProductStockUsed = (productId, excludedCartKey = null) =>
    cart.reduce((total, item) => {
      if (
        String(item.id) !== String(productId) ||
        item.cartKey === excludedCartKey
      ) {
        return total;
      }

      return total + getStockConsumption(item);
    }, 0);

  const getAvailableStock = (product, excludedCartKey = null) => {
    const stock = getStock(product);

    if (stock === null) {
      return null;
    }

    return Math.max(
      0,
      roundStock(
        stock - getProductStockUsed(product.id, excludedCartKey)
      )
    );
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return products;
    }

    return products.filter((product) => {
      const name = String(product.name || "").toLowerCase();
      const category = String(product.category || "").toLowerCase();
      const description = String(product.description || "").toLowerCase();

      return (
        name.includes(term) ||
        category.includes(term) ||
        description.includes(term)
      );
    });
  }, [products, search]);

  // ============================================================
  // CART
  // ============================================================

  const addToCart = (product, sellingUnit = "unit") => {
    setError("");
    setMessage("");

    const stock = getAvailableStock(product);

    if (stock === null) {
      setError(
        `Branch stock for ${product.name} is unavailable. Refresh the products before selling.`
      );
      return;
    }

    if (stock <= 0) {
      setError(
        `${product.name} does not have enough stock at your branch.`
      );
      return;
    }

    if (sellingUnit === "portion" && !canSellPortions(product)) {
      setError(
        `Portion selling is not configured correctly for ${product.name}.`
      );
      return;
    }

    const sellingPrice =
      sellingUnit === "portion"
        ? getPortionPrice(product)
        : getPrice(product);

    if (sellingPrice === null) {
      setError(
        `The ${sellingUnit === "portion" ? "portion" : "unit"} selling price for ${product.name} is unavailable.`
      );
      return;
    }

    const cartKey = getCartKey(product.id, sellingUnit);

    const existing = cart.find((item) => item.cartKey === cartKey);

    if (existing) {
      const nextQuantity = existing.sale_quantity + 1;

      const nextConsumption =
        sellingUnit === "portion"
          ? roundStock(
              nextQuantity / Number(product.portions_per_unit)
            )
          : roundStock(nextQuantity);

      if (nextConsumption > stock) {
        setError(
          `Insufficient branch stock for ${product.name}.`
        );
        return;
      }

      setCart((current) =>
        current.map((item) =>
          item.cartKey === cartKey
            ? { ...item, sale_quantity: nextQuantity }
            : item
        )
      );

      return;
    }

    const initialConsumption =
      sellingUnit === "portion"
        ? roundStock(1 / Number(product.portions_per_unit))
        : 1;

    if (initialConsumption > stock) {
      setError(
        `Insufficient branch stock for ${product.name}.`
      );
      return;
    }

    setCart((current) => [
      ...current,
      {
        ...product,
        cartKey,
        selling_unit: sellingUnit,
        sale_quantity: 1,
      },
    ]);
  };

  const removeFromCart = (cartKey) => {
    setCart((current) =>
      current.filter((item) => item.cartKey !== cartKey)
    );
  };

  const updateQuantity = (cartKey, quantity) => {
    setError("");
    setMessage("");

    const item = cart.find((entry) => entry.cartKey === cartKey);

    if (!item) {
      return;
    }

    if (!Number.isFinite(quantity)) {
      return;
    }

    if (quantity <= 0) {
      removeFromCart(cartKey);
      return;
    }

    if (item.selling_unit === "portion" && !Number.isInteger(quantity)) {
      setError("Portion quantities must be whole numbers.");
      return;
    }

    const stock = getStock(item);

    if (stock === null) {
      setError(`Unable to verify branch stock for ${item.name}.`);
      return;
    }

    const available = getAvailableStock(item, cartKey);

    const consumption =
      item.selling_unit === "portion"
        ? roundStock(quantity / Number(item.portions_per_unit))
        : roundStock(quantity);

    if (consumption > available) {
      setError(
        `Insufficient branch stock for ${item.name}. Available stock: ${available} bottle/unit equivalents.`
      );
      return;
    }

    setCart((current) =>
      current.map((entry) =>
        entry.cartKey === cartKey
          ? { ...entry, sale_quantity: quantity }
          : entry
      )
    );
  };

  const changeSellingUnit = (cartKey, sellingUnit) => {
    setError("");
    setMessage("");

    const item = cart.find((entry) => entry.cartKey === cartKey);

    if (!item) {
      return;
    }

    if (sellingUnit === "portion" && !canSellPortions(item)) {
      setError(`Portion selling is unavailable for ${item.name}.`);
      return;
    }

    const price =
      sellingUnit === "portion"
        ? getPortionPrice(item)
        : getPrice(item);

    if (price === null) {
      setError(`The selling price for ${item.name} is unavailable.`);
      return;
    }

    const nextKey = getCartKey(item.id, sellingUnit);

    if (nextKey !== cartKey && cart.some((entry) => entry.cartKey === nextKey)) {
      setError(
        `${item.name} already has a separate ${sellingUnit} line in the cart.`
      );
      return;
    }

    const stock = getStock(item);
    const available = getAvailableStock(item, cartKey);

    const nextConsumption =
      sellingUnit === "portion"
        ? roundStock(1 / Number(item.portions_per_unit))
        : 1;

    if (stock === null || nextConsumption > available) {
      setError(`Insufficient branch stock for ${item.name}.`);
      return;
    }

    setCart((current) =>
      current.map((entry) =>
        entry.cartKey === cartKey
          ? {
              ...entry,
              cartKey: nextKey,
              selling_unit: sellingUnit,
              sale_quantity: 1,
            }
          : entry
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setError("");
    setMessage("");
  };

  // ============================================================
  // TOTALS
  // ============================================================

  const totalItems = cart.reduce(
    (total, item) => total + toNumber(item.sale_quantity),
    0
  );

  const totalAmount = cart.reduce((total, item) => {
    const price = getSellingPrice(item);

    return total + (price ?? 0) * toNumber(item.sale_quantity);
  }, 0);

  const totalStockConsumption = roundStock(
    cart.reduce(
      (total, item) => total + getStockConsumption(item),
      0
    )
  );

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatQuantity = (value) =>
    Number(value || 0).toLocaleString("en-KE", {
      maximumFractionDigits: 3,
    });

  // ============================================================
  // M-PESA PAYMENT STATUS POLLING
  // ============================================================

  const pollPaymentStatus = useCallback(
    async (saleId) => {
      if (!saleId || pollingRef.current) {
        return;
      }

      pollingRef.current = true;
      pollingSaleRef.current = saleId;

      const startedAt = Date.now();
      const timeoutMs = 180000;
      const intervalMs = 3000;

      try {
        while (
          mountedRef.current &&
          pollingRef.current &&
          Date.now() - startedAt < timeoutMs
        ) {
          try {
            const response = await api.get(
              `/cashier/sales/${saleId}/payment-status`
            );

            if (!mountedRef.current || !pollingRef.current) {
              return;
            }

            const data = response.data || {};

            const transactionStatus = String(
              data.transaction_status || ""
            ).toLowerCase();

            const paymentStatus = String(
              data.payment_status || ""
            ).toLowerCase();

            const saleStatus = String(
              data.sale_status || ""
            ).toLowerCase();

            const isPaid =
              paymentStatus === "paid" ||
              transactionStatus === "paid" ||
              transactionStatus === "success" ||
              transactionStatus === "successful";

            const isFailed =
              transactionStatus === "failed" ||
              transactionStatus === "cancelled" ||
              transactionStatus === "canceled" ||
              paymentStatus === "failed" ||
              saleStatus === "cancelled" ||
              saleStatus === "canceled";

            if (isPaid) {
              setReceipt((current) => {
                if (
                  !current ||
                  Number(current.id) !== Number(saleId)
                ) {
                  return current;
                }

                return {
                  ...current,
                  payment_status: "paid",
                  status: data.sale_status || "completed",
                  mpesa_receipt_number:
                    data.mpesa_receipt_number ||
                    current.mpesa_receipt_number,
                  checkout_request_id:
                    data.checkout_request_id ||
                    current.checkout_request_id,
                  mpesa_phone:
                    data.phone_number || current.mpesa_phone,
                };
              });

              setMessage(
                data.mpesa_receipt_number
                  ? `M-Pesa payment confirmed. Receipt: ${data.mpesa_receipt_number}`
                  : "M-Pesa payment confirmed successfully."
              );

              try {
                await fetchProducts();
              } catch (refreshError) {
                console.error(
                  "Payment confirmed, but branch stock refresh failed:",
                  refreshError
                );
              }

              return;
            }

            if (isFailed) {
              setReceipt((current) => {
                if (
                  !current ||
                  Number(current.id) !== Number(saleId)
                ) {
                  return current;
                }

                return {
                  ...current,
                  payment_status: "failed",
                  status: data.sale_status || "cancelled",
                  payment_message:
                    data.message ||
                    "The M-Pesa payment was not completed.",
                };
              });

              setError(
                data.message ||
                  "M-Pesa payment failed or was cancelled. Check Sales History before retrying."
              );

              try {
                await fetchProducts();
              } catch (refreshError) {
                console.error(
                  "Unable to refresh branch stock:",
                  refreshError
                );
              }

              return;
            }
          } catch (err) {
            console.error(
              "Unable to check cashier M-Pesa payment status:",
              err
            );
          }

          await new Promise((resolve) =>
            setTimeout(resolve, intervalMs)
          );
        }

        if (
          mountedRef.current &&
          Number(pollingSaleRef.current) === Number(saleId)
        ) {
          setMessage(
            "Payment is still awaiting confirmation. Keep the sale number and check Sales History before retrying."
          );
        }
      } finally {
        if (Number(pollingSaleRef.current) === Number(saleId)) {
          pollingRef.current = false;
          pollingSaleRef.current = null;
        }
      }
    },
    [fetchProducts]
  );

  // ============================================================
  // CHECKOUT
  // ============================================================

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("Add products to the cart before checkout.");
      return;
    }

    if (checkoutLoading) {
      return;
    }

    setError("");
    setMessage("");

    let normalizedPhone = "";

    if (paymentMethod === "mpesa") {
      normalizedPhone = mpesaPhone
        .trim()
        .replace(/[\s-]/g, "");

      const validPhone =
        /^(?:\+254|254|0)?(?:7|1)\d{8}$/.test(normalizedPhone);

      if (!validPhone) {
        setError(
          "Enter a valid Kenyan phone number, e.g. 0712345678."
        );
        return;
      }

      if (pollingRef.current) {
        setError(
          "A payment is already being checked. Please wait."
        );
        return;
      }
    }

    // Prevent sending a sale with missing prices or invalid quantities.
    for (const item of cart) {
      const price = getSellingPrice(item);
      const quantity = Number(item.sale_quantity);
      const stock = getStock(item);

      if (
        price === null ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        stock === null
      ) {
        setError(
          `Check the price, quantity and branch stock for ${item.name} before checkout.`
        );
        return;
      }

      if (
        item.selling_unit === "portion" &&
        (!Number.isInteger(quantity) || !canSellPortions(item))
      ) {
        setError(
          `The portion configuration for ${item.name} is invalid.`
        );
        return;
      }
    }

    setCheckoutLoading(true);

    let saleCreated = false;

    try {
      // --------------------------------------------------------
      // STEP 1: CREATE AN INDEPENDENT CASHIER SALE
      // --------------------------------------------------------

      const payload = {
        payment_method: paymentMethod,
        items: cart.map((item) => ({
          product_id: item.id,

          // The quantity sold in the selected selling unit.
          quantity: Number(item.sale_quantity),

          // Also send the explicit field for compatible backends.
          sale_quantity: Number(item.sale_quantity),

          // "unit" means whole stock units; "portion" means
          // portions configured on the product.
          selling_unit: item.selling_unit,
        })),
      };

      const response = await api.post(
        "/cashier/sales",
        payload
      );

      const sale = response.data?.sale;

      if (!sale || !sale.id || !sale.sale_number) {
        throw new Error(
          "The sale response was incomplete. Check Sales History before retrying."
        );
      }

      saleCreated = true;

      // --------------------------------------------------------
      // STEP 2: CASH PAYMENT
      // --------------------------------------------------------

      if (paymentMethod === "cash") {
        setReceipt({
          ...sale,
          id: sale.id,
          order_number: sale.sale_number,
          payment_method: "cash",
          payment_status: sale.payment_status || "paid",
          items: sale.items || [],
        });

        setCart([]);
        setSearch("");
        setMessage("Cash sale recorded successfully!");

        try {
          await fetchProducts();
        } catch {
          setMessage(
            "Cash sale recorded successfully. Refresh the page to update branch inventory."
          );
        }

        return;
      }

      // --------------------------------------------------------
      // STEP 3: INITIATE M-PESA FOR THE CASHIER SALE
      // --------------------------------------------------------

      const stkResponse = await api.post(
        "/payments/cashier-stk-push",
        {
          sale_id: sale.id,
          phone: normalizedPhone,
        }
      );

      const paymentData = stkResponse.data || {};

      setReceipt({
        ...sale,
        id: sale.id,
        order_number: sale.sale_number,
        payment_method: "mpesa",
        payment_status: paymentData.payment_status || "pending",
        checkout_request_id:
          paymentData.checkout_request_id || null,
        mpesa_phone: normalizedPhone,
        mpesa_receipt_number: null,
        items: sale.items || [],
      });

      setCart([]);
      setSearch("");

      setMessage(
        "M-Pesa prompt initiated. Ask the customer to enter their PIN. The POS will check payment confirmation automatically."
      );

      try {
        await fetchProducts();
      } catch {
        // Payment confirmation must continue if refreshing stock fails.
      }

      // --------------------------------------------------------
      // STEP 4: CHECK PAYMENT STATUS
      // --------------------------------------------------------

      void pollPaymentStatus(sale.id);
    } catch (err) {
      const serverMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Checkout failed.";

      if (saleCreated) {
        setError(
          `${serverMessage} A sale has already been created. Check Sales History and payment status before retrying.`
        );

        setMessage(
          "The sale exists, but payment initiation was not confirmed. Do not create the same sale again."
        );

        try {
          await fetchProducts();
        } catch {
          // Preserve the original error.
        }
      } else {
        setError(serverMessage);
      }
    } finally {
      if (mountedRef.current) {
        setCheckoutLoading(false);
      }
    }
  };

  // ============================================================
  // LOG OUT
  // ============================================================

  const handleLogout = () => {
    pollingRef.current = false;
    pollingSaleRef.current = null;

    localStorage.removeItem("cashierToken");
    localStorage.removeItem("cashier");

    navigate("/cashier-login", { replace: true });
  };

  // ============================================================
  // RECEIPT
  // ============================================================

  const receiptView = receipt && (
    <div className="pos-receipt-overlay">
      <div className="pos-receipt">
        <div className="pos-receipt-header">
          <h2>MyDuka Receipt</h2>

          <p>
            {receipt.payment_method === "mpesa" &&
            receipt.payment_status !== "paid"
              ? receipt.payment_status === "failed"
                ? "Payment failed"
                : "Payment pending"
              : "Sale recorded"}
          </p>

          <p>
            <strong>Receipt:</strong>{" "}
            {receipt.sale_number || receipt.order_number}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {receipt.created_at
              ? new Date(receipt.created_at).toLocaleString()
              : new Date().toLocaleString()}
          </p>

          <p>
            <strong>Cashier:</strong>{" "}
            {cashier?.full_name || cashier?.username || "Cashier"}
          </p>

          {receipt.branch_name && (
            <p>
              <strong>Branch:</strong> {receipt.branch_name}
            </p>
          )}
        </div>

        <hr />

        {(receipt.items || []).map((item, index) => {
          const itemPrice = toNumber(item.price);
          const quantity = toNumber(
            item.sale_quantity ?? item.quantity
          );

          const subtotal = toNumber(
            item.subtotal,
            itemPrice * quantity
          );

          const sellingUnit =
            item.selling_unit === "portion" ? "portion(s)" : "unit(s)";

          return (
            <div
              key={item.id || `${item.product_id}-${index}`}
              className="pos-receipt-item"
            >
              <div>
                <strong>
                  {item.product_name ||
                    item.product?.name ||
                    "Product"}
                </strong>

                <div className="pos-receipt-muted">
                  {formatQuantity(quantity)} {sellingUnit} × KSh{" "}
                  {formatCurrency(itemPrice)}
                </div>
              </div>

              <strong>KSh {formatCurrency(subtotal)}</strong>
            </div>
          );
        })}

        <div className="pos-receipt-total">
          <strong>Total</strong>
          <strong>KSh {formatCurrency(receipt.total)}</strong>
        </div>

        <p>
          <strong>Payment method:</strong>{" "}
          {String(receipt.payment_method || "").toUpperCase()}
        </p>

        <p>
          <strong>Payment status:</strong>{" "}
          {String(receipt.payment_status || "unknown").toUpperCase()}
        </p>

        {receipt.payment_method === "mpesa" && (
          <>
            <p>
              <strong>Phone:</strong>{" "}
              {receipt.mpesa_phone ||
                receipt.phone_number ||
                "Not available"}
            </p>

            {receipt.mpesa_receipt_number && (
              <p>
                <strong>M-Pesa receipt number:</strong>{" "}
                {receipt.mpesa_receipt_number}
              </p>
            )}

            {receipt.checkout_request_id && (
              <p>
                <strong>Transaction reference:</strong>
                <br />
                <small>{receipt.checkout_request_id}</small>
              </p>
            )}
          </>
        )}

        {receipt.payment_method === "mpesa" &&
          receipt.payment_status !== "paid" &&
          receipt.payment_status !== "failed" && (
            <div className="pos-receipt-warning">
              <strong>Payment not yet confirmed.</strong>
              <p>
                Do not treat this transaction as paid until the
                backend confirms success.
              </p>
            </div>
          )}

        {receipt.payment_method === "mpesa" &&
          receipt.payment_status === "failed" && (
            <div className="pos-receipt-warning">
              <strong>Payment failed or was cancelled.</strong>
              <p>
                {receipt.payment_message ||
                  "Check the transaction and Sales History before retrying."}
              </p>
            </div>
          )}

        {receipt.payment_method === "mpesa" &&
          receipt.payment_status === "paid" && (
            <p className="pos-receipt-paid">
              M-Pesa payment confirmed.
            </p>
          )}

        <p className="pos-receipt-thanks">
          Thank you for shopping with us!
        </p>

        <div className="pos-receipt-actions">
          <button
            type="button"
            onClick={() => window.print()}
            className="pos-print-button"
          >
            Print Receipt
          </button>

          <button
            type="button"
            onClick={() => {
              setReceipt(null);
              setError("");
              setMessage("");
            }}
            className="pos-new-sale-button"
          >
            New Sale
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // POS SCREEN
  // ============================================================

  return (
    <>
      {receiptView}

      <div className="pos-page" style={styles.page}>
        <header style={styles.header}>
          <div>
            <h1 style={{ ...styles.heading, fontStyle: "italic" }}>
              MyDuka POS
            </h1>

            <p style={styles.subheading}>
              Point of Sale · Counter Sales
            </p>

            {cashier?.branch_name && (
              <p style={styles.branchLabel}>
                Branch: {cashier.branch_name}
              </p>
            )}
          </div>

          <div style={styles.headerRight}>
            <div style={styles.cashierInfo}>
              <span style={styles.cashierLabel}>Signed in as</span>
              <strong>
                {cashier?.full_name || cashier?.username || "Cashier"}
              </strong>
            </div>

            <button
              type="button"
              onClick={() => navigate("/cashier/sales-history")}
              style={styles.salesHistoryButton}
            >
              Sales History
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={styles.logoutButton}
            >
              Log out
            </button>
          </div>
        </header>

        {error && (
          <div style={styles.error} role="alert">
            {error}
          </div>
        )}

        {message && (
          <div style={styles.success} role="status">
            {message}
          </div>
        )}

        <main style={styles.layout}>
          {/* PRODUCTS */}
          <section style={styles.productPanel}>
            <div style={styles.panelHeading}>
              <h2 style={styles.sectionTitle}>Branch Products</h2>

              <span style={styles.countBadge}>
                {filteredProducts.length} found
              </span>
            </div>

            <input
              type="search"
              placeholder="Search products by name or category..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={styles.search}
            />

            {loading ? (
              <div style={styles.emptyState}>
                Loading branch products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={styles.emptyState}>
                <h3>No branch products found</h3>
                <p>
                  No products are assigned to this branch, or your
                  search returned no results. Contact the administrator
                  if you expected products to appear.
                </p>
              </div>
            ) : (
              <div style={styles.productGrid}>
                {filteredProducts.map((product) => {
                  const stock = getStock(product);
                  const wholePrice = getPrice(product);
                  const portionPrice = getPortionPrice(product);
                  const canPortion = canSellPortions(product);
                  const availableStock = getAvailableStock(product);

                  const unitInCart = cart.some(
                    (item) =>
                      item.cartKey === getCartKey(product.id, "unit")
                  );

                  const portionInCart = cart.some(
                    (item) =>
                      item.cartKey === getCartKey(product.id, "portion")
                  );

                  const unavailable =
                    stock === null ||
                    stock <= 0 ||
                    availableStock === 0;

                  return (
                    <article
                      key={product.id}
                      style={styles.productCard}
                    >
                      <div style={styles.productIcon}>🍾</div>

                      <h3 style={styles.productName}>
                        {product.name || "Unnamed product"}
                      </h3>

                      <p style={styles.category}>
                        {product.category || "General"}
                      </p>

                      <p style={styles.price}>
                        Whole:{" "}
                        {wholePrice === null
                          ? "Price unavailable"
                          : `KSh ${formatCurrency(wholePrice)}`}
                      </p>

                      {canPortion && (
                        <p style={styles.portionPrice}>
                          Portion: KSh {formatCurrency(portionPrice)}
                          {" · "}
                          {product.portions_per_unit} per unit
                        </p>
                      )}

                      <p style={styles.stock}>
                        {stock === null
                          ? "Stock unavailable"
                          : `${formatQuantity(stock)} units in this branch`}
                      </p>

                      <button
                        type="button"
                        onClick={() => addToCart(product, "unit")}
                        disabled={
                          unavailable ||
                          checkoutLoading ||
                          wholePrice === null
                        }
                        style={{
                          ...styles.addButton,
                          ...(unavailable ||
                          checkoutLoading ||
                          wholePrice === null
                            ? styles.disabledButton
                            : {}),
                        }}
                      >
                        {wholePrice === null
                          ? "Price unavailable"
                          : unavailable
                            ? "Out of stock"
                            : unitInCart
                              ? "Add another whole unit"
                              : "Add whole unit"}
                      </button>

                      {canPortion && (
                        <button
                          type="button"
                          onClick={() => addToCart(product, "portion")}
                          disabled={unavailable || checkoutLoading}
                          style={{
                            ...styles.portionButton,
                            ...(unavailable || checkoutLoading
                              ? styles.disabledButton
                              : {}),
                          }}
                        >
                          {portionInCart
                            ? "Add another portion"
                            : "Sell a portion"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* CART */}
          <aside style={styles.cartPanel}>
            <div style={styles.panelHeading}>
              <h2 style={styles.sectionTitle}>Current Sale</h2>

              <span style={styles.countBadge}>
                {formatQuantity(totalItems)} items
              </span>
            </div>

            {cart.length === 0 ? (
              <div style={styles.emptyCart}>
                <div style={styles.cartIcon}>🛒</div>
                <h3>Your cart is empty</h3>
                <p>Select products to start a sale.</p>
              </div>
            ) : (
              <div style={styles.cartItems}>
                {cart.map((item) => {
                  const itemPrice = getSellingPrice(item);
                  const quantity = Number(item.sale_quantity);
                  const stockConsumption = getStockConsumption(item);
                  const subtotal =
                    (itemPrice ?? 0) * quantity;

                  return (
                    <div
                      key={item.cartKey}
                      style={styles.cartItem}
                    >
                      <div style={styles.cartItemInfo}>
                        <strong style={styles.cartItemName}>
                          {item.name}
                        </strong>

                        <label style={styles.smallLabel}>
                          Selling unit
                        </label>

                        <select
                          value={item.selling_unit}
                          onChange={(event) =>
                            changeSellingUnit(
                              item.cartKey,
                              event.target.value
                            )
                          }
                          disabled={checkoutLoading}
                          style={styles.unitSelect}
                        >
                          <option value="unit">
                            Whole unit
                          </option>

                          {canSellPortions(item) && (
                            <option value="portion">
                              Portion — KSh {formatCurrency(
                                getPortionPrice(item)
                              )}
                            </option>
                          )}
                        </select>

                        <span style={styles.cartItemPrice}>
                          {itemPrice === null
                            ? "Price unavailable"
                            : `KSh ${formatCurrency(itemPrice)} each`}
                        </span>

                        <span style={styles.cartItemPrice}>
                          Subtotal: KSh {formatCurrency(subtotal)}
                        </span>

                        <div style={styles.quantityControls}>
                          <button
                            type="button"
                            disabled={checkoutLoading || quantity <= 1}
                            onClick={() =>
                              updateQuantity(
                                item.cartKey,
                                quantity -
                                  (item.selling_unit === "portion"
                                    ? 1
                                    : 1)
                              )
                            }
                            style={styles.quantityButton}
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            −
                          </button>

                          <input
                            type="number"
                            min="0.001"
                            step={
                              item.selling_unit === "portion"
                                ? "1"
                                : "0.001"
                            }
                            value={item.sale_quantity}
                            disabled={checkoutLoading}
                            onChange={(event) => {
                              const value = event.target.value;

                              if (value === "") {
                                return;
                              }

                              const next = Number(value);

                              if (Number.isFinite(next)) {
                                updateQuantity(item.cartKey, next);
                              }
                            }}
                            style={styles.quantityInput}
                            aria-label={`${item.name} quantity`}
                          />

                          <button
                            type="button"
                            disabled={checkoutLoading}
                            onClick={() =>
                              updateQuantity(
                                item.cartKey,
                                quantity + 1
                              )
                            }
                            style={styles.quantityButton}
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            +
                          </button>

                          <button
                            type="button"
                            disabled={checkoutLoading}
                            onClick={() => removeFromCart(item.cartKey)}
                            style={styles.removeButton}
                          >
                            Remove
                          </button>
                        </div>

                        <small style={styles.stockConsumption}>
                          Branch stock consumed:{" "}
                          {formatQuantity(stockConsumption)} unit(s)
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={styles.summary}>
              <label
                htmlFor="paymentMethod"
                style={styles.paymentLabel}
              >
                Payment Method
              </label>

              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(event) => {
                  setPaymentMethod(event.target.value);
                  setError("");
                  setMessage("");
                }}
                disabled={checkoutLoading}
                style={styles.paymentSelect}
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
              </select>

              {paymentMethod === "mpesa" && (
                <div style={styles.phoneSection}>
                  <label
                    htmlFor="mpesaPhone"
                    style={styles.paymentLabel}
                  >
                    Customer M-Pesa Phone Number
                  </label>

                  <input
                    id="mpesaPhone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="e.g. 0712345678"
                    value={mpesaPhone}
                    onChange={(event) =>
                      setMpesaPhone(event.target.value)
                    }
                    disabled={checkoutLoading}
                    style={styles.phoneInput}
                  />

                  <p style={styles.phoneHint}>
                    The customer must be able to access this phone
                    to enter their M-Pesa PIN.
                  </p>
                </div>
              )}

              <div style={styles.summaryRow}>
                <span>Items sold</span>
                <strong>{formatQuantity(totalItems)}</strong>
              </div>

              <div style={styles.summaryRow}>
                <span>Stock consumed</span>
                <strong>
                  {formatQuantity(totalStockConsumption)} units
                </strong>
              </div>

              <div style={styles.totalRow}>
                <span>Total</span>
                <strong>KSh {formatCurrency(totalAmount)}</strong>
              </div>

              <button
                type="button"
                disabled={cart.length === 0 || checkoutLoading}
                onClick={handleCheckout}
                style={{
                  ...styles.checkoutButton,
                  ...(cart.length === 0 || checkoutLoading
                    ? styles.disabledButton
                    : {}),
                }}
              >
                {checkoutLoading
                  ? paymentMethod === "mpesa"
                    ? "Initiating Payment..."
                    : "Processing Sale..."
                  : paymentMethod === "mpesa"
                    ? "Initiate M-Pesa Payment"
                    : "Complete Cash Sale"}
              </button>

              <button
                type="button"
                onClick={clearCart}
                disabled={cart.length === 0 || checkoutLoading}
                style={{
                  ...styles.clearButton,
                  ...(cart.length === 0 || checkoutLoading
                    ? styles.disabledClearButton
                    : {}),
                }}
              >
                Clear Cart
              </button>

              <p style={styles.notice}>
                {paymentMethod === "mpesa"
                  ? "M-Pesa sales remain unpaid until the backend confirms payment."
                  : "Cash sales are recorded by the backend during checkout."}
              </p>
            </div>
          </aside>
        </main>
      </div>
    </>
  );
}

// ============================================================
// RECEIPT STYLES
// ============================================================

const receiptStyles = `
.pos-receipt-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
}
.pos-receipt {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 14px;
  padding: 28px;
  box-sizing: border-box;
  color: #1f2937;
}
.pos-receipt-header { text-align: center; }
.pos-receipt-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}
.pos-receipt-muted {
  color: #64748b;
  font-size: 13px;
  margin-top: 4px;
}
.pos-receipt-total {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 20px 0;
  font-size: 19px;
}
.pos-receipt-warning {
  padding: 12px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
}
.pos-receipt-paid {
  padding: 10px;
  background: #dcfce7;
  color: #166534;
  border-radius: 6px;
  font-weight: 600;
  text-align: center;
}
.pos-receipt-thanks {
  text-align: center;
  margin-top: 24px;
}
.pos-receipt-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.pos-print-button,
.pos-new-sale-button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.pos-print-button { background: #166534; color: white; }
.pos-new-sale-button { background: #e2e8f0; color: #1f2937; }
@media print {
  body * { visibility: hidden !important; }
  .pos-receipt-overlay,
  .pos-receipt-overlay * { visibility: visible !important; }
  .pos-receipt-overlay {
    position: absolute !important;
    inset: 0 !important;
    display: block !important;
    padding: 0 !important;
    background: white !important;
    overflow: visible !important;
  }
  .pos-receipt {
    width: 100% !important;
    max-width: none !important;
    max-height: none !important;
    overflow: visible !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 10px !important;
  }
  .pos-receipt-actions { display: none !important; }
}
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById("pos-receipt-styles")
) {
  const styleElement = document.createElement("style");
  styleElement.id = "pos-receipt-styles";
  styleElement.textContent = receiptStyles;
  document.head.appendChild(styleElement);
}

// ============================================================
// POS STYLES
// ============================================================

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background: "#f4f7f5",
    color: "#1f2937",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "28px",
    paddingBottom: "20px",
    borderBottom: "1px solid #dce5df",
  },
  heading: {
    margin: 0,
    color: "#166534",
    fontSize: "30px",
  },
  subheading: {
    margin: "6px 0 0",
    color: "#64748b",
  },
  branchLabel: {
    margin: "6px 0 0",
    color: "#166534",
    fontSize: "13px",
    fontWeight: "600",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  cashierInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  cashierLabel: {
    color: "#64748b",
    fontSize: "12px",
  },
  salesHistoryButton: {
    padding: "10px 16px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  logoutButton: {
    padding: "10px 16px",
    background: "#fff",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  error: {
    padding: "14px",
    marginBottom: "18px",
    borderRadius: "8px",
    background: "#fee2e2",
    color: "#991b1b",
  },
  success: {
    padding: "14px",
    marginBottom: "18px",
    borderRadius: "8px",
    background: "#dcfce7",
    color: "#166534",
  },
  layout: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: "24px",
    alignItems: "start",
  },
  productPanel: {
    minWidth: 0,
    padding: "22px",
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 3px 14px rgba(0,0,0,0.04)",
  },
  cartPanel: {
    minWidth: 0,
    padding: "22px",
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 3px 14px rgba(0,0,0,0.04)",
  },
  panelHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "21px",
  },
  countBadge: {
    padding: "5px 10px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  search: {
    width: "100%",
    padding: "13px",
    marginBottom: "22px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    boxSizing: "border-box",
    fontSize: "14px",
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(min(100%, 190px), 1fr))",
    gap: "16px",
  },
  productCard: {
    padding: "17px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    minWidth: 0,
  },
  productIcon: {
    display: "grid",
    placeItems: "center",
    width: "42px",
    height: "42px",
    background: "#f0fdf4",
    borderRadius: "10px",
    fontSize: "23px",
  },
  productName: {
    margin: "13px 0 5px",
    fontSize: "16px",
    overflowWrap: "anywhere",
  },
  category: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
  },
  price: {
    margin: "13px 0 5px",
    color: "#166534",
    fontSize: "16px",
    fontWeight: "700",
  },
  portionPrice: {
    margin: "4px 0 8px",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: "600",
  },
  stock: {
    margin: "0 0 14px",
    color: "#64748b",
    fontSize: "12px",
  },
  addButton: {
    width: "100%",
    marginTop: "auto",
    padding: "10px",
    border: "none",
    borderRadius: "7px",
    background: "#166534",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
  portionButton: {
    width: "100%",
    marginTop: "8px",
    padding: "10px",
    border: "1px solid #bfdbfe",
    borderRadius: "7px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: "600",
    cursor: "pointer",
  },
  disabledButton: {
    background: "#cbd5e1",
    color: "#64748b",
    cursor: "not-allowed",
  },
  emptyState: {
    padding: "40px 15px",
    textAlign: "center",
    color: "#64748b",
  },
  emptyCart: {
    padding: "38px 12px",
    textAlign: "center",
    color: "#64748b",
  },
  cartIcon: {
    fontSize: "38px",
  },
  cartItems: {
    maxHeight: "500px",
    overflowY: "auto",
  },
  cartItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "16px 0",
    borderBottom: "1px solid #e2e8f0",
  },
  cartItemInfo: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: 0,
  },
  cartItemName: {
    overflowWrap: "anywhere",
  },
  cartItemPrice: {
    color: "#166534",
    fontWeight: "600",
    fontSize: "13px",
  },
  smallLabel: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "600",
  },
  unitSelect: {
    width: "100%",
    padding: "9px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    background: "#fff",
    boxSizing: "border-box",
  },
  stockConsumption: {
    color: "#64748b",
    fontSize: "12px",
  },
  quantityControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  quantityButton: {
    width: "32px",
    height: "32px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    background: "#fff",
    cursor: "pointer",
    fontSize: "18px",
  },
  quantityInput: {
    width: "80px",
    minWidth: 0,
    padding: "7px 4px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    textAlign: "center",
    boxSizing: "border-box",
  },
  removeButton: {
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    color: "#dc2626",
    cursor: "pointer",
  },
  summary: {
    marginTop: "24px",
    paddingTop: "18px",
    borderTop: "1px solid #e2e8f0",
  },
  paymentLabel: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
  },
  paymentSelect: {
    width: "100%",
    padding: "12px",
    marginBottom: "20px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#fff",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  phoneSection: {
    marginBottom: "20px",
  },
  phoneInput: {
    width: "100%",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  phoneHint: {
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.5,
    marginBottom: 0,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "16px",
    color: "#64748b",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "22px",
    fontSize: "19px",
  },
  checkoutButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "#166534",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  clearButton: {
    width: "100%",
    marginTop: "10px",
    padding: "11px",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    background: "#fff",
    color: "#b91c1c",
    cursor: "pointer",
  },
  disabledClearButton: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  notice: {
    marginTop: "14px",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.5,
    textAlign: "center",
  },
};

export default CashierPOS;

