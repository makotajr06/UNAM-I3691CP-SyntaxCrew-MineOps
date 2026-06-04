import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  changeCurrentUserPassword,
  defaultUserSettings,
  getCurrentUserProfile,
  logoutUser,
  updateUserProfile,
  updateUserSettings,
  watchCurrentUserProfile,
  watchCurrentUserSettings,
} from "../../services/authService";
import { saveShiftReminder } from "../../services/alertService";
import { uploadProfileImage } from "../../services/storageService";
import { LocalizedText as Text } from "../../contexts/LocalizationContext";
import { darkTheme, getAppColors, themeOptions } from "../../styles/appTheme";

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
  safe: "#43A047",
  info: "#1E88E5",
  textPrimary: "#F0EDE8",
  textSecondary: "#9EA8A8",
  textDisabled: "#4A5252",
  borderSubtle: "#272D2D",
  borderDefault: "#374040",
};

const initialSettings = defaultUserSettings;

const defaultProfile = {
  displayName: "Katare Nderura",
  email: "k.nderura@miningco.com",
  initials: "KN",
  jobTitle: "Site Supervisor",
  phone: "+264 81 816 1664",
  photoURL: "",
  site: "Skorpion Mine - Site A",
  siteSupervisor: "Katare Nderura",
};

const SUPERVISORS = [
  { label: "Tomas Niinkoti", sub: "Skorpion Mine - Site A" },
  { label: "Eliaser Katondoka", sub: "Skorpion Mine - Site A" },
  { label: "Gehas Imene", sub: "Skorpion Mine - Site B" },
  { label: "Shatika Titus", sub: "Zone 4B Operations" },
  { label: "Katare Nderura", sub: "Skorpion Mine - Site A" },
  { label: "Hangula Gerson", sub: "Tunnel Operations" },
];

function SectionHeader({ label, icon }) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon} size={16} color={C.amber} />
      <Text style={styles.sectionHeaderText}>{label}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function SettingRow({ icon, label, sub, value, onToggle, rightText, onPress, danger, last }) {
  const interactive = Boolean(onPress || onToggle);
  const rowPress = onPress || (onToggle ? () => onToggle(!value) : undefined);
  return (
    <TouchableOpacity activeOpacity={interactive ? 0.75 : 1} onPress={rowPress} style={[styles.settingRow, last && styles.lastRow]}>
      <View style={[styles.settingIcon, danger && styles.dangerIcon]}>
        <MaterialCommunityIcons name={icon} size={19} color={danger ? C.critical : C.amber} />
      </View>
      <View style={styles.settingTextWrap}>
        <Text style={[styles.settingLabel, danger && { color: C.critical }]}>{label}</Text>
        {sub ? <Text style={styles.settingSub}>{sub}</Text> : null}
      </View>
      {typeof value === "boolean" ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: C.bgElevated, true: C.amber }}
          thumbColor={value ? C.bgBase : C.textDisabled}
        />
      ) : (
        <View style={styles.rightWrap}>
          {rightText ? <Text style={styles.valueText}>{rightText}</Text> : null}
          {interactive ? <Ionicons name="chevron-forward" size={18} color={danger ? C.critical : C.textDisabled} /> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

function OptionSheet({ title, options, selected, onSelect, onClose }) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalShade} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={C.textSecondary} /></TouchableOpacity>
          </View>
          {options.map((option) => {
            const active = selected === option.label;
            return (
              <TouchableOpacity
                key={option.label}
                style={[styles.optionRow, active && styles.optionRowActive]}
                onPress={() => onSelect(option.label)}
              >
                <View>
                  <Text style={[styles.optionLabel, active && { color: C.amber }]}>{option.label}</Text>
                  {option.sub ? <Text style={styles.optionSub}>{option.sub}</Text> : null}
                </View>
                {active ? <Ionicons name="checkmark-circle" size={22} color={C.amber} /> : <View style={styles.emptyCircle} />}
              </TouchableOpacity>
            );
          })}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function PasswordSheet({ onClose }) {
  const [secure, setSecure] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const savePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Password mismatch", "New password and confirmation must match.");
      return;
    }

    setSaving(true);
    try {
      await changeCurrentUserPassword({ currentPassword, newPassword });
      Alert.alert("Password updated", "Your password has been changed.");
      onClose();
    } catch (error) {
      Alert.alert("Password not updated", error.message || "Check your current password and try again.");
    } finally {
      setSaving(false);
    }
  };
  const fields = [
    { label: "Current Password", value: currentPassword, onChangeText: setCurrentPassword },
    { label: "New Password", value: newPassword, onChangeText: setNewPassword },
    { label: "Confirm New Password", value: confirmPassword, onChangeText: setConfirmPassword },
  ];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalShade} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>CHANGE PASSWORD</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={C.textSecondary} /></TouchableOpacity>
          </View>
          {fields.map((field) => (
            <View key={field.label} style={styles.passwordField}>
              <Text style={styles.inputLabel}>{field.label.toUpperCase()}</Text>
              <View style={styles.passwordInputWrap}>
                <TextInput
                  value={field.value}
                  onChangeText={field.onChangeText}
                  secureTextEntry={secure}
                  placeholder="Password"
                  placeholderTextColor={C.textDisabled}
                  style={styles.passwordInput}
                />
                <TouchableOpacity onPress={() => setSecure((s) => !s)}>
                  <Ionicons name={secure ? "eye-off" : "eye"} size={22} color={C.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]} onPress={savePassword} disabled={saving}>
            <MaterialCommunityIcons name="shield-key" size={20} color={C.bgBase} />
            <Text style={styles.saveButtonText}>{saving ? "UPDATING..." : "UPDATE PASSWORD"}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

async function pickProfilePhoto(source, setProfile, setSavingPhoto) {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert("Permission needed", `Allow ${source === "camera" ? "camera" : "photo library"} access to update your profile picture.`);
    return;
  }

  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.45, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.45, base64: true });

  if (result.canceled || !result.assets?.[0]?.uri) return;

  setSavingPhoto(true);
  try {
    const session = await getCurrentUserProfile();
    if (!session?.authUser?.uid) throw new Error("You must be signed in to upload a profile picture.");
    const asset = result.assets[0];
    const photoURL = await uploadProfileImage({
      uid: session.authUser.uid,
      uri: asset.uri,
      contentType: asset.mimeType || "image/jpeg",
      base64: asset.base64,
    });
    await updateUserProfile({ photoURL });
    setProfile((profile) => ({ ...profile, photoURL }));
  } catch (error) {
    Alert.alert("Profile photo not updated", error.message || "Check your connection and try again.");
  } finally {
    setSavingPhoto(false);
  }
}

function ProfileSheet({ profile, savingPhoto, onCamera, onGallery, onClose }) {
  const [draft, setDraft] = useState({
    displayName: profile.displayName || "",
    jobTitle: profile.jobTitle || "",
    phone: profile.phone || "",
    site: profile.site || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateUserProfile(draft);
      Alert.alert("Profile updated", "Your profile changes are now live.");
      onClose();
    } catch (error) {
      Alert.alert("Profile not updated", error.message || "Check your connection and try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalShade} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>PROFILE</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={C.textSecondary} /></TouchableOpacity>
          </View>
          <View style={styles.profileSheetHead}>
            <View style={styles.largeAvatar}>
              {profile.photoURL ? <Image source={{ uri: profile.photoURL }} style={styles.avatarImage} /> : <Text style={styles.largeAvatarText}>{profile.initials || "MO"}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{profile.displayName}</Text>
              <Text style={styles.profileRole}>{profile.jobTitle || profile.role || "MineOps User"}</Text>
              <Text style={styles.profileMeta}>{profile.email}</Text>
            </View>
          </View>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoAction} onPress={onCamera} disabled={savingPhoto}>
              <Ionicons name="camera" size={20} color={C.bgBase} />
              <Text style={styles.photoActionText}>CAPTURE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoActionSecondary} onPress={onGallery} disabled={savingPhoto}>
              <Ionicons name="image" size={20} color={C.amber} />
              <Text style={styles.photoActionSecondaryText}>GALLERY</Text>
            </TouchableOpacity>
          </View>
          {savingPhoto ? <ActivityIndicator color={C.amber} style={{ marginTop: 12 }} /> : null}
          <View style={styles.profileFields}>
            {[
              { key: "displayName", label: "Full Name" },
              { key: "jobTitle", label: "Job Title" },
              { key: "phone", label: "Phone" },
              { key: "site", label: "Site" },
            ].map((field) => (
              <View key={field.key} style={styles.passwordField}>
                <Text style={styles.inputLabel}>{field.label.toUpperCase()}</Text>
                <View style={styles.passwordInputWrap}>
                  <TextInput
                    value={draft[field.key]}
                    onChangeText={(value) => updateDraft(field.key, value)}
                    placeholder={field.label}
                    placeholderTextColor={C.textDisabled}
                    style={styles.passwordInput}
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity style={[styles.saveButton, savingProfile && styles.disabledButton]} onPress={saveProfile} disabled={savingProfile}>
              <MaterialCommunityIcons name="content-save" size={20} color={C.bgBase} />
              <Text style={styles.saveButtonText}>{savingProfile ? "SAVING..." : "SAVE PROFILE"}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function SettingsScreen({ navigate, appSettings }) {
  C = getAppColors(appSettings);
  styles = createStyles(C);
  const [settings, setSettings] = useState(initialSettings);
  const [profile, setProfile] = useState(defaultProfile);
  const [sheet, setSheet] = useState(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savingSettings, setSavingSettings] = useState({});
  const [signedOut, setSignedOut] = useState(false);
  const saveSetting = async (updates) => {
    const keys = Object.keys(updates);
    setSettings((prev) => ({ ...prev, ...updates }));
    setSavingSettings((prev) => ({ ...prev, ...Object.fromEntries(keys.map((key) => [key, true])) }));
    try {
      await updateUserSettings(updates);
      if ("shiftReminders" in updates || "shiftReminderLeadTime" in updates) {
        await saveShiftReminder({
          enabled: updates.shiftReminders ?? settings.shiftReminders,
          leadTime: updates.shiftReminderLeadTime || settings.shiftReminderLeadTime,
        });
      }
    } catch (error) {
      Alert.alert("Setting not saved", error.message || "Check your connection and try again.");
    } finally {
      setSavingSettings((prev) => ({ ...prev, ...Object.fromEntries(keys.map((key) => [key, false])) }));
    }
  };
  const toggle = (key) => saveSetting({ [key]: !settings[key] });
  useEffect(() => {
    const unsubscribeProfile = watchCurrentUserProfile((session) => {
      if (!session) return;
      setProfile((current) => ({
        ...current,
        ...(session.profile || {}),
        displayName: session.profile?.displayName || session.authUser.displayName || current.displayName,
        email: session.profile?.email || session.authUser.email || current.email,
        photoURL: session.profile?.photoURL || session.authUser.photoURL || "",
      }));
    });
    const unsubscribeSettings = watchCurrentUserSettings((savedSettings) => {
      if (savedSettings) setSettings((current) => ({ ...current, ...savedSettings }));
    });

    return () => {
      unsubscribeProfile();
      unsubscribeSettings();
    };
  }, []);
  const handleSignOut = async () => {
    await logoutUser();
    setSignedOut(true);
  };
  const changeSupervisor = async (siteSupervisor) => {
    const supervisor = SUPERVISORS.find((item) => item.label === siteSupervisor);
    const site = supervisor?.sub || profile.site;
    setProfile((current) => ({ ...current, siteSupervisor, site }));
    setSheet(null);
    try {
      await updateUserProfile({ siteSupervisor, site });
    } catch (error) {
      Alert.alert("Supervisor not updated", error.message || "Check your connection and try again.");
    }
  };
  const selectOption = (key, value) => {
    setSheet(null);
    saveSetting({ [key]: value });
  };

  if (signedOut) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.signedOut}>
          <View style={styles.signedOutIcon}><MaterialCommunityIcons name="logout" size={40} color={C.amber} /></View>
          <Text style={styles.signedOutTitle}>SIGNED OUT</Text>
          <Text style={styles.signedOutSub}>Stay safe on the ground.</Text>
          <TouchableOpacity style={styles.saveButton} onPress={() => navigate?.("login")}>
            <Text style={styles.saveButtonText}>RETURN TO LOGIN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgBase} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>SETTINGS</Text>
            <Text style={styles.subtitle}>MineOps v1.0.0</Text>
          </View>
          <View style={styles.headerIcon}><MaterialCommunityIcons name="cog" size={22} color={C.amber} /></View>
        </View>

        <TouchableOpacity style={styles.profileCard} onPress={() => setSheet("profile")}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {profile.photoURL ? <Image source={{ uri: profile.photoURL }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{profile.initials || "MO"}</Text>}
            </View>
            <View style={styles.onlineDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile.displayName}</Text>
            <Text style={styles.profileRole}>{profile.jobTitle || profile.role || "MineOps User"}</Text>
            <Text style={styles.profileMeta}>{profile.site}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.amber} />
        </TouchableOpacity>

        <SectionHeader label="Profile" icon="account-hard-hat" />
        <View style={styles.group}>
          <SettingRow icon="camera-account" label="Profile Picture" sub="Capture a new photo or choose from gallery" onPress={() => setSheet("profile")} />
          <SettingRow icon="account-tie-hat" label="Site Supervisor" sub="Supervisor linked to your shift and site" rightText={profile.siteSupervisor} onPress={() => setSheet("supervisor")} last />
        </View>

        <SectionHeader label="Notifications" icon="bell-outline" />
        <View style={styles.group}>
          <SettingRow icon="alert-octagon" label="Hazard Alerts" sub={savingSettings.hazardAlerts ? "Saving..." : "Critical and high severity broadcasts"} value={settings.hazardAlerts} onToggle={() => toggle("hazardAlerts")} />
          <SettingRow icon="clock-alert" label="Shift Reminders" sub={savingSettings.shiftReminders ? "Saving..." : "30 min before shift start and end"} value={settings.shiftReminders} onToggle={() => toggle("shiftReminders")} />
          <SettingRow icon="calendar-clock" label="Reminder Time" sub={savingSettings.shiftReminderLeadTime ? "Saving..." : "When shift reminders should fire"} rightText={settings.shiftReminderLeadTime} onPress={() => setSheet("shiftReminderLeadTime")} last />
        </View>

        <SectionHeader label="Connectivity" icon="access-point-network" />
        <View style={styles.group}>
          <SettingRow icon="wifi-off" label="Offline Mode" sub={savingSettings.offlineMode ? "Saving..." : "Cached sessions can sign in with no signal after one online login"} value={settings.offlineMode} onToggle={() => toggle("offlineMode")} last />
        </View>

        <SectionHeader label="Appearance" icon="theme-light-dark" />
        <View style={styles.group}>
          <SettingRow icon="palette" label="Theme" sub={savingSettings.theme ? "Saving..." : "App colour scheme"} rightText={settings.theme} onPress={() => setSheet("theme")} />
          <SettingRow icon="translate" label="Language" sub={savingSettings.language ? "Saving..." : "Interface display language"} rightText={settings.language} onPress={() => setSheet("language")} last />
        </View>

        <SectionHeader label="Security" icon="shield-check" />
        <View style={styles.group}>
          <SettingRow icon="key-change" label="Change Password" sub="Last changed 30 days ago" onPress={() => setSheet("password")} />
          <SettingRow icon="cellphone-link" label="Active Sessions" sub="2 devices logged in" rightText="2" onPress={() => setSheet("sessions")} last />
        </View>

        <SectionHeader label="About" icon="information-outline" />
        <View style={styles.group}>
          <SettingRow icon="file-document-outline" label="Release Notes" sub="What's new in v1.0.0" onPress={() => setSheet("release")} />
          <SettingRow icon="shield-lock-outline" label="Privacy Policy" sub="Data handling and safety compliance" onPress={() => setSheet("privacy")} />
          <SettingRow icon="cellphone-cog" label="App Version" sub="Build 2026.05.01" rightText="v1.0.0" last />
        </View>

        <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut}>
          <View style={[styles.settingIcon, styles.dangerIcon]}><MaterialCommunityIcons name="logout" size={19} color={C.critical} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: C.critical }]}>Sign Out</Text>
            <Text style={styles.settingSub}>{profile.displayName} - {profile.site}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.critical} />
        </TouchableOpacity>

        <Text style={styles.footerText}>MineOps - SYNTAX CREW</Text>
      </ScrollView>

      {sheet === "theme" && (
        <OptionSheet
          title="SELECT THEME"
          selected={settings.theme}
          onClose={() => setSheet(null)}
          onSelect={(theme) => selectOption("theme", theme)}
          options={themeOptions}
        />
      )}
      {sheet === "language" && (
        <OptionSheet
          title="SELECT LANGUAGE"
          selected={settings.language}
          onClose={() => setSheet(null)}
          onSelect={(language) => selectOption("language", language)}
          options={["English", "Afrikaans", "Oshiwambo", "German", "Portuguese"].map((label) => ({ label }))}
        />
      )}
      {sheet === "shiftReminderLeadTime" && (
        <OptionSheet
          title="SHIFT REMINDER TIME"
          selected={settings.shiftReminderLeadTime}
          onClose={() => setSheet(null)}
          onSelect={(shiftReminderLeadTime) => selectOption("shiftReminderLeadTime", shiftReminderLeadTime)}
          options={[
            { label: "15 minutes before", sub: "Short warning before shift starts and ends" },
            { label: "30 minutes before", sub: "Default reminder window" },
            { label: "1 hour before", sub: "Earlier reminder for travel and briefing" },
          ]}
        />
      )}
      {sheet === "password" && <PasswordSheet onClose={() => setSheet(null)} />}
      {sheet === "profile" && (
        <ProfileSheet
          profile={profile}
          savingPhoto={savingPhoto}
          onCamera={() => pickProfilePhoto("camera", setProfile, setSavingPhoto)}
          onGallery={() => pickProfilePhoto("gallery", setProfile, setSavingPhoto)}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === "supervisor" && (
        <OptionSheet
          title="CHANGE SITE SUPERVISOR"
          selected={profile.siteSupervisor}
          onClose={() => setSheet(null)}
          onSelect={changeSupervisor}
          options={SUPERVISORS}
        />
      )}
      {["sessions", "release", "privacy"].includes(sheet) && (
        <OptionSheet
          title={sheet === "sessions" ? "ACTIVE SESSIONS" : sheet === "privacy" ? "PRIVACY POLICY" : "RELEASE NOTES"}
          selected=""
          onClose={() => setSheet(null)}
          onSelect={() => {}}
          options={
            sheet === "sessions"
              ? [
                  { label: "Android - Current session", sub: "Skorpion Mine, Namibia" },
                  { label: "Android - Last seen 2 hours ago", sub: "Rosh Pinah, Namibia" },
                ]
              : sheet === "privacy"
              ? [
                  { label: "Profile Data", sub: "Name, role, site, supervisor, and profile photo are stored in your user profile." },
                  { label: "Hazard Evidence", sub: "Hazard photos are stored securely and linked to reported hazards." },
                  { label: "Location Safety", sub: "GPS settings control safety proximity and hazard-zone features." },
                ]
              : [
                  { label: "Real-time Hazard Alerts", sub: "Broadcast high risk events to shift crew" },
                  { label: "Offline-First Sync", sub: "Local cache for deep pit environments" },
                  { label: "Shift Handover System", sub: "Digital carryover for hazards and tasks" },
                ]
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bgBase },
  container: { paddingHorizontal: 20, paddingBottom: 112, backgroundColor: C.bgBase },
  header: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.borderSubtle, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: C.textPrimary, fontSize: 28, fontWeight: "900" },
  subtitle: { color: C.textSecondary, fontSize: 12, marginTop: 4 },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.amberDim, borderWidth: 1, borderColor: C.borderSubtle, alignItems: "center", justifyContent: "center" },
  profileCard: { marginTop: 16, backgroundColor: C.bgSurface, borderRadius: 14, borderWidth: 1, borderColor: C.borderSubtle, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  avatarWrap: { position: "relative" },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.amber, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: "100%", height: "100%", borderRadius: 999 },
  avatarText: { color: C.bgBase, fontSize: 20, fontWeight: "900" },
  onlineDot: { position: "absolute", right: 0, bottom: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: C.safe, borderWidth: 2, borderColor: C.bgBase },
  profileName: { color: C.textPrimary, fontSize: 20, fontWeight: "900" },
  profileRole: { color: C.amber, fontSize: 11, fontWeight: "800", marginTop: 3 },
  profileMeta: { color: C.textSecondary, fontSize: 11, marginTop: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 22, marginBottom: 8 },
  sectionHeaderText: { color: C.amber, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.borderSubtle },
  group: { backgroundColor: C.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: C.borderSubtle, overflow: "hidden" },
  settingRow: { minHeight: 64, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: C.borderSubtle },
  lastRow: { borderBottomWidth: 0 },
  settingIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.amberDim, borderWidth: 1, borderColor: C.borderSubtle, alignItems: "center", justifyContent: "center" },
  dangerIcon: { backgroundColor: C.criticalDim, borderColor: C.borderSubtle },
  settingTextWrap: { flex: 1 },
  settingLabel: { color: C.textPrimary, fontSize: 14, fontWeight: "800" },
  settingSub: { color: C.textSecondary, fontSize: 10, marginTop: 3 },
  rightWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  valueText: { color: C.textSecondary, fontSize: 12, fontWeight: "700" },
  signOutRow: { marginTop: 20, backgroundColor: C.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: C.borderSubtle, minHeight: 64, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 12 },
  footerText: { color: C.textDisabled, textAlign: "center", fontSize: 10, lineHeight: 18, marginTop: 22 },
  modalShade: { flex: 1, backgroundColor: "rgba(13,15,15,0.9)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.bgSurface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, borderWidth: 1, borderColor: C.borderSubtle },
  sheetHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: C.borderDefault, alignSelf: "center", marginBottom: 14 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sheetTitle: { color: C.textPrimary, fontSize: 21, fontWeight: "900" },
  profileSheetHead: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  largeAvatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: C.amber, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  largeAvatarText: { color: C.bgBase, fontSize: 25, fontWeight: "900" },
  photoActions: { flexDirection: "row", gap: 10 },
  photoAction: { flex: 1, height: 48, borderRadius: 9, backgroundColor: C.amber, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  photoActionText: { color: C.bgBase, fontSize: 12, fontWeight: "900" },
  photoActionSecondary: { flex: 1, height: 48, borderRadius: 9, borderWidth: 1, borderColor: C.borderSubtle, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  photoActionSecondaryText: { color: C.amber, fontSize: 12, fontWeight: "900" },
  profileFields: { marginTop: 18 },
  optionRow: { minHeight: 62, borderRadius: 10, backgroundColor: C.bgElevated, borderWidth: 1.5, borderColor: C.borderDefault, paddingHorizontal: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionRowActive: { borderColor: C.borderSubtle, backgroundColor: "rgba(255,255,255,0.055)" },
  optionLabel: { color: C.textPrimary, fontSize: 14, fontWeight: "800" },
  optionSub: { color: C.textSecondary, fontSize: 11, marginTop: 3 },
  emptyCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.borderDefault },
  passwordField: { marginBottom: 14 },
  inputLabel: { color: C.textDisabled, fontSize: 10, fontWeight: "900", marginBottom: 7 },
  passwordInputWrap: { height: 50, borderRadius: 8, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.borderDefault, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
  passwordInput: { flex: 1, color: C.textPrimary, fontSize: 14 },
  saveButton: { height: 52, borderRadius: 9, backgroundColor: C.amber, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 8 },
  disabledButton: { opacity: 0.65 },
  saveButtonText: { color: C.bgBase, fontSize: 14, fontWeight: "900" },
  signedOut: { flex: 1, padding: 32, alignItems: "center", justifyContent: "center" },
  signedOutIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.amberDim, borderWidth: 1, borderColor: C.borderSubtle, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  signedOutTitle: { color: C.textPrimary, fontSize: 28, fontWeight: "900" },
  signedOutSub: { color: C.textSecondary, fontSize: 12, marginTop: 6, marginBottom: 20 },
});

let styles = createStyles(C);
