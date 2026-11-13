import { useTheme } from "../context/ThemeContext";

function ThemeSwitcher({ className = "", showLabel = true }) {
  const { themePreference, setTheme, resolvedTheme } = useTheme();

  const themes = {
    light: {
      icon: "bi-sun-fill",
      label: "Light",
      description: "Modern Premium",
    },
    dark: {
      icon: "bi-moon-stars-fill",
      label: "Dark",
      description: "Dark Premium",
    },
    system: {
      icon: "bi-display",
      label: "System",
      description: `Following ${resolvedTheme} mode`,
    },
  };

  const activeTheme = themes[themePreference] || themes.system;

  return (
    <div
      className={`md-theme-switcher ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        minWidth: 0,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: "36px",
          height: "36px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "11px",
          color: "var(--primary)",
          background: "var(--primary-light)",
          fontSize: "16px",
        }}
      >
        <i className={`bi ${activeTheme.icon}`} />
      </div>

      {showLabel && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            lineHeight: 1.3,
          }}
        >
          <span
            style={{
              color: "var(--text-primary)",
              fontSize: "13px",
              fontWeight: 650,
            }}
          >
            Appearance
          </span>

          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "11px",
            }}
          >
            {activeTheme.description}
          </span>
        </div>
      )}

      <div style={{ position: "relative", marginLeft: "auto" }}>
        <select
          className="md-theme-select"
          value={themePreference}
          onChange={(event) => setTheme(event.target.value)}
          aria-label="Choose dashboard appearance"
          title={`Current appearance: ${activeTheme.label}`}
          style={{
            appearance: "none",
            WebkitAppearance: "none",
            minWidth: "112px",
            minHeight: "38px",
            padding: "0 30px 0 12px",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            backgroundColor: "var(--surface)",
            color: "var(--text-primary)",
            fontSize: "12px",
            fontWeight: 650,
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="light">☀️ Light</option>
          <option value="dark">🌙 Dark</option>
          <option value="system">💻 System</option>
        </select>

        <i
          className="bi bi-chevron-down"
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "11px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "10px",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

export default ThemeSwitcher;
