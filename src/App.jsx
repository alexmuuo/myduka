import {
  Suspense,
  lazy,
} from "react";

import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  Link,
} from "react-router-dom";

// Shared navigation
import Navbar from "./components/Navbar";
import AdminNavbar from "./components/AdminNavbar";
import CashierNavbar from "./components/CashierNavbar";

// Existing route protection
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import CashierProtectedRoute from "./components/CashierProtectedRoute";
import SuperAdminProtectedRoute from "./components/SuperAdminProtectedRoute";

// Automatically discover all JSX pages.
const pageModules = import.meta.glob("./pages/**/*.jsx");

// Frontend development mode
const FRONTEND_DEMO_MODE =
  import.meta.env.DEV ||
  import.meta.env.VITE_FRONTEND_DEMO_MODE === "true";

// =====================================================
// PAGE LOADING
// =====================================================

function PageLoading() {
  return (
    <div className="page-loading">
      <div className="page-loading-spinner" />
      <p>Loading MyDuka...</p>
    </div>
  );
}

// =====================================================
// PAGE PLACEHOLDER
// =====================================================

function PagePlaceholder({ title }) {
  return (
    <div className="page-placeholder">
      <div className="page-placeholder-icon">✦</div>

      <h2>{title}</h2>

      <p>
        This page is registered and ready for development.
      </p>

      <span>MYDUKA</span>
    </div>
  );
}

// =====================================================
// CACHED AUTOMATIC PAGE LOADER
// =====================================================

const lazyPageCache = new Map();

function getLazyPage(file) {
  const possibleFiles = Array.isArray(file)
    ? file
    : [file];

  const matchedPath = possibleFiles.find(
    (path) => typeof pageModules[path] === "function"
  );

  if (!matchedPath) {
    return null;
  }

  // Reuse an existing lazy component.
  if (lazyPageCache.has(matchedPath)) {
    return lazyPageCache.get(matchedPath);
  }

  // Create and cache the lazy component once.
  const LazyPage = lazy(() => pageModules[matchedPath]());

  lazyPageCache.set(matchedPath, LazyPage);

  return LazyPage;
}

function AutoPage({ file, title }) {
  const PageComponent = getLazyPage(file);

  if (!PageComponent) {
    console.error(
      `MyDuka page not found: ${title}`,
      file
    );

    return <PagePlaceholder title={title} />;
  }

  return (
    <Suspense fallback={<PageLoading />}>
      <PageComponent />
    </Suspense>
  );
}

// =====================================================
// FRONTEND DEVELOPMENT ROUTE GATES
// =====================================================

function SuperAdminRouteGate() {
  if (FRONTEND_DEMO_MODE) {
    return <Outlet />;
  }

  return <SuperAdminProtectedRoute />;
}

function AdminRouteGate() {
  if (FRONTEND_DEMO_MODE) {
    return <Outlet />;
  }

  return <AdminProtectedRoute />;
}

function CashierRouteGate() {
  if (FRONTEND_DEMO_MODE) {
    return <Outlet />;
  }

  return <CashierProtectedRoute />;
}

// =====================================================
// NOT FOUND
// =====================================================

function NotFound() {
  return (
    <div className="page-placeholder">
      <h1>404</h1>

      <h2>Page not found</h2>

      <p>
        The page you requested does not exist.
      </p>

      <Link to="/">
        Return home
      </Link>
    </div>
  );
}

// =====================================================
// MAIN APP
// =====================================================

function App() {
  const location = useLocation();
  const pathname = location.pathname;

  const isAdminLogin = pathname === "/admin-login";
  const isCashierLogin = pathname === "/cashier-login";
  const isSuperAdminLogin = pathname === "/superadmin-login";
  const isBusinessRegister = pathname === "/business-register";

  const isAdminPage =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const isCashierWorkspace =
    pathname.startsWith("/cashier/");

  const isSuperAdminPage =
    pathname === "/superadmin" ||
    pathname.startsWith("/superadmin/");

  const showAdminNavbar =
    isAdminPage && !isAdminLogin;

  const showCashierNavbar =
    isCashierWorkspace;

  const showCustomerNavbar =
    !isAdminLogin &&
    !isCashierLogin &&
    !isSuperAdminLogin &&
    !isBusinessRegister &&
    !isAdminPage &&
    !isCashierWorkspace &&
    !isSuperAdminPage;

  return (
    <>
      {/* =================================================
          GLOBAL NAVIGATION
      ================================================= */}

      {showAdminNavbar ? (
        <AdminNavbar />
      ) : showCashierNavbar ? (
        <CashierNavbar />
      ) : showCustomerNavbar ? (
        <Navbar />
      ) : null}

      <Routes>

        {/* =================================================
            PUBLIC HOMEPAGE
        ================================================= */}

        <Route
          path="/"
          element={
            <AutoPage
              file="./pages/Home.jsx"
              title="Homepage"
            />
          }
        />

        {/* =================================================
            CUSTOMER STOREFRONT
        ================================================= */}

        <Route
          path="/store/:slug"
          element={
            <AutoPage
              file="./pages/storefront/StorefrontHome.jsx"
              title="Storefront"
            />
          }
        />

        <Route
          path="/store/:slug/products/:productId"
          element={
            <AutoPage
              file="./pages/storefront/StorefrontProductDetails.jsx"
              title="Storefront product details"
            />
          }
        />

        <Route
          path="/products"
          element={
            <AutoPage
              file="./pages/Products.jsx"
              title="Products"
            />
          }
        />

        <Route
          path="/products/:id"
          element={
            <AutoPage
              file="./pages/ProductDetails.jsx"
              title="Product details"
            />
          }
        />

        <Route
          path="/cart"
          element={
            <AutoPage
              file="./pages/Cart.jsx"
              title="Shopping cart"
            />
          }
        />

        <Route
          path="/checkout"
          element={
            <AutoPage
              file="./pages/Checkout.jsx"
              title="Checkout"
            />
          }
        />

        <Route
          path="/order-confirmation"
          element={
            <AutoPage
              file="./pages/OrderConfirmation.jsx"
              title="Order confirmation"
            />
          }
        />

        <Route
          path="/track-order"
          element={
            <AutoPage
              file="./pages/TrackOrder.jsx"
              title="Track order"
            />
          }
        />

        <Route
          path="/wishlist"
          element={
            <AutoPage
              file="./pages/Wishlist.jsx"
              title="Wishlist"
            />
          }
        />

        <Route
          path="/ask-support"
          element={
            <AutoPage
              file="./pages/AskSupport.jsx"
              title="Customer support"
            />
          }
        />

        <Route
          path="/contact"
          element={
            <AutoPage
              file="./pages/Contact.jsx"
              title="Contact us"
            />
          }
        />

        <Route
          path="/about"
          element={
            <AutoPage
              file="./pages/About.jsx"
              title="About MyDuka"
            />
          }
        />

        <Route
          path="/privacy"
          element={
            <AutoPage
              file="./pages/Privacy.jsx"
              title="Privacy policy"
            />
          }
        />

        <Route
          path="/terms"
          element={
            <AutoPage
              file="./pages/Terms.jsx"
              title="Terms and conditions"
            />
          }
        />

        {/* =================================================
            CUSTOMER AUTHENTICATION
        ================================================= */}

        <Route
          path="/login"
          element={
            <AutoPage
              file="./pages/Login.jsx"
              title="Customer login"
            />
          }
        />

        <Route
          path="/register"
          element={
            <AutoPage
              file="./pages/Register.jsx"
              title="Customer registration"
            />
          }
        />

        <Route
          path="/forgot-password"
          element={
            <AutoPage
              file="./pages/ForgotPassword.jsx"
              title="Forgot password"
            />
          }
        />

        <Route
          path="/reset-password"
          element={
            <AutoPage
              file="./pages/ResetPassword.jsx"
              title="Reset password"
            />
          }
        />

        {/* =================================================
            CUSTOMER ACCOUNT
        ================================================= */}

        <Route
          path="/account"
          element={
            <AutoPage
              file="./pages/customer/Account.jsx"
              title="My account"
            />
          }
        />

        <Route
          path="/account/orders"
          element={
            <AutoPage
              file="./pages/customer/Orders.jsx"
              title="My orders"
            />
          }
        />

        <Route
          path="/account/orders/:id"
          element={
            <AutoPage
              file="./pages/customer/OrderDetails.jsx"
              title="Order details"
            />
          }
        />

        <Route
          path="/account/profile"
          element={
            <AutoPage
              file="./pages/customer/Profile.jsx"
              title="My profile"
            />
          }
        />

        {/* =================================================
            BUSINESS REGISTRATION AND LOGIN
        ================================================= */}

        <Route
          path="/business-register"
          element={
            <AutoPage
              file="./pages/BusinessRegister.jsx"
              title="Register your business"
            />
          }
        />

        <Route
          path="/admin-login"
          element={
            <AutoPage
              file="./pages/AdminLogin.jsx"
              title="Business admin login"
            />
          }
        />

        {/* =================================================
            SUPER ADMIN LOGIN
        ================================================= */}

        <Route
          path="/superadmin-login"
          element={
            <AutoPage
              file="./pages/SuperAdminLogin.jsx"
              title="Super Admin login"
            />
          }
        />

        {/* =================================================
            SUPER ADMIN WORKSPACE
        ================================================= */}

        <Route element={<SuperAdminRouteGate />}>

          <Route
            path="/superadmin"
            element={
              <Navigate
                to="/superadmin/dashboard"
                replace
              />
            }
          />

          {/* Dashboard */}

          <Route
            path="/superadmin/dashboard"
            element={
              <AutoPage
                file="./pages/SuperAdminDashboard.jsx"
                title="Platform overview"
              />
            }
          />

          {/* Businesses */}

          <Route
            path="/superadmin/businesses"
            element={
              <AutoPage
                file={[
                  "./pages/SuperAdminBusinesses.jsx",
                  "./pages/superadmin/Businesses.jsx",
                ]}
                title="Businesses"
              />
            }
          />

          {/* Business details */}

          <Route
            path="/superadmin/businesses/:id"
            element={
              <AutoPage
                file={[
                  "./pages/superadmin/BusinessDetails.jsx",
                  "./pages/SuperAdminBusinessDetails.jsx",
                ]}
                title="Business details"
              />
            }
          />

          {/* Subscriptions */}

          <Route
            path="/superadmin/subscriptions"
            element={
              <AutoPage
                file={[
                  "./pages/superadmin/Subscriptions.jsx",
                  "./pages/SuperAdminSubscriptions.jsx",
                ]}
                title="Subscriptions"
              />
            }
          />

          {/* Subscription plans */}

          <Route
            path="/superadmin/plans"
            element={
              <AutoPage
                file={[
                  "./pages/superadmin/Plans.jsx",
                  "./pages/SuperAdminPlans.jsx",
                ]}
                title="Subscription plans"
              />
            }
          />

          {/* Platform users */}

          <Route
            path="/superadmin/users"
            element={
              <AutoPage
                file={[
                  "./pages/superadmin/Users.jsx",
                  "./pages/SuperAdminUsers.jsx",
                ]}
                title="Platform users"
              />
            }
          />

          {/* Analytics */}

          <Route
            path="/superadmin/analytics"
            element={
              <AutoPage
                file={[
                  "./pages/superadmin/Analytics.jsx",
                  "./pages/SuperAdminAnalytics.jsx",
                ]}
                title="Platform analytics"
              />
            }
          />

          {/* Support */}

          <Route
            path="/superadmin/support"
            element={
              <AutoPage
                file={[
                  "./pages/superadmin/Support.jsx",
                  "./pages/SuperAdminSupport.jsx",
                ]}
                title="Support management"
              />
            }
          />

          {/* Notifications */}

          <Route
            path="/superadmin/notifications"
            element={
              <AutoPage
                file={[
                  "./pages/superadmin/Notifications.jsx",
                  "./pages/SuperAdminNotifications.jsx",
                ]}
                title="Notifications"
              />
            }
          />

          {/* Audit logs */}

          <Route
            path="/superadmin/audit-logs"
            element={
              <AutoPage
                file={[
                  "./pages/superadmin/AuditLogs.jsx",
                  "./pages/SuperAdminAuditLogs.jsx",
                ]}
                title="Audit logs"
              />
            }
          />

          {/* Platform settings */}

          <Route
            path="/superadmin/settings"
            element={
              <AutoPage
                file={[
                  "./pages/superadmin/Settings.jsx",
                  "./pages/SuperAdminSettings.jsx",
                ]}
                title="Platform settings"
              />
            }
          />

          {/* Super Admin profile */}

          <Route
            path="/superadmin/profile"
            element={
              <AutoPage
                file={[
                  "./pages/superadmin/Profile.jsx",
                  "./pages/SuperAdminProfile.jsx",
                ]}
                title="Super Admin profile"
              />
            }
          />

        </Route>

        {/* =================================================
            BUSINESS ADMIN WORKSPACE
        ================================================= */}

        <Route element={<AdminRouteGate />}>

          <Route
            path="/admin"
            element={
              <AutoPage
                file="./pages/AdminDashboard.jsx"
                title="Business dashboard"
              />
            }
          />

          <Route
            path="/admin/products"
            element={
              <AutoPage
                file="./pages/seller/Products.jsx"
                title="Products"
              />
            }
          />

          <Route
            path="/admin/categories"
            element={
              <AutoPage
                file="./pages/seller/Categories.jsx"
                title="Categories"
              />
            }
          />

          <Route
            path="/admin/inventory"
            element={
              <AutoPage
                file="./pages/seller/Inventory.jsx"
                title="Inventory"
              />
            }
          />

          <Route
            path="/admin/stock-history"
            element={
              <AutoPage
                file="./pages/seller/StockHistory.jsx"
                title="Stock history"
              />
            }
          />

          <Route
            path="/admin/stock-transfers"
            element={
              <AutoPage
                file="./pages/seller/StockTransfers.jsx"
                title="Stock transfers"
              />
            }
          />

          <Route
            path="/admin/orders"
            element={
              <AutoPage
                file="./pages/seller/Orders.jsx"
                title="Orders"
              />
            }
          />

          <Route
            path="/admin/orders/:id"
            element={
              <AutoPage
                file="./pages/AdminOrderDetails.jsx"
                title="Order details"
              />
            }
          />

          <Route
            path="/admin/customers"
            element={
              <AutoPage
                file="./pages/seller/Customers.jsx"
                title="Customers"
              />
            }
          />

          <Route
            path="/admin/messages"
            element={
              <AutoPage
                file="./pages/seller/Messages.jsx"
                title="Messages"
              />
            }
          />

          <Route
            path="/admin/deliveries"
            element={
              <AutoPage
                file="./pages/seller/Deliveries.jsx"
                title="Deliveries"
              />
            }
          />

          <Route
            path="/admin/sales"
            element={
              <AutoPage
                file="./pages/seller/Sales.jsx"
                title="Sales"
              />
            }
          />

          <Route
            path="/admin/pos-sales"
            element={
              <AutoPage
                file="./pages/seller/POSSales.jsx"
                title="POS sales"
              />
            }
          />

          <Route
            path="/admin/reports"
            element={
              <AutoPage
                file="./pages/seller/Reports.jsx"
                title="Reports"
              />
            }
          />

          <Route
            path="/admin/cashiers"
            element={
              <AutoPage
                file="./pages/seller/Cashiers.jsx"
                title="Cashiers"
              />
            }
          />

          <Route
            path="/admin/branches"
            element={
              <AutoPage
                file="./pages/seller/Branches.jsx"
                title="Branches"
              />
            }
          />

          <Route
            path="/admin/payments"
            element={
              <AutoPage
                file="./pages/seller/Payments.jsx"
                title="Payments"
              />
            }
          />

          <Route
            path="/admin/subscription"
            element={
              <AutoPage
                file="./pages/seller/Subscription.jsx"
                title="Subscription"
              />
            }
          />

          <Route
            path="/admin/settings"
            element={
              <AutoPage
                file="./pages/seller/Settings.jsx"
                title="Business settings"
              />
            }
          />

          <Route
            path="/admin/profile"
            element={
              <AutoPage
                file="./pages/seller/Profile.jsx"
                title="Business profile"
              />
            }
          />

        </Route>

        {/* =================================================
            CASHIER LOGIN
        ================================================= */}

        <Route
          path="/cashier-login"
          element={
            <AutoPage
              file="./pages/cashier/CashierLogin.jsx"
              title="Cashier login"
            />
          }
        />

        {/* =================================================
            CASHIER WORKSPACE
        ================================================= */}

        <Route element={<CashierRouteGate />}>

          <Route
            path="/cashier"
            element={
              <Navigate
                to="/cashier/pos"
                replace
              />
            }
          />

          <Route
            path="/cashier/pos"
            element={
              <AutoPage
                file="./pages/cashier/CashierPOS.jsx"
                title="Point of Sale"
              />
            }
          />

          <Route
            path="/cashier/sales-history"
            element={
              <AutoPage
                file="./pages/cashier/SalesHistory.jsx"
                title="Sales history"
              />
            }
          />

          <Route
            path="/cashier/orders"
            element={
              <AutoPage
                file="./pages/cashier/CashierOrders.jsx"
                title="Orders"
              />
            }
          />

          <Route
            path="/cashier/deliveries"
            element={
              <AutoPage
                file="./pages/cashier/CashierDeliveries.jsx"
                title="Deliveries"
              />
            }
          />

          <Route
            path="/cashier/stock"
            element={
              <AutoPage
                file="./pages/cashier/CashierStock.jsx"
                title="Stock"
              />
            }
          />

          <Route
            path="/cashier/stock-history"
            element={
              <AutoPage
                file="./pages/cashier/CashierStockHistory.jsx"
                title="Stock history"
              />
            }
          />

          <Route
            path="/cashier/held-sales"
            element={
              <AutoPage
                file="./pages/cashier/HeldSales.jsx"
                title="Held sales"
              />
            }
          />

          <Route
            path="/cashier/shift"
            element={
              <AutoPage
                file="./pages/cashier/Shift.jsx"
                title="Cashier shift"
              />
            }
          />

          <Route
            path="/cashier/profile"
            element={
              <AutoPage
                file="./pages/cashier/Profile.jsx"
                title="Cashier profile"
              />
            }
          />

          <Route
            path="/cashier/settings"
            element={
              <AutoPage
                file="./pages/cashier/Settings.jsx"
                title="Cashier settings"
              />
            }
          />

        </Route>

        {/* =================================================
            DEVELOPMENT
        ================================================= */}

        <Route
          path="/backend-test"
          element={
            <AutoPage
              file="./pages/BackendTest.jsx"
              title="Backend test"
            />
          }
        />

        {/* =================================================
            FALLBACK
        ================================================= */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </>
  );
}

export default App;
