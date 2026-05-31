import React, { useRef, useState, useEffect } from "react";
import {
  Animated,
  SafeAreaView,
  ScrollView,
  View,
  Image,
  Pressable,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LocalizedText as Text } from "../../contexts/LocalizationContext";

const C = {
  bgBase: "#0A0D0D",
  bgSurface: "rgba(23,28,28,0.92)",
  bgElevated: "#202828",
  bgPressed: "rgba(255,255,255,0.045)",
  glass: "rgba(255,255,255,0.055)",
  amber: "#DCA24A",
  amberDim: "rgba(220,162,74,0.14)",
  amberSoft: "#E2B86F",
  critical: "#D95B52",
  criticalDim: "rgba(217,91,82,0.12)",
  warning: "#D98A3A",
  safe: "#66B37A",
  safeDim: "rgba(102,179,122,0.13)",
  info: "#6AA0C8",
  steel: "#7F8D8A",
  textPrimary: "#F3EFE8",
  textSecondary: "#ADB6B2",
  textMuted: "#737E7A",
  textDisabled: "#4C5855",
  borderSubtle: "rgba(255,255,255,0.07)",
  borderDefault: "rgba(255,255,255,0.13)",
  shadow: "#000000",
};

const STATUS_COLORS = {
  active: C.safe,
  alert: C.critical,
  break: C.warning,
  offline: C.textDisabled,
  pending: C.info,
};

const CREW_ALL = [
  { initials: "KN", name: "Katare Nderura", role: "Site Supervisor", status: "active" },
  { initials: "AE", name: "Amwaama Ebba", role: "Project Manager", status: "active" },
  { initials: "SS", name: "Simon Sheefeni", role: "Lead Developer", status: "alert" },
  { initials: "JK", name: "Joseph Kambonde", role: "Lead Developer", status: "active" },
  { initials: "LH", name: "Lavinia Shimutwikeni", role: "Lead Developer", status: "break" },
  { initials: "GG", name: "Hangula Gerson", role: "Lead Developer", status: "active" },
  { initials: "SN", name: "Saara Ndiweda", role: "Firebase Lead", status: "offline" },
  { initials: "NG", name: "Ndapandula Gulikua", role: "Firebase Lead", status: "active" },
  { initials: "GI", name: "Gehas Iimene", role: "Firebase Lead", status: "pending" },
  { initials: "EK", name: "Eliaser Katondoka", role: "UI/UX Lead", status: "active" },
];

const OPEN_HAZARDS = [
  { id: 1, type: "BLAST RISK", zone: "Zone 4B", severity: "critical", color: C.critical },
  { id: 2, type: "GAS LEAK", zone: "Zone 2A", severity: "high", color: C.warning },
  { id: 3, type: "EQUIPMENT", zone: "Zone 1C", severity: "medium", color: C.amber },
];

const PressableScale = ({ children, disabled, onPress, style }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const setPressed = (pressed) => {
    Animated.spring(scale, { toValue: pressed ? 0.985 : 1, speed: 28, bounciness: 4, useNativeDriver: true }).start();
  };

  return (
    <Pressable disabled={disabled} onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}>
      <Animated.View style={[style, { opacity: disabled ? 0.55 : 1, transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const StepButton = ({ label, onPress, color }) => (
  <PressableScale onPress={onPress} style={[styles.largeButton, color && { backgroundColor: color }]}>    
    <Text style={styles.largeButtonText}>{label}</Text>
  </PressableScale>
);

const StatusDot = ({ color }) => <View style={[styles.statusDot, { backgroundColor: color }]} />;

const PersonAvatar = ({ person, selected, color }) => (
  <View style={[styles.personAvatar, selected && styles.personAvatarSelected]}>
    {person.photo ? (
      <Image source={person.photo} style={styles.personAvatarImage} resizeMode="cover" />
    ) : (
      <Text style={[styles.avatarText, color && { color }, selected && { color: C.amber }]}>{person.initials}</Text>
    )}
    <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[person.status] || C.textDisabled }]} />
  </View>
);

export default function ShiftsScreenNative({ navigate }) {
  const [view, setView] = useState("home");
  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState([
    { id: 0, text: "Ventilation check — Tunnel A", done: false },
    { id: 1, text: "Water pump inspection — Zone 2", done: false },
    { id: 2, text: "Equipment log — Conveyor C", done: false },
  ]);
  const [selIncoming, setSelIncoming] = useState([]);
  const [incHazards, setIncHazards] = useState([1, 2, 3]);
  const [submitted, setSubmitted] = useState(false);
  const [ackDone, setAckDone] = useState(false);

  const OUTGOING = CREW_ALL.slice(0, 5);
  const INCOMING_POOL = CREW_ALL.slice(5, 10);

  const toggleIncoming = (initials) => setSelIncoming((prev) => (prev.includes(initials) ? prev.filter((id) => id !== initials) : [...prev, initials]));
  const toggleHazard = (id) => setIncHazards((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  const toggleTask = (id) => setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));

  if (view === "home") {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.root}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigate?.("dashboard")}>              
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.screenTitle}>SHIFT HANDOVER</Text>
              <Text style={styles.screenSubtitle}>DAY SHIFT → NIGHT SHIFT · 18:45</Text>
            </View>
          </View>
          {[
            { label: "Create Handover", sub: "Submit outgoing shift report", color: C.amber, action: () => { setView("create"); setStep(0); setSubmitted(false); } },
            { label: "Review Handover", sub: "Incoming leader — acknowledge & brief", color: C.safe, action: () => { setView("review"); setAckDone(false); } },
          ].map((item) => (
            <PressableScale key={item.label} onPress={item.action} style={styles.menuCard}>
              <View>
                <Text style={styles.menuTitle}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.sub}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </PressableScale>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.root}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => { setView("home"); setSubmitted(false); }}>              
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.screenTitle}>SHIFT CLOSED</Text>
              <Text style={styles.screenSubtitle}>Handover submitted</Text>
            </View>
          </View>
          <View style={styles.centeredContent}>
            <View style={styles.statusCircle}>              
              <Text style={[styles.statusIcon, { color: C.safe }]}>✓</Text>
            </View>
            <Text style={styles.bigTitle}>SHIFT CLOSED</Text>
            <Text style={styles.smallText}>Handover locked · 19:02</Text>
            <View style={styles.summaryBox}>
              {[
                { l: "SHIFT", v: "DAY SHIFT — ZONE 4B" },
                { l: "OUTGOING", v: `${OUTGOING.length} members` },
                { l: "INCOMING", v: `${selIncoming.length || INCOMING_POOL.length} selected` },
                { l: "HAZARDS", v: `${incHazards.length} handed over` },
                { l: "TASKS DONE", v: `${tasks.filter((t) => t.done).length}/${tasks.length}` },
              ].map((row) => (
                <View key={row.l} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{row.l}</Text>
                  <Text style={styles.summaryValue}>{row.v}</Text>
                </View>
              ))}
            </View>
            <StepButton label="BACK TO DASHBOARD" onPress={() => navigate?.("dashboard")} color={C.amber} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (ackDone) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.root}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigate?.("dashboard")}>              
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.screenTitle}>TEAM BRIEFED</Text>
              <Text style={styles.screenSubtitle}>Night shift active</Text>
            </View>
          </View>
          <View style={styles.centeredContent}>
            <View style={styles.statusCircle}>              
              <Text style={[styles.statusIcon, { color: C.safe }]}>👥</Text>
            </View>
            <Text style={styles.bigTitle}>TEAM BRIEFED</Text>
            <Text style={styles.smallText}>Night shift now active · 19:06</Text>
            <StepButton label="OPEN DASHBOARD" onPress={() => navigate?.("dashboard")} color={C.safe} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === "review") {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.root}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => setView("home")}>              
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.screenTitle}>HANDOVER REVIEW</Text>
              <Text style={styles.screenSubtitle}>Incoming leader — read-only</Text>
            </View>
          </View>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>RECEIVED FROM K. Nderura AT 19:02</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryHeading}>SHIFT HANDOVER RECORD</Text>
            {[
              { l: "SHIFT", v: "DAY SHIFT — ZONE 4B" },
              { l: "PERIOD", v: "07:00 — 19:00 (12 hrs)" },
              { l: "SUPERVISOR", v: "Katare Nderura" },
              { l: "CREW ON SHIFT", v: "5 members" },
            ].map((row) => (
              <View key={row.l} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{row.l}</Text>
                <Text style={styles.summaryValue}>{row.v}</Text>
              </View>
            ))}
          </View>
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Handover Notes</Text>
            <Text style={styles.sectionText}>Conveyor belt in Zone 1C shut down pending maintenance. Gas readings in Zone 2A elevated but within safe limits — monitor closely. All blast charges in Zone 4B logged and secured. Incoming team must complete ventilation check before resuming full operations.</Text>
          </View>
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Hazards Carried Over</Text>
            {OPEN_HAZARDS.map((hazard) => (
              <View key={hazard.id} style={styles.hazardItem}>                
                <View>
                  <Text style={styles.hazardTitle}>{hazard.type}</Text>
                  <Text style={styles.hazardSubtitle}>{hazard.zone}</Text>
                </View>
                <Text style={[styles.hazardSeverity, { color: hazard.color }]}>{hazard.severity.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Incomplete Tasks</Text>
            {tasks.map((task) => (
              <View key={task.id} style={styles.taskRow}>                
                <View style={[styles.taskCheck, { borderColor: C.borderDefault }]} />
                <Text style={styles.taskText}>{task.text}</Text>
              </View>
            ))}
          </View>
          <View style={styles.reviewActions}>
            <TouchableOpacity style={[styles.reviewButton, { backgroundColor: C.safe }]} onPress={() => setAckDone(true)}>
              <MaterialCommunityIcons name="account-check" size={20} color={C.bgBase} />
              <Text style={styles.reviewButtonText}>ACKNOWLEDGE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.reviewButton, styles.flagButton]} onPress={() => {}}>
              <MaterialCommunityIcons name="flag-alert" size={20} color={C.amber} />
              <Text style={[styles.reviewButtonText, { color: C.amber }]}>FLAG ISSUE</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const hasSelected = (id) => incHazards.includes(id);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.root}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setView("home")}>            
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.screenTitle}>SHIFT HANDOVER</Text>
            <Text style={styles.screenSubtitle}>DAY SHIFT → NIGHT SHIFT · 18:45</Text>
          </View>
        </View>
        <View style={styles.stepsContainer}>
          <Text style={[styles.stepChip, step === 0 && styles.stepChipActive]}>SUMMARY</Text>
          <Text style={[styles.stepChip, step === 1 && styles.stepChipActive]}>HAZARDS</Text>
          <Text style={[styles.stepChip, step === 2 && styles.stepChipActive]}>CONFIRM</Text>
        </View>

        {step === 0 && (
          <View>
            <View style={styles.teamRow}>              
              <Text style={styles.sectionHeading}>Outgoing Team</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {OUTGOING.map((person) => (
                <View key={person.initials} style={styles.personTile}>
                  <PersonAvatar person={person} color={C.amber} />
                  <Text style={styles.personName}>{person.name.split(" ")[0]}</Text>
                  <Text style={styles.personRole} numberOfLines={1}>{person.role}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.teamRow}>
              <Text style={styles.sectionHeading}>Incoming Team</Text>
              <Text style={styles.linkText}>{selIncoming.length}/{INCOMING_POOL.length}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {INCOMING_POOL.map((person) => {
                const selected = selIncoming.includes(person.initials);
                return (
                  <TouchableOpacity key={person.initials} activeOpacity={0.76} style={[styles.personTile, selected && styles.personTileSelected]} onPress={() => toggleIncoming(person.initials)}>
                    <PersonAvatar person={person} selected={selected} />
                    <Text style={styles.personName}>{person.name.split(" ")[0]}</Text>
                    <Text style={styles.personRole} numberOfLines={1}>{person.role}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.inputLabel}>Handover Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Summarise key events, equipment status, and unresolved issues..."
              placeholderTextColor={C.textDisabled}
              multiline
              style={styles.textArea}
            />
            <Text style={styles.charCount}>{notes.length}/500</Text>
            <Text style={styles.inputLabel}>Outstanding Tasks</Text>
            {tasks.map((task) => (
              <TouchableOpacity key={task.id} activeOpacity={0.78} style={[styles.taskRow, task.done && styles.taskRowDone]} onPress={() => toggleTask(task.id)}>
                <View style={[styles.taskCheck, task.done && styles.taskCheckDone]}>{task.done ? <Text style={styles.checkMark}>✓</Text> : null}</View>
                <Text style={[styles.taskText, task.done && { color: C.textDisabled, textDecorationLine: "line-through" }]}>{task.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.paragraph}>Toggle which hazards to include in the handover</Text>
            {OPEN_HAZARDS.map((hazard) => {
              const included = hasSelected(hazard.id);
              return (
                <TouchableOpacity key={hazard.id} activeOpacity={0.8} style={[styles.hazardCard, included && styles.hazardCardIncluded]} onPress={() => toggleHazard(hazard.id)}>
                  <View>
                    <Text style={[styles.hazardSeverity, { color: hazard.color }]}>{hazard.severity.toUpperCase()}</Text>
                    <Text style={styles.hazardTitle}>{hazard.type}</Text>
                    <Text style={styles.hazardSubtitle}>{hazard.zone}</Text>
                  </View>
                  <Text style={[styles.hazardStatus, { color: included ? C.textSecondary : C.textDisabled }]}>{included ? "✓ Included in handover" : "○ Not included"}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 2 && (
          <View>
            <View style={styles.summaryCard}>              
              <Text style={styles.summaryHeading}>HANDOVER SUMMARY</Text>
              {[
                { l: "SHIFT", v: "DAY SHIFT — ZONE 4B" },
                { l: "PERIOD", v: "07:00 — 19:00" },
                { l: "OUTGOING", v: `${OUTGOING.length} members` },
                { l: "INCOMING", v: `${selIncoming.length || INCOMING_POOL.length} selected` },
                { l: "HAZARDS", v: `${incHazards.length} of ${OPEN_HAZARDS.length} included` },
                { l: "TASKS DONE", v: `${tasks.filter((task) => task.done).length}/${tasks.length}` },
              ].map((row) => (
                <View key={row.l} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{row.l}</Text>
                  <Text style={styles.summaryValue}>{row.v}</Text>
                </View>
              ))}
              {notes ? <Text style={styles.reviewQuote}>"{notes}"</Text> : null}
            </View>
            <View style={styles.warningBox}>
              <Text style={styles.alertText}>⚠ Closing this shift will permanently lock the shift record. The incoming team will be immediately notified.</Text>
            </View>
          </View>
        )}

        {step === 0 && (
          <View style={styles.actionFooter}>
            <StepButton label="REVIEW HAZARDS" onPress={() => setStep(1)} color={C.amber} />
          </View>
        )}
        {step === 1 && (
          <View style={styles.actionFooter}>
            <StepButton label="NEXT — CONFIRM & CLOSE →" onPress={() => setStep(2)} color={C.amber} />
            <TouchableOpacity style={[styles.largeButton, styles.secondaryButton]} onPress={() => setStep(0)}>
              <Text style={[styles.largeButtonText, { color: C.textSecondary }]}>← BACK</Text>
            </TouchableOpacity>
          </View>
        )}
        {step === 2 && (
          <View style={styles.actionFooter}>
            <StepButton label="CLOSE SHIFT & SUBMIT HANDOVER" onPress={() => setSubmitted(true)} color={C.critical} />
            <TouchableOpacity style={[styles.largeButton, styles.secondaryButton]} onPress={() => setStep(1)}>
              <Text style={[styles.largeButtonText, { color: C.textSecondary }]}>← BACK TO EDIT</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bgBase },
  root: { padding: 20, paddingBottom: 150, backgroundColor: C.bgBase },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 },
  backText: { color: C.textSecondary, fontSize: 22 },
  screenTitle: { color: C.textPrimary, fontSize: 21, fontWeight: "800" },
  screenSubtitle: { color: C.textMuted, fontSize: 11, marginTop: 5 },
  menuCard: { position: "relative", backgroundColor: C.bgSurface, borderRadius: 18, borderWidth: 1, borderColor: C.borderSubtle, padding: 18, paddingLeft: 20, marginBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", shadowColor: C.shadow, shadowOpacity: 0.24, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  menuTitle: { color: C.textPrimary, fontSize: 19, fontWeight: "800" },
  menuSubtitle: { color: C.textMuted, fontSize: 11, marginTop: 4 },
  menuArrow: { color: C.steel, fontSize: 20 },
  centeredContent: { alignItems: "center", justifyContent: "center", paddingTop: 40 },
  statusCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, borderColor: C.borderSubtle, backgroundColor: C.glass, alignItems: "center", justifyContent: "center", marginBottom: 18, shadowColor: C.shadow, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  statusIcon: { fontSize: 28 },
  bigTitle: { color: C.textPrimary, fontSize: 28, fontWeight: "700", marginBottom: 6 },
  smallText: { color: C.textSecondary, fontSize: 12, marginBottom: 20 },
  summaryBox: { width: "100%", backgroundColor: C.bgSurface, borderRadius: 18, borderWidth: 1, borderColor: C.borderSubtle, padding: 16, marginBottom: 20, shadowColor: C.shadow, shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  summaryCard: { backgroundColor: C.bgSurface, borderRadius: 19, borderWidth: 1, borderColor: C.borderSubtle, padding: 17, marginBottom: 16, shadowColor: C.shadow, shadowOpacity: 0.22, shadowRadius: 17, shadowOffset: { width: 0, height: 9 }, elevation: 4 },
  summaryHeading: { color: C.amberSoft, fontSize: 11, fontWeight: "900", marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  summaryLabel: { color: C.textMuted, fontSize: 10, fontWeight: "800" },
  summaryValue: { color: C.textPrimary, fontSize: 12, fontWeight: "600" },
  sectionHeading: { color: C.textPrimary, fontSize: 16, fontWeight: "800" },
  sectionHeadingSmall: { color: C.textSecondary, fontSize: 10, textTransform: "uppercase", marginBottom: 10 },
  teamRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  infoBadge: { backgroundColor: C.safeDim, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 13, marginBottom: 16, alignSelf: "flex-start" },
  infoBadgeText: { color: C.safe, fontSize: 10, fontWeight: "800" },
  sectionBlock: { backgroundColor: C.bgSurface, borderRadius: 17, borderWidth: 1, borderColor: C.borderSubtle, padding: 16, marginBottom: 14, shadowColor: C.shadow, shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  sectionText: { color: C.textSecondary, fontSize: 12, lineHeight: 19 },
  hazardItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.glass, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 13, padding: 14, marginBottom: 10 },
  hazardTitle: { color: C.textPrimary, fontSize: 15, fontWeight: "700" },
  hazardSubtitle: { color: C.textSecondary, fontSize: 11 },
  hazardSeverity: { fontSize: 10, fontWeight: "800", marginBottom: 6 },
  hazardStatus: { fontSize: 10, fontWeight: "700" },
  hazardCard: { backgroundColor: C.bgSurface, borderRadius: 16, borderWidth: 1, borderColor: C.borderSubtle, padding: 15, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, shadowColor: C.shadow, shadowOpacity: 0.16, shadowRadius: 13, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  hazardCardIncluded: { backgroundColor: C.glass, borderColor: C.borderSubtle },
  taskRow: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: C.glass, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: C.borderSubtle },
  taskRowDone: { backgroundColor: C.safeDim, borderColor: C.borderSubtle },
  taskCheck: { width: 21, height: 21, borderRadius: 7, borderWidth: 1.5, borderColor: C.borderDefault, alignItems: "center", justifyContent: "center", marginRight: 12, backgroundColor: "rgba(0,0,0,0.12)" },
  taskCheckDone: { backgroundColor: C.safe, borderColor: C.borderSubtle },
  checkMark: { color: C.bgBase, fontWeight: "800", fontSize: 12 },
  taskText: { color: C.textPrimary, flex: 1 },
  inputLabel: { color: C.textSecondary, fontSize: 10, textTransform: "uppercase", marginBottom: 8, marginTop: 20 },
  textArea: { backgroundColor: C.glass, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 14, minHeight: 96, padding: 14, color: C.textPrimary, textAlignVertical: "top", fontSize: 13, lineHeight: 19 },
  charCount: { alignSelf: "flex-end", fontSize: 10, color: C.textDisabled, marginTop: 4 },
  horizontalScroll: { marginVertical: 12 },
  personTile: { width: 76, alignItems: "center", marginRight: 10, paddingVertical: 8, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.025)" },
  personTileSelected: { backgroundColor: "rgba(255,255,255,0.055)", borderColor: C.borderSubtle, borderWidth: 1 },
  personAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.borderDefault, alignItems: "center", justifyContent: "center", marginBottom: 7, overflow: "visible" },
  personAvatarSelected: { backgroundColor: "rgba(255,255,255,0.055)", borderColor: C.borderSubtle },
  personAvatarImage: { width: "100%", height: "100%" },
  avatarText: { color: C.textPrimary, fontSize: 12, fontWeight: "800" },
  statusDot: { position: "absolute", right: -1, bottom: 1, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: C.bgBase },
  personName: { color: C.textSecondary, fontSize: 9, fontWeight: "700", textAlign: "center" },
  personRole: { color: C.textDisabled, fontSize: 8, textAlign: "center", marginTop: 2, maxWidth: 70 },
  linkText: { color: C.amberSoft, fontSize: 11, fontWeight: "800" },
  paragraph: { color: C.textDisabled, fontSize: 11, marginBottom: 12 },
  stepChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, backgroundColor: C.glass, borderWidth: 1, borderColor: C.borderSubtle, color: C.textSecondary, marginRight: 10, overflow: "hidden", fontSize: 10, fontWeight: "800" },
  stepChipActive: { backgroundColor: C.amber, color: "#0D0F0F" },
  stepsContainer: { flexDirection: "row", marginBottom: 18 },
  warningBox: { backgroundColor: C.criticalDim, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 14, padding: 14, marginTop: 10 },
  alertText: { color: C.textSecondary, fontSize: 11 },
  reviewQuote: { color: C.textSecondary, fontSize: 12, lineHeight: 18, backgroundColor: C.glass, borderRadius: 12, padding: 12, marginTop: 8 },
  actionFooter: { marginTop: 18 },
  largeButton: { backgroundColor: C.amber, borderRadius: 13, minHeight: 54, paddingVertical: 15, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", marginVertical: 8, shadowColor: C.shadow, shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  secondaryButton: { backgroundColor: C.glass, borderColor: C.borderSubtle, borderWidth: 1, shadowOpacity: 0 },
  largeButtonText: { color: "#0D0F0F", fontWeight: "800", textAlign: "center", fontSize: 12 },
  reviewActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  reviewButton: { flex: 1, minHeight: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingHorizontal: 10 },
  flagButton: { backgroundColor: C.glass, borderWidth: 1, borderColor: C.borderSubtle },
  reviewButtonText: { color: C.bgBase, fontSize: 12, fontWeight: "900" },
});
