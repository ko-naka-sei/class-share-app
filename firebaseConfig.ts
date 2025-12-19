import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native'; // ★ ここでOS判定をインポート

const firebaseConfig = {
  apiKey: "AIzaSyAIixoZPImlu3MtL7zHm_9rkssceHYzqUw",
  authDomain: "class-share-app.firebaseapp.com",
  projectId: "class-share-app",
  storageBucket: "class-share-app.firebasestorage.app",
  messagingSenderId: "1363142310",
  appId: "1:1363142310:web:466c3c0434cb10907ef667",
  measurementId: "G-LQGMYZY21D"
};

// アプリの初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ★ ここが重要：Webとスマホで認証の初期化方法を変える
let auth;

if (Platform.OS === 'web') {
  // Web (Vercel) の場合：標準の getAuth を使う
  auth = getAuth(app);
} else {
  // iOS / Android の場合：AsyncStorage を使う
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { auth, db };
