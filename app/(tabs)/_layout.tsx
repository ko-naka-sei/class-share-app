import { Ionicons } from '@expo/vector-icons'; // アイコン用
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#2f95dc' }}>
      
      {/* ホームタブ */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />

      {/* // <Tabs> の中に以下を追加 */}

      <Tabs.Screen
        name="streetpass"
        options={{
          title: 'すれ違い',
          tabBarIcon: ({ color }) => <Ionicons name="bluetooth" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="timetable-edit" // 作ったファイル名
        options={{
          title: '時間割編集',
          tabBarIcon: ({ color }) => <Ionicons name="create" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"  // ← さっき作ったファイル名と一致させる
        options={{
          title: '投稿',
          tabBarIcon: ({ color }) => <Ionicons name="camera" size={24} color={color} />,
        }}
      />
      {/* ★追加: 友達タブ */}
      <Tabs.Screen
        name="friends"
        options={{
          title: '友達追加',
          tabBarIcon: ({ color }) => <Ionicons name="person-add" size={24} color={color} />,
        }}
      />

    </Tabs>
  );
}