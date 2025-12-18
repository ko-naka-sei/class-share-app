import { useFocusEffect } from 'expo-router';
import { signOut } from 'firebase/auth'; // ★追加: ログアウト機能
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function HomeScreen() {
  const [viewMode, setViewMode] = useState<'photos' | 'timetables'>('photos');
  const [posts, setPosts] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ★追加: ログアウト処理
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // _layout.tsx がログアウトを検知して、自動でログイン画面に切り替わります
    } catch (e: any) {
      Alert.alert('エラー', e.message);
    }
  };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setRefreshing(false);
        return;
      }
      const myProfileSnap = await getDoc(doc(db, 'users', user.uid));
      let following: string[] = [];
      if (myProfileSnap.exists()) {
        following = myProfileSnap.data().following || [];
      }
      if (!following.includes(user.uid)) following.push(user.uid);

      // 写真取得
      const postsSnap = await getDocs(collection(db, 'posts'));
      const loadedPosts: any[] = [];
      postsSnap.forEach((doc) => {
        const d = doc.data();
        if (following.includes(d.uid)) loadedPosts.push({ id: doc.id, ...d });
      });
      loadedPosts.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setPosts(loadedPosts);

      // 予定取得
      const timetablesSnap = await getDocs(collection(db, 'timetables'));
      const loadedTimetables: any[] = [];
      timetablesSnap.forEach((doc) => {
        const d = doc.data();
        if (following.includes(d.uid)) loadedTimetables.push({ id: doc.id, ...d });
      });
      setTimetables(loadedTimetables);

    } catch (e) {
      console.log(e);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const renderFreeTimeList = (data: any) => {
    const days = [
      { key: 'mon', label: '月' },
      { key: 'tue', label: '火' },
      { key: 'wed', label: '水' },
      { key: 'thu', label: '木' },
      { key: 'fri', label: '金' },
      { key: 'sat', label: '土', weekend: true },
      { key: 'sun', label: '日', weekend: true },
    ];

    const hasAnyEntry = days.some(day => data[day.key]);
    if (!hasAnyEntry) {
      return <Text style={styles.noPlanText}>登録された予定はありません</Text>;
    }

    return (
      <View style={styles.listContainer}>
        {days.map((day) => {
          const text = data[day.key];
          if (!text) return null;
          return (
            <View key={day.key} style={styles.listRow}>
              <View style={[styles.dayBadge, day.weekend && styles.weekendBadge]}>
                <Text style={[styles.dayText, day.weekend && styles.weekendText]}>{day.label}</Text>
              </View>
              <Text style={styles.planText}>{text}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ★ヘッダー部分を変更: ログアウトボタンを追加 */}
      <View style={styles.headerContainer}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, viewMode === 'photos' && styles.activeTab]} 
            onPress={() => setViewMode('photos')}
          >
            <Text style={[styles.tabText, viewMode === 'photos' && styles.activeTabText]}>📸 写真</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, viewMode === 'timetables' && styles.activeTab]} 
            onPress={() => setViewMode('timetables')}
          >
            <Text style={[styles.tabText, viewMode === 'timetables' && styles.activeTabText]}>📅 予定</Text>
          </TouchableOpacity>
        </View>

        {/* ログアウトボタン */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>ログアウト</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'photos' ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
          ListEmptyComponent={<Text style={styles.emptyText}>まだ投稿がありません</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.username}>{item.username || '名無し'}</Text>
                <Text style={styles.date}>Real.</Text>
              </View>
              {item.photoUrl && <Image source={{ uri: item.photoUrl }} style={styles.postImage} />}
              <Text style={styles.message}>{item.message}</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={timetables}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
          ListEmptyComponent={<Text style={styles.emptyText}>まだデータがありません</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.timetableUser}>{item.username || 'ユーザー'} の予定</Text>
              {renderFreeTimeList(item)}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', paddingTop: 50 },
  
  // ★ヘッダー周りのデザイン変更
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15, position: 'relative' },
  tabContainer: { flexDirection: 'row' },
  logoutButton: { position: 'absolute', right: 20 },
  logoutText: { color: '#ff6b6b', fontWeight: 'bold', fontSize: 12 },

  tabButton: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, marginHorizontal: 5, backgroundColor: '#ddd' },
  activeTab: { backgroundColor: '#000' },
  tabText: { fontWeight: 'bold', color: '#555' },
  activeTabText: { color: '#fff' },
  
  card: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 20, borderRadius: 15, padding: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  username: { fontWeight: 'bold', fontSize: 16 },
  date: { color: '#888', fontSize: 12 },
  postImage: { width: '100%', height: 400, borderRadius: 10, backgroundColor: '#eee' },
  message: { marginTop: 10, fontSize: 14, color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },

  timetableUser: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#000', textAlign: 'center' },
  listContainer: { paddingHorizontal: 10 },
  listRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dayBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  weekendBadge: { backgroundColor: '#ffecec' },
  dayText: { fontWeight: 'bold', color: '#555' },
  weekendText: { color: '#ff6b6b' },
  planText: { flex: 1, fontSize: 16, color: '#333' },
  noPlanText: { textAlign: 'center', color: '#aaa', fontStyle: 'italic' }
});