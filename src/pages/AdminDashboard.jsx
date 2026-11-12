import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import api from "../api/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const businessId = localStorage.getItem("mydukaBusinessId");

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("mydukaBusinessId");
      navigate("/admin-login", { replace: true });
    }
  };

  const loadDashboard = async () => {
    if (!businessId) {
      navigate("/admin-login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [businessResponse, branchesResponse] = await Promise.all([
        api.get("/businesses"),
        api.get(`/businesses/${businessId}/branches`),
      ]);

      const businesses = businessResponse.data?.businesses || [];

      const currentBusiness = businesses.find(
        (item) => String(item.id) === String(businessId)
      );

      if (!currentBusiness) {
        localStorage.removeItem("mydukaBusinessId");
        throw new Error(
          "You no longer have access to this business. Please log in again."
        );
      }

      setBusiness(currentBusiness);
      setBranches(branchesResponse.data?.branches || []);
    } catch (err) {
      console.error("Dashboard loading failed:", err);

      if (err.response?.status === 401) {
        await handleLogout();
        return;
      }

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Could not load your business dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // Load dashboard when the selected business changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status" />
        <p className="text-secondary mt-3">
          Loading your MyDuka dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <span className="text-success fw-semibold">
            BUSINESS DASHBOARD
          </span>

          <h2 className="fw-bold mt-2 mb-1">
            {business?.name || "MyDuka"}
          </h2>

          <p className="text-secondary mb-0">
            Manage your business and its branches from one place.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-success"
            onClick={loadDashboard}
          >
            <i className="bi bi-arrow-clockwise me-2" />
            Refresh
          </button>

          <button
            className="btn btn-outline-danger"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-2" />
            Logout
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </div>
      )}

      {!error && (
        <>
          {/* BUSINESS INFORMATION */}
          <div className="row g-4 mb-4">
            <div className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle bg-success bg-opacity-10 text-success p-3">
                      <i className="bi bi-shop fs-3" />
                    </div>

                    <div>
                      <small className="text-secondary">
                        Business Name
                      </small>
                      <h5 className="fw-bold mb-0">
                        {business?.name}
                      </h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-3">
                      <i className="bi bi-diagram-3 fs-3" />
                    </div>

                    <div>
                      <small className="text-secondary">
                        Total Branches
                      </small>
                      <h5 className="fw-bold mb-0">
                        {branches.length}
                      </h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle bg-warning bg-opacity-10 text-warning p-3">
                      <i className="bi bi-person-badge fs-3" />
                    </div>

                    <div>
                      <small className="text-secondary">
                        Your Role
                      </small>
                      <h5 className="fw-bold mb-0 text-capitalize">
                        {business?.role || "Member"}
                      </h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BUSINESS DETAILS */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">
                Business Information
              </h5>

              <div className="row g-3">
                <div className="col-md-4">
                  <small className="text-secondary">
                    Business Name
                  </small>
                  <p className="fw-semibold mb-0">
                    {business?.name || "—"}
                  </p>
                </div>

                <div className="col-md-4">
                  <small className="text-secondary">
                    Business URL
                  </small>
                  <p className="fw-semibold mb-0">
                    {business?.slug || "—"}
                  </p>
                </div>

                <div className="col-md-4">
                  <small className="text-secondary">
                    Phone Number
                  </small>
                  <p className="fw-semibold mb-0">
                    {business?.phone || "Not provided"}
                  </p>
                </div>

                <div className="col-md-4">
                  <small className="text-secondary">
                    Address
                  </small>
                  <p className="fw-semibold mb-0">
                    {business?.address || "Not provided"}
                  </p>
                </div>

                <div className="col-md-4">
                  <small className="text-secondary">
                    Account Status
                  </small>
                  <p className="mb-0">
                    <span
                      className={`badge ${
                        business?.is_active
                          ? "bg-success"
                          : "bg-danger"
                      }`}
                    >
                      {business?.is_active ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BRANCHES */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                <div>
                  <h5 className="fw-bold mb-1">
                    Your Branches
                  </h5>
                  <p className="text-secondary mb-0">
                    Locations registered under this business.
                  </p>
                </div>
              </div>

              {branches.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-shop-window display-4 text-secondary" />
                  <h6 className="fw-bold mt-3">
                    No branches found
                  </h6>
                </div>
              ) : (
                <div className="row g-3">
                  {branches.map((branch) => (
                    <div
                      className="col-md-6 col-xl-4"
                      key={branch.id}
                    >
                      <div className="border rounded-3 p-3 h-100">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="fw-bold mb-1">
                              {branch.name}
                            </h6>

                            <small className="text-secondary">
                              {branch.address || "No address provided"}
                            </small>
                          </div>

                          {branch.is_main && (
                            <span className="badge bg-success">
                              Main Branch
                            </span>
                          )}
                        </div>

                        <hr />

                        <div className="small text-secondary">
                          <i className="bi bi-telephone me-2" />
                          {branch.phone || "No phone provided"}
                        </div>

                        <div className="mt-2">
                          <span
                            className={`badge ${
                              branch.is_active
                                ? "bg-success"
                                : "bg-secondary"
                            }`}
                          >
                            {branch.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
