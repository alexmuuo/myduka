import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { useCart } from "../context/CartContext";

const styles = `
  .hm-catalogue {
    --ink: #171d19;
    --panel: #202923;
    --panel-light: #28342b;
    --green: #234c35;
    --green-light: #326747;
    --gold: #d6b36a;
    --cream: #f7f5ef;
    --muted: #a8b2a9;
    --border: rgba(255,255,255,.10);

    min-height: 75vh;
    padding: 45px 0 80px;
    background: var(--ink);
    color: var(--cream);
  }

  .hm-catalogue *,
  .hm-catalogue *::before,
  .hm-catalogue *::after {
    box-sizing: border-box;
  }

  .hm-catalogue-container {
    width: min(1200px, calc(100% - 40px));
    margin: 0 auto;
  }

  .hm-catalogue-hero {
    position: relative;
    overflow: hidden;
    padding: 48px 42px;
    margin-bottom: 38px;
    border: 1px solid var(--border);
    border-radius: 20px;
    background:
      radial-gradient(
        ellipse at 85% 15%,
        rgba(251, 191, 36,.15),
        transparent 40%
      ),
      linear-gradient(130deg, #26372b, #1c241e 75%);
  }

  .hm-catalogue-hero::after {
    content: "";
    position: absolute;
    width: 250px;
    height: 250px;
    right: -70px;
    bottom: -150px;
    border: 1px solid rgba(251, 191, 36,.15);
    border-radius: 50%;
    box-shadow:
      0 0 0 25px rgba(251, 191, 36,.025),
      0 0 0 50px rgba(251, 191, 36,.025);
    pointer-events: none;
  }

  .hm-catalogue-eyebrow {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 17px;
    color: var(--gold);
    font-size: .75rem;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  .hm-catalogue-eyebrow::before {
    content: "";
    width: 28px;
    height: 1px;
    background: var(--gold);
  }

  .hm-catalogue-heading {
    max-width: 700px;
    margin: 0;
    color: var(--cream);
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(2.3rem, 5vw, 4rem);
    font-weight: 600;
    line-height: 1.1;
  }

  .hm-catalogue-description {
    max-width: 560px;
    margin: 17px 0 0;
    color: #b9c4ba;
    font-size: 1rem;
    line-height: 1.8;
  }

  .hm-catalogue-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    flex-wrap: wrap;
    margin-bottom: 25px;
  }

  .hm-catalogue-section-title {
    margin: 0;
    color: var(--cream);
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1.8rem;
    font-weight: 600;
  }

  .hm-catalogue-count {
    margin-top: 5px;
    color: var(--muted);
    font-size: .85rem;
  }

  .hm-catalogue-search {
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(360px, 100%);
    min-height: 48px;
    padding: 0 15px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: #202923;
    color: var(--gold);
  }

  .hm-catalogue-search input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--cream);
    font: inherit;
    font-size: .9rem;
  }

  .hm-catalogue-search input::placeholder {
    color: #89958b;
  }

  .hm-catalogue-search:focus-within {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(251, 191, 36,.08);
  }

  .hm-catalogue-categories {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
    margin-bottom: 30px;
  }

  .hm-category-button {
    padding: 9px 16px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: transparent;
    color: #b9c4ba;
    cursor: pointer;
    font-size: .83rem;
    font-weight: 650;
    transition: .2s ease;
  }

  .hm-category-button:hover,
  .hm-category-button.active {
    border-color: var(--gold);
    background: rgba(251, 191, 36,.12);
    color: var(--gold);
  }

  .hm-catalogue-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 22px;
  }

  .hm-product-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 15px;
    background: var(--panel);
    transition:
      transform .25s ease,
      border-color .25s ease,
      box-shadow .25s ease;
  }

  .hm-product-card:hover {
    transform: translateY(-5px);
    border-color: rgba(251, 191, 36,.4);
    box-shadow: 0 15px 35px rgba(0,0,0,.2);
  }

  .hm-product-card-image {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 235px;
    padding: 20px;
    overflow: hidden;
    background:
      radial-gradient(
        ellipse at center,
        rgba(251, 191, 36,.10),
        transparent 65%
      ),
      linear-gradient(145deg, #2b382e, #202923);
  }

  .hm-product-card-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform .3s ease;
  }

  .hm-product-card:hover .hm-product-card-image img {
    transform: scale(1.06);
  }

  .hm-product-placeholder {
    display: grid;
    width: 85px;
    height: 85px;
    place-items: center;
    border: 1px solid rgba(251, 191, 36,.2);
    border-radius: 50%;
    color: var(--gold);
    font-size: 2rem;
  }

  .hm-product-category-badge {
    position: absolute;
    top: 13px;
    left: 13px;
    max-width: calc(100% - 26px);
    overflow: hidden;
    padding: 6px 10px;
    border: 1px solid rgba(251, 191, 36,.25);
    border-radius: 999px;
    background: rgba(23,29,25,.85);
    color: var(--gold);
    font-size: .7rem;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hm-product-card-body {
    padding: 18px;
  }

  .hm-product-card-name {
    display: -webkit-box;
    min-height: 48px;
    margin: 0;
    overflow: hidden;
    color: var(--cream);
    font-size: 1.02rem;
    font-weight: 750;
    line-height: 1.5;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .hm-product-card-unit {
    margin-top: 5px;
    color: var(--muted);
    font-size: .8rem;
  }

  .hm-product-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 19px;
    padding-top: 15px;
    border-top: 1px solid var(--border);
  }

  .hm-product-card-price {
    color: var(--gold);
    font-size: 1.15rem;
    font-weight: 850;
    white-space: nowrap;
  }

  .hm-product-view-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 9px 13px;
    border: 1px solid rgba(251, 191, 36,.5);
    border-radius: 8px;
    background: transparent;
    color: var(--gold);
    font-size: .78rem;
    font-weight: 750;
    text-decoration: none;
    transition: .2s ease;
  }

  .hm-product-view-button:hover {
    border-color: var(--gold);
    background: var(--gold);
    color: #1c251e;
  }

  .hm-product-stock {
    margin-top: 11px;
    color: #8cdda1;
    font-size: .76rem;
    font-weight: 650;
  }

  .hm-product-stock.out {
    color: #ff9999;
  }

  .hm-catalogue-state {
    display: flex;
    min-height: 300px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
  }

  .hm-catalogue-state-icon {
    display: grid;
    width: 65px;
    height: 65px;
    margin-bottom: 20px;
    place-items: center;
    border: 1px solid rgba(251, 191, 36,.25);
    border-radius: 50%;
    background: rgba(251, 191, 36,.08);
    color: var(--gold);
    font-size: 1.8rem;
  }

  .hm-catalogue-state h3 {
    margin: 0 0 10px;
    color: var(--cream);
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1.7rem;
  }

  .hm-catalogue-state p {
    max-width: 430px;
    margin: 0;
    color: var(--muted);
    line-height: 1.7;
  }

  .hm-catalogue-spinner {
    width: 43px;
    height: 43px;
    margin-bottom: 22px;
    border: 3px solid rgba(251, 191, 36,.2);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: hm-catalogue-spin .8s linear infinite;
  }

  @keyframes hm-catalogue-spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1050px) {
    .hm-catalogue-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .hm-catalogue {
      padding: 28px 0 55px;
    }

    .hm-catalogue-container {
      width: calc(100% - 28px);
    }

    .hm-catalogue-hero {
      padding: 34px 24px;
      margin-bottom: 30px;
    }

    .hm-catalogue-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 13px;
    }

    .hm-product-card-image {
      height: 180px;
      padding: 13px;
    }

    .hm-product-card-body {
      padding: 13px;
    }

    .hm-product-card-name {
      min-height: 44px;
      font-size: .9rem;
    }

    .hm-product-card-price {
      font-size: 1rem;
    }

    .hm-product-view-button {
      min-height: 34px;
      padding: 7px 9px;
      font-size: .72rem;
    }

    .hm-catalogue-toolbar {
      align-items: stretch;
    }

    .hm-catalogue-search {
      width: 100%;
    }
  }

  @media (max-width: 380px) {
    .hm-catalogue-grid {
      grid-template-columns: 1fr;
    }

    .hm-product-card-image {
      height: 230px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hm-catalogue *,
    .hm-catalogue *::before,
    .hm-catalogue *::after {
      animation-duration: .01ms !important;
      transition-duration: .01ms !important;
    }
  }
`;

function Products() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const formatMoney = (value) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "0";

    return amount.toLocaleString("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

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

    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/products");

        const data = response.data;

        const fetchedProducts = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.data)
          ? data.data
          : [];

        if (!cancelled) {
          // Only display active products in the customer catalogue.
          const activeProducts = fetchedProducts.filter((product) => {
            if (
              product.is_active === false ||
              product.is_active === 0 ||
              product.is_active === "false" ||
              product.is_active === "0"
            ) {
              return false;
            }

            return true;
          });

          setProducts(activeProducts);
        }
      } catch (err) {
        console.error(
          "Failed to load customer products:",
          err.response?.data || err.message
        );

        if (!cancelled) {
          setError(
            "We couldn't load the product collection. Please refresh the page and try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        products
          .map((product) => String(product.category || "").trim())
          .filter(Boolean)
      ),
    ];

    return ["All", ...uniqueCategories.sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const name = String(product.name || "").toLowerCase();
      const category = String(product.category || "").toLowerCase();
      const description = String(product.description || "").toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        name.includes(normalizedSearch) ||
        category.includes(normalizedSearch) ||
        description.includes(normalizedSearch);

      const matchesCategory =
        selectedCategory === "All" ||
        String(product.category || "").toLowerCase() ===
          selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  if (loading) {
    return (
      <div className="hm-catalogue">
        <style>{styles}</style>

        <div className="hm-catalogue-container">
          <div className="hm-catalogue-state" role="status">
            <div className="hm-catalogue-spinner" />

            <h3>Preparing the collection</h3>

            <p>
              Just a moment while we bring together our available products.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hm-catalogue">
        <style>{styles}</style>

        <div className="hm-catalogue-container">
          <div className="hm-catalogue-state">
            <div className="hm-catalogue-state-icon">!</div>

            <h3>Unable to load products</h3>

            <p>{error}</p>

            <button
              type="button"
              className="hm-product-view-button"
              style={{ marginTop: 22, cursor: "pointer" }}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hm-catalogue">
      <style>{styles}</style>

      <div className="hm-catalogue-container">
        <section className="hm-catalogue-hero">
          <div className="hm-catalogue-eyebrow">
            MyDuka
          </div>

          <h1 className="hm-catalogue-heading">
            Discover the Collection
          </h1>

          <p className="hm-catalogue-description">
            Explore our carefully selected collection. Find your preferred
            products, discover something new and add your selection to your
            cart.
          </p>
        </section>

        <section>
          <div className="hm-catalogue-toolbar">
            <div>
              <h2 className="hm-catalogue-section-title">
                Our Products
              </h2>

              <div className="hm-catalogue-count">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"}{" "}
                available
              </div>
            </div>

            <label className="hm-catalogue-search">
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                placeholder="Search products..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search products"
              />
            </label>
          </div>

          {categories.length > 1 && (
            <div className="hm-catalogue-categories">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`hm-category-button ${
                    selectedCategory === category ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="hm-catalogue-state">
              <div className="hm-catalogue-state-icon">
                ⌕
              </div>

              <h3>
                {products.length === 0
                  ? "Our collection is being updated"
                  : "No matching products"}
              </h3>

              <p>
                {products.length === 0
                  ? "There are currently no products available. Please check back soon."
                  : "We couldn't find products matching your search. Try another name or category."}
              </p>

              {(search || selectedCategory !== "All") && (
                <button
                  type="button"
                  className="hm-product-view-button"
                  style={{ marginTop: 20, cursor: "pointer" }}
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("All");
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="hm-catalogue-grid">
              {filteredProducts.map((product) => {
                const stock = Math.max(0, Number(product.stock) || 0);
                const imageUrl = getImageUrl(product.image);

                return (
                  <article
                    className="hm-product-card"
                    key={product.id}
                  >
                    <Link
                      to={`/products/${product.id}`}
                      style={{
                        display: "block",
                        color: "inherit",
                        textDecoration: "none",
                      }}
                      aria-label={`View ${product.name}`}
                    >
                      <div className="hm-product-card-image">
                        {product.category && (
                          <span className="hm-product-category-badge">
                            {product.category}
                          </span>
                        )}

                        {product.image ? (
                          <img
                            src={imageUrl}
                            alt={product.name || "Product"}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="hm-product-placeholder">
                            ◇
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="hm-product-card-body">
                      <h3 className="hm-product-card-name">
                        {product.name}
                      </h3>

                      {product.unit && (
                        <div className="hm-product-card-unit">
                          Per {product.unit}
                        </div>
                      )}

                      <div
                        className={`hm-product-stock ${
                          stock <= 0 ? "out" : ""
                        }`}
                      >
                        {stock > 0
                          ? "Available"
                          : "Currently unavailable"}
                      </div>

                      <div className="hm-product-card-bottom">
                        <div className="hm-product-card-price">
                          KSh {formatMoney(product.price)}
                        </div>

                        <Link
                          to={`/products/${product.id}`}
                          className="hm-product-view-button"
                        >
                          View Product
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Products;
