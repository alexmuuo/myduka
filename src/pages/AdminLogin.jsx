import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import api from "../api/api";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [selectingBusiness, setSelectingBusiness] = useState(false);

  const finishLogin = async () => {
    // Check whether this user has an unfinished registration.
    const pendingBusiness = sessionStorage.getItem(
      "mydukaPendingBusiness"
    );

    if (pendingBusiness) {
      let businessDetails;

      try {
        businessDetails = JSON.parse(pendingBusiness);
      } catch {
        sessionStorage.removeItem("mydukaPendingBusiness");
        throw new Error("Your pending business registration is invalid.");
      }

      const response = await api.post("/businesses", {
        name: businessDetails.name,
        slug: businessDetails.slug,
        phone: businessDetails.phone || "",
        address: businessDetails.address || "",
      });

      const businessId =
        response.data?.business?.id ||
        response.data?.business_id ||
        response.data?.id;

      if (!businessId) {
        throw new Error(
          "Business creation did not return a business ID."
        );
      }

      localStorage.setItem("mydukaBusinessId", businessId);
      sessionStorage.removeItem("mydukaPendingBusiness");

      navigate("/admin", { replace: true });
      return;
    }

    // Otherwise, retrieve businesses already linked to this user.
    const response = await api.get("/businesses");
    const userBusinesses = response.data.businesses || [];

    if (userBusinesses.length === 0) {
      setError(
        "Your account has no business yet. Please register your business."
      );
      return;
    }

    if (userBusinesses.length === 1) {
      localStorage.setItem(
        "mydukaBusinessId",
        userBusinesses[0].id
      );

      navigate("/admin", { replace: true });
      return;
    }

    // Allow users with multiple businesses to choose.
    setBusinesses(userBusinesses);
    setSelectedBusiness(userBusinesses[0].id);
    setSelectingBusiness(true);
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (loginError) throw loginError;

      if (!data.session) {
        throw new Error("Unable to establish your session.");
      }

      await finishLogin();
    } catch (err) {
      console.error("Admin login error:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSelection = () => {
    if (!selectedBusiness) {
      setError("Please select a business.");
      return;
    }

    localStorage.setItem("mydukaBusinessId", selectedBusiness);

    navigate("/admin", { replace: true });
  };

  return (
    <div className="container py-5">
      <div
        className="card shadow mx-auto"
        style={{ maxWidth: "450px" }}
      >
        <div className="card-body p-4">
          <h2 className="text-center mb-2">
            {selectingBusiness
              ? "Select Your Business"
              : "Welcome to MyDuka"}
          </h2>

          <p className="text-center text-muted mb-4">
            {selectingBusiness
              ? "Choose the business you want to manage."
              : "Sign in to your management account."}
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}

              {error.includes("no business") && (
                <div className="mt-2">
                  <Link to="/business-register">
                    Register your business
                  </Link>
                </div>
              )}
            </div>
          )}

          {!selectingBusiness ? (
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label htmlFor="adminEmail" className="form-label">
                  Email Address
                </label>

                <input
                  id="adminEmail"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="adminPassword"
                  className="form-label"
                >
                  Password
                </label>

                <div className="input-group">
                  <input
                    id="adminPassword"
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-success w-100"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <p className="text-center mt-3 mb-0">
                New to MyDuka?{" "}
                <Link to="/business-register">
                  Create a business account
                </Link>
              </p>
            </form>
          ) : (
            <div>
              <div className="mb-4">
                <label
                  htmlFor="businessSelect"
                  className="form-label"
                >
                  Your Business
                </label>

                <select
                  id="businessSelect"
                  className="form-select"
                  value={selectedBusiness}
                  onChange={(event) =>
                    setSelectedBusiness(event.target.value)
                  }
                >
                  {businesses.map((business) => (
                    <option
                      key={business.id}
                      value={business.id}
                    >
                      {business.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-success w-100"
                onClick={handleBusinessSelection}
              >
                Continue
              </button>

              <button
                className="btn btn-outline-secondary w-100 mt-2"
                onClick={() => {
                  setSelectingBusiness(false);
                  setError("");
                }}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
