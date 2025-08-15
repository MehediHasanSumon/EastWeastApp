// components/BackButton.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

export default function BackButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={styles.backButton}
    >
      <MaterialIcons name="arrow-back" size={24} color="#1877f2" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginRight: 10,
    padding: 6,
  },
});
