import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { registerForPushNotificationsAsync } from "./notificationsConfig";

// --- Màn hình
import AdminDashboard from "./screens/AdminDashboard";
import ContactScreen from "./screens/ContactScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import HomeScreen from "./screens/HomeScreen";
import LifeTarotScreen from "./screens/LifeTarotScreen";
import LoginScreen from "./screens/LoginScreen";
import ReaderHome from "./screens/ReaderHome";
import RegisterChoiceScreen from "./screens/RegisterChoiceScreen";
import RegisterReaderScreen from "./screens/RegisterReaderScreen";
import RegisterScreen from "./screens/RegisterScreen";
import RegisterUserScreen from "./screens/RegisterUserScreen";
import SettingsScreen from "./screens/SettingsScreen";
import TarotResultScreen from "./screens/TarotResultScreen";
import TarotScreen from "./screens/TarotScreen";
import TarotChatScreen from "./screens/TarotChatScreen";

// --- Màn hình thông báo
import NotificationsUserScreen from "./screens/NotificationsUserScreen";
import NotificationsReaderScreen from "./screens/NotificationsReaderScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ===================================================
// 🏠 Stack chính cho User
// ===================================================
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home_Main" component={HomeScreen} />
      <Stack.Screen name="Tarot" component={TarotScreen} />
      <Stack.Screen name="TarotResult" component={TarotResultScreen} />
      <Stack.Screen name="LifeTarot" component={LifeTarotScreen} />
    </Stack.Navigator>
  );
}

// ===================================================
// ⚙️ Tab Navigator (User)
// ===================================================
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#FFD700",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopColor: "#FFD700",
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "HomeTabs")
            iconName = focused ? "home" : "home-outline";
          else if (route.name === "Contact")
            iconName = focused ? "people" : "people-outline";
          else if (route.name === "Settings")
            iconName = focused ? "settings" : "settings-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTabs"
        component={HomeStack}
        options={{ title: "Trang chủ" }}
      />
      <Tab.Screen
        name="Contact"
        component={ContactScreen}
        options={{ title: "Liên hệ" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Cài đặt" }}
      />
    </Tab.Navigator>
  );
}

// ===================================================
// 🔮 Stack riêng cho Reader
// ===================================================
function ReaderStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReaderHome" component={ReaderHome} />
      <Stack.Screen
        name="NotificationsReader"
        component={NotificationsReaderScreen}
      />
    </Stack.Navigator>
  );
}

// ===================================================
// 🚀 APP CHÍNH
// ===================================================
export default function App() {
  const navigationRef = useNavigationContainerRef();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // 🔹 Cấu hình hành vi hiển thị thông báo
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        // ❌ shouldShowAlert (cũ)
        shouldShowBanner: true, // ✅ Hiển thị banner (popup trên màn hình)
        shouldShowList: true,   // ✅ Hiển thị trong danh sách thông báo
        shouldPlaySound: true,  // 🔔 Phát âm thanh
        shouldSetBadge: false,  // Không cập nhật badge
      }),
    });
    

    // ===================================================
    // 🔹 Khi người dùng đăng nhập → đăng ký token & lưu vào Firestore
    // ===================================================
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            // Kiểm tra user có phải Reader không
            let collectionName = "users";
            const readerSnap = await getDoc(doc(db, "readers", user.uid));
            if (readerSnap.exists()) {
              collectionName = "readers";
            }

            // Lưu token vào Firestore
            await setDoc(
              doc(db, collectionName, user.uid),
              { expoPushToken: token },
              { merge: true }
            );

            console.log(`✅ Token đã lưu trong ${collectionName}:`, token);
          }
        } catch (error) {
          console.error("❌ Lỗi khi lưu token:", error);
        }
      }
    });

    // ===================================================
    // 🔹 Nhận thông báo khi app đang mở
    // ===================================================
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📬 Nhận thông báo khi foreground:", notification.request.content);
      });

    // ===================================================
    // 🔹 Khi người dùng bấm vào thông báo
    // ===================================================
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const screen = response.notification.request.content.data?.screen;
        if (screen && navigationRef.isReady()) {
          console.log("📩 Người dùng bấm thông báo, điều hướng tới:", screen);
          navigationRef.navigate(screen);
        }
      });

    // ===================================================
    // 🔹 Dọn dẹp listener khi thoát app
    // ===================================================
    return () => {
      unsubscribeAuth();
      notificationListener.current?.remove();
      responseListener.current?.remove();

    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Admin */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />

        {/* Reader Stack */}
        <Stack.Screen name="ReaderStack" component={ReaderStack} />

        {/* Notifications */}
        <Stack.Screen name="NotificationsUser" component={NotificationsUserScreen} />

        {/* Register */}
        <Stack.Screen name="RegisterChoice" component={RegisterChoiceScreen} />
        <Stack.Screen name="RegisterUser" component={RegisterUserScreen} />
        <Stack.Screen name="RegisterReader" component={RegisterReaderScreen} />

        {/* Main Tabs */}
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        {/* AI Chat Bot */}
        <Stack.Screen name="TarotChat" component={TarotChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
