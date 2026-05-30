import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { loginUser } from "../../services/authService";
import { LocalizedText as Text } from "../../contexts/LocalizationContext";
import { darkTheme, getAppColors } from "../../styles/appTheme";

const defaultLoginColors = {
  black: "#000000",
  panel: "#292727",
  input: "#292727",
  yellow: "#ffcc18",
  white: "#f7f1ea",
  muted: "#605d5d",
  line: "#171717",
};

const loginColorsFromTheme = (themeColors = darkTheme) => ({
  ...defaultLoginColors,
  black: themeColors.bgBase,
  panel: themeColors.bgSurface,
  input: themeColors.bgElevated,
  yellow: themeColors.amber,
  white: themeColors.textPrimary,
  muted: themeColors.textSecondary,
  line: themeColors.borderSubtle,
  placeholder: themeColors.textDisabled,
  link: themeColors.amber,
  error: themeColors.critical,
  buttonText: "#0D0F0F",
  isLight: themeColors === getAppColors({ theme: "Light" }),
});

export default function LoginScreen({ navigation, onSignIn, appSettings }) {
  const C = loginColorsFromTheme(getAppColors(appSettings));
  const styles = createStyles(C);
  const [secure, setSecure] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      await loginUser({ email, password });
      onSignIn?.();
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={C.isLight ? "dark-content" : "light-content"} backgroundColor={C.black} />
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>MINEOPS</Text>
            <Text style={styles.tagline}>precision in the pit. safety in the cloud</Text>
            <View style={styles.brandRule} />
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="yourname@gmail.com"
              placeholderTextColor={C.placeholder}
              returnKeyType="next"
              style={styles.input}
              textContentType="emailAddress"
            />

            <Text style={[styles.label, styles.passwordLabel]}>PASSWORD</Text>
            <View style={styles.passwordBox}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                onSubmitEditing={handleSignIn}
                secureTextEntry={secure}
                placeholder="..........."
                placeholderTextColor={C.placeholder}
                returnKeyType="done"
                style={[styles.input, styles.passwordInput]}
                textContentType="password"
              />
              <TouchableOpacity onPress={() => setSecure((value) => !value)} style={styles.eyeButton}>
                <Ionicons name={secure ? "eye-off" : "eye"} size={22} color={C.white} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => navigation?.navigate?.("ForgotPassword")}
            >
              <Text style={styles.forgotText}>forgot password?</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={C.buttonText} />
              ) : (
                <>
                  <MaterialCommunityIcons name="login" size={21} color={C.buttonText} />
                  <Text style={styles.signInText}>SIGN IN</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation?.navigate?.("Register")}
            >
              <Text style={styles.createText}>create account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  keyboard: { flex: 1 },
  container: {
    flexGrow: 1,
    backgroundColor: C.black,
    paddingHorizontal: 42,
    paddingBottom: 150,
  },
  brandBlock: { alignItems: "center", marginTop: 130, marginBottom: 58 },
  brand: {
    color: C.yellow,
    fontSize: 48,
    fontFamily: "serif",
    fontWeight: "900",
    letterSpacing: 1,
  },
  tagline: {
    color: C.white,
    fontFamily: "serif",
    fontSize: 16,
    marginTop: 8,
  },
  brandRule: {
    width: 96,
    height: 4,
    backgroundColor: C.yellow,
    marginTop: 38,
  },
  form: { width: "100%" },
  label: {
    color: C.white,
    fontFamily: "serif",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 18,
  },
  passwordLabel: { marginTop: 25 },
  input: {
    height: 65,
    borderRadius: 4,
    backgroundColor: C.input,
    color: C.white,
    paddingHorizontal: 40,
    fontSize: 18,
    fontWeight: "700",
  },
  passwordBox: { position: "relative" },
  passwordInput: { paddingRight: 84 },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 14,
    width: 48,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeText: { color: C.white, fontSize: 13, fontWeight: "900" },
  forgotButton: { alignSelf: "flex-end", paddingVertical: 17 },
  forgotText: { color: C.link, fontFamily: "serif", fontSize: 16 },
  errorText: { color: C.error, fontSize: 13, fontWeight: "700", marginTop: 4 },
  signInButton: {
    height: 65,
    borderRadius: 5,
    backgroundColor: C.yellow,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 29,
  },
  signInText: {
    color: C.buttonText,
    fontFamily: "serif",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 38,
    paddingHorizontal: 14,
  },
  orLine: { flex: 1, height: 1, backgroundColor: C.line },
  orText: {
    color: C.muted,
    fontFamily: "serif",
    fontSize: 18,
    fontWeight: "900",
    marginHorizontal: 34,
  },
  createButton: {
    height: 65,
    borderRadius: 4,
    backgroundColor: C.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  createText: { color: C.white, fontFamily: "serif", fontSize: 18 },
});
