import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { supabase } from "../supabaseClient";
import api from "../api/api";


function SuperAdminProtectedRoute() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verifySuperAdmin = async (session) => {
      if (!session?.access_token) {
        if (mounted) {
          setAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      try {
        await api.get("/superadmin/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (mounted) {
          setAuthenticated(true);
        }
      } catch (error) {
        console.error(
          "Super Admin verification failed:",
          error.response?.data || error.message
        );

        if (mounted) {
          setAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !data.session) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      await verifySuperAdmin(data.session);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        setLoading(true);
        verifySuperAdmin(session);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center min-vh-100"
        style={{
          background: "var(--md-bg, #f8fafc)",
        }}
      >
        <div className="text-center">
          <div
            className="spinner-border"
            role="status"
            style={{ color: "#2563eb" }}
          >
            <span className="visually-hidden">
              Verifying access...
            </span>
          </div>

          <p
            className="mt-3"
            style={{ color: "var(--md-text-muted, #64748b)" }}
          >
            Verifying Super Admin access...
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/superadmin-login" replace />;
  }

  return <Outlet />;
}

export default SuperAdminProtectedRoute;
