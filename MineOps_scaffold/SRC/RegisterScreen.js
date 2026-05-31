import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { registerUser } from "../../services/authService";
import { LocalizedText as Text } from "../../contexts/LocalizationContext";

const C = { black: "#000", panel: "#292727", yellow: "#ffcc18", white: "#f7f1ea", dim: "#595555" };

export default function RegisterScreen({ navigation, onRegistered }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fields = [
    ["FULL NAME", fullName, setFullName, false],
    ["EMAIL", email, setEmail, false],
    ["PASSWORD", password, setPassword, true],
    ["CONFIRM PASSWORD", confirmPassword, setConfirmPassword, true],
  ];

  const handleRegister = async () => {
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({ fullName, email, password });
      onRegistered?.();
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          <TouchableOpacity onPress={() => navigation?.navigate?.("Login")} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={C.yellow} />
            <Text style={styles.backText}>SIGN IN</Text>
          </TouchableOpacity>
          <Text style={styles.brand}>MINEOPS</Text>
          <Text style={styles.title}>CREATE ACCOUNT</Text>
          {fields.map(([label, value, onChangeText, secure]) => {
            const isEmail = label === "EMAIL";
            const isPassword = Boolean(secure);
            return (
              <View key={label} style={styles.field}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  value={value}
                  onChangeText={onChangeText}
                  autoCapitalize={isEmail || isPassword ? "none" : "words"}
                  autoComplete={isEmail ? "email" : isPassword ? "new-password" : "name"}
                  autoCorrect={false}
                  keyboardType={isEmail ? "email-address" : "default"}
                  onSubmitEditing={label === "CONFIRM PASSWORD" ? handleRegister : undefined}
                  returnKeyType={label === "CONFIRM PASSWORD" ? "done" : "next"}
                  secureTextEntry={secure}
                  placeholder={isEmail ? "yourname@gmail.com" : ""}
                  placeholderTextColor={C.dim}
                  style={styles.input}
                  textContentType={isEmail ? "emailAddress" : isPassword ? "newPassword" : "name"}
                />
              </View>
            );
          })}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity style={styles.primary} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={C.black} /> : <Text style={styles.primaryText}>CREATE ACCOUNT</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation?.navigate?.("Login")} style={styles.linkButton}>
            <Text style={styles.linkText}>back to sign in</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  keyboard: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 36, paddingTop: 64, paddingBottom: 150, backgroundColor: C.black },
  backButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 34 },
  backText: { color: C.yellow, fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  brand: { color: C.yellow, fontFamily: "serif", fontSize: 42, fontWeight: "900", textAlign: "center", marginBottom: 48 },
  title: { color: C.white, fontSize: 28, fontWeight: "900", marginBottom: 30 },
  field: { marginBottom: 20 },
  label: { color: C.white, fontFamily: "serif", fontSize: 16, fontWeight: "700", marginBottom: 10 },
  input: { height: 58, borderRadius: 5, backgroundColor: C.panel, color: C.white, paddingHorizontal: 20, fontSize: 17 },
  errorText: { color: "#ff9b8f", fontSize: 13, fontWeight: "700", marginTop: 2, marginBottom: 10 },
  primary: { height: 62, borderRadius: 6, backgroundColor: C.yellow, alignItems: "center", justifyContent: "center", marginTop: 20 },
  primaryText: { color: C.black, fontFamily: "serif", fontSize: 18, fontWeight: "900" },
  linkButton: { alignItems: "center", paddingTop: 24 },
  linkText: { color: "#e7d2a6", fontFamily: "serif", fontSize: 16 },
});
