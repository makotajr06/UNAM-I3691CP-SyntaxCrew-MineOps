import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import "./src/services/firebase";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import SplashScreen from "./src/screens/common/SplashScreen";
import SupervisorDashboardScreen from "./src/screens/supervisor/SupervisorDashboardScreen";
import HazardLogScreen from "./src/screens/supervisor/HazardLogScreen";
import ShiftHandoverScreen from "./src/screens/supervisor/ShiftHandoverScreen";
import InspectionScreen from "./src/screens/inspections/InspectionScreen";
import SettingsScreen from "./src/screens/common/SettingsScreen";
import HazardNotificationsScreen from "./src/screens/worker/HazardNotificationsScreen";
import { LocalizationProvider } from "./src/contexts/LocalizationContext";
import { watchAuthState, watchCurrentUserProfile, watchCurrentUserSettings } from "./src/services/authService";
import { darkTheme, lightTheme, themes } from "./src/styles/appTheme";

const C = darkTheme;

const appTabs = [
  { key: "dashboard", label: "Home", icon: "home-variant", Component: SupervisorDashboardScreen },
  { key: "hazard", label: "Hazard", icon: "alert-octagon", Component: HazardLogScreen },
  { key: "handover", label: "Handover", icon: "account-switch", Component: ShiftHandoverScreen },
  { key: "inspection", label: "Inspection", icon: "clipboard-check", Component: InspectionScreen },
  { key: "notifications", label: "Alerts", icon: "bell-ring", Component: HazardNotificationsScreen },
  { key: "settings", label: "Settings", icon: "cog", Component: SettingsScreen },
];

const tabLabels = {
  English: { dashboard: "Home", hazard: "Hazard", handover: "Handover", inspection: "Inspection", notifications: "Alerts", settings: "Settings" },
  Afrikaans: { dashboard: "Tuis", hazard: "Gevaar", handover: "Oorhandig", inspection: "Inspeksie", notifications: "Alerts", settings: "Instellings" },
  Oshiwambo: { dashboard: "Etameko", hazard: "Oshiponga", handover: "Oshilonga", inspection: "Etaleko", notifications: "Alerts", settings: "Omalongekidho" },
  German: { dashboard: "Start", hazard: "Gefahr", handover: "Ubergabe", inspection: "Prufung", notifications: "Alarme", settings: "Einstellungen" },
  Portuguese: { dashboard: "Inicio", hazard: "Risco", handover: "Turno", inspection: "Inspecao", notifications: "Alertas", settings: "Definicoes" },
};

const makeShell = (theme, overrides = {}) => ({
  ...theme,
  bgBase: theme.bgBase,
  navBg: theme.bgSurface,
  navBorder: theme.borderSubtle,
  inactive: theme.textSecondary,
  activeBg: theme.amber,
  activeText: "#0D0F0F",
  ...overrides,
});

const themeShell = {
  Dark: {
    ...makeShell(darkTheme),
    navBg: "rgba(22,26,26,0.96)",
    navBorder: "#272D2D",
    inactive: "#9EA8A8",
    activeBg: "#F5A623",
    activeText: "#0D0F0F",
  },
  Light: {
    ...makeShell(lightTheme),
    navBg: "rgba(255,255,255,0.96)",
    navBorder: "#D7D0C5",
    inactive: "#687070",
    activeBg: "#0D0F0F",
    activeText: "#F4F1EA",
  },
  Ocean: makeShell(themes.Ocean),
  Forest: makeShell(themes.Forest),
  "High Contrast": makeShell(themes["High Contrast"]),
};

export default function App() {
  const systemScheme = useColorScheme();
  const [signedIn, setSignedIn] = useState(false);
  const [authRoute, setAuthRoute] = useState("Login");
  const [active, setActive] = useState("dashboard");
  const [appSettings, setAppSettings] = useState({ theme: "Dark", language: "English" });
  const [sessionProfile, setSessionProfile] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = watchAuthState((session) => {
      setSignedIn(Boolean(session));
      setSessionProfile(session);
      if (session) setAuthRoute("Login");
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!signedIn) return undefined;
    const unsubscribeSettings = watchCurrentUserSettings((settings) => {
      if (settings) setAppSettings((current) => ({ ...current, ...settings }));
    });
    const unsubscribeProfile = watchCurrentUserProfile((session) => {
      if (session) setSessionProfile(session);
    });
    return () => {
      unsubscribeSettings();
      unsubscribeProfile();
    };
  }, [signedIn]);

  const Current = useMemo(
    () => appTabs.find((screen) => screen.key === active)?.Component || SupervisorDashboardScreen,
    [active]
  );
  const effectiveTheme = appSettings.theme === "System" ? (systemScheme === "light" ? "Light" : "Dark") : appSettings.theme;
  const shell = themeShell[effectiveTheme] || themeShell.Dark;
  const labels = tabLabels[appSettings.language] || tabLabels.English;
  const language = appSettings.language || "English";

  const navigate = (route) => {
    if (route === "Login" || route === "Register" || route === "ForgotPassword") {
      setAuthRoute(route);
      return;
    }
    if (route === "login") {
      setSignedIn(false);
      setAuthRoute("Login");
      setActive("dashboard");
      return;
    }
    if (appTabs.some((screen) => screen.key === route)) setActive(route);
  };

  if (showSplash) {
    return <SplashScreen appSettings={{ ...appSettings, theme: effectiveTheme }} />;
  }

  if (!signedIn) {
    const navigation = { navigate };

    if (authRoute === "Register") {
      return <LocalizationProvider language={language}><RegisterScreen navigation={navigation} onRegistered={() => setSignedIn(true)} /></LocalizationProvider>;
    }

    if (authRoute === "ForgotPassword") {
      return <LocalizationProvider language={language}><ForgotPasswordScreen navigation={navigation} /></LocalizationProvider>;
    }

    return <LocalizationProvider language={language}><LoginScreen onSignIn={() => setSignedIn(true)} navigation={navigation} navigate={navigate} appSettings={{ ...appSettings, theme: effectiveTheme }} /></LocalizationProvider>;
  }

  return (
    <LocalizationProvider language={language}>
      <KeyboardAvoidingView style={[styles.root, { backgroundColor: shell.bgBase }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Current navigate={navigate} appSettings={{ ...appSettings, theme: effectiveTheme }} sessionProfile={sessionProfile} />
        <View style={[styles.bottomNav, { backgroundColor: shell.navBg, borderColor: shell.navBorder }]}>
          {appTabs.map((tab) => {
            const activeTab = active === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActive(tab.key)}
                style={styles.navItem}
                activeOpacity={0.72}
              >
                <View style={[styles.navIconWrap, activeTab && { backgroundColor: shell.activeBg }]}>
                  <MaterialCommunityIcons name={tab.icon} size={activeTab ? 22 : 21} color={activeTab ? shell.activeText : shell.inactive} />
                </View>
                <Text style={[styles.navText, { color: shell.inactive }, activeTab && { color: shell.activeBg }]} numberOfLines={1}>
                  {labels[tab.key] || tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </KeyboardAvoidingView>
    </LocalizationProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgBase },
  bottomNav: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
    minHeight: 76,
    borderRadius: 24,
    backgroundColor: "rgba(18,22,22,0.94)",
    borderWidth: 1,
    borderColor: C.borderSubtle,
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 7,
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.42,
    shadowRadius: 26,
    elevation: 20,
  },
  navItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navIconWrap: {
    width: 42,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: { color: C.textSecondary, fontSize: 9, fontWeight: "800" },
});
