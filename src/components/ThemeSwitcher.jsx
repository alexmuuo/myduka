import { useTheme } from "../context/ThemeContext";

function ThemeSwitcher({ className = "", showLabel = true }) {
  const { themePreference, setTheme, resolvedTheme } = useTheme();

  const themeIcons = {
    light: "bi-sun-fill",
    dark: "bi-moon-stars-fill",
    system: "bi-display",
  };

  const themeLabels = {
    light: "Light",
    dark: "Dark",
    system: "System",
  };

  return (
    <div
      className={`d-flex align-items-center gap-2 ${className}`}
      style={{ minWidth: 0 }}
    >
      <i
        className={`bi ${themeIcons[themePreference]}`}
        style={{
          color: "var(--md-primary)",
          fontSize: "17px",
        }}
        aria-hidden="true"
      />

      {showLabel && (
        <span
          style={{
            color: "var(--md-text)",
            fontSize: "13px",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Appearance
        </span>
      )}

      <select
        className="form-select form-select-sm"
        value={themePreference}
        onChange={(event) => setTheme(event.target.value)}
        aria-label="Choose dashboard appearance"
        title={
          themePreference === "system"
            ? `System preference (${resolvedTheme})`
            : `${themeLabels[themePreference]} theme`
        }
        style={{
          width: "auto",
          minWidth: "112px",
          minHeight: "36px",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--md-text)",
          backgroundColor: "var(--md-surface)",
          borderColor: "var(--md-border)",
          cursor: "pointer",
        }}
      >
        <option value="light">☀️ Light</option>
        <option value="dark">🌙 Dark</option>
        <option value="system">💻 System</option>
      </select>
    </div>
  );
}

export default ThemeSwitcher;
