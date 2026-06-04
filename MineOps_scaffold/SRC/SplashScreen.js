import React from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import MineOpsLogo from "../../components/common/MineOpsLogo";
import { darkTheme, getAppColors } from "../../styles/appTheme";

export default function SplashScreen({ appSettings }) {
  const C = getAppColors(appSettings) || darkTheme;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bgBase }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgBase} />
      <View style={styles.center}>
        <MineOpsLogo colors={C} scale={0.92} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
  },
});
