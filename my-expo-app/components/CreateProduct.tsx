import { useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateProduct() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const existingProduct = route.params?.product || null;

  const [name, setName] = useState(existingProduct?.name || '');
  const [purchase, setPurchase] = useState(existingProduct?.purchase || '');
  const [sell, setSell] = useState(existingProduct?.sell || '');

  const handleSave = () => {
    if (!name || !purchase || !sell) {
      Alert.alert('Error', 'All fields are required!');
      return;
    }
    Alert.alert('Success', existingProduct ? 'Product updated!' : 'Product added!');
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="mb-4 text-lg font-bold">
        {existingProduct ? 'Edit Product' : 'Add Product'}
      </Text>

      <TextInput
        placeholder="Product Name"
        value={name}
        onChangeText={setName}
        className="mb-3 rounded-lg border border-gray-300 px-3"
      />
      <TextInput
        placeholder="Purchase Price"
        value={purchase}
        onChangeText={setPurchase}
        keyboardType="numeric"
        className="mb-3 rounded-lg border border-gray-300 px-3"
      />
      <TextInput
        placeholder="Sell Price"
        value={sell}
        onChangeText={setSell}
        keyboardType="numeric"
        className="mb-5 rounded-lg border border-gray-300 px-3"
      />

      <TouchableOpacity onPress={handleSave} className="rounded-lg bg-green-500 py-3">
        <Text className="text-center font-bold text-white">
          {existingProduct ? 'Update' : 'Save'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
