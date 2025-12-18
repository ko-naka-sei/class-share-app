import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function FriendsScreen() {
  const [users, setUsers] = useState<any[]>([]); // 全ユーザーリスト
  const [following, setFollowing] = useState<string[]>([]); // 自分がフォロー中のIDリスト
  const [loading, setLoading] = useState(false);

  // データを読み込む
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // 1. 自分の「フォローリスト」を取得
      const myDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (myDoc.exists()) {
        setFollowing(myDoc.data().following || []);
      }

      // 2. 「全ユーザー」を取得（自分以外）
      const usersSnap = await getDocs(collection(db, 'users'));
      const loadedUsers: any[] = [];
      usersSnap.forEach((doc) => {
        if (doc.id !== currentUser.uid) { // 自分はリストに出さない
          loadedUsers.push({ id: doc.id, ...doc.data() });
        }
      });
      setUsers(loadedUsers);

    } catch (e: any) {
      Alert.alert('エラー', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // フォロー / フォロー解除の切り替え
  const toggleFollow = async (targetUid: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const isFollowing = following.includes(targetUid);
    const myRef = doc(db, 'users', currentUser.uid);

    try {
      if (isFollowing) {
        // フォロー解除
        await updateDoc(myRef, {
          following: arrayRemove(targetUid)
        });
        setFollowing(prev => prev.filter(id => id !== targetUid)); // 見た目を即更新
      } else {
        // フォローする
        await updateDoc(myRef, {
          following: arrayUnion(targetUid)
        });
        setFollowing(prev => [...prev, targetUid]); // 見た目を即更新
      }
    } catch (e: any) {
      Alert.alert('エラー', '更新できませんでした');
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>友達を見つける</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>他のユーザーがいません</Text>}
          renderItem={({ item }) => {
            const isFollowing = following.includes(item.id);
            return (
              <View style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.username ? item.username.charAt(0) : '?'}</Text>
                  </View>
                  <Text style={styles.username}>{item.username || '名無し'}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.followButton, isFollowing ? styles.followingBtn : styles.followBtn]}
                  onPress={() => toggleFollow(item.id)}
                >
                  <Text style={[styles.btnText, isFollowing ? styles.followingText : styles.followText]}>
                    {isFollowing ? '追加済み' : '追加'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#888' },
  
  userCard: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' 
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { 
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', 
    justifyContent: 'center', alignItems: 'center', marginRight: 12 
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#555' },
  username: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  // ボタンのデザイン
  followButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  followBtn: { backgroundColor: '#000' }, // 未追加（黒）
  followingBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc' }, // 追加済み（白）
  
  btnText: { fontSize: 12, fontWeight: 'bold' },
  followText: { color: '#fff' },
  followingText: { color: '#333' }
});