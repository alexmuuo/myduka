import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/admin/login", {
        username,
        password,
      });

      if (response.data.status === "success") {
        localStorage.setItem("adminToken", response.data.token);
        localStorage.setItem(
          "admin",
          JSON.stringify(response.data.admin)
        );

        navigate("/admin", { replace: true });
      } else {
        setError(response.data.message || "Login failed.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to log in. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div
        className="card shadow mx-auto"
        style={{ maxWidth: "450px" }}
      >
        <div className="card-body p-4">
          <h2 className="text-center mb-2">Admin Login</h2>

          <p className="text-center text-muted mb-4">
            MyDuka Management Portal
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label
                htmlFor="adminUsername"
                className="form-label"
              >
                Username
              </label>

              <input
                id="adminUsername"
                type="text"
                className="form-control"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                autoComplete="username"
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
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? "🙈 Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-success w-100"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In as Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;

