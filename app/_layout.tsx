//app/_layout.tsx
import { Analytics } from "@vercel/analytics/react";
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { auth } from '../firebaseConfig';
import AuthScreen from './auth'; // これが「最初のページ」として機能します

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Web用タイトル設定
    if (Platform.OS === 'web') {
      document.title = "MyBeReal"; 
    }

    // ログイン監視
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 1. ロード中（黒背景で待機）
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // 2. 未ログインなら、このコンポーネント自体を「ログイン画面」にする
  // ページ遷移ではなく、ここでリターンすることで「最初のページ＝ログイン画面」になります
  if (!user) {
    return (
        <>
            <Head>
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            </Head>
            {/* ログイン・登録機能を持ったコンポーネントを表示 */}
            <AuthScreen /> 
             {/* 未ログインでもAnalyticsは動かす */}
            {Platform.OS === 'web' && <Analytics />}
        </>
    );
  }

  // 3. ログイン済みなら、アプリのメイン画面（Tabs）を表示
  return (
    <>
      <Head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitleVisible: false, 
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* モーダルなどの画面はここに追加 */}
        {/* 例: <Stack.Screen name="settings" options={{ presentation: 'modal' }} /> */}
      </Stack>

      {/* Web用アクセス解析 */}
      {Platform.OS === 'web' && <Analytics />}
    </>
  );
}