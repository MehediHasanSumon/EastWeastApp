import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Member, RootStackParamList } from "../types/types";

type Props = NativeStackScreenProps<RootStackParamList, "ForwardScreen">;

const dummyReceivers: Member[] = [
  { id: "u1", name: "Alice", avatar: "", status: "online" },
  { id: "u2", name: "Bob", avatar: "", status: "offline" },
  { id: "u3", name: "Charlie", avatar: "", status: "online" },
];

const ForwardScreen = ({ route, navigation }: Props) => {
  const { message } = route.params;

  const handleForward = (receiver: Member) => {
    Alert.alert("✅ Message Forwarded", `To: ${receiver.name}`);
    navigation.goBack(); // or navigate to receiver's chat
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forward Message To:</Text>
      <FlatList
        data={dummyReceivers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userCard}
            onPress={() => handleForward(item)}
          >
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </TouchableOpacity>
        )}
      />
      <View style={styles.previewBox}>
        <Text style={styles.previewTitle}>Message:</Text>
        <Text style={styles.previewText}>{message.text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 20 },
  userCard: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
  },
  userName: { fontSize: 16, fontWeight: "500" },
  status: { fontSize: 12, color: "#888" },
  previewBox: {
    marginTop: 30,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#f0f2f5",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  previewTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  previewText: { fontSize: 14, color: "#333" },
});

export default ForwardScreen;
