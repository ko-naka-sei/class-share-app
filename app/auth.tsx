import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
// Firestoreのimportが足りていなかったので念のため追加しておきました（使わないなら消してOK）
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// ↓もしエラーが出る場合は '../firebaseConfig' のパスを確認してください
import { auth, db } from '../firebaseConfig';

export default function AuthScreen() {
  const [isLoginMode, setIsLoginMode] = useState(true); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    console.log("=== ボタンが押されました！ ==="); 
    
    Keyboard.dismiss();

    console.log(`Email: ${email}, Password: ${password?.length}文字`);

    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      console.log("=== 入力不足で終了 ===");
      return;
    }

    console.log("=== ローディング開始 ==="); 
    setLoading(true); 

    try {
      console.log("=== Firebase通信開始... ===");
      // authがあるかチェック
      if (!auth) throw new Error("Authオブジェクトが読み込めていません。firebaseConfigを確認してください。");

      if (isLoginMode) {
        console.log("ログイン処理を実行中...");
        await signInWithEmailAndPassword(auth, email, password);
        console.log("=== ログイン成功！ ===");
      } else {
        console.log("新規登録処理を実行中...");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("=== 新規登録成功！ Firestoreに書き込みます ===");
        
        // Firestoreへの保存処理（dbがインポートされている前提）
        if (db) {
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              username: username,
              email: email,
              createdAt: new Date(),
            });
        }
      }
    } catch (e: any) {
      console.error("!!! エラー発生 !!!");
      console.error("エラーコード:", e.code);
      console.error("エラーメッセージ:", e.message);
      
      // エラーメッセージの日本語化
      let msg = e.message;
      if (e.code === 'auth/invalid-email') msg = 'メールアドレスの形式が正しくありません';
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') msg = 'メールアドレスかパスワードが間違っています';
      if (e.code === 'auth/email-already-in-use') msg = 'そのメールアドレスは既に使用されています';
      
      Alert.alert("エラー", msg);
    } finally {
      console.log("=== 処理終了 (ローディングOFF) ===");
      setLoading(false);
    }
  };

  // ★ここが修正ポイント：中身のUIをコンポーネントとして定義（再利用するため）
  const renderContent = () => (
    <View style={styles.inner}>
      <Text style={styles.title}>
        {isLoginMode ? 'おかえりなさい！' : 'はじめまして！'}
      </Text>
      <Text style={styles.subTitle}>
        {isLoginMode ? 'ログインして友達の予定を見よう' : 'アカウントを作って始めよう'}
      </Text>

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

      <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)} style={styles.switchContainer}>
        <Text style={styles.switchText}>
          {isLoginMode 
            ? "アカウントを持っていない方はこちら（新規登録）" 
            : "すでにアカウントをお持ちの方はこちら（ログイン）"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ★ Webの場合はただのView、アプリの場合はKeyboardAvoidingViewを返す
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {renderContent()}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      {renderContent()}
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