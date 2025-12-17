import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ClassItem } from '../types';

type Props = {
  item: ClassItem;
  currentUserId?: string;
  onDelete: (id: string) => void;
};

export default function ClassCard({ item, currentUserId, onDelete }: Props) {
  const handleDeletePress = () => {
    Alert.alert('確認', '削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => onDelete(item.id) }
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardMain}>
          {item.day} {item.period} : <Text style={styles.statusFree}>{item.status}</Text>
        </Text>
        {currentUserId === item.uid && (
          <TouchableOpacity onPress={handleDeletePress}>
            <Text style={styles.deleteText}>削除</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.cardSub}>by {item.author}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMain: { fontSize: 18, fontWeight: '500' },
  statusFree: { color: '#007bff', fontWeight: 'bold' },
  cardSub: { fontSize: 12, color: '#666', marginTop: 5, textAlign: 'right' },
  deleteText: { color: 'red', fontSize: 14 }
});