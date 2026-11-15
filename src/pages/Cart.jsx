import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const formatPrice = (amount, currency = "KES") => {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  } catch {
    return `${currency} ${Number(amount || 0).toLocaleString("en-KE")}`;
  }
};

const readableSlug = (slug = "") =>
  slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const styles = `
.md-cart {
  --cart-primary: #635bff;
  --cart-bg: #f6f7fb;
  --cart-surface: #ffffff;
  --cart-text: #172033;
  --cart-muted: #778397;
  --cart-border: #e7eaf0;
  min-height: 80vh;
  padding: 38px 18px 75px;
  background: var(--cart-bg);
  color: var(--cart-text);
}

.md-cart * { box-sizing: border-box; }

.md-cart button,
.md-cart input { font: inherit; }

.md-cart-inner {
  width: min(1160px, 100%);
  margin: auto;
}

.md-cart-header { margin-bottom: 32px; }

.md-cart-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--cart-primary);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.md-cart-title {
  margin: 12px 0 8px;
  font-size: clamp(30px, 5vw, 42px);
  font-weight: 850;
  letter-spacing: -1.5px;
  line-height: 1.15;
}

.md-cart-subtitle {
  margin: 0;
  color: var(--cart-muted);
  font-size: 14px;
  line-height: 1.7;
}

.md-cart-store {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 15px;
  padding: 8px 12px;
  border: 1px solid var(--cart-border);
  border-radius: 8px;
  background: white;
  color: #526071;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.md-cart-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(290px, .8fr);
  align-items: start;
  gap: 24px;
}

.md-cart-items-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.md-cart-items-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
}

.md-cart-count {
  padding: 6px 11px;
  border-radius: 30px;
  background: #eeedff;
  color: var(--cart-primary);
  font-size: 11px;
  font-weight: 800;
}

.md-cart-item {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 18px;
  margin-bottom: 13px;
  padding: 17px;
  border: 1px solid var(--cart-border);
  border-radius: 15px;
  background: var(--cart-surface);
}

.md-cart-image {
  display: grid;
  width: 112px;
  height: 125px;
  place-items: center;
  overflow: hidden;
  border-radius: 10px;
  background: #f1f3f8;
}

.md-cart-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.md-cart-image i {
  color: #aab3c1;
  font-size: 35px;
}

.md-cart-item-content { min-width: 0; }

.md-cart-item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.md-cart-category {
  display: block;
  margin-bottom: 6px;
  color: var(--cart-primary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .8px;
  text-transform: uppercase;
}

.md-cart-name {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.md-cart-meta {
  margin-top: 6px;
  color: var(--cart-muted);
  font-size: 12px;
}

.md-cart-variant {
  display: inline-flex;
  margin-top: 9px;
  padding: 5px 9px;
  border-radius: 6px;
  background: #f0efff;
  color: var(--cart-primary);
  font-size: 10px;
  font-weight: 800;
}

.md-cart-remove {
  flex-shrink: 0;
  padding: 7px 9px;
  border: 1px solid #f3d7dc;
  border-radius: 7px;
  background: #fff8f9;
  color: #d04455;
  cursor: pointer;
  font-size: 11px;
  font-weight: 750;
}

.md-cart-remove:hover { background: #fff0f2; }

.md-cart-item-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 15px;
  margin-top: 22px;
}

.md-cart-quantity-label {
  display: block;
  margin-bottom: 7px;
  color: var(--cart-muted);
  font-size: 11px;
  font-weight: 700;
}

.md-cart-quantity {
  display: flex;
  align-items: center;
  width: 125px;
  height: 38px;
  overflow: hidden;
  border: 1px solid var(--cart-border);
  border-radius: 8px;
  background: white;
}

.md-cart-quantity button {
  width: 36px;
  height: 100%;
  border: 0;
  background: transparent;
  color: var(--cart-text);
  cursor: pointer;
  font-size: 17px;
}

.md-cart-quantity button:hover:not(:disabled) {
  background: #f0efff;
  color: var(--cart-primary);
}

.md-cart-quantity button:disabled {
  color: #c5cbd5;
  cursor: not-allowed;
}

.md-cart-quantity span {
  flex: 1;
  text-align: center;
  font-size: 13px;
  font-weight: 800;
}

.md-cart-price-label {
  margin-bottom: 5px;
  color: var(--cart-muted);
  font-size: 11px;
  text-align: right;
}

.md-cart-line-total {
  color: var(--cart-text);
  font-size: 17px;
  font-weight: 850;
  text-align: right;
}

.md-cart-summary {
  position: sticky;
  top: 22px;
  overflow: hidden;
  border: 1px solid var(--cart-border);
  border-radius: 15px;
  background: white;
}

.md-cart-summary-header {
  padding: 21px;
  border-bottom: 1px solid var(--cart-border);
}

.md-cart-summary-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 850;
}

.md-cart-summary-body { padding: 21px; }

.md-cart-summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 17px;
  color: var(--cart-muted);
  font-size: 13px;
}

.md-cart-summary-row strong {
  color: var(--cart-text);
  font-weight: 800;
}

.md-cart-divider {
  height: 1px;
  margin: 21px 0;
  border: 0;
  background: var(--cart-border);
}

.md-cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 22px;
}

.md-cart-total span:first-child {
  font-size: 14px;
  font-weight: 800;
}

.md-cart-total strong {
  color: var(--cart-primary);
  font-size: 22px;
  font-weight: 900;
  text-align: right;
}

.md-cart-checkout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 51px;
  border: 0;
  border-radius: 10px;
  background: var(--cart-primary);
  color: white;
  font-size: 13px;
  font-weight: 850;
  text-decoration: none;
  transition: filter .2s, transform .2s;
}

.md-cart-checkout:hover {
  color: white;
  filter: brightness(.94);
  transform: translateY(-1px);
}

.md-cart-continue {
  display: block;
  margin-top: 17px;
  color: var(--cart-primary);
  font-size: 12px;
  font-weight: 750;
  text-align: center;
  text-decoration: none;
}

.md-cart-note {
  margin-top: 19px;
  padding: 12px;
  border-radius: 9px;
  background: #f7f8fc;
  color: var(--cart-muted);
  font-size: 11px;
  line-height: 1.7;
}

.md-cart-empty {
  max-width: 650px;
  margin: 35px auto;
  padding: 55px 25px;
  border: 1px solid var(--cart-border);
  border-radius: 17px;
  background: white;
  text-align: center;
}

.md-cart-empty-icon {
  display: grid;
  width: 76px;
  height: 76px;
  margin: 0 auto 20px;
  place-items: center;
  border-radius: 20px;
  background: #f0efff;
  color: var(--cart-primary);
  font-size: 32px;
}

.md-cart-empty h2 {
  margin: 0 0 9px;
  font-size: 23px;
  font-weight: 850;
}

.md-cart-empty p {
  max-width: 400px;
  margin: 0 auto 23px;
  color: var(--cart-muted);
  font-size: 13px;
  line-height: 1.8;
}

.md-cart-browse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px 19px;
  border-radius: 9px;
  background: var(--cart-primary);
  color: white;
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
}

.md-cart-browse:hover { color: white; filter: brightness(.95); }

@media (max-width: 850px) {
  .md-cart-layout { grid-template-columns: 1fr; }
  .md-cart-summary { position: static; }
}

@media (max-width: 540px) {
  .md-cart { padding: 25px 13px 48px; }
  .md-cart-item {
    grid-template-columns: 78px minmax(0, 1fr);
    gap: 12px;
    padding: 12px;
  }
  .md-cart-image { width: 78px; height: 95px; }
  .md-cart-item-top { flex-direction: column; }
  .md-cart-remove { align-self: flex-start; }
  .md-cart-name { font-size: 14px; }
  .md-cart-item-bottom { gap: 8px; margin-top: 15px; }
  .md-cart-quantity { width: 108px; }
  .md-cart-line-total { font-size: 14px; }
  .md-cart-summary-body,
  .md-cart-summary-header { padding: 17px; }
}
`;

export default function Cart() {
  const {
    cartItems,
    cartTotal,
    updateQuantity,
    removeFromCart,
    activeStoreSlug,
  } = useCart();

  const [failedImages, setFailedImages] = useState({});

  const storePath = activeStoreSlug
    ? `/store/${encodeURIComponent(activeStoreSlug)}`
    : "/";

  const storeName = readableSlug(activeStoreSlug) || "Online Store";

  const itemCount = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const currency = cartItems.find((item) => item.currency)?.currency || "KES";

  const changeQuantity = (item, amount) => {
    const nextQuantity = Number(item.quantity || 1) + amount;

    if (nextQuantity < 1) return;

    const stockValue = item.available_quantity ?? item.stock;

    if (stockValue !== undefined && stockValue !== null && stockValue !== "") {
      const stock = Number(stockValue);

      if (Number.isFinite(stock) && nextQuantity > stock) return;
    }

    updateQuantity(item.id, nextQuantity);
  };

  const getPurchaseLabel = (item) => {
    if (item.purchase_type === "portion") {
      return "Portion";
    }

    return item.cart_label || "Whole unit";
  };

  return (
    <main className="md-cart">
      <style>{styles}</style>

      <div className="md-cart-inner">
        <header className="md-cart-header">
          <div className="md-cart-eyebrow">
            <i className="bi bi-bag-check" />
            Your shopping bag
          </div>

          <h1 className="md-cart-title">Shopping cart</h1>

          <p className="md-cart-subtitle">
            Review your items and quantities before proceeding to checkout.
          </p>

          {activeStoreSlug && (
            <Link to={storePath} className="md-cart-store">
              <i className="bi bi-shop" />
              Shopping from {storeName}
            </Link>
          )}
        </header>

        {cartItems.length === 0 ? (
          <section className="md-cart-empty">
            <div className="md-cart-empty-icon">
              <i className="bi bi-bag" />
            </div>

            <h2>Your cart is empty</h2>

            <p>
              You haven't added anything yet. Browse this store and find
              something you'd like to order.
            </p>

            <Link to={storePath} className="md-cart-browse">
              <i className="bi bi-shop" />
              Continue shopping
            </Link>
          </section>
        ) : (
          <div className="md-cart-layout">
            <section aria-label="Shopping cart items">
              <div className="md-cart-items-header">
                <h2>Your items</h2>
                <span className="md-cart-count">
                  {itemCount} item{itemCount === 1 ? "" : "s"}
                </span>
              </div>

              {cartItems.map((item) => {
                const quantity = Number(item.quantity || 1);
                const price = Number(item.price || 0);
                const image = typeof item.image === "string" ? item.image : "";
                const imageFailed = failedImages[item.id] || !image;

                const stockValue = item.available_quantity ?? item.stock;
                const hasStockLimit =
                  stockValue !== undefined &&
                  stockValue !== null &&
                  stockValue !== "" &&
                  Number.isFinite(Number(stockValue));

                return (
                  <article className="md-cart-item" key={item.id}>
                    <div className="md-cart-image">
                      {imageFailed ? (
                        <i className="bi bi-image" aria-hidden="true" />
                      ) : (
                        <img
                          src={image}
                          alt={item.name || "Product"}
                          onError={() =>
                            setFailedImages((previous) => ({
                              ...previous,
                              [item.id]: true,
                            }))
                          }
                        />
                      )}
                    </div>

                    <div className="md-cart-item-content">
                      <div className="md-cart-item-top">
                        <div>
                          <span className="md-cart-category">
                            {item.category || "Product"}
                          </span>

                          <h3 className="md-cart-name">
                            {item.name || "Unnamed product"}
                          </h3>

                          {item.unit && (
                            <div className="md-cart-meta">
                              Sold by {item.unit}
                            </div>
                          )}

                          <span className="md-cart-variant">
                            {getPurchaseLabel(item)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="md-cart-remove"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <i className="bi bi-trash3" /> Remove
                        </button>
                      </div>

                      <div className="md-cart-item-bottom">
                        <div>
                          <span className="md-cart-quantity-label">
                            Quantity
                          </span>

                          <div className="md-cart-quantity">
                            <button
                              type="button"
                              onClick={() => changeQuantity(item, -1)}
                              disabled={quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>

                            <span>{quantity}</span>

                            <button
                              type="button"
                              onClick={() => changeQuantity(item, 1)}
                              disabled={
                                hasStockLimit &&
                                quantity >= Number(stockValue)
                              }
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="md-cart-price-label">
                            {formatPrice(price, currency)} each
                          </div>

                          <div className="md-cart-line-total">
                            {formatPrice(price * quantity, currency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              <Link to={storePath} className="md-cart-continue">
                <i className="bi bi-arrow-left" /> Continue shopping
              </Link>
            </section>

            <aside className="md-cart-summary">
              <div className="md-cart-summary-header">
                <h2>Order summary</h2>
              </div>

              <div className="md-cart-summary-body">
                <div className="md-cart-summary-row">
                  <span>Items ({itemCount})</span>
                  <strong>{formatPrice(cartTotal, currency)}</strong>
                </div>

                <div className="md-cart-summary-row">
                  <span>Delivery</span>
                  <span>Calculated at checkout</span>
                </div>

                <hr className="md-cart-divider" />

                <div className="md-cart-total">
                  <span>Subtotal</span>
                  <strong>{formatPrice(cartTotal, currency)}</strong>
                </div>

                <Link to="/checkout" className="md-cart-checkout">
                  Proceed to checkout
                  <i className="bi bi-arrow-right" />
                </Link>

                <div className="md-cart-note">
                  Delivery charges and final order details will be confirmed
                  during checkout.
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
