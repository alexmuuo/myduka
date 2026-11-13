import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { supabase } from "../supabaseClient";
import api from "../api/api";

function SuperAdminProtectedRoute() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const verificationId = useRef(0);

  useEffect(() => {
    let mounted = true;

    const verifySuperAdmin = async (session) => {
      const currentVerification = ++verificationId.current;

      if (!session?.access_token) {
        if (mounted && currentVerification === verificationId.current) {
          setAuthenticated(false);
          setLoading(false);
        }

        return;
      }

      if (mounted) {
        setLoading(true);
      }

      try {
        await api.get("/superadmin/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (
          mounted &&
          currentVerification === verificationId.current
        ) {
          setAuthenticated(true);
          setLoading(false);
        }
      } catch (error) {
        console.error(
          "Super Admin verification failed:",
          error.response?.data || error.message
        );

        if (
          mounted &&
          currentVerification === verificationId.current
        ) {
          setAuthenticated(false);
          setLoading(false);
        }
      }
    };

    const initialise = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          throw error;
        }

        await verifySuperAdmin(data.session);
      } catch (error) {
        console.error("Session restoration failed:", error);

        if (mounted) {
          setAuthenticated(false);
          setLoading(false);
        }
      }
    };

    // Subscribe to authentication changes.
    // Defer verification outside the Supabase callback.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      Promise.resolve().then(() => {
        if (mounted) {
          verifySuperAdmin(session);
        }
      });
    });

    initialise();

    return () => {
      mounted = false;
      verificationId.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "15px",
          background: "var(--background, #f5f7fb)",
          color: "var(--text-secondary, #7b8495)",
          fontFamily: "inherit",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            border: "3px solid var(--border, #e5e7eb)",
            borderTopColor: "#635bdb",
            borderRadius: "50%",
            animation: "superAdminSpin 0.8s linear infinite",
          }}
        />

        <style>
          {`
            @keyframes superAdminSpin {
              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>

        <div style={{ fontSize: "13px", fontWeight: 600 }}>
          Verifying Super Admin access...
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/superadmin-login"
        replace
      />
    );
  }

  return <Outlet />;
}

export default SuperAdminProtectedRoute;
