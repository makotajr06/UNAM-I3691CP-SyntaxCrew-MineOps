export const darkTheme = {
  bgBase: "#0D0F0F",
  bgSurface: "#161A1A",
  bgElevated: "#1E2424",
  amber: "#F5A623",
  amberDim: "rgba(245,166,35,0.12)",
  critical: "#E53935",
  criticalDim: "rgba(229,57,53,0.12)",
  warning: "#FB8C00",
  warningDim: "rgba(251,140,0,0.12)",
  safe: "#43A047",
  safeDim: "rgba(67,160,71,0.12)",
  info: "#1E88E5",
  offline: "#607D8B",
  textPrimary: "#F0EDE8",
  textSecondary: "#9EA8A8",
  textDisabled: "#4A5252",
  borderSubtle: "#272D2D",
  borderDefault: "#374040",
};

export const lightTheme = {
  ...darkTheme,
  bgBase: "#F4F1EA",
  bgSurface: "#FFFFFF",
  bgElevated: "#EEE8DE",
  amberDim: "rgba(180,112,18,0.13)",
  criticalDim: "rgba(229,57,53,0.10)",
  warningDim: "rgba(251,140,0,0.11)",
  safeDim: "rgba(67,160,71,0.11)",
  textPrimary: "#17201F",
  textSecondary: "#596463",
  textDisabled: "#8A9290",
  borderSubtle: "#D7D0C5",
  borderDefault: "#BEB6AA",
};

export const oceanTheme = {
  ...darkTheme,
  bgBase: "#071316",
  bgSurface: "#102326",
  bgElevated: "#183238",
  amber: "#38BDF8",
  amberDim: "rgba(56,189,248,0.13)",
  info: "#22D3EE",
  textPrimary: "#E7F7F8",
  textSecondary: "#91B5B9",
  textDisabled: "#526B70",
  borderSubtle: "#254247",
  borderDefault: "#31545B",
};

export const forestTheme = {
  ...darkTheme,
  bgBase: "#0A130F",
  bgSurface: "#13251C",
  bgElevated: "#1D3327",
  amber: "#A3E635",
  amberDim: "rgba(163,230,53,0.13)",
  safe: "#4ADE80",
  safeDim: "rgba(74,222,128,0.12)",
  textPrimary: "#EFF7E8",
  textSecondary: "#9EB29B",
  textDisabled: "#586756",
  borderSubtle: "#294232",
  borderDefault: "#385743",
};

export const highContrastTheme = {
  ...darkTheme,
  bgBase: "#000000",
  bgSurface: "#111111",
  bgElevated: "#1F1F1F",
  amber: "#FFD400",
  amberDim: "rgba(255,212,0,0.16)",
  textPrimary: "#FFFFFF",
  textSecondary: "#D6D6D6",
  textDisabled: "#858585",
  borderSubtle: "#3A3A3A",
  borderDefault: "#5A5A5A",
};

export const themes = {
  Dark: darkTheme,
  Light: lightTheme,
  Ocean: oceanTheme,
  Forest: forestTheme,
  "High Contrast": highContrastTheme,
};

export const themeOptions = [
  { label: "Dark", sub: "Default for low light and glare" },
  { label: "Light", sub: "High contrast light background" },
  { label: "Ocean", sub: "Cool teal interface for low-glare control rooms" },
  { label: "Forest", sub: "Green safety-focused palette" },
  { label: "High Contrast", sub: "Maximum contrast for readability" },
  { label: "System", sub: "Follow device system setting" },
];

export const getAppColors = (settings = {}) => themes[settings.theme] || darkTheme;
