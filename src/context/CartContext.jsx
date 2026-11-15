import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

const CartContext = createContext(null);

const CART_STORAGE_KEY = "mydukaCarts";
const ACTIVE_STORE_KEY = "mydukaActiveStore";

function readStoredCarts() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function getStockLimit(product) {
  const value = product?.available_quantity ?? product?.stock;

  if (value === undefined || value === null || value === "") {
    return null;
  }

  const stock = Number(value);
  return Number.isFinite(stock) ? Math.max(0, stock) : null;
}

export function CartProvider({ children }) {
  const location = useLocation();

  const routeMatch = location.pathname.match(/^\/store\/([^/]+)/);
  const routeStoreSlug = routeMatch
    ? decodeURIComponent(routeMatch[1])
    : null;

  const [lastStoreSlug, setLastStoreSlug] = useState(() => {
    return localStorage.getItem(ACTIVE_STORE_KEY) || "";
  });

  const [allCarts, setAllCarts] = useState(readStoredCarts);

  useEffect(() => {
    if (routeStoreSlug) {
      setLastStoreSlug(routeStoreSlug);
      localStorage.setItem(ACTIVE_STORE_KEY, routeStoreSlug);
    }
  }, [routeStoreSlug]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(allCarts));
  }, [allCarts]);

  const activeStoreSlug = routeStoreSlug || lastStoreSlug;
  const cartKey = activeStoreSlug || "default";

  const cartItems = useMemo(
    () => allCarts[cartKey] || [],
    [allCarts, cartKey]
  );

  const updateCurrentCart = (updater) => {
    setAllCarts((current) => {
      const existingItems = current[cartKey] || [];
      const updatedItems =
        typeof updater === "function"
          ? updater(existingItems)
          : updater;

      return {
        ...current,
        [cartKey]: updatedItems,
      };
    });
  };

  const addToCart = (product, quantity = 1) => {
    if (!product?.id) return;

    const requestedQuantity = Math.max(1, Number(quantity) || 1);
    const stockLimit = getStockLimit(product);

    if (stockLimit !== null && stockLimit < 1) return;

    updateCurrentCart((items) => {
      const existingItem = items.find(
        (item) => String(item.id) === String(product.id)
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + requestedQuantity;

        return items.map((item) => {
          if (String(item.id) !== String(product.id)) return item;

          return {
            ...item,
            quantity:
              stockLimit === null
                ? newQuantity
                : Math.min(newQuantity, stockLimit),
          };
        });
      }

      return [
        ...items,
        {
          ...product,
          quantity:
            stockLimit === null
              ? requestedQuantity
              : Math.min(requestedQuantity, stockLimit),
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    updateCurrentCart((items) =>
      items.filter(
        (item) => String(item.id) !== String(productId)
      )
    );
  };

  const updateQuantity = (productId, quantity) => {
    const requestedQuantity = Number(quantity);

    if (!Number.isFinite(requestedQuantity)) return;

    updateCurrentCart((items) =>
      items.map((item) => {
        if (String(item.id) !== String(productId)) return item;

        const stockLimit = getStockLimit(item);

        const newQuantity = Math.max(
          1,
          Math.floor(requestedQuantity)
        );

        return {
          ...item,
          quantity:
            stockLimit === null
              ? newQuantity
              : Math.min(newQuantity, stockLimit),
        };
      })
    );
  };

  const clearCart = () => {
    updateCurrentCart([]);
  };

  const cartCount = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const cartTotal = cartItems.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
    activeStoreSlug,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}
