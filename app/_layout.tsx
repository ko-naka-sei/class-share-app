// app/_layout.tsx

import { Analytics } from "@vercel/analytics/react";
import * as Linking from 'expo-linking'; // ★追加: URL解析用
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { auth } from '../firebaseConfig';
import AuthScreen from './auth';

// 通知設定
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
  const router = useRouter();

  // ★ 通知タップ時の処理（URL解析機能を追加）
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data && data.url) {
        console.log("受信したURL:", data.url);
        
        try {
          // Expoの機能でURLを分解する（exp://... をパスとクエリに分ける）
          const parsed = Linking.parse(data.url);

          // パス（chat）があれば移動する
          if (parsed.path) {
             // クエリパラメータ（friendIdなど）があれば文字列に戻す
             const query = parsed.queryParams 
               ? '?' + new URLSearchParams(parsed.queryParams as any).toString() 
               : '';
             
             // 例: /chat?friendId=abc... という形にする
             // pathの先頭にスラッシュがない場合はつける
             const targetPath = parsed.path.startsWith('/') ? parsed.path + query : `/${parsed.path}${query}`;
             
             console.log("ジャンプ先:", targetPath);
             router.push(targetPath as any);
          } else {
             // パスが解析できない場合はそのまま試す
             router.push(data.url);
          }
        } catch (e) {
          console.log("リンク解析エラー:", e);
          router.push(data.url); 
        }
      }
    });

    return () => subscription.remove();
  }, []);

  // 認証監視
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = "MyBeReal"; 
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!user) {
    return (
        <>
            <Head>
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            </Head>
            <AuthScreen /> 
            {Platform.OS === 'web' && <Analytics />}
        </>
    );
  }

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
        <Stack.Screen name="chat" options={{ title: 'チャット' }} />
      </Stack>

      {Platform.OS === 'web' && <Analytics />}
    </>
  );
}