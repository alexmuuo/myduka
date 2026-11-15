import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const formatPrice = (amount, currency = "KES") => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
};

const readableSlug = (slug = "") =>
  slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const styles = `
.md-storefront {
  min-height: 100vh;
  background: var(--store-background, #f8fafc);
  color: var(--store-text, #172033);
  font-family: inherit;
}

.md-storefront * {
  box-sizing: border-box;
}

.md-storefront button,
.md-storefront input {
  font: inherit;
}

.md-storefront .store-topbar {
  background: var(--store-secondary, #172033);
  color: white;
  padding: 9px 5%;
  text-align: center;
  font-size: 12px;
}

.md-storefront .store-header {
  background: white;
  border-bottom: 1px solid #e8edf3;
  position: sticky;
  top: 0;
  z-index: 20;
}

.md-storefront .store-header-inner {
  max-width: 1280px;
  margin: auto;
  min-height: 76px;
  padding: 12px 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
}

.md-storefront .store-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  text-decoration: none;
  color: #172033;
}

.md-storefront .store-brand-icon {
  width: 43px;
  height: 43px;
  border-radius: 12px;
  background: var(--store-primary, #4f46e5);
  color: white;
  display: grid;
  place-items: center;
  font-size: 21px;
  flex-shrink: 0;
}

.md-storefront .store-brand-name {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -.5px;
  overflow-wrap: anywhere;
}

.md-storefront .store-brand-caption {
  display: block;
  color: #8993a4;
  font-size: 10px;
  letter-spacing: 1.2px;
  font-weight: 700;
  margin-top: 2px;
}

.md-storefront .store-nav {
  display: flex;
  align-items: center;
  gap: 27px;
}

.md-storefront .store-nav a {
  color: #526071;
  text-decoration: none;
  font-size: 13px;
  font-weight: 650;
}

.md-storefront .store-nav a:hover {
  color: var(--store-primary, #4f46e5);
}

.md-storefront .store-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.md-storefront .store-cart-button {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  background: var(--store-primary, #4f46e5);
  color: white;
  border: 0;
  border-radius: 10px;
  padding: 11px 15px;
  font-size: 12px;
  font-weight: 750;
  text-decoration: none;
}

.md-storefront .cart-count {
  background: white;
  color: var(--store-primary, #4f46e5);
  border-radius: 20px;
  min-width: 21px;
  height: 21px;
  padding: 0 5px;
  display: grid;
  place-items: center;
  font-size: 10px;
}

.md-storefront .store-main {
  max-width: 1280px;
  margin: auto;
  padding: 30px 25px 65px;
}

.md-storefront .store-hero {
  min-height: 300px;
  border-radius: 20px;
  padding: 50px;
  background:
    radial-gradient(circle at 85% 20%, rgba(255,255,255,.16), transparent 30%),
    linear-gradient(125deg, var(--store-secondary, #172033), var(--store-primary, #4f46e5));
  color: white;
  display: flex;
  align-items: center;
  overflow: hidden;
  position: relative;
}

.md-storefront .store-hero-content {
  max-width: 650px;
  position: relative;
  z-index: 1;
}

.md-storefront .hero-label {
  display: inline-block;
  border: 1px solid rgba(255,255,255,.3);
  background: rgba(255,255,255,.1);
  border-radius: 30px;
  padding: 7px 12px;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 1.3px;
  margin-bottom: 18px;
}

.md-storefront .store-hero h1 {
  font-size: clamp(32px, 5vw, 49px);
  font-weight: 850;
  letter-spacing: -1.5px;
  line-height: 1.12;
  margin: 0 0 14px;
  overflow-wrap: anywhere;
}

.md-storefront .store-hero p {
  color: rgba(255,255,255,.82);
  max-width: 530px;
  font-size: 14px;
  line-height: 1.8;
  margin: 0;
}

.md-storefront .hero-button {
  display: inline-flex;
  margin-top: 25px;
  background: white;
  color: var(--store-secondary, #172033);
  border-radius: 9px;
  padding: 12px 18px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 750;
}

.md-storefront .store-benefits {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin: 23px 0 45px;
}

.md-storefront .benefit {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 17px;
  border: 1px solid #e8edf3;
  border-radius: 12px;
  background: white;
}

.md-storefront .benefit-icon {
  width: 39px;
  height: 39px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #f1f0ff;
  color: var(--store-primary, #4f46e5);
  font-size: 18px;
  flex-shrink: 0;
}

.md-storefront .benefit strong {
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
}

.md-storefront .benefit span {
  color: #8792a2;
  font-size: 11px;
}

.md-storefront .section-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 15px;
  margin-bottom: 19px;
}

.md-storefront .section-heading h2 {
  font-size: 23px;
  font-weight: 800;
  letter-spacing: -.6px;
  margin: 0 0 5px;
}

.md-storefront .section-heading p {
  color: #8490a0;
  font-size: 12px;
  margin: 0;
}

.md-storefront .store-search {
  width: min(100%, 320px);
  position: relative;
}

.md-storefront .store-search input {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px 12px 39px;
  background: white;
  color: #172033;
  font-size: 12px;
  outline: none;
}

.md-storefront .store-search input:focus {
  border-color: var(--store-primary, #4f46e5);
}

.md-storefront .search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.md-storefront .category-list {
  display: flex;
  gap: 9px;
  overflow-x: auto;
  padding: 3px 0 18px;
  margin-bottom: 5px;
}

.md-storefront .category-chip {
  flex-shrink: 0;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  padding: 9px 15px;
  border-radius: 30px;
  font-size: 11px;
  font-weight: 650;
  cursor: pointer;
}

.md-storefront .category-chip.active {
  background: var(--store-primary, #4f46e5);
  color: white;
  border-color: var(--store-primary, #4f46e5);
}

.md-storefront .product-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 19px;
}

.md-storefront .product-card {
  background: white;
  border: 1px solid #e9edf3;
  border-radius: 13px;
  overflow: hidden;
  transition: transform .2s, box-shadow .2s;
}

.md-storefront .product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(15,23,42,.07);
}

.md-storefront .product-image {
  height: 190px;
  background: #f1f5f9;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.md-storefront .product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.md-storefront .product-image-placeholder {
  color: #a4adbb;
  font-size: 38px;
}

.md-storefront .product-details {
  padding: 15px;
}

.md-storefront .product-category {
  color: var(--store-primary, #4f46e5);
  font-size: 10px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: .7px;
}

.md-storefront .product-details h3 {
  font-size: 14px;
  font-weight: 750;
  margin: 7px 0;
  overflow-wrap: anywhere;
}

.md-storefront .product-description {
  color: #8792a2;
  font-size: 11px;
  line-height: 1.6;
  min-height: 35px;
  margin: 0 0 12px;
}

.md-storefront .product-price {
  font-size: 16px;
  font-weight: 850;
  color: #172033;
}

.md-storefront .portion-price {
  display: block;
  color: #8490a0;
  font-size: 10px;
  margin-top: 4px;
}

.md-storefront .add-button {
  width: 100%;
  margin-top: 13px;
  border: 0;
  border-radius: 8px;
  padding: 10px;
  color: white;
  background: var(--store-primary, #4f46e5);
  font-size: 11px;
  font-weight: 750;
  cursor: pointer;
}

.md-storefront .add-button:hover {
  filter: brightness(.94);
}

.md-storefront .empty-products {
  background: white;
  border: 1px dashed #d5dce7;
  border-radius: 14px;
  padding: 50px 20px;
  text-align: center;
}

.md-storefront .empty-products-icon {
  width: 58px;
  height: 58px;
  margin: 0 auto 15px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: #f1f0ff;
  color: var(--store-primary, #4f46e5);
  font-size: 25px;
}

.md-storefront .empty-products h3 {
  font-size: 16px;
  font-weight: 750;
  margin: 0 0 7px;
}

.md-storefront .empty-products p {
  color: #8490a0;
  font-size: 12px;
  margin: 0;
}

.md-storefront .store-footer {
  background: var(--store-secondary, #172033);
  color: white;
  padding: 35px 25px;
}

.md-storefront .store-footer-inner {
  max-width: 1280px;
  margin: auto;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
}

.md-storefront .store-footer strong {
  font-size: 15px;
}

.md-storefront .store-footer p {
  color: rgba(255,255,255,.65);
  font-size: 11px;
  margin: 6px 0 0;
}

.md-storefront .store-footer a {
  color: white;
  text-decoration: none;
  font-size: 12px;
}

@media (max-width: 950px) {
  .md-storefront .product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .md-storefront .store-nav {
    gap: 15px;
  }
}

@media (max-width: 700px) {
  .md-storefront .store-header-inner {
    padding: 12px 16px;
    min-height: 66px;
  }

  .md-storefront .store-nav {
    display: none;
  }

  .md-storefront .store-main {
    padding: 20px 15px 45px;
  }

  .md-storefront .store-hero {
    min-height: 270px;
    padding: 30px 23px;
    border-radius: 15px;
  }

  .md-storefront .store-benefits {
    grid-template-columns: 1fr;
    gap: 9px;
    margin-bottom: 35px;
  }

  .md-storefront .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 11px;
  }

  .md-storefront .product-image {
    height: 145px;
  }

  .md-storefront .product-details {
    padding: 11px;
  }

  .md-storefront .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .md-storefront .store-search {
    width: 100%;
  }

  .md-storefront .store-footer-inner {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 380px) {
  .md-storefront .store-brand-name {
    font-size: 15px;
  }

  .md-storefront .store-cart-button {
    padding: 10px;
  }

  .md-storefront .product-image {
    height: 125px;
  }
}
`;

export default function StorefrontHome() {
  const { slug } = useParams();
  const { addToCart, cartCount } = useCart();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  /*
   * Products and store branding will be loaded from the public
   * business API during the backend integration phase.
   *
   * Keeping these arrays empty prevents displaying invented products.
   */
  const store = {
    name: readableSlug(slug) || "Online Store",
    description: "",
    currency: "KES",
    primaryColor: "#4f46e5",
    secondaryColor: "#172033",
    backgroundColor: "#f8fafc",
  };

  const products = [];

  const activeProducts = useMemo(
    () => products.filter((product) => product.is_active !== false),
    [products]
  );

  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        activeProducts
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ],
    [activeProducts]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return activeProducts.filter((product) => {
      const matchesCategory =
        activeCategory === "All" ||
        product.category === activeCategory;

      const matchesSearch =
        !query ||
        [product.name, product.category, product.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [activeProducts, activeCategory, search]);

  const storeStyle = {
    "--store-primary": store.primaryColor,
    "--store-secondary": store.secondaryColor,
    "--store-background": store.backgroundColor,
  };

  return (
    <div className="md-storefront" style={storeStyle}>
      <style>{styles}</style>

      <div className="store-topbar">
        Welcome to {store.name}
      </div>

      <header className="store-header">
        <div className="store-header-inner">
          <Link
            to={`/store/${encodeURIComponent(slug)}`}
            className="store-brand"
          >
            <span className="store-brand-icon">
              <i className="bi bi-shop" />
            </span>

            <span>
              <span className="store-brand-name">
                {store.name}
              </span>
              <span className="store-brand-caption">
                YOUR ONLINE STORE
              </span>
            </span>
          </Link>

          <nav className="store-nav">
            <a href="#home">Home</a>
            <a href="#products">Shop</a>
            <a href="#categories">Categories</a>
          </nav>

          <div className="store-actions">
            <Link to="/cart" className="store-cart-button">
              <i className="bi bi-bag" />
              <span>Cart</span>
              <span className="cart-count">{cartCount}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="store-main">
        <section className="store-hero" id="home">
          <div className="store-hero-content">
            <span className="hero-label">
              WELCOME TO OUR STORE
            </span>

            <h1>
              Discover something you'll love.
            </h1>

            <p>
              {store.description ||
                `Explore the products available at ${store.name}. We're glad to have you here.`}
            </p>

            <a href="#products" className="hero-button">
              Explore our products
              <i className="bi bi-arrow-right ms-2" />
            </a>
          </div>
        </section>

        <section className="store-benefits">
          <div className="benefit">
            <div className="benefit-icon">
              <i className="bi bi-bag-check" />
            </div>
            <div>
              <strong>Easy ordering</strong>
              <span>Shop from the comfort of your home.</span>
            </div>
          </div>

          <div className="benefit">
            <div className="benefit-icon">
              <i className="bi bi-shield-check" />
            </div>
            <div>
              <strong>Secure shopping</strong>
              <span>A simple and convenient shopping experience.</span>
            </div>
          </div>

          <div className="benefit">
            <div className="benefit-icon">
              <i className="bi bi-headset" />
            </div>
            <div>
              <strong>Customer support</strong>
              <span>Contact the store when you need assistance.</span>
            </div>
          </div>
        </section>

        <section id="products">
          <div className="section-heading">
            <div>
              <h2>Explore our products</h2>
              <p>Find something you would love to order.</p>
            </div>

            <div className="store-search">
              <i className="bi bi-search search-icon" />
              <input
                type="search"
                placeholder="Search products..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search products"
              />
            </div>
          </div>

          <div className="category-list" id="categories">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  activeCategory === category
                    ? "category-chip active"
                    : "category-chip"
                }
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                      />
                    ) : (
                      <i className="bi bi-image product-image-placeholder" />
                    )}
                  </div>

                  <div className="product-details">
                    <span className="product-category">
                      {product.category || "Product"}
                    </span>

                    <h3>{product.name}</h3>

                    <p className="product-description">
                      {product.description || "Available from this store."}
                    </p>

                    <div className="product-price">
                      {formatPrice(product.price, store.currency)}
                    </div>

                    {product.allow_portion_sales &&
                      Number(product.portion_price) > 0 && (
                        <span className="portion-price">
                          Portion: {formatPrice(
                            product.portion_price,
                            store.currency
                          )}
                          {product.portions_per_unit
                            ? ` · ${product.portions_per_unit} per ${product.unit || "unit"}`
                            : ""}
                        </span>
                      )}

                    <button
                      type="button"
                      className="add-button"
                      onClick={() => addToCart(product)}
                    >
                      <i className="bi bi-plus-lg me-2" />
                      Add to cart
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-products">
              <div className="empty-products-icon">
                <i className="bi bi-shop-window" />
              </div>

              <h3>
                {search
                  ? "No matching products"
                  : "Products are coming soon"}
              </h3>

              <p>
                {search
                  ? "Try another search term."
                  : "This store has not published any products yet. Please check back soon."}
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="store-footer">
        <div className="store-footer-inner">
          <div>
            <strong>{store.name}</strong>
            <p>Powered by MyDuka</p>
          </div>

          <Link to="/cart">
            <i className="bi bi-bag me-2" />
            View shopping cart ({cartCount})
          </Link>
        </div>
      </footer>
    </div>
  );
}
