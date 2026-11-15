import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const styles = `
.md-store-product { min-height: 75vh; padding: 34px 20px 70px; background: #f8fafc; color: #172033; }
.md-store-product * { box-sizing: border-box; }
.md-store-product button, .md-store-product input { font: inherit; }
.md-store-product-inner { width: min(1120px, 100%); margin: 0 auto; }
.md-store-product-crumbs { display:flex; flex-wrap:wrap; gap:9px; margin-bottom:25px; color:#7b8798; font-size:13px; }
.md-store-product-crumbs a { color:var(--product-primary); text-decoration:none; font-weight:650; }
.md-store-product-grid { display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr); gap:48px; align-items:start; }
.md-store-product-image { min-height:460px; display:grid; place-items:center; padding:30px; overflow:hidden; border:1px solid #e7ebf2; border-radius:22px; background:#fff; }
.md-store-product-image img { width:100%; height:400px; object-fit:contain; }
.md-store-product-image-placeholder { color:#aab4c2; font-size:70px; }
.md-store-product-info { padding:10px 0; }
.md-store-product-category { display:inline-flex; padding:7px 12px; border-radius:30px; background:color-mix(in srgb,var(--product-primary) 9%,white); color:var(--product-primary); font-size:12px; font-weight:750; }
.md-store-product-info h1 { margin:17px 0 0; color:#172033; font-size:clamp(30px,4vw,43px); line-height:1.12; letter-spacing:-1.2px; overflow-wrap:anywhere; }
.md-store-product-price { margin-top:20px; color:var(--product-primary); font-size:30px; font-weight:850; letter-spacing:-.8px; }
.md-store-product-unit { color:#7c8797; font-size:14px; font-weight:500; }
.md-store-product-description { margin-top:25px; padding-top:22px; border-top:1px solid #e7ebf2; }
.md-store-product-description h2 { margin:0 0 9px; font-size:14px; font-weight:800; }
.md-store-product-description p { margin:0; color:#667386; font-size:14px; line-height:1.85; white-space:pre-line; }
.md-store-product-options { margin-top:24px; }
.md-store-product-options-label { display:block; margin-bottom:10px; color:#344054; font-size:13px; font-weight:800; }
.md-store-product-option-list { display:flex; flex-wrap:wrap; gap:9px; }
.md-store-product-option { padding:11px 15px; border:1px solid #dce2eb; border-radius:10px; background:#fff; color:#344054; cursor:pointer; font-size:13px; font-weight:700; }
.md-store-product-option.active { border-color:var(--product-primary); background:color-mix(in srgb,var(--product-primary) 8%,white); color:var(--product-primary); box-shadow:0 0 0 2px color-mix(in srgb,var(--product-primary) 12%,transparent); }
.md-store-product-quantity { display:flex; align-items:center; width:150px; height:46px; margin-top:22px; overflow:hidden; border:1px solid #dce2eb; border-radius:10px; background:#fff; }
.md-store-product-quantity button { width:46px; height:100%; border:0; background:transparent; color:#344054; cursor:pointer; font-size:20px; }
.md-store-product-quantity button:disabled { color:#b8c0cc; cursor:not-allowed; }
.md-store-product-quantity input { width:100%; min-width:0; border:0; outline:0; color:#172033; text-align:center; font-weight:750; appearance:textfield; }
.md-store-product-quantity input::-webkit-inner-spin-button,.md-store-product-quantity input::-webkit-outer-spin-button { appearance:none; margin:0; }
.md-store-product-add { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; min-height:54px; margin-top:18px; border:0; border-radius:11px; background:var(--product-primary); color:#fff; cursor:pointer; font-size:14px; font-weight:800; transition:transform .2s,opacity .2s; }
.md-store-product-add:hover { transform:translateY(-1px); opacity:.93; }
.md-store-product-success { margin-top:13px; padding:14px; border:1px solid #b7e4c7; border-radius:10px; background:#effbf3; color:#176b38; font-size:13px; }
.md-store-product-success a { display:inline-block; margin-left:7px; color:#176b38; font-weight:800; }
.md-store-product-trust { display:flex; flex-wrap:wrap; gap:17px; margin-top:22px; color:#7a8797; font-size:12px; }
.md-store-product-trust span { display:flex; align-items:center; gap:7px; }
.md-store-product-empty { min-height:420px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:35px; border:1px solid #e7ebf2; border-radius:18px; background:#fff; text-align:center; }
.md-store-product-empty i { margin-bottom:15px; color:var(--product-primary); font-size:38px; }
.md-store-product-empty h1 { margin:0 0 10px; font-size:25px; }
.md-store-product-empty p { max-width:450px; margin:0 0 20px; color:#7b8798; font-size:14px; line-height:1.7; }
.md-store-product-back { display:inline-flex; align-items:center; gap:8px; padding:11px 16px; border-radius:9px; background:var(--product-primary); color:#fff; font-size:13px; font-weight:750; text-decoration:none; }
@media(max-width:760px) { .md-store-product { padding:22px 14px 48px; } .md-store-product-grid { grid-template-columns:1fr; gap:25px; } .md-store-product-image { min-height:300px; padding:20px; border-radius:15px; } .md-store-product-image img { height:270px; } .md-store-product-info { padding:0 2px; } .md-store-product-info h1 { font-size:31px; } .md-store-product-price { font-size:26px; } }
`;

const formatPrice = (amount, currency = "KES") => {
  try {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(amount || 0));
  } catch {
    return `${currency} ${Number(amount || 0).toLocaleString("en-KE")}`;
  }
};

export default function StorefrontProductDetails() {
  const { slug, productId } = useParams();
  const location = useLocation();
  const { addToCart } = useCart();
  const product = location.state?.product || null;
  const store = location.state?.store || {};
  const [purchaseType, setPurchaseType] = useState("unit");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const hasPortions = Boolean(product?.allow_portion_sales) && Number(product?.portion_price) > 0;
  const selectedPrice = purchaseType === "portion" && hasPortions
    ? Number(product.portion_price)
    : Number(product?.price || 0);
  const selectedUnit = purchaseType === "portion" && hasPortions
    ? "portion"
    : (product?.unit || "unit");
  const total = useMemo(() => selectedPrice * quantity, [selectedPrice, quantity]);
  const primaryColor = store.primaryColor || "#635bff";
  const image = typeof product?.image === "string" ? product.image : "";

  const addProduct = () => {
    if (!product || quantity < 1) return;
    const cartLine = {
      ...product,
      id: `${product.id}::${purchaseType}`,
      product_id: product.id,
      purchase_type: purchaseType,
      unit: selectedUnit,
      price: selectedPrice,
      quantity,
      cart_label: purchaseType === "portion" ? "Portion" : "Whole unit",
    };
    addToCart(cartLine, quantity);
    setAdded(true);
  };

  return (
    <div className="md-store-product" style={{ "--product-primary": primaryColor }}>
      <style>{styles}</style>
      <div className="md-store-product-inner">
        <nav className="md-store-product-crumbs" aria-label="Breadcrumb">
          <Link to={`/store/${encodeURIComponent(slug)}`}>Store</Link>
          <span>/</span>
          <span>{product?.name || "Product details"}</span>
        </nav>

        {!product || String(product.id) !== String(productId) ? (
          <section className="md-store-product-empty">
            <i className="bi bi-box-seam" aria-hidden="true" />
            <h1>Product details aren't available</h1>
            <p>Return to this store and open the product from its listing. Product information will also load directly from the store catalogue when backend integration is completed.</p>
            <Link className="md-store-product-back" to={`/store/${encodeURIComponent(slug)}`}>
              <i className="bi bi-arrow-left" /> Back to store
            </Link>
          </section>
        ) : (
          <div className="md-store-product-grid">
            <section className="md-store-product-image" aria-label="Product image">
              {image ? <img src={image} alt={product.name} /> : <i className="bi bi-image md-store-product-image-placeholder" aria-hidden="true" />}
            </section>

            <section className="md-store-product-info">
              {product.category && <span className="md-store-product-category">{product.category}</span>}
              <h1>{product.name}</h1>
              <div className="md-store-product-price">
                {formatPrice(selectedPrice, store.currency || "KES")}
                <span className="md-store-product-unit"> / {selectedUnit}</span>
              </div>

              <div className="md-store-product-description">
                <h2>About this product</h2>
                <p>{product.description || "No additional product description has been provided."}</p>
              </div>

              {hasPortions && (
                <div className="md-store-product-options">
                  <span className="md-store-product-options-label">Choose purchase option</span>
                  <div className="md-store-product-option-list">
                    <button type="button" className={`md-store-product-option ${purchaseType === "unit" ? "active" : ""}`} onClick={() => { setPurchaseType("unit"); setAdded(false); }}>
                      Whole unit · {formatPrice(product.price, store.currency || "KES")}
                    </button>
                    <button type="button" className={`md-store-product-option ${purchaseType === "portion" ? "active" : ""}`} onClick={() => { setPurchaseType("portion"); setAdded(false); }}>
                      Portion · {formatPrice(product.portion_price, store.currency || "KES")}
                    </button>
                  </div>
                </div>
              )}

              <label className="md-store-product-options-label" htmlFor="store-product-quantity" style={{ marginTop: 23 }}>Quantity</label>
              <div className="md-store-product-quantity">
                <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => { setQuantity((value) => Math.max(1, value - 1)); setAdded(false); }}>−</button>
                <input id="store-product-quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => { const next = Number(event.target.value); if (Number.isInteger(next) && next >= 1) { setQuantity(next); setAdded(false); } }} />
                <button type="button" aria-label="Increase quantity" onClick={() => { setQuantity((value) => value + 1); setAdded(false); }}>+</button>
              </div>

              <button type="button" className="md-store-product-add" onClick={addProduct}>
                <i className="bi bi-bag-plus" /> Add to cart · {formatPrice(total, store.currency || "KES")}
              </button>

              {added && (
                <div className="md-store-product-success" role="status">
                  Added to your store cart successfully.
                  <Link to="/cart">View cart</Link>
                </div>
              )}

              <div className="md-store-product-trust">
                <span><i className="bi bi-shield-check" /> Secure checkout</span>
                <span><i className="bi bi-shop" /> Sold by {store.name || "this store"}</span>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
