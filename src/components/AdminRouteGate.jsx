import { Navigate, Outlet, useLocation } from "react-router-dom";

function AdminRouteGate({ children }) {
  const location = useLocation();

  const token = localStorage.getItem("adminToken");

  // No authenticated Business Owner session
  if (!token) {
    return (
      <Navigate
        to="/admin-login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Supports both nested routes and direct children
  return children || <Outlet />;
}

export default AdminRouteGate;
