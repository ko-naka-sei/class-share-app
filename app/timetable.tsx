import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function EditTimetableScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 各曜日の予定を管理するデータ
  const [schedule, setSchedule] = useState({
    mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: ''
  });

  const user = auth.currentUser;

  // 画面を開いた時：今保存されているデータを読み込む
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, 'timetables', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          // データがあればセット（ない項目は空文字）
          setSchedule({
            mon: data.mon || '',
            tue: data.tue || '',
            wed: data.wed || '',
            thu: data.thu || '',
            fri: data.fri || '',
            sat: data.sat || '',
            sun: data.sun || '',
          });
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 保存ボタンを押した時
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // 1. ユーザー名を取得（時間割に名前を表示するため）
      const userProfileSnap = await getDoc(doc(db, 'users', user.uid));
      const username = userProfileSnap.exists() ? userProfileSnap.data().username : "名無し";

      // 2. 時間割データを保存
      // ドキュメントIDを「自分のUID」にすることで、1人1つのデータを管理します
      await setDoc(doc(db, 'timetables', user.uid), {
        uid: user.uid,        // 誰のデータか
        username: username,   // 表示する名前
        ...schedule,          // 月〜日の予定
        updatedAt: serverTimestamp(),
      }, { merge: true });

      Alert.alert("成功", "予定を保存しました！", [
        { text: "OK", onPress: () => router.back() } // OKを押したら戻る
      ]);

    } catch (e: any) {
      Alert.alert("エラー", "保存に失敗しました: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>予定を編集</Text>
        {/* 保存ボタン（ヘッダー右側） */}
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#2f95dc" />
          ) : (
            <Text style={styles.saveText}>保存</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.description}>
            空きコマや放課後の予定を入力してください。{'\n'}
            友達に共有されます。
          </Text>

          {/* 入力フォーム生成 */}
          {[
            { key: 'mon', label: '月曜日' },
            { key: 'tue', label: '火曜日' },
            { key: 'wed', label: '水曜日' },
            { key: 'thu', label: '木曜日' },
            { key: 'fri', label: '金曜日' },
            { key: 'sat', label: '土曜日', color: '#6b8eff' },
            { key: 'sun', label: '日曜日', color: '#ff6b6b' },
          ].map((item) => (
            <View key={item.key} style={styles.inputGroup}>
              <Text style={[styles.label, item.color && { color: item.color }]}>
                {item.label}
              </Text>
              <TextInput
                style={styles.input}
                value={(schedule as any)[item.key]}
                onChangeText={(text) => setSchedule(prev => ({ ...prev, [item.key]: text }))}
                placeholder="例: 3限空き、18時からバイト"
                placeholderTextColor="#ccc"
              />
            </View>
          ))}
          
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: 5 },
  saveText: { fontSize: 16, fontWeight: 'bold', color: '#2f95dc' },

  scrollContent: { padding: 20 },
  description: { textAlign: 'center', color: '#888', marginBottom: 25, lineHeight: 20 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  input: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#eee' },
});