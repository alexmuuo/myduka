import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../api/api";

const styles = `
.md-cart {
  min-height: 75vh;
  padding: 42px 18px 75px;
  background: #f6f7fb;
  color: #172033;
}
.md-cart * { box-sizing: border-box; }
.md-cart a { text-decoration: none; }
.md-cart-container { width: min(1120px, 100%); margin: 0 auto; }
.md-cart-header { margin-bottom: 30px; }
.md-cart-eyebrow {
  color: #635bff;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}
.md-cart-heading {
  margin: 10px 0;
  color: #172033;
  font-size: clamp(30px, 5vw, 43px);
  font-weight: 850;
  letter-spacing: -1.5px;
}
.md-cart-subheading { margin: 0; color: #7b8798; font-size: 14px; }
.md-cart-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, .8fr);
  gap: 25px;
  align-items: start;
}
.md-cart-section-title {
  margin: 0;
  color: #172033;
  font-size: 16px;
  font-weight: 800;
}
.md-cart-count {
  padding: 6px 11px;
  border-radius: 30px;
  background: #eeedff;
  color: #635bff;
  font-size: 11px;
  font-weight: 800;
}
.md-cart-items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}
.md-cart-item {
  display: grid;
  grid-template-columns: 108px minmax(0, 1fr);
  gap: 18px;
  margin-bottom: 13px;
  padding: 17px;
  border: 1px solid #e7eaf0;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 5px 18px rgba(23,32,51,.035);
}
.md-cart-image-wrap {
  width: 108px;
  height: 120px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid #edf0f5;
  border-radius: 11px;
  background: #f8f9fc;
}
.md-cart-image { width: 100%; height: 100%; padding: 8px; object-fit: contain; }
.md-cart-image-placeholder { color: #b0b8c6; font-size: 30px; }
.md-cart-item-main { min-width: 0; }
.md-cart-item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.md-cart-category {
  margin-bottom: 5px;
  color: #8a93a3;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.md-cart-product-name {
  margin: 0;
  color: #172033;
  font-size: 16px;
  font-weight: 800;
  overflow-wrap: anywhere;
}
.md-cart-unit { margin-top: 5px; color: #8791a1; font-size: 12px; }
.md-cart-option {
  display: inline-flex;
  margin-top: 8px;
  padding: 5px 9px;
  border-radius: 6px;
  background: #f0efff;
  color: #635bff;
  font-size: 10px;
  font-weight: 800;
}
.md-cart-remove {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 7px 9px;
  border: 1px solid #f3dada;
  border-radius: 7px;
  background: #fff;
  color: #c44b4b;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
}
.md-cart-remove:hover { background: #fff3f3; }
.md-cart-item-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 15px;
  margin-top: 19px;
}
.md-cart-quantity-label {
  display: block;
  margin-bottom: 7px;
  color: #8992a2;
  font-size: 10px;
  font-weight: 750;
}
.md-cart-quantity {
  display: flex;
  align-items: center;
  height: 35px;
  overflow: hidden;
  border: 1px solid #e1e5ed;
  border-radius: 8px;
  background: #fff;
}
.md-cart-quantity button {
  width: 34px;
  height: 100%;
  border: 0;
  background: #f8f9fc;
  color: #344054;
  cursor: pointer;
  font-size: 17px;
}
.md-cart-quantity button:disabled { color: #c5cad3; cursor: not-allowed; }
.md-cart-quantity span {
  min-width: 35px;
  padding: 0 5px;
  color: #172033;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
}
.md-cart-line-total {
  color: #172033;
  font-size: 15px;
  font-weight: 850;
  text-align: right;
}
.md-cart-summary {
  position: sticky;
  top: 20px;
  overflow: hidden;
  border: 1px solid #e7eaf0;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 7px 24px rgba(23,32,51,.045);
}
.md-cart-summary-header {
  padding: 19px 21px;
  border-bottom: 1px solid #edf0f5;
}
.md-cart-summary-body { padding: 21px; }
.md-cart-summary-row {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 15px;
  color: #788395;
  font-size: 13px;
}
.md-cart-summary-row strong { color: #344054; font-weight: 750; text-align: right; }
.md-cart-summary-divider { border: 0; border-top: 1px solid #edf0f5; margin: 20px 0; }
.md-cart-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.md-cart-total-label { color: #172033; font-size: 14px; font-weight: 800; }
.md-cart-total-amount {
  color: #635bff;
  font-size: 22px;
  font-weight: 900;
  text-align: right;
}
.md-cart-checkout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  min-height: 50px;
  padding: 13px;
  border: 0;
  border-radius: 9px;
  background: #635bff;
  color: #fff !important;
  font-size: 13px;
  font-weight: 850;
  transition: .2s ease;
}
.md-cart-checkout:hover { background: #5148e5; transform: translateY(-1px); }
.md-cart-continue {
  display: block;
  margin-top: 15px;
  color: #7b8798;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}
.md-cart-continue:hover { color: #635bff; }
.md-cart-note {
  display: flex;
  gap: 10px;
  margin-top: 17px;
  padding: 12px;
  border-radius: 9px;
  background: #f5f6fa;
  color: #7b8798;
  font-size: 11px;
  line-height: 1.6;
}
.md-cart-note i { color: #635bff; font-size: 15px; }
.md-cart-empty {
  max-width: 620px;
  margin: 30px auto;
  padding: 55px 25px;
  border: 1px solid #e7eaf0;
  border-radius: 18px;
  background: #fff;
  text-align: center;
  box-shadow: 0 7px 25px rgba(23,32,51,.04);
}
.md-cart-empty-icon {
  width: 78px;
  height: 78px;
  display: grid;
  place-items: center;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: #f0efff;
  color: #635bff;
  font-size: 30px;
}
.md-cart-empty h2 { margin: 0 0 10px; color: #172033; font-size: 23px; font-weight: 850; }
.md-cart-empty p { max-width: 400px; margin: 0 auto 23px; color: #8791a1; font-size: 13px; line-height: 1.8; }
.md-cart-browse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 45px;
  padding: 11px 18px;
  border-radius: 9px;
  background: #635bff;
  color: #fff !important;
  font-size: 12px;
  font-weight: 800;
}
.md-cart-alert {
  margin-bottom: 15px;
  padding: 12px 14px;
  border: 1px solid #f2d1d1;
  border-radius: 9px;
  background: #fff4f4;
  color: #b64242;
  font-size: 12px;
  line-height: 1.6;
}
@media(max-width:850px) {
  .md-cart-layout { grid-template-columns: 1fr; }
  .md-cart-summary { position: static; }
}
@media(max-width:560px) {
  .md-cart { padding: 28px 13px 50px; }
  .md-cart-item { grid-template-columns: 78px minmax(0,1fr); gap: 12px; padding: 12px; }
  .md-cart-image-wrap { width: 78px; height: 95px; }
  .md-cart-item-top { flex-direction: column; gap: 8px; }
  .md-cart-product-name { font-size: 14px; }
  .md-cart-remove { padding: 6px 8px; }
  .md-cart-item-bottom { margin-top: 14px; gap: 8px; }
  .md-cart-line-total { font-size: 13px; }
  .md-cart-summary-body { padding: 18px; }
}
@media print {
  .md-cart { background: white; }
  .md-cart-summary, .md-cart-remove, .md-cart-continue { display: none; }
}
`;

function Cart() {
  const {
    cartItems,
    cartTotal,
    updateQuantity,
    removeFromCart,
    activeStoreSlug,
  } = useCart();

  const [failedImages, setFailedImages] = useState({});
  const [cartError, setCartError] = useState("");

  const storePath = activeStoreSlug
    ? `/store/${encodeURIComponent(activeStoreSlug)}`
    : "/";

  const formatPrice = (amount) =>
    `KSh ${Number(amount || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  const getImageUrl = (image) => {
    if (!image || typeof image !== "string") return "";

    const path = image.trim();
    if (/^(https?:\/\/|data:|blob:)/i.test(path)) return path;

    const baseURL = (api.defaults.baseURL || "/api").replace(/\/+$/, "");
    const backendBase = baseURL.replace(/\/api\/?$/, "");

    if (path.startsWith("/api/")) return `${backendBase}${path}`;
    if (path.startsWith("/product-images/")) return `${backendBase}/api${path}`;

    const filename = path.replace(/\\/g, "/").split("/").pop();
    return filename
      ? `${backendBase}/api/product-images/${encodeURIComponent(filename)}`
      : "";
  };

  const changeQuantity = (item, amount) => {
    const next = Number(item.quantity || 1) + amount;
    if (next < 1) return;

    const stockValue = item.available_quantity ?? item.stock;
    const stock = Number(stockValue);

    if (
      item.purchase_type !== "portion" &&
      stockValue !== undefined &&
      stockValue !== null &&
      stockValue !== "" &&
      Number.isFinite(stock) &&
      next > stock
    ) {
      setCartError(`Only ${stock} units of ${item.name} are currently available.`);
      return;
    }

    setCartError("");
    updateQuantity(item.id, next);
  };

  const handleRemove = (item) => {
    removeFromCart(item.id);
    setCartError("");
  };

  const itemCount = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  if (cartItems.length === 0) {
    return (
      <div className="md-cart">
        <style>{styles}</style>
        <div className="md-cart-container">
          <div className="md-cart-header">
            <div className="md-cart-eyebrow">Your selection</div>
            <h1 className="md-cart-heading">Shopping cart</h1>
            <p className="md-cart-subheading">
              Your shopping journey starts here.
            </p>
          </div>

          <section className="md-cart-empty">
            <div className="md-cart-empty-icon">
              <i className="bi bi-bag" aria-hidden="true"></i>
            </div>
            <h2>Your cart is empty</h2>
            <p>
              You haven't added anything yet. Explore this shop and find
              something you'll love.
            </p>
            <Link to={storePath} className="md-cart-browse">
              <i className="bi bi-shop"></i>
              Browse this shop
            </Link>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="md-cart">
      <style>{styles}</style>

      <div className="md-cart-container">
        <header className="md-cart-header">
          <div className="md-cart-eyebrow">Your selection</div>
          <h1 className="md-cart-heading">Shopping cart</h1>
          <p className="md-cart-subheading">
            Review your items before proceeding to checkout.
          </p>
        </header>

        <div className="md-cart-layout">
          <section aria-label="Items in your cart">
            <div className="md-cart-items-header">
              <h2 className="md-cart-section-title">Your items</h2>
              <span className="md-cart-count">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
            </div>

            {cartError && (
              <div className="md-cart-alert" role="alert">
                {cartError}
              </div>
            )}

            {cartItems.map((item) => {
              const imageUrl = getImageUrl(item.image);
              const imageFailed = failedImages[item.id] || !imageUrl;
              const quantity = Number(item.quantity) || 1;
              const price = Number(item.price) || 0;
              const lineTotal = quantity * price;
              const isPortion = item.purchase_type === "portion";

              return (
                <article className="md-cart-item" key={item.id}>
                  <div className="md-cart-image-wrap">
                    {imageFailed ? (
                      <i className="bi bi-image md-cart-image-placeholder"></i>
                    ) : (
                      <img
                        src={imageUrl}
                        alt={item.name || "Product"}
                        className="md-cart-image"
                        onError={() =>
                          setFailedImages((previous) => ({
                            ...previous,
                            [item.id]: true,
                          }))
                        }
                      />
                    )}
                  </div>

                  <div className="md-cart-item-main">
                    <div className="md-cart-item-top">
                      <div>
                        {item.category && (
                          <div className="md-cart-category">{item.category}</div>
                        )}
                        <h3 className="md-cart-product-name">{item.name}</h3>
                        <div className="md-cart-unit">
                          {formatPrice(price)} per {item.unit || "unit"}
                        </div>
                        <span className="md-cart-option">
                          {isPortion ? "Portion" : "Whole unit"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="md-cart-remove"
                        onClick={() => handleRemove(item)}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <i className="bi bi-trash3"></i>
                        Remove
                      </button>
                    </div>

                    <div className="md-cart-item-bottom">
                      <div>
                        <span className="md-cart-quantity-label">Quantity</span>
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
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="md-cart-line-total">
                        {formatPrice(lineTotal)}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="md-cart-summary">
            <div className="md-cart-summary-header">
              <h2 className="md-cart-section-title">Order summary</h2>
            </div>

            <div className="md-cart-summary-body">
              <div className="md-cart-summary-row">
                <span>Items</span>
                <strong>{itemCount}</strong>
              </div>

              <div className="md-cart-summary-row">
                <span>Subtotal</span>
                <strong>{formatPrice(cartTotal)}</strong>
              </div>

              <div className="md-cart-summary-row">
                <span>Delivery</span>
                <strong>Calculated at checkout</strong>
              </div>

              <hr className="md-cart-summary-divider" />

              <div className="md-cart-total-row">
                <span className="md-cart-total-label">Estimated total</span>
                <span className="md-cart-total-amount">
                  {formatPrice(cartTotal)}
                </span>
              </div>

              <Link to="/checkout" className="md-cart-checkout">
                Proceed to checkout
                <i className="bi bi-arrow-right"></i>
              </Link>

              <Link to={storePath} className="md-cart-continue">
                <i className="bi bi-arrow-left me-1"></i>
                Continue shopping
              </Link>

              <div className="md-cart-note">
                <i className="bi bi-shield-check"></i>
                <span>
                  Your order details will be confirmed by the shop during
                  checkout. Delivery charges, where applicable, are handled
                  separately.
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
