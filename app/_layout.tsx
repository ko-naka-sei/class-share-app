import { Analytics } from "@vercel/analytics/react";
import * as Linking from 'expo-linking'; // ★追加
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { auth } from '../firebaseConfig';
import AuthScreen from './auth';

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

  // ★ 通知タップ時の処理（URL解析機能付き）
  useEffect(() => {
    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      
      if (data && data.url) {
        console.log("受信URL:", data.url);

        try {
          // ★Expo Goの長いURLを解析する
          // これで "exp://.../--/chat" から "chat" を取り出せます
          const parsed = Linking.parse(data.url);
          
          if (parsed.path) {
            // クエリパラメータ（?friendId=...）を復元する
            const queryParams = parsed.queryParams 
              ? '?' + new URLSearchParams(parsed.queryParams as any).toString() 
              : '';
            
            // パスの先頭に "/" がない場合は補って、クエリと合体させる
            const path = parsed.path.startsWith('/') ? parsed.path : `/${parsed.path}`;
            const targetUrl = `${path}${queryParams}`;

            console.log("ジャンプ先:", targetUrl);
            
            // ★0.5秒待ってから移動（タイミング問題を防ぐ重要ポイント）
            setTimeout(() => {
              router.push(targetUrl as any);
            }, 500);
          } else {
             // 万が一パスが取れなかった場合はそのままURLを使う
             console.log("パス解析不能、直接ジャンプ試行");
             setTimeout(() => {
               router.push(data.url);
             }, 500);
          }
        } catch (e) {
          console.error("URL解析エラー:", e);
        }
      }
    };

    // 1. アプリ起動中に通知タップ
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // 2. アプリ停止状態から通知タップ（コールドスタート）
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => subscription.remove();
  }, []);

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