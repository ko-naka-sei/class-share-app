import * as ExpoClipboard from 'expo-clipboard'; // もしClipboardがなければこちら
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'; // Clipboardは非推奨の場合がありますが一旦これで、もしくはexpo-clipboard
import { auth } from '../../firebaseConfig.native';
import { followUserByUsername, getUserProfile } from '../../services/userService';

export default function FriendsScreen() {
  const [targetName, setTargetName] = useState('');
  const [followingCount, setFollowingCount] = useState(0);
  const [myUsername, setMyUsername] = useState(''); // ★自分のID保存用
  
  const user = auth.currentUser;

  useEffect(() => {
    fetchMyData();
  }, [user]);

  const fetchMyData = async () => {
    if (user) {
      // 1. 自分のプロフィールを取得
      const profile: any = await getUserProfile(user.uid);
      if (profile) {
        setMyUsername(profile.username); // ★自分のIDを取得
        if (profile.following) {
          setFollowingCount(profile.following.length - 1);
        }
      }
    }
  };

  const handleAddFriend = async () => {
    if (!user) return;
    if (targetName === '') {
      Alert.alert('エラー', 'IDを入力してください');
      return;
    }
    try {
      const addedName = await followUserByUsername(user.uid, targetName);
      Alert.alert('成功', `${addedName}さんを友達追加しました！`);
      setTargetName('');
      fetchMyData();
    } catch (e: any) {
      Alert.alert('エラー', e.message);
    }
  };

  // IDをコピーする機能
  const copyToClipboard = async () => {
    await ExpoClipboard.setStringAsync(myUsername);
    Alert.alert('コピーしました', '友達にLINEなどで送ってあげましょう');
  };

  return (
    <View style={styles.container}>
      
      {/* ★自分のIDを表示するエリア */}
      <View style={styles.myIdBox}>
        <Text style={styles.label}>あなたのユーザーID</Text>
        <TouchableOpacity onPress={copyToClipboard}>
          <Text style={styles.myIdText}>{myUsername || '読み込み中...'}</Text>
          <Text style={styles.copyHint}>タップしてコピー</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>友達を探す</Text>
      <Text style={styles.desc}>友達のIDを入力して追加しましょう</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="友達のID (例: hanako99)"
          value={targetName}
          onChangeText={setTargetName}
          autoCapitalize="none"
        />
        <Button title="追加する" onPress={handleAddFriend} />
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.statusTitle}>フォロー中</Text>
        <Text style={styles.statusCount}>{followingCount}人</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, backgroundColor: '#fff', justifyContent: 'center' },
  
  // ★自分のIDのデザイン
  myIdBox: { 
    alignItems: 'center', marginBottom: 40, padding: 20, 
    backgroundColor: '#e6f7ff', borderRadius: 10, borderWidth: 1, borderColor: '#1890ff' 
  },
  label: { fontSize: 14, color: '#1890ff', fontWeight: 'bold', marginBottom: 5 },
  myIdText: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  copyHint: { fontSize: 12, color: '#888', marginTop: 5 },

  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  desc: { textAlign: 'center', marginBottom: 20, color: '#666' },
  inputContainer: { marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16, backgroundColor: '#f9f9f9' },
  statusBox: { alignItems: 'center', padding: 20, backgroundColor: '#f0f8ff', borderRadius: 10 },
  statusTitle: { fontSize: 16, fontWeight: 'bold', color: '#007bff' },
  statusCount: { fontSize: 30, fontWeight: 'bold', color: '#333' },
});