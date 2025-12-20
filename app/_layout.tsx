import { Analytics } from "@vercel/analytics/react";
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { auth } from '../firebaseConfig';
import AuthScreen from './auth';

// 通知の動作設定
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

  // ★ 通知タップ時の処理
  useEffect(() => {
    // 1. アプリ起動中に通知をタップした場合
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data && data.url) {
        console.log("通知パス受信:", data.url);
        // ★重要: 0.5秒待ってから移動（これがないとホームに戻されることがある）
        setTimeout(() => {
            router.push(data.url);
        }, 500);
      }
    });

    // 2. アプリが完全に死んでいる状態から通知で起動した場合
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response?.notification.request.content.data.url) {
        const url = response.notification.request.content.data.url;
        console.log("コールドスタート通知:", url);
        // こちらは少し長めに待つ
        setTimeout(() => {
            router.push(url);
        }, 1000);
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