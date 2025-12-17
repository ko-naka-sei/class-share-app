import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// ↓ getAuth だけでなく、この2つを追加インポート
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
// ↓ 手順1で入れた保存用ライブラリをインポート
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAIixoZPImlu3MtL7zHm_9rkssceHYzqUw",
  authDomain: "class-share-app.firebaseapp.com",
  projectId: "class-share-app",
  storageBucket: "class-share-app.firebasestorage.app",
  messagingSenderId: "1363142310",
  appId: "1:1363142310:web:466c3c0434cb10907ef667",
  measurementId: "G-LQGMYZY21D"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ★ここが変更点！
// ただの getAuth(app) だと、アプリを閉じるとログアウトしてしまうことがあります。
// こう書くことで「スマホの中にログイン情報を保存してね」と明示します。
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { auth, db };

