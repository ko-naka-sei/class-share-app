import { Stack } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../firebaseConfig';
import AuthScreen from './auth'; // さっき作ったファイルをインポート

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ログイン状態を監視するリスナー
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // 確認が終わったらローディング解除
    });
    return () => unsubscribe();
  }, []);

  // 1. 確認中はずっとくるくるを表示（真っ白な画面を防ぐ）
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // 2. ログインしていない場合は、ログイン画面だけを表示（他へのアクセスを完全ブロック）
  if (!user) {
    return <AuthScreen />;
  }

  // 3. ログインしている場合のみ、通常のアプリ画面（Tabsなど）を表示
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}