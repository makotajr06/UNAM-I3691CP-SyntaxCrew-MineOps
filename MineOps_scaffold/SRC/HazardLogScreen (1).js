import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { createHazardAlert } from "../../services/hazardService";
import { LocalizedText as Text } from "../../contexts/LocalizationContext";
import { darkTheme, getAppColors } from "../../styles/appTheme";

let C = {
  ...darkTheme,
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
  textPrimary: "#F0EDE8",
  textSecondary: "#9EA8A8",
  textDisabled: "#4A5252",
  borderSubtle: "#272D2D",
  borderDefault: "#374040",
};

const HAZARD_TYPES = ["GAS LEAK", "STRUCTURAL", "EQUIPMENT", "BLAST RISK", "FALL RISK", "OTHER"];
const ZONES = ["Zone 1A", "Zone 1B", "Zone 2A", "Zone 2B", "Zone 4B", "Zone 5C", "Tunnel A", "Tunnel B"];
const SEVERITIES = [
  { id: "low", label: "LOW", color: C.safe, dim: C.safeDim, text: "Monitor situation. No immediate action required." },
  { id: "medium", label: "MEDIUM", color: C.amber, dim: C.amberDim, text: "Supervisor notified. Controlled response needed." },
  { id: "high", label: "HIGH", color: C.warning, dim: C.warningDim, text: "Immediate action required. Zone may need evacuation." },
  { id: "critical", label: "CRITICAL", color: C.critical, dim: C.criticalDim, text: "Emergency. All personnel evacuate zone immediately." },
];
const CREW = [
  { initials: "KN", name: "Katare Nderura", role: "Site Supervisor" },
  { initials: "AE", name: "Amwaama Ebba", role: "Project Manager" },
  { initials: "SS", name: "Simon Sheefeni", role: "Lead Developer" },
  { initials: "JK", name: "Joseph Kambonde", role: "Lead Developer" },
  { initials: "LH", name: "Lavinia Shimutwikeni", role: "Lead Developer" },
  { initials: "GG", name: "Hangula Gerson", role: "Lead Developer" },
  { initials: "SN", name: "Saara Ndiweda", role: "Firebase Lead" },
  { initials: "NG", name: "Ndapandula Gulikua", role: "Firebase Lead" },
  { initials: "GI", name: "Gehas Iimene", role: "Firebase Lead" },
  { initials: "EK", name: "Eliaser Katondoka", role: "UI/UX Lead" },
  { initials: "NT", name: "Niinkoti Tomas", role: "UI/UX Lead" },
  { initials: "LS", name: "Linea Shevaanyena", role: "UI/UX Lead" },
  { initials: "ST", name: "Shatika Titus", role: "Documentation" },
  { initials: "MF", name: "Masaku Fernandu", role: "Documentation" },
];

function Header({ title, subtitle, onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color={C.textSecondary} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

function Progress({ step }) {
  return (
    <View style={styles.progress}>
      {["DETAILS", "SEVERITY", "CONFIRM"].map((label, index) => {
        const done = index < step;
        const active = index === step;
        return (
          <View key={label} style={styles.progressItem}>
            <View style={[styles.stepDot, done && styles.stepDone, active && styles.stepActive]}>
              {done ? <Ionicons name="checkmark" size={14} color={C.bgBase} /> : <Text style={[styles.stepNum, active && { color: C.bgBase }]}>{index + 1}</Text>}
            </View>
            <Text style={[styles.stepLabel, done && { color: C.safe }, active && { color: C.amber }]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function Chip({ label, selected, color, onPress }) {
  return (
    <TouchableOpacity style={[styles.chip, selected && { borderColor: C.borderSubtle, backgroundColor: C.bgSurface }]} onPress={onPress}>
      <Text style={[styles.chipText, selected && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Primary({ label, onPress, color = C.amber, disabled, icon }) {
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.primary, { backgroundColor: disabled ? C.bgElevated : color }]}>
      {icon ? <MaterialCommunityIcons name={icon} size={20} color={disabled ? C.textDisabled : C.bgBase} /> : null}
      <Text style={[styles.primaryText, disabled && { color: C.textDisabled }]}>{label}</Text>
    </TouchableOpacity>
  );
}

async function pickHazardPhoto(source, setForm) {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert("Permission needed", `Allow ${source === "camera" ? "camera" : "photo library"} access to attach hazard evidence.`);
    return;
  }

  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.35, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.35, base64: true });

  if (!result.canceled && result.assets?.[0]?.uri) {
    setForm((f) => ({ ...f, photo: result.assets[0] }));
  }
}

function DetailsStep({ form, setForm, onNext, onBack }) {
  return (
    <View style={styles.screen}>
      <Header title="⚠️ RAISE HAZARD ALERT" subtitle="Zone 4B - 14 crew will be notified" onBack={onBack} />
      <Progress step={0} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Hazard Type *</Text>
        <View style={styles.wrap}>{HAZARD_TYPES.map((type) => <Chip key={type} label={type} selected={form.type === type} color={C.amber} onPress={() => setForm((f) => ({ ...f, type }))} />)}</View>
        {form.attempted && !form.type ? <Text style={styles.errorText}>Select a hazard type</Text> : null}

        <Text style={styles.label}>Zone *</Text>
        <View style={styles.wrap}>{ZONES.map((zone) => <Chip key={zone} label={zone} selected={form.zone === zone} color={C.info} onPress={() => setForm((f) => ({ ...f, zone }))} />)}</View>

        <Text style={styles.label}>Description *</Text>
        <TextInput
          value={form.desc}
          onChangeText={(desc) => setForm((f) => ({ ...f, desc }))}
          placeholder="Describe the hazard clearly: what you saw, exact location, immediate risk..."
          placeholderTextColor={C.textDisabled}
          multiline
          maxLength={500}
          style={styles.textArea}
        />
        <Text style={styles.charCount}>{form.desc.length}/500</Text>
        <TouchableOpacity
          style={styles.inlineSubmit}
          onPress={() => {
            setForm((f) => ({ ...f, attempted: true }));
            if (form.type && form.zone && form.desc.trim()) onNext();
          }}
        >
          <MaterialCommunityIcons name="arrow-right-circle" size={20} color={C.bgBase} />
          <Text style={styles.inlineSubmitText}>SAVE DESCRIPTION & SET SEVERITY</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Photo Evidence <Text style={styles.optional}>optional</Text></Text>
        <View style={styles.photoRow}>
          {form.photo ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: form.photo.uri }} style={styles.photoImage} />
              <TouchableOpacity style={styles.removePhoto} onPress={() => setForm((f) => ({ ...f, photo: null }))}>
                <Ionicons name="close" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}
          <TouchableOpacity style={styles.addPhoto} onPress={() => pickHazardPhoto("camera", setForm)}>
            <Ionicons name="camera" size={22} color={C.textSecondary} />
            <Text style={styles.addPhotoText}>{form.photo ? "RETAKE" : "CAPTURE"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addPhoto} onPress={() => pickHazardPhoto("gallery", setForm)}>
            <Ionicons name="image" size={22} color={C.textSecondary} />
            <Text style={styles.addPhotoText}>GALLERY</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      <View style={styles.footer}>
        <Primary
          label="NEXT - SET SEVERITY"
          icon="arrow-right"
          onPress={() => {
            setForm((f) => ({ ...f, attempted: true }));
            if (form.type && form.zone && form.desc.trim()) onNext();
          }}
        />
      </View>
    </View>
  );
}

function SeverityStep({ form, setForm, onNext, onBack }) {
  const selected = SEVERITIES.find((s) => s.id === form.severity);
  return (
    <View style={styles.screen}>
      <Header title="SET SEVERITY LEVEL" subtitle={`${form.type} - ${form.zone}`} onBack={onBack} />
      <Progress step={1} />
      <ScrollView contentContainerStyle={styles.content}>
        {SEVERITIES.map((severity) => {
          const active = form.severity === severity.id;
          return (
            <TouchableOpacity key={severity.id} onPress={() => setForm((f) => ({ ...f, severity: severity.id }))} style={[styles.severityCard, active && { backgroundColor: severity.dim, borderColor: C.borderSubtle }]}>
              <View style={styles.severityHead}>
                <View style={styles.severityName}>
                  <View style={[styles.bigDot, { backgroundColor: severity.color }]} />
                  <Text style={[styles.severityLabel, active && { color: severity.color }]}>{severity.label}</Text>
                </View>
                <View style={[styles.radio, active && { borderColor: C.borderSubtle, backgroundColor: severity.color }]}>
                  {active ? <Ionicons name="checkmark" size={13} color={C.bgBase} /> : null}
                </View>
              </View>
              <Text style={styles.severityHelp}>{severity.text}</Text>
            </TouchableOpacity>
          );
        })}

        {selected ? (
          <View style={[styles.alertPreview, { backgroundColor: selected.dim }]}>
            <Text style={[styles.previewCaps, { color: selected.color }]}>{selected.label} ALERT PREVIEW</Text>
            <Text style={styles.previewTitle}>{form.type}</Text>
            <Text style={styles.previewMeta}>{form.zone} - K. Nderura</Text>
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Primary label="REVIEW & BROADCAST" icon="bell-alert" color={selected?.color || C.amber} disabled={!selected} onPress={onNext} />
      </View>
    </View>
  );
}

function ConfirmStep({ form, onBroadcast, onBack, uploading }) {
  const selected = SEVERITIES.find((s) => s.id === form.severity) || SEVERITIES[3];
  return (
    <View style={styles.screen}>
      <Header title="REVIEW & CONFIRM" subtitle="Check details before broadcasting" onBack={onBack} />
      <Progress step={2} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.confirmCard, { backgroundColor: selected.dim }]}>
          <View style={styles.severityName}>
            <View style={[styles.bigDot, { backgroundColor: selected.color }]} />
            <Text style={[styles.previewCaps, { color: selected.color }]}>{selected.label} HAZARD</Text>
          </View>
          <Text style={styles.confirmTitle}>{form.type}</Text>
          <View style={styles.grid}>
            <Info label="ZONE" value={form.zone} />
            <Info label="REPORTED BY" value="K. Nderura" />
            <Info label="TIMESTAMP" value="09:41:22" />
          </View>
          <View style={styles.quoteBox}><Text style={styles.quoteText}>{form.desc}</Text></View>
          {form.photo ? <Text style={styles.photoAttached}>1 photo attached</Text> : null}
        </View>

        <View style={styles.notifyBox}>
          <MaterialCommunityIcons name="bell-ring" size={23} color={C.amber} />
          <View>
            <Text style={styles.notifyTitle}>Alert to 14 crew members</Text>
            <Text style={styles.notifyMeta}>DAY SHIFT - ZONE 4B - All personnel</Text>
          </View>
        </View>

        <View style={styles.broadcastWarning}>
          <Text style={styles.broadcastText}>This alert will be immediately broadcast to all active shift members. This action cannot be undone.</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Primary label={uploading ? "UPLOADING ALERT..." : "BROADCAST ALERT NOW"} icon="bell-ring" color={selected.color} onPress={onBroadcast} disabled={uploading} />
        {uploading ? <ActivityIndicator color={selected.color} /> : null}
        <TouchableOpacity style={styles.ghost} onPress={onBack} disabled={uploading}><Text style={styles.ghostText}>BACK TO EDIT</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function Info({ label, value }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function BroadcastStep({ form, onReset }) {
  const selected = SEVERITIES.find((s) => s.id === form.severity) || SEVERITIES[3];
  const [seconds, setSeconds] = useState(0);
  const [acked, setAcked] = useState(2);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    const ackTimer = setInterval(() => setAcked((a) => Math.min(CREW.length, a + 1)), 1400);
    return () => {
      clearInterval(timer);
      clearInterval(ackTimer);
    };
  }, []);

  const pct = Math.round((acked / CREW.length) * 100);
  const elapsed = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <View style={styles.screen}>
      <View style={styles.liveHeader}>
        <View>
          <Text style={[styles.liveHeaderTitle, { color: selected.color }]}>ALERT BROADCAST</Text>
          <Text style={styles.headerSub}>{form.type} - {form.zone}</Text>
        </View>
        <View style={[styles.liveTag, { backgroundColor: selected.dim }]}><View style={[styles.dot, { backgroundColor: selected.color }]} /><Text style={[styles.liveTagText, { color: selected.color }]}>LIVE</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statRow}>
          <Stat value={String(CREW.length)} label="NOTIFIED" color={C.textPrimary} />
          <Stat value={elapsed} label="ELAPSED" color={C.amber} />
          <Stat value={String(acked)} label="ACK'D" color={selected.color} />
        </View>

        <View style={styles.broadcastProgress}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.progressTitle}>{acked} of {CREW.length} acknowledged</Text>
            <Text style={styles.progressSub}>{CREW.length - acked} crew still pending response</Text>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: selected.color }]} /></View>
          </View>
        </View>

        <View style={[styles.liveAlertCard, { backgroundColor: selected.dim }]}>
          <Text style={[styles.severityLabel, { color: selected.color }]}>{selected.label}</Text>
          <Text style={styles.liveAlertText}>{form.type} - {form.zone}</Text>
          <Text style={styles.hazardDesc}>{form.desc}</Text>
        </View>

        <Text style={styles.label}>Crew Acknowledgements</Text>
        {CREW.map((crew, index) => {
          const isAcked = index < acked;
          return (
            <View key={crew.initials} style={[styles.ackCrew, isAcked && { backgroundColor: "rgba(67,160,71,0.04)" }]}>
              <View style={[styles.ackAvatar, isAcked && { borderColor: C.borderSubtle, backgroundColor: C.safeDim }]}>
                <Text style={[styles.ackInitials, isAcked && { color: C.safe }]}>{crew.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ackName}>{crew.name}</Text>
                <Text style={styles.ackRole}>{crew.role}</Text>
              </View>
              {isAcked ? (
                <View style={styles.ackStatus}><Ionicons name="checkmark" size={16} color={C.safe} /><Text style={styles.ackedText}>09:{String(41 + index).padStart(2, "0")}</Text></View>
              ) : (
                <View style={styles.ackStatus}><View style={[styles.dot, { backgroundColor: C.warning }]} /><Text style={styles.pendingText}>PENDING</Text></View>
              )}
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.ghost} onPress={onReset}><Text style={styles.ghostText}>BACK TO DASHBOARD</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function Stat({ value, label, color }) {
  return (
    <View style={styles.liveStat}>
      <Text style={[styles.liveStatValue, { color }]}>{value}</Text>
      <Text style={styles.liveStatLabel}>{label}</Text>
    </View>
  );
}

export default function HazardLogScreen({ navigate, appSettings }) {
  C = getAppColors(appSettings);
  styles = createStyles(C);
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [savedHazardId, setSavedHazardId] = useState(null);
  const [form, setForm] = useState({ type: "", zone: "", desc: "", severity: "", photo: null, attempted: false });

  const reset = () => {
    setStep(0);
    setSavedHazardId(null);
    setForm({ type: "", zone: "", desc: "", severity: "", photo: null, attempted: false });
  };
  const goHome = () => {
    reset();
    navigate?.("dashboard");
  };
  const broadcast = async () => {
    setUploading(true);
    try {
      const hazard = await createHazardAlert({
        type: form.type,
        zone: form.zone,
        severity: form.severity,
        description: form.desc,
        photoUri: form.photo?.uri,
        photoBase64: form.photo?.base64,
        photoContentType: form.photo?.mimeType || "image/jpeg",
      });
      setSavedHazardId(hazard.id);
      setStep(3);
    } catch (error) {
      Alert.alert("Hazard not uploaded", error.message || "Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgBase} />
      {step === 0 && <DetailsStep form={form} setForm={setForm} onNext={() => setStep(1)} onBack={goHome} />}
      {step === 1 && <SeverityStep form={form} setForm={setForm} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
      {step === 2 && <ConfirmStep form={form} onBroadcast={broadcast} onBack={() => setStep(1)} uploading={uploading} />}
      {step === 3 && <BroadcastStep form={{ ...form, savedHazardId }} onReset={goHome} />}
    </SafeAreaView>
  );
}

const createStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bgBase },
  screen: { flex: 1, backgroundColor: C.bgBase },
  header: { minHeight: 62, borderBottomWidth: 1, borderBottomColor: C.borderSubtle, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: C.textPrimary, fontSize: 22, fontWeight: "900" },
  headerSub: { color: C.textSecondary, fontSize: 11, marginTop: 2 },
  progress: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.borderSubtle, flexDirection: "row", justifyContent: "space-between" },
  progressItem: { alignItems: "center", width: 94 },
  stepDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.bgElevated, borderWidth: 2, borderColor: C.borderDefault, alignItems: "center", justifyContent: "center" },
  stepDone: { backgroundColor: C.safe, borderColor: C.borderSubtle },
  stepActive: { backgroundColor: C.amber, borderColor: C.borderSubtle },
  stepNum: { color: C.textDisabled, fontSize: 11, fontWeight: "900" },
  stepLabel: { color: C.textDisabled, fontSize: 9, fontWeight: "900", marginTop: 5 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 190 },
  label: { color: C.textSecondary, fontSize: 10, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10, marginTop: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { height: 36, paddingHorizontal: 13, borderRadius: 6, borderWidth: 1.5, borderColor: C.borderDefault, alignItems: "center", justifyContent: "center" },
  chipText: { color: C.textSecondary, fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  errorText: { color: C.critical, fontSize: 11, marginTop: 6 },
  textArea: { minHeight: 94, backgroundColor: C.bgElevated, borderWidth: 1.5, borderColor: C.borderSubtle, borderRadius: 8, padding: 14, color: C.textPrimary, textAlignVertical: "top", fontSize: 13 },
  charCount: { color: C.textDisabled, fontSize: 10, textAlign: "right", marginTop: 4 },
  inlineSubmit: { minHeight: 46, borderRadius: 8, backgroundColor: C.amber, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 },
  inlineSubmitText: { color: C.bgBase, fontSize: 12, fontWeight: "900" },
  optional: { color: C.textDisabled, textTransform: "none" },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 22 },
  photoPreview: { width: 72, height: 72, borderRadius: 8, backgroundColor: C.bgElevated, borderWidth: 1.5, borderColor: C.borderSubtle, alignItems: "center", justifyContent: "center", position: "relative" },
  photoImage: { width: "100%", height: "100%", borderRadius: 7 },
  removePhoto: { position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: C.critical, alignItems: "center", justifyContent: "center" },
  addPhoto: { height: 72, minWidth: 126, flex: 1, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.borderDefault, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  addPhotoText: { color: C.textSecondary, fontSize: 12, fontWeight: "800" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 92, borderTopWidth: 1, borderTopColor: C.borderSubtle, backgroundColor: C.bgBase, gap: 10 },
  primary: { minHeight: 54, borderRadius: 8, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryText: { color: C.bgBase, fontSize: 13, fontWeight: "900", letterSpacing: 0.7 },
  severityCard: { backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  severityHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  severityName: { flexDirection: "row", alignItems: "center", gap: 10 },
  bigDot: { width: 14, height: 14, borderRadius: 7 },
  severityLabel: { color: C.textPrimary, fontSize: 19, fontWeight: "900" },
  radio: { width: 23, height: 23, borderRadius: 12, borderWidth: 2, borderColor: C.borderDefault, alignItems: "center", justifyContent: "center" },
  severityHelp: { color: C.textSecondary, fontSize: 11, marginTop: 8, marginLeft: 24 },
  alertPreview: { borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 14, padding: 15, shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 13, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  previewCaps: { fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  previewTitle: { color: C.textPrimary, fontSize: 22, fontWeight: "900", marginTop: 8 },
  previewMeta: { color: C.textSecondary, fontSize: 12, marginTop: 4 },
  confirmCard: { borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 14, padding: 18, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 4 },
  confirmTitle: { color: C.textPrimary, fontSize: 26, fontWeight: "900", marginTop: 12, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  infoCell: { width: "50%", marginBottom: 8 },
  infoLabel: { color: C.textDisabled, fontSize: 9, fontWeight: "900" },
  infoValue: { color: C.textSecondary, fontSize: 12, marginTop: 2 },
  quoteBox: { backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 6, padding: 10 },
  quoteText: { color: C.textPrimary, fontSize: 12, lineHeight: 18 },
  photoAttached: { color: C.safe, fontSize: 11, marginTop: 10 },
  notifyBox: { marginTop: 16, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 10, padding: 14, flexDirection: "row", gap: 12 },
  notifyTitle: { color: C.textPrimary, fontSize: 12, fontWeight: "800" },
  notifyMeta: { color: C.textSecondary, fontSize: 11, marginTop: 3 },
  broadcastWarning: { marginTop: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 12, padding: 12 },
  broadcastText: { color: C.textSecondary, fontSize: 11, lineHeight: 17 },
  ghost: { minHeight: 44, borderRadius: 8, borderWidth: 1.5, borderColor: C.borderDefault, alignItems: "center", justifyContent: "center" },
  ghostText: { color: C.textSecondary, fontSize: 13, fontWeight: "800" },
  liveHeader: { minHeight: 64, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.borderSubtle, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  liveHeaderTitle: { fontSize: 22, fontWeight: "900" },
  liveTag: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  liveTagText: { fontSize: 11, fontWeight: "900" },
  statRow: { flexDirection: "row", gap: 10 },
  liveStat: { flex: 1, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 10, padding: 12, alignItems: "center" },
  liveStatValue: { fontSize: 22, fontWeight: "900" },
  liveStatLabel: { color: C.textDisabled, fontSize: 9, fontWeight: "900", marginTop: 5 },
  broadcastProgress: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 20 },
  progressCircle: { width: 82, height: 82, borderRadius: 41, borderWidth: 6, borderColor: C.borderSubtle, alignItems: "center", justifyContent: "center" },
  progressPct: { color: C.textPrimary, fontSize: 17, fontWeight: "900" },
  progressTitle: { color: C.textPrimary, fontSize: 18, fontWeight: "900" },
  progressSub: { color: C.textSecondary, fontSize: 11, marginTop: 4 },
  progressBar: { height: 5, backgroundColor: C.bgElevated, borderRadius: 3, marginTop: 10, overflow: "hidden" },
  progressFill: { height: "100%" },
  liveAlertCard: { marginTop: 16, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 12, padding: 12, shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  liveAlertText: { color: C.textSecondary, fontSize: 12, marginTop: 5 },
  hazardDesc: { color: C.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 8 },
  ackCrew: { minHeight: 58, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 10, paddingHorizontal: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 },
  ackAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bgElevated, borderWidth: 2, borderColor: C.borderDefault, alignItems: "center", justifyContent: "center" },
  ackInitials: { color: C.textPrimary, fontSize: 11, fontWeight: "900" },
  ackName: { color: C.textPrimary, fontSize: 13, fontWeight: "800" },
  ackRole: { color: C.textSecondary, fontSize: 10, marginTop: 2 },
  ackStatus: { flexDirection: "row", alignItems: "center", gap: 5 },
  ackedText: { color: C.safe, fontSize: 10 },
  pendingText: { color: C.warning, fontSize: 10 },
});

let styles = createStyles(C);
