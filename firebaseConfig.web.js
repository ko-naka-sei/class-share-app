import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// Web用の普通の認証機能をインポート
import { getAuth } from 'firebase/auth';

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

// Web用の認証設定（ブラウザが勝手に管理してくれるのでシンプル）
const auth = getAuth(app);

export { auth, db };

