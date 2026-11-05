import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/api";
import { useCart } from "../context/CartContext";

const styles = `
  .hm-product-page {
    --hm-ink: #171d19;
    --hm-panel: #202923;
    --hm-panel-light: #28342b;
    --hm-green: #234c35;
    --hm-green-light: #326747;
    --hm-gold: #d6b36a;
    --hm-cream: #f7f5ef;
    --hm-muted: #a8b2a9;
    --hm-border: rgba(255,255,255,.10);
    background: var(--hm-ink);
    color: var(--hm-cream);
    min-height: 75vh;
    padding: 36px 0 76px;
  }

  .hm-product-page * {
    box-sizing: border-box;
  }

  .hm-product-page button,
  .hm-product-page input {
    font: inherit;
  }

  .hm-product-container {
    width: min(1160px, calc(100% - 40px));
    margin: 0 auto;
  }

  .hm-product-breadcrumb {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 30px;
    color: var(--hm-muted);
    font-size: .9rem;
  }

  .hm-product-breadcrumb a {
    color: var(--hm-gold);
    text-decoration: none;
    transition: color .2s ease;
  }

  .hm-product-breadcrumb a:hover {
    color: #f0d79c;
  }

  .hm-product-breadcrumb-separator {
    color: #657168;
  }

  .hm-product-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr);
    gap: 54px;
    align-items: start;
  }

  .hm-product-gallery {
    position: sticky;
    top: 28px;
  }

  .hm-product-image-frame {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 500px;
    padding: 35px;
    overflow: hidden;
    border: 1px solid var(--hm-border);
    border-radius: 22px;
    background:
      radial-gradient(
        ellipse at 50% 42%,
        rgba(251, 191, 36,.10),
        transparent 58%
      ),
      linear-gradient(145deg, #26332a, #1b221d 70%);
  }

  .hm-product-image-frame::before {
    content: "";
    position: absolute;
    width: 270px;
    height: 270px;
    border: 1px solid rgba(251, 191, 36,.12);
    border-radius: 50%;
    pointer-events: none;
  }

  .hm-product-image-frame::after {
    content: "";
    position: absolute;
    width: 210px;
    height: 210px;
    border: 1px solid rgba(251, 191, 36,.08);
    border-radius: 50%;
    pointer-events: none;
  }

  .hm-product-image {
    position: relative;
    z-index: 1;
    display: block;
    width: 100%;
    height: 420px;
    object-fit: contain;
    transition: transform .35s ease;
  }

  .hm-product-image-frame:hover .hm-product-image {
    transform: scale(1.035);
  }

  .hm-product-image-caption {
    margin-top: 15px;
    color: var(--hm-muted);
    font-size: .83rem;
    text-align: center;
  }

  .hm-product-details {
    padding: 8px 0;
  }

  .hm-product-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 20px;
    color: var(--hm-gold);
    font-size: .76rem;
    font-weight: 800;
    letter-spacing: 2.5px;
    text-transform: uppercase;
  }

  .hm-product-eyebrow::before {
    content: "";
    width: 27px;
    height: 1px;
    background: var(--hm-gold);
  }

  .hm-product-category {
    display: inline-block;
    margin-bottom: 15px;
    padding: 7px 12px;
    border: 1px solid rgba(251, 191, 36,.25);
    border-radius: 999px;
    background: rgba(251, 191, 36,.07);
    color: var(--hm-gold);
    font-size: .8rem;
    font-weight: 650;
  }

  .hm-product-title {
    margin: 0;
    color: var(--hm-cream);
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(2.1rem, 4vw, 3.35rem);
    font-weight: 600;
    line-height: 1.12;
    overflow-wrap: anywhere;
  }

  .hm-product-price-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 24px;
  }

  .hm-product-price {
    color: var(--hm-gold);
    font-size: clamp(1.8rem, 3vw, 2.35rem);
    font-weight: 800;
    letter-spacing: -.7px;
    line-height: 1.2;
  }

  .hm-product-unit {
    color: var(--hm-muted);
    font-size: .95rem;
  }

  .hm-product-divider {
    height: 1px;
    margin: 26px 0;
    border: 0;
    background: var(--hm-border);
  }

  .hm-product-description-label {
    margin-bottom: 10px;
    color: var(--hm-cream);
    font-size: .95rem;
    font-weight: 750;
  }

  .hm-product-description {
    margin: 0;
    color: #bac3bb;
    font-size: .98rem;
    line-height: 1.9;
    overflow-wrap: anywhere;
    white-space: pre-line;
  }

  .hm-stock-status {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 25px;
    padding: 15px 16px;
    border: 1px solid var(--hm-border);
    border-radius: 12px;
    background: rgba(255,255,255,.025);
  }

  .hm-stock-indicator {
    display: grid;
    width: 39px;
    height: 39px;
    flex: 0 0 39px;
    place-items: center;
    border-radius: 50%;
    font-size: 1.1rem;
    font-weight: 800;
  }

  .hm-stock-available .hm-stock-indicator {
    background: rgba(85,175,112,.13);
    color: #8cdda1;
  }

  .hm-stock-unavailable .hm-stock-indicator {
    background: rgba(220,90,90,.12);
    color: #ff9999;
  }

  .hm-stock-title {
    margin: 0 0 3px;
    color: var(--hm-cream);
    font-size: .9rem;
    font-weight: 750;
  }

  .hm-stock-subtitle {
    margin: 0;
    color: var(--hm-muted);
    font-size: .8rem;
    line-height: 1.5;
  }

  .hm-product-purchase {
    margin-top: 28px;
  }

  .hm-quantity-label {
    display: block;
    margin-bottom: 11px;
    color: var(--hm-cream);
    font-size: .9rem;
    font-weight: 750;
  }

  .hm-quantity-control {
    display: flex;
    width: 180px;
    max-width: 100%;
    height: 49px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.16);
    border-radius: 10px;
    background: #1d251f;
  }

  .hm-quantity-button {
    display: grid;
    width: 48px;
    flex: 0 0 48px;
    place-items: center;
    border: 0;
    background: transparent;
    color: var(--hm-cream);
    cursor: pointer;
    font-size: 1.35rem !important;
    transition: background .2s ease, color .2s ease;
  }

  .hm-quantity-button:hover:not(:disabled) {
    background: var(--hm-green);
    color: white;
  }

  .hm-quantity-button:disabled {
    color: #626d64;
    cursor: not-allowed;
  }

  .hm-quantity-input {
    width: 100%;
    min-width: 0;
    padding: 0;
    border: 0;
    border-right: 1px solid var(--hm-border);
    border-left: 1px solid var(--hm-border);
    outline: none;
    background: transparent;
    color: var(--hm-cream);
    font-size: 1rem !important;
    font-weight: 750 !important;
    text-align: center;
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .hm-quantity-input::-webkit-inner-spin-button,
  .hm-quantity-input::-webkit-outer-spin-button {
    margin: 0;
    -webkit-appearance: none;
  }

  .hm-quantity-input:focus-visible {
    box-shadow: inset 0 0 0 1px var(--hm-gold);
  }

  .hm-product-add-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    min-height: 56px;
    margin-top: 20px;
    padding: 15px 22px;
    border: 1px solid var(--hm-gold);
    border-radius: 10px;
    background: var(--hm-gold);
    color: #1c251e;
    cursor: pointer;
    font-size: .96rem !important;
    font-weight: 850 !important;
    transition:
      background .2s ease,
      border-color .2s ease,
      transform .2s ease;
  }

  .hm-product-add-button:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: #ecd39a;
    background: #ecd39a;
  }

  .hm-product-add-button:disabled {
    border-color: #4a554c;
    background: #39443b;
    color: #a0aaa1;
    cursor: not-allowed;
  }

  .hm-product-add-icon {
    font-size: 1.3rem;
    line-height: 1;
  }

  .hm-cart-success {
    margin-top: 17px;
    padding: 17px;
    border: 1px solid rgba(115,206,137,.28);
    border-radius: 12px;
    background: rgba(65,135,81,.12);
    color: #b6edc2;
    animation: hm-product-appear .25s ease-out;
  }

  .hm-cart-success-title {
    display: flex;
    align-items: center;
    gap: 9px;
    font-weight: 750;
  }

  .hm-cart-success a {
    display: inline-block;
    margin-top: 12px;
    color: var(--hm-gold);
    font-size: .9rem;
    font-weight: 750;
    text-decoration: none;
  }

  .hm-cart-success a:hover {
    text-decoration: underline;
  }

  .hm-product-trust {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 24px;
  }

  .hm-product-trust-item {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: 13px 11px;
    border: 1px solid var(--hm-border);
    border-radius: 10px;
    color: #b9c3ba;
    font-size: .79rem;
    line-height: 1.5;
  }

  .hm-product-trust-icon {
    color: var(--hm-gold);
    font-size: 1.15rem;
  }

  .hm-product-state {
    display: flex;
    min-height: 360px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
  }

  .hm-product-state-icon {
    display: grid;
    width: 66px;
    height: 66px;
    margin-bottom: 22px;
    place-items: center;
    border: 1px solid rgba(251, 191, 36,.24);
    border-radius: 50%;
    background: rgba(251, 191, 36,.08);
    color: var(--hm-gold);
    font-size: 1.8rem;
  }

  .hm-product-state h2 {
    margin: 0 0 12px;
    color: var(--hm-cream);
    font-family: Georgia, "Times New Roman", serif;
    font-size: 2rem;
  }

  .hm-product-state p {
    max-width: 430px;
    margin: 0 0 24px;
    color: var(--hm-muted);
    line-height: 1.8;
  }

  .hm-product-state-error {
    color: #ffaaaa !important;
  }

  .hm-product-back-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    min-height: 45px;
    padding: 12px 19px;
    border: 1px solid rgba(251, 191, 36,.5);
    border-radius: 9px;
    background: transparent;
    color: var(--hm-gold);
    font-weight: 750;
    text-decoration: none;
    transition: background .2s ease, color .2s ease;
  }

  .hm-product-back-button:hover {
    background: var(--hm-gold);
    color: #1c251e;
  }

  .hm-product-spinner {
    width: 44px;
    height: 44px;
    border: 3px solid rgba(251, 191, 36,.2);
    border-top-color: var(--hm-gold);
    border-radius: 50%;
    animation: hm-product-spin .8s linear infinite;
  }

  @keyframes hm-product-spin {
    to { transform: rotate(360deg); }
  }

  @keyframes hm-product-appear {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 900px) {
    .hm-product-layout {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 30px;
    }

    .hm-product-image-frame {
      min-height: 390px;
      padding: 24px;
    }

    .hm-product-image {
      height: 340px;
    }

    .hm-product-title {
      font-size: clamp(2rem, 4vw, 2.7rem);
    }

    .hm-product-trust {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .hm-product-page {
      padding: 24px 0 48px;
    }

    .hm-product-container {
      width: min(100% - 28px, 500px);
    }

    .hm-product-breadcrumb {
      margin-bottom: 22px;
      font-size: .82rem;
    }

    .hm-product-layout {
      grid-template-columns: minmax(0, 1fr);
      gap: 28px;
    }

    .hm-product-gallery {
      position: static;
    }

    .hm-product-image-frame {
      min-height: 330px;
      padding: 20px;
      border-radius: 16px;
    }

    .hm-product-image-frame::before {
      width: 220px;
      height: 220px;
    }

    .hm-product-image-frame::after {
      width: 170px;
      height: 170px;
    }

    .hm-product-image {
      height: 290px;
    }

    .hm-product-details {
      padding: 0 2px;
    }

    .hm-product-eyebrow {
      margin-bottom: 15px;
      font-size: .7rem;
    }

    .hm-product-title {
      font-size: 2.3rem;
    }

    .hm-product-price-row {
      margin-top: 19px;
    }

    .hm-product-divider {
      margin: 22px 0;
    }

    .hm-product-description {
      font-size: .93rem;
    }

    .hm-product-purchase {
      margin-top: 24px;
    }

    .hm-product-add-button {
      min-height: 54px;
    }

    .hm-product-trust {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
    }

    .hm-product-trust-item {
      gap: 7px;
      padding: 11px 8px;
      font-size: .72rem;
    }

    .hm-product-trust-icon {
      font-size: 1rem;
    }

    .hm-product-state {
      min-height: 320px;
      padding: 28px 10px;
    }

    .hm-product-state h2 {
      font-size: 1.7rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hm-product-page *,
    .hm-product-page *::before,
    .hm-product-page *::after {
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: .01ms !important;
    }
  }
`;

function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Convert stored image paths into complete backend URLs.
  const getImageUrl = (image) => {
    if (!image || typeof image !== "string" || !image.trim()) {
      return "/placeholder.png";
    }

    const imagePath = image.trim();

    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }

    const backendBaseUrl = (api.defaults.baseURL || "").replace(
      /\/api\/?$/,
      ""
    );

    if (imagePath.startsWith("/api/")) {
      return `${backendBaseUrl}${imagePath}`;
    }

    if (imagePath.startsWith("/product-images/")) {
      return `${backendBaseUrl}/api${imagePath}`;
    }

    return `${backendBaseUrl}/${imagePath.replace(/^\/+/, "")}`;
  };

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      setProduct(null);
      setImageError(false);
      setQuantity(1);
      setAddedToCart(false);

      try {
        const response = await api.get(`/products/${id}`);

        if (!cancelled) {
          setProduct(response.data);
        }
      } catch (err) {
        console.error(
          "Failed to load product:",
          err.response?.data || err.message
        );

        if (!cancelled) {
          setError(
            err.response?.status === 404
              ? "This product could not be found."
              : "Could not load this product. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const stock = Math.max(0, Number(product?.stock) || 0);
  const price = Number(product?.price) || 0;
  const imageUrl = getImageUrl(product?.image);

  const formattedPrice = price.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const handleQuantityChange = (value) => {
    if (!product || value === "") {
      return;
    }

    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
      return;
    }

    const nextQuantity = Math.floor(parsedValue);

    if (nextQuantity < 1) {
      setQuantity(1);
    } else {
      setQuantity(Math.min(nextQuantity, stock));
    }

    setAddedToCart(false);
  };

  const handleAddToCart = () => {
    if (!product || stock < 1) {
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > stock
    ) {
      return;
    }

    addToCart({
      ...product,
      quantity,
    });

    setAddedToCart(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (loading) {
    return (
      <div className="hm-product-page">
        <style>{styles}</style>

        <div className="hm-product-container">
          <div
            className="hm-product-state"
            role="status"
            aria-live="polite"
          >
            <div className="hm-product-spinner" aria-hidden="true" />
            <h2 style={{ marginTop: 24 }}>Finding your selection</h2>
            <p>Just a moment while we load the product details.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="hm-product-page">
        <style>{styles}</style>

        <div className="hm-product-container">
          <div className="hm-product-state">
            <div className="hm-product-state-icon" aria-hidden="true">
              !
            </div>

            <h2>
              {error
                ? "We couldn't load this product"
                : "Product not found"}
            </h2>

            <p className={error ? "hm-product-state-error" : ""}>
              {error ||
                "This product may have been removed or is no longer available."}
            </p>

            <Link to="/products" className="hm-product-back-button">
              <span aria-hidden="true">←</span>
              Back to the collection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hm-product-page">
      <style>{styles}</style>

      <div className="hm-product-container">
        <nav className="hm-product-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>

          <span
            className="hm-product-breadcrumb-separator"
            aria-hidden="true"
          >
            /
          </span>

          <Link to="/products">Collection</Link>

          <span
            className="hm-product-breadcrumb-separator"
            aria-hidden="true"
          >
            /
          </span>

          <span aria-current="page">
            {product.name}
          </span>
        </nav>

        <div className="hm-product-layout">
          {/* Product image */}
          <section className="hm-product-gallery">
            <div className="hm-product-image-frame">
              <img
                src={imageError ? "/placeholder.png" : imageUrl}
                alt={product.name || "Product"}
                className="hm-product-image"
                onError={handleImageError}
              />
            </div>

            <p className="hm-product-image-caption">
              A considered selection from MyDuka.
            </p>
          </section>

          {/* Product information */}
          <section className="hm-product-details">
            <div className="hm-product-eyebrow">
              MyDuka
            </div>

            {product.category && (
              <div className="hm-product-category">
                {product.category}
              </div>
            )}

            <h1 className="hm-product-title">
              {product.name}
            </h1>

            <div className="hm-product-price-row">
              <span className="hm-product-price">
                KSh {formattedPrice}
              </span>

              {product.unit && (
                <span className="hm-product-unit">
                  per {product.unit}
                </span>
              )}
            </div>

            <hr className="hm-product-divider" />

            <div className="hm-product-description-label">
              About this product
            </div>

            <p className="hm-product-description">
              {product.description || "No description available."}
            </p>

            {/* Stock availability */}
            {stock > 0 ? (
              <div className="hm-stock-status hm-stock-available">
                <div className="hm-stock-indicator" aria-hidden="true">
                  ✓
                </div>

                <div>
                  <p className="hm-stock-title">Available to order</p>
                  <p className="hm-stock-subtitle">
                    {stock} {product.unit || "units"} currently in stock.
                  </p>
                </div>
              </div>
            ) : (
              <div className="hm-stock-status hm-stock-unavailable">
                <div className="hm-stock-indicator" aria-hidden="true">
                  !
                </div>

                <div>
                  <p className="hm-stock-title">Currently unavailable</p>
                  <p className="hm-stock-subtitle">
                    This product is out of stock at the moment.
                  </p>
                </div>
              </div>
            )}

            {/* Quantity and cart controls */}
            {stock > 0 && (
              <div className="hm-product-purchase">
                <label
                  htmlFor="product-quantity"
                  className="hm-quantity-label"
                >
                  Choose quantity
                </label>

                <div className="hm-quantity-control">
                  <button
                    type="button"
                    className="hm-quantity-button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => {
                      setQuantity((current) =>
                        Math.max(1, current - 1)
                      );
                      setAddedToCart(false);
                    }}
                  >
                    −
                  </button>

                  <input
                    id="product-quantity"
                    type="number"
                    className="hm-quantity-input"
                    value={quantity}
                    min={1}
                    max={stock}
                    step={1}
                    inputMode="numeric"
                    aria-label="Product quantity"
                    onChange={(event) =>
                      handleQuantityChange(event.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="hm-quantity-button"
                    aria-label="Increase quantity"
                    disabled={quantity >= stock}
                    onClick={() => {
                      setQuantity((current) =>
                        Math.min(stock, current + 1)
                      );
                      setAddedToCart(false);
                    }}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="hm-product-add-button"
                  onClick={handleAddToCart}
                  disabled={
                    stock < 1 ||
                    !Number.isInteger(quantity) ||
                    quantity < 1 ||
                    quantity > stock
                  }
                >
                  <span
                    className="hm-product-add-icon"
                    aria-hidden="true"
                  >
                    +
                  </span>

                  Add to Cart
                </button>

                {addedToCart && (
                  <div
                    className="hm-cart-success"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="hm-cart-success-title">
                      <span aria-hidden="true">✓</span>
                      Added to your cart successfully.
                    </div>

                    <Link to="/cart">
                      View your cart and continue →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="hm-product-trust">
              <div className="hm-product-trust-item">
                <span
                  className="hm-product-trust-icon"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span>Clear product pricing</span>
              </div>

              <div className="hm-product-trust-item">
                <span
                  className="hm-product-trust-icon"
                  aria-hidden="true"
                >
                  ◈
                </span>
                <span>Convenient online ordering</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
