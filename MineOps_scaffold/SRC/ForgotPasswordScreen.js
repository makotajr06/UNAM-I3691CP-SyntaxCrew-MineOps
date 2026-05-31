import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { resetPassword } from "../../services/authService";
import { LocalizedText as Text } from "../../contexts/LocalizationContext";

const C = { black: "#000", panel: "#292727", yellow: "#ffcc18", white: "#f7f1ea", dim: "#595555" };

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    setMessage("");
    setLoading(true);

    try {
      await resetPassword(email);
      setMessage("If that email is registered, Firebase sent a reset link. Check your inbox and spam folder.");
    } catch (err) {
      setMessage(err.message || "Unable to send reset link.");
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
          <Text style={styles.title}>RESET PASSWORD</Text>
          <Text style={styles.copy}>Enter your email and MineOps will send a reset link.</Text>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            onSubmitEditing={handleReset}
            placeholder="yourname@gmail.com"
            placeholderTextColor={C.dim}
            returnKeyType="send"
            style={styles.input}
            textContentType="emailAddress"
          />
          {message ? <Text style={styles.messageText}>{message}</Text> : null}
          <TouchableOpacity style={styles.primary} onPress={handleReset} disabled={loading}>
            {loading ? <ActivityIndicator color={C.black} /> : <Text style={styles.primaryText}>SEND RESET LINK</Text>}
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
  container: { flexGrow: 1, paddingHorizontal: 42, paddingTop: 90, paddingBottom: 150, backgroundColor: C.black },
  backButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 38 },
  backText: { color: C.yellow, fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  brand: { color: C.yellow, fontFamily: "serif", fontSize: 46, fontWeight: "900", textAlign: "center", marginBottom: 74 },
  title: { color: C.white, fontSize: 30, fontWeight: "900", marginBottom: 12 },
  copy: { color: "#cfc7bd", fontFamily: "serif", fontSize: 17, lineHeight: 24, marginBottom: 34 },
  label: { color: C.white, fontFamily: "serif", fontSize: 18, fontWeight: "700", marginBottom: 14 },
  input: { height: 65, borderRadius: 4, backgroundColor: C.panel, color: C.white, paddingHorizontal: 28, fontSize: 18 },
  messageText: { color: "#e7d2a6", fontSize: 13, fontWeight: "700", marginTop: 14 },
  primary: { height: 65, borderRadius: 6, backgroundColor: C.yellow, alignItems: "center", justifyContent: "center", marginTop: 34 },
  primaryText: { color: C.black, fontFamily: "serif", fontSize: 18, fontWeight: "900" },
  linkButton: { alignItems: "center", paddingTop: 28 },
  linkText: { color: "#e7d2a6", fontFamily: "serif", fontSize: 16 },
});
