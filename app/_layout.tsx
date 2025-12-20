// app/_layout.tsx
import { Analytics } from "@vercel/analytics/react";
import * as Notifications from 'expo-notifications'; // ★ 通知機能をインポート
import { Stack, useRouter } from 'expo-router'; // ★ useRouterを追加
import Head from 'expo-router/head';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { auth } from '../firebaseConfig';
import AuthScreen from './auth';

// ★ 通知の動作設定（アプリ起動中に通知が来たときの挙動）
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ★ ルーターを取得

  // ★ 通知をタップしたときの処理（リスナー）
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      // 通知に含まれているデータ（url）を取り出す
      const data = response.notification.request.content.data;
      
      // urlがあれば、そこへジャンプ！
      if (data && data.url) {
        console.log("通知タップ検知！ジャンプします:", data.url);
        router.push(data.url);
      }
    });

    return () => subscription.remove();
  }, []);

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
        
        {/* ★ チャット画面の設定を追加（これがないとタイトルが出ない場合があります） */}
        <Stack.Screen name="chat" options={{ title: 'チャット' }} />

        {/* モーダルなどの画面はここに追加 */}
        {/* 例: <Stack.Screen name="settings" options={{ presentation: 'modal' }} /> */}
      </Stack>

      {/* Web用アクセス解析 */}
      {Platform.OS === 'web' && <Analytics />}
    </>
  );
}