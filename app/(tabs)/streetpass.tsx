import * as Location from 'expo-location';
import { collection, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

// 2点間の距離（メートル）を計算する関数
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

  return R * c; 
};

export default function StreetPassScreen() {
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const scanNearby = async () => {
    // 1. ボタンを押した感触（振動）
    Vibration.vibrate(50); // ブッ！と短く震える
    
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("エラー", "ログインしてください");
        setLoading(false);
        return;
      }

      // 2. 位置情報の許可を取得
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '位置情報が必要です',
          'ブラウザやスマホの設定で、このアプリの位置情報を「許可」にしてください。'
        );
        setLoading(false);
        return;
      }

      // 3. 現在地を取得
      // accuracy: Balanced は「精度そこそこ、速度そこそこ」でバランスが良い設定です
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 4. 自分の位置をデータベースに保存
      await updateDoc(doc(db, 'users', user.uid), {
        location: {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          updatedAt: serverTimestamp(),
        }
      });

      // 5. 全ユーザーを取得して計算
      // ※ユーザー数が増えたらここでクエリ制限（whereなど）をかけますが、今は全件取得でOK
      const usersSnap = await getDocs(collection(db, 'users'));
      const found: any[] = [];

      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const targetId = docSnap.id;

        // 自分自身はリストに入れない
        if (targetId === user.uid) return;

        // 位置情報を持っていない人は計算できないのでスキップ
        if (!data.location) return;

        // 距離計算実行
        const dist = getDistance(
          loc.coords.latitude, 
          loc.coords.longitude, 
          data.location.latitude, 
          data.location.longitude
        );

        // ★判定基準：半径2000m（2km）以内
        // テスト中は広めにしておくと安心です。本番運用時は 500 (m) などに狭めてください。
        if (dist < 2000) { 
           found.push({
             id: targetId,
             username: data.username || "名無し",
             distance: Math.round(dist),
             lastSeen: data.location.updatedAt
           });
        }
      });

      // 結果を保存
      setNearbyUsers(found);
      
      // 結果に応じたフィードバック
      if (found.length > 0) {
        // 見つかったら「ブブッ！」と2回震えて教える
        Vibration.vibrate([0, 100, 50, 100]); 
        Alert.alert('スキャン成功！', `${found.length}人の友達が近くにいます！`);
      } else {
        // 0人だった場合
        Alert.alert('スキャン完了', '近く（2km以内）に友達は見つかりませんでした。\n※相手も位置情報を登録している必要があります。');
      }

    } catch (e: any) {
      console.error("スキャンエラー:", e);
      Alert.alert('エラー発生', '通信に失敗しました。もう一度試してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>すれ違い通信</Text>
      <Text style={styles.subTitle}>ボタンを押して近くの友達を探そう</Text>

      {/* レーダー風デザイン */}
      <View style={styles.radarContainer}>
        <View style={styles.radarCircle}>
          <Text style={styles.radarText}>📡</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.scanButton, loading && styles.scanButtonDisabled]} 
        onPress={scanNearby}
        disabled={loading}
        activeOpacity={0.7}
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
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? "探しています..." : "まだ誰も見つかっていません"}
          </Text>
        }
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

  scanButton: { 
    backgroundColor: '#000', 
    paddingVertical: 15, 
    borderRadius: 30, 
    alignItems: 'center', 
    marginBottom: 30,
    // ボタンに立体感をつける影
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