import * as ImageManipulator from 'expo-image-manipulator'; // ★追加
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function PostScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [myUsername, setMyUsername] = useState('');

  useEffect(() => {
    const fetchMe = async () => {
      if (auth.currentUser) {
        const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (docSnap.exists()) {
          setMyUsername(docSnap.data().username);
        }
      }
    };
    fetchMe();
  }, []);

  // ★ここが重要：撮影後に画像を小さく圧縮する
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("エラー", "カメラへのアクセスを許可してください");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, // トリミング画面を出す
      aspect: [3, 4],
      quality: 0.5, // ここの画質は適当でOK（後でリサイズするため）
    });

    if (!result.canceled) {
      // ★ ImageManipulatorでリサイズ処理
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 600 } }], // ★幅を600pxに縮小（これで容量オーバーを防ぐ！）
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true } // 文字データ(base64)に変換
      );

      if (manipResult.base64) {
        setImage(`data:image/jpeg;base64,${manipResult.base64}`);
      }
    }
  };

  const uploadPost = async () => {
    if (!auth.currentUser) return;
    if (!image) return;

    setUploading(true);

    try {
      // 容量チェック（念のため）
      if (image.length > 1000000) {
        throw new Error("画像の容量がまだ大きすぎます。もう一度撮り直してください。");
      }

      await setDoc(doc(db, 'posts', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        username: myUsername || '名無し',
        photoUrl: image,
        updatedAt: serverTimestamp(),
        message: "BeReal."
      });

      Alert.alert('完了', '投稿しました！');
      setImage(null);
    } catch (e: any) {
      console.error(e);
      Alert.alert('エラー', '投稿に失敗しました: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BeReal.</Text>
      
      {image ? (
        <Image source={{ uri: image }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>今のリアルを撮ろう</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!image && (
          <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
            <Text style={styles.cameraButtonText}>📷 カメラを起動</Text>
          </TouchableOpacity>
        )}
      </View>

      {image && (
        <View style={styles.uploadContainer}>
           {uploading ? (
             <ActivityIndicator size="large" color="#000" />
           ) : (
             <View style={styles.actionButtons}>
               <TouchableOpacity onPress={() => setImage(null)} style={styles.retryButton}>
                  <Text style={styles.retryText}>撮り直す</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={uploadPost} style={styles.postButton}>
                  <Text style={styles.postText}>投稿する 🚀</Text>
               </TouchableOpacity>
             </View>
           )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  preview: { width: 300, height: 400, borderRadius: 10, marginBottom: 20, backgroundColor: '#000' },
  placeholder: { width: 300, height: 400, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginBottom: 20 },
  placeholderText: { color: '#888', fontWeight: 'bold' },
  buttonContainer: { marginBottom: 20 },
  uploadContainer: { width: 250 },
  cameraButton: { backgroundColor: '#000', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30 },
  cameraButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  retryButton: { padding: 15, backgroundColor: '#eee', borderRadius: 30, width: '45%', alignItems: 'center' },
  retryText: { color: '#333', fontWeight: 'bold' },
  postButton: { padding: 15, backgroundColor: '#000', borderRadius: 30, width: '45%', alignItems: 'center' },
  postText: { color: '#fff', fontWeight: 'bold' }
});