import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { STORE_NAME } from "../config/store";
import { useCart } from "../context/CartContext";
import api from "../api/api";

function Navbar() {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [customer, setCustomer] = useState(null);
  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notificationButtonRef = useRef(null);

  const [notificationDropdownPosition, setNotificationDropdownPosition] =
    useState({
      top: 80,
      left: 12,
      width: 350,
      maxHeight: 450,
    });

  const positionNotificationDropdown = () => {
    const button = notificationButtonRef.current;

    if (!button) return;

    const rect = button.getBoundingClientRect();
    const viewportPadding = 12;

    const width = Math.min(
      350,
      window.innerWidth - viewportPadding * 2
    );

    const left = Math.min(
      Math.max(viewportPadding, rect.right - width),
      window.innerWidth - width - viewportPadding
    );

    const top = rect.bottom + 6;

    const maxHeight = Math.max(
      120,
      Math.min(
        450,
        window.innerHeight - top - viewportPadding
      )
    );

    setNotificationDropdownPosition({
      top,
      left,
      width,
      maxHeight,
    });
  };

  // LOAD LOGGED-IN CUSTOMER
  useEffect(() => {
    const loadCustomer = () => {
      const token = localStorage.getItem("customerToken");
      const savedCustomer = localStorage.getItem("customer");

      if (!token || !savedCustomer) {
        setCustomer(null);
        setNotifications([]);
        setUnreadCount(0);
        setUnreadMessageCount(0);
        return;
      }

      try {
        const parsedCustomer = JSON.parse(savedCustomer);

        if (!parsedCustomer?.id) {
          setCustomer(null);
          setNotifications([]);
          setUnreadCount(0);
          setUnreadMessageCount(0);
          return;
        }

        setCustomer(parsedCustomer);
      } catch (error) {
        console.error("Invalid customer data:", error);

        localStorage.removeItem("customer");
        localStorage.removeItem("customerToken");

        setCustomer(null);
        setNotifications([]);
        setUnreadCount(0);
        setUnreadMessageCount(0);
      }
    };

    loadCustomer();

    window.addEventListener("customerLogin", loadCustomer);
    window.addEventListener("customerLogout", loadCustomer);
    window.addEventListener("storage", loadCustomer);

    return () => {
      window.removeEventListener("customerLogin", loadCustomer);
      window.removeEventListener("customerLogout", loadCustomer);
      window.removeEventListener("storage", loadCustomer);
    };
  }, []);

  // LOAD PRODUCT CATEGORIES
  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const response = await api.get("/products");

        if (cancelled || !Array.isArray(response.data)) {
          return;
        }

        const categoryNames = response.data
          .map((product) =>
            typeof product.category === "string"
              ? product.category.trim()
              : ""
          )
          .filter((category) => category.length > 0);

        const uniqueCategories = [
          ...new Set(categoryNames),
        ].sort((a, b) => a.localeCompare(b));

        setCategories(uniqueCategories);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Could not load categories:",
            error.response?.data || error.message
          );
        }
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // LOAD CUSTOMER NOTIFICATIONS
  useEffect(() => {
    let cancelled = false;

    if (!customer?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setNotifications([]);
    setUnreadCount(0);

    const hasActiveSession = () => {
      try {
        const token = localStorage.getItem("customerToken");

        const savedCustomer = JSON.parse(
          localStorage.getItem("customer") || "null"
        );

        return (
          Boolean(token) &&
          String(savedCustomer?.id) === String(customer.id)
        );
      } catch {
        return false;
      }
    };

    const loadNotifications = async () => {
      try {
        const response = await api.get(
          `/notifications/customer/${customer.id}`
        );

        if (cancelled || !hasActiveSession()) {
          return;
        }

        setNotifications(
          Array.isArray(response.data?.data)
            ? response.data.data
            : []
        );
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Could not load notifications:",
            error.response?.data || error.message
          );
        }
      }
    };

    const loadUnreadCount = async () => {
      try {
        const response = await api.get(
          `/notifications/customer/${customer.id}/unread-count`
        );

        if (cancelled || !hasActiveSession()) {
          return;
        }

        setUnreadCount(
          Number(response.data?.unread_count) || 0
        );
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Could not load unread notification count:",
            error.response?.data || error.message
          );
        }
      }
    };

    const refreshNotifications = () => {
      loadNotifications();
      loadUnreadCount();
    };

    refreshNotifications();

    const interval = setInterval(refreshNotifications, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [customer?.id]);

  // LOAD UNREAD CUSTOMER MESSAGES
  useEffect(() => {
    let cancelled = false;

    if (!customer?.id) {
      setUnreadMessageCount(0);
      return;
    }

    setUnreadMessageCount(0);

    const loadUnreadMessages = async () => {
      try {
        const response = await api.get("/messages/unread-count");

        if (cancelled) {
          return;
        }

        const token = localStorage.getItem("customerToken");

        const savedCustomer = JSON.parse(
          localStorage.getItem("customer") || "null"
        );

        const hasActiveSession =
          Boolean(token) &&
          String(savedCustomer?.id) === String(customer.id);

        if (!hasActiveSession) {
          setUnreadMessageCount(0);
          return;
        }

        setUnreadMessageCount(
          Number(response.data?.unread_count) || 0
        );
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Could not load unread message count:",
            error.response?.data || error.message
          );
        }
      }
    };

    loadUnreadMessages();

    const interval = setInterval(loadUnreadMessages, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [customer?.id]);

  // CUSTOMER LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("customer");
    localStorage.removeItem("customerToken");

    setCustomer(null);
    setNotifications([]);
    setUnreadCount(0);
    setUnreadMessageCount(0);
    setMobileMenuOpen(false);

    window.dispatchEvent(new Event("customerLogout"));

    navigate("/");
  };

  // MARK ONE NOTIFICATION AS READ
  const handleNotificationClick = async (notification) => {
    if (!customer?.id || notification.is_read) {
      return;
    }

    try {
      await api.put(`/notifications/${notification.id}/read`);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true }
            : item
        )
      );

      setUnreadCount((count) => Math.max(count - 1, 0));
    } catch (error) {
      console.error(
        "Could not mark notification as read:",
        error.response?.data || error.message
      );
    }
  };

  // MARK ALL NOTIFICATIONS AS READ
  const markAllAsRead = async () => {
    if (!customer?.id || unreadCount === 0) {
      return;
    }

    try {
      await api.put(
        `/notifications/customer/${customer.id}/read-all`
      );

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Could not mark notifications as read:",
        error.response?.data || error.message
      );
    }
  };

  // CLOSE MOBILE MENU AFTER NAVIGATION
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // ACTIVE NAVIGATION LINK
  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const navLinkClass = (path) =>
    `hm-nav-link${isActive(path) ? " hm-nav-link-active" : ""}`;

  return (
    <header className="hm-header">
      {/* BRAND STRIP */}
      <div className="hm-top-strip">
        <div className="hm-top-strip-inner">
          <span>
            <i className="bi bi-award me-2"></i>
            Quality drinks. Memorable moments.
          </span>

          <span className="hm-responsible-note">
            Please enjoy responsibly.
          </span>
        </div>
      </div>

      {/* MAIN NAVIGATION */}
      <nav className="hm-navbar">
        <div className="hm-navbar-inner">
          {/* BRAND */}
          <Link
            className="hm-brand"
            to="/"
            aria-label={`${STORE_NAME} home`}
          >
            <span className="hm-brand-mark">
              <i className="bi bi-cup-straw"></i>
            </span>

            <span className="hm-brand-copy">
              <span className="hm-brand-name">
                {STORE_NAME}
              </span>

              <span className="hm-brand-caption">
                GOOD TASTE. GREAT COMPANY.
              </span>
            </span>
          </Link>

          {/* MOBILE MENU BUTTON */}
          <button
            className={`hm-mobile-toggle${
              mobileMenuOpen ? " hm-mobile-toggle-open" : ""
            }`}
            type="button"
            onClick={() =>
              setMobileMenuOpen((current) => !current)
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="hm-main-navigation"
            aria-label={
              mobileMenuOpen ? "Close navigation" : "Open navigation"
            }
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* NAVIGATION CONTENT */}
          <div
            id="hm-main-navigation"
            className={`hm-navigation-content${
              mobileMenuOpen ? " hm-navigation-open" : ""
            }`}
          >
            <div className="hm-navigation-links">
              <Link
                className={navLinkClass("/")}
                to="/"
              >
                Home
              </Link>

              <Link
                className={navLinkClass("/products")}
                to="/products"
              >
                Shop
              </Link>

              {/* CATEGORIES */}
              <div className="dropdown hm-nav-dropdown">
                <button
                  className={`hm-nav-link hm-category-trigger${
                    location.pathname === "/categories"
                      ? " hm-nav-link-active"
                      : ""
                  }`}
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Categories
                  <i className="bi bi-chevron-down ms-2"></i>
                </button>

                <ul className="dropdown-menu hm-category-menu">
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/categories"
                    >
                      <i className="bi bi-grid me-2"></i>
                      All Categories
                    </Link>
                  </li>

                  <li>
                    <hr className="dropdown-divider" />
                  </li>

                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <li key={category}>
                        <Link
                          className="dropdown-item"
                          to={`/products?category=${encodeURIComponent(
                            category
                          )}`}
                        >
                          {category}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li>
                      <span className="dropdown-item-text text-muted">
                        No categories available
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {/* CUSTOMER HELP / MESSAGES */}
              <Link
                className={`${navLinkClass("/ask-support")} hm-help-link`}
                to="/ask-support"
                aria-label={
                  customer && unreadMessageCount > 0
                    ? `Customer help, ${unreadMessageCount} unread messages`
                    : "Customer help"
                }
              >
                Help & Support

                {customer && unreadMessageCount > 0 && (
                  <span className="hm-message-badge">
                    {unreadMessageCount > 99
                      ? "99+"
                      : unreadMessageCount}
                  </span>
                )}
              </Link>
            </div>

            {/* ACTIONS */}
            <div className="hm-nav-actions">
              {/* NOTIFICATIONS */}
              {customer && (
                <div className="dropdown hm-notification-wrapper">
                  <button
                    ref={notificationButtonRef}
                    className="hm-icon-button"
                    type="button"
                    data-bs-toggle="dropdown"
                    data-bs-display="static"
                    onClick={positionNotificationDropdown}
                    aria-expanded="false"
                    aria-label={
                      unreadCount > 0
                        ? `Notifications, ${unreadCount} unread`
                        : "Notifications"
                    }
                    title="Notifications"
                  >
                    <i className="bi bi-bell"></i>

                    {unreadCount > 0 && (
                      <span className="hm-count-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  <div
                    className="dropdown-menu shadow hm-notification-dropdown"
                    style={{
                      top: `${notificationDropdownPosition.top}px`,
                      left: `${notificationDropdownPosition.left}px`,
                      width: `${notificationDropdownPosition.width}px`,
                      maxHeight: `${notificationDropdownPosition.maxHeight}px`,
                    }}
                  >
                    <div className="hm-notification-heading">
                      <strong>Notifications</strong>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="hm-notification-empty">
                        <i className="bi bi-bell-slash"></i>
                        <span>No notifications yet.</span>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map(
                        (notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            className={`hm-notification-item${
                              !notification.is_read
                                ? " hm-notification-unread"
                                : ""
                            }`}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                          >
                            <span className="hm-notification-icon">
                              <i
                                className={`bi ${
                                  notification.type === "order"
                                    ? "bi-box-seam"
                                    : notification.type === "message"
                                    ? "bi-chat-dots"
                                    : "bi-bell"
                                }`}
                              ></i>
                            </span>

                            <span className="hm-notification-text">
                              <strong>{notification.title}</strong>

                              <span>{notification.message}</span>

                              {!notification.is_read && (
                                <small>NEW</small>
                              )}
                            </span>
                          </button>
                        )
                      )
                    )}
                  </div>
                </div>
              )}

              {/* CART */}
              <Link
                to="/cart"
                className={`hm-cart-button${
                  isActive("/cart") ? " hm-cart-active" : ""
                }`}
                aria-label={`Shopping cart, ${cartCount} items`}
              >
                <i className="bi bi-bag"></i>
                <span className="hm-cart-label">Cart</span>

                <span className="hm-cart-count">
                  {cartCount}
                </span>
              </Link>

              {/* CUSTOMER ACCOUNT */}
              {customer ? (
                <div className="dropdown hm-account-dropdown">
                  <button
                    className="hm-account-button dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <span className="hm-account-avatar">
                      <i className="bi bi-person"></i>
                    </span>

                    <span className="hm-account-name">
                      {customer.name}
                    </span>
                  </button>

                  <ul className="dropdown-menu dropdown-menu-end hm-account-menu">
                    <li className="hm-account-details">
                      <strong>{customer.name}</strong>
                      <small>{customer.phone}</small>
                    </li>

                    <li>
                      <hr className="dropdown-divider" />
                    </li>

                    <li>
                      <button
                        type="button"
                        className="dropdown-item hm-logout-button"
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Sign out
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hm-login-button"
                >
                  <i className="bi bi-person me-2"></i>
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
