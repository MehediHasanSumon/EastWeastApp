export default {
  expo: {
    name: "my-expo-app",
    slug: "my-expo-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.eastwestapp"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.yourcompany.eastwestapp",
      permissions: [
        "READ_MEDIA_IMAGES",
        "READ_EXTERNAL_STORAGE", 
        "CAMERA", 
        "AUDIO_RECORDING"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [],
    experiments: {
      tsconfigPaths: true
    },
    extra: {
      // Environment variables
      EXPO_PUBLIC_BACKEND_HOST: process.env.EXPO_PUBLIC_BACKEND_HOST,
      EXPO_PUBLIC_SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL,
      NODE_ENV: process.env.NODE_ENV || "development"
    }
  }
};
