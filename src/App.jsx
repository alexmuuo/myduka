import { Routes, Route, useLocation } from "react-router-dom";

// Business registration
import BusinessRegister from "./pages/BusinessRegister";

// Customer pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import BackendTest from "./pages/BackendTest";
import AskSupport from "./pages/AskSupport";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Shared components
import Navbar from "./components/Navbar";
import AdminNavbar from "./components/AdminNavbar";
import CashierNavbar from "./components/CashierNavbar";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrderDetails from "./pages/AdminOrderDetails";
import SellerProducts from "./pages/seller/Products";
import Inventory from "./pages/seller/Inventory";
import SellerOrders from "./pages/seller/Orders";
import Customers from "./pages/seller/Customers";
import Messages from "./pages/seller/Messages";
import Deliveries from "./pages/seller/Deliveries";
import Reports from "./pages/seller/Reports";
import Cashiers from "./pages/seller/Cashiers";
import AdminLogin from "./pages/AdminLogin";
import AdminStockHistory from "./pages/seller/StockHistory";
import Sales from "./pages/seller/Sales";
import Branches from "./pages/seller/Branches";
import POSSales from "./pages/seller/POSSales";

// Cashier pages
import CashierLogin from "./pages/cashier/CashierLogin";
import CashierPOS from "./pages/cashier/CashierPOS";
import SalesHistory from "./pages/cashier/SalesHistory";
import CashierOrders from "./pages/cashier/CashierOrders";
import CashierDeliveries from "./pages/cashier/CashierDeliveries";
import CashierStockHistory from "./pages/cashier/CashierStockHistory";
import CashierStock from "./pages/cashier/CashierStock";

// Route protection
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import CashierProtectedRoute from "./components/CashierProtectedRoute";

function App() {
  const location = useLocation();
  const pathname = location.pathname;

  const isAdminLogin = pathname === "/admin-login";
  const isCashierLogin = pathname === "/cashier-login";
  const isBusinessRegister = pathname === "/business-register";

  const isAdminPage =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const isCashierPage = pathname.startsWith("/cashier/");

  // MyDuka business context
  const hasBusinessContext = Boolean(
    localStorage.getItem("mydukaBusinessId")
  );

  // Navigation visibility
  const showAdminNavbar =
    isAdminPage && hasBusinessContext && !isAdminLogin;

  const showCustomerNavbar =
    !isAdminLogin &&
    !isCashierLogin &&
    !isBusinessRegister &&
    !isAdminPage &&
    !isCashierPage;

  return (
    <>
      {/* Navigation */}
      {showAdminNavbar ? (
        <AdminNavbar />
      ) : isCashierPage ? (
        <CashierNavbar />
      ) : showCustomerNavbar ? (
        <Navbar />
      ) : null}

      <Routes>
        {/* CUSTOMER ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        <Route
          path="/order-confirmation"
          element={<OrderConfirmation />}
        />

        <Route path="/backend-test" element={<BackendTest />} />
        <Route path="/ask-support" element={<AskSupport />} />

        {/* CUSTOMER AUTHENTICATION */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* BUSINESS OWNER AUTHENTICATION */}
        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />

        <Route
          path="/business-register"
          element={<BusinessRegister />}
        />

        {/* PROTECTED ADMIN ROUTES */}
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />

          <Route
            path="/admin/orders/:id"
            element={<AdminOrderDetails />}
          />

          <Route
            path="/admin/products"
            element={<SellerProducts />}
          />

          <Route
            path="/admin/inventory"
            element={<Inventory />}
          />

          <Route
            path="/admin/orders"
            element={<SellerOrders />}
          />

          <Route
            path="/admin/customers"
            element={<Customers />}
          />

          <Route
            path="/admin/messages"
            element={<Messages />}
          />

          <Route
            path="/admin/deliveries"
            element={<Deliveries />}
          />

          <Route
            path="/admin/reports"
            element={<Reports />}
          />

          <Route
            path="/admin/cashiers"
            element={<Cashiers />}
          />

          <Route
            path="/admin/stock-history"
            element={<AdminStockHistory />}
          />

          <Route
            path="/admin/sales"
            element={<Sales />}
          />

          <Route
            path="/admin/branches"
            element={<Branches />}
          />

          <Route
            path="/admin/pos-sales"
            element={<POSSales />}
          />
        </Route>

        {/* CASHIER LOGIN */}
        <Route
          path="/cashier-login"
          element={<CashierLogin />}
        />

        {/* PROTECTED CASHIER ROUTES */}
        <Route element={<CashierProtectedRoute />}>
          <Route
            path="/cashier/pos"
            element={<CashierPOS />}
          />

          <Route
            path="/cashier/sales-history"
            element={<SalesHistory />}
          />

          <Route
            path="/cashier/orders"
            element={<CashierOrders />}
          />

          <Route
            path="/cashier/deliveries"
            element={<CashierDeliveries />}
          />

          <Route
            path="/cashier/stock-history"
            element={<CashierStockHistory />}
          />

          <Route
            path="/cashier/stock"
            element={<CashierStock />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
