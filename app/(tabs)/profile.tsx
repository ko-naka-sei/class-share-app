import { signOut } from 'firebase/auth';
// ★ updateDoc, arrayUnion を追加しました
import { arrayUnion, collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function ProfileScreen() {
  const [myProfile, setMyProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // 1. 自分のプロフィール情報を監視
    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      setMyProfile(docSnap.data());
    });

    // 2. 「自分宛ての友達リクエスト」を監視
    const requestsRef = collection(db, 'users', user.uid, 'friendRequests');
    const unsubRequests = onSnapshot(requestsRef, (snapshot) => {
      const loadedRequests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(loadedRequests);
    });

    // 3. 「友達リスト」を監視
    const friendsRef = collection(db, 'users', user.uid, 'friends');
    const unsubFriends = onSnapshot(friendsRef, (snapshot) => {
      const loadedFriends = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setFriends(loadedFriends);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubRequests();
      unsubFriends();
    };
  }, []);

  // 承認ボタンの処理（ここを修正！）
  const handleApprove = async (requesterId: string, requesterName: string) => {
    if (!user) return;

    try {
      // 1. プロフィール画面用の「友達リスト」に追加（自分）
      await setDoc(doc(db, 'users', user.uid, 'friends', requesterId), {
        username: requesterName,
        connectedAt: new Date()
      });

      // 2. プロフィール画面用の「友達リスト」に追加（相手）
      const myName = myProfile?.username || "不明なユーザー";
      await setDoc(doc(db, 'users', requesterId, 'friends', user.uid), {
        username: myName,
        connectedAt: new Date()
      });

      // ★★★ ここを追加！ホーム画面（投稿）が見えるようにするための処理 ★★★
      
      // 3. 自分の `following` 配列に相手を追加（これで投稿が見れるようになる）
      await updateDoc(doc(db, 'users', user.uid), {
        following: arrayUnion(requesterId)
      });

      // 4. 相手の `following` 配列に自分を追加（相手も自分の投稿が見れるようになる）
      await updateDoc(doc(db, 'users', requesterId), {
        following: arrayUnion(user.uid)
      });

      // ★★★ 追加ここまで ★★★

      // 5. リクエストを削除（承認済みなので消す）
      await deleteDoc(doc(db, 'users', user.uid, 'friendRequests', requesterId));

      Alert.alert("完了", `${requesterName}さんと友達になりました！`);
    } catch (e: any) {
      Alert.alert("エラー", "承認に失敗しました: " + e.message);
    }
  };

  // 拒否ボタンの処理
  const handleReject = async (requesterId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'friendRequests', requesterId));
    } catch (e: any) {
      Alert.alert("エラー", "削除に失敗しました");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e: any) {
      Alert.alert("エラー", e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      
      {/* ヘッダー（自分の情報） */}
      <View style={styles.headerSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{myProfile?.username?.charAt(0) || '?'}</Text>
        </View>
        <Text style={styles.myName}>{myProfile?.username || "名無し"}</Text>
        <Text style={styles.myId}>ID: {user?.uid.slice(0, 6)}...</Text>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>ログアウト</Text>
        </TouchableOpacity>
      </View>

      {/* 届いているリクエスト */}
      {requests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📩 友達リクエスト ({requests.length})</Text>
          {requests.map((req) => (
            <View key={req.id} style={styles.requestCard}>
              <View>
                <Text style={styles.reqName}>{req.username} さん</Text>
                <Text style={styles.reqSub}>からリクエストが届いています</Text>
              </View>
              <View style={styles.reqButtons}>
                <TouchableOpacity 
                  style={[styles.btn, styles.btnApprove]} 
                  onPress={() => handleApprove(req.id, req.username)}
                >
                  <Text style={styles.btnText}>承認</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btn, styles.btnReject]} 
                  onPress={() => handleReject(req.id)}
                >
                  <Text style={styles.btnTextReject}>拒否</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 友達一覧 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤝 友達一覧 ({friends.length})</Text>
        {friends.length === 0 ? (
          <Text style={styles.emptyText}>まだ友達がいません</Text>
        ) : (
          friends.map((friend) => (
            <View key={friend.id} style={styles.friendRow}>
              <View style={styles.miniAvatar}>
                 <Text style={styles.miniAvatarText}>{friend.username?.charAt(0)}</Text>
              </View>
              <Text style={styles.friendName}>{friend.username}</Text>
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerSection: { alignItems: 'center', padding: 30, backgroundColor: '#fff', marginBottom: 15, borderBottomWidth: 1, borderColor: '#eee' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  myName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  myId: { color: '#888', marginTop: 5, fontSize: 12 },
  
  logoutButton: { marginTop: 15, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#ff6b6b' },
  logoutText: { color: '#ff6b6b', fontSize: 12, fontWeight: 'bold' },

  section: { backgroundColor: '#fff', padding: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  emptyText: { color: '#999', textAlign: 'center', padding: 20, fontSize: 14 },

  requestCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  reqName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  reqSub: { fontSize: 12, color: '#888' },
  reqButtons: { flexDirection: 'row', gap: 10 },
  
  btn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  btnApprove: { backgroundColor: '#2f95dc' },
  btnReject: { backgroundColor: '#f0f0f0' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  btnTextReject: { color: '#666', fontSize: 12, fontWeight: 'bold' },

  friendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f9f9f9' },
  miniAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  miniAvatarText: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  friendName: { fontSize: 16, color: '#333' },
});