import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BBS Mobile</Text>
      <Text style={styles.subtitle}>モバイルアプリケーション</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#10b981",
  },
  subtitle: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
});

