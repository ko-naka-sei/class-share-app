import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function AuthScreen() {
  const [isLoginMode, setIsLoginMode] = useState(true); // ログインモードか？
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);


  const handleAuth = async () => {
    // キーボードが開いたままだとAlertが見えないことがあるため閉じる
    Keyboard.dismiss();

    // バリデーション（簡易チェック）
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }
    if (!isLoginMode && !username) {
      Alert.alert('エラー', 'ユーザー名を入力してください');
      return;
    }

    setLoading(true);
    try {
      if (isLoginMode) {
        // === ログイン ===
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // === 新規登録 ===
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          username: username,
          email: email,
          createdAt: new Date(),
        });
      }
    } catch (e: any) {
      console.log('Firebase Error Code:', e.code); // コンソールでコードを確認できるようにする
      console.log('Firebase Error Message:', e.message);

      let msg = '予期せぬエラーが発生しました';
      
      // ★ここを修正: e.message ではなく e.code で判定する
      switch (e.code) {
        case 'auth/invalid-email':
          msg = 'メールアドレスの形式が正しくありません';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': // 最近のバージョンではこれが出ることも多い
          msg = 'メールアドレスかパスワードが間違っています';
          break;
        case 'auth/email-already-in-use':
          msg = 'このメールアドレスは既に登録されています';
          break;
        case 'auth/weak-password':
          msg = 'パスワードは6文字以上にしてください';
          break;
        case 'auth/network-request-failed':
          msg = '通信エラーが発生しました。インターネット接続を確認してください';
          break;
        default:
          // 想定外のエラーは英語のまま、またはデフォルトメッセージを表示
          msg = e.message; 
      }
      
      Alert.alert('エラー', msg);
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>
          {isLoginMode ? 'おかえりなさい！' : 'はじめまして！'}
        </Text>
        <Text style={styles.subTitle}>
          {isLoginMode ? 'ログインして友達の予定を見よう' : 'アカウントを作って始めよう'}
        </Text>

        {/* --- 新規登録の時だけ出る「名前」の入力欄 --- */}
        {!isLoginMode && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ユーザー名</Text>
            <Text style={styles.description}>友達に表示される名前です（本名じゃなくてOK）</Text>
            <TextInput
              style={styles.input}
              placeholder="例: たろう"
              value={username}
              onChangeText={setUsername}
            />
          </View>
        )}
        
        {/* --- メールアドレス --- */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>メールアドレス</Text>
          <TextInput
            style={styles.input}
            placeholder="例: user@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* --- パスワード --- */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>パスワード</Text>
          <Text style={styles.description}>6文字以上の英数字を入力してください</Text>
          <TextInput
            style={styles.input}
            placeholder="******"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* --- ボタン --- */}
        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : (
            <Button 
              title={isLoginMode ? "ログインする" : "新規登録する"} 
              onPress={handleAuth} 
              color="#000" 
            />
          )}
        </View>

        {/* --- 切り替えリンク --- */}
        <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)} style={styles.switchContainer}>
          <Text style={styles.switchText}>
            {isLoginMode 
              ? "アカウントを持っていない方はこちら（新規登録）" 
              : "すでにアカウントをお持ちの方はこちら（ログイン）"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', padding: 20 },
  
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subTitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  description: { fontSize: 12, color: '#888', marginBottom: 5 },
  input: { 
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 16, backgroundColor: '#f9f9f9' 
  },

  buttonContainer: { marginTop: 10, marginBottom: 20 },
  switchContainer: { alignItems: 'center' },
  switchText: { color: '#2f95dc', fontSize: 14, textDecorationLine: 'underline' }
});