// 投稿データの型
export interface ClassItem {
  id: string;
  day: string;
  period: string;
  status: string;
  author: string;
  uid: string;
  createdAt: any;
}

// ユーザー情報の型
export interface UserInfo {
  uid: string;
  displayName: string | null;
  email: string | null;
  following?: string[]; // ★友達リスト
}