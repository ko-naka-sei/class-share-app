import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

    // バリデーション（入力チェック）
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }
    // ★追加：新規登録なのに名前がない場合を防ぐ
    if (!isLoginMode && !username) {
      Alert.alert('エラー', 'ユーザー名を入力してください');
      return;
    }

    setLoading(true); 

    try {
      if (!auth) throw new Error("Authオブジェクトが読み込めていません");

      if (isLoginMode) {
        // === ログイン処理 ===
        console.log("ログイン処理を実行中...");
        await signInWithEmailAndPassword(auth, email, password);
        console.log("=== ログイン成功！ ===");
      } else {
        // === 新規登録処理 ===
        console.log("新規登録処理を実行中...");
        
        // 1. Authenticationにユーザー作成
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log("=== Auth作成成功！Firestoreに書き込みます ===");
        
        // 2. Firestoreにプロフィール作成
        // ★修正点: following: [] を追加し、if(db)のチェックを外してエラーならcatchに飛ばす
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          username: username,
          email: email,
          createdAt: new Date(),
          following: [], // ★これがないとホーム画面でエラーになります！
          friends: [],   // 友達機能用にも空配列を作っておくと安全
        });
        
        console.log("=== Firestore保存完了！ ===");
      }
    } catch (e: any) {
      console.error("!!! エラー発生 !!!");
      console.error("Code:", e.code);
      console.error("Message:", e.message);
      
      let msg = e.message;
      if (e.code === 'auth/email-already-in-use') msg = 'そのメールアドレスは既に登録されています。ログインするか、別のメールアドレスを使ってください。';
      if (e.code === 'auth/invalid-email') msg = 'メールアドレスの形式が正しくありません';
      if (e.code === 'auth/weak-password') msg = 'パスワードは6文字以上にしてください';
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'メールアドレスかパスワードが間違っています';
      
      Alert.alert("エラー", msg);
    } finally {
      setLoading(false);
    }
  };

  // 画面の表示部分（変更なしですが、再利用しやすいように変数化）
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
          <Text style={styles.description}>友達に表示される名前です</Text>
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

  if (Platform.OS === 'web') {
    return <View style={styles.container}>{renderContent()}</View>;
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
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 50, paddingBottom: 50 },
  inner: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subTitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  description: { fontSize: 12, color: '#888', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 16, backgroundColor: '#f9f9f9' },
  buttonContainer: { marginTop: 10, marginBottom: 20 },
  switchContainer: { alignItems: 'center' },
  switchText: { color: '#2f95dc', fontSize: 14, textDecorationLine: 'underline' }
});