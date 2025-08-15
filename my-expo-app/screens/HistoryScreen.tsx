import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function HistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('invoice_history').then((data) => {
      if (data) setHistory(JSON.parse(data));
    });
  }, []);

  return (
    <ScrollView className="p-4">
      {history.length === 0 ? (
        <Text>No invoice history found.</Text>
      ) : (
        history.map((item, index) => (
          <View key={index} className="mb-4 rounded bg-white p-4 shadow">
            <Text className="font-bold">Invoice No: {item.invoiceNo}</Text>
            <Text>Date: {new Date(item.dateTime).toLocaleString()}</Text>
            <Text>Customer: {item.customerName}</Text>
            <Text>Total: BDT {item.totalAmount}</Text>
            <Text>File: {item.fileName}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
