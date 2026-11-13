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

function getStorageKey(userId) {
  return userId
    ? `myduka_theme_${userId}`
    : "myduka_theme_guest";
}

function getSavedTheme(userId) {
  try {
    const saved = localStorage.getItem(getStorageKey(userId));

    return VALID_THEMES.includes(saved)
      ? saved
      : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function getResolvedTheme(preference) {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
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

  // Load the authenticated user's theme preference.
  useEffect(() => {
    let mounted = true;

    const loadUserTheme = async (user) => {
      const currentUserId = user?.id || null;

      if (!mounted) return;

      setUserId(currentUserId);

      const savedTheme = getSavedTheme(currentUserId);

      setThemePreference(savedTheme);
      setThemeReady(true);
    };

    const initializeTheme = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        await loadUserTheme(session?.user);
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

  // Save the preference independently for each user.
  const changeTheme = useCallback(
    (theme) => {
      if (!VALID_THEMES.includes(theme)) {
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

  // Resolve the selected theme.
  useEffect(() => {
    if (!themeReady) return;

    const applyTheme = () => {
      const resolved = getResolvedTheme(themePreference);

      setResolvedTheme(resolved);

      document.documentElement.setAttribute(
        "data-theme",
        themePreference
      );
    };

    applyTheme();

    // Automatically update when the device theme changes.
    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
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

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside a ThemeProvider"
    );
  }

  return context;
}
