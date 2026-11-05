import { Link } from "react-router-dom";
import api from "../api/api";

function ProductCard({ product }) {
  const isOutOfStock = Number(product.stock) <= 0;

  const getImageUrl = (image) => {
    if (!image) return null;

    const imagePath = String(image).trim();

    if (!imagePath) return null;

    // External image URLs.
    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }

    // Use the configured Flask backend URL.
    const baseURL = api.defaults.baseURL || "/api";

    const backendURL = new URL(baseURL, window.location.origin);

    // Support paths stored as /api/product-images/name.jpg,
    // api/product-images/name.jpg, or just name.jpg.
    let path = imagePath.replace(/\\/g, "/");

    if (!path.startsWith("/")) {
      path = `/${path}`;
    }

    if (!path.startsWith("/api/")) {
      const filename = path.split("/").pop();
      path = `/api/product-images/${filename}`;
    }

    return new URL(path, backendURL.origin).href;
  };

  const imageUrl = getImageUrl(product.image);

  return (
    <div className="card product-card h-100 border-0 shadow-sm">
      <div className="product-image-container">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="product-image"
            loading="lazy"
            onError={(event) => {
              console.error(
                "Failed to load product image:",
                event.currentTarget.src
              );

              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="d-flex justify-content-center align-items-center h-100 text-secondary">
            <span>No image available</span>
          </div>
        )}

        {isOutOfStock && (
          <span className="badge bg-danger stock-badge">
            Out of Stock
          </span>
        )}
      </div>

      <div className="card-body d-flex flex-column">
        <small className="text-success fw-semibold">
          {product.category}
        </small>

        <h5 className="card-title fw-bold mt-2">
          {product.name}
        </h5>

        <p className="text-secondary small">
          {product.unit}
        </p>

        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fs-5 fw-bold">
              KSh {Number(product.price).toLocaleString()}
            </span>

            {!isOutOfStock && (
              <span className="text-success small">
                {product.stock} available
              </span>
            )}
          </div>

          <Link
            to={`/products/${product.id}`}
            className="btn btn-outline-success w-100"
          >
            <i className="bi bi-eye me-2"></i>
            View Product
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
