import * as Location from 'expo-location';
import { collection, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

// 2点間の距離（メートル）を計算する関数
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; 
};

export default function StreetPassScreen() {
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myLocation, setMyLocation] = useState<any>(null); // デバッグ用：自分の位置

  const scanNearby = async () => {
    // ★追加1: ボタンを押した瞬間にスマホを振動させる（Webでも対応端末なら震えます）
    Vibration.vibrate(50);
    
    setLoading(true);
    console.log("=== スキャン開始 ===");

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("エラー", "ログインしてください");
        setLoading(false);
        return;
      }

      // 1. 位置情報の許可（スマホ用により厳密にチェック）
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('位置情報エラー', '設定から位置情報を許可してください');
        setLoading(false);
        return;
      }

      // 2. 現在地を取得
      // ★ポイント: accuracyを入れると精度が上がります
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      // デバッグ用に画面に表示
      setMyLocation(loc.coords);
      console.log("自分の位置:", loc.coords.latitude, loc.coords.longitude);

      // 3. 自分の位置をDBに保存
      await updateDoc(doc(db, 'users', user.uid), {
        location: {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          updatedAt: serverTimestamp(),
        }
      });

      // 4. 全ユーザーを取得して計算
      const usersSnap = await getDocs(collection(db, 'users'));
      const found: any[] = [];

      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const targetId = docSnap.id;

        // 自分自身はスキップ
        if (targetId === user.uid) return;

        // 位置情報を持っていない人はスキップ
        if (!data.location) return;

        // 距離を計算
        const dist = getDistance(
          loc.coords.latitude, 
          loc.coords.longitude, 
          data.location.latitude, 
          data.location.longitude
        );

        console.log(`${data.username}までの距離: ${Math.round(dist)}m`);

        // ★修正: テスト用に「10km (10000m)」まで許容する
        // PCのWi-Fi位置情報はズレやすいため、広めにとるのがコツです
        if (dist < 10000) { 
           found.push({
             id: targetId,
             username: data.username || "名無し",
             distance: Math.round(dist),
           });
        }
      });

      setNearbyUsers(found);
      
      if (found.length > 0) {
        Vibration.vibrate([0, 100, 50, 100]); // 発見したら「ブブッ」と震える
        Alert.alert('発見！', `${found.length}人とすれ違いました！`);
      } else {
        Alert.alert('結果', '近くに（10km以内）ユーザーはいませんでした。\n※PCとスマホで別のアカウントを使っていますか？');
      }

    } catch (e: any) {
      console.error("エラー:", e);
      Alert.alert('エラー', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 初回ロード時は自動スキャンしない（ユーザーにボタンを押させるため）
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>すれ違い通信</Text>
      <Text style={styles.subTitle}>ボタンを押して近くの友達を探そう</Text>

      {/* ★デバッグ用：自分の座標を表示（テストが終わったら消してOK） */}
      {myLocation && (
        <Text style={styles.debugText}>
          現在地: {myLocation.latitude.toFixed(4)}, {myLocation.longitude.toFixed(4)}
        </Text>
      )}

      <View style={styles.radarContainer}>
        <View style={styles.radarCircle}>
          <Text style={styles.radarText}>📡</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.scanButton, loading && styles.scanButtonDisabled]} 
        onPress={scanNearby}
        disabled={loading}
        activeOpacity={0.7} // ★ボタンを押した時に色が薄くなる
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.scanButtonText}>スキャン開始</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.listHeader}>近くにいるユーザー</Text>
      
      <FlatList
        data={nearbyUsers}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>スキャンボタンを押してください</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.username.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.distance}>距離: {item.distance}m</Text>
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
  subTitle: { textAlign: 'center', color: '#666', marginBottom: 20 },
  debugText: { textAlign: 'center', fontSize: 10, color: '#aaa', marginBottom: 10 },
  
  radarContainer: { alignItems: 'center', marginBottom: 30 },
  radarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#dceeff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2f95dc' },
  radarText: { fontSize: 40 },

  scanButton: { 
    backgroundColor: '#000', 
    paddingVertical: 15, 
    borderRadius: 30, 
    alignItems: 'center', 
    marginBottom: 30,
    // ★影をつけてボタンっぽさを出す
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 4, 
    elevation: 5,
  },
  scanButtonDisabled: { backgroundColor: '#888' },
  scanButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  listHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20 },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#555' },
  username: { fontSize: 16, fontWeight: 'bold' },
  distance: { color: '#2f95dc', fontWeight: 'bold' }
});