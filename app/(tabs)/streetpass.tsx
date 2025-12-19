import * as Location from 'expo-location';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../firebaseConfig';

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
    // ボタンの振動などは一旦オフにして、原因特定に集中します
    setLoading(true);

    try {
      // ①まずここが出るか？
      alert("診断1: 処理スタート");

      const user = auth.currentUser;
      if (!user) {
        alert("エラー: ログインしていません");
        setLoading(false);
        return;
      }

      // ②権限チェックの直前
      alert("診断2: 位置情報の許可を聞きに行きます");

      let { status } = await Location.requestForegroundPermissionsAsync();
      
      // ③結果はどうだったか？
      alert(`診断3: 結果は「${status}」でした`);

      if (status !== 'granted') {
        alert("エラー: 拒否されています。スマホの設定で許可してください。");
        setLoading(false);
        return;
      }

      // ④位置情報の取得開始
      alert("診断4: 位置情報を取得中...（ここで止まることが多いです）");
      
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest, // ★テスト用に精度を下げて取得しやすくする
      });
      
      alert(`診断5: 取得成功！ 緯度: ${loc.coords.latitude}`);

      // ... (これ以降のDB保存などの処理は元のままでOKですが、まずはここまで動くか確認)
      
      // ここから下は元のコードの「DB保存〜検索処理」をそのまま続けてください
      // ...

    } catch (e: any) {
      alert(`エラー発生: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };
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