import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { RootStackParamList } from "../types/types";

type Props = NativeStackScreenProps<RootStackParamList, "ImageViewer">;

const ImageViewerScreen = ({ navigation, route }: Props) => {
  const { uri } = route.params;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="close" size={28} color="white" />
      </TouchableOpacity>

      <Image source={{ uri }} style={styles.image} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});

export default ImageViewerScreen;
