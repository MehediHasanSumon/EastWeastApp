import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import api from '../utils/api';

type Product = {
  _id: string;
  name: string;
  purchases: number;
  sell: number;
  description?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ProductsScreen() {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // CRUD Modal States
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    name: '',
    purchases: '',
    sell: '',
    description: '',
  });

  const fetchProducts = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(1);
      }
      
      const response = await api.get('/api/admin/get/products', {
        params: {
          page: pageNum,
          perPage: 20,
          search: search,
        },
      });

      const { products: newProducts, meta } = response.data;
      
      if (refresh || pageNum === 1) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }
      
      setHasMore(meta.currentPage < meta.lastPage);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, true);
  }, [search]);

  const onRefresh = () => {
    fetchProducts(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchProducts(page + 1);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      purchases: '',
      sell: '',
      description: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      purchases: product.purchases.toString(),
      sell: product.sell.toString(),
      description: product.description || '',
    });
    setSelectedProduct(product);
    setEditModalVisible(true);
  };

  const openViewModal = (product: Product) => {
    setSelectedProduct(product);
    setViewModalVisible(true);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.purchases || !formData.sell) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/admin/create/product', {
        name: formData.name,
        purchases: parseFloat(formData.purchases),
        sell: parseFloat(formData.sell),
        description: formData.description || null,
      });
      
      Alert.alert('Success', 'Product created successfully');
      setCreateModalVisible(false);
      resetForm();
      fetchProducts(1, true);
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedProduct || !formData.name || !formData.purchases || !formData.sell) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/api/admin/update/product/${selectedProduct._id}`, {
        name: formData.name,
        purchases: parseFloat(formData.purchases),
        sell: parseFloat(formData.sell),
        description: formData.description || null,
      });
      
      Alert.alert('Success', 'Product updated successfully');
      setEditModalVisible(false);
      resetForm();
      setSelectedProduct(null);
      fetchProducts(1, true);
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/api/admin/delete/products', { ids: [id] });
            Alert.alert('Success', 'Product deleted successfully');
            fetchProducts(1, true);
          } catch (error) {
            console.error('Error deleting product:', error);
            Alert.alert('Error', 'Failed to delete product');
          }
        },
      },
    ]);
  };

  const handleStatusToggle = async (product: Product) => {
    try {
      await api.put(`/api/admin/update/product-status/${product._id}`, {
        status: !product.status,
      });
      Alert.alert('Success', 'Product status updated successfully');
      fetchProducts(1, true);
    } catch (error) {
      console.error('Error updating product status:', error);
      Alert.alert('Error', 'Failed to update product status');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <Pressable
      onLongPress={() => {
        setSelectedProduct(item);
        setPopupVisible(true);
      }}
      className={`flex-row border-b border-gray-100 px-2 py-3 ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
      }`}>
      <View className="flex-1">
        <Text className="font-semibold text-gray-800">{item.name}</Text>
        {item.description && (
          <Text className="text-xs text-gray-500" numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-gray-800">${item.purchases}</Text>
        <Text className="text-xs text-gray-500">Purchase</Text>
      </View>
      <View className="flex-1">
        <Text className="text-gray-800">${item.sell}</Text>
        <Text className="text-xs text-gray-500">Sell</Text>
      </View>
      <View className="flex-1">
        <Text className={`text-xs font-medium ${item.status ? 'text-green-600' : 'text-red-600'}`}>
          {item.status ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </Pressable>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  if (loading && products.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-2 text-gray-600">Loading products...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-4">
      {/* Search Bar + Add Button */}
      <View className="mb-3 flex-row">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search Products..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
        />
        <TouchableOpacity
          onPress={openCreateModal}
          className="ml-2 justify-center rounded-lg bg-blue-500 px-4">
          <Text className="font-bold text-white">+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Table Header */}
      <View className="flex-row border-b border-gray-300 bg-gray-200 px-2 py-2">
        <Text className="flex-1 font-bold text-gray-700">Name</Text>
        <Text className="flex-1 font-bold text-gray-700">Purchase</Text>
        <Text className="flex-1 font-bold text-gray-700">Sell</Text>
        <Text className="flex-1 font-bold text-gray-700">Status</Text>
      </View>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-8">
            <Text className="text-gray-500">No products found</Text>
          </View>
        }
      />

      {/* Quick Actions Popup Menu */}
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
                if (selectedProduct) openViewModal(selectedProduct);
              }}
              className="py-2">
              <Text>View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setPopupVisible(false);
                if (selectedProduct) openEditModal(selectedProduct);
              }}
              className="py-2">
              <Text>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setPopupVisible(false);
                if (selectedProduct) handleStatusToggle(selectedProduct);
              }}
              className="py-2">
              <Text className="text-orange-500">
                {selectedProduct?.status ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setPopupVisible(false);
                if (selectedProduct) handleDelete(selectedProduct._id);
              }}
              className="py-2">
              <Text className="text-red-500">Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Create Product Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}>
        <View className="flex-1 bg-white p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Create Product</Text>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Text className="text-red-500 text-lg">✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView className="flex-1">
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Product Name *</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter product name"
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Purchase Price *</Text>
              <TextInput
                value={formData.purchases}
                onChangeText={(text) => setFormData(prev => ({ ...prev, purchases: text }))}
                placeholder="Enter purchase price"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Sell Price *</Text>
              <TextInput
                value={formData.sell}
                onChangeText={(text) => setFormData(prev => ({ ...prev, sell: text }))}
                placeholder="Enter sell price"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter description (optional)"
                multiline
                numberOfLines={3}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </View>
          </ScrollView>
          
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => setCreateModalVisible(false)}
              className="flex-1 bg-gray-500 rounded-lg py-3">
              <Text className="text-white text-center font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={submitting}
              className="flex-1 bg-blue-500 rounded-lg py-3">
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-center font-medium">Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}>
        <View className="flex-1 bg-white p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Edit Product</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text className="text-red-500 text-lg">✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView className="flex-1">
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Product Name *</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter product name"
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Purchase Price *</Text>
              <TextInput
                value={formData.purchases}
                onChangeText={(text) => setFormData(prev => ({ ...prev, purchases: text }))}
                placeholder="Enter purchase price"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Sell Price *</Text>
              <TextInput
                value={formData.sell}
                onChangeText={(text) => setFormData(prev => ({ ...prev, sell: text }))}
                placeholder="Enter sell price"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter description (optional)"
                multiline
                numberOfLines={3}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </View>
          </ScrollView>
          
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              className="flex-1 bg-gray-500 rounded-lg py-3">
              <Text className="text-white text-center font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUpdate}
              disabled={submitting}
              className="flex-1 bg-blue-500 rounded-lg py-3">
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-center font-medium">Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* View Product Modal */}
      <Modal
        visible={viewModalVisible}
        animationType="slide"
        onRequestClose={() => setViewModalVisible(false)}>
        <View className="flex-1 bg-white p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Product Details</Text>
            <TouchableOpacity onPress={() => setViewModalVisible(false)}>
              <Text className="text-red-500 text-lg">✕</Text>
            </TouchableOpacity>
          </View>
          
          {selectedProduct && (
            <ScrollView className="flex-1">
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Product Name</Text>
                <Text className="text-lg">{selectedProduct.name}</Text>
              </View>
              
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Purchase Price</Text>
                <Text className="text-lg">${selectedProduct.purchases}</Text>
              </View>
              
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Sell Price</Text>
                <Text className="text-lg">${selectedProduct.sell}</Text>
              </View>
              
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Profit Margin</Text>
                <Text className="text-lg text-green-600">
                  ${((selectedProduct.sell - selectedProduct.purchases) / selectedProduct.purchases * 100).toFixed(2)}%
                </Text>
              </View>
              
              {selectedProduct.description && (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
                  <Text className="text-lg">{selectedProduct.description}</Text>
                </View>
              )}
              
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Status</Text>
                <Text className={`text-lg ${selectedProduct.status ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedProduct.status ? 'Active' : 'Inactive'}
                </Text>
              </View>
              
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Created At</Text>
                <Text className="text-lg">{new Date(selectedProduct.createdAt).toLocaleString()}</Text>
              </View>
              
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Updated At</Text>
                <Text className="text-lg">{new Date(selectedProduct.updatedAt).toLocaleString()}</Text>
              </View>
            </ScrollView>
          )}
          
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => setViewModalVisible(false)}
              className="flex-1 bg-gray-500 rounded-lg py-3">
              <Text className="text-white text-center font-medium">Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setViewModalVisible(false);
                if (selectedProduct) openEditModal(selectedProduct);
              }}
              className="flex-1 bg-blue-500 rounded-lg py-3">
              <Text className="text-white text-center font-medium">Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
