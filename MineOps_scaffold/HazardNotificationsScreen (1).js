import React, { useEffect, useMemo, useState } from "react";
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import NotificationCard from "../../components/alerts/NotificationCard";
import {
  acknowledgeAlert,
  markNotificationRead,
  watchAlerts,
  watchCurrentUserNotifications,
  watchCurrentUserReminders,
} from "../../services/alertService";
import { LocalizedText as Text } from "../../contexts/LocalizationContext";
import { darkTheme, getAppColors } from "../../styles/appTheme";

let C = {
  ...darkTheme,
  bgBase: "#0D0F0F",
  bgSurface: "#161A1A",
  bgElevated: "#1E2424",
  amber: "#F5A623",
  critical: "#E53935",
  safe: "#43A047",
  textPrimary: "#F0EDE8",
  textSecondary: "#9EA8A8",
  textDisabled: "#4A5252",
  borderSubtle: "#272D2D",
};

const alertToNotification = (alert) => ({
  ...alert,
  read: false,
  message: alert.message || "Alert update received.",
});

export default function HazardNotificationsScreen({ navigate, appSettings }) {
  C = getAppColors(appSettings);
  styles = createStyles(C);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    const unsubAlerts = watchAlerts(setAlerts);
    const unsubNotifications = watchCurrentUserNotifications(setNotifications);
    const unsubReminders = watchCurrentUserReminders(setReminders);
    return () => {
      unsubAlerts();
      unsubNotifications();
      unsubReminders();
    };
  }, []);

  const items = useMemo(() => {
    const merged = [
      ...alerts.map(alertToNotification),
      ...notifications,
      ...reminders.map((reminder) => ({
        ...reminder,
        severity: "info",
        title: "Shift reminder",
        message: reminder.enabled
          ? `Reminder is set for ${reminder.leadTime || "30 minutes before"} shift start and end.`
          : "Shift reminders are turned off.",
        type: "reminder",
      })),
    ];
    return merged.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }, [alerts, notifications, reminders]);

  const unreadCount = items.filter((item) => !item.read).length;

  const handlePress = async (item) => {
    try {
      if (item.type === "hazard" && item.relatedId) {
        await acknowledgeAlert(item.id);
        Alert.alert("Alert acknowledged", "Your acknowledgement has been recorded.");
      }
      if (item.read === false && notifications.some((notification) => notification.id === item.id)) {
        await markNotificationRead(item.id);
      }
    } catch (error) {
      Alert.alert("Update failed", error.message || "Check your connection and try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgBase} />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>NOTIFICATIONS</Text>
          <Text style={styles.subtitle}>{unreadCount} unread - live Firestore updates</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigate?.("settings")}>
          <MaterialCommunityIcons name="cog" size={22} color={C.amber} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{alerts.length}</Text>
            <Text style={styles.summaryLabel}>ACTIVE ALERTS</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: C.safe }]}>{reminders.length}</Text>
            <Text style={styles.summaryLabel}>REMINDERS</Text>
          </View>
        </View>

        {items.length ? (
          items.map((item) => <NotificationCard key={`${item.type || "item"}-${item.id}`} item={item} onPress={handlePress} themeColors={C} />)
        ) : (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bell-check-outline" size={38} color={C.textDisabled} />
            <Text style={styles.emptyTitle}>No live notifications</Text>
            <Text style={styles.emptyText}>Hazard alerts, shift reminders, and profile updates will appear here.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bgBase },
  header: { minHeight: 68, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.borderSubtle, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: C.textPrimary, fontSize: 26, fontWeight: "900" },
  subtitle: { color: C.textSecondary, fontSize: 11, marginTop: 4 },
  headerButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.borderSubtle, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, paddingBottom: 120 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 10, padding: 13 },
  summaryValue: { color: C.amber, fontSize: 26, fontWeight: "900" },
  summaryLabel: { color: C.textDisabled, fontSize: 10, fontWeight: "900", marginTop: 4 },
  empty: { minHeight: 260, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 12, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { color: C.textPrimary, fontSize: 16, fontWeight: "900", marginTop: 12 },
  emptyText: { color: C.textSecondary, fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 6 },
});

let styles = createStyles(C);
