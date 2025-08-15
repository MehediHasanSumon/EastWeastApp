import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Product = {
  id: string;
  name: string;
  purchase: string;
  sell: string;
};

export default function ProductScreen() {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Shirt', purchase: '500', sell: '700' },
    { id: '2', name: 'Pants', purchase: '800', sell: '1200' },
  ]);
  const [search, setSearch] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setProducts(products.filter((p) => p.id !== id)),
      },
    ]);
  };

  return (
    <View className=" flex-1 bg-white p-4">
      {/* Search Bar + Add Button */}
      <View className="mb-3 flex-row">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search Products..."
          className="flex-1 rounded-lg border border-gray-300 px-3"
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateProduct')}
          className="ml-2 justify-center rounded-lg bg-blue-500 px-4">
          <Text className="font-bold text-white">+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Table Header */}
      <View className="flex-row border-b border-gray-300 bg-gray-200 px-2 py-2">
        <Text className="flex-1 font-bold text-gray-700">Name</Text>
        <Text className="flex-1 font-bold text-gray-700">Purchase</Text>
        <Text className="flex-1 font-bold text-gray-700">Sell</Text>
      </View>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Pressable
            onLongPress={() => {
              setSelectedProduct(item);
              setPopupVisible(true);
            }}
            className={`flex-row border-b border-gray-100 px-2 py-2 ${
              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            }`}>
            <Text className="flex-1 text-gray-800">{item.name}</Text>
            <Text className="flex-1 text-gray-800">{item.purchase}</Text>
            <Text className="flex-1 text-gray-800">{item.sell}</Text>
          </Pressable>
        )}
      />

      {/* Popup Menu */}
      <Modal
        transparent
        visible={popupVisible}
        animationType="fade"
        onRequestClose={() => setPopupVisible(false)}>
        <Pressable
          onPress={() => setPopupVisible(false)}
          className="flex-1 items-center justify-center bg-black/30">
          <View className="w-48 rounded-lg bg-white p-5">
            <TouchableOpacity
              onPress={() => {
                setPopupVisible(false);
                navigation.navigate('CreateProduct', { product: selectedProduct });
              }}
              className="py-2">
              <Text>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setPopupVisible(false);
                if (selectedProduct) handleDelete(selectedProduct.id);
              }}
              className="py-2">
              <Text className="text-red-500">Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
