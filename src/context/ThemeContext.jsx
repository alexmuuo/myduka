import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../supabaseClient";

const ThemeContext = createContext(null);

const DEFAULT_THEME = "system";
const VALID_THEMES = ["light", "dark", "system"];

const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

function getStorageKey(userId) {
  return userId
    ? `myduka_theme_${userId}`
    : "myduka_theme_guest";
}

function getSavedTheme(userId) {
  try {
    const saved = localStorage.getItem(
      getStorageKey(userId)
    );

    return VALID_THEMES.includes(saved)
      ? saved
      : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function getResolvedTheme(preference) {
  if (preference === "system") {
    return window.matchMedia(SYSTEM_QUERY).matches
      ? "dark"
      : "light";
  }

  return preference;
}

export function ThemeProvider({ children }) {
  const [userId, setUserId] = useState(null);

  const [themePreference, setThemePreference] =
    useState(DEFAULT_THEME);

  const [resolvedTheme, setResolvedTheme] =
    useState("light");

  const [themeReady, setThemeReady] = useState(false);

  // =====================================================
  // LOAD USER IDENTITY AND THEME
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const loadUserTheme = (user) => {
      if (!mounted) return;

      const currentUserId = user?.id || null;

      setUserId(currentUserId);

      setThemePreference(
        getSavedTheme(currentUserId)
      );

      setThemeReady(true);
    };

    const initializeTheme = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        loadUserTheme(session?.user);
      } catch (error) {
        console.error(
          "Could not initialize MyDuka theme:",
          error
        );

        loadUserTheme(null);
      }
    };

    initializeTheme();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadUserTheme(session?.user);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // =====================================================
  // CHANGE AND SAVE THEME
  // =====================================================

  const changeTheme = useCallback(
    (theme) => {
      if (!VALID_THEMES.includes(theme)) {
        console.warn(
          "Invalid MyDuka theme:",
          theme
        );

        return;
      }

      setThemePreference(theme);

      try {
        localStorage.setItem(
          getStorageKey(userId),
          theme
        );
      } catch (error) {
        console.error(
          "Could not save theme preference:",
          error
        );
      }
    },
    [userId]
  );

  // =====================================================
  // APPLY THEME
  // =====================================================

  useEffect(() => {
    if (!themeReady) return;

    const applyTheme = () => {
      const resolved = getResolvedTheme(
        themePreference
      );

      setResolvedTheme(resolved);

      // Actual appearance: light or dark.
      document.documentElement.setAttribute(
        "data-theme",
        resolved
      );

      // User's selected preference: light, dark or system.
      document.documentElement.setAttribute(
        "data-theme-preference",
        themePreference
      );

      document.documentElement.style.colorScheme =
        resolved;
    };

    applyTheme();

    // Listen for device appearance changes.
    const mediaQuery = window.matchMedia(
      SYSTEM_QUERY
    );

    const handleSystemThemeChange = () => {
      if (themePreference === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener(
      "change",
      handleSystemThemeChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemThemeChange
      );
    };
  }, [themePreference, themeReady]);

  // =====================================================
  // CONTEXT VALUE
  // =====================================================

  const value = {
    themePreference,
    resolvedTheme,
    setTheme: changeTheme,
    themeReady,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// =======================================================
// THEME HOOK
// =======================================================

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside a ThemeProvider"
    );
  }

  return context;
}
