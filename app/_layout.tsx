import { Stack } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Platform } from 'react-native'; // Platformを追加
import { auth } from '../firebaseConfig';
import AuthScreen from './auth';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ★追加: Webブラウザで開いた時のタブ名を「MyBeReal」にする
    if (Platform.OS === 'web') {
      document.title = "MyBeReal"; 
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 1. 確認中は「黒背景」でくるくるを表示 (BeRealっぽく)
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // 2. ログインしていない場合は認証画面へ
  if (!user) {
    return <AuthScreen />;
  }

  // 3. ログイン後の画面設定
  return (
    <Stack
      screenOptions={{
        // 全体のヘッダー設定（黒背景・白文字）
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        // Webで戻るボタンなどが変にならないように
        headerBackTitleVisible: false, 
      }}
    >
      {/* メインのタブ画面 (ヘッダーなし) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* ★追加: 友達一覧・追加画面 (モーダル風に下から出す) */}
      <Stack.Screen 
        name="friends"  // friends.tsx というファイルを作った場合
        options={{ 
          title: '友達追加',
          presentation: 'modal', // これでiOSアプリっぽく下から出てくる
        }} 
      />
    </Stack>
  );
}