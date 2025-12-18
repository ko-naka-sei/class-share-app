import * as Location from 'expo-location';
import { collection, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

// 2点間の距離（メートル）を計算する関数（ハーバーサイン公式）
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // 地球の半径 (m)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // 距離 (m)
};

export default function StreetPassScreen() {
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  // すれ違い通信を開始（更新）する
  const scanNearby = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      // 1. 位置情報の許可をもらう
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('エラー', '位置情報の許可が必要です');
        setLoading(false);
        return;
      }

      // 2. 現在地を取得
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      // 3. 自分の位置をデータベースに保存
      // users > UID > location というフィールドを作ります
      await updateDoc(doc(db, 'users', user.uid), {
        location: {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          updatedAt: serverTimestamp(), // いつそこにいたか
        }
      });

      // 4. 友達の位置を取得して、近い人を探す
      // まず自分のフォローリストを取得
      const myProfile = await getDoc(doc(db, 'users', user.uid));
      const following = myProfile.exists() ? (myProfile.data().following || []) : [];

      // 全ユーザー（あるいは友達のみ）の位置をチェック
      // ※本格運用時はクエリで絞りますが、簡易的に全件取得してJSで計算します
      const usersSnap = await getDocs(collection(db, 'users'));
      const found: any[] = [];

      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        // 自分以外の友達で、位置情報データがある人
        if (docSnap.id !== user.uid && following.includes(docSnap.id) && data.location) {
          // 距離を計算
          const dist = getDistance(
            loc.coords.latitude, 
            loc.coords.longitude, 
            data.location.latitude, 
            data.location.longitude
          );

          // ★ここがポイント：例えば「500m以内」かつ「1時間以内のデータ」なら「すれ違い」と判定
          // 今回はテストしやすいように「距離だけ」で判定します
          if (dist < 500) { // 半径500m以内
             found.push({
               id: docSnap.id,
               username: data.username,
               distance: Math.round(dist), // m単位
               lastSeen: data.location.updatedAt
             });
          }
        }
      });

      setNearbyUsers(found);
      if (found.length > 0) {
        Alert.alert('発見！', `${found.length}人とすれ違いました！`);
      } else {
        Alert.alert('スキャン完了', '近くに友達はいませんでした...');
      }

    } catch (e: any) {
      Alert.alert('エラー', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scanNearby();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>すれ違い通信 (GPS版)</Text>
      <Text style={styles.subTitle}>半径500m以内の友達を探します</Text>

      <View style={styles.radarContainer}>
        {/* レーダーっぽいデザイン */}
        <View style={styles.radarCircle}>
          <Text style={styles.radarText}>📡</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.scanButton} 
        onPress={scanNearby}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.scanButtonText}>今すぐスキャン！</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.listHeader}>近くにいる友達</Text>
      
      <FlatList
        data={nearbyUsers}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>まだ誰もいません</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.username.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.distance}>ここから {item.distance}m</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subTitle: { textAlign: 'center', color: '#666', marginBottom: 30 },
  
  radarContainer: { alignItems: 'center', marginBottom: 30 },
  radarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#dceeff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2f95dc' },
  radarText: { fontSize: 40 },

  scanButton: { backgroundColor: '#000', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginBottom: 30 },
  scanButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  listHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20 },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#555' },
  username: { fontSize: 16, fontWeight: 'bold' },
  distance: { color: '#2f95dc', fontWeight: 'bold' }
});