import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Modal,
  TextInput,
  Button,
  Alert,
  Share,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Switch,
} from "react-native";
import * as Notifications from "expo-notifications";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth"; // 👈 thêm import đăng xuất
import BackgroundWrapper from "../components/BackgroundWrapper";

export default function SettingsScreen({ navigation }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") {
      setIsEnabled(true);
    }
  };

  const toggleSwitch = async () => {
    if (!isEnabled) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        setIsEnabled(true);
        Alert.alert("Thông báo", "✅ Đã bật thông báo thành công!");
  
        // 👉 Gửi thử một thông báo local
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🔔 Thông báo đã bật!",
            body: "Bạn sẽ bắt đầu nhận thông báo từ ứng dụng.",
            sound: true,
          },
          trigger: null, // Hiển thị ngay lập tức
        });
      } else {
        Alert.alert("Thông báo", "⚠️ Bạn chưa cấp quyền thông báo.");
      }
    } else {
      setIsEnabled(false);
      Alert.alert("Thông báo", "❌ Đã tắt thông báo!");
    }
  };
  

  const shareApp = async () => {
    try {
      await Share.share({
        message: "Hãy thử ứng dụng tuyệt vời này! 📱 https://yourapp.link",
      });
    } catch (error) {
      Alert.alert("Lỗi chia sẻ", error.message);
    }
  };

  const rateUs = () => {
    const storeLink =
      Platform.OS === "ios"
        ? "itms-apps://itunes.apple.com/app/idYOUR_APP_ID"
        : "market://details?id=YOUR_PACKAGE_NAME";
    Linking.openURL(storeLink);
  };

  const sendFeedback = async () => {
    if (!email || !feedback) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      await addDoc(collection(db, "feedbacks"), {
        email,
        message: feedback,
        createdAt: serverTimestamp(),
      });
      Alert.alert("Cảm ơn bạn!", "Phản hồi của bạn đã được gửi đến admin.");
      setEmail("");
      setFeedback("");
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi phản hồi. Vui lòng thử lại!");
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL("https://touchzing.com/privacy/");
  };

  // 🚪 Đăng xuất khỏi Firebase
  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      Alert.alert("Đăng xuất", "Bạn đã đăng xuất thành công!");
      // 👇 nếu có màn hình login, điều hướng về đó
      navigation.replace("Login"); 
    } catch (error) {
      Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại!");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <BackgroundWrapper>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar
            barStyle="light-content"
            translucent
            backgroundColor="transparent"
          />
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.header}>Settings</Text>

            <View style={styles.item}>
              <Text style={styles.text}>🔔 Thông báo</Text>
              <Switch
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
                onValueChange={toggleSwitch}
                value={isEnabled}
              />
            </View>

            <TouchableOpacity style={styles.item} onPress={shareApp}>
              <Text style={styles.text}>📩 Chia sẻ ứng dụng</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.item} onPress={rateUs}>
              <Text style={styles.text}>⭐ Đánh giá chúng tôi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.item}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.text}>💬 Nhận xét</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.item} onPress={openPrivacyPolicy}>
              <Text style={styles.text}>🛡️ Chính sách bảo mật</Text>
            </TouchableOpacity>

            {/* 🚪 Nút đăng xuất */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>🚪 Đăng xuất</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </BackgroundWrapper>

      {/* 📨 Modal nhận xét */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Gửi nhận xét</Text>

            <TextInput
              style={styles.input}
              placeholder="Nhập email của bạn"
              placeholderTextColor="#999"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Nhập nhận xét của bạn"
              placeholderTextColor="#999"
              multiline
              value={feedback}
              onChangeText={setFeedback}
            />

            <View style={styles.modalButtons}>
              <Button title="Hủy" color="grey" onPress={() => setModalVisible(false)} />
              <Button title="Gửi" onPress={sendFeedback} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingHorizontal: 20 },
  scrollContainer: { flexGrow: 1, paddingTop: 20, paddingBottom: 40 },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 25,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomColor: "rgba(255,255,255,0.3)",
    borderBottomWidth: 1,
  },
  text: { color: "white", fontSize: 18 },
  logoutButton: {
    marginTop: 30,
    backgroundColor: "#ff4d4d",
    paddingVertical: 15,
    borderRadius: 10,
  },
  logoutText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 20,
  },
  modalContent: { backgroundColor: "white", borderRadius: 10, padding: 20 },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    padding: 10,
    color: "black",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
});
