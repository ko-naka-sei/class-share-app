import { arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // ルートのfirebaseConfigを読み込み

// ユーザー情報を保存（新規登録時に呼ぶやつ）
export const saveUserProfile = async (uid: string, username: string) => {
  await setDoc(doc(db, 'users', uid), {
    uid,
    username,
    following: [uid] // 自分自身の投稿も見たいので、自分をフォローリストに入れておく
  });
};

// 友達追加ロジック
export const followUserByUsername = async (myUid: string, targetUsername: string) => {
  // 1. その名前のユーザーがいるか検索
  const q = query(collection(db, 'users'), where('username', '==', targetUsername));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('ユーザーが見つかりません');
  }

  // 2. 見つかったらUIDを取得
  const targetUserDoc = querySnapshot.docs[0];
  const targetUid = targetUserDoc.data().uid;

  if (targetUid === myUid) {
    throw new Error('自分自身はすでにフォローしています');
  }

  // 3. 自分のフォローリストに追加
  const myUserRef = doc(db, 'users', myUid);
  await updateDoc(myUserRef, {
    following: arrayUnion(targetUid)
  });
  
  return targetUsername;
};

// プロフィール取得（フォローリスト確認用）
export const getUserProfile = async (uid: string) => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
};