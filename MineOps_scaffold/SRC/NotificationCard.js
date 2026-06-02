import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LocalizedText as Text } from "../../contexts/LocalizationContext";
import { darkTheme } from "../../styles/appTheme";

const C = {
  ...darkTheme,
  bgSurface: "#161A1A",
  bgElevated: "#1E2424",
  amber: "#F5A623",
  critical: "#E53935",
  warning: "#FB8C00",
  safe: "#43A047",
  info: "#1E88E5",
  textPrimary: "#F0EDE8",
  textSecondary: "#9EA8A8",
  textDisabled: "#4A5252",
  borderSubtle: "#272D2D",
};

const severityConfig = {
  critical: { color: C.critical, icon: "alert-octagon" },
  high: { color: C.warning, icon: "alert" },
  medium: { color: C.amber, icon: "bell-alert" },
  low: { color: C.safe, icon: "information-outline" },
  info: { color: C.info, icon: "information-outline" },
};

const formatTime = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Live";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function NotificationCard({ item, onPress, themeColors }) {
  const colors = themeColors || C;
  const themedStyles = themeColors ? createStyles(colors) : styles;
  const cfg = severityConfig[item?.severity] || severityConfig.medium;
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={() => onPress?.(item)}
      style={[themedStyles.card, item?.read && themedStyles.readCard]}
    >
      <View style={[themedStyles.iconWrap, { backgroundColor: `${cfg.color}22` }]}>
        <MaterialCommunityIcons name={cfg.icon} size={20} color={cfg.color} />
      </View>
      <View style={themedStyles.body}>
        <View style={themedStyles.topRow}>
          <Text style={themedStyles.title} numberOfLines={1}>{item?.title || "MineOps alert"}</Text>
          {!item?.read ? <View style={[themedStyles.unreadDot, { backgroundColor: cfg.color }]} /> : null}
        </View>
        <Text style={themedStyles.message} numberOfLines={2}>{item?.message || "No message recorded."}</Text>
        <Text style={themedStyles.meta}>{(item?.zone || item?.type || "Update").toUpperCase()} - {formatTime(item?.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (C) => StyleSheet.create({
  card: {
    minHeight: 86,
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    gap: 12,
  },
  readCard: { opacity: 0.7 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, color: C.textPrimary, fontSize: 14, fontWeight: "900" },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  message: { color: C.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 5 },
  meta: { color: C.textDisabled, fontSize: 10, fontWeight: "900", marginTop: 7 },
});

const styles = createStyles(C);
