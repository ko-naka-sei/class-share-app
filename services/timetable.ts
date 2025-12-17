import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
// ↓ 1つ上の階層(ルート)にある firebaseConfig を読み込む
import { db } from '../firebaseConfig.native';
// ↓ 1つ上の階層(ルート)にある types フォルダを見る
import { ClassItem } from '../types';

const COLLECTION_NAME = 'timetables';

/**
 * リアルタイムでデータを取得する関数
 * @param callback データ更新時に呼ばれる関数
 * @returns 監視を解除する関数(unsubscribe)
 */
export const subscribeToTimetable = (callback: (data: ClassItem[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const classes: ClassItem[] = [];
    snapshot.forEach((doc) => {
      // データを取得して型を合わせる
      classes.push({ id: doc.id, ...doc.data() } as ClassItem);
    });
    callback(classes);
  });
};

/**
 * データを追加する関数
 */
export const addClassItem = async (
  day: string,
  period: string,
  status: string,
  user: { uid: string; name: string }
) => {
  await addDoc(collection(db, COLLECTION_NAME), {
    day,
    period,
    status,
    author: user.name,
    uid: user.uid,
    createdAt: serverTimestamp(),
  });
};

/**
 * データを削除する関数
 */
export const deleteClassItem = async (id: string) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};