import { Analytics } from "@vercel/analytics/react";
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

  // ★ 通知タップ時の処理（生データ版）
  useEffect(() => {
    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      
      // データの中身を確認
      // "targetScreen" が "chat" だったら移動する
      if (data && data.targetScreen === 'chat') {
        console.log("チャット通知を受信:", data);

        const targetFriendId = data.friendId;
        const targetFriendName = data.friendName;

        // ★router.pushにオブジェクトを渡す（これが一番確実です）
        // 0.5秒待つのは必須です（起動直後の不具合防止）
        setTimeout(() => {
          router.push({
            pathname: '/chat',
            params: { 
              friendId: targetFriendId, 
              friendName: targetFriendName 
            }
          });
        }, 500);
      }
    };

    // 1. アプリ起動中
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // 2. コールドスタート（アプリ停止状態から）
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