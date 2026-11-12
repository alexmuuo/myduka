import axios from "axios";
import { supabase } from "../supabaseClient";

export const API_BASE =
  import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// ============================================================
// MYDUKA AUTHENTICATION
// ============================================================

api.interceptors.request.use(
  async (config) => {
    config.headers = config.headers || {};

    // Get the current Supabase session.
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    // Attach Supabase access token.
    if (session?.access_token) {
      config.headers.Authorization =
        `Bearer ${session.access_token}`;
    }

    // Attach selected business context where available.
    const businessId = localStorage.getItem(
      "mydukaBusinessId"
    );

    if (businessId) {
      config.headers["X-Business-ID"] = businessId;
    }

    // Let the browser set multipart boundaries automatically.
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
