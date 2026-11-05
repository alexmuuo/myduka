import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../api/api";

const styles = `
  .hm-cart-page {
    --hm-bg: #171d19;
    --hm-panel: #202923;
    --hm-panel-light: #28342b;
    --hm-green: #326747;
    --hm-gold: #d6b36a;
    --hm-cream: #f7f5ef;
    --hm-muted: #a8b2a9;
    --hm-border: rgba(255,255,255,.10);
    min-height: 75vh;
    padding: 42px 0 76px;
    background: var(--hm-bg);
    color: var(--hm-cream);
  }

  .hm-cart-page *,
  .hm-cart-page *::before,
  .hm-cart-page *::after {
    box-sizing: border-box;
  }

  .hm-cart-page a {
    text-decoration: none;
  }

  .hm-cart-container {
    width: min(1160px, calc(100% - 40px));
    margin: 0 auto;
  }

  .hm-cart-eyebrow {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--hm-gold);
    font-size: .75rem;
    font-weight: 800;
    letter-spacing: 2.5px;
    text-transform: uppercase;
  }

  .hm-cart-eyebrow::before {
    content: "";
    width: 28px;
    height: 1px;
    background: var(--hm-gold);
  }

  .hm-cart-heading {
    margin: 14px 0 10px;
    color: var(--hm-cream);
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(2.4rem, 5vw, 3.6rem);
    font-weight: 600;
    line-height: 1.1;
  }

  .hm-cart-subheading {
    margin: 0;
    color: var(--hm-muted);
    font-size: .98rem;
    line-height: 1.7;
  }

  .hm-cart-header {
    margin-bottom: 36px;
  }

  .hm-cart-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(290px, .8fr);
    gap: 28px;
    align-items: start;
  }

  .hm-cart-items-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 17px;
  }

  .hm-cart-items-title {
    margin: 0;
    color: var(--hm-cream);
    font-size: 1.15rem;
    font-weight: 750;
  }

  .hm-cart-item-count {
    padding: 6px 11px;
    border: 1px solid rgba(251, 191, 36,.25);
    border-radius: 999px;
    background: rgba(251, 191, 36,.07);
    color: var(--hm-gold);
    font-size: .78rem;
    font-weight: 750;
    white-space: nowrap;
  }

  .hm-cart-item {
    display: grid;
    grid-template-columns: 116px minmax(0, 1fr);
    gap: 20px;
    margin-bottom: 15px;
    padding: 20px;
    border: 1px solid var(--hm-border);
    border-radius: 16px;
    background: var(--hm-panel);
    transition: border-color .2s ease, transform .2s ease;
  }

  .hm-cart-item:hover {
    border-color: rgba(251, 191, 36,.32);
  }

  .hm-cart-image-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 116px;
    height: 132px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.06);
    border-radius: 11px;
    background:
      radial-gradient(ellipse at center, rgba(251, 191, 36,.09), transparent 70%),
      #1a211c;
  }

  .hm-cart-image {
    display: block;
    width: 100%;
    height: 100%;
    padding: 9px;
    object-fit: contain;
  }

  .hm-cart-image-placeholder {
    display: grid;
    width: 100%;
    height: 100%;
    place-items: center;
    color: var(--hm-gold);
    font-size: 2rem;
  }

  .hm-cart-item-main {
    min-width: 0;
  }

  .hm-cart-item-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .hm-cart-category {
    display: inline-block;
    margin-bottom: 7px;
    color: var(--hm-gold);
    font-size: .73rem;
    font-weight: 750;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .hm-cart-product-name {
    margin: 0;
    color: var(--hm-cream);
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1.35rem;
    font-weight: 600;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .hm-cart-unit {
    margin-top: 6px;
    color: var(--hm-muted);
    font-size: .84rem;
  }

  .hm-cart-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-shrink: 0;
    padding: 7px 9px;
    border: 1px solid rgba(255,125,125,.22);
    border-radius: 8px;
    background: rgba(255,100,100,.05);
    color: #ffaaaa;
    cursor: pointer;
    font-size: .8rem;
    transition: background .2s ease, border-color .2s ease;
  }

  .hm-cart-remove:hover {
    border-color: rgba(255,125,125,.5);
    background: rgba(255,100,100,.13);
  }

  .hm-cart-item-bottom {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 18px;
    margin-top: 22px;
  }

  .hm-cart-quantity-label {
    display: block;
    margin-bottom: 8px;
    color: var(--hm-muted);
    font-size: .78rem;
    font-weight: 650;
  }

  .hm-cart-quantity-control {
    display: flex;
    width: 130px;
    height: 39px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.15);
    border-radius: 8px;
    background: #1a211c;
  }

  .hm-cart-quantity-control button {
    display: grid;
    width: 36px;
    flex: 0 0 36px;
    place-items: center;
    border: 0;
    background: transparent;
    color: var(--hm-cream);
    cursor: pointer;
    font-size: 1.1rem;
    transition: background .2s ease;
  }

  .hm-cart-quantity-control button:hover:not(:disabled) {
    background: var(--hm-green);
  }

  .hm-cart-quantity-control button:disabled {
    color: #687169;
    cursor: not-allowed;
  }

  .hm-cart-quantity-value {
    display: grid;
    min-width: 0;
    flex: 1;
    place-items: center;
    border-right: 1px solid var(--hm-border);
    border-left: 1px solid var(--hm-border);
    color: var(--hm-cream);
    font-size: .9rem;
    font-weight: 750;
  }

  .hm-cart-price-label {
    margin-bottom: 5px;
    color: var(--hm-muted);
    font-size: .76rem;
    text-align: right;
  }

  .hm-cart-line-total {
    color: var(--hm-gold);
    font-size: 1.22rem;
    font-weight: 800;
    text-align: right;
    white-space: nowrap;
  }

  .hm-cart-unit-price {
    margin-top: 4px;
    color: var(--hm-muted);
    font-size: .77rem;
    text-align: right;
  }

  .hm-cart-summary {
    position: sticky;
    top: 24px;
    overflow: hidden;
    border: 1px solid rgba(251, 191, 36,.24);
    border-radius: 16px;
    background: var(--hm-panel);
  }

  .hm-cart-summary-header {
    padding: 23px 24px 19px;
    border-bottom: 1px solid var(--hm-border);
    background: linear-gradient(135deg, rgba(251, 191, 36,.07), transparent);
  }

  .hm-cart-summary-title {
    margin: 0;
    color: var(--hm-cream);
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1.55rem;
    font-weight: 600;
  }

  .hm-cart-summary-body {
    padding: 24px;
  }

  .hm-cart-summary-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 19px;
    color: var(--hm-muted);
    font-size: .9rem;
  }

  .hm-cart-summary-row strong {
    color: var(--hm-cream);
    font-weight: 700;
    text-align: right;
  }

  .hm-cart-summary-delivery {
    max-width: 145px;
    color: var(--hm-muted);
    font-size: .78rem;
    line-height: 1.6;
    text-align: right;
  }

  .hm-cart-summary-divider {
    height: 1px;
    margin: 22px 0;
    border: 0;
    background: var(--hm-border);
  }

  .hm-cart-total-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 23px;
  }

  .hm-cart-total-label {
    color: var(--hm-cream);
    font-size: 1rem;
    font-weight: 750;
  }

  .hm-cart-total-amount {
    color: var(--hm-gold);
    font-size: 1.65rem;
    font-weight: 850;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .hm-cart-checkout-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
    width: 100%;
    min-height: 53px;
    padding: 14px 17px;
    border: 1px solid var(--hm-gold);
    border-radius: 9px;
    background: var(--hm-gold);
    color: #1b241e !important;
    font-size: .92rem;
    font-weight: 850;
    transition: transform .2s ease, background .2s ease;
  }

  .hm-cart-checkout-button:hover {
    transform: translateY(-2px);
    background: #ecd39a;
  }

  .hm-cart-continue {
    display: block;
    margin-top: 18px;
    color: var(--hm-muted);
    font-size: .86rem;
    font-weight: 650;
    text-align: center;
    transition: color .2s ease;
  }

  .hm-cart-continue:hover {
    color: var(--hm-gold);
  }

  .hm-cart-note {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 21px;
    padding: 14px;
    border: 1px solid var(--hm-border);
    border-radius: 10px;
    background: rgba(255,255,255,.02);
    color: var(--hm-muted);
    font-size: .77rem;
    line-height: 1.65;
  }

  .hm-cart-note-icon {
    color: var(--hm-gold);
    font-size: 1.05rem;
  }

  .hm-cart-empty {
    max-width: 650px;
    margin: 0 auto;
    padding: 45px 25px;
    border: 1px solid var(--hm-border);
    border-radius: 20px;
    background:
      radial-gradient(ellipse at top, rgba(251, 191, 36,.07), transparent 65%),
      var(--hm-panel);
    text-align: center;
  }

  .hm-cart-empty-icon {
    display: grid;
    width: 90px;
    height: 90px;
    margin: 0 auto 25px;
    place-items: center;
    border: 1px solid rgba(251, 191, 36,.25);
    border-radius: 50%;
    background: rgba(251, 191, 36,.07);
    color: var(--hm-gold);
    font-size: 2.5rem;
  }

  .hm-cart-empty h2 {
    margin: 0 0 12px;
    color: var(--hm-cream);
    font-family: Georgia, "Times New Roman", serif;
    font-size: 2.2rem;
    font-weight: 600;
  }

  .hm-cart-empty p {
    margin: 0 auto 26px;
    color: var(--hm-muted);
    line-height: 1.8;
  }

  .hm-cart-browse-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 49px;
    padding: 13px 22px;
    border: 1px solid var(--hm-gold);
    border-radius: 9px;
    background: var(--hm-gold);
    color: #1b241e !important;
    font-size: .9rem;
    font-weight: 800;
    transition: background .2s ease, transform .2s ease;
  }

  .hm-cart-browse-button:hover {
    transform: translateY(-2px);
    background: #ecd39a;
  }

  .hm-cart-alert {
    margin-bottom: 18px;
    padding: 13px 15px;
    border: 1px solid rgba(255,125,125,.25);
    border-radius: 10px;
    background: rgba(255,100,100,.07);
    color: #ffb6b6;
    font-size: .87rem;
    line-height: 1.6;
  }

  @media (max-width: 900px) {
    .hm-cart-layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .hm-cart-summary {
      position: static;
    }

    .hm-cart-summary-body {
      padding: 22px;
    }
  }

  @media (max-width: 560px) {
    .hm-cart-page {
      padding: 28px 0 48px;
    }

    .hm-cart-container {
      width: calc(100% - 28px);
    }

    .hm-cart-header {
      margin-bottom: 27px;
    }

    .hm-cart-heading {
      font-size: 2.65rem;
    }

    .hm-cart-subheading {
      font-size: .9rem;
    }

    .hm-cart-item {
      grid-template-columns: 82px minmax(0, 1fr);
      gap: 13px;
      padding: 13px;
      border-radius: 12px;
    }

    .hm-cart-image-wrap {
      width: 82px;
      height: 105px;
    }

    .hm-cart-image {
      padding: 5px;
    }

    .hm-cart-item-top {
      flex-direction: column;
      gap: 9px;
    }

    .hm-cart-product-name {
      font-size: 1.1rem;
    }

    .hm-cart-category {
      margin-bottom: 5px;
      font-size: .66rem;
    }

    .hm-cart-unit {
      font-size: .78rem;
    }

    .hm-cart-remove {
      padding: 6px 8px;
      font-size: .74rem;
    }

    .hm-cart-item-bottom {
      grid-column: 1 / -1;
      align-items: flex-end;
      gap: 10px;
      margin-top: 17px;
    }

    .hm-cart-quantity-control {
      width: 116px;
    }

    .hm-cart-line-total {
      font-size: 1.05rem;
    }

    .hm-cart-summary-header {
      padding: 20px;
    }

    .hm-cart-summary-body {
      padding: 20px;
    }

    .hm-cart-total-amount {
      font-size: 1.4rem;
    }

    .hm-cart-empty {
      padding: 36px 18px;
    }

    .hm-cart-empty h2 {
      font-size: 1.8rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hm-cart-page *,
    .hm-cart-page *::before,
    .hm-cart-page *::after {
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: .01ms !important;
    }
  }
`;

function Cart() {
  const {
    cartItems,
    cartTotal,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const [failedImages, setFailedImages] = useState({});
  const [cartError, setCartError] = useState("");

  const formatPrice = (amount) =>
    `KSh ${Number(amount || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  const getImageUrl = (image) => {
    if (!image || typeof image !== "string" || !image.trim()) {
      return "";
    }

    const imagePath = image.trim();

    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }

    const baseURL = (api.defaults.baseURL || "").replace(/\/+$/, "");
    const backendBaseURL = baseURL.replace(/\/api\/?$/, "");

    if (imagePath.startsWith("/api/")) {
      return `${backendBaseURL}${imagePath}`;
    }

    if (imagePath.startsWith("/product-images/")) {
      return `${backendBaseURL}/api${imagePath}`;
    }

    const filename = imagePath.replace(/\\/g, "/").split("/").pop();

    if (!filename) {
      return "";
    }

    return `${backendBaseURL}/api/product-images/${encodeURIComponent(filename)}`;
  };

  const handleQuantityChange = (item, value) => {
    const requestedQuantity = Number(value);
    const stock = Number(item.stock);

    if (
      value === "" ||
      !Number.isFinite(requestedQuantity) ||
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1
    ) {
      return;
    }

    if (Number.isFinite(stock) && stock >= 0 && requestedQuantity > stock) {
      setCartError(
        `Only ${stock} unit${stock === 1 ? "" : "s"} of ${item.name} currently available.`
      );
      updateQuantity(item.id, String(Math.max(1, stock)));
      return;
    }

    setCartError("");
    updateQuantity(item.id, String(requestedQuantity));
  };

  const changeQuantity = (item, amount) => {
    const currentQuantity = Number(item.quantity) || 1;
    const stock = Number(item.stock);
    const nextQuantity = currentQuantity + amount;

    if (nextQuantity < 1) {
      return;
    }

    if (Number.isFinite(stock) && stock >= 0 && nextQuantity > stock) {
      setCartError(
        `Only ${stock} unit${stock === 1 ? "" : "s"} of ${item.name} currently available.`
      );
      return;
    }

    setCartError("");
    updateQuantity(item.id, String(nextQuantity));
  };

  const handleRemove = (item) => {
    removeFromCart(item.id);
    setCartError("");
  };

  const itemCount = cartItems.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0
  );

  if (cartItems.length === 0) {
    return (
      <div className="hm-cart-page">
        <style>{styles}</style>

        <div className="hm-cart-container">
          <div className="hm-cart-header">
            <div className="hm-cart-eyebrow">Your selection</div>
            <h1 className="hm-cart-heading">Shopping cart</h1>
            <p className="hm-cart-subheading">
              Your next favourite is waiting to be discovered.
            </p>
          </div>

          <section className="hm-cart-empty">
            <div className="hm-cart-empty-icon" aria-hidden="true">
              ♧
            </div>

            <h2>Your cart is empty</h2>

            <p>
              You haven't added anything just yet. Explore our collection
              and find something worth sharing.
            </p>

            <Link to="/products" className="hm-cart-browse-button">
              Browse the collection
              <span aria-hidden="true">→</span>
            </Link>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="hm-cart-page">
      <style>{styles}</style>

      <div className="hm-cart-container">
        <header className="hm-cart-header">
          <div className="hm-cart-eyebrow">Your selection</div>

          <h1 className="hm-cart-heading">Shopping cart</h1>

          <p className="hm-cart-subheading">
            Review your selection before moving to checkout.
          </p>
        </header>

        <div className="hm-cart-layout">
          <section aria-label="Items in your cart">
            <div className="hm-cart-items-header">
              <h2 className="hm-cart-items-title">Your items</h2>

              <span className="hm-cart-item-count">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
            </div>

            {cartError && (
              <div className="hm-cart-alert" role="alert">
                {cartError}
              </div>
            )}

            {cartItems.map((item) => {
              const imageUrl = getImageUrl(item.image);
              const imageFailed = failedImages[item.id] || !imageUrl;
              const quantity = Number(item.quantity) || 1;
              const price = Number(item.price) || 0;
              const stock = Number(item.stock);
              const hasStockLimit = Number.isFinite(stock) && stock >= 0;

              return (
                <article className="hm-cart-item" key={item.id}>
                  <div className="hm-cart-image-wrap">
                    {imageFailed ? (
                      <div
                        className="hm-cart-image-placeholder"
                        aria-label="Product image unavailable"
                        role="img"
                      >
                        ◈
                      </div>
                    ) : (
                      <img
                        src={imageUrl}
                        alt={item.name || "Product"}
                        className="hm-cart-image"
                        onError={() =>
                          setFailedImages((previous) => ({
                            ...previous,
                            [item.id]: true,
                          }))
                        }
                      />
                    )}
                  </div>

                  <div className="hm-cart-item-main">
                    <div className="hm-cart-item-top">
                      <div>
                        {item.category && (
                          <div className="hm-cart-category">
                            {item.category}
                          </div>
                        )}

                        <h3 className="hm-cart-product-name">
                          {item.name}
                        </h3>

                        {item.unit && (
                          <div className="hm-cart-unit">
                            {item.unit}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="hm-cart-remove"
                        onClick={() => handleRemove(item)}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <span aria-hidden="true">×</span>
                        Remove
                      </button>
                    </div>

                    <div className="hm-cart-item-bottom">
                      <div>
                        <label
                          className="hm-cart-quantity-label"
                          htmlFor={`cart-quantity-${item.id}`}
                        >
                          Quantity
                        </label>

                        <div className="hm-cart-quantity-control">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.name}`}
                            disabled={quantity <= 1}
                            onClick={() => changeQuantity(item, -1)}
                          >
                            −
                          </button>

                          <span
                            className="hm-cart-quantity-value"
                            id={`cart-quantity-${item.id}`}
                            aria-live="polite"
                          >
                            {quantity}
                          </span>

                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.name}`}
                            disabled={hasStockLimit && quantity >= stock}
                            onClick={() => changeQuantity(item, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="hm-cart-price-label">
                          {formatPrice(price)} each
                        </div>

                        <div className="hm-cart-line-total">
                          {formatPrice(price * quantity)}
                        </div>

                        <div className="hm-cart-unit-price">
                          Item subtotal
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            <Link to="/products" className="hm-cart-continue">
              <span aria-hidden="true">←</span> Continue shopping
            </Link>
          </section>

          <aside
            className="hm-cart-summary"
            aria-label="Order summary"
          >
            <div className="hm-cart-summary-header">
              <h2 className="hm-cart-summary-title">Order summary</h2>
            </div>

            <div className="hm-cart-summary-body">
              <div className="hm-cart-summary-row">
                <span>Items ({itemCount})</span>
                <strong>{formatPrice(cartTotal)}</strong>
              </div>

              <div className="hm-cart-summary-row">
                <span>Delivery</span>
                <span className="hm-cart-summary-delivery">
                  Calculated at checkout
                </span>
              </div>

              <hr className="hm-cart-summary-divider" />

              <div className="hm-cart-total-row">
                <span className="hm-cart-total-label">Subtotal</span>
                <span className="hm-cart-total-amount">
                  {formatPrice(cartTotal)}
                </span>
              </div>

              <Link
                to="/checkout"
                className="hm-cart-checkout-button"
              >
                Proceed to checkout
                <span aria-hidden="true">→</span>
              </Link>

              <div className="hm-cart-note">
                <span className="hm-cart-note-icon" aria-hidden="true">
                  ◈
                </span>

                <span>
                  Your final delivery charges and order details will be
                  confirmed during checkout.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Cart;

