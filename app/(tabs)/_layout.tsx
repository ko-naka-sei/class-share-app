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