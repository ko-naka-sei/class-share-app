import { Ionicons } from '@expo/vector-icons'; // 検索アイコン用
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function FriendsScreen() {
  const [searchText, setSearchText] = useState(''); // 検索窓の文字
  const [searchResults, setSearchResults] = useState<any[]>([]); // 検索結果
  const [following, setFollowing] = useState<string[]>([]); // 既に友達のリスト
  const [loading, setLoading] = useState(false);

  // 画面を開いた時に「自分の友達リスト」だけは取得しておく（ボタンの表示判定のため）
  useEffect(() => {
    const fetchMyFollowing = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const myDoc = await getDoc(doc(db, 'users', user.uid));
      if (myDoc.exists()) {
        setFollowing(myDoc.data().following || []);
      }
    };
    fetchMyFollowing();
  }, []);

  // ★検索実行ボタンを押した時の処理
  const handleSearch = async () => {
    if (!searchText.trim()) {
      Alert.alert('エラー', 'ユーザー名を入力してください');
      return;
    }
    
    Keyboard.dismiss(); // キーボードを閉じる
    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      
      // ユーザーを全件取得して、名前が一致する（含む）人をフィルタリング
      // ※ユーザー数が数千人を超えると遅くなりますが、学生アプリならこの方法が一番確実で簡単です
      const usersSnap = await getDocs(collection(db, 'users'));
      
      const found: any[] = [];
      usersSnap.forEach((doc) => {
        const data = doc.data();
        // 自分以外 かつ 名前が検索ワードを含んでいる場合
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

  // フォロー / 解除処理（前回と同じ）
  const toggleFollow = async (targetUid: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const isFollowing = following.includes(targetUid);
    const myRef = doc(db, 'users', currentUser.uid);

    try {
      if (isFollowing) {
        await updateDoc(myRef, { following: arrayRemove(targetUid) });
        setFollowing(prev => prev.filter(id => id !== targetUid));
      } else {
        await updateDoc(myRef, { following: arrayUnion(targetUid) });
        setFollowing(prev => [...prev, targetUid]);
      }
    } catch (e) {
      Alert.alert('エラー', '更新に失敗しました');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>友達を探す</Text>
      
      {/* 検索フォーム */}
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

      {/* 結果リスト */}
      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            // 検索結果がない時のメッセージ
            searchResults.length === 0 && searchText ? null : 
            <Text style={styles.emptyText}>ユーザー名を入力して検索してください</Text>
          }
          renderItem={({ item }) => {
            const isFollowing = following.includes(item.id);
            return (
              <View style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.username ? item.username.charAt(0) : '?'}</Text>
                  </View>
                  <Text style={styles.username}>{item.username}</Text>
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
  
  // 検索周りのデザイン
  searchContainer: { flexDirection: 'row', marginBottom: 20 },
  searchInput: { 
    flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 15, height: 50, fontSize: 16, marginRight: 10 
  },
  searchButton: { 
    width: 50, height: 50, backgroundColor: '#000', borderRadius: 8, 
    justifyContent: 'center', alignItems: 'center' 
  },

  emptyText: { textAlign: 'center', marginTop: 50, color: '#aaa' },
  
  // カードデザイン
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

  followButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  followBtn: { backgroundColor: '#000' },
  followingBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc' },
  btnText: { fontSize: 12, fontWeight: 'bold' },
  followText: { color: '#fff' },
  followingText: { color: '#333' }
});