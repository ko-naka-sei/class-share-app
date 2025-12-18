import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function TimetableEditScreen() {
  // mon: "18:00以降", tue: "全休" のように文字列で保存
  const [timetable, setTimetable] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTimetable = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      const docRef = doc(db, 'timetables', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTimetable(docSnap.data());
      }
    };
    fetchTimetable();
  }, []);

  const handleChange = (key: string, text: string) => {
    setTimetable(prev => ({ ...prev, [key]: text }));
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const username = userDoc.exists() ? userDoc.data().username : '名無し';

      await setDoc(doc(db, 'timetables', user.uid), {
        uid: user.uid,
        username: username,
        ...timetable
      }, { merge: true });

      Alert.alert('保存完了', '予定を更新しました！');
    } catch (e: any) {
      Alert.alert('エラー', e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderDayInput = (dayKey: string, dayLabel: string, isWeekend: boolean) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.dayLabel, isWeekend && styles.weekendLabel]}>{dayLabel}</Text>
      <TextInput
        style={styles.input}
        placeholder={isWeekend ? "例: バイトなし、午後暇" : "例: 18:00〜、3限空き"}
        value={timetable[dayKey] || ''}
        onChangeText={(text) => handleChange(dayKey, text)}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>暇な時間を入力</Text>
        <Text style={styles.subtitle}>「17時以降」「全休」など自由に！</Text>
        
        {renderDayInput('mon', '月', false)}
        {renderDayInput('tue', '火', false)}
        {renderDayInput('wed', '水', false)}
        {renderDayInput('thu', '木', false)}
        {renderDayInput('fri', '金', false)}
        {renderDayInput('sat', '土', true)}
        {renderDayInput('sun', '日', true)}

        <View style={styles.buttonContainer}>
          <Button title={loading ? "保存中..." : "保存する"} onPress={handleSave} disabled={loading} />
        </View>
        <View style={{height: 50}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
  subtitle: { textAlign: 'center', color: '#888', marginBottom: 30 },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  dayLabel: { width: 40, fontSize: 18, fontWeight: 'bold', color: '#555', textAlign: 'center' },
  weekendLabel: { color: '#ff6b6b' },
  
  input: { 
    flex: 1, 
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, 
    padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' 
  },
  
  buttonContainer: { marginTop: 20 }
});