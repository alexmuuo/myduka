import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { STORE_NAME } from "../config/store";
import { useCart } from "../context/CartContext";
import api from "../api/api";

const styles = `
.md-customer-header {
  position:sticky;
  top:0;
  z-index:100;
  background:#fff;
  border-bottom:1px solid #e8edf3;
  color:#172033;
}
.md-customer-header * { box-sizing:border-box; }
.md-customer-header button,
.md-customer-header a { font:inherit; }
.md-customer-topbar {
  padding:8px 20px;
  background:#172033;
  color:#dbe3ef;
  text-align:center;
  font-size:11px;
  letter-spacing:.2px;
}
.md-customer-nav {
  width:min(1280px,100%);
  min-height:75px;
  margin:auto;
  padding:12px 24px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:25px;
}
.md-customer-brand {
  display:flex;
  align-items:center;
  gap:11px;
  min-width:0;
  color:#172033;
  text-decoration:none;
}
.md-customer-brand-mark {
  width:43px;
  height:43px;
  flex-shrink:0;
  display:grid;
  place-items:center;
  border-radius:12px;
  background:#635bff;
  color:#fff;
  font-size:21px;
}
.md-customer-brand-name {
  display:block;
  font-size:19px;
  font-weight:850;
  letter-spacing:-.5px;
}
.md-customer-brand-caption {
  display:block;
  margin-top:2px;
  color:#8993a4;
  font-size:10px;
  font-weight:700;
  letter-spacing:1px;
}
.md-customer-links {
  display:flex;
  align-items:center;
  gap:23px;
}
.md-customer-links a {
  color:#526071;
  text-decoration:none;
  font-size:13px;
  font-weight:650;
  white-space:nowrap;
}
.md-customer-links a:hover,
.md-customer-links a.active {
  color:#635bff;
}
.md-customer-actions {
  display:flex;
  align-items:center;
  gap:10px;
}
.md-customer-icon-button {
  position:relative;
  width:40px;
  height:40px;
  display:grid;
  place-items:center;
  border:1px solid #e5e9f0;
  border-radius:10px;
  background:#fff;
  color:#526071;
  cursor:pointer;
  font-size:17px;
}
.md-customer-icon-button:hover {
  border-color:#c8c3ff;
  color:#635bff;
}
.md-customer-badge {
  position:absolute;
  top:-6px;
  right:-6px;
  min-width:18px;
  height:18px;
  display:grid;
  place-items:center;
  padding:0 4px;
  border:2px solid #fff;
  border-radius:20px;
  background:#ef476f;
  color:#fff;
  font-size:9px;
  font-weight:800;
}
.md-customer-cart {
  display:inline-flex;
  align-items:center;
  gap:9px;
  min-height:42px;
  padding:10px 14px;
  border-radius:10px;
  background:#635bff;
  color:#fff !important;
  text-decoration:none;
  font-size:12px;
  font-weight:800;
  white-space:nowrap;
}
.md-customer-cart:hover { background:#5148ed; }
.md-customer-cart-count {
  min-width:20px;
  height:20px;
  display:grid;
  place-items:center;
  padding:0 5px;
  border-radius:20px;
  background:#fff;
  color:#635bff;
  font-size:10px;
}
.md-customer-signin {
  display:inline-flex;
  align-items:center;
  gap:7px;
  padding:11px 15px;
  border:1px solid #e5e9f0;
  border-radius:10px;
  color:#344054;
  text-decoration:none;
  font-size:12px;
  font-weight:750;
  white-space:nowrap;
}
.md-customer-signin:hover {
  border-color:#635bff;
  color:#635bff;
}
.md-customer-account {
  position:relative;
}
.md-customer-account-button {
  display:flex;
  align-items:center;
  gap:8px;
  max-width:180px;
  padding:6px 10px 6px 6px;
  border:1px solid #e5e9f0;
  border-radius:30px;
  background:#fff;
  color:#344054;
  cursor:pointer;
  font-size:12px;
  font-weight:750;
}
.md-customer-avatar {
  width:29px;
  height:29px;
  display:grid;
  place-items:center;
  border-radius:50%;
  background:#f1f0ff;
  color:#635bff;
  font-size:14px;
}
.md-customer-account-menu,
.md-customer-notification-menu {
  position:absolute;
  top:calc(100% + 10px);
  right:0;
  z-index:120;
  width:260px;
  padding:8px;
  border:1px solid #e7ebf2;
  border-radius:13px;
  background:#fff;
  box-shadow:0 15px 40px rgba(15,23,42,.14);
}
.md-customer-account-menu a,
.md-customer-account-menu button {
  width:100%;
  display:flex;
  align-items:center;
  gap:10px;
  padding:11px;
  border:0;
  border-radius:8px;
  background:transparent;
  color:#475467;
  text-align:left;
  text-decoration:none;
  cursor:pointer;
  font-size:12px;
  font-weight:650;
}
.md-customer-account-menu a:hover,
.md-customer-account-menu button:hover {
  background:#f5f6fa;
  color:#635bff;
}
.md-customer-account-details {
  padding:11px;
  overflow:hidden;
}
.md-customer-account-details strong,
.md-customer-account-details small {
  display:block;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.md-customer-account-details strong { font-size:13px; }
.md-customer-account-details small {
  margin-top:4px;
  color:#8993a4;
  font-size:11px;
}
.md-customer-divider {
  height:1px;
  margin:5px 0;
  background:#edf0f5;
}
.md-customer-notification-menu {
  width:min(350px,calc(100vw - 24px));
  max-height:440px;
  overflow-y:auto;
}
.md-customer-notification-heading {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  padding:10px;
  border-bottom:1px solid #edf0f5;
  font-size:13px;
}
.md-customer-notification-heading button {
  border:0;
  background:none;
  color:#635bff;
  cursor:pointer;
  font-size:11px;
  font-weight:750;
}
.md-customer-notification-item {
  width:100%;
  display:flex;
  gap:11px;
  padding:12px 10px;
  border:0;
  border-bottom:1px solid #f0f2f6;
  background:#fff;
  color:#344054;
  text-align:left;
  cursor:pointer;
}
.md-customer-notification-item:hover,
.md-customer-notification-item.unread {
  background:#f8f8ff;
}
.md-customer-notification-icon {
  width:34px;
  height:34px;
  flex-shrink:0;
  display:grid;
  place-items:center;
  border-radius:10px;
  background:#f1f0ff;
  color:#635bff;
}
.md-customer-notification-copy {
  min-width:0;
  display:block;
}
.md-customer-notification-copy strong,
.md-customer-notification-copy span {
  display:block;
}
.md-customer-notification-copy strong {
  font-size:12px;
  margin-bottom:4px;
}
.md-customer-notification-copy span {
  color:#7b8798;
  font-size:11px;
  line-height:1.5;
}
.md-customer-notification-empty {
  padding:28px 12px;
  color:#8993a4;
  text-align:center;
  font-size:12px;
}
.md-customer-mobile-toggle {
  display:none;
  width:40px;
  height:40px;
  border:1px solid #e5e9f0;
  border-radius:10px;
  background:#fff;
  color:#344054;
  cursor:pointer;
  font-size:20px;
}
.md-customer-mobile-panel { display:contents; }
.md-customer-mobile-links { display:none; }
@media(max-width:1000px) {
  .md-customer-nav { gap:14px; padding:12px 18px; }
  .md-customer-links { gap:13px; }
  .md-customer-links a { font-size:12px; }
}
@media(max-width:760px) {
  .md-customer-nav { min-height:67px; padding:10px 15px; }
  .md-customer-brand-caption { display:none; }
  .md-customer-brand-name { font-size:17px; }
  .md-customer-brand-mark { width:39px; height:39px; }
  .md-customer-mobile-toggle { display:grid; place-items:center; }
  .md-customer-links { display:none; }
  .md-customer-mobile-panel {
    position:absolute;
    top:100%;
    left:0;
    right:0;
    display:none;
    padding:12px 16px 17px;
    border-top:1px solid #edf0f5;
    border-bottom:1px solid #e8edf3;
    background:#fff;
    box-shadow:0 12px 20px rgba(15,23,42,.07);
  }
  .md-customer-mobile-panel.open { display:block; }
  .md-customer-mobile-links {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:5px;
  }
  .md-customer-mobile-links a {
    display:flex;
    align-items:center;
    gap:9px;
    padding:12px 9px;
    border-radius:8px;
    color:#526071;
    text-decoration:none;
    font-size:12px;
    font-weight:700;
  }
  .md-customer-mobile-links a:hover,
  .md-customer-mobile-links a.active {
    background:#f4f3ff;
    color:#635bff;
  }
  .md-customer-mobile-account {
    display:flex;
    align-items:center;
    gap:10px;
    margin-top:12px;
    padding-top:12px;
    border-top:1px solid #edf0f5;
  }
  .md-customer-mobile-account a,
  .md-customer-mobile-account button {
    flex:1;
    padding:11px 8px;
    border:1px solid #e5e9f0;
    border-radius:8px;
    background:#fff;
    color:#526071;
    text-align:center;
    text-decoration:none;
    cursor:pointer;
    font-size:11px;
    font-weight:750;
  }
}
@media(max-width:390px) {
  .md-customer-nav { padding:9px 11px; gap:8px; }
  .md-customer-actions { gap:6px; }
  .md-customer-cart { padding:9px; gap:6px; }
  .md-customer-cart-label { display:none; }
  .md-customer-brand-name { font-size:15px; }
}
`;

const readableStoreName = (slug) =>
  (slug || "")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function Navbar() {
  const { cartCount, activeStoreSlug } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [customer, setCustomer] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notificationRef = useRef(null);
  const accountRef = useRef(null);

  const storeSlug = activeStoreSlug || "";
  const storeHome = storeSlug
    ? `/store/${encodeURIComponent(storeSlug)}`
    : "/";

  const storeName = storeSlug
    ? readableStoreName(storeSlug)
    : STORE_NAME;

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path));

  const links = [
    { label: "Home", path: storeHome, icon: "bi-house" },
    {
      label: "Shop",
      path: storeSlug ? `${storeHome}#products` : "/",
      icon: "bi-shop",
    },
    { label: "Wishlist", path: "/wishlist", icon: "bi-heart" },
    { label: "Track Order", path: "/track-order", icon: "bi-truck" },
    { label: "Help & Support", path: "/ask-support", icon: "bi-headset" },
  ];

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
        const parsed = JSON.parse(savedCustomer);

        if (!parsed?.id) {
          setCustomer(null);
          return;
        }

        setCustomer(parsed);
      } catch {
        localStorage.removeItem("customer");
        localStorage.removeItem("customerToken");
        setCustomer(null);
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

  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }

      if (
        accountRef.current &&
        !accountRef.current.contains(event.target)
      ) {
        setAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!customer?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setUnreadMessageCount(0);
      return;
    }

    let cancelled = false;

    const hasActiveSession = () => {
      try {
        const token = localStorage.getItem("customerToken");
        const saved = JSON.parse(
          localStorage.getItem("customer") || "null"
        );

        return (
          Boolean(token) &&
          String(saved?.id) === String(customer.id)
        );
      } catch {
        return false;
      }
    };

    const loadNotifications = async () => {
      try {
        const [listResponse, countResponse] = await Promise.all([
          api.get(`/notifications/customer/${customer.id}`),
          api.get(
            `/notifications/customer/${customer.id}/unread-count`
          ),
        ]);

        if (cancelled || !hasActiveSession()) return;

        setNotifications(
          Array.isArray(listResponse.data?.data)
            ? listResponse.data.data
            : []
        );

        setUnreadCount(
          Number(countResponse.data?.unread_count) || 0
        );
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Could not load customer notifications:",
            error.response?.data || error.message
          );
        }
      }
    };

    const loadUnreadMessages = async () => {
      try {
        const response = await api.get("/messages/unread-count");

        if (cancelled || !hasActiveSession()) return;

        setUnreadMessageCount(
          Number(response.data?.unread_count) || 0
        );
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Could not load unread messages:",
            error.response?.data || error.message
          );
        }
      }
    };

    loadNotifications();
    loadUnreadMessages();

    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadMessages();
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [customer?.id]);

  const handleLogout = () => {
    localStorage.removeItem("customer");
    localStorage.removeItem("customerToken");

    setCustomer(null);
    setNotifications([]);
    setUnreadCount(0);
    setUnreadMessageCount(0);
    setAccountOpen(false);
    setMobileMenuOpen(false);

    window.dispatchEvent(new Event("customerLogout"));
    navigate(storeHome);
  };

  const handleNotificationClick = async (notification) => {
    if (!customer?.id || notification.is_read) return;

    try {
      await api.put(`/notifications/${notification.id}/read`);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true }
            : item
        )
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error(
        "Could not mark notification as read:",
        error.response?.data || error.message
      );
    }
  };

  const markAllAsRead = async () => {
    if (!customer?.id || unreadCount === 0) return;

    try {
      await api.put(
        `/notifications/customer/${customer.id}/read-all`
      );

      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Could not mark notifications as read:",
        error.response?.data || error.message
      );
    }
  };

  const notificationIcon = (type) => {
    if (type === "order") return "bi-box-seam";
    if (type === "message") return "bi-chat-dots";
    return "bi-bell";
  };

  return (
    <header className="md-customer-header">
      <style>{styles}</style>

      <div className="md-customer-topbar">
        Welcome to {storeName} · A better way to shop
      </div>

      <nav className="md-customer-nav" aria-label="Customer navigation">
        <Link className="md-customer-brand" to={storeHome}>
          <span className="md-customer-brand-mark">
            <i className="bi bi-shop" />
          </span>

          <span>
            <span className="md-customer-brand-name">
              {storeName}
            </span>
            <span className="md-customer-brand-caption">
              POWERED BY {STORE_NAME.toUpperCase()}
            </span>
          </span>
        </Link>

        <div className="md-customer-links">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={
                isActive(link.path.split("#")[0]) ? "active" : ""
              }
            >
              {link.label}
              {link.label === "Help & Support" &&
                unreadMessageCount > 0 && (
                  <span className="md-customer-badge">
                    {unreadMessageCount > 99
                      ? "99+"
                      : unreadMessageCount}
                  </span>
                )}
            </Link>
          ))}
        </div>

        <div className="md-customer-actions">
          {customer && (
            <div ref={notificationRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="md-customer-icon-button"
                aria-label={`Notifications, ${unreadCount} unread`}
                aria-expanded={notificationsOpen}
                onClick={() =>
                  setNotificationsOpen((current) => !current)
                }
              >
                <i className="bi bi-bell" />
                {unreadCount > 0 && (
                  <span className="md-customer-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="md-customer-notification-menu">
                  <div className="md-customer-notification-heading">
                    <strong>Notifications</strong>
                    {unreadCount > 0 && (
                      <button type="button" onClick={markAllAsRead}>
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="md-customer-notification-empty">
                      <i className="bi bi-bell-slash me-2" />
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        className={`md-customer-notification-item ${
                          !notification.is_read ? "unread" : ""
                        }`}
                        onClick={() =>
                          handleNotificationClick(notification)
                        }
                      >
                        <span className="md-customer-notification-icon">
                          <i
                            className={`bi ${notificationIcon(
                              notification.type
                            )}`}
                          />
                        </span>

                        <span className="md-customer-notification-copy">
                          <strong>{notification.title}</strong>
                          <span>{notification.message}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <Link
            to="/cart"
            className="md-customer-cart"
            aria-label={`Shopping cart, ${cartCount} items`}
          >
            <i className="bi bi-bag" />
            <span className="md-customer-cart-label">Cart</span>
            <span className="md-customer-cart-count">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          </Link>

          {customer ? (
            <div
              className="md-customer-account"
              ref={accountRef}
            >
              <button
                type="button"
                className="md-customer-account-button"
                aria-expanded={accountOpen}
                onClick={() =>
                  setAccountOpen((current) => !current)
                }
              >
                <span className="md-customer-avatar">
                  <i className="bi bi-person" />
                </span>
                <span>
                  {customer.name || "My account"}
                </span>
                <i className="bi bi-chevron-down" />
              </button>

              {accountOpen && (
                <div className="md-customer-account-menu">
                  <div className="md-customer-account-details">
                    <strong>{customer.name}</strong>
                    <small>{customer.phone || customer.email}</small>
                  </div>

                  <div className="md-customer-divider" />

                  <Link to="/account">
                    <i className="bi bi-person-circle" />
                    My account
                  </Link>

                  <Link to="/account/orders">
                    <i className="bi bi-receipt" />
                    My orders
                  </Link>

                  <Link to="/account/profile">
                    <i className="bi bi-gear" />
                    Profile settings
                  </Link>

                  <div className="md-customer-divider" />

                  <button type="button" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="md-customer-signin">
              <i className="bi bi-person" />
              Sign in
            </Link>
          )}

          <button
            type="button"
            className="md-customer-mobile-toggle"
            aria-label={
              mobileMenuOpen ? "Close menu" : "Open menu"
            }
            aria-expanded={mobileMenuOpen}
            onClick={() =>
              setMobileMenuOpen((current) => !current)
            }
          >
            <i
              className={`bi ${
                mobileMenuOpen ? "bi-x-lg" : "bi-list"
              }`}
            />
          </button>
        </div>

        <div
          className={`md-customer-mobile-panel ${
            mobileMenuOpen ? "open" : ""
          }`}
        >
          <div className="md-customer-mobile-links">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={
                  isActive(link.path.split("#")[0]) ? "active" : ""
                }
              >
                <i className={`bi ${link.icon}`} />
                {link.label}
                {link.label === "Help & Support" &&
                  unreadMessageCount > 0 && (
                    <span className="md-customer-badge">
                      {unreadMessageCount > 99
                        ? "99+"
                        : unreadMessageCount}
                    </span>
                  )}
              </Link>
            ))}
          </div>

          <div className="md-customer-mobile-account">
            {customer ? (
              <>
                <Link to="/account">
                  <i className="bi bi-person me-1" />
                  My account
                </Link>
                <button type="button" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-1" />
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login">
                <i className="bi bi-person me-1" />
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
