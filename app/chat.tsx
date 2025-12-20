import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// Linkingのインポートはもう不要ですが、残しておいてもエラーにはなりません
import { auth, db } from '../firebaseConfig';

// 通知送信関数
// 引数を変更：URLではなく、IDと名前を受け取る
async function sendPushNotification(expoPushToken: string, title: string, body: string, friendId: string, friendName: string) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    // ★重要：URLではなく、生データを送る
    data: { 
      targetScreen: 'chat', // 「チャット画面に行くぞ」という合言葉
      friendId: friendId, 
      friendName: friendName 
    },
  };

  try {
    const response = await fetch('/api/send-push', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.log("Notification Error:", error);
  }
}

export default function ChatScreen() {
  const router = useRouter();
  const { friendId, friendName } = useLocalSearchParams(); 
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const user = auth.currentUser;
  
  const [myUsername, setMyUsername] = useState('新着メッセージ');

  useEffect(() => {
    const fetchMe = async () => {
      if(user) {
        const d = await getDoc(doc(db, 'users', user.uid));
        if(d.exists()) setMyUsername(d.data().username || '新着メッセージ');
      }
    };
    fetchMe();
  }, [user]);

  const roomId = [user?.uid, friendId].sort().join('_');

  useEffect(() => {
    if (!user || !friendId) return;

    const q = query(
      collection(db, 'rooms', roomId, 'messages'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(loadedMessages);
    });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const textToSend = inputText;
    setInputText(''); 

    try {
      await setDoc(doc(db, 'rooms', roomId), {
        members: [user.uid, friendId],
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        text: textToSend,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });

      // ★★★ 通知送信 ★★★
      const friendDoc = await getDoc(doc(db, 'users', friendId as string));
      
      if (friendDoc.exists()) {
        const friendData = friendDoc.data();

        // ★URL生成は不要！ IDと名前をそのまま渡す
        if (friendData.pushTokenNative) {
          await sendPushNotification(
            friendData.pushTokenNative, 
            myUsername, 
            textToSend, 
            user.uid,   // 自分のID (相手にとってはfriendId)
            myUsername  // 自分の名前
          );
        } else if (friendData.pushTokenWeb) {
          await sendPushNotification(
            friendData.pushTokenWeb, 
            myUsername, 
            textToSend, 
            user.uid, 
            myUsername
          );
        }
      }
      
    } catch (e: any) {
      console.error(e);
      Alert.alert("エラー", "送信エラー: " + e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{friendName || 'チャット'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={{ padding: 10 }}
        renderItem={({ item }) => {
          const isMyMessage = item.senderId === user?.uid;
          return (
            <View style={[
              styles.messageBubble, 
              isMyMessage ? styles.myBubble : styles.friendBubble
            ]}>
              <Text style={[
                styles.messageText, 
                isMyMessage ? styles.myText : styles.friendText
              ]}>
                {item.text}
              </Text>
            </View>
          );
        }}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="メッセージを入力..."
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee', marginTop: 30 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: 5 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 20, marginBottom: 10 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#2f95dc', borderBottomRightRadius: 2 },
  friendBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 2 },
  messageText: { fontSize: 16 },
  myText: { color: '#fff' },
  friendText: { color: '#333' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, marginRight: 10 },
  sendButton: { width: 44, height: 44, backgroundColor: '#2f95dc', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});