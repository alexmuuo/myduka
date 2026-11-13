import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import api from "../api/api";

const menuItems = [
  { label: "Overview", icon: "⌂", path: "/superadmin/dashboard" },
  { label: "Businesses", icon: "▦", path: "/superadmin/businesses" },
  { label: "Users", icon: "♙", path: "/superadmin/users" },
  { label: "Subscriptions", icon: "◇", path: "/superadmin/subscriptions" },
  { label: "Analytics", icon: "▥", path: "/superadmin/analytics" },
  { label: "Support", icon: "✉", path: "/superadmin/support" },
  { label: "Audit Logs", icon: "◷", path: "/superadmin/audit-logs" },
  { label: "Settings", icon: "⚙", path: "/superadmin/settings" },
];

const formatNumber = (value) =>
  Number(value || 0).toLocaleString();

function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statistics, setStatistics] = useState({});
  const [businesses, setBusinesses] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        navigate("/superadmin-login", { replace: true });
        return;
      }

      const token = sessionData.session.access_token;

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [dashboardResponse, profileResponse] = await Promise.all([
        api.get("/superadmin/dashboard", { headers }),
        api.get("/superadmin/me", { headers }),
      ]);

      setStatistics(
        dashboardResponse.data.statistics || {}
      );

      setBusinesses(
        dashboardResponse.data.recent_businesses || []
      );

      setAdmin(
        profileResponse.data.user || null
      );

    } catch (err) {
      console.error("Super Admin dashboard error:", err);

      if (err.response?.status === 401 ||
          err.response?.status === 403) {
        navigate("/superadmin-login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
        "Unable to load platform information. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/superadmin-login", { replace: true });
  };

  const cardData = [
    {
      title: "Total Businesses",
      value: statistics.total_businesses,
      icon: "▦",
      color: "#2563eb",
      background: "#eff6ff",
      description: "Registered on MyDuka",
    },
    {
      title: "Active Businesses",
      value: statistics.active_businesses,
      icon: "✓",
      color: "#059669",
      background: "#ecfdf5",
      description: "Currently operational",
    },
    {
      title: "Registered Users",
      value: statistics.total_users,
      icon: "♙",
      color: "#7c3aed",
      background: "#f5f3ff",
      description: "Platform profiles",
    },
    {
      title: "Business Memberships",
      value: statistics.total_memberships,
      icon: "♧",
      color: "#d97706",
      background: "#fffbeb",
      description: "Active memberships",
    },
  ];

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f8fafc",
      color: "#0f172a",
      fontFamily: "Inter, system-ui, sans-serif",
    },
    sidebar: {
      width: "255px",
      background: "#111827",
      color: "#ffffff",
      position: "fixed",
      top: 0,
      bottom: 0,
      left: 0,
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      transition: "transform 0.25s ease",
    },
    logo: {
      padding: "25px 22px",
      borderBottom: "1px solid #263244",
    },
    main: {
      marginLeft: "255px",
      minHeight: "100vh",
    },
    topbar: {
      height: "76px",
      background: "#ffffff",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 30px",
      position: "sticky",
      top: 0,
      zIndex: 100,
    },
    content: {
      padding: "30px",
      maxWidth: "1600px",
      margin: "auto",
    },
    card: {
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "15px",
      padding: "22px",
      height: "100%",
    },
    muted: {
      color: "#64748b",
    },
  };

  const mobile = window.innerWidth < 992;

  return (
    <div style={styles.page}>
      {/* MOBILE OVERLAY */}
      {sidebarOpen && mobile && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.5)",
            zIndex: 999,
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside
        style={{
          ...styles.sidebar,
          transform:
            mobile && !sidebarOpen
              ? "translateX(-100%)"
              : "translateX(0)",
        }}
      >
        <div style={styles.logo}>
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: "39px",
                height: "39px",
                background: "#2563eb",
                borderRadius: "11px",
                display: "grid",
                placeItems: "center",
                fontWeight: "800",
                fontSize: "22px",
              }}
            >
              M
            </div>

            <div>
              <div className="fw-bold fs-5">MyDuka</div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  letterSpacing: "1px",
                }}
              >
                PLATFORM CONTROL
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 pt-4 pb-2">
          <small
            style={{
              color: "#64748b",
              fontWeight: "700",
              letterSpacing: "1px",
            }}
          >
            MAIN MENU
          </small>
        </div>

        <nav className="px-3">
          {menuItems.map((item, index) => {
            const active = index === 0;

            return (
              <button
                key={item.label}
                onClick={() => {
                  if (item.path !== "/superadmin/dashboard") {
                    alert(`${item.label} management is coming next.`);
                  } else {
                    navigate(item.path);
                  }

                  setSidebarOpen(false);
                }}
                className="w-100 d-flex align-items-center gap-3 border-0 text-start mb-1"
                style={{
                  padding: "12px 14px",
                  borderRadius: "9px",
                  color: active ? "#ffffff" : "#aab5c5",
                  background: active ? "#2563eb" : "transparent",
                  fontSize: "14px",
                  fontWeight: active ? "600" : "500",
                }}
              >
                <span style={{ fontSize: "19px", width: "22px" }}>
                  {item.icon}
                </span>

                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-3">
          <div
            className="p-3 mb-3"
            style={{
              background: "#1f2937",
              borderRadius: "12px",
            }}
          >
            <div className="fw-semibold mb-1" style={{ fontSize: "13px" }}>
              Platform status
            </div>

            <div className="d-flex align-items-center gap-2">
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#22c55e",
                }}
              />

              <small style={{ color: "#86efac" }}>
                System online
              </small>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn w-100 text-start"
            style={{
              color: "#fca5a5",
              background: "#1f2937",
              padding: "12px",
            }}
          >
            ↪ &nbsp; Sign out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        {/* TOPBAR */}
        <header style={styles.topbar}>
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-light d-lg-none"
            >
              ☰
            </button>

            <div>
              <h5 className="fw-bold mb-0">
                Platform Overview
              </h5>

              <small style={styles.muted}>
                Manage and monitor the entire MyDuka platform
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-sm-block">
              <div
                className="fw-semibold"
                style={{ fontSize: "13px" }}
              >
                {admin?.full_name || "Super Administrator"}
              </div>

              <small style={styles.muted}>
                Platform Super Admin
              </small>
            </div>

            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#dbeafe",
                color: "#1d4ed8",
                display: "grid",
                placeItems: "center",
                fontWeight: "700",
              }}
            >
              {(admin?.full_name || admin?.email || "A")
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {/* WELCOME */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h3 className="fw-bold mb-1">
                Welcome back 👋
              </h3>

              <p style={styles.muted} className="mb-0">
                Here's what's happening across MyDuka today.
              </p>
            </div>

            <button
              onClick={loadDashboard}
              className="btn btn-outline-primary"
              disabled={loading}
            >
              ↻ &nbsp; Refresh data
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <div className="alert alert-danger d-flex justify-content-between align-items-center">
              <span>{error}</span>

              <button
                className="btn btn-sm btn-danger"
                onClick={loadDashboard}
              >
                Retry
              </button>
            </div>
          )}

          {/* STATISTICS */}
          <div className="row g-3 mb-4">
            {cardData.map((card) => (
              <div
                className="col-12 col-sm-6 col-xl-3"
                key={card.title}
              >
                <div style={styles.card}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div
                        style={{
                          ...styles.muted,
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        {card.title}
                      </div>

                      <h2 className="fw-bold mt-3 mb-1">
                        {loading
                          ? "..."
                          : formatNumber(card.value)}
                      </h2>

                      <small style={styles.muted}>
                        {card.description}
                      </small>
                    </div>

                    <div
                      style={{
                        width: "45px",
                        height: "45px",
                        borderRadius: "12px",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "22px",
                        color: card.color,
                        background: card.background,
                      }}
                    >
                      {card.icon}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SECONDARY STATISTICS */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <div
                style={{
                  ...styles.card,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <small style={styles.muted}>
                    Inactive businesses
                  </small>

                  <h3 className="fw-bold mt-2 mb-0">
                    {loading
                      ? "..."
                      : formatNumber(statistics.inactive_businesses)}
                  </h3>
                </div>

                <div style={{ fontSize: "30px", color: "#dc2626" }}>
                  ◉
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div
                style={{
                  ...styles.card,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <small style={styles.muted}>
                    Platform administrators
                  </small>

                  <h3 className="fw-bold mt-2 mb-0">
                    {loading
                      ? "..."
                      : formatNumber(statistics.total_platform_admins)}
                  </h3>
                </div>

                <div style={{ fontSize: "30px", color: "#7c3aed" }}>
                  ♙
                </div>
              </div>
            </div>
          </div>

          {/* RECENT BUSINESSES */}
          <div style={styles.card}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
              <div>
                <h5 className="fw-bold mb-1">
                  Recently Registered Businesses
                </h5>

                <small style={styles.muted}>
                  Latest businesses joining the MyDuka platform
                </small>
              </div>

              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() =>
                  navigate("/superadmin/businesses")
                }
              >
                View all businesses →
              </button>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
                <p className="mt-3" style={styles.muted}>
                  Loading platform data...
                </p>
              </div>
            ) : businesses.length === 0 ? (
              <div
                className="text-center py-5"
                style={styles.muted}
              >
                <div style={{ fontSize: "35px" }}>▦</div>
                <p className="mt-2 mb-0">
                  No businesses have registered yet.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr style={{ fontSize: "12px", color: "#64748b" }}>
                      <th>BUSINESS</th>
                      <th>EMAIL</th>
                      <th>PHONE</th>
                      <th>STATUS</th>
                      <th>REGISTERED</th>
                    </tr>
                  </thead>

                  <tbody>
                    {businesses.map((business) => (
                      <tr key={business.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "9px",
                                background: "#eff6ff",
                                color: "#2563eb",
                                display: "grid",
                                placeItems: "center",
                                fontWeight: "700",
                              }}
                            >
                              {business.name?.charAt(0).toUpperCase() || "B"}
                            </div>

                            <div className="fw-semibold">
                              {business.name || "Unnamed business"}
                            </div>
                          </div>
                        </td>

                        <td>{business.email || "—"}</td>

                        <td>{business.phone || "—"}</td>

                        <td>
                          <span
                            className="badge rounded-pill"
                            style={{
                              background: business.is_active
                                ? "#dcfce7"
                                : "#fee2e2",
                              color: business.is_active
                                ? "#166534"
                                : "#991b1b",
                              padding: "7px 11px",
                            }}
                          >
                            {business.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          {business.created_at
                            ? new Date(
                                business.created_at
                              ).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div
            className="text-center mt-4"
            style={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            MyDuka Platform Administration
          </div>
        </div>
      </main>
    </div>
  );
}

export default SuperAdminDashboard;
