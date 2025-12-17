import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../firebaseConfig.native';

// ★パス修正: ルートのservicesを参照
import { saveUserProfile } from '../../services/userService';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const router = useRouter();

  const createDummyEmail = (name: string) => {
    return `${name}@my-class-app.dummy`;
  };

  const handleSignUp = async () => {
    if (username === '') {
      Alert.alert('エラー', 'ユーザー名を入力してください');
      return;
    }
    try {
      const dummyEmail = createDummyEmail(username);
      const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, password);
      
      await updateProfile(userCredential.user, { displayName: username });
      
      // ★Firestoreに保存
      await saveUserProfile(userCredential.user.uid, username);

      Alert.alert('登録成功', `ようこそ、${username}さん！`);
      router.back();
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('エラー', 'そのIDは既に使用されています');
      } else {
        Alert.alert('登録エラー', error.message);
      }
    }
  };

  const handleLogin = async () => {
    if (username === '') {
      Alert.alert('エラー', 'ユーザー名を入力してください');
      return;
    }
    try {
      const dummyEmail = createDummyEmail(username);
      await signInWithEmailAndPassword(auth, dummyEmail, password);
      Alert.alert('成功', 'ログインしました');
      router.back();
    } catch (error: any) {
      Alert.alert('ログインエラー', 'IDまたはパスワードが違います');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{isLoginMode ? 'ログイン' : 'アカウント作成'}</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>ユーザーID</Text>
        <TextInput
          style={styles.input}
          placeholder="例: ryo123"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>パスワード</Text>
        <TextInput
          style={styles.input}
          placeholder="******"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.btnGroup}>
        {isLoginMode ? (
          <>
            <Button title="ログインする" onPress={handleLogin} />
            <TouchableOpacity onPress={() => setIsLoginMode(false)} style={styles.switchBtn}>
              <Text style={styles.switchText}>アカウント作成はこちら</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Button title="このIDで始める" color="green" onPress={handleSignUp} />
            <TouchableOpacity onPress={() => setIsLoginMode(true)} style={styles.switchBtn}>
              <Text style={styles.switchText}>すでにアカウントをお持ちの方</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  inputContainer: { marginBottom: 15 },
  label: { marginBottom: 5, color: '#333', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, fontSize: 16, backgroundColor: '#fafafa' },
  btnGroup: { marginTop: 20 },
  switchBtn: { marginTop: 15, alignItems: 'center' },
  switchText: { color: '#007bff', textDecorationLine: 'underline' }
});