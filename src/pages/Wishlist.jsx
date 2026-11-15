import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const WISHLIST_STORAGE_KEY = "mydukaWishlists";

const styles = `
.md-wishlist {
  min-height:70vh;
  padding:38px 20px 70px;
  background:#f8fafc;
  color:#172033;
}
.md-wishlist * { box-sizing:border-box; }
.md-wishlist-inner { width:min(1120px,100%); margin:0 auto; }
.md-wishlist-heading {
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:18px;
  margin-bottom:28px;
}
.md-wishlist-heading h1 {
  margin:0;
  font-size:clamp(27px,4vw,36px);
  font-weight:850;
  letter-spacing:-1px;
}
.md-wishlist-heading p {
  margin:8px 0 0;
  color:#7b8798;
  font-size:14px;
}
.md-wishlist-count {
  padding:8px 13px;
  border:1px solid #e5e9f0;
  border-radius:30px;
  background:#fff;
  color:#64748b;
  font-size:12px;
  font-weight:750;
  white-space:nowrap;
}
.md-wishlist-grid {
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:20px;
}
.md-wishlist-card {
  overflow:hidden;
  border:1px solid #e7ebf2;
  border-radius:16px;
  background:#fff;
  transition:transform .2s,box-shadow .2s;
}
.md-wishlist-card:hover {
  transform:translateY(-3px);
  box-shadow:0 12px 28px rgba(15,23,42,.07);
}
.md-wishlist-image {
  position:relative;
  display:grid;
  place-items:center;
  height:220px;
  padding:18px;
  background:#f8fafc;
}
.md-wishlist-image img {
  width:100%;
  height:100%;
  object-fit:contain;
}
.md-wishlist-image-placeholder {
  color:#b5bfcc;
  font-size:48px;
}
.md-wishlist-remove {
  position:absolute;
  top:12px;
  right:12px;
  display:grid;
  place-items:center;
  width:36px;
  height:36px;
  border:1px solid #f1d5dc;
  border-radius:50%;
  background:#fff;
  color:#df4565;
  cursor:pointer;
  font-size:16px;
}
.md-wishlist-remove:hover {
  background:#fff0f3;
}
.md-wishlist-content { padding:17px; }
.md-wishlist-category {
  color:var(--wishlist-primary);
  font-size:11px;
  font-weight:800;
  text-transform:uppercase;
  letter-spacing:.5px;
}
.md-wishlist-content h2 {
  margin:8px 0;
  color:#172033;
  font-size:16px;
  font-weight:800;
  line-height:1.4;
}
.md-wishlist-price {
  margin:0 0 16px;
  color:var(--wishlist-primary);
  font-size:19px;
  font-weight:850;
}
.md-wishlist-view {
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  width:100%;
  min-height:43px;
  border-radius:9px;
  background:var(--wishlist-primary);
  color:#fff;
  font-size:13px;
  font-weight:800;
  text-decoration:none;
}
.md-wishlist-view:hover {
  color:#fff;
  opacity:.92;
}
.md-wishlist-empty {
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  min-height:380px;
  padding:35px 20px;
  border:1px solid #e7ebf2;
  border-radius:18px;
  background:#fff;
  text-align:center;
}
.md-wishlist-empty-icon {
  display:grid;
  place-items:center;
  width:76px;
  height:76px;
  margin-bottom:20px;
  border-radius:50%;
  background:#f1f0ff;
  color:var(--wishlist-primary);
  font-size:30px;
}
.md-wishlist-empty h2 {
  margin:0 0 9px;
  color:#172033;
  font-size:23px;
  font-weight:850;
}
.md-wishlist-empty p {
  max-width:420px;
  margin:0 0 22px;
  color:#7b8798;
  font-size:14px;
  line-height:1.7;
}
.md-wishlist-shop {
  display:inline-flex;
  align-items:center;
  gap:9px;
  padding:12px 18px;
  border-radius:9px;
  background:var(--wishlist-primary);
  color:#fff;
  font-size:13px;
  font-weight:800;
  text-decoration:none;
}
.md-wishlist-shop:hover { color:#fff; opacity:.92; }
@media(max-width:850px) {
  .md-wishlist-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
}
@media(max-width:560px) {
  .md-wishlist { padding:25px 14px 48px; }
  .md-wishlist-heading { align-items:flex-start; }
  .md-wishlist-grid { grid-template-columns:1fr; gap:14px; }
  .md-wishlist-card {
    display:grid;
    grid-template-columns:118px minmax(0,1fr);
    min-height:145px;
  }
  .md-wishlist-image { height:100%; min-height:145px; padding:10px; }
  .md-wishlist-remove { top:7px; right:7px; width:30px; height:30px; }
  .md-wishlist-content { padding:13px; }
  .md-wishlist-content h2 { font-size:14px; margin:6px 0; }
  .md-wishlist-price { margin-bottom:10px; font-size:16px; }
  .md-wishlist-count { font-size:11px; padding:7px 10px; }
}
`;

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

function readWishlists() {
  try {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export default function Wishlist() {
  const { activeStoreSlug } = useCart();
  const [wishlists, setWishlists] = useState(readWishlists);

  const storeSlug =
    activeStoreSlug ||
    localStorage.getItem("mydukaActiveStore") ||
    "default";

  const products = useMemo(() => {
    const items = wishlists?.[storeSlug];
    return Array.isArray(items) ? items : [];
  }, [wishlists, storeSlug]);

  const refreshWishlist = useCallback(() => {
    setWishlists(readWishlists());
  }, []);

  useEffect(() => {
    window.addEventListener("storage", refreshWishlist);
    window.addEventListener("mydukaWishlistUpdated", refreshWishlist);

    return () => {
      window.removeEventListener("storage", refreshWishlist);
      window.removeEventListener("mydukaWishlistUpdated", refreshWishlist);
    };
  }, [refreshWishlist]);

  const removeProduct = (productId) => {
    const current = readWishlists();
    const currentItems = Array.isArray(current?.[storeSlug])
      ? current[storeSlug]
      : [];

    const updated = {
      ...current,
      [storeSlug]: currentItems.filter(
        (item) => String(item.id) !== String(productId)
      ),
    };

    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
    setWishlists(updated);
    window.dispatchEvent(new Event("mydukaWishlistUpdated"));
  };

  const primaryColor = "#635bff";

  return (
    <main
      className="md-wishlist"
      style={{ "--wishlist-primary": primaryColor }}
    >
      <style>{styles}</style>

      <div className="md-wishlist-inner">
        <header className="md-wishlist-heading">
          <div>
            <h1>My Wishlist</h1>
            <p>Keep the products you love close at hand.</p>
          </div>

          <span className="md-wishlist-count">
            {products.length} {products.length === 1 ? "item" : "items"}
          </span>
        </header>

        {products.length === 0 ? (
          <section className="md-wishlist-empty">
            <div className="md-wishlist-empty-icon">
              <i className="bi bi-heart" aria-hidden="true" />
            </div>

            <h2>Your wishlist is empty</h2>

            <p>
              When you find something you like, tap the heart on its product
              page and it will appear here.
            </p>

            <Link
              to={
                storeSlug && storeSlug !== "default"
                  ? `/store/${encodeURIComponent(storeSlug)}`
                  : "/"
              }
              className="md-wishlist-shop"
            >
              <i className="bi bi-bag" />
              Continue shopping
            </Link>
          </section>
        ) : (
          <div className="md-wishlist-grid">
            {products.map((product) => (
              <article
                className="md-wishlist-card"
                key={product.id}
              >
                <div className="md-wishlist-image">
                  {product.image ? (
                    <img src={product.image} alt={product.name || "Product"} />
                  ) : (
                    <i
                      className="bi bi-image md-wishlist-image-placeholder"
                      aria-hidden="true"
                    />
                  )}

                  <button
                    type="button"
                    className="md-wishlist-remove"
                    onClick={() => removeProduct(product.id)}
                    aria-label={`Remove ${product.name || "product"} from wishlist`}
                    title="Remove from wishlist"
                  >
                    <i className="bi bi-trash3" />
                  </button>
                </div>

                <div className="md-wishlist-content">
                  {product.category && (
                    <div className="md-wishlist-category">
                      {product.category}
                    </div>
                  )}

                  <h2>{product.name || "Unnamed product"}</h2>

                  <div className="md-wishlist-price">
                    {formatPrice(product.price, product.currency || "KES")}
                  </div>

                  <Link
                    className="md-wishlist-view"
                    to={`/store/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(product.id)}`}
                    state={{ product }}
                  >
                    View product
                    <i className="bi bi-arrow-right" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
