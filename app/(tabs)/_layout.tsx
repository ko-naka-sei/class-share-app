import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import Head from 'expo-router/head'; // ★これを忘れずにインポート！
import React from 'react';

export default function TabLayout() {
  return (
    <>
      {/* ★PWA化（アドレスバー消し）の指示 */}
      <Head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      <Tabs screenOptions={{ tabBarActiveTintColor: '#2f95dc' }}>
        
        {/* ホームタブ */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'ホーム',
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
        />

        {/* すれ違いタブ */}
        <Tabs.Screen
          name="streetpass"
          options={{
            title: 'すれ違い',
            tabBarIcon: ({ color }) => <Ionicons name="bluetooth" size={24} color={color} />,
          }}
        />

        {/* 時間割編集タブ */}
        <Tabs.Screen
          name="timetable-edit"
          options={{
            title: '予定編集',
            tabBarIcon: ({ color }) => <Ionicons name="create" size={24} color={color} />,
          }}
        />

        {/* 投稿タブ */}
        <Tabs.Screen
          name="post"
          options={{
            title: '投稿',
            tabBarIcon: ({ color }) => <Ionicons name="camera" size={24} color={color} />,
          }}
        />

        {/* 友達追加タブ */}
        <Tabs.Screen
          name="friends"
          options={{
            title: '友達追加',
            tabBarIcon: ({ color }) => <Ionicons name="person-add" size={24} color={color} />,
          }}
        />

      </Tabs>
    </>
  );
}