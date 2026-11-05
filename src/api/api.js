import axios from "axios";

// Same-origin by default: Vercel serves the Flask API under /api.
// Set VITE_API_URL only to point at a different API during development.
export const API_BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});
// ============================================================
// REQUEST INTERCEPTOR
// ATTACH THE CORRECT TOKEN TO PROTECTED ENDPOINTS
// ============================================================

api.interceptors.request.use(
(config) => {
const url = config.url || "";
const method = (config.method || "get").toLowerCase();


config.headers = config.headers || {};

// Remove query parameters when checking endpoint paths.
const cleanUrl = url.split("?")[0];

// ========================================================
// ADMIN AUTHENTICATION
// ========================================================

const isAdminRoute = cleanUrl.startsWith("/admin/");

// Product creation, editing, and deletion require admin auth.
const isProductMutation =
  /^\/products(?:\/|$)/.test(cleanUrl) &&
  ["post", "put", "patch", "delete"].includes(method);

// Creating a cashier requires admin authentication.
const isCashierCreation =
  cleanUrl === "/cashier/create" && method === "post";

if (isAdminRoute || isProductMutation || isCashierCreation) {
  const adminToken = localStorage.getItem("adminToken");

  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }
}

// ========================================================
// CASHIER AUTHENTICATION
// ========================================================

// Cashier login is public.
// Cashier stock, sales, deliveries, and payment endpoints
// require cashier authentication.

const isCashierLogin =
  cleanUrl === "/cashier/login";

const isCashierProtectedEndpoint =
  (
    cleanUrl.startsWith("/cashier/") ||
    cleanUrl === "/payments/cashier-stk-push"
  ) &&
  !isCashierLogin &&
  !isCashierCreation;

if (isCashierProtectedEndpoint) {
  const cashierToken = localStorage.getItem("cashierToken");

  if (cashierToken) {
    config.headers.Authorization = `Bearer ${cashierToken}`;
  }
}

// ========================================================
// CUSTOMER AUTHENTICATION
// ========================================================

const customerProtectedEndpoints = [
  "/notifications/customer/",
  "/notifications/",
  "/messages/customer/",
  "/messages/unread-count",
  "/messages",
];

const isCustomerProtectedEndpoint =
  customerProtectedEndpoints.some((endpoint) =>
    cleanUrl.startsWith(endpoint)
  );

// Never attach a customer token to admin or cashier requests.
if (
  isCustomerProtectedEndpoint &&
  !isAdminRoute &&
  !isProductMutation &&
  !isCashierProtectedEndpoint &&
  !isCashierCreation
) {
  const customerToken = localStorage.getItem("customerToken");

  if (customerToken) {
    config.headers.Authorization = `Bearer ${customerToken}`;
  }
}

// ========================================================
// FORM DATA / IMAGE UPLOAD SUPPORT
// ========================================================

// Allow the browser to set the multipart boundary automatically.
if (
  typeof FormData !== "undefined" &&
  config.data instanceof FormData
) {
  delete config.headers["Content-Type"];
  delete config.headers["content-type"];
}

return config;


},
(error) => Promise.reject(error)
);

export default api;
