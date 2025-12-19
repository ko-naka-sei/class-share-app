import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'; // updateDoc, arrayUnionなどは削除
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function FriendsScreen() {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [requestStatus, setRequestStatus] = useState<{[key: string]: boolean}>({}); // リクエスト送信済みかどうかの管理
  const [loading, setLoading] = useState(false);
  const [myUsername, setMyUsername] = useState(''); // 自分の名前

  // 自分の名前を取得（相手に送るため）
  useEffect(() => {
    const fetchMyProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const myDoc = await getDoc(doc(db, 'users', user.uid));
      if (myDoc.exists()) {
        setMyUsername(myDoc.data().username || "名無し");
      }
    };
    fetchMyProfile();
  }, []);

  const handleSearch = async () => {
    if (!searchText.trim()) {
      Alert.alert('エラー', 'ユーザー名を入力してください');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      const usersSnap = await getDocs(collection(db, 'users'));
      
      const found: any[] = [];
      usersSnap.forEach((doc) => {
        const data = doc.data();
        // 自分以外 かつ 名前が一致
        if (doc.id !== currentUser?.uid && data.username && data.username.includes(searchText)) {
          found.push({ id: doc.id, ...data });
        }
      });

      setSearchResults(found);
      if (found.length === 0) {
        Alert.alert('見つかりませんでした', 'ユーザー名が正しいか確認してください');
      }
    } catch (e: any) {
      Alert.alert('エラー', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ★リクエスト送信処理
  const sendRequest = async (targetUser: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      // 相手の friendRequests コレクションに自分を追加
      await setDoc(doc(db, 'users', targetUser.id, 'friendRequests', currentUser.uid), {
        username: myUsername, // 自分の名前
        uid: currentUser.uid,
        createdAt: new Date()
      });

      // 送信済み状態にする（ボタンの表示を変えるため）
      setRequestStatus(prev => ({ ...prev, [targetUser.id]: true }));
      Alert.alert('送信完了', `${targetUser.username}さんにリクエストを送りました！`);
    } catch (e) {
      Alert.alert('エラー', '送信に失敗しました');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>友達を探す</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="ユーザー名を入力..."
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            searchResults.length === 0 && searchText ? null : 
            <Text style={styles.emptyText}>ユーザー名を入力して検索してください</Text>
          }
          renderItem={({ item }) => {
            const isSent = requestStatus[item.id]; // 既に送ったかチェック

            return (
              <View style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.username ? item.username.charAt(0) : '?'}</Text>
                  </View>
                  <Text style={styles.username}>{item.username}</Text>
                </View>

                {/* ボタン：リクエスト送信 */}
                <TouchableOpacity
                  style={[styles.followButton, isSent ? styles.sentBtn : styles.followBtn]}
                  onPress={() => !isSent && sendRequest(item)}
                  disabled={isSent}
                >
                  <Text style={[styles.btnText, isSent ? styles.sentText : styles.followText]}>
                    {isSent ? '送信済み' : '追加申請'}
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
  
  searchContainer: { flexDirection: 'row', marginBottom: 20 },
  searchInput: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 15, height: 50, fontSize: 16, marginRight: 10 },
  searchButton: { width: 50, height: 50, backgroundColor: '#000', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#aaa' },
  
  userCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#555' },
  username: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  followButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  followBtn: { backgroundColor: '#000' },
  sentBtn: { backgroundColor: '#e0e0e0' }, // 送信済みはグレーアウト
  btnText: { fontSize: 12, fontWeight: 'bold' },
  followText: { color: '#fff' },
  sentText: { color: '#888' }
});