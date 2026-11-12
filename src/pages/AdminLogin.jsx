import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data.session) {
        throw new Error("Unable to establish your session.");
      }

      // Retrieve businesses belonging to this user.
      const response = await api.get("/businesses");

      const userBusinesses = response.data.businesses || [];

      if (userBusinesses.length === 0) {
        setError(
          "Your account has no business yet. Please register a business."
        );
        return;
      }

      if (userBusinesses.length === 1) {
        const business = userBusinesses[0];

        localStorage.setItem(
          "mydukaBusinessId",
          business.id
        );

        navigate("/admin", { replace: true });
        return;
      }

      // Allow users who own multiple businesses to choose.
      setBusinesses(userBusinesses);
      setSelectedBusiness(userBusinesses[0].id);
      setSelectingBusiness(true);

    } catch (err) {
      setError(
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

    localStorage.setItem(
      "mydukaBusinessId",
      selectedBusiness
    );

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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
