import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// Web用の普通の認証機能をインポート
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSy...", // ★ここも同じAPIキーを貼ってください
  authDomain: "class-share-app.firebaseapp.com",
  projectId: "class-share-app",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Web用の認証設定（ブラウザが勝手に管理してくれるのでシンプル）
const auth = getAuth(app);

export { auth, db };

