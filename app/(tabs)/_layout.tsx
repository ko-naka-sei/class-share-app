//app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import Head from 'expo-router/head';
import React from 'react';

export default function TabLayout() {
  return (
    <>
      <Head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      <Tabs screenOptions={{ tabBarActiveTintColor: '#2f95dc' }}>
        
        {/* ホーム */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'ホーム',
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
        />

        {/* すれ違い */}
        <Tabs.Screen
          name="streetpass"
          options={{
            title: 'すれ違い',
            tabBarIcon: ({ color }) => <Ionicons name="bluetooth" size={24} color={color} />,
          }}
        />

        {/* 投稿 */}
        <Tabs.Screen
          name="post"
          options={{
            title: '投稿',
            tabBarIcon: ({ color }) => <Ionicons name="camera" size={24} color={color} />,
          }}
        />

        {/* 友達検索（友達追加） */}
        <Tabs.Screen
          name="friends"
          options={{
            title: '友達検索',
            tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
          }}
        />

        {/* ★ここを変更：プロフィール（承認・設定・時間割編集もここにまとめるのが一般的ですが、今回はタブとして追加） */}
        <Tabs.Screen
          name="profile" // ※ファイル名を profile.tsx にする必要があります
          options={{
            title: 'マイページ',
            tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
          }}
        />

        {/* ※時間割編集タブ（timetable-edit）はマイページに入れることもできますが、タブとして残すならそのままで */}
        <Tabs.Screen
          name="timetable-edit"
          options={{
            href: null, // ★タブバーには表示しない（マイページなどから遷移、あるいはタブが多すぎるので隠す）
            // またはタブとして残すなら href: null を削除
            title: '予定編集',
            tabBarIcon: ({ color }) => <Ionicons name="create" size={24} color={color} />,
          }}
        />

      </Tabs>
    </>
  );
}