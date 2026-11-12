import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import api from "../api/api";

function BusinessRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    business_name: "",
    slug: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => {
      const updated = { ...previous, [name]: value };

      if (name === "business_name") {
        updated.slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }

      if (name === "slug") {
        updated.slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9-]/g, "")
          .replace(/-+/g, "-");
      }

      return updated;
    });
  };

  const createBusiness = async (accessToken) => {
    const { data, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (!accessToken && !data.session?.access_token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const response = await api.post("/businesses", {
      name: form.business_name.trim(),
      slug: form.slug.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    });

    const businessId =
      response.data?.business?.id ||
      response.data?.business_id ||
      response.data?.id;

    if (!businessId) {
      throw new Error(
        "Your account was created, but the business ID was not returned."
      );
    }

    localStorage.setItem("mydukaBusinessId", businessId);

    sessionStorage.removeItem("mydukaPendingBusiness");

    navigate("/admin", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Your passwords do not match.");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      setError("Enter a valid business URL name.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          options: {
            data: {
              full_name: form.full_name.trim(),
              phone: form.phone.trim(),
            },
          },
        });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error("Account registration was unsuccessful.");
      }

      // Keep business details until the owner confirms their email
      // and signs in, if email confirmation is enabled.
      sessionStorage.setItem(
        "mydukaPendingBusiness",
        JSON.stringify({
          name: form.business_name.trim(),
          slug: form.slug.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        })
      );

      if (!data.session) {
        setMessage(
          "Your account has been created. Please check your email and confirm your address. You can then log in to finish setting up your business."
        );
        setLoading(false);
        return;
      }

      await createBusiness(data.session.access_token);
    } catch (err) {
      console.error("Business registration error:", err);

      setError(
        err.response?.data?.error ||
        err.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box",
    marginTop: "6px",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "15px",
    color: "#334155",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: "35px 15px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          padding: "30px",
          borderRadius: "14px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "8px",
            color: "#0f172a",
          }}
        >
          Create Your MyDuka Account
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            marginBottom: "25px",
          }}
        >
          Set up your business and start managing your sales.
        </p>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "18px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              background: "#dcfce7",
              color: "#166534",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "18px",
              fontSize: "14px",
            }}
          >
            {message}
            <div style={{ marginTop: "12px" }}>
              <Link to="/admin-login">
                Go to login
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h3 style={{ color: "#0f172a" }}>
            Owner Information
          </h3>

          <label style={labelStyle}>
            Full Name
            <input
              style={inputStyle}
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              placeholder="Your full name"
            />
          </label>

          <label style={labelStyle}>
            Email Address
            <input
              style={inputStyle}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
            />
          </label>

          <label style={labelStyle}>
            Password
            <input
              style={inputStyle}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </label>

          <label style={labelStyle}>
            Confirm Password
            <input
              style={inputStyle}
              type="password"
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              required
              placeholder="Enter password again"
            />
          </label>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #e2e8f0",
              margin: "25px 0",
            }}
          />

          <h3 style={{ color: "#0f172a" }}>
            Business Information
          </h3>

          <label style={labelStyle}>
            Business Name
            <input
              style={inputStyle}
              type="text"
              name="business_name"
              value={form.business_name}
              onChange={handleChange}
              required
              placeholder="e.g. Alex Supermarket"
            />
          </label>

          <label style={labelStyle}>
            Business URL Name
            <input
              style={inputStyle}
              type="text"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              required
              placeholder="alex-supermarket"
            />
            <small style={{ color: "#64748b" }}>
              Used to identify your business on MyDuka.
            </small>
          </label>

          <label style={labelStyle}>
            Business Phone
            <input
              style={inputStyle}
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Business phone number"
            />
          </label>

          <label style={labelStyle}>
            Business Address
            <textarea
              style={{
                ...inputStyle,
                minHeight: "80px",
                resize: "vertical",
              }}
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Business location or address"
            />
          </label>

          <button
            type="submit"
            disabled={loading || Boolean(message)}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#64748b" : "#15803d",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading || message ? "not-allowed" : "pointer",
              marginTop: "10px",
            }}
          >
            {loading
              ? "Creating your account..."
              : "Create My Business"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "22px",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/admin-login"
            style={{
              color: "#15803d",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default BusinessRegister;
