import React, { useState, useEffect } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from "react-native";
import {
  DEFAULT_SHIFT_CREW,
  formatGps,
  getCurrentGpsCoordinates,
  markSelfSafe,
  secondsRemaining,
  startSosMuster,
  triggerSosAlarm,
  watchActiveSosEvents,
  watchSosResponses,
} from "../../services/sosService";

const C = {
  bgBase: "#0D0F0F",
  bgSurface: "#161A1A",
  bgElevated: "#1E2424",
  amber: "#F5A623",
  amberDim: "rgba(245,166,35,0.12)",
  critical: "#E53935",
  warning: "#FB8C00",
  safe: "#43A047",
  textPrimary: "#F0EDE8",
  textSecondary: "#9EA8A8",
  textDisabled: "#4A5252",
  borderSubtle: "#272D2D",
  borderDefault: "#374040",
};

const HAZARDS = [
  { id: 1, severity: "critical", type: "BLAST RISK", zone: "Zone 4B", time: "08:14", reporter: "K. Nderura", ack: 11, total: 14, desc: "Unexploded charge detected near drill site" },
  { id: 2, severity: "high", type: "GAS LEAK", zone: "Zone 2A", time: "09:32", reporter: "S. Sheefeni", ack: 8, total: 14, desc: "Methane levels elevated in tunnel section C" },
  { id: 3, severity: "medium", type: "EQUIPMENT", zone: "Zone 1C", time: "10:05", reporter: "J. Kambonde", ack: 14, total: 14, desc: "Conveyor belt misalignment — ops paused" },
];

const CREW = [
  { initials: "KN", name: "K. Nderura", status: "active" },
  { initials: "AE", name: "A. Ebba", status: "active" },
  { initials: "SS", name: "S. Sheefeni", status: "alert" },
  { initials: "JK", name: "J. Kambonde", status: "active" },
  { initials: "LH", name: "L. Shimutwikeni", status: "break" },
  { initials: "GG", name: "G. Gerson", status: "active" },
  { initials: "SN", name: "S. Ndiweda", status: "offline" },
];

const MUSTER_CREW = DEFAULT_SHIFT_CREW;

const NAV = [
  { id: "dashboard", label: "DASH", icon: "🏠" },
  { id: "shifts", label: "SHIFTS", icon: "🕒" },
  { id: "hazards", label: "HAZARDS", icon: "⚠️" },
  { id: "reports", label: "REPORTS", icon: "📄" },
  { id: "profile", label: "PROFILE", icon: "👤" },
];

const SEVERITY_CONFIG = {
  critical: { color: C.critical, label: "CRITICAL" },
  high: { color: C.warning, label: "HIGH" },
  medium: { color: C.amber, label: "MEDIUM" },
  low: { color: C.safe, label: "LOW" },
};

const STATUS_CONFIG = {
  active: { color: C.safe },
  alert: { color: C.critical },
  break: { color: C.warning },
  offline: { color: C.textDisabled },
};

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.low;
  return (
    <View style={[styles.badge, { backgroundColor: `${cfg.color}22` }]}>      
      <View style={[styles.badgeDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function HazardCard({ hazard, onPress }) {
  const total = Number(hazard.total) || 1;
  const pct = Math.min(100, Math.round(((Number(hazard.ack) || 0) / total) * 100));
  const ackColor = pct === 100 ? C.safe : pct >= 50 ? C.warning : C.critical;
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(hazard)}>
      <View style={styles.cardHeader}>
        <SeverityBadge severity={hazard.severity} />
        <Text style={styles.cardTime}>{hazard.time}</Text>
      </View>
      <Text style={styles.cardTitle}>{hazard.type}</Text>
      <Text style={styles.cardSubtitle}>{hazard.zone} · {hazard.reporter}</Text>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: ackColor }]} />
      </View>
      <Text style={[styles.cardAck, { color: ackColor }]}>{hazard.ack}/{hazard.total} ACK</Text>
    </TouchableOpacity>
  );
}

function HazardModal({ hazard, visible, onClose }) {
  if (!hazard) return null;
  const cfg = SEVERITY_CONFIG[hazard.severity] || SEVERITY_CONFIG.medium;
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={[styles.modalSeverity, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={styles.modalTitle}>{hazard.type}</Text>
          <Text style={styles.modalMeta}>{hazard.zone} · {hazard.reporter} · {hazard.time}</Text>
          <Text style={styles.modalDescription}>{hazard.desc}</Text>
          <View style={styles.modalButtons}>            
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: C.amberDim }]}>
              <Text style={[styles.modalButtonText, { color: C.amber }]}>ACKNOWLEDGE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: C.amber }]}>              
              <Text style={[styles.modalButtonText, { color: "#0D0F0F" }]}>VIEW FULL REPORT</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function MusterPanel({ activeSos, responses, timeLeft, onSos, onSafe, sosBusy, safeBusy }) {
  const safeIds = new Set(responses.map((item) => item.uid || item.id));
  const safeNames = new Set(responses.map((item) => item.name));
  const roster = activeSos?.roster?.length ? activeSos.roster : MUSTER_CREW;
  const accounted = roster.filter((worker) => safeIds.has(worker.id) || safeNames.has(worker.name));
  const missing = roster.filter((worker) => !safeIds.has(worker.id) && !safeNames.has(worker.name));
  const expired = Boolean(activeSos && timeLeft <= 0);

  if (!activeSos) {
    return (
      <View style={styles.sosCard}>
        <View style={styles.sosHeader}>
          <View>
            <Text style={styles.sosKicker}>EMERGENCY SOS</Text>
            <Text style={styles.sosTitle}>Broadcast GPS + start muster</Text>
          </View>
          <View style={styles.sosReadyPill}><Text style={styles.sosReadyText}>ARMED</Text></View>
        </View>
        <Text style={styles.sosDescription}>Pressing SOS alerts supervisors, alarms active devices, and gives the crew 3 minutes to report safe.</Text>
        <TouchableOpacity style={[styles.sosButton, sosBusy && styles.sosButtonDisabled]} onPress={onSos} disabled={sosBusy}>
          <Text style={styles.sosButtonText}>{sosBusy ? "SENDING SOS..." : "SOS"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.sosCard, styles.sosCardActive]}>
      <View style={styles.sosHeader}>
        <View>
          <Text style={styles.sosKicker}>SOS ACTIVE</Text>
          <Text style={styles.sosTitle}>{expired ? "Missing crew flagged" : "Muster countdown running"}</Text>
        </View>
        <View style={[styles.timerPill, expired && styles.timerPillExpired]}>
          <Text style={styles.timerText}>{formatTimer(timeLeft)}</Text>
        </View>
      </View>
      <Text style={styles.sosMeta}>SOS GPS {formatGps(activeSos.gps)} - {activeSos.zone || "Active shift"}</Text>
      <View style={styles.musterStats}>
        <View style={styles.musterStat}>
          <Text style={[styles.musterStatValue, { color: C.safe }]}>{accounted.length}</Text>
          <Text style={styles.musterStatLabel}>SAFE</Text>
        </View>
        <View style={styles.musterStat}>
          <Text style={[styles.musterStatValue, { color: expired ? C.critical : C.amber }]}>{missing.length}</Text>
          <Text style={styles.musterStatLabel}>{expired ? "MISSING" : "PENDING"}</Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.safeButton, safeBusy && styles.safeButtonDisabled]} onPress={onSafe} disabled={safeBusy}>
        <Text style={styles.safeButtonText}>{safeBusy ? "UPDATING..." : "I AM SAFE"}</Text>
      </TouchableOpacity>
      <Text style={styles.musterListTitle}>LIVE MUSTER LIST</Text>
      {roster.map((worker) => {
        const isSafe = safeIds.has(worker.id) || safeNames.has(worker.name);
        const isMissing = expired && !isSafe;
        return (
          <View key={worker.id || worker.initials} style={styles.musterRow}>
            <View style={[styles.musterDot, { backgroundColor: isSafe ? C.safe : isMissing ? C.critical : C.warning }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.musterName}>{worker.name}</Text>
              <Text style={styles.musterLocation}>{isSafe ? "Accounted for" : `Last known ${formatGps(worker.lastKnownLocation)}`}</Text>
            </View>
            <Text style={[styles.musterStatus, { color: isSafe ? C.safe : isMissing ? C.critical : C.warning }]}>
              {isSafe ? "SAFE" : isMissing ? "MISSING" : "PENDING"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function DashboardNative() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [offline, setOffline] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [fabPressed, setFabPressed] = useState(false);
  const [tick, setTick] = useState(0);
  const [activeSos, setActiveSos] = useState(null);
  const [sosResponses, setSosResponses] = useState([]);
  const [sosBusy, setSosBusy] = useState(false);
  const [safeBusy, setSafeBusy] = useState(false);

  const shiftStart = 7 * 60;
  const shiftEnd = 19 * 60;
  const currentMins = 9 * 60 + 41;
  const shiftPct = Math.round(((currentMins - shiftStart) / (shiftEnd - shiftStart)) * 100);
  const elapsed = `${Math.floor((currentMins - shiftStart) / 60)}h ${(currentMins - shiftStart) % 60}m elapsed`;

  useEffect(() => {
    const timer = setInterval(() => setTick((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => watchActiveSosEvents((events) => {
    setActiveSos(events[0] || null);
    if (events[0]) triggerSosAlarm();
  }), []);

  useEffect(() => watchSosResponses(activeSos?.id, setSosResponses), [activeSos?.id]);

  const timeLeft = activeSos ? secondsRemaining(activeSos) : 180;

  const handleSos = async () => {
    setSosBusy(true);
    try {
      const gps = await getCurrentGpsCoordinates();
      await startSosMuster({
        shiftId: "active-zone-4b",
        shiftName: "DAY SHIFT",
        zone: "Zone 4B",
        crew: MUSTER_CREW,
        gps,
      });
      Alert.alert("SOS broadcast", `Supervisors notified at GPS ${formatGps(gps)}. Muster countdown started.`);
    } catch (error) {
      Alert.alert("SOS failed", error.message || "Check your connection and try again.");
    } finally {
      setSosBusy(false);
    }
  };

  const handleSafe = async () => {
    if (!activeSos?.id) return;
    setSafeBusy(true);
    try {
      await markSelfSafe({ eventId: activeSos.id });
      Alert.alert("Muster updated", "You are marked safe on the live muster list.");
    } catch (error) {
      Alert.alert("Could not mark safe", error.message || "Check your connection and try again.");
    } finally {
      setSafeBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.topTitle}>MINEOPS</Text>
          <View style={styles.topRightRow}>
            <TouchableOpacity onPress={() => setOffline((prev) => !prev)} style={styles.iconButton}>
              <Text style={[styles.iconText, offline ? { color: C.textDisabled } : { color: C.textSecondary }]}>{offline ? "🔕" : "🔔"}</Text>
            </TouchableOpacity>
            <View style={styles.avatar}>{/* initials */}
              <Text style={styles.avatarText}>KN</Text>
            </View>
          </View>
        </View>

        {offline ? (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>OFFLINE — DATA CACHED LOCALLY</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACTIVE SITE</Text>
          <Text style={styles.sectionHeading}>SKORPION MINE — SITE A</Text>
        </View>

        <View style={[styles.card, styles.activeShiftCard]}>
          <View style={styles.cardHeaderInline}>
            <Text style={styles.badgeSmall}>ACTIVE SHIFT</Text>
            <View style={styles.liveChip}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>DAY SHIFT — ZONE 4B</Text>
          <Text style={styles.cardSubtitle}>07:00 — 19:00 · {elapsed} · 14 crew</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${shiftPct}%`, backgroundColor: C.safe }]} />
          </View>
          <View style={styles.progressPhaseRow}>
            <Text style={styles.miniText}>07:00</Text>
            <Text style={[styles.miniText, { color: C.safe }]}>{shiftPct}% complete</Text>
            <Text style={styles.miniText}>19:00</Text>
          </View>
        </View>

        <MusterPanel
          activeSos={activeSos}
          responses={sosResponses}
          timeLeft={timeLeft}
          onSos={handleSos}
          onSafe={handleSafe}
          sosBusy={sosBusy}
          safeBusy={safeBusy}
        />

        <View style={styles.statsRow}>
          {[
            { label: "ON SITE", value: "14", color: C.textPrimary },
            { label: "HAZARDS", value: "3", color: C.warning },
            { label: "PENDING", value: "2", color: C.amber },
          ].map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionHeadingSmall}>CREW ON SHIFT</Text>
          <Text style={styles.linkText}>VIEW ALL</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {CREW.map((c) => {
            const status = STATUS_CONFIG[c.status] || STATUS_CONFIG.active;
            return (
              <View key={c.initials} style={styles.crewTile}>
                <View style={styles.crewAvatar}>
                  <Text style={styles.avatarText}>{c.initials}</Text>
                </View>
                <Text style={styles.crewName}>{c.name.split(" ")[0]}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.section, { paddingVertical: 0 }]}>          
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>ACTIVE HAZARDS</Text>
            <Text style={styles.linkText}>VIEW ALL</Text>
          </View>
          {HAZARDS.map((hazard) => (
            <HazardCard key={hazard.id} hazard={hazard} onPress={setSelectedHazard} />
          ))}
        </View>

        <TouchableOpacity style={styles.fab} onPress={() => setSelectedHazard({ id: 0, severity: "critical", type: "NEW HAZARD", zone: "", time: "", reporter: "", ack: 0, total: 14, desc: "" })}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        <View style={styles.bottomNav}>
          {NAV.map((item) => {
            const active = activeNav === item.id;
            return (
              <TouchableOpacity key={item.id} style={styles.navItem} onPress={() => setActiveNav(item.id)}>
                <Text style={[styles.navIcon, active && { color: C.amber }]}>{item.icon}</Text>
                <Text style={[styles.navLabel, active && { color: C.amber }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <HazardModal hazard={selectedHazard} visible={Boolean(selectedHazard)} onClose={() => setSelectedHazard(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bgBase },
  container: { padding: 20, paddingBottom: 148, backgroundColor: C.bgBase },
  header: { minHeight: 52, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  topTitle: { color: C.amber, fontSize: 23, fontWeight: "900", letterSpacing: 0.3 },
  topRightRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: C.borderSubtle, alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 20 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.amber, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  avatarText: { color: "#0D0F0F", fontWeight: "800" },
  offlineBanner: { backgroundColor: "rgba(96,125,139,0.1)", borderRadius: 12, padding: 10, marginBottom: 12 },
  offlineText: { color: C.textDisabled, fontSize: 12 },
  section: { marginBottom: 16 },
  sectionLabel: { color: C.textDisabled, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" },
  sectionHeading: { color: C.textPrimary, fontSize: 20, fontWeight: "700", marginTop: 4 },
  sectionHeadingSmall: { color: C.textPrimary, fontSize: 16, fontWeight: "700" },
  card: { backgroundColor: "rgba(23,28,28,0.94)", borderRadius: 17, borderWidth: 1, borderColor: C.borderSubtle, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  activeShiftCard: { borderRadius: 19 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardHeaderInline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  badgeSmall: { color: C.safe, fontSize: 10, fontWeight: "700" },
  liveChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(67,160,71,0.12)", borderWidth: 1, borderColor: C.borderSubtle },
  liveText: { color: C.safe, fontWeight: "700", fontSize: 10 },
  cardTitle: { color: C.textPrimary, fontSize: 22, fontWeight: "800", marginBottom: 4 },
  cardSubtitle: { color: C.textSecondary, fontSize: 12, marginBottom: 10 },
  progressBarBackground: { height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 6 },
  progressBarFill: { height: "100%", borderRadius: 3 },
  progressPhaseRow: { flexDirection: "row", justifyContent: "space-between" },
  miniText: { color: C.textDisabled, fontSize: 10 },
  statCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 15, padding: 13, marginRight: 10, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  statValue: { fontSize: 26, fontWeight: "900" },
  statLabel: { color: C.textDisabled, fontSize: 10, fontWeight: "800", marginTop: 6 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  linkText: { color: C.amber, fontSize: 11, fontWeight: "700" },
  horizontalScroll: { marginBottom: 18 },
  crewTile: { width: 58, marginRight: 10, alignItems: "center", paddingVertical: 4 },
  crewAvatar: { width: 43, height: 43, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.055)", borderWidth: 1.5, borderColor: C.borderSubtle, alignItems: "center", justifyContent: "center", marginBottom: 6, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  crewName: { color: C.textDisabled, fontSize: 9, textAlign: "center" },
  cardTime: { color: C.textDisabled, fontSize: 11 },
  badge: { flexDirection: "row", alignItems: "center", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, borderWidth: 1, borderColor: C.borderSubtle, marginRight: 8 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: C.bgSurface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalSeverity: { fontSize: 12, fontWeight: "700", marginBottom: 10 },
  modalTitle: { color: C.textPrimary, fontSize: 20, fontWeight: "700", marginBottom: 6 },
  modalMeta: { color: C.textSecondary, marginBottom: 14 },
  modalDescription: { color: C.textPrimary, lineHeight: 20, marginBottom: 16 },
  modalButtons: { flexDirection: "row", gap: 10, marginBottom: 16 },
  modalButton: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: C.borderSubtle, paddingVertical: 14, alignItems: "center" },
  modalButtonText: { fontWeight: "700", fontSize: 12 },
  modalClose: { alignItems: "center", paddingVertical: 12 },
  modalCloseText: { color: C.textPrimary, fontWeight: "700" },
  sosCard: { backgroundColor: "rgba(23,28,28,0.94)", borderRadius: 17, borderWidth: 1, borderColor: C.borderSubtle, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  sosCardActive: { borderColor: "rgba(229,57,53,0.65)", backgroundColor: "rgba(51,20,20,0.72)" },
  sosHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 },
  sosKicker: { color: C.critical, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  sosTitle: { color: C.textPrimary, fontSize: 18, fontWeight: "900", marginTop: 3, flexShrink: 1 },
  sosDescription: { color: C.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  sosMeta: { color: C.textSecondary, fontSize: 11, marginBottom: 12 },
  sosReadyPill: { borderWidth: 1, borderColor: C.borderSubtle, backgroundColor: "rgba(229,57,53,0.12)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  sosReadyText: { color: C.critical, fontSize: 10, fontWeight: "900" },
  sosButton: { minHeight: 54, borderRadius: 12, backgroundColor: C.critical, alignItems: "center", justifyContent: "center", shadowColor: C.critical, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  sosButtonDisabled: { opacity: 0.62 },
  sosButtonText: { color: C.textPrimary, fontSize: 20, fontWeight: "900", letterSpacing: 1.2 },
  timerPill: { minWidth: 70, borderRadius: 12, backgroundColor: C.amber, alignItems: "center", paddingVertical: 8, paddingHorizontal: 10 },
  timerPillExpired: { backgroundColor: C.critical },
  timerText: { color: "#0D0F0F", fontSize: 17, fontWeight: "900" },
  musterStats: { flexDirection: "row", gap: 10, marginBottom: 10 },
  musterStat: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: C.borderSubtle, backgroundColor: "rgba(255,255,255,0.05)", padding: 10 },
  musterStatValue: { fontSize: 24, fontWeight: "900" },
  musterStatLabel: { color: C.textDisabled, fontSize: 10, fontWeight: "900", marginTop: 2 },
  safeButton: { minHeight: 48, borderRadius: 12, backgroundColor: C.safe, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  safeButtonDisabled: { opacity: 0.62 },
  safeButtonText: { color: "#0D0F0F", fontSize: 14, fontWeight: "900" },
  musterListTitle: { color: C.textPrimary, fontSize: 12, fontWeight: "900", marginBottom: 8 },
  musterRow: { minHeight: 52, borderRadius: 10, borderWidth: 1, borderColor: C.borderSubtle, backgroundColor: "rgba(0,0,0,0.16)", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, marginBottom: 7 },
  musterDot: { width: 9, height: 9, borderRadius: 5 },
  musterName: { color: C.textPrimary, fontSize: 12, fontWeight: "800" },
  musterLocation: { color: C.textDisabled, fontSize: 10, marginTop: 2 },
  musterStatus: { fontSize: 10, fontWeight: "900" },
  fab: { position: "absolute", right: 22, bottom: 118, width: 56, height: 56, borderRadius: 28, backgroundColor: C.amber, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  fabText: { fontSize: 32, color: "#0D0F0F" },
  bottomNav: { position: "absolute", left: 12, right: 12, bottom: 10, height: 78, backgroundColor: "rgba(18,22,22,0.94)", borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 24, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, shadowColor: "#000", shadowOpacity: 0.42, shadowRadius: 26, shadowOffset: { width: 0, height: 16 }, elevation: 20 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 2 },
  navIcon: { fontSize: 18, color: C.textDisabled },
  navLabel: { color: C.textDisabled, fontSize: 9, marginTop: 4 },
});
