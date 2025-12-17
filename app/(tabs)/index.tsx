import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActionSheetIOS, Button, FlatList, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../firebaseConfig.native';

// ★パス修正
import ClassCard from '../../components/ClassCard';
import { addClassItem, deleteClassItem, subscribeToTimetable } from '../../services/timetable';
import { getUserProfile } from '../../services/userService'; // 追加
import { ClassItem } from '../../types';

const DAYS = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];
const PERIODS = ['1限', '2限', '3限', '4限', '5限', '6限'];

export default function HomeScreen() {
  const [classData, setClassData] = useState<ClassItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [myFollowing, setMyFollowing] = useState<string[]>([]); // ★フォローリスト
  const router = useRouter();

  const [inputDay, setInputDay] = useState('月曜日');
  const [inputPeriod, setInputPeriod] = useState('1限');
  const [inputStatus, setInputStatus] = useState('');

  // 1. ログイン＆フォローリスト取得
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profile: any = await getUserProfile(u.uid);
        if (profile && profile.following) {
          setMyFollowing(profile.following);
        } else {
          setMyFollowing([u.uid]); // データなければ自分だけ
        }
      } else {
        setMyFollowing([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. データ取得＆フィルタリング
  useEffect(() => {
    const unsubscribe = subscribeToTimetable((data) => {
      if (user && myFollowing.length > 0) {
        // フォローリストに含まれるUIDの投稿だけ残す
        const filtered = data.filter(item => myFollowing.includes(item.uid));
        setClassData(filtered);
      } else {
        // 未ログイン時は全表示（または何も表示しない仕様でもOK）
        setClassData(data);
      }
    });
    return () => unsubscribe();
  }, [user, myFollowing]); // ★ここが重要：フォローが増えたら再計算

  const handlePost = async () => {
    if (!user) { alert('ログインしてください'); router.push('/login'); return; }
    if (inputStatus === '') { alert('状況を入力してください'); return; }

    try {
      const userName = user.displayName || user.email.split('@')[0];
      await addClassItem(inputDay, inputPeriod, inputStatus, { uid: user.uid, name: userName });
      setInputStatus('');
    } catch (e) {
      alert('送信エラー');
    }
  };

  const openIosMenu = (title: string, options: string[], setFunction: (val: string) => void) => {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: [...options, 'キャンセル'], cancelButtonIndex: options.length, title },
      (idx) => { if (idx < options.length) setFunction(options[idx]); }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.headerRow}>
          <Text style={styles.title}>空きコマ共有</Text>
          {user ? (
            <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>ログアウト</Text>
            </TouchableOpacity>
          ) : (
            <Button title="ログイン" onPress={() => router.push('/login')} />
          )}
        </View>

        <View style={styles.formContainer}>
          <View style={styles.pickerRow}>
            {Platform.OS === 'ios' ? (
              <>
                <TouchableOpacity style={styles.iosPickerBtn} onPress={() => openIosMenu("曜日", DAYS, setInputDay)}>
                  <Text>{inputDay} ▼</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iosPickerBtn, { marginLeft: 10 }]} onPress={() => openIosMenu("時限", PERIODS, setInputPeriod)}>
                  <Text>{inputPeriod} ▼</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={inputDay} onValueChange={setInputDay} style={styles.picker}>
                    {DAYS.map(d => <Picker.Item key={d} label={d} value={d} />)}
                  </Picker>
                </View>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={inputPeriod} onValueChange={setInputPeriod} style={styles.picker}>
                    {PERIODS.map(p => <Picker.Item key={p} label={p} value={p} />)}
                  </Picker>
                </View>
              </>
            )}
          </View>
          <TextInput 
            style={styles.input} placeholder="状況 (例: 休講)" value={inputStatus} onChangeText={setInputStatus} 
          />
          <Button title="投稿する" onPress={handlePost} />
        </View>

        <FlatList
          data={classData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClassCard item={item} currentUserId={user?.uid} onDelete={deleteClassItem} />
          )}
          style={styles.list}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  logoutBtn: { padding: 5, backgroundColor: '#ddd', borderRadius: 5 },
  logoutText: { fontSize: 12 },
  formContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 2 },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  pickerWrapper: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, marginRight: 5, justifyContent: 'center', height: 50 },
  picker: { width: '100%', height: 50 },
  iosPickerBtn: { flex: 1, height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, backgroundColor: '#f9f9f9', marginBottom: 10 },
  list: { flex: 1 },
});