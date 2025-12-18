import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  // ★変更: カメラ機能だけ残す
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("エラー", "カメラへのアクセスを許可してください");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const uploadPost = async () => {
    if (!image || !auth.currentUser) return;
    setUploading(true);

    try {
      await setDoc(doc(db, 'posts', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        username: myUsername,
        photoUrl: image,
        updatedAt: serverTimestamp(),
        message: "BeReal."
      });

      Alert.alert('完了', '投稿しました！');
      setImage(null);
    } catch (e: any) {
      Alert.alert('エラー', e.message);
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

      {/* ボタンを1つにしました */}
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
               <Button title="やり直す" onPress={() => setImage(null)} color="#888" />
               <View style={{height: 10}} />
               <Button title="投稿する" onPress={uploadPost} color="#000" />
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
  uploadContainer: { width: 200 },
  cameraButton: { backgroundColor: '#000', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30 },
  cameraButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  actionButtons: { marginTop: 10 }
});