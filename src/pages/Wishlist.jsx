import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const STORAGE_KEY = "mydukaWishlists";

function readWishlists() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function Wishlist() {
  const location = useLocation();
  const slug = location.pathname.match(/^\/store\/([^/]+)/)?.[1] || "";
  const [items, setItems] = useState([]);

  const storeSlug = slug ? decodeURIComponent(slug) : "default";
  const storePath = slug ? `/store/${encodeURIComponent(slug)}` : "/";

  const loadItems = () => {
    const wishlists = readWishlists();
    setItems(Array.isArray(wishlists[storeSlug]) ? wishlists[storeSlug] : []);
  };

  useEffect(() => {
    loadItems();

    const handleStorage = () => loadItems();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("mydukaWishlistUpdated", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("mydukaWishlistUpdated", handleStorage);
    };
  }, [storeSlug]);

  const removeItem = (productId) => {
    const wishlists = readWishlists();
    const updated = (wishlists[storeSlug] || []).filter(
      (item) => String(item.id) !== String(productId)
    );

    wishlists[storeSlug] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlists));
    setItems(updated);
    window.dispatchEvent(new Event("mydukaWishlistUpdated"));
  };

  const formatPrice = (amount) =>
    `KSh ${Number(amount || 0).toLocaleString("en-KE", {
      maximumFractionDigits: 2,
    })}`;

  const styles = `
    .md-wishlist {
      min-height: 75vh;
      padding: 40px 17px 70px;
      background: #f6f7fb;
      color: #172033;
    }
    .md-wishlist * { box-sizing: border-box; }
    .md-wishlist-container { width: min(1120px, 100%); margin: auto; }
    .md-wishlist-header { margin-bottom: 30px; }
    .md-wishlist-eyebrow {
      color: #635bff;
      font-size: 11px;
      font-weight: 850;
      letter-spacing: 1.6px;
      text-transform: uppercase;
    }
    .md-wishlist-title {
      margin: 10px 0;
      font-size: clamp(30px, 5vw, 42px);
      font-weight: 850;
      letter-spacing: -1.5px;
    }
    .md-wishlist-subtitle { color: #8791a1; font-size: 14px; }
    .md-wishlist-count {
      display: inline-flex;
      padding: 7px 12px;
      border-radius: 30px;
      background: #eeedff;
      color: #635bff;
      font-size: 11px;
      font-weight: 800;
    }
    .md-wishlist-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
    }
    .md-wishlist-card {
      overflow: hidden;
      border: 1px solid #e7eaf0;
      border-radius: 15px;
      background: #fff;
      box-shadow: 0 6px 22px rgba(23,32,51,.04);
    }
    .md-wishlist-image {
      position: relative;
      display: grid;
      height: 210px;
      place-items: center;
      overflow: hidden;
      background: #f8f9fc;
    }
    .md-wishlist-image img {
      width: 100%;
      height: 100%;
      padding: 15px;
      object-fit: contain;
    }
    .md-wishlist-image i { color: #b0b8c6; font-size: 38px; }
    .md-wishlist-remove {
      position: absolute;
      top: 11px;
      right: 11px;
      display: grid;
      width: 35px;
      height: 35px;
      place-items: center;
      border: 1px solid #f1dddd;
      border-radius: 50%;
      background: #fff;
      color: #c44b4b;
      cursor: pointer;
    }
    .md-wishlist-content { padding: 17px; }
    .md-wishlist-category {
      color: #8a93a3;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .md-wishlist-name {
      margin: 7px 0;
      color: #172033;
      font-size: 16px;
      font-weight: 800;
      overflow-wrap: anywhere;
    }
    .md-wishlist-price {
      margin: 12px 0 15px;
      color: #635bff;
      font-size: 19px;
      font-weight: 900;
    }
    .md-wishlist-view {
      display: flex;
      min-height: 43px;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: 8px;
      background: #635bff;
      color: white;
      font-size: 12px;
      font-weight: 800;
      text-decoration: none;
    }
    .md-wishlist-empty {
      padding: 55px 22px;
      border: 1px solid #e7eaf0;
      border-radius: 17px;
      background: white;
      text-align: center;
    }
    .md-wishlist-empty-icon {
      display: grid;
      width: 75px;
      height: 75px;
      place-items: center;
      margin: 0 auto 18px;
      border-radius: 50%;
      background: #f0efff;
      color: #635bff;
      font-size: 30px;
    }
    .md-wishlist-empty h2 { margin: 0 0 10px; font-size: 22px; font-weight: 850; }
    .md-wishlist-empty p {
      max-width: 430px;
      margin: 0 auto 22px;
      color: #8791a1;
      font-size: 13px;
      line-height: 1.8;
    }
    .md-wishlist-browse {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 18px;
      border-radius: 9px;
      background: #635bff;
      color: #fff;
      font-size: 12px;
      font-weight: 800;
      text-decoration: none;
    }
    @media(max-width:850px) {
      .md-wishlist-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media(max-width:520px) {
      .md-wishlist { padding: 28px 13px 50px; }
      .md-wishlist-grid { grid-template-columns: 1fr; gap: 13px; }
      .md-wishlist-card { display: grid; grid-template-columns: 115px minmax(0, 1fr); }
      .md-wishlist-image { height: 100%; min-height: 155px; }
      .md-wishlist-content { padding: 13px; }
      .md-wishlist-name { font-size: 14px; }
    }
  `;

  return (
    <main className="md-wishlist">
      <style>{styles}</style>

      <div className="md-wishlist-container">
        <header className="md-wishlist-header">
          <div className="md-wishlist-eyebrow">Your saved products</div>
          <h1 className="md-wishlist-title">My Wishlist</h1>
          <p className="md-wishlist-subtitle">
            Keep the products you love in one place.
          </p>
          <span className="md-wishlist-count">
            {items.length} saved {items.length === 1 ? "item" : "items"}
          </span>
        </header>

        {items.length === 0 ? (
          <section className="md-wishlist-empty">
            <div className="md-wishlist-empty-icon">
              <i className="bi bi-heart"></i>
            </div>
            <h2>Your wishlist is empty</h2>
            <p>
              Save products you like while browsing this shop. You can
              come back to them whenever you are ready.
            </p>
            <Link to={storePath} className="md-wishlist-browse">
              <i className="bi bi-shop"></i>
              Explore this shop
            </Link>
          </section>
        ) : (
          <div className="md-wishlist-grid">
            {items.map((item) => (
              <article className="md-wishlist-card" key={item.id}>
                <div className="md-wishlist-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <i className="bi bi-image"></i>
                  )}

                  <button
                    type="button"
                    className="md-wishlist-remove"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name} from wishlist`}
                  >
                    <i className="bi bi-trash3"></i>
                  </button>
                </div>

                <div className="md-wishlist-content">
                  {item.category && (
                    <div className="md-wishlist-category">
                      {item.category}
                    </div>
                  )}

                  <h2 className="md-wishlist-name">{item.name}</h2>

                  <div className="md-wishlist-price">
                    {formatPrice(item.price)}
                  </div>

                  <Link
                    to={`/store/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(item.id)}`}
                    state={{ product: item }}
                    className="md-wishlist-view"
                  >
                    View product
                    <i className="bi bi-arrow-right"></i>
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
