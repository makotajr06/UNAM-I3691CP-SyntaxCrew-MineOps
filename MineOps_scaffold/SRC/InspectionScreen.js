import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { acknowledgeInspectionReport, createInspectionReport, watchInspectionReports } from "../../services/inspectionService";
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

const ZONES = ["Zone 1A", "Zone 1B", "Zone 2A", "Zone 2B", "Zone 4B", "Zone 5C", "Tunnel A", "Tunnel B"];
const CHECKLIST = [
  { id: 1, text: "Ground stability checked" },
  { id: 2, text: "Ventilation operational" },
  { id: 3, text: "Equipment pre-shift inspection done" },
  { id: 4, text: "PPE compliance verified" },
  { id: 5, text: "Emergency exits clear" },
  { id: 6, text: "Blast zone markers in place" },
  { id: 7, text: "Water drainage clear" },
];
const REPORTS = [
  { id: 1, zone: "Zone 4B", date: "Mon 11 May", inspector: "K. Nderura", pass: 7, fail: 0, photos: 3, status: "pass" },
  { id: 2, zone: "Zone 2A", date: "Mon 11 May", inspector: "S. Sheefeni", pass: 5, fail: 2, photos: 2, status: "fail" },
  { id: 3, zone: "Zone 1C", date: "Sun 10 May", inspector: "J. Kambonde", pass: 6, fail: 1, photos: 1, status: "fail" },
  { id: 4, zone: "Zone 1A", date: "Sun 10 May", inspector: "L. Shimutwikeni", pass: 7, fail: 0, photos: 4, status: "pass" },
  { id: 5, zone: "Zone 5C", date: "Sat 9 May", inspector: "A. Ebba", pass: 7, fail: 0, photos: 2, status: "pass" },
  { id: 6, zone: "Zone 2B", date: "Sat 9 May", inspector: "G. Gerson", pass: 4, fail: 3, photos: 0, status: "fail" },
];

function Header({ title, subtitle, onBack, right }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={C.textSecondary} />
        </TouchableOpacity>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSub}>{subtitle}</Text>
      </View>
      {right}
    </View>
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

function Ghost({ label, onPress, icon }) {
  return (
    <TouchableOpacity style={styles.ghost} onPress={onPress}>
      {icon ? <MaterialCommunityIcons name={icon} size={18} color={C.textSecondary} /> : null}
      <Text style={styles.ghostText}>{label}</Text>
    </TouchableOpacity>
  );
}

function normalizeReport(report) {
  return {
    ...report,
    pass: report.passCount ?? report.pass ?? 0,
    fail: report.failCount ?? report.fail ?? 0,
    photos: (report.photoUrls || []).length || report.photos || 0,
    inspector: report.inspectorName || report.inspector || "MineOps user",
    date: report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : report.date || "Today",
  };
}

function ReportModal({ report, onClose, onAcknowledge }) {
  if (!report) return null;
  const item = normalizeReport(report);
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalShade} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>INSPECTION REPORT</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={C.textSecondary} /></TouchableOpacity>
          </View>
          <Text style={styles.zoneText}>{item.zone}</Text>
          <Text style={styles.reportMeta}>{item.date} - {item.inspector}</Text>
          <View style={styles.expandedStats}>
            <View style={styles.expandedStat}><Text style={[styles.expandedValue, { color: C.safe }]}>{item.pass}</Text><Text style={styles.expandedLabel}>PASSED</Text></View>
            <View style={styles.expandedStat}><Text style={[styles.expandedValue, { color: item.fail ? C.critical : C.textDisabled }]}>{item.fail}</Text><Text style={styles.expandedLabel}>FAILED</Text></View>
            <View style={styles.expandedStat}><Text style={styles.expandedValue}>{item.photos}</Text><Text style={styles.expandedLabel}>PHOTOS</Text></View>
          </View>
          {item.findings ? <Text style={styles.reviewText}>{item.findings}</Text> : null}
          <TouchableOpacity style={styles.viewFull} onPress={() => onAcknowledge(report)}>
            <Ionicons name="checkmark-circle" size={18} color={C.amber} />
            <Text style={styles.viewFullText}>{item.acknowledged ? "ACKNOWLEDGED" : "ACKNOWLEDGE REPORT"}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function ReportsList({ reports, onNew }) {
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const sourceReports = reports.length ? reports.map(normalizeReport) : REPORTS;
  const filtered = filter === "PASS ONLY" ? sourceReports.filter((r) => r.status === "pass") : filter === "ISSUES" ? sourceReports.filter((r) => r.status === "fail") : filter === "THIS WEEK" ? sourceReports.slice(0, 4) : sourceReports;
  const handleAcknowledge = async (report) => {
    if (typeof report.id !== "string") {
      setSelectedReport(null);
      Alert.alert("Report acknowledged", "This sample report has been acknowledged locally.");
      return;
    }

    try {
      await acknowledgeInspectionReport(report.id);
      setSelectedReport(null);
      Alert.alert("Report acknowledged", "Your acknowledgement has been recorded.");
    } catch (error) {
      Alert.alert("Acknowledgement failed", error.message || "Check your connection and try again.");
    }
  };

  return (
    <View style={styles.screen}>
      <Header
        title="INSPECTION REPORTS"
        subtitle={`${sourceReports.length} total - ${sourceReports.filter((r) => r.status === "fail").length} with issues`}
        right={
          <TouchableOpacity style={styles.newButton} onPress={onNew}>
            <Ionicons name="add" size={17} color={C.amber} />
            <Text style={styles.newButtonText}>NEW</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.listContent}>
        <View style={styles.summaryStrip}>
          {[
            [sourceReports.length, "TOTAL", C.textPrimary],
            [sourceReports.filter((r) => r.status === "pass").length, "PASS", C.safe],
            [sourceReports.filter((r) => r.status === "fail").length, "ISSUES", C.critical],
            [sourceReports.reduce((a, r) => a + r.photos, 0), "PHOTOS", C.textSecondary],
          ].map(([value, label, color]) => (
            <View key={label} style={styles.summaryStat}>
              <Text style={[styles.summaryValue, { color }]}>{value}</Text>
              <Text style={styles.summaryLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {["ALL", "PASS ONLY", "ISSUES", "THIS WEEK"].map((item) => (
            <TouchableOpacity key={item} onPress={() => setFilter(item)} style={[styles.filterChip, filter === item && styles.filterActive]}>
              <Text style={[styles.filterText, filter === item && { color: C.amber }]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map((report) => {
          const open = expanded === report.id;
          const ok = report.status === "pass";
          const color = ok ? C.safe : C.critical;
          const pass = report.passCount ?? report.pass ?? 0;
          const fail = report.failCount ?? report.fail ?? 0;
          const pct = Math.round((pass / Math.max(1, pass + fail)) * 100);
          return (
            <TouchableOpacity key={report.id} activeOpacity={0.8} onPress={() => setExpanded(open ? null : report.id)} style={[styles.reportCard, open && styles.reportCardOpen]}>
              <View style={styles.reportTop}>
                <View>
                  <View style={styles.zoneRow}>
                    <Text style={styles.zoneText}>{report.zone}</Text>
                    <View style={[styles.statusPill, { backgroundColor: `${color}22` }]}><Text style={[styles.statusText, { color }]}>{ok ? "ALL PASS" : "ISSUES FOUND"}</Text></View>
                  </View>
                  <Text style={styles.reportMeta}>{report.date || "Live"} - {report.inspectorName || report.inspector || "Inspector"}</Text>
                </View>
                <View style={styles.reportRight}>
                  {(report.photoUrls?.length || report.photos || 0) > 0 ? (
                    <View style={styles.photoCount}><Ionicons name="camera" size={13} color={C.textDisabled} /><Text style={styles.photoCountText}>{report.photoUrls?.length || report.photos}</Text></View>
                  ) : null}
                  <Ionicons name={open ? "chevron-down" : "chevron-forward"} size={18} color={C.textDisabled} />
                </View>
              </View>
              <View style={styles.reportProgressRow}>
                <View style={styles.reportTrack}><View style={[styles.reportFill, { width: `${pct}%`, backgroundColor: color }]} /></View>
                <Text style={styles.itemsText}>{pass}/{pass + fail} items</Text>
              </View>
              {open ? (
                <View style={styles.expanded}>
                  <View style={styles.expandedStats}>
                    {[
                      ["PASSED", report.pass, C.safe],
                      ["FAILED", report.fail, report.fail > 0 ? C.critical : C.textDisabled],
                      ["PHOTOS", report.photos, C.textSecondary],
                    ].map(([label, value, statColor]) => (
                      <View key={label} style={styles.expandedStat}>
                        <Text style={[styles.expandedValue, { color: statColor }]}>{value}</Text>
                        <Text style={styles.expandedLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.resultLabel}>CHECKLIST RESULT</Text>
                  <View style={styles.checkPreview}>
                    {Array.from({ length: report.pass + report.fail }).map((_, index) => {
                      const pass = index < report.pass;
                      return (
                        <View key={index} style={[styles.resultBox, { backgroundColor: pass ? C.safeDim : C.criticalDim }]}>
                          <Ionicons name={pass ? "checkmark" : "close"} size={12} color={pass ? C.safe : C.critical} />
                        </View>
                      );
                    })}
                  </View>
                  <TouchableOpacity style={styles.viewFull} onPress={() => setSelectedReport(report)}><Ionicons name="eye" size={16} color={C.amber} /><Text style={styles.viewFullText}>VIEW FULL</Text></TouchableOpacity>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} onAcknowledge={handleAcknowledge} />
    </View>
  );
}

async function pickInspectionPhoto(source, setPhotos) {
  const permission = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Permission needed", `Allow ${source === "camera" ? "camera" : "gallery"} access to attach inspection evidence.`);
    return;
  }
  const result = source === "camera"
    ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.72 })
    : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.72 });
  if (!result.canceled && result.assets?.[0]?.uri) {
    setPhotos((items) => [...items, { id: `${Date.now()}`, uri: result.assets[0].uri }].slice(0, 5));
  }
}

function CreateReport({ onBack, onSubmit, submitting }) {
  const [selectedZone, setSelectedZone] = useState("");
  const [checks, setChecks] = useState(CHECKLIST.map((item) => ({ ...item, status: null })));
  const [photos, setPhotos] = useState([]);
  const [findings, setFindings] = useState("");
  const setStatus = (id, status) => setChecks((items) => items.map((item) => (item.id === id ? { ...item, status: item.status === status ? null : status } : item)));
  const passCount = checks.filter((item) => item.status === "pass").length;
  const failCount = checks.filter((item) => item.status === "fail").length;
  const naCount = checks.filter((item) => item.status === "na").length;
  const complete = Boolean(selectedZone) && checks.every((item) => item.status);

  return (
    <View style={styles.screen}>
      <Header
        title="DAILY INSPECTION"
        subtitle="MON 11 MAY 2026"
        onBack={onBack}
        right={<View style={styles.progressMini}><Text style={styles.progressMiniLabel}>PROGRESS</Text><Text style={styles.progressMiniValue}>{passCount + failCount + naCount}/{CHECKLIST.length}</Text></View>}
      />
      <ScrollView contentContainerStyle={styles.createContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.formLabel}>Inspection Zone *</Text>
        <View style={styles.zoneGrid}>
          {ZONES.map((zone) => {
            const selected = selectedZone === zone;
            return (
              <TouchableOpacity key={zone} style={[styles.zoneChip, selected && styles.zoneChipActive]} onPress={() => setSelectedZone(zone)}>
                <Text style={[styles.zoneChipText, selected && { color: C.amber }]}>{zone}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.checkHeader}>
          <Text style={styles.formLabel}>Inspection Checklist</Text>
          <View style={styles.checkCounts}>
            <Text style={[styles.countText, { color: C.safe }]}>{passCount} PASS</Text>
            <Text style={[styles.countText, { color: C.critical }]}>{failCount} FAIL</Text>
            <Text style={[styles.countText, { color: C.textDisabled }]}>{naCount} N/A</Text>
          </View>
        </View>
        <View style={styles.multiTrack}>
          <View style={[styles.multiFill, { width: `${(passCount / CHECKLIST.length) * 100}%`, backgroundColor: C.safe }]} />
          <View style={[styles.multiFill, { width: `${(failCount / CHECKLIST.length) * 100}%`, backgroundColor: C.critical }]} />
          <View style={[styles.multiFill, { width: `${(naCount / CHECKLIST.length) * 100}%`, backgroundColor: C.borderDefault }]} />
        </View>

        {checks.map((item) => (
          <View key={item.id} style={[styles.checkItem, item.status === "pass" && { backgroundColor: "rgba(67,160,71,0.06)" }, item.status === "fail" && { backgroundColor: "rgba(229,57,53,0.06)" }]}>
            <View style={styles.checkItemTop}>
              <View style={[styles.checkBox, item.status === "pass" && { borderColor: C.borderSubtle, backgroundColor: C.safeDim }, item.status === "fail" && { borderColor: C.borderSubtle, backgroundColor: C.criticalDim }]}>
                {item.status === "pass" ? <Ionicons name="checkmark" size={12} color={C.safe} /> : null}
                {item.status === "fail" ? <Ionicons name="close" size={12} color={C.critical} /> : null}
                {item.status === "na" ? <View style={styles.naMark} /> : null}
              </View>
              <Text style={[styles.checkText, item.status === "na" && { color: C.textDisabled }]}>{item.text}</Text>
            </View>
            <View style={styles.statusButtons}>
              {[
                ["pass", "PASS", C.safe, C.safeDim],
                ["fail", "FAIL", C.critical, C.criticalDim],
                ["na", "N/A", C.textSecondary, C.bgElevated],
              ].map(([status, label, color, dim]) => {
                const active = item.status === status;
                return (
                  <TouchableOpacity key={status} onPress={() => setStatus(item.id, status)} style={[styles.statusButton, active && { borderColor: C.borderSubtle, backgroundColor: dim }]}>
                    <Text style={[styles.statusButtonText, active && { color }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.photoHeader}>
          <Text style={styles.formLabel}>Photo Evidence <Text style={{ color: C.textDisabled }}>optional</Text></Text>
          <Text style={styles.photoLimit}>{photos.length}/5</Text>
        </View>
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoTile}>
              {photo.uri ? <Image source={{ uri: photo.uri }} style={styles.photoImage} /> : <Ionicons name="image" size={28} color={C.safe} />}
              <TouchableOpacity style={styles.removePhoto} onPress={() => setPhotos((items) => items.filter((p) => p.id !== photo.id))}>
                <Ionicons name="close" size={11} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 5 ? (
            <TouchableOpacity style={styles.addPhotoTile} onPress={() => pickInspectionPhoto("camera", setPhotos)}>
              <Ionicons name="camera" size={24} color={C.textSecondary} />
              <Text style={styles.addPhotoText}>CAMERA</Text>
            </TouchableOpacity>
          ) : null}
          {photos.length < 5 ? (
            <TouchableOpacity style={styles.addPhotoTile} onPress={() => pickInspectionPhoto("gallery", setPhotos)}>
              <Ionicons name="image" size={24} color={C.textSecondary} />
              <Text style={styles.addPhotoText}>GALLERY</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.formLabel}>Findings & Notes</Text>
        <TextInput
          value={findings}
          onChangeText={setFindings}
          placeholder="Document anomalies, observations, or follow-up actions required..."
          placeholderTextColor={C.textDisabled}
          multiline
          maxLength={500}
          style={styles.findings}
        />
        <View style={styles.findingsFooter}>
          <Text style={[styles.followupText, failCount > 0 && { color: C.warning }]}>{failCount > 0 ? `${failCount} failed item${failCount > 1 ? "s" : ""} require follow-up` : ""}</Text>
          <Text style={styles.charCount}>{findings.length}/500</Text>
        </View>

        <Text style={styles.formLabel}>Inspector</Text>
        <View style={styles.inspector}>
          <View style={styles.inspectorAvatar}><Text style={styles.inspectorInitials}>KN</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inspectorName}>Katare Nderura</Text>
            <Text style={styles.inspectorRole}>Site Supervisor</Text>
          </View>
          <View style={styles.verifiedPill}><View style={styles.verifiedDot} /><Text style={styles.verifiedText}>VERIFIED</Text></View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        {!complete ? (
          <View style={styles.incompleteBox}>
            <Text style={styles.incompleteText}>{!selectedZone ? "Select a zone to continue" : `${CHECKLIST.length - (passCount + failCount + naCount)} item${CHECKLIST.length - (passCount + failCount + naCount) !== 1 ? "s" : ""} remaining`}</Text>
          </View>
        ) : null}
        <Primary
          label={complete ? "SUBMIT INSPECTION REPORT" : "COMPLETE ALL ITEMS TO SUBMIT"}
          icon="file-send"
          disabled={!complete || submitting}
          color={failCount > 0 ? C.critical : C.safe}
          onPress={() => complete && !submitting && onSubmit({ selectedZone, checks, findings, photos, passCount, failCount })}
        />
        {submitting ? <ActivityIndicator color={failCount > 0 ? C.critical : C.safe} /> : null}
        <Ghost label="SAVE AS DRAFT" icon="content-save-outline" onPress={() => {}} />
      </View>
    </View>
  );
}

function SubmitSuccess({ result, onBack }) {
  const hasIssues = result.failCount > 0;
  const color = hasIssues ? C.critical : C.safe;
  return (
    <View style={styles.screen}>
      <Header title="REPORT SUBMITTED" subtitle="Saved to Firestore" onBack={onBack} />
      <View style={styles.successBody}>
        <View style={[styles.successIcon, { backgroundColor: hasIssues ? C.criticalDim : C.safeDim, borderColor: C.borderSubtle }]}>
          <MaterialCommunityIcons name="file-document-check" size={44} color={color} />
        </View>
        <Text style={styles.successTitle}>REPORT FILED</Text>
        <Text style={styles.successSub}>{result.selectedZone} - Mon 11 May 2026 - 09:41</Text>
        <View style={styles.successCard}>
          <Info label="ZONE" value={result.selectedZone} />
          <Info label="PASSED" value={`${result.passCount} items`} color={C.safe} />
          <Info label="FAILED" value={`${result.failCount} items`} color={result.failCount > 0 ? C.critical : C.textPrimary} />
          <Info label="PHOTOS ATTACHED" value={`${result.photos}`} />
          <Info label="INSPECTOR" value="K. Nderura - Site Supervisor" />
          <Info label="FIREBASE REF" value="inspections/rpt_20260511_01" color={C.info} />
        </View>
        {hasIssues ? (
          <View style={styles.issueNotice}>
            <MaterialCommunityIcons name="alert" size={20} color={C.warning} />
            <Text style={styles.issueNoticeText}>{result.failCount} failed item{result.failCount !== 1 ? "s" : ""} flagged for follow-up. Supervisor has been notified.</Text>
          </View>
        ) : null}
        <Primary label="BACK TO REPORTS" icon="format-list-bulleted" color={color} onPress={onBack} />
      </View>
    </View>
  );
}

function Info({ label, value, color }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, color && { color }]}>{value}</Text>
    </View>
  );
}

export default function InspectionScreen({ appSettings }) {
  C = getAppColors(appSettings);
  styles = createStyles(C);
  const [view, setView] = useState("list");
  const [result, setResult] = useState(null);
  const [reports, setReports] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const unsubscribe = watchInspectionReports(setReports);
    return unsubscribe;
  }, []);
  const submitReport = async ({ selectedZone, checks, findings, photos, passCount, failCount }) => {
    setSubmitting(true);
    try {
      const saved = await createInspectionReport({ zone: selectedZone, checks, findings, photos });
      setReports((items) => [{ ...saved, checks, findings, status: failCount > 0 ? "fail" : "pass" }, ...items]);
      setResult({ selectedZone, passCount, failCount, photos: photos.length, id: saved.id });
      setView("success");
    } catch (error) {
      Alert.alert("Report not uploaded", error.message || "Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgBase} />
      {view === "list" ? <ReportsList reports={reports} onNew={() => setView("create")} /> : null}
      {view === "create" ? <CreateReport onBack={() => setView("list")} submitting={submitting} onSubmit={submitReport} /> : null}
      {view === "success" && result ? <SubmitSuccess result={result} onBack={() => setView("list")} /> : null}
    </SafeAreaView>
  );
}

const createStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bgBase },
  screen: { flex: 1, backgroundColor: C.bgBase },
  header: { minHeight: 62, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.borderSubtle, flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  headerTitle: { color: C.textPrimary, fontSize: 24, fontWeight: "900" },
  headerSub: { color: C.textSecondary, fontSize: 11, marginTop: 3 },
  newButton: { height: 38, paddingHorizontal: 14, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: C.borderSubtle, flexDirection: "row", alignItems: "center", gap: 6 },
  newButtonText: { color: C.amber, fontSize: 11, fontWeight: "900" },
  listContent: { paddingBottom: 118 },
  summaryStrip: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  summaryStat: { flex: 1, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 8, padding: 10 },
  summaryValue: { fontSize: 20, fontWeight: "900" },
  summaryLabel: { color: C.textDisabled, fontSize: 9, fontWeight: "900", marginTop: 4 },
  filters: { gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  filterChip: { height: 32, borderRadius: 6, borderWidth: 1.5, borderColor: C.borderDefault, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  filterActive: { borderColor: C.borderSubtle, backgroundColor: "rgba(255,255,255,0.055)" },
  filterText: { color: C.textSecondary, fontSize: 10, fontWeight: "900" },
  reportCard: { marginHorizontal: 20, marginBottom: 10, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.17, shadowRadius: 13, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  reportCardOpen: { backgroundColor: "rgba(255,255,255,0.045)" },
  reportTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  zoneRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  zoneText: { color: C.textPrimary, fontSize: 20, fontWeight: "900" },
  statusPill: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 9, fontWeight: "900" },
  reportMeta: { color: C.textSecondary, fontSize: 11, marginTop: 5 },
  reportRight: { alignItems: "flex-end", gap: 6 },
  photoCount: { flexDirection: "row", alignItems: "center", gap: 4 },
  photoCountText: { color: C.textDisabled, fontSize: 10 },
  reportProgressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  reportTrack: { flex: 1, height: 5, backgroundColor: C.bgElevated, borderRadius: 3, overflow: "hidden" },
  reportFill: { height: "100%" },
  itemsText: { color: C.textDisabled, fontSize: 10 },
  expanded: { borderTopWidth: 1, borderTopColor: C.borderSubtle, marginTop: 14, paddingTop: 14 },
  expandedStats: { flexDirection: "row", gap: 10, marginBottom: 14 },
  expandedStat: { flex: 1, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 8, padding: 10, alignItems: "center" },
  expandedValue: { fontSize: 22, fontWeight: "900" },
  expandedLabel: { color: C.textDisabled, fontSize: 9, fontWeight: "900", marginTop: 5 },
  resultLabel: { color: C.textDisabled, fontSize: 9, fontWeight: "900", marginBottom: 8 },
  checkPreview: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 12 },
  resultBox: { width: 23, height: 23, borderRadius: 5, borderWidth: 1, borderColor: C.borderSubtle, alignItems: "center", justifyContent: "center" },
  viewFull: { flex: 1, minHeight: 44, borderRadius: 9, borderWidth: 1, borderColor: C.borderSubtle, backgroundColor: "rgba(255,255,255,0.045)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 },
  viewFullText: { color: C.amber, fontSize: 12, fontWeight: "900" },
  createContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 212 },
  formLabel: { color: C.textSecondary, fontSize: 10, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10, marginTop: 12 },
  zoneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  zoneChip: { width: "48%", height: 42, borderRadius: 8, borderWidth: 1.5, borderColor: C.borderDefault, alignItems: "center", justifyContent: "center" },
  zoneChipActive: { borderColor: C.borderSubtle, backgroundColor: "rgba(255,255,255,0.055)" },
  zoneChipText: { color: C.textSecondary, fontSize: 12, fontWeight: "800" },
  checkHeader: { marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  checkCounts: { flexDirection: "row", gap: 9 },
  countText: { fontSize: 10, fontWeight: "800" },
  multiTrack: { height: 5, borderRadius: 3, backgroundColor: C.bgElevated, overflow: "hidden", flexDirection: "row", marginBottom: 12 },
  multiFill: { height: "100%" },
  checkItem: { backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 12, padding: 12, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  checkItemTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  checkBox: { width: 21, height: 21, borderRadius: 5, borderWidth: 2, borderColor: C.borderDefault, alignItems: "center", justifyContent: "center" },
  naMark: { width: 8, height: 2, borderRadius: 1, backgroundColor: C.textDisabled },
  checkText: { color: C.textPrimary, fontSize: 12, flex: 1 },
  statusButtons: { flexDirection: "row", gap: 6 },
  statusButton: { height: 30, paddingHorizontal: 14, borderRadius: 5, borderWidth: 1.5, borderColor: C.borderDefault, alignItems: "center", justifyContent: "center" },
  statusButtonText: { color: C.textDisabled, fontSize: 10, fontWeight: "900" },
  photoHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  photoLimit: { color: C.textDisabled, fontSize: 10 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoTile: { width: 82, height: 82, borderRadius: 10, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.borderSubtle, alignItems: "center", justifyContent: "center", position: "relative" },
  photoImage: { width: "100%", height: "100%", borderRadius: 9 },
  removePhoto: { position: "absolute", top: -7, right: -7, width: 20, height: 20, borderRadius: 10, backgroundColor: C.critical, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.bgBase },
  addPhotoTile: { width: 82, height: 82, borderRadius: 10, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.borderDefault, alignItems: "center", justifyContent: "center", gap: 5 },
  addPhotoText: { color: C.textDisabled, fontSize: 9, fontWeight: "900" },
  findings: { minHeight: 90, borderRadius: 8, borderWidth: 1.5, borderColor: C.borderSubtle, backgroundColor: C.bgElevated, color: C.textPrimary, padding: 14, textAlignVertical: "top", fontSize: 12 },
  findingsFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  followupText: { color: C.textDisabled, fontSize: 10 },
  charCount: { color: C.textDisabled, fontSize: 10 },
  inspector: { backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 10, padding: 13, flexDirection: "row", alignItems: "center", gap: 12 },
  inspectorAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.amberDim, borderWidth: 1, borderColor: C.borderSubtle, alignItems: "center", justifyContent: "center" },
  inspectorInitials: { color: C.amber, fontSize: 13, fontWeight: "900" },
  inspectorName: { color: C.textPrimary, fontSize: 14, fontWeight: "800" },
  inspectorRole: { color: C.amber, fontSize: 11, marginTop: 2 },
  verifiedPill: { backgroundColor: C.safeDim, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 5 },
  verifiedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.safe },
  verifiedText: { color: C.safe, fontSize: 9, fontWeight: "900" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 92, borderTopWidth: 1, borderTopColor: C.borderSubtle, backgroundColor: C.bgBase, gap: 10 },
  incompleteBox: { backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 8, padding: 8, alignItems: "center" },
  incompleteText: { color: C.textDisabled, fontSize: 11 },
  primary: { minHeight: 54, borderRadius: 8, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryText: { color: C.bgBase, fontSize: 13, fontWeight: "900", letterSpacing: 0.6 },
  ghost: { flex: 1, minHeight: 44, borderRadius: 9, borderWidth: 1, borderColor: C.borderDefault, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 },
  ghostText: { color: C.textSecondary, fontSize: 12, fontWeight: "800" },
  successBody: { flex: 1, padding: 28, alignItems: "center", justifyContent: "center" },
  successIcon: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successTitle: { color: C.textPrimary, fontSize: 30, fontWeight: "900" },
  successSub: { color: C.textSecondary, fontSize: 12, textAlign: "center", marginTop: 6, marginBottom: 20 },
  successCard: { width: "100%", backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 14, padding: 16, marginBottom: 18 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 11 },
  infoLabel: { color: C.textDisabled, fontSize: 10, fontWeight: "900" },
  infoValue: { color: C.textPrimary, fontSize: 11, textAlign: "right", flex: 1 },
  issueNotice: { width: "100%", borderRadius: 12, borderWidth: 1, borderColor: C.borderSubtle, backgroundColor: C.warningDim, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  issueNoticeText: { color: C.textSecondary, fontSize: 11, lineHeight: 17, flex: 1 },
  progressMini: { alignItems: "flex-end" },
  progressMiniLabel: { color: C.textDisabled, fontSize: 9, fontWeight: "900" },
  progressMiniValue: { color: C.amber, fontSize: 12, marginTop: 2 },
  modalShade: { flex: 1, backgroundColor: "rgba(13,15,15,0.88)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.bgSurface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, paddingBottom: 34, borderWidth: 1, borderColor: C.borderSubtle },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: C.borderDefault, alignSelf: "center", marginBottom: 18 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sheetTitle: { color: C.textPrimary, fontSize: 21, fontWeight: "900" },
  reviewText: { color: C.textSecondary, fontSize: 12, lineHeight: 19, backgroundColor: C.bgElevated, borderRadius: 8, padding: 12, marginBottom: 14 },
});

let styles = createStyles(C);
